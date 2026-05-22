import React, { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  CreditCard, ShieldCheck, CheckCircle2, ArrowRight,
  Wallet, Sparkles, QrCode, Building, Loader2, Info, ArrowUpRight, Copy, Check,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function DigitalPaymentPage() {
  const { currentUser, companies, invoices, payInvoice, pickupRequests, selectedCompanyId, fetchInvoices, fetchPickupRequests } = useSijagaStore();
  const navigate = useNavigate();
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [payMethod, setPayMethod] = useState<"VA" | "QRIS">("VA");
  const [selectedBank, setSelectedBank] = useState<"BJB" | "MANDIRI" | "BNI">("BJB");
  const [paymentStep, setPaymentStep] = useState<"SELECT" | "SIMULATION" | "PAYING" | "SUCCESS">("SELECT");
  const [copied, setCopied] = useState(false);

  // Sync data with backend API
  React.useEffect(() => {
    if (selectedCompanyId) {
      fetchInvoices(selectedCompanyId);
      fetchPickupRequests(selectedCompanyId);
    }
  }, [selectedCompanyId, fetchInvoices, fetchPickupRequests]);

  // Find company
  const company = companies.find(c => c.id === selectedCompanyId) || companies.find(c => c.id === currentUser?.companyId) || companies[0];

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
                Untuk dapat mengakses modul Pembayaran Digital Pemda, Anda harus mendaftarkan profil badan usaha atau perusahaan Anda terlebih dahulu ke sistem. Satu akun dapat mengelola beberapa perusahaan sekaligus.
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

  const myInvoices = company ? invoices.filter(i => i.companyId === company.id) : [];

  const unpaidInvoices = myInvoices.filter(i => i.status === "UNPAID");
  const historyInvoices = myInvoices.filter(i => i.status !== "UNPAID");

  const startPayment = (inv: any) => {
    setSelectedInvoice(inv);
    setPaymentStep("SELECT");
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Nomor Virtual Account disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerPaymentSimulation = async () => {
    setPaymentStep("PAYING");
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await payInvoice(selectedInvoice.id);
      setPaymentStep("SUCCESS");
    } catch (error: any) {
      setPaymentStep("SIMULATION");
      const serverMsg = error.response?.data?.error || error.response?.data?.message || "Simulasi Pembayaran Gagal!";
      toast.error(serverMsg);
      console.error("API Error:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      UNPAID: "bg-red-50 text-red-600 border-red-100",
      SETTLED: "bg-emerald-50 text-emerald-600 border-emerald-100",
      REFUNDED: "bg-slate-50 text-slate-500 border-slate-100"
    };
    const labels: any = {
      UNPAID: "Belum Dibayar",
      SETTLED: "Lunas (Kas Daerah)",
      REFUNDED: "Refunded"
    };
    return <Badge className={`${styles[status]} border font-black text-[9px] uppercase tracking-wider`}>{labels[status] || status}</Badge>;
  };

  return (
    <DashboardLayout role="PERUSAHAAN">
      <div className="space-y-8 text-left">

        {/* Header & Direct Billing Explainer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <Card className="lg:col-span-2 rounded-[2rem] border-none shadow-sm p-8 bg-white flex flex-col justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Fasilitator Pembayaran Digital</h1>
              <p className="text-slate-500 font-medium text-sm mt-2">
                Bayar tagihan retribusi lingkungan dan jasa pengangkutan limbah secara digital langsung disetorkan ke Kas Daerah.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl mt-6">
              <ShieldCheck className="text-emerald-600 shrink-0" size={24} />
              <p className="text-xs font-bold text-emerald-800 leading-relaxed">
                <strong>Pembayaran Langsung Kas Daerah:</strong> PANTAU LIMBAH mendukung pembayaran instan langsung ke Rekening Kas Umum Daerah (RKUD). Tagihan langsung dinyatakan lunas seketika, dan transporter siap meluncur menjemput limbah tanpa hambatan escrow.
              </p>
            </div>
          </Card>

          <Card className="rounded-[2rem] border-none bg-slate-900 text-white p-8 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400">
                <Wallet size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Total Pembayaran Lunas</p>
              <h2 className="text-3xl font-black italic tracking-tighter">
                Rp {myInvoices.filter(i => i.status === "SETTLED").reduce((acc, c) => acc + c.amount, 0).toLocaleString()}
              </h2>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-4">Disetorkan Langsung ke Kas Daerah</p>
          </Card>
        </div>

        {/* Visual Payment Flow Timeline */}
        <Card className="rounded-[2rem] p-8 border-none shadow-xl shadow-slate-200/50 bg-white space-y-6">
          <div>
            <h3 className="font-black text-xl tracking-tight text-slate-800">Bagaimana Alur Transaksi Pemda Bekerja?</h3>
            <p className="text-xs text-slate-400 font-bold uppercase mt-1">Sistem pembayaran digital kas daerah transparan dan aman</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 relative font-sans">
            <TimelineStep step={1} title="Penerbitan Invoice" desc="Tagihan retribusi atau jasa angkut diterbitkan di sistem." />
            <TimelineStep step={2} title="Pembayaran Digital" desc="Perusahaan membayar via Virtual Account BJB / Mandiri / BNI atau QRIS." />
            <TimelineStep step={3} title="Penyetoran Langsung" desc="Dana secara instan masuk ke Rekening Kas Umum Daerah (RKUD)." />
            <TimelineStep step={4} title="Layanan Terealisasi" desc="Status otomatis Lunas, pengangkutan & layanan DLH langsung dijalankan." />
          </div>
        </Card>

        {/* Invoice List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Unpaid Invoices */}
          <Card className="lg:col-span-7 rounded-[2rem] p-8 border-none shadow-xl shadow-slate-200/50 bg-white">
            <h3 className="font-black text-xl tracking-tight text-slate-800 mb-6">Menunggu Pembayaran</h3>

            {unpaidInvoices.length === 0 ? (
              <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                <CheckCircle2 className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-sm font-bold">Semua tagihan lunas!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {unpaidInvoices.map((inv) => (
                  <div key={inv.id} className="p-5 border border-slate-100 rounded-2xl hover:bg-slate-50/50 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800 text-sm">{inv.id}</span>
                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase">
                          {inv.type}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-500">Diterbitkan: {inv.date}</p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-none pt-3 md:pt-0">
                      <div className="text-left md:text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Tagihan</p>
                        <p className="text-sm font-black text-slate-900 italic">Rp {inv.amount.toLocaleString()}</p>
                      </div>
                      <Button
                        onClick={() => startPayment(inv)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-4 text-xs font-bold shadow-md shadow-emerald-100 flex items-center gap-1.5"
                      >
                        Bayar <ArrowRight size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Previous Transactions History */}
          <Card className="lg:col-span-5 rounded-[2rem] p-8 border-none shadow-xl shadow-slate-200/50 bg-white">
            <h3 className="font-black text-xl tracking-tight text-slate-800 mb-6">Riwayat Transaksi</h3>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 divide-y divide-slate-100">
              {historyInvoices.length === 0 ? (
                <p className="text-sm text-slate-400 py-10 text-center font-bold">Belum ada riwayat transaksi.</p>
              ) : (
                historyInvoices.map((inv) => (
                  <div key={inv.id} className="pt-4 first:pt-0 flex justify-between items-center text-left">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-slate-800 leading-none">{inv.id}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{inv.type} — {inv.date}</p>
                      <p className="text-sm font-black text-emerald-700 italic">Rp {inv.amount.toLocaleString()}</p>
                    </div>
                    {getStatusBadge(inv.status)}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Payment Simulator Modal */}
        {selectedInvoice && (
          <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
            <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] bg-white border border-slate-200 text-left p-8 max-h-[90vh] overflow-y-auto z-[9999]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-800">Pembayaran Digital</DialogTitle>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">PANTAU LIMBAH Payment Gateway Sandbox Mode</p>
              </DialogHeader>

              {/* 1. SELECT PAYMENT METHOD */}
              {paymentStep === "SELECT" && (
                <div className="space-y-6 py-4">
                  <div className="p-4 bg-slate-50 border rounded-2xl text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Tagihan Anda</p>
                    <h4 className="text-lg font-black text-slate-800 leading-tight mt-1">{selectedInvoice.type} ({selectedInvoice.id})</h4>
                    <p className="text-2xl font-black text-emerald-700 italic mt-2">Rp {selectedInvoice.amount.toLocaleString()}</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Pilih Metode Pembayaran</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPayMethod("VA")}
                        className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all ${payMethod === "VA" ? "border-emerald-500 bg-emerald-50/50 shadow-inner" : "border-slate-200"}`}
                      >
                        <Building className="text-slate-500" size={20} />
                        <span className="text-xs font-black text-slate-800">Virtual Account</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPayMethod("QRIS")}
                        className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all ${payMethod === "QRIS" ? "border-emerald-500 bg-emerald-50/50 shadow-inner" : "border-slate-200"}`}
                      >
                        <QrCode className="text-slate-500" size={20} />
                        <span className="text-xs font-black text-slate-800">QRIS Dinamis</span>
                      </button>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setPaymentStep("SIMULATION")}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-1.5 text-white"
                  >
                    Lanjut Ke Pembayaran <ArrowRight size={16} />
                  </Button>
                </div>
              )}

              {/* 2. PAYMENT INTERACTIVE SIMULATION */}
              {paymentStep === "SIMULATION" && (
                <div className="space-y-6 py-4">
                  {/* Virtual Account Simulator */}
                  {payMethod === "VA" ? (
                    <div className="space-y-4 text-left">
                      <div className="flex gap-2">
                        <BankSelectBtn label="Bank BJB" active={selectedBank === "BJB"} onClick={() => setSelectedBank("BJB")} />
                        <BankSelectBtn label="Mandiri" active={selectedBank === "MANDIRI"} onClick={() => setSelectedBank("MANDIRI")} />
                        <BankSelectBtn label="Bank BNI" active={selectedBank === "BNI"} onClick={() => setSelectedBank("BNI")} />
                      </div>

                      <div className="p-5 bg-slate-50 border rounded-2xl space-y-3 font-mono text-sm relative">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-sans">Nomor Virtual Account</span>
                          <div className="flex justify-between items-center bg-white p-3 rounded-xl border">
                            <span className="font-bold text-slate-800">
                              {selectedBank === "BJB" ? "91203" : selectedBank === "MANDIRI" ? "88901" : "88523"}
                              {selectedInvoice.id.replace(/[^0-9]/g, "") || "9481940"}
                            </span>
                            <button type="button" onClick={() => handleCopy("912039481940")} className="text-slate-400 hover:text-slate-600">
                              {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1 pt-1 font-sans">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nama Rekening</span>
                          <span className="font-black text-slate-800">{company.companyName} (PANTAU LIMBAH DLH)</span>
                        </div>

                        <div className="space-y-1 font-sans">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Jumlah Transfer</span>
                          <span className="font-black text-emerald-700 text-lg italic">Rp {selectedInvoice.amount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // QRIS Dynamic Simulator
                    <div className="space-y-4 text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pindai QRIS Dengan e-Wallet Anda</p>

                      <div className="bg-slate-50 p-4 border rounded-2xl w-48 h-48 mx-auto flex items-center justify-center relative">
                        {/* Designed SVG QR code simulator */}
                        <svg className="w-40 h-40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="100" height="100" rx="10" fill="white" />
                          <path d="M10 10H30V30H10V10ZM15 15V25H25V15H15Z" fill="#1e293b" />
                          <path d="M70 10H90V30H70V10ZM75 15V25H85V15H75Z" fill="#1e293b" />
                          <path d="M10 70H30V90H10V70ZM15 75V85H25V75H15Z" fill="#1e293b" />
                          {/* Simulated QR blocks */}
                          <path d="M40 10H50V20H40V10ZM55 10H65V25H55V10ZM40 25H45V35H40V25ZM48 25H52V30H48V25ZM60 30H68V40H60V30ZM75 35H82V45H75V35Z" fill="#1e293b" />
                          <path d="M10 40H20V50H10V40ZM25 40H35V45H25V40ZM15 52H25V62H15V52ZM30 55H40V68H30V55ZM45 45H55V55H45V45ZM60 48H70V58H60V48Z" fill="#1e293b" />
                          <path d="M40 60H50V75H40V60ZM55 65H68V80H55V65ZM70 60H80V70H70V60ZM82 60H90V75H82V60ZM72 75H80V85H72V75ZM85 78H90V90H85V78ZM40 80H50V90H40V80ZM55 85H68V90H55V85Z" fill="#1e293b" />
                          {/* QRIS Logo Center */}
                          <rect x="38" y="38" width="24" height="24" rx="4" fill="white" stroke="#10b981" strokeWidth="1.5" />
                          <text x="50" y="52" fill="#10b981" fontSize="8" fontWeight="black" textAnchor="middle">QRIS</text>
                        </svg>
                      </div>

                      <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-[11px] font-bold">
                        QRIS Dinamis Otomatis kedaluwarsa dalam 15 menit
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6 border-t pt-4">
                    <Button type="button" variant="outline" onClick={() => setPaymentStep("SELECT")} className="w-1/3 h-12 rounded-xl text-slate-500 font-bold border-slate-200">
                      Kembali
                    </Button>
                    <Button
                      type="button"
                      onClick={triggerPaymentSimulation}
                      className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl text-white flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-100"
                    >
                      Bayar Sekarang (Simulator) <Sparkles size={16} />
                    </Button>
                  </div>
                </div>
              )}

              {/* 3. PAYING */}
              {paymentStep === "PAYING" && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="animate-spin text-emerald-600" size={48} />
                  <p className="text-sm font-bold text-slate-700">Memproses simulasi pembayaran...</p>
                  <p className="text-xs text-slate-400">Menghubungkan ke gateway bank daerah</p>
                </div>
              )}

              {/* 4. SUCCESS */}
              {paymentStep === "SUCCESS" && (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-6 animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-50">
                    <CheckCircle2 size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 leading-none">Pembayaran Berhasil!</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-2">Invoice: {selectedInvoice?.id}</p>
                  </div>

                  {/* Direct billing success notice */}
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-left space-y-1 text-emerald-900">
                    <h5 className="font-black text-xs flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-600" /> PENYETORAN KAS DAERAH BERHASIL
                    </h5>
                    <p className="text-[10px] font-bold leading-normal">
                      Dana sebesar Rp {selectedInvoice?.amount.toLocaleString()} telah berhasil disetorkan secara instan dan aman ke Rekening Kas Umum Daerah (RKUD) Dinas Lingkungan Hidup. Transporter berlisensi akan segera melakukan penjemputan limbah sesuai jadwal.
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setSelectedInvoice(null)}
                    className="bg-slate-950 hover:bg-slate-900 w-full h-11 rounded-xl font-bold text-white"
                  >
                    Selesai
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}

      </div>
    </DashboardLayout>
  );
}

// --- SUB-COMPONENTS ---

function TimelineStep({ step, title, desc }: { step: number, title: string, desc: string }) {
  return (
    <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2 relative">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-100 shrink-0">
          {step}
        </div>
        <h4 className="font-black text-slate-800 text-sm">{title}</h4>
      </div>
      <p className="text-[11px] font-medium text-slate-500 leading-relaxed pr-2">{desc}</p>
    </div>
  );
}

function BankSelectBtn({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 h-10 border rounded-xl font-bold text-xs transition-all ${active ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-black shadow-sm" : "border-slate-200 text-slate-500 bg-white"
        }`}
    >
      {label}
    </button>
  );
}


