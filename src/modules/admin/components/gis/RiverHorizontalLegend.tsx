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
    const [isMobile, setIsMobile] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setWindowWidth(width);
            setIsMobile(width < 768);
            if (width >= 768) {
                setIsExpanded(true); // Selalu terbuka di desktop
            } else {
                setIsExpanded(false); // Default tertutup di mobile
            }
        };
        handleResize();
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
            className={cn(
                "absolute z-[9999] pointer-events-auto flex animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl transition-all ease-in-out",
                isMobile ? "bottom-24 left-4 flex-col items-start" : "bottom-8 flex-col items-center"
            )}
            style={isMobile ? {} : { left: `${calculatedLeftPosition}px`, transform: "translateX(-50%)" }}
        >
            {isMobile && !isExpanded ? (
                <button 
                    onClick={() => setIsExpanded(true)}
                    className="bg-white/90 backdrop-blur border border-slate-300 shadow-sm w-10 h-10 flex items-center justify-center text-slate-600 hover:text-cyan-700 hover:bg-slate-50 transition-colors active:bg-slate-200 rounded-full outline-none animate-in zoom-in-95"
                    title="Buka Legenda Air"
                >
                    <Droplets size={18} strokeWidth={2.5} />
                </button>
            ) : (
                <>
                    {/* Header Legenda Tipis */}
                    <div 
                        className="bg-white/90 backdrop-blur border border-slate-200 border-b-0 px-3 py-2 md:py-1 flex items-center justify-between gap-4 shadow-sm w-full md:w-auto cursor-pointer md:cursor-default"
                        onClick={() => isMobile && setIsExpanded(false)}
                    >
                        <div className="flex items-center gap-1.5">
                            <Droplets size={12} className="text-cyan-600 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">
                                Baku Mutu Air Sungai (PP 22/2021 Kelas II)
                            </span>
                        </div>
                        {isMobile && <Minus size={12} className="text-slate-400" />}
                    </div>

                    {/* Bilah Warna & Kontrol Zoom Terpadu */}
                    <div className="flex flex-col md:flex-row bg-white border border-slate-200 shadow-lg shadow-slate-900/20 rounded-none overflow-hidden w-full md:w-auto">

                        {/* 1. SEGMEN BLOK WARNA (DISCRETE SPECTRUM) */}
                        <div className="flex flex-col md:flex-row custom-scrollbar w-full md:w-auto">
                            {riverSpectrum.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "flex flex-col items-center justify-center px-4 py-2 md:px-6 md:py-2 min-w-[90px] md:min-w-[130px] border-b md:border-b-0 md:border-r border-black/10 last:border-b-0 md:last:border-r-0 transition-all hover:backdrop-brightness-110",
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
                        <div className="hidden md:flex bg-slate-950 text-slate-300 select-none divide-x divide-white/10 shrink-0">
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
                </>
            )}
        </div>
    );
}