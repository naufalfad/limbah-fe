// src/modules/admin/components/gis/layers/AqiSurfaceLayer.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { ImageOverlay } from 'react-leaflet';
import { spatialMath, AqiNode } from '@/lib/spatialMath';

// Impor GeoJSON untuk menciptakan path Clipping Canvas (Information Expert)
import kecData from '@/assets/geojson/kotim-kecamatan.json';

interface AqiSurfaceLayerProps {
    companies: any[];
    mapOpacity: number; // 0 - 100
}

// Bounding Box DIPERLUAS untuk mencakup seluruh ekstrem wilayah Kotawaringin Timur.
// Mencegah kebocoran "Blank Spots" di pedalaman utara atau pesisir selatan.
const KOTIM_BOUNDS = {
    latMin: -3.40,  // Diperluas ke Selatan (Pesisir)
    latMax: -1.30,  // Diperluas ke Utara (Pedalaman)
    lngMin: 112.00, // Diperluas ke Barat
    lngMax: 113.60  // Diperluas ke Timur
};

// Bounds format Leaflet: [[South, West], [North, East]]
const LEAFLET_BOUNDS: [number, number][] = [
    [KOTIM_BOUNDS.latMin, KOTIM_BOUNDS.lngMin],
    [KOTIM_BOUNDS.latMax, KOTIM_BOUNDS.lngMax]
];

// Resolusi Kanvas. Semakin tinggi semakin detail, namun lebih berat di CPU.
// 80x80 = 6400 titik kalkulasi, optimal untuk rendering batas presisi Kotim.
const CANVAS_RESOLUTION = 80;

/**
 * ============================================================================
 * AQI SURFACE LAYER (CANVAS BLENDING ENGINE W/ CLIPPING)
 * ============================================================================
 * Menggunakan teknik Clipping Mask dari HTML5 Canvas agar bentuk gradasi
 * terpotong rapi mengikuti lekukan geografis Kabupaten Kotawaringin Timur.
 */
export default function AqiSurfaceLayer({ companies, mapOpacity }: AqiSurfaceLayerProps) {
    const [canvasDataUrl, setCanvasDataUrl] = useState<string | null>(null);

    // 1. Ekstrak Data Sensor
    const aqiSensors = useMemo(() => {
        return companies.map(c => {
            const lat = parseFloat(c.lat);
            const lng = parseFloat(c.lng);
            if (isNaN(lat) || isNaN(lng)) return null;

            // Pseudo-random AQI simulator berdasarkan koordinat
            const seed = Math.abs(Math.sin(lat) * Math.cos(lng));
            const aqi = Math.floor(25 + (seed * 60)); // Rentang 25 - 85

            return { lat, lng, aqi } as AqiNode;
        }).filter(Boolean) as AqiNode[];
    }, [companies]);

    // 2. Render Canvas di Background Memory (Pure Fabrication)
    useEffect(() => {
        if (aqiSensors.length === 0 || !kecData || !(kecData as any).features) return;

        // Membuat kanvas offscreen
        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_RESOLUTION;
        canvas.height = CANVAS_RESOLUTION;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const latStep = (KOTIM_BOUNDS.latMax - KOTIM_BOUNDS.latMin) / (CANVAS_RESOLUTION - 1);
        const lngStep = (KOTIM_BOUNDS.lngMax - KOTIM_BOUNDS.lngMin) / (CANVAS_RESOLUTION - 1);

        // --- A. PEMBUATAN CLIPPING PATH KOTIM ---
        // Mentranslasikan koordinat Lat/Lng dari GeoJSON ke koordinat X/Y pada Canvas
        const kotimPath = new Path2D();

        const getX = (lng: number) => ((lng - KOTIM_BOUNDS.lngMin) / (KOTIM_BOUNDS.lngMax - KOTIM_BOUNDS.lngMin)) * CANVAS_RESOLUTION;
        // Y di-inverse karena 0,0 di Canvas ada di atas, sedangkan LatMax ada di Utara (atas)
        const getY = (lat: number) => ((KOTIM_BOUNDS.latMax - lat) / (KOTIM_BOUNDS.latMax - KOTIM_BOUNDS.latMin)) * CANVAS_RESOLUTION;

        (kecData as any).features.forEach((feature: any) => {
            const geom = feature.geometry;
            if (!geom) return;

            if (geom.type === "Polygon") {
                geom.coordinates.forEach((ring: any[]) => {
                    ring.forEach((coord, i) => {
                        const x = getX(coord[0]);
                        const y = getY(coord[1]);
                        if (i === 0) kotimPath.moveTo(x, y);
                        else kotimPath.lineTo(x, y);
                    });
                    kotimPath.closePath();
                });
            } else if (geom.type === "MultiPolygon") {
                geom.coordinates.forEach((poly: any[][]) => {
                    poly.forEach((ring: any[]) => {
                        ring.forEach((coord, i) => {
                            const x = getX(coord[0]);
                            const y = getY(coord[1]);
                            if (i === 0) kotimPath.moveTo(x, y);
                            else kotimPath.lineTo(x, y);
                        });
                        kotimPath.closePath();
                    });
                });
            }
        });

        // Terapkan Path sebagai Masking Canvas
        ctx.save();
        ctx.clip(kotimPath);

        // --- B. RENDERING PIKSEL & OPTIMASI CPU ---
        for (let y = 0; y < CANVAS_RESOLUTION; y++) {
            for (let x = 0; x < CANVAS_RESOLUTION; x++) {

                // OPTIMASI KRITIS: Jika titik X/Y ini jatuh di laut atau kabupaten lain, 
                // lewati kalkulasi IDW (hemat ribuan siklus CPU tiap frame).
                if (!ctx.isPointInPath(kotimPath, x, y)) {
                    continue;
                }

                const currentLat = KOTIM_BOUNDS.latMax - (y * latStep);
                const currentLng = KOTIM_BOUNDS.lngMin + (x * lngStep);

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