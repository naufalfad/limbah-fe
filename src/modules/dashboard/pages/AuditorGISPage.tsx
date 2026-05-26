// src/modules/dashboard/pages/AuditorGISPage.tsx
import React, { useEffect } from 'react';
import { useSijagaStore } from '@/store/useSijagaStore';

// REUSE: Mengimpor ekosistem GFW Paradigm imersif yang sudah kita bangun (Prinsip GRASP: Low Coupling)
import GisNavbar from '@/modules/admin/components/gis/GisNavbar';
import GisSidebar from '@/modules/admin/components/gis/GisSidebar';
import PanelOrchestrator from '@/modules/admin/components/gis/PanelOrchestrator';
import MapHUD from '@/modules/admin/components/gis/MapHUD';
import LimbahMap from '@/modules/admin/components/gis/LimbahMap';

/**
 * AuditorGISPage - The Executive Command Center (Auditor / Pimpinan Role)
 * Mengadopsi arsitektur Infinite Canvas dengan Stacking Layers:
 * 1. Peta LimbahMap mendominasi dasar layar (Z-0) untuk rendering data spasial industri [3].
 * 2. Navbar & Sidebar memegang navigasi global dengan sudut siku kaku (Z-50 & Z-40) [3].
 * 3. Orchestrator menumpuk panel menu kepatuhan dan panel detail analisis ESG secara dinamis (Z-30) [3].
 * 4. MapHUD mengontrol basemap, opacity poligon, dan legenda visual kepatuhan (Z-30) [3].
 */
export default function AuditorGISPage() {
    const { fetchCompanies } = useSijagaStore();

    // Memastikan data master spasial (perusahaan) diambil saat masuk halaman ini (Information Expert) [3]
    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    return (
        // Latar belakang diatur agar memenuhi 100% tinggi dan lebar layar (h-screen w-screen).
        // Menghilangkan DashboardLayout agar mendapatkan efek imersif penuh secara instan (No Toggle Needed).
        <main className="relative h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800 selection:bg-emerald-200 selection:text-emerald-900">

            {/* =====================================================================
          LAYER 0: THE INFINITE CANVAS (PETA UTAMA)
          Berada di dasar (z-0), mengambil alih 100% ruang viewport untuk analisis [3].
      ====================================================================== */}
            <LimbahMap />

            {/* =====================================================================
          LAYER 1: THE GLOBAL CONTEXT (NAVBAR ATAS)
          Tinggi fix 64px, posisi absolut nempel atas, z-50 [3].
      ====================================================================== */}
            <GisNavbar />

            {/* =====================================================================
          LAYER 2: THE SLIM ANCHOR (SIDEBAR KIRI)
          Lebar fix 64px, posisi absolut nempel kiri bawah navbar, z-40 [3].
          Otomatis menyediakan tab Katalog Industri & Analisis ESG untuk Auditor [3].
      ====================================================================== */}
            <GisSidebar />

            {/* =====================================================================
          LAYER 3: THE STACKING DRAWERS (PANEL ORCHESTRATOR)
          Wadah untuk laci menu peta dan panel floating detail industri.
          Bermula persis di samping sidebar (left-16) dan di bawah navbar (top-16), z-30 [3].
      ====================================================================== */}
            <PanelOrchestrator />

            {/* =====================================================================
          LAYER 4: MAP HUD & CONTROLS (KANAN BAWAH)
          Komponen kontrol Legenda Kepatuhan ESG dan Navigasi Zoom.
          Posisinya absolut di pojok kanan bawah, z-30 [3].
      ====================================================================== */}
            <MapHUD />

        </main>
    );
}