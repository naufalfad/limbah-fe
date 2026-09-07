// src/modules/admin/components/gis/layers/VolcanicAshLayer.tsx
import React, { useMemo } from 'react';
import { Pane, WMSTileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Mountain, Wind, Activity, Gauge } from 'lucide-react';

interface VolcanicAshLayerProps {
    mapOpacity?: number; // 0 - 100
}

interface VolcanoSentinel {
    id: string;
    name: string;
    lat: number;
    lng: number;
    elevation: number; // mdpl
    status: 'NORMAL' | 'WASPADA' | 'SIAGA' | 'AWAS';
    dangerRadiusKm: number;
    so2Level: string;
    ashPlumeDirection: string;
    lastReport: string;
}

// Daftar Gunung Api Strategis Pemantauan Vulkanik & Emisi Gas di Indonesia
const VOLCANO_SENTINELS: VolcanoSentinel[] = [
    {
        id: 'volcano-salak',
        name: 'Gunung Salak',
        lat: -6.7167,
        lng: 106.7333,
        elevation: 2211,
        status: 'NORMAL',
        dangerRadiusKm: 2,
        so2Level: 'Rendah (0.15 DU)',
        ashPlumeDirection: 'Barat Daya (Angin Mikro)',
        lastReport: 'Aktivitas freatik solfatara normal'
    },
    {
        id: 'volcano-gede',
        name: 'Gunung Gede Pangrango',
        lat: -6.7844,
        lng: 106.9839,
        elevation: 2958,
        status: 'NORMAL',
        dangerRadiusKm: 2,
        so2Level: 'Rendah (0.12 DU)',
        ashPlumeDirection: 'Selatan',
        lastReport: 'Emisi fumarol kawah stabil'
    },
    {
        id: 'volcano-merapi',
        name: 'Gunung Merapi',
        lat: -7.5407,
        lng: 110.4457,
        elevation: 2930,
        status: 'SIAGA',
        dangerRadiusKm: 7,
        so2Level: 'Tinggi (2.85 DU)',
        ashPlumeDirection: 'Barat - Barat Daya',
        lastReport: 'Guguran lava & awan panas berkala'
    },
    {
        id: 'volcano-krakatau',
        name: 'Anak Krakatau',
        lat: -6.1020,
        lng: 105.4230,
        elevation: 157,
        status: 'WASPADA',
        dangerRadiusKm: 5,
        so2Level: 'Sedang (1.20 DU)',
        ashPlumeDirection: 'Timur Laut',
        lastReport: 'Letusan abu vulkanik intermiten'
    }
];

const createVolcanoIcon = (status: VolcanoSentinel['status']) => {
    const isAlert = status === 'SIAGA' || status === 'AWAS';
    const isWaspada = status === 'WASPADA';
    const bgColor = isAlert ? '#dc2626' : isWaspada ? '#d97706' : '#059669';
    const glowColor = isAlert ? 'rgba(220, 38, 38, 0.4)' : isWaspada ? 'rgba(217, 119, 6, 0.3)' : 'rgba(5, 150, 105, 0.2)';

    return L.divIcon({
        html: `
            <div class="relative flex items-center justify-center" style="width: 30px; height: 30px;">
                ${isAlert ? `<span class="absolute inline-flex h-full w-full rounded-full animate-ping" style="background-color: ${glowColor};"></span>` : ''}
                <div class="relative flex items-center justify-center rounded shadow-md border border-white/90 text-white font-bold" style="width: 22px; height: 22px; background-color: ${bgColor}; box-shadow: 0 2px 8px ${glowColor};">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
                    </svg>
                </div>
            </div>
        `,
        className: 'custom-volcano-marker bg-transparent border-none',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
    });
};

export default function VolcanicAshLayer({ mapOpacity = 80 }: VolcanicAshLayerProps) {
    const todayIso = useMemo(() => {
        return new Date().toISOString().split('T')[0];
    }, []);

    const layerOpacity = (mapOpacity / 100) * 0.85;

    return (
        <>
            {/* CSS PANE GAUSSIAN ATMOSPHERIC BLEND: Meleburkan seluruh petak kotak 8-bit menjadi gradasi halus kontinu ala Windy */}
            <style>{`
                .leaflet-volcanic-smooth-pane-pane {
                    filter: blur(20px) saturate(150%) contrast(130%) !important;
                    mix-blend-mode: screen !important;
                    pointer-events: none;
                }
            `}</style>

            {/* 1. LAYER WMS CITRA SATELIT ASLI NASA GIBS MENCAKUP SELURUH PETA DENGAN PANE SMOOTH BLENDED */}
            <Pane
                name="volcanic-smooth-pane"
                style={{
                    zIndex: 240,
                    filter: 'blur(20px) saturate(150%) contrast(130%)',
                    mixBlendMode: 'screen',
                    pointerEvents: 'none'
                }}
            >
                {/* OMPS Sulfur Dioxide (SO2 Plume) Asli Satelit NASA */}
                <WMSTileLayer
                    key={`nasa-gibs-so2-smooth-${layerOpacity}`}
                    url={`https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?TIME=${todayIso}`}
                    layers="OMPS_Sulfur_Dioxide_Upper_Troposphere_and_Stratosphere"
                    format="image/png"
                    transparent={true}
                    version="1.3.0"
                    opacity={layerOpacity * 0.85}
                />

                {/* MODIS Aerosol Optical Depth Asli Satelit NASA */}
                <WMSTileLayer
                    key={`nasa-gibs-aerosol-smooth-${layerOpacity}`}
                    url={`https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?TIME=${todayIso}`}
                    layers="MODIS_Terra_Aerosol"
                    format="image/png"
                    transparent={true}
                    version="1.3.0"
                    opacity={layerOpacity * 0.7}
                />
            </Pane>

            {/* 2. SENTINEL GUNUNG API (PUSAT EWS & BAHAYA KAWAH) - TETAP TAJAM & INTERAKTIF */}
            {VOLCANO_SENTINELS.map((volcano) => {
                const isAlert = volcano.status === 'SIAGA' || volcano.status === 'AWAS';
                const isWaspada = volcano.status === 'WASPADA';
                const statusBadgeColor = isAlert ? 'bg-rose-100 text-rose-700 border-rose-300' : isWaspada ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300';

                return (
                    <React.Fragment key={volcano.id}>
                        {/* Radius Bahaya Kawah */}
                        <Circle
                            center={[volcano.lat, volcano.lng]}
                            radius={volcano.dangerRadiusKm * 1000}
                            pathOptions={{
                                color: isAlert ? '#ef4444' : '#f59e0b',
                                fillColor: isAlert ? '#ef4444' : '#f59e0b',
                                fillOpacity: 0.15 * (mapOpacity / 100),
                                weight: 1.5,
                                dashArray: '4, 4'
                            }}
                        />

                        {/* Marker Gunung Api */}
                        <Marker
                            position={[volcano.lat, volcano.lng]}
                            icon={createVolcanoIcon(volcano.status)}
                            zIndexOffset={280}
                        >
                            <Popup className="custom-volcano-popup">
                                <div className="p-1 min-w-[240px] font-sans text-slate-800">
                                    {/* Header Popup */}
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                        <div className="flex items-center gap-1.5 text-slate-800">
                                            <Mountain size={15} className="text-amber-600" />
                                            <span className="text-xs font-black tracking-tight">{volcano.name}</span>
                                        </div>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-none ${statusBadgeColor}`}>
                                            {volcano.status}
                                        </span>
                                    </div>

                                    {/* Elevasi & Koordinat */}
                                    <div className="mt-2 flex justify-between text-[11px] text-slate-600 font-medium">
                                        <span>Ketinggian Puncak:</span>
                                        <span className="font-mono font-bold text-slate-800">{volcano.elevation} mdpl</span>
                                    </div>

                                    {/* Parameter Telemetri Vulkanik & SO2 */}
                                    <div className="grid grid-cols-2 gap-2 my-2.5 bg-slate-50 p-2 border border-slate-200">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                                <Gauge size={10} className="text-purple-600" /> Kolom Gas SO2
                                            </span>
                                            <span className="text-xs font-bold text-purple-900 font-mono">
                                                {volcano.so2Level}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                                <Wind size={10} className="text-cyan-600" /> Arah Tiupan Abu
                                            </span>
                                            <span className="text-xs font-bold text-cyan-800">
                                                {volcano.ashPlumeDirection}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Laporan PVMBG */}
                                    <div className="text-[10px] text-slate-600 bg-amber-50/70 p-2 border-l-2 border-amber-500 rounded-none mb-2">
                                        <div className="flex items-center gap-1 font-bold text-amber-900 mb-0.5">
                                            <Activity size={10} /> Status Mitigasi PVMBG:
                                        </div>
                                        <span>{volcano.lastReport}</span>
                                    </div>

                                    {/* Radius Peringatan */}
                                    <div className="text-[9px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                                        <span>Zona Bahaya Kawah:</span>
                                        <span className="font-mono font-semibold text-rose-600">Radius {volcano.dangerRadiusKm} KM</span>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    </React.Fragment>
                );
            })}
        </>
    );
}
