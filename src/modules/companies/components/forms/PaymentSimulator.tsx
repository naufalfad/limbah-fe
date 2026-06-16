// src/modules/companies/components/forms/PaymentSimulator.tsx
import React, { useState } from "react";
import { useSijagaStore, Invoice } from "@/store/useSijagaStore";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Building2, QrCode, CreditCard, Copy,
    Check, ShieldCheck, CheckCircle2, Loader2, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface PaymentSimulatorProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: Invoice | null;
}

export default function PaymentSimulator({ isOpen, onClose, invoice }: PaymentSimulatorProps) {
    const { payInvoice, companies, selectedCompanyId } = useSijagaStore();

    // Simulation Steps: SELECT -> SIMULATION -> PAYING -> SUCCESS [3]
    const [paymentStep, setPaymentStep] = useState<"SELECT" | "SIMULATION" | "PAYING" | "SUCCESS">("SELECT");
    const [payMethod, setPayMethod] = useState<"VA" | "QRIS">("VA");
    const [selectedBank, setSelectedBank] = useState<"BJB" | "MANDIRI" | "BNI">("BJB");
    const [copied, setCopied] = useState(false);

    if (!invoice) return null;

    const activeCompany = companies.find(c => c.id === selectedCompanyId) ||
        companies.find(c => c.id === invoice.companyId);

    const handleCopyVA = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        toast.success("Nomor Virtual Account berhasil disalin.");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExecutePayment = async () => {
        setPaymentStep("PAYING");
        try {
            // Menstimulasi keterlambatan respon bank daerah
            await new Promise((resolve) => setTimeout(resolve, 1500));
            await payInvoice(invoice.id);
            setPaymentStep("SUCCESS");
        } catch (err: any) {
            setPaymentStep("SIMULATION");
            const errMsg = err.response?.data?.message || "Otentikasi pembayaran gagal.";
            toast.error(errMsg);
        }
    };

    // Logika Generator Kode VA Taktis
    const getVaCode = () => {
        const bankCode = selectedBank === "BJB" ? "91203" : selectedBank === "MANDIRI" ? "88901" : "88523";
        const cleanId = invoice.id.replace(/[^0-9]/g, "") || "948194";
        return `${bankCode}${cleanId}`;
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            {/* Drawer diletakkan di sisi kanan layar (Slide-out), siku tajam (rounded-none) [3] */}
            <SheetContent className="w-[100vw] sm:max-w-[420px] bg-white border-l border-slate-200 p-6 rounded-none z-[9999] flex flex-col justify-between">

                {/* HEADER */}
                <SheetHeader className="border-b border-slate-200 pb-3">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">
                        E-Gov Payment Gateway
                    </span>
                    <SheetTitle className="text-sm font-black text-slate-800 tracking-widest uppercase mt-1">
                        Simulasi Pembayaran
                    </SheetTitle>
                </SheetHeader>

                {/* CONTAINER CONTENT */}
                <div className="flex-1 overflow-y-auto py-4 font-sans text-left">

                    {/* STEP 1: PEMILIHAN METODE (SELECT) */}
                    {paymentStep === "SELECT" && (
                        <div className="space-y-5">
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-none text-left">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">RINCIAN TAGIHAN</span>
                                <h4 className="text-xs font-bold text-slate-700 leading-tight mt-1">{invoice.type} ({invoice.id})</h4>
                                <p className="text-xl font-black text-emerald-700 italic tracking-tight mt-1.5">Rp {invoice.amount.toLocaleString()}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">PILIH SALURAN BAYAR</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPayMethod("VA")}
                                        className={`p-3.5 rounded-none border text-left flex flex-col gap-2 transition-all outline-none ${payMethod === "VA" ? "border-emerald-500 bg-emerald-50/20" : "border-slate-200 hover:bg-slate-50"
                                            }`}
                                    >
                                        <Building2 className="text-slate-500" size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Virtual Account</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPayMethod("QRIS")}
                                        className={`p-3.5 rounded-none border text-left flex flex-col gap-2 transition-all outline-none ${payMethod === "QRIS" ? "border-emerald-500 bg-emerald-50/20" : "border-slate-200 hover:bg-slate-50"
                                            }`}
                                    >
                                        <QrCode className="text-slate-500" size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">QRIS Dinamis</span>
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="button"
                                onClick={() => setPaymentStep("SIMULATION")}
                                className="w-full h-11 bg-slate-900 hover:bg-emerald-600 text-white font-black text-[10px] tracking-widest uppercase rounded-none shadow-none"
                            >
                                PROSES INVOICE
                            </Button>
                        </div>
                    )}

                    {/* STEP 2: SIMULASI AKUN DAN QRIS (SIMULATION) */}
                    {paymentStep === "SIMULATION" && (
                        <div className="space-y-5">
                            {payMethod === "VA" ? (
                                /* SIMULATOR VA BANK */
                                <div className="space-y-4">
                                    <div className="flex gap-1.5">
                                        {["BJB", "MANDIRI", "BNI"].map((b) => (
                                            <button
                                                key={b}
                                                type="button"
                                                onClick={() => setSelectedBank(b as any)}
                                                className={`flex-1 h-8 border rounded-none font-black text-[9px] uppercase tracking-widest transition-all ${selectedBank === b ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-500"
                                                    }`}
                                            >
                                                {b}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="p-4 bg-slate-50 border border-slate-200 font-mono space-y-3.5 rounded-none text-xs">
                                        <div className="space-y-1 text-left">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-sans">
                                                VA CODE NUMBER (BILLS)
                                            </span>
                                            <div className="flex justify-between items-center bg-white p-2.5 rounded-none border border-slate-200">
                                                <span className="font-bold text-slate-800 tracking-widest">
                                                    {getVaCode()}
                                                </span>
                                                <button type="button" onClick={() => handleCopyVA(getVaCode())} className="text-slate-400 hover:text-slate-600">
                                                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-0.5 font-sans">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">BILLER NAME</span>
                                            <span className="font-black text-slate-800 text-[11px]">{activeCompany?.companyName || "N/A"} (GEO LIMBAH)</span>
                                        </div>

                                        <div className="space-y-0.5 font-sans border-t border-slate-200 pt-2">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">TRANSFER AMOUNT</span>
                                            <span className="font-black text-emerald-700 text-base italic leading-none">Rp {invoice.amount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* SIMULATOR QRIS DINAMIS */
                                <div className="space-y-4 text-center">
                                    <div className="bg-slate-50 p-3 border border-slate-200 w-44 h-44 mx-auto flex items-center justify-center relative">
                                        <svg className="w-36 h-36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect width="100" height="100" rx="0" fill="white" />
                                            <path d="M10 10H30V30H10V10ZM15 15V25H25V15H15Z" fill="#000" />
                                            <path d="M70 10H90V30H70V10ZM75 15V25H85V15H75Z" fill="#000" />
                                            <path d="M10 70H30V90H10V70ZM15 75V85H25V75H15Z" fill="#000" />
                                            <path d="M40 10H50V20H40V10ZM55 10H65V25H55V10ZM40 25H45V35H40V25ZM48 25H52V30H48V25ZM60 30H68V40H60V30ZM75 35H82V45H75V35Z" fill="#000" />
                                            <path d="M10 40H20V50H10V40ZM25 40H35V45H25V40ZM15 52H25V62H15V52ZM30 55H40V68H30V55ZM45 45H55V55H45V45ZM60 48H70V58H60V48Z" fill="#000" />
                                            <rect x="38" y="38" width="24" height="24" rx="0" fill="white" stroke="#10b981" strokeWidth="1.5" />
                                            <text x="50" y="52" fill="#10b981" fontSize="7" fontWeight="900" textAnchor="middle">QRIS</text>
                                        </svg>
                                    </div>
                                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold text-center">
                                        QRIS Dinamis Terintegrasi Kas Daerah
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 border-t border-slate-200 pt-4">
                                <Button type="button" variant="outline" onClick={() => setPaymentStep("SELECT")} className="w-1/3 h-10 rounded-none text-slate-500 font-bold border-slate-200 text-[10px] uppercase tracking-wider">
                                    Kembali
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleExecutePayment}
                                    className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] tracking-widest uppercase rounded-none"
                                >
                                    SIMULASIKAN BAYAR
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: LOADING SCREEN (PAYING) */}
                    {paymentStep === "PAYING" && (
                        <div className="flex flex-col items-center justify-center py-16 space-y-3">
                            <RefreshCw className="animate-spin text-emerald-600" size={32} />
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">MEMPROSES TRANSAKSI...</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">MENGHUBUNGKAN KE REKENING KAS DAERAH</p>
                        </div>
                    )}

                    {/* STEP 4: SELESAI & LUNAS (SUCCESS) */}
                    {paymentStep === "SUCCESS" && (
                        <div className="flex flex-col items-center justify-center py-4 text-center space-y-5 animate-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-none flex items-center justify-center shadow-inner">
                                <CheckCircle2 size={32} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-800 tracking-widest uppercase">TRANSAKSI SUKSES</h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Invoices: {invoice.id}</p>
                            </div>

                            {/* DIRECT BILLING RKUD SETTLED BANNER */}
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-none text-left space-y-1.5 text-emerald-950">
                                <h5 className="font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 text-emerald-900 leading-none">
                                    <ShieldCheck size={14} className="text-emerald-600" /> STATUS REKENING: SETTLED (RKUD)
                                </h5>
                                <p className="text-[9px] font-semibold leading-normal text-emerald-700">
                                    Pembayaran berhasil dilakukan secara instan langsung disetorkan penuh ke Rekening Kas Umum Daerah (RKUD) Dinas Lingkungan Hidup Kabupaten/Kota.
                                </p>
                            </div>

                            <Button
                                type="button"
                                onClick={() => {
                                    setPaymentStep("SELECT");
                                    onClose();
                                }}
                                className="bg-slate-900 hover:bg-slate-800 w-full h-11 rounded-none font-black text-xs text-white uppercase tracking-widest"
                            >
                                Selesai
                            </Button>
                        </div>
                    )}

                </div>

                {/* FOOTER */}
                <div className="border-t border-slate-200 pt-3">
                    <p className="text-[8px] font-bold text-slate-400 text-center uppercase tracking-widest leading-relaxed">
                        PRODUK RESMI BANK PEMBANGUNAN DAERAH (BPD) • TERLISENSI OJK
                    </p>
                </div>

            </SheetContent>
        </Sheet>
    );
}