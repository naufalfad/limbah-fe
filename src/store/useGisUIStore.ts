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
    activeLayers: string[];     // Menyimpan ID layer yang nyala ('amdal', 'ukl-upl', 'sppl', 'das', 'rtrw')
    mapOpacity: number;         // 0 - 100
    activeBaseMap: string;      // 'voyager', 'satellite', 'osm'
    selectedCompanyId: string | null; // ID perusahaan yang sedang di-klik/difokuskan

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
    resetMapContext: () => void;
}

export const useGisUIStore = create<GisUIState>((set) => ({
    // Inisialisasi State Default
    activePanels: [],

    // Default layer nyala semua persis seperti komponen lama lu
    activeLayers: ['layer-amdal', 'layer-uklupl', 'layer-sppl', 'overlay-das', 'overlay-rtrw'],

    mapOpacity: 80,
    activeBaseMap: 'voyager',
    selectedCompanyId: null,

    // ======================================================================
    // LOGIKA MUTUALLY EXCLUSIVE & STACKING (GFW PARADIGM)
    // ======================================================================
    openPanel: (type, title, data = null) =>
        set((state) => {
            // Aturan Singleton: Apakah yang mau dibuka adalah Panel Floating Detail?
            const isDetailPanel = type === "detil-perusahaan";

            let nextPanels = [...state.activePanels];

            if (isDetailPanel) {
                // Hapus panel detail lama jika ada, agar tidak numpuk melayang di layar
                nextPanels = nextPanels.filter((p) => p.type !== "detil-perusahaan");
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
            const shouldUnselectCompany = closedPanel?.type === "detil-perusahaan";

            return {
                activePanels: filteredPanels,
                ...(shouldUnselectCompany && { selectedCompanyId: null }),
            };
        }),

    closePanelsToTheRight: (index) =>
        set((state) => {
            // Potong array panel sesuai indeks yang diklik
            const slicedPanels = state.activePanels.slice(0, index + 1);

            // Cek apakah panel detail terikut tertutup (tidak ada di array sisa)
            const isDetailStillOpen = slicedPanels.some((p) => p.type === "detil-perusahaan");

            return {
                activePanels: slicedPanels,
                ...(!isDetailStillOpen && { selectedCompanyId: null }),
            };
        }),

    clearPanels: () => set({ activePanels: [], selectedCompanyId: null }),

    // ======================================================================
    // LOGIKA KONTROL PETA (LAYERS, OPACITY, BASEMAP)
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

    // Mereset peta ke mode awal
    resetMapContext: () =>
        set({
            activeLayers: ['layer-amdal', 'layer-uklupl', 'layer-sppl', 'overlay-das', 'overlay-rtrw'],
            selectedCompanyId: null,
            activePanels: [],
        }),
}));