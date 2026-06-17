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
import { PaginationControls } from "@/components/ui/pagination-controls";

type StatusFilter = "ALL" | "PENDING" | "REVIEW" | "APPROVED" | "REJECTED";

export default function RegistrationList() {
  const { companies, fetchCompanies } = useSijagaStore();
  const [selectedReg, setSelectedReg] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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

  // Reset pagination on filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalItems = filteredCompanies.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <DashboardLayout role="ADMIN_DLH">
      <div className="space-y-4 text-left">

        {/* --- FILTER & TABS (COMPACT) --- */}
        <div className="py-2 border-y border-slate-200 bg-transparent flex flex-col md:flex-row justify-between gap-3">
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
          </Button>
        </div>

        {/* --- STATUS TAB FILTERS (BORDERLESS UNDERLINE) --- */}
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

        {/* --- SEARCH TOOLBAR (GFW DENSE) --- */}
        <div className="py-1 border-b border-slate-200 bg-transparent">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <Input
              placeholder="Cari..."
              className="pl-9 h-8 bg-slate-50 border-slate-200 rounded-none font-bold text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* --- STATUS FILTER LABEL INDICATOR --- */}
        {(searchQuery || statusFilter !== "ALL") && (
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest -mt-2">
            Hasil: <span className="text-slate-800">{filteredCompanies.length}</span> Berkas Ditemukan
          </p>
        )}

        {/* --- HIGH DENSITY COMPACT TABLE (DESKTOP) --- */}
        <div className="hidden md:block bg-transparent overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 border-y border-slate-200">
              <TableRow className="border-b border-slate-200 h-9">
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest pl-4 w-[280px]">Perusahaan</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest w-[140px]">Dokumen</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest w-[120px]">KBLI</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest w-[140px]">Status</TableHead>
                <TableHead className="text-right pr-4 font-black text-slate-500 uppercase text-[9px] tracking-widest w-[100px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <FileText size={24} className="opacity-40" />
                      <p className="font-black text-[10px] uppercase tracking-widest">Tidak ada berkas ditemukan</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCompanies.map((c) => {
                  return (
                    <TableRow key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors h-12">
                      <TableCell className="pl-4 text-xs font-bold text-slate-900">{c.companyName}</TableCell>
                      <TableCell className="text-[10px] font-bold text-slate-600">{(c.docType === "UKL_UPL") ? "UKL-UPL" : c.docType}</TableCell>
                      <TableCell className="text-[10px] text-slate-500">{c.kbli || "-"}</TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell className="text-right pr-4 w-[100px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Periksa & Validasi Berkas"
                          className="font-black text-[9px] text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 tracking-widest h-8 w-8 p-0 rounded-none outline-none"
                          onClick={() => handleOpenDetail(c)}
                        >
                          <CheckCircle2 size={14} />
                        </Button>
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
            <div className="text-center py-10 bg-transparent">
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <FileText size={24} className="opacity-40" />
                <p className="font-black text-[10px] uppercase tracking-widest">Tidak ada berkas ditemukan</p>
              </div>
            </div>
          ) : (
            paginatedCompanies.map((c) => {
              const hasAllDocs = !!(c as any).docNibUrl && !!(c as any).docNpwpUrl;
              return (
                <div key={c.id} className="bg-transparent py-4 flex flex-col gap-3 relative overflow-hidden">
                  <div className={cn("absolute top-0 left-0 w-1 h-full", 
                    c.status === "PENDING" ? "bg-blue-500" :
                    c.status === "REVIEW" ? "bg-amber-500" :
                    c.status === "APPROVED" ? "bg-emerald-500" : "bg-rose-500"
                  )} />

                  <div className="flex justify-between items-start gap-2 pt-0 pl-3 text-left">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-xs leading-tight">{c.companyName}</span>
                      <span className="font-mono text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{c.id}</span>
                    </div>
                    <div className="shrink-0"><StatusBadge status={c.status} /></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 pl-3 text-left">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Jenis Dokumen</span>
                      <span className={cn(
                        "mt-0.5 font-black text-[10px] tracking-widest uppercase leading-none w-fit",
                        (c.docType === "UKL-UPL" || c.docType === "UKL_UPL")
                          ? "text-indigo-600"
                          : "text-emerald-600"
                      )}>
                        {(c.docType === "UKL_UPL") ? "UKL-UPL" : c.docType}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Berkas Pendukung</span>
                      {hasAllDocs ? (
                        <span className="mt-0.5 flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">
                          <CheckCircle2 size={11} className="shrink-0" /> Lengkap
                        </span>
                      ) : (
                        <span className="mt-0.5 flex items-center gap-1.5 text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none">
                          <AlertTriangle size={11} className="shrink-0" /> Tdk Lengkap
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-1 pl-3">
                    <div className="flex-1 text-left">
                      <span className="text-[9px] text-slate-500 line-clamp-1 italic">{c.address}</span>
                    </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDetail(c)}
                        className="font-black text-[9px] text-emerald-600 hover:bg-emerald-50 tracking-widest h-8 w-8 p-0 rounded-none outline-none shrink-0 border-slate-200 ml-2"
                      >
                        <Eye size={14} />
                      </Button>
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

      {/* Drawer Detail Berkas (GRASP Information Expert) [3] */}
      <DetailDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDetail}
        data={selectedReg}
      />
    </DashboardLayout>
  );
}

// --- Sub Component: Badge Status (Borderless Dot) ---
function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, string> = {
    PENDING: "text-blue-600",
    REVIEW: "text-amber-600",
    APPROVED: "text-emerald-600",
    REJECTED: "text-rose-600",
  };
  const config = configs[status] || "text-slate-500";
  return (
    <div className={cn("flex items-center gap-1.5 font-black text-[9px] uppercase tracking-widest", config)}>
      <span className="w-1.5 h-1.5 rounded-full currentColor bg-current" />
      {status}
    </div>
  );
}