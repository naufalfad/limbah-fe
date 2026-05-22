import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ClipboardCheck, Camera, Search, Plus, 
  Filter, FileText, CheckCircle2, AlertTriangle, 
  XCircle, MapPin, User, CalendarDays
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateInspectionModal } from "./components/CreateInspectionModal";
import { useSijagaStore } from '@/store/useSijagaStore';
import { toast } from "sonner";

export default function InspectionManagement() {
  const { inspections, fetchInspections, fetchCompanies } = useSijagaStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInspections();
    fetchCompanies();
  }, []);

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
      <div className="space-y-8 pb-10 text-left">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
              INSPEKSI <span className="text-emerald-600">LAPANGAN</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">Audit fisik dan penilaian kepatuhan lingkungan hidup pelaku usaha.</p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="rounded-2xl font-black bg-slate-900 hover:bg-emerald-600 shadow-xl transition-all h-14 px-8 text-lg"
          >
            <Plus className="mr-2" size={20} /> INPUT HASIL INSPEKSI
          </Button>
        </div>

        {/* --- STATS SUMMARY --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Inspeksi Selesai" value={countSelesai.toLocaleString()} sub="Akumulasi Total" icon={<CheckCircle2 className="text-emerald-500" />} />
          <StatCard label="Perlu Tindak Lanjut" value={String(countTindakLanjut).padStart(2, '0')} sub="Skor Kepatuhan < 60" icon={<AlertTriangle className="text-amber-500" />} color="amber" />
          <StatCard label="Skor Rata-rata" value={`${averageScore}/100`} sub="Kepatuhan Daerah" icon={<ClipboardCheck className="text-blue-500" />} />
        </div>

        {/* --- TABLE AREA --- */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="Cari perusahaan atau petugas..." 
                className="h-12 pl-12 rounded-2xl bg-white border-slate-200 font-medium" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="h-12 rounded-2xl border-slate-200 font-bold gap-2 text-slate-600" onClick={() => toast.info("Filter Laporan Aktif")}>
              <Filter size={18} /> Filter Laporan
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100 h-16">
                <TableHead className="pl-8 font-black text-slate-400 uppercase text-[10px] tracking-widest">ID Inspeksi</TableHead>
                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Perusahaan</TableHead>
                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">Tgl Inspeksi</TableHead>
                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">Skor Kepatuhan</TableHead>
                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                <TableHead className="pr-8 text-right font-black text-slate-400 uppercase text-[10px] tracking-widest">Dokumen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInspections.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center py-10 font-bold text-slate-400">
                    Tidak ada riwayat inspeksi lapangan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInspections.map((item) => {
                  const complianceStatus = getComplianceStatus(item.status, item.score);
                  return (
                    <TableRow key={item.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors h-24">
                      <TableCell className="pl-8 font-black text-slate-900">{item.id}</TableCell>
                      <TableCell>
                        <p className="font-black text-slate-800">{item.companyName}</p>
                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
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
                              "text-lg font-black tracking-tighter",
                              item.score >= 80 ? "text-emerald-600" : item.score >= 60 ? "text-amber-500" : "text-rose-600"
                            )}>{item.score}/100</span>
                            <div className="w-16 h-1 bg-slate-100 rounded-full mt-1">
                              <div className={cn(
                                "h-full rounded-full",
                                item.score >= 80 ? "bg-emerald-500" : item.score >= 60 ? "bg-amber-500" : "bg-rose-500"
                              )} style={{ width: `${item.score}%` }} />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-bold text-xs italic">Belum Dinilai</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <ComplianceBadge status={complianceStatus} />
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="font-black text-emerald-600 gap-2 hover:bg-emerald-50"
                          onClick={() => {
                            if (item.status === 'Selesai') {
                              toast.info(`BAP Detail: ${item.notes || 'TPS B3 dan IPAL memenuhi standar.'}`);
                            } else {
                              toast.warning("BAP belum diterbitkan (Inspeksi Terjadwal).");
                            }
                          }}
                        >
                          <FileText size={16} /> BAP
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

      <CreateInspectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </DashboardLayout>
  );
}

// --- SUB COMPONENTS ---

function StatCard({ label, value, sub, icon, color }: any) {
  return (
    <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2.5rem] p-8 bg-white hover:translate-y-[-5px] transition-all">
      <div className="flex justify-between items-start text-left">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
            {icon}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{label}</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic">{value}</h2>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{sub}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ComplianceBadge({ status }: { status: string }) {
  const styles: any = {
    COMPLIANT: "bg-emerald-100 text-emerald-700 border-emerald-200",
    WARNING: "bg-amber-100 text-amber-700 border-amber-200",
    "NON-COMPLIANT": "bg-rose-100 text-rose-700 border-rose-200 animate-pulse shadow-sm shadow-rose-100 border-none",
    TERJADWAL: "bg-blue-100 text-blue-700 border-blue-200 border-none",
    DIBATALKAN: "bg-slate-100 text-slate-500 border-slate-200 border-none",
  };
  
  const labels: any = {
    COMPLIANT: "PATUH",
    WARNING: "PERINGATAN",
    "NON-COMPLIANT": "TIDAK PATUH",
    TERJADWAL: "TERJADWAL",
    DIBATALKAN: "DIBATALKAN",
  };

  return (
    <Badge className={cn("px-4 py-1.5 rounded-full text-[9px] font-black border uppercase tracking-widest border-none", styles[status])}>
      {labels[status]}
    </Badge>
  );
}