// src/modules/admin/components/gis/LimbahMap.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
    MapContainer,
    TileLayer,
    Polygon,
    Marker,
    Popup,
    GeoJSON,
    Circle,
    useMap,
    useMapEvents
} from 'react-leaflet';
// IMPORT BARU: Modul Clustering
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSijagaStore } from '@/store/useSijagaStore';
import { useGisUIStore } from '@/store/useGisUIStore';

// Modul Analitik & GeoJSON Wilayah
import { calculateCompaniesPerKecamatan } from '@/lib/spatialAnalytics';
import kecData from '@/assets/geojson/kotim-kecamatan.json';
import desaData from '@/assets/geojson/kotim-desa.json';

// Engine Matematika Spasial (Gradient Color)
import { spatialMath } from '@/lib/spatialMath';

// --- MODUL LAYER TERISOLASI (HIGH COHESION) ---
import AqiSurfaceLayer from './layers/AqiSurfaceLayer';
import WindFlowLayer from './layers/WindFlowLayer';
import CompanyMarkerLayer from './layers/CompanyMarkerLayer';
import AqiHorizontalLegend from './AqiHorizontalLegend';
import { Sparkles } from 'lucide-react'; // INJEKSI ICON AI

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

// PUSAT PETA DIKUNCI DI KOTA SAMPIT (KOTAWARINGIN TIMUR)
const DEFAULT_CENTER: [number, number] = [-2.5337, 112.9515];

// ============================================================================
// HELPERS & ICONS GENERATORS
// ============================================================================

const getSimulatedAqi = (lat: number, lng: number): number => {
    if (isNaN(lat) || isNaN(lng)) return 35;
    const seed = Math.abs(Math.sin(lat) * Math.cos(lng));
    return Math.floor(25 + (seed * 60)); // Skala 25 - 85 (Baik - Sedang)
};

const createAqiBadgeIcon = (aqi: number, bgColorRgb: string, isCluster: boolean = false) => {
    const textColor = (aqi > 50 && aqi <= 100) ? '#0f172a' : '#ffffff';
    const size = isCluster ? 38 : 32;
    const fontSize = isCluster ? '13px' : '11px';

    return L.divIcon({
        html: `
            <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
                <span class="relative flex rounded-full h-full w-full border-2 border-white shadow-md items-center justify-center font-mono font-black select-none transition-colors" style="background-color: ${bgColorRgb}; color: ${textColor}; font-size: ${fontSize};">
                    ${Math.round(aqi)}
                </span>
            </div>
        `,
        className: "custom-aqi-numeric-badge bg-transparent border-none",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
    });
};

const createClusterCustomIcon = function (cluster: any) {
    const childMarkers = cluster.getAllChildMarkers();

    let sumAqi = 0;
    let validCount = 0;

    childMarkers.forEach((marker: any) => {
        if (marker.options && marker.options.aqiData !== undefined) {
            sumAqi += marker.options.aqiData;
            validCount++;
        }
    });

    const avgAqi = validCount > 0 ? sumAqi / validCount : 0;
    const [r, g, b] = spatialMath.interpolateColorRgb(avgAqi);
    const bgColorRgb = `rgb(${r}, ${g}, ${b})`;

    return createAqiBadgeIcon(avgAqi, bgColorRgb, true);
};

const createPulsingIcon = (status: string) => {
    let colorClass = "bg-rose-600";
    let ringClass = "bg-rose-500 animate-ping";

    if (status === "RESOLVED") {
        colorClass = "bg-teal-600";
        ringClass = "bg-teal-400";
    } else if (status === "INVESTIGATING") {
        colorClass = "bg-indigo-600";
        ringClass = "bg-indigo-400 animate-pulse";
    }

    return L.divIcon({
        html: `
            <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
                <span class="absolute inline-flex h-6 w-6 rounded-full ${ringClass} opacity-75"></span>
                <span class="relative inline-flex rounded-full h-4.5 w-4.5 ${colorClass} border-2 border-white shadow-md flex items-center justify-center">
                    <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
                </span>
            </div>
        `,
        className: "custom-pulsing-marker-wrapper bg-transparent border-none",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
};

const createStaticTaskIcon = (isUnknown: boolean) => {
    const bgColor = isUnknown ? "bg-rose-500" : "bg-emerald-500";
    return L.divIcon({
        html: `
            <div style="width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 9999px; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);" class="${bgColor}">
                <div style="width: 8px; height: 8px; border-radius: 9999px; background-color: white;"></div>
            </div>
        `,
        className: "custom-static-task-marker bg-transparent border-none",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });
};

// ============================================================================
// MAP EVENT CONTROLLERS
// ============================================================================

function ExternalMapController() {
    const map = useMap();
    useEffect(() => {
        const handleZoomIn = () => map.zoomIn();
        const handleZoomOut = () => map.zoomOut();
        const handleResetView = () => map.setView(DEFAULT_CENTER, 9, { animate: true });

        const handleFlyToCoords = (e: Event) => {
            const customEvent = e as CustomEvent<{ lat: number; lng: number }>;
            const { lat, lng } = customEvent.detail;
            map.flyTo([lat, lng], 16, { animate: true, duration: 1.5 });
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

/**
 * MapZoomListener (Modified)
 * Menangkap event zoomend Leaflet dan men-sinkronkannya langsung ke Zustand Store [3]
 */
function MapZoomListener({ onChange }: { onChange: (zoom: number) => void }) {
    const map = useMap();
    const { setMapZoom } = useGisUIStore(); // INJEKSI: Mengambil fungsi setMapZoom global

    useMapEvents({
        zoomend: () => {
            const zoomLevel = map.getZoom();
            onChange(zoomLevel);
            setMapZoom(zoomLevel); // Sinkronisasi reaktif setiap kali user melakukan zoom-in/out [3]
        }
    });

    useEffect(() => {
        const initialZoom = map.getZoom();
        onChange(initialZoom);
        setMapZoom(initialZoom); // Sinkronisasi saat inisialisasi awal render peta [3]
    }, [map, onChange, setMapZoom]);

    return null;
}

function MapEventsHandler() {
    const { closePanel, setMapCenter } = useGisUIStore();
    useMapEvents({
        click: () => {
            closePanel("detil-perusahaan");
            closePanel("detail-tugas");
            closePanel("telemetri-lingkungan");
        },
        moveend: (e) => {
            const center = e.target.getCenter();
            setMapCenter([center.lat, center.lng]); // Sinkronisasi koordinat global untuk AI [3]
        }
    });
    return null;
}

// ============================================================================
// MAIN MAP COMPONENT
// ============================================================================

export default function LimbahMap() {
    const { companies, adminReports, fetchAdminReports, currentUser, inspections } = useSijagaStore();
    const {
        activeLayers, activeBaseMap, mapOpacity, maskOpacity,
        setSelectedCompanyId, openPanel, closePanelsToTheRight,
        activeAdminBoundary, showImpactRadius, activePanels
    } = useGisUIStore();

    const [currentZoom, setCurrentZoom] = useState(9);

    useEffect(() => {
        if (currentUser && (currentUser.role === "ADMIN_DLH" || currentUser.role === "SUPER_ADMIN")) {
            if (adminReports.length === 0) fetchAdminReports();
        }
    }, [adminReports.length, fetchAdminReports, currentUser]);

    const isOfficer = currentUser?.role === "PETUGAS_LAPANGAN";
    const isExecutive = currentUser?.role === "AUDITOR" || currentUser?.role === "ADMIN_DLH" || currentUser?.role === "SUPER_ADMIN";

    const getTileUrl = () => {
        switch (activeBaseMap) {
            case 'dark': return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
            case 'satellite': return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
            case 'street': return "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
            case 'esri': return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
            case 'osm': return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
            case 'voyager':
            default: return "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
        }
    };

    const invertedKotimMask = useMemo(() => {
        const kecGeoJson = kecData as any;
        if (!kecGeoJson || !kecGeoJson.features) return null;

        const worldOuterBounds: [number, number][] = [[90, -180], [90, 180], [-90, 180], [-90, -180], [90, -180]];
        const innerHoles: [number, number][][] = [];

        kecGeoJson.features.forEach((feature: any) => {
            const geometry = feature.geometry;
            if (!geometry) return;

            if (geometry.type === "Polygon") {
                geometry.coordinates.forEach((ring: any[]) => {
                    const latLngRing = ring.map(coord => [coord[1], coord[0]] as [number, number]);
                    innerHoles.push(latLngRing);
                });
            } else if (geometry.type === "MultiPolygon") {
                geometry.coordinates.forEach((polygon: any[][]) => {
                    polygon.forEach((ring: any[]) => {
                        const latLngRing = ring.map(coord => [coord[1], coord[0]] as [number, number]);
                        innerHoles.push(latLngRing);
                    });
                });
            }
        });

        return [worldOuterBounds, ...innerHoles] as any;
    }, []);

    const kecamatanCounts = useMemo(() => {
        if (activeAdminBoundary !== 'kecamatan') return {};
        return calculateCompaniesPerKecamatan(companies, kecData as any);
    }, [companies, activeAdminBoundary]);

    const getKecamatanColor = (kecName: string) => {
        const count = kecamatanCounts[kecName] || 0;
        return count > 50 ? '#800026' : count > 20 ? '#BD0026' : count > 10 ? '#E31A1C' : count > 5 ? '#FC4E2A' : count > 0 ? '#FD8D3C' : '#FFEDA0';
    };

    const geoJsonKecStyle = (feature: any) => ({
        fillColor: getKecamatanColor(feature.properties?.WADMKC),
        weight: 2, opacity: 1, color: 'white', dashArray: '3',
        fillOpacity: 0.6 * (mapOpacity / 100)
    });

    const geoJsonDesaStyle = {
        fillColor: '#3b82f6', weight: 1, opacity: 1, color: '#1e3a8a',
        fillOpacity: 0.15 * (mapOpacity / 100)
    };

    const activeTaskPanel = activePanels.find(p => p.type === 'detail-tugas' || p.type === 'detil-perusahaan' || p.type === 'telemetri-lingkungan');
    const impactCenter: [number, number] | null = (!isNaN(parseFloat(activeTaskPanel?.data?.lat)) && !isNaN(parseFloat(activeTaskPanel?.data?.lng)))
        ? [parseFloat(activeTaskPanel?.data?.lat), parseFloat(activeTaskPanel?.data?.lng)]
        : null;

    const officerTasks = useMemo(() => {
        if (!isOfficer) return [];
        const userId = currentUser?.id;
        const officerId = currentUser?.officerId;

        return inspections
            .filter((i) => (i.inspectorId === userId || i.inspectorId === officerId) && i.status === "Terjadwal")
            .map(task => {
                let lat = NaN, lng = NaN;
                const isUnknown = task.companyId === "COM-UNKNOWN";
                if (isUnknown && task.location.includes(",")) {
                    const coords = task.location.split(",");
                    lat = parseFloat(coords[0]);
                    lng = parseFloat(coords[1]);
                } else {
                    const comp = companies.find((c) => c.id === task.companyId);
                    if (comp) { lat = parseFloat(comp.lat); lng = parseFloat(comp.lng); }
                }
                return { ...task, lat, lng, isUnknown };
            }).filter(t => !isNaN(t.lat) && !isNaN(t.lng));
    }, [inspections, currentUser, companies, isOfficer]);

    const handleReportClick = (report: any, e: L.LeafletMouseEvent) => {
        e.originalEvent.stopPropagation();
        e.target._map.flyTo([parseFloat(report.lat), parseFloat(report.lng)], 16, { animate: true, duration: 1.5 });
        setSelectedCompanyId(null);
        closePanelsToTheRight(-1);
        openPanel("detail-tugas", `Investigasi: ${report.trackingId}`, report);
    };

    const handleTaskMarkerClick = (task: any, e: L.LeafletMouseEvent) => {
        e.originalEvent.stopPropagation();
        e.target._map.flyTo([task.lat, task.lng], 16, { animate: true, duration: 1.5 });
        setSelectedCompanyId(task.isUnknown ? null : task.companyId);
        closePanelsToTheRight(-1);
        openPanel("detail-tugas", `Sidak: ${task.id}`, task);
    };

    return (
        <div className="absolute inset-0 z-0 bg-slate-100">
            {/* FLOATING ACTION BUTTON AI COPILOT (Hanya untuk Eksekutif) */}
            {isExecutive && (
                <div className="absolute top-[88px] right-6 z-[1000]">
                    <button
                        onClick={() => openPanel('ai-copilot', 'AI Spatial Assistant')}
                        className="group relative flex items-center justify-center w-12 h-12 bg-slate-900 border border-emerald-500 hover:bg-emerald-600 transition-all rounded-none shadow-[0_0_15px_rgba(16,185,129,0.5)] outline-none overflow-hidden"
                    >
                        {/* Radar Scan Effect */}
                        <div className="absolute inset-0 bg-emerald-400/20 animate-ping rounded-full opacity-0 group-hover:opacity-100" />
                        <Sparkles size={20} className="text-emerald-400 group-hover:text-white transition-colors relative z-10" />

                        {/* Tooltip Hover Kaku */}
                        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-900 border border-slate-700 text-emerald-400 text-[9px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-none shadow-xl">
                            AI Forensik Scan
                        </div>
                    </button>
                </div>
            )}

            <MapContainer
                center={DEFAULT_CENTER}
                zoom={9}
                zoomControl={false}
                style={{ height: '100%', width: '100%' }}
                maxZoom={18}
            >
                <ExternalMapController />
                <MapZoomListener onChange={setCurrentZoom} />
                <MapEventsHandler />

                <TileLayer url={getTileUrl()} />

                {invertedKotimMask && (
                    <Polygon
                        positions={invertedKotimMask}
                        pathOptions={{
                            color: "#0f172a",
                            fillColor: "#0f172a",
                            fillOpacity: maskOpacity / 100,
                            weight: 1,
                            opacity: 0.2,
                            interactive: false
                        }}
                    />
                )}

                {activeAdminBoundary === 'kecamatan' && (
                    <GeoJSON key={`kec-${mapOpacity}`} data={kecData as any} style={geoJsonKecStyle} />
                )}
                {activeAdminBoundary === 'desa' && (
                    <GeoJSON key={`desa-${mapOpacity}`} data={desaData as any} style={geoJsonDesaStyle} />
                )}

                {showImpactRadius && impactCenter && (
                    <Circle
                        center={impactCenter}
                        radius={5000}
                        pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.15, weight: 2, dashArray: '8, 8' }}
                    >
                        <Popup><span className="text-xs font-bold text-rose-700">Radius Dampak 5 KM</span></Popup>
                    </Circle>
                )}

                {!isOfficer && activeLayers.includes("layer-aqi") && (
                    <AqiSurfaceLayer companies={companies} mapOpacity={mapOpacity} />
                )}

                {!isOfficer && activeLayers.includes("layer-aqi") && (
                    <WindFlowLayer companies={companies} />
                )}

                <CompanyMarkerLayer
                    companies={companies}
                    currentZoom={currentZoom}
                    mapOpacity={mapOpacity}
                    isOfficer={isOfficer}
                />

                {!isOfficer && activeLayers.includes("layer-aqi") && (
                    <MarkerClusterGroup
                        chunkedLoading
                        iconCreateFunction={createClusterCustomIcon}
                        maxClusterRadius={60}
                        spiderfyOnMaxZoom={true}
                    >
                        {companies.map(c => {
                            const lat = parseFloat(c.lat);
                            const lng = parseFloat(c.lng);
                            if (isNaN(lat) || isNaN(lng)) return null;

                            const aqi = getSimulatedAqi(lat, lng);
                            const [r, g, b] = spatialMath.interpolateColorRgb(aqi);
                            const bgColorRgb = `rgb(${r}, ${g}, ${b})`;

                            return (
                                <Marker
                                    key={`aqi-num-badge-${c.id}`}
                                    position={[lat, lng]}
                                    {...{ aqiData: aqi }}
                                    icon={createAqiBadgeIcon(aqi, bgColorRgb, false)}
                                    eventHandlers={{
                                        click: (e) => {
                                            e.originalEvent.stopPropagation();

                                            if (currentZoom >= 16) {
                                                e.target._map.flyToBounds(e.target.getBounds(), { padding: [100, 100], duration: 1.5 });
                                            } else {
                                                e.target._map.flyTo([lat, lng], 16, { animate: true, duration: 1.5 });
                                            }

                                            setSelectedCompanyId(c.id);
                                            closePanelsToTheRight(-1);
                                            openPanel("detil-perusahaan", `Detail Industri`, c);
                                            openPanel("telemetri-lingkungan", `Telemetri Spasial`, c);
                                        }
                                    }}
                                />
                            );
                        })}
                    </MarkerClusterGroup>
                )}

                {!isOfficer && activeLayers.includes("layer-complaints") &&
                    adminReports.map((report) => {
                        const latNum = parseFloat(report.lat);
                        const lngNum = parseFloat(report.lng);
                        if (isNaN(latNum) || isNaN(lngNum)) return null;

                        return (
                            <Marker
                                key={report.id}
                                position={[latNum, lngNum]}
                                icon={createPulsingIcon(report.status)}
                                eventHandlers={{ click: (e) => handleReportClick(report, e) }}
                            />
                        );
                    })
                }

                {isOfficer && officerTasks.map((task) => (
                    <Marker
                        key={`task-${task.id}`}
                        position={[task.lat, task.lng]}
                        icon={createStaticTaskIcon(task.isUnknown)}
                        eventHandlers={{ click: (e) => handleTaskMarkerClick(task, e) }}
                    />
                ))}

            </MapContainer>

            {!isOfficer && <AqiHorizontalLegend />}
        </div>
    );
}