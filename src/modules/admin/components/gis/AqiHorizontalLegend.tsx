// src/modules/admin/components/gis/AqiHorizontalLegend.tsx
import React from "react";
import { Wind } from "lucide-react";
import { useGisUIStore } from "@/store/useGisUIStore";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * AQI HORIZONTAL LEGEND (IQAir / BMKG Style)
 * ============================================================================
 * Menampilkan bilah spektrum warna kualitas udara secara mendatar di bawah 
 * layar. Menghindari Cognitive Overload akibat legenda vertikal yang memakan
 * terlalu banyak ruang kanvas peta.
 */
export default function AqiHorizontalLegend() {
    const { activeLayers } = useGisUIStore();

    // Hanya tampilkan legenda ini jika Layer Kualitas Udara (AQI) sedang diaktifkan
    if (!activeLayers.includes("layer-aqi")) return null;

    // Spektrum Warna & Label Kategori berdasarkan Standar US EPA
    const aqiSpectrum = [
        { label: "Baik", range: "0 - 50", bg: "bg-[#10b981]", text: "text-white" },               // Emerald 500
        { label: "Sedang", range: "51 - 100", bg: "bg-[#facc15]", text: "text-slate-900" },       // Yellow 400
        { label: "Sensitif", range: "101 - 150", bg: "bg-[#f97316]", text: "text-white" },        // Orange 500
        { label: "Tidak Sehat", range: "151 - 200", bg: "bg-[#ef4444]", text: "text-white" },     // Red 500
        { label: "Sangat Tidak Sehat", range: "201 - 300", bg: "bg-[#9333ea]", text: "text-white" },// Purple 600
        { label: "Berbahaya", range: "300+", bg: "bg-[#7e0023]", text: "text-white" }             // Maroon
    ];

    return (
        // FIX Z-INDEX: Menggunakan z-[9999] agar lepas dari jebakan Leaflet Panes (z-400)
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl">

            {/* Header Legenda Tipis */}
            <div className="bg-white/90 backdrop-blur border border-slate-200 border-b-0 px-3 py-1 flex items-center gap-1.5 shadow-sm">
                <Wind size={12} className="text-emerald-700" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">
                    US EPA Air Quality Index (AQI)
                </span>
            </div>

            {/* Bilah Warna Horizontal (Continuous Flush Bar) */}
            <div className="flex bg-white/90 backdrop-blur border border-slate-200 shadow-lg shadow-slate-900/20">
                {aqiSpectrum.map((item, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "flex flex-col items-center justify-center px-3 md:px-4 py-1.5 min-w-[60px] md:min-w-[90px] border-r border-white/20 last:border-r-0 transition-all hover:brightness-110",
                            item.bg,
                            item.text
                        )}
                        title={`AQI ${item.range}: ${item.label}`}
                    >
                        <span className="text-[10px] font-bold tracking-tight whitespace-nowrap leading-none">
                            {item.label}
                        </span>
                        <span className="text-[8px] font-black opacity-80 mt-1 leading-none">
                            {item.range}
                        </span>
                    </div>
                ))}
            </div>

        </div>
    );
}