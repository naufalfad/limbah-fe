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

// MODULAR: Mengimpor laci taktis telemetri live dari modul transport
import ActiveFleetPanel from "@/modules/transport/components/gis/panels/ActiveFleetPanel";

/**
 * PanelOrchestrator - The Stacking Drawer (GFW Paradigm)
 * Mengatur dua jenis perilaku panel dengan Sumbu X (Width) yang ramping:
 * 1. Panel Menu (Flush/Docked): 280px, menempel rapat di kiri (Zero Gap).
 * 2. Panel Detail (Floating): Melayang secara dinamis mengikuti jumlah tumpukan.
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

    // Sumbu X: Base width 280px (Ultra Slim untuk ruang peta maksimal)
    const PANEL_WIDTH = isMobile ? (typeof window !== 'undefined' ? window.innerWidth - 64 : 280) : 280;
    const PANEL_GAP = 0; // Zero Gap Policy (Flush)

    return (
        <div className="absolute top-16 bottom-0 left-16 z-30 pointer-events-none flex items-start">
            {activePanels.map((panel, index) => {
                // Cek apakah ini panel detail yang harus melayang (Floating Panel)
                const isFloating = panel.type === "detil-perusahaan";

                const xOffset = index * (PANEL_WIDTH + PANEL_GAP);
                const floatingLeft = isMobile ? 16 : (index * PANEL_WIDTH) + 16;

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
                                    width: '320px', // Panel detail sedikit lebih lebar
                                    maxWidth: 'calc(100vw - 80px)',
                                    zIndex: 50,
                                }
                                : {
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: `${PANEL_WIDTH}px`,
                                    transform: `translateX(${xOffset}px)`,
                                    zIndex: 40 - index,
                                }
                        }
                    >
                        {/* HEADER PANEL */}
                        <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">
                                    {panel.type.replace("-", " ")}
                                </span>
                                <h3 className="text-[11px] font-bold text-slate-800 truncate max-w-[200px] tracking-tight mt-1 uppercase leading-none">
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

// Fungsi Delegasi Rendering Konten Panel secara Modular (GRASP - High Cohesion) [3]
function renderPanelContent(type: GisPanelType, data: any) {
    switch (type) {
        case "layer-kewajiban":
            return <LayerPanel />;
        case "katalog-perusahaan":
            return <CompanyPanel />;
        case "tugas-patroli":
            return <PatrolTaskPanel />;
        case "armada-tracking":
            return <ActiveFleetPanel />; // <-- MODULAR: Mengarahkan laci ke modul transport
        case "detil-perusahaan":
            return <DetailPanel companyData={data} />;
        case "tentang":
            return (
                <div className="p-6 text-center space-y-3 text-slate-500 font-sans">
                    <MapIcon size={32} className="mx-auto text-emerald-600/40 animate-pulse" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 leading-none">PANTAU LIMBAH GIS</p>
                        <p className="text-[11px] mt-2 font-medium leading-relaxed">Sistem Pemetaan Geospasial Kepatuhan Lingkungan v1.0</p>
                    </div>
                </div>
            );
        default:
            return <div className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Modul sedang dikonstruksi...</div>;
    }
}