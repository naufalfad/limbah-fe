import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  CreditCard, ArrowUpRight, Search, Filter, 
  Download, Wallet, ArrowRightLeft, History,
  CheckCircle2, Clock, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TransactionManagement() {
  
  // Mock Data Transaksi
  const transactions = [
    { 
      id: "TRX-99201", 
      company: "PT. Tekstil Sejahtera", 
      transporter: "PT. Transport Limbah Indonesia", 
      amount: "Rp 4.500.000", 
      status: "SETTLED", // Dana sudah dicairkan ke pengangkut
      date: "15 Mei 2024",
      type: "B3 Transport"
    },
    { 
      id: "TRX-99202", 
      company: "Bengkel Jaya Motor", 
      transporter: "CV. Angkut Bersih", 
      amount: "Rp 750.000", 
      status: "ESCROW", // Dana masih ditahan sistem (Limbah belum sampai)
      date: "16 Mei 2024",
      type: "Used Oil"
    },
    { 
      id: "TRX-99203", 
      company: "Restoran Sunda Nikmat", 
      transporter: "Dinas Kebersihan", 
      amount: "Rp 250.000", 
      status: "UNPAID", // Menunggu pembayaran perusahaan
      date: "17 Mei 2024",
      type: "Domestic"
    }
  ];

  return (
    <DashboardLayout role="ADMIN_DLH">
      <div className="space-y-8 pb-10">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
              MONITORING <span className="text-emerald-600">TRANSAKSI JASA</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">Pusat kendali pembayaran jasa pengangkutan limbah industri.</p>
          </div>
          <Button className="rounded-xl font-bold bg-slate-900 hover:bg-emerald-700 shadow-xl transition-all h-12 px-6">
            <Download className="mr-2" size={18} /> Laporan Keuangan
          </Button>
        </div>

        {/* --- FINANCIAL STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FinanceCard 
            label="Total Perputaran Dana" 
            value="Rp 1.240.500.000" 
            icon={<ArrowRightLeft className="text-blue-500" />}
            trend="+15.4%"
          />
          <FinanceCard 
            label="Dana Tertahan (Escrow)" 
            value="Rp 84.200.000" 
            icon={<Wallet className="text-amber-500" />}
            trend="Active Orders"
            isWarning
          />
          <FinanceCard 
            label="Settlement Berhasil" 
            value="Rp 1.156.300.000" 
            icon={<CheckCircle2 className="text-emerald-500" />}
            trend="98% Success"
          />
        </div>

        {/* --- FILTER & SEARCH --- */}
        <Card className="rounded-[2rem] border-none shadow-sm p-4 bg-white flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Cari ID Transaksi, Perusahaan, atau Pengangkut..." 
              className="h-12 pl-12 rounded-2xl bg-slate-50 border-none focus-visible:ring-emerald-500 font-medium"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-12 rounded-2xl border-slate-200 gap-2 font-bold text-slate-600">
              <Filter size={18} /> Filter Status
            </Button>
            <Button variant="outline" className="h-12 rounded-2xl border-slate-200 gap-2 font-bold text-slate-600">
              <History size={18} /> Log Audit
            </Button>
          </div>
        </Card>

        {/* --- TRANSACTION TABLE --- */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100 h-16">
                <TableHead className="pl-8 font-black text-slate-400 uppercase text-[10px] tracking-widest">Transaksi</TableHead>
                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Perusahaan (Payer)</TableHead>
                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Pengangkut (Payee)</TableHead>
                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">Nominal Jasa</TableHead>
                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                <TableHead className="pr-8 text-right font-black text-slate-400 uppercase text-[10px] tracking-widest">Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((trx) => (
                <TableRow key={trx.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors h-24">
                  <TableCell className="pl-8">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900">{trx.id}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{trx.date}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-black text-sm text-slate-800">{trx.company}</p>
                    <Badge variant="outline" className="text-[9px] border-slate-200 text-slate-400 font-black">{trx.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <p className="font-bold text-sm text-slate-600">{trx.transporter}</p>
                  </TableCell>
                  <TableCell className="text-center font-black text-emerald-700 text-base italic tracking-tighter">
                    {trx.amount}
                  </TableCell>
                  <TableCell className="text-center">
                    <TransactionBadge status={trx.status} />
                  </TableCell>
                  <TableCell className="pr-8 text-right">
                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-emerald-50 text-emerald-600">
                      <ArrowUpRight size={20} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

      </div>
    </DashboardLayout>
  );
}

// --- SUB COMPONENTS ---

function FinanceCard({ label, value, icon, trend, isWarning }: any) {
  return (
    <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden bg-white group hover:translate-y-[-4px] transition-all">
      <CardContent className="p-8">
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
              isWarning ? "bg-amber-50" : "bg-slate-50"
            )}>
              {icon}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {label}
              </p>
              <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter mt-1 italic">{value}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={cn("text-[9px] font-black", isWarning ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
                  {trend}
                </Badge>
              </div>
            </div>
          </div>
          <CreditCard className="opacity-5 text-slate-900" size={80} />
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionBadge({ status }: { status: string }) {
  const styles: any = {
    SETTLED: "bg-emerald-100 text-emerald-700 border-emerald-200", // Selesai
    ESCROW: "bg-blue-100 text-blue-700 border-blue-200 animate-pulse", // Dana ditahan
    UNPAID: "bg-slate-100 text-slate-500 border-slate-200", // Belum bayar
    REFUNDED: "bg-rose-100 text-rose-700 border-rose-200", // Dikembalikan
  };
  
  const labels: any = {
    SETTLED: "DANA DICAIRKAN",
    ESCROW: "DANA DITAHAN (ESCROW)",
    UNPAID: "MENUNGGU PEMBAYARAN",
    REFUNDED: "DANA DIKEMBALIKAN",
  };

  return (
    <Badge className={cn("px-4 py-1.5 rounded-full text-[9px] font-black border uppercase tracking-widest whitespace-nowrap", styles[status])}>
      {status === 'ESCROW' && <Clock size={10} className="mr-1.5" />}
      {labels[status]}
    </Badge>
  );
}