// src/modules/admin/components/gis/MapHUD.tsx
import React from "react";
import { Plus, Minus, Maximize, Map as MapIcon } from "lucide-react";
import { useGisUIStore } from "@/store/useGisUIStore";

/**
 * MapHUD - Kontrol Navigasi & Legenda (Frameless)
 * Mengadopsi desain sharp edges, flat, tanpa shadow tebal.
 * Terletak absolut di kanan bawah layar.
 */
export default function MapHUD() {
    const { activeLayers } = useGisUIStore();

    // Custom events untuk Leaflet yang akan ditangkap oleh LimbahMap.tsx nanti
    const triggerZoomIn = () => window.dispatchEvent(new Event('map-zoom-in'));
    const triggerZoomOut = () => window.dispatchEvent(new Event('map-zoom-out'));
    const triggerResetView = () => window.dispatchEvent(new Event('map-reset-view'));

    // Data statis untuk legenda sesuai status kewajiban lingkungan
    const legendItems = [
        { label: "Wajib AMDAL (Risiko Tinggi)", color: "bg-red-500", layerId: "layer-amdal" },
        { label: "Wajib UKL-UPL (Menengah)", color: "bg-amber-500", layerId: "layer-uklupl" },
        { label: "Wajib SPPL (Risiko Rendah)", color: "bg-emerald-500", layerId: "layer-sppl" },
    ];

    return (
        // REVISI: Mengubah flex-col menjadi flex-row dan sejajar di bawah (items-end)
        <div className="absolute bottom-8 right-8 z-30 pointer-events-none flex flex-row items-end gap-4 select-none">

            {/* 1. KOTAK LEGENDA (Frameless Continuous List) */}
            <div className="pointer-events-auto bg-white border border-slate-300 shadow-sm rounded-none w-56 animate-in fade-in slide-in-from-bottom-4">

                {/* Header Legenda */}
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200">
                    <MapIcon size={12} className="text-emerald-700" />
                    <h4 className="text-[9px] font-black text-slate-700 uppercase tracking-widest">
                        Legenda Kepatuhan
                    </h4>
                </div>

                {/* Isi Legenda (Flush List) */}
                <div className="flex flex-col">
                    {legendItems.map((item, idx) => {
                        const isActive = activeLayers.includes(item.layerId);

                        return (
                            <div
                                key={idx}
                                className={`flex items-center gap-3 px-3 py-2 border-b border-slate-100 last:border-0 transition-opacity ${isActive ? 'opacity-100' : 'opacity-30'}`}
                            >
                                <div className={`w-3 h-3 ${item.color} border border-slate-200 rounded-none shrink-0 shadow-inner`} />
                                <span className="text-[10px] font-bold text-slate-600 tracking-tight leading-none">
                                    {item.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 2. KONTROL ZOOM PETA (Frameless Stack) */}
            <div className="pointer-events-auto flex flex-col bg-white border border-slate-300 shadow-none rounded-none overflow-hidden divide-y divide-slate-200 shrink-0">
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