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
        <div className="flex flex-col h-full w-full bg-white font-sans text-left border-r">

            {/* HEADER SPANDUK UTAMA: Dibuat dinamis untuk menghilangkan redundansi definisi [3] */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 select-none">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 rounded-none shadow-inner">
                        <Sparkles size={16} className={isAiLoading ? "animate-spin" : "animate-pulse"} />
                    </div>
                    <div>
                        {/* Menampilkan fokus kueri pencarian aktif di header jika user sudah men-scan */}
                        <h3 className="text-xs font-normal text-slate-100 leading-none">
                            {hasSearched ? "Fokus analisis aktif" : "Asisten analisis spasial"}
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-1.5 leading-none">
                            {hasSearched ? `"${activePromptLabel}"` : "Mesin korelasi & data forensik"}
                        </p>
                    </div>
                </div>
            </div>

            {/* AREA UTAMA: STATE MACHINE CONTROLLER */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">

                {/* =====================================================================
                    STATE 1: STANDBY / IDLE STATE (Menampilkan Menu Sugesti - GFW Edge-to-Edge)
                ====================================================================== */}
                {!hasSearched && !isAiLoading && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {isZoomTooFar ? (
                            /* BANNER PERINGATAN REAKTIF (Mencegah Kebocoran Token) [3] */
                            <div className="p-4 bg-amber-50/40 border-b border-amber-200 text-left space-y-2 select-none">
                                <div className="flex items-center gap-2 text-amber-700">
                                    <AlertTriangle className="animate-pulse" size={14} />
                                    <span className="text-xs font-normal">Skala peta terlalu makro</span>
                                </div>
                                <p className="text-[11px] font-normal leading-relaxed text-amber-600">
                                    Analisis asisten memerlukan presisi wilayah yang ketat. Silakan perbesar peta mendekati skala kecamatan untuk mengaktifkan kembali pemindaian forensik.
                                </p>
                            </div>
                        ) : (
                            /* DASHBOARD RADAR PRESET SUGESTI - TAMPILAN SEAMLESS TANPA MARGIN SAMPING */
                            <div className="flex flex-col">
                                {/* Header fokus */}
                                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between select-none bg-slate-50/50">
                                    <span className="text-xs font-normal text-slate-500">Fokus radar analisis asisten</span>
                                    <span className="text-[10px] font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-100">Siap</span>
                                </div>

                                <div className="flex flex-col">
                                    {/* Kategori 1: Atmosfer */}
                                    <div className="py-3.5 border-b border-slate-100">
                                        <span className="px-5 text-xs font-normal text-slate-400 flex items-center gap-2 mb-2 select-none">
                                            <Wind size={13} className="text-blue-500" />
                                            <span>1. Analisis atmosfer & udara</span>
                                        </span>

                                        <div className="flex flex-col">
                                            <button
                                                type="button"
                                                onClick={() => handleSend(
                                                    "Analisis korelasi arah datangnya angin saat ini dengan potensi paparan emisi cerobong dari kandidat pabrik terdekat.",
                                                    "Analisis potensi paparan asap"
                                                )}
                                                className="w-full text-left py-3 px-5 hover:bg-slate-50/80 transition-colors text-xs font-normal text-slate-700 flex justify-between items-center group outline-none"
                                            >
                                                <span>Potensi paparan cerobong asap</span>
                                                <ArrowRight size={13} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSend(
                                                    "Deteksi klaster industri terdekat yang melepaskan partikel emisi debu halus PM2.5 abnormal.",
                                                    "Deteksi klaster emisi pm2.5"
                                                )}
                                                className="w-full text-left py-3 px-5 hover:bg-slate-50/80 transition-colors border-t border-slate-50 text-xs font-normal text-slate-700 flex justify-between items-center group outline-none"
                                            >
                                                <span>Klaster emisi debu halus pm2.5</span>
                                                <ArrowRight size={13} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Kategori 2: Hidrosfer */}
                                    <div className="py-3.5 border-b border-slate-100">
                                        <span className="px-5 text-xs font-normal text-slate-400 flex items-center gap-2 mb-2 select-none">
                                            <Droplets size={13} className="text-cyan-500" />
                                            <span>2. Analisis air & sungai</span>
                                        </span>

                                        <div className="flex flex-col">
                                            <button
                                                type="button"
                                                onClick={() => handleSend(
                                                    "Identifikasi potensi pencemaran air aliran Sungai Cileungsi dari logbook limbah cair industri terdekat.",
                                                    "Identifikasi pencemaran Sungai Cileungsi"
                                                )}
                                                className="w-full text-left py-3 px-5 hover:bg-slate-50/80 transition-colors text-xs font-normal text-slate-700 flex justify-between items-center group outline-none"
                                            >
                                                <span>Deteksi pencemaran sungai</span>
                                                <ArrowRight size={13} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSend(
                                                    "Korelasikan penurunan drastis pencatatan volume logbook limbah cair dengan potensi pembuangan liar ke badan air.",
                                                    "Korelasi anomali logbook limbah cair"
                                                )}
                                                className="w-full text-left py-3 px-5 hover:bg-slate-50/80 transition-colors border-t border-slate-50 text-xs font-normal text-slate-700 flex justify-between items-center group outline-none"
                                            >
                                                <span>Korelasi anomali logbook cair</span>
                                                <ArrowRight size={13} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Kategori 3: Sektoral */}
                                    <div className="py-3.5 border-b border-slate-100">
                                        <span className="px-5 text-xs font-normal text-slate-400 flex items-center gap-2 mb-2 select-none">
                                            <ShieldAlert size={13} className="text-amber-500" />
                                            <span>3. Evaluasi esg & sidak lapangan</span>
                                        </span>

                                        <div className="flex flex-col">
                                            <button
                                                type="button"
                                                onClick={() => handleSend(
                                                    "Evaluasi pabrik dengan skor kepatuhan ESG kritis di bawah 60 yang searah dengan datangnya angin dominan.",
                                                    "Evaluasi pabrik skor kritis <60"
                                                )}
                                                className="w-full text-left py-3 px-5 hover:bg-slate-50/80 transition-colors text-xs font-normal text-slate-700 flex justify-between items-center group outline-none"
                                            >
                                                <span>Evaluasi industri skor kritis</span>
                                                <ArrowRight size={13} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSend(
                                                    "Rangkum tingkat kepatuhan ESG wilayah dan buat rekomendasi prioritas sidak lapangan terpadu untuk dinas.",
                                                    "Rekomendasi prioritas sidak lapangan"
                                                )}
                                                className="w-full text-left py-3 px-5 hover:bg-slate-50/80 transition-colors border-t border-slate-50 text-xs font-normal text-slate-700 flex justify-between items-center group outline-none"
                                            >
                                                <span>Rekomendasi prioritas sidak</span>
                                                <ArrowRight size={13} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
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
                    STATE 3: RESULT / ANALYSIS STATE (Menampilkan Hasil Visual Penuh - GFW Flat Style)
                ====================================================================== */}
                {!isAiLoading && aiForensicResult && hasSearched && (
                    <div className="flex flex-col animate-in fade-in duration-300">

                        {/* WIDGET 1: IDENTIFIKASI TERSANGKA (Hasil Identifikasi - Flat & Seamless) */}
                        <div className="px-5 py-3.5 border-b border-slate-100 text-left space-y-2.5">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <Target size={13} className="text-emerald-600 animate-pulse" /> Hasil identifikasi forensik
                                </span>
                                <Badge className={cn("rounded-none border text-[9px] font-normal px-2 py-0.5 shadow-none", getConfidenceColor(aiForensicResult.confidenceScore))}>
                                    Akurasi: {aiForensicResult.confidenceScore}%
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[13px] font-normal text-slate-900 block">Tersangka utama</span>
                                <h3 className="text-[12px] font-normal text-slate-800 leading-tight">
                                    {aiForensicResult.culpritName}
                                </h3>
                                <p className="text-[10px] font-mono text-slate-450 leading-none">
                                    Identitas: {aiForensicResult.culpritId}
                                </p>
                            </div>
                        </div>

                        {/* WIDGET 2: VISUALISASI DUAL BAR CHART COMPARISON (Flat & Rata Kanan Kiri) */}
                        {chartData && chartData.length > 0 && (
                            <div className="px-5 py-3.5 border-b border-slate-100 text-left space-y-3">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <BarChart3 size={13} className="text-slate-800" /> Perbandingan risiko & kepatuhan Sektoral
                                </span>
                                <div className="h-[160px] w-full font-sans text-[10px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} tickLine={false} />
                                            <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} />
                                            <ChartTooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="bg-slate-900 text-white p-2.5 border border-slate-800 text-[9px] space-y-1 text-left rounded-none max-w-[200px] whitespace-normal">
                                                                <p className="border-b border-white/10 pb-1 mb-1 font-normal">{data.fullName}</p>
                                                                <p className="text-rose-400 font-normal">Kecurigaan asisten: {data.Probabilitas}%</p>
                                                                <p className="text-emerald-400 font-normal">Skor ESG usaha: {data.Kepatuhan}/100</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar dataKey="Probabilitas" fill="#f43f5e" barSize={10} radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="Kepatuhan" fill="#10b981" barSize={10} radius={[0, 0, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-4 text-xs font-normal text-slate-500 select-none">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 bg-rose-500 inline-block border border-slate-100" /> Probabilitas asisten (%)
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 bg-emerald-500 inline-block border border-slate-100" /> Kepatuhan ESG
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* WIDGET 3: BUKTI & OPINI ANALISIS (Flat, Tanpa Box, Rata Kiri) */}
                        <div className="px-5 py-3.5 border-b border-slate-100 text-left space-y-2">
                            <span className="text-xs font-bold text-slate-800 block">Opini & analisis spasial</span>
                            <p className="text-xs font-normal text-slate-600 leading-relaxed text-left">
                                {aiForensicResult.analysis}
                            </p>
                        </div>

                        {/* WIDGET 4: JEJAK DIGITAL BUKTI (Flat & Seamless) */}
                        <div className="px-5 py-3.5 border-b border-slate-100 text-left space-y-2">
                            <span className="text-xs font-bold text-slate-800 block">Jejak digital ditemukan</span>
                            <div className="flex flex-col gap-2">
                                {aiForensicResult.evidencePoints.map((point, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-xs font-normal text-slate-600">
                                        <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                                        <span className="leading-relaxed">{point}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* WIDGET 5: REKOMENDASI TINDAKAN (Actionable Button) */}
                        <div className="px-5 py-4 text-left space-y-3">
                            <span className="text-xs font-bold text-slate-800 block">Rekomendasi tindakan</span>
                            {aiForensicResult.recommendedAction === "INSPECTION" && (
                                <Button className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white rounded-none font-normal text-xs shadow-none gap-1.5 border-none outline-none">
                                    <AlertTriangle size={13} /> Terbitkan surat tugas sidak
                                </Button>
                            )}
                            {aiForensicResult.recommendedAction === "WARNING_LETTER" && (
                                <Button className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white rounded-none font-normal text-xs shadow-none gap-1.5 border-none outline-none">
                                    <Factory size={13} /> Kirim teguran elektronik
                                </Button>
                            )}
                            {(aiForensicResult.recommendedAction === "MONITORING" || aiForensicResult.recommendedAction === "MANUAL_INVESTIGATION") && (
                                <Button className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-none font-normal text-xs shadow-none gap-1.5 border-none outline-none">
                                    <Crosshair size={13} /> Pantau ketat area spasial
                                </Button>
                            )}
                        </div>

                    </div>
                )}
            </div>

            {/* BARIS FOOTER ACTION: TOMBOL RESET UNTUK JALANKAN LAGI */}
            {hasSearched && !isAiLoading && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
                    <button
                        onClick={handleResetRadar}
                        className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-none font-normal text-xs transition-colors flex items-center justify-center gap-2 border-none outline-none cursor-pointer"
                    >
                        <RotateCcw size={12} />
                        Kembali ke sugesti radar
                    </button>
                </div>
            )}
        </div>
    );
}