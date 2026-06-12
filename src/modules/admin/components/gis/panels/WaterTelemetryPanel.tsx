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
    Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import type { WaterStationNode } from "@/types/gis";

interface WaterTelemetryPanelProps {
    stationData: WaterStationNode; // Menerima payload dari event klik marker stasiun air
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
            <div className="p-6 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                Data stasiun air tidak termuat.
            </div>
        );
    }

    const { currentData, monthlyHistory, name, id, sourceType, status } = stationData;

    // ==========================================================================
    // LOGIKA EVALUASI BAKU MUTU AIR (Information Expert)
    // ==========================================================================
    const evaluation = useMemo(() => {
        let infractions: string[] = [];

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
                status: "MEMENUHI SYARAT",
                desc: "Kualitas air sungai terpantau bersih, sehat, dan memenuhi baku mutu nasional Kelas II.",
                colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
                barColor: "bg-emerald-500",
                infractions
            };
        } else if (infractions.length <= 2) {
            return {
                status: "TERCEMAR RINGAN",
                desc: "Terdeteksi anomali pada beberapa parameter air. Diperlukan pengawasan preventif.",
                colorClass: "text-amber-700 bg-amber-50 border-amber-200",
                barColor: "bg-amber-500",
                infractions
            };
        } else {
            return {
                status: "TERCEMAR BERAT",
                desc: "Kondisi air kritis! Parameter kimia dan organik melebihi ambang batas baku mutu secara ekstrem.",
                colorClass: "text-rose-700 bg-rose-50 border-rose-200 animate-pulse",
                barColor: "bg-rose-600",
                infractions
            };
        }
    }, [currentData]);

    const handleSecureLogs = () => {
        toast.success(`Log data parameter air stasiun ${id} berhasil diamankan ke dalam database dinas.`);
    };

    return (
        <div className="flex flex-col h-full w-full bg-white relative font-sans text-slate-800">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">

                {/* --- HEADER: METADATA STASIUN (tactical design) --- */}
                <div className="bg-slate-50 border border-slate-200 p-4 text-left space-y-1.5 relative overflow-hidden">
                    <div className="absolute top-2 right-2 flex gap-1">
                        <Badge className="bg-slate-900 text-white rounded-none border-none text-[7px] font-mono uppercase tracking-widest px-1.5 py-0.5">
                            {sourceType || "SIMULATED"}
                        </Badge>
                        <Badge className={cn(
                            "rounded-none border-none text-[7px] font-mono uppercase tracking-widest px-1.5 py-0.5",
                            status === "ACTIVE" ? "bg-emerald-600 text-white" : "bg-amber-500 text-slate-950"
                        )}>
                            {status || "ACTIVE"}
                        </Badge>
                    </div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">ID Stasiun: {id}</span>
                    <h3 className="text-sm font-black text-slate-900 leading-tight uppercase pr-16">{name}</h3>
                    <div className="flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase tracking-wider pt-1.5 border-t border-slate-250">
                        <span>LAT: {stationData.lat}</span>
                        <span>LNG: {stationData.lng}</span>
                    </div>
                </div>

                {/* --- HERO PANEL: STATUS KELAYAKAN SPASIAL --- */}
                <div className={cn("p-4 border text-left flex flex-col space-y-2.5 rounded-none shadow-sm", evaluation.colorClass)}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            {evaluation.infractions.length === 0 ? (
                                <CheckCircle2 className="shrink-0" size={14} />
                            ) : (
                                <AlertTriangle className="shrink-0" size={14} />
                            )}
                            <h4 className="text-[10px] font-black uppercase tracking-widest">Status Baku Mutu Air</h4>
                        </div>
                        <span className="text-xs font-black italic tracking-tight">{evaluation.status}</span>
                    </div>
                    <p className="text-[10px] font-medium leading-relaxed text-justify opacity-90">
                        {evaluation.desc}
                    </p>
                    {evaluation.infractions.length > 0 && (
                        <div className="border-t border-current/25 pt-2 space-y-1">
                            <span className="text-[8px] font-black uppercase tracking-wider block">Pelanggaran Parameter:</span>
                            <div className="flex flex-wrap gap-1">
                                {evaluation.infractions.map((inf, idx) => (
                                    <Badge key={idx} className="bg-black/10 text-current border-none text-[8px] rounded-none px-1.5 py-0">
                                        {inf}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- GRID 2X2: DETAIL PARAMETER AKTIF --- */}
                <div className="space-y-1.5 text-left">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Parameter Pengujian</span>
                    <div className="grid grid-cols-2 gap-2 font-mono text-[10px] font-bold text-slate-500">

                        {/* BOD */}
                        <div className="bg-slate-50 border p-3 text-left rounded-none relative">
                            <div className="flex justify-between items-center text-slate-400 font-sans">
                                <span className="text-[8px] font-black uppercase tracking-widest">Kadar BOD</span>
                                <span className="text-[8px] font-bold text-slate-400">Limit: 3.0</span>
                            </div>
                            <span className={cn(
                                "text-base font-black leading-none block mt-1.5",
                                currentData.bod > BAKU_MUTU_LIMITS.BOD ? "text-rose-600" : "text-slate-800"
                            )}>{currentData.bod} mg/L</span>
                        </div>

                        {/* COD */}
                        <div className="bg-slate-50 border p-3 text-left rounded-none relative">
                            <div className="flex justify-between items-center text-slate-400 font-sans">
                                <span className="text-[8px] font-black uppercase tracking-widest">Kadar COD</span>
                                <span className="text-[8px] font-bold text-slate-400">Limit: 25.0</span>
                            </div>
                            <span className={cn(
                                "text-base font-black leading-none block mt-1.5",
                                currentData.cod > BAKU_MUTU_LIMITS.COD ? "text-rose-600" : "text-slate-800"
                            )}>{currentData.cod} mg/L</span>
                        </div>

                        {/* DO (Dissolved Oxygen) */}
                        <div className="bg-slate-50 border p-3 text-left rounded-none relative">
                            <div className="flex justify-between items-center text-slate-400 font-sans">
                                <span className="text-[8px] font-black uppercase tracking-widest">Oksigen (DO)</span>
                                <span className="text-[8px] font-bold text-slate-400">Limit: &ge; 4.0</span>
                            </div>
                            <span className={cn(
                                "text-base font-black leading-none block mt-1.5",
                                currentData.do < BAKU_MUTU_LIMITS.DO ? "text-rose-600" : "text-emerald-600"
                            )}>{currentData.do} mg/L</span>
                        </div>

                        {/* pH */}
                        <div className="bg-slate-50 border p-3 text-left rounded-none relative">
                            <div className="flex justify-between items-center text-slate-400 font-sans">
                                <span className="text-[8px] font-black uppercase tracking-widest">pH Derajat</span>
                                <span className="text-[8px] font-bold text-slate-400">Limit: 6 - 9</span>
                            </div>
                            <span className={cn(
                                "text-base font-black leading-none block mt-1.5",
                                (currentData.ph < BAKU_MUTU_LIMITS.PH_MIN || currentData.ph > BAKU_MUTU_LIMITS.PH_MAX) ? "text-rose-600" : "text-slate-800"
                            )}>{currentData.ph}</span>
                        </div>

                    </div>
                </div>

                {/* --- VISUALISASI RECHARTS TREN BULANAN --- */}
                <div className="bg-white border border-slate-200 p-3 text-left space-y-3">
                    <div className="border-b pb-1.5 flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <TrendingUp size={12} className="text-cyan-600" /> Tren Pencemaran Bulanan
                        </span>

                        {/* CHART SUB-TABS INTERAKTIF (Mencegah kompresi skala BOD & COD) */}
                        <div className="flex bg-slate-100 p-0.5 border border-slate-200">
                            <button
                                onClick={() => setChartTab("BOD")}
                                className={cn(
                                    "px-2 py-0.5 text-[8px] font-black uppercase tracking-wider transition-all",
                                    chartTab === "BOD" ? "bg-white text-slate-900 border shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                BOD
                            </button>
                            <button
                                onClick={() => setChartTab("COD")}
                                className={cn(
                                    "px-2 py-0.5 text-[8px] font-black uppercase tracking-wider transition-all",
                                    chartTab === "COD" ? "bg-white text-slate-900 border shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                COD
                            </button>
                        </div>
                    </div>

                    {/* RENDER DUAL LINECHART WITH THRESHOLD REFERENCE LINE */}
                    <div className="h-[160px] w-full bg-slate-50 border p-2 font-mono text-[9px] rounded-none">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyHistory} margin={{ top: 10, right: 5, left: -25, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={8} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} />
                                <ChartTooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-slate-900 text-white p-2 border border-slate-700 text-[8px] space-y-1 text-left rounded-none">
                                                    <p className="font-black border-b border-white/10 pb-0.5 mb-1 uppercase">Bulan: {data.month}</p>
                                                    {chartTab === "BOD" ? (
                                                        <p className="text-cyan-400 font-bold">Kadar BOD: {data.bod} mg/L</p>
                                                    ) : (
                                                        <p className="text-amber-400 font-bold">Kadar COD: {data.cod} mg/L</p>
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
                                        <Line type="monotone" dataKey="bod" stroke="#22d3ee" strokeWidth={2.5} activeDot={{ r: 4 }} />
                                        <ReferenceLine y={BAKU_MUTU_LIMITS.BOD} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Batas BOD (3)', fill: '#f43f5e', fontSize: 7, position: 'top' }} />
                                    </>
                                ) : (
                                    <>
                                        <Line type="monotone" dataKey="cod" stroke="#fbbf24" strokeWidth={2.5} activeDot={{ r: 4 }} />
                                        <ReferenceLine y={BAKU_MUTU_LIMITS.COD} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Batas COD (25)', fill: '#f43f5e', fontSize: 7, position: 'top' }} />
                                    </>
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                        <span>Garis Merah Putus-putus: Batas Maksimum Baku Mutu</span>
                    </div>
                </div>

                {/* --- SEKSI 4: REGULASI LEGALITAS INFO --- */}
                <div className="bg-slate-50 p-3 border border-slate-200 text-slate-500 text-[9px] font-bold uppercase tracking-wider leading-relaxed text-justify rounded-none">
                    <div className="flex items-center gap-1.5 mb-1 border-b pb-1 text-slate-700 font-black">
                        <Info size={11} />
                        <span>Keterangan Klasifikasi</span>
                    </div>
                    Pengukuran ini diselaraskan dengan Baku Mutu Air Nasional Kelas II (PP 22/2021).
                    Stasiun yang melanggar parameter secara terus-menerus akan memicu peringatan otomatis (*EWS*) untuk penugasan penindakan industri di sekitarnya.
                </div>

            </div>

            {/* --- ACTION FOOTER (Sticky) --- */}
            <div className="p-4 border-t border-slate-200 bg-white shrink-0 flex gap-2">
                <Button
                    onClick={handleSecureLogs}
                    className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-none font-black text-[10px] uppercase tracking-widest shadow-none gap-1.5 transition-colors"
                >
                    Amankan Log <ArrowUpRight size={12} />
                </Button>
                <Button
                    variant="outline"
                    onClick={() => toast.success("Sertifikat Uji Laboratorium Sungai terunduh.")}
                    className="h-11 w-11 p-0 border-slate-300 text-slate-600 hover:bg-slate-50 rounded-none shrink-0"
                    title="Unduh Berkas Lab"
                >
                    <Download size={14} />
                </Button>
            </div>
        </div>
    );
}