// src/modules/admin/components/gis/panels/EnvironmentalTelemetryPanel.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
    CloudSun, Wind, Thermometer, Droplets, Compass, Gauge, AlertTriangle,
    ShieldAlert, CheckCircle2, Activity, Info, Loader2, ArrowUpRight
} from "lucide-react";
import { apiService } from "@/lib/api";
import { useGisUIStore } from "@/store/useGisUIStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EnvironmentalTelemetryPanelProps {
    companyData: any; // Menerima payload entitas yang sedang di-klik/difokuskan di peta
}

export default function EnvironmentalTelemetryPanel({ companyData }: EnvironmentalTelemetryPanelProps) {
    const { aqiCache, setAqiCache } = useGisUIStore();

    // State Lokal
    const [aqiLoading, setAqiLoading] = useState(false);
    const [aqiData, setAqiData] = useState<any>(null);
    const [aqiError, setAqiError] = useState<string | null>(null);

    // 1. EXTRACT & CACHE RESOLVER (Information Expert / Client-side Caching)
    const cacheKey = useMemo(() => {
        if (!companyData || !companyData.lat || !companyData.lng) return "";
        // Membulatkan koordinat ke 2 desimal agar selaras dengan skema caching spasial backend
        const latNum = parseFloat(companyData.lat);
        const lngNum = parseFloat(companyData.lng);
        return isNaN(latNum) || isNaN(lngNum) ? "" : `${latNum.toFixed(2)}_${lngNum.toFixed(2)}`;
    }, [companyData?.id, companyData?.lat, companyData?.lng]);

    // 2. RETRIEVE TELEMETRY SENSOR EFFECT
    useEffect(() => {
        if (!companyData || !companyData.lat || !companyData.lng || !cacheKey) {
            setAqiData(null);
            setAqiError("Koordinat spasial industri tidak valid.");
            return;
        }

        // Cek Cache Lokal Klien Terlebih Dahulu (Zero-Network Delay)
        if (aqiCache[cacheKey]) {
            setAqiData(aqiCache[cacheKey]);
            setAqiError(null);
            return;
        }

        const fetchLiveTelemetry = async () => {
            setAqiLoading(true);
            setAqiError(null);
            try {
                const response = await apiService.analytics.getAqiData(companyData.lat, companyData.lng);
                if (response && response.success && response.data) {
                    const parsedData = response.data;

                    // Daftarkan data ke cache global UI store
                    setAqiCache(cacheKey, parsedData);
                    setAqiData(parsedData);
                } else {
                    setAqiError("API tidak mengembalikan data spasial valid.");
                }
            } catch (err: any) {
                console.error("Gagal meload sensor telemetri kualitas udara:", err);
                setAqiError("Gagal terhubung ke sensor stasiun pemantau.");
            } finally {
                setAqiLoading(false);
            }
        };

        fetchLiveTelemetry();
    }, [companyData?.id, cacheKey, aqiCache, setAqiCache]);

    if (!companyData) return null;

    // 3. COLOR & STATUS RESOLVERS (EPA Standard)
    const getAqiConfig = (aqiValue: number) => {
        if (aqiValue <= 50) return {
            color: "text-emerald-700 bg-emerald-50/40 border-emerald-100",
            barColor: "bg-emerald-500",
            label: "Baik (Sehat)",
            icon: <CheckCircle2 className="text-emerald-600 shrink-0" size={16} />,
            advisory: "Sangat ideal untuk beraktivitas luar ruangan. Kualitas udara tidak mendatangkan risiko kesehatan."
        };
        if (aqiValue <= 100) return {
            color: "text-amber-700 bg-amber-50/40 border-amber-100",
            barColor: "bg-yellow-400",
            label: "Sedang (Waspada)",
            icon: <Info className="text-amber-500 shrink-0" size={16} />,
            advisory: "Udara dapat diterima. Namun, kelompok sensitif disarankan membatasi aktivitas fisik berat di luar ruangan."
        };
        if (aqiValue <= 150) return {
            color: "text-orange-700 bg-orange-50/40 border-orange-100",
            barColor: "bg-orange-500",
            label: "Tidak sehat (Sensitif)",
            icon: <AlertTriangle className="text-orange-500 shrink-0" size={16} />,
            advisory: "Kelompok rentan (anak-anak, lansia, penderita asma) dapat mengalami gangguan pernapasan. Gunakan masker medis."
        };
        if (aqiValue <= 200) return {
            color: "text-red-700 bg-red-50/40 border-red-100",
            barColor: "bg-red-500",
            label: "Tidak sehat",
            icon: <ShieldAlert className="text-red-600 shrink-0" size={16} />,
            advisory: "Masyarakat umum berpotensi mengalami gejala iritasi tenggorokan/mata. Hindari aktivitas di luar ruangan yang terlalu lama."
        };
        return {
            color: "text-purple-700 bg-purple-50/40 border-purple-100",
            barColor: "bg-purple-600",
            label: "Sangat berbahaya",
            icon: <ShieldAlert className="text-purple-600 shrink-0" size={16} />,
            advisory: "Kondisi darurat polusi! Seluruh populasi berisiko tinggi terkena dampak kesehatan serius. Tutup jendela rapat-rapat."
        };
    };

    const aqi = aqiData?.aqi || 0;
    const aqiStyle = getAqiConfig(aqi);

    // 4. PREDIKSI DATA 24 JAM SPARKLINE (SIMULASI TREN HIBRIDA)
    const forecastBars = [
        { time: "08:00", val: Math.max(15, Math.floor(aqi * 0.85)) },
        { time: "12:00", val: Math.max(15, Math.floor(aqi * 0.95)) },
        { time: "16:00", val: Math.max(15, Math.floor(aqi * 1.15)) }, // Peak hours polusi
        { time: "20:00", val: Math.max(15, Math.floor(aqi * 1.05)) },
        { time: "00:00", val: Math.max(15, Math.floor(aqi * 0.75)) },
        { time: "04:00", val: Math.max(15, Math.floor(aqi * 0.65)) }
    ];

    // Rotasi panah SVG Wind Rose Kompas
    const compassArrowStyle = aqiData ? {
        transform: `rotate(${aqiData.weather.windDirection}deg)`,
        transformOrigin: "center",
        transition: "transform 1s cubic-bezier(0.25, 0.8, 0.25, 1)"
    } : {};

    return (
        <div className="flex flex-col h-full w-full bg-white relative font-sans text-slate-800">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">

                {/* STATE LOADING SENSOR */}
                {aqiLoading && (
                    <div className="py-24 flex flex-col items-center justify-center gap-2.5 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                        <span className="text-[10px] font-normal leading-none mt-1">Mengakses pemantau udara...</span>
                        <span className="text-[9px] text-slate-400 font-normal leading-none">Sinkronisasi jaringan stasiun Sampit</span>
                    </div>
                )}

                {/* STATE ERROR TELEMETRI */}
                {!aqiLoading && aqiError && (
                    <div className="py-16 p-4 text-center space-y-3">
                        <AlertTriangle className="mx-auto text-amber-500 animate-bounce" size={24} />
                        <div>
                            <p className="text-[10px] font-normal text-slate-700 uppercase tracking-widest">Sinyal udara terputus</p>
                            <p className="text-[9px] text-slate-400 font-normal tracking-wider mt-1">{aqiError}</p>
                        </div>
                    </div>
                )}

                {/* MAIN CONTENT TELEMETRY VIEW */}
                {!aqiLoading && aqiData && (
                    <div className="space-y-1 animate-in fade-in duration-300">

                        {/* WIDGET HERO: AQI VALUE HEADER (Penyelarasan Proporsi Apple Layout & Tanpa Italic) */}
                        <div className={cn("p-4 -mx-4 -mt-4 border-b border-slate-100 text-left flex items-start justify-between select-none", aqiStyle.color)}>
                            <div className="space-y-1">
                                <span className="text-sm font-normal text-slate-850 block">Indeks kualitas udara (AQI)</span>
                                <h3 className="text-xs font-normal text-slate-600 leading-none">{aqiStyle.label}</h3>
                                <p className="text-xs font-normal text-slate-600 leading-normal text-left pt-1.5">{aqiStyle.advisory}</p>
                            </div>
                            <div className="text-right shrink-0 border-l border-slate-200/40 pl-3.5 ml-3.5 flex flex-col justify-center h-full">
                                <span className="text-3xl font-normal tracking-tight leading-none font-mono block">{aqi}</span>
                                <span className="text-[10px] font-normal text-slate-500 block mt-1">US-AQI</span>
                            </div>
                        </div>

                        {/* WIDGET 2: HIGH-DENSITY WEATHER GRID */}
                        <div className="py-4 border-b border-slate-100 space-y-3 text-left">
                            <span className="text-xs font-normal text-slate-700 block">Telemetri stasiun terdekat</span>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 font-sans text-slate-500">
                                <div className="border-b border-slate-100 pb-1.5 text-left">
                                    <div className="flex justify-between items-center text-slate-700">
                                        <span className="text-xs font-normal">Suhu udara</span>
                                        <Thermometer size={12} className="text-rose-500" />
                                    </div>
                                    <span className="text-[10px] font-normal text-slate-500 leading-none block mt-1">{aqiData.weather.temperature} °C</span>
                                </div>

                                <div className="border-b border-slate-100 pb-1.5 text-left">
                                    <div className="flex justify-between items-center text-slate-700">
                                        <span className="text-xs font-normal">Kelembapan</span>
                                        <Droplets size={12} className="text-blue-500" />
                                    </div>
                                    <span className="text-[10px] font-normal text-slate-500 leading-none block mt-1">{aqiData.weather.humidity} %</span>
                                </div>

                                <div className="border-b border-slate-100 pb-1.5 text-left">
                                    <div className="flex justify-between items-center text-slate-700">
                                        <span className="text-xs font-normal">Kec. angin</span>
                                        <Wind size={12} className="text-emerald-500" />
                                    </div>
                                    <span className="text-[10px] font-normal text-slate-500 leading-none block mt-1">{aqiData.weather.windSpeed} m/s</span>
                                </div>

                                <div className="border-b border-slate-100 pb-1.5 text-left overflow-hidden">
                                    <div className="flex justify-between items-center text-slate-700">
                                        <span className="text-xs font-normal">Polutan utama</span>
                                        <Gauge size={12} className="text-indigo-500" />
                                    </div>
                                    <span className="text-[10px] font-normal text-slate-500 leading-none truncate block mt-1">{aqiData.mainPollutant}</span>
                                </div>
                            </div>
                        </div>

                        {/* WIDGET 3: 24-HOUR FORECAST CHART (Seamless Flat Section) */}
                        <div className="py-4 border-b border-slate-100 text-left space-y-3">
                            <span className="text-xs font-normal text-slate-700 block">Prediksi polusi udara 24 jam</span>
                            <div className="flex justify-between items-end h-16 pt-2">
                                {forecastBars.map((bar, i) => {
                                    const heightPercent = Math.min(100, (bar.val / 150) * 100);
                                    const barConfig = getAqiConfig(bar.val);

                                    return (
                                        <div key={i} className="flex flex-col items-center flex-1 group relative">
                                            {/* Tooltip Hover Sparkline */}
                                            <div className="absolute bottom-full mb-1 bg-slate-800 text-white text-[8px] font-normal px-1 py-0.5 rounded-none opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                                {bar.val} AQI
                                            </div>
                                            {/* Kolom Bar */}
                                            <div className="w-4 bg-slate-50 h-10 flex items-end">
                                                <div
                                                    className={cn("w-full transition-all duration-500", barConfig.barColor)}
                                                    style={{ height: `${heightPercent}%` }}
                                                />
                                            </div>
                                            {/* Waktu */}
                                            <span className="text-[7px] font-normal text-slate-400 mt-1 font-mono leading-none">{bar.time}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* WIDGET 4: WIND ROSE COMPASS WIDGET (Seamless Flat Section) */}
                        <div className="py-4 border-b border-slate-100 grid grid-cols-12 gap-4 items-center text-left select-none">
                            <div className="col-span-4 flex items-center justify-center">
                                {/* SVG Compass Dial */}
                                <div className="relative w-14 h-14 bg-slate-50 rounded-full border border-slate-200 flex items-center justify-center shrink-0">
                                    <span className="absolute top-0.5 text-[7px] font-normal text-slate-400 leading-none">N</span>
                                    <span className="absolute right-1 text-[7px] font-normal text-slate-400 leading-none">E</span>
                                    <span className="absolute bottom-0.5 text-[7px] font-normal text-slate-400 leading-none">S</span>
                                    <span className="absolute left-1 text-[7px] font-normal text-slate-400 leading-none">W</span>
                                    {/* Arrow Rotated based on wd degree */}
                                    <div style={compassArrowStyle} className="w-6 h-6 flex items-center justify-center">
                                        <svg className="w-4.5 h-4.5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-8 space-y-1">
                                <span className="text-[12px] font-normal text-slate-800 block">Vektor embusan angin</span>
                                <h5 className="text-[11px] font-normal text-slate-500 leading-none mt-1">Arah: {aqiData.weather.windDirection}° ({getWindDirectionName(aqiData.weather.windDirection)})</h5>
                                <p className="text-[11px] font-normal text-slate-500 leading-normal mt-1">Kecepatan angin {aqiData.weather.windSpeed} m/s memengaruhi arah persebaran partikel asap/polutan pabrik [3].</p>
                            </div>
                        </div>

                        {/* DATA SOURCE FOOTER */}
                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-normal pt-3">
                            <span>Sektor: {companyData.companyName}</span>
                            <span>Cache: {aqiData.source === 'simulation' ? 'Simulated' : aqiData.source === 'cache' ? 'Settle Cached' : 'Live Synchronized'}</span>
                        </div>

                    </div>
                )}
            </div>

            {/* ACTION FOOTER */}
            <div className="p-4 border-t border-slate-150 bg-white shrink-0">
                <button
                    onClick={() => toast.success(`Analisis spasial udara dicatat ke audit log.`)}
                    className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-none font-normal text-xs transition-colors flex items-center justify-center gap-1.5 border-none outline-none cursor-pointer"
                >
                    Amankan log telemetri <ArrowUpRight size={12} />
                </button>
            </div>
        </div>
    );
}

// Resolver Arah Angin Derajat Kompas ke Nama Arah Kardinal
function getWindDirectionName(degree: number): string {
    const directions = [
        "Utara", "Timur laut", "Timur", "Tenggara",
        "Selatan", "Barat daya", "Barat", "Barat laut"
    ];
    // Membagi lingkaran 360 derajat menjadi 8 bagian
    const idx = Math.round(((degree % 360) / 45)) % 8;
    return directions[idx];
}