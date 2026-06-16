import React, { useState } from 'react';
import {
    AlertTriangle, Loader2, Crosshair,
    ChevronRight, ChevronLeft, MapPin,
    Camera, CheckCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSijagaStore } from "@/store/useSijagaStore";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (trackingId: string) => void;
}

export default function CitizenReportModal({ isOpen, onClose, onSuccess }: ModalProps) {
    const { submitCitizenReport, isReportLoading } = useSijagaStore();

    // State Wizard & Form
    const [step, setStep] = useState(1);
    const [isLocating, setIsLocating] = useState(false);

    const [formData, setFormData] = useState({
        incidentType: 'Pencemaran Air',
        description: '',
        lat: '',
        lng: '',
        evidencePhoto: 'https://placehold.co/600x400/png?text=Bukti+Pencemaran+Limbah', // Mock Upload default
        reporterName: '',
        reporterContact: ''
    });

    const handleNext = () => {
        if (step === 1 && !formData.incidentType) {
            toast.error("Pilih jenis pencemaran terlebih dahulu.");
            return;
        }
        setStep(2);
    };

    const handlePrev = () => setStep(1);

    // Akses Hardware: GPS Geotagging
    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Browser Anda tidak mendukung deteksi lokasi otomatis.");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setFormData(prev => ({
                    ...prev,
                    lat: pos.coords.latitude.toFixed(6),
                    lng: pos.coords.longitude.toFixed(6)
                }));
                setIsLocating(false);
                toast.success("Koordinat spasial GPS berhasil diverifikasi.");
            },
            (err) => {
                setIsLocating(false);
                toast.error("Gagal mengambil GPS. Pastikan izin lokasi perangkat aktif.");
                console.error(err);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.lat || !formData.lng) {
            toast.error("Akses Geotagging GPS wajib diisi untuk titik peta (GIS).");
            return;
        }
        if (!formData.description) {
            toast.error("Deskripsi kronologi kejadian wajib diisi.");
            return;
        }

        const result = await submitCitizenReport(formData);

        if (result.success && result.trackingId) {
            // Silent Tracking: Simpan ID ke perangkat warga
            localStorage.setItem('geo_limbah_report_id', result.trackingId);

            // Reset Form
            setStep(1);
            setFormData({
                incidentType: 'Pencemaran Air', description: '', lat: '', lng: '',
                evidencePhoto: 'https://placehold.co/600x400/png?text=Bukti+Pencemaran+Limbah',
                reporterName: '', reporterContact: ''
            });

            if (onSuccess) onSuccess(result.trackingId);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] bg-white border border-slate-200 text-left p-0 rounded-none shadow-2xl overflow-hidden">

                {/* HEADER WIZARD */}
                <div className="bg-slate-900 p-6 text-white flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-500 rounded-none flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                        <AlertTriangle size={24} className="text-white" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Lapor Pelanggaran</DialogTitle>
                        <p className="text-slate-400 text-xs font-medium mt-1">Data Anda dilindungi oleh sistem keamanan pelapor (Whistleblower Protection).</p>
                    </div>
                </div>

                {/* PROGRESS BAR */}
                <div className="flex h-1.5 bg-slate-100 w-full">
                    <div className={`h-full bg-amber-500 transition-all duration-500 ${step === 1 ? 'w-1/2' : 'w-full'}`} />
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* ================= STEP 1 ================= */}
                    <div className={step === 1 ? 'block animate-in fade-in slide-in-from-right-4' : 'hidden'}>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Klasifikasi Insiden</Label>
                                <select
                                    value={formData.incidentType}
                                    onChange={(e) => setFormData(prev => ({ ...prev, incidentType: e.target.value }))}
                                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-none text-sm font-bold focus:border-emerald-500 outline-none transition-colors"
                                >
                                    <option value="Pencemaran Air">Pencemaran Air / Aliran Sungai</option>
                                    <option value="Emisi Asap">Emisi Asap / Pencemaran Udara</option>
                                    <option value="Pembuangan B3 Liar">Pembuangan Limbah B3 Liar</option>
                                    <option value="Bau Menyengat">Polusi Bau / Kebisingan Industri</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nama (Opsional)</Label>
                                    <Input
                                        placeholder="Anonim"
                                        value={formData.reporterName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, reporterName: e.target.value }))}
                                        className="h-10 border-slate-200 rounded-none text-xs font-bold"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Kontak WA (Opsional)</Label>
                                    <Input
                                        placeholder="Untuk Notifikasi"
                                        value={formData.reporterContact}
                                        onChange={(e) => setFormData(prev => ({ ...prev, reporterContact: e.target.value }))}
                                        className="h-10 border-slate-200 rounded-none text-xs font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-8">
                            <Button type="button" onClick={handleNext} className="bg-slate-900 hover:bg-slate-800 text-white rounded-none font-bold text-xs uppercase tracking-wider px-6 h-10">
                                Selanjutnya <ChevronRight size={16} className="ml-2" />
                            </Button>
                        </div>
                    </div>

                    {/* ================= STEP 2 ================= */}
                    <div className={step === 2 ? 'block animate-in fade-in slide-in-from-right-4' : 'hidden'}>
                        <div className="space-y-4">

                            {/* Geotagging Section */}
                            <div className="p-4 bg-slate-50 border border-slate-200 relative overflow-hidden group">
                                <MapPin className="absolute -right-4 -bottom-4 w-24 h-24 text-slate-200/50 group-hover:scale-110 transition-transform" />
                                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-800 block mb-2 relative">Titik Lokasi Kejadian (Wajib)</Label>
                                <div className="flex gap-2 relative">
                                    <Input readOnly value={formData.lat} placeholder="Latitude" className="h-9 border-slate-200 rounded-none text-xs font-mono bg-white" />
                                    <Input readOnly value={formData.lng} placeholder="Longitude" className="h-9 border-slate-200 rounded-none text-xs font-mono bg-white" />
                                    <Button
                                        type="button"
                                        onClick={handleGetLocation} disabled={isLocating}
                                        className="bg-amber-600 hover:bg-amber-700 text-white rounded-none h-9 px-3 shrink-0 transition-colors"
                                    >
                                        {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair size={16} />}
                                    </Button>
                                </div>
                            </div>

                            {/* Photo Upload Mock */}
                            <div className="border-2 border-dashed border-slate-200 p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors">
                                <Camera size={24} className="text-slate-400 mb-2" />
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Unggah Foto Bukti</span>
                                <span className="text-[9px] text-slate-400 mt-1">Maksimal 5MB (JPG/PNG)</span>
                            </div>

                            {/* Kronologi */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Kronologi Singkat</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Ceritakan detail warna limbah, bau, atau nama perusahaan jika tahu..."
                                    className="h-20 text-xs font-medium border-slate-200 rounded-none resize-none"
                                />
                            </div>

                        </div>

                        <div className="flex justify-between pt-8">
                            <Button type="button" variant="ghost" onClick={handlePrev} className="rounded-none font-bold text-xs uppercase tracking-wider text-slate-500 hover:text-slate-800">
                                <ChevronLeft size={16} className="mr-1" /> Kembali
                            </Button>
                            <Button
                                type="submit"
                                disabled={isReportLoading || !formData.lat}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 rounded-none text-xs tracking-wider uppercase h-10 shadow-lg shadow-emerald-600/20"
                            >
                                {isReportLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle size={16} className="mr-2" />}
                                Kirim Laporan
                            </Button>
                        </div>
                    </div>

                </form>
            </DialogContent>
        </Dialog>
    );
}