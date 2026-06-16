// src/modules/admin/components/gis/panels/DetailPanel.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    MapPin, Activity, ShieldCheck, Factory, FileText,
    Calendar, Users, Phone, Zap, CloudSun, Loader2,
    Badge
} from "lucide-react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { apiService } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Konstanta URL Backend untuk memuat berkas statis gambar [3]
const BACKEND_URL = "http://localhost:5000";

interface DetailPanelProps {
    companyData: any; // Menerima object company lengkap dari store/orchestrator
}

type DetailTabType = "umum" | "esg";

// Helper untuk normalisasi dokumen lingkungan secara konsisten (AMDAL, UKL-UPL, SPPL) [3]
const normalizeDocType = (docType: string): string => {
    if (!docType) return "-";
    const normalized = docType.trim().toUpperCase();
    if (normalized === "AMDAL") return "AMDAL";
    if (normalized === "SPPL") return "SPPL";
    if (normalized.includes("UKL") || normalized.includes("UPL")) return "UKL-UPL";
    return normalized;
};

export default function DetailPanel({ companyData }: DetailPanelProps) {
    const navigate = useNavigate();
    const { currentUser } = useSijagaStore();

    // Deteksi jika yang login adalah Petugas Lapangan (Adaptive UI)
    const isOfficer = currentUser?.role === "PETUGAS_LAPANGAN";

    const [activeTab, setActiveTab] = useState<DetailTabType>("umum");
    const [animateBars, setAnimateBars] = useState(false);

    // [NEW STATE] Menyimpan status loading & payload telemetri kualitas udara
    const [aqiData, setAqiData] = useState<any>(null);
    const [aqiLoading, setAqiLoading] = useState(false);

    // Trigger animasi saat masuk ke tab ESG
    useEffect(() => {
        if (activeTab === "esg") {
            setTimeout(() => setAnimateBars(true), 50);
        } else {
            setAnimateBars(false);
        }
    }, [activeTab]);

    // [NEW SINKRONISASI]: Pemicu pemanggilan API telemetri udara real-time berdasarkan koordinat industri [3]
    useEffect(() => {
        if (companyData && companyData.lat && companyData.lng) {
            const fetchAqiTelemetry = async () => {
                setAqiLoading(true);
                try {
                    const response = await apiService.analytics.getAqiData(companyData.lat, companyData.lng);
                    if (response && response.success) {
                        setAqiData(response.data);
                    }
                } catch (error) {
                    console.error("Gagal meload data sensor spasial kualitas udara:", error);
                } finally {
                    setAqiLoading(false);
                }
            };
            fetchAqiTelemetry();
        } else {
            setAqiData(null);
        }
    }, [companyData?.id, companyData?.lat, companyData?.lng]);

    if (!companyData) return null;

    const score = companyData.score || 0;

    // Logic warna ESG
    const getScoreColor = () => {
        if (score === 0) return "bg-slate-500";
        if (score >= 80) return "bg-emerald-500";
        if (score >= 60) return "bg-amber-500";
        return "bg-red-500";
    };

    const getScoreLabel = () => {
        if (score === 0) return "Belum diaudit";
        if (score >= 80) return "Patuh (Excellent)";
        if (score >= 60) return "Cukup (Warning)";
        return "Kritis (Danger)";
    };

    // [NEW HELPERS] Standardisasi kelas warna & deskripsi label AQI US EPA
    const getAqiColorClass = (aqiValue: number) => {
        if (aqiValue <= 50) return "text-emerald-700 border-emerald-100";
        if (aqiValue <= 100) return "text-amber-700 border-amber-100";
        if (aqiValue <= 150) return "text-orange-700 border-orange-100";
        if (aqiValue <= 200) return "text-red-700 border-red-100";
        return "text-purple-700 border-purple-100";
    };

    const getAqiStatusLabel = (aqiValue: number) => {
        if (aqiValue <= 50) return "Baik (Sehat)";
        if (aqiValue <= 100) return "Sedang (Waspada)";
        if (aqiValue <= 150) return "Tidak sehat (Grup sensitif)";
        if (aqiValue <= 200) return "Tidak sehat (Bahaya)";
        return "Sangat berbahaya";
    };

    // Handler memulai sidak untuk petugas lapangan
    const handleStartSidak = () => {
        toast.success(`Membuka berkas Evaluasi Fisik Lapangan untuk ${companyData.companyName}`);

        // Mengarahkan langsung ke halaman pengisian BAP dengan mem-passing ID perusahaan ke state
        navigate("/officer/inspections", {
            state: { preSelectedCompanyId: companyData.id }
        });
    };

    return (
        <div className="flex flex-col h-full w-full bg-white relative font-sans">

            {/* TABS - Gaya GFW Edge-to-Edge (Refaktorisasi Bebas Capslock & Bold) */}
            <div className="flex bg-slate-50 border-b border-slate-200 shrink-0">
                <button
                    onClick={() => setActiveTab("umum")}
                    className={`flex-1 py-3 text-xs font-normal transition-colors outline-none ${activeTab === "umum"
                        ? "bg-white text-emerald-800 border-t-[3px] border-t-emerald-600 border-r border-slate-200"
                        : "bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-t-[3px] border-t-transparent border-r border-slate-200"
                        }`}
                >
                    Profil industri
                </button>
                <button
                    onClick={() => setActiveTab("esg")}
                    className={`flex-1 py-3 text-xs font-normal transition-colors outline-none ${activeTab === "esg"
                        ? "bg-white text-emerald-800 border-t-[3px] border-t-emerald-600"
                        : "bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-t-[3px] border-t-transparent"
                        }`}
                >
                    Analisis ESG
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">

                {/* TAB 1: UMUM */}
                {activeTab === "umum" && (
                    <div className="flex flex-col pb-6 animate-in fade-in duration-300">

                        {/* --- INTEGRASI VISUAL: FOTO PROFIL INDUSTRI (Apple-Style UI, Edge-to-Edge Seamless) --- */}
                        <div className="w-full aspect-video bg-slate-50 border-b border-slate-100 overflow-hidden relative z-10 flex items-center justify-center">
                            {companyData.companyPhotoUrl ? (
                                <img
                                    src={`${BACKEND_URL}${companyData.companyPhotoUrl}`}
                                    alt={companyData.companyName}
                                    className="w-full h-full object-cover animate-in fade-in duration-500"
                                    onError={(e) => {
                                        // Handling jika file statis di server terhapus / corrupt
                                        e.currentTarget.src = "";
                                        e.currentTarget.className = "hidden";
                                        const fallbackEl = e.currentTarget.parentElement?.querySelector(".photo-fallback");
                                        if (fallbackEl) fallbackEl.classList.remove("hidden");
                                    }}
                                />
                            ) : null}
                            {/* Fallback Element jika data bernilai null/error */}
                            <div className={cn(
                                "photo-fallback absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-1.5 select-none",
                                companyData.companyPhotoUrl && "hidden"
                            )}>
                                <Factory size={22} className="text-slate-300" />
                                <span className="text-[10px] font-normal text-slate-400">Foto pabrik belum tersedia</span>
                            </div>
                        </div>

                        {/* Metadata Ringkas Deskripsi Profil */}
                        <div className="px-4 py-3 bg-white border-b border-slate-100 text-left">
                            <p className="text-xs font-normal text-slate-650 leading-relaxed text-left font-sans">
                                Perusahaan ini bergerak di bidang manufaktur/pengolahan bahan baku dengan fokus operasional {companyData.rawMaterials || "umum"}.
                            </p>
                        </div>

                        {/* List Detail Spesifikasi */}
                        <div className="flex flex-col bg-white">
                            <DetailRow icon={ShieldCheck} label="Izin" value={normalizeDocType(companyData.docType)} />
                            <DetailRow icon={MapPin} label="Alamat" value={companyData.address} />
                            <DetailRow icon={FileText} label="Nomor NIB" value={companyData.nib} />
                            <DetailRow icon={Factory} label="Tahun berdiri" value={companyData.yearBuilt} />
                            <DetailRow icon={Users} label="Karyawan" value={`${companyData.employees} Orang`} />
                            <DetailRow icon={Activity} label="Luas area" value={`${companyData.landArea?.toLocaleString()} m²`} />
                            <DetailRow icon={Zap} label="Energi & air" value={`${companyData.powerSource} / ${companyData.waterSource}`} />
                        </div>

                        {/* Kontak Penanggung Jawab (Flat Integration, Terikat sebagai kelanjutan tabel) */}
                        <div className="px-4 py-3 border-b border-slate-100 bg-white text-left">
                            <p className="text-xs font-bold text-slate-800 mb-2">Kontak penanggung jawab</p>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-50 rounded-none flex items-center justify-center text-slate-500 border border-slate-150">
                                    <Phone size={13} />
                                </div>
                                <div>
                                    <p className="text-xs font-normal text-slate-700 leading-none">{companyData.picName}</p>
                                    <p className="text-[10px] text-slate-500 font-normal mt-1">{companyData.picRole} • {companyData.picPhone}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: ANALISIS ESG */}
                {activeTab === "esg" && (
                    <div className="flex flex-col pb-6 animate-in fade-in duration-300 space-y-4">
                        {/* HERO SCORE */}
                        <div className="px-4 py-5 bg-slate-900 border-b border-slate-800 text-center flex flex-col items-center select-none shrink-0">
                            <p className="text-[14px] font-normal text-slate-400 mb-2.5 tracking-wider">Indeks Kepatuhan Lingkungan</p>
                            <div className="flex items-end gap-0.5 mb-1.5">
                                <h2 className="text-3xl font-bold text-white leading-none">{score}</h2>
                                <span className="text-sm font-medium text-slate-400 mb-0.5">/100</span>
                            </div>
                            <span className={`px-2.5 py-0.5 mt-1.5 text-[9px] font-normal text-white border border-white/10 ${getScoreColor()}`}>
                                {getScoreLabel()}
                            </span>
                        </div>

                        {/* [NEW INTEGRATION]: COMPACT REAL-TIME ATMOSPHERE TELEMETRY WIDGET */}
                        <div className="px-4 text-left">
                            <div className="bg-white py-1 space-y-3.5">
                                <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <CloudSun size={13} className="text-emerald-700 animate-pulse" />
                                        <h4 className="text-xs font-normal text-slate-800">Telemetri udara terdekat</h4>
                                    </div>
                                    <Badge className="bg-slate-100 text-slate-500 font-sans text-[8px] rounded-none border-none py-0.5">IQAir v2</Badge>
                                </div>

                                {aqiLoading ? (
                                    <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                                        <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                                        <span className="text-[8px] font-normal text-slate-500 mt-1">Mengakses pemantau udara...</span>
                                    </div>
                                ) : aqiData ? (
                                    <div className="space-y-4 animate-in fade-in duration-200">
                                        {/* Colored AQI Box */}
                                        <div className={cn("p-2 border-b flex items-center justify-between font-sans text-xs", getAqiColorClass(aqiData.aqi))}>
                                            <div className="space-y-0.5 text-left">
                                                <span className="text-[12px] font-normal text-slate-800 block">Indeks kualitas udara (AQI)</span>
                                                <span className="text-[12px] font-normal text-slate-750 leading-none block">{getAqiStatusLabel(aqiData.aqi)}</span>
                                            </div>
                                            <span className="text-xl font-bold tracking-tight leading-none font-mono">{aqiData.aqi}</span>
                                        </div>

                                        {/* Weather parameters grid (2x2) */}
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 font-sans text-[11px] text-slate-500">
                                            <div className="border-b border-slate-250 pb-3.5 text-left">
                                                <span className="text-[13px] font-normal text-slate-800 block">Suhu udara</span>
                                                <span className="text-[11px] font-normal text-slate-500 leading-none block mt-1">{aqiData.weather.temperature} °C</span>
                                            </div>
                                            <div className="border-b border-slate-250 pb-3.5 text-left">
                                                <span className="text-[13px] font-normal text-slate-800 block">Kelembapan</span>
                                                <span className="text-[11px] font-normal text-slate-500 leading-none block mt-1">{aqiData.weather.humidity} %</span>
                                            </div>
                                            <div className="pb-1 text-left">
                                                <span className="text-[13px] font-normal text-slate-800 block">Kec. angin</span>
                                                <span className="text-[11px ] font-normal text-slate-500 leading-none block mt-1">{aqiData.weather.windSpeed} m/s</span>
                                            </div>
                                            <div className="pb-1 text-left overflow-hidden">
                                                <span className="text-[13px] font-normal text-slate-800 block">Polutan utama</span>
                                                <span className="text-[11px] font-normal text-slate-500 leading-none truncate block mt-1">{aqiData.mainPollutant}</span>
                                            </div>
                                        </div>

                                        {/* Telemetry data info */}
                                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-normal border-t border-slate-250 pt-2">
                                            <span>Sumber: {aqiData.source === 'simulation' ? 'Simulasi spasial' : aqiData.source === 'cache' ? 'Cache server' : 'IQAir live'}</span>
                                            {aqiData.cachedAt && <span>Jam: {new Date(aqiData.cachedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 text-center text-[10px] text-slate-400 font-normal border border-slate-100">Koneksi sensor nihil</div>
                                )}
                            </div>
                        </div>

                        {/* BAR CHART SIMULASI */}
                        <div className="px-4 space-y-4 text-left">
                            <h4 className="text-[14px] font-normal text-slate-800">Parameter penilaian terakhir</h4>

                            <ProgressBar label="Manajemen limbah B3" value={score > 0 ? 85 : 0} animate={animateBars} />
                            <ProgressBar label="Pengolahan air (IPAL)" value={score > 0 ? 70 : 0} animate={animateBars} />
                            <ProgressBar label="Emisi & kebisingan" value={score > 0 ? 90 : 0} animate={animateBars} />
                            <ProgressBar label="Pelaporan logbook" value={score > 0 ? 60 : 0} animate={animateBars} />
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="mt-4 flex flex-col border-t border-slate-200">
                            {/* ADAPTIVE ACTION BUTTON */}
                            {isOfficer ? (
                                // Render Tombol "Mulai Audit / Sidak" khusus Petugas Lapangan
                                <button
                                    onClick={handleStartSidak}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors border-b border-slate-200 group outline-none"
                                >
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-white" />
                                        <span className="text-xs font-normal">Mulai audit / sidak</span>
                                    </div>
                                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold">→</span>
                                </button>
                            ) : (
                                // Render Tombol "Jadwalkan" untuk Admin / Auditor biasa
                                <button
                                    onClick={() => toast.success(`Jadwal inspeksi untuk ${companyData.companyName} disiapkan.`)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-emerald-50 text-slate-700 transition-colors border-b border-slate-200 group outline-none"
                                >
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-emerald-600" />
                                        <span className="text-xs font-normal">Jadwalkan inspeksi lapangan</span>
                                    </div>
                                    <span className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity font-bold">→</span>
                                </button>
                            )}

                            <button
                                onClick={() => toast.info(`Membuka riwayat logbook ${companyData.companyName}`)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors border-b border-slate-200 group outline-none"
                            >
                                <div className="flex items-center gap-2">
                                    <Activity size={14} className="text-slate-500" />
                                    <span className="text-xs font-normal text-slate-700">Lihat logbook limbah</span>
                                </div>
                                <span className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">→</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}

// Komponen Pembantu Baris Data (Konsistensi Ukuran Judul [text-xs] vs Isi [text-[11px]])
function DetailRow({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start justify-between px-4 py-2 border-b border-slate-100 hover:bg-slate-50/50 transition-colors gap-1">
            <div className="flex items-center gap-2 w-full sm:w-1/3 shrink-0">
                <Icon size={12} className="text-emerald-600" />
                <span className="text-xs font-normal text-slate-500">
                    {label}
                </span>
            </div>
            <span className="text-[11px] font-normal text-slate-700 text-left sm:text-right w-full sm:w-2/3 break-words">
                {value}
            </span>
        </div>
    );
}

// Komponen Pembantu Progress Bar
function ProgressBar({ label, value, animate }: { label: string, value: number, animate: boolean }) {
    const color = value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-500' : 'bg-red-500';

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-end">
                <span className="text-[12px] font-normal text-slate-800">{label}</span>
                <span className="text-[12px] font-normal text-slate-600">{value}%</span>
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-none overflow-hidden">
                <div
                    className={`h-full ${color} transition-all ease-out duration-1000`}
                    style={{ width: animate ? `${value}%` : '0%' }}
                />
            </div>
        </div>
    );
}