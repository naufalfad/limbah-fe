// src/modules/dashboard/pages/AuditorDashboardPage.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Button } from "@/components/ui/button";
import { Download, BarChart4, Map as MapIcon, ClipboardList, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Mengimpor Sub-Modul Eksekutif yang sudah di-diet & dimodularisasi (Prinsip GRASP: Low Coupling)
import AnalyticsTab from "@/modules/dashboard/components/auditor/AnalyticsTab";
import PerformanceTab from "@/modules/dashboard/components/auditor/PerformanceTab";

/**
 * AuditorDashboardPage - The Executive Shell & Orchestrator (Diet UI)
 * Bertindak sebagai kerangka utama halaman pimpinan/auditor:
 * 1. Menampilkan Header Utama dan Tab Navigator yang kaku & rapat.
 * 2. Memicu sinkronisasi data master DLH & data agregat analitik secara terpusat [3].
 * 3. Memilih & merender komponen tab yang aktif sesuai parameter URL [3].
 */
export default function AuditorDashboardPage() {
    const { tab } = useParams();
    const navigate = useNavigate();

    // Mengambil pemicu API eksekutif dari Zustand Store
    const {
        fetchCompanies,
        fetchWasteLogs,
        fetchInvoices,
        fetchInspections,
        fetchExecutiveAnalytics,
        fetchPerformanceAnalytics
    } = useSijagaStore();

    const activeTab = tab || "analytics";

    // State pelacak pemuatan data
    const [isLoading, setIsLoading] = useState(true);

    // Memicu sinkronisasi data global DLH sekaligus analitik eksekutif secara paralel (Information Expert) [3]
    useEffect(() => {
        const loadExecutiveDashboardData = async () => {
            setIsLoading(true);
            try {
                await Promise.all([
                    fetchCompanies(),
                    fetchWasteLogs(),
                    fetchInvoices(),
                    fetchInspections(),
                    fetchExecutiveAnalytics(),  // API Agregat 1: Kepatuhan MoM, Keuangan, & Tren Limbah
                    fetchPerformanceAnalytics() // API Agregat 2: Kinerja DLH & Bottleneck Berkas
                ]);
            } catch (error) {
                console.error("Gagal sinkronisasi data eksekutif pimpinan:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadExecutiveDashboardData();
    }, [
        fetchCompanies,
        fetchWasteLogs,
        fetchInvoices,
        fetchInspections,
        fetchExecutiveAnalytics,
        fetchPerformanceAnalytics
    ]);

    const handleExport = () => {
        toast.success("Mengekspor laporan eksekutif kepatuhan ESG (.PDF). Mohon tunggu...");
    };

    // Fungsi merender tab aktif secara dinamis (Modular Rendering)
    const renderTabContent = () => {
        switch (activeTab) {
            case "performance":
                return <PerformanceTab />;
            case "analytics":
            default:
                return <AnalyticsTab />;
        }
    };

    // Tampilan Memuat Data Eksekutif (GFW Tactical Spinner)
    if (isLoading) {
        return (
            <DashboardLayout role="AUDITOR">
                <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
                    <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 animate-pulse">
                        Mengagregasi Data Keuangan & Kepatuhan Daerah...
                    </p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="AUDITOR">
            <div className="space-y-4 text-left">

                {/* --- 1. HEADER UTAMA (DIET CARD) --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-none border border-slate-200 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
                            Command Center Auditor
                        </h1>
                        <p className="text-slate-500 text-xs font-medium mt-1.5">
                            Pemantauan tingkat kepatuhan industri, kinerja pengawasan DLH, dan analisis ESG daerah secara geospasial.
                        </p>
                    </div>

                    <Button
                        onClick={handleExport}
                        size="sm"
                        className="w-full md:w-auto h-9 bg-slate-900 hover:bg-emerald-600 text-white font-bold gap-1.5 px-4 rounded-none text-[10px] tracking-widest uppercase shadow-sm"
                    >
                        <Download size={14} /> Export Laporan Eksekutif
                    </Button>
                </div>

                {/* --- 2. TAB NAVIGATION BAR (Sharp Edges) --- */}
                <div className="flex gap-1.5 p-1 bg-slate-100 rounded-none w-fit border border-slate-200">
                    <TabNavButton
                        active={activeTab === "analytics"}
                        label="Executive Analytics"
                        icon={<BarChart4 size={14} />}
                        onClick={() => navigate("/auditor")}
                    />
                    {/* RUTE SPASIAL IMERSIF: Tombol navigasi langsung meluncur ke AuditorGISPage penuh layar */}
                    <TabNavButton
                        active={false}
                        label="Geospasial Kepatuhan"
                        icon={<MapIcon size={14} />}
                        onClick={() => navigate("/auditor/gis")}
                    />
                    <TabNavButton
                        active={activeTab === "performance"}
                        label="Laporan Kinerja DLH"
                        icon={<ClipboardList size={14} />}
                        onClick={() => navigate("/auditor/performance")}
                    />
                </div>

                {/* --- 3. DYNAMIC TAB CONTENT (High Cohesion) --- */}
                <div className="pt-2">
                    {renderTabContent()}
                </div>

            </div>
        </DashboardLayout>
    );
}

// --- SUB-COMPONENTS ---

interface TabNavButtonProps {
    active: boolean;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
}

function TabNavButton({ active, label, icon, onClick }: TabNavButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-none font-bold text-[10px] uppercase tracking-wider transition-all outline-none ${active
                ? "bg-white text-emerald-700 shadow-sm border border-slate-200/50 font-black"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}