// src/modules/companies/components/forms/PickupRequestForm.tsx
import React, { useState, useEffect } from "react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, DollarSign, Truck } from "lucide-react";
import { toast } from "sonner";

interface PickupRequestFormProps {
    onSuccess?: () => void;
}

export default function PickupRequestForm({ onSuccess }: PickupRequestFormProps) {
    const { companies, selectedCompanyId, currentUser, createPickupRequest } = useSijagaStore();

    // State Form
    const [wasteType, setWasteType] = useState("Oli Bekas");
    const [volume, setVolume] = useState("");
    const [unit, setUnit] = useState("L");
    const [date, setDate] = useState("");
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);

    const activeCompany = companies.find(c => c.id === selectedCompanyId) ||
        companies.find(c => c.id === currentUser?.companyId) ||
        companies[0];

    // Mengisi alamat otomatis berdasarkan data master perusahaan (Information Expert) [3]
    useEffect(() => {
        if (activeCompany && activeCompany.address) {
            setAddress(activeCompany.address);
        }
    }, [activeCompany]);

    // Logika Estimasi Biaya (Rp 10.000 per Liter / kg) [3]
    const volumeNumber = parseFloat(volume) || 0;
    const estimatedCost = volumeNumber * 10000;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCompany) {
            toast.error("Tidak ada profil perusahaan aktif.");
            return;
        }
        if (!volume || volumeNumber <= 0) {
            toast.error("Volume muatan wajib diisi.");
            return;
        }
        if (!date) {
            toast.error("Rencana tanggal penjemputan wajib ditentukan.");
            return;
        }
        if (!address) {
            toast.error("Alamat penjemputan detail wajib diisi.");
            return;
        }

        setLoading(true);
        try {
            await createPickupRequest({
                companyId: activeCompany.id,
                companyName: activeCompany.companyName,
                wasteType,
                volume: `${volume} ${unit}`,
                date,
                address,
                transporterId: "TRANS-001" // Default transporter ID
            });

            setVolume("");
            setDate("");
            if (onSuccess) onSuccess();
        } catch (err) {
            toast.error("Gagal mengirim permintaan penjemputan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-left font-sans">
            <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Jenis Limbah B3</Label>
                <select
                    value={wasteType}
                    onChange={(e) => setWasteType(e.target.value)}
                    className="h-10 w-full rounded-none border border-slate-300 bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-700 focus:outline-none focus:border-emerald-600 focus:ring-0 cursor-pointer"
                >
                    <option value="Oli Bekas">Oli Bekas (B3)</option>
                    <option value="Limbah Cair Kimia">Limbah Cair Kimia</option>
                    <option value="Minyak Jelantah">Minyak Jelantah</option>
                    <option value="Limbah Padat B3">Limbah Padat B3</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Volume Muatan</Label>
                    <Input
                        type="number"
                        required
                        placeholder="Contoh: 50"
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                        className="rounded-none h-10 border-slate-300 bg-white font-bold"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Satuan</Label>
                    <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="h-10 w-full rounded-none border border-slate-300 bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-700 focus:outline-none focus:border-emerald-600 focus:ring-0 cursor-pointer"
                    >
                        <option value="L">Liter (L)</option>
                        <option value="kg">Kilogram (kg)</option>
                        <option value="m³">Meter Kubik (m³)</option>
                    </select>
                </div>
            </div>

            <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rencana Penjemputan</Label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <Input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="rounded-none h-10 pl-9 border-slate-300 bg-white text-slate-700 font-bold"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Titik Muat Limbah</Label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 text-slate-400" size={14} />
                    <textarea
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full min-h-[70px] rounded-none border border-slate-300 pl-9 p-2.5 text-xs font-bold focus:outline-none focus:border-emerald-600 focus:ring-0 bg-white"
                        placeholder="Masukkan alamat pabrik/bengkel detail..."
                    />
                </div>
            </div>

            {/* TACTICAL COST ESTIMATOR BOARD */}
            {volumeNumber > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-none flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <DollarSign className="text-emerald-600" size={14} />
                        <span className="text-[9px] font-black text-emerald-900 uppercase tracking-widest">Estimasi Tarif</span>
                    </div>
                    <span className="font-black text-emerald-800 text-xs italic tracking-tight">
                        Rp {estimatedCost.toLocaleString()}
                    </span>
                </div>
            )}

            <div className="pt-2">
                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-none shadow-none"
                >
                    {loading ? "MEMPROSES..." : "Ajukan Penjemputan"}
                </Button>
            </div>
        </form>
    );
}