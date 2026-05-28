// src/modules/admin/components/gis/LimbahMap.tsx
import React, { useEffect, useMemo } from 'react';
import {
    MapContainer,
    TileLayer,
    Polygon,
    FeatureGroup,
    Marker,
    Popup,
    useMap,
    useMapEvents
} from 'react-leaflet';
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

const DEFAULT_CENTER: [number, number] = [-6.9147, 107.6098];

// ============================================================================
// 1. ICON GENERATORS
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

// ============================================================================
// 2. MAP EVENT CONTROLLERS
// ============================================================================

function ExternalMapController() {
    const map = useMap();

    useEffect(() => {
        const handleZoomIn = () => map.zoomIn();
        const handleZoomOut = () => map.zoomOut();
        const handleResetView = () => map.setView(DEFAULT_CENTER, 12, { animate: true });

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

function MapEventsHandler() {
    const { closePanel } = useGisUIStore();
    useMapEvents({
        click: () => {
            // Tutup semua panel melayang jika area kosong peta diklik
            closePanel("detil-perusahaan");
            closePanel("detail-tugas");
        }
    });
    return null;
}

// ============================================================================
// 3. MAIN COMPONENT
// ============================================================================

export default function LimbahMap() {
    const { companies, adminReports, fetchAdminReports, currentUser, inspections } = useSijagaStore();
    const {
        activeLayers, activeBaseMap, mapOpacity,
        selectedCompanyId, setSelectedCompanyId, openPanel, closePanelsToTheRight
    } = useGisUIStore();

    useEffect(() => {
        if (adminReports.length === 0) fetchAdminReports();
    }, [adminReports.length, fetchAdminReports]);

    const isOfficer = currentUser?.role === "PETUGAS_LAPANGAN";

    // ------------------------------------------------------------------------
    // DATA LAYER A: POLIGON INDUSTRI (Hanya untuk Admin & Auditor)
    // ------------------------------------------------------------------------
    const companyPolygons = useMemo(() => {
        if (isOfficer) return []; // Inspektur tidak butuh poligon transparan

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

        // Ambil penugasan milik inspektur yang masih "Terjadwal"
        const activeTasks = inspections.filter(
            (i) => (i.inspectorId === userId || i.inspectorId === officerId) && i.status === "Terjadwal"
        );

        return activeTasks.map(task => {
            let lat = NaN, lng = NaN;
            const isUnknown = task.companyId === "COM-UNKNOWN";

            // Ekstraksi koordinat cerdas
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
                zoom={12}
                zoomControl={false}
                style={{ height: '100%', width: '100%' }}
            >
                <ExternalMapController />
                <MapEventsHandler />

                <TileLayer url={getTileUrl()} />

                {/* RENDER 1: POLIGON INDUSTRI (ADMIN / AUDITOR) */}
                {!isOfficer && companyPolygons.map(c => {
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

                {/* LAYER OVERLAY: DAS & ZONASI (Tampil untuk semua role) */}
                {activeLayers.includes("overlay-das") && (
                    <FeatureGroup>
                        {[
                            { center: [-6.9147, 107.6098] as [number, number], r: 3500 },
                            { center: [-6.9388, 107.6255] as [number, number], r: 2800 },
                        ].map((c, i) => (
                            <Polygon
                                key={`das-${i}`}
                                positions={circleToPolygon(c.center, c.r, 36)}
                                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1 * (mapOpacity / 100), weight: 1.5, dashArray: '4,4' }}
                                interactive={false}
                            />
                        ))}
                    </FeatureGroup>
                )}

                {activeLayers.includes("overlay-rtrw") && (
                    <FeatureGroup>
                        {[
                            { center: [-6.8245, 107.6190] as [number, number], r: 2000 },
                            { center: [-6.9034, 107.6189] as [number, number], r: 2500 },
                        ].map((c, i) => (
                            <Polygon
                                key={`rtrw-${i}`}
                                positions={circleToPolygon(c.center, c.r, 36)}
                                pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.15 * (mapOpacity / 100), weight: 1.5, dashArray: '4,4' }}
                                interactive={false}
                            />
                        ))}
                    </FeatureGroup>
                )}

            </MapContainer>
        </div>
    );
}

// Helper: Lingkaran pseudo-polygon
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