// src/modules/admin/components/gis/layers/WaterSampleMarkerLayer.tsx
import React, { useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useGisUIStore } from '@/store/useGisUIStore';
import { useSijagaStore } from '@/store/useSijagaStore';
import { Badge } from '@/components/ui/badge';

// TERPERBAIKI: Mengambil tipe data resmi terpadu dari pusat kontrak spasial [3]
import { WaterStationNode } from '@/types/gis';

// --- AMBANG BATAS BAKU MUTU NASIONAL (PP No. 22 Tahun 2021 Kelas II) ---
const BAKU_MUTU_LIMITS = {
    BOD: 3.0,     // mg/L (Max)
    COD: 25.0,    // mg/L (Max)
    DO: 4.0,      // mg/L (Min, lebih kecil dari 4 berbahaya bagi kehidupan air)
    PH_MIN: 6.0,
    PH_MAX: 9.0
};

/**
 * ============================================================================
 * WATER SAMPLE MARKER LAYER (LOD & THRESHOLD DETECTOR)
 * ============================================================================
 * Merender pin lokasi stasiun pengambilan sampel air.
 * Menerapkan visualisasi dinamis yang berkedip merah jika baku mutu terlampaui.
 */
export default function WaterSampleMarkerLayer() {
    const {
        activeLayers,
        selectedWaterStationId,     // Menggunakan ID seleksi stasiun air terisolasi
        setSelectedWaterStationId,
        setSelectedCompanyId,
        openPanel,
        closePanelsToTheRight
    } = useGisUIStore();

    // Menyerap data stasiun air yang tersinkronisasi murni dari Zustand / DB [3]
    const { waterStations, fetchWaterStations } = useSijagaStore();

    // Pastikan data dipicu saat layer dimuat pertama kali
    useEffect(() => {
        if (waterStations.length === 0) {
            fetchWaterStations();
        }
    }, [waterStations.length, fetchWaterStations]);

    // Verifikasi apakah layer stasiun air diaktifkan oleh pengguna
    const isStationActive = activeLayers.includes('layer-water-stations');

    // Fungsi evaluasi status pencemaran (Information Expert)
    const checkIsCritical = (station: WaterStationNode): boolean => {
        const data = station.currentData;
        return (
            data.bod > BAKU_MUTU_LIMITS.BOD ||
            data.cod > BAKU_MUTU_LIMITS.COD ||
            data.do < BAKU_MUTU_LIMITS.DO ||
            data.ph < BAKU_MUTU_LIMITS.PH_MIN ||
            data.ph > BAKU_MUTU_LIMITS.PH_MAX
        );
    };

    // Generator Ikon Radar Sonar Otonom (Pure Fabrication)
    const createWaterIcon = (station: WaterStationNode, isSelected: boolean) => {
        const critical = checkIsCritical(station);

        let colorClass = "bg-cyan-400";
        let ringClass = "sonar-ripple-cyan";

        if (critical) {
            colorClass = "bg-rose-500";
            ringClass = "sonar-ripple-rose"; // Riak merah tajam jika kritis
        }

        if (isSelected) {
            ringClass = ""; // Kunci riak jika stasiun sedang diklik terpilih
        }

        return L.divIcon({
            html: `
                <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
                    <span class="absolute inline-flex rounded-full h-8 w-8 ${ringClass} opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-3.5 w-3.5 ${colorClass} border-2 border-white shadow-md"></span>
                </div>
            `,
            className: "custom-water-station-icon bg-transparent border-none",
            iconSize: [32, 32],
            iconAnchor: [16, 16],
        });
    };

    // Handler klik stasiun air (Polymorphic Detail Panel)
    const handleStationClick = (station: WaterStationNode, e: L.LeafletMouseEvent) => {
        e.originalEvent.stopPropagation();

        // Terbangkan kamera peta ke koordinat stasiun yang dipilih
        e.target._map.flyTo([station.lat, station.lng], 14, { animate: true, duration: 1.5 });

        // Tandai stasiun air terpilih, dan batalkan seleksi perusahaan untuk mengunci laci
        setSelectedWaterStationId(station.id);
        setSelectedCompanyId(null);

        // Tutup laci kanan sebelumnya
        closePanelsToTheRight(-1);

        // Buka panel detail telemetri dengan payload khusus stasiun air (isWaterStation: true)
        openPanel(
            "telemetri-lingkungan",
            `Kualitas Air: ${station.id}`,
            { ...station, isWaterStation: true }
        );
    };

    if (!isStationActive || waterStations.length === 0) return null;

    return (
        <React.Fragment>
            {/* BLOK CSS KEYFRAMES UNTUK RIAK SONAR RADAR APUNG OTONOM */}
            <style>{`
                @keyframes sonar-wave-expand {
                    0% {
                        transform: scale(0.3);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(2.2);
                        opacity: 0;
                    }
                }
                .sonar-ripple-cyan {
                    border: 2px solid #22d3ee;
                    background-color: rgba(34, 211, 238, 0.15);
                    animation: sonar-wave-expand 1.8s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
                }
                .sonar-ripple-rose {
                    border: 2px solid #f43f5e;
                    background-color: rgba(244, 63, 94, 0.2);
                    animation: sonar-wave-expand 1.2s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
                }
            `}</style>

            {waterStations.map((station) => {
                const isSelected = selectedWaterStationId === station.id;
                const critical = checkIsCritical(station);

                return (
                    <Marker
                        key={station.id}
                        position={[station.lat, station.lng]}
                        icon={createWaterIcon(station, isSelected)}
                        eventHandlers={{ click: (e) => handleStationClick(station, e) }}
                    >
                        <Popup>
                            <div className="text-left font-sans p-1 space-y-1">
                                <h4 className="font-black text-slate-800 text-xs leading-none">{station.name}</h4>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">ID: {station.id}</p>
                                <div className="flex gap-1.5 pt-1.5 border-t">
                                    <Badge className="bg-slate-100 text-slate-600 border-none rounded-none text-[8px] font-black uppercase tracking-widest px-1.5">
                                        PH: {station.currentData.ph}
                                    </Badge>
                                    <Badge className={`border-none rounded-none text-[8px] font-black uppercase tracking-widest px-1.5 ${critical ? "bg-rose-50 text-rose-700 animate-pulse" : "bg-emerald-50 text-emerald-700"
                                        }`}>
                                        {critical ? "Tercemar" : "Memenuhi Syarat"}
                                    </Badge>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </React.Fragment>
    );
}