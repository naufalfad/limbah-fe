// src/modules/admin/components/gis/layers/RiverLayer.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import L, { PathOptions } from 'leaflet';
import { useGisUIStore } from '@/store/useGisUIStore';
import { useSijagaStore } from '@/store/useSijagaStore';

// @ts-ignore
import * as turf from '@turf/turf';

// @ts-ignore
import bogorSungaiLine from '@/assets/geojson/bogor-sungai-line.json';
// @ts-ignore
import bogorSungaiPoly from '@/assets/geojson/bogor-sungai-poly.json';

// --- KONTRAK DATA INTERNAL ENGINE ---
interface RiverSegment {
    points: L.Point[];
    color: string;
    speed: number;
}

interface WaterParticle {
    segmentIdx: number; // Berada di segmen sungai mana
    ptIdx: number;      // Sedang menuju vertex ke-berapa
    x: number;          // Posisi X saat ini
    y: number;          // Posisi Y saat ini
    speed: number;      // Kecepatan aliran (tergantung status polusi)
    color: string;      // Warna komet
}

// Konfigurasi Engine Fluid Dynamics (Tuned)
const PARTICLE_COUNT = 1000; // Partikel lebih padat agar aliran terlihat kontinu
const FADE_RATE = 0.04;      // Lebih kecil = Jejak komet lebih panjang (Ilusi air menyambung)
const ZOOM_LOD_THRESHOLD = 11; // Batas zoom-out diturunkan agar efek terlihat lebih luas

/**
 * ============================================================================
 * RIVER LAYER (DUAL-CANVAS PARTICLE ENGINE)
 * ============================================================================
 * Menggunakan prinsip Pemisahan Tanggung Jawab (Separation of Concerns).
 * - Canvas 1 (Statis): Menggambar dasar sungai sesuai warna Zona Polusi (Pemetaan Area).
 * - Canvas 2 (Dinamis): Menjalankan partikel air 60FPS dengan Fading Trails (Ilusi Arus).
 */
export default function RiverLayer() {
    const map = useMap();
    const { activeLayers, mapOpacity } = useGisUIStore();
    const { waterStations } = useSijagaStore();

    // Ref untuk DOM Canvas ganda
    const staticCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const dynamicCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationRef = useRef<number | null>(null);

    const isRiverActive = activeLayers.includes('layer-river');

    // ==========================================================================
    // 1. SPATIAL JOIN (Turf.js Optimasi O(1)) - Pembagian Zona Kualitas Air
    // ==========================================================================
    const processedGeoJson = useMemo(() => {
        if (!bogorSungaiLine || !waterStations || waterStations.length === 0) {
            return bogorSungaiLine;
        }

        const geojson = JSON.parse(JSON.stringify(bogorSungaiLine));

        geojson.features.forEach((feature: any) => {
            const geom = feature.geometry;
            if (!geom || (geom.type !== 'LineString' && geom.type !== 'MultiLineString')) return;

            const coords = geom.type === 'LineString' ? geom.coordinates[0] : geom.coordinates[0][0];
            if (!coords) return;

            const riverPoint = turf.point([coords[0], coords[1]]);
            let closestStationId = null;
            let minDistance = Infinity;

            waterStations.forEach((station) => {
                const stationPoint = turf.point([station.lng, station.lat]);
                const distance = turf.distance(riverPoint, stationPoint, { units: 'kilometers' });

                if (distance < minDistance) {
                    minDistance = distance;
                    closestStationId = station.id;
                }
            });

            feature.properties = { ...feature.properties, nearestStationId: closestStationId };
        });

        return geojson;
    }, [waterStations]);

    // ==========================================================================
    // 2. LIFECYCLE DUAL-CANVAS ENGINE
    // ==========================================================================
    useEffect(() => {
        if (!isRiverActive || !processedGeoJson) {
            if (staticCanvasRef.current?.parentNode) staticCanvasRef.current.parentNode.removeChild(staticCanvasRef.current);
            if (dynamicCanvasRef.current?.parentNode) dynamicCanvasRef.current.parentNode.removeChild(dynamicCanvasRef.current);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            return;
        }

        const overlayPane = map.getPanes().overlayPane;

        const sCanvas = document.createElement('canvas');
        sCanvas.className = 'leaflet-zoom-animated pointer-events-none mix-blend-screen';
        sCanvas.style.position = 'absolute';
        sCanvas.style.left = '0';
        sCanvas.style.top = '0';
        sCanvas.style.opacity = String(mapOpacity / 100);
        sCanvas.style.transition = 'opacity 0.2s ease-in-out';
        sCanvas.style.zIndex = '1';

        const dCanvas = document.createElement('canvas');
        dCanvas.className = 'leaflet-zoom-animated pointer-events-none mix-blend-screen';
        dCanvas.style.position = 'absolute';
        dCanvas.style.left = '0';
        dCanvas.style.top = '0';
        dCanvas.style.opacity = String(mapOpacity / 100);
        dCanvas.style.transition = 'opacity 0.2s ease-in-out';
        dCanvas.style.zIndex = '2';

        overlayPane.appendChild(sCanvas);
        overlayPane.appendChild(dCanvas);
        staticCanvasRef.current = sCanvas;
        dynamicCanvasRef.current = dCanvas;

        const sCtx = sCanvas.getContext('2d');
        const dCtx = dCanvas.getContext('2d');
        if (!sCtx || !dCtx) return;

        let activeSegments: RiverSegment[] = [];
        let particles: WaterParticle[] = [];
        let isAnimating = true;

        // --- B. PRE-COMPUTING: Render Statis 1x & Seeding Partikel ---
        const syncCanvasGeometry = () => {
            const size = map.getSize();
            sCanvas.width = size.x; sCanvas.height = size.y;
            dCanvas.width = size.x; dCanvas.height = size.y;

            const topLeft = map.containerPointToLayerPoint([0, 0]);
            L.DomUtil.setPosition(sCanvas, topLeft);
            L.DomUtil.setPosition(dCanvas, topLeft);

            const mapBounds = map.getBounds().pad(0.15);
            activeSegments = [];

            processedGeoJson.features.forEach((feature: any) => {
                const geom = feature.geometry;
                if (!geom) return;

                let isVisible = false;
                if (geom.type === 'LineString') {
                    isVisible = geom.coordinates.some((c: number[]) => mapBounds.contains([c[1], c[0]]));
                } else if (geom.type === 'MultiLineString') {
                    isVisible = geom.coordinates.some((line: number[][]) => line.some(c => mapBounds.contains([c[1], c[0]])));
                }

                if (!isVisible) return;

                const nearestId = feature.properties?.nearestStationId;
                const station = waterStations.find(s => s.id === nearestId);

                // Tuned Speed & Color Mapping
                let color = '#22d3ee'; // Cyan (Sehat)
                let speed = 0.5;       // Aliran natural air bersih

                if (station) {
                    const isCritical = station.currentData.bod > 3.0 || station.currentData.cod > 25.0 || station.currentData.do < 4.0;
                    if (isCritical) {
                        color = '#f43f5e'; // Merah (Kritis)
                        speed = 0.15;      // Sangat mampet/kental
                    } else if (station.currentData.bod > 2.0) {
                        color = '#fbbf24'; // Kuning (Waspada)
                        speed = 0.3;       // Agak lambat
                    }
                }

                const processLine = (coords: number[][]) => {
                    const points = coords.map(c => map.latLngToContainerPoint([c[1], c[0]]));
                    activeSegments.push({ points, color, speed });
                };

                if (geom.type === 'LineString') processLine(geom.coordinates);
                else if (geom.type === 'MultiLineString') geom.coordinates.forEach(processLine);
            });

            // 2. Gambar Rangka Dasar Sungai Berdasarkan Zona Warnanya (Menghindari tumpang tindih visual)
            sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
            sCtx.lineCap = 'round';
            sCtx.lineJoin = 'round';
            sCtx.lineWidth = 4; // Lebih tebal agar area jelas

            activeSegments.forEach(seg => {
                if (seg.points.length < 2) return;
                sCtx.beginPath();
                sCtx.moveTo(seg.points[0].x, seg.points[0].y);
                for (let i = 1; i < seg.points.length; i++) {
                    sCtx.lineTo(seg.points[i].x, seg.points[i].y);
                }
                sCtx.strokeStyle = seg.color; // Mewarnai garis statis dengan warna stasiunnya
                sCtx.globalAlpha = 0.35;      // Transparan sebagai dasar aliran
                sCtx.stroke();
            });

            // 3. Taburkan Tetesan Partikel
            particles = [];
            if (activeSegments.length === 0) return;

            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const segIdx = Math.floor(Math.random() * activeSegments.length);
                const segment = activeSegments[segIdx];
                const ptIdx = Math.floor(Math.random() * (segment.points.length - 1));

                particles.push({
                    segmentIdx: segIdx,
                    ptIdx: ptIdx,
                    x: segment.points[ptIdx].x,
                    y: segment.points[ptIdx].y,
                    speed: segment.speed * (0.8 + Math.random() * 0.4),
                    color: segment.color
                });
            }
        };

        // --- C. ENGINE ANIMASI (60 FPS PARTICLE ROUTING) ---
        const renderLoop = () => {
            if (!isAnimating || !dynamicCanvasRef.current) return;

            const w = dCanvas.width;
            const h = dCanvas.height;

            // Fading Trail (Air Mengalir)
            dCtx.globalCompositeOperation = 'destination-out';
            dCtx.fillStyle = `rgba(0, 0, 0, ${FADE_RATE})`;
            dCtx.fillRect(0, 0, w, h);

            dCtx.globalCompositeOperation = 'source-over';
            dCtx.lineWidth = 3.5; // Komet lebih tebal dan jelas
            dCtx.lineCap = 'round';

            particles.forEach(p => {
                const segment = activeSegments[p.segmentIdx];
                if (!segment) return;

                const p1 = { x: p.x, y: p.y };
                const p2 = segment.points[p.ptIdx + 1];

                if (!p2) {
                    p.segmentIdx = Math.floor(Math.random() * activeSegments.length);
                    p.ptIdx = 0;
                    p.x = activeSegments[p.segmentIdx].points[0].x;
                    p.y = activeSegments[p.segmentIdx].points[0].y;
                    return;
                }

                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < p.speed) {
                    p.ptIdx++;
                    p.x = p2.x;
                    p.y = p2.y;
                } else {
                    p.x += (dx / dist) * p.speed;
                    p.y += (dy / dist) * p.speed;
                }

                // Gambar goresan komet (membentuk ekor bercahaya)
                dCtx.beginPath();
                dCtx.moveTo(p1.x, p1.y);
                dCtx.lineTo(p.x, p.y);
                dCtx.strokeStyle = p.color;
                dCtx.globalAlpha = 0.9;
                dCtx.stroke();
            });

            animationRef.current = requestAnimationFrame(renderLoop);
        };

        // --- D. EVENT LISTENERS ---
        const handleInteractionStart = () => {
            isAnimating = false;
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            sCanvas.style.opacity = '0';
            dCanvas.style.opacity = '0';
        };

        const handleInteractionEnd = () => {
            syncCanvasGeometry();
            isAnimating = true;
            sCanvas.style.opacity = String(mapOpacity / 100);

            // LOD Threshold Diperluas
            if (map.getZoom() >= ZOOM_LOD_THRESHOLD) {
                dCanvas.style.opacity = String(mapOpacity / 100);
                renderLoop();
            } else {
                dCanvas.style.opacity = '0';
            }
        };

        map.on('movestart zoomstart', handleInteractionStart);
        map.on('moveend zoomend', handleInteractionEnd);

        // Eksekusi Pertama
        syncCanvasGeometry();
        if (map.getZoom() >= ZOOM_LOD_THRESHOLD) renderLoop();

        return () => {
            isAnimating = false;
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            map.off('movestart zoomstart', handleInteractionStart);
            map.off('moveend zoomend', handleInteractionEnd);
            if (staticCanvasRef.current?.parentNode) staticCanvasRef.current.parentNode.removeChild(staticCanvasRef.current);
            if (dynamicCanvasRef.current?.parentNode) dynamicCanvasRef.current.parentNode.removeChild(dynamicCanvasRef.current);
        };
    }, [processedGeoJson, isRiverActive, map, mapOpacity]);

    // Danau/Waduk Static Style
    const polyStyle = (opacity: number): PathOptions => ({
        color: '#155e75',
        fillColor: '#0e7490',
        fillOpacity: (opacity / 100) * 0.35,
        weight: 1,
        interactive: false
    });

    return (
        <React.Fragment>
            {isRiverActive && bogorSungaiPoly && (
                <GeoJSON
                    key={`river-poly-${mapOpacity}`}
                    data={bogorSungaiPoly as any}
                    style={() => polyStyle(mapOpacity)}
                />
            )}
        </React.Fragment>
    );
}