// src/modules/admin/components/CreateInspectionModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ClipboardList, X, Building2, CalendarDays, User, Info, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSijagaStore } from "@/store/useSijagaStore";
import { toast } from "sonner";

interface CreateInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateInspectionModal({ isOpen, onClose }: CreateInspectionModalProps) {
  // Hanya mengambil master data yang dibutuhkan untuk pendelegasian Surat Tugas (Information Expert) [3]
  const {
    companies,
    officers,
    scheduleInspection,
    fetchCompanies
  } = useSijagaStore();

  // Form State Penjadwalan Resmi
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Mengambil master data perusahaan saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
    }
  }, [isOpen, fetchCompanies]);

  // Saring perusahaan aktif (APPROVED) + COM-UNKNOWN
  const approvedCompanies = useMemo(() => {
    return companies.filter(c => c.status === "APPROVED" || c.id === "COM-UNKNOWN");
  }, [companies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) {
      toast.error("Silakan tentukan sasaran entitas industri terlebih dahulu.");
      return;
    }
    if (!selectedOfficerId) {
      toast.error("Silakan tentukan petugas lapangan pelaksana.");
      return;
    }
    if (!visitDate) {
      toast.error("Silakan pilih rencana tanggal kunjungan sidak.");
      return;
    }

    const company = approvedCompanies.find(c => c.id === selectedCompanyId);
    const officer = officers.find(o => o.id === selectedOfficerId);

    if (!company || !officer) {
      toast.error("Data industri atau petugas pelaksana tidak valid.");
      return;
    }

    setLoading(true);
    try {
      // Memicu aksi pembuatan Surat Tugas murni (Status: Terjadwal) [3]
      await scheduleInspection({
        companyId: company.id,
        companyName: company.companyName,
        inspectorName: officer.name,
        inspectorId: officer.officerId || officer.id, // Fallback jika petugas tidak memiliki officerId internal
        date: visitDate,
        location: company.address || "Kotawaringin Timur",
        notes: notes || "Inspeksi kepatuhan lingkungan rutin."
      });

      toast.success(`Surat Tugas berhasil diterbitkan untuk ${officer.name}!`);

      // Reset State & Tutup Modal
      setSelectedCompanyId("");
      setSelectedOfficerId("");
      setVisitDate("");
      setNotes("");
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error("Terjadi kesalahan saat menyimpan jadwal Surat Tugas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[500px] p-0 overflow-hidden rounded-none border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left bg-white font-sans z-50">

        {/* --- HEADER --- */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0 border-b-2 border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-none flex items-center justify-center text-white shadow-sm">
              <ClipboardList size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 px-1.5 py-0.5 rounded-none text-[8px] font-black uppercase tracking-widest leading-none">
                  DLH Command Center
                </span>
                <span className="text-slate-500 font-mono text-[9px] tracking-widest uppercase leading-none">SURAT-TUGAS-ENTRY</span>
              </div>
              <DialogTitle className="text-sm font-black tracking-widest leading-none text-white uppercase">
                Penerbitan Surat Tugas
              </DialogTitle>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-none transition-colors text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* --- FORM BODY --- */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-slate-50">

          {/* 1. PILIH PERUSAHAAN (Mendukung COM-UNKNOWN) */}
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5 leading-none">
              <Building2 size={12} className="text-slate-400 shrink-0" /> Pilih Sasaran Industri <span className="text-rose-500">*</span>
            </Label>
            <select
              required
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="h-10 w-full rounded-none border border-slate-300 bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-700 focus:outline-none focus:border-emerald-600 focus:ring-0 cursor-pointer"
            >
              <option value="">Pilih Industri / Objek Sidak...</option>
              {approvedCompanies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id === "COM-UNKNOWN" ? "⚠️ PENYELIDIKAN LAPANGAN (PELAKU BELUM DIKETAHUI)" : c.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* 2. PILIH PETUGAS LAPANGAN (OFFICERS MASTER-DATA) */}
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5 leading-none">
              <User size={12} className="text-slate-400 shrink-0" /> Pilih Petugas Lapangan <span className="text-rose-500">*</span>
            </Label>
            <select
              required
              value={selectedOfficerId}
              onChange={(e) => setSelectedOfficerId(e.target.value)}
              className="h-10 w-full rounded-none border border-slate-300 bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-700 focus:outline-none focus:border-emerald-600 focus:ring-0 cursor-pointer"
            >
              <option value="">Pilih Petugas Pelaksana...</option>
              {officers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. TANGGAL RENCANA TUGAS */}
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5 leading-none">
              <CalendarDays size={12} className="text-slate-400 shrink-0" /> Rencana Tanggal Sidak <span className="text-rose-500">*</span>
            </Label>
            <Input
              type="date"
              required
              value={visitDate}
              min={new Date().toISOString().split("T")[0]} // Batasi input tanggal masa lalu
              onChange={(e) => setVisitDate(e.target.value)}
              className="h-10 rounded-none border-slate-300 bg-white text-xs font-bold text-slate-700"
            />
          </div>

          {/* 4. INSTRUKSI DETAIL TUGAS */}
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5 leading-none">
              <FileText size={12} className="text-slate-400 shrink-0" /> Instruksi Detail Tugas / Catatan Ad-Hoc
            </Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[80px] rounded-none border border-slate-300 bg-white p-3 text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-600 focus:ring-0 resize-none"
              placeholder="Contoh: Selidiki laporan bau minyak terbakar di sektor utara pemukiman warga..."
            />
          </div>

          {/* INFO BANNER PERNYATAAN OTORITAS */}
          <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-none flex items-start gap-2.5 text-left text-emerald-950">
            <Info className="text-emerald-600 shrink-0 mt-0.5" size={14} />
            <div>
              <h5 className="text-[9px] font-black uppercase tracking-widest leading-none">Pendelegasian Mandiri Resmi</h5>
              <p className="text-[9px] font-semibold leading-normal mt-1.5 text-emerald-700">
                Surat tugas ini akan diterbitkan langsung dalam status **TERJADWAL**. Pengisian BAP fisik dan penentuan skor kepatuhan sepenuhnya adalah wewenang petugas lapangan saat sidak [3].
              </p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-2 border-t border-slate-200 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-none border-slate-300 font-bold text-xs h-10 px-5 uppercase tracking-widest"
            >
              BATAL
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-slate-900 hover:bg-emerald-600 text-white rounded-none h-10 px-6 text-xs font-black uppercase tracking-widest shadow-none"
            >
              {loading ? "MEMPROSES..." : "TERBITKAN SURAT TUGAS"}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}