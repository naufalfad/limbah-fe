// src/modules/transport/components/gis/TrackingMap.tsx
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSijagaStore } from '@/store/useSijagaStore';

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

// Custom truck icon (Sharp GFW design)
const truckSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#059669" width="32" height="32" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="1" y="3" width="15" height="13" rx="0" ry="0" />
  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
  <circle cx="5.5" cy="18.5" r="2.5" />
  <circle cx="18.5" cy="18.5" r="2.5" />
</svg>
`;

const TruckIcon = L.divIcon({
    html: truckSvg,
    className: "truck-leaflet-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

const DEFAULT_CENTER: [number, number] = [-6.9034, 107.6189];

// Rute Koordinat Simulasi (Coblong s.d. Cicadas)
const routePoints: L.LatLngTuple[] = [
    [-6.9034, 107.6189],
    [-6.9100, 107.6250],
    [-6.9150, 107.6350],
    [-6.9200, 107.6450],
    [-6.9250, 107.6550],
    [-6.9300, 107.6650],
    [-6.9350, 107.6750],
    [-6.9300, 107.6850],
    [-6.9250, 107.6950],
    [-6.9147, 107.6098],
];

// Controller: Nangkep event zoom dari HUD & event mutasi posisi truk dari panel sebelah kiri
function TrackingMapController({ truckPos }: { truckPos: [number, number] }) {
    const map = useMap();

    useEffect(() => {
        // Sinyal terbang mengikuti mutasi pergerakan truk
        map.panTo(truckPos);
    }, [truckPos, map]);

    useEffect(() => {
        const handleZoomIn = () => map.zoomIn();
        const handleZoomOut = () => map.zoomOut();
        const handleResetView = () => map.setView(DEFAULT_CENTER, 13, { animate: true });

        window.addEventListener('map-zoom-in', handleZoomIn);
        window.addEventListener('map-zoom-out', handleZoomOut);
        window.addEventListener('map-reset-view', handleResetView);

        return () => {
            window.removeEventListener('map-zoom-in', handleZoomIn);
            window.removeEventListener('map-zoom-out', handleZoomOut);
            window.removeEventListener('map-reset-view', handleResetView);
        };
    }, [map]);

    return null;
}

export default function TrackingMap() {
    const { pickupRequests, companies } = useSijagaStore();
    const activeOrders = pickupRequests.filter(p => p.status === "ON_THE_ROAD" || p.status === "LOADED" || p.status === "PAID");
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    // State koordinat truk real-time (dimutasi oleh signal event dari panel)
    const [truckPos, setTruckPos] = useState<[number, number]>(DEFAULT_CENTER);

    useEffect(() => {
        if (activeOrders.length > 0 && !selectedOrder) {
            setSelectedOrder(activeOrders[0]);
        }
    }, [activeOrders, selectedOrder]);

    // Mendengarkan sinyal mutasi koordinat GPS dari ActiveFleetPanel.tsx
    useEffect(() => {
        const handleGpsUpdate = (e: Event) => {
            const customEvent = e as CustomEvent<{ lat: number; lng: number; order: any }>;
            const { lat, lng, order } = customEvent.detail;
            setTruckPos([lat, lng]);
            if (order) setSelectedOrder(order);
        };

        window.addEventListener('map-truck-update', handleGpsUpdate);
        return () => window.removeEventListener('map-truck-update', handleGpsUpdate);
    }, []);

    // Resolusi Koordinat Pabrik Pengirim secara Dinamis [3]
    const company = companies.find(c => c.id === selectedOrder?.companyId);
    let companyCoords: [number, number] = DEFAULT_CENTER;
    if (company && company.lat && company.lng) {
        const parsedLat = parseFloat(company.lat);
        const parsedLng = parseFloat(company.lng);
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
            companyCoords = [parsedLat, parsedLng];
        }
    }

    // Sambungkan titik rute dari pabrik riil menuju titik tengah (simulasi)
    const dynamicRoutePoints = [companyCoords, ...routePoints];

    return (
        <div className="absolute inset-0 z-0 bg-slate-100">
            <MapContainer
                center={DEFAULT_CENTER}
                zoom={13}
                zoomControl={false} // Dikontrol lewat HUD kustom
                style={{ height: '100%', width: '100%' }}
            >
                <TrackingMapController truckPos={truckPos} />

                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {/* Jalur Rute Polylines Dinamis */}
                <Polyline positions={dynamicRoutePoints} color="#059669" weight={4} dashArray="5, 10" />

                {/* Marker Truk Bergerak */}
                <Marker position={truckPos} icon={TruckIcon}>
                    <Popup>
                        <div className="text-left font-sans p-1">
                            <h4 className="font-black text-slate-800 text-xs">Armada Transporter</h4>
                            <p className="text-[10px] text-slate-500 font-bold mt-1">Plate: {selectedOrder?.plateNo || "D 1234 DLH"}</p>
                        </div>
                    </Popup>
                </Marker>

                {/* Titik Muat Limbah (Start) */}
                <Marker position={companyCoords}>
                    <Popup>
                        <div className="text-left font-sans p-1">
                            <h4 className="font-black text-slate-800 text-xs leading-none">Lokasi Pabrik (Penjemputan)</h4>
                            <p className="text-[10px] text-slate-500 font-bold mt-1.5">{selectedOrder?.companyName || "Pabrik Pemesan"}</p>
                            {company && <p className="text-[9px] text-slate-400 mt-1">{company.address}</p>}
                        </div>
                    </Popup>
                </Marker>

                {/* Pusat Pengolahan Limbah (End/Cicadas) */}
                <Marker position={[-6.9147, 107.6098]}>
                    <Popup>
                        <div className="text-left font-sans p-1">
                            <h4 className="font-black text-slate-800 text-xs leading-none">Pusat Pengolahan Limbah</h4>
                            <p className="text-[10px] text-slate-500 font-bold mt-1.5">IPAL / TPA Daerah</p>
                        </div>
                    </Popup>
                </Marker>

            </MapContainer>
        </div>
    );
}