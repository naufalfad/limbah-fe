// src/modules/admin/GISMonitoring.tsx
import React, { useEffect } from 'react';
import { useSijagaStore } from '@/store/useSijagaStore';

// Mengimpor ekosistem GFW Paradigm yang sudah kita bangun
import GisNavbar from './components/gis/GisNavbar';
import GisSidebar from './components/gis/GisSidebar';
import PanelOrchestrator from './components/gis/PanelOrchestrator';
import MapHUD from './components/gis/MapHUD';
import LimbahMap from './components/gis/LimbahMap';

/**
 * GISMonitoring Page - The Immersive Command Center (GFW Paradigm)
 * Mengadopsi arsitektur Infinite Canvas dengan Stacking Layers:
 * 1. Peta Leaflet mendominasi 100% ruang sebagai fondasi dasar.
 * 2. Navbar & Sidebar memegang navigasi global dengan sudut siku (frameless).
 * 3. Orchestrator menumpuk panel dari kiri ke kanan.
 */
export default function GISMonitoring() {
  const { fetchCompanies } = useSijagaStore();

  // Memastikan data master spasial (perusahaan) diambil saat masuk halaman ini
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return (
    // Latar belakang diatur agar memenuhi 100% tinggi dan lebar layar (h-screen w-screen).
    // Tidak memakai DashboardLayout agar mendapatkan efek imersif penuh.
    <main className="relative h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800 selection:bg-emerald-200 selection:text-emerald-900">

      {/* =====================================================================
          LAYER 0: THE INFINITE CANVAS (PETA)
          Berada di dasar (z-0), mengambil alih 100% ruang viewport.
      ====================================================================== */}
      <LimbahMap />

      {/* =====================================================================
          LAYER 1: THE GLOBAL CONTEXT (NAVBAR ATAS)
          Tinggi fix 64px, posisi absolut nempel atas, z-50.
      ====================================================================== */}
      <GisNavbar />

      {/* =====================================================================
          LAYER 2: THE SLIM ANCHOR (SIDEBAR KIRI)
          Lebar fix 64px, posisi absolut nempel kiri bawah navbar, z-40.
      ====================================================================== */}
      <GisSidebar />

      {/* =====================================================================
          LAYER 3: THE STACKING DRAWERS (PANEL ORCHESTRATOR)
          Wadah untuk laci menu dan panel floating detail.
          Bermula persis di samping sidebar dan di bawah navbar, z-30.
          Posisinya diatur langsung di dalam komponen PanelOrchestrator.
      ====================================================================== */}
      <PanelOrchestrator />

      {/* =====================================================================
          LAYER 4: MAP HUD & CONTROLS (KANAN BAWAH)
          Komponen kontrol Legenda dan Navigasi Zoom.
          Posisinya absolut di pojok kanan bawah, z-30.
      ====================================================================== */}
      <MapHUD />

    </main>
  );
}