// src/modules/companies/components/forms/WasteLogbookForm.tsx
import React, { useState } from "react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

// Menggunakan deklarasi fungsi standar untuk kompatibilitas kompilasi maksimal (Prinsip GRASP: Protected Variations)
export default function WasteLogbookForm({ onSuccess }: { onSuccess?: () => void }) {
    const { companies, selectedCompanyId, currentUser, addWasteLog } = useSijagaStore();

    const [type, setType] = useState<string>("Oli Bekas");
    const [volume, setVolume] = useState<string>("");
    const [unit, setUnit] = useState<"L" | "kg" | "m³">("L");
    const [method, setMethod] = useState<"Dinas" | "Mandiri">("Dinas");
    const [note, setNote] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [showAnomalyWarning, setShowAnomalyWarning] = useState<boolean>(false);

    // Safely find the active company (Information Expert)
    const activeCompany = companies.find(c => c.id === selectedCompanyId) ||
        companies.find(c => c.id === currentUser?.companyId) ||
        companies[0];

    const handlePreSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCompany) {
            toast.error("Tidak ada profil perusahaan aktif terdeteksi.");
            return;
        }
        if (!volume || parseFloat(volume) <= 0) {
            toast.error("Volume laporan limbah harus lebih besar dari 0.");
            return;
        }

        const volNum = parseFloat(volume);
        if (volNum > 100) {
            setShowAnomalyWarning(true);
        } else {
            executeSubmit();
        }
    };

    const executeSubmit = async () => {
        if (!activeCompany) {
            toast.error("Tidak ada profil perusahaan aktif terdeteksi.");
            return;
        }
        setLoading(true);
        try {
            await addWasteLog({
                companyId: activeCompany.id,
                type,
                volume: parseFloat(volume),
                unit,
                date: new Date().toISOString().split("T")[0],
                method,
                note
            });

            setVolume("");
            setNote("");
            setShowAnomalyWarning(false);
            if (onSuccess) onSuccess();
        } catch (err) {
            toast.error("Gagal mencatat logbook limbah.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="font-sans text-left">
            {showAnomalyWarning ? (
                <div className="space-y-6 py-2">
                    <div className="p-4 bg-rose-50 border border-rose-300 rounded-none flex items-start gap-4 text-rose-950">
                        <AlertTriangle className="text-rose-600 shrink-0 mt-0.5 animate-bounce" size={24} />
                        <div className="space-y-1">
                            <h4 className="font-black text-xs uppercase tracking-widest leading-none text-rose-900">
                                EWS ALERT: VOLUME ABNORMAL DETECTED
                            </h4>
                            <p className="text-[11px] font-medium leading-relaxed mt-2 text-rose-800">
                                Laporan volume sebesar <strong className="font-black">{volume} {unit}</strong> melampaui ambang batas aman operasional.
                                Sistem AI otomatis akan mengirimkan alarm bahaya serta mencatat log audit ketidakpatuhan ini ke database verifikator DLH.
                            </p>
                        </div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase text-center tracking-widest">
                        Apakah Anda yakin data ini sudah akurat?
                    </p>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowAnomalyWarning(false)}
                            className="flex-1 rounded-none h-11 border-slate-300 text-slate-500 font-bold text-xs uppercase tracking-wider"
                        >
                            Revisi Volume
                        </Button>
                        <Button
                            type="button"
                            disabled={loading}
                            onClick={executeSubmit}
                            className="flex-1 rounded-none h-11 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest"
                        >
                            {loading ? "MEMPROSES..." : "Tetap Kirim"}
                        </Button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handlePreSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Jenis Limbah</Label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="h-10 w-full rounded-none border border-slate-300 bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-700 focus:outline-none focus:border-emerald-600 focus:ring-0 cursor-pointer"
                        >
                            <option value="Oli Bekas">Oli Bekas (B3)</option>
                            <option value="Limbah Cair Kimia">Limbah Cair Kimia (B3)</option>
                            <option value="Minyak Jelantah">Minyak Jelantah (Domestik)</option>
                            <option value="Limbah Padat B3">Limbah Padat B3</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Volume</Label>
                            <Input
                                type="number"
                                required
                                placeholder="Contoh: 45"
                                value={volume}
                                onChange={(e) => setVolume(e.target.value)}
                                className="rounded-none h-10 border-slate-300 bg-white font-bold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Satuan</Label>
                            <select
                                value={unit}
                                onChange={(e) => setUnit(e.target.value as any)}
                                className="h-10 w-full rounded-none border border-slate-300 bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-700 focus:outline-none focus:border-emerald-600 focus:ring-0 cursor-pointer"
                            >
                                <option value="L">Liter (L)</option>
                                <option value="kg">Kilogram (kg)</option>
                                <option value="m³">Meter Kubik (m³)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Metode Pengelolaan</Label>
                        <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value as any)}
                            className="h-10 w-full rounded-none border border-slate-300 bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-700 focus:outline-none focus:border-emerald-600 focus:ring-0 cursor-pointer"
                        >
                            <option value="Dinas">Dinas LH (Transporter Berlisensi)</option>
                            <option value="Mandiri">Mandiri (Punya IPAL / TPS B3 Internal)</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Catatan Tambahan</Label>
                        <Input
                            placeholder="Contoh: Penampungan drum minggu ke-2"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="rounded-none h-10 border-slate-300 bg-white text-xs font-bold"
                        />
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-none shadow-none"
                        >
                            {loading ? "MEMPROSES..." : "Kirim Laporan"}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}