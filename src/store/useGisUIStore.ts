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
    activeLayers: string[];     // Menyimpan ID layer yang nyala ('amdal', 'ukl-upl', 'sppl', 'das', 'rtrw', 'layer-aqi')
    mapOpacity: number;         // 0 - 100
    activeBaseMap: string;      // 'voyager', 'satellite', 'osm'
    selectedCompanyId: string | null; // ID perusahaan yang sedang di-klik/difokuskan

    // FASE 4 INJEKSI: Koordinat & Zoom Global Berbasis Sumber Kebenaran Tunggal [3]
    mapCenter: [number, number]; // Koordinat pusat peta saat ini
    mapZoom: number;             // Skala zoom peta saat ini

    // FASE 3 INJEKSI: State untuk Advanced Spatial Analytics (Kotawaringin Timur)
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
    setActiveBaseMap: (baseMapId: string) => void;
    setSelectedCompanyId: (id: string | null) => void;

    // FASE 4 INJEKSI: Aksi Pengubah Koordinat & Zoom Peta secara Global [3]
    setMapCenter: (center: [number, number]) => void;
    setMapZoom: (zoom: number) => void;

    // FASE 3 INJEKSI: Aksi untuk mengontrol Peta Administratif & Radius Dampak
    setActiveAdminBoundary: (boundary: 'none' | 'kecamatan' | 'desa') => void;
    setShowImpactRadius: (show: boolean) => void;

    // [NEW ACTION] Menyimpan telemetri kualitas udara yang sukses diambil ke cache klien
    setAqiCache: (key: string, data: any) => void;

    resetMapContext: () => void;
}

export const useGisUIStore = create<GisUIState>((set) => ({
    // Inisialisasi State Default
    activePanels: [],

    // Update activeLayers untuk memuat 'layer-aqi' di peta secara default
    activeLayers: ['layer-amdal', 'layer-uklupl', 'layer-sppl', 'layer-aqi', 'overlay-das', 'overlay-rtrw'],
    mapOpacity: 80,
    activeBaseMap: 'voyager',
    selectedCompanyId: null,

    // FASE 4 DEFAULT: Fokus otomatis dikunci ke wilayah Sampit, Kotawaringin Timur [3]
    mapCenter: [-2.5337, 112.9515],
    mapZoom: 9,

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
            // Aturan Singleton: Apakah yang mau dibuka adalah Panel Floating Detail?
            const isDetailPanel = type === "detil-perusahaan" || type === "detail-tugas";

            let nextPanels = [...state.activePanels];

            if (isDetailPanel) {
                // Hapus panel detail lama jika ada, agar tidak numpuk melayang di layar
                nextPanels = nextPanels.filter((p) => p.type !== "detil-perusahaan" && p.type !== "detail-tugas");
            } else {
                // Untuk panel menu (Kiri), hapus panel tipe sama agar tidak duplikat
                nextPanels = nextPanels.filter((p) => p.type !== type);
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
            const filteredPanels = state.activePanels.filter((p) => p.id !== id);

            // Jika yang ditutup adalah panel detail, otomatis unselect perusahaan
            const closedPanel = state.activePanels.find((p) => p.id === id);
            const shouldUnselectCompany = closedPanel?.type === "detil-perusahaan" || closedPanel?.type === "detail-tugas";

            return {
                activePanels: filteredPanels,
                ...(shouldUnselectCompany && { selectedCompanyId: null, showImpactRadius: false }), // Otomatis matikan radius dampak jika panel ditutup
            };
        }),

    closePanelsToTheRight: (index) =>
        set((state) => {
            // Potong array panel sesuai indeks yang diklik
            const slicedPanels = state.activePanels.slice(0, index + 1);

            // Cek apakah panel detail terikut tertutup (tidak ada di array sisa)
            const isDetailStillOpen = slicedPanels.some((p) => p.type === "detil-perusahaan" || p.type === "detail-tugas");

            return {
                activePanels: slicedPanels,
                ...(!isDetailStillOpen && { selectedCompanyId: null, showImpactRadius: false }),
            };
        }),

    clearPanels: () => set({ activePanels: [], selectedCompanyId: null, showImpactRadius: false }),

    // ======================================================================
    // LOGIKA KONTROL PETA (LAYERS, OPACITY, BASEMAP, COORDINATES)
    // ======================================================================
    toggleLayer: (layerId) =>
        set((state) => {
            const isExists = state.activeLayers.includes(layerId);
            return {
                activeLayers: isExists
                    ? state.activeLayers.filter((id) => id !== layerId)
                    : [...state.activeLayers, layerId],
            };
        }),

    setMapOpacity: (opacity) => set({ mapOpacity: opacity }),
    setActiveBaseMap: (baseMapId) => set({ activeBaseMap: baseMapId }),

    setSelectedCompanyId: (id) => set({ selectedCompanyId: id }),

    // FASE 4 INJEKSI: Setter untuk pusat koordinat & skala zoom peta
    setMapCenter: (center) => set({ mapCenter: center }),
    setMapZoom: (zoom) => set({ mapZoom: zoom }),

    // FASE 3 INJEKSI: Setter Fungsi Spatial Analytics
    setActiveAdminBoundary: (boundary) => set({ activeAdminBoundary: boundary }),
    setShowImpactRadius: (show) => set({ showImpactRadius: show }),

    // Menyimpan telemetri baru ke dalam penyimpanan cache lokal
    setAqiCache: (key, data) =>
        set((state) => ({
            aqiCache: {
                ...state.aqiCache,
                [key]: data,
            },
        })),

    // Mereset peta ke mode awal (Mengembalikan fokus ke Kotawaringin Timur / Sampit) [3]
    resetMapContext: () =>
        set({
            activeLayers: ['layer-amdal', 'layer-uklupl', 'layer-sppl', 'layer-aqi', 'overlay-das', 'overlay-rtrw'],
            selectedCompanyId: null,
            activePanels: [],
            activeAdminBoundary: 'none',
            showImpactRadius: false,
            mapCenter: [-2.5337, 112.9515], // Mengunci titik reset di pusat Sampit [3]
            mapZoom: 9,                     // Mengunci skala zoom default wilayah administrasi Kotim [3]
            aqiCache: {},                   // Membersihkan cache lokal saat peta di-reset
        }),
}));