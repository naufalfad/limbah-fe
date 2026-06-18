// src/modules/admin/CompanyManagement.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  Search, Filter, RefreshCw, FileText, Phone, User, Award, ShieldAlert,
  Calendar, CheckCircle, XCircle, AlertOctagon, Download, Eye, Building2,
  Lock, Unlock, ArrowUpRight, Scale, Info
} from "lucide-react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Company } from "@/store/types";
import { PaginationControls } from "@/components/ui/pagination-controls";

// --- Leaflet & Map Imports ---
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Map size invalidator helper
function ResizeMap() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

/// FASE 2: Penyesuaian parameter fallback lat/lng MapPicker ke Sampit, Kotawaringin Timur [3]
function MapPicker({ lat, lng, onChange }: { lat: string; lng: string; onChange: (lat: string, lng: string) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
    },
  });

  // Fallback dialihkan ke pusat koordinat Sampit, Kabupaten Kotawaringin Timur
  const parsedLat = parseFloat(lat) || -6.4816;
  const parsedLng = parseFloat(lng) || 106.8560;

  return <Marker position={[parsedLat, parsedLng]} />;
}

type StatusFilter = "ALL" | "ACTIVE" | "SUSPENDED" | "EXPIRED" | "INACTIVE";
type DocFilter = "ALL" | "SPPL" | "UKL_UPL" | "UKL-UPL" | "AMDAL";

export default function CompanyManagement() {
  const navigate = useNavigate();
  const { companies, fetchCompanies, updateCompanyStatus, downloadCompanyCertificate } = useSijagaStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [docFilter, setDocFilter] = useState<DocFilter>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // States for Detail Dialog
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // States for Action Confirmation Dialog
  const [actionTarget, setActionTarget] = useState<{ company: Company; nextStatus: "SUSPENDED" | "APPROVED" } | null>(null);
  const [isActionOpen, setIsActionOpen] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCompanies();
    setIsRefreshing(false);
    toast.success("Data perusahaan berhasil disinkronkan.");
  };

  const handleOpenDetail = (company: Company) => {
    setSelectedCompany(company);
    setIsDetailOpen(true);
  };

  const handleTriggerAction = (company: Company, nextStatus: "SUSPENDED" | "APPROVED") => {
    setActionTarget({ company, nextStatus });
    setIsActionOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!actionTarget) return;
    const { company, nextStatus } = actionTarget;

    try {
      await updateCompanyStatus(company.id, nextStatus as any);
      setIsActionOpen(false);
      setActionTarget(null);
      // Refresh list to sync details
      await fetchCompanies();
    } catch (e) {
      toast.error("Gagal memperbarui status izin perusahaan.");
    }
  };

  const handleDownloadCertificate = async (company: Company) => {
    try {
      toast.info(`Sedang mengunduh sertifikat ${company.companyName}...`);
      await downloadCompanyCertificate(company.id, company.companyName);
      toast.success("Sertifikat berhasil diunduh.");
    } catch (e) {
      // Error printed by store
    }
  };

  // Helper date parsing and calculation
  const getCertificateStatus = (company: Company) => {
    if (company.status === "SUSPENDED") return "SUSPENDED";
    if (company.status !== "APPROVED") return "INACTIVE";
    if (!company.certificateActiveUntil) return "INACTIVE";

    const activeUntil = new Date(company.certificateActiveUntil);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return activeUntil < today ? "EXPIRED" : "ACTIVE";
  };

  const getDaysRemaining = (dateString?: string) => {
    if (!dateString) return null;
    const target = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Metrik Taktis (Information Expert)
  const metrics = useMemo(() => {
    let total = companies.length;
    let active = 0;
    let suspended = 0;
    let expired = 0;

    companies.forEach((c) => {
      const state = getCertificateStatus(c);
      if (state === "ACTIVE") active++;
      else if (state === "SUSPENDED") suspended++;
      else if (state === "EXPIRED") expired++;
    });

    return { total, active, suspended, expired };
  }, [companies]);

  // Tab configuration
  const tabs = [
    { key: "ALL" as StatusFilter, label: "Semua", count: metrics.total, icon: <Building2 size={12} />, color: "border-slate-300 text-slate-700 hover:bg-slate-50", active: "bg-slate-950 border-slate-950 text-white" },
    { key: "ACTIVE" as StatusFilter, label: "Izin Aktif", count: metrics.active, icon: <CheckCircle size={12} />, color: "border-emerald-200 text-emerald-700 hover:bg-emerald-50/30", active: "bg-emerald-600 border-emerald-600 text-white" },
    { key: "SUSPENDED" as StatusFilter, label: "Ditangguhkan", count: metrics.suspended, icon: <Lock size={12} />, color: "border-rose-200 text-rose-700 hover:bg-rose-50/30", active: "bg-rose-600 border-rose-600 text-white" },
    { key: "EXPIRED" as StatusFilter, label: "Kadaluarsa", count: metrics.expired, icon: <AlertOctagon size={12} />, color: "border-amber-200 text-amber-700 hover:bg-amber-50/30", active: "bg-amber-500 border-amber-500 text-white" },
    { key: "INACTIVE" as StatusFilter, label: "Belum Verifikasi", count: companies.filter(c => c.status !== "APPROVED" && c.status !== "SUSPENDED").length, icon: <FileText size={12} />, color: "border-blue-200 text-blue-700 hover:bg-blue-50/30", active: "bg-blue-600 border-blue-600 text-white" },
  ];

  // Combined Search & Filters
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      // 1. Search Query
      const matchesSearch =
        c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nib.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.picName && c.picName.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. Status Filter
      const certState = getCertificateStatus(c);
      let matchesStatus = true;
      if (statusFilter !== "ALL") {
        matchesStatus = certState === statusFilter;
      }

      // 3. Document Filter
      let matchesDoc = true;
      if (docFilter !== "ALL") {
        const normalizedFilter = docFilter === "UKL_UPL" ? "UKL-UPL" : docFilter;
        const normalizedDoc = c.docType === "UKL_UPL" ? "UKL-UPL" : c.docType;
        matchesDoc = normalizedDoc === normalizedFilter;
      }

      return matchesSearch && matchesStatus && matchesDoc;
    });
  }, [companies, searchQuery, statusFilter, docFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, docFilter]);

  // Pagination slice
  const totalItems = filteredCompanies.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <DashboardLayout role="ADMIN_DLH">
      <div className="space-y-4 text-left">

        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
              Daftar <span className="text-emerald-600">Perusahaan</span> & Izin
            </h1>
            <p className="text-slate-500 text-xs font-medium mt-1.5">
              Kelola status kepatuhan hukum, pemantauan masa aktif sertifikat izin lingkungan, serta tindakan sanksi DLH.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate("/admin/companies/add-amdal")}
              className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 font-black rounded-none h-9 px-4 text-[10px] uppercase tracking-widest shadow-sm"
            >
              + Wajib AMDAL
            </Button>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 font-black border-slate-300 rounded-none h-9 px-4 text-[10px] uppercase tracking-widest hover:bg-slate-50"
            >
              <RefreshCw size={12} className={cn(isRefreshing && "animate-spin")} />
              {isRefreshing ? "MEMUAT..." : "SYNC DATABASE"}
            </Button>
          </div>
        </div>

        {/* --- METRICS CARDS --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
          <Card className="rounded-none border border-slate-200 shadow-none bg-white relative overflow-hidden">
            <CardContent className="p-3 md:p-4 flex justify-between items-center">
              <div className="space-y-0.5 md:space-y-1">
                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Perusahaan</p>
                <p className="text-xl md:text-3xl font-black text-slate-900 leading-none">{metrics.total}</p>
              </div>
              <div className="w-6 h-6 md:w-10 md:h-10 bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                <Building2 className="w-3 h-3 md:w-5 md:h-5" />
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900" />
          </Card>

          <Card className="rounded-none border border-slate-200 shadow-none bg-white relative overflow-hidden">
            <CardContent className="p-3 md:p-4 flex justify-between items-center">
              <div className="space-y-0.5 md:space-y-1">
                <p className="text-[8px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Sertifikat Aktif</p>
                <p className="text-xl md:text-3xl font-black text-emerald-600 leading-none">{metrics.active}</p>
              </div>
              <div className="w-6 h-6 md:w-10 md:h-10 bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle className="w-3 h-3 md:w-5 md:h-5" />
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-600" />
          </Card>

          <Card className="rounded-none border border-slate-200 shadow-none bg-white relative overflow-hidden">
            <CardContent className="p-3 md:p-4 flex justify-between items-center">
              <div className="space-y-0.5 md:space-y-1">
                <p className="text-[8px] md:text-[10px] font-black text-rose-600 uppercase tracking-widest leading-none">Ditangguhkan</p>
                <p className="text-xl md:text-3xl font-black text-rose-600 leading-none">{metrics.suspended}</p>
              </div>
              <div className="w-6 h-6 md:w-10 md:h-10 bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                <Lock className="w-3 h-3 md:w-5 md:h-5" />
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-600" />
          </Card>

          <Card className="rounded-none border border-slate-200 shadow-none bg-white relative overflow-hidden">
            <CardContent className="p-3 md:p-4 flex justify-between items-center">
              <div className="space-y-0.5 md:space-y-1">
                <p className="text-[8px] md:text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none">Kadaluarsa</p>
                <p className="text-xl md:text-3xl font-black text-amber-500 leading-none">{metrics.expired}</p>
              </div>
              <div className="w-6 h-6 md:w-10 md:h-10 bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <AlertOctagon className="w-3 h-3 md:w-5 md:h-5" />
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500" />
          </Card>
        </div>

        {/* --- TABS SYSTEM (BORDERLESS UNDERLINE) --- */}
        <div className="flex flex-wrap gap-6 border-b border-slate-200 w-full mb-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                "flex items-center gap-2 pb-3 text-[10px] font-black uppercase tracking-wider transition-all outline-none border-b-2",
                statusFilter === tab.key
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={cn(
                "inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-black font-mono rounded-full ml-1",
                statusFilter === tab.key ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* --- TABS & SEARCH (COMPACT) --- */}
        <div className="py-2 border-y border-slate-200 bg-transparent flex flex-col xl:flex-row justify-between gap-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input
                placeholder="Cari..."
                className="pl-9 h-8 bg-slate-50 border-slate-200 rounded-none font-bold text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 h-8">
              <Filter size={12} className="text-slate-400 shrink-0" />
              <select
                className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full cursor-pointer"
                value={docFilter}
                onChange={(e) => setDocFilter(e.target.value as DocFilter)}
              >
                <option value="ALL">Semua Dokumen</option>
                <option value="SPPL">Dokumen SPPL</option>
                <option value="UKL_UPL">Dokumen UKL-UPL</option>
                <option value="AMDAL">Dokumen AMDAL</option>
              </select>
            </div>

            <div className="flex items-center justify-end pr-2 text-right">
              <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">
                Hasil: <span className="text-slate-800">{filteredCompanies.length}</span>
              </span>
            </div>
          </div>
        </div>

        {/* --- DENSE COMPACT DATA TABLE (DESKTOP) --- */}
        <div className="hidden md:block bg-transparent overflow-hidden text-left">
          <Table>
            <TableHeader className="bg-slate-50 border-y border-slate-200">
              <TableRow className="border-b border-slate-200 h-9">
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest pl-4 w-[280px]">Perusahaan & Alamat</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest w-[160px]">Kontak PIC</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest w-[150px]">Masa Berlaku Izin</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center w-[120px]">Status Izin</TableHead>
                <TableHead className="text-right pr-4 font-black text-slate-500 uppercase text-[9px] tracking-widest w-[140px]">Aksi Pengawasan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <ShieldAlert size={24} className="opacity-40" />
                      <p className="font-black text-[10px] uppercase tracking-widest">Tidak ada data perusahaan ditemukan</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCompanies.map((c) => {
                  const certState = getCertificateStatus(c);
                  const daysRemaining = getDaysRemaining(c.certificateActiveUntil);
                  const isApproved = c.status === "APPROVED";
                  const isSuspended = c.status === "SUSPENDED";

                  return (
                    <TableRow key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors h-14 group">

                      {/* Name & Address (Constrained, Wraps directly to new line) */}
                      <TableCell className="pl-4 max-w-[280px] whitespace-normal break-words py-2.5">
                        <div className="flex flex-col text-left">
                          <span className="font-black text-slate-900 text-xs leading-tight group-hover:text-emerald-700 transition-colors">
                            {c.companyName}
                          </span>
                          <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider mt-1.5 leading-snug">
                            {c.address}
                          </span>
                        </div>
                      </TableCell>

                      {/* PIC Contact */}
                      <TableCell className="w-[160px] whitespace-normal">
                        <div className="flex flex-col text-left text-xs font-semibold text-slate-600">
                          <span className="flex items-center gap-1 leading-tight text-slate-700 font-bold">
                            <User size={10} className="text-slate-400 shrink-0" /> {c.picName || "-"}
                          </span>
                          <a href={`tel:${c.picPhone}`} className="flex items-center gap-1 text-[10px] text-emerald-600 hover:underline mt-1 font-black tracking-tight leading-none shrink-0">
                            <Phone size={10} className="shrink-0" /> {c.picPhone || "-"}
                          </a>
                        </div>
                      </TableCell>

                      {/* Expiration Date Countdown */}
                      <TableCell className="w-[150px] whitespace-normal">
                        {isApproved && c.certificateActiveUntil ? (
                          <div className="flex flex-col text-left">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                              <Calendar size={11} className="text-slate-400 shrink-0" /> {c.certificateActiveUntil}
                            </span>
                            {daysRemaining !== null && (
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-wider mt-1",
                                daysRemaining < 0 ? "text-rose-600" : daysRemaining <= 30 ? "text-amber-500" : "text-emerald-600"
                              )}>
                                {daysRemaining < 0 ? `Kadaluarsa ${Math.abs(daysRemaining)} hari` : `Sisa ${daysRemaining} hari`}
                              </span>
                            )}
                          </div>
                        ) : isSuspended ? (
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider flex items-center gap-1">
                            <Lock size={10} className="shrink-0" /> DITANGGUHKAN
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            BELUM TERBIT
                          </span>
                        )}
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell className="text-center w-[120px]">
                        <StatusIndicator state={certState} docType={c.docType} />
                      </TableCell>

                      {/* Tactical Icon Actions (Compact) */}
                      <TableCell className="text-right pr-4 w-[140px]">
                        <div className="flex items-center justify-end gap-1.5">

                          {/* DETAIL BUTTON */}
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Lihat Detail"
                            className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-none h-8 w-8 p-0"
                            onClick={() => { setSelectedCompany(c); setIsDetailOpen(true); }}
                          >
                            <Eye size={13} />
                          </Button>

                          {/* Download Certificate Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            title={!isApproved || (daysRemaining !== null && daysRemaining < 0) ? "Sertifikat Belum Terbit / Kadaluarsa" : "Unduh Sertifikat Izin"}
                            disabled={!isApproved || (daysRemaining !== null && daysRemaining < 0)}
                            className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-none h-8 w-8 p-0 disabled:opacity-40"
                            onClick={() => handleDownloadCertificate(c)}
                          >
                            <Download size={13} />
                          </Button>

                          {/* Suspend Action */}
                          {isApproved && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Tangguhkan Izin Usaha (Sanksi DLH)"
                              className="text-rose-600 hover:text-white hover:bg-rose-600 rounded-none h-8 w-8 p-0"
                              onClick={() => handleTriggerAction(c, "SUSPENDED")}
                            >
                              <Lock size={13} />
                            </Button>
                          )}

                          {/* Activate Action */}
                          {isSuspended && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Pulihkan / Aktifkan Kembali Izin Usaha"
                              className="text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-none h-8 w-8 p-0"
                              onClick={() => handleTriggerAction(c, "APPROVED")}
                            >
                              <Unlock size={13} />
                            </Button>
                          )}

                          {/* Pending Review Placeholder */}
                          {!isApproved && !isSuspended && (
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none" title="Menunggu verifikasi administrasi / lapangan">
                              PENDING
                            </span>
                          )}

                        </div>
                      </TableCell>

                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* --- LIST VIEW (MOBILE) --- */}
        <div className="md:hidden flex flex-col divide-y divide-slate-100 border-y border-slate-200">
          {paginatedCompanies.length === 0 ? (
            <div className="text-center py-10 bg-white border border-slate-200 shadow-sm">
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <ShieldAlert size={24} className="opacity-40" />
                <p className="font-black text-[10px] uppercase tracking-widest">Tidak ada data perusahaan ditemukan</p>
              </div>
            </div>
          ) : (
            paginatedCompanies.map((c) => {
              const certState = getCertificateStatus(c);
              const daysRemaining = getDaysRemaining(c.certificateActiveUntil);
              const isApproved = c.status === "APPROVED";
              const isSuspended = c.status === "SUSPENDED";

              return (
                <div key={c.id} className="bg-transparent py-4 flex flex-col gap-3 relative overflow-hidden">
                  {/* Status Strip at the top */}
                  <div className={cn("absolute top-0 left-0 w-1 h-full",
                    certState === "ACTIVE" ? "bg-emerald-500" :
                      certState === "SUSPENDED" ? "bg-rose-500" :
                        certState === "EXPIRED" ? "bg-amber-500" : "bg-blue-500"
                  )} />

                  {/* Header: Company Name & Status */}
                  <div className="flex justify-between items-start gap-2 pt-0 pl-3 text-left">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-xs leading-tight">{c.companyName}</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">{c.address}</span>
                    </div>
                    <div className="shrink-0"><StatusIndicator state={certState} docType={c.docType} /></div>
                  </div>

                  {/* Body: PIC & Date */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 pl-3 text-left">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Kontak PIC</span>
                      <span className="font-bold text-slate-700 flex items-center gap-1 mt-0.5"><User size={10} className="text-slate-400 shrink-0" /> {c.picName || "-"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Masa Berlaku</span>
                      {isApproved && c.certificateActiveUntil ? (
                        <div className="flex flex-col mt-0.5">
                          <span className="font-bold text-slate-800 flex items-center gap-1"><Calendar size={10} className="text-slate-400 shrink-0" /> {c.certificateActiveUntil}</span>
                        </div>
                      ) : isSuspended ? (
                        <span className="font-black text-rose-500 flex items-center gap-1 mt-0.5 text-[9px] uppercase tracking-widest"><Lock size={10} className="shrink-0" /> Ditangguhkan</span>
                      ) : (
                        <span className="font-bold text-slate-500 flex items-center gap-1 mt-0.5 text-[9px] uppercase tracking-widest">- Belum Terbit</span>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-1 pl-3">
                    {/* Days remaining indicator */}
                    <div className="flex-1 text-left">
                      {isApproved && daysRemaining !== null && (
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest",
                          daysRemaining < 0 ? "text-rose-600" : daysRemaining <= 30 ? "text-amber-500" : "text-emerald-600"
                        )}>
                          {daysRemaining < 0 ? `Kadaluarsa ${Math.abs(daysRemaining)} hari` : `Sisa ${daysRemaining} hari`}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDetail(c)} className="h-8 w-8 p-0 rounded-none border-slate-200">
                        <Eye size={13} />
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        disabled={!isApproved || (daysRemaining !== null && daysRemaining < 0)}
                        onClick={() => handleDownloadCertificate(c)}
                        className="h-8 w-8 p-0 rounded-none border-slate-200"
                      >
                        <Download size={13} />
                      </Button>
                      {isApproved && (
                        <Button variant="outline" size="sm" onClick={() => handleTriggerAction(c, "SUSPENDED")} className="h-8 w-8 p-0 rounded-none border-rose-200 text-rose-600 hover:bg-rose-50">
                          <Lock size={13} />
                        </Button>
                      )}
                      {isSuspended && (
                        <Button variant="outline" size="sm" onClick={() => handleTriggerAction(c, "APPROVED")} className="h-8 w-8 p-0 rounded-none border-emerald-200 text-emerald-600 hover:bg-emerald-50">
                          <Unlock size={13} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* --- PAGINATION CONTROLS --- */}
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />

      </div>

      {/* --- CONFIRMATION DIALOG (SUSPEND / RESTORE) --- */}
      <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
        <DialogContent className="rounded-none border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-slate-900">
              {actionTarget?.nextStatus === "SUSPENDED" ? (
                <>
                  <ShieldAlert className="text-rose-600" size={16} />
                  Konfirmasi Penangguhan Izin
                </>
              ) : (
                <>
                  <CheckCircle className="text-emerald-600" size={16} />
                  Konfirmasi Pemulihan Izin
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-slate-600 mt-2">
              {actionTarget?.nextStatus === "SUSPENDED" ? (
                <>
                  Apakah Anda yakin ingin **menangguhkan (suspend)** sertifikat izin untuk perusahaan{" "}
                  <span className="text-slate-900 font-bold">"{actionTarget?.company.companyName}"</span>?
                  Tindakan ini akan memblokir pengunduhan sertifikat dan menandai izin dalam kondisi melanggar / tidak aktif.
                </>
              ) : (
                <>
                  Apakah Anda yakin ingin **mengaktifkan kembali** sertifikat izin untuk perusahaan{" "}
                  <span className="text-slate-900 font-bold">"{actionTarget?.company.companyName}"</span>?
                  Izin perusahaan akan dipulihkan ke status aktif dan sertifikat digital dapat kembali diunduh.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsActionOpen(false);
                setActionTarget(null);
              }}
              className="rounded-none border-slate-300 font-bold text-xs h-9"
            >
              BATAL
            </Button>
            <Button
              onClick={handleConfirmAction}
              className={cn(
                "rounded-none font-black text-xs h-9 uppercase tracking-wider",
                actionTarget?.nextStatus === "SUSPENDED" ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
            >
              YA, KONFIRMASI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DETAIL MODAL (HIGH DENSITY METADATA INSPECT) --- */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="rounded-none border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left w-[98vw] lg:max-w-[95vw] lg:w-[95vw] overflow-y-auto h-[85vh] p-8 bg-white">
          <DialogHeader className="border-b border-slate-200 pb-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <DialogTitle className="text-base font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                  <Building2 className="text-emerald-600" size={18} />
                  {selectedCompany?.companyName}
                </DialogTitle>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                  ID Registrasi: {selectedCompany?.id}
                </p>
              </div>
              <Badge className={cn(
                "rounded-none shadow-none text-[8px] font-black tracking-widest border px-3 py-1",
                selectedCompany?.status === "APPROVED"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : selectedCompany?.status === "SUSPENDED"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
              )}>
                {selectedCompany?.status}
              </Badge>
            </div>
          </DialogHeader>

          {selectedCompany && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 text-xs">

              {/* Seksi 1: Administrasi & Legalitas */}
              <div className="space-y-4">
                <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b pb-1">
                  <Scale size={12} /> Administrasi & Legalitas
                </h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-semibold">Nomor Induk Berusaha (NIB)</span>
                    <span className="font-mono font-bold text-slate-900">{selectedCompany.nib}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-semibold">NPWP Perusahaan</span>
                    <span className="font-mono font-bold text-slate-900">{selectedCompany.npwp || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-semibold">Jenis Penapisan</span>
                    <span className="font-bold text-indigo-600 uppercase">
                      {selectedCompany.docType === "UKL_UPL" ? "UKL-UPL" : selectedCompany.docType}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-semibold">Kode KBLI Usaha</span>
                    <span className="font-bold text-slate-900">{selectedCompany.kbli || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-semibold">Modal Investasi</span>
                    <span className="font-bold text-slate-900">
                      Rp {selectedCompany.investment ? selectedCompany.investment.toLocaleString("id-ID") : "0"} ({selectedCompany.investmentType})
                    </span>
                  </div>
                </div>

                <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b pb-1 pt-2">
                  <Award size={12} /> Legalitas Berkas Scan
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedCompany.docNibUrl ? (
                    <a
                      href={`http://localhost:5000${selectedCompany.docNibUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-slate-200 bg-slate-50 p-2 text-center rounded-none font-bold hover:bg-slate-100 transition-colors flex flex-col items-center justify-center text-[10px] text-slate-700"
                    >
                      <FileText size={16} className="text-emerald-600 mb-1" />
                      LIHAT SCAN NIB
                      <ArrowUpRight size={10} className="mt-0.5 text-slate-400" />
                    </a>
                  ) : (
                    <div className="border border-dashed border-slate-200 p-2 text-center text-[9px] text-slate-400 flex flex-col items-center justify-center">
                      SCAN NIB NIHIL
                    </div>
                  )}
                  {selectedCompany.docNpwpUrl ? (
                    <a
                      href={`http://localhost:5000${selectedCompany.docNpwpUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-slate-200 bg-slate-50 p-2 text-center rounded-none font-bold hover:bg-slate-100 transition-colors flex flex-col items-center justify-center text-[10px] text-slate-700"
                    >
                      <FileText size={16} className="text-emerald-600 mb-1" />
                      LIHAT SCAN NPWP
                      <ArrowUpRight size={10} className="mt-0.5 text-slate-400" />
                    </a>
                  ) : (
                    <div className="border border-dashed border-slate-200 p-2 text-center text-[9px] text-slate-400 flex flex-col items-center justify-center">
                      SCAN NPWP NIHIL
                    </div>
                  )}
                </div>
              </div>

              {/* Seksi 2: Operasional & Kepatuhan Teknis */}
              <div className="space-y-4">
                <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b pb-1">
                  <Building2 size={12} /> Kapasitas & Operasional
                </h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-semibold">Tahun Berdiri</span>
                    <span className="font-bold text-slate-900">{selectedCompany.yearBuilt || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-semibold">Luas Tanah / Bangunan</span>
                    <span className="font-bold text-slate-900">
                      {selectedCompany.landArea} m² / {selectedCompany.buildingArea} m²
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-semibold">Jumlah Tenaga Kerja</span>
                    <span className="font-bold text-slate-900">{selectedCompany.employees} Orang</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-semibold">Jam Operasional</span>
                    <span className="font-bold text-slate-800 font-mono">{selectedCompany.operationalHours || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-semibold">Sumber Air / Listrik</span>
                    <span className="font-bold text-slate-800 font-mono">{selectedCompany.waterSource} / {selectedCompany.powerSource}</span>
                  </div>
                </div>

                <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b pb-1 pt-2">
                  <Info size={12} /> Teknis Pengelolaan Limbah
                </h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-semibold">Kepemilikan TPS B3</span>
                    <span className={cn(
                      "font-bold uppercase tracking-wider text-[10px]",
                      selectedCompany.hasTps ? "text-emerald-600" : "text-rose-500"
                    )}>
                      {selectedCompany.hasTps ? "SUDAH MEMILIKI TPS" : "BELUM MEMILIKI TPS"}
                    </span>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-slate-500 font-semibold mb-1">Bahan Baku Operasional</span>
                    <span className="font-bold text-slate-800 bg-slate-50 p-2 border border-slate-100 whitespace-pre-wrap">{selectedCompany.rawMaterials || "-"}</span>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-slate-500 font-semibold mb-1">Karakteristik Limbah B3</span>
                    <span className="font-bold text-slate-800 bg-slate-50 p-2 border border-slate-100 whitespace-pre-wrap">{selectedCompany.wasteInfo || "Belum diisi"}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          <div className="border-t border-slate-200 mt-6 pt-4 flex justify-between items-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Lokasi GIS: {selectedCompany?.lat}, {selectedCompany?.lng}
            </div>
            <Button
              onClick={() => setIsDetailOpen(false)}
              className="rounded-none bg-slate-950 hover:bg-slate-800 text-white font-black text-xs px-6 h-9"
            >
              TUTUP DETAIL
            </Button>
          </div>

        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function StatusIndicator({ state, docType }: { state: StatusFilter; docType: string }) {
  const normalizedDoc = docType === "UKL_UPL" ? "UKL-UPL" : docType;
  const isAmdal = normalizedDoc === "AMDAL";

  const configs: Record<StatusFilter, { label: string; style: string }> = {
    ALL: { label: "Semua", style: "" },
    ACTIVE: {
      label: `AKTIF (${normalizedDoc})`,
      style: isAmdal
        ? "bg-rose-50 text-rose-700 border-rose-200 font-black"
        : "bg-emerald-50 text-emerald-700 border-emerald-200"
    },
    SUSPENDED: { label: "DITANGGUHKAN", style: "bg-rose-50 text-rose-700 border-rose-200 border-dashed" },
    EXPIRED: { label: "IZIN KADALUARSA", style: "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" },
    INACTIVE: { label: "BELUM VERIFIKASI", style: "bg-slate-50 text-slate-500 border-slate-200" },
  };

  const activeConfig = configs[state] || configs.INACTIVE;

  return (
    <Badge className={cn("px-2.5 py-0.5 rounded-none text-[8px] font-black uppercase tracking-widest border shadow-none whitespace-nowrap", activeConfig.style)}>
      {activeConfig.label}
    </Badge>
  );
}