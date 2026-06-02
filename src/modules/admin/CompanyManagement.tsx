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
  Lock, Unlock, ArrowUpRight, Scale, Info, MapPin
} from "lucide-react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Company } from "@/store/types";

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

function MapPicker({ lat, lng, onChange }: { lat: string; lng: string; onChange: (lat: string, lng: string) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
    },
  });

  const parsedLat = parseFloat(lat) || -6.9175;
  const parsedLng = parseFloat(lng) || 107.6191;

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

        {/* --- METRICS CARDS (Curated Aesthetics) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Card className="rounded-none border border-slate-200 shadow-none bg-white relative overflow-hidden">
            <CardContent className="p-4 flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Perusahaan</p>
                <p className="text-3xl font-black text-slate-900 leading-none">{metrics.total}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 flex items-center justify-center text-slate-600">
                <Building2 size={20} />
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900" />
          </Card>

          <Card className="rounded-none border border-slate-200 shadow-none bg-white relative overflow-hidden">
            <CardContent className="p-4 flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sertifikat Aktif</p>
                <p className="text-3xl font-black text-emerald-600 leading-none">{metrics.active}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle size={20} />
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-600" />
          </Card>

          <Card className="rounded-none border border-slate-200 shadow-none bg-white relative overflow-hidden">
            <CardContent className="p-4 flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Izin Ditangguhkan</p>
                <p className="text-3xl font-black text-rose-600 leading-none">{metrics.suspended}</p>
              </div>
              <div className="w-10 h-10 bg-rose-50 flex items-center justify-center text-rose-600">
                <Lock size={20} />
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-600" />
          </Card>

          <Card className="rounded-none border border-slate-200 shadow-none bg-white relative overflow-hidden">
            <CardContent className="p-4 flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Izin Kadaluarsa</p>
                <p className="text-3xl font-black text-amber-600 leading-none">{metrics.expired}</p>
              </div>
              <div className="w-10 h-10 bg-amber-50 flex items-center justify-center text-amber-600">
                <AlertOctagon size={20} />
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500" />
          </Card>

        </div>

        {/* --- TABS SYSTEM --- */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 border border-slate-200 w-max max-w-full">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-none text-[9px] font-black uppercase tracking-wider transition-all border outline-none",
                statusFilter === tab.key
                  ? tab.active
                  : "bg-white " + tab.color
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={cn(
                "inline-flex items-center justify-center px-1.5 h-4 text-[8px] font-black font-mono",
                statusFilter === tab.key ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* --- SEARCH & QUICK FILTER BAR --- */}
        <Card className="rounded-none border border-slate-200 shadow-none p-3 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input
                placeholder="Cari Nama Perusahaan, NIB, Alamat, PIC..."
                className="pl-9 h-9 bg-slate-50 border-slate-200 rounded-none font-bold text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Doc Type Filter */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 h-9">
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

            {/* Total Indicator */}
            <div className="flex items-center justify-end pr-2 text-right">
              <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">
                Hasil: <span className="text-slate-800">{filteredCompanies.length}</span> Perusahaan
              </span>
            </div>

          </div>
        </Card>

        {/* --- DENSE DATA TABLE --- */}
        <div className="bg-white rounded-none border border-slate-200 shadow-none overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-slate-200 h-9">
                <TableHead className="w-[120px] font-black text-slate-500 uppercase text-[9px] tracking-widest pl-4">No. Registrasi</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Perusahaan & Alamat</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Kontak PIC</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">NIB & NPWP</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Masa Berlaku Izin</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center">Status Izin</TableHead>
                <TableHead className="text-right pr-4 font-black text-slate-500 uppercase text-[9px] tracking-widest w-[280px]">Aksi Pengawasan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <ShieldAlert size={24} className="opacity-40" />
                      <p className="font-black text-[10px] uppercase tracking-widest">Tidak ada data perusahaan ditemukan</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies.map((c) => {
                  const certState = getCertificateStatus(c);
                  const daysRemaining = getDaysRemaining(c.certificateActiveUntil);
                  const isApproved = c.status === "APPROVED";
                  const isSuspended = c.status === "SUSPENDED";

                  return (
                    <TableRow key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors h-14 group">
                      
                      {/* Registration ID */}
                      <TableCell className="font-mono font-bold text-slate-500 pl-4 text-xs">
                        {c.id.substring(0, 8)}...
                      </TableCell>
                      
                      {/* Name & Address */}
                      <TableCell>
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-slate-900 text-xs group-hover:text-emerald-700 transition-colors">{c.companyName}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1 line-clamp-1">{c.address}</span>
                        </div>
                      </TableCell>

                      {/* PIC Contact */}
                      <TableCell>
                        <div className="flex flex-col text-left text-xs font-semibold text-slate-600">
                          <span className="flex items-center gap-1"><User size={10} className="text-slate-400" /> {c.picName || "-"}</span>
                          <a href={`tel:${c.picPhone}`} className="flex items-center gap-1 text-[10px] text-emerald-600 hover:underline mt-1 font-bold">
                            <Phone size={10} /> {c.picPhone || "-"}
                          </a>
                        </div>
                      </TableCell>

                      {/* NIB & NPWP */}
                      <TableCell>
                        <div className="flex flex-col text-left font-mono text-[10px] text-slate-500">
                          <span className="font-bold">NIB: {c.nib}</span>
                          <span className="mt-0.5">NPWP: {c.npwp || "-"}</span>
                        </div>
                      </TableCell>

                      {/* Expiration date countdown */}
                      <TableCell>
                        {isApproved && c.certificateActiveUntil ? (
                          <div className="flex flex-col text-left">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                              <Calendar size={11} className="text-slate-400" /> {c.certificateActiveUntil}
                            </span>
                            {daysRemaining !== null && (
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-wider mt-1",
                                daysRemaining < 0
                                  ? "text-rose-600"
                                  : daysRemaining <= 30
                                  ? "text-amber-500"
                                  : "text-emerald-600"
                              )}>
                                {daysRemaining < 0 
                                  ? `Kadaluarsa ${Math.abs(daysRemaining)} hari` 
                                  : `Sisa ${daysRemaining} hari`}
                              </span>
                            )}
                          </div>
                        ) : isSuspended ? (
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider flex items-center gap-1">
                            <Lock size={10} /> IZIN DITANGGUHKAN
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            BELUM TERBIT
                          </span>
                        )}
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell className="text-center">
                        <StatusIndicator state={certState} docType={c.docType} />
                      </TableCell>

                      {/* Tactical Actions */}
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Inspect Detail */}
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Detail Informasi"
                            className="text-slate-600 font-bold hover:bg-slate-100 rounded-none h-8 w-8 p-0"
                            onClick={() => handleOpenDetail(c)}
                          >
                            <Eye size={13} />
                          </Button>

                          {/* Download Certificate */}
                          <Button
                            variant="outline"
                            size="sm"
                            title="Unduh Sertifikat Izin"
                            disabled={!isApproved || (daysRemaining !== null && daysRemaining < 0)}
                            className="text-slate-700 hover:text-emerald-600 font-bold hover:bg-emerald-50/50 rounded-none h-8 text-[10px] tracking-widest gap-1 border-slate-300 disabled:opacity-40"
                            onClick={() => handleDownloadCertificate(c)}
                          >
                            <Download size={11} /> UNDUH
                          </Button>

                          {/* Suspend or Restore Actions */}
                          {isApproved && (
                            <Button
                              variant="outline"
                              size="sm"
                              title="Tangguhkan Izin Usaha"
                              className="text-rose-600 hover:text-white hover:bg-rose-600 font-black rounded-none h-8 text-[10px] tracking-widest border-rose-200"
                              onClick={() => handleTriggerAction(c, "SUSPENDED")}
                            >
                              <Lock size={11} className="mr-1" /> SUSPEND
                            </Button>
                          )}

                          {isSuspended && (
                            <Button
                              variant="outline"
                              size="sm"
                              title="Pulihkan Izin Usaha"
                              className="text-emerald-600 hover:text-white hover:bg-emerald-600 font-black rounded-none h-8 text-[10px] tracking-widest border-emerald-200"
                              onClick={() => handleTriggerAction(c, "APPROVED")}
                            >
                              <Unlock size={11} className="mr-1" /> AKTIFKAN
                            </Button>
                          )}

                          {!isApproved && !isSuspended && (
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2.5 py-1">
                              Menunggu Verifikasi
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
                actionTarget?.nextStatus === "SUSPENDED" 
                  ? "bg-rose-600 hover:bg-rose-700 text-white" 
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
            >
              YA, KONFIRMASI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DETAIL MODAL (HIGH DENSITY METADATA INSPECT) --- */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="rounded-none border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left w-[95vw] max-w-5xl overflow-y-auto max-h-[85vh] p-6 bg-white">
          
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
                    <span className="font-bold text-slate-900">{selectedCompany.operationalHours || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-semibold">Sumber Air / Listrik</span>
                    <span className="font-bold text-slate-900">
                      {selectedCompany.waterSource} / {selectedCompany.powerSource}
                    </span>
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

// --- Status Badge Helper Component ---
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
