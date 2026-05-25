// src/modules/transport/components/EvidenceUploadModal.tsx
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2 } from "lucide-react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { toast } from "sonner";

interface EvidenceUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    evidenceRequest: any;
}

export default function EvidenceUploadModal({ isOpen, onClose, evidenceRequest }: EvidenceUploadModalProps) {
    const { updatePickupStatus } = useSijagaStore();
    const [loading, setLoading] = useState(false);

    // Dummy serah terima photo manifest
    const [evidencePhoto] = useState("https://images.unsplash.com/photo-1618090584126-129cd1f3f94c?w=400&auto=format&fit=crop&q=60");

    if (!evidenceRequest) return null;

    const handleComplete = async () => {
        setLoading(true);
        try {
            await updatePickupStatus(evidenceRequest.id, "COMPLETED", evidencePhoto);
            toast.success("Order pengangkutan selesai! Bukti serah terima berhasil diunggah.");
            onClose();
        } catch (error) {
            toast.error("Gagal memperbarui status manifest.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px] rounded-none bg-white border border-slate-200 text-left p-6">
                <DialogHeader className="border-b pb-3">
                    <DialogTitle className="text-sm font-black tracking-widest text-slate-800 uppercase flex items-center gap-2">
                        <Upload size={14} className="text-emerald-600" /> Selesaikan Pengiriman
                    </DialogTitle>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Unggah foto muatan sampai di pusat pengelolaan</p>
                </DialogHeader>

                <div className="space-y-4 py-3">
                    {/* Image Dropper/Preview Box (DIET COUPLING: rounded-none) */}
                    <div className="border border-slate-200 bg-slate-50 rounded-none p-4 flex flex-col items-center justify-center text-center h-[160px] relative overflow-hidden group cursor-default">
                        <img src={evidencePhoto} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Upload className="text-white" size={24} />
                        </div>
                    </div>

                    {/* Status Note: GFW Aesthetic, flat, kaku */}
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-none flex items-start gap-2.5 text-left text-emerald-900">
                        <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={14} />
                        <div>
                            <h5 className="text-[10px] font-black uppercase tracking-widest leading-none">Validasi Manifest Selesai</h5>
                            <p className="text-[9px] font-semibold leading-normal mt-1 text-emerald-700">
                                Status order pengangkutan akan otomatis diperbarui menjadi SELESAI, dan dokumen BAP serta serah terima dikirimkan langsung ke database DLH daerah.
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={handleComplete}
                        disabled={loading}
                        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] tracking-widest uppercase rounded-none shadow-sm"
                    >
                        {loading ? "MEMPROSES..." : "Selesaikan Order"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}