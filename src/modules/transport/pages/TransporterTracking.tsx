// src/modules/transport/pages/TransporterTracking.tsx
import React, { useEffect } from "react";
import { useSijagaStore } from "@/store/useSijagaStore";

// REUSE: Mengimpor ekosistem GFW Paradigm terpusat (Prinsip GRASP: Low Coupling)
import GisNavbar from "@/modules/admin/components/gis/GisNavbar";
import GisSidebar from "@/modules/admin/components/gis/GisSidebar";
import PanelOrchestrator from "@/modules/admin/components/gis/PanelOrchestrator";
import MapHUD from "@/modules/admin/components/gis/MapHUD";
import TrackingMap from "../components/gis/TrackingMap"; // Komponen peta murni live tracking

/**
 * TransporterTracking Page - The Live Fleet Locator (Pengangkut Role)
 * Mengadopsi arsitektur Infinite Canvas (GFW Paradigm) secara presisi:
 * 1. Peta live tracking berada di dasar layar (Z-0) menangkap pergerakan simulator [3].
 * 2. Sidebar nempel di kiri, otomatis memunculkan icon truk taktis untuk membuka laci telemetri [3].
 * 3. Kecepatan, sisa jarak, pH, & suhu tangki terintegrasi di dalam laci kiri [3].
 */
export default function TransporterTracking() {
  const { fetchPickupRequests } = useSijagaStore();

  // Memastikan database manifest pengangkutan diambil saat masuk halaman ini (Information Expert) [3]
  useEffect(() => {
    fetchPickupRequests();
  }, [fetchPickupRequests]);

  return (
    // Memenuhi 100% viewport layar tanpa dibungkus DashboardLayout untuk sensasi Command Center penuh
    <main className="relative h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800 selection:bg-emerald-200 selection:text-emerald-900">

      {/* =====================================================================
          LAYER 0: THE INFINITE CANVAS (PETA PELACAKAN LIVE)
          Berada di dasar (z-0), memproses simulasi rute GPS [3].
      ====================================================================== */}
      <TrackingMap />

      {/* =====================================================================
          LAYER 1: THE GLOBAL CONTEXT (NAVBAR ATAS)
          z-50.
      ====================================================================== */}
      <GisNavbar />

      {/* =====================================================================
          LAYER 2: THE SLIM ANCHOR (SIDEBAR KIRI)
          z-40. Otomatis menampilkan icon Truk live tracking khusus Transporter [3].
      ====================================================================== */}
      <GisSidebar />

      {/* =====================================================================
          LAYER 3: THE STACKING DRAWERS (PANEL ORCHESTRATOR)
          Wadah penumpuk laci telemetri flat taktis.
          Posisinya diatur langsung di dalam komponen PanelOrchestrator, z-30 [3].
      ====================================================================== */}
      <PanelOrchestrator />

      {/* =====================================================================
          LAYER 4: MAP HUD & CONTROLS (KANAN BAWAH)
          Zoom in/out kustom HUD spasial, z-30 [3].
      ====================================================================== */}
      <MapHUD />

    </main>
  );
}