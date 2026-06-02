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
import { useSijagaStore } from '@/store/useSijagaStore';
import { toast } from "sonner";

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
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const completedInspections = inspections.filter(i => i.status === "Selesai");
  const countSelesai = completedInspections.length;
  const countTindakLanjut = completedInspections.filter(i => i.score !== null && i.score < 60).length;

  const averageScore = countSelesai > 0
    ? Math.round(completedInspections.reduce((sum, i) => sum + (i.score || 0), 0) / countSelesai)
    : 0;

  const filteredInspections = inspections.filter(i => {
    const query = searchTerm.toLowerCase();
    return i.id.toLowerCase().includes(query) ||
      i.companyName.toLowerCase().includes(query) ||
      i.inspectorName.toLowerCase().includes(query) ||
      (i.location && i.location.toLowerCase().includes(query));
  });

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Inspeksi Selesai" value={countSelesai.toLocaleString()} sub="Akumulasi Total" icon={<CheckCircle2 className="text-emerald-500" />} />
          <StatCard label="Perlu Tindak Lanjut" value={String(countTindakLanjut).padStart(2, '0')} sub="Skor Kepatuhan < 60" icon={<AlertTriangle className="text-amber-500" />} color="amber" />
          <StatCard label="Skor Rata-rata" value={`${averageScore}/100`} sub="Kepatuhan Daerah" icon={<ClipboardCheck className="text-blue-500" />} />
        </div>

        {/* --- TABLE AREA (DENSE) --- */}
        <div className="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b bg-slate-50 flex flex-col md:flex-row justify-between gap-3">
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
            <TableHeader className="bg-slate-50">
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
              {filteredInspections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 font-bold text-slate-400 text-xs">
                    Tidak ada riwayat inspeksi lapangan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInspections.map((item) => {
                  const complianceStatus = getComplianceStatus(item.status, item.score);
                  return (
                    <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors h-14">
                      <TableCell className="pl-4 font-black text-slate-900 text-xs">{item.id}</TableCell>
                      <TableCell>
                        <p className="font-bold text-slate-800 text-xs leading-none">{item.companyName}</p>
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
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="font-bold text-emerald-600 gap-1.5 hover:bg-emerald-50 rounded-none h-8 text-[9px] tracking-widest"
                            onClick={() => {
                              if (item.status === 'Selesai') {
                                toast.info(`BAP Detail: ${item.notes || 'TPS B3 dan IPAL memenuhi standar.'}`);
                              } else {
                                toast.warning(`Tugas Aktif: "${item.notes || 'Inspeksi kepatuhan lapangan.'}"`);
                              }
                            }}
                          >
                            <FileText size={12} /> BAP
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="font-bold text-amber-600 gap-1.5 hover:bg-amber-50 rounded-none h-8 text-[9px] tracking-widest border-amber-200"
                            onClick={() => {
                              if (item.status === 'Selesai') {
                                setSelectedInspection(item);
                                setIsFollowUpModalOpen(true);
                              } else {
                                toast.warning("Tindak lanjut hanya bisa dilakukan setelah inspeksi selesai.");
                              }
                            }}
                          >
                            <AlertTriangle size={12} /> TINDAK LANJUT
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
      </div>

      <CreateInspectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <FollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        inspection={selectedInspection}
      />
    </DashboardLayout>
  );
}

// --- SUB COMPONENTS ---

function StatCard({ label, value, sub, icon, color }: any) {
  const isWarning = color === "amber";
  const bg = isWarning ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200";
  const text = isWarning ? "text-amber-700" : "text-slate-800";
  const iconBorder = isWarning ? "border-amber-200" : "border-slate-100";

  return (
    <div className={cn("border p-4 shadow-sm flex items-start justify-between transition-colors", bg)}>
      <div className="space-y-1">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</p>
        <h2 className={cn("text-2xl font-black tracking-tight leading-none mt-1", text)}>{value}</h2>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{sub}</p>
      </div>
      <div className={cn("w-10 h-10 border bg-white flex items-center justify-center shrink-0", iconBorder)}>
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