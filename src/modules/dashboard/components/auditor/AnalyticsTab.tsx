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
    const { companies, wasteLogs, invoices } = useSijagaStore();

    const totalCompanies = companies.length;

    const complianceCompanies = useMemo(() => {
        return companies.filter(c => c.score !== undefined && c.score !== null);
    }, [companies]);

    const avgCompliance = useMemo(() => {
        return complianceCompanies.length > 0
            ? Math.round(complianceCompanies.reduce((acc, curr) => acc + (curr.score || 0), 0) / complianceCompanies.length)
            : 78;
    }, [complianceCompanies]);

    const totalWasteB3 = useMemo(() => {
        return wasteLogs
            .filter(w => w.type.toLowerCase().includes("b3") || w.type.toLowerCase().includes("oli"))
            .reduce((acc, curr) => acc + curr.volume, 0);
    }, [wasteLogs]);

    const totalRevenue = useMemo(() => {
        return invoices
            .filter(i => i.status === "SETTLED")
            .reduce((acc, curr) => acc + curr.amount, 0);
    }, [invoices]);

    const barData = useMemo(() => {
        return companies.map(c => ({
            name: c.companyName.split(". ").pop()?.substring(0, 8) || c.companyName,
            "Skor ESG": c.score || 0
        }));
    }, [companies]);

    const wasteData = [
        { name: "Oli Bekas", value: 90, color: "#ef4444" },
        { name: "Cair Kimia", value: 120, color: "#f59e0b" },
        { name: "Minyak Jelantah", value: 15, color: "#10b981" },
        { name: "Padat B3", value: 85, color: "#3b82f6" }
    ];

    const getScoreBadge = (score?: number) => {
        if (!score) return <Badge className="bg-slate-50 text-slate-500 border border-slate-200 rounded-none text-[8px] font-black uppercase tracking-widest">Belum Audit</Badge>;
        if (score >= 80) return <Badge className="bg-emerald-50 text-emerald-700 border-none rounded-none text-[8px] font-black uppercase tracking-widest">Excellent ({score})</Badge>;
        if (score >= 60) return <Badge className="bg-amber-50 text-amber-700 border-none rounded-none text-[8px] font-black uppercase tracking-widest">Fair ({score})</Badge>;
        return <Badge className="bg-red-50 text-red-700 border-none rounded-none text-[8px] font-black uppercase tracking-widest">Critical ({score})</Badge>;
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-300">

            {/* 1. Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <AuditorStatCard label="Indeks Kepatuhan" value={`${avgCompliance}/100`} sub="Rata-rata Daerah" icon={<Award />} color="emerald" />
                <AuditorStatCard label="Total Usaha Terdaftar" value={totalCompanies.toString()} sub="SPPL & UKL-UPL" icon={<Leaf />} color="blue" />
                <AuditorStatCard label="Akumulasi Limbah B3" value={`${totalWasteB3} L`} sub="Volume Terangkut" icon={<TrendingUp />} color="red" />
                <AuditorStatCard label="Retribusi Terkumpul" value={`Rp ${totalRevenue.toLocaleString()}`} sub="PAD Lingkungan Hidup" icon={<DollarSign />} color="amber" />
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

                {/* Waste Pie Chart */}
                <Card className="lg:col-span-4 rounded-none border border-slate-200 shadow-sm bg-white p-4 flex flex-col justify-between">
                    <div className="border-b pb-3 mb-2">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">Komposisi Volume Limbah</h3>
                    </div>
                    <div className="h-[160px] w-full flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={wasteData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {wasteData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase">Volume</span>
                            <span className="text-base font-black text-slate-800">310 L</span>
                        </div>
                    </div>
                    <div className="space-y-1.5 mt-2 font-sans border-t pt-3 border-slate-100">
                        {wasteData.map((d, i) => (
                            <div key={i} className="flex justify-between items-center text-[10px] font-bold">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-none shrink-0" style={{ backgroundColor: d.color }} />
                                    <span className="text-slate-500 uppercase tracking-tight">{d.name}</span>
                                </div>
                                <span className="text-slate-850 font-black">{d.value} L</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* 3. Industry Compliance Ranking Table */}
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
                        {companies.map((c) => (
                            <TableRow key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors h-14">
                                <TableCell className="pl-4">
                                    <div className="flex flex-col text-left">
                                        <span className="font-bold text-slate-900 text-xs">{c.companyName}</span>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{c.address}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-bold text-slate-600 text-xs">{c.kbli || "KBLI Default"}</TableCell>
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
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}