// src/modules/admin/components/gis/panels/CompanyPanel.tsx
import React, { useState, useMemo } from "react";
import { Search, Building2, ChevronRight, TrendingDown } from "lucide-react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { useGisUIStore } from "@/store/useGisUIStore";
import { cn } from "@/lib/utils";

// @ts-ignore - Bypass bundler mapping untuk Turf di TypeScript modern [3]
import * as turf from '@turf/turf';
import kecData from "@/assets/geojson/kotim-kecamatan.json";

export default function CompanyPanel() {
    const { companies, currentUser } = useSijagaStore();
    const {
        openPanel,
        closePanelsToTheRight,
        setSelectedCompanyId,
        selectedCompanyId,
        activeLayers // INJEKSI: Mengambil state layer aktif untuk orkestrasi laci konteks
    } = useGisUIStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDocType, setSelectedDocType] = useState<string>("ALL");
    const [selectedSubdistrict, setSelectedSubdistrict] = useState<string>("ALL");

    const isAuditor = currentUser?.role === "AUDITOR";

    // Hanya tampilkan yang sudah di-approve dan memiliki koordinat
    const approvedCompanies = useMemo(() => {
        return companies.filter(c => c.status === "APPROVED");
    }, [companies]);

    // =========================================================================
    // LOGIKA SPATIAL JOIN: MEMETAKAN PERUSAHAAN KE WILAYAH KECAMATAN (Turf.js PIP)
    // Dihitung 1 kali di memori (useMemo) untuk efisiensi performa browser O(1)
    // =========================================================================
    const companyKecMap = useMemo(() => {
        const mapping: Record<string, string> = {};
        // Melakukan penanganan as any untuk menghindari strict json module type check di Vite
        if (!kecData || !(kecData as any).features || approvedCompanies.length === 0) return mapping;

        approvedCompanies.forEach((company) => {
            const lat = parseFloat(company.lat);
            const lng = parseFloat(company.lng);
            if (isNaN(lat) || isNaN(lng)) return;

            const pt = turf.point([lng, lat]);
            const match = (kecData as any).features.find((feature: any) => {
                try {
                    return turf.booleanPointInPolygon(pt, feature);
                } catch (e) {
                    return false;
                }
            });

            if (match && match.properties?.WADMKC) {
                // Konversi nama kecamatan ke huruf biasa (Sentence Case) demi estetika
                const rawName = match.properties.WADMKC.trim();
                mapping[company.id] = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
            } else {
                mapping[company.id] = "Luar Wilayah";
            }
        });
        return mapping;
    }, [approvedCompanies]);

    // Mengambil daftar unik wilayah kecamatan aktif yang memiliki industri
    const subdistricts = useMemo(() => {
        const list = Object.values(companyKecMap);
        return Array.from(new Set(list)).sort() as string[];
    }, [companyKecMap]);

    // Filter Gabungan: Pencarian Teks + Jenis Izin Sektoral + Batas Wilayah Spasial
    const filteredCompanies = useMemo(() => {
        return approvedCompanies.filter((c) => {
            // 1. Filter Kueri Teks
            const matchesSearch = searchQuery
                ? c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.address.toLowerCase().includes(searchQuery.toLowerCase())
                : true;

            // 2. Filter Jenis Izin Dokumen Lingkungan
            const normalizedDoc = c.docType === "UKL_UPL" ? "UKL-UPL" : c.docType;
            const matchesDocType = selectedDocType === "ALL" || normalizedDoc === selectedDocType;

            // 3. Filter Wilayah Kecamatan (PIP Spasial)
            const companyKec = companyKecMap[c.id] || "Luar Wilayah";
            const matchesSubdistrict = selectedSubdistrict === "ALL" || companyKec === selectedSubdistrict;

            return matchesSearch && matchesDocType && matchesSubdistrict;
        });
    }, [approvedCompanies, searchQuery, selectedDocType, selectedSubdistrict, companyKecMap]);

    // FASE 1 ARSITEKTUR: Polimorfisme Pengurutan (Sorting)
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

    // 2. Click Handler (Trigger Laci Konteks GFW)
    const handleCompanyClick = (company: any) => {
        setSelectedCompanyId(company.id);

        // Memutus rantai laci melayang sebelumnya (Zero-Gap Stack Policy)
        closePanelsToTheRight(-1);

        // Selalu buka laci data dasar administrasi
        openPanel("detil-perusahaan", `Detail Industri`, company);

        // [CONTEXT-AWARE PANEL ORCHESTRATION]:
        // Hanya buka laci telemetri udara jika layer kualitas udara (layer-aqi) sedang aktif dicentang!
        if (activeLayers.includes("layer-aqi")) {
            openPanel("telemetri-lingkungan", `Telemetri Spasial`, company);
        }

        const lat = parseFloat(company.lat);
        const lng = parseFloat(company.lng);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0) {
            window.dispatchEvent(
                new CustomEvent("map-fly-to-coords", {
                    detail: { lat, lng }
                })
            );
        }
    };

    const getObligationBadge = (type: string) => {
        const norm = type === "UKL_UPL" ? "UKL-UPL" : type;
        if (norm === 'AMDAL') return <span className="text-[9px] font-normal text-rose-700 bg-rose-50/50 px-1.5 py-0.5 border border-rose-100">Amdal</span>;
        if (norm === 'UKL-UPL') return <span className="text-[9px] font-normal text-amber-700 bg-amber-50/50 px-1.5 py-0.5 border border-amber-100">Ukl-upl</span>;
        return <span className="text-[9px] font-normal text-emerald-700 bg-emerald-50/50 px-1.5 py-0.5 border border-emerald-100">Sppl</span>;
    };

    const getScoreBadge = (score?: number | null) => {
        if (score === null || score === undefined) {
            return <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 text-[9px] font-normal border border-slate-200">Belum audit</span>;
        }
        if (score >= 80) {
            return <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 text-[9px] font-normal border border-emerald-200">Patuh: {score}</span>;
        }
        if (score >= 60) {
            return <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 text-[9px] font-normal border border-amber-200">Peringatan: {score}</span>;
        }
        return <span className="bg-rose-50 text-rose-700 px-1.5 py-0.5 text-[9px] font-normal border border-rose-200 animate-pulse">Kritis: {score}</span>;
    };

    return (
        <div className="flex flex-col h-full bg-white pb-10 font-sans text-slate-800">

            {/* SECTION 1: SEARCH & DUAL FILTER TOOLBAR (Sticky Flat Style, No Outline Box, No Shadow) */}
            <div className="px-5 py-3.5 border-b border-slate-100 bg-white sticky top-0 z-10 space-y-2.5">
                {/* Text Search */}
                <div className="relative group">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors"
                        size={13}
                    />
                    <input
                        type="text"
                        placeholder="Cari nama atau alamat pabrik..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 py-1.5 pl-8 pr-3 text-xs font-normal text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-350 focus:bg-white transition-all"
                    />
                </div>
                {/* Dropdown Filters */}
                <div className="grid grid-cols-2 gap-2">
                    <select
                        value={selectedDocType}
                        onChange={(e) => setSelectedDocType(e.target.value)}
                        className="h-8 px-2 bg-slate-50/50 border border-slate-200 text-[11px] font-normal text-slate-600 focus:outline-none focus:bg-white transition-colors cursor-pointer"
                    >
                        <option value="ALL">Semua jenis izin</option>
                        <option value="AMDAL">AMDAL</option>
                        <option value="UKL-UPL">UKL-UPL</option>
                        <option value="SPPL">SPPL</option>
                    </select>
                    <select
                        value={selectedSubdistrict}
                        onChange={(e) => setSelectedSubdistrict(e.target.value)}
                        className="h-8 px-2 bg-slate-50/50 border border-slate-200 text-[11px] font-normal text-slate-600 focus:outline-none focus:bg-white transition-colors cursor-pointer"
                    >
                        <option value="ALL">Semua wilayah</option>
                        {subdistricts.map(kec => (
                            <option key={kec} value={kec}>{kec}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* SECTION 2: COMPANY FLUSH LIST */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">

                {/* HEADER POLIMORFIK (Flat Banner, No Box, No Caps) */}
                {isAuditor ? (
                    <div className="px-5 py-3.5 bg-slate-50/50 border-b border-slate-100 text-left space-y-2.5 select-none">
                        <div className="flex items-center gap-1.5 text-slate-700">
                            <TrendingDown size={13} className="text-rose-500" />
                            <span className="text-xs font-bold">Papan kepatuhan (Leaderboard)</span>
                        </div>
                        <div className="flex gap-2 text-[10px] text-center font-normal">
                            <div className="flex-1 bg-rose-50/50 border border-rose-100 py-1.5 px-2 text-rose-700">
                                {auditorStats.kritis} kritis
                            </div>
                            <div className="flex-1 bg-amber-50/50 border border-amber-100 py-1.5 px-2 text-amber-700">
                                {auditorStats.peringatan} rawan
                            </div>
                            <div className="flex-1 bg-emerald-50/50 border border-emerald-100 py-1.5 px-2 text-emerald-700">
                                {auditorStats.patuh} patuh
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="px-5 py-3 border-b border-slate-100 flex items-start gap-2 bg-slate-50/50 select-none">
                        <Building2 size={13} className="text-emerald-600 mt-0.5 shrink-0" />
                        <p className="text-xs font-normal text-slate-500 leading-normal">
                            Katalog geospasial menampilkan {approvedCompanies.length} pelaku usaha dengan dokumen lingkungan aktif. Klik untuk melihat analisis esg.
                        </p>
                    </div>
                )}

                {/* LIST ELEMENT (Flat, Edge-to-Edge Seamless, py-2.5 Tighter Padding & Auto-Wrapping) */}
                {displayList.length > 0 ? (
                    displayList.map((c) => {
                        const isActive = selectedCompanyId === c.id;
                        const companyKec = companyKecMap[c.id] || "Luar Wilayah";

                        return (
                            <button
                                key={c.id}
                                onClick={() => handleCompanyClick(c)}
                                className={cn(
                                    "w-full px-5 py-2.5 border-b border-slate-100 hover:bg-slate-50/60 transition-colors text-left outline-none flex items-center justify-between gap-3 min-w-0",
                                    isActive ? "bg-emerald-50/20 border-l-[3px] border-l-emerald-600" : "bg-white border-l-[3px] border-l-transparent"
                                )}
                            >
                                <div className="flex flex-col gap-0.5 min-w-0 flex-1 text-left">
                                    {/* Chip Tag Atas (Sentence Case & Thin Badges) */}
                                    <div className="flex items-center gap-2">
                                        {isAuditor ? getScoreBadge(c.score) : getObligationBadge(c.docType)}
                                    </div>

                                    {/* Nama Industri (Wrapped and break-words, No Clip) */}
                                    <h4 className={cn("text-xs leading-tight mt-1 whitespace-normal break-words", isActive ? "font-normal text-emerald-950" : "font-normal text-slate-800")}>
                                        {c.companyName}
                                    </h4>

                                    {/* Alamat & Informasi Kecamatan Spasial (Wrapped and break-words, No Clip) */}
                                    <p className="text-[10px] text-slate-400 mt-0.5 whitespace-normal break-words leading-relaxed">
                                        Kec. {companyKec} • {c.address}
                                    </p>
                                </div>

                                <ChevronRight
                                    size={15}
                                    className={cn("shrink-0 transition-transform text-slate-350", isActive ? "text-emerald-600 translate-x-0.5" : "text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5")}
                                />
                            </button>
                        );
                    })
                ) : (
                    /* Empty State - Flat Seamless */
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-2.5 px-5 select-none">
                        <div className="w-10 h-10 rounded-none bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-150">
                            <Search size={16} />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-xs font-normal text-slate-700">Tidak ditemukan</p>
                            <p className="text-[10px] text-slate-400 font-normal">Perusahaan tidak terdaftar atau tidak berada di penapis wilayah terpilih.</p>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}