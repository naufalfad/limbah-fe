// src/modules/admin/components/gis/layers/RiverLayer.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import L, { PathOptions } from 'leaflet';
import { useGisUIStore } from '@/store/useGisUIStore';
import { useSijagaStore } from '@/store/useSijagaStore';

// @ts-ignore - Bypass export mapping issue Turf.js v6.5 di bundler Vite
import * as turf from '@turf/turf';

// @ts-ignore - Bypass import module JSON di lingkungan Vite + TypeScript
import bogorSungaiLine from '@/assets/geojson/bogor-sungai-line.json';
// @ts-ignore - Bypass import module JSON di lingkungan Vite + TypeScript
import bogorSungaiPoly from '@/assets/geojson/bogor-sungai-poly.json';

interface CachedRiverPath {
    coordsList: L.Point[][];
    color: string;
    speed: number;
    shouldAnimate: boolean; // Flag LOD spasial dinamis [3]
}

/**
 * ============================================================================
 * HIGH PERFORMANCE CANVAS RIVER FLOW OVERLAY (OPTIMIZED)
 * ============================================================================
 * Menggunakan teknik caching proyeksi, filter viewport, serta throttling loop 
 * animasi untuk performa mulus (60 FPS) dan hemat daya ekstrem [3].
 */
export default function RiverLayer() {
    const map = useMap();
    const { activeLayers, mapOpacity } = useGisUIStore();
    const { waterStations } = useSijagaStore();

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationRef = useRef<number | null>(null);

    // Verifikasi visibilitas layer sungai
    const isRiverActive = activeLayers.includes('layer-river');

    // ==========================================================================
    // INITIALIZATION-TIME PROGRAMMATIC SPATIAL JOIN (Turf.js Optimasi O(1)) [3]
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

            feature.properties = {
                ...feature.properties,
                nearestStationId: closestStationId
            };
        });

        return geojson;
    }, [waterStations]);

    // ==========================================================================
    // LIFECYCLE ENGINE ANIMASI CANVAS (HIGH PERFORMANCE)
    // ==========================================================================
    useEffect(() => {
        if (!isRiverActive || !processedGeoJson) {
            if (canvasRef.current && canvasRef.current.parentNode) {
                canvasRef.current.parentNode.removeChild(canvasRef.current);
                canvasRef.current = null;
            }
            return;
        }

        // 1. Inisialisasi Kanvas Overlay di Overlay Pane Leaflet
        const canvas = document.createElement('canvas');
        canvas.className = 'leaflet-zoom-animated pointer-events-none mix-blend-screen';
        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.top = '0';
        canvas.style.opacity = String(mapOpacity / 100);
        canvas.style.transition = 'opacity 0.2s ease-in-out';

        map.getPanes().overlayPane.appendChild(canvas);
        canvasRef.current = canvas;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let cachedPaths: CachedRiverPath[] = [];
        let isAnimating = true;
        let tick = 0;

        // 2. Pre-Computing & Caching Viewport (Clipped Geometry)
        const syncCanvasGeometry = () => {
            const size = map.getSize();
            canvas.width = size.x;
            canvas.height = size.y;

            const topLeft = map.containerPointToLayerPoint([0, 0]);
            L.DomUtil.setPosition(canvas, topLeft);

            // Pengaman Viewport: Tambahkan batas toleransi margin (~15%) agar komet masuk layar dengan mulus [3]
            const mapBounds = map.getBounds();
            const paddedBounds = mapBounds.pad(0.15);
            const currentZoomLevel = map.getZoom();

            // LOD Rule: Batasi animasi komet hanya pada zoom-in menengah ke dekat (Zoom >= 13) [3]
            const enableFlowAnimation = currentZoomLevel >= 13;

            // Saring dan proyeksi koordinat segmen sungai yang murni on-screen saja (GRASP)
            cachedPaths = processedGeoJson.features
                .filter((feature: any) => {
                    const geom = feature.geometry;
                    if (!geom) return false;

                    // VIEWPORT CLIPPING: Jika segmen sungai di luar viewport, abaikan [3]
                    if (geom.type === 'LineString') {
                        return geom.coordinates.some((coord: number[]) =>
                            paddedBounds.contains([coord[1], coord[0]])
                        );
                    } else if (geom.type === 'MultiLineString') {
                        return geom.coordinates.some((line: number[][]) =>
                            line.some((coord: number[]) => paddedBounds.contains([coord[1], coord[0]]))
                        );
                    }
                    return false;
                })
                .map((feature: any) => {
                    const geom = feature.geometry;
                    const nearestId = feature.properties?.nearestStationId;
                    const station = waterStations.find(s => s.id === nearestId);

                    let color = '#22d3ee'; // Cyan 400 (Aliran Sehat)
                    let speed = 0.4;       // Flow normal lambat & halus

                    if (station) {
                        const isCritical =
                            station.currentData.bod > 3.0 ||
                            station.currentData.cod > 25.0 ||
                            station.currentData.do < 4.0;

                        if (isCritical) {
                            color = '#f43f5e'; // Rose 500 (Sungai Tercemar Berat)
                            speed = 0.12;      // Mengalir tersendat / sangat lambat
                        } else if (station.currentData.bod > 2.0) {
                            color = '#fbbf24'; // Amber 400 (Tercemar Sedang)
                            speed = 0.25;      // Mengalir sedang
                        }
                    }

                    const coordsList: L.Point[][] = [];
                    if (geom.type === 'LineString') {
                        const pts = geom.coordinates.map((coord: number[]) =>
                            map.latLngToContainerPoint([coord[1], coord[0]])
                        );
                        coordsList.push(pts);
                    } else if (geom.type === 'MultiLineString') {
                        geom.coordinates.forEach((line: number[][]) => {
                            const pts = line.map((coord: number[]) =>
                                map.latLngToContainerPoint([coord[1], coord[0]])
                            );
                            coordsList.push(pts);
                        });
                    }

                    return { coordsList, color, speed, shouldAnimate: enableFlowAnimation };
                });
        };

        // Fungsi bantu lukis canvas
        const drawAllPaths = (cCtx: CanvasRenderingContext2D, currentTick: number) => {
            cachedPaths.forEach((path) => {
                path.coordsList.forEach((pts) => {
                    if (pts.length < 2) return;

                    // --- LAPIS 1: Sungai Lapis Dasar (Static Teal Base) ---
                    cCtx.beginPath();
                    cCtx.moveTo(pts[0].x, pts[0].y);
                    for (let i = 1; i < pts.length; i++) {
                        cCtx.lineTo(pts[i].x, pts[i].y);
                    }
                    cCtx.strokeStyle = '#115e59';
                    cCtx.lineWidth = 3.5;
                    cCtx.lineCap = 'round';
                    cCtx.lineJoin = 'round';
                    cCtx.setLineDash([]); // Garis dasar solid tanpa putus-putus
                    cCtx.globalAlpha = 0.45;
                    cCtx.stroke();

                    // --- LAPIS 2: Aliran Dashed (Pre-rendered Marching Flow) ---
                    // Animasi komet putus-putus hanya di-render jika mode LOD aktif [3]
                    if (path.shouldAnimate) {
                        cCtx.beginPath();
                        cCtx.moveTo(pts[0].x, pts[0].y);
                        for (let i = 1; i < pts.length; i++) {
                            cCtx.lineTo(pts[i].x, pts[i].y);
                        }
                        cCtx.strokeStyle = path.color;
                        cCtx.lineWidth = 1.8;
                        cCtx.lineCap = 'round';
                        cCtx.lineJoin = 'round';

                        // Native marching dashes: 6px komet, 14px jeda kosong
                        cCtx.setLineDash([6, 14]);
                        cCtx.lineDashOffset = -currentTick * path.speed; // Gerakkan offset berlawanan arus
                        cCtx.globalAlpha = 0.85;
                        cCtx.stroke();
                    }
                });
            });
        };

        // 3. Pause & Play saat interaksi peta untuk menghemat RAM & CPU
        const handleInteractionStart = () => {
            isAnimating = false;
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
            canvas.style.opacity = '0'; // Sembunyikan halus saat transisi rendering Leaflet
        };

        const handleInteractionEnd = () => {
            syncCanvasGeometry();
            isAnimating = true;
            canvas.style.opacity = String(mapOpacity / 100);
            renderLoop();
        };

        map.on('movestart zoomstart', handleInteractionStart);
        map.on('moveend zoomend', handleInteractionEnd);

        // Inisialisasi awal kalkulasi koordinat
        syncCanvasGeometry();

        // 4. Smart Loop Throttler (0% CPU Idle pada Zoom Out jauh) [3]
        const renderLoop = () => {
            if (!isAnimating || !canvasRef.current) return;

            const currentZoomLevel = map.getZoom();
            const hasAnimation = currentZoomLevel >= 13;

            if (hasAnimation) {
                // Skenario A: Zoom dekat -> jalankan loop komet beranimasi secara kontinu
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                tick += 0.35;
                drawAllPaths(ctx, tick);
                animationRef.current = requestAnimationFrame(renderLoop);
            } else {
                // Skenario B: Zoom regional -> gambar sungai statis sekali saja dan STOP animasi (0% CPU beban diam) [3]
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawAllPaths(ctx, 0); // Lukis statis dengan tick = 0
                animationRef.current = null; // Putuskan siklus frame loop
            }
        };

        // Jalankan mesin animasi
        renderLoop();

        // Destruksi & Pembersihan Listener saat unmount
        return () => {
            isAnimating = false;
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            map.off('movestart zoomstart', handleInteractionStart);
            map.off('moveend zoomend', handleInteractionEnd);
            if (canvasRef.current && canvasRef.current.parentNode) {
                canvasRef.current.parentNode.removeChild(canvasRef.current);
            }
        };
    }, [processedGeoJson, isRiverActive, map, mapOpacity]);

    // Skema Pewarnaan Poligon Sungai Lebar / Danau / Waduk statis (Tidak Bergerak)
    const polyStyle = (opacity: number): PathOptions => ({
        color: '#155e75',
        fillColor: '#0e7490',
        fillOpacity: (opacity / 100) * 0.35,
        weight: 1,
        interactive: false
    });

    return (
        <React.Fragment>
            {/* Hanya gambar static polygons via Leaflet GeoJSON agar terekam layer koordinat dengan hemat */}
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