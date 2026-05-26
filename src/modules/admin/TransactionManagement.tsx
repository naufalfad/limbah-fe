// src/modules/admin/TransactionManagement.tsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CreditCard, ArrowUpRight, Search, Filter,
  Download, Wallet, ArrowRightLeft, History,
  CheckCircle2, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSijagaStore } from '@/store/useSijagaStore';
import { toast } from "sonner";

export default function TransactionManagement() {
  const { invoices, fetchInvoices } = useSijagaStore();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Map invoices to transaction list
  const transactions = invoices.map(inv => {
    return {
      id: inv.id,
      company: inv.companyName,
      amountNum: inv.amount,
      amount: `Rp ${inv.amount.toLocaleString()}`,
      status: inv.status,
      date: inv.date || new Date().toISOString().split("T")[0],
      type: inv.type || "Retribusi SPPL"
    };
  });

  // Calculate finance metrics
  const totalSettled = transactions.filter(trx => trx.status === "SETTLED").reduce((sum, trx) => sum + trx.amountNum, 0);
  const totalUnpaid = transactions.filter(trx => trx.status === "UNPAID").reduce((sum, trx) => sum + trx.amountNum, 0);

  // Filtered transactions by search query
  const filteredTransactions = transactions.filter(trx => {
    const query = searchTerm.toLowerCase();
    return trx.id.toLowerCase().includes(query) ||
      trx.company.toLowerCase().includes(query) ||
      trx.type.toLowerCase().includes(query);
  });

  return (
    <DashboardLayout role="ADMIN_DLH">
      <div className="space-y-4 pb-6 text-left">

        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              Monitoring <span className="text-emerald-600">List Pembayaran</span>
            </h1>
            <p className="text-slate-500 text-xs font-medium mt-1">Pusat pemantauan pembayaran retribusi dan tagihan dari perusahaan langsung ke Kas Daerah DLH.</p>
          </div>
          <Button
            size="sm"
            className="rounded-none font-bold bg-slate-900 hover:bg-emerald-700 text-[10px] h-9 px-4"
            onClick={() => toast.success("Laporan Keuangan berhasil diexport!")}
          >
            <Download className="mr-1.5" size={14} /> EXPORT LAPORAN
          </Button>
        </div>

        {/* --- FINANCIAL STATS (DENSE) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FinanceCard
            label="Pembayaran Berhasil (Masuk Kas)"
            value={`Rp ${totalSettled.toLocaleString()}`}
            icon={<CheckCircle2 size={16} className="text-emerald-500" />}
            trend="Sudah Diselesaikan"
          />
          <FinanceCard
            label="Tagihan Belum Dibayar"
            value={`Rp ${totalUnpaid.toLocaleString()}`}
            icon={<Wallet size={16} className="text-amber-500" />}
            trend="Menunggu Pembayaran"
            isWarning
          />
        </div>

        {/* --- FILTER & SEARCH (DENSE) --- */}
        <Card className="rounded-none border border-slate-200 shadow-sm p-3 bg-white flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <Input
              placeholder="Cari ID Transaksi, Perusahaan, atau Jenis Tagihan..."
              className="h-9 pl-9 rounded-none border-slate-200 bg-slate-50 text-xs font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9 rounded-none border-slate-300 gap-1.5 font-bold text-slate-600 text-[10px]" onClick={() => toast.info("Filter Status Aktif")}>
              <Filter size={12} /> FILTER STATUS
            </Button>
            <Button variant="outline" size="sm" className="h-9 rounded-none border-slate-300 gap-1.5 font-bold text-slate-600 text-[10px]" onClick={() => toast.info("Audit log dimuat")}>
              <History size={12} /> LOG AUDIT
            </Button>
          </div>
        </Card>

        {/* --- TRANSACTION TABLE (HIGH DENSITY) --- */}
        <div className="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-slate-200 h-10">
                <TableHead className="pl-4 font-black text-slate-500 uppercase text-[9px] tracking-widest">Transaksi</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Perusahaan (Payer)</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center">Nominal Tagihan</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center">Status Pembayaran</TableHead>
                <TableHead className="pr-4 text-right font-black text-slate-500 uppercase text-[9px] tracking-widest">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 font-bold text-slate-400 text-xs">
                    Tidak ada data pembayaran yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((trx) => (
                  <TableRow key={trx.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors h-14">
                    <TableCell className="pl-4">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-xs">{trx.id}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">{trx.date}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-bold text-xs text-slate-800 leading-tight">{trx.company}</p>
                      <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 uppercase">{trx.type}</span>
                    </TableCell>
                    <TableCell className="text-center font-black text-emerald-700 text-sm italic tracking-tight">
                      {trx.amount}
                    </TableCell>
                    <TableCell className="text-center">
                      <TransactionBadge status={trx.status} />
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="rounded-none hover:bg-emerald-50 text-emerald-600 h-7 w-7"
                        onClick={() => toast.info(`Membuka rincian invoice ${trx.id}`)}
                      >
                        <ArrowUpRight size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

      </div>
    </DashboardLayout>
  );
}

// --- SUB COMPONENTS ---

function FinanceCard({ label, value, icon, trend, isWarning }: any) {
  const bg = isWarning ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200";
  const text = isWarning ? "text-amber-700" : "text-slate-800";
  const iconBorder = isWarning ? "border-amber-200" : "border-slate-100";

  return (
    <div className={cn("border p-4 shadow-sm flex items-start justify-between transition-colors", bg)}>
      <div className="space-y-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</p>
          <h2 className={cn("text-xl font-black tracking-tight leading-none mt-1", text)}>{value}</h2>
        </div>
        <Badge className={cn("text-[9px] font-bold border-none px-2 py-0.5", isWarning ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
          {trend}
        </Badge>
      </div>
      <div className={cn("w-10 h-10 border bg-white flex items-center justify-center shrink-0", iconBorder)}>
        {icon}
      </div>
    </div>
  );
}

function TransactionBadge({ status }: { status: string }) {
  const styles: any = {
    SETTLED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    UNPAID: "bg-slate-50 text-slate-500 border-slate-200",
    REFUNDED: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const labels: any = {
    SETTLED: "LUNAS (KAS DAERAH)",
    UNPAID: "BELUM DIBAYAR",
    REFUNDED: "REFUNDED",
  };

  return (
    <Badge className={cn("px-2.5 py-0.5 rounded-none text-[9px] font-black border uppercase tracking-widest whitespace-nowrap border-none", styles[status])}>
      <span className="align-middle">{labels[status] || status}</span>
    </Badge>
  );
}