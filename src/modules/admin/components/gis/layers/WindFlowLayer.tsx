// src/modules/admin/components/gis/layers/WindFlowLayer.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { spatialMath, WindNode } from '@/lib/spatialMath';

// Impor GeoJSON Wilayah Kabupaten Kotawaringin Timur untuk pembuatan Path Clipping (Information Expert) [3]
import kecData from '@/assets/geojson/kotim-kecamatan.json';

interface WindFlowLayerProps {
    companies: any[];
}

// Bounding Box Kabupaten Kotawaringin Timur (Disamakan persis dengan AqiSurfaceLayer) [3]
const KWT_BOUNDS = {
    latMin: -3.35,  // Batas Selatan (Muara Mentaya Hilir Selatan / Laut Jawa)
    latMax: -1.15,  // Batas Utara (Kawasan Bukit Santuai)
    lngMin: 111.90, // Batas Barat (Perbatasan Seruyan)
    lngMax: 113.35  // Batas Timur (Perbatasan Katingan)
};

// ============================================================================
// ENGINE TUNING PARAMETERS (THE FLUID MAGIC)
// ============================================================================
const RESOLUTION = 50;           // Kerapatan Matriks Vektor (Dinaikkan agar belokan lebih halus)
const PARTICLE_COUNT = 600;      // Jumlah partikel (Dinaikkan agar layar tidak kosong saat angin pelan)
const PARTICLE_LIFESPAN = 350;   // Umur partikel (Diperpanjang agar jejak/ekor lebih panjang)
const VELOCITY_MULTIPLIER = 0.15; // Skala Pengali Kecepatan (Diturunkan drastis untuk menjinakkan "Blower")
const FADE_RATE = 0.04;          // Kecepatan Pudar Ekor Komet (Semakin kecil = ekor semakin panjang & mulus)

/**
 * ============================================================================
 * WIND FLOW LAYER (CUSTOM CANVAS PARTICLE ENGINE - CLIPPED)
 * ============================================================================
 * Menciptakan ilusi Fluid Dynamics (seperti IQAir) menggunakan HTML5 Canvas.
 * Seluruh pergerakan partikel angin dikunci rapi di dalam poligon Kabupaten Kotawaringin Timur.
 */
export default function WindFlowLayer({ companies }: WindFlowLayerProps) {
    const map = useMap();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationRef = useRef<number | null>(null);

    // Cache Memori untuk menahan bentuk koordinat piksel Kabupaten Kotim (Mencegah Lag 60FPS)
    const clipPathRef = useRef<Path2D | null>(null);

    // 1. Ekstrak Data Sensor Angin
    const windSensors = useMemo(() => {
        return companies.map(c => {
            const lat = parseFloat(c.lat);
            const lng = parseFloat(c.lng);
            if (isNaN(lat) || isNaN(lng)) return null;

            // Seed generator (Sama seperti AQI)
            const seed = Math.abs(Math.sin(lat) * Math.cos(lng));
            const wd = Math.floor(seed * 360);
            const ws = parseFloat((1.5 + (seed * 4)).toFixed(1)); // Dinamis antara 1.5 - 5.5 m/s

            return { lat, lng, wd, ws } as WindNode;
        }).filter(Boolean) as WindNode[];
    }, [companies]);

    // 2. PRE-COMPUTE VECTOR FIELD (O(1) Lookup untuk Animasi)
    const vectorField = useMemo(() => {
        if (windSensors.length === 0) return [];
        const grid = spatialMath.generateCanvasGrid(KWT_BOUNDS, RESOLUTION, RESOLUTION);

        return grid.map(pt => {
            const wind = spatialMath.interpolateWind(pt.lat, pt.lng, windSensors);
            const rad = (wind.wd * Math.PI) / 180;

            // KECEPATAN SANGAT DINAMIS: Tergantung murni dari interpolasi data wind.ws area tersebut
            const speed = wind.ws * VELOCITY_MULTIPLIER;

            return {
                u: Math.cos(rad) * speed,
                v: Math.sin(rad) * speed
            };
        });
    }, [windSensors]);

    // 3. LIFECYCLE ENGINE PARTIKEL CANVAS
    useEffect(() => {
        if (vectorField.length === 0) return;

        const canvas = document.createElement('canvas');
        canvas.className = 'leaflet-zoom-animated pointer-events-none mix-blend-screen';
        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.top = '0';
        // THE MAGIC FADE: Mengatur transisi CSS agar halus saat dimatikan/dihidupkan
        canvas.style.opacity = '0.7';
        canvas.style.transition = 'opacity 0.3s ease-in-out';

        map.getPanes().overlayPane.appendChild(canvas);
        canvasRef.current = canvas;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles: { x: number, y: number, age: number }[] = [];
        let isAnimating = true; // State Engine

        const syncCanvas = () => {
            const size = map.getSize();
            canvas.width = size.x;
            canvas.height = size.y;

            const topLeft = map.containerPointToLayerPoint([0, 0]);
            L.DomUtil.setPosition(canvas, topLeft);

            // ====================================================================
            // OPTIMASI KRITIS: GENERATE KOTIM PATH2D SAAT ZOOM / PAN (BUKAN DI RENDERING LOOP)
            // ====================================================================
            const path = new Path2D();
            const kecGeoJson = kecData as any;

            if (kecGeoJson && kecGeoJson.features) {
                kecGeoJson.features.forEach((feature: any) => {
                    const geometry = feature.geometry;
                    if (!geometry) return;

                    if (geometry.type === "Polygon") {
                        geometry.coordinates.forEach((ring: any[]) => {
                            ring.forEach((coord, i) => {
                                // Memetakan LatLng global ke piksel kontainer lokal Leaflet
                                const pt = map.latLngToContainerPoint([coord[1], coord[0]]);
                                if (i === 0) path.moveTo(pt.x, pt.y);
                                else path.lineTo(pt.x, pt.y);
                            });
                            path.closePath();
                        });
                    } else if (geometry.type === "MultiPolygon") {
                        geometry.coordinates.forEach((polygon: any[][]) => {
                            polygon.forEach((ring: any[]) => {
                                ring.forEach((coord, i) => {
                                    const pt = map.latLngToContainerPoint([coord[1], coord[0]]);
                                    if (i === 0) path.moveTo(pt.x, pt.y);
                                    else path.lineTo(pt.x, pt.y);
                                });
                                path.closePath();
                            });
                        });
                    }
                });
            }

            clipPathRef.current = path; // Simpan ke ref memori

            particles = Array.from({ length: PARTICLE_COUNT }).map(() => ({
                x: Math.random() * size.x,
                y: Math.random() * size.y,
                age: Math.random() * PARTICLE_LIFESPAN
            }));
        };

        // 4. THE FADE & PAUSE STRATEGY (LIFECYCLE HANDLERS)
        const handleMoveStart = () => {
            isAnimating = false;
            // Matikan engine animasi segera untuk membebaskan CPU
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
            // Memicu CSS transition fade-out
            canvas.style.opacity = '0';
        };

        const handleMoveEnd = () => {
            // Kalkulasi ulang layout
            syncCanvas();
            isAnimating = true;
            // Memicu CSS transition fade-in
            canvas.style.opacity = '0.7';
            // Start engine kembali
            render();
        };

        // Pasang pendengar event (Listener)
        map.on('movestart zoomstart', handleMoveStart);
        map.on('moveend zoomend', handleMoveEnd);

        // Inisialisasi Pertama
        syncCanvas();

        // 5. ANIMATION LOOP (60 FPS)
        const render = () => {
            // Guard clause: Cegah render jika sedang digeser atau kanvas hilang
            if (!isAnimating || !canvasRef.current) return;

            const width = canvas.width;
            const height = canvas.height;

            ctx.save(); // 1. Amankan state grafis awal sebelum dicip

            // ====================================================================
            // CLIPPING MASK EXECUTION (Akselerasi GPU Browser Tanpa Hambatan)
            // ====================================================================
            if (clipPathRef.current) {
                ctx.clip(clipPathRef.current); // Kunci rendering hanya di dalam poligon Kotim [3]
            }

            // Fading Tails menggunakan nilai FADE_RATE yang lebih rendah untuk jejak komet yang mulus
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = `rgba(0, 0, 0, ${FADE_RATE})`;
            ctx.fillRect(0, 0, width, height);

            ctx.globalCompositeOperation = 'source-over';
            ctx.lineWidth = 1.2; // Sedikit ditipiskan agar lebih elegan
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.lineCap = 'round';

            ctx.beginPath();

            particles.forEach(p => {
                if (p.age > PARTICLE_LIFESPAN) {
                    p.x = Math.random() * width;
                    p.y = Math.random() * height;
                    p.age = 0;
                }

                const pLatLng = map.containerPointToLatLng([p.x, p.y]);

                const gridX = Math.floor(((pLatLng.lng - KWT_BOUNDS.lngMin) / (KWT_BOUNDS.lngMax - KWT_BOUNDS.lngMin)) * RESOLUTION);
                const gridY = Math.floor(((KWT_BOUNDS.latMax - pLatLng.lat) / (KWT_BOUNDS.latMax - KWT_BOUNDS.latMin)) * RESOLUTION);

                if (gridX < 0 || gridX >= RESOLUTION || gridY < 0 || gridY >= RESOLUTION) {
                    p.age = PARTICLE_LIFESPAN + 1;
                    return;
                }

                const index = gridY * RESOLUTION + gridX;
                const vector = vectorField[index];

                if (!vector) return;

                ctx.moveTo(p.x, p.y);

                // Bergerak secara dinamis mengikuti arah (u,v) dengan kecepatan unik dari area tersebut
                p.x += vector.u + (Math.random() - 0.5) * 0.2;
                p.y += vector.v + (Math.random() - 0.5) * 0.2;
                p.age++;

                ctx.lineTo(p.x, p.y);
            });

            ctx.stroke();

            ctx.restore(); // 2. Kembalikan state grafis semula untuk urutan render berikutnya

            // Loop ke frame berikutnya
            animationRef.current = requestAnimationFrame(render);
        };

        render(); // Start engine

        // Cleanup
        return () => {
            isAnimating = false;
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            map.off('movestart zoomstart', handleMoveStart);
            map.off('moveend zoomend', handleMoveEnd);
            if (canvasRef.current && canvasRef.current.parentNode) {
                canvasRef.current.parentNode.removeChild(canvasRef.current);
            }
        };
    }, [vectorField, map]);

    return null;
}