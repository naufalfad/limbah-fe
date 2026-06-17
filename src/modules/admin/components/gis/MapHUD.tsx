// src/modules/admin/components/gis/MapHUD.tsx
import React, { useMemo, useState, useEffect } from "react";
import { Plus, Minus, Maximize, Map as MapIcon, BellRing } from "lucide-react";
import { useGisUIStore } from "@/store/useGisUIStore";
import { useSijagaStore } from "@/store/useSijagaStore";
import { cn } from "@/lib/utils";

export default function MapHUD() {
    const { activeLayers } = useGisUIStore();
    const { currentUser } = useSijagaStore();

    const isOfficer = currentUser?.role === "PETUGAS_LAPANGAN";

    // State untuk mode lipat legenda (collapsible legend)
    const [isLegendExpanded, setIsLegendExpanded] = useState(true);

    useEffect(() => {
        const handleResize = () => setIsLegendExpanded(window.innerWidth >= 768);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Cek apakah mode layar penuh (AQI atau Sungai) sedang aktif
    const isAqiActive = activeLayers.includes("layer-aqi");
    const isRiverActive = activeLayers.includes("layer-river");

    const triggerZoomIn = () => window.dispatchEvent(new Event('map-zoom-in'));
    const triggerZoomOut = () => window.dispatchEvent(new Event('map-zoom-out'));
    const triggerResetView = () => window.dispatchEvent(new Event('map-reset-view'));

    type LegendItem = {
        label: string;
        color: string;
        shape: 'square' | 'circle' | 'pulsing' | 'line';
        layerId?: string; // Menyimpan ID layer rujukan untuk pencocokan status aktif
        isGlobalAlarm?: boolean; // Penanda khusus untuk alarm kepatuhan lintas-layer
    };

    // ======================================================================
    // STATIC COMPREHENSIVE LEDGER MEMOIZATION
    // Mengamankan daftar legenda lengkap secara konstan untuk kemudahan navigasi
    // ======================================================================
    const legendItems = useMemo<LegendItem[]>(() => {
        if (isOfficer) {
            return [
                { label: "Sasaran Audit Rutin DLH", color: "bg-emerald-500", shape: 'circle' },
                { label: "Sidak Lapangan Khusus", color: "bg-rose-500", shape: 'circle' }
            ];
        }

        return [
            {
                label: "Wajib AMDAL (Risiko Tinggi)",
                color: "bg-red-500",
                shape: 'circle', // GFW FIX: Diubah menjadi lingkaran agar seirama dengan marker peta
                layerId: "layer-amdal"
            },
            {
                label: "Wajib UKL-UPL (Menengah)",
                color: "bg-amber-500",
                shape: 'circle', // GFW FIX: Diubah menjadi lingkaran agar seirama dengan marker peta
                layerId: "layer-uklupl"
            },
            {
                label: "Wajib SPPL (Risiko Rendah)",
                color: "bg-emerald-500",
                shape: 'circle', // GFW FIX: Diubah menjadi lingkaran agar seirama dengan marker peta
                layerId: "layer-sppl"
            },
            {
                label: "Stasiun Air: Memenuhi Syarat",
                color: "bg-cyan-500",
                shape: 'circle',
                layerId: "layer-water-stations"
            },
            {
                label: "Stasiun Air: Tercemar / Kritis",
                color: "bg-rose-600",
                shape: 'pulsing',
                layerId: "layer-water-stations"
            },
            {
                label: "Alarm Kepatuhan Kritis (EWS)",
                color: "bg-red-500",
                shape: 'pulsing',
                isGlobalAlarm: true // Aktif jika ada salah satu layer industri yang aktif
            }
        ];
    }, [isOfficer]);

    // ======================================================================
    // UX FOCUS MODE: 
    // Jika layer AQI ATAU Sungai aktif, matikan SELURUH HUD Kanan Bawah
    // karena mereka sudah punya Horizontal Legend di tengah bawah layar.
    // ======================================================================
    if (isAqiActive || isRiverActive) {
        return null;
    }

    const hasLegends = legendItems.length > 0;

    return (
        <div className="absolute bottom-20 md:bottom-8 right-4 md:right-8 z-40 pointer-events-auto flex flex-row md:flex-col items-end gap-2 md:gap-4 select-none">
            {hasLegends && (
                <div className="flex flex-col items-end gap-2">
                    {isLegendExpanded ? (
                        <div className="bg-white/90 backdrop-blur border border-slate-300 shadow-sm rounded-none w-60 animate-in fade-in slide-in-from-bottom-4 flex flex-col max-h-[75vh] overflow-y-auto custom-scrollbar">

                            {/* Header Legenda - Bisa Ditekan Untuk Menutup (Collapsible) */}
                            <div 
                                className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50/90 border-b border-slate-200 sticky top-0 z-10 text-left cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => setIsLegendExpanded(false)}
                            >
                                <div className="flex items-center gap-2">
                                    <MapIcon size={12} className="text-emerald-700" />
                                    <h4 className="text-[9px] font-black text-slate-700 uppercase tracking-widest">
                                        {isOfficer ? "Legenda Sasaran" : "Legenda Kepatuhan"}
                                    </h4>
                                </div>
                                <Minus size={12} className="text-slate-400" />
                            </div>

                    {/* Daftar Item Legenda */}
                    <div className="flex flex-col">
                        {legendItems.map((item, idx) => {
                            // Evaluasi status aktif-tidaknya item legenda berdasarkan toggle menu samping
                            let isLayerActive = false;

                            if (item.isGlobalAlarm) {
                                // Alarm Global EWS aktif jika minimal salah satu dari 3 layer industri dihidupkan
                                isLayerActive = activeLayers.includes("layer-amdal") ||
                                    activeLayers.includes("layer-uklupl") ||
                                    activeLayers.includes("layer-sppl");
                            } else {
                                isLayerActive = !item.layerId || activeLayers.includes(item.layerId);
                            }

                            return (
                                <div
                                    key={idx}
                                    // Menerapkan transisi pudar (opacity-45) secara interaktif jika layer sedang dimatikan
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50/40 transition-all duration-300",
                                        isLayerActive ? "opacity-100" : "opacity-45"
                                    )}
                                >
                                    <div className="relative w-3 h-3 shrink-0 flex items-center justify-center">
                                        {/* Titik berdenyut (Radar riak) dinonaktifkan sementara jika layer sedang mati */}
                                        {item.shape === 'pulsing' && (
                                            <span className={cn(
                                                "absolute inline-flex h-full w-full rounded-full opacity-75",
                                                isLayerActive && "animate-ping",
                                                item.color.replace('600', '400')
                                            )} />
                                        )}
                                        {item.shape === 'line' ? (
                                            <div className={cn("w-full h-1 rounded-none", item.color)} />
                                        ) : (
                                            <div className={cn(
                                                "relative w-full h-full shadow-sm border border-white",
                                                item.shape === 'square' ? "rounded-none" : "rounded-full",
                                                item.color
                                            )} />
                                        )}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold tracking-tight leading-none text-left transition-colors",
                                        isLayerActive ? "text-slate-700" : "text-slate-450"
                                    )}>
                                        {item.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                    ) : (
                        <button 
                            onClick={() => setIsLegendExpanded(true)}
                            className="bg-white/90 backdrop-blur border border-slate-300 shadow-sm w-10 h-10 flex items-center justify-center text-slate-600 hover:text-emerald-700 hover:bg-slate-50 transition-colors active:bg-slate-200 rounded-none outline-none animate-in zoom-in-95"
                            title="Buka Legenda"
                        >
                            <MapIcon size={18} strokeWidth={2.5} />
                        </button>
                    )}
                </div>
            )}

            {/* Navigasi Tombol Zoom & Reset */}
            <div className="hidden md:flex flex-col bg-white/90 backdrop-blur border border-slate-300 shadow-none rounded-none overflow-hidden divide-y divide-slate-200 shrink-0">
                <button onClick={triggerZoomIn} className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-colors active:bg-slate-200 rounded-none outline-none">
                    <Plus size={18} strokeWidth={2.5} />
                </button>
                <button onClick={triggerResetView} className="w-10 h-9 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-emerald-700 transition-colors active:bg-slate-200 group rounded-none outline-none">
                    <Maximize size={14} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                </button>
                <button onClick={triggerZoomOut} className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-colors active:bg-slate-200 rounded-none outline-none">
                    <Minus size={18} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}