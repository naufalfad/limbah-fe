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
  X, Building2, CalendarDays, AlertCircle, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSijagaStore } from "@/store/useSijagaStore";
import { toast } from "sonner";
import { DocPreviewer } from "./DocPreviewer";

const BACKEND_URL = "http://localhost:5000";
const docUrl = (path: string | null | undefined) => {
  if (!path) return null;
  return path.startsWith("http") ? path : `${BACKEND_URL}${path}`;
};

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

export function CreateInspectionModal({ isOpen, onClose }: any) {
  const { currentUser, companies, scheduleInspection, submitInspectionResult, fetchCompanies } = useSijagaStore();

  // Form State
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // UKL-UPL Checklist State object
  const [uklUplChecklist, setUklUplChecklist] = useState({
    sumberDampakStatus: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
    sumberDampakNotes: "",
    jenisDampakStatus: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
    jenisDampakNotes: "",
    besaranDampakStatus: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
    besaranDampakNotes: "",
    pengelolaanBentukStatus: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
    pengelolaanBentukNotes: "",
    pengelolaanLokasiStatus: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
    pengelolaanLokasiNotes: "",
    pengelolaanPeriodeStatus: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
    pengelolaanPeriodeNotes: "",
    pemantauanBentukStatus: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
    pemantauanBentukNotes: "",
    pemantauanLokasiStatus: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
    pemantauanLokasiNotes: "",
    pemantauanPeriodeStatus: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
    pemantauanPeriodeNotes: "",
    institusiStatus: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
    institusiNotes: "",
    keteranganStatus: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
    keteranganNotes: "",
  });

  // SPPL Checklist State
  const [spplBersih, setSpplBersih] = useState(false);
  const [spplBebasLimbah, setSpplBebasLimbah] = useState(false);
  const [spplDrainase, setSpplDrainase] = useState(false);
  const [spplBebasBakar, setSpplBebasBakar] = useState(false);
  const [spplTempatSampah, setSpplTempatSampah] = useState(false);

  // Fetch approved companies on open
  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
    }
  }, [isOpen, fetchCompanies]);

  const approvedCompanies = companies.filter(c => c.status === "APPROVED");

  const company = companies.find(c => c.id === selectedCompanyId);
  const isSppl = company?.docType === "SPPL";

  // Scoring for UKL-UPL Matrix
  const uklUplMetCount = Object.keys(uklUplChecklist).filter(
    key => key.endsWith("Status") && uklUplChecklist[key as keyof typeof uklUplChecklist] === "SESUAI"
  ).length;
  const rawUklUplScore = Math.round((uklUplMetCount / 11) * 100);

  const hasUklUplCriticalViolation = [
    uklUplChecklist.pengelolaanBentukStatus,
    uklUplChecklist.pengelolaanLokasiStatus,
    uklUplChecklist.pengelolaanPeriodeStatus,
    uklUplChecklist.pemantauanBentukStatus,
    uklUplChecklist.pemantauanLokasiStatus,
    uklUplChecklist.pemantauanPeriodeStatus
  ].some(status => status === "TIDAK_SESUAI");

  const uklUplScore = hasUklUplCriticalViolation ? Math.min(rawUklUplScore, 50) : rawUklUplScore;

  // Scoring for SPPL
  const rawSpplScore =
    (spplBersih ? 20 : 0) +
    (spplBebasLimbah ? 25 : 0) +
    (spplDrainase ? 15 : 0) +
    (spplBebasBakar ? 20 : 0) +
    (spplTempatSampah ? 20 : 0);

  const hasSpplCriticalViolation = !spplBebasLimbah || !spplBebasBakar;
  const spplScore = hasSpplCriticalViolation ? Math.min(rawSpplScore, 50) : rawSpplScore;

  const calculatedScore = isSppl ? spplScore : uklUplScore;
  const hasCriticalViolation = isSppl ? hasSpplCriticalViolation : hasUklUplCriticalViolation;

  // Determine compliance label
  let complianceLabel = "BELUM DINILAI";
  if (selectedCompanyId) {
    if (isSppl) {
      if (spplScore === 100) complianceLabel = "PATUH SEUTUHNYA";
      else if (spplScore >= 60 && !hasSpplCriticalViolation) complianceLabel = "PATUH BERSYARAT";
      else complianceLabel = "TIDAK PATUH";
    } else {
      if (uklUplScore === 100) complianceLabel = "PATUH SEUTUHNYA";
      else if (uklUplScore >= 60 && !hasUklUplCriticalViolation) complianceLabel = "PATUH BERSYARAT";
      else complianceLabel = "TIDAK PATUH";
    }
  }

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

    // Validasi deskripsi ketidaksesuaian UKL-UPL
    if (!isSppl) {
      for (const item of UKL_UPL_ITEMS) {
        const statusKey = `${item.key}Status` as keyof typeof uklUplChecklist;
        const notesKey = `${item.key}Notes` as keyof typeof uklUplChecklist;
        if (uklUplChecklist[statusKey] === "TIDAK_SESUAI" && !uklUplChecklist[notesKey].trim()) {
          toast.error(`Catatan ketidaksesuaian untuk aspek "${item.label}" wajib diisi!`);
          return;
        }
      }
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
          isSppl ? {
            spplBersih, spplBebasLimbah, spplDrainase, spplBebasBakar, spplTempatSampah
          } : uklUplChecklist
        );
        
        toast.success("Laporan Hasil Inspeksi Lapangan berhasil dikirim!");
        onClose();
        
        // Reset state
        setSelectedCompanyId("");
        setVisitDate("");
        setNotes("");
        // Reset UKL-UPL
        setUklUplChecklist({
          sumberDampakStatus: "SESUAI",
          sumberDampakNotes: "",
          jenisDampakStatus: "SESUAI",
          jenisDampakNotes: "",
          besaranDampakStatus: "SESUAI",
          besaranDampakNotes: "",
          pengelolaanBentukStatus: "SESUAI",
          pengelolaanBentukNotes: "",
          pengelolaanLokasiStatus: "SESUAI",
          pengelolaanLokasiNotes: "",
          pengelolaanPeriodeStatus: "SESUAI",
          pengelolaanPeriodeNotes: "",
          pemantauanBentukStatus: "SESUAI",
          pemantauanBentukNotes: "",
          pemantauanLokasiStatus: "SESUAI",
          pemantauanLokasiNotes: "",
          pemantauanPeriodeStatus: "SESUAI",
          pemantauanPeriodeNotes: "",
          institusiStatus: "SESUAI",
          institusiNotes: "",
          keteranganStatus: "SESUAI",
          keteranganNotes: "",
        });
        // Reset SPPL
        setSpplBersih(false);
        setSpplBebasLimbah(false);
        setSpplDrainase(false);
        setSpplBebasBakar(false);
        setSpplTempatSampah(false);
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
      <DialogContent className="max-w-[98vw] lg:max-w-[96vw] p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl bg-white font-sans">
        
        {/* --- HEADER --- */}
        <div className="bg-slate-900 border-b border-slate-800 text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded flex items-center justify-center shadow-md">
              <ClipboardList size={20} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest leading-none">
                  DLH System
                </span>
                <span className="text-slate-400 font-mono text-[9px] tracking-widest uppercase leading-none">BAP-INPUT-PORTAL</span>
              </div>
              <DialogTitle className="text-sm font-black tracking-wider uppercase text-white leading-none">
                Input Hasil Inspeksi Lapangan
              </DialogTitle>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* --- BODY (DUA KOLOM) --- */}
        <form onSubmit={handleSubmit} className="flex h-[76vh] flex-col md:flex-row bg-slate-50 overflow-hidden">
          
          {/* KOLOM KIRI: Form Checklist (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar text-left">
            <div className="max-w-3xl mx-auto space-y-5">
              
              {/* Seksi Identitas Audit */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase text-slate-455 tracking-widest flex items-center gap-1">
                    <Building2 size={12} /> Pilih Perusahaan Sasaran
                  </Label>
                  <select 
                    value={selectedCompanyId} 
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="w-full h-10 rounded border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
                  >
                    <option value="">Pilih Perusahaan...</option>
                    {approvedCompanies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.docType})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase text-slate-455 tracking-widest flex items-center gap-1">
                    <CalendarDays size={12} /> Tanggal Kunjungan
                  </Label>
                  <Input 
                    type="date" 
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="h-10 rounded border-slate-200 bg-white text-xs font-bold text-slate-750 shadow-sm" 
                  />
                </div>
              </section>

              <Separator className="bg-slate-200" />

              {/* Seksi Checklist Teknis */}
              {selectedCompanyId ? (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Checklist Kepatuhan Lapangan</h4>
                    </div>
                    {hasCriticalViolation && (
                      <span className="text-[8px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded uppercase animate-pulse">
                        ⚠ Pelanggaran Kritis (Skor Maks 50)
                      </span>
                    )}
                  </div>
                  
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
                          <InspectionRow id={1} category="Kebersihan" item="Lingkungan usaha bersih" weight={20} isCritical={false} checked={spplBersih} onClick={() => setSpplBersih(!spplBersih)} />
                          <InspectionRow id={2} category="Limbah" item="Tidak membuang limbah sembarangan" weight={25} isCritical={true} checked={spplBebasLimbah} onClick={() => setSpplBebasLimbah(!spplBebasLimbah)} />
                          <InspectionRow id={3} category="Drainase" item="Saluran drainase baik" weight={15} isCritical={false} checked={spplDrainase} onClick={() => setSpplDrainase(!spplDrainase)} />
                          <InspectionRow id={4} category="Limbah" item="Tidak ada pembakaran limbah" weight={20} isCritical={true} checked={spplBebasBakar} onClick={() => setSpplBebasBakar(!spplBebasBakar)} />
                          <InspectionRow id={5} category="Kebersihan" item="Tempat sampah tersedia" weight={20} isCritical={false} checked={spplTempatSampah} onClick={() => setSpplTempatSampah(!spplTempatSampah)} />
                        </tbody>
                      </table>
                    ) : (
                      <table className="w-full text-[11px] font-sans border-collapse text-left">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-black uppercase text-[8px] tracking-wider">
                            <th className="py-2.5 px-3">Parameter Matriks UKL-UPL</th>
                            <th className="py-2.5 px-3 text-center w-20">Parameter</th>
                            <th className="py-2.5 px-3 text-center w-36">Evaluasi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {UKL_UPL_ITEMS.map((item) => {
                            const statusKey = `${item.key}Status` as keyof typeof uklUplChecklist;
                            const notesKey = `${item.key}Notes` as keyof typeof uklUplChecklist;
                            const status = uklUplChecklist[statusKey];
                            const notesVal = uklUplChecklist[notesKey] as string;

                            return (
                              <React.Fragment key={item.key}>
                                <tr className={cn(
                                  "hover:bg-slate-50/50 transition-colors select-none",
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
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => setUklUplChecklist(prev => ({
                                          ...prev,
                                          [statusKey]: "SESUAI",
                                          [notesKey]: ""
                                        }))}
                                        className={cn(
                                          "px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider transition-all rounded border",
                                          status === "SESUAI"
                                            ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                                            : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
                                        )}
                                      >
                                        SESUAI
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setUklUplChecklist(prev => ({
                                          ...prev,
                                          [statusKey]: "TIDAK_SESUAI"
                                        }))}
                                        className={cn(
                                          "px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider transition-all rounded border",
                                          status === "TIDAK_SESUAI"
                                            ? "bg-rose-600 border-rose-600 text-white shadow-sm"
                                            : "bg-white border-slate-200 text-slate-455 hover:bg-slate-50"
                                        )}
                                      >
                                        TIDAK
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                                {status === "TIDAK_SESUAI" && (
                                  <tr className="bg-rose-50/20">
                                    <td colSpan={3} className="py-2 px-3 border-b border-rose-100/50">
                                      <div className="space-y-1">
                                        <span className="text-[8px] font-black text-rose-700 uppercase tracking-widest block leading-none">
                                          Temuan Ketidaksesuaian Matriks *
                                        </span>
                                        <textarea
                                          value={notesVal}
                                          onChange={(e) => setUklUplChecklist(prev => ({
                                            ...prev,
                                            [notesKey]: e.target.value
                                          }))}
                                          className="w-full min-h-[45px] border border-rose-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-white p-2 text-xs font-medium rounded shadow-inner"
                                          placeholder={`Jelaskan ketidaksesuaian aspek ${item.label.toLowerCase()} secara spesifik...`}
                                          required
                                        />
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
                </section>
              ) : (
                <div className="p-8 border-2 border-dashed border-slate-200 text-center rounded-lg text-slate-450 font-bold text-xs uppercase tracking-widest bg-white">
                  ⚠ Silakan pilih perusahaan terlebih dahulu untuk menampilkan checklist evaluasi
                </div>
              )}

              {/* Catatan Tambahan */}
              <section className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-455 tracking-widest">Temuan Lapangan Utama / Rekomendasi Dinas</Label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full min-h-[90px] rounded border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-all shadow-sm" 
                  placeholder="Uraikan temuan umum BAP atau tenggat waktu pemenuhan kewajiban lingkungan..."
                />
              </section>

              {/* Lampiran Dokumen Teknis Resmi Perusahaan */}
              {selectedCompanyId && (
                <section className="space-y-3">
                  <Separator className="bg-slate-200" />
                  <Label className="text-[9px] font-black uppercase text-slate-455 tracking-widest flex items-center gap-1.5">
                    <FileText size={12} className="text-slate-400" /> Lampiran Dokumen Teknis Resmi Perusahaan
                  </Label>
                  {company?.docTemplateUrl ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col">
                      <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText size={15} className="text-emerald-400" />
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            Matriks Isian Teknis Resmi: {company.companyName}
                          </span>
                        </div>
                        <a
                          href={docUrl(company.docTemplateUrl) || undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[9px] font-black uppercase bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded border border-slate-700 transition-all flex items-center gap-1"
                        >
                          Unduh Berkas Asli
                        </a>
                      </div>
                      <div className="h-[450px] flex flex-col bg-slate-950/5 overflow-hidden">
                        <DocPreviewer fileUrl={docUrl(company.docTemplateUrl)} companyId={company.id} />
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 border border-dashed border-slate-200 text-center rounded-xl text-slate-400 font-bold text-xs uppercase tracking-widest bg-white">
                      ⚠ Perusahaan belum mengunggah dokumen matriks isian teknis (UKL-UPL / SPPL).
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>

          {/* KOLOM KANAN: Dokumentasi & Simpan (Sidebar) */}
          <div className="w-full md:w-[320px] bg-white border-l border-slate-200 p-5 flex flex-col gap-5 shrink-0 text-left">
            
            {/* Seksi Foto */}
            <div className="space-y-2 shrink-0">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dokumentasi Lapangan</h4>
              <div className="aspect-[4/3] rounded border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 hover:border-emerald-500 transition-all cursor-pointer group">
                <div className="w-10 h-10 bg-white rounded border flex items-center justify-center text-slate-300 group-hover:text-emerald-500 shadow-sm transition-transform group-hover:scale-105">
                  <Camera size={18} />
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest leading-none">Foto Bukti Tersemat</p>
                  <p className="text-[8px] font-bold text-slate-300 italic uppercase mt-1">BAP_EVIDENCE.JPG</p>
                </div>
              </div>
            </div>

            {/* Skor Otomatis */}
            {selectedCompanyId && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg space-y-2">
                 <div className="flex items-center gap-1.5 text-emerald-700 font-black text-[9px] uppercase tracking-widest">
                   <AlertCircle size={12} /> Hasil Evaluasi Kepatuhan
                 </div>
                 <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-emerald-900 tracking-tighter italic leading-none">{calculatedScore}</span>
                  <span className="text-sm font-bold text-emerald-600 pb-0.5">/ 100</span>
                 </div>
                 <div className="border-t border-emerald-200/50 pt-2 flex items-center justify-between">
                   <span className="text-[8px] font-black text-emerald-700 uppercase">Kategori:</span>
                   <span className="text-[9px] font-black text-emerald-900 uppercase tracking-wider">{complianceLabel}</span>
                 </div>
              </div>
            )}

            {/* Action Button (Sticky at Bottom) */}
            <div className="mt-auto space-y-3 shrink-0">
              <Button 
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs transition-all shadow-md tracking-wider disabled:opacity-50 uppercase"
              >
                {loading ? "MENGIRIM..." : "KIRIM BAP RESMI"}
              </Button>
              <p className="text-center text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-normal">
                BAP akan langsung diajukan ke <br/> Kepala Bidang Pengawasan Lingkungan
              </p>
            </div>

          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Sub-Komponen Baris Tabel Parameter SPPL
function InspectionRow({ id, category, item, weight, isCritical, checked, onClick }: {
  id: number;
  category: string;
  item: string;
  weight: number;
  isCritical: boolean;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <tr 
      onClick={onClick}
      className={cn(
        "hover:bg-slate-50/80 transition-colors cursor-pointer text-slate-700 font-bold select-none h-11",
        checked ? "bg-emerald-50/10 text-emerald-950" : ""
      )}
    >
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
        <div className={cn(
          "mx-auto w-4.5 h-4.5 rounded border flex items-center justify-center transition-all",
          checked ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 bg-white"
        )}>
          {checked && <CheckCircle2 size={10} />}
        </div>
      </td>
    </tr>
  );
}