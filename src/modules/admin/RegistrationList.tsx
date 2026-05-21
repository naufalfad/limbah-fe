import React, { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, Filter, Eye, CheckCircle, 
  XCircle, FileText, Calendar, MoreVertical 
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { DetailDrawer } from "./components/DetailDrawer";

export default function RegistrationList() {
  const [selectedReg, setSelectedReg] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Mock Data (Nanti diganti API)
  const registrations = [
    { 
      id: "REG-2024-001", 
      company: "PT. Tekstil Sejahtera", 
      type: "UKL-UPL", 
      date: "12 Mei 2024", 
      status: "PENDING",
      pic: "Budi Santoso",
      location: "Kec. Cicadas, Bandung"
    },
    { 
      id: "REG-2024-002", 
      company: "Bengkel Jaya Motor", 
      type: "SPPL", 
      date: "13 Mei 2024", 
      status: "REVIEW",
      pic: "Agus Pratama",
      location: "Kec. Coblong, Bandung"
    },
    { 
      id: "REG-2024-003", 
      company: "Restoran Sunda Nikmat", 
      type: "SPPL", 
      date: "14 Mei 2024", 
      status: "APPROVED",
      pic: "Siti Aminah",
      location: "Kec. Lembang, Bandung"
    },
  ];

  const handleOpenDetail = (reg: any) => {
    setSelectedReg(reg);
    setIsDrawerOpen(true);
  };

  return (
    <DashboardLayout role="ADMIN_DLH">
      <div className="space-y-6">
        
        {/* Header & Stats Ringkas */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
              VALIDASI <span className="text-emerald-600">REGISTRASI</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">Verifikasi berkas lingkungan hidup (SPPL & UKL-UPL) yang masuk.</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 py-1 px-3">Pending: 12</Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 py-1 px-3">Revisi: 5</Badge>
          </div>
        </div>

        {/* Toolbar: Search & Filter */}
        <Card className="rounded-2xl border-none shadow-sm p-4 bg-white">
          <div className="flex flex-col md:row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input placeholder="Cari Nama Perusahaan / NIB / No. Registrasi..." className="pl-10 h-11 bg-slate-50 border-none rounded-xl" />
            </div>
            <Button variant="outline" className="h-11 rounded-xl gap-2 border-slate-200">
              <Filter size={18} /> Filter Dokumen
            </Button>
          </div>
        </Card>

        {/* Table List */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="w-[150px] font-black text-slate-400 uppercase text-[10px] tracking-widest pl-8">No. Registrasi</TableHead>
                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Perusahaan</TableHead>
                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Jenis Dokumen</TableHead>
                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Tgl Masuk</TableHead>
                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((reg) => (
                <TableRow key={reg.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-bold text-slate-800 pl-8">{reg.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900">{reg.company}</span>
                      <span className="text-[10px] text-slate-400 font-bold">{reg.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={reg.type === 'UKL-UPL' ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-50' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50'}>
                      {reg.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 font-medium">{reg.date}</TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={reg.status} />
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-emerald-600 font-bold hover:bg-emerald-50 rounded-lg"
                      onClick={() => handleOpenDetail(reg)}
                    >
                      <Eye size={16} className="mr-2" /> Periksa Berkas
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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

// --- Sub Component: Badge Status ---
function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    PENDING: "bg-blue-100 text-blue-700",
    REVIEW: "bg-amber-100 text-amber-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700"
  };
  return <Badge className={`${configs[status]} border-none px-3 py-1 rounded-full text-[10px] font-black`}>{status}</Badge>;
}