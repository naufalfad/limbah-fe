// src/modules/inspections/components/AuditEvaluationModal.tsx
import React, { useState } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClipboardList, Camera, X, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSijagaStore } from "@/store/useSijagaStore";
import { toast } from "sonner";
import SignaturePad from "./SignaturePad";

interface AuditEvaluationModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedInsp: any;
}

export default function AuditEvaluationModal({ isOpen, onClose, selectedInsp }: AuditEvaluationModalProps) {
    const { submitInspectionResult } = useSijagaStore();
    const [loading, setLoading] = useState(false);

    // Checklist State
    const [tpsB3, setTpsB3] = useState(false);
    const [ipal, setIpal] = useState(false);
    const [apar, setApar] = useState(false);
    const [noise, setNoise] = useState(false);
    const [safetyEquipment, setSafetyEquipment] = useState(false);
    const [notes, setNotes] = useState("");

    // Signature State (Menerima input dari SignaturePad)
    const [isSigned, setIsSigned] = useState(false);
    const [signatureData, setSignatureData] = useState<string | null>(null);

    if (!selectedInsp) return null;

    // Hitung skor kepatuhan secara dinamis (0 - 100)
    const checkedCount = [tpsB3, ipal, apar, noise, safetyEquipment].filter(Boolean).length;
    const calculatedScore = checkedCount * 20;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isSigned) {
            toast.error("Tanda tangan digital BAP wajib dilengkapi.");
            return;
        }

        setLoading(true);
        try {
            await submitInspectionResult(selectedInsp.id, calculatedScore, notes, {
                tpsB3,
                ipal,
                apar,
                noise,
                safetyEquipment,
            });
            toast.success(`Evaluasi Kepatuhan Selesai. Skor: ${calculatedScore}/100.`);
            onClose();
        } catch (err) {
            toast.error("Terjadi kesalahan saat memproses laporan BAP.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[90vw] lg:max-w-xl p-0 overflow-hidden rounded-none border-none shadow-2xl bg-white">

                {/* HEADER - Frameless & Sharp */}
                <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-600 flex items-center justify-center text-white rounded-none shrink-0 shadow-sm">
                            <ClipboardList size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-none text-[8px] font-black uppercase tracking-widest leading-none">
                                    INTERNAL AUDIT
                                </span>
                                <span className="text-slate-500 font-mono text-[9px] tracking-widest uppercase leading-none">BAP-AUTO</span>
                            </div>
                            <DialogTitle className="text-sm font-black tracking-widest text-white uppercase leading-none">
                                Evaluasi Fisik Lapangan
                            </DialogTitle>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-none transition-colors text-slate-400">
                        <X size={16} />
                    </button>
                </div>

                {/* FORM BODY */}
                <form onSubmit={handleSubmit} className="flex flex-col bg-slate-50 max-h-[80vh] overflow-y-auto custom-scrollbar p-5 space-y-4">

                    {/* Seksi Objek Inspeksi */}
                    <div className="p-3.5 bg-slate-200/50 border border-slate-200 text-left">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none">Objek Inspeksi</span>
                        <h4 className="text-xs font-black text-slate-800 mt-1 leading-none uppercase">{selectedInsp.companyName}</h4>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1 leading-none uppercase">{selectedInsp.location}</p>
                    </div>

                    {/* Checklist Parameters (Diet UI: rounded-none p-2.5) */}
                    <div className="space-y-2 text-left">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Parameter Evaluasi Kepatuhan</label>
                        <div className="space-y-1.5">
                            <CheckRow checked={tpsB3} onClick={() => setTpsB3(!tpsB3)} label="TPS Limbah B3 berizin & memenuhi standar wadah" />
                            <CheckRow checked={ipal} onClick={() => setIpal(!ipal)} label="Sistem IPAL (Pengolahan Air Limbah) beroperasi normal" />
                            <CheckRow checked={apar} onClick={() => setApar(!apar)} label="Sistem proteksi kebakaran & APAR terpasang di lokasi" />
                            <CheckRow checked={noise} onClick={() => setNoise(!noise)} label="Tingkat kebisingan & getaran mesin sesuai batas dBA" />
                            <CheckRow checked={safetyEquipment} onClick={() => setSafetyEquipment(!safetyEquipment)} label="Peralatan K3 / APD lengkap dipakai operator lapangan" />
                        </div>
                    </div>

                    {/* Catatan Lapangan & Dokumentasi Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 text-left">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Catatan / Temuan Lapangan</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full min-h-[90px] rounded-none border border-slate-200 p-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                                placeholder="Uraikan catatan temuan di lapangan..."
                            />
                        </div>
                        <div className="space-y-1.5 text-left">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Dokumentasi Sidak</label>
                            <div className="border border-slate-200 bg-slate-100 rounded-none p-4 flex flex-col items-center justify-center text-center h-[90px] relative overflow-hidden group cursor-default">
                                <div className="relative z-10 text-slate-600 flex flex-col items-center gap-1.5">
                                    <Camera size={16} />
                                    <span className="text-[9px] font-black uppercase tracking-widest block leading-none">BAP_EVIDENCE.JPG</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tanda Tangan Kanvas (Mengimpor SignaturePad) */}
                    <SignaturePad onChange={(signed, data) => {
                        setIsSigned(signed);
                        setSignatureData(data);
                    }} />

                    {/* Dynamic Score Indicator & Submit */}
                    <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="p-3 bg-emerald-50 border border-emerald-100 flex items-center justify-between gap-4 flex-1">
                            <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Skor Kepatuhan Sementara</span>
                            <div className="flex items-baseline gap-0.5">
                                <span className="text-xl font-black text-emerald-950 italic tracking-tighter leading-none">{calculatedScore}</span>
                                <span className="text-[10px] font-bold text-emerald-600">/100</span>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="rounded-none h-11 bg-slate-900 hover:bg-emerald-600 text-white font-black text-[11px] tracking-widest uppercase px-6 shrink-0 transition-colors"
                        >
                            {loading ? (
                                <span className="flex items-center gap-1.5">
                                    <Loader2 className="animate-spin" size={14} /> MENGIRIM...
                                </span>
                            ) : (
                                "KIRIM EVALUASI"
                            )}
                        </Button>
                    </div>

                </form>
            </DialogContent>
        </Dialog>
    );
}

// Sub-Komponen Checklist Row (Siku Kaku & High Density)
function CheckRow({ checked, onClick, label }: { checked: boolean, onClick: () => void, label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "w-full p-2.5 rounded-none border text-left flex items-center gap-2.5 transition-colors outline-none",
                checked
                    ? "border-emerald-500 bg-emerald-50/20 text-emerald-950"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
            )}
        >
            <div className="shrink-0 flex items-center justify-center">
                {checked
                    ? <div className="w-4 h-4 bg-emerald-600 border border-emerald-600 text-white flex items-center justify-center"><CheckCircle2 size={12} /></div>
                    : <div className="w-4 h-4 border border-slate-300 bg-white" />
                }
            </div>
            <span className="text-xs font-bold leading-tight">{label}</span>
        </button>
    );
}