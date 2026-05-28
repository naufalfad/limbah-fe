import React, { useState, useEffect } from 'react';
import { Loader2, Search, Activity, CheckCircle, Clock, XCircle, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSijagaStore } from "@/store/useSijagaStore";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultTrackingId?: string | null;
}

export default function TrackReportModal({ isOpen, onClose, defaultTrackingId }: ModalProps) {
    const [trackingId, setTrackingId] = useState('');
    const { trackCitizenReport, publicReportTrackData: reportData, isReportLoading, clearPublicReportData } = useSijagaStore();

    // Reset state saat modal ditutup atau dibuka
    useEffect(() => {
        if (isOpen) {
            if (defaultTrackingId) {
                setTrackingId(defaultTrackingId);
                trackCitizenReport(defaultTrackingId);
            } else {
                setTrackingId('');
                clearPublicReportData();
            }
        }
    }, [isOpen, defaultTrackingId]);

    const handleTrack = async () => {
        if (!trackingId.trim()) return;
        await trackCitizenReport(trackingId.toUpperCase());
    };

    // Konfigurasi Visual Timeline
    const getTimelineSteps = (currentStatus: string) => {
        const isRejected = currentStatus === 'REJECTED';

        const steps = [
            { id: 'PENDING', label: 'Laporan Masuk', icon: Clock, desc: 'Menunggu kurasi admin' },
            { id: isRejected ? 'REJECTED' : 'VERIFIED', label: isRejected ? 'Ditolak' : 'Diverifikasi', icon: isRejected ? XCircle : ShieldCheck, desc: isRejected ? 'Laporan tidak valid' : 'Menyiapkan surat tugas' },
            { id: 'INVESTIGATING', label: 'Investigasi', icon: Activity, desc: 'Petugas turun ke titik GIS' },
            { id: 'RESOLVED', label: 'Selesai', icon: CheckCircle, desc: 'Penindakan tuntas' }
        ];

        // Menentukan index aktif
        let activeIndex = 0;
        if (currentStatus === 'VERIFIED' || currentStatus === 'REJECTED') activeIndex = 1;
        if (currentStatus === 'INVESTIGATING') activeIndex = 2;
        if (currentStatus === 'RESOLVED') activeIndex = 3;

        return { steps, activeIndex, isRejected };
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[480px] bg-slate-50 border border-slate-200 text-left p-0 rounded-none shadow-2xl overflow-hidden">

                <DialogHeader className="bg-white p-6 border-b border-slate-200">
                    <DialogTitle className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <Search className="text-emerald-600" size={20} /> Lacak Pengaduan
                    </DialogTitle>
                    <div className="flex gap-2 mt-4">
                        <Input
                            placeholder="Nomor Resi: RPT-YYYYMMDD-XXXX"
                            value={trackingId}
                            onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                            className="h-11 border-slate-300 rounded-none text-sm font-mono font-black uppercase placeholder:font-sans placeholder:font-medium focus:border-emerald-500 bg-white"
                        />
                        <Button
                            onClick={handleTrack}
                            disabled={isReportLoading || !trackingId}
                            className="bg-slate-900 hover:bg-emerald-600 text-white h-11 rounded-none px-6 text-xs font-bold uppercase tracking-widest transition-colors"
                        >
                            {isReportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cari"}
                        </Button>
                    </div>
                </DialogHeader>

                <div className="p-6">
                    {!reportData && !isReportLoading && (
                        <div className="text-center py-8 text-slate-400">
                            <Activity size={32} className="mx-auto mb-3 opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-widest">Masukkan Tracking ID untuk melihat status</p>
                        </div>
                    )}

                    {isReportLoading && !reportData && (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                        </div>
                    )}

                    {/* VISUAL TIMELINE RENDERER */}
                    {reportData && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <div className="mb-6 pb-6 border-b border-slate-200">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Kategori Laporan</h4>
                                <p className="text-sm font-black text-slate-800 mt-1">{reportData.incidentType}</p>
                                {reportData.adminNotes && (
                                    <div className="mt-3 p-3 bg-white border-l-2 border-emerald-500 shadow-sm">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Catatan Verifikator:</p>
                                        <p className="text-xs font-bold text-slate-700 italic">"{reportData.adminNotes}"</p>
                                    </div>
                                )}
                            </div>

                            {/* TIMELINE TREE */}
                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
                                {getTimelineSteps(reportData.status).steps.map((step, idx) => {
                                    const { activeIndex, isRejected } = getTimelineSteps(reportData.status);
                                    const isPast = idx < activeIndex;
                                    const isCurrent = idx === activeIndex;
                                    const Icon = step.icon;

                                    // Styling logic
                                    let bgColor = "bg-slate-100";
                                    let textColor = "text-slate-400";
                                    let ringColor = "border-slate-200";

                                    if (isPast) {
                                        bgColor = "bg-emerald-500";
                                        textColor = "text-white";
                                        ringColor = "border-emerald-500";
                                    } else if (isCurrent) {
                                        bgColor = isRejected ? "bg-red-500" : "bg-emerald-500";
                                        textColor = "text-white";
                                        ringColor = isRejected ? "border-red-200" : "border-emerald-200";
                                    }

                                    return (
                                        <div key={step.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">

                                            {/* Timeline Node */}
                                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 transition-colors ${bgColor} ${textColor} ${ringColor} ${isCurrent ? 'animate-pulse' : ''}`}>
                                                <Icon size={16} />
                                            </div>

                                            {/* Timeline Content */}
                                            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white p-3 rounded-none border border-slate-200 shadow-sm">
                                                <h5 className={`text-xs font-black uppercase tracking-wider ${isCurrent ? (isRejected ? 'text-red-600' : 'text-emerald-600') : 'text-slate-700'}`}>
                                                    {step.label}
                                                </h5>
                                                <p className="text-[10px] text-slate-500 font-medium mt-1">{step.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}