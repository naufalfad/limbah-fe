// src/modules/admin/components/gis/PanelOrchestrator.tsx
import React, { useEffect, useState } from "react";
import { X, Map as MapIcon, GripHorizontal } from "lucide-react";
import { useGisUIStore } from "@/store/useGisUIStore";
import { GisPanelType } from "@/types/gis";
import { motion, AnimatePresence } from "framer-motion";

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
import ActiveFleetPanel from "@/modules/transport/components/gis/panels/ActiveFleetPanel";

// [NEW MODULE] Mengimpor laci asisten AI Forensik untuk Pimpinan/Admin
import ExecutiveCopilotPanel from "@/modules/dashboard/components/auditor/ExecutiveCopilotPanel";
import AboutPanel from "./panels/AboutPanel";

// =========================================================================
// MAPPER BAHASA INDONESIA: Menerjemahkan Tipe Panel Teknis ke Label Kategori
// Diperbesar ke text-sm, tanpa bold, tanpa capslock (Apple-Style UI) [3]
// =========================================================================
const getPanelCategoryLabel = (type: GisPanelType): string => {
    const labels: Record<GisPanelType, string> = {
        'layer-kewajiban': 'Konfigurasi layer',
        'basemap-gallery': 'Katalog peta dasar',
        'katalog-perusahaan': 'Katalog industri',
        'detil-perusahaan': 'Detail perusahaan',
        'telemetri-lingkungan': 'Telemetri lingkungan',
        'tugas-patroli': 'Tugas patroli',
        'detail-tugas': 'Detail tugas',
        'armada-tracking': 'Pelacakan armada',
        'hasil-pencarian': 'Hasil pencarian',
        'tentang': 'Tentang sistem',
        'ai-copilot': 'AI Analisis Spasial', // Diperbarui sesuai permintaan revisi
        'sensor-management': 'Manajemen sensor'
    };
    return labels[type] || type.replace("-", " ");
};

// =========================================================================
// OTAC RESOLVER DINAMIS: Mengekstrak Nama Perusahaan / Stasiun Aktif (Information Expert)
// Jika terdeteksi, gantikan judul statis default dengan nama entitas riil [3]
// =========================================================================
const getPanelDynamicTitle = (panel: any): string => {
    if (!panel) return "";

    // JIKA PANEL ADALAH AI COPILOT: Hapus subtitle kedua agar tidak redundant dengan spanduk dalam
    if (panel.type === 'ai-copilot') {
        return "";
    }

    if (!panel.data) return panel.title;

    // A. Deteksi detail industri aktif
    if (panel.type === 'detil-perusahaan' && panel.data.companyName) {
        return panel.data.companyName;
    }

    // B. Deteksi telemetri aktif (mendukung stasiun air & stasiun udara)
    if (panel.type === 'telemetri-lingkungan') {
        if (panel.data.isWaterStation && panel.data.name) {
            return panel.data.name;
        }
        if (panel.data.companyName) {
            return panel.data.companyName;
        }
    }

    // C. Deteksi detail penugasan sidak aktif
    if (panel.type === 'detail-tugas') {
        if (panel.data.companyId === 'COM-UNKNOWN') {
            return 'Penyelidikan pengaduan warga';
        }
        if (panel.data.companyName) {
            return panel.data.companyName;
        }
    }

    return panel.title;
};

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
        <div className="absolute top-16 md:bottom-0 bottom-16 left-0 md:left-16 right-0 md:right-auto z-[100] md:z-30 pointer-events-none md:pointer-events-auto flex items-start">
            <AnimatePresence>
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
                        <motion.div
                            key={panel.id}
                            initial={isMobile ? { y: '100%' } : { opacity: 0, x: -20 }}
                            animate={isMobile ? { y: 0 } : { opacity: 1, x: 0 }}
                            exit={isMobile ? { y: '100%' } : { opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className={`absolute pointer-events-auto bg-white overflow-hidden flex flex-col ${isFloating
                                ? 'md:shadow-2xl md:border border-slate-200 md:rounded-none'
                                : 'md:border-r border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] md:shadow-none rounded-t-3xl md:rounded-none'
                                }`}
                            style={
                                isFloating
                                    ? {
                                        left: isMobile ? 0 : `${floatingLeft}px`,
                                        top: isMobile ? '10vh' : '16px',
                                        bottom: isMobile ? 0 : '16px',
                                        width: isMobile ? '100%' : `${currentWidth}px`, // Menggunakan lebar dinamis [3]
                                        maxWidth: isMobile ? '100%' : 'calc(100vw - 80px)',
                                        zIndex: isMobile ? 100 + index : 50,
                                    }
                                    : {
                                        left: 0,
                                        top: isMobile ? '25vh' : 0,
                                        bottom: 0,
                                        width: isMobile ? '100%' : `${currentWidth}px`, // Menggunakan lebar dinamis [3]
                                        transform: isMobile ? 'none' : `translateX(${dockedOffset}px)`, // Menggunakan offset dinamis [3]
                                        zIndex: isMobile ? 100 + index : 40 - index,
                                    }
                            }
                        >
                            {/* DRAG HANDLE FOR MOBILE (Google Maps Style) */}
                            {isMobile && (
                                <div className="w-full flex justify-center py-2 bg-white shrink-0 cursor-pointer active:bg-slate-50 transition-colors group" onClick={() => closePanel(panel.id)}>
                                    <div className="w-12 h-1.5 bg-slate-200 group-hover:bg-slate-300 transition-colors rounded-full"></div>
                                </div>
                            )}

                            {/* HEADER PANEL (Penyelarasan Hirarki Visual, Tanpa Bold/Capslock) */}
                            <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0 select-none text-left">
                                <div className="flex flex-col">
                                    {/* Kategori Atas: Diperbesar ke text-sm, warna emerald, tidak tebal, tidak capslock */}
                                    <span className="text-sm font-normal text-emerald-600 leading-none">
                                        {getPanelCategoryLabel(panel.type)}
                                    </span>
                                    {/* Judul/Nama Entitas Bawah: Hanya dirender jika string dinamis tidak kosong */}
                                    {getPanelDynamicTitle(panel) && (
                                        <h3 className="text-xs font-normal text-slate-505 truncate max-w-[280px] tracking-tight mt-1.5 leading-none">
                                            {getPanelDynamicTitle(panel)}
                                        </h3>
                                    )}
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
                        </motion.div>
                    );
                })}
            </AnimatePresence>
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
            return <AboutPanel />;
        default:
            return <div className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-left">Modul sedang dikonstruksi...</div>;
    }
}