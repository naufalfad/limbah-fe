// src/modules/admin/components/gis/RiverHorizontalLegend.tsx
import React, { useState, useEffect } from "react";
import { Droplets, Plus, Minus, Maximize } from "lucide-react";
import { useGisUIStore } from "@/store/useGisUIStore";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * RIVER HORIZONTAL LEGEND & EMBEDDED ZOOM HUD (GFW PARADIGM)
 * ============================================================================
 * HUD mendatar khusus untuk menjelaskan spektrum warna garis sungai.
 * Akan otomatis mengkalkulasi ruang layar agar selalu berada di tengah (Centered)
 * meskipun laci panel sebelah kiri dibuka-tutup.
 */
export default function RiverHorizontalLegend() {
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

    // Hanya tampilkan legenda ini jika Layer Sungai sedang diaktifkan
    if (!activeLayers.includes("layer-river")) return null;

    // Spektrum Warna Kualitas Air berdasarkan Baku Mutu PP 22/2021
    const riverSpectrum = [
        { label: "Normal (Sehat)", range: "BOD < 2.0 mg/L", color: "#22d3ee", text: "text-slate-900" },   // Cyan 400
        { label: "Waspada (Ringan)", range: "BOD 2.0 - 3.0", color: "#fbbf24", text: "text-slate-900" }, // Amber 400
        { label: "Kritis (Berat)", range: "BOD > 3.0 mg/L", color: "#f43f5e", text: "text-white" }         // Rose 500
    ];

    // ==========================================================================
    // MATHEMATICAL DYNAMIC CENTERING CALCULATION
    // ==========================================================================
    const leftSidebarWidth = 64; // Lebar tetap sidebar kiri (w-16)

    // Hitung total akumulasi lebar laci yang sedang aktif di sebelah kiri
    const activePanelsWidth = activePanels.reduce((sum, panel) => {
        if (panel.type === "ai-copilot" || panel.type === "detil-perusahaan") return sum + 360;
        if (panel.type === "telemetri-lingkungan" || panel.type === "detail-tugas") return sum + 320;
        return sum + 280;
    }, 0);

    const totalLeftBlockedWidth = leftSidebarWidth + activePanelsWidth;
    const remainingWidth = windowWidth - totalLeftBlockedWidth;
    const calculatedLeftPosition = totalLeftBlockedWidth + (remainingWidth / 2);

    return (
        <div
            className="absolute bottom-8 z-[9999] pointer-events-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl transition-all ease-in-out"
            style={{ left: `${calculatedLeftPosition}px`, transform: "translateX(-50%)" }}
        >
            {/* Header Legenda Tipis */}
            <div className="bg-white/90 backdrop-blur border border-slate-200 border-b-0 px-3 py-1 flex items-center gap-1.5 shadow-sm">
                <Droplets size={12} className="text-cyan-600 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">
                    Baku Mutu Air Sungai (PP 22/2021 Kelas II)
                </span>
            </div>

            {/* Bilah Warna & Kontrol Zoom Terpadu */}
            <div className="flex bg-white border border-slate-200 shadow-lg shadow-slate-900/20 rounded-none overflow-hidden">

                {/* 1. SEGMEN BLOK WARNA (DISCRETE SPECTRUM) */}
                <div className="flex">
                    {riverSpectrum.map((item, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "flex flex-col items-center justify-center px-4 md:px-6 py-2 min-w-[90px] md:min-w-[130px] border-r border-black/10 transition-all hover:backdrop-brightness-110",
                                item.text
                            )}
                            style={{ backgroundColor: item.color }}
                            title={`Status: ${item.label}`}
                        >
                            <span className="text-[10px] font-black tracking-tight whitespace-nowrap leading-none uppercase drop-shadow-sm">
                                {item.label}
                            </span>
                            <span className="text-[9px] font-bold opacity-90 mt-1.5 leading-none drop-shadow-sm font-mono">
                                {item.range}
                            </span>
                        </div>
                    ))}
                </div>

                {/* 2. SEGMEN TOMBOL ZOOM EMBEDDED */}
                <div className="flex bg-slate-950 text-slate-300 select-none divide-x divide-white/10 shrink-0">
                    <button
                        onClick={() => window.dispatchEvent(new Event('map-zoom-in'))}
                        className="w-10 h-full flex items-center justify-center hover:bg-cyan-600 hover:text-white transition-colors duration-150 outline-none cursor-pointer"
                    >
                        <Plus size={14} strokeWidth={3} />
                    </button>
                    <button
                        onClick={() => window.dispatchEvent(new Event('map-reset-view'))}
                        className="w-11 h-full flex items-center justify-center hover:bg-cyan-600 hover:text-white transition-colors duration-150 outline-none cursor-pointer"
                    >
                        <Maximize size={12} strokeWidth={3} />
                    </button>
                    <button
                        onClick={() => window.dispatchEvent(new Event('map-zoom-out'))}
                        className="w-10 h-full flex items-center justify-center hover:bg-cyan-600 hover:text-white transition-colors duration-150 outline-none cursor-pointer"
                    >
                        <Minus size={14} strokeWidth={3} />
                    </button>
                </div>
            </div>
        </div>
    );
}