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
  status: "Terverifikasi" | "Proses Verifikasi" | "Terjadwal Pickup" | "Ditolak";
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
  transporterId: string;
  transporterName: string;
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

interface SijagaState {
  // Core State
  currentUser: User | null;
  selectedCompanyId: string | null;
  companies: Company[];
  wasteLogs: WasteLog[];
  pickupRequests: PickupRequest[];
  invoices: Invoice[];
  inspections: Inspection[];
  notifications: SystemNotification[];
  auditLogs: AuditLog[];

  // Actions
  setSelectedCompanyId: (id: string | null) => void;
  login: (email: string, password: string, role?: UserRole) => Promise<User | null>;
  logout: () => Promise<void>;
  
  // API Fetchers
  fetchCompanies: () => Promise<void>;
  fetchWasteLogs: (companyId?: string) => Promise<void>;
  fetchPickupRequests: (companyId?: string) => Promise<void>;
  fetchInvoices: (companyId?: string) => Promise<void>;
  fetchInspections: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  readNotification: (id: string) => Promise<void>;

  addCompany: (company: Omit<Company, "id" | "status" | "score">) => Promise<void>;
  updateCompanyStatus: (id: string, status: Company["status"]) => Promise<void>;
  addWasteLog: (log: Omit<WasteLog, "id" | "companyName" | "status">) => Promise<void>;
  verifyWasteLog: (id: string, status: WasteLog["status"]) => Promise<void>;
  createPickupRequest: (request: Omit<PickupRequest, "id" | "status" | "transporterName">) => Promise<void>;
  setPickupPrice: (id: string, cost: number, driverName: string, plateNo: string) => Promise<void>;
  payInvoice: (id: string) => Promise<void>;
  updatePickupStatus: (id: string, status: PickupRequest["status"], evidencePhoto?: string) => Promise<void>;
  scheduleInspection: (inspection: Omit<Inspection, "id" | "status" | "score" | "bapSigned">) => Promise<Inspection | undefined>;
  submitInspectionResult: (id: string, score: number, notes: string, checklist: Inspection["checklist"]) => Promise<void>;
  addNotification: (title: string, message: string, type: SystemNotification["type"]) => void;
  readAllNotifications: () => void;
  addAuditLog: (user: string, role: string, action: string) => void;
}

// Initial Mock Data (used as offline fallbacks)
const initialCompanies: Company[] = [
  {
    id: "COM-001",
    companyName: "PT. Tekstil Sejahtera",
    nib: "9120301294821",
    npwp: "01.234.567.8-401.000",
    picName: "Budi Santoso",
    picPhone: "08123456789",
    picRole: "Direktur",
    investmentType: "PMDN",
    yearBuilt: "2018",
    buildingArea: 2500,
    operationalHours: "24 Jam",
    rawMaterials: "Kapas, Zat Pewarna Kimia",
    waterSource: "PDAM & Sumur Bor",
    powerSource: "PLN 150 kVA",
    kbli: "13111",
    investment: 8500000000,
    landArea: 6000,
    employees: 120,
    lat: "-6.9147",
    lng: "107.6098",
    address: "Jl. Rancaekek KM 15, Kec. Cicadas, Bandung",
    docType: "UKL-UPL",
    status: "APPROVED",
    score: 85
  },
  {
    id: "COM-002",
    companyName: "Bengkel Jaya Motor",
    nib: "9120301294112",
    npwp: "02.345.678.9-402.000",
    picName: "Agus Pratama",
    picPhone: "08129876543",
    picRole: "Pemilik",
    investmentType: "PMDN",
    yearBuilt: "2020",
    buildingArea: 150,
    operationalHours: "08:00 - 17:00",
    rawMaterials: "Sparepart, Oli, Grease",
    waterSource: "Sumur Gali",
    powerSource: "PLN 2200 VA",
    kbli: "45201",
    investment: 350000000,
    landArea: 200,
    employees: 8,
    lat: "-6.9034",
    lng: "107.6189",
    address: "Jl. Ir. H. Djuanda No. 120, Kec. Coblong, Bandung",
    docType: "SPPL",
    status: "REVIEW"
  },
  {
    id: "COM-003",
    companyName: "Restoran Sunda Nikmat",
    nib: "9120301294553",
    npwp: "03.456.789.0-403.000",
    picName: "Siti Aminah",
    picPhone: "08771234567",
    picRole: "Manajer Operasional",
    investmentType: "PMDN",
    yearBuilt: "2015",
    buildingArea: 400,
    operationalHours: "10:00 - 22:00",
    rawMaterials: "Bahan Makanan, Minyak Goreng",
    waterSource: "PDAM",
    powerSource: "PLN 5500 VA",
    kbli: "56101",
    investment: 1200000000,
    landArea: 600,
    employees: 25,
    lat: "-6.8245",
    lng: "107.6190",
    address: "Jl. Raya Lembang No. 45, Kec. Lembang, Bandung",
    docType: "SPPL",
    status: "APPROVED",
    score: 90
  },
  {
    id: "COM-004",
    companyName: "Pabrik Kimia Farma",
    nib: "9120301294001",
    npwp: "01.111.222.3-401.000",
    picName: "Indra Wijaya",
    picPhone: "081122334455",
    picRole: "Kepala Pabrik",
    investmentType: "PMDN",
    yearBuilt: "2012",
    buildingArea: 4000,
    operationalHours: "24 Jam",
    rawMaterials: "Bahan Aktif Obat, Alkohol",
    waterSource: "PDAM",
    powerSource: "PLN 300 kVA",
    kbli: "21012",
    investment: 15000000000,
    landArea: 8000,
    employees: 200,
    lat: "-6.9388",
    lng: "107.6255",
    address: "Jl. Soekarno-Hatta No. 500, Bandung",
    docType: "UKL-UPL",
    status: "APPROVED",
    score: 65
  }
];

const initialWasteLogs: WasteLog[] = [
  { id: "W-001", companyId: "COM-002", companyName: "Bengkel Jaya Motor", type: "Oli Bekas", volume: 45, unit: "L", date: "2026-05-15", method: "Dinas", status: "Terverifikasi" },
  { id: "W-002", companyId: "COM-001", companyName: "PT. Tekstil Sejahtera", type: "Limbah Cair Kimia", volume: 120, unit: "m³", date: "2026-05-18", method: "Mandiri", status: "Proses Verifikasi" },
  { id: "W-003", companyId: "COM-003", companyName: "Restoran Sunda Nikmat", type: "Minyak Jelantah", volume: 15, unit: "L", date: "2026-05-19", method: "Dinas", status: "Terjadwal Pickup" },
  { id: "W-004", companyId: "COM-004", companyName: "Pabrik Kimia Farma", type: "Limbah Padat B3", volume: 85, unit: "kg", date: "2026-05-17", method: "Mandiri", status: "Terverifikasi" }
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
  },
  {
    id: "PICK-002",
    companyId: "COM-003",
    companyName: "Restoran Sunda Nikmat",
    wasteType: "Minyak Jelantah",
    volume: "15 L",
    date: "2026-05-21",
    status: "PRICED",
    transporterId: "TRANS-001",
    transporterName: "PT. Transport Limbah Indonesia",
    cost: 150000,
    plateNo: "D 5678 DLH",
    driverName: "Agus Salim",
    invoiceId: "INV-003",
    address: "Jl. Raya Lembang No. 45, Kec. Lembang, Bandung"
  }
];

const initialInvoices: Invoice[] = [
  { id: "INV-001", companyId: "COM-002", companyName: "Bengkel Jaya Motor", type: "Pengangkutan", amount: 450000, date: "2026-05-20", status: "SETTLED" },
  { id: "INV-002", companyId: "COM-001", companyName: "PT. Tekstil Sejahtera", type: "Retribusi UKL-UPL", amount: 1250000, date: "2026-05-10", status: "SETTLED" },
  { id: "INV-003", companyId: "COM-003", companyName: "Restoran Sunda Nikmat", type: "Pengangkutan", amount: 150000, date: "2026-05-20", status: "UNPAID" },
  { id: "INV-004", companyId: "COM-004", companyName: "Pabrik Kimia Farma", type: "Denda Keterlambatan", amount: 250000, date: "2026-05-05", status: "UNPAID" }
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
  },
  {
    id: "INSP-002",
    companyId: "COM-002",
    companyName: "Bengkel Jaya Motor",
    inspectorId: "OFF-001",
    inspectorName: "Heryanto, S.T.",
    date: "2026-05-25",
    score: null,
    status: "Terjadwal",
    location: "Kec. Coblong, Bandung",
    checklist: { tpsB3: false, ipal: false, apar: false, noise: false, safetyEquipment: false }
  },
  {
    id: "INSP-003",
    companyId: "COM-004",
    companyName: "Pabrik Kimia Farma",
    inspectorId: "OFF-001",
    inspectorName: "Heryanto, S.T.",
    date: "2026-05-18",
    score: 65,
    status: "Selesai",
    location: "Bandung",
    notes: "TPS B3 kurang rapi, air IPAL mendekati ambang batas pH 9.",
    bapSigned: true,
    checklist: { tpsB3: true, ipal: true, apar: false, noise: false, safetyEquipment: false }
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
  },
  {
    id: "NTF-002",
    title: "Jadwal Inspeksi Baru",
    message: "Inspeksi terjadwal untuk Bengkel Jaya Motor pada 25 Mei 2026.",
    type: "INFO",
    timestamp: "2026-05-20T08:15:00Z",
    read: false
  },
  {
    id: "NTF-003",
    title: "Pembayaran Diterima",
    message: "Invoice INV-001 senilai Rp 450.000 telah dibayar oleh Bengkel Jaya Motor (Langsung disetor ke Kas Daerah).",
    type: "SUCCESS",
    timestamp: "2026-05-20T10:10:00Z",
    read: false
  }
];

const initialAuditLogs: AuditLog[] = [
  { id: "LOG-001", timestamp: "2026-05-20T08:00:00Z", user: "super@sijaga.id", role: "SUPER_ADMIN", action: "Konfigurasi payment gateway dimodifikasi ke Sandbox Mode." },
  { id: "LOG-002", timestamp: "2026-05-20T09:12:00Z", user: "admin@dlh.go.id", role: "ADMIN_DLH", action: "Menyetujui dokumen UKL-UPL PT. Tekstil Sejahtera." }
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
  companies: initialAuth.companies,
  wasteLogs: initialWasteLogs,
  pickupRequests: initialPickupRequests,
  invoices: initialInvoices,
  inspections: initialInspections,
  notifications: initialNotifications,
  auditLogs: initialAuditLogs,

  setSelectedCompanyId: (id) => {
    set({ selectedCompanyId: id });
  },

  login: async (email, password, role) => {
    try {
      /**
       * 1. Eksekusi API Login
       * Mengirim email dan password ke backend.
       * Backend akan memvalidasi kredensial dan mengembalikan data User + Role + Token.
       */
      const data = await apiService.auth.login(email, password, role);

      if (data && data.success) {
        // 2. Persistensi Token & Profil
        const token = data.token;
        localStorage.setItem("sijaga_token", token);

        // 3. Mapping Data User dari Backend
        // Data user sekarang mengandung 'role' asli dari database.
        const apiUser = data.user;
        const apiCompanies = apiUser.companies || [];

        localStorage.setItem("sijaga_user", JSON.stringify(apiUser));

        // 4. Update State Global
        set({
          currentUser: apiUser,
          companies: apiCompanies,
          // Set default company ID jika user adalah role PERUSAHAAN
          selectedCompanyId: apiUser.companyId || (apiCompanies.length > 0 ? apiCompanies[0].id : null),
        });

        // 5. Audit Log Real-time
        // Kita menggunakan apiUser.role yang didapat dari database, bukan inputan manual.
        get().addAuditLog(apiUser.email, apiUser.role, "Melakukan login ke sistem (Autentikasi Terintegrasi).");

        return apiUser;
      }

      return null;
    } catch (error: any) {
      /**
       * Error Handling:
       * Jika gagal (401, 500, dll), kita lempar error agar LoginPage dapat memproses toast pesan.
       */
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

  addCompany: async (companyData) => {
    try {
      const response = await apiService.companies.create(companyData);
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
        get().addAuditLog(companyData.picPhone, "PERUSAHAAN", `Registrasi perusahaan baru (API): ${companyData.companyName}`);
        get().addNotification(
          "Registrasi Perusahaan Baru",
          `${companyData.companyName} telah mendaftarkan dokumen ${companyData.docType}. Perlu verifikasi.`,
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

    // --- FALLBACK OFFLINE ---
    const newId = `COM-${String(get().companies.length + 1).padStart(3, "0")}`;
    const newCompany: Company = {
      ...companyData,
      id: newId,
      status: "PENDING"
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
    get().addAuditLog(companyData.picPhone, "PERUSAHAAN", `Registrasi perusahaan baru (Offline): ${companyData.companyName}`);
    get().addNotification(
      "Registrasi Perusahaan Baru",
      `${companyData.companyName} telah mendaftarkan dokumen ${companyData.docType}. Perlu verifikasi.`,
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
      const user = get().currentUser;
      get().addAuditLog(user?.email || "SYSTEM", user?.role || "ADMIN_DLH", `Mengubah status perusahaan ${comp.companyName} menjadi ${status}`);
      get().addNotification(
        "Pemberitahuan Status Registrasi",
        `Dokumen lingkungan ${comp.companyName} berstatus: ${status}`,
        status === "APPROVED" ? "SUCCESS" : status === "REJECTED" ? "DANGER" : "WARNING"
      );
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
    const comp = get().companies.find((c) => c.id === logData.companyId);
    let status: WasteLog["status"] = logData.method === "Dinas" ? "Terjadwal Pickup" : "Proses Verifikasi";

    const newLog: WasteLog = {
      ...logData,
      id: newId,
      companyName: comp?.companyName || "Unknown Company",
      status
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
          wasteLogs: state.wasteLogs.map((w) => (w.id === id ? { ...w, status } : w))
        }));
        toast.success(`Log limbah berhasil diverifikasi: ${status}`);
        return;
      }
    } catch (e) {
      console.warn("Verifikasi limbah gagal via API, fallback offline.", e);
    }

    // --- FALLBACK OFFLINE ---
    set((state) => ({
      wasteLogs: state.wasteLogs.map((w) => (w.id === id ? { ...w, status } : w))
    }));

    const log = get().wasteLogs.find((w) => w.id === id);
    if (log) {
      const user = get().currentUser;
      get().addAuditLog(user?.email || "SYSTEM", user?.role || "ADMIN_DLH", `Verifikasi laporan limbah ${log.id} (${log.companyName}) -> ${status}`);
    }
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

    const newRequest: PickupRequest = {
      ...requestData,
      id: newId,
      status: "PENDING",
      transporterName: "PT. Transport Limbah Indonesia",
      invoiceId: newInvId
    };

    set((state) => ({
      pickupRequests: [...state.pickupRequests, newRequest]
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

  updatePickupStatus: async (id, status, evidencePhoto) => {
    try {
      const response = await apiService.pickups.updateStatus(id, status, evidencePhoto);
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
        r.id === id ? { ...r, status, ...(evidencePhoto ? { evidencePhoto } : {}) } : r
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

  addNotification: (title, message, type) => {
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

  readAllNotifications: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true }))
    }));
  },

  addAuditLog: (user, role, action) => {
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
  }
}));
