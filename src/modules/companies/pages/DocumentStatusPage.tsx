import React, { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  ShieldCheck, Leaf, QrCode, Download, Eye,
  Clock, CheckCircle2, AlertCircle, FileText,
  Sparkles, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function DocumentStatusPage() {
  const { currentUser, companies, selectedCompanyId, downloadCompanyCertificate } = useSijagaStore();
  const navigate = useNavigate();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showQRVerify, setShowQRVerify] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Find company
  const company = companies.find(c => c.id === selectedCompanyId) || companies.find(c => c.id === currentUser?.companyId) || companies[0];

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
        <div className="max-w-4xl mx-auto py-12 text-left font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 md:p-12 relative overflow-hidden border border-slate-800 shadow-2xl">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px]" />
            <div className="relative z-10 space-y-6 max-w-xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider animate-pulse">
                <Sparkles size={14} /> Hubungkan Perusahaan
              </div>
              <h1 className="text-3xl font-black italic tracking-tighter leading-tight">
                Belum Ada Perusahaan Terdaftar
              </h1>
              <p className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed">
                Untuk dapat mengakses modul Dokumen Lingkungan SPPL/UKL-UPL, Anda harus mendaftarkan profil badan usaha atau perusahaan Anda terlebih dahulu ke sistem. Satu akun dapat mengelola beberapa perusahaan sekaligus.
              </p>
              <div className="pt-4">
                <Button
                  onClick={() => navigate("/company/register")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm px-8 py-6 rounded-2xl shadow-lg shadow-emerald-950/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  Registrasi Perusahaan Baru <ChevronRight size={18} />
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
      <div className="space-y-8 text-left">

        {/* Header */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Dokumen Lingkungan</h1>
            <p className="text-slate-500 font-medium mt-2">Pantau status validasi dan unduh dokumen kesanggupan lingkungan (SPPL/UKL-UPL) Anda.</p>
          </div>

          {company.status === "APPROVED" && (
            <Button
              onClick={() => setIsPreviewOpen(true)}
              className="w-full md:w-auto h-12 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 font-bold gap-2 px-6 rounded-xl"
            >
              <Eye size={18} /> Lihat Sertifikat
            </Button>
          )}
        </div>

        {/* Status Tracker */}
        <Card className="rounded-[2.5rem] p-8 border-none shadow-xl shadow-slate-200/50 bg-white space-y-8">
          <div>
            <h3 className="font-black text-xl text-slate-800 tracking-tight">Status Dokumen Saat Ini</h3>
            <p className="text-xs text-slate-400 font-bold uppercase mt-1">Siklus registrasi digital dokumen SPPL / UKL-UPL</p>
          </div>

          {/* Stepper UI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <StepItem
              step={1}
              active={currentStep >= 1}
              label="Registrasi & Data Teknis"
              desc="Pengisian identitas, legalitas NIB & smart assessment selesai."
              icon={<FileText size={20} />}
            />
            <StepItem
              step={2}
              active={currentStep >= 2}
              label="Verifikasi & Validasi DLH"
              desc="Petugas melakukan verifikasi NIB & pemetaan geospasial GIS."
              icon={<Clock size={20} />}
            />
            <StepItem
              step={3}
              active={currentStep === 3}
              label="Sertifikat Diterbitkan"
              desc="Dokumen disetujui, QR-Code verifikasi diaktifkan oleh pimpinan."
              icon={<ShieldCheck size={20} />}
              isLast
            />
          </div>

          {/* Status Alert Banner */}
          {company.status === "APPROVED" ? (
            <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="text-emerald-600 shrink-0" size={24} />
              <div>
                <h4 className="font-black text-emerald-950 text-sm leading-none">Dokumen Wajib Lingkungan Anda Aktif</h4>
                <p className="text-xs text-emerald-700 mt-1 leading-normal">
                  Sertifikat registrasi digital Anda telah resmi ditandatangani secara elektronik. Anda berhak melakukan operasional usaha sesuai regulasi pengawasan lingkungan.
                </p>
              </div>
            </div>
          ) : company.status === "REVIEW" ? (
            <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
              <Clock className="text-amber-600 shrink-0" size={24} />
              <div>
                <h4 className="font-black text-amber-950 text-sm leading-none">Sedang Ditinjau Petugas Dinas</h4>
                <p className="text-xs text-amber-700 mt-1 leading-normal">
                  Petugas DLH sedang meninjau isian teknis dan validasi zonasi KBLI usaha Anda pada peta GIS. Mohon tunggu maksimal 1-3 hari kerja.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
              <AlertCircle className="text-slate-400 shrink-0" size={24} />
              <div>
                <h4 className="font-black text-slate-800 text-sm leading-none">Menunggu Proses Antrian</h4>
                <p className="text-xs text-slate-500 mt-1 leading-normal">
                  Pendaftaran Anda telah masuk antrian sistem. Petugas akan segera memproses validasi berkas identitas usaha Anda.
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Certificate Dialog Preview */}
        {isPreviewOpen && (
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="max-w-[700px] w-[95vw] md:w-full bg-stone-50 border border-stone-200 rounded-[2.5rem] p-0 text-stone-900 shadow-2xl overflow-hidden">
              <div className="max-h-[85vh] overflow-y-auto p-6 md:p-12 relative w-full">
                {/* Certificate Border decoration */}
                <div className="absolute inset-4 border-2 border-dashed border-stone-300 rounded-[2rem] pointer-events-none" />

                <div className="space-y-8 text-center relative z-10">
                {/* Government Header */}
                <div className="flex flex-col items-center border-b-4 border-double border-stone-800 pb-6">
                  <div className="w-14 h-14 bg-stone-200 rounded-full flex items-center justify-center text-stone-700 shadow-inner mb-3">
                    <Leaf size={32} />
                  </div>
                  <h2 className="text-xl font-bold tracking-wider leading-none uppercase">Pemerintah Kabupaten / Kota Bandung</h2>
                  <h3 className="text-2xl font-black tracking-tight leading-none uppercase mt-1">Dinas Lingkungan Hidup</h3>
                  <p className="text-[10px] text-stone-500 font-bold tracking-widest uppercase mt-2">Sertifikat Registrasi Lingkungan Digital</p>
                </div>

                {/* Certificate Title */}
                <div className="space-y-2">
                  <h4 className="text-lg font-black tracking-tight uppercase underline leading-none">Surat Bukti Registrasi Lingkungan</h4>
                  <p className="text-xs text-stone-500 font-bold">Nomor: REG/LH/{company.nib}/{new Date().getFullYear()}</p>
                </div>

                {/* Certificate Content Body */}
                <div className="space-y-4 text-xs leading-relaxed max-w-xl mx-auto text-stone-700">
                  <p className="text-justify font-medium">
                    Berdasarkan Undang-Undang Perlindungan dan Pengelolaan Lingkungan Hidup, Dinas Lingkungan Hidup menyatakan bahwa pelaku usaha di bawah ini:
                  </p>

                  <div className="flex flex-col md:grid md:grid-cols-3 gap-y-1 md:gap-y-2 border-y border-stone-200 py-4 font-bold text-left text-[10px] md:text-xs">
                    <span className="text-stone-500">Nama Perusahaan</span>
                    <span className="md:col-span-2 text-stone-900 break-words"><span className="hidden md:inline">:</span> {company.companyName}</span>

                    <span className="text-stone-500 mt-2 md:mt-0">Nomor Induk Berusaha</span>
                    <span className="md:col-span-2 text-stone-900 break-words"><span className="hidden md:inline">:</span> {company.nib}</span>

                    <span className="text-stone-500 mt-2 md:mt-0">Alamat Usaha</span>
                    <span className="md:col-span-2 text-stone-900 break-words"><span className="hidden md:inline">:</span> {company.address}</span>

                    <span className="text-stone-500 mt-2 md:mt-0">Dokumen Lingkungan</span>
                    <span className="md:col-span-2 text-stone-900 break-words"><span className="hidden md:inline">:</span> {company.docType} (Rekomendasi Penapisan Otomatis)</span>
                  </div>

                  <p className="text-justify font-medium">
                    Telah terdaftar dalam sistem pengawasan lingkungan **PANTAU LIMBAH Lingkungan** dengan kewajiban melakukan pelaporan logbook limbah berkala, mematuhi parameter kepatuhan TPS B3, dan bersedia dilakukan inspeksi berkala.
                  </p>
                </div>

                {/* Signatures & QR Verification */}
                <div className="grid grid-cols-2 gap-8 items-end pt-6 border-t border-stone-200">
                  {/* QR Security */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => setShowQRVerify(!showQRVerify)}
                      className="p-3 bg-white border border-stone-300 rounded-2xl shadow-sm hover:border-emerald-600 hover:shadow-emerald-50 hover:shadow-lg transition-all relative group"
                    >
                      <QrCode className="text-stone-800 group-hover:text-emerald-700" size={64} />
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-stone-400 group-hover:text-emerald-600 whitespace-nowrap uppercase tracking-wider">
                        Klik Verifikasi QR
                      </span>
                    </button>

                    {showQRVerify && (
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-slate-200 p-6 rounded-3xl shadow-2xl z-[999] max-w-sm w-full animate-in zoom-in duration-300">
                        <div className="space-y-4">
                          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                            <ShieldCheck size={28} />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-800 text-sm">QR Code Terverifikasi</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Badan Sertifikasi Elektronik DLH</p>
                          </div>
                          <div className="text-[10px] text-left bg-slate-50 p-3 rounded-xl border font-mono break-all text-slate-500 space-y-1">
                            <p><strong>Hash:</strong> sha256:d8c91a03f48...</p>
                            <p><strong>Valid:</strong> True</p>
                            <p><strong>Pimpinan:</strong> Kepala Dinas LH</p>
                          </div>
                          <Button
                            onClick={() => setShowQRVerify(false)}
                            className="bg-emerald-600 hover:bg-emerald-700 h-9 w-full rounded-xl text-xs font-bold text-white"
                          >
                            Tutup
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dinas Signature */}
                  <div className="text-center space-y-4">
                    <p className="text-[10px] font-black text-stone-500 uppercase tracking-wider">Kepala Dinas Lingkungan Hidup</p>
                    <div className="h-10 flex items-center justify-center">
                      <span className="text-[9px] font-bold tracking-widest text-emerald-600 border-2 border-emerald-500 border-dashed rounded-full px-4 py-1.5 rotate-[-6deg] uppercase">
                        TANDATANGAN ELEKTRONIK
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-stone-900 underline">Dr. Ir. H. Ahmad Heryawan, M.Si.</p>
                      <p className="text-[9px] text-stone-400 font-bold">NIP. 19720315 199803 1 002</p>
                    </div>
                  </div>
                </div>

                {/* Print button */}
                <div className="pt-4 flex gap-3">
                  <Button disabled={isDownloading} onClick={handleDownloadPdf} variant="outline" className="flex-1 rounded-xl h-11 border-stone-300 text-stone-700 font-bold gap-2 disabled:opacity-70">
                    {isDownloading ? <Sparkles className="animate-pulse" size={16} /> : <Download size={16} />} 
                    {isDownloading ? "Mengunduh..." : "Unduh PDF"}
                  </Button>
                  <Button disabled={isDownloading} onClick={() => setIsPreviewOpen(false)} className="flex-1 rounded-xl h-11 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold">
                    Tutup Preview
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
    <div className="flex flex-col items-start text-left relative space-y-4 flex-1">
      {/* Connector line (desktop only) */}
      {!isLast && (
        <div className={`hidden md:block absolute top-7 left-12 right-[-24px] h-[3px] z-0 transition-colors duration-500 ${active ? "bg-emerald-500" : "bg-slate-200"}`} />
      )}

      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center z-10 transition-all duration-500 shadow-md ${active ? "bg-emerald-600 text-white shadow-emerald-100" : "bg-slate-100 text-slate-400"}`}>
        {icon}
      </div>

      <div className="space-y-1">
        <h4 className={`text-xs font-black uppercase tracking-wider ${active ? "text-slate-800" : "text-slate-400"}`}>
          Step {step}: {label}
        </h4>
        <p className="text-[11px] font-medium text-slate-500 leading-normal">{desc}</p>
      </div>
    </div>
  );
}
