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
import ActiveFleetPanel from "@/modules/transport/components/gis/panels/ActiveFleetPanel";

// [NEW MODULE] Mengimpor laci asisten AI Forensik untuk Pimpinan/Admin
import ExecutiveCopilotPanel from "@/modules/dashboard/components/auditor/ExecutiveCopilotPanel";

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
        <div className="absolute top-16 bottom-0 left-16 z-30 pointer-events-auto flex items-start">
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