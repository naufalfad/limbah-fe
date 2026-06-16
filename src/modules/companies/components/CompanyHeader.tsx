// src/modules/companies/components/CompanyHeader.tsx
import React, { useMemo } from "react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { useNavigate } from "react-router-dom";
import { Building2, MapPin, Plus, Factory, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CompanyHeader() {
    const navigate = useNavigate();
    const {
        currentUser,
        companies,
        selectedCompanyId,
        setSelectedCompanyId,
    } = useSijagaStore();

    // Evaluasi perusahaan aktif secara aman (Information Expert)
    const activeCompany = useMemo(() => {
        return (
            companies.find((c) => c.id === selectedCompanyId) ||
            companies[0] ||
            null
        );
    }, [companies, selectedCompanyId]);

    if (!activeCompany) return null;

    // Pemetaan warna taktis GFW berdasarkan status verifikasi DLH daerah
    const getStatusStyles = (status: string) => {
        switch (status) {
            case "APPROVED":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "REVIEW":
                return "bg-amber-50 text-amber-700 border-amber-200 animate-pulse";
            case "REJECTED":
                return "bg-rose-50 text-rose-700 border-rose-200";
            default: // PENDING
                return "bg-blue-50 text-blue-700 border-blue-200";
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-none p-4 md:p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 select-none text-left">

            {/* SISI KIRI: Nama Perusahaan Prominen & Pengontrol Selektor */}
            <div className="flex items-start gap-4 flex-1 w-full min-w-0">
                <div className="w-12 h-12 bg-slate-900 border border-slate-800 text-emerald-500 rounded-none flex items-center justify-center shrink-0 shadow-inner">
                    <Building2 size={24} />
                </div>

                <div className="space-y-2 flex-1 min-w-0">
                    <div className="space-y-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none block">
                            ACTIVE COMPANY ENTITY
                        </span>
                        {/* Nama Perusahaan Utama: Bebas melipat rapi jika panjang, tebal, dan tegas */}
                        <h1
                            className="text-base md:text-lg font-black tracking-tight text-slate-900 leading-snug uppercase max-w-xl whitespace-normal break-words"
                            title={activeCompany.companyName}
                        >
                            {activeCompany.companyName}
                        </h1>
                    </div>

                    {/* Baris Kontrol: Dropdown Selektor Kompak & Tombol Tambah */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full max-w-md pt-1">
                        <div className="relative inline-block flex-1 min-w-[180px] max-w-[260px]">
                            <select
                                value={selectedCompanyId || ""}
                                title="Klik untuk beralih entitas badan usaha"
                                onChange={(e) => {
                                    if (e.target.value === "ADD_NEW") {
                                        navigate("/company/register");
                                    } else {
                                        setSelectedCompanyId(e.target.value || null);
                                    }
                                }}
                                className="w-full h-8 bg-slate-50 border border-slate-300 rounded-none text-[10px] font-black uppercase tracking-wider text-slate-700 pl-3 pr-8 focus:outline-none focus:border-emerald-600 focus:ring-0 cursor-pointer appearance-none truncate"
                            >
                                {companies.map((c) => (
                                    <option key={c.id} value={c.id} className="font-bold">
                                        {c.companyName}
                                    </option>
                                ))}
                                <option value="ADD_NEW" className="text-emerald-600 font-bold">
                                    + REGISTRASI BADAN USAHA BARU
                                </option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 border-l border-slate-300 bg-slate-100">
                                <ChevronDown size={12} />
                            </div>
                        </div>

                        <Button
                            onClick={() => navigate("/company/register")}
                            size="sm"
                            className="bg-slate-900 hover:bg-emerald-600 text-white font-black text-[9px] h-8 rounded-none shadow-none uppercase tracking-widest shrink-0 gap-1"
                        >
                            <Plus size={11} /> Tambah Baru
                        </Button>
                    </div>

                    {/* Lokasi Alamat Perusahaan */}
                    <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider pt-1">
                        <MapPin size={11} className="text-slate-400 shrink-0" />
                        <span className="truncate max-w-md" title={activeCompany.address}>{activeCompany.address}</span>
                    </div>
                </div>
            </div>

            {/* SISI KANAN: Metadata Status & Taktis Badge */}
            <div className="flex items-center gap-1.5 flex-wrap shrink-0 w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">

                {/* NIB Block */}
                <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-none flex flex-col justify-center h-10">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        NIB NUMBER
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-800 tracking-tight mt-1 leading-none">
                        {activeCompany.nib}
                    </span>
                </div>

                {/* KBLI Block */}
                <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-none flex flex-col justify-center h-10">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        KBLI CODE
                    </span>
                    <span className="text-xs font-bold text-slate-800 tracking-tight mt-1 leading-none flex items-center gap-1">
                        <Factory size={10} className="text-slate-400" /> {activeCompany.kbli || "N/A"}
                    </span>
                </div>

                {/* Kewajiban Block */}
                <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-none flex flex-col justify-center h-10">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        ENVIRONMENT OBLIGATION
                    </span>
                    <span className="text-xs font-black text-emerald-700 tracking-tight mt-1 leading-none">
                        {activeCompany.docType}
                    </span>
                </div>

                {/* Status Badge */}
                <div className={`border px-3.5 h-10 rounded-none flex flex-col justify-center ${getStatusStyles(activeCompany.status)}`}>
                    <span className="text-[8px] font-black opacity-60 uppercase tracking-widest leading-none">
                        DLH VERIFICATION
                    </span>
                    <span className="text-[10px] font-black tracking-widest mt-1 leading-none">
                        {activeCompany.status}
                    </span>
                </div>

            </div>

        </div>
    );
}