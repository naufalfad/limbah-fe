// src/store/useSijagaStore.ts
import { create } from "zustand";
import { apiService } from "../lib/api";
import { toast } from "sonner";

// Mengimpor kontrak data dasar dari file types temen lu
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
  ReportSlice // INJEKSI BARU: Tipe antarmuka slice pelaporan
} from "./types";

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
  AuditLog
};

// Mengimpor modul laci-laci state (Slices) buatan temen lu
import { createAuthSlice } from "./slices/authSlice";
import { createCompanySlice } from "./slices/companySlice";
import { createWasteSlice } from "./slices/wasteSlice";
import { createPickupSlice } from "./slices/pickupSlice";
import { createInvoiceSlice } from "./slices/invoiceSlice";
import { createInspectionSlice } from "./slices/inspectionSlice";
import { createNotificationSlice } from "./slices/notificationSlice";
import { createAuditSlice } from "./slices/auditSlice";
import { createReportSlice } from "./slices/reportSlice"; // INJEKSI BARU

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

// 2. Mengembangkan (Extend) SijagaState untuk Menampung Fitur Admin, Auditor & Pelaporan (ReportSlice)
export interface SijagaState extends BaseSijagaState, ReportSlice { // INJEKSI: Extend ReportSlice ke State Induk
  users: User[];
  executiveAnalytics: ExecutiveAnalyticsData | null;
  performanceAnalytics: PerformanceAnalyticsData | null;
  fetchUsers: () => Promise<void>;
  updateUserRole: (id: string, role: UserRole) => Promise<void>;
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

// 4. Inisialisasi Store Zustand Terpadu (Slices + Inline Executive Actions)
export const useSijagaStore = create<SijagaState>((set, get, store) => ({
  // Mengurai (spread) seluruh laci state milik temen lu secara instan
  ...createAuthSlice(set, get, store),
  ...createCompanySlice(set, get, store),
  ...createWasteSlice(set, get, store),
  ...createPickupSlice(set, get, store),
  ...createInvoiceSlice(set, get, store),
  ...createInspectionSlice(set, get, store),
  ...createNotificationSlice(set, get, store),
  ...createAuditSlice(set, get, store),
  ...createReportSlice(set, get, store), // INJEKSI BARU: Menyuntikkan slice pelaporan masyarakat

  // Suntikan State Baru Khusus Otoritas Admin & Auditor
  users: [],
  executiveAnalytics: null,
  performanceAnalytics: null,

  // Suntikan Aksi Pengelolaan Pengguna Super Admin (API Terhubung)
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

  // Suntikan Aksi Pengelolaan Analitik Eksekutif Pimpinan (API Terhubung & Fail-Safe)
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