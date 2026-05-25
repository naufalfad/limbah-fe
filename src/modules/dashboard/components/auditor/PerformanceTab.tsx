// src/modules/dashboard/components/auditor/PerformanceTab.tsx
import React, { useMemo } from "react";
import { useSijagaStore } from "@/store/useSijagaStore";
import AuditorStatCard from "./AuditorStatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle2, TrendingUp } from "lucide-react";

export default function PerformanceTab() {
    const { companies, inspections } = useSijagaStore();

    const pendingApprovals = useMemo(() => {
        return companies.filter(c => c.status === "PENDING" || c.status === "REVIEW").length;
    }, [companies]);

    const completedInspections = useMemo(() => {
        return inspections.filter(i => i.status === "Selesai").length;
    }, [inspections]);

    return (
        <div className="space-y-4 animate-in fade-in duration-300">

            {/* 1. DLH KPIs Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AuditorStatCard label="Dokumen Diajukan" value={`${pendingApprovals} Antrean`} sub="Tinjau Validasi DLH" icon={<FileText />} color="amber" />
                <AuditorStatCard label="Inspeksi Lapangan" value={`${completedInspections} Selesai`} sub="Patroli Bidang Pengawasan" icon={<CheckCircle2 />} color="emerald" />
                <AuditorStatCard label="Response Time Rerata" value="1.8 Hari" sub="Durasi Verifikasi Berkas" icon={<TrendingUp />} color="blue" />
            </div>

            {/* 2. Historical & Progress Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans">

                {/* Log Kunjungan Inspeksi Lapangan (Gaya Flush List) */}
                <Card className="lg:col-span-6 rounded-none border border-slate-200 shadow-sm bg-white">
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="font-bold text-xs uppercase tracking-widest text-slate-800">Log Kunjungan Inspeksi Lapangan</h3>
                    </div>
                    <div className="flex flex-col divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar text-left">
                        {inspections.map((insp) => (
                            <div key={insp.id} className="p-3.5 space-y-1 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                                    <span>{insp.date} — {insp.id}</span>
                                    <Badge className={`border-none rounded-none text-[8px] font-black ${insp.status === "Selesai" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                                        {insp.status}
                                    </Badge>
                                </div>
                                <h4 className="font-black text-slate-800 text-xs leading-none">{insp.companyName}</h4>
                                <p className="text-[10px] text-slate-500 font-medium">Petugas Lapangan: {insp.inspectorName}</p>
                                {insp.notes && <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest mt-0.5">Hasil: "{insp.notes}"</p>}
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Status Registrasi Progress Tracker (Kotak Tanpa rounded) */}
                <Card className="lg:col-span-6 rounded-none border border-slate-200 shadow-sm bg-white p-4 space-y-6">
                    <div className="border-b pb-3">
                        <h3 className="font-bold text-xs uppercase tracking-widest text-slate-800">Status Registrasi Dokumen Pelaku Usaha</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[11px] font-bold text-slate-600">
                                <span className="uppercase tracking-widest text-[9px] font-black text-slate-500">Dokumen Disetujui (Approved)</span>
                                <span className="font-mono">{companies.filter(c => c.status === "APPROVED").length} / {companies.length}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-none overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-none" style={{ width: `${(companies.filter(c => c.status === "APPROVED").length / companies.length) * 100}%` }} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-[11px] font-bold text-slate-600">
                                <span className="uppercase tracking-widest text-[9px] font-black text-slate-500">Dalam Proses Penelaahan (Review/Pending)</span>
                                <span className="font-mono">{pendingApprovals} / {companies.length}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-none overflow-hidden">
                                <div className="bg-amber-500 h-full rounded-none" style={{ width: `${(pendingApprovals / companies.length) * 100}%` }} />
                            </div>
                        </div>
                    </div>
                </Card>

            </div>
        </div>
    );
}