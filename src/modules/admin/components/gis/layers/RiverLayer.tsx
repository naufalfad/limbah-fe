// src/modules/admin/components/gis/layers/RiverLayer.tsx
import React, { useMemo } from 'react';
import { GeoJSON } from 'react-leaflet';
import { PathOptions } from 'leaflet';
import { useGisUIStore } from '@/store/useGisUIStore';
import { useSijagaStore } from '@/store/useSijagaStore';

// @ts-ignore
import * as turf from '@turf/turf';

// @ts-ignore
import bogorSungaiLine from '@/assets/geojson/bogor-sungai-line.json';
// @ts-ignore
import bogorSungaiPoly from '@/assets/geojson/bogor-sungai-poly.json';

/**
 * ============================================================================
 * STATIC RIVER LAYER (NATIVE SVG RENDERER W/ DYNAMIC LOD)
 * ============================================================================
 * Menggunakan pendekatan SVG murni (Native Leaflet GeoJSON).
 * Dilengkapi dengan algoritma Level of Detail (LOD) untuk menyesuaikan 
 * ketebalan garis sungai berdasarkan tingkat perbesaran peta (Zoom Level) 
 * agar tidak menumpuk saat zoom-out jauh.
 */
export default function RiverLayer() {
    // INJEKSI: Menarik nilai mapZoom global yang disinkronkan oleh LimbahMap.tsx
    const { activeLayers, mapOpacity, mapZoom } = useGisUIStore();
    const { waterStations } = useSijagaStore();

    const isRiverActive = activeLayers.includes('layer-river');

    // ==========================================================================
    // PROGRAMMATIC SPATIAL JOIN (Turf.js Optimasi O(1))
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
    // STYLING RESOLVER W/ DYNAMIC WEIGHT & SOFT COLORS
    // ==========================================================================
    const lineStyle = (feature: any): PathOptions => {
        // 1. REVISI WARNA: Menggunakan spektrum pastel yang lebih lembut di mata
        let strokeColor = '#4fd1c5'; // Teal/Cyan 400 (Bukan lagi neon cyan)

        const nearestId = feature.properties?.nearestStationId;
        const station = waterStations.find(s => s.id === nearestId);

        if (station) {
            const isCritical =
                station.currentData.bod > 3.0 ||
                station.currentData.cod > 25.0 ||
                station.currentData.do < 4.0;

            if (isCritical) {
                strokeColor = '#fb7185'; // Rose 400 (Merah soft/pastel)
            } else if (station.currentData.bod > 2.0) {
                strokeColor = '#fbbf24'; // Amber 400 (Kuning soft)
            }
        }

        // 2. REVISI KETEBALAN: Logika Level of Detail (LOD) berbasis Zoom Level
        let dynamicWeight = 1; // Default sangat tipis untuk zoom-out jauh (<= 10)

        if (mapZoom >= 14) {
            dynamicWeight = 4.0; // Saat zoom sangat dekat (Level Jalan/Gedung)
        } else if (mapZoom === 13) {
            dynamicWeight = 2.5; // Level Kecamatan
        } else if (mapZoom === 12) {
            dynamicWeight = 1.5; // Level Kabupaten
        } else if (mapZoom === 11) {
            dynamicWeight = 1.0; // Level Regional Provinsi
        } else {
            dynamicWeight = 0.5; // Ekstrem Zoom-out
        }

        return {
            color: strokeColor,
            weight: dynamicWeight,
            // Menurunkan base opacity menjadi 80% dari slider UI agar warna membaur (blend) ke basemap
            opacity: (mapOpacity / 100) * 0.8,
            lineCap: 'round',
            lineJoin: 'round',
            interactive: false
        };
    };

    // Skema Pewarnaan Poligon Sungai Lebar / Danau
    const polyStyle = (opacity: number): PathOptions => ({
        color: '#155e75',
        fillColor: '#0e7490',
        fillOpacity: (opacity / 100) * 0.25, // Transparansi diturunkan agar lebih kalem
        weight: 1,
        interactive: false
    });

    if (!isRiverActive) return null;

    return (
        <React.Fragment>
            {/* 
                KRITIS: mapZoom disisipkan ke dalam 'key'.
                Tanpa ini, Leaflet tidak akan tahu bahwa dia harus menggambar ulang
                ketebalan garis saat pengguna melakukan zoom in/out.
            */}
            {processedGeoJson && (
                <GeoJSON
                    key={`river-line-${mapOpacity}-${waterStations.length}-zoom${mapZoom}`}
                    data={processedGeoJson as any}
                    style={lineStyle}
                />
            )}

            {bogorSungaiPoly && (
                <GeoJSON
                    key={`river-poly-${mapOpacity}`}
                    data={bogorSungaiPoly as any}
                    style={() => polyStyle(mapOpacity)}
                />
            )}
        </React.Fragment>
    );
}