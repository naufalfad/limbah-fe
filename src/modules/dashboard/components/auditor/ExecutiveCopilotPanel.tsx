// src/modules/dashboard/components/auditor/ExecutiveCopilotPanel.tsx
import React, { useState } from "react";
import { Sparkles, Send, Loader2, Target, AlertTriangle, CheckCircle2, Factory, Crosshair, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSijagaStore } from "@/store/useSijagaStore";
import { useGisUIStore } from "@/store/useGisUIStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ExecutiveCopilotPanel() {
    const { runAiForensicScan, isAiLoading, aiForensicResult } = useSijagaStore();
    const { mapCenter, mapZoom } = useGisUIStore(); // Mengambil koordinat pusat peta dan level zoom global [3]

    const [input, setInput] = useState("");
    const [hasSearched, setHasSearched] = useState(false);

    // GATEKEEPER CONDITIONAL: Skala makro di bawah level zoom 10 diblokir [3]
    const isZoomTooFar = mapZoom < 10;

    const handleSend = async (e?: React.FormEvent, presetInput?: string) => {
        if (e) e.preventDefault();

        // Cegah eksekusi jika skala peta melanggar aturan Zoom-Guard [3]
        if (isZoomTooFar) {
            toast.error("Skala peta terlalu makro. Harap zoom-in terlebih dahulu.");
            return;
        }

        const query = presetInput || input;
        if (!query.trim()) return;

        setInput(query);
        setHasSearched(true);

        // Menyiapkan Payload Spasial Lengkap dengan Parameter Zoom [3]
        const payload = {
            lat: mapCenter[0],
            lng: mapCenter[1],
            zoom: mapZoom, // Kirim tingkat zoom Leaflet secara dinamis ke Backend [3]
            windDirection: 135, // Mock arah angin (Tenggara)
            incidentType: "Anomali Polusi Udara / Air",
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

    // Fungsi Render Warna Indikator Keyakinan (Confidence Score)
    const getConfidenceColor = (score: number) => {
        if (score >= 80) return "text-rose-600 bg-rose-50/50 border-rose-100";
        if (score >= 50) return "text-amber-600 bg-amber-50/50 border-amber-100";
        return "text-slate-600 bg-slate-50 border-slate-200";
    };

    return (
        <div className="flex flex-col h-full bg-white font-sans text-left border-r">

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

            {/* Area Hasil Investigasi (Flat-HUD Layout) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-4 bg-white">

                {!hasSearched && !isAiLoading && !aiForensicResult && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 opacity-40 select-none">
                        <Crosshair size={32} className="text-slate-400" />
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Standby Mode</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Arahkan peta ke area target, lalu beri instruksi.</p>
                        </div>
                    </div>
                )}

                {isAiLoading && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 select-none">
                        <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-none animate-spin" />
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Menganalisa Vektor Geospasial...</p>
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 pt-1">Menyaring data arah angin & logbook terdekat</p>
                        </div>
                    </div>
                )}

                {!isAiLoading && aiForensicResult && (
                    <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">

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

                        {/* WIDGET 2: BUKTI & OPINI ANALISIS (FLAT STYLE) [3] */}
                        <div className="border-b border-slate-200/60 pb-4 text-left space-y-2.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Opini & Analisa Spasial</span>
                            <p className="text-xs font-semibold text-slate-600 leading-relaxed text-justify bg-slate-50 p-3 border border-slate-100">
                                {aiForensicResult.analysis}
                            </p>
                        </div>

                        {/* WIDGET 3: JEJAK DIGITAL BUKTI (FLAT STYLE) [3] */}
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

                        {/* WIDGET 4: REKOMENDASI TINDAKAN (ACTIONABLE BUTTON) [3] */}
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

            {/* Input Form Bawah (Dengan Pengaman Zoom-Guard & Desain Flat) [3] */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                {isZoomTooFar ? (
                    /* BANNER PERINGATAN REAKTIF (Mencegah Kebocoran Token) [3] */
                    <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-none text-left space-y-2.5 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="text-amber-600 animate-pulse" size={14} />
                            <h4 className="text-[9px] font-black uppercase tracking-widest leading-none text-amber-900">Skala Peta Terlalu Makro</h4>
                        </div>
                        <p className="text-[9px] font-semibold leading-relaxed text-amber-700">
                            Analisis AI memerlukan presisi wilayah yang ketat. Silakan **Perbesar Peta (Zoom In)** mendekati skala kecamatan untuk mengaktifkan kembali scan forensik AI.
                        </p>
                    </div>
                ) : (
                    /* INTERFASE CHAT AKTIF (HANYA MUNCUL DI ZOOM SENSITIF) */
                    <div className="animate-in fade-in duration-300">
                        <div className="flex gap-2 mb-3 overflow-x-auto custom-scrollbar pb-1">
                            <Badge
                                onClick={() => handleSend(undefined, "Analisa titik polusi udara merah di area ini sekarang.")}
                                className="cursor-pointer bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-none border-slate-200 text-[9px] font-bold whitespace-nowrap shadow-none"
                            >
                                Investigasi Polusi Udara
                            </Badge>
                            <Badge
                                onClick={() => handleSend(undefined, "Cari pabrik yang membuang limbah cair ilegal ke sungai berdasarkan logbook yang anjlok.")}
                                className="cursor-pointer bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-none border-slate-200 text-[9px] font-bold whitespace-nowrap shadow-none"
                            >
                                Analisis Limbah Cair
                            </Badge>
                        </div>
                        <form onSubmit={handleSend} className="relative flex gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isAiLoading}
                                placeholder="Ketik instruksi forensik Anda..."
                                className="h-10 rounded-none border-slate-300 text-xs font-bold focus-visible:ring-emerald-500 focus-visible:border-emerald-500 bg-slate-50"
                            />
                            <Button
                                type="submit"
                                disabled={isAiLoading || !input.trim()}
                                className="h-10 px-4 bg-slate-900 hover:bg-emerald-600 text-white rounded-none font-black text-[10px] uppercase tracking-widest transition-colors shrink-0"
                            >
                                <ArrowRight size={14} />
                            </Button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}