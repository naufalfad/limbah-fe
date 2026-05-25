// src/modules/inspections/pages/OfficerGISPage.tsx
import React, { useEffect } from "react";
import { useSijagaStore } from "@/store/useSijagaStore";

// REUSE: Mengimpor ekosistem GFW Paradigm yang terpusat menggunakan alias path (GRASP Low Coupling)
import GisNavbar from "@/modules/admin/components/gis/GisNavbar";
import GisSidebar from "@/modules/admin/components/gis/GisSidebar";
import PanelOrchestrator from "@/modules/admin/components/gis/PanelOrchestrator";
import MapHUD from "@/modules/admin/components/gis/MapHUD";
import LimbahMap from "@/modules/admin/components/gis/LimbahMap";

/**
 * OfficerGISPage - The Patrol Command Center (Petugas Lapangan Role)
 * Mengadopsi arsitektur Infinite Canvas (GFW Paradigm) 100% konsisten:
 * 1. Peta LimbahMap mendominasi dasar layar (Z-0).
 * 2. Navbar, Sidebar, & HUD melayang tanpa rounded gemuk.
 * 3. Sidebar secara otomatis mendeteksi role Petugas Lapangan untuk memunculkan 
 *    laci "Tugas Patroli" alih-alih "Katalog Industri" [3].
 */
export default function OfficerGISPage() {
  const { fetchCompanies } = useSijagaStore();

  // Memastikan data master spasial (perusahaan) diambil saat masuk halaman Patroli (Information Expert) [3]
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return (
    // Memenuhi 100% layar (h-screen w-screen) tanpa menggunakan DashboardLayout bawaan untuk sensasi Command Center
    <main className="relative h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800 selection:bg-emerald-200 selection:text-emerald-900">

      {/* =====================================================================
          LAYER 0: THE INFINITE CANVAS (PETA PATROLI)
          Berada di dasar (z-0), memakan 100% area layar [3].
      ====================================================================== */}
      <LimbahMap />

      {/* =====================================================================
          LAYER 1: THE GLOBAL CONTEXT (NAVBAR ATAS)
          Tinggi fix 64px, z-50.
      ====================================================================== */}
      <GisNavbar />

      {/* =====================================================================
          LAYER 2: THE SLIM ANCHOR (SIDEBAR KIRI)
          Lebar fix 64px, posisi absolut nempel kiri bawah navbar, z-40.
          Otomatis berubah menjadi panel "Tugas Patroli" khusus Petugas [3].
      ====================================================================== */}
      <GisSidebar />

      {/* =====================================================================
          LAYER 3: THE STACKING DRAWERS (PANEL ORCHESTRATOR)
          Wadah untuk laci menu tugas patroli dan panel detail industri.
          Bermula di samping sidebar (left-16) and di bawah navbar (top-16), z-30 [3].
      ====================================================================== */}
      <PanelOrchestrator />

      {/* =====================================================================
          LAYER 4: MAP HUD & CONTROLS (KANAN BAWAH)
          Zoom in/out, reset view, dan legenda peta, z-30 [3].
      ====================================================================== */}
      <MapHUD />

    </main>
  );
}