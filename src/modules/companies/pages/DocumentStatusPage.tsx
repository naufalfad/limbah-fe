// src/modules/companies/pages/DocumentStatusPage.tsx
import React, { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  ShieldCheck, Leaf, QrCode, Download, Eye,
  Clock, CheckCircle2, AlertCircle, FileText,
  Sparkles, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Mengimpor Komponen Modular Taktis GFW [3]
import CompanyHeader from "../components/CompanyHeader";

export default function DocumentStatusPage() {
  const { currentUser, companies, selectedCompanyId, downloadCompanyCertificate } = useSijagaStore();
  const navigate = useNavigate();

  // State Pengendali Preview Sertifikat & QR Verifikasi [3]
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showQRVerify, setShowQRVerify] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Mengidentifikasi entitas perusahaan terdaftar
  const company = companies.find(c => c.id === selectedCompanyId) ||
    companies.find(c => c.id === currentUser?.companyId) ||
    companies[0];

  const handleDownloadPdf = async () => {
    if (!company) return;
    setIsDownloading(true);
    try {
      await downloadCompanyCertificate(company.id, company.companyName);
    } catch (error) {
      console.error("Download failed", error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!company) {
    return (
      <DashboardLayout role="PERUSAHAAN">
        <div className="max-w-4xl mx-auto py-12 text-left font-sans animate-in fade-in duration-500">
          <div className="bg-slate-900 text-white rounded-none p-10 border border-slate-800">
            <div className="space-y-6 max-w-xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-950/80 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-none">
                <Sparkles size={14} /> Hubungkan Perusahaan
              </div>
              <h1 className="text-3xl font-black italic tracking-tighter leading-tight uppercase">
                Akses Dokumen Ditangguhkan
              </h1>
              <p className="text-slate-300 text-xs font-medium leading-relaxed">
                Modul Dokumen Lingkungan memerlukan data profil perusahaan terdaftar yang aktif. Daftarkan entitas bisnis Anda sekarang untuk mendapatkan otorisasi dokumen [3].
              </p>
              <div className="pt-2">
                <Button
                  onClick={() => navigate("/company/register")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-5 rounded-none shadow-none uppercase tracking-widest transition-all"
                >
                  Registrasi Perusahaan Baru <ChevronRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusStep = () => {
    switch (company.status) {
      case "PENDING": return 1;
      case "REVIEW": return 2;
      case "APPROVED": return 3;
      default: return 0;
    }
  };

  const currentStep = getStatusStep();

  return (
    <DashboardLayout role="PERUSAHAAN">
      <div className="space-y-4 text-left animate-in fade-in duration-300">

        {/* 1. SHARED COMPANY HEADER [3] */}
        <CompanyHeader />

        {/* 2. PAGE ACTION BAR (DENSE TOOLBAR) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 border border-slate-200 rounded-none shadow-none">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Dokumen Lingkungan</h1>
            <p className="text-slate-500 font-medium text-xs mt-1.5">Pantau siklus validasi dan unduh sertifikat kesanggupan lingkungan (SPPL/UKL-UPL) Anda [3].</p>
          </div>

          {company.status === "APPROVED" && (
            <Button
              onClick={() => setIsPreviewOpen(true)}
              className="w-full sm:w-auto h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase tracking-widest gap-1.5 shadow-none rounded-none px-4"
            >
              <Eye size={12} /> Lihat Sertifikat
            </Button>
          )}
        </div>

        {/* 3. STATUS STEPPER PANEL (GFW TACTICAL LOOK) */}
        <Card className="rounded-none border border-slate-200 p-6 bg-white shadow-none space-y-6">
          <div className="border-b pb-3">
            <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest">Siklus Validasi Berkas</h3>
          </div>

          {/* Stepper Grid (Sharp Edges & Minimalist) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <StepItem
              step={1}
              active={currentStep >= 1}
              label="Registrasi & Data Teknis"
              desc="Pengisian identitas, legalitas NIB & smart assessment selesai [3]."
              icon={<FileText size={16} />}
            />
            <StepItem
              step={2}
              active={currentStep >= 2}
              label="Verifikasi & Validasi DLH"
              desc="Pemeriksaan berkas NIB & analisis kesesuaian spasial pada peta GIS [3]."
              icon={<Clock size={16} />}
            />
            <StepItem
              step={3}
              active={currentStep === 3}
              label="Sertifikat Diterbitkan"
              desc="Persetujuan dokumen selesai & QR-Code verifikasi diaktifkan oleh pimpinan [3]."
              icon={<ShieldCheck size={16} />}
              isLast
            />
          </div>

          {/* Status Alert Banner */}
          {company.status === "APPROVED" ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-none flex items-start gap-3">
              <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={16} />
              <div>
                <h4 className="font-black text-emerald-950 text-[10px] uppercase tracking-widest leading-none">Dokumen Wajib Lingkungan Anda Aktif</h4>
                <p className="text-[9px] font-semibold text-emerald-700 mt-1.5 leading-normal">
                  Sertifikat registrasi digital Anda telah resmi ditandatangani secara elektronik. Anda berhak melakukan operasional usaha sesuai regulasi pengawasan lingkungan.
                </p>
              </div>
            </div>
          ) : company.status === "REVIEW" ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-none flex items-start gap-3">
              <Clock className="text-amber-600 shrink-0 mt-0.5 animate-pulse" size={16} />
              <div>
                <h4 className="font-black text-amber-950 text-[10px] uppercase tracking-widest leading-none">Sedang Ditinjau Petugas Dinas</h4>
                <p className="text-[9px] font-semibold text-amber-700 mt-1.5 leading-normal">
                  Petugas DLH sedang meninjau isian teknis dan validasi zonasi KBLI usaha Anda pada peta GIS. Mohon tunggu maksimal 1-3 hari kerja.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-none flex items-start gap-3">
              <AlertCircle className="text-slate-400 shrink-0 mt-0.5" size={16} />
              <div>
                <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-widest leading-none">Menunggu Proses Antrian</h4>
                <p className="text-[9px] font-semibold text-slate-500 mt-1.5 leading-normal">
                  Pendaftaran Anda telah masuk antrian sistem. Petugas akan segera memproses validasi berkas identitas usaha Anda.
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* 4. CERTIFICATE PREVIEW DIALOG (GFW OFFICIAL BAP STYLE) */}
        {isPreviewOpen && (
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="max-w-[650px] w-[95vw] md:w-full bg-stone-50 border border-stone-300 rounded-none p-0 text-stone-900 shadow-2xl overflow-hidden relative z-[9999]">
              <div className="max-h-[85vh] overflow-y-auto p-6 md:p-10 relative w-full">
                {/* Border Frame Bingkai Dokumen Resmi Kaku Siku */}
                <div className="absolute inset-3 border border-dashed border-stone-400 rounded-none pointer-events-none" />

                <div className="space-y-6 text-center relative z-10 font-sans">
                  {/* Government Header */}
                  <div className="flex flex-col items-center border-b-2 border-stone-800 pb-4">
                    <div className="w-10 h-10 bg-stone-200 rounded-none border border-stone-300 flex items-center justify-center text-stone-700 mb-2">
                      <Leaf size={24} />
                    </div>
                    <h2 className="text-xs font-black tracking-wider leading-none uppercase text-stone-800">Pemerintah Kabupaten / Kota</h2>
                    <h3 className="text-sm font-black tracking-widest leading-none uppercase mt-1 text-stone-900">Dinas Lingkungan Hidup</h3>
                    <p className="text-[8px] text-stone-500 font-bold tracking-[0.2em] uppercase mt-1.5">Sertifikat Registrasi Lingkungan Digital</p>
                  </div>

                  {/* Title */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-black tracking-widest uppercase underline leading-none text-stone-900">Surat Bukti Registrasi Lingkungan</h4>
                    <p className="text-[9px] text-stone-500 font-mono font-bold">Nomor: REG/LH/{company.nib}/{new Date().getFullYear()}</p>
                  </div>

                  {/* Content */}
                  <div className="space-y-3.5 text-[10px] leading-relaxed max-w-xl mx-auto text-stone-700 text-justify">
                    <p className="font-medium">
                      Berdasarkan Undang-Undang Perlindungan dan Pengelolaan Lingkungan Hidup, Dinas Lingkungan Hidup menyatakan bahwa pelaku usaha di bawah ini:
                    </p>

                    <div className="flex flex-col md:grid md:grid-cols-3 gap-y-1.5 md:gap-y-2 border-y border-stone-200 py-3 font-bold text-left bg-stone-100/50 px-3">
                      <span className="text-stone-500 uppercase tracking-wider text-[8px]">Nama Perusahaan</span>
                      <span className="md:col-span-2 text-stone-950 text-[9px] break-words"><span className="hidden md:inline">:</span> {company.companyName}</span>

                      <span className="text-stone-500 uppercase tracking-wider text-[8px] mt-1.5 md:mt-0">Nomor Induk Berusaha</span>
                      <span className="md:col-span-2 text-stone-950 text-[9px] font-mono break-words"><span className="hidden md:inline">:</span> {company.nib}</span>

                      <span className="text-stone-500 uppercase tracking-wider text-[8px] mt-1.5 md:mt-0">Alamat Usaha</span>
                      <span className="md:col-span-2 text-stone-950 text-[9px] break-words"><span className="hidden md:inline">:</span> {company.address}</span>

                      <span className="text-stone-500 uppercase tracking-wider text-[8px] mt-1.5 md:mt-0">Dokumen Lingkungan</span>
                      <span className="md:col-span-2 text-stone-950 text-[9px] break-words"><span className="hidden md:inline">:</span> {company.docType} (Registrasi Elektronik)</span>
                    </div>

                    <p className="font-medium">
                      Telah terdaftar dalam sistem pengawasan lingkungan <strong className="text-stone-900 font-black">PANTAU LIMBAH</strong> dengan kewajiban melakukan pelaporan logbook limbah berkala, mematuhi parameter kepatuhan TPS B3, dan bersedia dilakukan inspeksi berkala oleh petugas dinas [3].
                    </p>
                  </div>

                  {/* Signatures & QR Code */}
                  <div className="grid grid-cols-2 gap-4 items-end pt-4 border-t border-stone-200">
                    {/* QR Security */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => setShowQRVerify(!showQRVerify)}
                        className="p-2 bg-white border border-stone-300 rounded-none hover:border-emerald-600 transition-all relative group outline-none"
                      >
                        <QrCode className="text-stone-800" size={56} />
                        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[7px] font-black text-stone-400 group-hover:text-emerald-600 whitespace-nowrap uppercase tracking-wider">
                          Verifikasi QR
                        </span>
                      </button>

                      {showQRVerify && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-slate-200 p-5 rounded-none shadow-2xl z-[9999] max-w-xs w-full animate-in zoom-in duration-200 text-left font-sans">
                          <div className="space-y-4">
                            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-none flex items-center justify-center mx-auto">
                              <ShieldCheck size={20} />
                            </div>
                            <div className="text-center">
                              <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-wider leading-none">QR Code Terverifikasi</h4>
                              <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Sertifikasi Elektronik BSRE DLH</p>
                            </div>
                            <div className="text-[9px] text-left bg-slate-50 p-2.5 rounded-none border border-slate-200 font-mono break-all text-slate-500 space-y-1">
                              <p><strong>Hash:</strong> sha256:d8c91a03f48...</p>
                              <p><strong>Status:</strong> Valid / Active</p>
                              <p><strong>Signee:</strong> Kepala Dinas LH</p>
                            </div>
                            <Button
                              onClick={() => setShowQRVerify(false)}
                              className="bg-slate-900 hover:bg-slate-800 h-9 w-full rounded-none text-[9px] font-black uppercase tracking-widest text-white"
                            >
                              Tutup
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dinas Signature */}
                    <div className="text-center space-y-3 font-sans">
                      <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest leading-none">Kepala Dinas Lingkungan Hidup</p>
                      <div className="h-8 flex items-center justify-center">
                        <span className="text-[8px] font-black tracking-widest text-emerald-600 border border-emerald-500 border-dashed rounded-none px-3 py-1 rotate-[-3deg] uppercase">
                          TANDATANGAN ELEKTRONIK
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-stone-900 underline leading-none">Dr. Ir. H. Ahmad Heryawan, M.Si.</p>
                        <p className="text-[8px] text-stone-400 font-bold tracking-tight">NIP. 19720315 199803 1 002</p>
                      </div>
                    </div>
                  </div>

                  {/* Print button */}
                  <div className="pt-3 flex gap-2">
                    <Button
                      disabled={isDownloading}
                      onClick={handleDownloadPdf}
                      variant="outline"
                      className="flex-1 rounded-none h-10 border-stone-300 text-stone-700 font-black text-[9px] uppercase tracking-widest gap-1.5 disabled:opacity-70"
                    >
                      {isDownloading ? <Sparkles className="animate-pulse" size={12} /> : <Download size={12} />}
                      {isDownloading ? "MENGUNDUH..." : "UNDUH PDF"}
                    </Button>
                    <Button
                      disabled={isDownloading}
                      onClick={() => setIsPreviewOpen(false)}
                      className="flex-1 rounded-none h-10 bg-slate-900 hover:bg-slate-800 text-stone-100 font-black text-[9px] uppercase tracking-widest"
                    >
                      TUTUP PREVIEW
                    </Button>
                  </div>

                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

      </div>
    </DashboardLayout>
  );
}

// --- SUB-COMPONENTS ---
function StepItem({ step, active, label, desc, icon, isLast }: { step: number, active: boolean, label: string, desc: string, icon: any, isLast?: boolean }) {
  return (
    <div className="flex flex-col items-start text-left relative space-y-3 flex-1">
      {/* Connector line */}
      {!isLast && (
        <div className={`hidden md:block absolute top-5 left-10 right-[-20px] h-[1px] z-0 transition-colors duration-500 ${active ? "bg-emerald-500" : "bg-slate-200"}`} />
      )}

      <div className={`w-10 h-10 rounded-none flex items-center justify-center z-10 transition-all duration-500 border ${active ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-100 border-slate-200 text-slate-400"}`}>
        {icon}
      </div>

      <div className="space-y-1">
        <h4 className={`text-[10px] font-black uppercase tracking-wider leading-none ${active ? "text-slate-800" : "text-slate-400"}`}>
          Langkah {step}: {label}
        </h4>
        <p className="text-[10px] font-semibold text-slate-500 leading-normal">{desc}</p>
      </div>
    </div>
  );
}