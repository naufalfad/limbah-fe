// src/modules/dashboard/components/auditor/ExecutiveCopilotPanel.tsx
import React, { useState, useMemo } from "react";
import {
    Sparkles, Target, AlertTriangle, CheckCircle2, Factory, Crosshair,
    ArrowRight, Loader2, BarChart3, Wind, Droplets, ShieldAlert, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSijagaStore } from "@/store/useSijagaStore";
import { useGisUIStore } from "@/store/useGisUIStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Mengimpor elemen visual chart dari Recharts (Information Expert)
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    Tooltip as ChartTooltip
} from "recharts";

export default function ExecutiveCopilotPanel() {
    const { runAiForensicScan, isAiLoading, aiForensicResult } = useSijagaStore();
    const { mapCenter, mapZoom } = useGisUIStore(); // Mengambil koordinat pusat peta dan level zoom global [3]

    const [activePromptLabel, setActivePromptLabel] = useState("");
    const [hasSearched, setHasSearched] = useState(false);

    // GATEKEEPER CONDITIONAL: Skala makro di bawah level zoom 10 diblokir [3]
    const isZoomTooFar = mapZoom < 10;

    const handleSend = async (query: string, label: string) => {
        // Cegah eksekusi jika skala peta melanggar aturan Zoom-Guard [3]
        if (isZoomTooFar) {
            toast.error("Skala peta terlalu makro. Harap zoom-in terlebih dahulu."); // FIX: Menggunakan metode .error bawaan sonner
            return;
        }

        if (!query.trim()) return;

        setActivePromptLabel(label);
        setHasSearched(true);

        // Menyiapkan Payload Spasial Lengkap dengan Parameter Zoom [3]
        const payload = {
            lat: mapCenter[0],
            lng: mapCenter[1],
            zoom: mapZoom, // Kirim tingkat zoom Leaflet secara dinamis ke Backend [3]
            windDirection: 135, // Mock arah angin (Tenggara)
            incidentType: "Anomali Kepatuhan Spasial",
            description: query
        };

        const result = await runAiForensicScan(payload);

        // TACTICAL UI EVENT: Jika AI menemukan tersangka, gerakkan peta ke koordinat pabrik tersebut
        if (result && result.culpritId !== "COM-UNKNOWN") {
            const companies = useSijagaStore.getState().companies;
            const culprit = companies.find(c => c.id === result.culpritId);

            if (culprit && culprit.lat && culprit.lng) {
                window.dispatchEvent(
                    new CustomEvent("map-fly-to-coords", {
                        detail: { lat: parseFloat(culprit.lat), lng: parseFloat(culprit.lng) }
                    })
                );
            }
        }
    };

    // Reset State untuk menjalankan radar analisis lain
    const handleResetRadar = () => {
        setHasSearched(false);
        setActivePromptLabel("");
    };

    // Fungsi Render Warna Indikator Keyakinan (Confidence Score)
    const getConfidenceColor = (score: number) => {
        if (score >= 80) return "text-rose-600 bg-rose-50/50 border-rose-100";
        if (score >= 50) return "text-amber-600 bg-amber-50/50 border-amber-100";
        return "text-slate-600 bg-slate-50 border-slate-200";
    };

    // 1. TRANSFORMASI DATA UNTUK GRAFIK FORENSIK RECHARTS (Information Expert)
    const chartData = useMemo(() => {
        if (!aiForensicResult?.suspectsDistribution) return [];
        return aiForensicResult.suspectsDistribution.map((item: any) => ({
            name: item.companyName.split("PT. ").pop()?.substring(0, 10) || item.companyName,
            fullName: item.companyName,
            "Probabilitas": item.probabilityScore,
            "Kepatuhan": item.complianceScore
        }));
    }, [aiForensicResult]);

    return (
        <div className="flex flex-col h-full bg-white font-sans text-left border-r w-full">

            {/* Header Konteks (Frameless Header) */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 select-none">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 rounded-none shadow-inner">
                        <Sparkles size={16} className={isAiLoading ? "animate-spin" : "animate-pulse"} />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.15em] leading-none">Spatial AI Copilot</h3>
                        <p className="text-[8px] text-slate-400 mt-1.5 font-bold uppercase tracking-widest leading-none">Forensic Data & Correlation Engine</p>
                    </div>
                </div>
            </div>

            {/* AREA UTAMA: STATE MACHINE CONTROLLER */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">

                {/* =====================================================================
                    STATE 1: STANDBY / IDLE STATE (Menampilkan Menu Sugesti)
                ====================================================================== */}
                {!hasSearched && !isAiLoading && (
                    <div className="p-5 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {isZoomTooFar ? (
                            /* BANNER PERINGATAN REAKTIF (Mencegah Kebocoran Token) [3] */
                            <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-none text-left space-y-2.5 select-none">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="text-amber-600 animate-pulse" size={14} />
                                    <h4 className="text-[9px] font-black uppercase tracking-widest leading-none text-amber-900">Skala Peta Terlalu Makro</h4>
                                </div>
                                <p className="text-[9px] font-semibold leading-relaxed text-amber-700">
                                    Analisis AI memerlukan presisi wilayah yang ketat. Silakan **Perbesar Peta (Zoom In)** mendekati skala kecamatan untuk mengaktifkan kembali scan forensik AI.
                                </p>
                            </div>
                        ) : (
                            /* DASHBOARD RADAR PRESET SUGESTI - TAMPILAN PENUH LEGA */
                            <div className="space-y-4">
                                <div className="border-b pb-2 flex items-center justify-between select-none">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fokus Radar Analitis AI</span>
                                    <Badge className="bg-slate-900 text-emerald-400 font-mono text-[8px] rounded-none border-none py-0.5">READY</Badge>
                                </div>

                                <div className="space-y-5">
                                    {/* Kategori 1: Atmosfer */}
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                                            <Wind size={12} className="text-blue-500" /> 1. Analisis Atmosfer & Udara
                                        </span>
                                        <div className="grid grid-cols-1 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleSend(
                                                    "Analisis korelasi arah datangnya angin saat ini dengan potensi paparan emisi cerobong dari kandidat pabrik terdekat.",
                                                    "Analisis potensi paparan cerobong asap"
                                                )}
                                                className="w-full text-left p-3.5 bg-slate-50 border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/15 text-xs font-bold text-slate-700 transition-all uppercase tracking-tight flex justify-between items-center group rounded-none outline-none shadow-sm"
                                            >
                                                <span>Potensi Paparan Cerobong Asap</span>
                                                <ArrowRight size={12} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSend(
                                                    "Deteksi klaster industri terdekat yang melepaskan partikel emisi debu halus PM2.5 abnormal.",
                                                    "Deteksi klaster emisi PM2.5 abnormal"
                                                )}
                                                className="w-full text-left p-3.5 bg-slate-50 border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/15 text-xs font-bold text-slate-700 transition-all uppercase tracking-tight flex justify-between items-center group rounded-none outline-none shadow-sm"
                                            >
                                                <span>Klaster Emisi Debu Halus PM2.5</span>
                                                <ArrowRight size={12} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Kategori 2: Hidrosfer */}
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                                            <Droplets size={12} className="text-blue-500" /> 2. Analisis Air & Sungai
                                        </span>
                                        <div className="grid grid-cols-1 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleSend(
                                                    "Identifikasi potensi pencemaran air aliran Sungai Cileungsi dari logbook limbah cair industri terdekat.",
                                                    "Identifikasi pencemaran Sungai Cileungsi"
                                                )}
                                                className="w-full text-left p-3.5 bg-slate-50 border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/15 text-xs font-bold text-slate-700 transition-all uppercase tracking-tight flex justify-between items-center group rounded-none outline-none shadow-sm"
                                            >
                                                <span>Deteksi Pencemaran Sungai</span>
                                                <ArrowRight size={12} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSend(
                                                    "Korelasikan penurunan drastis pencatatan volume logbook limbah cair dengan potensi pembuangan liar ke badan air.",
                                                    "Korelasi anomali logbook limbah cair"
                                                )}
                                                className="w-full text-left p-3.5 bg-slate-50 border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/15 text-xs font-bold text-slate-700 transition-all uppercase tracking-tight flex justify-between items-center group rounded-none outline-none shadow-sm"
                                            >
                                                <span>Korelasi Anomali Logbook Cair</span>
                                                <ArrowRight size={12} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Kategori 3: Sektoral */}
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                                            <ShieldAlert size={12} className="text-blue-500" /> 3. Evaluasi ESG & Sidak Lapangan
                                        </span>
                                        <div className="grid grid-cols-1 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleSend(
                                                    "Evaluasi pabrik dengan skor kepatuhan ESG kritis di bawah 60 yang searah dengan datangnya angin dominan.",
                                                    "Evaluasi pabrik skor kritis <60"
                                                )}
                                                className="w-full text-left p-3.5 bg-slate-50 border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/15 text-xs font-bold text-slate-700 transition-all uppercase tracking-tight flex justify-between items-center group rounded-none outline-none shadow-sm"
                                            >
                                                <span>Evaluasi Industri Skor Kritis</span>
                                                <ArrowRight size={12} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSend(
                                                    "Rangkum tingkat kepatuhan ESG wilayah dan buat rekomendasi prioritas sidak lapangan terpadu untuk dinas.",
                                                    "Rekomendasi prioritas sidak lapangan"
                                                )}
                                                className="w-full text-left p-3.5 bg-slate-50 border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/15 text-xs font-bold text-slate-700 transition-all uppercase tracking-tight flex justify-between items-center group rounded-none outline-none shadow-sm"
                                            >
                                                <span>Rekomendasi Prioritas Sidak</span>
                                                <ArrowRight size={12} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* =====================================================================
                    STATE 2: LOADING STATE (Mengeksekusi Analisis)
                ====================================================================== */}
                {isAiLoading && (
                    <div className="p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-none animate-spin" />
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 leading-none">Mengeksekusi Radar AI...</p>
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 pt-1 leading-none">Melakukan penalaran forensik geospasial</p>
                        </div>
                    </div>
                )}

                {/* =====================================================================
                    STATE 3: RESULT / ANALYSIS STATE (Menampilkan Hasil Visual Penuh)
                ====================================================================== */}
                {!isAiLoading && aiForensicResult && hasSearched && (
                    <div className="p-5 space-y-5 animate-in fade-in duration-300">

                        {/* WIDGET 0: AKTIF PROMPT RUNNING */}
                        <div className="p-3 bg-slate-50 border text-slate-700">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Radar Atas</p>
                            <p className="text-[10px] font-bold mt-1.5 leading-relaxed text-slate-800 uppercase italic">
                                "{activePromptLabel}"
                            </p>
                        </div>

                        {/* WIDGET 1: IDENTIFIKASI TERSANGKA (FLAT STYLE) [3] */}
                        <div className="border-b border-slate-200/60 pb-4 text-left">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                                    <Target size={12} className="text-emerald-600 animate-pulse" /> HASIL IDENTIFIKASI FORENSIK
                                </span>
                                <Badge className={cn("rounded-none border text-[8px] font-black tracking-widest uppercase px-2 py-0.5 shadow-none", getConfidenceColor(aiForensicResult.confidenceScore))}>
                                    AKURASI: {aiForensicResult.confidenceScore}%
                                </Badge>
                            </div>
                            <div className="space-y-1.5">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tersangka Utama</span>
                                <h3 className="text-base font-black text-slate-900 leading-tight uppercase tracking-tight">
                                    {aiForensicResult.culpritName}
                                </h3>
                                <p className="text-[9px] font-mono font-bold text-slate-400 leading-none">
                                    ID: {aiForensicResult.culpritId}
                                </p>
                            </div>
                        </div>

                        {/* WIDGET 2: VISUALISASI DUAL BAR CHART COMPARISON (RECHARTS INTEGRATION) [3] - MENIKMATI LAYAR LEGA */}
                        {chartData && chartData.length > 0 && (
                            <div className="border-b border-slate-200/60 pb-4 text-left space-y-3">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <BarChart3 size={12} className="text-slate-500" /> Perbandingan Risiko & Kepatuhan Sektoral
                                </span>
                                <div className="h-[185px] w-full bg-slate-50 border p-2 font-mono text-[9px] rounded-none">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={7} tickLine={false} />
                                            <YAxis stroke="#94a3b8" fontSize={7} tickLine={false} />
                                            <ChartTooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="bg-slate-900 text-white p-2.5 border border-slate-700 text-[8px] space-y-1 text-left rounded-none max-w-[200px] whitespace-normal">
                                                                <p className="font-black uppercase border-b border-white/10 pb-1 mb-1">{data.fullName}</p>
                                                                <p className="text-rose-400 font-bold font-mono">Kecurigaan AI: {data.Probabilitas}%</p>
                                                                <p className="text-emerald-400 font-bold font-mono">Skor ESG Usaha: {data.Kepatuhan}/100</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar dataKey="Probabilitas" fill="#f43f5e" barSize={12} radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="Kepatuhan" fill="#10b981" barSize={12} radius={[0, 0, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-4 text-[8px] font-black uppercase tracking-widest text-slate-400 select-none">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 bg-rose-500 inline-block border" /> Probabilitas AI (%)
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 bg-emerald-500 inline-block border" /> Kepatuhan ESG
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* WIDGET 3: BUKTI & OPINI ANALISIS (FLAT STYLE) [3] */}
                        <div className="border-b border-slate-200/60 pb-4 text-left space-y-2.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Opini & Analisa Spasial</span>
                            <p className="text-xs font-semibold text-slate-600 leading-relaxed text-justify bg-slate-50 p-3 border border-slate-100">
                                {aiForensicResult.analysis}
                            </p>
                        </div>

                        {/* WIDGET 4: JEJAK DIGITAL BUKTI (FLAT STYLE) [3] */}
                        <div className="border-b border-slate-200/60 pb-4 text-left space-y-2.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Jejak Digital Ditemukan</span>
                            <div className="flex flex-col gap-1.5">
                                {aiForensicResult.evidencePoints.map((point, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-[10px] font-bold text-slate-600 bg-white p-2.5 border border-slate-150">
                                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                                        <span className="leading-snug">{point}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* WIDGET 5: REKOMENDASI TINDAKAN (ACTIONABLE BUTTON) [3] */}
                        <div className="pt-1 text-left">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Rekomendasi Tindakan</span>
                            {aiForensicResult.recommendedAction === "INSPECTION" && (
                                <Button className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white rounded-none font-black text-[9px] uppercase tracking-widest shadow-none gap-1.5">
                                    <AlertTriangle size={12} /> Terbitkan Surat Tugas Sidak
                                </Button>
                            )}
                            {aiForensicResult.recommendedAction === "WARNING_LETTER" && (
                                <Button className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white rounded-none font-black text-[9px] uppercase tracking-widest shadow-none gap-1.5">
                                    <Factory size={12} /> Kirim Teguran Elektronik
                                </Button>
                            )}
                            {(aiForensicResult.recommendedAction === "MONITORING" || aiForensicResult.recommendedAction === "MANUAL_INVESTIGATION") && (
                                <Button className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-none font-black text-[9px] uppercase tracking-widest shadow-none gap-1.5">
                                    <Crosshair size={12} /> Pantau Ketat Area Spasial
                                </Button>
                            )}
                        </div>

                    </div>
                )}
            </div>

            {/* BARIS FOOTER ACTION: TOMBOL RESET UNTUK JALANKAN LAGI */}
            {hasSearched && !isAiLoading && (
                <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
                    <button
                        onClick={handleResetRadar}
                        className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-none font-black text-[10px] uppercase tracking-widest shadow-none transition-colors flex items-center justify-center gap-2 border-none outline-none"
                    >
                        <RotateCcw size={12} />
                        Kembali ke Sugesti Radar
                    </button>
                </div>
            )}
        </div>
    );
}