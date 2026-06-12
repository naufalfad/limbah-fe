// src/modules/admin/components/gis/PanelOrchestrator.tsx
import React, { useEffect, useState } from "react";
import { X, Map as MapIcon } from "lucide-react";
import { useGisUIStore } from "@/store/useGisUIStore";
import { GisPanelType } from "@/types/gis";

// Mengimpor Sub-Panel GFW Spasial (Cohesive Modules)
import LayerPanel from "./panels/LayerPanel";
import CompanyPanel from "./panels/CompanyPanel";
import DetailPanel from "./panels/DetailPanel";
import PatrolTaskPanel from "./panels/PatrolTaskPanel";
import TaskDetailPanel from "./panels/TaskDetailPanel";
import EnvironmentalTelemetryPanel from "./panels/EnvironmentalTelemetryPanel";
import BasemapPanel from "./panels/BasemapPanel";

// [NEW IMPOR] Menyuntikkan Panel Analisis Telemetri Air Sungai (BOD/COD)
import WaterTelemetryPanel from "./panels/WaterTelemetryPanel";

// MODULAR: Mengimpor laci taktis telemetri live dari modul transport
import ActiveFleetPanel  from "@/modules/transport/components/gis/panels/ActiveFleetPanel";

// [NEW MODULE] Mengimpor laci asisten AI Forensik untuk Pimpinan/Admin
import ExecutiveCopilotPanel from "@/modules/dashboard/components/auditor/ExecutiveCopilotPanel";

/**
 * PanelOrchestrator - The Stacking Drawer (GFW Paradigm)
 * Mengatur dua jenis perilaku panel dengan Sumbu X (Width) yang dinamis & reaktif:
 * 1. Panel Menu (Flush/Docked): Lebar dinamis (280px - 360px), menempel rapat di kiri (Zero Gap).
 * 2. Panel Detail (Floating): Melayang secara dinamis berdampingan mengikuti jumlah tumpukan.
 * 
 * GRASP: Indirection & Pure Fabrication
 */
export default function PanelOrchestrator() {
    const { activePanels, closePanel, closePanelsToTheRight } = useGisUIStore();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // ==========================================================================
    // DYNAMIC WIDTH ALGORITHM (LOD LAYOUT ENGINE)
    // ==========================================================================
    const getPanelWidth = (type: GisPanelType) => {
        if (isMobile) return window.innerWidth - 64;

        // Memperlebar laci AI Copilot dan Detail Industri ke 360px demi kenyamanan analisis [3]
        if (type === "ai-copilot" || type === "detil-perusahaan") {
            return 360;
        }
        if (type === "telemetri-lingkungan" || type === "detail-tugas") {
            return 320;
        }
        return 280; // Lebar default untuk laci menu kiri biasa
    };

    return (
        <div className="absolute top-16 bottom-0 left-16 z-30 pointer-events-none flex items-start">
            {activePanels.map((panel, index) => {
                // 1. EVALUASI TIPOLOGI PANEL SECARA DINAMIS
                const isFloating =
                    panel.type === "detil-perusahaan" ||
                    panel.type === "detail-tugas" ||
                    panel.type === "telemetri-lingkungan";

                const currentWidth = getPanelWidth(panel.type);

                // 2. DYNAMIC OFFSET CALCULATION (Menghitung sumbu X tanpa hardcoded multiplier) [3]

                // Kalkulasi offset X untuk panel docked sebelah kiri (Flush)
                let dockedOffset = 0;
                for (let i = 0; i < index; i++) {
                    const p = activePanels[i];
                    const pIsFloating = p.type === "detil-perusahaan" || p.type === "detail-tugas" || p.type === "telemetri-lingkungan";
                    if (!pIsFloating) {
                        dockedOffset += getPanelWidth(p.type);
                    }
                }

                // Kalkulasi posisi kiri (left) untuk panel melayang (Floating)
                let floatingLeft = 16;
                if (!isMobile) {
                    // A. Jumlahkan total lebar laci docked di kiri layar [3]
                    let totalDockedWidth = 0;
                    activePanels.forEach(p => {
                        const pIsFloating = p.type === "detil-perusahaan" || p.type === "detail-tugas" || p.type === "telemetri-lingkungan";
                        if (!pIsFloating) {
                            totalDockedWidth += getPanelWidth(p.type);
                        }
                    });

                    // B. Jumlahkan total lebar laci floating sebelum index saat ini [3]
                    let totalFloatingBefore = 0;
                    for (let i = 0; i < index; i++) {
                        const p = activePanels[i];
                        const pIsFloating = p.type === "detil-perusahaan" || p.type === "detail-tugas" || p.type === "telemetri-lingkungan";
                        if (pIsFloating) {
                            totalFloatingBefore += getPanelWidth(p.type) + 16; // 16px gap antar laci
                        }
                    }

                    floatingLeft = totalDockedWidth + totalFloatingBefore + 16;
                }

                return (
                    <div
                        key={panel.id}
                        className={`absolute pointer-events-auto transition-all duration-300 ease-in-out bg-white overflow-hidden flex flex-col ${isFloating
                            ? 'shadow-2xl border border-slate-200 rounded-none'
                            : 'border-r border-slate-200 shadow-none rounded-none'
                            }`}
                        style={
                            isFloating
                                ? {
                                    left: `${floatingLeft}px`,
                                    top: '16px',
                                    bottom: '16px',
                                    width: `${currentWidth}px`, // Menggunakan lebar dinamis [3]
                                    maxWidth: 'calc(100vw - 80px)',
                                    zIndex: 50,
                                }
                                : {
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: `${currentWidth}px`, // Menggunakan lebar dinamis [3]
                                    transform: `translateX(${dockedOffset}px)`, // Menggunakan offset dinamis [3]
                                    zIndex: 40 - index,
                                }
                        }
                    >
                        {/* HEADER PANEL */}
                        <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0 select-none">
                            <div className="flex flex-col text-left">
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">
                                    {panel.type.replace("-", " ")}
                                </span>
                                <h3 className="text-[11px] font-bold text-slate-800 truncate max-w-[280px] tracking-tight mt-1 uppercase leading-none">
                                    {panel.title}
                                </h3>
                            </div>

                            <button
                                onClick={() => closePanel(panel.id)}
                                className="p-1 rounded-none bg-transparent hover:bg-slate-200 text-slate-400 hover:text-rose-500 transition-colors active:scale-95 outline-none"
                                title="Tutup Panel"
                            >
                                <X size={16} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* BODY PANEL */}
                        <div
                            className="flex-1 overflow-y-auto custom-scrollbar"
                            onClick={() => !isFloating && closePanelsToTheRight(index)}
                        >
                            {renderPanelContent(panel.type, panel.data)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Fungsi Delegasi Rendering Konten Panel secara Modular (GRASP - High Cohesion)
function renderPanelContent(type: GisPanelType, data: any) {
    switch (type) {
        case "layer-kewajiban":
            return <LayerPanel />;
        case "katalog-perusahaan":
            return <CompanyPanel />;
        case "tugas-patroli":
            return <PatrolTaskPanel />;
        case "armada-tracking":
            return <ActiveFleetPanel />;
        case "detil-perusahaan":
            return <DetailPanel companyData={data} />;

        // =====================================================================
        // [RESOLUSI POLIMORFISME] PENYALURAN DELEGASI PANEL DETAIL KUALITAS AIR
        // =====================================================================
        case "telemetri-lingkungan":
            if (data && data.isWaterStation) {
                return <WaterTelemetryPanel stationData={data} />;
            }
            return <EnvironmentalTelemetryPanel companyData={data} />;

        case "detail-tugas":
            return <TaskDetailPanel taskData={data} />;
        case "basemap-gallery":
            return <BasemapPanel />;
        case "ai-copilot": // <-- REGISTRASI RENDERER AI FORENSIK
            return <ExecutiveCopilotPanel />;
        case "tentang":
            return (
                <div className="p-6 text-center space-y-3 text-slate-500 font-sans">
                    <MapIcon size={32} className="mx-auto text-emerald-600/40 animate-pulse" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 leading-none">PANTAU LIMBAH GIS</p>
                        <p className="text-[11px] mt-2 font-medium leading-relaxed text-justify">Sistem Pemetaan Geospasial Kepatuhan Lingkungan v1.0</p>
                    </div>
                </div>
            );
        default:
            return <div className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-left">Modul sedang dikonstruksi...</div>;
    }
}