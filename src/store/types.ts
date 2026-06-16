// src/store/types.ts
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
  status: "PENDING" | "REVIEW" | "APPROVED" | "REJECTED" | "SUSPENDED";
  score?: number;
  wasteInfo?: string;
  hasTps?: boolean;
  certificateActiveUntil?: string;
  docNibUrl?: string;
  docNpwpUrl?: string;
  docSiteplanUrl?: string;
  docTemplateUrl?: string;
  companyPhotoUrl?: string | null;

  // AMDAL specific fields
  activityName?: string;
  envApprovalNo?: string;
  envApprovalDate?: string;
  amdalNo?: string;
  amdalYear?: string;
  businessSector?: string;
  docAndalUrl?: string;
  docRklUrl?: string;
  docRplUrl?: string;
  docSkKelayakanUrl?: string;
  docPersetujuanUrl?: string;
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
  status: "UNPAID" | "SETTLED" | "REFUNDED";
}

export interface Inspection {
  id: string;
  companyId: string;
  companyName: string;
  company?: { id: string; companyName: string };
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
    // UKL-UPL / AMDAL Matrix kualitatif
    sumberDampakStatus?: "SESUAI" | "TIDAK_SESUAI";
    sumberDampakNotes?: string;
    jenisDampakStatus?: "SESUAI" | "TIDAK_SESUAI";
    jenisDampakNotes?: string;
    besaranDampakStatus?: "SESUAI" | "TIDAK_SESUAI";
    besaranDampakNotes?: string;
    pengelolaanBentukStatus?: "SESUAI" | "TIDAK_SESUAI";
    pengelolaanBentukNotes?: string;
    pengelolaanLokasiStatus?: "SESUAI" | "TIDAK_SESUAI";
    pengelolaanLokasiNotes?: string;
    pengelolaanPeriodeStatus?: "SESUAI" | "TIDAK_SESUAI";
    pengelolaanPeriodeNotes?: string;
    pemantauanBentukStatus?: "SESUAI" | "TIDAK_SESUAI";
    pemantauanBentukNotes?: string;
    pemantauanLokasiStatus?: "SESUAI" | "TIDAK_SESUAI";
    pemantauanLokasiNotes?: string;
    pemantauanPeriodeStatus?: "SESUAI" | "TIDAK_SESUAI";
    pemantauanPeriodeNotes?: string;
    institusiStatus?: "SESUAI" | "TIDAK_SESUAI";
    institusiNotes?: string;
    keteranganStatus?: "SESUAI" | "TIDAK_SESUAI";
    keteranganNotes?: string;

    // SPPL
    spplBersih?: boolean;
    spplBebasLimbah?: boolean;
    spplDrainase?: boolean;
    spplBebasBakar?: boolean;
    spplTempatSampah?: boolean;
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

// [NEW INTERFACE] Struktur data kualitas udara & cuaca dari API IQAir
export interface AqiData {
  city: string;
  state: string;
  country: string;
  aqi: number;
  mainPollutant: string;
  weather: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
  };
  source: 'live' | 'cache' | 'simulation';
  cachedAt?: string;
}

// [NEW INTERFACE] Struktur penampung batch data kualitas udara klaster geospasial
export interface BogorClusterTelemetry {
  id: string;
  name: string;
  lat: number;
  lng: number;
  telemetry: AqiData;
}

// [NEW INTERFACE] Kontrak Data ketat untuk Output AI Agent Forensik
export interface AiForensicResult {
  culpritName: string;
  culpritId: string;
  confidenceScore: number;
  analysis: string;
  recommendedAction: "INSPECTION" | "WARNING_LETTER" | "MONITORING" | "MANUAL_INVESTIGATION";
  evidencePoints: string[];
  suspectsDistribution: Array<{
    companyName: string;
    probabilityScore: number;
    complianceScore: number;
  }>;
}

// Slice Interfaces
export interface AuthSlice {
  currentUser: User | null;
  companies: Company[];
  selectedCompanyId: string | null;
  users: User[];
  officers: User[];

  setSelectedCompanyId: (id: string | null) => void;
  login: (email: string, password: string, role?: string) => Promise<User | null>;
  logout: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchOfficers: () => Promise<void>;
  updateUserRole: (id: string, role: UserRole) => Promise<void>;
}

export interface CompanySlice {
  companies: Company[];
  fetchCompanies: () => Promise<void>;
  addCompany: (formData: FormData) => Promise<void>;
  updateCompany: (id: string, formData: FormData) => Promise<void>;
  updateCompanyStatus: (id: string, status: Company["status"]) => Promise<void>;
  createRetribusiInvoice: (id: string) => Promise<void>;
  downloadCompanyCertificate: (id: string, companyName: string) => Promise<void>;
  addManualAmdalCompany: (formData: FormData) => Promise<void>;
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

  submitInspectionResult: (
    id: string,
    score: number | null,
    notes: string,
    checklist: Inspection["checklist"] | null,
    photo?: string,
    correctedCompanyId?: string
  ) => Promise<void>;
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
  fetchAuditLogs: () => Promise<void>;
}

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

export interface ReportSlice {
  publicReportTrackData: CitizenReport | null;
  adminReports: CitizenReport[];
  isReportLoading: boolean;

  submitCitizenReport: (payload: any) => Promise<{ success: boolean; trackingId?: string }>;
  trackCitizenReport: (trackingId: string) => Promise<CitizenReport | null>;
  clearPublicReportData: () => void;
  fetchAdminReports: (status?: string) => Promise<void>;
}

export interface AqiSlice {
  currentAqiData: AqiData | null;
  batchAqiData: BogorClusterTelemetry[]; // PENYELARASAN BATCH KLASTER SPASIAL
  isAqiLoading: boolean;
  fetchAqiData: (lat: string | number, lng: string | number) => Promise<AqiData | null>;
  fetchBatchAqiData: () => Promise<BogorClusterTelemetry[]>; // AKSES BATCH TERPADU
  clearAqiData: () => void;
}

// [NEW INTERFACE] Laci Tipe Data khusus untuk AI Agent
export interface AgentSlice {
  aiForensicResult: AiForensicResult | null;
  isAiLoading: boolean;
  runAiForensicScan: (payload: { lat: number; lng: number; zoom: number; windDirection: number; incidentType: string; description: string }) => Promise<AiForensicResult | null>;
}

// Combined State (Menambahkan AgentSlice ke dalam kesatuan State Utama)
export interface SijagaState extends AuthSlice, CompanySlice, WasteSlice, PickupSlice, InvoiceSlice, InspectionSlice, NotificationSlice, AuditSlice, ReportSlice, AqiSlice, AgentSlice { }