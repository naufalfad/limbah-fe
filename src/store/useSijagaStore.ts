import { create } from "zustand";
import { apiService } from "../lib/api";
import { toast } from "sonner";

export type UserRole = "SUPER_ADMIN" | "ADMIN_DLH" | "PETUGAS_LAPANGAN" | "PERUSAHAAN" | "PENGANGKUT" | "AUDITOR";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companies?: Company[];
  companyId?: string; // Fallback backward-compatibility
  transporterId?: string;
  officerId?: string;
  createdAt?: string;
}

export interface Company {
  id: string;
  companyName: string;
  nib: string;
  npwp: string;
  picName: string;
  picPhone: string;
  picRole: string;
  investmentType: "PMDN" | "PMA";
  yearBuilt: string;
  buildingArea: number;
  operationalHours: string;
  rawMaterials: string;
  waterSource: string;
  powerSource: string;
  kbli: string;
  investment: number;
  landArea: number;
  employees: number;
  lat: string;
  lng: string;
  address: string;
  docType: "SPPL" | "UKL-UPL" | "UKL_UPL" | "AMDAL";
  status: "PENDING" | "REVIEW" | "APPROVED" | "REJECTED";
  score?: number;
  wasteInfo?: string;
  hasTps?: boolean;
}

export interface WasteLog {
  id: string;
  companyId: string;
  companyName: string;
  type: string; // Oli Bekas, Limbah Cair Kimia, Limbah Padat B3, dll
  volume: number;
  unit: "L" | "kg" | "m³";
  date: string;
  method: "Dinas" | "Mandiri";
  status: "Terverifikasi" | "Proses_Verifikasi" | "Terjadwal_Pickup" | "Ditolak";
  note?: string;
}

export interface PickupRequest {
  id: string;
  companyId: string;
  companyName: string;
  wasteType: string;
  volume: string;
  date: string;
  status: "PENDING" | "PRICED" | "PAID" | "ON_THE_ROAD" | "LOADED" | "COMPLETED";
  transporterId?: string;
  transporterName?: string;
  actualVolume?: string;
  transportReport?: string;
  cost?: number;
  plateNo?: string;
  driverName?: string;
  evidencePhoto?: string;
  invoiceId?: string;
  address?: string;
}

export interface Invoice {
  id: string;
  companyId: string;
  companyName: string;
  type: string; // Pengangkutan, Retribusi SPPL, Denda
  amount: number;
  date: string;
  status: "UNPAID" | "SETTLED" | "REFUNDED"; // Escrow status removed
}

export interface Inspection {
  id: string;
  companyId: string;
  companyName: string;
  inspectorId: string;
  inspectorName: string;
  date: string;
  score: number | null;
  status: "Selesai" | "Terjadwal" | "Dibatalkan";
  location: string;
  notes?: string;
  photo?: string;
  bapSigned?: boolean;
  checklist?: {
    tpsB3: boolean;
    ipal: boolean;
    apar: boolean;
    noise: boolean;
    safetyEquipment: boolean;
  };
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: "WARNING" | "INFO" | "SUCCESS" | "DANGER";
  timestamp: string;
  read: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
}

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

interface SijagaState {
  // Core State
  currentUser: User | null;
  selectedCompanyId: string | null;
  users: User[]; // Data pengguna terpusat untuk Super Admin
  companies: Company[];
  wasteLogs: WasteLog[];
  pickupRequests: PickupRequest[];
  invoices: Invoice[];
  inspections: Inspection[];
  notifications: SystemNotification[];
  auditLogs: AuditLog[];
  transporters: User[];
  executiveAnalytics: ExecutiveAnalyticsData | null;
  performanceAnalytics: PerformanceAnalyticsData | null;

  // Actions
  setSelectedCompanyId: (id: string | null) => void;
  login: (email: string, password: string, role?: UserRole) => Promise<User | null>;
  logout: () => Promise<void>;

  // API Fetchers
  fetchUsers: () => Promise<void>;
  updateUserRole: (id: string, role: UserRole) => Promise<void>;
  fetchCompanies: () => Promise<void>;
  fetchWasteLogs: (companyId?: string) => Promise<void>;
  fetchPickupRequests: (companyId?: string) => Promise<void>;
  fetchInvoices: (companyId?: string) => Promise<void>;
  fetchInspections: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  readNotification: (id: string) => Promise<void>;
  fetchAuditLogs: () => Promise<void>; // Fungsi fetch murni dari API

  addCompany: (formData: FormData) => Promise<void>;
  updateCompanyStatus: (id: string, status: Company["status"]) => Promise<void>;
  downloadCompanyCertificate: (id: string, companyName: string) => Promise<void>;
  addWasteLog: (log: Omit<WasteLog, "id" | "companyName" | "status">) => Promise<void>;
  verifyWasteLog: (id: string, status: WasteLog["status"]) => Promise<void>;
  createPickupRequest: (request: Omit<PickupRequest, "id" | "status">) => Promise<void>;
  setPickupPrice: (id: string, cost: number, driverName: string, plateNo: string) => Promise<void>;
  payInvoice: (id: string) => Promise<void>;
  updatePickupStatus: (id: string, status: PickupRequest["status"], payload?: any) => Promise<void>;
  fetchTransporters: () => Promise<void>;
  assignPickupTransporter: (id: string, transporterId: string, transporterName: string) => Promise<void>;
  scheduleInspection: (inspection: Omit<Inspection, "id" | "status" | "score" | "bapSigned">) => Promise<Inspection | undefined>;
  submitInspectionResult: (id: string, score: number, notes: string, checklist: Inspection["checklist"]) => Promise<void>;
  addNotification: (title: string, message: string, type: SystemNotification["type"]) => Promise<void>;
  readAllNotifications: () => Promise<void>;
  addAuditLog: (user: string, role: string, action: string) => Promise<void>;
  fetchExecutiveAnalytics: () => Promise<void>;
  fetchPerformanceAnalytics: () => Promise<void>;
}

// STRATEGI RECOVERY: Struktur default data aman jika API Backend gagal merespon (Fase 3 & 4) [3]
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

// Initial Mock Data (used as offline fallbacks for companies/pickups)
const initialCompanies: Company[] = [
  {
    id: "COM-001",
    companyName: "PT. Tekstil Sejahtera",
    nib: "9120301294821",
    npwp: "01.234.567.8-401.000",
    picName: "Budi",
    picPhone: "081234567890",
    picRole: "Direktur Utama",
    investmentType: "PMDN",
    yearBuilt: "2015",
    buildingArea: 2500,
    operationalHours: "08:00 - 17:00",
    rawMaterials: "Serat Kapas, Pewarna Tekstil",
    waterSource: "PDAM",
    powerSource: "PLN",
    kbli: "13121",
    investment: 6000000000,
    landArea: 6000,
    employees: 150,
    lat: "-6.9147",
    lng: "107.6098",
    address: "Jl. Rancaekek No. 12, Bandung",
    docType: "UKL_UPL",
    status: "APPROVED",
    score: 85
  },
  {
    id: "COM-002",
    companyName: "Bengkel Jaya Motor",
    nib: "9120301294112",
    npwp: "02.345.678.9-402.000",
    picName: "Budi",
    picPhone: "081234567890",
    picRole: "Pemilik",
    investmentType: "PMDN",
    yearBuilt: "2020",
    buildingArea: 200,
    operationalHours: "09:00 - 19:00",
    rawMaterials: "Sparepart Motor, Oli",
    waterSource: "Sumur Bor",
    powerSource: "PLN",
    kbli: "45404",
    investment: 300000000,
    landArea: 300,
    employees: 5,
    lat: "-6.9034",
    lng: "107.6189",
    address: "Jl. Suropati No. 45, Bandung",
    docType: "SPPL",
    status: "REVIEW",
    score: undefined
  },
  {
    id: "COM-003",
    companyName: "Restoran Sunda Nikmat",
    nib: "9120301294553",
    npwp: "03.456.789.0-403.000",
    picName: "Asep",
    picPhone: "087823456789",
    picRole: "Manajer Operasional",
    investmentType: "PMDN",
    yearBuilt: "2018",
    buildingArea: 800,
    operationalHours: "10:00 - 22:00",
    rawMaterials: "Bahan Pangan, Minyak Goreng",
    waterSource: "PDAM",
    powerSource: "PLN",
    kbli: "56101",
    investment: 1200000000,
    landArea: 1000,
    employees: 24,
    lat: "-6.8245",
    lng: "107.6190",
    address: "Jl. Lembang No. 102, Bandung Barat",
    docType: "SPPL",
    status: "APPROVED",
    score: 90
  }
];

const initialWasteLogs: WasteLog[] = [
  { id: "W-001", companyId: "COM-002", companyName: "Bengkel Jaya Motor", type: "Oli Bekas", volume: 45, unit: "L", date: "2026-05-15", method: "Dinas", status: "Terverifikasi" },
  { id: "LOG-006", companyId: "COM-002", companyName: "PT. Tekstil Sejahtera", type: "Limbah Cair", volume: 150, unit: "m³", date: "2026-05-18", method: "Dinas", status: "Proses_Verifikasi" },
  { id: "LOG-007", companyId: "COM-001", companyName: "PT. Eco Industri", type: "Limbah Domestik", volume: 300, unit: "kg", date: "2026-05-19", method: "Mandiri", status: "Terjadwal_Pickup" }
];

const initialPickupRequests: PickupRequest[] = [
  {
    id: "PICK-001",
    companyId: "COM-002",
    companyName: "Bengkel Jaya Motor",
    wasteType: "Oli Bekas",
    volume: "45 L",
    date: "2026-05-20",
    status: "PAID",
    transporterId: "TRANS-001",
    transporterName: "PT. Transport Limbah Indonesia",
    cost: 450000,
    plateNo: "D 1234 DLH",
    driverName: "Budi Santoso",
    invoiceId: "INV-001",
    address: "Jl. Ir. H. Djuanda No. 120, Kec. Coblong, Bandung"
  }
];

const initialInvoices: Invoice[] = [
  { id: "INV-001", companyId: "COM-002", companyName: "Bengkel Jaya Motor", type: "Pengangkutan", amount: 450000, date: "2026-05-20", status: "SETTLED" },
  { id: "INV-002", companyId: "COM-001", companyName: "PT. Tekstil Sejahtera", type: "Retribusi UKL-UPL", amount: 1250000, date: "2026-05-10", status: "SETTLED" }
];

const initialInspections: Inspection[] = [
  {
    id: "INSP-001",
    companyId: "COM-001",
    companyName: "PT. Tekstil Sejahtera",
    inspectorId: "OFF-001",
    inspectorName: "Heryanto, S.T.",
    date: "2026-05-14",
    score: 85,
    status: "Selesai",
    location: "Kec. Cicadas, Bandung",
    notes: "TPS B3 sudah tertata rapi, saluran IPAL lancar.",
    bapSigned: true,
    checklist: { tpsB3: true, ipal: true, apar: true, noise: false, safetyEquipment: true }
  }
];

const initialNotifications: SystemNotification[] = [
  {
    id: "NTF-001",
    title: "Kebocoran pH Terdeteksi",
    message: "Volume limbah cair di PT. Tekstil Sejahtera melampaui debit normal 120m³.",
    type: "DANGER",
    timestamp: "2026-05-20T09:30:00Z",
    read: false
  }
];

const getInitialAuthState = () => {
  try {
    const savedUser = localStorage.getItem("sijaga_user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      const companiesList = user.companies || [];
      return {
        currentUser: user,
        companies: companiesList.length > 0 ? companiesList : initialCompanies,
        selectedCompanyId: user.companyId || (companiesList.length > 0 ? companiesList[0].id : null),
      };
    }
  } catch (e) {
    console.error("Failed to parse saved sijaga_user from localStorage", e);
  }
  return {
    currentUser: null,
    companies: initialCompanies,
    selectedCompanyId: null,
  };
};

const initialAuth = getInitialAuthState();

export const useSijagaStore = create<SijagaState>((set, get) => ({
  currentUser: initialAuth.currentUser,
  selectedCompanyId: initialAuth.selectedCompanyId,
  users: [],
  companies: initialAuth.companies,
  wasteLogs: initialWasteLogs,
  pickupRequests: initialPickupRequests,
  invoices: initialInvoices,
  inspections: initialInspections,
  notifications: initialNotifications,
  auditLogs: [], // Cleaned up mock data, purely fetched from API now
  transporters: [],
  executiveAnalytics: null,
  performanceAnalytics: null,

  setSelectedCompanyId: (id) => {
    set({ selectedCompanyId: id });
  },

  login: async (email, password, role) => {
    try {
      const data = await apiService.auth.login(email, password, role);

      if (data && data.success) {
        const token = data.token;
        localStorage.setItem("sijaga_token", token);

        const apiUser = data.user;
        const apiCompanies = apiUser.companies || [];

        localStorage.setItem("sijaga_user", JSON.stringify(apiUser));

        set({
          currentUser: apiUser,
          companies: apiCompanies,
          selectedCompanyId: apiUser.companyId || (apiCompanies.length > 0 ? apiCompanies[0].id : null),
        });

        get().addAuditLog(apiUser.email, apiUser.role, "Melakukan login ke sistem (Autentikasi Terintegrasi).");

        return apiUser;
      }

      return null;
    } catch (error: any) {
      console.error("Login Failure:", error.response?.data?.message || error.message);
      throw error;
    }
  },

  logout: async () => {
    const user = get().currentUser;
    if (user) {
      try {
        await apiService.auth.logout();
      } catch (e) {
        console.warn("Logout API failed, continuing client logout.");
      }
      get().addAuditLog(user.email, user.role, "Melakukan logout dari sistem.");
    }

    localStorage.removeItem("sijaga_token");
    localStorage.removeItem("token");
    localStorage.removeItem("sijaga_user");
    set({ currentUser: null, selectedCompanyId: null });
  },

  // FUNGSI BARU: Mengambil seluruh pengguna terdaftar
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

  // FUNGSI BARU: Mengubah hak akses pengguna
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

  // FUNGSI BARU: Mengambil histori log secara nyata
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

  // FUNGSI BARU FAIL-SAFE: Mengambil seluruh data analitik eksekutif MoM dan delta kepatuhan [3]
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

  // FUNGSI BARU FAIL-SAFE: Mengambil analisis kinerja DLH dan monitoring bottleneck data [3]
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
  },

  fetchCompanies: async () => {
    try {
      const response = await apiService.companies.getAll();
      if (response && response.success) {
        const list = response.companies || [];
        set({ companies: list });
      }
    } catch (e) {
      console.warn("fetchCompanies failed", e);
    }
  },

  fetchWasteLogs: async (companyId) => {
    try {
      const response = await apiService.waste.getAll(companyId);
      if (response && response.success) {
        const rawLogs = response.logs || response.wasteLogs || [];
        const logs = rawLogs.map((item: any) => ({
          ...item,
          companyName: item.companyName || item.company?.companyName || "Unknown Company"
        }));
        set({ wasteLogs: logs });
      }
    } catch (e) {
      console.warn("fetchWasteLogs failed", e);
    }
  },

  fetchPickupRequests: async (companyId) => {
    try {
      const response = await apiService.pickups.getAll(companyId);
      if (response && response.success) {
        const rawPickups = response.pickups || response.pickupRequests || [];
        const pickups = rawPickups.map((item: any) => ({
          ...item,
          companyName: item.companyName || item.company?.companyName || "Unknown Company"
        }));
        set({ pickupRequests: pickups });
      }
    } catch (e) {
      console.warn("fetchPickupRequests failed", e);
    }
  },

  fetchInvoices: async (companyId) => {
    try {
      const response = await apiService.invoices.getAll(companyId);
      if (response && response.success) {
        const rawInvoices = response.invoices || [];
        const invoices = rawInvoices.map((item: any) => ({
          ...item,
          companyName: item.companyName || item.company?.companyName || "Unknown Company"
        }));
        set({ invoices });
      }
    } catch (e) {
      console.warn("fetchInvoices failed", e);
    }
  },

  fetchInspections: async () => {
    try {
      const response = await apiService.inspections.getAll();
      if (response && response.success) {
        set({ inspections: response.inspections || [] });
      }
    } catch (e) {
      console.warn("fetchInspections failed", e);
    }
  },

  fetchNotifications: async () => {
    try {
      const response = await apiService.notifications.getAll();
      if (response && response.success) {
        set({ notifications: response.notifications || [] });
      }
    } catch (e) {
      console.warn("fetchNotifications failed", e);
    }
  },

  readNotification: async (id) => {
    try {
      const response = await apiService.notifications.read(id);
      if (response && response.success) {
        set((state) => ({
          notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n)
        }));
      }
    } catch (e) {
      console.warn("readNotification failed, using offline fallback", e);
      set((state) => ({
        notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n)
      }));
    }
  },

  addCompany: async (formData: FormData) => {
    // Extract display values from FormData for notifications/audit logs
    const companyName = formData.get("companyName") as string || "Unknown Company";
    const picPhone = formData.get("picPhone") as string || "";
    const docType = formData.get("docType") as string || "SPPL";

    try {
      const response = await apiService.companies.create(formData);
      if (response && response.success) {
        const newComp: Company = response.company;
        set((state) => {
          const updatedCompanies = [...state.companies, newComp];
          const updatedUser = state.currentUser ? {
            ...state.currentUser,
            companies: [...(state.currentUser.companies || []), newComp]
          } : null;

          if (updatedUser) {
            localStorage.setItem("sijaga_user", JSON.stringify(updatedUser));
          }

          return {
            companies: updatedCompanies,
            currentUser: updatedUser,
            selectedCompanyId: state.selectedCompanyId || newComp.id
          };
        });
        toast.success("Perusahaan baru berhasil terdaftar di database!");
        get().addAuditLog(picPhone, "PERUSAHAAN", `Registrasi perusahaan baru (API): ${companyName}`);
        get().addNotification(
          "Registrasi Perusahaan Baru",
          `${companyName} telah mendaftarkan dokumen ${docType}. Perlu verifikasi.`,
          "INFO"
        );
        return;
      }
    } catch (error: any) {
      if (error.response) {
        throw error;
      }
      console.warn("Registrasi perusahaan gagal/offline. Menggunakan fallback offline.", error);
    }

    // --- FALLBACK OFFLINE (tanpa file upload) ---
    const newId = `COM-${String(get().companies.length + 1).padStart(3, "0")}`;
    const newCompany: Company = {
      id: newId,
      companyName,
      nib: formData.get("nib") as string || "",
      npwp: formData.get("npwp") as string || "",
      picName: formData.get("picName") as string || "",
      picPhone,
      picRole: formData.get("picRole") as string || "",
      investmentType: (formData.get("investmentType") as "PMDN" | "PMA") || "PMDN",
      yearBuilt: formData.get("yearBuilt") as string || "",
      buildingArea: parseFloat(formData.get("buildingArea") as string) || 0,
      operationalHours: formData.get("operationalHours") as string || "",
      rawMaterials: formData.get("rawMaterials") as string || "",
      waterSource: formData.get("waterSource") as string || "",
      powerSource: formData.get("powerSource") as string || "",
      kbli: formData.get("kbli") as string || "",
      investment: parseFloat(formData.get("investment") as string) || 0,
      landArea: parseFloat(formData.get("landArea") as string) || 0,
      employees: parseInt(formData.get("employees") as string) || 0,
      lat: formData.get("lat") as string || "-6.9147",
      lng: formData.get("lng") as string || "107.6098",
      address: formData.get("address") as string || "",
      docType: docType as "SPPL" | "UKL-UPL",
      status: "PENDING",
    };

    set((state) => {
      const updatedCompanies = [...state.companies, newCompany];
      const updatedUser = state.currentUser ? {
        ...state.currentUser,
        companies: [...(state.currentUser.companies || []), newCompany]
      } : null;

      if (updatedUser) {
        localStorage.setItem("sijaga_user", JSON.stringify(updatedUser));
      }

      return {
        companies: updatedCompanies,
        currentUser: updatedUser,
        selectedCompanyId: state.selectedCompanyId || newId
      };
    });

    toast.success("Registrasi berhasil disimpan (Simulasi Offline)!");
    get().addAuditLog(picPhone, "PERUSAHAAN", `Registrasi perusahaan baru (Offline): ${companyName}`);
    get().addNotification(
      "Registrasi Perusahaan Baru",
      `${companyName} telah mendaftarkan dokumen ${docType}. Perlu verifikasi.`,
      "INFO"
    );
  },

  updateCompanyStatus: async (id, status) => {
    try {
      const response = await apiService.companies.updateStatus(id, status);
      if (response && response.success) {
        set((state) => ({
          companies: state.companies.map((c) => (c.id === id ? { ...c, status } : c))
        }));
        toast.success(`Status perusahaan berhasil diperbarui ke ${status}`);
        return;
      }
    } catch (e) {
      console.warn("Gagal memperbarui status via API, fallback offline.", e);
    }

    // --- FALLBACK OFFLINE ---
    set((state) => ({
      companies: state.companies.map((c) => (c.id === id ? { ...c, status } : c))
    }));

    const comp = get().companies.find((c) => c.id === id);
    if (comp) {
      // Auto-generate invoice if APPROVED (Offline)
      if (status === "APPROVED" && comp.status !== "APPROVED") {
        const isUklUpl = comp.docType === "UKL-UPL" || comp.docType === "UKL_UPL";
        const invoiceType = isUklUpl ? "Retribusi UKL-UPL" : "Retribusi SPPL";
        const amount = isUklUpl ? 1500000 : 500000;

        const existingInvoice = get().invoices.find(i => i.companyId === id && i.type.includes("Retribusi"));
        if (!existingInvoice) {
          const newInvoice = {
            id: `INV-${String(get().invoices.length + 1).padStart(3, "0")}`,
            companyId: id,
            companyName: comp.companyName,
            type: invoiceType,
            amount: amount,
            date: new Date().toISOString().split("T")[0],
            status: "UNPAID" as const
          };
          set((state) => ({ invoices: [...state.invoices, newInvoice] }));
        }
      }

      const user = get().currentUser;
      get().addAuditLog(user?.email || "SYSTEM", user?.role || "ADMIN_DLH", `Mengubah status perusahaan ${comp.companyName} menjadi ${status}`);
      get().addNotification(
        "Pemberitahuan Status Registrasi",
        `Dokumen lingkungan ${comp.companyName} berstatus: ${status}`,
        status === "APPROVED" ? "SUCCESS" : status === "REJECTED" ? "DANGER" : "WARNING"
      );
    }
  },

  downloadCompanyCertificate: async (id, companyName) => {
    try {
      const blob = await apiService.companies.downloadCertificatePdf(id);

      // Buat URL Object sementara di memori browser
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      // Beri nama file yang aman (hapus karakter aneh)
      link.setAttribute('download', `Sertifikat_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      document.body.appendChild(link);

      // Paksa browser memicu download
      link.click();

      // Bersihkan memori
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to download certificate", e);
      toast.error("Gagal mengunduh sertifikat PDF dari server.");
      throw e;
    }
  },

  addWasteLog: async (logData) => {
    try {
      const response = await apiService.waste.create(logData);
      if (response && response.success) {
        const newLog: WasteLog = response.log;
        set((state) => ({
          wasteLogs: [...state.wasteLogs, {
            ...newLog,
            companyName: newLog.companyName || state.companies.find(c => c.id === newLog.companyId)?.companyName || "Unknown Company"
          }]
        }));
        toast.success("Limbah berhasil dilaporkan ke dinas!");
        return;
      }
    } catch (e: any) {
      if (e.response) {
        throw e;
      }
      console.warn("Pelaporan limbah API gagal, fallback offline.", e);
    }

    // --- FALLBACK OFFLINE ---
    const newId = `W-${String(get().wasteLogs.length + 1).padStart(3, "0")}`;
    const user = get().currentUser;
    const { companyId, ...log } = logData;
    const comp = get().companies.find((c) => c.id === logData.companyId);

    const newLog: WasteLog = {
      ...logData,
      id: newId,
      companyName: comp?.companyName || "PT. Demo Company",
      status: logData.method === "Dinas" ? "Terjadwal_Pickup" : "Proses_Verifikasi"
    };

    set((state) => ({
      wasteLogs: [...state.wasteLogs, newLog]
    }));

    toast.success("Limbah berhasil dilaporkan (Offline)!");
    get().addAuditLog(comp?.picPhone || "PERUSAHAAN", "PERUSAHAAN", `Melaporkan limbah ${logData.type} sebesar ${logData.volume} ${logData.unit}`);

    if (logData.volume > 100) {
      get().addNotification(
        "ALERT EWS: Volume Limbah Abnormal",
        `${comp?.companyName} melaporkan volume ${logData.type} sebesar ${logData.volume}${logData.unit} (Melebihi ambang batas 100).`,
        "DANGER"
      );
    }
  },

  verifyWasteLog: async (id, status) => {
    try {
      const response = await apiService.waste.verify(id, status);
      if (response && response.success) {
        set((state) => ({
          wasteLogs: state.wasteLogs.map(log => log.id === id ? { ...log, status } : log)
        }));
        toast.success(`Logbook berhasil di-${status.toLowerCase()}.`);
        return;
      }
    } catch (e) {
      console.warn("API verifyWasteLog failed, fallback to local state", e);
    }

    // Fallback offline
    set((state) => ({
      wasteLogs: state.wasteLogs.map(log => log.id === id ? { ...log, status } : log)
    }));
    toast.success(`[Offline] Logbook berhasil di-${status.toLowerCase()}.`);
  },

  createPickupRequest: async (requestData) => {
    try {
      const response = await apiService.pickups.create(requestData);
      if (response && response.success) {
        const newPickup: PickupRequest = response.pickup;
        set((state) => ({
          pickupRequests: [...state.pickupRequests, {
            ...newPickup,
            companyName: newPickup.companyName || state.companies.find(c => c.id === newPickup.companyId)?.companyName || "Unknown Company"
          }]
        }));
        toast.success("Permintaan pengangkutan limbah telah diajukan.");
        return;
      }
    } catch (e: any) {
      if (e.response) {
        throw e;
      }
      console.warn("Pengajuan pickup API gagal, fallback offline.", e);
    }

    // --- FALLBACK OFFLINE ---
    const newId = `PICK-${String(get().pickupRequests.length + 1).padStart(3, "0")}`;
    const newInvId = `INV-${String(get().invoices.length + 1).padStart(3, "0")}`;

    // Auto-calculate for offline fallback
    const parsedVol = parseFloat(requestData.volume.replace(/[^0-9.]/g, '')) || 0;
    const calcCost = parsedVol > 0 ? parsedVol * 10000 : 50000;

    const newRequest: PickupRequest = {
      ...requestData,
      id: newId,
      status: "PRICED",
      cost: calcCost,
      invoiceId: newInvId
    };

    const newInvoice: Invoice = {
      id: newInvId,
      companyId: requestData.companyId,
      companyName: requestData.companyName,
      type: "Pengangkutan",
      amount: calcCost,
      date: new Date().toISOString().split("T")[0],
      status: "UNPAID"
    };

    set((state) => ({
      pickupRequests: [...state.pickupRequests, newRequest],
      invoices: [...state.invoices, newInvoice]
    }));

    toast.success("Permintaan pengangkutan diajukan (Offline)!");
    get().addAuditLog("PERUSAHAAN", "PERUSAHAAN", `Membuat request penjemputan limbah ${requestData.wasteType}`);
    get().addNotification(
      "Permintaan Penjemputan Limbah",
      `${requestData.companyName} mengajukan pickup untuk limbah ${requestData.wasteType} (${requestData.volume}).`,
      "INFO"
    );
  },

  setPickupPrice: async (id, cost, driverName, plateNo) => {
    try {
      const response = await apiService.pickups.setPrice(id, cost, driverName, plateNo);
      if (response && response.success) {
        const updatedPickup: PickupRequest = response.pickup;
        const newInvoice: Invoice = response.invoice;

        set((state) => ({
          pickupRequests: state.pickupRequests.map((r) => r.id === id ? updatedPickup : r),
          invoices: [...state.invoices.filter((i) => i.id !== updatedPickup.invoiceId), newInvoice]
        }));
        toast.success("Tarif penjemputan dan armada berhasil dikirimkan!");
        return;
      }
    } catch (e) {
      console.warn("Penetapan harga API gagal, fallback offline.", e);
    }

    // --- FALLBACK OFFLINE ---
    const req = get().pickupRequests.find((r) => r.id === id);
    if (!req) return;

    const newInvoice: Invoice = {
      id: req.invoiceId || `INV-${String(Math.random())}`,
      companyId: req.companyId,
      companyName: req.companyName,
      type: "Pengangkutan",
      amount: cost,
      date: new Date().toISOString().split("T")[0],
      status: "UNPAID"
    };

    set((state) => ({
      pickupRequests: state.pickupRequests.map((r) =>
        r.id === id ? { ...r, cost, driverName, plateNo, status: "PRICED" } : r
      ),
      invoices: [...state.invoices.filter((i) => i.id !== req.invoiceId), newInvoice]
    }));

    toast.success("Tarif berhasil disubmit (Offline)!");
    get().addAuditLog("PT. Transport Limbah Indonesia", "PENGANGKUT", `Menetapkan biaya pengangkutan order ${id} sebesar Rp ${cost.toLocaleString()}`);
    get().addNotification(
      "Biaya Pengangkutan Ditetapkan",
      `Invoice pengangkutan ${id} senilai Rp ${cost.toLocaleString()} diterbitkan untuk ${req.companyName}.`,
      "INFO"
    );
  },

  payInvoice: async (id) => {
    try {
      const response = await apiService.invoices.pay(id);
      if (response && response.success) {
        const updatedInvoice: Invoice = response.invoice;
        set((state) => ({
          invoices: state.invoices.map((inv) => (inv.id === id ? {
            ...updatedInvoice,
            companyName: updatedInvoice.companyName || state.companies.find(c => c.id === updatedInvoice.companyId)?.companyName || "Unknown Company"
          } : inv)),
          pickupRequests: state.pickupRequests.map((r) =>
            r.invoiceId === id ? { ...r, status: "PAID" } : r
          )
        }));
        toast.success("Pembayaran tagihan sukses! Dana disetor ke Kas Daerah Pemda.");
        return;
      }
    } catch (e: any) {
      if (e.response) {
        throw e;
      }
      console.warn("Pembayaran tagihan API gagal, fallback offline.", e);
    }

    // --- FALLBACK OFFLINE ---
    set((state) => ({
      invoices: state.invoices.map((inv) => (inv.id === id ? { ...inv, status: "SETTLED" } : inv))
    }));

    const invoice = get().invoices.find((i) => i.id === id);
    if (invoice) {
      set((state) => ({
        pickupRequests: state.pickupRequests.map((r) =>
          r.invoiceId === id ? { ...r, status: "PAID" } : r
        )
      }));

      toast.success("Pembayaran Tagihan Berhasil (Simulasi Offline)!");
      get().addAuditLog(invoice.companyName, "PERUSAHAAN", `Melakukan pembayaran digital invoice ${id} senilai Rp ${invoice.amount.toLocaleString()} (Langsung Lunas).`);
      get().addNotification(
        "Pembayaran Diterima (Lunas)",
        `Dana invoice ${id} sebesar Rp ${invoice.amount.toLocaleString()} berhasil disetorkan ke Kas Daerah. Pengangkutan segera meluncur.`,
        "SUCCESS"
      );
    }
  },

  updatePickupStatus: async (id, status, payload) => {
    try {
      const response = await apiService.pickups.updateStatus(id, status, payload);
      if (response && response.success) {
        const updatedPickup: PickupRequest = response.pickup;
        set((state) => ({
          pickupRequests: state.pickupRequests.map((r) => r.id === id ? updatedPickup : r)
        }));
        if (status === "COMPLETED") {
          set((state) => ({
            invoices: state.invoices.map((inv) =>
              inv.id === updatedPickup.invoiceId ? { ...inv, status: "SETTLED" } : inv
            )
          }));
        }
        toast.success(`Status pengangkutan berhasil diubah ke: ${status}`);
        return;
      }
    } catch (e) {
      console.warn("Pembaruan armada API gagal, fallback offline.", e);
    }

    // --- FALLBACK OFFLINE ---
    set((state) => ({
      pickupRequests: state.pickupRequests.map((r) =>
        r.id === id ? { ...r, status, ...(payload || {}) } : r
      )
    }));

    const req = get().pickupRequests.find((r) => r.id === id);
    if (!req) return;

    get().addAuditLog("PT. Transport Limbah Indonesia", "PENGANGKUT", `Mengubah status pickup ${id} menjadi ${status}`);

    if (status === "COMPLETED") {
      set((state) => ({
        invoices: state.invoices.map((inv) =>
          inv.id === req.invoiceId ? { ...inv, status: "SETTLED" } : inv
        )
      }));

      toast.success("Manifest pengangkutan telah dinyatakan selesai!");
      get().addAuditLog("SYSTEM", "BILLING", `Order pengangkutan ${id} telah terselesaikan (Dana disetor langsung Pemda).`);
      get().addNotification(
        "Pengangkutan Selesai & Lunas",
        `Limbah ${req.wasteType} dari ${req.companyName} telah terangkut dan tercatat lunas di kas Pemda.`,
        "SUCCESS"
      );
    }
  },

  fetchTransporters: async () => {
    try {
      const response = await apiService.admin.getTransporters();
      if (response && response.success) {
        set({ transporters: response.transporters });
      }
    } catch (e) {
      console.warn("API fetchTransporters failed, using mock data", e);
      // Fallback mock
      set({ transporters: [{ id: "TRANS-1", name: "PT. Maju Transport", email: "t1@mail.com", role: "PENGANGKUT" }] as any });
    }
  },

  assignPickupTransporter: async (id, transporterId, transporterName) => {
    try {
      const response = await apiService.pickups.assignTransporter(id, transporterId, transporterName);
      if (response && response.success) {
        const updatedPickup = response.pickup;
        set((state) => ({
          pickupRequests: state.pickupRequests.map((r) => r.id === id ? updatedPickup : r)
        }));
        toast.success("Transporter berhasil ditugaskan!");
        return;
      }
    } catch (e) {
      console.warn("API assignTransporter failed, fallback to local state", e);
    }

    // Fallback offline
    set((state) => ({
      pickupRequests: state.pickupRequests.map((r) =>
        r.id === id ? { ...r, transporterId, transporterName } : r
      )
    }));
    toast.success("Transporter berhasil ditugaskan (Offline)!");
  },

  scheduleInspection: async (inspectionData) => {
    try {
      const response = await apiService.inspections.schedule(inspectionData);
      if (response && response.success) {
        const newInsp: Inspection = response.inspection;
        set((state) => ({
          inspections: [...state.inspections, newInsp]
        }));
        toast.success("Jadwal inspeksi berhasil disimpan di server.");
        return newInsp;
      }
    } catch (e) {
      console.warn("Penjadwalan inspeksi API gagal, fallback offline.", e);
    }

    // --- FALLBACK OFFLINE ---
    const newId = `INSP-${String(get().inspections.length + 1).padStart(3, "0")}`;
    const newInspection: Inspection = {
      ...inspectionData,
      id: newId,
      status: "Terjadwal",
      score: null,
      checklist: { tpsB3: false, ipal: false, apar: false, noise: false, safetyEquipment: false }
    };

    set((state) => ({
      inspections: [...state.inspections, newInspection]
    }));

    toast.success("Jadwal inspeksi berhasil disimpan (Offline)!");
    const user = get().currentUser;
    get().addAuditLog(user?.email || "SYSTEM", user?.role || "ADMIN_DLH", `Menjadwalkan inspeksi lapangan untuk ${inspectionData.companyName}`);
    get().addNotification(
      "Jadwal Inspeksi Lingkungan",
      `Petugas ${inspectionData.inspectorName} dijadwalkan menginspeksi ${inspectionData.companyName} pada ${inspectionData.date}.`,
      "INFO"
    );
    return newInspection;
  },

  submitInspectionResult: async (id, score, notes, checklist) => {
    try {
      const response = await apiService.inspections.submit(id, score, notes, checklist);
      if (response && response.success) {
        const updatedInsp: Inspection = response.inspection;
        set((state) => ({
          inspections: state.inspections.map((insp) => insp.id === id ? updatedInsp : insp),
          companies: state.companies.map((c) => c.id === updatedInsp.companyId ? { ...c, score } : c)
        }));
        toast.success("Hasil BAP Inspeksi lapangan berhasil diunggah!");
        return;
      }
    } catch (e) {
      console.warn("Unggah BAP API gagal, fallback offline.", e);
    }

    // --- FALLBACK OFFLINE ---
    set((state) => ({
      inspections: state.inspections.map((insp) =>
        insp.id === id ? { ...insp, score, notes, checklist, status: "Selesai", bapSigned: true } : insp
      )
    }));

    const insp = get().inspections.find((i) => i.id === id);
    if (!insp) return;

    set((state) => ({
      companies: state.companies.map((c) => (c.id === insp.companyId ? { ...c, score } : c))
    }));

    toast.success("BAP Inspeksi disubmit (Offline)!");
    const user = get().currentUser;
    get().addAuditLog(user?.email || "OFFICER", "PETUGAS_LAPANGAN", `Mengirimkan hasil inspeksi ${id} untuk ${insp.companyName} dengan skor ${score}`);

    if (score < 60) {
      get().addNotification(
        "WARNING: Kepatuhan Lingkungan Rendah",
        `Hasil inspeksi ${insp.companyName} menunjukkan skor kepatuhan kritis: ${score}/100. Rekomendasi teguran tertulis.`,
        "WARNING"
      );
    } else {
      get().addNotification(
        "Hasil Inspeksi Disubmit",
        `Evaluasi kepatuhan ${insp.companyName} selesai dengan hasil baik: ${score}/100.`,
        "SUCCESS"
      );
    }
  },

  addNotification: async (title, message, type) => {
    try {
      const response = await apiService.notifications.create({ title, message, type });
      if (response && response.success) {
        set((state) => ({
          notifications: [response.notification, ...state.notifications]
        }));
        return;
      }
    } catch (e) {
      console.warn("API addNotification failed, fallback to local state", e);
    }

    const newId = `NTF-${String(get().notifications.length + 1).padStart(3, "0")}`;
    const newNtf: SystemNotification = {
      id: newId,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    set((state) => ({
      notifications: [newNtf, ...state.notifications]
    }));
  },

  readAllNotifications: async () => {
    try {
      await apiService.notifications.readAll();
    } catch (e) {
      console.warn("API readAllNotifications failed", e);
    }
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true }))
    }));
  },

  addAuditLog: async (user, role, action) => {
    try {
      const response = await apiService.auditLogs.create({ user, role, action });
      if (response && response.success) {
        set((state) => ({
          auditLogs: [response.auditLog, ...state.auditLogs]
        }));
        return;
      }
    } catch (e) {
      console.warn("API addAuditLog failed, fallback to local state", e);
    }

    const newId = `LOG-${String(get().auditLogs.length + 1).padStart(3, "0")}`;
    const newLog: AuditLog = {
      id: newId,
      timestamp: new Date().toISOString(),
      user,
      role,
      action
    };
    set((state) => ({
      auditLogs: [newLog, ...state.auditLogs]
    }));
  },
}));