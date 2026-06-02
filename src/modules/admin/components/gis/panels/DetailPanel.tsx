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

interface DetailPanelProps {
    companyData: any; // Menerima object company lengkap dari store/orchestrator
}

type DetailTabType = "umum" | "esg";

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
        if (score === 0) return "BELUM DIAUDIT";
        if (score >= 80) return "PATUH (EXCELLENT)";
        if (score >= 60) return "CUKUP (WARNING)";
        return "KRITIS (DANGER)";
    };

    // [NEW HELPERS] Standardisasi kelas warna & deskripsi label AQI US EPA
    const getAqiColorClass = (aqiValue: number) => {
        if (aqiValue <= 50) return "text-emerald-700 bg-emerald-50 border-emerald-200";
        if (aqiValue <= 100) return "text-amber-700 bg-amber-50 border-amber-200";
        if (aqiValue <= 150) return "text-orange-700 bg-orange-50 border-orange-200";
        if (aqiValue <= 200) return "text-red-700 bg-red-50 border-red-200";
        return "text-purple-700 bg-purple-50 border-purple-200";
    };

    const getAqiStatusLabel = (aqiValue: number) => {
        if (aqiValue <= 50) return "Baik (Sehat)";
        if (aqiValue <= 100) return "Sedang (Waspada)";
        if (aqiValue <= 150) return "Tidak Sehat (Grup Sensitif)";
        if (aqiValue <= 200) return "Tidak Sehat (Bahaya)";
        return "Sangat Berbahaya (Evakuasi)";
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

            {/* TABS - Gaya GFW Edge-to-Edge */}
            <div className="flex bg-slate-50 border-b border-slate-200 shrink-0">
                <button
                    onClick={() => setActiveTab("umum")}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors outline-none ${activeTab === "umum"
                        ? "bg-white text-emerald-800 border-t-[3px] border-t-emerald-600 border-r border-slate-200 font-bold"
                        : "bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-t-[3px] border-t-transparent border-r border-slate-200"
                        }`}
                >
                    Profil Industri
                </button>
                <button
                    onClick={() => setActiveTab("esg")}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors outline-none ${activeTab === "esg"
                        ? "bg-white text-emerald-800 border-t-[3px] border-t-emerald-600 font-bold"
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
                        {/* Metadata Ringkas */}
                        <div className="px-4 py-4 bg-white border-b border-slate-200 text-left">
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldCheck size={14} className="text-emerald-600" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Izin: {companyData.docType}</span>
                            </div>
                            <p className="text-sm font-medium text-slate-800 text-justify leading-relaxed">
                                Perusahaan ini bergerak di bidang manufaktur/pengolahan bahan baku dengan fokus operasional {companyData.rawMaterials || "umum"}.
                            </p>
                        </div>

                        {/* List Detail Spesifikasi */}
                        <div className="flex flex-col bg-white">
                            <DetailRow icon={MapPin} label="Alamat" value={companyData.address} />
                            <DetailRow icon={FileText} label="Nomor NIB" value={companyData.nib} />
                            <DetailRow icon={Factory} label="Tahun Berdiri" value={companyData.yearBuilt} />
                            <DetailRow icon={Users} label="Karyawan" value={`${companyData.employees} Orang`} />
                            <DetailRow icon={Activity} label="Luas Area" value={`${companyData.landArea?.toLocaleString()} m²`} />
                            <DetailRow icon={Zap} label="Energi & Air" value={`${companyData.powerSource} / ${companyData.waterSource}`} />
                        </div>

                        <div className="px-4 py-4 bg-slate-50 border-y border-slate-200 mt-4 text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Kontak Penanggung Jawab</p>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-200 rounded-none flex items-center justify-center text-slate-600 border border-slate-300">
                                    <Phone size={14} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800 leading-none">{companyData.picName}</p>
                                    <p className="text-[10px] text-slate-500 font-medium mt-1">{companyData.picRole} • {companyData.picPhone}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: ANALISIS ESG */}
                {activeTab === "esg" && (
                    <div className="flex flex-col pb-6 animate-in fade-in duration-300 space-y-4">
                        {/* HERO SCORE */}
                        <div className="px-4 py-6 bg-slate-900 border-b border-slate-800 text-center flex flex-col items-center select-none shrink-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Indeks Kepatuhan Lingkungan</p>
                            <div className="flex items-end gap-1 mb-2">
                                <h2 className="text-6xl font-black italic tracking-tighter text-white leading-none">{score}</h2>
                                <span className="text-lg font-bold text-slate-500 mb-1">/100</span>
                            </div>
                            <span className={`px-3 py-1 mt-2 text-[10px] font-black uppercase tracking-widest text-white border border-white/20 ${getScoreColor()}`}>
                                {getScoreLabel()}
                            </span>
                        </div>

                        {/* [NEW INTEGRATION]: COMPACT REAL-TIME ATMOSPHERE TELEMETRY WIDGET */}
                        <div className="px-4 text-left">
                            <div className="border border-slate-200 bg-white rounded-none p-4 space-y-3">
                                <div className="border-b pb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <CloudSun size={14} className="text-emerald-700 animate-pulse" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Telemetri Udara Terdekat</h4>
                                    </div>
                                    <Badge className="bg-slate-100 text-slate-500 font-mono text-[8px] rounded-none border-none py-0.5">IQAir v2</Badge>
                                </div>

                                {aqiLoading ? (
                                    <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                                        <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                                        <span className="text-[8px] font-black uppercase tracking-widest leading-none mt-1">Mengakses Pemantau Udara...</span>
                                    </div>
                                ) : aqiData ? (
                                    <div className="space-y-3 animate-in fade-in duration-200">
                                        {/* Colored AQI Box */}
                                        <div className={cn("p-2.5 border flex items-center justify-between font-sans text-xs", getAqiColorClass(aqiData.aqi))}>
                                            <div className="space-y-0.5 text-left">
                                                <span className="text-[8px] font-black uppercase tracking-widest block opacity-70">Indeks Kualitas Udara (AQI)</span>
                                                <span className="font-bold leading-none block">{getAqiStatusLabel(aqiData.aqi)}</span>
                                            </div>
                                            <span className="text-2xl font-black italic tracking-tighter leading-none">{aqiData.aqi}</span>
                                        </div>

                                        {/* Weather parameters grid (2x2) */}
                                        <div className="grid grid-cols-2 gap-2 font-mono text-[10px] font-bold text-slate-500">
                                            <div className="bg-slate-50 border p-2 text-left">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-sans">Suhu Udara</span>
                                                <span className="text-xs font-black text-slate-800 leading-none block mt-1">{aqiData.weather.temperature} °C</span>
                                            </div>
                                            <div className="bg-slate-50 border p-2 text-left">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-sans">Kelembapan</span>
                                                <span className="text-xs font-black text-slate-800 leading-none block mt-1">{aqiData.weather.humidity} %</span>
                                            </div>
                                            <div className="bg-slate-50 border p-2 text-left">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-sans">Kec. Angin</span>
                                                <span className="text-xs font-black text-slate-800 leading-none block mt-1">{aqiData.weather.windSpeed} m/s</span>
                                            </div>
                                            <div className="bg-slate-50 border p-2 text-left overflow-hidden">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-sans">Polutan Utama</span>
                                                <span className="text-[9px] font-black text-slate-800 leading-none truncate block mt-1.5">{aqiData.mainPollutant}</span>
                                            </div>
                                        </div>

                                        {/* Telemetry data info */}
                                        <div className="flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase tracking-wider border-t pt-2">
                                            <span>Sumber: {aqiData.source === 'simulation' ? 'Simulasi Spasial' : aqiData.source === 'cache' ? 'Cache Server' : 'IQAir Live'}</span>
                                            {aqiData.cachedAt && <span>Jam: {new Date(aqiData.cachedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 text-center text-[10px] text-slate-400 font-bold uppercase border">Koneksi sensor nihil</div>
                                )}
                            </div>
                        </div>

                        {/* BAR CHART SIMULASI */}
                        <div className="px-4 space-y-4 text-left">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Parameter Penilaian Terakhir</h4>

                            <ProgressBar label="Manajemen Limbah B3" value={score > 0 ? 85 : 0} animate={animateBars} />
                            <ProgressBar label="Pengolahan Air (IPAL)" value={score > 0 ? 70 : 0} animate={animateBars} />
                            <ProgressBar label="Emisi & Kebisingan" value={score > 0 ? 90 : 0} animate={animateBars} />
                            <ProgressBar label="Pelaporan Logbook" value={score > 0 ? 60 : 0} animate={animateBars} />
                        </div>

                        {/* ACTION BUTTONS (Gaya GFW Sharp) */}
                        <div className="mt-4 flex flex-col border-t border-slate-200">
                            {/* ADAPTIVE ACTION BUTTON */}
                            {isOfficer ? (
                                // Render Tombol "Mulai Audit / Sidak" khsusus Petugas Lapangan
                                <button
                                    onClick={handleStartSidak}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-emerald-600 hover:bg-emerald-750 text-white transition-colors border-b border-slate-200 group outline-none"
                                >
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-white" />
                                        <span className="text-[11px] font-black uppercase tracking-wider">Mulai Audit / Sidak</span>
                                    </div>
                                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold">→</span>
                                </button>
                            ) : (
                                // Render Tombol "Jadwalkan" untuk Admin / Auditor biasa
                                <button
                                    onClick={() => toast.success(`Jadwal inspeksi untuk ${companyData.companyName} disiapkan.`)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-emerald-50 text-slate-750 transition-colors border-b border-slate-200 group outline-none"
                                >
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-emerald-600" />
                                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Jadwalkan Inspeksi Lapangan</span>
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
                                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Lihat Logbook Limbah</span>
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

// Komponen Pembantu Baris Data
function DetailRow({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start justify-between px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors gap-1">
            <div className="flex items-center gap-2 w-full sm:w-1/3 shrink-0">
                <Icon size={12} className="text-emerald-600" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {label}
                </span>
            </div>
            <span className="text-[11px] font-medium text-slate-800 text-left sm:text-right w-full sm:w-2/3 break-words">
                {value}
            </span>
        </div>
    );
}

// Komponen Pembantu Progress Bar
function ProgressBar({ label, value, animate }: { label: string, value: number, animate: boolean }) {
    // Hitung warna progres
    const color = value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-500' : 'bg-red-500';

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">{label}</span>
                <span className="text-[10px] font-black text-slate-900">{value}%</span>
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