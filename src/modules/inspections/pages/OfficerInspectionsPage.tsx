// src/modules/inspections/pages/OfficerInspectionsPage.tsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSijagaStore } from "@/store/useSijagaStore";
import { toast } from "sonner";

// Mengimpor Sub-Komponen Modular Inspeksi yang sudah kita buat
import ScheduledAudits from "../components/ScheduledAudits";
import CompletedAudits from "../components/CompletedAudits";
import AuditEvaluationModal from "../components/AuditEvaluationModal";

/**
 * OfficerInspectionsPage - The Inspection Command Center (Officer Role)
 * Bertindak murni sebagai Shell & State Orchestrator (Diet UI):
 * 1. Card pembungkus di-diet ketat jadi flat & siku kaku (rounded-none).
 * 2. Mengintegrasikan list tugas (ScheduledAudits) & riwayat laporan (CompletedAudits).
 * 3. Smart Trigger: Otomatis membuka modal BAP jika mendeteksi state rute pengiriman
 *    dari Peta GIS Patroli.
 */
export default function OfficerInspectionsPage() {
  const location = useLocation();
  const { inspections } = useSijagaStore();

  const [selectedInsp, setSelectedInsp] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // LOGIKA PRO-UX: Deteksi penugasan dari Peta GIS Patroli secara otomatis
  useEffect(() => {
    if (location.state && (location.state as any).preSelectedCompanyId) {
      const companyId = (location.state as any).preSelectedCompanyId;

      // Cari tugas inspeksi terjadwal yang cocok untuk industri tersebut
      const matchedInsp = inspections.find(
        (i) => i.companyId === companyId && i.status === "Terjadwal"
      );

      if (matchedInsp) {
        setSelectedInsp(matchedInsp);
        setIsModalOpen(true);
        toast.info(`Membuka form sidak otomatis untuk ${matchedInsp.companyName}`);
      } else {
        toast.warning("Tidak ada jadwal inspeksi aktif yang terdaftar untuk industri tersebut.");
      }

      // Bersihkan state rute agar tidak ter-trigger ulang saat halaman direfresh oleh petugas
      window.history.replaceState({}, document.title);
    }
  }, [location.state, inspections]);

  // Handler memulai audit secara manual dari daftar list
  const handleStartAudit = (insp: any) => {
    setSelectedInsp(insp);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedInsp(null);
    setIsModalOpen(false);
  };

  return (
    <DashboardLayout role="PETUGAS_LAPANGAN">
      <div className="space-y-4 text-left"> {/* DIET: space-y-8 -> space-y-4 */}

        {/* --- 1. HEADER UTAMA (DIET CARD) --- */}
        <div className="bg-white p-4 rounded-none border border-slate-200 shadow-sm">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">
            Inspeksi Fisik Lapangan
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Daftar penugasan audit kepatuhan lingkungan hidup pelaku usaha & pelaporan Berita Acara Pemeriksaan (BAP).
          </p>
        </div>

        {/* --- 2. AUDIT GRID (HIGH DENSITY) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* SISI KIRI: Daftar Sidak Aktif (ScheduledAudits) */}
          <div className="lg:col-span-7 h-[calc(100vh-200px)]">
            <ScheduledAudits onStartAudit={handleStartAudit} />
          </div>

          {/* SISI KANAN: Riwayat Laporan BAP (CompletedAudits) */}
          <div className="lg:col-span-5 h-[calc(100vh-200px)]">
            <CompletedAudits />
          </div>

        </div>

        {/* --- 3. WIZARD CHECKLIST & SIGNATURE MODAL --- */}
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