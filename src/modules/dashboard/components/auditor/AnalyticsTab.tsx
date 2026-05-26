// src/modules/dashboard/components/auditor/AnalyticsTab.tsx
import React, { useMemo } from "react";
import { useSijagaStore } from "@/store/useSijagaStore";
import AuditorStatCard from "./AuditorStatCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { Award, Leaf, TrendingUp, DollarSign } from "lucide-react";

export default function AnalyticsTab() {
    // Membaca data agregat dinamis dari Zustand Store (Fase 3 & 4)
    const { executiveAnalytics, companies, wasteLogs } = useSijagaStore();

    // Safeguard jika data analitik sedang dimuat oleh Parent Container
    if (!executiveAnalytics) {
        return (
            <div className="p-8 text-center text-slate-500 font-bold text-xs uppercase tracking-widest animate-pulse">
                Menghubungkan ke pusat data eksekutif...
            </div>
        );
    }

    // Mengambil nilai agregasi database dari state eksekutif
    const {
        totalCompanies,
        averageEsg,
        esgDelta,
        totalWasteB3,
        totalRevenue
    } = executiveAnalytics;

    // 1. Pemetaan Skor ESG untuk Bar Chart (APPROVED Companies)
    const barData = useMemo(() => {
        return companies
            .filter(c => c.status === "APPROVED")
            .map(c => ({
                name: c.companyName.split(". ").pop()?.substring(0, 8) || c.companyName,
                "Skor ESG": c.score || 0
            }));
    }, [companies]);

    // 2. Kalkulasi Dinamis Pie Chart berdasarkan Komposisi Limbah Riil (Information Expert)
    const wastePieData = useMemo(() => {
        const groups: Record<string, number> = {};

        // Kelompokkan dan akumulasikan volume berdasarkan jenis limbah logbook
        wasteLogs.forEach(log => {
            const type = log.type || "Lainnya";
            groups[type] = (groups[type] || 0) + log.volume;
        });

        const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];
        return Object.keys(groups).map((key, i) => ({
            name: key,
            value: groups[key],
            color: colors[i % colors.length]
        }));
    }, [wasteLogs]);

    const totalWasteVolumeSum = useMemo(() => {
        return wastePieData.reduce((sum, item) => sum + item.value, 0);
    }, [wastePieData]);

    // 3. Urutkan Perusahaan Berdasarkan Skor ESG Tertinggi (Dynamic Ranking Table)
    const rankedCompanies = useMemo(() => {
        return [...companies]
            .filter(c => c.status === "APPROVED")
            .sort((a, b) => (b.score || 0) - (a.score || 0));
    }, [companies]);

    const getScoreBadge = (score?: number) => {
        if (!score) return <Badge className="bg-slate-50 text-slate-500 border border-slate-200 rounded-none text-[8px] font-black uppercase tracking-widest">Belum Audit</Badge>;
        if (score >= 80) return <Badge className="bg-emerald-50 text-emerald-700 border-none rounded-none text-[8px] font-black uppercase tracking-widest">Excellent ({score})</Badge>;
        if (score >= 60) return <Badge className="bg-amber-50 text-amber-700 border-none rounded-none text-[8px] font-black uppercase tracking-widest">Fair ({score})</Badge>;
        return <Badge className="bg-red-50 text-red-700 border-none rounded-none text-[8px] font-black uppercase tracking-widest">Critical ({score})</Badge>;
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-300 text-left">

            {/* 1. Stats Cards Grid (Koneksi Agregat Database & Trend Indicators) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <AuditorStatCard
                    label="Indeks Kepatuhan"
                    value={`${averageEsg}/100`}
                    trend={esgDelta >= 0 ? `+${esgDelta}% MoM` : `${esgDelta}% MoM`}
                    color={esgDelta >= 0 ? "emerald" : "red"}
                    icon={<Award />}
                />
                <AuditorStatCard
                    label="Total Usaha Terdaftar"
                    value={totalCompanies.toString()}
                    sub="Status APPROVED aktif"
                    icon={<Leaf />}
                    color="blue"
                />
                <AuditorStatCard
                    label="Akumulasi Limbah B3"
                    value={`${totalWasteB3.toLocaleString()} L/kg`}
                    sub="Volume Total Terangkut"
                    icon={<TrendingUp />}
                    color="red"
                />
                <AuditorStatCard
                    label="Retribusi Terkumpul"
                    value={`Rp ${totalRevenue.toLocaleString()}`}
                    sub="Kas Umum Daerah (RKUD)"
                    icon={<DollarSign />}
                    color="amber"
                />
            </div>

            {/* 2. Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                {/* ESG Bar Chart */}
                <Card className="lg:col-span-8 rounded-none border border-slate-200 shadow-sm bg-white p-4">
                    <div className="border-b pb-3 mb-4">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">Skor Kepatuhan ESG Perusahaan</h3>
                    </div>
                    <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                                <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                                <Tooltip cursor={{ fill: "#f8fafc" }} />
                                <Bar dataKey="Skor ESG" fill="#059669" radius={[0, 0, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Waste Pie Chart (Dinamis Berbasis Logbook) */}
                <Card className="lg:col-span-4 rounded-none border border-slate-200 shadow-sm bg-white p-4 flex flex-col justify-between">
                    <div className="border-b pb-3 mb-2">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">Komposisi Volume Limbah</h3>
                    </div>
                    <div className="h-[160px] w-full flex items-center justify-center relative">
                        {wastePieData.length === 0 ? (
                            <div className="text-slate-400 text-xs font-bold uppercase">Nihil Laporan</div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={wastePieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {wastePieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase">Total</span>
                                    <span className="text-sm font-black text-slate-800 font-mono leading-none mt-1">
                                        {totalWasteVolumeSum.toLocaleString()} L
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="space-y-1.5 mt-2 font-sans border-t pt-3 border-slate-100 max-h-[120px] overflow-y-auto custom-scrollbar">
                        {wastePieData.map((d, i) => (
                            <div key={i} className="flex justify-between items-center text-[10px] font-bold">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-none shrink-0" style={{ backgroundColor: d.color }} />
                                    <span className="text-slate-500 uppercase tracking-tight">{d.name}</span>
                                </div>
                                <span className="text-slate-850 font-black">{d.value.toLocaleString()} L/kg</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* 3. Industry Compliance Ranking Table (Dinamis & Terurut) */}
            <div className="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-slate-50/50">
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">Peringkat Kepatuhan ESG Industri</h3>
                </div>

                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow className="border-b border-slate-200 h-10">
                            <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest pl-4">Perusahaan</TableHead>
                            <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Bidang Usaha (KBLI)</TableHead>
                            <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center">Wajib Dokumen</TableHead>
                            <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center">Status</TableHead>
                            <TableHead className="text-right font-black text-slate-500 uppercase text-[9px] tracking-widest pr-4">Kategori Kepatuhan</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rankedCompanies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-slate-400 font-bold">
                                    Belum ada industri terdaftar.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rankedCompanies.map((c) => (
                                <TableRow key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors h-14">
                                    <TableCell className="pl-4">
                                        <div className="flex flex-col text-left">
                                            <span className="font-bold text-slate-900 text-xs">{c.companyName}</span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{c.address}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-slate-600 text-xs">{c.kbli || "N/A"}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge className="bg-slate-100 text-slate-600 rounded-none border-none font-bold text-[9px] tracking-widest">
                                            {c.docType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${c.status === "APPROVED" ? "text-emerald-600" : "text-amber-500"}`}>
                                            {c.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right pr-4">
                                        {getScoreBadge(c.score)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}