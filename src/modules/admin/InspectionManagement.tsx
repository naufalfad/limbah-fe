// src/modules/admin/InspectionManagement.tsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ClipboardCheck, Search, Plus, Filter, FileText,
  CheckCircle2, AlertTriangle, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateInspectionModal } from "./components/CreateInspectionModal";
import { FollowUpModal } from "./components/FollowUpModal";
import { InspectionDetailModal } from "./components/InspectionDetailModal"; // Menggabungkan impor modal milik rekan Anda
import { toast } from "sonner";
import { useSijagaStore } from '@/store/useSijagaStore';
import { PaginationControls } from "@/components/ui/pagination-controls";

export default function InspectionManagement() {
  // SINKRONISASI DATA: Memanggil fetchOfficers dari store untuk master data penugasan [3]
  const {
    inspections,
    fetchInspections,
    fetchCompanies,
    fetchOfficers
  } = useSijagaStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false); // State untuk modal detail rekan Anda
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Memastikan sinkronisasi master data lengkap saat inisiasi
  useEffect(() => {
    fetchInspections();
    fetchCompanies();
    fetchOfficers(); // SINKRONISASI DAFTAR INSPEKTUR LAPANGAN [3]
  }, [fetchInspections, fetchCompanies, fetchOfficers]);

  const getComplianceStatus = (status: string, score: number | null) => {
    if (status === "Terjadwal") return "TERJADWAL";
    if (status === "Dibatalkan") return "DIBATALKAN";
    if (score === null) return "TERJADWAL";
    if (score >= 80) return "COMPLIANT";
    if (score >= 60) return "WARNING";
    return "NON-COMPLIANT";
  };

  const completedInspections = inspections.filter((i: any) => i.status === "Selesai");
  const countSelesai = completedInspections.length;
  const countTindakLanjut = completedInspections.filter((i: any) => i.score !== null && i.score < 60).length;

  const averageScore = countSelesai > 0
    ? Math.round(completedInspections.reduce((sum: number, i: any) => sum + (i.score || 0), 0) / countSelesai)
    : 0;

  const filteredInspections = inspections.filter((i: any) => {
    const query = searchTerm.toLowerCase();
    return i.id.toLowerCase().includes(query) ||
      i.companyName.toLowerCase().includes(query) ||
      i.inspectorName.toLowerCase().includes(query) ||
      (i.location && i.location.toLowerCase().includes(query));
  });

  // Reset pagination on filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalItems = filteredInspections.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedInspections = filteredInspections.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <DashboardLayout role="ADMIN_DLH">
      <div className="space-y-4 pb-6 text-left">

        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              Inspeksi <span className="text-emerald-600">Lapangan</span>
            </h1>
            <p className="text-slate-500 text-xs font-medium mt-1">Audit fisik dan penilaian kepatuhan lingkungan hidup pelaku usaha.</p>
          </div>

          {/* AKTIVASI TOMBOL: Mengaktifkan kembali penugasan mandiri terkontrol oleh Admin DLH [3] */}
          <Button
            onClick={() => setIsModalOpen(true)}
            size="sm"
            className="rounded-none font-bold bg-slate-900 hover:bg-emerald-600 h-10 px-6 text-xs uppercase tracking-widest shadow-md flex items-center gap-1.5"
          >
            <Plus size={14} /> BUAT SURAT TUGAS
          </Button>
        </div>

        {/* --- STATS SUMMARY (DENSE) --- */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
          <StatCard label="Inspeksi Selesai" value={countSelesai.toLocaleString()} sub="Akumulasi Total" icon={<CheckCircle2 className="w-4 h-4 md:w-6 md:h-6 text-emerald-500" />} />
          <StatCard label="Perlu Tindak Lanjut" value={String(countTindakLanjut).padStart(2, '0')} sub="Skor Kepatuhan < 60" icon={<AlertTriangle className="w-4 h-4 md:w-6 md:h-6 text-amber-500" />} color="amber" />
          <StatCard className="col-span-2 md:col-span-1" label="Skor Rata-rata" value={`${averageScore}/100`} sub="Kepatuhan Daerah" icon={<ClipboardCheck className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />} />
        </div>

        {/* --- TABLE AREA (DENSE - DESKTOP) --- */}
        <div className="hidden md:block bg-transparent overflow-hidden">
          <div className="py-3 border-y border-slate-200 bg-transparent flex flex-col md:flex-row justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input
                placeholder="Cari perusahaan atau petugas..."
                className="h-9 pl-9 rounded-none border-slate-200 bg-white text-xs font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="h-9 rounded-none border-slate-300 gap-1.5 font-bold text-slate-600 text-[10px]" onClick={() => toast.info("Filter Laporan Aktif")}>
              <Filter size={12} /> FILTER LAPORAN
            </Button>
          </div>

          <Table>
            <TableHeader className="bg-slate-50 border-y border-slate-200">
              <TableRow className="border-b border-slate-200 h-10">
                <TableHead className="pl-4 font-black text-slate-500 uppercase text-[9px] tracking-widest">ID Inspeksi</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Perusahaan</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center">Tgl Inspeksi</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center">Skor Kepatuhan</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center">Status</TableHead>
                <TableHead className="pr-4 text-right font-black text-slate-500 uppercase text-[9px] tracking-widest">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInspections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 font-bold text-slate-400 text-xs">
                    Tidak ada riwayat inspeksi lapangan.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInspections.map((item: any) => {
                  const complianceStatus = getComplianceStatus(item.status, item.score);
                  return (
                    <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors h-14">
                      <TableCell className="pl-4 font-black text-slate-900 text-xs">{item.id}</TableCell>
                      <TableCell>
                        <p className="font-bold text-slate-800 text-xs leading-none">{item.company?.companyName || item.companyName}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-1">
                          <User size={10} /> {item.inspectorName}
                        </p>
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-500 text-xs">
                        {item.date}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.score !== null ? (
                          <div className="flex flex-col items-center">
                            <span className={cn(
                              "text-sm font-black tracking-tight",
                              item.score >= 80 ? "text-emerald-600" : item.score >= 60 ? "text-amber-500" : "text-rose-600"
                            )}>{item.score}/100</span>
                            <div className="w-16 h-1 bg-slate-100 rounded-none mt-1">
                              <div className={cn(
                                "h-full rounded-none",
                                item.score >= 80 ? "bg-emerald-500" : item.score >= 60 ? "bg-amber-500" : "bg-rose-500"
                              )} style={{ width: `${item.score}%` }} />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider italic font-mono">TERJADWAL (BELUM SIDAK)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <ComplianceBadge status={complianceStatus} />
                      </TableCell>
                      <TableCell className="pr-4 text-right">

                        {/* RESOLUSI KONFLIK: Menggabungkan Dua Fitur dalam Satu Group Tombol Taktis */}
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="LIHAT BAP"
                            className="text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-none h-8 w-8 p-0 border-emerald-200"
                            onClick={() => {
                              if (item.status === 'Selesai') {
                                setSelectedInspection(item);
                                setIsDetailModalOpen(true); // Memanggil modal detail rekan Anda
                              } else {
                                toast.warning("BAP belum diterbitkan oleh petugas lapangan (Status: Terjadwal).");
                              }
                            }}
                          >
                            <FileText size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="TINDAK LANJUT"
                            className="text-amber-600 hover:text-white hover:bg-amber-600 rounded-none h-8 w-8 p-0 border-amber-200"
                            onClick={() => {
                              if (item.status === 'Selesai') {
                                setSelectedInspection(item);
                                setIsFollowUpModalOpen(true); // Memanggil modal follow-up Anda
                              } else {
                                toast.warning("Tindak lanjut hanya bisa dilakukan setelah inspeksi selesai.");
                              }
                            }}
                          >
                            <AlertTriangle size={13} />
                          </Button>
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
          <div className="py-3 bg-transparent flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input
                placeholder="Cari inspeksi..."
                className="h-9 pl-9 rounded-none border-slate-200 bg-slate-50 text-xs font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {paginatedInspections.length === 0 ? (
            <div className="text-center py-10 bg-transparent">
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <ClipboardCheck size={24} className="opacity-40" />
                <p className="font-black text-[10px] uppercase tracking-widest">Tidak ada riwayat inspeksi</p>
              </div>
            </div>
          ) : (
            paginatedInspections.map((item: any) => {
              const complianceStatus = getComplianceStatus(item.status, item.score);
              return (
                <div key={item.id} className="bg-transparent py-4 flex flex-col gap-3 relative overflow-hidden">
                  <div className={cn("absolute top-0 left-0 w-1 h-full", 
                    complianceStatus === "COMPLIANT" ? "bg-emerald-500" :
                    complianceStatus === "WARNING" ? "bg-amber-500" :
                    complianceStatus === "NON-COMPLIANT" ? "bg-rose-500" : "bg-blue-500"
                  )} />

                  <div className="flex justify-between items-start gap-2 pt-0 pl-3 text-left">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-xs leading-tight">{item.company?.companyName || item.companyName}</span>
                      <span className="font-mono text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{item.id}</span>
                    </div>
                    <div className="shrink-0"><ComplianceBadge status={complianceStatus} /></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 pl-3 text-left">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Inspektur</span>
                      <span className="font-bold text-slate-700 flex items-center gap-1 mt-0.5 line-clamp-1"><User size={10} className="text-slate-400 shrink-0" /> {item.inspectorName}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tgl & Skor</span>
                      <div className="font-bold text-slate-700 mt-0.5 flex flex-col gap-0.5">
                        <span>{item.date}</span>
                        {item.score !== null ? (
                          <span className={cn("text-[10px] uppercase tracking-wider", item.score >= 80 ? "text-emerald-600" : item.score >= 60 ? "text-amber-500" : "text-rose-600")}>Skor: {item.score}/100</span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Belum disidak</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-1 pl-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 font-bold text-emerald-600 gap-1.5 hover:bg-emerald-50 rounded-none h-8 text-[9px] tracking-widest"
                      onClick={() => {
                        if (item.status === 'Selesai') {
                          setSelectedInspection(item);
                          setIsDetailModalOpen(true);
                        } else {
                          toast.warning("BAP belum diterbitkan.");
                        }
                      }}
                    >
                      <FileText size={12} /> BAP
                    </Button>
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 font-bold text-amber-600 gap-1.5 hover:bg-amber-50 rounded-none h-8 text-[9px] tracking-widest"
                      onClick={() => {
                        if (item.status === 'Selesai') {
                          setSelectedInspection(item);
                          setIsFollowUpModalOpen(true);
                        } else {
                          toast.warning("Tindak lanjut hanya bisa dilakukan setelah inspeksi selesai.");
                        }
                      }}
                    >
                      <AlertTriangle size={12} /> TINDAK
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

      <CreateInspectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Modul Anda */}
      <FollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        inspection={selectedInspection}
      />

      {/* Modul Teman Anda */}
      <InspectionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        inspection={selectedInspection}
      />

    </DashboardLayout>
  );
}

// --- SUB COMPONENTS ---

function StatCard({ label, value, sub, icon, color, className }: any) {
  const isWarning = color === "amber";
  const bg = isWarning ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200";
  const text = isWarning ? "text-amber-700" : "text-slate-800";
  const iconBorder = isWarning ? "border-amber-200" : "border-slate-100";

  return (
    <div className={cn("border p-3 md:p-4 shadow-sm flex items-start justify-between transition-colors", bg, className)}>
      <div className="space-y-0.5 md:space-y-1">
        <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</p>
        <h2 className={cn("text-xl md:text-2xl font-black tracking-tight leading-none mt-1", text)}>{value}</h2>
        <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-wider">{sub}</p>
      </div>
      <div className={cn("w-7 h-7 md:w-10 md:h-10 border bg-white flex items-center justify-center shrink-0", iconBorder)}>
        {icon}
      </div>
    </div>
  );
}

function ComplianceBadge({ status }: { status: string }) {
  const styles: any = {
    COMPLIANT: "bg-emerald-50 text-emerald-700 border-emerald-200",
    WARNING: "bg-amber-50 text-amber-700 border-amber-200",
    "NON-COMPLIANT": "bg-rose-50 text-rose-700 border-rose-200",
    TERJADWAL: "bg-blue-50 text-blue-700 border-blue-200",
    DIBATALKAN: "bg-slate-50 text-slate-500 border-slate-200",
  };

  const labels: any = {
    COMPLIANT: "PATUH",
    WARNING: "PERINGATAN",
    "NON-COMPLIANT": "TIDAK PATUH",
    TERJADWAL: "TERJADWAL",
    DIBATALKAN: "DIBATALKAN",
  };

  return (
    <Badge className={cn("px-2.5 py-0.5 rounded-none text-[9px] font-bold border uppercase tracking-widest border-none", styles[status])}>
      {labels[status]}
    </Badge>
  );
}