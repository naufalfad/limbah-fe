// src/modules/inspections/components/AuditEvaluationModal.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ClipboardList, Camera, X, CheckCircle2, Loader2, AlertTriangle, Building2, Gavel } from "lucide-react";
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
    const { companies, fetchCompanies, submitInspectionResult } = useSijagaStore();
    const [loading, setLoading] = useState(false);

    // Checklist State (Hanya untuk Audit Rutin)
    const [tpsB3, setTpsB3] = useState(false);
    const [ipal, setIpal] = useState(false);
    const [apar, setApar] = useState(false);
    const [noise, setNoise] = useState(false);
    const [safetyEquipment, setSafetyEquipment] = useState(false);
    const [notes, setNotes] = useState("");

    // Signature State
    const [isSigned, setIsSigned] = useState(false);
    const [signatureData, setSignatureData] = useState<string | null>(null);

    // Photo Upload State
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoBase64, setPhotoBase64] = useState<string | null>(null);

    // --- REBINDING LOGIC FOR UNKNOWN COMPANY [3] ---
    const isUnknown = selectedInsp?.companyId === "COM-UNKNOWN";
    const [correctedCompanyId, setCorrectedCompanyId] = useState("COM-UNKNOWN");

    useEffect(() => {
        if (isOpen) {
            fetchCompanies();
            setCorrectedCompanyId(selectedInsp?.companyId || "COM-UNKNOWN");
        }
    }, [isOpen, selectedInsp, fetchCompanies]);

    const approvedCompanies = useMemo(() => {
        return companies.filter(c => c.status === "APPROVED" && c.id !== "COM-UNKNOWN");
    }, [companies]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setPhotoFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoBase64(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemovePhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setPhotoFile(null);
        setPhotoBase64(null);
    };

    if (!selectedInsp) return null;

    // Hitung skor kepatuhan secara dinamis (Hanya relevan untuk Audit Rutin)
    const checkedCount = [tpsB3, ipal, apar, noise, safetyEquipment].filter(Boolean).length;
    const calculatedScore = checkedCount * 20;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isSigned) {
            toast.error("Tanda tangan digital BAP wajib dilengkapi.");
            return;
        }

        // Validasi ekstra khusus untuk Penindakan Pengaduan
        if (isUnknown && !notes.trim()) {
            toast.error("Hasil investigasi (Catatan/Temuan Lapangan) wajib diisi untuk penindakan aduan warga.");
            return;
        }

        setLoading(true);
        try {
            // POLYMORPHIC PAYLOAD: Tentukan apa yang dikirim berdasarkan Konteks (isUnknown)
            const payloadScore = isUnknown ? null : calculatedScore;
            const payloadChecklist = isUnknown ? null : { tpsB3, ipal, apar, noise, safetyEquipment };

            await submitInspectionResult(
                selectedInsp.id,
                payloadScore as any, // Mem-bypass TS karena kita sudah setup nullable di Store
                notes,
                payloadChecklist as any,
                photoBase64 || undefined,
                isUnknown ? correctedCompanyId : undefined // Rebind hanya terjadi jika awalnya Unknown
            );

            if (isUnknown) {
                if (correctedCompanyId !== "COM-UNKNOWN") {
                    toast.success(`BAP Penindakan diamankan. Pelaku berhasil diidentifikasi.`);
                } else {
                    toast.success(`BAP Penindakan diamankan. Kasus ditutup.`);
                }
            } else {
                toast.success(`Evaluasi Kepatuhan Selesai. Skor: ${calculatedScore}/100.`);
            }

            onClose();
        } catch (err) {
            toast.error("Terjadi kesalahan saat memproses laporan BAP.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[90vw] lg:max-w-xl p-0 overflow-hidden rounded-none border-none shadow-2xl bg-white font-sans">

                {/* HEADER - Frameless & Sharp. Warna Header berubah sesuai Konteks */}
                <div className={cn("p-5 flex justify-between items-center shrink-0", isUnknown ? "bg-rose-950 text-white" : "bg-slate-900 text-white")}>
                    <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 flex items-center justify-center text-white rounded-none shrink-0 shadow-sm", isUnknown ? "bg-rose-600" : "bg-emerald-600")}>
                            {isUnknown ? <Gavel size={18} /> : <ClipboardList size={18} />}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className={cn("border px-1.5 py-0.5 rounded-none text-[8px] font-black uppercase tracking-widest leading-none",
                                    isUnknown ? "bg-rose-600/20 text-rose-400 border-rose-500/50" : "bg-emerald-600/20 text-emerald-400 border-emerald-500/50"
                                )}>
                                    {isUnknown ? "TINDAK LANJUT PENGADUAN" : "INTERNAL AUDIT"}
                                </span>
                                <span className="text-slate-400 font-mono text-[9px] tracking-widest uppercase leading-none">BAP-AUTO</span>
                            </div>
                            <DialogTitle className="text-sm font-black tracking-widest text-white uppercase leading-none">
                                {isUnknown ? "BAP Penyelidikan Lapangan" : "Evaluasi Fisik Lapangan"}
                            </DialogTitle>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-none transition-colors text-slate-400">
                        <X size={16} />
                    </button>
                </div>

                {/* FORM BODY */}
                <form onSubmit={handleSubmit} className="flex flex-col bg-slate-50 max-h-[80vh] overflow-y-auto custom-scrollbar p-5 space-y-4">

                    {/* Seksi Objek Inspeksi */}
                    <div className="p-3.5 bg-slate-200/50 border border-slate-200 text-left">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none">Lokasi / Objek Inspeksi</span>
                        <h4 className="text-xs font-black text-slate-800 mt-1 leading-none uppercase">{selectedInsp.companyName}</h4>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1 leading-none uppercase">{selectedInsp.location}</p>
                    </div>

                    {/* BLOK A: LOGIKA PENINDAKAN PENGADUAN (isUnknown === true) */}
                    {isUnknown && (
                        <div className="p-4 bg-rose-50/50 border border-rose-200 text-left space-y-3.5 animate-in fade-in">
                            <div className="flex items-start gap-2.5 text-rose-800">
                                <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                                <div className="space-y-1">
                                    <h5 className="text-[9px] font-black uppercase tracking-widest leading-none">Identifikasi Pelanggar</h5>
                                    <p className="text-[9px] font-medium leading-normal text-rose-700 mt-1">
                                        Surat tugas ini berawal dari laporan masyarakat. Jika Anda berhasil menemukan identitas pelaku (pabrik/industri terdaftar) di lokasi, hubungkan BAP ini ke entitas tersebut.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none flex items-center gap-1">
                                    <Building2 size={12} className="text-rose-500" /> Tetapkan Target Pelanggar
                                </Label>
                                <select
                                    value={correctedCompanyId}
                                    onChange={(e) => {
                                        setCorrectedCompanyId(e.target.value);
                                        if (e.target.value !== "COM-UNKNOWN") {
                                            toast.info(`Target BAP diredireksi ke entitas industri terdaftar.`);
                                        }
                                    }}
                                    className="h-10 w-full rounded-none border border-rose-300 bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-700 focus:outline-none focus:border-rose-500 cursor-pointer"
                                >
                                    <option value="COM-UNKNOWN">-- PELAKU TIDAK DIKETAHUI / SULIT DIIDENTIFIKASI --</option>
                                    {approvedCompanies.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.companyName} ({c.nib})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* BLOK B: LOGIKA AUDIT RUTIN DLH (isUnknown === false) */}
                    {!isUnknown && (
                        <div className="space-y-2 text-left animate-in fade-in">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Parameter Evaluasi Kepatuhan (Mempengaruhi Skor ESG)</label>
                            <div className="space-y-1.5">
                                <CheckRow checked={tpsB3} onClick={() => setTpsB3(!tpsB3)} label="TPS Limbah B3 berizin & memenuhi standar wadah" />
                                <CheckRow checked={ipal} onClick={() => setIpal(!ipal)} label="Sistem IPAL (Pengolahan Air Limbah) beroperasi normal" />
                                <CheckRow checked={apar} onClick={() => setApar(!apar)} label="Sistem proteksi kebakaran & APAR terpasang di lokasi" />
                                <CheckRow checked={noise} onClick={() => setNoise(!noise)} label="Tingkat kebisingan & getaran mesin sesuai batas dBA" />
                                <CheckRow checked={safetyEquipment} onClick={() => setSafetyEquipment(!safetyEquipment)} label="Peralatan K3 / APD lengkap dipakai operator lapangan" />
                            </div>
                        </div>
                    )}

                    {/* Catatan Lapangan & Dokumentasi Grid (Berlaku Universal) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 text-left">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                {isUnknown ? "Hasil Investigasi Lapangan" : "Catatan / Temuan Lapangan"}
                                {isUnknown && <span className="text-rose-500">*</span>}
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full min-h-[90px] rounded-none border border-slate-200 p-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                                placeholder={isUnknown ? "Uraikan kronologi penindakan dan pelaku yang ditemukan..." : "Uraikan catatan temuan di lapangan..."}
                            />
                        </div>
                        <div className="space-y-1.5 text-left">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Dokumentasi Sidak</label>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id="bap-photo-upload"
                                onChange={handleFileChange}
                            />
                            {photoBase64 ? (
                                <div className="border border-slate-200 bg-slate-100 rounded-none h-[90px] relative overflow-hidden group">
                                    <img
                                        src={photoBase64}
                                        alt="Evidence Preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={handleRemovePhoto}
                                            className="bg-red-600 hover:bg-red-700 text-white font-black text-[8px] tracking-widest uppercase px-3 py-1.5 rounded-none shadow-md flex items-center gap-1"
                                        >
                                            <X size={10} /> HAPUS FOTO
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <label
                                    htmlFor="bap-photo-upload"
                                    className="border border-dashed border-slate-300 bg-white rounded-none p-4 flex flex-col items-center justify-center text-center h-[90px] relative overflow-hidden group cursor-pointer hover:bg-slate-50 hover:border-slate-450 transition-colors"
                                >
                                    <div className="relative z-10 text-slate-500 group-hover:text-emerald-600 flex flex-col items-center gap-1.5 transition-colors">
                                        <Camera size={18} />
                                        <span className="text-[9px] font-black uppercase tracking-widest block leading-none">UNGGAH FOTO BAP (JPG/PNG)</span>
                                    </div>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Tanda Tangan Kanvas (Mengimpor SignaturePad) */}
                    <SignaturePad onChange={(signed, data) => {
                        setIsSigned(signed);
                        setSignatureData(data);
                    }} />

                    {/* Dynamic Status Indicator & Submit Button */}
                    <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">

                        {/* Jika Audit Rutin: Tampilkan Skor */}
                        {!isUnknown && (
                            <div className="p-3 bg-emerald-50 border border-emerald-100 flex items-center justify-between gap-4 flex-1">
                                <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Skor Kepatuhan</span>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-xl font-black text-emerald-950 italic tracking-tighter leading-none">{calculatedScore}</span>
                                    <span className="text-[10px] font-bold text-emerald-600">/100</span>
                                </div>
                            </div>
                        )}

                        {/* Jika Pengaduan: Tampilkan Status Penindakan */}
                        {isUnknown && (
                            <div className="p-3 bg-rose-50 border border-rose-100 flex items-center justify-between gap-4 flex-1">
                                <span className="text-[9px] font-black text-rose-800 uppercase tracking-widest">Status BAP</span>
                                <span className="text-[11px] font-black text-rose-600 uppercase tracking-wider">Investigasi / Penindakan</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                "rounded-none h-11 text-white font-black text-[11px] tracking-widest uppercase px-6 shrink-0 transition-colors",
                                isUnknown ? "bg-slate-900 hover:bg-rose-600" : "bg-slate-900 hover:bg-emerald-600"
                            )}
                        >
                            {loading ? (
                                <span className="flex items-center gap-1.5">
                                    <Loader2 className="animate-spin" size={14} /> MENGIRIM...
                                </span>
                            ) : (
                                "KIRIM BAP RESMI"
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