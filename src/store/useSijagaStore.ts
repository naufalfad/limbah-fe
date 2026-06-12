// src/store/useSijagaStore.ts
import { create } from "zustand";
import { apiService, api } from "../lib/api"; // PEMBARUAN IMPOR: Membawa instansi interceptor 'api'
import { toast } from "sonner";

// Mengimpor kontrak data dasar dari file types
import {
  SijagaState as BaseSijagaState,
  UserRole,
  User,
  Company,
  WasteLog,
  PickupRequest,
  Invoice,
  Inspection,
  SystemNotification,
  AuditLog,
  ReportSlice,
  AiForensicResult,
  AqiData,
  BogorClusterTelemetry // INJEKSI: Mengimpor tipe data Klaster
} from "./types";

// Mengimpor kontrak tipe data kualitas air baru
import { WaterStationNode } from "../types/gis";

// Re-export seluruh kontrak data agar tidak merusak impor di file komponen lain (Backward Compatibility)
export type {
  UserRole,
  User,
  Company,
  WasteLog,
  PickupRequest,
  Invoice,
  Inspection,
  SystemNotification,
  AuditLog,
  AiForensicResult,
  AqiData,
  BogorClusterTelemetry
};

// Mengimpor modul laci-laci state (Slices)
import { createAuthSlice } from "./slices/authSlice";
import { createCompanySlice } from "./slices/companySlice";
import { createWasteSlice } from "./slices/wasteSlice";
import { createPickupSlice } from "./slices/pickupSlice";
import { createInvoiceSlice } from "./slices/invoiceSlice";
import { createInspectionSlice } from "./slices/inspectionSlice";
import { createNotificationSlice } from "./slices/notificationSlice";
import { createAuditSlice } from "./slices/auditSlice";
import { createReportSlice } from "./slices/reportSlice";

// 1. Interfaces Analitik Eksekutif Baru yang Kita Bangun
export interface ExecutiveAnalyticsData {
  totalCompanies: number;
  averageEsg: number;
  esgDelta: number;
  totalWasteB3: number;
  totalRevenue: number;
  unpaidRevenue: number;
  weeklyWasteChart: { date: string; volume: number }[];
  distribution: { sangatPatuh: number; cukupPatuh: number; kritis: number };
}

export interface PerformanceAnalyticsData {
  pendingApprovals: number;
  completedInspections: number;
  overdueInspections: number;
  recentInspections: {
    id: string;
    companyId: string;
    companyName: string;
    inspectorId: string;
    inspectorName: string;
    date: string;
    score: number | null;
    status: string;
    location: string;
    notes?: string;
  }[];
  documentComposition: { sppl: number; uklUpl: number };
}

// 2. Mengembangkan (Extend) SijagaState untuk Menampung Fitur Admin, Auditor, Pelaporan & AI Agent
export interface SijagaState extends BaseSijagaState, ReportSlice {
  users: User[];
  executiveAnalytics: ExecutiveAnalyticsData | null;
  performanceAnalytics: PerformanceAnalyticsData | null;

  // [NEW STATE] Penampung data stasiun pengamatan kualitas air (BOD/COD)
  waterStations: WaterStationNode[];
  isWaterLoading: boolean;
  fetchWaterStations: () => Promise<void>;

  // State & Action khusus AI Agent (Forensic Spasial)
  aiForensicResult: AiForensicResult | null;
  isAiLoading: boolean;
  // SINKRONISASI TS FIX: Menambahkan parameter zoom ke dalam tipe data payload [3]
  runAiForensicScan: (payload: { lat: number; lng: number; zoom: number; windDirection: number; incidentType: string; description: string }) => Promise<AiForensicResult | null>;

  fetchUsers: () => Promise<void>;
  updateUserRole: (id: string, role: UserRole) => Promise<void>;
  createUser: (payload: any) => Promise<boolean>;
  fetchExecutiveAnalytics: () => Promise<void>;
  fetchPerformanceAnalytics: () => Promise<void>;
  fetchAuditLogs: () => Promise<void>;
}

// 3. Struktur Default Fail-Safe Recovery
const defaultExecutiveAnalytics: ExecutiveAnalyticsData = {
  totalCompanies: 0,
  averageEsg: 0,
  esgDelta: 0,
  totalWasteB3: 0,
  totalRevenue: 0,
  unpaidRevenue: 0,
  weeklyWasteChart: [],
  distribution: { sangatPatuh: 0, cukupPatuh: 0, kritis: 0 }
};

const defaultPerformanceAnalytics: PerformanceAnalyticsData = {
  pendingApprovals: 0,
  completedInspections: 0,
  overdueInspections: 0,
  recentInspections: [],
  documentComposition: { sppl: 0, uklUpl: 0 }
};

// --- MOCK DATA STASIUN AIR REALISTIS (PP No. 22 Tahun 2021) ---
const mockWaterStations: WaterStationNode[] = [
  {
    id: "WS-01",
    name: "Stasiun Hulu Ciliwung (Cisarua)",
    lat: -6.6986,
    lng: 106.9430,
    currentData: { month: "Mei", bod: 1.8, cod: 12.5, do: 6.8, ph: 7.2 },
    monthlyHistory: [
      { month: "Jan", bod: 1.5, cod: 10.0, do: 7.2, ph: 7.1 },
      { month: "Feb", bod: 1.6, cod: 11.2, do: 7.0, ph: 7.0 },
      { month: "Mar", bod: 1.7, cod: 11.8, do: 6.9, ph: 7.2 },
      { month: "Apr", bod: 1.8, cod: 12.2, do: 6.8, ph: 7.2 },
      { month: "Mei", bod: 1.8, cod: 12.5, do: 6.8, ph: 7.2 }
    ]
  },
  {
    id: "WS-02",
    name: "Stasiun Tengah Ciliwung (Katulampa)",
    lat: -6.6163,
    lng: 106.8325,
    currentData: { month: "Mei", bod: 2.7, cod: 21.0, do: 5.4, ph: 6.8 },
    monthlyHistory: [
      { month: "Jan", bod: 2.1, cod: 17.5, do: 6.1, ph: 6.9 },
      { month: "Feb", bod: 2.2, cod: 18.2, do: 6.0, ph: 6.8 },
      { month: "Mar", bod: 2.4, cod: 19.5, do: 5.8, ph: 6.7 },
      { month: "Apr", bod: 2.6, cod: 20.3, do: 5.6, ph: 6.8 },
      { month: "Mei", bod: 2.7, cod: 21.0, do: 5.4, ph: 6.8 }
    ]
  },
  {
    id: "WS-03",
    name: "Stasiun Hilir Cileungsi (Klapanunggal)",
    lat: -6.3986,
    lng: 106.9680,
    currentData: { month: "Mei", bod: 5.4, cod: 38.0, do: 2.8, ph: 5.5 }, // MELEBIHI LIMIT (BAHAYA)
    monthlyHistory: [
      { month: "Jan", bod: 3.2, cod: 26.5, do: 4.1, ph: 6.1 },
      { month: "Feb", bod: 3.5, cod: 28.0, do: 3.9, ph: 6.0 },
      { month: "Mar", bod: 4.1, cod: 31.2, do: 3.5, ph: 5.8 },
      { month: "Apr", bod: 4.9, cod: 35.0, do: 3.0, ph: 5.7 },
      { month: "Mei", bod: 5.4, cod: 38.0, do: 2.8, ph: 5.5 }
    ]
  },
  {
    id: "WS-04",
    name: "Stasiun Aliran Citeureup (Mayor Oking)",
    lat: -6.4786,
    lng: 106.8530,
    currentData: { month: "Mei", bod: 3.8, cod: 29.5, do: 3.7, ph: 6.4 }, // MELEBIHI LIMIT (BAHAYA)
    monthlyHistory: [
      { month: "Jan", bod: 2.8, cod: 22.0, do: 4.5, ph: 6.6 },
      { month: "Feb", bod: 2.9, cod: 23.5, do: 4.3, ph: 6.5 },
      { month: "Mar", bod: 3.2, cod: 25.8, do: 4.0, ph: 6.4 },
      { month: "Apr", bod: 3.5, cod: 27.2, do: 3.8, ph: 6.3 },
      { month: "Mei", bod: 3.8, cod: 29.5, do: 3.7, ph: 6.4 }
    ]
  }
];

// 4. Inisialisasi Store Zustand Terpadu (Slices + Inline Executive Actions)
export const useSijagaStore = create<SijagaState>((set, get, store) => ({
  // Mengurai (spread) seluruh laci state modular
  ...createAuthSlice(set, get, store),
  ...createCompanySlice(set, get, store),
  ...createWasteSlice(set, get, store),
  ...createPickupSlice(set, get, store),
  ...createInvoiceSlice(set, get, store),
  ...createInspectionSlice(set, get, store),
  ...createNotificationSlice(set, get, store),
  ...createAuditSlice(set, get, store),
  ...createReportSlice(set, get, store),

  // Suntikan State Baru Khusus Otoritas Admin & Auditor
  users: [],
  executiveAnalytics: null,
  performanceAnalytics: null,

  // [NEW STATE INITIALIZATION]
  waterStations: mockWaterStations, // Inisialisasi awal dengan mock data Bogor
  isWaterLoading: false,

  // [NEW ACTION] Pemanggilan/Sinkronisasi Stasiun Air Hibrida (Protected Variations)
  fetchWaterStations: async () => {
    set({ isWaterLoading: true });
    try {
      // Hubungkan langsung ke endpoint REST API backend baru kita [3]
      const response = await api.get("/api/analytics/water-stations");
      if (response && response.data && response.data.success) {
        set({ waterStations: response.data.data });
      } else {
        set({ waterStations: mockWaterStations });
      }
    } catch (e) {
      console.warn("[SYSTEM_WARN] Gagal terhubung ke endpoint API kualitas air. Mengaktifkan backup mock data lokal.", e);
      // Fail-Safe: Jika backend offline, amankan jalannya peta dengan data mock lokal
      set({ waterStations: mockWaterStations });
    } finally {
      set({ isWaterLoading: false });
    }
  },

  // ==========================================================================
  // MANAJEMEN KUALITAS UDARA SPASIAL (AQI SLICE IMPLEMENTATION)
  // ==========================================================================
  currentAqiData: null,
  batchAqiData: [], // NEW STATE: Penampung telemetri batch klaster Kabupaten Bogor
  isAqiLoading: false,

  fetchAqiData: async (lat: string | number, lng: string | number) => {
    set({ isAqiLoading: true });
    try {
      const response = await apiService.analytics.getAqiData(lat, lng);
      if (response && response.success) {
        set({ currentAqiData: response.data });
        return response.data;
      }
      return null;
    } catch (e) {
      console.error("Gagal menarik telemetri AQI individual:", e);
      return null;
    } finally {
      set({ isAqiLoading: false });
    }
  },

  /**
   * SINKRONISASI BATCH AKSI (Pure Fabrication / Indirection)
   * Menarik seluruh data stasiun klaster Kab. Bogor dari server dalam satu kali fetch,
   * menghemat resource batasan rate-limit API token IQAir eksternal secara drastis.
   */
  fetchBatchAqiData: async () => {
    set({ isAqiLoading: true });
    try {
      const response = await api.get("/api/analytics/aqi-batch");
      if (response && response.data && response.data.success) {
        const data = response.data.data as BogorClusterTelemetry[];
        set({ batchAqiData: data });
        return data;
      }
      return [];
    } catch (e) {
      console.error("Gagal menarik data batch telemetri AQI Kabupaten Bogor:", e);
      return [];
    } finally {
      set({ isAqiLoading: false });
    }
  },

  clearAqiData: () => set({ currentAqiData: null, batchAqiData: [] }),

  // ==========================================================================
  // AI AGENT FORENSIC ENGINE LOGIC
  // ==========================================================================
  aiForensicResult: null,
  isAiLoading: false,

  runAiForensicScan: async (payload) => {
    set({ isAiLoading: true, aiForensicResult: null });
    try {
      // Memanggil lapisan API Service dengan muatan payload yang kini dijamin membawa zoom [3]
      const response = await apiService.agent.runForensicScan(payload);

      if (response && response.success) {
        set({ aiForensicResult: response.data });
        toast.success("Analisis AI Forensik berhasil diselesaikan.");
        return response.data as AiForensicResult;
      } else {
        toast.error("Gagal melakukan kalkulasi forensik AI.");
        return null;
      }
    } catch (e: any) {
      console.error("AI Forensic Store Error:", e);
      const serverMsg = e.response?.data?.message || "Koneksi ke otak AI terputus. Pastikan server Backend aktif.";
      toast.error(serverMsg);
      return null;
    } finally {
      set({ isAiLoading: false });
    }
  },

  // ==========================================================================
  // PENGELOLAAN PENGGUNA (SUPER ADMIN)
  // ==========================================================================
  fetchUsers: async () => {
    try {
      const response = await apiService.admin.getAllUsers();
      if (response && response.success) {
        set({ users: response.users || [] });
      }
    } catch (e) {
      console.error("API fetchUsers failed", e);
      toast.error("Gagal memuat data pengguna.");
    }
  },

  updateUserRole: async (id: string, role: UserRole) => {
    try {
      const response = await apiService.admin.updateUserRole(id, role);
      if (response && response.success) {
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, role } : u))
        }));
        toast.success(`Berhasil! Hak akses pengguna diubah menjadi ${role}`);
      }
    } catch (e) {
      console.error("API updateUserRole failed", e);
      toast.error("Gagal mengubah hak akses pengguna.");
    }
  },

  createUser: async (payload: any) => {
    try {
      const response = await apiService.admin.createUser(payload);
      if (response && response.success) {
        toast.success("User baru berhasil ditambahkan!");
        // Refresh users list
        const responseUsers = await apiService.admin.getAllUsers();
        if (responseUsers && responseUsers.success) {
          set({ users: responseUsers.users || [] });
        }
        return true;
      }
      return false;
    } catch (e: any) {
      console.error("API createUser failed", e);
      const errMsg = e.response?.data?.error || "Gagal membuat user baru.";
      toast.error(errMsg);
      return false;
    }
  },

  fetchAuditLogs: async () => {
    try {
      const response = await apiService.auditLogs.getAll();
      if (response && response.success) {
        set({ auditLogs: response.logs || [] });
      }
    } catch (e) {
      console.error("API fetchAuditLogs failed", e);
    }
  },

  // ==========================================================================
  // ANALITIK EKSEKUTIF PIMPINAN
  // ==========================================================================
  fetchExecutiveAnalytics: async () => {
    try {
      const response = await apiService.analytics.getExecutive();
      if (response && response.success) {
        set({ executiveAnalytics: response.data });
      } else {
        set({ executiveAnalytics: defaultExecutiveAnalytics });
      }
    } catch (e) {
      console.error("API fetchExecutiveAnalytics failed, using fallback", e);
      set({ executiveAnalytics: defaultExecutiveAnalytics });
      toast.error("Gagal memuat analitik eksekutif. Menampilkan data lokal.");
    }
  },

  fetchPerformanceAnalytics: async () => {
    try {
      const response = await apiService.analytics.getPerformance();
      if (response && response.success) {
        set({ performanceAnalytics: response.data });
      } else {
        set({ performanceAnalytics: defaultPerformanceAnalytics });
      }
    } catch (e) {
      console.error("API fetchPerformanceAnalytics failed, using fallback", e);
      set({ performanceAnalytics: defaultPerformanceAnalytics });
      toast.error("Gagal memuat kinerja operasional. Menampilkan data lokal.");
    }
  }
}));