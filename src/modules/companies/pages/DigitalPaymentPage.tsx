// src/modules/companies/pages/DigitalPaymentPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CreditCard, Wallet, Sparkles, ChevronRight, ShieldCheck, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mengimpor Komponen Modular Taktis GFW [3]
import CompanyHeader from "../components/CompanyHeader";
import PaymentSimulator from "../components/forms/PaymentSimulator";

export default function DigitalPaymentPage() {
  const navigate = useNavigate();
  const {
    currentUser,
    companies,
    invoices,
    selectedCompanyId,
    fetchInvoices,
    fetchPickupRequests
  } = useSijagaStore();

  // State Pelacak Invoice Terpilih buat Simulator [3]
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Sync data tagihan & pengangkutan [3]
  useEffect(() => {
    if (selectedCompanyId) {
      fetchInvoices(selectedCompanyId);
      fetchPickupRequests(selectedCompanyId);
    }
  }, [selectedCompanyId, fetchInvoices, fetchPickupRequests]);

  // Mengidentifikasi entitas perusahaan aktif
  const company = companies.find(c => c.id === selectedCompanyId) ||
    companies.find(c => c.id === currentUser?.companyId) ||
    companies[0];

  // Filter Invoice berdasarkan data perusahaan terdaftar [3]
  const myInvoices = useMemo(() => {
    return company ? invoices.filter(i => i.companyId === company.id) : [];
  }, [invoices, company]);

  const unpaidInvoices = useMemo(() => myInvoices.filter(i => i.status === "UNPAID"), [myInvoices]);
  const historyInvoices = useMemo(() => myInvoices.filter(i => i.status !== "UNPAID"), [myInvoices]);

  // ONBOARDING PROTECTION: Cegah jika perusahaan belum terdaftar [3]
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
                Akses Billing Ditangguhkan
              </h1>
              <p className="text-slate-300 text-xs font-medium leading-relaxed">
                Untuk dapat mengakses modul Pembayaran Digital Pemda dan melakukan pelunasan tagihan retribusi, Anda harus mendaftarkan profil badan usaha terlebih dahulu [3].
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

  const getStatusBadge = (status: string) => {
    const styles: any = {
      UNPAID: "bg-rose-50 text-rose-700 border-rose-200",
      SETTLED: "bg-emerald-50 text-emerald-700 border-emerald-200",
      REFUNDED: "bg-slate-50 text-slate-500 border-slate-200"
    };
    const labels: any = {
      UNPAID: "Belum Dibayar",
      SETTLED: "Lunas (Kas Daerah)",
      REFUNDED: "Refunded"
    };
    return (
      <Badge className={`${styles[status] || "bg-slate-50"} rounded-none border text-[8px] font-black uppercase tracking-widest border-none px-2`}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <DashboardLayout role="PERUSAHAAN">
      <div className="space-y-4 text-left animate-in fade-in duration-300">

        {/* 1. SHARED COMPANY HEADER [3] */}
        <CompanyHeader />

        {/* 2. TACTICAL BILLING BRIEF GRID (GFW LOOK) [3] */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 rounded-none border border-slate-200 shadow-none p-4 bg-white flex flex-col justify-between text-left">
            <div className="space-y-1">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Fasilitator Pembayaran Digital</h2>
              <p className="text-slate-500 font-medium text-xs leading-relaxed mt-2">
                Bayar tagihan retribusi lingkungan dan jasa pengangkutan limbah secara digital langsung disetorkan secara instan ke Kas Daerah daerah [3].
              </p>
            </div>
            <div className="flex items-center gap-2.5 bg-emerald-50/50 border border-emerald-150 p-3 rounded-none mt-4">
              <ShieldCheck className="text-emerald-600 shrink-0" size={16} />
              <p className="text-[9px] font-semibold text-emerald-800 leading-normal">
                <strong>DIRECT BILLING RKUD:</strong> Sistem mendukung pembayaran langsung ke Rekening Kas Umum Daerah (RKUD) seketika lunas [3].
              </p>
            </div>
          </Card>

          <Card className="rounded-none border border-slate-200 bg-slate-900 text-white p-4 flex flex-col justify-between shadow-none text-left">
            <div className="space-y-1.5">
              <div className="w-8 h-8 bg-white/10 rounded-none flex items-center justify-center text-emerald-400">
                <Wallet size={16} />
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pt-2">Total Setoran Kas Daerah</p>
              <h2 className="text-xl font-black italic tracking-tighter leading-none mt-1">
                Rp {myInvoices.filter(i => i.status === "SETTLED").reduce((acc, c) => acc + c.amount, 0).toLocaleString()}
              </h2>
            </div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block border-t border-slate-800 pt-3">
              Lunas terverifikasi bank daerah
            </span>
          </Card>
        </div>

        {/* 3. DUAL PANEL BILLS LIST */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* SISI KIRI (7 Kolom): Menunggu Pembayaran [3] */}
          <Card className="lg:col-span-7 rounded-none p-4 border border-slate-200 shadow-none bg-white text-left flex flex-col h-full">
            <div className="border-b pb-3 mb-4">
              <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest">Tagihan Aktif</h3>
            </div>

            <div className="flex-1 flex flex-col divide-y divide-slate-150 overflow-y-auto pr-2 custom-scrollbar">
              {unpaidInvoices.length === 0 ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 className="text-emerald-500" size={24} />
                  <p className="text-[10px] font-bold uppercase tracking-wider">Semua Tagihan Anda Lunas</p>
                </div>
              ) : (
                unpaidInvoices.map((inv) => (
                  <div key={inv.id} className="py-3 first:pt-0 flex justify-between items-center gap-4">
                    <div className="space-y-1 text-left min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-slate-800 text-xs">{inv.id}</span>
                        <span className="text-[8px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 uppercase">
                          {inv.type}
                        </span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Diterbitkan: {inv.date}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none">TOTAL INVOICE</span>
                        <span className="text-xs font-black text-slate-900 mt-1.5 block leading-none">Rp {inv.amount.toLocaleString()}</span>
                      </div>
                      <Button
                        onClick={() => setSelectedInvoice(inv)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-none h-8 px-3.5 text-[9px] font-black uppercase tracking-widest shadow-none"
                      >
                        BAYAR
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* SISI KANAN (5 Kolom): Riwayat Pembayaran */}
          <Card className="lg:col-span-5 rounded-none p-4 border border-slate-200 shadow-none bg-white text-left flex flex-col h-full">
            <div className="border-b pb-3 mb-4">
              <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest">Riwayat Setoran</h3>
            </div>

            <div className="flex-1 flex flex-col divide-y divide-slate-150 overflow-y-auto pr-1 custom-scrollbar">
              {historyInvoices.length === 0 ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Clock className="text-slate-300" size={24} />
                  <p className="text-[10px] font-bold uppercase tracking-wider">Belum Ada Riwayat Transaksi</p>
                </div>
              ) : (
                historyInvoices.map((inv) => (
                  <div key={inv.id} className="py-3 first:pt-0 flex justify-between items-center text-left">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-slate-800 leading-none">{inv.id}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mt-1">{inv.type} — {inv.date}</p>
                      <p className="text-xs font-black text-emerald-700 mt-1">Rp {inv.amount.toLocaleString()}</p>
                    </div>
                    <div className="shrink-0 pl-2">
                      {getStatusBadge(inv.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* 4. MODULAR DRAWER SIMULATOR PEMBAYARAN KAS DAERAH [3] */}
        {selectedInvoice && (
          <PaymentSimulator
            isOpen={!!selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
            invoice={selectedInvoice}
          />
        )}

      </div>
    </DashboardLayout>
  );
}