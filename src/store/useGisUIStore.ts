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
    activeLayers: string[];           // Menyimpan ID layer yang aktif merender
    mapOpacity: number;               // 0 - 100 (Transparansi Poligon & Heatmap AQI)
    maskOpacity: number;              // 0 - 100 (Transparansi Inverted Polygon Masking area luar Kotim)
    activeBaseMap: string;            // 'dark', 'satellite', 'street', 'esri', 'osm'
    selectedCompanyId: string | null; // ID perusahaan yang sedang di-klik/difokuskan

    // Melacak ID stasiun pemantauan air sungai yang sedang aktif dipilih
    selectedWaterStationId: string | null;

    // FASE 4 INJEKSI: Koordinat & Zoom Global Berbasis Sumber Kebenaran Tunggal
    mapCenter: [number, number]; // Koordinat pusat peta saat ini (Sampit, Kotim)
    mapZoom: number;             // Skala zoom peta saat ini (Sumber data untuk Scale-Guard AI) [3]

    // FASE 3 INJEKSI: State untuk Advanced Spatial Analytics (Kabupaten Kotawaringin Timur)
    activeAdminBoundary: 'none' | 'kecamatan' | 'desa';
    showImpactRadius: boolean;

    // Cache spasial sementara di sisi klien untuk menghemat memori
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

    // Mengubah stasiun air terpilih
    setSelectedWaterStationId: (id: string | null) => void;

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

    // FASE 1 DECOUPLING: Memulai aplikasi dengan mode 'AMDAL' sebagai state tunggal aktif [3]
    activeLayers: ['layer-amdal'],
    mapOpacity: 80,
    maskOpacity: 60, // Default 60% redup untuk area di luar Kabupaten Kotawaringin Timur
    activeBaseMap: 'dark', // Default ke 'dark'
    selectedCompanyId: null,

    // Inisialisasi awal ID stasiun air kosong
    selectedWaterStationId: null,

    // SINKRONISASI BOGOR: Fokus otomatis dikunci ke wilayah Kabupaten Bogor
    mapCenter: [-6.4816, 106.8560],
    mapZoom: 11, // Tingkat zoom default 11 agar pas menyajikan bentang alam Kabupaten Bogor

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

            // EVALUASI ATURAN MUTUALLY EXCLUSIVE (SALING EKSKLUSIF) UNTUK EFISIENSI AREA PETA [3]
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
                    selectedWaterStationId: null, // Bersihkan juga tracking stasiun air
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
                    selectedWaterStationId: null, // Bersihkan tracking stasiun air jika panel ditutup
                    showImpactRadius: false
                })
            };
        }),

    clearPanels: () => set({
        activePanels: [],
        selectedCompanyId: null,
        selectedWaterStationId: null, // Reset stasiun air
        showImpactRadius: false,
        aqiCache: {}
    }),

    // ======================================================================
    // LOGIKA KONTROL PETA (MUTUALLY EXCLUSIVE HYBRID LAYER)
    // GRASP: Protected Variations (Melindungi Peta dari Konflik Layer)
    // ======================================================================
    toggleLayer: (layerId) =>
        set((state) => {
            const isExists = state.activeLayers.includes(layerId);
            let nextLayers = [...state.activeLayers];

            if (isExists) {
                // Mode Matikan Layer: Hapus instan dari array
                nextLayers = nextLayers.filter((id) => id !== layerId);
            } else {
                // Definisi Kelompok-Kelompok Mode Eksklusi
                const singleExclusiveLayers = ['layer-amdal', 'layer-uklupl', 'layer-sppl', 'layer-aqi'];
                const waterGroup = ['layer-river', 'layer-water-stations']; // Kelompok Air/Sungai [3]

                if (singleExclusiveLayers.includes(layerId)) {
                    // Sifat: Mutually Exclusive Mutlak. Reset array dan jadikan ia satu-satunya yang aktif.
                    nextLayers = [layerId];
                } else if (waterGroup.includes(layerId)) {
                    // Sifat: Matikan semua kelompok Single Mode, namun izinkan sesama elemen kelompok air bersanding
                    nextLayers = nextLayers.filter(id => !singleExclusiveLayers.includes(id));
                    nextLayers.push(layerId);
                } else {
                    // Penanganan fallback layer umum pendukung masa mendatang
                    nextLayers.push(layerId);
                }
            }

            return { activeLayers: nextLayers };
        }),

    setMapOpacity: (opacity) => set({ mapOpacity: opacity }),
    setMaskOpacity: (opacity) => set({ maskOpacity: opacity }),
    setActiveBaseMap: (baseMapId) => set({ activeBaseMap: baseMapId }),

    setSelectedCompanyId: (id) => set({ selectedCompanyId: id }),

    setSelectedWaterStationId: (id) => set({ selectedWaterStationId: id }),

    setMapCenter: (center) => set({ mapCenter: center }),
    setMapZoom: (zoom) => set({ mapZoom: zoom }), // Menyimpan nilai zoom level secara global [3]

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
            // SINKRONISASI RESET: Kembalikan ke mode awal AMDAL yang terisolasi [3]
            activeLayers: ['layer-amdal'],
            selectedCompanyId: null,
            selectedWaterStationId: null, // Reset seleksi stasiun air
            activePanels: [],
            activeAdminBoundary: 'none',
            showImpactRadius: false,
            mapOpacity: 80,
            maskOpacity: 60,
            activeBaseMap: 'dark',
            mapCenter: [-6.4816, 106.8560], // Reset kembali ke pusat Kabupaten Bogor
            mapZoom: 11, // Reset kembali ke skala default Bogor
            aqiCache: {},
        }),
}));