// src/modules/admin/components/gis/MapHUD.tsx
import React from "react";
import { Plus, Minus, Maximize, Map as MapIcon } from "lucide-react";
import { useGisUIStore } from "@/store/useGisUIStore";
import { useSijagaStore } from "@/store/useSijagaStore";
import { cn } from "@/lib/utils";

/**
 * MapHUD - Kontrol Navigasi & Legenda (Frameless)
 * Mengadopsi desain sharp edges, flat, tanpa shadow tebal.
 * Terletak absolut di kanan bawah layar.
 */
export default function MapHUD() {
    const { activeLayers } = useGisUIStore();
    const { currentUser } = useSijagaStore();

    // Custom events untuk Leaflet yang akan ditangkap oleh LimbahMap.tsx
    const triggerZoomIn = () => window.dispatchEvent(new Event('map-zoom-in'));
    const triggerZoomOut = () => window.dispatchEvent(new Event('map-zoom-out'));
    const triggerResetView = () => window.dispatchEvent(new Event('map-reset-view'));

    const isOfficer = currentUser?.role === "PETUGAS_LAPANGAN";

    // FASE 2: Polimorfisme Data Legenda (Menyesuaikan Role)
    type LegendItem = {
        label: string;
        color: string;
        layerId: string;
        shape: 'square' | 'circle' | 'pulsing';
    };

    let legendItems: LegendItem[] = [];

    if (isOfficer) {
        // Legenda Khusus Inspektur (Sesuai titik marker solid di LimbahMap)
        legendItems = [
            { label: "Tugas: Audit Rutin DLH", color: "bg-emerald-500", layerId: "always_active", shape: 'circle' },
            { label: "Tugas: Penindakan Aduan", color: "bg-rose-500", layerId: "always_active", shape: 'circle' }
        ];
    } else {
        // Legenda Khusus Admin & Auditor (Poligon Industri + Krisis Pengaduan)
        legendItems = [
            { label: "Wajib AMDAL (Risiko Tinggi)", color: "bg-red-500", layerId: "layer-amdal", shape: 'square' },
            { label: "Wajib UKL-UPL (Menengah)", color: "bg-amber-500", layerId: "layer-uklupl", shape: 'square' },
            { label: "Wajib SPPL (Risiko Rendah)", color: "bg-emerald-500", layerId: "layer-sppl", shape: 'square' },
            { label: "Aduan: Triage / Verifikasi", color: "bg-rose-600", layerId: "layer-complaints", shape: 'pulsing' },
            { label: "Aduan: Diinvestigasi Petugas", color: "bg-indigo-600", layerId: "layer-complaints", shape: 'pulsing' },
            { label: "Aduan: Selesai Ditindak", color: "bg-teal-600", layerId: "layer-complaints", shape: 'pulsing' },
        ];
    }

    // [DYNAMIC INJECTION] Sisipkan skala warna standar US EPA AQI jika layer AQI diaktifkan oleh pengguna
    const showAqiLegend = !isOfficer && activeLayers.includes("layer-aqi");

    const aqiLegendItems: LegendItem[] = [
        { label: "AQI: Baik (0 - 50)", color: "bg-emerald-500", layerId: "layer-aqi", shape: 'circle' },
        { label: "AQI: Sedang (51 - 100)", color: "bg-yellow-400", layerId: "layer-aqi", shape: 'circle' },
        { label: "AQI: Tidak Sehat Sensitif (101-150)", color: "bg-orange-500", layerId: "layer-aqi", shape: 'circle' },
        { label: "AQI: Tidak Sehat (151 - 200)", color: "bg-red-500", layerId: "layer-aqi", shape: 'circle' },
        { label: "AQI: Sangat Berbahaya (> 201)", color: "bg-purple-600", layerId: "layer-aqi", shape: 'circle' }
    ];

    return (
        <div className="absolute bottom-8 right-8 z-30 pointer-events-none flex flex-row items-end gap-4 select-none">

            {/* 1. KOTAK LEGENDA (Frameless Continuous List) */}
            <div className="pointer-events-auto bg-white border border-slate-300 shadow-sm rounded-none w-56 animate-in fade-in slide-in-from-bottom-4 flex flex-col max-h-[75vh] overflow-y-auto custom-scrollbar">

                {/* Header Legenda */}
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
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
                                {/* Rendering Shape berdasarkan Tipe Data (Polymorphic Indicator) */}
                                <div className="relative w-3 h-3 shrink-0 flex items-center justify-center">
                                    {item.shape === 'pulsing' && (
                                        <span className={cn(
                                            "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                                            item.color.replace('600', '400') // Efek glow lebih terang dari warna dasar
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

                {/* [DYNAMICAL SUBMENU] Bagian Legenda Tambahan Kualitas Udara */}
                {showAqiLegend && (
                    <div className="flex flex-col border-t border-slate-200 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Sub-Header Legenda Kualitas Udara */}
                        <div className="px-3 py-1.5 bg-slate-100 text-left border-b border-slate-200">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Standar Polusi AQI</span>
                        </div>

                        {/* List Range Nilai AQI */}
                        {aqiLegendItems.map((item, idx) => (
                            <div
                                key={`aqi-${idx}`}
                                className="flex items-center gap-3 px-3 py-2 border-b border-slate-100 last:border-0"
                            >
                                <div className="relative w-3 h-3 shrink-0 flex items-center justify-center">
                                    <div className={cn(
                                        "relative w-2.5 h-2.5 rounded-full border border-white shadow-sm",
                                        item.color
                                    )} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 tracking-tight leading-none text-left">
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
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