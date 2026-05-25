// src/modules/admin/RegistrationList.tsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Filter, Eye, CheckCircle2, XCircle } from "lucide-react";
import { useSijagaStore } from '@/store/useSijagaStore';
import { DetailDrawer } from "./components/DetailDrawer";

export default function RegistrationList() {
  const { companies, fetchCompanies } = useSijagaStore();
  const [selectedReg, setSelectedReg] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleOpenDetail = (reg: any) => {
    setSelectedReg(reg);
    setIsDrawerOpen(true);
  };

  const pendingCount = companies.filter(c => c.status === "PENDING").length;
  const reviewCount = companies.filter(c => c.status === "REVIEW").length;

  const filteredCompanies = companies.filter(c => {
    return c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nib.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <DashboardLayout role="ADMIN_DLH">
      <div className="space-y-4 text-left"> {/* DIET: space-y-6 -> space-y-4 */}

        {/* Header & Stats Ringkas */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              Validasi <span className="text-emerald-600">Registrasi</span>
            </h1>
            <p className="text-slate-500 text-xs font-medium mt-1">Verifikasi berkas lingkungan hidup (SPPL & UKL-UPL) yang masuk.</p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 rounded-none text-[9px] font-black uppercase tracking-widest">PENDING: {pendingCount}</Badge>
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1 rounded-none text-[9px] font-black uppercase tracking-widest">REVISI: {reviewCount}</Badge>
          </div>
        </div>

        {/* Toolbar: Search & Filter (DENSE) */}
        <Card className="rounded-none border border-slate-200 shadow-sm p-3 bg-white">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input
                placeholder="Cari Nama Perusahaan / NIB / No. Registrasi..."
                className="pl-9 h-9 bg-slate-50 border-slate-200 rounded-none text-xs font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Table List (HIGH DENSITY) */}
        <div className="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-slate-200 h-10">
                <TableHead className="w-[150px] font-black text-slate-500 uppercase text-[9px] tracking-widest pl-4">No. Registrasi</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Perusahaan</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Jenis Dokumen</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Tahun Berdiri</TableHead>
                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right pr-4 font-black text-slate-500 uppercase text-[9px] tracking-widest">Periksa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 font-bold text-slate-400 text-xs">
                    Tidak ada berkas registrasi yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies.map((c) => (
                  <TableRow key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors h-14">
                    <TableCell className="font-bold text-slate-500 text-xs pl-4">{c.id.substring(0, 8)}...</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-900 text-xs">{c.companyName}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{c.address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={c.docType === 'UKL_UPL' ? 'bg-indigo-50 text-indigo-700 border-none' : 'bg-emerald-50 text-emerald-700 border-none'}>
                        {c.docType === 'UKL_UPL' ? 'UKL-UPL' : c.docType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 font-medium text-xs">{c.yearBuilt}</TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-emerald-600 font-black hover:bg-emerald-50 rounded-none h-8 text-[10px] tracking-widest"
                        onClick={() => handleOpenDetail(c)}
                      >
                        <Eye size={12} className="mr-1.5" /> PERIKSA
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Drawer untuk memeriksa detail dokumen */}
      <DetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        data={selectedReg}
      />
    </DashboardLayout>
  );
}

// --- Sub Component: Badge Status (DIET) ---
function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    PENDING: "bg-blue-50 text-blue-700 border-blue-100",
    REVIEW: "bg-amber-50 text-amber-700 border-amber-100",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-100",
    REJECTED: "bg-red-50 text-red-700 border-red-100"
  };
  return <Badge className={`${configs[status]} px-2.5 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-widest border`}>{status}</Badge>;
}