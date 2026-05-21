import React, { useState } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ClipboardList, Camera, CheckCircle2, 
  X, Building2, CalendarDays, AlertCircle,
  FileText, Upload, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

export function CreateInspectionModal({ isOpen, onClose }: any) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] lg:max-w-6xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white">
        
        {/* --- HEADER (SAMA DENGAN MODAL DETAIL) --- */}
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
              <DialogTitle className="text-3xl font-black tracking-tighter leading-none">
                Input Hasil Inspeksi Lapangan
              </DialogTitle>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <X size={28} />
          </button>
        </div>

        {/* --- BODY (DUA KOLOM) --- */}
        <div className="flex h-[75vh] flex-col md:flex-row bg-slate-50 overflow-hidden">
          
          {/* KOLOM KIRI: Form Checklist (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-10">
              
              {/* Seksi Identitas Audit */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Building2 size={14} /> Pilih Perusahaan Terdaftar
                  </Label>
                  <Input placeholder="Cari nama perusahaan..." className="h-12 rounded-xl border-slate-200 bg-white" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <CalendarDays size={14} /> Tanggal Kunjungan
                  </Label>
                  <Input type="date" className="h-12 rounded-xl border-slate-200 bg-white" />
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
                  <InspectionCheckItem label="Ketersediaan Dokumen NIB & SPPL/UKL-UPL di lokasi" />
                  <InspectionCheckItem label="Kesesuaian koordinat GIS dengan fisik bangunan" />
                  <InspectionCheckItem label="Ketersediaan Tempat Penampungan Sementara (TPS) B3" />
                  <InspectionCheckItem label="Sistem IPAL (Instalasi Pengolahan Air Limbah) Berfungsi" />
                  <InspectionCheckItem label="Logbook Harian Produksi Limbah Terisi Lengkap" />
                </div>
              </section>

              {/* Catatan Tambahan */}
              <section className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Temuan Lapangan / Rekomendasi Petugas</Label>
                <textarea 
                  className="w-full min-h-[120px] rounded-2xl border border-slate-200 bg-white p-6 text-sm font-medium focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none" 
                  placeholder="Uraikan temuan jika ada ketidaksesuaian..."
                />
              </section>
            </div>
          </div>

          {/* KOLOM KANAN: Dokumentasi & Simpan (Sidebar) */}
          <div className="w-full md:w-[380px] bg-white border-l border-slate-200 p-10 flex flex-col gap-10 shrink-0">
            
            {/* Seksi Foto */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dokumentasi Lapangan</h4>
              <div className="aspect-square rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-4 hover:border-emerald-500 transition-all cursor-pointer group">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-emerald-500 shadow-sm transition-transform group-hover:scale-110">
                  <Camera size={32} />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Klik untuk Upload</p>
                  <p className="text-[9px] font-bold text-slate-300 italic uppercase">JPG, PNG (Max 5MB)</p>
                </div>
              </div>
            </div>

            {/* Skor Otomatis */}
            <div className="p-6 bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] space-y-2">
               <div className="flex items-center gap-2 text-emerald-700 font-black text-[10px] uppercase tracking-widest">
                 <AlertCircle size={14} /> Skor Kepatuhan Sementara
               </div>
               <div className="flex items-end gap-2">
                <span className="text-5xl font-black text-emerald-900 tracking-tighter italic leading-none">85</span>
                <span className="text-lg font-bold text-emerald-600 pb-1">/ 100</span>
               </div>
               <p className="text-[10px] font-bold text-emerald-600/70 italic">*Skor dihitung otomatis berdasarkan checklist</p>
            </div>

            {/* Action Button (Sticky at Bottom) */}
            <div className="mt-auto">
              <Button className="w-full h-16 rounded-[1.5rem] bg-slate-900 hover:bg-emerald-600 text-white font-black text-xl transition-all shadow-2xl shadow-emerald-900/20 tracking-tighter">
                KIRIM LAPORAN <CheckCircle2 className="ml-2" size={20} />
              </Button>
              <p className="text-center text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest leading-relaxed">
                Data akan langsung diverifikasi oleh <br/> Kepala Bidang Pengawasan
              </p>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- HELPER COMPONENT ---

function InspectionCheckItem({ label }: { label: string }) {
  const [checked, setChecked] = React.useState(false);
  
  return (
    <div 
      onClick={() => setChecked(!checked)}
      className={cn(
        "flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer group",
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