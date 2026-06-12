// src/modules/admin/components/gis/MapHUD.tsx
import React, { useMemo } from "react";
import { Plus, Minus, Maximize, Map as MapIcon } from "lucide-react";
import { useGisUIStore } from "@/store/useGisUIStore";
import { useSijagaStore } from "@/store/useSijagaStore";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * MAP HUD (HEADS-UP DISPLAY) & TACTICAL LEGEND
 * ============================================================================
 * Mengadopsi desain GFW Paradigm (sharp edges, flat, tanpa shadow tebal).
 * Terletak absolut di kanan bawah layar secara imersif.
 */
export default function MapHUD() {
    const { activeLayers } = useGisUIStore();
    const { currentUser } = useSijagaStore();

    const isOfficer = currentUser?.role === "PETUGAS_LAPANGAN";

    // Cek apakah mode Telemetri AQI sedang aktif
    const isAqiActive = activeLayers.includes("layer-aqi");

    // Custom events untuk mengendalikan peta Leaflet secara decoupled
    const triggerZoomIn = () => window.dispatchEvent(new Event('map-zoom-in'));
    const triggerZoomOut = () => window.dispatchEvent(new Event('map-zoom-out'));
    const triggerResetView = () => window.dispatchEvent(new Event('map-reset-view'));

    // Struktur Kontrak Legenda Baru
    type LegendItem = {
        label: string;
        color: string;
        shape: 'square' | 'circle' | 'pulsing' | 'line';
    };

    // 1. [PERBAIKAN SIKLUS REACT] Deklarasikan Hooks SEBELUM kondisi Return apa pun!
    const legendItems = useMemo<LegendItem[]>(() => {
        if (isOfficer) {
            return [
                { label: "Sasaran Audit Rutin DLH", color: "bg-emerald-500", shape: 'circle' },
                { label: "Sidak Lapangan Khusus", color: "bg-rose-500", shape: 'circle' }
            ];
        }

        const items: LegendItem[] = [];

        // Kelompok Dokumen Lingkungan Sektoral
        if (activeLayers.includes("layer-amdal")) {
            items.push({ label: "Wajib AMDAL (Risiko Tinggi)", color: "bg-red-500", shape: 'square' });
        }
        if (activeLayers.includes("layer-uklupl")) {
            items.push({ label: "Wajib UKL-UPL (Menengah)", color: "bg-amber-500", shape: 'square' });
        }
        if (activeLayers.includes("layer-sppl")) {
            items.push({ label: "Wajib SPPL (Risiko Rendah)", color: "bg-emerald-500", shape: 'square' });
        }

        // Kelompok Aliran Sungai & Stasiun Air (DAS)
        if (activeLayers.includes("layer-river")) {
            items.push({ label: "Aliran Sungai (Clipped)", color: "bg-cyan-400", shape: 'line' });
        }
        if (activeLayers.includes("layer-water-stations")) {
            items.push({ label: "Stasiun Air: Memenuhi Syarat", color: "bg-cyan-500", shape: 'circle' });
            items.push({ label: "Stasiun Air: Tercemar / Kritis", color: "bg-rose-600", shape: 'pulsing' });
        }

        return items;
    }, [activeLayers, isOfficer]);

    // 2. [EARLY RETURN] Tempatkan pemutus render SETELAH semua Hooks selesai diinisialisasi
    // UX FOCUS MODE: Jika layer AQI aktif, matikan SELURUH HUD Kanan Bawah
    if (isAqiActive) {
        return null;
    }

    // Jika tidak ada layer aktif yang butuh legenda, sembunyikan kotak legenda, tampilkan navigasi saja
    const hasLegends = legendItems.length > 0;

    return (
        <div className="absolute bottom-8 right-8 z-30 pointer-events-auto flex flex-row items-end gap-4 select-none">

            {/* KOTAK LEGENDA KEPATUHAN TERSEGMENTASI (Dinamis / Polimorfik) */}
            {hasLegends && (
                <div className="bg-white/90 backdrop-blur border border-slate-300 shadow-sm rounded-none w-56 animate-in fade-in slide-in-from-bottom-4 flex flex-col max-h-[75vh] overflow-y-auto custom-scrollbar">

                    {/* Header Legenda */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/90 border-b border-slate-200 sticky top-0 z-10 text-left">
                        <MapIcon size={12} className="text-emerald-700" />
                        <h4 className="text-[9px] font-black text-slate-700 uppercase tracking-widest">
                            {isOfficer ? "Legenda Sasaran Tugas" : "Legenda Kepatuhan"}
                        </h4>
                    </div>

                    {/* Flush List Legenda Aktif */}
                    <div className="flex flex-col">
                        {legendItems.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-3 px-3 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50/40 transition-colors"
                            >
                                <div className="relative w-3 h-3 shrink-0 flex items-center justify-center">
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
                                            "relative w-full h-full shadow-sm",
                                            item.shape === 'square' ? "rounded-none border border-slate-200" : "rounded-full border border-white",
                                            item.color
                                        )} />
                                    )}
                                </div>
                                <span className="text-[10px] font-bold text-slate-650 tracking-tight leading-none text-left">
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* KONTROL ZOOM PETA (GFW Stack) */}
            <div className="flex flex-col bg-white/90 backdrop-blur border border-slate-300 shadow-none rounded-none overflow-hidden divide-y divide-slate-200 shrink-0">
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