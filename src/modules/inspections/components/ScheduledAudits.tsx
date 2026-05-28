// src/modules/inspections/components/ScheduledAudits.tsx
import React, { useMemo } from "react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, CalendarDays, CheckCircle2, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduledAuditsProps {
    onStartAudit: (insp: any) => void;
}

export default function ScheduledAudits({ onStartAudit }: ScheduledAuditsProps) {
    const { currentUser, inspections } = useSijagaStore();

    // 1. Memfilter penugasan aktif (Terjadwal) untuk petugas yang login secara presisi
    const pendingAudits = useMemo(() => {
        const userId = currentUser?.id;
        const officerId = currentUser?.officerId;

        return inspections.filter(
            (i) => (i.inspectorId === userId || i.inspectorId === officerId) && i.status === "Terjadwal"
        );
    }, [inspections, currentUser]);

    return (
        <Card className="rounded-none border border-slate-200 shadow-sm bg-white flex flex-col h-full">
            {/* Header Laci */}
            <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">
                    Jadwal Inspeksi Aktif
                </h3>
            </div>

            {/* Flush List Container (Berbaris padat tanpa sela) */}
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                {pendingAudits.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 p-6 flex flex-col items-center justify-center gap-3">
                        <CheckCircle2 className="text-emerald-500" size={32} />
                        <div className="space-y-1">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-700">Semua Sidak Selesai</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                Penugasan inspeksi aktif telah diselesaikan!
                            </p>
                        </div>
                    </div>
                ) : (
                    pendingAudits.map((insp) => {
                        // Polimorfisme UI untuk rendering baris tugas
                        const isUnknown = insp.companyId === "COM-UNKNOWN";
                        const title = isUnknown ? "🚨 Penyelidikan Laporan Warga" : insp.companyName;
                        const displayNotes = insp.notes ? insp.notes : (isUnknown ? "Investigasi lapangan atas laporan masyarakat." : "Inspeksi kepatuhan lingkungan rutin.");

                        return (
                            <div
                                key={insp.id}
                                className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 transition-colors border-b border-slate-100 text-left last:border-b-0"
                            >
                                <div className="space-y-1 overflow-hidden">
                                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                        <Badge className="bg-blue-50 text-blue-700 border border-blue-100 rounded-none text-[8px] font-black uppercase tracking-widest shadow-none">
                                            TERJADWAL
                                        </Badge>
                                        <Badge className={cn(
                                            "rounded-none border text-[8px] font-black uppercase tracking-widest shadow-none",
                                            isUnknown
                                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        )}>
                                            {isUnknown ? "Tindak Lanjut Aduan" : "Audit Rutin DLH"}
                                        </Badge>
                                    </div>

                                    <h4 className="font-black text-slate-800 text-xs leading-none truncate max-w-[320px]">
                                        {title}
                                    </h4>

                                    <p className="text-[10px] font-semibold text-slate-600 italic line-clamp-2 mt-1 leading-snug">
                                        "{displayNotes}"
                                    </p>

                                    {/* Detail Micro (High Density) */}
                                    <div className="flex flex-col gap-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wide pt-1.5">
                                        <span className="flex items-center gap-1">
                                            <MapPin size={10} className="text-slate-400 shrink-0" />
                                            <span className="truncate max-w-[280px]">
                                                {isUnknown ? "Titik Koordinat Penyelidikan" : insp.location}
                                            </span>
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <CalendarDays size={10} className="text-slate-400 shrink-0" />
                                            <span>Rencana: {insp.date}</span>
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => onStartAudit(insp)}
                                    size="sm"
                                    className={cn(
                                        "rounded-none h-9 px-4 text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1.5 shrink-0 text-white",
                                        isUnknown ? "bg-slate-900 hover:bg-rose-600" : "bg-emerald-600 hover:bg-emerald-700"
                                    )}
                                >
                                    Eksekusi BAP <PenTool size={12} />
                                </Button>
                            </div>
                        );
                    })
                )}
            </div>
        </Card>
    );
}