// src/modules/admin/components/gis/panels/DetailPanel.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    MapPin, Activity, ShieldCheck, Factory, FileText,
    Calendar, Users, Phone, Zap, CloudSun, Loader2,
    Badge
} from "lucide-react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { apiService, API_URL } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Konstanta URL Backend untuk memuat berkas statis gambar [3]
const BACKEND_URL = API_URL;

const FALLBACK_IMAGES = [
    "/uploads/companies/factory-automotive.jpg",
    "/uploads/companies/factory-beverage.jpg",
    "/uploads/companies/factory-cement.jpg",
    "/uploads/companies/factory-chemical.jpg",
    "/uploads/companies/factory-food-large.jpg",
    "/uploads/companies/factory-food.jpg",
    "/uploads/companies/factory-paper.jpg",
    "/uploads/companies/factory-pharma.jpg",
    "/uploads/companies/factory-plastics.jpg",
    "/uploads/companies/factory-sbi.jpg",
    "/uploads/companies/factory-textile.jpg",
    "/uploads/companies/factory-water.jpg"
];

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

    // Get consistent fallback image based on company ID
    const fallbackImage = React.useMemo(() => {
        if (!companyData?.id) return FALLBACK_IMAGES[0];
        let hash = 0;
        for (let i = 0; i < companyData.id.length; i++) {
            hash = companyData.id.charCodeAt(i) + ((hash << 5) - hash);
        }
        return FALLBACK_IMAGES[Math.abs(hash) % FALLBACK_IMAGES.length];
    }, [companyData?.id]);

    const [imgSrc, setImgSrc] = useState<string>("");

    useEffect(() => {
        if (companyData) {
            setImgSrc(companyData.companyPhotoUrl ? `${BACKEND_URL}${companyData.companyPhotoUrl}` : `${BACKEND_URL}${fallbackImage}`);
        }
    }, [companyData, fallbackImage]);

    const handleImageError = () => {
        const fallbackUrl = `${BACKEND_URL}${fallbackImage}`;
        if (imgSrc !== fallbackUrl) {
            setImgSrc(fallbackUrl);
        }
    };

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
        if (aqiValue <= 50) return "text-emerald-700 border-emerald-100 bg-emerald-50/20";
        if (aqiValue <= 100) return "text-amber-700 border-amber-100 bg-amber-50/20";
        if (aqiValue <= 150) return "text-orange-700 border-orange-100 bg-orange-50/20";
        if (aqiValue <= 200) return "text-red-700 border-red-100 bg-red-50/20";
        return "text-purple-700 border-purple-100 bg-purple-50/20";
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
        <div className="flex flex-col h-full w-full bg-white relative font-sans text-slate-800">

            {/* TABS - Gaya GFW Edge-to-Edge Simetris Tanpa Melengkung */}
            <div className="flex bg-slate-50 border-b border-slate-200 shrink-0 select-none">
                <button
                    onClick={() => setActiveTab("umum")}
                    className={cn(
                        "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors outline-none rounded-none",
                        activeTab === "umum"
                            ? "bg-white text-emerald-700 border-t-[3px] border-t-emerald-600 border-r border-slate-200"
                            : "bg-slate-50 text-slate-400 hover:text-slate-800 hover:bg-slate-100 border-t-[3px] border-t-transparent border-r border-slate-200"
                    )}
                >
                    Profil industri
                </button>
                <button
                    onClick={() => setActiveTab("esg")}
                    className={cn(
                        "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors outline-none rounded-none",
                        activeTab === "esg"
                            ? "bg-white text-emerald-700 border-t-[3px] border-t-emerald-600"
                            : "bg-slate-50 text-slate-400 hover:text-slate-800 hover:bg-slate-100 border-t-[3px] border-t-transparent"
                    )}
                >
                    Analisis ESG
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">

                {/* TAB 1: UMUM */}
                {activeTab === "umum" && (
                    <div className="flex flex-col pb-6 animate-in fade-in duration-300">

                        {/* --- FOTO PROFIL INDUSTRI (Apple-Style UI, Edge-to-Edge Siku Kaku) --- */}
                        <div className="w-full aspect-video bg-slate-50 border-b border-slate-200 overflow-hidden relative z-10 flex items-center justify-center rounded-none select-none">
                            <img
                                src={imgSrc}
                                alt={companyData.companyName}
                                className="w-full h-full object-cover animate-in fade-in duration-500 rounded-none border-none"
                                onError={handleImageError}
                            />
                        </div>

                        {/* Metadata Ringkas Deskripsi Profil (Flush layout) */}
                        <div className="px-5 py-3.5 bg-white border-b border-slate-100 text-left select-none">
                            <p className="text-xs font-semibold text-slate-500 leading-relaxed text-justify">
                                Perusahaan ini bergerak di bidang manufaktur/pengolahan bahan baku dengan fokus operasional {companyData.rawMaterials || "umum"}.
                            </p>
                        </div>

                        {/* List Detail Spesifikasi (High-Density Ledger Table) */}
                        <div className="flex flex-col bg-white">
                            <DetailRow icon={ShieldCheck} label="Jenis Izin" value={normalizeDocType(companyData.docType)} />
                            <DetailRow icon={MapPin} label="Alamat pabrik" value={companyData.address} />
                            <DetailRow icon={FileText} label="Nomor NIB" value={companyData.nib} />
                            <DetailRow icon={Factory} label="Tahun berdiri" value={companyData.yearBuilt} />
                            <DetailRow icon={Users} label="Karyawan" value={`${companyData.employees} Orang`} />
                            <DetailRow icon={Activity} label="Luas area" value={`${companyData.landArea?.toLocaleString()} m²`} />
                            <DetailRow icon={Zap} label="Energi & air" value={`${companyData.powerSource} / ${companyData.waterSource}`} />
                        </div>

                        {/* Kontak Penanggung Jawab (Flat Integration) */}
                        <div className="px-5 py-4 border-b border-slate-100 bg-white text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 leading-none">Kontak penanggung jawab</p>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-slate-50 rounded-none flex items-center justify-center text-slate-500 border border-slate-200 shrink-0">
                                    <Phone size={14} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-800 leading-none truncate">{companyData.picName}</p>
                                    <p className="text-[10px] text-slate-500 font-bold mt-1.5 leading-none">{companyData.picRole} • {companyData.picPhone}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: ANALISIS ESG */}
                {activeTab === "esg" && (
                    <div className="flex flex-col pb-6 animate-in fade-in duration-300 space-y-4">

                        {/* HERO SCORE CARD */}
                        <div className="px-5 py-5 bg-slate-900 border-b border-slate-850 text-center flex flex-col items-center select-none shrink-0 rounded-none">
                            <p className="text-[12px] font-bold text-slate-400 mb-2 tracking-widest uppercase">Indeks Kepatuhan Lingkungan</p>
                            <div className="flex items-end gap-0.5 mb-1.5 font-mono">
                                <h2 className="text-3xl font-black text-white leading-none italic">{score}</h2>
                                <span className="text-xs font-bold text-slate-400 mb-0.5">/100</span>
                            </div>
                            <span className={cn("px-3 py-1 mt-1 text-[9px] font-black text-white border border-white/10 rounded-none uppercase tracking-widest leading-none", getScoreColor())}>
                                {getScoreLabel()}
                            </span>
                        </div>

                        {/* [NEW INTEGRATION]: COMPACT REAL-TIME ATMOSPHERE TELEMETRY WIDGET */}
                        <div className="px-5 text-left">
                            <div className="bg-white py-1 space-y-3">
                                <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <CloudSun size={13} className="text-emerald-700 animate-pulse" />
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telemetri udara terdekat</h4>
                                    </div>
                                    <Badge className="bg-slate-100 text-slate-500 font-sans text-[8px] rounded-none border-none py-0.5 px-2 font-black uppercase tracking-wider">IQAir v2</Badge>
                                </div>

                                {aqiLoading ? (
                                    <div className="py-10 flex flex-col items-center justify-center gap-2 text-slate-400 select-none">
                                        <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-450 mt-1">Mengakses sensor spasial...</span>
                                    </div>
                                ) : aqiData ? (
                                    <div className="space-y-4 animate-in fade-in duration-200">

                                        {/* Colored AQI Box */}
                                        <div className={cn("p-2.5 border flex items-center justify-between font-sans text-xs rounded-none", getAqiColorClass(aqiData.aqi))}>
                                            <div className="space-y-1 text-left leading-none">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Indeks kualitas udara (AQI)</span>
                                                <span className="text-[11px] font-bold text-slate-800 block">{getAqiStatusLabel(aqiData.aqi)}</span>
                                            </div>
                                            <span className="text-2xl font-black tracking-tight leading-none font-mono">{aqiData.aqi}</span>
                                        </div>

                                        {/* Weather parameters grid (Single-Level Clean Cards, No nested boxes) */}
                                        <div className="grid grid-cols-2 gap-3 font-sans text-xs">
                                            <div className="border border-slate-200 bg-slate-50/50 p-2.5 text-left">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Suhu udara</span>
                                                <span className="text-sm font-black text-slate-800 leading-none block mt-1.5 font-mono">{aqiData.weather.temperature} °C</span>
                                            </div>
                                            <div className="border border-slate-200 bg-slate-50/50 p-2.5 text-left">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Kelembapan</span>
                                                <span className="text-sm font-black text-slate-800 leading-none block mt-1.5 font-mono">{aqiData.weather.humidity} %</span>
                                            </div>
                                            <div className="border border-slate-200 bg-slate-50/50 p-2.5 text-left">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Kec. angin</span>
                                                <span className="text-sm font-black text-slate-800 leading-none block mt-1.5 font-mono">{aqiData.weather.windSpeed} m/s</span>
                                            </div>
                                            <div className="border border-slate-200 bg-slate-50/50 p-2.5 text-left overflow-hidden">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Polutan utama</span>
                                                <span className="text-[11px] font-bold text-slate-800 leading-none truncate block mt-1.5">{aqiData.mainPollutant}</span>
                                            </div>
                                        </div>

                                        {/* Telemetry data info */}
                                        <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider pt-2 border-t border-slate-100 select-none">
                                            <span>Sumber: {aqiData.source === 'simulation' ? 'Simulasi' : aqiData.source === 'cache' ? 'Settle Cache' : 'IQAir live'}</span>
                                            {aqiData.cachedAt && <span>Jam: {new Date(aqiData.cachedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 text-center text-[9px] text-slate-400 font-bold uppercase border border-slate-250 select-none">Koneksi sensor spasial nihil</div>
                                )}
                            </div>
                        </div>

                        {/* BAR CHART SIMULASI */}
                        <div className="px-5 space-y-4 text-left">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Parameter penilaian terakhir</h4>

                            <ProgressBar label="Manajemen limbah B3" value={score > 0 ? 85 : 0} animate={animateBars} />
                            <ProgressBar label="Pengolahan air (IPAL)" value={score > 0 ? 70 : 0} animate={animateBars} />
                            <ProgressBar label="Emisi & kebisingan" value={score > 0 ? 90 : 0} animate={animateBars} />
                            <ProgressBar label="Pelaporan logbook" value={score > 0 ? 60 : 0} animate={animateBars} />
                        </div>

                        {/* ACTION BUTTONS (Clean GFW Style bottom toolbar, no border, no nested card) */}
                        <div className="mt-4 flex flex-col border-t border-slate-200 shrink-0">
                            {/* ADAPTIVE ACTION BUTTON */}
                            {isOfficer ? (
                                <button
                                    onClick={handleStartSidak}
                                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors border-b border-slate-200 flex items-center justify-between px-5 outline-none rounded-none cursor-pointer group"
                                >
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-white shrink-0" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Mulai audit / sidak lapangan</span>
                                    </div>
                                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold">&rarr;</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => toast.success(`Jadwal inspeksi untuk ${companyData.companyName} disiapkan.`)}
                                    className="w-full h-11 bg-white hover:bg-slate-50 text-slate-700 transition-colors border-b border-slate-200 flex items-center justify-between px-5 outline-none rounded-none cursor-pointer group"
                                >
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-emerald-600 shrink-0" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Jadwal inspeksi lapangan</span>
                                    </div>
                                    <span className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity font-bold">&rarr;</span>
                                </button>
                            )}

                            <button
                                onClick={() => toast.info(`Membuka riwayat logbook ${companyData.companyName}`)}
                                className="w-full h-11 bg-white hover:bg-slate-50 text-slate-700 transition-colors border-b border-slate-200 flex items-center justify-between px-5 outline-none rounded-none cursor-pointer group"
                            >
                                <div className="flex items-center gap-2">
                                    <Activity size={14} className="text-slate-500 shrink-0" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Lihat logbook limbah berkala</span>
                                </div>
                                <span className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">&rarr;</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}

// Komponen Pembantu Baris Data (Konsistensi Ukuran Judul [text-[10px]] vs Isi [text-xs])
function DetailRow({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-2.5 border-b border-slate-100 hover:bg-slate-50/50 transition-colors gap-1 min-h-[44px]">
            <div className="flex items-center gap-2 w-full sm:w-1/3 shrink-0 select-none">
                <Icon size={12} className="text-emerald-600 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-450 leading-none">
                    {label}
                </span>
            </div>
            <span className="text-xs font-bold text-slate-800 text-left sm:text-right w-full sm:w-2/3 break-words leading-tight">
                {value}
            </span>
        </div>
    );
}

// Komponen Pembantu Progress Bar
function ProgressBar({ label, value, animate }: { label: string, value: number, animate: boolean }) {
    const color = value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-500' : 'bg-red-500';

    return (
        <div className="flex flex-col gap-2 font-sans select-none">
            <div className="flex justify-between items-end leading-none">
                <span className="text-[11px] font-bold text-slate-850 uppercase tracking-tight">{label}</span>
                <span className="text-[11px] font-black font-mono text-slate-700">{value}%</span>
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-none overflow-hidden border-none shadow-none">
                <div
                    className={`h-full ${color} transition-all ease-out duration-1000 rounded-none`}
                    style={{ width: animate ? `${value}%` : '0%' }}
                />
            </div>
        </div>
    );
}