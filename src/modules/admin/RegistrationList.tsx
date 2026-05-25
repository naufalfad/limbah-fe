// src/modules/admin/RegistrationList.tsx
import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Search, Filter, Eye, RefreshCw, Clock as ClockIcon, CheckCircle2,
  XCircle, AlertTriangle, FileText, Users
} from "lucide-react";
import { useSijagaStore } from '@/store/useSijagaStore';
import { DetailDrawer } from "./components/DetailDrawer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type StatusFilter = "ALL" | "PENDING" | "REVIEW" | "APPROVED" | "REJECTED";

export default function RegistrationList() {
  const { companies, fetchCompanies } = useSijagaStore();
  const [selectedReg, setSelectedReg] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleOpenDetail = (reg: any) => {
    setSelectedReg(reg);
    setIsDrawerOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDrawerOpen(false);
    // Refresh otomatis list setelah menutup drawer agar status verifikasi langsung ter-sinkronisasi [3]
    fetchCompanies();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCompanies();
    setIsRefreshing(false);
    toast.success("Database registrasi berhasil disinkronkan.");
  };

  // Kalkulasi jumlah entitas dinamis per status (Information Expert) [3]
  const pendingCount = useMemo(() => companies.filter(c => c.status === "PENDING").length, [companies]);
  const reviewCount = useMemo(() => companies.filter(c => c.status === "REVIEW").length, [companies]);
  const approvedCount = useMemo(() => companies.filter(c => c.status === "APPROVED").length, [companies]);
  const rejectedCount = useMemo(() => companies.filter(c => c.status === "REJECTED").length, [companies]);

  // Konfigurasi Tab Filtrasi Taktis GFW (Siku Kaku)
  const tabs = [
    {
      key: "ALL" as StatusFilter,
      label: "Semua",
      count: companies.length,
      icon: <Users size={12} />,
      color: "text-slate-600 border-slate-200 hover:bg-slate-50",
      active: "bg-slate-950 border-slate-950 text-white",
    },
    {
      key: "PENDING" as StatusFilter,
      label: "Pending",
      count: pendingCount,
      icon: <ClockIcon size={12} />,
      color: "text-blue-600 border-blue-200 hover:bg-blue-50/20",
      active: "bg-blue-600 border-blue-600 text-white",
    },
    {
      key: "REVIEW" as StatusFilter,
      label: "Perlu Revisi",
      count: reviewCount,
      icon: <AlertTriangle size={12} />,
      color: "text-amber-600 border-amber-200 hover:bg-amber-50/20",
      active: "bg-amber-500 border-amber-500 text-white",
    },
    {
      key: "APPROVED" as StatusFilter,
      label: "Disetujui",
      count: approvedCount,
      icon: <CheckCircle2 size={12} />,
      color: "text-emerald-600 border-emerald-200 hover:bg-emerald-50/20",
      active: "bg-emerald-600 border-emerald-600 text-white",
    },
    {
      key: "REJECTED" as StatusFilter,
      label: "Ditolak",
      count: rejectedCount,
      icon: <XCircle size={12} />,
      color: "text-rose-600 border-rose-200 hover:bg-rose-50/20",
      active: "bg-rose-600 border-rose-600 text-white",
    },
  ];

  // Filter gabungan: status tab + kueri pencarian [3]
  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
      const matchesSearch =
        c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nib.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [companies, statusFilter, searchQuery]);

  return (
    <DashboardLayout role="ADMIN_DLH">
      <div className="space-y-4 text-left"> {/* DIET: space-y-6 -> space-y-4 */}

        {/* --- HEADER UTAMA --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
              Validasi <span className="text-emerald-600">Registrasi</span>
            </h1>
            <p className="text-slate-500 text-xs font-medium mt-1.5">
              Verifikasi berkas lingkungan hidup (SPPL & UKL-UPL) pelaku usaha baru daerah [3].
            </p>
          </div>

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

        {/* --- STATUS TAB FILTERS (GFW SHARP BUTTONS) --- */}
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

        {/* --- SEARCH TOOLBAR (GFW DENSE) --- */}
        <Card className="rounded-none border border-slate-200 shadow-none p-3 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <Input
              placeholder="Cari Nama Perusahaan / NIB / No. Registrasi..."
              className="pl-9 h-9 bg-slate-50 border-slate-200 rounded-none font-bold text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>

        {/* --- STATUS FILTER LABEL INDICATOR --- */}
        {(searchQuery || statusFilter !== "ALL") && (
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest -mt-2">
            Hasil: <span className="text-slate-800">{filteredCompanies.length}</span> Berkas Ditemukan
            {statusFilter !== "ALL" && <> · Filter: <span className="text-emerald-600">{statusFilter}</span></>}
            {searchQuery && <> · Kata Kunci: "<span className="text-emerald-600">{searchQuery}</span>"</>}
          </p>
        )}

        {/* --- HIGH DENSITY TABLE --- */}
        <div className="bg-white rounded-none border border-slate-200 shadow-none overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-slate-200 h-9">
                <TableHead className="w-[150px] font-black text-slate-500 uppercase text-[9px] tracking-widest pl-4">No. Registrasi</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Perusahaan</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Jenis Dokumen</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">KBLI Usaha</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Lampiran</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right pr-4 font-black text-slate-500 uppercase text-[9px] tracking-widest">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <FileText size={24} className="opacity-40" />
                      <p className="font-black text-[10px] uppercase tracking-widest">Tidak ada berkas registrasi ditemukan</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies.map((c) => {
                  // Validasi kelengkapan berkas fisik untuk indikator kelengkapan [3]
                  const hasAllDocs = !!(c as any).docNibUrl && !!(c as any).docNpwpUrl;
                  return (
                    <TableRow key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors h-14 group">
                      <TableCell className="font-mono font-bold text-slate-500 pl-4 text-xs">
                        {c.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-slate-900 text-xs group-hover:text-emerald-700 transition-colors">{c.companyName}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{c.address}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "border-none font-black text-[9px] tracking-widest rounded-none shadow-none",
                          (c.docType === "UKL-UPL" || c.docType === "UKL_UPL")
                            ? "bg-indigo-50 text-indigo-700"
                            : "bg-emerald-50 text-emerald-700"
                        )}>
                          {(c.docType === "UKL_UPL") ? "UKL-UPL" : c.docType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 font-bold text-xs">{c.kbli || "-"}</TableCell>
                      <TableCell>
                        {hasAllDocs ? (
                          <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-wider">
                            <CheckCircle2 size={11} /> Lengkap
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] font-black text-amber-500 uppercase tracking-wider">
                            <AlertTriangle size={11} /> Tidak Lengkap
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-600 font-black hover:bg-emerald-50 rounded-none h-8 text-[10px] tracking-widest gap-1.5"
                          onClick={() => handleOpenDetail(c)}
                        >
                          <Eye size={12} /> PERIKSA
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Drawer Detail Berkas (GRASP Information Expert) [3] */}
      <DetailDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDetail}
        data={selectedReg}
      />
    </DashboardLayout>
  );
}

// --- Sub Component: Badge Status (GFW Sharp Look) ---
function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, string> = {
    PENDING: "bg-blue-50 text-blue-700 border-blue-100",
    REVIEW: "bg-amber-50 text-amber-700 border-amber-100",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-100",
    REJECTED: "bg-rose-50 text-rose-700 border-rose-100",
  };
  return (
    <Badge className={cn(configs[status] || "bg-slate-50 text-slate-500 border-slate-100", "px-2.5 py-0.5 rounded-none text-[8px] font-black uppercase tracking-widest border shadow-none")}>
      {status}
    </Badge>
  );
}