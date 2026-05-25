import React, { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  ClipboardCheck, MapPin, CalendarDays, CheckCircle2,
  AlertTriangle, Upload, Eye, PenTool, Sparkles, CheckSquare, Square
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function OfficerInspectionsPage() {
  const { currentUser, inspections, companies, fetchCompanies, fetchInspections, submitInspectionResult, scheduleInspection } = useSijagaStore();
  const [selectedInsp, setSelectedInsp] = useState<any>(null);

  useEffect(() => {
    fetchCompanies();
    fetchInspections();
  }, [fetchCompanies, fetchInspections]);

  // Checklist State
  const [tpsB3, setTpsB3] = useState(false);
  const [ipal, setIpal] = useState(false);
  const [apar, setApar] = useState(false);
  const [noise, setNoise] = useState(false);
  const [safetyEquipment, setSafetyEquipment] = useState(false);
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState("");

  // Canvas Signature State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  // Menampilkan semua inspeksi secara global (Open Pool Assignment)
  // Petugas tidak dibatasi oleh UUID, siapapun yang submit duluan akan menjadi inspector sah.
  const pendingAudits = inspections.filter(i => i.status === "Terjadwal");
  const completedAudits = inspections.filter(i => i.status === "Selesai");

  const startAudit = (insp: any) => {
    setSelectedInsp(insp);
    setTpsB3(insp.checklist?.tpsB3 || false);
    setIpal(insp.checklist?.ipal || false);
    setApar(insp.checklist?.apar || false);
    setNoise(insp.checklist?.noise || false);
    setSafetyEquipment(insp.checklist?.safetyEquipment || false);
    setNotes(insp.notes || "");
    setIsSigned(false);
    // Preset dummy photo path
    setPhoto("https://images.unsplash.com/photo-1513828742140-ccaa34f3ccd0?w=400&auto=format&fit=crop&q=60");
  };

  // Canvas drawing triggers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
    setIsSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsSigned(false);
  };

  // Setup canvas properties on load/modal open
  useEffect(() => {
    if (selectedInsp && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
      }
    }
  }, [selectedInsp]);

  const handleSubmitAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSigned) {
      toast.error("Tanda tangan BAP wajib dilengkapi.");
      return;
    }

    // Compute compliance score based on ticks
    let checkCount = 0;
    if (tpsB3) checkCount++;
    if (ipal) checkCount++;
    if (apar) checkCount++;
    if (noise) checkCount++;
    if (safetyEquipment) checkCount++;

    const calculatedScore = checkCount * 20; // 0 to 100

    submitInspectionResult(selectedInsp.id, calculatedScore, notes, {
      tpsB3, ipal, apar, noise, safetyEquipment
    });

    toast.success(`Evaluasi Kepatuhan Selesai. Skor: ${calculatedScore}/100.`);
    setSelectedInsp(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 font-black";
    if (score >= 60) return "text-amber-500 font-black";
    return "text-red-500 font-black";
  };

  // --- LOGIKA MONITORING PERUSAHAAN (30 HARI) ---
  // Tampilkan semua perusahaan yang ada di response (tidak di-filter by APPROVED)
  const monitoringData = companies.map(comp => {
    const compInspections = inspections.filter(i => i.companyId === comp.id);
    const isScheduled = compInspections.some(i => i.status === "Terjadwal");

    // Sort inspections DESC (newest first)
    const completedList = compInspections
      .filter(i => i.status === "Selesai")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const lastInspection = completedList[0];

    let statusLabel = "Belum Diinspeksi";
    let isOverdue = false;
    let daysSince = -1;

    if (lastInspection) {
      const lastDate = new Date(lastInspection.date);
      const today = new Date();
      daysSince = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

      if (daysSince > 30) {
        statusLabel = "Jatuh Tempo";
        isOverdue = true;
      } else {
        statusLabel = "Aman";
      }
    }

    // Jika sudah ada jadwal dan belum selesai, override status peringatannya
    if (isScheduled && statusLabel !== "Aman") {
      statusLabel = "Menunggu Pelaksanaan";
    }

    return {
      company: comp,
      lastInspection,
      statusLabel,
      isOverdue,
      daysSince,
      isScheduled
    };
  });

  const handleQuickSchedule = async (comp: any) => {
    // Schedule automatically for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    const newInsp = {
      companyId: comp.id,
      companyName: comp.companyName,
      inspectorId: currentUser?.officerId || currentUser?.id || "OFF-001",
      inspectorName: currentUser?.name || "Petugas DLH",
      date: dateStr,
      location: comp.address
    };

    try {
      await scheduleInspection(newInsp);
      toast.success(`Jadwal Inspeksi untuk ${comp.companyName} dibuat untuk ${dateStr}.`);
    } catch (e) {
      toast.error("Gagal membuat jadwal inspeksi.");
    }
  };

  return (
    <DashboardLayout role="PETUGAS_LAPANGAN">
      <div className="space-y-8 text-left">

        {/* Header */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Petugas Lapangan — Inspeksi Fisik</h1>
          <p className="text-slate-500 font-medium mt-2">Daftar penugasan audit kepatuhan lingkungan dan pelaporan Berita Acara Pemeriksaan (BAP).</p>
        </div>

        {/* Scheduled Audits list */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Active scheduled list */}
          <Card className="lg:col-span-7 rounded-[2rem] p-8 border-none shadow-xl shadow-slate-200/50 bg-white">
            <h3 className="font-black text-xl tracking-tight text-slate-800 mb-6">Jadwal Inspeksi Aktif</h3>

            {pendingAudits.length === 0 ? (
              <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                <CheckCircle2 className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-sm font-bold">Semua penugasan inspeksi telah diselesaikan!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingAudits.map((insp) => (
                  <div key={insp.id} className="p-5 border border-slate-100 rounded-2xl hover:bg-slate-50/50 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2 text-left w-full max-w-[60%]">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-800 text-lg leading-tight">{insp.company?.companyName || insp.companyName || "Perusahaan Tidak Diketahui"}</h4>
                        <Badge className="bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-black uppercase">
                          TERJADWAL
                        </Badge>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1 mt-1">
                        <MapPin size={10} /> {insp.location}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                        <CalendarDays size={10} /> Tanggal Audit: {insp.date}
                      </p>
                    </div>

                    <Button
                      onClick={() => startAudit(insp)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-4 text-xs font-bold shadow-md shadow-emerald-50 flex items-center gap-1.5"
                    >
                      Mulai Audit <PenTool size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* History completed list */}
          <Card className="lg:col-span-5 rounded-[2rem] p-8 border-none shadow-xl shadow-slate-200/50 bg-white">
            <h3 className="font-black text-xl tracking-tight text-slate-800 mb-6 font-sans">Riwayat Laporan BAP</h3>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 divide-y divide-slate-100">
              {completedAudits.length === 0 ? (
                <p className="text-sm text-slate-400 py-10 text-center font-bold">Belum ada riwayat laporan.</p>
              ) : (
                completedAudits.map((insp) => (
                  <div key={insp.id} className="pt-4 first:pt-0 flex justify-between items-center text-left">
                    <div className="space-y-1 w-full max-w-[65%]">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-black text-slate-800 leading-tight truncate">{insp.company?.companyName || insp.companyName || "Perusahaan Tidak Diketahui"}</h4>
                        <Badge className="bg-emerald-50 text-emerald-600 border-none text-[9px] font-black uppercase px-1.5 py-0">BAP Selesai</Badge>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">Inspektur: {insp.inspectorName}</p>
                    </div>

                    <div className="text-right">
                      <span className={`text-base font-black ${getScoreColor(insp.score || 0)}`}>
                        {insp.score}/100
                      </span>
                      <p className="text-[9px] font-black text-slate-400 uppercase mt-0.5">SCORE ESG</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Tabel Monitoring Status Perusahaan */}
        <Card className="rounded-[2rem] p-8 border-none shadow-xl shadow-slate-200/50 bg-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h3 className="font-black text-xl tracking-tight text-slate-800">Status Monitoring Keseluruhan</h3>
              <p className="text-sm font-medium text-slate-500">Mendeteksi perusahaan yang jatuh tempo inspeksi (Lebih dari 30 hari).</p>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-rose-50 text-rose-600 border-none font-bold">Jatuh Tempo</Badge>
              <Badge className="bg-amber-50 text-amber-600 border-none font-bold">Belum Diinspeksi</Badge>
              <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold">Aman (Bulan Ini)</Badge>
            </div>
          </div>

          <div className="overflow-hidden border border-slate-100 rounded-2xl">
            <Table>
              <TableHeader className="bg-slate-50/70">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[200px] font-black text-slate-400 uppercase text-[10px] tracking-widest pl-6">Perusahaan</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Alamat Lokasi</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Terakhir Diinspeksi</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Status Inspeksi</TableHead>
                  <TableHead className="text-right pr-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {monitoringData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 font-bold text-slate-400">Belum ada perusahaan yang terdaftar.</TableCell>
                  </TableRow>
                ) : (
                  monitoringData.map((row) => (
                    <TableRow key={row.company.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="pl-6">
                        <p className="font-black text-slate-800 text-sm leading-tight">{row.company.companyName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{row.company.docType}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-medium text-slate-600 max-w-[200px] truncate">{row.company.address}</p>
                      </TableCell>
                      <TableCell>
                        {row.lastInspection ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700 text-xs">{row.lastInspection.date}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{row.daysSince} Hari yang lalu</span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-400 italic">- Tidak Ada Data -</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "border-none text-[10px] font-black px-2.5 py-1",
                          row.statusLabel === "Aman" ? "bg-emerald-100 text-emerald-700" :
                            row.statusLabel === "Jatuh Tempo" ? "bg-rose-100 text-rose-700" :
                              row.statusLabel === "Menunggu Pelaksanaan" ? "bg-blue-100 text-blue-700" :
                                "bg-amber-100 text-amber-700"
                        )}>
                          {row.statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button
                          onClick={() => handleQuickSchedule(row.company)}
                          disabled={row.isScheduled || row.statusLabel === "Aman"}
                          variant="ghost"
                          className="h-8 rounded-lg text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                          + Buat Jadwal Besok
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Audit Modal Wizard */}
        {selectedInsp && (
          <Dialog open={!!selectedInsp} onOpenChange={() => setSelectedInsp(null)}>
            <DialogContent className="max-w-[550px] w-full rounded-[2.5rem] bg-white border border-slate-200 text-left p-8 overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-800">Evaluasi Fisik Lapangan</DialogTitle>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">Audit kesesuaian komitmen wajib SPPL/UKL-UPL</p>
              </DialogHeader>

              <form onSubmit={handleSubmitAudit} className="space-y-6 py-4">
                <div className="p-4 bg-slate-50 border rounded-2xl text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Objek Inspeksi</p>
                  <h4 className="text-base font-black text-slate-800 mt-0.5">{selectedInsp.companyName}</h4>
                  <p className="text-xs text-slate-500 font-medium mt-1">{selectedInsp.location}</p>
                </div>

                {/* Checklist parameters */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Kepatuhan Parameter Audit</label>

                  <div className="space-y-2">
                    <CheckRow checked={tpsB3} onClick={() => setTpsB3(!tpsB3)} label="TPS Limbah B3 berizin & memenuhi standar wadah" />
                    <CheckRow checked={ipal} onClick={() => setIpal(!ipal)} label="Instalasi Pengolahan Air Limbah (IPAL) beroperasi normal" />
                    <CheckRow checked={apar} onClick={() => setApar(!apar)} label="Sistem pencegah kebakaran & APAR terpasang di lokasi" />
                    <CheckRow checked={noise} onClick={() => setNoise(!noise)} label="Tingkat kebisingan & getaran mesin di bawah ambang batas dBA" />
                    <CheckRow checked={safetyEquipment} onClick={() => setSafetyEquipment(!safetyEquipment)} label="Peralatan K3 / APD lengkap dipakai operator" />
                  </div>
                </div>

                {/* Photo & Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Catatan Lapangan</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full min-h-[110px] rounded-xl border border-slate-200 p-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                      placeholder="Masukkan catatan audit fisik..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Foto Bukti Audit</label>
                    <div className="border border-slate-200 bg-slate-50 rounded-xl p-4 flex flex-col items-center justify-center text-center h-[110px] relative overflow-hidden">
                      <img src={photo} alt="Audit" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                      <div className="relative z-10 text-slate-700">
                        <Upload size={18} className="mx-auto" />
                        <span className="text-[10px] font-black uppercase mt-1 block">Foto Tersimpan</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Digital Signature Pad (Canvas) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Tanda Tangan Digital BAP</label>
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-[9px] font-black text-red-500 uppercase tracking-wider hover:underline"
                    >
                      Bersihkan
                    </button>
                  </div>

                  <div className="border border-slate-200 bg-slate-50 rounded-2xl p-1 relative">
                    <canvas
                      ref={canvasRef}
                      width={480}
                      height={120}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      className="w-full h-[120px] bg-white rounded-xl cursor-crosshair border"
                    />
                    {!isSigned && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium uppercase tracking-wider gap-2">
                        <PenTool size={14} /> Goreskan tanda tangan disini
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-1.5"
                  >
                    Submit Hasil Audit BAP <Sparkles size={16} />
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

      </div>
    </DashboardLayout>
  );
}

// --- SUB-COMPONENTS ---
function CheckRow({ checked, onClick, label }: { checked: boolean, onClick: () => void, label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${checked ? "border-emerald-500 bg-emerald-50/20 text-emerald-950" : "border-slate-100 hover:bg-slate-50 text-slate-600"}`}
    >
      {checked ? <CheckSquare className="text-emerald-600 shrink-0" size={18} /> : <Square className="text-slate-400 shrink-0" size={18} />}
      <span className="text-xs font-bold leading-tight">{label}</span>
    </button>
  );
}
