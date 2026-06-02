// src/modules/admin/components/gis/MapHUD.tsx
import React from "react";
import { Plus, Minus, Maximize, Map as MapIcon } from "lucide-react";
import { useGisUIStore } from "@/store/useGisUIStore";
import { useSijagaStore } from "@/store/useSijagaStore";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * MAP HUD (HEADS-UP DISPLAY) & TACTICAL LEGEND
 * ============================================================================
 * Mengadopsi desain sharp edges, flat, tanpa shadow tebal.
 * Terletak absolut di kanan bawah layar. Murni untuk memandu status perusahaan.
 */
export default function MapHUD() {
    const { activeLayers } = useGisUIStore();
    const { currentUser } = useSijagaStore();

    const isOfficer = currentUser?.role === "PETUGAS_LAPANGAN";

    // Cek apakah mode Telemetri AQI sedang aktif
    const isAqiActive = activeLayers.includes("layer-aqi");

    // UX FIX: Jika layer AQI aktif, matikan SELURUH HUD Kanan Bawah
    // Hal ini memberi ruang layar maksimal untuk Focus Mode analisis lingkungan.
    if (isAqiActive) {
        return null;
    }

    // Custom events untuk Leaflet
    const triggerZoomIn = () => window.dispatchEvent(new Event('map-zoom-in'));
    const triggerZoomOut = () => window.dispatchEvent(new Event('map-zoom-out'));
    const triggerResetView = () => window.dispatchEvent(new Event('map-reset-view'));

    type LegendItem = {
        label: string;
        color: string;
        layerId: string;
        shape: 'square' | 'circle' | 'pulsing';
    };

    let legendItems: LegendItem[] = [];

    if (isOfficer) {
        legendItems = [
            { label: "Tugas: Audit Rutin DLH", color: "bg-emerald-500", layerId: "always_active", shape: 'circle' },
            { label: "Tugas: Penindakan Aduan", color: "bg-rose-500", layerId: "always_active", shape: 'circle' }
        ];
    } else {
        legendItems = [
            { label: "Wajib AMDAL (Risiko Tinggi)", color: "bg-red-500", layerId: "layer-amdal", shape: 'square' },
            { label: "Wajib UKL-UPL (Menengah)", color: "bg-amber-500", layerId: "layer-uklupl", shape: 'square' },
            { label: "Wajib SPPL (Risiko Rendah)", color: "bg-emerald-500", layerId: "layer-sppl", shape: 'square' },
            { label: "Aduan: Triage / Verifikasi", color: "bg-rose-600", layerId: "layer-complaints", shape: 'pulsing' },
            { label: "Aduan: Diinvestigasi Petugas", color: "bg-indigo-600", layerId: "layer-complaints", shape: 'pulsing' },
            { label: "Aduan: Selesai Ditindak", color: "bg-teal-600", layerId: "layer-complaints", shape: 'pulsing' },
        ];
    }

    return (
        <div className="absolute bottom-8 right-8 z-30 pointer-events-none flex flex-row items-end gap-4 select-none">

            {/* 1. KOTAK LEGENDA KEPATUHAN (Frameless Continuous List) */}
            <div className="pointer-events-auto bg-white/90 backdrop-blur border border-slate-300 shadow-sm rounded-none w-56 animate-in fade-in slide-in-from-bottom-4 flex flex-col max-h-[75vh] overflow-y-auto custom-scrollbar">

                {/* Header Legenda */}
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/90 border-b border-slate-200 sticky top-0 z-10 text-left">
                    <MapIcon size={12} className="text-emerald-700" />
                    <h4 className="text-[9px] font-black text-slate-700 uppercase tracking-widest">
                        {isOfficer ? "Legenda Sasaran Tugas" : "Legenda Kepatuhan"}
                    </h4>
                </div>

                {/* Isi Legenda Utama (Flush List) */}
                <div className="flex flex-col">
                    {legendItems.map((item, idx) => {
                        const isActive = item.layerId === "always_active" || activeLayers.includes(item.layerId);

                        return (
                            <div
                                key={idx}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 border-b border-slate-100 last:border-0 transition-opacity",
                                    isActive ? "opacity-100" : "opacity-30"
                                )}
                            >
                                {/* Rendering Shape berdasarkan Tipe Data */}
                                <div className="relative w-3 h-3 shrink-0 flex items-center justify-center">
                                    {item.shape === 'pulsing' && (
                                        <span className={cn(
                                            "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                                            item.color.replace('600', '400')
                                        )} />
                                    )}
                                    <div className={cn(
                                        "relative w-full h-full shadow-sm",
                                        item.shape === 'square' ? "rounded-none border border-slate-200" : "rounded-full border border-white",
                                        item.color
                                    )} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-600 tracking-tight leading-none text-left">
                                    {item.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 2. KONTROL ZOOM PETA (Frameless Stack) */}
            <div className="pointer-events-auto flex flex-col bg-white/90 backdrop-blur border border-slate-300 shadow-none rounded-none overflow-hidden divide-y divide-slate-200 shrink-0">
                <button
                    onClick={triggerZoomIn}
                    className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-colors active:bg-slate-200 rounded-none outline-none"
                    title="Perbesar (Zoom In)"
                >
                    <Plus size={18} strokeWidth={2.5} />
                </button>

                <button
                    onClick={triggerResetView}
                    className="w-10 h-9 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-emerald-700 transition-colors active:bg-slate-200 group rounded-none outline-none"
                    title="Reset Titik Fokus"
                >
                    <Maximize size={14} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                </button>

                <button
                    onClick={triggerZoomOut}
                    className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-colors active:bg-slate-200 rounded-none outline-none"
                    title="Perkecil (Zoom Out)"
                >
                    <Minus size={18} strokeWidth={2.5} />
                </button>
            </div>

        </div>
    );
}