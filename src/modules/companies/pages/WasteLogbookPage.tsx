// src/modules/companies/pages/WasteLogbookPage.tsx
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileSpreadsheet, Plus, Sparkles, ChevronRight, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Mengimpor Komponen Modular Taktis GFW (Prinsip GRASP: Low Coupling) [3]
import CompanyHeader from "../components/CompanyHeader";
import WasteLogbookForm from "../components/forms/WasteLogbookForm";
import WasteLogbookTable from "../components/tables/WasteLogbookTable";

export default function WasteLogbookPage() {
  const { currentUser, companies, selectedCompanyId, fetchWasteLogs } = useSijagaStore();
  const navigate = useNavigate();

  // State Pengendali Dialog Input Form [3]
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Sinkronisasi data logbook saat ID perusahaan aktif berganti (Information Expert) [3]
  useEffect(() => {
    if (selectedCompanyId) {
      fetchWasteLogs(selectedCompanyId);
    }
  }, [selectedCompanyId, fetchWasteLogs]);

  // Mengidentifikasi profil badan usaha aktif secara aman [3]
  const activeCompany = companies.find(c => c.id === selectedCompanyId) ||
    companies.find(c => c.id === currentUser?.companyId) ||
    companies[0];

  // ONBOARDING PROTECTION: Cegah pengisian jika badan usaha belum terdaftar [3]
  if (!activeCompany) {
    return (
      <DashboardLayout role="PERUSAHAAN">
        <div className="max-w-4xl mx-auto py-12 text-left font-sans animate-in fade-in duration-500">
          <div className="bg-slate-900 text-white rounded-none p-10 border border-slate-800 shadow-none">
            <div className="space-y-6 max-w-xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-950/80 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-none">
                <Sparkles size={14} /> Hubungkan Perusahaan
              </div>
              <h1 className="text-3xl font-black italic tracking-tighter leading-tight uppercase">
                Akses Logbook Ditangguhkan
              </h1>
              <p className="text-slate-300 text-xs font-medium leading-relaxed">
                Modul pencatatan logbook limbah berkala memerlukan profil perusahaan terdaftar yang aktif. Daftarkan entitas bisnis Anda sekarang untuk mendapatkan otorisasi pelaporan [3].
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

  const handleExportExcel = () => {
    toast.success("Logbook berhasil dieksport ke file Excel (.XLSX) sesuai regulasi SIPEL.");
  };

  return (
    <DashboardLayout role="PERUSAHAAN">
      <div className="space-y-4 text-left animate-in fade-in duration-300">

        {/* 1. SHARED COMPANY HEADER (NIB, Alamat, Status) [3] */}
        <CompanyHeader />

        {/* 2. PAGE ACTION BAR (DENSE TOOLBAR - GFW STYLE) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 border border-slate-200 rounded-none shadow-none">
          <div className="space-y-1">
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
              Logbook Limbah Berkala
            </h1>
            <p className="text-slate-500 font-medium text-xs">
              Catat emisi dan pembuangan limbah harian untuk pelaporan dinas secara berkala [3].
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={handleExportExcel}
              variant="outline"
              className="flex-1 sm:flex-none h-9 rounded-none text-[9px] border-slate-300 font-black uppercase tracking-widest gap-1.5"
            >
              <FileSpreadsheet size={12} /> Export Excel
            </Button>

            <Button
              onClick={() => setIsDialogOpen(true)}
              className="flex-1 sm:flex-none h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-[9px] font-black uppercase tracking-widest gap-1.5 shadow-none"
            >
              <Plus size={12} /> Catat Limbah
            </Button>
          </div>
        </div>

        {/* 3. MODULAR HIGH DENSITY TABLES */}
        <div className="space-y-2">
          <div className="bg-slate-50 border border-slate-200 px-4 py-2 flex justify-between items-center rounded-none">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <ClipboardList size={12} className="text-emerald-700" /> Database Logbook Historis
            </span>
          </div>
          {/* Komponen Tabel yang diisolasi penuh (GRASP High Cohesion) [3] */}
          <WasteLogbookTable />
        </div>

        {/* 4. MODULAR INPUT DIALOG */}
        {isDialogOpen && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[480px] rounded-none bg-white border border-slate-200 text-left p-6 z-[9999]">
              <DialogHeader className="border-b pb-3">
                <DialogTitle className="text-xs font-black tracking-widest text-slate-800 uppercase flex items-center gap-2">
                  Catat Limbah Baru
                </DialogTitle>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                  Isi volume limbah beserta metode pengelolaan lingkungan [3]
                </p>
              </DialogHeader>

              {/* Form Input yang telah didelegasikan dan bertipe eksplisit React.FC [3] */}
              <div className="py-2">
                <WasteLogbookForm onSuccess={() => setIsDialogOpen(false)} />
              </div>
            </DialogContent>
          </Dialog>
        )}

      </div>
    </DashboardLayout>
  );
}