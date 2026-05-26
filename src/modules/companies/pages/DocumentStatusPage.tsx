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
  Sparkles, ChevronRight, X, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/lib/api";

// Mengimpor Komponen Modular Taktis GFW [3]
import CompanyHeader from "../components/CompanyHeader";

export default function DocumentStatusPage() {
  const { currentUser, companies, selectedCompanyId, downloadCompanyCertificate, invoices, createRetribusiInvoice } = useSijagaStore();
  const navigate = useNavigate();

  // State Pengendali Preview Sertifikat Nyata (PDF) [3]
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  // Mengidentifikasi entitas perusahaan terdaftar
  const company = companies.find(c => c.id === selectedCompanyId) ||
    companies.find(c => c.id === currentUser?.companyId) ||
    companies[0];

  // Cek Status Pembayaran Retribusi (Payment Barrier) - Gunakan invoice retribusi terbaru
  const isUklUpl = company?.docType === "UKL-UPL" || company?.docType === "UKL_UPL";
  const retribusiType = isUklUpl ? "Retribusi UKL-UPL" : "Retribusi SPPL";
  
  const companyRetribusiInvoices = invoices.filter(
    i => i.companyId === company?.id && (i.type === "Retribusi UKL-UPL" || i.type === "Retribusi SPPL" || i.type.includes("Retribusi"))
  );
  
  const latestRetribusiInvoice = companyRetribusiInvoices.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.id.localeCompare(a.id);
  })[0];
  
  const isPaymentPending = company?.status === "APPROVED" && (!latestRetribusiInvoice || latestRetribusiInvoice.status !== "SETTLED");

  const handlePreviewPdf = async () => {
    if (!company) return;
    setIsDownloading(true);
    try {
      const blob = await apiService.companies.downloadCertificatePdf(company.id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      setPreviewPdfUrl(url);
    } catch (error) {
      console.error("Preview failed", error);
      toast.error("Gagal memuat dokumen PDF. Pastikan server Backend aktif.");
    } finally {
      setIsDownloading(false);
    }
  };

  const forceDownloadFromPreview = () => {
    if (!company || !previewPdfUrl) return;
    const link = document.createElement('a');
    link.href = previewPdfUrl;
    link.setAttribute('download', `Sertifikat_${company.companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateInvoiceAndPay = async () => {
    navigate("/company/payments");
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
              disabled={isDownloading}
              onClick={handlePreviewPdf}
              className={`w-full sm:w-auto h-9 font-black text-[9px] uppercase tracking-widest gap-1.5 shadow-none rounded-none px-4 ${
                "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              {isDownloading ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />} 
              {isDownloading ? "MEMUAT BERKAS..." : "LIHAT SERTIFIKAT"}
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
          {company.status === "APPROVED" && !isPaymentPending ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-none flex items-start gap-3">
              <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={16} />
              <div>
                <h4 className="font-black text-emerald-950 text-[10px] uppercase tracking-widest leading-none">Dokumen Wajib Lingkungan Anda Aktif</h4>
                <p className="text-[9px] font-semibold text-emerald-700 mt-1.5 leading-normal">
                  Sertifikat registrasi digital Anda telah resmi ditandatangani secara elektronik. Anda berhak melakukan operasional usaha sesuai regulasi pengawasan lingkungan.
                  {company.certificateActiveUntil && ` (Masa Berlaku s.d. ${new Date(company.certificateActiveUntil).toLocaleDateString("id-ID")})`}
                </p>
              </div>
            </div>
          ) : company.status === "APPROVED" && isPaymentPending ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-none flex flex-col items-start gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-rose-600 shrink-0 mt-0.5 animate-pulse" size={16} />
                <div className="w-full">
                  <h4 className="font-black text-rose-950 text-[10px] uppercase tracking-widest leading-none">Peringatan: Tagihan Retribusi Belum Dibayar</h4>
                  <p className="text-[9px] font-semibold text-rose-700 mt-1.5 leading-normal">
                    Dokumen Anda telah disetujui dan sertifikat sudah dapat diunduh. Namun, Anda memiliki tagihan retribusi yang harus segera diselesaikan untuk memperpanjang masa aktif izin Anda.
                    {company.certificateActiveUntil && ` (Masa Berlaku s.d. ${new Date(company.certificateActiveUntil).toLocaleDateString("id-ID")})`}
                  </p>
                  <div className="mt-3">
                    <Button
                      disabled={isCreatingInvoice}
                      onClick={handleCreateInvoiceAndPay}
                      className="h-8 bg-rose-600 hover:bg-rose-700 text-white rounded-none text-[9px] font-black uppercase tracking-widest shadow-none gap-2 flex items-center"
                    >
                      Bayar Tagihan Retribusi
                    </Button>
                  </div>
                </div>
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

        {/* 4. REAL PDF FULLSCREEN PREVIEW OVERLAY */}
        {previewPdfUrl && (
          <Dialog open={!!previewPdfUrl} onOpenChange={() => setPreviewPdfUrl(null)}>
            <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 rounded-none overflow-hidden flex flex-col bg-slate-950 border border-slate-800 shadow-2xl z-[9999]">
              {/* Overlay Header Hitam Taktis */}
              <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-none bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="font-sans text-left">
                    <p className="text-sm font-black tracking-wide text-slate-100">Pratinjau Sertifikat Resmi (PDF)</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{company.companyName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={forceDownloadFromPreview} 
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white px-4 py-2 rounded-none text-xs font-bold transition-colors border border-slate-700 hover:border-emerald-500 shadow-sm uppercase tracking-widest"
                  >
                    <Download size={14} /> Unduh
                  </button>
                  <div className="w-px h-6 bg-slate-700 mx-1" />
                  <button 
                    onClick={() => setPreviewPdfUrl(null)} 
                    className="p-2 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-none transition-colors border border-transparent hover:border-rose-500/30"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              {/* Area Render PDF (Memanfaatkan iframe native browser) */}
              <iframe 
                src={previewPdfUrl} 
                title="Sertifikat Digital" 
                className="w-full flex-1 border-none bg-slate-100" 
              />
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