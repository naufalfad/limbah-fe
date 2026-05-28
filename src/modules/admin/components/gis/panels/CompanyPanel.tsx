// src/modules/admin/components/gis/panels/CompanyPanel.tsx
import React, { useState, useMemo } from "react";
import { Search, Building2, ChevronRight, CheckCircle2, AlertTriangle, ShieldCheck, TrendingDown, Award } from "lucide-react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { useGisUIStore } from "@/store/useGisUIStore";
import { cn } from "@/lib/utils";

export default function CompanyPanel() {
    const { companies, currentUser } = useSijagaStore();
    const { openPanel, closePanelsToTheRight, setSelectedCompanyId, selectedCompanyId } = useGisUIStore();

    const [searchQuery, setSearchQuery] = useState("");

    const isAuditor = currentUser?.role === "AUDITOR";

    // Hanya tampilkan yang sudah di-approve dan memiliki koordinat
    const approvedCompanies = useMemo(() => {
        return companies.filter(c => c.status === "APPROVED");
    }, [companies]);

    // Filter Pencarian
    const filteredCompanies = useMemo(() => {
        if (!searchQuery) return approvedCompanies;
        const lowerQuery = searchQuery.toLowerCase();
        return approvedCompanies.filter(c =>
            c.companyName.toLowerCase().includes(lowerQuery) ||
            c.address.toLowerCase().includes(lowerQuery) ||
            c.docType.toLowerCase().includes(lowerQuery)
        );
    }, [searchQuery, approvedCompanies]);

    // FASE 1 ARSITEKTUR: Polimorfisme Pengurutan (Sorting)
    // Jika Auditor: Urutkan dari Skor terburuk (Kritis) ke terbaik. Yang belum diaudit ditaruh paling bawah.
    const displayList = useMemo(() => {
        if (!isAuditor) return filteredCompanies; // Admin DLH tidak diurutkan ulang

        return [...filteredCompanies].sort((a, b) => {
            const scoreA = a.score !== null && a.score !== undefined ? a.score : 999;
            const scoreB = b.score !== null && b.score !== undefined ? b.score : 999;
            return scoreA - scoreB;
        });
    }, [filteredCompanies, isAuditor]);

    // Kalkulasi Statistik Khusus Auditor (Information Expert)
    const auditorStats = useMemo(() => {
        let kritis = 0, peringatan = 0, patuh = 0, belum = 0;
        approvedCompanies.forEach(c => {
            if (c.score === null || c.score === undefined) belum++;
            else if (c.score < 60) kritis++;
            else if (c.score < 80) peringatan++;
            else patuh++;
        });
        return { kritis, peringatan, patuh, belum };
    }, [approvedCompanies]);

    const handleCompanyClick = (company: any) => {
        setSelectedCompanyId(company.id);
        closePanelsToTheRight(-1); // Bersihkan panel melayang sebelumnya
        openPanel("detil-perusahaan", `Detail Industri`, company);
    };

    const getObligationIcon = (type: string) => {
        if (type === 'AMDAL') return <AlertTriangle size={12} className="text-red-500" />;
        if (type === 'UKL-UPL' || type === 'UKL_UPL') return <ShieldCheck size={12} className="text-amber-500" />;
        return <CheckCircle2 size={12} className="text-emerald-500" />;
    };

    const getScoreBadge = (score?: number | null) => {
        if (score === null || score === undefined) {
            return <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest border border-slate-200">Belum Audit</span>;
        }
        if (score >= 80) {
            return <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest border border-emerald-200">Patuh: {score}</span>;
        }
        if (score >= 60) {
            return <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest border border-amber-200">Peringatan: {score}</span>;
        }
        return <span className="bg-rose-50 text-rose-700 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest border border-rose-200 animate-pulse">Kritis: {score}</span>;
    };

    return (
        <div className="flex flex-col h-full bg-white pb-10 font-sans">

            {/* SECTION 1: SEARCH & FILTER (Sticky Solid) */}
            <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
                <div className="relative group">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors"
                        size={14}
                    />
                    <input
                        type="text"
                        placeholder="Cari nama atau alamat pabrik..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-none py-1.5 pl-8 pr-3 text-[12px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                </div>
            </div>

            {/* SECTION 2: COMPANY FLUSH LIST */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">

                {/* HEADER POLIMORFIK: Beda Role, Beda Header */}
                {isAuditor ? (
                    <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 text-white space-y-3">
                        <div className="flex items-center gap-2">
                            <TrendingDown size={14} className="text-rose-400" />
                            <h3 className="text-[10px] font-black uppercase tracking-widest">Papan Kepatuhan (Leaderboard)</h3>
                        </div>
                        <div className="flex gap-2 text-[9px] font-bold uppercase tracking-wider text-center">
                            <div className="flex-1 bg-rose-950/50 border border-rose-500/30 p-1.5 text-rose-300">
                                {auditorStats.kritis} Kritis
                            </div>
                            <div className="flex-1 bg-amber-950/50 border border-amber-500/30 p-1.5 text-amber-300">
                                {auditorStats.peringatan} Rawan
                            </div>
                            <div className="flex-1 bg-emerald-950/50 border border-emerald-500/30 p-1.5 text-emerald-300">
                                {auditorStats.patuh} Patuh
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="px-4 py-2.5 bg-emerald-50/50 border-b border-slate-200 flex items-start gap-2.5">
                        <Building2 size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                            Katalog geospasial menampilkan {approvedCompanies.length} pelaku usaha dengan dokumen lingkungan aktif. Klik untuk melihat analisis ESG.
                        </p>
                    </div>
                )}

                {displayList.length > 0 ? (
                    displayList.map((c) => {
                        const isActive = selectedCompanyId === c.id;

                        return (
                            <button
                                key={c.id}
                                onClick={() => handleCompanyClick(c)}
                                className={cn(
                                    "group flex items-center justify-between px-4 py-3 border-b border-slate-200 hover:bg-slate-50 transition-colors text-left w-full outline-none",
                                    isActive ? "bg-emerald-50/30 border-l-[3px] border-l-emerald-600" : "bg-white border-l-[3px] border-l-transparent"
                                )}
                            >
                                <div className="flex flex-col gap-1 pr-4 min-w-0">
                                    {/* Sub-Header Polimorfik */}
                                    {isAuditor ? (
                                        <div className="flex items-center gap-2 mb-0.5">
                                            {getScoreBadge(c.score)}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            {getObligationIcon(c.docType)}
                                            <span className={cn("text-[9px] font-black uppercase tracking-widest", isActive ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-500")}>
                                                {c.docType === "UKL_UPL" ? "UKL-UPL" : c.docType}
                                            </span>
                                        </div>
                                    )}

                                    <h4 className={cn("text-[12px] leading-tight truncate", isActive ? "font-bold text-emerald-900" : "font-semibold text-slate-800")}>
                                        {c.companyName}
                                    </h4>

                                    <p className="text-[10px] text-slate-500 truncate">
                                        {c.address}
                                    </p>
                                </div>

                                <ChevronRight
                                    size={16}
                                    className={cn("shrink-0 transition-transform", isActive ? "text-emerald-600 translate-x-1" : "text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1")}
                                />
                            </button>
                        );
                    })
                ) : (
                    /* Empty State - High Density */
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 px-4">
                        <div className="w-10 h-10 rounded-none bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-200">
                            <Search size={18} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Tidak Ditemukan</p>
                            <p className="text-[10px] text-slate-500 font-medium">Perusahaan belum terdaftar / disetujui DLH.</p>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}