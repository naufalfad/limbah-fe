import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Trash2, CreditCard, ShieldCheck, Clock,
  Plus, Sparkles, ChevronRight, Loader2, Activity, ClipboardList
} from "lucide-react";

// Mengimpor Komponen Modular Taktis GFW [3]
import CompanyHeader from "../components/CompanyHeader";
import GFWStatCard from "../components/GFWStatCard";
import WasteLogbookTable from "../components/tables/WasteLogbookTable";
import WasteLogbookForm from "../components/forms/WasteLogbookForm";

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const {
    currentUser,
    selectedCompanyId,
    setSelectedCompanyId,
    companies,
    wasteLogs,
    pickupRequests,
    invoices,
    fetchCompanies,
    fetchWasteLogs,
    fetchPickupRequests,
    fetchInvoices
  } = useSijagaStore();

  const [loading, setLoading] = useState(true);
  const [isLogbookDialogOpen, setIsLogbookDialogOpen] = useState(false);

  // Inisialisasi data master saat pertama kali masuk (Information Expert) [3]
  useEffect(() => {
    const loadCompanies = async () => {
      setLoading(true);
      try {
        await fetchCompanies();
      } catch (error) {
        console.error("Gagal memuat daftar perusahaan:", error);
      } finally {
        setLoading(false);
      }
    };
    loadCompanies();
  }, [fetchCompanies]);

  // Set default company jika belum ada yang terpilih [3]
  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId, setSelectedCompanyId]);

  // Sinkronisasi data detail secara paralel saat ID perusahaan aktif berganti [3]
  useEffect(() => {
    if (selectedCompanyId) {
      const loadCompanyDetails = async () => {
        try {
          await Promise.all([
            fetchWasteLogs(selectedCompanyId),
            fetchPickupRequests(selectedCompanyId),
            fetchInvoices(selectedCompanyId)
          ]);
        } catch (error) {
          console.error("Gagal sinkronisasi data detail perusahaan:", error);
        }
      };
      loadCompanyDetails();
    }
  }, [selectedCompanyId, fetchWasteLogs, fetchPickupRequests, fetchInvoices]);

  const activeCompany = useMemo(() => {
    return companies.find(c => c.id === selectedCompanyId) || companies[0] || null;
  }, [companies, selectedCompanyId]);

  // Kalkulasi statistik data secara terpusat [3]
  const stats = useMemo(() => {
    return {
      totalWaste: wasteLogs.reduce((acc, curr) => acc + (Number(curr.volume) || 0), 0),
      activePickups: pickupRequests.filter(p => p.status !== "COMPLETED").length,
      unpaidAmount: invoices
        .filter(i => i.status === "UNPAID")
        .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0),
      unpaidCount: invoices.filter(i => i.status === "UNPAID").length,
    };
  }, [wasteLogs, pickupRequests, invoices]);

  if (loading) {
    return (
      <DashboardLayout role="PERUSAHAAN">
        <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse uppercase text-[10px] tracking-widest">
            Sinkronisasi Data Pusat...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // ONBOARDING STATE: Jika belum mendaftarkan entitas perusahaan [3]
  if (!activeCompany) {
    return (
      <DashboardLayout role="PERUSAHAAN">
        <div className="max-w-4xl mx-auto py-8 text-left font-sans animate-in fade-in duration-500">
          <div className="bg-slate-900 text-white rounded-none p-8 md:p-12 relative overflow-hidden border border-slate-800 shadow-none">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative z-10 space-y-6 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-950/80 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-none">
                <Sparkles size={12} className="animate-pulse" /> Akun Terverifikasi
              </div>
              <h1 className="text-3xl font-black italic tracking-tighter leading-tight uppercase">
                Halo, {currentUser?.name || "Pelaku Usaha"}!
              </h1>
              <p className="text-slate-300 text-xs font-medium leading-relaxed">
                Anda belum memiliki profil badan usaha yang terdaftar di database GEOPEDAL. Daftarkan entitas usaha Anda sekarang untuk mulai mengajukan dokumen lingkungan (SPPL/UKL-UPL) dan mengakses layanan pengangkutan B3 daerah [3].
              </p>
              <div className="pt-2">
                <Button
                  onClick={() => navigate("/company/register")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-5 rounded-none shadow-none uppercase tracking-widest transition-all"
                >
                  Registrasi Perusahaan <ChevronRight size={14} className="ml-1" />
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

        {/* 2. STATS GRID (GFW TACTICAL LOOK) [3] */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GFWStatCard
            label="Total Produksi Limbah"
            value={`${stats.totalWaste} L/kg`}
            sub="TERLAPOR PADA LOGBOOK"
            icon={<Trash2 />}
            color="emerald"
          />
          <GFWStatCard
            label="Order Pickup Aktif"
            value={stats.activePickups}
            sub="SEDANG DALAM PROSES ANGKUT"
            icon={<Clock />}
            color="blue"
          />
          {/* <GFWStatCard
            label="Tagihan Belum Bayar"
            value={`Rp ${stats.unpaidAmount.toLocaleString()}`}
            sub={`${stats.unpaidCount} INVOICE DI-SETTLE KAS DAERAH`}
            icon={<CreditCard />}
            color="amber"
          /> */}
          <GFWStatCard
            label="Indeks Kepatuhan ESG"
            value={activeCompany.score ? `${activeCompany.score}/100` : "WAITING"}
            sub={activeCompany.score ? "PROFIL AMBANG BATAS AMAN" : "BELUM DILAKUKAN AUDIT LH"}
            icon={<ShieldCheck />}
            color={activeCompany.score && activeCompany.score >= 80 ? "emerald" : "indigo"}
          />
        </div>

        {/* 3. SPLIT PANEL CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* SISI KIRI (75%): Tabel Database Logbook */}
          <div className="lg:col-span-8 space-y-3">
            <div className="border-b border-slate-200 pb-3 flex justify-between items-end">
              <div>
                <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest leading-none flex items-center gap-1.5">
                  <ClipboardList size={14} className="text-emerald-700" /> Database Logbook Historis
                </h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 leading-none">Pencatatan limbah berkala [3]</p>
              </div>
              <Button
                onClick={() => setIsLogbookDialogOpen(true)}
                className="bg-slate-900 hover:bg-emerald-600 h-8 text-[9px] font-black uppercase tracking-widest rounded-none shadow-none px-4"
              >
                <Plus size={12} className="mr-1" /> Catat Limbah
              </Button>
            </div>
            <WasteLogbookTable />
          </div>

          {/* SISI KANAN (25%): Menu Cepat Taktis & EWS Check */}
          <div className="lg:col-span-4 space-y-4">

            {/* Quick Access List */}
            <div className="border border-slate-200 bg-white text-left flex flex-col">
              <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest border-b border-slate-200 p-3 bg-slate-50">Menu Navigasi</h3>
              <div className="flex flex-col divide-y divide-slate-100 font-sans text-xs">
                <QuickMenuRow label="Input Logbook Harian" desc="Pelaporan Rutin" onClick={() => navigate("/company/logbook")} />
                {/* <QuickMenuRow label="Settle Retribusi Daerah" desc="Virtual Account & QRIS" onClick={() => navigate("/company/payments")} /> */}
                <QuickMenuRow label="Unduh Dokumen Lingkungan" desc="SPPL / UKL-UPL Digital" onClick={() => navigate("/company/documents")} />
              </div>
            </div>

            {/* EWS Health Status Box */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-none flex items-start gap-3 text-left">
              <Activity className="text-emerald-600 shrink-0 mt-0.5 animate-pulse" size={16} />
              <div>
                <h4 className="text-[10px] font-black text-emerald-950 uppercase tracking-widest leading-none">EWS System Normal</h4>
                <p className="text-[9px] text-emerald-700 leading-normal mt-1.5 font-semibold">
                  Sistem kecerdasan buatan tidak mendeteksi adanya kebocoran atau pelaporan volume abnormal pada pabrik Anda hari ini.
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* MODULAR INPUT DIALOG UNTUK LOGBOOK */}
        {isLogbookDialogOpen && (
          <Dialog open={isLogbookDialogOpen} onOpenChange={setIsLogbookDialogOpen}>
            <DialogContent className="sm:max-w-[480px] rounded-none bg-white border border-slate-200 text-left p-6 z-[9999]">
              <DialogHeader className="border-b pb-3">
                <DialogTitle className="text-xs font-black tracking-widest text-slate-800 uppercase flex items-center gap-2">
                  Catat Limbah Baru
                </DialogTitle>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                  Isi volume limbah beserta metode pengelolaan lingkungan [3]
                </p>
              </DialogHeader>

              <div className="py-2">
                <WasteLogbookForm onSuccess={() => setIsLogbookDialogOpen(false)} />
              </div>
            </DialogContent>
          </Dialog>
        )}

      </div>
    </DashboardLayout>
  );
}

// Sub-komponen baris menu cepat taktis
function QuickMenuRow({ label, desc, onClick }: { label: string, desc: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="py-3 flex justify-between items-center hover:bg-slate-50 transition-colors text-left w-full px-2 rounded-none outline-none group"
    >
      <div className="px-3">
        <h4 className="font-bold text-slate-800 text-xs group-hover:text-emerald-700 transition-colors">{label}</h4>
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{desc}</p>
      </div>
      <span className="text-slate-400 group-hover:text-emerald-600 font-black transition-transform group-hover:translate-x-1 pr-3">
        →
      </span>
    </button>
  );
}