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

export default function OfficerInspectionsPage() {
  const { currentUser, inspections, submitInspectionResult } = useSijagaStore();
  const [selectedInsp, setSelectedInsp] = useState<any>(null);
  
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

  // Filter inspections for this officer
  const myInspections = inspections.filter(i => i.inspectorId === currentUser?.officerId || "OFF-001");
  const pendingAudits = myInspections.filter(i => i.status === "Terjadwal");
  const completedAudits = myInspections.filter(i => i.status === "Selesai");

  const startAudit = (insp: any) => {
    setSelectedInsp(insp);
    setTpsB3(false);
    setIpal(false);
    setApar(false);
    setNoise(false);
    setSafetyEquipment(false);
    setNotes("");
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
                    <div className="space-y-2 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800 text-sm">{insp.id}</span>
                        <Badge className="bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-black uppercase">
                          TERJADWAL
                        </Badge>
                      </div>
                      <h4 className="font-black text-slate-800 text-sm leading-none mt-1">{insp.companyName}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                        <MapPin size={10}/> {insp.location}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                        <CalendarDays size={10}/> Tanggal Audit: {insp.date}
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
                    <div className="space-y-1">
                      <p className="text-xs font-black text-slate-800 leading-none">{insp.id}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{insp.companyName}</p>
                      <p className="text-[10px] text-slate-400">Inspektur: {insp.inspectorName}</p>
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
