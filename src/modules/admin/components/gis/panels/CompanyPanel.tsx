// src/modules/admin/components/gis/panels/CompanyPanel.tsx
import React, { useState, useMemo } from "react";
import { Search, Building2, ChevronRight, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { useGisUIStore } from "@/store/useGisUIStore";

export default function CompanyPanel() {
    const { companies } = useSijagaStore();
    const { openPanel, closePanelsToTheRight, setSelectedCompanyId, selectedCompanyId } = useGisUIStore();

    const [searchQuery, setSearchQuery] = useState("");

    // Hanya tampilkan yang sudah di-approve dan memiliki koordinat
    const approvedCompanies = useMemo(() => {
        return companies.filter(c => c.status === "APPROVED");
    }, [companies]);

    const filteredCompanies = useMemo(() => {
        if (!searchQuery) return approvedCompanies;
        const lowerQuery = searchQuery.toLowerCase();
        return approvedCompanies.filter(c =>
            c.companyName.toLowerCase().includes(lowerQuery) ||
            c.address.toLowerCase().includes(lowerQuery) ||
            c.docType.toLowerCase().includes(lowerQuery)
        );
    }, [searchQuery, approvedCompanies]);

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

    return (
        <div className="flex flex-col h-full bg-white pb-10">

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
                {/* Info Header */}
                <div className="px-4 py-2.5 bg-emerald-50/50 border-b border-slate-200 flex items-start gap-2.5">
                    <Building2 size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                        Katalog geospasial menampilkan {approvedCompanies.length} pelaku usaha dengan dokumen lingkungan aktif. Klik untuk melihat analisis ESG.
                    </p>
                </div>

                {filteredCompanies.length > 0 ? (
                    filteredCompanies.map((c) => {
                        const isActive = selectedCompanyId === c.id;

                        return (
                            <button
                                key={c.id}
                                onClick={() => handleCompanyClick(c)}
                                className={`group flex items-center justify-between px-4 py-3 border-b border-slate-200 hover:bg-slate-50 transition-colors text-left w-full ${isActive ? "bg-emerald-50/30" : "bg-white"}`}
                            >
                                <div className="flex flex-col gap-1 pr-4">
                                    <div className="flex items-center gap-1.5">
                                        {getObligationIcon(c.docType)}
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-500"}`}>
                                            {c.docType === "UKL_UPL" ? "UKL-UPL" : c.docType}
                                        </span>
                                    </div>

                                    <h4 className={`text-[12px] leading-tight ${isActive ? "font-bold text-emerald-900" : "font-semibold text-slate-800"}`}>
                                        {c.companyName}
                                    </h4>

                                    <p className="text-[10px] text-slate-500 truncate max-w-[200px]">
                                        {c.address}
                                    </p>
                                </div>

                                <ChevronRight
                                    size={16}
                                    className={`shrink-0 transition-transform ${isActive ? "text-emerald-600 translate-x-1" : "text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1"}`}
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