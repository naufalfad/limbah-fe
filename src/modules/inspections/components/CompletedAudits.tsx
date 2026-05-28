// src/modules/inspections/components/CompletedAudits.tsx
import React, { useMemo } from "react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle2, Gavel } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CompletedAudits - Riwayat Laporan BAP (GFW Paradigm)
 * Menggunakan arsitektur Flush List yang rapat (py-2.5) dan bersudut tajam.
 * Membuang card-in-card pattern untuk memaksimalkan visual data di satu layar.
 */
export default function CompletedAudits() {
    const { currentUser, inspections } = useSijagaStore();

    // 1. Memfilter laporan BAP yang "Selesai" secara presisi & mengurutkan dari yang terbaru
    const completedAudits = useMemo(() => {
        const userId = currentUser?.id;
        const officerId = currentUser?.officerId;

        return inspections
            .filter((i) => (i.inspectorId === userId || i.inspectorId === officerId) && i.status === "Selesai")
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [inspections, currentUser]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-emerald-600 font-black";
        if (score >= 60) return "text-amber-500 font-black";
        return "text-rose-600 font-black";
    };

    return (
        <Card className="rounded-none border border-slate-200 shadow-sm bg-white flex flex-col h-full">
            {/* Header Laci */}
            <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">
                    Riwayat Laporan BAP
                </h3>
            </div>

            {/* Flush List Container */}
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                {completedAudits.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 p-6 flex flex-col items-center justify-center gap-3">
                        <FileText className="text-slate-200" size={32} />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Belum Ada Riwayat Laporan BAP
                        </p>
                    </div>
                ) : (
                    completedAudits.map((insp) => {
                        // FASE 4: UI Polymorphism (Membedakan tampilan BAP berskor dan BAP Penindakan tanpa skor)
                        const isInvestigation = insp.score === null;

                        return (
                            <div
                                key={insp.id}
                                className="px-4 py-3 flex justify-between items-center text-left hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-b-0"
                            >
                                <div className="space-y-1.5 overflow-hidden pr-2">
                                    {/* Indikator Tipe BAP */}
                                    <Badge className={cn(
                                        "rounded-none border text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 shadow-none",
                                        isInvestigation ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    )}>
                                        {isInvestigation ? "Penindakan Aduan" : "Audit Rutin DLH"}
                                    </Badge>

                                    {/* Nama Industri / Target Sasaran */}
                                    <h4 className="font-black text-slate-800 text-xs leading-none truncate max-w-[180px]">
                                        {insp.companyName}
                                    </h4>

                                    {/* Tanggal Eksekusi BAP */}
                                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">
                                        Dieksekusi: {insp.date}
                                    </p>
                                </div>

                                {/* Score / Status Display (Polymorphic) */}
                                <div className="text-right shrink-0 pl-2">
                                    {isInvestigation ? (
                                        <div className="flex flex-col items-end justify-center h-full space-y-1">
                                            <div className="flex items-center gap-1 text-slate-700">
                                                <Gavel size={12} />
                                                <span className="text-xs font-black uppercase tracking-wider">Selesai</span>
                                            </div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                STATUS KASUS
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-end justify-center h-full space-y-1">
                                            <span className={`text-sm font-black leading-none ${getScoreColor(insp.score || 0)}`}>
                                                {insp.score}/100
                                            </span>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                SCORE ESG
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </Card>
    );
}