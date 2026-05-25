// src/modules/companies/pages/PickupRequestPage.tsx
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Sparkles, ChevronRight, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mengimpor Komponen Modular Taktis GFW (Prinsip GRASP: Low Coupling) [3]
import CompanyHeader from "../components/CompanyHeader";
import PickupRequestForm from "../components/forms/PickupRequestForm";
import PickupRequestTable from "../components/tables/PickupRequestTable";

export default function PickupRequestPage() {
  const navigate = useNavigate();
  const { currentUser, companies, selectedCompanyId, fetchPickupRequests } = useSijagaStore();

  // State Pengendali Dialog Input Form [3]
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Sync data pengangkutan saat ID perusahaan aktif berganti (Information Expert) [3]
  useEffect(() => {
    if (selectedCompanyId) {
      fetchPickupRequests(selectedCompanyId);
    }
  }, [selectedCompanyId, fetchPickupRequests]);

  // Mengidentifikasi entitas perusahaan aktif
  const company = companies.find(c => c.id === selectedCompanyId) ||
    companies.find(c => c.id === currentUser?.companyId) ||
    companies[0];

  // ONBOARDING PROTECTION: Cegah pengajuan jika perusahaan belum terdaftar [3]
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
                Akses Pickup Ditangguhkan
              </h1>
              <p className="text-slate-300 text-xs font-medium leading-relaxed">
                Untuk mengajukan pengangkutan limbah B3 oleh armada transporter berlisensi, Anda harus mendaftarkan profil badan usaha/perusahaan terlebih dahulu ke dalam sistem [3].
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

  return (
    <DashboardLayout role="PERUSAHAAN">
      <div className="space-y-4 text-left animate-in fade-in duration-300">

        {/* 1. SHARED COMPANY HEADER [3] */}
        <CompanyHeader />

        {/* 2. PAGE ACTION BAR (DENSE TOOLBAR) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 border border-slate-200 rounded-none shadow-none">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Jasa Pengangkutan Limbah</h1>
            <p className="text-slate-500 font-medium text-xs mt-1.5">Ajukan pengangkutan limbah berbahaya (B3) Anda ke transporter berlisensi daerah [3].</p>
          </div>

          <Button
            onClick={() => setIsDialogOpen(true)}
            className="w-full sm:w-auto h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-[9px] font-black uppercase tracking-widest gap-1.5 shadow-none"
          >
            <Plus size={12} /> Request Pickup Baru
          </Button>
        </div>

        {/* 3. MODULAR HIGH DENSITY TABLES [3] */}
        <div className="space-y-2">
          <div className="bg-slate-50 border border-slate-200 px-4 py-2 flex justify-between items-center rounded-none">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <Truck size={12} /> Riwayat Pengangkutan & Manifest Elektronik
            </span>
          </div>
          {/* Komponen Tabel yang memegang fungsionalitas visualisasi detail rincian pengangkutan */}
          <PickupRequestTable />
        </div>

        {/* 4. MODULAR INPUT DIALOG DIKELOLA SECARA COHESIVE [3] */}
        {isDialogOpen && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[500px] rounded-none bg-white border border-slate-200 text-left p-6 z-[9999]">
              <DialogHeader className="border-b pb-3">
                <DialogTitle className="text-sm font-black tracking-widest text-slate-800 uppercase flex items-center gap-2">
                  Ajukan Pickup Limbah
                </DialogTitle>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Transporter berlisensi akan memverifikasi muatan & jarak [3]</p>
              </DialogHeader>

              {/* Form didelegasikan sepenuhnya ke komponen internal (Low Coupling) [3] */}
              <div className="py-2">
                <PickupRequestForm onSuccess={() => setIsDialogOpen(false)} />
              </div>
            </DialogContent>
          </Dialog>
        )}

      </div>
    </DashboardLayout>
  );
}