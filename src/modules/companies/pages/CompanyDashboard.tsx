import React, { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2, Trash2, CreditCard, ShieldCheck,
  Clock, ArrowUpRight, Plus,
  MapPin, CheckCircle2, Sparkles, ChevronRight, Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  // Fetch list of companies initially
  useEffect(() => {
    const loadCompanies = async () => {
      setLoading(true);
      try {
        await fetchCompanies();
      } catch (error) {
        console.error("Gagal mengambil data perusahaan:", error);
      } finally {
        setLoading(false);
      }
    };
    loadCompanies();
  }, [fetchCompanies]);

  // Set default selectedCompanyId if none selected
  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId, setSelectedCompanyId]);

  // Fetch detailed data whenever selectedCompanyId changes
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
          console.error("Gagal menyinkronkan data perusahaan:", error);
        }
      };
      loadCompanyDetails();
    }
  }, [selectedCompanyId, fetchWasteLogs, fetchPickupRequests, fetchInvoices]);

  const activeCompany = useMemo(() => {
    return companies.find(c => c.id === selectedCompanyId) || companies[0] || null;
  }, [companies, selectedCompanyId]);

  // Logic Derivation
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

  // UI Handlers
  const getPickupStatusBadge = (status: string) => {
    const configs: any = {
      PENDING: "bg-slate-100 text-slate-600 border-slate-200",
      PRICED: "bg-blue-50 text-blue-600 border-blue-100 animate-pulse",
      PAID: "bg-amber-50 text-amber-600 border-amber-100",
      ON_THE_ROAD: "bg-indigo-50 text-indigo-600 border-indigo-100",
      LOADED: "bg-purple-50 text-purple-600 border-purple-100",
      COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-100"
    };
    return <Badge className={`${configs[status] || configs.PENDING} border font-black text-[9px] uppercase tracking-wider`}>{status}</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout role="PERUSAHAAN">
        <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse uppercase text-xs tracking-widest">Sinkronisasi Data Pusat...</p>
        </div>
      </DashboardLayout>
    );
  }

  // State: Jika Belum Punya Perusahaan (Onboarding)
  if (!activeCompany) {
    return (
      <DashboardLayout role="PERUSAHAAN">
        <div className="max-w-6xl mx-auto py-4 text-left font-sans space-y-8 animate-in fade-in duration-500">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 md:p-12 relative overflow-hidden border border-slate-800 shadow-2xl">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />
            <div className="relative z-10 space-y-6 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                <Sparkles size={14} className="animate-pulse" /> Akun Aktif
              </div>
              <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter leading-tight">
                Halo, {currentUser?.name || "Pelaku Usaha"}!
              </h1>
              <p className="text-slate-300 text-sm md:text-base font-medium leading-relaxed">
                Anda belum memiliki profil perusahaan yang terdaftar. Daftarkan badan usaha Anda untuk mulai melaporkan limbah dan mengakses layanan pengangkutan B3.
              </p>
              <div className="pt-4">
                <Button
                  onClick={() => navigate("/company/register")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm px-8 py-6 rounded-2xl shadow-lg transition-all hover:scale-[1.02]"
                >
                  Daftarkan Perusahaan Sekarang <ChevronRight size={18} />
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
      <div className="space-y-8 text-left animate-in fade-in slide-in-from-bottom-2 duration-500">

        {/* Company Identity Banner */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 shadow-inner">
              <Building2 size={28} />
            </div>
            <div>
              {companies.length > 1 ? (
                <div className="space-y-1">
                  <Select value={selectedCompanyId || ""} onValueChange={(value) => setSelectedCompanyId(value)}>
                    <SelectTrigger className="h-10 px-4 rounded-xl border-slate-200 bg-slate-50 focus:ring-emerald-500 font-bold transition-all text-slate-800 text-lg w-[280px] md:w-[350px]">
                      <SelectValue placeholder="Pilih Perusahaan" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-150 rounded-xl shadow-lg text-slate-900 font-bold z-50">
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pilih perusahaan aktif</p>
                </div>
              ) : (
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">{activeCompany.companyName}</h1>
              )}
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-2 flex items-center gap-1.5">
                <MapPin size={12} className="text-slate-400" /> {activeCompany.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border-none h-10 flex items-center">
              NIB: {activeCompany.nib}
            </Badge>
            <Badge className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border-none h-10 flex items-center">
              Kewajiban: {activeCompany.docType}
            </Badge>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider h-10 flex items-center">
              Status: {activeCompany.status}
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Total Produksi Limbah"
            value={`${stats.totalWaste} L/kg`}
            sub="Database Terverifikasi"
            icon={<Trash2 size={24} />}
            color="emerald"
          />
          <StatCard
            label="Pickup Aktif"
            value={stats.activePickups.toString()}
            sub="Sedang Diproses"
            icon={<Clock size={24} />}
            color="blue"
          />
          <StatCard
            label="Tagihan Unpaid"
            value={`Rp ${stats.unpaidAmount.toLocaleString()}`}
            sub={`${stats.unpaidCount} Invoice Baru`}
            icon={<CreditCard size={24} />}
            color="amber"
          />
          <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem] p-6 bg-white flex justify-between items-start group hover:-translate-y-1 transition-all">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kepatuhan ESG</p>
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic leading-none">
                  {activeCompany.score || "N/A"}<span className="text-lg">/100</span>
                </h2>
                <span className={`inline-flex px-2 py-0.5 mt-2 rounded border text-[8px] font-bold ${Number(activeCompany.score) >= 80 ? "text-emerald-700 border-emerald-200 bg-emerald-50" : "text-amber-700 border-amber-200 bg-amber-50"
                  }`}>
                  {activeCompany.score ? (Number(activeCompany.score) >= 80 ? "EXCELLENT COMPLIANCE" : "FAIR COMPLIANCE") : "WAITING FOR AUDIT"}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Recent Pickup Timeline */}
          <Card className="lg:col-span-8 rounded-[2rem] p-8 border-none shadow-xl shadow-slate-200/50 bg-white">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-black text-xl tracking-tight text-slate-800">Tracking Pengangkutan</h3>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">Status real-time armada transporter</p>
              </div>
              <Button onClick={() => navigate("/company/pickup")} variant="outline" className="h-10 rounded-xl text-xs font-bold gap-1">
                <Plus size={14} /> Request Baru
              </Button>
            </div>

            {pickupRequests.length === 0 ? (
              <div className="py-16 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-[2rem]">
                <Clock className="mx-auto text-slate-200 mb-2" size={48} />
                <p className="text-sm font-bold">Belum ada riwayat pengangkutan limbah.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pickupRequests.slice(0, 5).map((pick) => (
                  <div key={pick.id} className="p-5 border border-slate-100 rounded-2xl hover:bg-slate-50/50 transition-all flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 shrink-0">
                        <Clock size={18} />
                      </div>
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-800 text-xs">{pick.id}</span>
                          {getPickupStatusBadge(pick.status)}
                        </div>
                        <p className="text-xs font-bold text-slate-500">{pick.wasteType} • {pick.volume}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                      <Button variant="ghost" size="sm" className="text-[10px] font-black text-emerald-600">DETAIL <ArrowUpRight size={14} className="ml-1" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Access Menu */}
          <Card className="lg:col-span-4 rounded-[2rem] p-8 border-none shadow-xl shadow-slate-200/50 bg-white space-y-6">
            <h3 className="font-black text-xl tracking-tight text-slate-800">Menu Cepat</h3>

            <div className="space-y-3">
              <QuickMenuButton
                label="Input Logbook"
                desc="Pelaporan limbah harian"
                onClick={() => navigate("/company/logbook")}
                color="emerald"
              />
              <QuickMenuButton
                label="Bayar Retribusi"
                desc="Virtual Account & QRIS"
                onClick={() => navigate("/company/payments")}
                color="amber"
              />
              <QuickMenuButton
                label="Sertifikat Digital"
                desc="Download SPPL / UKL-UPL"
                onClick={() => navigate("/company/documents")}
                color="blue"
              />
            </div>

            {/* EWS Banner */}
            <div className="border-t pt-6 text-left">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Health Check System</h4>
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
                <div>
                  <h5 className="text-xs font-black text-emerald-900 leading-none">Sistem Stabil</h5>
                  <p className="text-[9px] text-emerald-700 leading-tight mt-1">Tidak ada anomali limbah terdeteksi oleh AI PANTAU LIMBAH.</p>
                </div>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}

// --- High Precision Sub-Components ---

function StatCard({ label, value, sub, icon, color }: any) {
  const colorMap: any = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem] p-6 hover:-translate-y-1 transition-all bg-white group flex justify-between items-start">
      <div className="space-y-1 text-left">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic">{value}</h2>
        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{sub}</p>
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        {icon}
      </div>
    </Card>
  );
}

function QuickMenuButton({ label, desc, onClick, color }: any) {
  const bgColors: any = {
    emerald: "bg-emerald-500 text-white",
    amber: "bg-amber-500 text-white",
    blue: "bg-blue-500 text-white",
  };
  return (
    <button
      onClick={onClick}
      className="w-full p-4 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all rounded-2xl flex items-center justify-between text-left group"
    >
      <div>
        <h4 className="text-sm font-black text-slate-800 group-hover:text-emerald-700 transition-colors">{label}</h4>
        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{desc}</p>
      </div>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bgColors[color]} shadow-lg transition-transform group-hover:scale-110`}>
        <ArrowUpRight size={14} />
      </div>
    </button>
  );
}