// src/modules/inspections/components/CompletedAudits.tsx
import React, { useMemo } from "react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

/**
 * CompletedAudits - Riwayat Laporan BAP (GFW Paradigm)
 * Menggunakan arsitektur Flush List yang rapat (py-2.5) dan bersudut tajam.
 * Membuang card-in-card pattern untuk memaksimalkan visual data di satu layar.
 */
export default function CompletedAudits() {
    const { currentUser, inspections } = useSijagaStore();

    // Memfilter laporan BAP yang "Selesai" untuk petugas yang login
    const completedAudits = useMemo(() => {
        const officerId = currentUser?.officerId || "OFF-001";
        return inspections.filter(
            (i) => i.inspectorId === officerId && i.status === "Selesai"
        );
    }, [inspections, currentUser]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-emerald-600 font-black";
        if (score >= 60) return "text-amber-500 font-black";
        return "text-red-500 font-black";
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
            <div className="flex-1 flex flex-col divide-y divide-slate-150 overflow-y-auto custom-scrollbar">
                {completedAudits.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 p-6 flex flex-col items-center justify-center gap-3">
                        <FileText className="text-slate-200" size={32} />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Belum Ada Riwayat Laporan BAP
                        </p>
                    </div>
                ) : (
                    completedAudits.map((insp) => (
                        <div
                            key={insp.id}
                            className="px-4 py-2.5 flex justify-between items-center text-left hover:bg-slate-50/50 transition-colors"
                        >
                            <div className="space-y-0.5 overflow-hidden">
                                {/* ID Laporan */}
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none block">
                                    {insp.id}
                                </span>
                                {/* Nama Industri */}
                                <h4 className="font-black text-slate-800 text-xs leading-none truncate max-w-[180px]">
                                    {insp.companyName}
                                </h4>
                                {/* Inspektur */}
                                <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">
                                    Inspektur: {insp.inspectorName}
                                </p>
                            </div>

                            {/* Score Display */}
                            <div className="text-right shrink-0 pl-2">
                                <span className={`text-sm font-black ${getScoreColor(insp.score || 0)}`}>
                                    {insp.score}/100
                                </span>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                                    SCORE ESG
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}