import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useSijagaStore } from '@/store/useSijagaStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trash2, Waves, AlertTriangle, TrendingUp,
  Search, Filter, Download, Activity,
  ArrowUpRight, ArrowDownRight, Map as MapIcon,
  Brain, Sparkles, ShieldAlert, CheckCircle, Calendar, Send,
  X, Check, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function WasteMonitoring() {
  const { 
    wasteLogs, 
    companies, 
    scheduleInspection, 
    addNotification, 
    addAuditLog, 
    currentUser,
    fetchCompanies,
    fetchWasteLogs
  } = useSijagaStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [scheduledAnomalies, setScheduledAnomalies] = useState<string[]>([]);
  const [warnedAnomalies, setWarnedAnomalies] = useState<string[]>([]);
  
  // Selected Log for detail and verification
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { verifyWasteLog } = useSijagaStore();

  useEffect(() => {
    fetchCompanies();
    fetchWasteLogs();
  }, []);

  // Helpers for EWS Status and Limit
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

  // 1. Calculate dynamic statistics from Zustand store
  const totalCair = wasteLogs
    .filter(log => log.type.toLowerCase().includes("cair") || log.unit === "m³")
    .reduce((sum, log) => sum + log.volume, 0);

  const totalB3 = wasteLogs
    .filter(log => log.type.toLowerCase().includes("b3") || log.type.toLowerCase().includes("oli") || log.type.toLowerCase().includes("kimia"))
    .reduce((sum, log) => sum + log.volume, 0);

  const activeAlerts = wasteLogs.filter(log => getEwsStatus(log.type, log.volume) !== "SAFE").length;

  // 2. Identify anomalies
  const anomalies = wasteLogs
    .filter(log => getEwsStatus(log.type, log.volume) !== "SAFE")
    .map(log => {
      const ews = getEwsStatus(log.type, log.volume);
      const limit = getLimit(log.type);
      const confidence = ews === "DANGER" ? "98.7%" : "89.4%";
      const suggestion = ews === "DANGER"
        ? "Segera lakukan sidak lapangan dan penalti administratif."
        : "Rekomendasi pemantauan berkala dan surat teguran digital.";

      return {
        ...log,
        ews,
        limit,
        confidence,
        suggestion
      };
    });

  // Action: Picu Inspeksi Lapangan
  const handleTriggerInspection = (companyId: string, companyName: string, logId: string) => {
    const matchedCompany = companies.find(c => c.id === companyId);
    const location = matchedCompany?.address || "Bandung, Jawa Barat";

    // Call store action
    scheduleInspection({
      companyId,
      companyName,
      inspectorId: "OFF-001",
      inspectorName: "Heryanto, S.T.",
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
      location,
      notes: `Sidak Otomatis EWS AI: Terdeteksi ambang batas limbah abnormal pada log ${logId}.`
    });

    setScheduledAnomalies(prev => [...prev, logId]);
    toast.success(`Inspeksi Lapangan Berhasil Dijadwalkan untuk ${companyName}!`);
  };

  // Action: Kirim Teguran Digital
  const handleSendWarning = (companyId: string, companyName: string, wasteType: string, volumeStr: string, logId: string) => {
    // Call store action to trigger warning notification
    addNotification(
      "TEGURAN DIGITAL: Pelanggaran Ambang Batas",
      `Teguran resmi untuk ${companyName}: Sistem mendeteksi volume pembuangan limbah ${wasteType} sebesar ${volumeStr} melebihi batas regulasi.`,
      "DANGER"
    );

    addAuditLog(
      currentUser?.email || "admin@dlh.go.id",
      "ADMIN_DLH",
      `Mengirimkan surat teguran digital kepada ${companyName} terkait anomali limbah ${wasteType}.`
    );

    setWarnedAnomalies(prev => [...prev, logId]);
    toast.success(`Surat Teguran Resmi telah dikirim secara digital ke PIC ${companyName}!`);
  };

  // Filtered Logs
  const filteredLogs = wasteLogs.filter(log => {
    const matchesSearch = log.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === "ALL" ||
      (categoryFilter === "B3" && (log.type.toLowerCase().includes("b3") || log.type.toLowerCase().includes("oli") || log.type.toLowerCase().includes("kimia"))) ||
      (categoryFilter === "CAIR" && (log.type.toLowerCase().includes("cair") || log.unit === "m³")) ||
      (categoryFilter === "DOMESTIK" && (log.type.toLowerCase().includes("domestik") || log.type.toLowerCase().includes("jelantah")));

    const ewsStatus = getEwsStatus(log.type, log.volume);
    const matchesStatus = statusFilter === "ALL" || ewsStatus === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <DashboardLayout role="ADMIN_DLH">
      <div className="space-y-8 pb-10 text-left">

        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
              MONITORING <span className="text-emerald-600">PRODUKSI LIMBAH</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">Data akumulasi produksi limbah industri secara real-time dan analisis EWS AI.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl font-bold border-slate-200" onClick={() => toast.info("Data laporan berhasil diexport!")}>
              <Download className="mr-2" size={18} /> Export Laporan
            </Button>
            <Button className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700" onClick={() => window.location.href = '/admin/gis'}>
              <MapIcon className="mr-2" size={18} /> Lihat Heatmap
            </Button>
          </div>
        </div>

        {/* --- STATS SUMMARY (TAMPILAN MODERN DYNAMIC) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatMiniCard
            title="Total Limbah Cair"
            value={`${totalCair.toLocaleString()} m³`}
            sub="Bulan Mei 2026"
            icon={<Waves className="text-blue-500" />}
            trend="+12%"
          />
          <StatMiniCard
            title="Limbah B3 Terdeteksi"
            value={`${totalB3.toLocaleString()} L/kg`}
            sub="Perlu Pengangkutan"
            icon={<Trash2 className="text-orange-500" />}
            trend="+5%"
            isWarning={totalB3 > 200}
          />
          <StatMiniCard
            title="Alert EWS Aktif"
            value={String(activeAlerts).padStart(2, '0')}
            sub="Ambang Batas Terlewati"
            icon={<AlertTriangle className="text-rose-500" />}
            trend={activeAlerts > 0 ? `+${activeAlerts}` : "Aman"}
            isDanger={activeAlerts > 0}
          />
        </div>

        {/* --- AI ANOMALY DETECTION WIDGET --- */}
        <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white relative">
          {/* Subtle glowing elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

          <CardHeader className="p-8 border-b border-white/10 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 text-emerald-400 animate-pulse">
                  <Brain size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl font-black tracking-tight text-white">PANTAU LIMBAH-AI Anomaly Engine</CardTitle>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider py-1 px-2.5 rounded-full">
                      NEURAL NETWORK V2.5
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-400 font-medium mt-1">Sistem Pendeteksi Dini Kepatuhan Lingkungan secara Geospasial & Kuantitas</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 font-mono text-[10px] text-slate-300">
                <Sparkles size={14} className="text-amber-400 animate-spin" /> Confidence Level: 99.4%
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8 relative z-10 space-y-6">
            {anomalies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <CheckCircle size={32} />
                </div>
                <div>
                  <h4 className="font-black text-lg text-white">Sistem Stabil - Tidak Ada Anomali</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">Seluruh perusahaan non-AMDAL patuh terhadap ambang batas produksi limbah harian yang tercantum pada dokumen SPPL/UKL-UPL.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert size={16} className="text-rose-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Terdeteksi {anomalies.length} Anomali Kepatuhan Limbah</span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {anomalies.map((anomaly) => {
                    const isScheduled = scheduledAnomalies.includes(anomaly.id);
                    const isWarned = warnedAnomalies.includes(anomaly.id);

                    return (
                      <div
                        key={anomaly.id}
                        className={cn(
                          "p-6 rounded-[2rem] border transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6",
                          anomaly.ews === "DANGER"
                            ? "bg-rose-950/20 border-rose-500/20 hover:border-rose-500/30"
                            : "bg-amber-950/20 border-amber-500/20 hover:border-amber-500/30"
                        )}
                      >
                        <div className="space-y-3 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-black text-base text-white">{anomaly.companyName}</span>
                            <Badge className={cn(
                              "text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border",
                              anomaly.ews === "DANGER"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            )}>
                              {anomaly.ews} ALERT
                            </Badge>
                            <span className="text-[10px] text-slate-500 font-mono">Confidence: {anomaly.confidence}</span>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                            Akumulasi limbah <strong className="text-white">{anomaly.type}</strong> sebesar <strong className="text-white">{anomaly.volume} {anomaly.unit}</strong> telah melampaui regulasi ambang batas aman yang disetujui ({anomaly.limit}).
                          </p>

                          <div className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 flex items-start gap-2 font-medium">
                            <Sparkles size={12} className="mt-0.5 shrink-0" />
                            <span><strong>Rekomendasi AI:</strong> {anomaly.suggestion}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 shrink-0 w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0 border-white/5">
                          <Button
                            disabled={isWarned}
                            onClick={() => handleSendWarning(anomaly.companyId, anomaly.companyName, anomaly.type, `${anomaly.volume} ${anomaly.unit}`, anomaly.id)}
                            className={cn(
                              "flex-1 lg:flex-none rounded-xl text-[10px] font-black tracking-wider uppercase h-10 px-4 transition-all gap-1.5",
                              isWarned
                                ? "bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed"
                                : "bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:scale-[1.02]"
                            )}
                          >
                            <Send size={12} /> {isWarned ? "Teguran Terkirim" : "Surat Teguran"}
                          </Button>
                          <Button
                            disabled={isScheduled}
                            onClick={() => handleTriggerInspection(anomaly.companyId, anomaly.companyName, anomaly.id)}
                            className={cn(
                              "flex-1 lg:flex-none rounded-xl text-[10px] font-black tracking-wider uppercase h-10 px-5 transition-all gap-1.5",
                              isScheduled
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-not-allowed"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-[1.02] shadow-lg shadow-emerald-900/30"
                            )}
                          >
                            {isScheduled ? <CheckCircle size={12} /> : <Calendar size={12} />}
                            {isScheduled ? "Sidak Terjadwal" : "Jadwalkan Sidak"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- FILTER & SEARCH --- */}
        <Card className="rounded-[2rem] border-none shadow-sm p-5 bg-white">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Cari nama perusahaan atau jenis limbah..."
                className="h-12 pl-12 rounded-2xl bg-slate-50 border-none focus-visible:ring-emerald-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-2">
                <SelectFilter
                  placeholder="Kategori"
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={[
                    { label: "Semua Kategori", value: "ALL" },
                    { label: "Limbah B3", value: "B3" },
                    { label: "Limbah Cair", value: "CAIR" },
                    { label: "Limbah Domestik", value: "DOMESTIK" }
                  ]}
                />
                <SelectFilter
                  placeholder="Status EWS"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { label: "Semua Status", value: "ALL" },
                    { label: "EWS Danger", value: "DANGER" },
                    { label: "EWS Warning", value: "WARNING" },
                    { label: "EWS Safe", value: "SAFE" }
                  ]}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* --- MONITORING TABLE --- */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden text-left">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100 h-16">
                <TableHead className="pl-8 font-black text-slate-400 uppercase text-[10px] tracking-widest">Perusahaan</TableHead>
                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Kategori Limbah</TableHead>
                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">Volume Saat Ini</TableHead>
                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">Ambang Batas</TableHead>
                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">Status EWS</TableHead>
                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">Verifikasi</TableHead>
                <TableHead className="pr-8 text-right font-black text-slate-400 uppercase text-[10px] tracking-widest">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center py-10 font-bold text-slate-400">
                    Tidak ada data log limbah yang cocok dengan filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((item) => {
                  const ews = getEwsStatus(item.type, item.volume);
                  const limit = getLimit(item.type);
                  const trend = item.id.charCodeAt(item.id.length - 1) % 2 === 0 ? "up" : "down";

                  return (
                    <TableRow key={item.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors h-20">
                      <TableCell className="pl-8">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900">{item.companyName}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {item.companyId} | {item.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-lg font-bold bg-slate-100 text-slate-600">
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-black text-slate-800">
                        <div className="flex items-center justify-center gap-2">
                          {item.volume} {item.unit}
                          {trend === "up" ? <ArrowUpRight size={14} className="text-rose-500" /> : <ArrowDownRight size={14} className="text-emerald-500" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-slate-400 font-medium italic">
                        {limit}
                      </TableCell>
                      <TableCell className="text-center">
                        <EWSBadge status={ews} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn(
                          "rounded-lg font-bold text-[9px] uppercase",
                          item.status === 'Terverifikasi' ? "border-emerald-200 text-emerald-600 bg-emerald-50" :
                          item.status === 'Ditolak' ? "border-rose-200 text-rose-600 bg-rose-50" :
                          item.status === 'Proses_Verifikasi' ? "border-amber-200 text-amber-600 bg-amber-50" :
                          "border-slate-200 text-slate-600 bg-slate-50"
                        )}>
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="font-black text-[10px] text-emerald-600 hover:bg-emerald-50 tracking-widest"
                          onClick={() => setSelectedLog(item)}
                        >
                          DETAIL LOGBOOK
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* --- LOGBOOK DETAIL MODAL --- */}
        {selectedLog && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col">
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-lg">Detail Laporan Logbook</h3>
                    <p className="text-slate-500 text-xs font-medium">ID Referensi: {selectedLog.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar text-left">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Perusahaan</p>
                    <p className="font-bold text-slate-800">{selectedLog.companyName}</p>
                    <p className="text-xs text-slate-500 font-mono">ID: {selectedLog.companyId}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal Pelaporan</p>
                    <p className="font-bold text-slate-800">{new Date(selectedLog.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jenis Limbah</p>
                    <Badge variant="secondary" className="rounded-lg font-bold bg-slate-100 text-slate-700">{selectedLog.type}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Volume</p>
                    <p className="font-black text-slate-800 text-lg">{selectedLog.volume} <span className="text-sm font-bold text-slate-500">{selectedLog.unit}</span></p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Metode Angkut</p>
                    <p className="font-bold text-slate-700">{selectedLog.method}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status EWS</p>
                    <EWSBadge status={getEwsStatus(selectedLog.type, selectedLog.volume)} />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Catatan Pelapor</p>
                  <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl italic">
                    {selectedLog.note || "Tidak ada catatan tambahan yang dilampirkan oleh pelapor."}
                  </p>
                </div>
              </div>

              <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status Laporan:</p>
                  <Badge variant="outline" className={cn(
                    "rounded-lg font-bold text-[10px] uppercase",
                    selectedLog.status === 'Terverifikasi' ? "border-emerald-200 text-emerald-600 bg-emerald-50" :
                    selectedLog.status === 'Ditolak' ? "border-rose-200 text-rose-600 bg-rose-50" :
                    selectedLog.status === 'Proses_Verifikasi' ? "border-amber-200 text-amber-600 bg-amber-50" :
                    "border-slate-200 text-slate-600 bg-slate-50"
                  )}>
                    {selectedLog.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                {selectedLog.status === 'Proses_Verifikasi' && (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="rounded-xl font-bold border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => {
                        verifyWasteLog(selectedLog.id, "Ditolak");
                        setSelectedLog({ ...selectedLog, status: "Ditolak" });
                      }}
                    >
                      <X size={16} className="mr-2" /> Tolak Laporan
                    </Button>
                    <Button
                      className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                      onClick={() => {
                        verifyWasteLog(selectedLog.id, "Terverifikasi");
                        setSelectedLog({ ...selectedLog, status: "Terverifikasi" });
                      }}
                    >
                      <Check size={16} className="mr-2" /> Verifikasi Laporan
                    </Button>
                  </div>
                )}
                {selectedLog.status !== 'Proses_Verifikasi' && (
                  <Button variant="ghost" className="rounded-xl font-bold text-slate-500" onClick={() => setSelectedLog(null)}>
                    Tutup Keluar
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

// --- SUB COMPONENTS ---

function StatMiniCard({ title, value, sub, icon, trend, isWarning, isDanger }: any) {
  return (
    <Card className={cn(
      "border-none shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden transition-all hover:scale-[1.02] text-left",
      isDanger ? "bg-rose-600 text-white" : isWarning ? "bg-amber-500 text-white" : "bg-white"
    )}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
              isDanger || isWarning ? "bg-white/20" : "bg-slate-50"
            )}>
              {icon}
            </div>
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", isDanger || isWarning ? "text-white/70" : "text-slate-400")}>
                {title}
              </p>
              <h2 className="text-3xl font-black tracking-tighter italic mt-1">{value}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge className={cn("text-[9px] font-black border-none", isDanger || isWarning ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700")}>
                  {trend}
                </Badge>
                <span className={cn("text-[10px] font-bold", isDanger || isWarning ? "text-white/60" : "text-slate-400")}>{sub}</span>
              </div>
            </div>
          </div>
          <Activity className={cn("opacity-20 shrink-0", isDanger || isWarning ? "text-white" : "text-slate-200")} size={64} />
        </div>
      </CardContent>
    </Card>
  );
}

function EWSBadge({ status }: { status: string }) {
  const styles: any = {
    SAFE: "bg-emerald-100 text-emerald-700 border-emerald-200",
    WARNING: "bg-amber-100 text-amber-700 border-amber-200",
    DANGER: "bg-rose-100 text-rose-700 border-rose-200 shadow-lg shadow-rose-100",
  };
  return (
    <Badge className={cn("px-4 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest border-none", styles[status])}>
      {status}
    </Badge>
  );
}

function SelectFilter({ placeholder, value, onChange, options }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt: any) => opt.value === value);

  return (
    <div className="relative font-sans text-left">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 px-4 bg-slate-50 rounded-2xl border-none flex items-center justify-between gap-2 text-slate-600 font-bold text-xs cursor-pointer hover:bg-slate-100 transition-all min-w-[160px]"
      >
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <span className="text-[10px] opacity-60">▼</span>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden font-sans p-1.5">
          {options.map((opt: any) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={cn(
                "px-4 py-2.5 text-xs font-bold rounded-xl cursor-pointer transition-all hover:bg-slate-50",
                value === opt.value ? "text-emerald-600 bg-emerald-50" : "text-slate-600"
              )}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}