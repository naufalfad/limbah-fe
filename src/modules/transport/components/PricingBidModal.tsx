// src/modules/transport/components/PricingBidModal.tsx
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Key } from "lucide-react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { toast } from "sonner";

interface PricingBidModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedRequest: any;
}

export default function PricingBidModal({ isOpen, onClose, selectedRequest }: PricingBidModalProps) {
    const { setPickupPrice } = useSijagaStore();

    const [cost, setCost] = useState("");
    const [driverName, setDriverName] = useState("");
    const [plateNo, setPlateNo] = useState("");
    const [loading, setLoading] = useState(false);

    if (!selectedRequest) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cost || parseFloat(cost) <= 0) {
            toast.error("Biaya angkut wajib diisi");
            return;
        }
        if (!driverName) {
            toast.error("Nama driver wajib diisi");
            return;
        }
        if (!plateNo) {
            toast.error("Nomor polisi armada wajib diisi");
            return;
        }

        setLoading(true);
        try {
            await setPickupPrice(selectedRequest.id, parseFloat(cost), driverName, plateNo);
            toast.success("Penetapan biaya angkut & supir berhasil dikirim ke pelaku usaha.");
            onClose();
            setCost("");
            setDriverName("");
            setPlateNo("");
        } catch (error) {
            toast.error("Gagal mengirim penawaran harga.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[440px] rounded-none bg-white border border-slate-200 text-left p-6">
                <DialogHeader className="border-b pb-3">
                    <DialogTitle className="text-sm font-black tracking-widest text-slate-800 uppercase flex items-center gap-2">
                        <Key size={14} className="text-emerald-600" /> Tentukan Tarif Jasa
                    </DialogTitle>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Lengkapi data driver & harga bid penjemputan</p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-3">
                    {/* Objek Pengangkutan */}
                    <div className="p-3 bg-slate-50 border border-slate-200 text-left">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pemesan</p>
                        <h4 className="text-xs font-bold text-slate-800 leading-tight mt-1 truncate">{selectedRequest.companyName}</h4>
                        <p className="text-[9px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">{selectedRequest.wasteType} — {selectedRequest.volume}</p>
                    </div>

                    <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tarif Jasa Pengangkutan (Rp)</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
                            <Input
                                type="number"
                                placeholder="Contoh: 350000"
                                value={cost}
                                onChange={(e) => setCost(e.target.value)}
                                className="h-10 pl-10 rounded-none border-slate-200"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nama Supir / Driver</label>
                        <Input
                            placeholder="Contoh: Agus Setiawan"
                            value={driverName}
                            onChange={(e) => setDriverName(e.target.value)}
                            className="h-10 rounded-none border-slate-200"
                        />
                    </div>

                    <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nomor Polisi Truk</label>
                        <Input
                            placeholder="Contoh: D 8492 DLH"
                            value={plateNo}
                            onChange={(e) => setPlateNo(e.target.value)}
                            className="h-10 rounded-none border-slate-200"
                        />
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-slate-900 hover:bg-emerald-600 text-white font-black text-[10px] tracking-widest uppercase rounded-none"
                        >
                            {loading ? "MENGIRIM..." : "Kirim Penawaran Harga"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}