// src/modules/admin/components/gis/layers/AqiSurfaceLayer.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { ImageOverlay } from 'react-leaflet';
import { spatialMath, AqiNode } from '@/lib/spatialMath';
import { useSijagaStore } from '@/store/useSijagaStore';

// Impor GeoJSON Wilayah Kabupaten Bogor untuk menciptakan path Clipping Canvas (Information Expert)
import kecData from '@/assets/geojson/bogor-kecamatan.json';

interface AqiSurfaceLayerProps {
    companies: any[];
    mapOpacity: number; // 0 - 100
}

// Bounding Box Kabupaten Bogor (Diselaraskan persis dari letak geografis aslinya)
const BOGOR_BOUNDS = {
    latMin: -6.80,  // Batas Selatan (Area Megamendung / Cisarua)
    latMax: -6.25,  // Batas Utara (Area Gunung Putri / Cileungsi)
    lngMin: 106.35, // Batas Barat (Area Jasinga)
    lngMax: 107.25  // Batas Timur (Area Jonggol)
};

// Bounds format Leaflet: [[South, West], [North, East]]
const LEAFLET_BOUNDS: [number, number][] = [
    [BOGOR_BOUNDS.latMin, BOGOR_BOUNDS.lngMin],
    [BOGOR_BOUNDS.latMax, BOGOR_BOUNDS.lngMax]
];

// Resolusi Kanvas. Semakin tinggi semakin detail, namun lebih berat di CPU.
const CANVAS_RESOLUTION = 80;

/**
 * ============================================================================
 * AQI SURFACE LAYER (CANVAS BLENDING ENGINE W/ CLIPPING)
 * ============================================================================
 * Menggunakan teknik Clipping Mask dari HTML5 Canvas agar bentuk gradasi
 * terpotong rapi mengikuti lekukan geografis Kabupaten Bogor.
 */
export default function AqiSurfaceLayer({ companies, mapOpacity }: AqiSurfaceLayerProps) {
    const { batchAqiData } = useSijagaStore(); // INJEKSI: Mengambil data batch kualitas udara real-time
    const [canvasDataUrl, setCanvasDataUrl] = useState<string | null>(null);

    // 1. Ekstrak Data Sensor (Dihubungkan ke Batch Cluster hasil API jika tersedia)
    const aqiSensors = useMemo(() => {
        if (batchAqiData && batchAqiData.length > 0) {
            // Mengubah format batch klaster ke bentuk AqiNode untuk interpolasi IDW
            return batchAqiData.map(cluster => ({
                lat: cluster.lat,
                lng: cluster.lng,
                aqi: cluster.telemetry?.aqi ?? 35
            })) as AqiNode[];
        }

        // Fallback Simulasi Luring jika data backend belum termuat
        return companies.map(c => {
            const lat = parseFloat(c.lat);
            const lng = parseFloat(c.lng);
            if (isNaN(lat) || isNaN(lng)) return null;

            const seed = Math.abs(Math.sin(lat) * Math.cos(lng));
            const aqi = Math.floor(25 + (seed * 60)); // Rentang 25 - 85

            return { lat, lng, aqi } as AqiNode;
        }).filter(Boolean) as AqiNode[];
    }, [companies, batchAqiData]);

    // 2. Render Canvas di Background Memory (Pure Fabrication)
    useEffect(() => {
        if (aqiSensors.length === 0 || !kecData || !(kecData as any).features) return;

        // Membuat kanvas offscreen
        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_RESOLUTION;
        canvas.height = CANVAS_RESOLUTION;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const latStep = (BOGOR_BOUNDS.latMax - BOGOR_BOUNDS.latMin) / (CANVAS_RESOLUTION - 1);
        const lngStep = (BOGOR_BOUNDS.lngMax - BOGOR_BOUNDS.lngMin) / (CANVAS_RESOLUTION - 1);

        // --- A. PEMBUATAN CLIPPING PATH BOGOR ---
        const bogorPath = new Path2D();

        const getX = (lng: number) => ((lng - BOGOR_BOUNDS.lngMin) / (BOGOR_BOUNDS.lngMax - BOGOR_BOUNDS.lngMin)) * CANVAS_RESOLUTION;
        // Y di-inverse karena 0,0 di Canvas ada di atas, sedangkan LatMax ada di Utara (atas)
        const getY = (lat: number) => ((BOGOR_BOUNDS.latMax - lat) / (BOGOR_BOUNDS.latMax - BOGOR_BOUNDS.latMin)) * CANVAS_RESOLUTION;

        (kecData as any).features.forEach((feature: any) => {
            const geom = feature.geometry;
            if (!geom) return;

            if (geom.type === "Polygon") {
                geom.coordinates.forEach((ring: any[]) => {
                    ring.forEach((coord, i) => {
                        const x = getX(coord[0]);
                        const y = getY(coord[1]);
                        if (i === 0) bogorPath.moveTo(x, y);
                        else bogorPath.lineTo(x, y);
                    });
                    bogorPath.closePath();
                });
            } else if (geom.type === "MultiPolygon") {
                geom.coordinates.forEach((poly: any[][]) => {
                    poly.forEach((ring: any[]) => {
                        ring.forEach((coord, i) => {
                            const x = getX(coord[0]);
                            const y = getY(coord[1]);
                            if (i === 0) bogorPath.moveTo(x, y);
                            else bogorPath.lineTo(x, y);
                        });
                        bogorPath.closePath();
                    });
                });
            }
        });

        // Terapkan Path sebagai Masking Canvas
        ctx.save();
        ctx.clip(bogorPath);

        // --- B. RENDERING PIKSEL & OPTIMASI CPU ---
        for (let y = 0; y < CANVAS_RESOLUTION; y++) {
            for (let x = 0; x < CANVAS_RESOLUTION; x++) {

                // OPTIMASI KRITIS: Jika titik X/Y ini jatuh di luar batas Kabupaten Bogor, skip kalkulasi
                if (!ctx.isPointInPath(bogorPath, x, y)) {
                    continue;
                }

                const currentLat = BOGOR_BOUNDS.latMax - (y * latStep);
                const currentLng = BOGOR_BOUNDS.lngMin + (x * lngStep);

                // Tarik nilai tebakan dari Engine IDW kita
                const interpolatedAqi = spatialMath.interpolateAqi(currentLat, currentLng, aqiSensors);
                const [r, g, b] = spatialMath.interpolateColorRgb(interpolatedAqi);

                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }

        ctx.restore();

        // Simpan sebagai URI Gambar agar bisa ditangkap oleh ImageOverlay Leaflet
        setCanvasDataUrl(canvas.toDataURL('image/png'));
    }, [aqiSensors]);

    if (!canvasDataUrl) return null;

    return (
        <ImageOverlay
            url={canvasDataUrl}
            bounds={LEAFLET_BOUNDS as any}
            opacity={mapOpacity / 100}
            // CSS Blur menyatukan matriks piksel menjadi gradasi mulus
            // mix-blend-multiply menempelkan warna ini ke atas basemap seperti tinta
            className="continuous-surface-map mix-blend-multiply blur-[20px]"
            interactive={false}
        />
    );
}