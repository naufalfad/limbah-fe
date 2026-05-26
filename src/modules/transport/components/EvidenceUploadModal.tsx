// src/modules/transport/components/EvidenceUploadModal.tsx
import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle2, Sparkles, Plus, X, FileText } from "lucide-react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { toast } from "sonner";

interface EvidenceUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    evidenceRequest: any;
}

export default function EvidenceUploadModal({ isOpen, onClose, evidenceRequest }: EvidenceUploadModalProps) {
    const { updatePickupStatus } = useSijagaStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State Input & Multi-Photo Base64 [3]
    const [loading, setLoading] = useState(false);
    const [evidencePhotos, setEvidencePhotos] = useState<string[]>([]);
    const [actualVolume, setActualVolume] = useState("");
    const [transportReport, setTransportReport] = useState("");

    if (!evidenceRequest) return null;

    // Konverter Berkas Fisik ke Base64 Array secara Asinkron [3]
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);

            // Validasi batas ukuran berkas (Maksimal 5 MB) [3]
            const oversizedFile = files.find(f => f.size > 5 * 1024 * 1024);
            if (oversizedFile) {
                toast.error(`Berkas ${oversizedFile.name} melebihi batas ukuran 5 MB.`);
                return;
            }

            Promise.all(files.map(f => {
                return new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(f);
                });
            })).then(newPhotos => {
                setEvidencePhotos(prev => [...prev, ...newPhotos]);
                toast.success(`${files.length} foto berhasil diunggah.`);
            });
        }
    };

    const removePhoto = (index: number) => {
        setEvidencePhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleComplete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!actualVolume) {
            toast.error("Volume aktual yang diangkut wajib diisi.");
            return;
        }
        if (!transportReport) {
            toast.error("Catatan tambahan pengangkutan wajib diisi.");
            return;
        }

        setLoading(true);
        try {
            const photoPayload = evidencePhotos.length > 0 ? JSON.stringify(evidencePhotos) : "[]";

            // Mengirimkan objek payload asli, bukan diserialisasi (karena api.ts menggunakan spread operator ...payload)
            const payloadObject = {
                evidencePhoto: photoPayload,
                actualVolume,
                transportReport
            };

            await updatePickupStatus(evidenceRequest.id, "COMPLETED", payloadObject);

            // Reset State & Tutup Dialog [3]
            setEvidencePhotos([]);
            setActualVolume("");
            setTransportReport("");
            onClose();
        } catch (error) {
            toast.error("Gagal memproses penyelesaian manifest.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[420px] rounded-none bg-white border border-slate-200 text-left p-6 z-[9999]">

                {/* HEADER */}
                <DialogHeader className="border-b pb-3">
                    <DialogTitle className="text-xs font-black tracking-widest text-slate-800 uppercase flex items-center gap-2">
                        <Upload size={14} className="text-emerald-600" /> Selesaikan Pengiriman
                    </DialogTitle>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Unggah dokumentasi serah terima & volume aktual [3]</p>
                </DialogHeader>

                {/* FORM CONTENT */}
                <form onSubmit={handleComplete} className="space-y-4 py-3 font-sans text-left">

                    {/* Objek Informasi Manifest */}
                    <div className="p-3 bg-slate-50 border border-slate-200 text-left">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Pihak Pemesan</p>
                        <h4 className="text-xs font-bold text-slate-800 leading-tight mt-1 truncate">{evidenceRequest.companyName}</h4>
                        <p className="text-[9px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider leading-none">{evidenceRequest.wasteType} — Estimasi: {evidenceRequest.volume}</p>
                    </div>

                    {/* Multi-Photo Uploader Box */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Dokumentasi Muatan Lapangan</label>

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border border-dashed border-slate-300 p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-emerald-50/10 hover:border-emerald-500 cursor-pointer min-h-[110px] transition-colors relative"
                        >
                            {evidencePhotos.length > 0 ? (
                                /* Horizontal Tumpukan Thumbnail Foto */
                                <div className="w-full flex gap-2 overflow-x-auto pb-1.5 custom-scrollbar" onClick={(e) => e.stopPropagation()}>
                                    {evidencePhotos.map((photo, i) => (
                                        <div key={i} className="relative w-16 h-16 shrink-0 border border-slate-200 group">
                                            <img src={photo} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(i)}
                                                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-600 text-white rounded-none flex items-center justify-center hover:bg-rose-700 transition-colors"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                    {/* "+" Box to upload more inside horizontal list [3] */}
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-16 h-16 bg-white border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-400 transition-colors shrink-0"
                                    >
                                        <Plus size={16} />
                                    </div>
                                </div>
                            ) : (
                                /* Empty Dropper state */
                                <div className="text-center space-y-1 text-slate-400">
                                    <Upload className="mx-auto" size={18} />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Unggah Berkas Foto</p>
                                    <p className="text-[8px] font-bold italic">Bisa pilih beberapa foto sekaligus (maks 5MB)</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Inputs (Actual Volume & Report) [3] */}
                    <div className="grid grid-cols-1 gap-3.5">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Volume Aktual yang Diangkut</Label>
                            <Input
                                required
                                placeholder="Contoh: 45 Liter"
                                value={actualVolume}
                                onChange={(e) => setActualVolume(e.target.value)}
                                className="rounded-none h-10 border-slate-300 bg-white font-bold text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Laporan Penjemputan (Catatan Driver)</Label>
                            <Input
                                required
                                placeholder="Contoh: Drum tersegel rapi, pH stabil"
                                value={transportReport}
                                onChange={(e) => setTransportReport(e.target.value)}
                                className="rounded-none h-10 border-slate-300 bg-white font-bold text-xs"
                            />
                        </div>
                    </div>

                    {/* Status Verification Note */}
                    <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-none flex items-start gap-2.5 text-left text-emerald-950">
                        <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5 animate-pulse" size={14} />
                        <div>
                            <h5 className="text-[10px] font-black uppercase tracking-widest leading-none">E-Manifest Sinkronisasi</h5>
                            <p className="text-[9px] font-semibold leading-normal mt-1 text-emerald-700">
                                Penyelesaian order otomatis memperbarui status manifest menjadi SELESAI, melunasi tagihan, dan mengirimkan koordinat penyerahan ke database DLH daerah [3].
                            </p>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] tracking-widest uppercase rounded-none shadow-sm gap-1.5"
                        >
                            {loading ? (
                                <>MENGIRIMKAN...</>
                            ) : (
                                <>
                                    Selesaikan Order <Sparkles size={12} />
                                </>
                            )}
                        </Button>
                    </div>

                </form>
            </DialogContent>
        </Dialog>
    );
}