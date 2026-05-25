import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Search, Eye, RefreshCw, ClockIcon, CheckCircle2, 
  XCircle, AlertTriangle, FileText, Users
} from "lucide-react";
import { useSijagaStore } from '@/store/useSijagaStore';
import { DetailDrawer } from "./components/DetailDrawer";
import { cn } from "@/lib/utils";

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
  }, []);

  const handleOpenDetail = (reg: any) => {
    setSelectedReg(reg);
    setIsDrawerOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDrawerOpen(false);
    // Refresh list setelah menutup drawer agar status terbaru langsung tampil
    fetchCompanies();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCompanies();
    setIsRefreshing(false);
  };

  // Hitung jumlah per status secara dinamis
  const pendingCount  = companies.filter(c => c.status === "PENDING").length;
  const reviewCount   = companies.filter(c => c.status === "REVIEW").length;
  const approvedCount = companies.filter(c => c.status === "APPROVED").length;
  const rejectedCount = companies.filter(c => c.status === "REJECTED").length;

  // Tab filter config
  const tabs: { key: StatusFilter; label: string; count: number; icon: React.ReactNode; color: string; active: string }[] = [
    {
      key: "ALL",
      label: "Semua",
      count: companies.length,
      icon: <Users size={14} />,
      color: "text-slate-600",
      active: "bg-slate-900 text-white shadow-sm",
    },
    {
      key: "PENDING",
      label: "Pending",
      count: pendingCount,
      icon: <ClockIcon size={14} />,
      color: "text-blue-600",
      active: "bg-blue-600 text-white shadow-sm",
    },
    {
      key: "REVIEW",
      label: "Perlu Revisi",
      count: reviewCount,
      icon: <AlertTriangle size={14} />,
      color: "text-amber-600",
      active: "bg-amber-500 text-white shadow-sm",
    },
    {
      key: "APPROVED",
      label: "Disetujui",
      count: approvedCount,
      icon: <CheckCircle2 size={14} />,
      color: "text-emerald-600",
      active: "bg-emerald-600 text-white shadow-sm",
    },
    {
      key: "REJECTED",
      label: "Ditolak",
      count: rejectedCount,
      icon: <XCircle size={14} />,
      color: "text-red-600",
      active: "bg-red-600 text-white shadow-sm",
    },
  ];

  // Filter gabungan: status + pencarian
  const filteredCompanies = companies.filter(c => {
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesSearch =
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nib.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <DashboardLayout role="ADMIN_DLH">
      <div className="space-y-6 text-left">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
              VALIDASI <span className="text-emerald-600">REGISTRASI</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Verifikasi dan tindaklanjuti berkas lingkungan hidup (SPPL & UKL-UPL) yang masuk.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 font-bold border-slate-200 rounded-xl h-10 px-4 text-sm hover:bg-slate-50"
          >
            <RefreshCw size={15} className={cn(isRefreshing && "animate-spin")} />
            {isRefreshing ? "Memuat..." : "Refresh"}
          </Button>
        </div>

        {/* Status Tab Filter */}
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all border",
                statusFilter === tab.key
                  ? tab.active + " border-transparent"
                  : "bg-white border-slate-200 hover:bg-slate-50 " + tab.color
              )}
            >
              {tab.icon}
              {tab.label}
              <span className={cn(
                "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black",
                statusFilter === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search bar */}
        <Card className="rounded-2xl border-none shadow-sm p-4 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Cari Nama Perusahaan / NIB / No. Registrasi..." 
              className="pl-10 h-11 bg-slate-50 border-none rounded-xl font-medium" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>

        {/* Hasil filter label */}
        {(searchQuery || statusFilter !== "ALL") && (
          <p className="text-xs font-bold text-slate-400 -mt-2">
            Menampilkan <span className="text-slate-700">{filteredCompanies.length}</span> hasil
            {statusFilter !== "ALL" && <> · filter: <span className="text-emerald-600">{statusFilter}</span></>}
            {searchQuery && <> · pencarian: "<span className="text-emerald-600">{searchQuery}</span>"</>}
          </p>
        )}

        {/* Table */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/70">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="w-[150px] font-black text-slate-400 uppercase text-[10px] tracking-widest pl-8">No. Registrasi</TableHead>
                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Perusahaan</TableHead>
                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Jenis Dokumen</TableHead>
                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">KBLI</TableHead>
                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Dokumen</TableHead>
                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right pr-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <FileText size={32} className="opacity-40" />
                      <p className="font-bold text-sm">Tidak ada berkas yang sesuai filter</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies.map((c) => {
                  const hasAllDocs = !!(c as any).docNibUrl && !!(c as any).docNpwpUrl;
                  return (
                    <TableRow key={c.id} className="border-slate-50 hover:bg-slate-50/60 transition-colors group">
                      <TableCell className="font-mono font-bold text-slate-500 pl-8 text-xs">
                        {c.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{c.companyName}</span>
                          <span className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{c.address}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "border-none font-black text-[10px]",
                          (c.docType === "UKL-UPL" || c.docType === "UKL_UPL")
                            ? "bg-indigo-50 text-indigo-700"
                            : "bg-emerald-50 text-emerald-700"
                        )}>
                          {(c.docType === "UKL_UPL") ? "UKL-UPL" : c.docType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 font-medium text-sm">{c.kbli || "-"}</TableCell>
                      <TableCell>
                        {hasAllDocs ? (
                          <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600">
                            <CheckCircle2 size={11} /> Lengkap
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-black text-amber-500">
                            <AlertTriangle size={11} /> Tidak Lengkap
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-emerald-600 font-bold hover:bg-emerald-50 hover:text-emerald-700 rounded-xl gap-1.5"
                          onClick={() => handleOpenDetail(c)}
                        >
                          <Eye size={15} /> Periksa Berkas
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

      {/* Drawer detail dokumen */}
      <DetailDrawer 
        isOpen={isDrawerOpen} 
        onClose={handleCloseDetail} 
        data={selectedReg} 
      />
    </DashboardLayout>
  );
}

// --- Sub Component ---
function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, string> = {
    PENDING:  "bg-blue-100 text-blue-700",
    REVIEW:   "bg-amber-100 text-amber-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
  };
  return (
    <Badge className={`${configs[status] || "bg-slate-100 text-slate-500"} border-none px-3 py-1 rounded-full text-[10px] font-black`}>
      {status}
    </Badge>
  );
}