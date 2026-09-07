// src/modules/admin/components/gis/MapHUD.tsx
import React, { useMemo, useState, useEffect } from "react";
import { Plus, Minus, Maximize, Map as MapIcon, Info } from "lucide-react";
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
    // MASTER LIST LEGENDA LENGKAP
    // ======================================================================
    const allLegendItems = useMemo<LegendItem[]>(() => {
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
                shape: 'circle',
                layerId: "layer-amdal"
            },
            {
                label: "Wajib UKL-UPL (Menengah)",
                color: "bg-amber-500",
                shape: 'circle',
                layerId: "layer-uklupl"
            },
            {
                label: "Wajib SPPL (Risiko Rendah)",
                color: "bg-emerald-500",
                shape: 'circle',
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
                label: "Titik Api Termal (NASA FIRMS)",
                color: "bg-rose-600",
                shape: 'circle',
                layerId: "layer-wildfire"
            },
            {
                label: "Sebaran Plume SO2 & Abu Vulkanik",
                color: "bg-purple-600",
                shape: 'circle',
                layerId: "layer-volcano-ash"
            },
            {
                label: "Sentinel Gunung Api (PVMBG)",
                color: "bg-amber-600",
                shape: 'circle',
                layerId: "layer-volcano-ash"
            },
            {
                label: "Alarm Kepatuhan Kritis (EWS)",
                color: "bg-red-500",
                shape: 'pulsing',
                isGlobalAlarm: true
            }
        ];
    }, [isOfficer]);

    // ======================================================================
    // FILTER DINAMIS: HANYA ITEM DARI LAYER AKTIF YANG DITAMPILKAN
    // ======================================================================
    const activeLegendItems = useMemo(() => {
        return allLegendItems.filter((item) => {
            if (item.isGlobalAlarm) {
                return activeLayers.includes("layer-amdal") ||
                    activeLayers.includes("layer-uklupl") ||
                    activeLayers.includes("layer-sppl");
            }
            if (isOfficer) return true;
            return item.layerId ? activeLayers.includes(item.layerId) : false;
        });
    }, [allLegendItems, activeLayers, isOfficer]);

    return (
        <div className="absolute bottom-20 md:bottom-8 right-4 md:right-8 z-40 pointer-events-auto flex flex-col md:flex-row items-end gap-2 md:gap-4 select-none">
            {/* KARTU LEGENDA DINAMIS */}
            <div className="flex flex-col items-end gap-2">
                {isLegendExpanded ? (
                    <div className="bg-white/90 backdrop-blur border border-slate-300 shadow-sm rounded-none w-60 animate-in fade-in slide-in-from-bottom-4 flex flex-col max-h-[75vh] overflow-y-auto custom-scrollbar">

                        {/* Header Legenda - Bisa Ditekan Untuk Menutup (Collapsible) */}
                        <div
                            className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50/90 border-b border-slate-200 sticky top-0 z-10 text-left cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => setIsLegendExpanded(false)}
                            title="Klik untuk melipat legenda"
                        >
                            <div className="flex items-center gap-2">
                                <MapIcon size={12} className="text-emerald-700" />
                                <h4 className="text-[9px] font-black text-slate-700 uppercase tracking-widest">
                                    {isOfficer ? "Legenda Sasaran" : "Legenda Kepatuhan"}
                                </h4>
                            </div>
                            <Minus size={12} className="text-slate-400" />
                        </div>

                        {/* Daftar Item Legenda Aktif / Pesan Kosong */}
                        <div className="flex flex-col">
                            {activeLegendItems.length > 0 ? (
                                activeLegendItems.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2.5 px-3 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
                                    >
                                        <div className="relative w-2.5 h-2.5 shrink-0 flex items-center justify-center">
                                            {item.shape === 'pulsing' && (
                                                <span className={cn(
                                                    "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
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
                                        <span className="text-[10px] font-bold tracking-tight leading-none text-left text-slate-700">
                                            {item.label}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="px-3 py-5 text-center flex flex-col items-center justify-center gap-1.5 text-slate-400">
                                    <Info size={16} className="text-slate-400 mb-0.5 stroke-[1.8]" />
                                    <span className="text-[10px] font-bold text-slate-600">Saat ini tidak ada layer aktif</span>
                                    <span className="text-[9px] text-slate-400 leading-tight">Pilih layer di panel samping untuk menampilkan legenda</span>
                                </div>
                            )}
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

            {/* Navigasi Tombol Zoom & Reset */}
            <div className="hidden md:flex flex-col bg-white/90 backdrop-blur border border-slate-300 shadow-none rounded-none overflow-hidden divide-y divide-slate-200 shrink-0">
                <button onClick={triggerZoomIn} className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-colors active:bg-slate-200 rounded-none outline-none" title="Perbesar Peta">
                    <Plus size={18} strokeWidth={2.5} />
                </button>
                <button onClick={triggerResetView} className="w-10 h-9 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-emerald-700 transition-colors active:bg-slate-200 group rounded-none outline-none" title="Reset Pandangan Bogor">
                    <Maximize size={14} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                </button>
                <button onClick={triggerZoomOut} className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-colors active:bg-slate-200 rounded-none outline-none" title="Perkecil Peta">
                    <Minus size={18} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}