// src/modules/admin/components/gis/LimbahMap.tsx
import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, FeatureGroup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSijagaStore } from '@/store/useSijagaStore';
import { useGisUIStore } from '@/store/useGisUIStore';

// --- Fix Leaflet Default Icon ---
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// FIXED: Ubah tipe data dari L.LatLngExpression menjadi tuple eksplisit [number, number]
const DEFAULT_CENTER: [number, number] = [-6.9147, 107.6098];

// Map Events Handler: Nangkep interaksi zoom/klik dari tombol MapHUD & Sinyal Spasial
function ExternalMapController() {
    const map = useMap();

    useEffect(() => {
        const handleZoomIn = () => map.zoomIn();
        const handleZoomOut = () => map.zoomOut();
        const handleResetView = () => map.setView(DEFAULT_CENTER, 12, { animate: true });

        // LOGIKA PENERBANGAN LOKASI ( GFWS Decoupled Event )
        const handleFlyToCoords = (e: Event) => {
            const customEvent = e as CustomEvent<{ lat: number; lng: number }>;
            const { lat, lng } = customEvent.detail;
            map.flyTo([lat, lng], 14, { animate: true, duration: 1.5 });
        };

        window.addEventListener('map-zoom-in', handleZoomIn);
        window.addEventListener('map-zoom-out', handleZoomOut);
        window.addEventListener('map-reset-view', handleResetView);
        window.addEventListener('map-fly-to-coords', handleFlyToCoords);

        return () => {
            window.removeEventListener('map-zoom-in', handleZoomIn);
            window.removeEventListener('map-zoom-out', handleZoomOut);
            window.removeEventListener('map-reset-view', handleResetView);
            window.removeEventListener('map-fly-to-coords', handleFlyToCoords);
        };
    }, [map]);
    return null;
}

// Map Click Handler: Buat unselect panel detail kalau user ngeklik ruang kosong di peta
function MapEventsHandler() {
    const { closePanel, selectedCompanyId } = useGisUIStore();
    useMapEvents({
        click: () => {
            if (selectedCompanyId) {
                // Cari dan tutup panel detail yang ID/type-nya detil-perusahaan
                closePanel("detil-perusahaan");
            }
        }
    });
    return null;
}

export default function LimbahMap() {
    const { companies } = useSijagaStore();
    const {
        activeLayers, activeBaseMap, mapOpacity,
        selectedCompanyId, setSelectedCompanyId, openPanel, closePanelsToTheRight
    } = useGisUIStore();

    // Mapping Perusahaan (Simulasi Koordinat & Poligon bounding box dari data asli)
    const companyPolygons = useMemo(() => {
        return companies
            .filter(c => c.status === "APPROVED")
            .map(c => {
                const lat = parseFloat(c.lat);
                const lng = parseFloat(c.lng);
                const offset = 0.0008; // Sekitar 80-100 meter bounding box

                // FIXED: Sekarang DEFAULT_CENTER adalah [number, number], sehingga TS tidak akan error
                const poly: [number, number][] = isNaN(lat) || isNaN(lng)
                    ? [DEFAULT_CENTER, DEFAULT_CENTER, DEFAULT_CENTER, DEFAULT_CENTER]
                    : [
                        [lat - offset, lng - offset],
                        [lat + offset, lng - offset],
                        [lat + offset, lng + offset],
                        [lat - offset, lng + offset],
                    ];

                // Format data sesuai warna GFW
                let style = { color: '#22c55e', fillColor: '#22c55e', layerId: 'layer-sppl' }; // Emerald
                if (c.docType === 'AMDAL') style = { color: '#ef4444', fillColor: '#ef4444', layerId: 'layer-amdal' }; // Red
                if (c.docType === 'UKL-UPL' || c.docType === 'UKL_UPL') style = { color: '#f59e0b', fillColor: '#f59e0b', layerId: 'layer-uklupl' }; // Amber

                return { ...c, polygon: poly, style };
            });
    }, [companies]);

    // Handler klik pada Poligon Perusahaan
    const handlePolygonClick = (c: any, e: L.LeafletMouseEvent) => {
        e.originalEvent.stopPropagation(); // Mencegah MapEventsHandler ikut kepanggil

        // Auto-pan peta ke tengah objek yang di klik
        const map = e.target._map;
        map.flyToBounds(e.target.getBounds(), { padding: [100, 100], duration: 1.5 });

        setSelectedCompanyId(c.id);
        closePanelsToTheRight(-1); // Bersihkan panel detail sebelumnya jika ada
        openPanel("detil-perusahaan", `Detail: ${c.companyName}`, c);
    };

    // Switch BaseMap URL
    const getTileUrl = () => {
        switch (activeBaseMap) {
            case 'satellite': return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
            case 'osm': return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
            case 'voyager':
            default: return "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
        }
    };

    const opacityRatio = mapOpacity / 100;

    return (
        // Pastikan ini absolut dan index rendah (Z-0) agar berada di bawah UI GFW
        <div className="absolute inset-0 z-0 bg-slate-100">
            <MapContainer
                center={DEFAULT_CENTER}
                zoom={12}
                zoomControl={false} // Dimatikan karena pakai MapHUD kustom
                style={{ height: '100%', width: '100%' }}
            >
                <ExternalMapController />
                <MapEventsHandler />

                <TileLayer url={getTileUrl()} />

                {/* LAYER: PERUSAHAAN TERDAFTAR (Sesuai Toggle) */}
                {companyPolygons.map(c => {
                    // Render hanya jika layer-nya sedang diaktifkan di panel
                    if (!activeLayers.includes(c.style.layerId)) return null;

                    const isSelected = selectedCompanyId === c.id;

                    return (
                        <Polygon
                            key={c.id}
                            positions={c.polygon}
                            pathOptions={{
                                color: isSelected ? '#ffffff' : c.style.color,
                                fillColor: c.style.fillColor,
                                fillOpacity: isSelected ? 0.7 : (0.4 * opacityRatio),
                                weight: isSelected ? 3 : 2,
                                dashArray: c.style.layerId === 'layer-amdal' ? '6,4' : undefined,
                            }}
                            eventHandlers={{ click: (e) => handlePolygonClick(c, e) }}
                        />
                    );
                })}

                {/* LAYER OVERLAY: DAS & SUNGAI */}
                {activeLayers.includes("overlay-das") && (
                    <FeatureGroup>
                        {[
                            { center: [-6.9147, 107.6098] as [number, number], r: 3500 },
                            { center: [-6.9388, 107.6255] as [number, number], r: 2800 },
                        ].map((c, i) => (
                            <Polygon
                                key={`das-${i}`}
                                positions={circleToPolygon(c.center, c.r, 36)}
                                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1 * opacityRatio, weight: 1.5, dashArray: '4,4' }}
                                interactive={false}
                            />
                        ))}
                    </FeatureGroup>
                )}

                {/* LAYER OVERLAY: ZONASI INDUSTRI */}
                {activeLayers.includes("overlay-rtrw") && (
                    <FeatureGroup>
                        {[
                            { center: [-6.8245, 107.6190] as [number, number], r: 2000 },
                            { center: [-6.9034, 107.6189] as [number, number], r: 2500 },
                        ].map((c, i) => (
                            <Polygon
                                key={`rtrw-${i}`}
                                positions={circleToPolygon(c.center, c.r, 36)}
                                pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.15 * opacityRatio, weight: 1.5, dashArray: '4,4' }}
                                interactive={false}
                            />
                        ))}
                    </FeatureGroup>
                )}

            </MapContainer>
        </div>
    );
}

// Helper: Bikin lingkaran pseudo-polygon (seperti kode bawaan)
function circleToPolygon(center: [number, number], radiusM: number, numPoints: number): [number, number][] {
    const earthRadius = 6371000;
    const lat = (center[0] * Math.PI) / 180;
    const lng = (center[1] * Math.PI) / 180;
    const d = radiusM / earthRadius;

    const points: [number, number][] = [];
    for (let i = 0; i < numPoints; i++) {
        const bearing = (2 * Math.PI * i) / numPoints;
        const latPoint = Math.asin(Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(bearing));
        const lngPoint = lng + Math.atan2(
            Math.sin(bearing) * Math.sin(d) * Math.cos(lat),
            Math.cos(d) - Math.sin(lat) * Math.sin(latPoint)
        );
        points.push([(latPoint * 180) / Math.PI, (lngPoint * 180) / Math.PI]);
    }
    return points;
}