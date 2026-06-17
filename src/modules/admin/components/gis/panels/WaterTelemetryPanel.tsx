// src/modules/admin/components/gis/panels/WaterTelemetryPanel.tsx
import React, { useState, useMemo } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
    ReferenceLine
} from "recharts";
import {
    Droplets,
    Activity,
    TrendingUp,
    CheckCircle2,
    AlertTriangle,
    ShieldAlert,
    Info,
    ArrowUpRight,
    Download,
    CloudRain,
    Sun,
    Cloud,
    Thermometer,
    Wind,
    Gauge
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import type { WaterStationNode } from "@/types/gis";

interface WaterTelemetryPanelProps {
    stationData: WaterStationNode; // Menerima payload dari event klik stasiun air di peta GIS
}

// --- AMBANG BATAS BAKU MUTU NASIONAL (PP No. 22 Tahun 2021 Kelas II) ---
const BAKU_MUTU_LIMITS = {
    BOD: 3.0,     // mg/L (Maksimal)
    COD: 25.0,    // mg/L (Maksimal)
    DO: 4.0,      // mg/L (Minimal, tidak boleh kurang dari 4)
    PH_MIN: 6.0,
    PH_MAX: 9.0
};

export default function WaterTelemetryPanel({ stationData }: WaterTelemetryPanelProps) {
    const [chartTab, setChartTab] = useState<"BOD" | "COD">("BOD");

    if (!stationData) {
        return (
            <div className="p-6 text-center text-xs font-normal text-slate-400 uppercase tracking-widest">
                Data stasiun air tidak termuat.
            </div>
        );
    }

    const { currentData, monthlyHistory, name, id, sourceType, status } = stationData;

    // ==========================================================================
    // 1. LOGIKA EVALUASI BAKU MUTU AIR (INFORMATION EXPERT PP 22/2021)
    // ==========================================================================
    const evaluation = useMemo(() => {
        const infractions: string[] = [];

        if (currentData.bod > BAKU_MUTU_LIMITS.BOD) {
            infractions.push(`BOD melebihi batas (${currentData.bod} > ${BAKU_MUTU_LIMITS.BOD} mg/L)`);
        }
        if (currentData.cod > BAKU_MUTU_LIMITS.COD) {
            infractions.push(`COD melebihi batas (${currentData.cod} > ${BAKU_MUTU_LIMITS.COD} mg/L)`);
        }
        if (currentData.do < BAKU_MUTU_LIMITS.DO) {
            infractions.push(`DO terlalu rendah (${currentData.do} < ${BAKU_MUTU_LIMITS.DO} mg/L)`);
        }
        if (currentData.ph < BAKU_MUTU_LIMITS.PH_MIN || currentData.ph > BAKU_MUTU_LIMITS.PH_MAX) {
            infractions.push(`pH di luar batas normal (${currentData.ph})`);
        }

        if (infractions.length === 0) {
            return {
                status: "Memenuhi syarat",
                desc: "Kualitas air sungai terpantau bersih, sehat, dan memenuhi baku mutu nasional Kelas II.",
                colorClass: "text-emerald-700 bg-emerald-50/40 border-emerald-100",
                barColor: "bg-emerald-500",
                infractions
            };
        } else if (infractions.length <= 2) {
            return {
                status: "Tercemar ringan",
                desc: "Terdeteksi anomali pada beberapa parameter air. Diperlukan pengawasan preventif.",
                colorClass: "text-amber-700 bg-amber-50/40 border-amber-100",
                barColor: "bg-amber-500",
                infractions
            };
        } else {
            return {
                status: "Tercemar berat",
                desc: "Kondisi air kritis! Parameter kimia dan organik melebihi ambang batas baku mutu secara ekstrem.",
                colorClass: "text-rose-700 bg-rose-50/40 border-rose-100",
                barColor: "bg-rose-600",
                infractions
            };
        }
    }, [currentData]);

    // ==========================================================================
    // 2. LOGIKA ADVISORY CUACA PROXY SENSOR (BMKG SPASIAL MIKRO)
    // ==========================================================================
    const weatherData = currentData.weather;

    const weatherAdvisory = useMemo(() => {
        if (!weatherData) return null;

        const desc = weatherData.weatherDesc.toLowerCase();

        if (desc.includes("hujan") || desc.includes("gerimis") || desc.includes("petir")) {
            return {
                text: `Kondisi cuaca saat ini di lokasi: ${weatherData.weatherDesc}. Terjadi pengenceran limpasan hujan alami (Dilution Active).`,
                colorClass: "bg-sky-50 border-sky-200 text-sky-800",
                icon: <CloudRain className="text-sky-600 shrink-0" size={14} />
            };
        }
        if (desc.includes("cerah") || desc.includes("panas")) {
            return {
                text: `Kondisi cuaca saat ini di lokasi: ${weatherData.weatherDesc}. Penumpukan beban polutan tinggi akibat menyusutnya aliran (Low-Flow Concentration).`,
                colorClass: "bg-amber-50 border-amber-250 text-amber-800",
                icon: <Sun className="text-amber-600 shrink-0" size={14} />
            };
        }
        return {
            text: `Kondisi cuaca saat ini di lokasi: ${weatherData.weatherDesc}. Karakteristik aliran sungai stabil (Normal Baseline Flow).`,
            colorClass: "bg-slate-50 border-slate-200 text-slate-700",
            icon: <Cloud className="text-slate-500 shrink-0" size={14} />
        };
    }, [weatherData]);

    const handleSecureLogs = () => {
        toast.success(`Log data parameter air stasiun ${id} berhasil diamankan ke dalam database dinas.`);
    };

    return (
        <div className="flex flex-col h-full w-full bg-white relative font-sans text-slate-800">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">

                {/* --- HEADER: METADATA STASIUN (Seamless Top Hero) --- */}
                <div className="bg-slate-50/50 p-4 -mx-4 -mt-4 border-b border-slate-200 text-left space-y-1.5 relative overflow-hidden select-none">
                    <div className="absolute top-3 right-4 flex gap-1">
                        <Badge className="bg-slate-900 text-white rounded-none border-none text-[8px] font-normal py-0.5 px-1.5">
                            {sourceType === "PHYSICAL_IOT" ? "Sensor fisik" : "Model simulasi"}
                        </Badge>
                        <Badge className={cn(
                            "rounded-none border-none text-[8px] font-normal py-0.5 px-1.5",
                            status === "ACTIVE" ? "bg-emerald-600 text-white" : "bg-amber-500 text-slate-950"
                        )}>
                            {status === "ACTIVE" ? "Aktif" : status === "MAINTENANCE" ? "Kalibrasi" : "Offline"}
                        </Badge>
                    </div>
                    <span className="text-[10px] font-normal text-slate-400 block leading-none">Identitas stasiun: {id}</span>
                    <h3 className="text-sm font-bold text-slate-800 leading-tight pr-24">{name}</h3>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-normal pt-1.5 border-t border-slate-200/50 mt-1">
                        <span>Lintang: {stationData.lat}</span>
                        <span>Bujur: {stationData.lng}</span>
                    </div>
                </div>

                {/* --- HERO PANEL: STATUS KELAYAKAN SPASIAL (Full-Bleed Edge-to-Edge) --- */}
                <div className={cn("-mx-4 px-4 py-4 border-y text-left flex flex-col space-y-2 rounded-none", evaluation.colorClass)}>
                    <div className="flex items-center justify-between border-b border-slate-900/10 pb-1.5">
                        <div className="flex items-center gap-1.5">
                            {evaluation.infractions.length === 0 ? (
                                <CheckCircle2 className="shrink-0 text-emerald-600" size={13} />
                            ) : (
                                <AlertTriangle className="shrink-0 text-rose-600" size={13} />
                            )}
                            <h4 className="text-xs font-black uppercase tracking-wider">Baku Mutu Air Sungai</h4>
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider">{evaluation.status}</span>
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed text-left text-slate-700">
                        {evaluation.desc}
                    </p>

                    {/* Daftar poin vertikal tanpa nested border box */}
                    {evaluation.infractions.length > 0 && (
                        <div className="pt-2 border-t border-rose-300/40 space-y-1 text-left">
                            <span className="text-[9px] font-black text-rose-800/80 uppercase tracking-widest block leading-none">Parameter Melebihi Batas:</span>
                            <div className="space-y-1.5 pt-1.5">
                                {evaluation.infractions.map((inf, idx) => (
                                    <div key={idx} className="flex items-start gap-1.5 text-[10.5px] font-bold text-rose-850 leading-tight">
                                        <span className="shrink-0 text-rose-600/70 select-none">•</span>
                                        <span>{inf}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- GRID 2X2: DETAIL PARAMETER AKTIF --- */}
                <div className="py-4 border-b border-slate-100 space-y-2.5 text-left">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Parameter Hasil Uji Terkini</span>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 font-sans text-slate-500">

                        {/* BOD */}
                        <div className="border-b border-slate-100 pb-1.5 text-left">
                            <div className="flex justify-between items-center text-slate-700">
                                <span className="text-xs font-bold">Kadar BOD</span>
                                <span className="text-[9px] font-bold text-slate-400 font-mono">Max: 3.0</span>
                            </div>
                            <span className={cn(
                                "text-sm font-black leading-none block mt-1.5 font-mono",
                                currentData.bod > BAKU_MUTU_LIMITS.BOD ? "text-rose-600" : "text-slate-800"
                            )}>{currentData.bod} mg/L</span>
                        </div>

                        {/* COD */}
                        <div className="border-b border-slate-100 pb-1.5 text-left">
                            <div className="flex justify-between items-center text-slate-700">
                                <span className="text-xs font-bold">Kadar COD</span>
                                <span className="text-[9px] font-bold text-slate-400 font-mono">Max: 25.0</span>
                            </div>
                            <span className={cn(
                                "text-sm font-black leading-none block mt-1.5 font-mono",
                                currentData.cod > BAKU_MUTU_LIMITS.COD ? "text-rose-600" : "text-slate-800"
                            )}>{currentData.cod} mg/L</span>
                        </div>

                        {/* DO (Dissolved Oxygen) */}
                        <div className="border-b border-slate-100 pb-1.5 text-left">
                            <div className="flex justify-between items-center text-slate-700">
                                <span className="text-xs font-bold">Kadar DO</span>
                                <span className="text-[9px] font-bold text-slate-400 font-mono">Min: &ge; 4.0</span>
                            </div>
                            <span className={cn(
                                "text-sm font-black leading-none block mt-1.5 font-mono",
                                currentData.do < BAKU_MUTU_LIMITS.DO ? "text-rose-600" : "text-slate-800"
                            )}>{currentData.do} mg/L</span>
                        </div>

                        {/* pH */}
                        <div className="border-b border-slate-100 pb-1.5 text-left">
                            <div className="flex justify-between items-center text-slate-700">
                                <span className="text-xs font-bold">pH Air</span>
                                <span className="text-[9px] font-bold text-slate-400 font-mono">6.0 - 9.0</span>
                            </div>
                            <span className={cn(
                                "text-sm font-black leading-none block mt-1.5 font-mono",
                                (currentData.ph < BAKU_MUTU_LIMITS.PH_MIN || currentData.ph > BAKU_MUTU_LIMITS.PH_MAX) ? "text-rose-600" : "text-slate-800"
                            )}>{currentData.ph}</span>
                        </div>

                    </div>
                </div>

                {/* --- SEKSI: PRAKIRAAN CUACA MIKRO BMKG REAL-TIME --- */}
                {weatherData && (
                    <div className="py-4 border-b border-slate-100 text-left space-y-4 select-none">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Prakiraan Cuaca Mikro (BMKG)</span>

                        {/* 
                            COMPACT APPLE WEATHER GRID:
                            - Diselaraskan rata tengah (flex flex-col items-center justify-center text-center)
                            - Menghilangkan dorongan padding asimetris agar data berada tepat di tengah sumbu grid
                        */}
                        <div className="grid grid-cols-3 divide-x divide-slate-200 py-1 text-center font-sans">
                            {/* Suhu */}
                            <div className="flex flex-col items-center justify-center text-center h-10">
                                <div className="flex items-center justify-center gap-1.5 text-slate-400 w-full">
                                    <Thermometer className="text-rose-500 shrink-0" size={12} />
                                    <span className="text-[8px] font-black uppercase tracking-widest leading-none">SUHU</span>
                                </div>
                                <span className="text-xs font-black text-slate-800 mt-1.5 leading-none">{weatherData.temperature}°C</span>
                            </div>

                            {/* Kelembapan */}
                            <div className="flex flex-col items-center justify-center text-center h-10">
                                <div className="flex items-center justify-center gap-1.5 text-slate-400 w-full">
                                    <Droplets className="text-sky-500 shrink-0" size={12} />
                                    <span className="text-[8px] font-black uppercase tracking-widest leading-none">KELEMBAPAN</span>
                                </div>
                                <span className="text-xs font-black text-slate-800 mt-1.5 leading-none">{weatherData.humidity}%</span>
                            </div>

                            {/* Kecepatan Angin */}
                            <div className="flex flex-col items-center justify-center text-center h-10 overflow-hidden">
                                <div className="flex items-center justify-center gap-1.5 text-slate-400 w-full">
                                    <Wind className="text-emerald-500 shrink-0" size={12} />
                                    <span className="text-[8px] font-black uppercase tracking-widest leading-none">ANGIN</span>
                                </div>
                                <span className="text-xs font-black text-slate-800 mt-1.5 leading-none truncate max-w-full">{weatherData.windSpeed} m/s</span>
                            </div>
                        </div>

                        {/* Spanduk korelasi analisis cuaca - air sungai (Edge-to-Edge Full-Bleed Banner) */}
                        {weatherAdvisory && (
                            <div className={cn("-mx-4 px-4 py-3 border-y flex items-start gap-2.5 font-sans leading-relaxed text-[10.5px] font-semibold text-left", weatherAdvisory.colorClass)}>
                                {weatherAdvisory.icon}
                                <span className="leading-snug">{weatherAdvisory.text}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* --- VISUALISASI RECHARTS TREN BULANAN (Seamless Flat) --- */}
                <div className="py-1 border-b border-slate-100 text-left space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <TrendingUp size={13} className="text-cyan-600 shrink-0" /> Tren Kualitas Air Bulanan
                        </span>

                        {/* CHART SUB-TABS INTERAKTIF */}
                        <div className="flex bg-slate-50 p-0.5 border border-slate-200 rounded-none">
                            <button
                                onClick={() => setChartTab("BOD")}
                                className={cn(
                                    "px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider transition-all outline-none rounded-none",
                                    chartTab === "BOD" ? "bg-slate-900 text-white border shadow-sm" : "text-slate-400 hover:text-slate-700"
                                )}
                            >
                                BOD
                            </button>
                            <button
                                onClick={() => setChartTab("COD")}
                                className={cn(
                                    "px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider transition-all outline-none rounded-none",
                                    chartTab === "COD" ? "bg-slate-900 text-white border shadow-sm" : "text-slate-400 hover:text-slate-700"
                                )}
                            >
                                COD
                            </button>
                        </div>
                    </div>

                    {/* RENDER DUAL LINECHART WITH THRESHOLD REFERENCE LINE */}
                    <div className="h-[150px] w-full font-sans text-[10px] pt-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyHistory} margin={{ top: 10, right: 5, left: -25, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={8} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} />
                                <ChartTooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-slate-900 text-white p-2 border border-slate-800 text-[9px] space-y-1 text-left rounded-none">
                                                    <p className="border-b border-white/10 pb-0.5 mb-1">Bulan: {data.month}</p>
                                                    {chartTab === "BOD" ? (
                                                        <p className="text-cyan-450 font-bold">Kadar BOD: {data.bod} mg/L</p>
                                                    ) : (
                                                        <p className="text-amber-500 font-bold">Kadar COD: {data.cod} mg/L</p>
                                                    )}
                                                    <p className="text-slate-400">Oksigen (DO): {data.do} mg/L</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                {chartTab === "BOD" ? (
                                    <>
                                        <Line type="monotone" dataKey="bod" stroke="#22d3ee" strokeWidth={2.5} activeDot={{ r: 4 }} dot={{ r: 2 }} />
                                        <ReferenceLine y={BAKU_MUTU_LIMITS.BOD} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Batas BOD (3)', fill: '#f43f5e', fontSize: 7, position: 'top' }} />
                                    </>
                                ) : (
                                    <>
                                        <Line type="monotone" dataKey="cod" stroke="#fbbf24" strokeWidth={2.5} activeDot={{ r: 4 }} dot={{ r: 2 }} />
                                        <ReferenceLine y={BAKU_MUTU_LIMITS.COD} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Batas COD (25)', fill: '#f43f5e', fontSize: 7, position: 'top' }} />
                                    </>
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide leading-none pt-1 select-none text-left">
                        Garis merah putus-putus: batas maksimum baku mutu Kelas II (PP 22/2021).
                    </div>
                </div>

                {/* --- SEKSI 4: INFORMASI BAKU MUTU --- */}
                <div className="py-4 border-b border-slate-100 text-left space-y-2 select-none">
                    <div className="flex items-center gap-1.5 text-slate-700">
                        <Info size={12} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Baku Mutu Nasional</span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-500 leading-relaxed text-left">
                        Pengukuran ini diselaraskan dengan Baku Mutu Air Nasional Kelas II (PP 22/2021).
                        Sistem anomali EWS akan secara otomatis menandai status kritis jika parameter kimia sungai melampaui batas toleransi hidrologi [3].
                    </p>
                </div>

            </div>

            {/* --- ACTION FOOTER (Sticky) --- */}
            <div className="p-4 border-t border-slate-150 bg-white shrink-0 flex gap-2">
                <Button
                    onClick={handleSecureLogs}
                    className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-none font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 border-none outline-none cursor-pointer"
                >
                    Amankan log data <ArrowUpRight size={12} />
                </Button>
                <Button
                    variant="outline"
                    onClick={() => toast.success("Sertifikat Uji Laboratorium Sungai terunduh.")}
                    className="h-11 w-11 p-0 border-slate-200 text-slate-505 hover:bg-slate-50 rounded-none shrink-0"
                    title="Unduh Berkas Lab"
                >
                    <Download size={14} />
                </Button>
            </div>
        </div>
    );
}