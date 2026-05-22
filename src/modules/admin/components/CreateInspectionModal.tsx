import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  ClipboardList, Camera, CheckCircle2, 
  X, Building2, CalendarDays, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSijagaStore } from "@/store/useSijagaStore";
import { toast } from "sonner";

export function CreateInspectionModal({ isOpen, onClose }: any) {
  const { currentUser, companies, scheduleInspection, submitInspectionResult, fetchCompanies } = useSijagaStore();

  // Form State
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Checklist State
  const [tpsB3, setTpsB3] = useState(false);
  const [ipal, setIpal] = useState(false);
  const [apar, setApar] = useState(false);
  const [noise, setNoise] = useState(false);
  const [safetyEquipment, setSafetyEquipment] = useState(false);

  // Fetch approved companies on open
  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
    }
  }, [isOpen, fetchCompanies]);

  const approvedCompanies = companies.filter(c => c.status === "APPROVED");

  const checkedCount = [tpsB3, ipal, apar, noise, safetyEquipment].filter(Boolean).length;
  const calculatedScore = checkedCount * 20;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) {
      toast.error("Silakan pilih perusahaan terlebih dahulu.");
      return;
    }
    if (!visitDate) {
      toast.error("Silakan tentukan tanggal kunjungan.");
      return;
    }

    const company = companies.find(c => c.id === selectedCompanyId);
    if (!company) {
      toast.error("Perusahaan tidak ditemukan.");
      return;
    }

    setLoading(true);
    try {
      // 1. Buat jadwal inspeksi (Sequential Phase 1)
      const newInsp = await scheduleInspection({
        companyId: company.id,
        companyName: company.companyName,
        inspectorName: currentUser?.name || "Heryanto, S.T.",
        inspectorId: currentUser?.officerId || currentUser?.id || "OFF-001",
        date: visitDate,
        location: company.address || "Bandung",
        notes: notes,
        photo: "https://images.unsplash.com/photo-1513828742140-ccaa34f3ccd0?w=400&auto=format&fit=crop&q=60" // Default photo placeholder
      });

      if (newInsp && newInsp.id) {
        // 2. Submit BAP hasil inspeksi (Sequential Phase 2)
        await submitInspectionResult(
          newInsp.id,
          calculatedScore,
          notes,
          { tpsB3, ipal, apar, noise, safetyEquipment }
        );
        
        toast.success("Laporan Hasil Inspeksi Lapangan berhasil dikirim!");
        onClose();
        
        // Reset state
        setSelectedCompanyId("");
        setVisitDate("");
        setNotes("");
        setTpsB3(false);
        setIpal(false);
        setApar(false);
        setNoise(false);
        setSafetyEquipment(false);
      } else {
        toast.error("Gagal menjadwalkan inspeksi.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Terjadi kesalahan saat memproses laporan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] lg:max-w-6xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white">
        
        {/* --- HEADER --- */}
        <div className="bg-slate-900 text-white p-8 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ClipboardList size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                  Internal Audit
                </span>
                <span className="text-slate-500 font-mono text-[10px] tracking-widest italic">BAP-AUTO-GENERATED</span>
              </div>
              <DialogTitle className="text-3xl font-black tracking-tighter leading-none text-white">
                Input Hasil Inspeksi Lapangan
              </DialogTitle>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <X size={28} />
          </button>
        </div>

        {/* --- BODY (DUA KOLOM) --- */}
        <form onSubmit={handleSubmit} className="flex h-[75vh] flex-col md:flex-row bg-slate-50 overflow-hidden">
          
          {/* KOLOM KIRI: Form Checklist (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar text-left">
            <div className="max-w-3xl mx-auto space-y-10">
              
              {/* Seksi Identitas Audit */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Building2 size={14} /> Pilih Perusahaan Terdaftar
                  </Label>
                  <select 
                    value={selectedCompanyId} 
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="w-full h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                  >
                    <option value="">Pilih Perusahaan...</option>
                    {approvedCompanies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <CalendarDays size={14} /> Tanggal Kunjungan
                  </Label>
                  <Input 
                    type="date" 
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="h-12 rounded-xl border-slate-200 bg-white font-bold text-slate-700" 
                  />
                </div>
              </section>

              <Separator className="bg-slate-200" />

              {/* Seksi Checklist Teknis */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Checklist Kepatuhan Lingkungan</h4>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <InspectionCheckItem 
                    label="Ketersediaan Tempat Penampungan Sementara (TPS) B3 Berizin" 
                    checked={tpsB3}
                    onChange={() => setTpsB3(!tpsB3)}
                  />
                  <InspectionCheckItem 
                    label="Sistem IPAL (Instalasi Pengolahan Air Limbah) Beroperasi Normal" 
                    checked={ipal}
                    onChange={() => setIpal(!ipal)}
                  />
                  <InspectionCheckItem 
                    label="Ketersediaan Alat Pemadam Api Ringan (APAR) Terpasang di Lokasi" 
                    checked={apar}
                    onChange={() => setApar(!apar)}
                  />
                  <InspectionCheckItem 
                    label="Tingkat Kebisingan & Getaran Mesin Sesuai Nilai Ambang Batas" 
                    checked={noise}
                    onChange={() => setNoise(!noise)}
                  />
                  <InspectionCheckItem 
                    label="Ketersediaan Peralatan K3 & Alat Pelindung Diri (APD) Lengkap Bagi Operator" 
                    checked={safetyEquipment}
                    onChange={() => setSafetyEquipment(!safetyEquipment)}
                  />
                </div>
              </section>

              {/* Catatan Tambahan */}
              <section className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Temuan Lapangan / Rekomendasi Petugas</Label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full min-h-[120px] rounded-2xl border border-slate-200 bg-white p-6 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none" 
                  placeholder="Uraikan temuan jika ada ketidaksesuaian..."
                />
              </section>
            </div>
          </div>

          {/* KOLOM KANAN: Dokumentasi & Simpan (Sidebar) */}
          <div className="w-full md:w-[380px] bg-white border-l border-slate-200 p-10 flex flex-col gap-10 shrink-0 text-left">
            
            {/* Seksi Foto */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dokumentasi Lapangan</h4>
              <div className="aspect-square rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-4 hover:border-emerald-500 transition-all cursor-pointer group">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-emerald-500 shadow-sm transition-transform group-hover:scale-110">
                  <Camera size={32} />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Foto Bukti Tersemat</p>
                  <p className="text-[9px] font-bold text-slate-300 italic uppercase">BAP_EVIDENCE.JPG</p>
                </div>
              </div>
            </div>

            {/* Skor Otomatis */}
            <div className="p-6 bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] space-y-2">
               <div className="flex items-center gap-2 text-emerald-700 font-black text-[10px] uppercase tracking-widest">
                 <AlertCircle size={14} /> Skor Kepatuhan Sementara
               </div>
               <div className="flex items-end gap-2">
                <span className="text-5xl font-black text-emerald-900 tracking-tighter italic leading-none">{calculatedScore}</span>
                <span className="text-lg font-bold text-emerald-600 pb-1">/ 100</span>
               </div>
               <p className="text-[10px] font-bold text-emerald-600/70 italic">*Skor dihitung otomatis berdasarkan checklist</p>
            </div>

            {/* Action Button (Sticky at Bottom) */}
            <div className="mt-auto">
              <Button 
                type="submit"
                disabled={loading}
                className="w-full h-16 rounded-[1.5rem] bg-slate-900 hover:bg-emerald-600 text-white font-black text-xl transition-all shadow-2xl shadow-emerald-900/20 tracking-tighter disabled:opacity-50"
              >
                {loading ? "MENGIRIM..." : "KIRIM LAPORAN"} <CheckCircle2 className="ml-2" size={20} />
              </Button>
              <p className="text-center text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest leading-relaxed">
                Data akan langsung diverifikasi oleh <br/> Kepala Bidang Pengawasan
              </p>
            </div>

          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- HELPER COMPONENT ---

function InspectionCheckItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <div 
      onClick={onChange}
      className={cn(
        "flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer group text-left",
        checked ? "bg-emerald-50 border-emerald-500 shadow-sm" : "bg-white border-slate-100 hover:border-slate-200"
      )}
    >
      <span className={cn(
        "text-[13px] font-bold pr-6 leading-snug",
        checked ? "text-emerald-900" : "text-slate-600"
      )}>
        {label}
      </span>
      <div className={cn(
        "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all",
        checked ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-200 bg-white"
      )}>
        {checked && <CheckCircle2 size={14} />}
      </div>
    </div>
  );
}