// src/modules/admin/WasteMonitoring.tsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useSijagaStore } from '@/store/useSijagaStore';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trash2, Waves, AlertTriangle, TrendingUp,
  Search, Filter, Download, Activity,
  ArrowUpRight, ArrowDownRight, Map as MapIcon,
  Brain, Sparkles, CheckCircle, Calendar, Send,
  X, Check, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PaginationControls } from "@/components/ui/pagination-controls";

export default function WasteMonitoring() {
  const {
    wasteLogs, companies, scheduleInspection,
    addNotification, addAuditLog, currentUser,
    fetchCompanies, fetchWasteLogs, verifyWasteLog
  } = useSijagaStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [scheduledAnomalies, setScheduledAnomalies] = useState<string[]>([]);
  const [warnedAnomalies, setWarnedAnomalies] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Selected Log for detail and verification [3]
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    fetchCompanies();
    fetchWasteLogs();
  }, [fetchCompanies, fetchWasteLogs]);

  const getEwsStatus = (type: string, volume: number) => {
    const isB3 = type.toLowerCase().includes("b3") || type.toLowerCase().includes("oli") || type.toLowerCase().includes("kimia");
    if (isB3) {
      if (volume > 80) return "DANGER";
      if (volume > 40) return "WARNING";
    } else {
      if (volume > 100) return "DANGER";
      if (volume > 50) return "WARNING";
    }
    return "SAFE";
  };

  const getLimit = (type: string) => {
    const isB3 = type.toLowerCase().includes("b3") || type.toLowerCase().includes("oli") || type.toLowerCase().includes("kimia");
    return isB3 ? "80 kg/L" : "100 m³";
  };

  const totalCair = wasteLogs.filter(log => log.type.toLowerCase().includes("cair") || log.unit === "m³").reduce((sum, log) => sum + log.volume, 0);
  const totalB3 = wasteLogs.filter(log => log.type.toLowerCase().includes("b3") || log.type.toLowerCase().includes("oli") || log.type.toLowerCase().includes("kimia")).reduce((sum, log) => sum + log.volume, 0);
  const activeAlerts = wasteLogs.filter(log => getEwsStatus(log.type, log.volume) !== "SAFE").length;

  const anomalies = wasteLogs
    .filter(log => getEwsStatus(log.type, log.volume) !== "SAFE")
    .map(log => {
      const ews = getEwsStatus(log.type, log.volume);
      return {
        ...log,
        ews,
        limit: getLimit(log.type),
        confidence: ews === "DANGER" ? "98.7%" : "89.4%",
        suggestion: ews === "DANGER" ? "Segera lakukan sidak lapangan dan penalti administratif." : "Rekomendasi pemantauan berkala dan surat teguran."
      };
    });

  const handleTriggerInspection = (companyId: string, companyName: string, logId: string) => {
    const matchedCompany = companies.find(c => c.id === companyId);
    scheduleInspection({
      companyId, companyName, inspectorId: "OFF-001", inspectorName: "Heryanto, S.T.",
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      location: matchedCompany?.address || "Bandung",
      notes: `Sidak Otomatis EWS AI: Terdeteksi ambang batas limbah abnormal pada log ${logId}.`
    });
    setScheduledAnomalies(prev => [...prev, logId]);
    toast.success(`Inspeksi Lapangan Berhasil Dijadwalkan untuk ${companyName}!`);
  };

  const handleSendWarning = (companyId: string, companyName: string, wasteType: string, volumeStr: string, logId: string) => {
    addNotification("TEGURAN DIGITAL: Pelanggaran Ambang Batas", `Teguran resmi untuk ${companyName}: Sistem mendeteksi pembuangan ${wasteType} sebesar ${volumeStr}.`, "DANGER");
    setWarnedAnomalies(prev => [...prev, logId]);
    toast.success(`Surat Teguran Resmi terkirim ke ${companyName}!`);
  };

  const filteredLogs = wasteLogs.filter(log => {
    const matchesSearch = log.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || log.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" ||
      (categoryFilter === "B3" && (log.type.toLowerCase().includes("b3") || log.type.toLowerCase().includes("oli") || log.type.toLowerCase().includes("kimia"))) ||
      (categoryFilter === "CAIR" && (log.type.toLowerCase().includes("cair") || log.unit === "m³")) ||
      (categoryFilter === "DOMESTIK" && (log.type.toLowerCase().includes("domestik") || log.type.toLowerCase().includes("jelantah")));
    const matchesStatus = statusFilter === "ALL" || getEwsStatus(log.type, log.volume) === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Reset pagination on filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <DashboardLayout role="ADMIN_DLH">
      <div className="space-y-4 text-left animate-in fade-in duration-300"> {/* DIET: space-y-8 -> space-y-4 */}

        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
              Monitoring <span className="text-emerald-600">Limbah</span>
            </h1>
            <p className="text-slate-500 text-xs font-medium mt-1.5">Data akumulasi produksi limbah industri & analisis EWS AI.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" className="rounded-none font-bold border-slate-300 text-[10px]" onClick={() => toast.info("Exporting...")}>
              <Download className="mr-1.5" size={14} /> EXPORT
            </Button>
            <Button size="sm" className="rounded-none font-bold bg-emerald-600 hover:bg-emerald-700 text-[10px]" onClick={() => window.location.href = '/admin/gis'}>
              <MapIcon className="mr-1.5" size={14} /> HEATMAP
            </Button>
          </div>
        </div>

        {/* --- STATS SUMMARY (DIET PADDING & RADIUS) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatMiniCard title="Total Limbah Cair" value={`${totalCair.toLocaleString()} m³`} sub="Mei 2026" icon={<Waves size={16} />} color="blue" trend="+12%" />
          <StatMiniCard title="Limbah B3 Terdeteksi" value={`${totalB3.toLocaleString()} kg`} sub="Perlu Angkut" icon={<Trash2 size={16} />} color="orange" trend="+5%" isWarning={totalB3 > 200} />
          <StatMiniCard title="Alert EWS Aktif" value={String(activeAlerts).padStart(2, '0')} sub="Over-limit" icon={<AlertTriangle size={16} />} color="red" trend={activeAlerts > 0 ? `+${activeAlerts}` : "Aman"} isDanger={activeAlerts > 0} />
        </div>

        {/* --- AI ANOMALY DETECTION WIDGET --- */}
        <div className="bg-slate-900 text-white relative">
          <div className="p-4 flex flex-col gap-3 relative z-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

          <div className="p-4 border-b border-white/10 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-none">
                <Brain size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black tracking-widest uppercase">EWS Anomaly Engine</h3>
                  <Badge className="bg-emerald-500/20 text-emerald-400 rounded-none text-[8px] font-black border-none tracking-widest px-2">v2.5</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 text-[9px] text-slate-300 uppercase tracking-widest font-bold rounded-none">
              <Sparkles size={12} className="text-amber-400" /> Conf: 99.4%
            </div>
          </div>

          <div className="p-0 relative z-10">
            {anomalies.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center">
                <CheckCircle size={24} className="text-emerald-400 mb-2" />
                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Sistem Stabil</p>
                <p className="text-[10px] text-slate-500 mt-1">Seluruh pelaporan berada dalam ambang batas wajar.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-white/5">
                {anomalies.map((anomaly) => {
                  const isScheduled = scheduledAnomalies.includes(anomaly.id);
                  const isWarned = warnedAnomalies.includes(anomaly.id);

                  return (
                    <div key={anomaly.id} className={cn("p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 transition-colors hover:bg-white/5", anomaly.ews === "DANGER" ? "bg-rose-950/20" : "bg-amber-950/20")}>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm uppercase">{anomaly.companyName}</span>
                          <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 border rounded-none", anomaly.ews === "DANGER" ? "bg-rose-500/10 text-rose-400 border-rose-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/30")}>
                            {anomaly.ews}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">Volume <span className="font-bold text-white">{anomaly.type} ({anomaly.volume} {anomaly.unit})</span> melampaui limit {anomaly.limit}.</p>
                        <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest mt-1 leading-none">Rekomendasi: {anomaly.suggestion}</p>
                      </div>

                      <div className="flex gap-2 w-full lg:w-auto">
                        <Button
                          disabled={isWarned} size="sm"
                          onClick={() => handleSendWarning(anomaly.companyId, anomaly.companyName, anomaly.type, `${anomaly.volume} ${anomaly.unit}`, anomaly.id)}
                          className={cn("flex-1 lg:flex-none rounded-none text-[9px] font-bold h-8 px-3 transition-colors", isWarned ? "bg-white/10 text-slate-500" : "bg-white/10 hover:bg-white/20 text-white")}
                        >
                          <Send size={10} className="mr-1.5" /> {isWarned ? "TERKIRIM" : "TEGURAN"}
                        </Button>
                        <Button
                          disabled={isScheduled} size="sm"
                          onClick={() => handleTriggerInspection(anomaly.companyId, anomaly.companyName, anomaly.id)}
                          className={cn("flex-1 lg:flex-none rounded-none text-[9px] font-bold h-8 px-3 transition-colors", isScheduled ? "bg-emerald-500/20 text-emerald-500" : "bg-emerald-600 hover:bg-emerald-700 text-white")}
                        >
                          {isScheduled ? <CheckCircle size={10} className="mr-1.5" /> : <Calendar size={10} className="mr-1.5" />}
                          {isScheduled ? "TERJADWAL" : "SIDAK"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* --- FILTER & SEARCH (COMPACT) --- */}
        <div className="py-2 border-y border-slate-200 bg-transparent">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input
                placeholder="Cari perusahaan atau limbah..."
                className="h-9 pl-9 rounded-none border-slate-200 bg-slate-50 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <SelectFilter placeholder="Kategori" value={categoryFilter} onChange={setCategoryFilter} options={[{ label: "Semua", value: "ALL" }, { label: "B3", value: "B3" }, { label: "Cair", value: "CAIR" }, { label: "Domestik", value: "DOMESTIK" }]} />
              <SelectFilter placeholder="Status EWS" value={statusFilter} onChange={setStatusFilter} options={[{ label: "Semua", value: "ALL" }, { label: "Danger", value: "DANGER" }, { label: "Warning", value: "WARNING" }, { label: "Safe", value: "SAFE" }]} />
            </div>
          </div>
        </div>

        {/* --- MONITORING TABLE (GFW DENSE - DESKTOP) --- */}
        <div className="hidden md:block bg-transparent overflow-hidden text-left">
          <Table>
            <TableHeader className="bg-slate-50 border-y border-slate-200">
              <TableRow className="border-b border-slate-200 h-10">
                <TableHead className="pl-4 font-black text-slate-500 uppercase text-[9px] tracking-widest">Perusahaan</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Kategori Limbah</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center">Volume Saat Ini</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center">Ambang Batas</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center">Status EWS</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center">Verifikasi</TableHead>
                <TableHead className="pr-4 text-right font-black text-slate-500 uppercase text-[9px] tracking-widest">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 font-bold text-slate-400 text-xs uppercase tracking-widest">Tidak ada data log limbah.</TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map((item) => {
                  const ews = getEwsStatus(item.type, item.volume);
                  const limit = getLimit(item.type);
                  const trend = item.id.charCodeAt(item.id.length - 1) % 2 === 0 ? "up" : "down";

                  return (
                    <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors h-14">
                      <TableCell className="pl-4">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-slate-800 text-xs leading-none">{item.companyName}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 leading-none">{item.date} • {item.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 uppercase">{item.type}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5 font-bold text-sm text-slate-800">
                          {item.volume} {item.unit}
                          {trend === "up" ? <ArrowUpRight size={12} className="text-rose-500" /> : <ArrowDownRight size={12} className="text-emerald-500" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-[11px] text-slate-500 font-medium">
                        {limit}
                      </TableCell>
                      <TableCell className="text-center">
                        <EWSBadge status={ews} />
                      </TableCell>

                      {/* Kolom Status Verifikasi Taktis GFW [3] */}
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn(
                          "rounded-none font-bold text-[8px] border uppercase tracking-widest shadow-none",
                          item.status === 'Terverifikasi' ? "border-emerald-200 text-emerald-600 bg-emerald-50" :
                            item.status === 'Ditolak' ? "border-rose-200 text-rose-600 bg-rose-50" :
                              item.status === 'Proses_Verifikasi' ? "border-amber-200 text-amber-600 bg-amber-50" :
                                "border-slate-200 text-slate-600 bg-slate-50"
                        )}>
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right pr-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Detail Logbook"
                          className="text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-none h-8 w-8 p-0 outline-none"
                          onClick={() => setSelectedLog(item)}
                        >
                          <FileText size={13} />
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
          {paginatedLogs.length === 0 ? (
            <div className="text-center py-10 bg-white border border-slate-200 shadow-sm">
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <AlertTriangle size={24} className="opacity-40" />
                <p className="font-black text-[10px] uppercase tracking-widest">Tidak ada data log limbah</p>
              </div>
            </div>
          ) : (
            paginatedLogs.map((item) => {
              const ews = getEwsStatus(item.type, item.volume);
              const limit = getLimit(item.type);
              const trend = item.id.charCodeAt(item.id.length - 1) % 2 === 0 ? "up" : "down";

              return (
                <div key={item.id} className="bg-transparent py-4 flex flex-col gap-3 relative overflow-hidden">
                  {/* Status Strip */}
                  <div className={cn("absolute top-0 left-0 w-1 h-full", 
                    ews === "SAFE" ? "bg-emerald-500" :
                    ews === "WARNING" ? "bg-amber-500" : "bg-rose-500"
                  )} />

                  {/* Header */}
                  <div className="flex justify-between items-start gap-2 pt-0 pl-3 text-left">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-xs leading-tight">{item.companyName}</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">{item.date} • {item.id}</span>
                    </div>
                    <div className="shrink-0"><EWSBadge status={ews} /></div>
                  </div>

                  {/* Data Grids */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 pl-3 text-left">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Kategori</span>
                      <span className="font-bold text-slate-700 mt-0.5">{item.type}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Volume (Batas: {limit})</span>
                      <div className="flex items-center gap-1.5 font-black text-slate-800 mt-0.5 text-sm">
                        {item.volume} {item.unit}
                        {trend === "up" ? <ArrowUpRight size={12} className="text-rose-500" /> : <ArrowDownRight size={12} className="text-emerald-500" />}
                      </div>
                    </div>
                  </div>

                  {/* Footer / Actions */}
                  <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-1 pl-3">
                    <div className="flex-1 text-left">
                      <Badge variant="outline" className={cn(
                        "rounded-none font-bold text-[8px] border uppercase tracking-widest shadow-none",
                        item.status === 'Terverifikasi' ? "border-emerald-200 text-emerald-600 bg-emerald-50" :
                          item.status === 'Ditolak' ? "border-rose-200 text-rose-600 bg-rose-50" :
                            item.status === 'Proses_Verifikasi' ? "border-amber-200 text-amber-600 bg-amber-50" :
                              "border-slate-200 text-slate-600 bg-slate-50"
                      )}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-black text-[9px] text-emerald-600 hover:bg-emerald-50 tracking-widest h-8 rounded-none outline-none"
                      onClick={() => setSelectedLog(item)}
                    >
                      DETAIL
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
        {selectedLog && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-none shadow-none w-full max-w-xl overflow-hidden border border-slate-300 flex flex-col">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-none bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-200">
                    <FileText size={18} />
                  </div>
                  <div className="text-left font-sans">
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest leading-none">Detail Laporan Logbook</h3>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-wider mt-1.5 leading-none">ID Referensi: {selectedLog.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="p-1 rounded-none hover:bg-slate-200 text-slate-500 transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh] custom-scrollbar text-left font-sans">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1 text-left">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Nama Perusahaan</p>
                    <p className="font-bold text-slate-800 text-xs leading-none uppercase">{selectedLog.companyName}</p>
                    <p className="text-[9px] text-slate-400 font-mono mt-1 leading-none">ID: {selectedLog.companyId}</p>
                  </div>
                  <div className="space-y-1 text-left">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Tanggal Pelaporan</p>
                    <p className="font-bold text-slate-850 text-xs leading-none uppercase">
                      {new Date(selectedLog.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-5 grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Jenis Limbah</p>
                    <Badge variant="secondary" className="rounded-none font-bold bg-slate-100 text-slate-700 text-[10px] tracking-wider uppercase border-none">{selectedLog.type}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Total Volume</p>
                    <p className="font-black text-slate-850 text-lg leading-none">{selectedLog.volume} <span className="text-xs font-bold text-slate-500">{selectedLog.unit}</span></p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Metode Angkut</p>
                    <p className="font-bold text-slate-700 text-xs leading-none uppercase">{selectedLog.method}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Status EWS</p>
                    <EWSBadge status={getEwsStatus(selectedLog.type, selectedLog.volume)} />
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-5 space-y-1.5">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Catatan Pelapor</p>
                  <p className="text-xs text-slate-600 bg-slate-50 p-4 border rounded-none italic font-medium leading-relaxed">
                    {selectedLog.note || "Tidak ada catatan tambahan yang dilampirkan oleh pelapor."}
                  </p>
                </div>
              </div>

              {/* Verification Actions (Only for 'Proses_Verifikasi') [3] */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4 font-sans">
                <div className="flex items-center gap-2">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Status Laporan:</p>
                  <Badge variant="outline" className={cn(
                    "rounded-none font-bold text-[8px] uppercase tracking-widest border",
                    selectedLog.status === 'Terverifikasi' ? "border-emerald-200 text-emerald-600 bg-emerald-50" :
                      selectedLog.status === 'Ditolak' ? "border-rose-200 text-rose-600 bg-rose-50" :
                        selectedLog.status === 'Proses_Verifikasi' ? "border-amber-200 text-amber-600 bg-amber-50" :
                          "border-slate-200 text-slate-600 bg-slate-50"
                  )}>
                    {selectedLog.status.replace('_', ' ')}
                  </Badge>
                </div>

                {selectedLog.status === 'Proses_Verifikasi' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="rounded-none h-9 px-4 text-[9px] font-black uppercase tracking-widest border-rose-300 text-rose-600 hover:bg-rose-50 shadow-none"
                      onClick={() => {
                        verifyWasteLog(selectedLog.id, "Ditolak");
                        setSelectedLog({ ...selectedLog, status: "Ditolak" });
                        toast.error(`Laporan ${selectedLog.id} ditolak.`);
                      }}
                    >
                      <X size={12} className="mr-1.5" /> Tolak Laporan
                    </Button>
                    <Button
                      className="rounded-none h-9 px-4 text-[9px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-none"
                      onClick={() => {
                        verifyWasteLog(selectedLog.id, "Terverifikasi");
                        setSelectedLog({ ...selectedLog, status: "Terverifikasi" });
                        toast.success(`Laporan ${selectedLog.id} terverifikasi.`);
                      }}
                    >
                      <Check size={12} className="mr-1.5" /> Verifikasi Laporan
                    </Button>
                  </div>
                )}
                {selectedLog.status !== 'Proses_Verifikasi' && (
                  <Button variant="ghost" className="rounded-none h-9 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200" onClick={() => setSelectedLog(null)}>
                    Tutup Keluar
                  </Button>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
      </div>
    </DashboardLayout>
  );
}

// --- SUB COMPONENTS ---

// DIET: Compact Box Style
function StatMiniCard({ title, value, sub, icon, color, isWarning, isDanger }: any) {
  const bg = isDanger ? "bg-rose-50 border-rose-200" : isWarning ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200";
  const text = isDanger ? "text-rose-700" : isWarning ? "text-amber-700" : "text-slate-800";
  const iconColor = isDanger ? "text-rose-600" : isWarning ? "text-amber-600" : "text-emerald-600";

  return (
    <div className={cn("border p-4 shadow-sm flex items-start gap-4 transition-colors rounded-none", bg)}>
      <div className={cn("w-10 h-10 border bg-white flex items-center justify-center shrink-0 rounded-none", iconColor, isDanger ? "border-rose-200" : "border-slate-100")}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{title}</p>
        <h2 className={cn("text-xl font-black tracking-tight leading-none mt-1", text)}>{value}</h2>
        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{sub}</p>
      </div>
    </div>
  );
}

function EWSBadge({ status }: { status: string }) {
  const styles: any = {
    SAFE: "text-emerald-600",
    WARNING: "text-amber-600",
    DANGER: "text-rose-600",
  };
  return (
    <div className={cn("flex items-center justify-center gap-1.5 font-black text-[9px] uppercase tracking-widest", styles[status] || "text-slate-500")}>
      <span className="w-1.5 h-1.5 rounded-full currentColor bg-current" />
      {status}
    </div>
  );
}

function SelectFilter({ placeholder, value, onChange, options }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt: any) => opt.value === value);

  return (
    <div className="relative font-sans text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3 bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-slate-600 font-bold text-[10px] uppercase tracking-wider hover:bg-slate-100 transition-colors min-w-[120px]"
      >
        <div className="flex items-center gap-1.5">
          <Filter size={12} className="text-slate-400" />
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <span className="text-[8px] opacity-60">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-full bg-white border border-slate-200 shadow-md z-50 overflow-hidden font-sans p-1">
          {options.map((opt: any) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors hover:bg-slate-50",
                value === opt.value ? "text-emerald-600 bg-emerald-50" : "text-slate-600"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}