// src/modules/dashboard/components/auditor/PerformanceTab.tsx
import React, { useMemo } from "react";
import { useSijagaStore } from "@/store/useSijagaStore";
import AuditorStatCard from "./AuditorStatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle2, ShieldAlert, Award } from "lucide-react";

export default function PerformanceTab() {
    // Membaca data agregat kinerja operasional dari Zustand Store (Fase 3 & 4)
    const { performanceAnalytics, companies } = useSijagaStore();

    // Safeguard jika data analitik kinerja sedang dimuat oleh Parent Container
    if (!performanceAnalytics) {
        return (
            <div className="p-8 text-center text-slate-500 font-bold text-xs uppercase tracking-widest animate-pulse">
                Menghubungkan ke sistem kinerja operasional...
            </div>
        );
    }

    // Mengambil nilai agregat kinerja dari state eksekutif
    const {
        pendingApprovals,
        completedInspections,
        overdueInspections,
        recentInspections,
        documentComposition
    } = performanceAnalytics;

    // Kalkulasi Persentase Progress Bar berdasarkan data riil (Information Expert)
    const approvedCount = useMemo(() => {
        return companies.filter(c => c.status === "APPROVED").length;
    }, [companies]);

    const totalCompanies = companies.length || 1; // Mencegah division-by-zero error

    const approvedPercentage = Math.round((approvedCount / totalCompanies) * 100);
    const pendingPercentage = Math.round((pendingApprovals / totalCompanies) * 100);

    return (
        <div className="space-y-4 animate-in fade-in duration-300 text-left">

            {/* 1. DLH KPIs Stat Cards (Metrik Dinamis Kinerja Sektoral) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AuditorStatCard
                    label="Dokumen Diajukan"
                    value={`${pendingApprovals} Antrean`}
                    sub="Tinjau Validasi DLH"
                    icon={<FileText />}
                    color="amber"
                />
                <AuditorStatCard
                    label="Inspeksi Lapangan"
                    value={`${completedInspections} Selesai`}
                    sub="Patroli Bidang Pengawasan"
                    icon={<CheckCircle2 />}
                    color="emerald"
                />
                <AuditorStatCard
                    label="Sidak Jatuh Tempo"
                    value={`${overdueInspections} Lokasi`}
                    sub="Sidak Lewat 30 Hari (WARNING)"
                    icon={<ShieldAlert />}
                    color="red"
                    trend={overdueInspections > 0 ? "Perlu Tindakan" : "Aman"}
                />
            </div>

            {/* 2. Historical & Progress Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans">

                {/* Log Kunjungan Inspeksi Lapangan (Gaya Flush List Berbasis Database API) */}
                <div className="lg:col-span-6 border border-slate-200 bg-white">
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="font-bold text-xs uppercase tracking-widest text-slate-800">Log Kunjungan Inspeksi Lapangan</h3>
                    </div>
                    <div className="flex flex-col divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar text-left">
                        {recentInspections.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 font-bold text-xs uppercase">
                                Belum ada riwayat inspeksi fisik.
                            </div>
                        ) : (
                            recentInspections.map((insp) => (
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
                            ))
                        )}
                    </div>
                </div>

                {/* Status Registrasi Progress Tracker (Dinamis Siku Kaku) */}
                <div className="lg:col-span-6 border border-slate-200 bg-white p-4 space-y-6 flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="border-b pb-3">
                            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-800">Status Registrasi Dokumen Pelaku Usaha</h3>
                        </div>
                        <div className="space-y-4">
                            {/* Progress: Approved */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                                    <span className="uppercase tracking-widest text-[9px] font-black text-slate-500">Dokumen Disetujui (Approved)</span>
                                    <span className="font-mono">{approvedCount} / {companies.length} ({approvedPercentage}%)</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-none overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-none" style={{ width: `${approvedPercentage}%` }} />
                                </div>
                            </div>

                            {/* Progress: Pending / Review */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                                    <span className="uppercase tracking-widest text-[9px] font-black text-slate-500">Dalam Proses Penelaahan (Review/Pending)</span>
                                    <span className="font-mono">{pendingApprovals} / {companies.length} ({pendingPercentage}%)</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-none overflow-hidden">
                                    <div className="bg-amber-500 h-full rounded-none" style={{ width: `${pendingPercentage}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Baru: Komposisi Dokumen Terbit Riil dari Database */}
                    <div className="grid grid-cols-2 gap-4 border-t pt-4 border-slate-100">
                        <div className="bg-slate-50 p-3.5 text-left rounded-none border">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Total SPPL Terbit</p>
                            <p className="text-base font-black text-slate-800 font-mono mt-2 leading-none">
                                {documentComposition.sppl} <span className="text-[9px] font-bold text-slate-400">Berkas</span>
                            </p>
                        </div>
                        <div className="bg-slate-50 p-3.5 text-left rounded-none border">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Total UKL-UPL Terbit</p>
                            <p className="text-base font-black text-slate-800 font-mono mt-2 leading-none">
                                {documentComposition.uklUpl} <span className="text-[9px] font-bold text-slate-400">Berkas</span>
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}