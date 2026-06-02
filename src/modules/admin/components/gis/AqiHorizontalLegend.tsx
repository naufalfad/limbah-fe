// src/modules/admin/components/gis/AqiHorizontalLegend.tsx
import React, { useState, useEffect } from "react";
import { Wind, Plus, Minus, Maximize } from "lucide-react";
import { useGisUIStore } from "@/store/useGisUIStore";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * AQI HORIZONTAL LEGEND & EMBEDDED ZOOM HUD (GFW PARADIGM)
 * ============================================================================
 * Menampilkan bilah spektrum warna kualitas udara secara mendatar di bawah 
 * layar. Dilengkapi dengan logika dynamic centering offset, kontrol zoom 
 * taktis, dan continuous gradient mapping untuk menyelaraskan estetika 
 * dengan peta spasial di belakangnya [3].
 */
export default function AqiHorizontalLegend() {
    const { activeLayers, activePanels } = useGisUIStore();

    // State lokal untuk melacak perubahan resolusi lebar layar (Responsive Sync)
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== "undefined" ? window.innerWidth : 1200
    );

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Hanya tampilkan legenda ini jika Layer Kualitas Udara (AQI) sedang diaktifkan
    if (!activeLayers.includes("layer-aqi")) return null;

    // Spektrum Warna & Label Kategori berdasarkan Standar US EPA
    // PRO-TIP: Kita menggunakan hex 'color' untuk memetakan CSS Gradient secara presisi
    const aqiSpectrum = [
        { label: "Baik", range: "0 - 50", color: "#10b981", text: "text-white" },               // Emerald 500
        { label: "Sedang", range: "51 - 100", color: "#facc15", text: "text-slate-900" },       // Yellow 400
        { label: "Sensitif", range: "101 - 150", color: "#f97316", text: "text-white" },        // Orange 500
        { label: "Tidak Sehat", range: "151 - 200", color: "#ef4444", text: "text-white" },     // Red 500
        { label: "Sangat Tidak Sehat", range: "201 - 300", color: "#9333ea", text: "text-white" },// Purple 600
        { label: "Berbahaya", range: "300+", color: "#7e0023", text: "text-white" }             // Maroon
    ];

    // ==========================================================================
    // MATHEMATICAL DYNAMIC CENTERING CALCULATION (LOD LAYOUT COHESION) [3]
    // ==========================================================================
    const leftSidebarWidth = 64; // Lebar tetap sidebar kiri (w-16)

    // Hitung total akumulasi lebar laci yang sedang aktif di sebelah kiri [3]
    const activePanelsWidth = activePanels.reduce((sum, panel) => {
        if (panel.type === "ai-copilot" || panel.type === "detil-perusahaan") {
            return sum + 360; // Laci lebar forensik
        }
        if (panel.type === "telemetri-lingkungan" || panel.type === "detail-tugas") {
            return sum + 320; // Laci detail spasial
        }
        return sum + 280; // Laci menu biasa
    }, 0);

    const totalLeftBlockedWidth = leftSidebarWidth + activePanelsWidth;

    // Hitung koordinat tengah dari sisa peta kosong yang tidak terblokir laci [3]
    const remainingWidth = windowWidth - totalLeftBlockedWidth;
    const calculatedLeftPosition = totalLeftBlockedWidth + (remainingWidth / 2);

    // ==========================================================================
    // CONTINUOUS GRADIENT GENERATOR
    // Menghasilkan string linear-gradient() dengan akurasi persentase terpusat.
    // Memastikan teks selalu berada di atas warna solid, dan perpaduan 
    // warna hanya terjadi di batas antara dua segmen.
    // ==========================================================================
    const colorStops = aqiSpectrum.map((item, index) => {
        // Formula matematika membagi 6 elemen untuk mencari titik tengah murni tiap elemen.
        // Contoh: index 0 (0-16.6%) -> titik puncak warna solid berada di 8.3%
        const centerPercent = ((index * 2 + 1) / (aqiSpectrum.length * 2)) * 100;
        return `${item.color} ${centerPercent}%`;
    }).join(", ");

    const smoothGradientBackground = `linear-gradient(to right, ${colorStops})`;

    return (
        <div
            // Menggunakan transition-all agar posisi bergeser mulus (sliding) saat laci buka-tutup [3]
            className="absolute bottom-8 z-[9999] pointer-events-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl transition-all ease-in-out"
            style={{ left: `${calculatedLeftPosition}px`, transform: "translateX(-50%)" }}
        >

            {/* Header Legenda Tipis */}
            <div className="bg-white/90 backdrop-blur border border-slate-200 border-b-0 px-3 py-1 flex items-center gap-1.5 shadow-sm">
                <Wind size={12} className="text-emerald-700 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">
                    US EPA Air Quality Index (AQI)
                </span>
            </div>

            {/* Bilah Warna & Integrasi Kontrol Zoom Terpadu (Continuous Bar) [3] */}
            <div className="flex bg-white border border-slate-200 shadow-lg shadow-slate-900/20 rounded-none overflow-hidden">

                {/* 1. SEGMEN SPEKTRUM WARNA AQI (GRADASI KONTINU) */}
                <div
                    className="flex"
                    style={{ background: smoothGradientBackground }}
                >
                    {aqiSpectrum.map((item, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "flex flex-col items-center justify-center px-2 md:px-4 py-1.5 min-w-[55px] md:min-w-[85px] border-r border-black/10 last:border-r-0 transition-all hover:backdrop-brightness-110 bg-transparent",
                                item.text
                            )}
                            title={`AQI ${item.range}: ${item.label}`}
                        >
                            <span className="text-[9px] font-black tracking-tight whitespace-nowrap leading-none uppercase drop-shadow-sm">
                                {item.label}
                            </span>
                            <span className="text-[8px] font-black opacity-90 mt-1 leading-none drop-shadow-sm">
                                {item.range}
                            </span>
                        </div>
                    ))}
                </div>

                {/* 2. SEGMEN TOMBOL ZOOM EMBEDDED (HUD INTEGRATION) [3] */}
                <div className="flex bg-slate-950 text-slate-300 select-none divide-x divide-white/10 shrink-0">
                    <button
                        onClick={() => window.dispatchEvent(new Event('map-zoom-in'))}
                        className="w-10 h-full flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors duration-150 outline-none cursor-pointer"
                        title="Perbesar (Zoom In)"
                    >
                        <Plus size={14} strokeWidth={3} />
                    </button>
                    <button
                        onClick={() => window.dispatchEvent(new Event('map-reset-view'))}
                        className="w-11 h-full flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors duration-150 outline-none cursor-pointer"
                        title="Reset Fokus Peta"
                    >
                        <Maximize size={12} strokeWidth={3} />
                    </button>
                    <button
                        onClick={() => window.dispatchEvent(new Event('map-zoom-out'))}
                        className="w-10 h-full flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors duration-150 outline-none cursor-pointer"
                        title="Perkecil (Zoom Out)"
                    >
                        <Minus size={14} strokeWidth={3} />
                    </button>
                </div>

            </div>

        </div>
    );
}