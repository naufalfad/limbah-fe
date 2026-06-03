// src/store/useGisUIStore.ts
import { create } from "zustand";
import { GisPanel, GisPanelType } from "../types/gis";

interface GisUIState {
    // ==========================================
    // 1. STATE: Manajemen Panel (UI Layout)
    // ==========================================
    activePanels: GisPanel[];

    // ==========================================
    // 2. STATE: Konteks Eksplorasi Spasial (Peta)
    // ==========================================
    activeLayers: string[];     // Menyimpan ID layer yang nyala
    mapOpacity: number;         // 0 - 100 (Transparansi Poligon & Heatmap AQI)
    maskOpacity: number;        // 0 - 100 (Transparansi Inverted Polygon Masking area luar Bogor)
    activeBaseMap: string;      // 'dark', 'satellite', 'street', 'esri', 'osm'
    selectedCompanyId: string | null; // ID perusahaan yang sedang di-klik/difokuskan

    // FASE 4 INJEKSI: Koordinat & Zoom Global Berbasis Sumber Kebenaran Tunggal
    mapCenter: [number, number]; // Koordinat pusat peta saat ini
    mapZoom: number;             // Skala zoom peta saat ini (Sumber data untuk Scale-Guard AI) [3]

    // FASE 3 INJEKSI: State untuk Advanced Spatial Analytics (Kabupaten Bogor)
    activeAdminBoundary: 'none' | 'kecamatan' | 'desa';
    showImpactRadius: boolean;

    // [NEW STATE] Cache spasial sementara di sisi klien untuk menghemat memori
    aqiCache: Record<string, any>; // Key format: "roundedLat_roundedLng" -> Value: AqiData

    // ==========================================
    // ACTIONS: Manajemen Panel
    // ==========================================
    openPanel: (type: GisPanelType, title: string, data?: any) => void;
    closePanel: (id: string) => void;
    closePanelsToTheRight: (index: number) => void;
    clearPanels: () => void;

    // ==========================================
    // ACTIONS: Konteks Eksplorasi Spasial
    // ==========================================
    toggleLayer: (layerId: string) => void;
    setMapOpacity: (opacity: number) => void;
    setMaskOpacity: (opacity: number) => void;
    setActiveBaseMap: (baseMapId: string) => void;
    setSelectedCompanyId: (id: string | null) => void;

    // Aksi Pengubah Koordinat & Zoom Peta secara Global
    setMapCenter: (center: [number, number]) => void;
    setMapZoom: (zoom: number) => void; // Aksi sinkronisasi zoom Leaflet ke Zustand Store [3]

    // Aksi untuk mengontrol Peta Administratif & Radius Dampak
    setActiveAdminBoundary: (boundary: 'none' | 'kecamatan' | 'desa') => void;
    setShowImpactRadius: (show: boolean) => void;

    // Menyimpan telemetri kualitas udara yang sukses diambil ke cache klien
    setAqiCache: (key: string, data: any) => void;

    resetMapContext: () => void;
}

export const useGisUIStore = create<GisUIState>((set) => ({
    // Inisialisasi State Default
    activePanels: [],

    // Default state: AQI dimatikan. Layer industri menyala sebagai basis operasional
    activeLayers: ['layer-amdal', 'layer-uklupl', 'layer-sppl'],
    mapOpacity: 80,
    maskOpacity: 60, // Default 60% redup untuk area di luar Kabupaten Bogor
    activeBaseMap: 'dark', // Default ke 'dark'
    selectedCompanyId: null,

    // Fokus otomatis dikunci ke wilayah Cibinong, Kabupaten Bogor
    mapCenter: [-6.4816, 106.8560],
    mapZoom: 11, // Zoom awal default disesuaikan untuk wilayah Bogor

    // Inisialisasi State Spasial Lanjutan
    activeAdminBoundary: 'none',
    showImpactRadius: false,

    // Inisialisasi awal objek cache kosong
    aqiCache: {},

    // ======================================================================
    // LOGIKA MUTUALLY EXCLUSIVE & STACKING (GFW PARADIGM)
    // ======================================================================
    openPanel: (type, title, data = null) =>
        set((state) => {
            const isAiPanel = type === "ai-copilot";
            const isDetailCompany = type === "detil-perusahaan";
            const isDetailTask = type === "detail-tugas";
            const isDetailPanel = type === "detil-perusahaan" || type === "detail-tugas" || type === "telemetri-lingkungan";

            let nextPanels = [...state.activePanels];

            // 1. EVALUASI ATURAN MUTUALLY EXCLUSIVE (SALING EKSKLUSIF) UNTUK EFISIENSI AREA PETAS [3]
            if (isAiPanel) {
                // AI COPILOT EXCLUSIVITY: AI Agent membutuhkan fokus penuh. Tutup semua laci di layar.
                nextPanels = [];
            } else if (isDetailCompany) {
                // DETAIL INDUSTRI EXCLUSIVITY: Tutup menu kiri biasa, sisakan telemetri udara pasangan
                nextPanels = nextPanels.filter((p) => p.type === "telemetri-lingkungan");
            } else if (isDetailTask) {
                // DETAIL TUGAS EXCLUSIVITY: Tugas sidak menutup semua panel lain agar mata fokus ke target
                nextPanels = [];
            } else {
                // JIKA USER MEMBUKA MENU KIRI BIASA (Layers, Basemap, Katalog):
                // A. Matikan paksa AI Copilot agar tidak tumpang tindih di kiri layar
                nextPanels = nextPanels.filter((p) => p.type !== "ai-copilot");

                // B. Bersihkan tumpukan floating details lama jika berpindah kembali ke menu utama
                const isLeftMenu = type === "katalog-perusahaan" || type === "layer-kewajiban" || type === "basemap-gallery" || type === "tugas-patroli" || type === "armada-tracking" || type === "tentang";
                if (isLeftMenu) {
                    nextPanels = nextPanels.filter((p) => p.type !== "detil-perusahaan" && p.type !== "telemetri-lingkungan" && p.type !== "detail-tugas");
                }

                // C. Terapkan Singleton Standar untuk detail panel biasa
                if (isDetailPanel) {
                    nextPanels = nextPanels.filter((p) => p.type !== "detil-perusahaan" && p.type !== "detail-tugas" && p.type !== "telemetri-lingkungan");
                } else {
                    nextPanels = nextPanels.filter((p) => p.type !== type);
                }
            }

            // Buat panel baru dengan ID unik berbasis waktu
            const newPanel: GisPanel = {
                id: `${type}-${Date.now()}`,
                type,
                title,
                isVisible: true,
                data,
            };

            // Tambahkan ke ujung array (paling kanan/atas)
            nextPanels.push(newPanel);

            return { activePanels: nextPanels };
        }),

    closePanel: (id) =>
        set((state) => {
            const closedPanel = state.activePanels.find((p) => p.id === id);
            if (!closedPanel) return {};

            let filteredPanels = state.activePanels.filter((p) => p.id !== id);

            // SINKRONISASI DAUR HIDUP LACI: Jika laci detail industri atau laci telemetri udara ditutup,
            // secara otomatis tutup pasangannya di peramban untuk mencegah laci melayang yatim piatu
            const isDetailOrTelemetry = closedPanel.type === "detil-perusahaan" || closedPanel.type === "telemetri-lingkungan";
            if (isDetailOrTelemetry) {
                filteredPanels = filteredPanels.filter(
                    (p) => p.type !== "detil-perusahaan" && p.type !== "telemetri-lingkungan"
                );
            }

            const shouldClearSelection = isDetailOrTelemetry || closedPanel.type === "detail-tugas";

            return {
                activePanels: filteredPanels,
                ...(shouldClearSelection && {
                    selectedCompanyId: null,
                    showImpactRadius: false
                })
            };
        }),

    closePanelsToTheRight: (index) =>
        set((state) => {
            const slicedPanels = state.activePanels.slice(0, index + 1);

            const isDetailOrTelemetryStillOpen = slicedPanels.some(
                (p) => p.type === "detil-perusahaan" || p.type === "telemetri-lingkungan" || p.type === "detail-tugas"
            );

            return {
                activePanels: slicedPanels,
                ...(!isDetailOrTelemetryStillOpen && {
                    selectedCompanyId: null,
                    showImpactRadius: false
                })
            };
        }),

    clearPanels: () => set({
        activePanels: [],
        selectedCompanyId: null,
        showImpactRadius: false,
        aqiCache: {}
    }),

    // ======================================================================
    // LOGIKA KONTROL PETA (MUTUALLY EXCLUSIVE LAYER)
    // ======================================================================
    toggleLayer: (layerId) =>
        set((state) => {
            const isExists = state.activeLayers.includes(layerId);
            let nextLayers = [...state.activeLayers];

            if (isExists) {
                // Mode Matikan Layer
                nextLayers = nextLayers.filter((id) => id !== layerId);
            } else {
                // Mode Hidupkan Layer dengan Logika Saling Eksklusif (Mutually Exclusive)
                const groupIndustriPengaduan = ['layer-amdal', 'layer-uklupl', 'layer-sppl', 'layer-complaints'];

                if (layerId === 'layer-aqi') {
                    // Jika menghidupkan AQI -> Matikan paksa kelompok Industri & Pengaduan
                    nextLayers = nextLayers.filter(id => !groupIndustriPengaduan.includes(id));
                    nextLayers.push(layerId);
                } else if (groupIndustriPengaduan.includes(layerId)) {
                    // Jika menghidupkan Industri/Pengaduan -> Matikan paksa AQI
                    nextLayers = nextLayers.filter(id => id !== 'layer-aqi');
                    nextLayers.push(layerId);
                } else {
                    // Layer lain (misal jika ada) berjalan normal
                    nextLayers.push(layerId);
                }
            }

            return { activeLayers: nextLayers };
        }),

    setMapOpacity: (opacity) => set({ mapOpacity: opacity }),
    setMaskOpacity: (opacity) => set({ maskOpacity: opacity }),
    setActiveBaseMap: (baseMapId) => set({ activeBaseMap: baseMapId }),

    setSelectedCompanyId: (id) => set({ selectedCompanyId: id }),

    setMapCenter: (center) => set({ mapCenter: center }),
    setMapZoom: (zoom) => set({ mapZoom: zoom }), // Menyimpan nilai zoom level secara global

    setActiveAdminBoundary: (boundary) => set({ activeAdminBoundary: boundary }),
    setShowImpactRadius: (show) => set({ showImpactRadius: show }),

    setAqiCache: (key, data) =>
        set((state) => ({
            aqiCache: {
                ...state.aqiCache,
                [key]: data,
            },
        })),

    resetMapContext: () =>
        set({
            activeLayers: ['layer-amdal', 'layer-uklupl', 'layer-sppl'],
            selectedCompanyId: null,
            activePanels: [],
            activeAdminBoundary: 'none',
            showImpactRadius: false,
            mapOpacity: 80,
            maskOpacity: 60,
            activeBaseMap: 'dark',
            mapCenter: [-6.4816, 106.8560], // Reset kembali ke pusat Bogor
            mapZoom: 11, // Reset kembali ke skala default Bogor
            aqiCache: {},
        }),
}));