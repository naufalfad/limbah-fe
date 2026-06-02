// src/modules/inspections/pages/OfficerInspectionsPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // FASE 2 INJEKSI: Import useNavigate
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CalendarDays, MapPin, AlertTriangle, CheckCircle2, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Mengimpor Sub-Komponen Modular Inspeksi yang sudah kita buat [3]
import ScheduledAudits from "../components/ScheduledAudits";
import CompletedAudits from "../components/CompletedAudits";
import AuditEvaluationModal from "../components/AuditEvaluationModal";

/**
 * OfficerInspectionsPage - The Inspection Command Center (Officer Role)
 * Bertindak murni sebagai Shell & State Orchestrator (Diet UI):
 * 1. Card pembungkus di-diet ketat jadi flat & siku kaku (rounded-none) [3].
 * 2. Mengintegrasikan list tugas (ScheduledAudits) & riwayat laporan (CompletedAudits) [3].
 * 3. Mengintegrasikan dashboard monitoring jatuh tempo 30 hari dalam format GFW [3].
 * 4. Smart Trigger: Otomatis membuka modal BAP jika mendeteksi state rute pengiriman dari Peta GIS Patroli [3].
 */
export default function OfficerInspectionsPage() {
  const location = useLocation();
  const navigate = useNavigate(); // FASE 2 INJEKSI: Menggunakan native router navigator

  const {
    currentUser,
    inspections,
    companies,
    fetchCompanies,
    fetchInspections,
    fetchAdminReports, // Sinkronisasi aduan tetap dijalankan agar data cache up-to-date
    scheduleInspection
  } = useSijagaStore();

  const [selectedInsp, setSelectedInsp] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Inisialisasi sinkronisasi data master (Information Expert) [3]
  useEffect(() => {
    fetchCompanies();
    fetchInspections();
    fetchAdminReports();
  }, [fetchCompanies, fetchInspections, fetchAdminReports]);

  // LOGIKA PRO-UX: Deteksi penugasan dari Peta GIS Patroli secara otomatis [3]
  useEffect(() => {
    // FASE 2 FIX: Mencari spesifik berdasarkan ID Inspection, BUKAN Company ID
    if (location.state && (location.state as any).preSelectedInspectionId) {
      const inspectionId = (location.state as any).preSelectedInspectionId;

      // Cari tugas inspeksi terjadwal yang cocok [3]
      const matchedInsp = inspections.find(
        (i) => i.id === inspectionId && i.status === "Terjadwal"
      );

      if (matchedInsp) {
        handleStartAudit(matchedInsp);
        toast.info(`Membuka form sidak otomatis untuk target spasial yang dipilih.`);
      } else {
        toast.warning("Tidak ada jadwal inspeksi aktif yang terdaftar untuk titik tersebut.");
      }

      // FASE 2 FIX: Hapus state navigasi secara native dari React Router (Memutus Infinite Loop)
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, inspections, navigate, location.pathname]);

  // FASE 4 ARSITEKTUR: Memperbaiki The Stuck State Flaw
  const handleStartAudit = (insp: any) => {
    // Kita mencabut eksekusi investigateCitizenReport() otomatis dari sini.
    // Modal ini sekarang bertindak murni sebagai "Pure Fabrication" (UI Viewer).
    // Transisi status ke INVESTIGATING atau RESOLVED hanya akan terjadi secara
    // eksplisit di dalam AuditEvaluationModal.tsx, mencegah status "nyangkut".
    setSelectedInsp(insp);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedInsp(null);
    setIsModalOpen(false);
    // Sinkronisasi ulang data setelah modal ditutup agar perubahan langsung ter-render
    fetchInspections();
    fetchAdminReports();
  };

  // --- LOGIKA MONITORING JATUH TEMPO INSPEKSI (30 HARI) [3] ---
  const monitoringData = useMemo(() => {
    return companies.map(comp => {
      const compInspections = inspections.filter(i => i.companyId === comp.id);
      const isScheduled = compInspections.some(i => i.status === "Terjadwal");

      // Urutkan riwayat inspeksi selesai (Newest First) [3]
      const completedList = compInspections
        .filter(i => i.status === "Selesai")
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const lastInspection = completedList[0];

      let statusLabel = "Belum Diinspeksi";
      let isOverdue = false;
      let daysSince = -1;

      if (lastInspection) {
        const lastDate = new Date(lastInspection.date);
        const today = new Date();
        daysSince = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

        if (lastInspection.score !== null && lastInspection.score !== undefined && lastInspection.score < 60) {
          statusLabel = "Perlu Inspeksi Ulang";
        } else if (daysSince > 30) {
          statusLabel = "Jatuh Tempo";
          isOverdue = true;
        } else {
          statusLabel = "Aman";
        }
      }

      // Jika sudah dijadwalkan, override status peringatan [3]
      if (isScheduled && statusLabel !== "Aman") {
        statusLabel = "Menunggu Pelaksanaan";
      }

      return {
        company: comp,
        lastInspection,
        statusLabel,
        isOverdue,
        daysSince,
        isScheduled
      };
    });
  }, [companies, inspections]);

  const handleQuickSchedule = async (comp: any) => {
    // Penjadwalan otomatis H+1 esok hari [3]
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    const newInsp = {
      companyId: comp.id,
      companyName: comp.companyName,
      inspectorId: currentUser?.officerId || currentUser?.id || "OFF-001",
      inspectorName: currentUser?.name || "Petugas DLH",
      date: dateStr,
      location: comp.address
    };

    try {
      await scheduleInspection(newInsp);
      // Notifikasi sudah di-handle di dalam action store
    } catch (e) {
      toast.error("Gagal membuat jadwal otomatis.");
    }
  };

  return (
    <DashboardLayout role="PETUGAS_LAPANGAN">
      <div className="space-y-4 text-left">

        {/* --- 1. HEADER UTAMA (DIET CARD) --- */}
        <div className="bg-white p-4 rounded-none border border-slate-200 shadow-sm">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">
            Inspeksi Fisik Lapangan
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1.5">
            Daftar penugasan audit kepatuhan lingkungan hidup pelaku usaha & pelaporan Berita Acara Pemeriksaan (BAP) [3].
          </p>
        </div>

        {/* --- 2. AUDIT GRID (HIGH DENSITY) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* SISI KIRI: Daftar Sidak Aktif (ScheduledAudits) [3] */}
          <div className="lg:col-span-7 h-[calc(100vh-280px)]">
            <ScheduledAudits onStartAudit={handleStartAudit} />
          </div>

          {/* SISI KANAN: Riwayat Laporan BAP (CompletedAudits) [3] */}
          <div className="lg:col-span-5 h-[calc(100vh-280px)]">
            <CompletedAudits />
          </div>

        </div>

        {/* --- 3. DOKUMEN MONITORING KEPATUHAN 30 HARI (GFW STYLE) [3] --- */}
        <Card className="rounded-none border border-slate-200 p-4 bg-white shadow-none space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3">
            <div>
              <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest leading-none">Aktivitas Monitoring Wilayah</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 leading-none">Mendeteksi kepatuhan siklus inspeksi industri berkala (Limit 30 Hari) [3]</p>
            </div>
            <div className="flex gap-1 flex-wrap">
              <Badge className="bg-rose-50 text-rose-700 rounded-none border-none text-[8px] font-black uppercase px-2 py-0.5">Jatuh Tempo</Badge>
              <Badge className="bg-rose-100 text-rose-800 rounded-none border-none text-[8px] font-black uppercase px-2 py-0.5">Perlu Inspeksi Ulang</Badge>
              <Badge className="bg-amber-50 text-amber-700 rounded-none border-none text-[8px] font-black uppercase px-2 py-0.5">Belum Diinspeksi</Badge>
              <Badge className="bg-emerald-50 text-emerald-700 rounded-none border-none text-[8px] font-black uppercase px-2 py-0.5">Aman (Bulan Ini)</Badge>
            </div>
          </div>

          <div className="border border-slate-150 rounded-none overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="h-9 border-b">
                  <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest pl-4">Badan Usaha</TableHead>
                  <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Alamat Operasional</TableHead>
                  <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Inspeksi Terakhir</TableHead>
                  <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Siklus</TableHead>
                  <TableHead className="text-right pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {monitoringData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 font-bold text-slate-400 text-xs uppercase tracking-widest">
                      Belum ada perusahaan terdaftar di sistem.
                    </TableCell>
                  </TableRow>
                ) : (
                  monitoringData.map((row) => (
                    <TableRow key={row.company.id} className="border-b hover:bg-slate-50/50 transition-colors h-12">
                      <TableCell className="pl-4">
                        <p className="font-black text-slate-800 text-xs leading-none">{row.company.companyName}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase mt-1 leading-none">{row.company.docType}</p>
                      </TableCell>
                      <TableCell className="text-slate-500 font-medium text-xs max-w-[200px] truncate">
                        {row.company.address}
                      </TableCell>
                      <TableCell>
                        {row.lastInspection ? (
                          <div className="flex flex-col text-left font-sans text-xs">
                            <span className="font-bold text-slate-800 leading-none">{row.lastInspection.date}</span>
                            <span className="text-[8px] text-slate-400 font-bold uppercase mt-1 leading-none">{row.daysSince} HARI LALU</span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-black text-slate-400 uppercase italic">Nihil</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2 py-0.5 text-[8px] font-black border uppercase tracking-widest rounded-none",
                          row.statusLabel === "Aman" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            row.statusLabel === "Jatuh Tempo" ? "bg-rose-50 text-rose-700 border-rose-200 " :
                              row.statusLabel === "Perlu Inspeksi Ulang" ? "bg-rose-100 text-rose-800 border-rose-300 font-bold" :
                                row.statusLabel === "Menunggu Pelaksanaan" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                  "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                          {row.statusLabel}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <Button
                          onClick={() => handleQuickSchedule(row.company)}
                          disabled={row.isScheduled || row.statusLabel === "Aman"}
                          variant="outline"
                          className="h-7 rounded-none text-[8px] font-black uppercase tracking-widest border-slate-300 text-emerald-600 hover:bg-slate-50 disabled:opacity-20 shadow-none transition-all"
                        >
                          + Jadwal Besok
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* --- 4. WIZARD CHECKLIST & SIGNATURE MODAL --- */}
        {selectedInsp && (
          <AuditEvaluationModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            selectedInsp={selectedInsp}
          />
        )}

      </div>
    </DashboardLayout>
  );
}