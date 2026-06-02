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
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSijagaStore } from '@/store/useSijagaStore';
import { useGisUIStore } from '@/store/useGisUIStore';

// FASE 3 INJEKSI: Mengimpor fungsi otak analitik dan data batas wilayah (GeoJSON)
import { calculateCompaniesPerKecamatan } from '@/lib/spatialAnalytics';
import kecData from '@/assets/geojson/kotim-kecamatan.json';
import desaData from '@/assets/geojson/kotim-desa.json';

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
// 1. HELPERS & AQI RESOLVERS (SINKRON DENGAN BACKEND SERVICE)
// ============================================================================

// Generator AQI Spasial Realistis lokal berkinerja tinggi (mencegah bottleneck network)
const getSimulatedAqi = (latStr: string, lngStr: string): number => {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (isNaN(lat) || isNaN(lng)) return 35;
    const seed = Math.abs(Math.sin(lat) * Math.cos(lng));
    return Math.floor(25 + (seed * 60)); // Skala 25 - 85 (Baik - Sedang)
};

const getAqiColor = (aqi: number): string => {
    if (aqi <= 50) return '#10b981'; // Hijau (Baik)
    if (aqi <= 100) return '#f59e0b'; // Kuning/Amber (Sedang)
    if (aqi <= 150) return '#f97316'; // Oranye (Tidak Sehat Sensitif)
    if (aqi <= 200) return '#ef4444'; // Merah (Tidak Sehat)
    return '#7c3aed';                // Ungu (Sangat Berbahaya)
};

// ============================================================================
// 2. ICON GENERATORS
// ============================================================================

// A. Ikon Berkedip (Khusus Triage Admin & Auditor untuk memantau titik krisis)
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
        className: "custom-pulsing-marker-wrapper",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
};

// B. Ikon Statis Solid (Khusus Operasional Inspektur Lapangan) - Tanpa Animasi
const createStaticTaskIcon = (isUnknown: boolean) => {
    const bgColor = isUnknown ? "bg-rose-500" : "bg-emerald-500";
    return L.divIcon({
        html: `
            <div style="width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 9999px; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);" class="${bgColor}">
                <div style="width: 8px; height: 8px; border-radius: 9999px; background-color: white;"></div>
            </div>
        `,
        className: "custom-static-task-marker",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });
};

// C. NEW LOD FEATURE: Ikon Spasial Bullet Bulat Khusus Perusahaan (Zoom < 16) [3]
const createCompanyMarkerIcon = (score?: number | null, docType?: string) => {
    let colorClass = "bg-emerald-500";
    let ringClass = "border-emerald-200 bg-emerald-500/10";

    if (score !== undefined && score !== null) {
        if (score < 60) {
            colorClass = "bg-red-500";
            ringClass = "border-red-200 bg-red-500/10";
        } else if (score < 80) {
            colorClass = "bg-amber-500";
            ringClass = "border-amber-200 bg-amber-500/10";
        }
    } else if (docType === 'AMDAL') {
        colorClass = "bg-red-500";
        ringClass = "border-red-200 bg-red-500/10";
    }

    return L.divIcon({
        html: `
            <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
                <span class="absolute inline-flex h-5 w-5 rounded-full border ${ringClass}"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 ${colorClass} border border-white"></span>
            </div>
        `,
        className: "custom-company-marker-wrapper",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });
};

// ============================================================================
// 3. MAP EVENT CONTROLLERS
// ============================================================================

function ExternalMapController() {
    const map = useMap();

    useEffect(() => {
        const handleZoomIn = () => map.zoomIn();
        const handleZoomOut = () => map.zoomOut();
        const handleResetView = () => map.setView(DEFAULT_CENTER, 9, { animate: true }); // Reset view otomatis disesuaikan ke zoom 9 Kotim

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

// NEW LOD COMPONENT: Pendengar Perubahan Tingkat Zoom Kamera secara Real-time [3]
function MapZoomListener({ onChange }: { onChange: (zoom: number) => void }) {
    const map = useMap();

    useMapEvents({
        zoomend: () => {
            onChange(map.getZoom());
        }
    });

    useEffect(() => {
        onChange(map.getZoom());
    }, [map, onChange]);

    return null;
}

function MapEventsHandler() {
    const { closePanel } = useGisUIStore();
    useMapEvents({
        click: () => {
            closePanel("detil-perusahaan");
            closePanel("detail-tugas");
        }
    });
    return null;
}

// ============================================================================
// 4. MAIN MAP COMPONENT
// ============================================================================

export default function LimbahMap() {
    const { companies, adminReports, fetchAdminReports, currentUser, inspections } = useSijagaStore();
    const {
        activeLayers, activeBaseMap, mapOpacity,
        selectedCompanyId, setSelectedCompanyId, openPanel, closePanelsToTheRight,
        activeAdminBoundary, showImpactRadius, activePanels
    } = useGisUIStore();

    // STATE LOKAL: Menyimpan tingkat zoom kamera saat ini untuk komputasi LOD [3]
    const [currentZoom, setCurrentZoom] = useState(9);

    // SINKRONISASI DATA AMAN (RBAC GUARD): Hanya izinkan memuat arsip aduan untuk Admin DLH & Super Admin [3]
    useEffect(() => {
        if (currentUser && (currentUser.role === "ADMIN_DLH" || currentUser.role === "SUPER_ADMIN")) {
            if (adminReports.length === 0) {
                fetchAdminReports();
            }
        }
    }, [adminReports.length, fetchAdminReports, currentUser]);

    const isOfficer = currentUser?.role === "PETUGAS_LAPANGAN";

    // ------------------------------------------------------------------------
    // FASE 4: SPATIAL INVERTED MASKING LOGIC (Meredupkan Luar Batas Kotim) [1][3]
    // ------------------------------------------------------------------------
    const invertedKotimMask = useMemo(() => {
        const kecGeoJson = kecData as any;
        if (!kecGeoJson || !kecGeoJson.features) return null;

        const worldOuterBounds: [number, number][] = [
            [90, -180],
            [90, 180],
            [-90, 180],
            [-90, -180],
            [90, -180]
        ];

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

    // ------------------------------------------------------------------------
    // FASE 3: CHOROPLETH LOGIC (Kepadatan Industri per Kecamatan)
    // ------------------------------------------------------------------------
    const kecamatanCounts = useMemo(() => {
        if (activeAdminBoundary !== 'kecamatan') return {};
        return calculateCompaniesPerKecamatan(companies, kecData as any);
    }, [companies, activeAdminBoundary]);

    const getKecamatanColor = (kecName: string) => {
        const count = kecamatanCounts[kecName] || 0;
        return count > 50 ? '#800026' :
            count > 20 ? '#BD0026' :
                count > 10 ? '#E31A1C' :
                    count > 5 ? '#FC4E2A' :
                        count > 0 ? '#FD8D3C' :
                            '#FFEDA0';
    };

    const geoJsonKecStyle = (feature: any) => {
        const kecName = feature.properties?.WADMKC;
        return {
            fillColor: getKecamatanColor(kecName),
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.6 * (mapOpacity / 100)
        };
    };

    const geoJsonDesaStyle = {
        fillColor: '#3b82f6',
        weight: 1,
        opacity: 1,
        color: '#1e3a8a',
        fillOpacity: 0.15 * (mapOpacity / 100)
    };

    // ------------------------------------------------------------------------
    // FASE 3: IMPACT RADIUS LOGIC (Lingkaran Bencana)
    // ------------------------------------------------------------------------
    const activeTaskPanel = activePanels.find(p => p.type === 'detail-tugas' || p.type === 'detil-perusahaan');
    const activeLat = parseFloat(activeTaskPanel?.data?.lat);
    const activeLng = parseFloat(activeTaskPanel?.data?.lng);
    const impactCenter: [number, number] | null = (!isNaN(activeLat) && !isNaN(activeLng)) ? [activeLat, activeLng] : null;

    // ------------------------------------------------------------------------
    // DATA LAYER A: POLIGON INDUSTRI (Hanya untuk Admin & Auditor)
    // ------------------------------------------------------------------------
    const companyPolygons = useMemo(() => {
        if (isOfficer) return [];

        let contextualCompanies = currentUser?.role === "AUDITOR"
            ? companies.filter(c => c.status === "APPROVED")
            : companies;

        return contextualCompanies.map(c => {
            const lat = parseFloat(c.lat);
            const lng = parseFloat(c.lng);
            const offset = 0.0008;

            const poly: [number, number][] = isNaN(lat) || isNaN(lng)
                ? [DEFAULT_CENTER, DEFAULT_CENTER, DEFAULT_CENTER, DEFAULT_CENTER]
                : [
                    [lat - offset, lng - offset], [lat + offset, lng - offset],
                    [lat + offset, lng + offset], [lat - offset, lng + offset],
                ];

            let style = { color: '#22c55e', fillColor: '#22c55e', layerId: 'layer-sppl' };
            if (c.status === "PENDING" || c.status === "REVIEW") style = { color: '#3b82f6', fillColor: '#3b82f6', layerId: 'layer-sppl' };
            else if (c.status === "SUSPENDED" || c.status === "REJECTED") style = { color: '#64748b', fillColor: '#64748b', layerId: 'layer-sppl' };
            else {
                if (c.docType === 'AMDAL') style = { color: '#ef4444', fillColor: '#ef4444', layerId: 'layer-amdal' };
                else if (c.docType === 'UKL-UPL' || c.docType === 'UKL_UPL') style = { color: '#f59e0b', fillColor: '#f59e0b', layerId: 'layer-uklupl' };
            }
            return { ...c, polygon: poly, style };
        });
    }, [companies, currentUser, isOfficer]);

    // ------------------------------------------------------------------------
    // DATA LAYER B: TITIK TUGAS SOLID (Hanya untuk Inspektur Lapangan)
    // ------------------------------------------------------------------------
    const officerTasks = useMemo(() => {
        if (!isOfficer) return [];

        const userId = currentUser?.id;
        const officerId = currentUser?.officerId;

        const activeTasks = inspections.filter(
            (i) => (i.inspectorId === userId || i.inspectorId === officerId) && i.status === "Terjadwal"
        );

        return activeTasks.map(task => {
            let lat = NaN, lng = NaN;
            const isUnknown = task.companyId === "COM-UNKNOWN";

            if (isUnknown && task.location.includes(",")) {
                const coords = task.location.split(",");
                lat = parseFloat(coords[0]);
                lng = parseFloat(coords[1]);
            } else {
                const comp = companies.find((c) => c.id === task.companyId);
                if (comp) {
                    lat = parseFloat(comp.lat);
                    lng = parseFloat(comp.lng);
                }
            }

            return { ...task, lat, lng, isUnknown };
        }).filter(t => !isNaN(t.lat) && !isNaN(t.lng));
    }, [inspections, currentUser, companies, isOfficer]);

    // ------------------------------------------------------------------------
    // EVENT HANDLERS
    // ------------------------------------------------------------------------
    const handlePolygonClick = (c: any, e: L.LeafletMouseEvent) => {
        e.originalEvent.stopPropagation();
        e.target._map.flyToBounds(e.target.getBounds(), { padding: [100, 100], duration: 1.5 });
        setSelectedCompanyId(c.id);
        closePanelsToTheRight(-1);
        openPanel("detil-perusahaan", `Detail: ${c.companyName}`, c);
    };

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

        if (!task.isUnknown) setSelectedCompanyId(task.companyId);
        else setSelectedCompanyId(null);

        closePanelsToTheRight(-1);
        openPanel("detail-tugas", `Sidak: ${task.id}`, task);
    };

    const getTileUrl = () => {
        switch (activeBaseMap) {
            case 'satellite': return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
            case 'osm': return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
            case 'voyager':
            default: return "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
        }
    };

    return (
        <div className="absolute inset-0 z-0 bg-slate-100">
            <MapContainer
                center={DEFAULT_CENTER}
                zoom={9}
                zoomControl={false}
                style={{ height: '100%', width: '100%' }}
            >
                <ExternalMapController />
                <MapZoomListener onChange={setCurrentZoom} />
                <MapEventsHandler />

                <TileLayer url={getTileUrl()} />

                {/* 🌑 FASE 4 RENDER: INVERTED POLYGON MASK (REDUPKAN WILAYAH LUAR KOTIM) [1][3] */}
                {invertedKotimMask && (
                    <Polygon
                        positions={invertedKotimMask}
                        pathOptions={{
                            color: "#0f172a",
                            fillColor: "#0f172a",
                            fillOpacity: 0.75,
                            weight: 1,
                            opacity: 0.2,
                            interactive: false
                        }}
                    />
                )}

                {/* 🔴 FASE 3 RENDER: BATAS KECAMATAN (CHOROPLETH) */}
                {activeAdminBoundary === 'kecamatan' && (
                    <GeoJSON
                        key={`kec-${mapOpacity}`}
                        data={kecData as any}
                        style={geoJsonKecStyle}
                    />
                )}

                {/* 🔴 FASE 3 RENDER: BATAS DESA */}
                {activeAdminBoundary === 'desa' && (
                    <GeoJSON
                        key={`desa-${mapOpacity}`}
                        data={desaData as any}
                        style={geoJsonDesaStyle}
                    />
                )}

                {/* 🔴 FASE 3 RENDER: IMPACT RADIUS (Cincin Bencana 5 KM) */}
                {showImpactRadius && impactCenter && (
                    <Circle
                        center={impactCenter}
                        radius={5000}
                        pathOptions={{
                            color: '#ef4444',
                            fillColor: '#ef4444',
                            fillOpacity: 0.15,
                            weight: 2,
                            dashArray: '8, 8'
                        }}
                    >
                        <Popup>
                            <span className="text-xs font-bold text-rose-700">Radius Dampak 5 KM</span>
                        </Popup>
                    </Circle>
                )}

                {/* 🟢 [NEW LAYER RENDER] RENDER 4: AIR QUALITY INDEX (AQI) OVERLAY CIRCLES (RADIAL ATMOSPHERE) [3] */}
                {activeLayers.includes("layer-aqi") && companies.map(c => {
                    const lat = parseFloat(c.lat);
                    const lng = parseFloat(c.lng);
                    if (isNaN(lat) || isNaN(lng)) return null;

                    const aqi = getSimulatedAqi(c.lat, c.lng);
                    const color = getAqiColor(aqi);

                    return (
                        <Circle
                            key={`aqi-circle-${c.id}`}
                            center={[lat, lng]}
                            radius={1500} // Radius Efektif 1.5 KM
                            pathOptions={{
                                color: color,
                                fillColor: color,
                                fillOpacity: 0.25 * (mapOpacity / 100),
                                weight: 1.5,
                                dashArray: "4, 6"
                            }}
                        >
                            <Popup>
                                <div className="text-left font-sans p-1.5 space-y-1.5 min-w-[160px]">
                                    <div className="flex justify-between items-center border-b pb-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kualitas Udara</span>
                                        <span className="text-[8px] font-black text-slate-400 font-mono">1.5 KM ZONE</span>
                                    </div>
                                    <h4 className="font-black text-slate-800 text-xs leading-none uppercase">{c.companyName}</h4>

                                    <div className="space-y-1 pt-1 text-[11px] font-semibold text-slate-600">
                                        <div className="flex justify-between border-b border-slate-100 pb-0.5">
                                            <span>Skor AQI:</span>
                                            <span className="font-black font-mono" style={{ color }}>{aqi}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-100 pb-0.5">
                                            <span>Status:</span>
                                            <span className="font-bold uppercase text-[9px]" style={{ color }}>
                                                {aqi <= 50 ? 'Baik (Sehat)' : 'Sedang (Waspada)'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-100 pb-0.5">
                                            <span>Suhu Area:</span>
                                            <span className="font-bold text-slate-800">{Math.floor(28 + (aqi % 5))} °C</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Polutan:</span>
                                            <span className="font-black text-slate-800 text-[10px]">{aqi > 50 ? 'PM2.5 (Debu)' : 'CO (Karbon)'}</span>
                                        </div>
                                    </div>
                                </div>
                            </Popup>
                        </Circle>
                    );
                })}

                {/* 🟢 RENDER 1.1 (LOD DETIL): POLIGON INDUSTRI - HANYA RENDERING JIKA ZOOM >= 16 [3] */}
                {!isOfficer && currentZoom >= 16 && companyPolygons.map(c => {
                    if (!activeLayers.includes(c.style.layerId)) return null;
                    const isSelected = selectedCompanyId === c.id;
                    return (
                        <Polygon
                            key={c.id}
                            positions={c.polygon}
                            pathOptions={{
                                color: isSelected ? '#ffffff' : c.style.color,
                                fillColor: c.style.fillColor,
                                fillOpacity: isSelected ? 0.7 : (0.4 * (mapOpacity / 100)),
                                weight: isSelected ? 3 : 2,
                                dashArray: c.style.layerId === 'layer-amdal' ? '6,4' : undefined,
                            }}
                            eventHandlers={{ click: (e) => handlePolygonClick(c, e) }}
                        />
                    );
                })}

                {/* 🟢 RENDER 1.2 (LOD MAKRO): MARKER INDUSTRI SOLID - RENDERING HANYA JIKA ZOOM < 16 [3] */}
                {!isOfficer && currentZoom < 16 && companies.map(c => {
                    const layerId = c.docType === 'AMDAL' ? 'layer-amdal' :
                        (c.docType === 'UKL-UPL' || c.docType === 'UKL_UPL') ? 'layer-uklupl' :
                            'layer-sppl';

                    if (!activeLayers.includes(layerId)) return null;

                    const lat = parseFloat(c.lat);
                    const lng = parseFloat(c.lng);
                    if (isNaN(lat) || isNaN(lng)) return null;

                    return (
                        <Marker
                            key={`comp-marker-${c.id}`}
                            position={[lat, lng]}
                            icon={createCompanyMarkerIcon(c.score, c.docType)}
                            eventHandlers={{
                                click: (e) => {
                                    e.originalEvent.stopPropagation();
                                    setSelectedCompanyId(c.id);
                                    closePanelsToTheRight(-1);
                                    openPanel("detil-perusahaan", `Detail Industri`, c);
                                }
                            }}
                        />
                    );
                })}

                {/* RENDER 2: PIN PENGADUAN KELIP KELIP (ADMIN / AUDITOR TRIAGE) */}
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

                {/* RENDER 3: PIN TUGAS SOLID (HANYA UNTUK INSPEKTUR) */}
                {isOfficer && officerTasks.map((task) => (
                    <Marker
                        key={`task-${task.id}`}
                        position={[task.lat, task.lng]}
                        icon={createStaticTaskIcon(task.isUnknown)}
                        eventHandlers={{ click: (e) => handleTaskMarkerClick(task, e) }}
                    />
                ))}

            </MapContainer>
        </div>
    );
}