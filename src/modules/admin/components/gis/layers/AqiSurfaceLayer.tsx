// src/modules/admin/components/gis/layers/AqiSurfaceLayer.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { ImageOverlay } from 'react-leaflet';
import { spatialMath, AqiNode } from '@/lib/spatialMath';
import { useSijagaStore } from '@/store/useSijagaStore';

// Impor GeoJSON Wilayah Kabupaten Kotawaringin Timur untuk menciptakan path Clipping Canvas (Information Expert) [3]
import kecData from '@/assets/geojson/bogor/bogor-kecamatan.json';

interface AqiSurfaceLayerProps {
    companies: any[];
    mapOpacity: number; // 0 - 100
}

// Bounding Box Kabupaten Bogor (Diselaraskan persis dari letak geografis aslinya) [3]
const BOGOR_BOUNDS = {
    latMin: -6.80,  // Batas Selatan
    latMax: -6.30,  // Batas Utara
    lngMin: 106.40, // Batas Barat
    lngMax: 107.23  // Batas Timur
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
 * terpotong rapi mengikuti lekukan geografis Kabupaten Kotawaringin Timur [3].
 */
export default function AqiSurfaceLayer({ companies, mapOpacity }: AqiSurfaceLayerProps) {
    const { batchAqiData, wildfires, fetchWildfires } = useSijagaStore();
    const [canvasDataUrl, setCanvasDataUrl] = useState<string | null>(null);

    // Ambil data titik api jika belum ada di store
    useEffect(() => {
        if (!wildfires || wildfires.length === 0) {
            fetchWildfires();
        }
    }, [wildfires, fetchWildfires]);

    // 1. Ekstrak Data Sensor Gabungan: Emisi Pabrik + Titik Api Karhutla + Telemetri Atmosferik
    const { aqiSensors, baselineAqi } = useMemo(() => {
        const sensors: AqiNode[] = [];

        // --- A. KLASTER TELEMETRI ATMOSFERIK OPEN-METEO (CAMS MODEL) ---
        let totalClusterAqi = 0;
        let clusterCount = 0;
        if (batchAqiData && batchAqiData.length > 0) {
            batchAqiData.forEach(cluster => {
                const aqiVal = cluster.telemetry?.aqi ?? 120;
                sensors.push({
                    lat: cluster.lat,
                    lng: cluster.lng,
                    aqi: aqiVal
                });
                totalClusterAqi += aqiVal;
                clusterCount++;
            });
        }

        // Baseline dinamis atmosfer: mengikuti rata-rata Open-Meteo atau ambient default
        const computedBaseline = clusterCount > 0 ? Math.round(totalClusterAqi / clusterCount) : 115;

        // --- B. EMISI LOKAL PABRIK (KUMULATIF: AREA SEKITAR PABRIK TETAP JELEK/MERAH) ---
        // Polusi pabrik bersifat aditif di atas kondisi udara wilayah (point-source emission)
        companies.forEach(c => {
            const lat = parseFloat(c.lat);
            const lng = parseFloat(c.lng);
            if (isNaN(lat) || isNaN(lng)) return;

            // Beban emisi cerobong pabrik berdasarkan skala AMDAL/UKL-UPL:
            let emissionLoad = 45; // Beban standar industri aktif

            if (c.docType === 'AMDAL') {
                emissionLoad = 75; // AMDAL = Industri skala besar / cerobong tinggi
            } else if (c.docType === 'UKL-UPL' || c.docType === 'UKL_UPL') {
                emissionLoad = 55;
            }

            // Kepatuhan buruk / status ditangguhkan memperparah polusi di sekitar pabrik
            if (c.status === 'SUSPENDED' || c.status === 'REJECTED') {
                emissionLoad += 35; // Pelanggaran berat
            } else if (c.score && c.score < 60) {
                emissionLoad += 25; // Skor kepatuhan rendah
            }

            // Kumulatif: emisi pabrik bertumpuk di atas kualitas udara regional,
            // dan dijamin MINIMAL berada di zona Merah (AQI >= 180) untuk AMDAL/pelanggar.
            const minFloor = (c.docType === 'AMDAL' || (c.score && c.score < 60) || c.status === 'SUSPENDED') ? 180 : 155;
            const factoryAqi = Math.max(minFloor, Math.min(300, computedBaseline + emissionLoad));

            sensors.push({ lat, lng, aqi: factoryAqi });
        });

        // --- C. TITIK API KARHUTLA DARI NASA FIRMS (HAZARDOUS SMOKE) ---
        if (wildfires && wildfires.length > 0) {
            wildfires.forEach(spot => {
                // Karhutla memancarkan polusi partikulat PM2.5 & gas CO masif (AQI 280 - 500)
                const fireAqi = Math.min(500, Math.round(280 + (spot.frp * 2.5)));
                sensors.push({
                    lat: spot.latitude,
                    lng: spot.longitude,
                    aqi: fireAqi
                });
            });
        }

        return { aqiSensors: sensors, baselineAqi: computedBaseline };
    }, [companies, batchAqiData, wildfires]);

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

                // OPTIMASI KRITIS: Jika titik X/Y ini jatuh di luar batas Kabupaten Bogor, skip kalkulasi [3]
                if (!ctx.isPointInPath(bogorPath, x, y)) {
                    continue;
                }

                const currentLat = BOGOR_BOUNDS.latMax - (y * latStep);
                const currentLng = BOGOR_BOUNDS.lngMin + (x * lngStep);

                // Tarik nilai tebakan dari Engine IDW kita dengan dynamic atmospheric baseline
                const interpolatedAqi = spatialMath.interpolateAqi(currentLat, currentLng, aqiSensors, baselineAqi);
                const [r, g, b] = spatialMath.interpolateColorRgb(interpolatedAqi);

                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }

        ctx.restore();

        // Simpan sebagai URI Gambar agar bisa ditangkap oleh ImageOverlay Leaflet
        setCanvasDataUrl(canvas.toDataURL('image/png'));
    }, [aqiSensors, baselineAqi]);

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