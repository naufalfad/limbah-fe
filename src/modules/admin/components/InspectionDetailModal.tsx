// src/modules/admin/components/InspectionDetailModal.tsx
import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  X, ClipboardList, CheckCircle2, AlertCircle, FileText, Camera, ShieldCheck, User, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSijagaStore } from '@/store/useSijagaStore';

interface InspectionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: any;
}

const UKL_UPL_ITEMS = [
  { key: "sumberDampak", label: "Sumber Dampak", category: "SUMBER DAMPAK", isCritical: false },
  { key: "jenisDampak", label: "Jenis Dampak", category: "JENIS DAMPAK", isCritical: false },
  { key: "besaranDampak", label: "Besaran Dampak", category: "BESARAN DAMPAK", isCritical: false },
  { key: "pengelolaanBentuk", label: "Bentuk Upaya Pengelolaan", category: "UPAYA PENGELOLAAN LINGKUNGAN (BENTUK)", isCritical: true },
  { key: "pengelolaanLokasi", label: "Lokasi Pengelolaan", category: "UPAYA PENGELOLAAN LINGKUNGAN (LOKASI)", isCritical: true },
  { key: "pengelolaanPeriode", label: "Periode Pengelolaan", category: "UPAYA PENGELOLAAN LINGKUNGAN (PERIODE)", isCritical: true },
  { key: "pemantauanBentuk", label: "Bentuk Upaya Pemantauan", category: "UPAYA PEMANTAUAN LINGKUNGAN (BENTUK)", isCritical: true },
  { key: "pemantauanLokasi", label: "Lokasi Pemantauan", category: "UPAYA PEMANTAUAN LINGKUNGAN (LOKASI)", isCritical: true },
  { key: "pemantauanPeriode", label: "Periode Pemantauan", category: "UPAYA PEMANTAUAN LINGKUNGAN (PERIODE)", isCritical: true },
  { key: "institusi", label: "Institusi Pengelola & Pemantauan", category: "INSTITUSI PENGELOLAAN & PEMANTAUAN", isCritical: false },
  { key: "keterangan", label: "Keterangan Aspek Lain", category: "KETERANGAN LAIN", isCritical: false },
] as const;

export function InspectionDetailModal({ isOpen, onClose, inspection }: InspectionDetailModalProps) {
  const { companies } = useSijagaStore();

  if (!inspection) return null;

  const company = companies.find(c => c.id === inspection.companyId);
  const isSppl = company?.docType === "SPPL";

  // Score calculation or fetching
  const score = inspection.score;

  // Determine compliance category & styling
  let complianceLabel = "BELUM DINILAI";
  let complianceDesc = "Hasil penilaian lapangan belum diunggah.";
  let complianceColorClass = "bg-slate-50 text-slate-700 border-slate-200";

  if (score !== null) {
    if (isSppl) {
      if (score === 100) {
        complianceLabel = "PATUH SEUTUHNYA";
        complianceDesc = "Semua item SPPL telah terpenuhi secara sempurna di lapangan.";
        complianceColorClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
      } else if (score >= 60) {
        complianceLabel = "PATUH BERSYARAT";
        complianceDesc = "Mayoritas item SPPL terpenuhi, tanpa adanya pelanggaran kritis.";
        complianceColorClass = "bg-amber-50 text-amber-800 border-amber-200";
      } else {
        complianceLabel = "TIDAK PATUH";
        complianceDesc = "Kepatuhan rendah atau terdapat pelanggaran parameter kritis SPPL.";
        complianceColorClass = "bg-rose-50 text-rose-800 border-rose-200 animate-pulse";
      }
    } else {
      const chk = inspection.checklist || {};
      const hasUklUplCriticalViolation = [
        chk.pengelolaanBentukStatus,
        chk.pengelolaanLokasiStatus,
        chk.pengelolaanPeriodeStatus,
        chk.pemantauanBentukStatus,
        chk.pemantauanLokasiStatus,
        chk.pemantauanPeriodeStatus
      ].some(status => status === "TIDAK_SESUAI");

      if (score === 100) {
        complianceLabel = "PATUH SEUTUHNYA";
        complianceDesc = "Semua 11 parameter matriks kualitatif UKL-UPL berstatus SESUAI.";
        complianceColorClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
      } else if (score >= 60 && !hasUklUplCriticalViolation) {
        complianceLabel = "PATUH BERSYARAT";
        complianceDesc = "Kepatuhan memadai, pelanggaran hanya terjadi pada aspek minor.";
        complianceColorClass = "bg-amber-50 text-amber-800 border-amber-200";
      } else {
        complianceLabel = "TIDAK PATUH";
        complianceDesc = hasUklUplCriticalViolation
          ? "Pelanggaran kritis matriks (Pengelolaan / Pemantauan)! Skor akhir dibatasi maks 50."
          : "Tingkat kepatuhan kualitatif rendah (di bawah 60%).";
        complianceColorClass = "bg-rose-50 text-rose-800 border-rose-200 animate-pulse";
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[100vh] lg:max-w-7xl p-0 overflow-hidden rounded-xl border border-slate-200 shadow-2xl bg-white font-sans">

        {/* HEADER */}
        <div className="bg-slate-900 border-b border-slate-800 text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded flex items-center justify-center shadow-md">
              <FileText size={20} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest leading-none">
                  DLH System
                </span>
                <span className="text-slate-400 font-mono text-[9px] tracking-widest uppercase leading-none">BAP-DETAIL-VIEWER</span>
              </div>
              <DialogTitle className="text-sm font-black tracking-wider uppercase text-white leading-none">
                Detail Berita Acara Pemeriksaan (BAP) Lapangan
              </DialogTitle>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* BODY - Two Column Grid on Desktop */}
        <div className="bg-slate-50 max-h-[80vh] overflow-y-auto custom-scrollbar p-5 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* LEFT COLUMN: The Checklist Results (7/12 Width) */}
            <div className="lg:col-span-7 space-y-4">

              {/* Seksi Objek Inspeksi */}
              <div className="p-3 bg-white border border-slate-200 text-left shadow-sm rounded-lg">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none">Lokasi / Objek Inspeksi</span>
                <h4 className="text-xs font-black text-slate-800 mt-1 leading-normal uppercase">{inspection.companyName}</h4>
                <p className="text-[9px] text-slate-500 font-bold mt-0.5 leading-normal uppercase">{inspection.location}</p>
              </div>

              {/* Parameter Evaluasi Checklist */}
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <ClipboardList size={12} className="text-slate-400" /> Hasil Evaluasi Parameter ({isSppl ? "Wajib SPPL" : "Wajib UKL-UPL"})
                </label>

                <div className="border border-slate-200 bg-white overflow-hidden shadow-sm rounded-lg">
                  {isSppl ? (
                    <table className="w-full text-[11px] font-sans border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-black uppercase text-[8px] tracking-wider">
                          <th className="py-2.5 px-3 text-center w-8">ID</th>
                          <th className="py-2.5 px-3">Kategori</th>
                          <th className="py-2.5 px-3">Item Inspeksi SPPL</th>
                          <th className="py-2.5 px-3 text-center w-14">Bobot</th>
                          <th className="py-2.5 px-3 text-center w-16">Kritis</th>
                          <th className="py-2.5 px-3 text-center w-14">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* Render SPPL items */}
                        <InspectionDetailRow id={1} category="Kebersihan" item="Lingkungan usaha bersih" weight={20} isCritical={false} checked={inspection.checklist?.spplBersih} />
                        <InspectionDetailRow id={2} category="Limbah" item="Tidak membuang limbah sembarangan" weight={25} isCritical={true} checked={inspection.checklist?.spplBebasLimbah} />
                        <InspectionDetailRow id={3} category="Drainase" item="Saluran drainase baik" weight={15} isCritical={false} checked={inspection.checklist?.spplDrainase} />
                        <InspectionDetailRow id={4} category="Limbah" item="Tidak ada pembakaran limbah" weight={20} isCritical={true} checked={inspection.checklist?.spplBebasBakar} />
                        <InspectionDetailRow id={5} category="Kebersihan" item="Tempat sampah tersedia" weight={20} isCritical={false} checked={inspection.checklist?.spplTempatSampah} />
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-[11px] font-sans border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-black uppercase text-[8px] tracking-wider">
                          <th className="py-2.5 px-3">Parameter Matriks UKL-UPL</th>
                          <th className="py-2.5 px-3 text-center w-20">Parameter</th>
                          <th className="py-2.5 px-3 text-center w-24">Evaluasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {UKL_UPL_ITEMS.map((item) => {
                          const statusKey = `${item.key}Status` as keyof typeof inspection.checklist;
                          const notesKey = `${item.key}Notes` as keyof typeof inspection.checklist;
                          const status = inspection.checklist?.[statusKey] || "SESUAI";
                          const notesVal = inspection.checklist?.[notesKey] as string;

                          return (
                            <React.Fragment key={item.key}>
                              <tr className={cn(
                                "select-none",
                                status === "TIDAK_SESUAI" ? "bg-rose-50/10" : ""
                              )}>
                                <td className="py-2.5 px-3">
                                  <div className="flex flex-col">
                                    <span className="text-[7.5px] font-black text-slate-450 uppercase tracking-widest leading-none mb-1">
                                      {item.category}
                                    </span>
                                    <span className="text-[11px] font-bold text-slate-800 leading-normal">
                                      {item.label}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-center align-middle">
                                  {item.isCritical ? (
                                    <span className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded text-[8px] uppercase font-black tracking-wider border border-rose-200">
                                      KRITIS
                                    </span>
                                  ) : (
                                    <span className="bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold border border-slate-200">
                                      MINOR
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center align-middle">
                                  <span className={cn(
                                    "px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider rounded border shadow-sm inline-block",
                                    status === "SESUAI"
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                      : "bg-rose-50 border-rose-200 text-rose-750"
                                  )}>
                                    {status === "SESUAI" ? "SESUAI" : "TIDAK SESUAI"}
                                  </span>
                                </td>
                              </tr>
                              {status === "TIDAK_SESUAI" && (
                                <tr className="bg-rose-50/20">
                                  <td colSpan={3} className="py-2 px-3 border-b border-rose-100/50">
                                    <div className="space-y-1">
                                      <span className="text-[8px] font-black text-rose-700 uppercase tracking-widest block leading-none">
                                        Catatan Ketidaksesuaian Petugas:
                                      </span>
                                      <p className="text-xs font-semibold text-rose-900 bg-white p-2 border border-rose-100 rounded leading-relaxed">
                                        {notesVal || "(Tidak ada catatan khusus yang ditulis)"}
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Summary & Visual Verification (5/12 Width) */}
            <div className="lg:col-span-5 space-y-4">

              {/* Kepatuhan & Skor Card */}
              {score !== null && (
                <div className="bg-white border border-slate-200 p-4 shadow-sm rounded-lg space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none">Hasil Kepatuhan</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-800 italic tracking-tighter leading-none">{score}</span>
                        <span className="text-xs font-bold text-slate-400">/ 100</span>
                      </div>
                    </div>

                    <div className={cn("px-3 py-2 border rounded font-black text-[10px] tracking-wider text-center shrink-0 uppercase",
                      score === 100 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        score >= 60 && !complianceLabel.includes("TIDAK") ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-rose-50 text-rose-600 border-rose-200"
                    )}>
                      {complianceLabel}
                    </div>
                  </div>

                  <div className={cn("p-2.5 border rounded text-[9.5px] leading-relaxed font-bold", complianceColorClass)}>
                    {complianceDesc}
                  </div>
                </div>
              )}

              {/* Informasi Sidak & Petugas */}
              <div className="bg-white border border-slate-200 p-4 shadow-sm rounded-lg space-y-3 text-left text-xs font-semibold text-slate-700">
                <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest block leading-none">Petugas Lapangan</span>
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  <div>
                    <p className="font-bold text-slate-800 text-xs">{inspection.inspectorName}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">ID: {inspection.inspectorId || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t pt-2.5 mt-2">
                  <Calendar size={14} className="text-slate-400" />
                  <p className="text-slate-600 font-bold">Tanggal Audit: <span className="text-slate-800 font-black">{inspection.date}</span></p>
                </div>
              </div>

              {/* Temuan Umum BAP */}
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block leading-none">Catatan Temuan Utama BAP / Rekomendasi</label>
                <div className="w-full min-h-[90px] rounded border border-slate-200 p-3 text-xs font-semibold bg-white text-slate-700 shadow-sm leading-relaxed whitespace-pre-line">
                  {inspection.notes || "(Tidak ada catatan rekomendasi umum yang terlampir)"}
                </div>
              </div>

              {/* Foto Dokumentasi Sidak */}
              {inspection.photo && (
                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Dokumentasi Evidence Sidak</label>
                  <div className="border border-slate-200 bg-slate-100 rounded h-[150px] relative overflow-hidden shadow-sm group">
                    <img
                      src={inspection.photo}
                      alt="Sidak Evidence"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-slate-900/80 text-white rounded px-2 py-0.5 text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Camera size={10} /> BUKTI FISIK
                    </div>
                  </div>
                </div>
              )}

              {/* Digital Signature Seal */}
              {inspection.bapSigned && (
                <div className="bg-emerald-50/50 border border-emerald-200 p-3.5 rounded-lg text-emerald-800 flex items-center gap-3 shadow-inner">
                  <ShieldCheck size={28} className="text-emerald-600 shrink-0" />
                  <div className="text-left">
                    <span className="text-[7.5px] font-black text-emerald-600 bg-emerald-100 border border-emerald-200/50 px-1.5 py-0.5 rounded uppercase tracking-widest leading-none block w-max">
                      Tanda Tangan Elektronik
                    </span>
                    <p className="text-[10px] font-black uppercase tracking-wide text-emerald-950 mt-1">BAP SAH SECARA ELEKTRONIK</p>
                    <p className="text-[9px] font-bold text-emerald-600 mt-0.5">Telah diverifikasi digital oleh petugas {inspection.inspectorName}</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-slate-150 border-t border-slate-200 p-3.5 flex justify-end shrink-0">
          <Button onClick={onClose} className="rounded font-bold bg-slate-900 hover:bg-slate-800 h-9 px-5 text-[10px] uppercase tracking-wider text-white">
            Tutup Pratinjau BAP
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}

// Sub-Komponen Row SPPL
function InspectionDetailRow({ id, category, item, weight, isCritical, checked }: {
  id: number;
  category: string;
  item: string;
  weight: number;
  isCritical: boolean;
  checked: boolean | undefined;
}) {
  return (
    <tr className={cn(
      "hover:bg-slate-50 transition-colors select-none h-11",
      checked ? "bg-emerald-50/10 text-emerald-950" : ""
    )}>
      <td className="py-2 px-3 text-center text-slate-450 font-mono text-[9px] border-r border-slate-100">{id}</td>
      <td className="py-2 px-3 border-r border-slate-100">
        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-black border border-slate-200">
          {category}
        </span>
      </td>
      <td className="py-2 px-3 text-[10.5px] text-slate-800 border-r border-slate-100 font-bold">{item}</td>
      <td className="py-2 px-3 text-center text-slate-500 text-[9px] font-black border-r border-slate-100">{weight} Pts</td>
      <td className="py-2 px-3 text-center border-r border-slate-100">
        {isCritical ? (
          <span className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded text-[8px] uppercase font-black tracking-wider border border-rose-250">
            YA
          </span>
        ) : (
          <span className="bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold border border-slate-200">
            TIDAK
          </span>
        )}
      </td>
      <td className="py-2 px-3">
        <span className={cn(
          "mx-auto px-2.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider rounded border shadow-sm block w-max",
          checked
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-rose-50 border-rose-200 text-rose-750"
        )}>
          {checked ? "SESUAI" : "TIDAK"}
        </span>
      </td>
    </tr>
  );
}
