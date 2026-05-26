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
  certificateActiveUntil?: string;
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

// Slice Interfaces
export interface AuthSlice {
  currentUser: User | null;
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  login: (email: string, password: string, role?: UserRole) => Promise<User | null>;
  logout: () => Promise<void>;
}

export interface CompanySlice {
  companies: Company[];
  fetchCompanies: () => Promise<void>;
  addCompany: (formData: FormData) => Promise<void>;
  updateCompanyStatus: (id: string, status: Company["status"]) => Promise<void>;
  createRetribusiInvoice: (id: string) => Promise<void>;
  downloadCompanyCertificate: (id: string, companyName: string) => Promise<void>;
}

export interface WasteSlice {
  wasteLogs: WasteLog[];
  fetchWasteLogs: (companyId?: string) => Promise<void>;
  addWasteLog: (log: Omit<WasteLog, "id" | "companyName" | "status">) => Promise<void>;
  verifyWasteLog: (id: string, status: WasteLog["status"]) => Promise<void>;
}

export interface PickupSlice {
  pickupRequests: PickupRequest[];
  transporters: User[];
  fetchPickupRequests: (companyId?: string) => Promise<void>;
  createPickupRequest: (request: Omit<PickupRequest, "id" | "status">) => Promise<void>;
  setPickupPrice: (id: string, cost: number, driverName: string, plateNo: string) => Promise<void>;
  updatePickupStatus: (id: string, status: PickupRequest["status"], payload?: any) => Promise<void>;
  fetchTransporters: () => Promise<void>;
  assignPickupTransporter: (id: string, transporterId: string, transporterName: string) => Promise<void>;
}

export interface InvoiceSlice {
  invoices: Invoice[];
  fetchInvoices: (companyId?: string) => Promise<void>;
  payInvoice: (id: string) => Promise<void>;
}

export interface InspectionSlice {
  inspections: Inspection[];
  fetchInspections: () => Promise<void>;
  scheduleInspection: (inspection: Omit<Inspection, "id" | "status" | "score" | "bapSigned">) => Promise<Inspection | undefined>;
  submitInspectionResult: (id: string, score: number, notes: string, checklist: Inspection["checklist"]) => Promise<void>;
}

export interface NotificationSlice {
  notifications: SystemNotification[];
  fetchNotifications: () => Promise<void>;
  readNotification: (id: string) => Promise<void>;
  addNotification: (title: string, message: string, type: SystemNotification["type"]) => Promise<void>;
  readAllNotifications: () => Promise<void>;
}

export interface AuditSlice {
  auditLogs: AuditLog[];
  addAuditLog: (user: string, role: string, action: string) => Promise<void>;
}


// Tipe Data untuk Pelaporan Masyarakat
export interface CitizenReport {
  id: string;
  trackingId: string;
  reporterName?: string | null;
  reporterContact?: string | null;
  incidentType: string;
  description: string;
  lat: string;
  lng: string;
  evidencePhoto: string;
  status: 'PENDING' | 'VERIFIED' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED';
  adminNotes?: string | null;
  inspectionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Kontrak untuk Report Slice
export interface ReportSlice {
  // State
  publicReportTrackData: CitizenReport | null;
  adminReports: CitizenReport[];
  isReportLoading: boolean;

  // Actions (Public)
  submitCitizenReport: (payload: any) => Promise<{ success: boolean; trackingId?: string }>;
  trackCitizenReport: (trackingId: string) => Promise<CitizenReport | null>;
  clearPublicReportData: () => void;

  // Actions (Admin)
  fetchAdminReports: (status?: string) => Promise<void>;
  verifyCitizenReport: (id: string, payload: any) => Promise<boolean>;
  rejectCitizenReport: (id: string, adminNotes: string) => Promise<boolean>;
}

// Combined State
export interface SijagaState extends AuthSlice, CompanySlice, WasteSlice, PickupSlice, InvoiceSlice, InspectionSlice, NotificationSlice, AuditSlice, ReportSlice { }
// Combined State

