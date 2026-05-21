import React, { useState } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, MapPin, FileText, User, 
  CheckCircle2, AlertTriangle, XCircle, 
  Download, ExternalLink, Factory, Phone, X
} from "lucide-react";
import { cn } from "@/lib/utils";

export function DetailDrawer({ isOpen, onClose, data }: any) {
  const [decision, setDecision] = useState<string>("");

  if (!data) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* max-w-6xl memastikan modal cukup lebar agar tidak berhimpitan */}
      <DialogContent className="max-w-[90vw] lg:max-w-6xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white">
        
        {/* --- HEADER --- */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/50 text-[10px] uppercase font-black">
                  {data.type}
                </Badge>
                <span className="text-slate-500 font-mono text-[10px] tracking-widest">{data.id}</span>
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight leading-none">
                {data.company}
              </DialogTitle>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        {/* --- BODY (Dua Kolom) --- */}
        <div className="flex h-[75vh] flex-col md:flex-row bg-slate-50 overflow-hidden">
          
          {/* KOLOM KIRI: Dokumentasi & Detail Teknis */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-10">
              
              {/* Seksi Identitas */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoBlock icon={<User size={18}/>} label="Penanggung Jawab" value={data.pic} />
                <InfoBlock icon={<Phone size={18}/>} label="Kontak / WhatsApp" value="+62 812-3456-7890" />
                <div className="col-span-full">
                  <InfoBlock icon={<MapPin size={18}/>} label="Alamat Usaha" value={data.location} />
                </div>
              </section>

              <Separator />

              {/* Seksi Teknis Dokumen */}
              <section className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Factory size={18} className="text-emerald-500" /> Rincian Teknis {data.type}
                </h4>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Deskripsi Kegiatan</p>
                    <p className="text-sm text-slate-600 leading-relaxed">Perusahaan bergerak di bidang pengolahan kain tekstil dengan kapasitas 500m per hari. Menghasilkan limbah cair sisa pewarnaan.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Luas Bangunan</p>
                      <p className="text-sm font-bold text-slate-800">1,200 m²</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Modal Investasi</p>
                      <p className="text-sm font-bold text-slate-800">Rp 2.500.000.000</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Seksi GIS */}
              <section className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={18} className="text-emerald-500" /> Pemetaan Geospasial
                </h4>
                <div className="aspect-video bg-slate-200 rounded-3xl border-4 border-white shadow-lg relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/107.61,-6.91,14/800x450?access_token=YOUR_TOKEN')] bg-cover" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-rose-500/20 flex items-center justify-center rounded-full animate-ping" />
                    <MapPin className="text-rose-600 absolute" size={32} />
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* KOLOM KANAN: Lampiran & Aksi (Sidebar di dalam Modal) */}
          <div className="w-full md:w-[350px] bg-white border-l border-slate-200 p-8 flex flex-col gap-8 shrink-0">
            
            {/* Lampiran Berkas */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Lampiran Dokumen</h4>
              <div className="space-y-2">
                <FileItem title="Scan_NIB_Original.pdf" />
                <FileItem title="NPWP_Perusahaan.jpg" />
                <FileItem title="Siteplan_Layout.pdf" />
              </div>
            </div>

            {/* Aksi Validasi (Radio Style) */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Hasil Pemeriksaan</h4>
              <div className="space-y-2">
                <DecisionCard 
                  active={decision === "APPROVE"}
                  onClick={() => setDecision("APPROVE")}
                  icon={<CheckCircle2 size={18} className="text-emerald-500"/>}
                  label="Setujui"
                  color="bg-emerald-50 border-emerald-500"
                />
                <DecisionCard 
                  active={decision === "REVISION"}
                  onClick={() => setDecision("REVISION")}
                  icon={<AlertTriangle size={18} className="text-amber-500"/>}
                  label="Revisi Berkas"
                  color="bg-amber-50 border-amber-500"
                />
                <DecisionCard 
                  active={decision === "REJECT"}
                  onClick={() => setDecision("REJECT")}
                  icon={<XCircle size={18} className="text-rose-500"/>}
                  label="Tolak"
                  color="bg-rose-50 border-rose-500"
                />
              </div>
            </div>

            {/* Tombol Simpan di kanan bawah */}
            <div className="mt-auto pt-6">
              <Button 
                disabled={!decision}
                className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-black text-lg transition-all shadow-xl disabled:opacity-20"
              >
                SIMPAN DATA
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- SMALL COMPONENTS ---

function InfoBlock({ icon, label, value }: any) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function FileItem({ title }: { title: string }) {
  return (
    <div className="group flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-emerald-500 hover:bg-white transition-all cursor-pointer">
      <div className="flex items-center gap-2 overflow-hidden">
        <FileText size={14} className="text-slate-400 group-hover:text-emerald-500" />
        <span className="text-[11px] font-bold text-slate-600 truncate">{title}</span>
      </div>
      <Download size={14} className="text-slate-400 group-hover:text-emerald-500" />
    </div>
  );
}

function DecisionCard({ active, onClick, icon, label, color }: any) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between",
        active ? color : "bg-white border-slate-100 hover:border-slate-200"
      )}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-black text-slate-800 tracking-tight">{label}</span>
      </div>
      <div className={cn(
        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
        active ? "border-slate-900 bg-slate-900" : "border-slate-200"
      )}>
        {active && <div className="w-2 h-2 bg-white rounded-full" />}
      </div>
    </div>
  );
}