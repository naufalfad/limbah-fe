import { Company, WasteLog, PickupRequest, Invoice, Inspection, SystemNotification, AuditLog } from "./types";

export const initialCompanies: Company[] = [
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
    score: 50
  }
];

export const initialWasteLogs: WasteLog[] = [
  { id: "W-001", companyId: "COM-002", companyName: "Bengkel Jaya Motor", type: "Oli Bekas", volume: 45, unit: "L", date: "2026-05-15", method: "Dinas", status: "Terverifikasi" },
  { id: "LOG-006", companyId: "COM-002", companyName: "PT. Tekstil Sejahtera", type: "Limbah Cair", volume: 150, unit: "m³", date: "2026-05-18", method: "Dinas", status: "Proses_Verifikasi" },
  { id: "LOG-007", companyId: "COM-001", companyName: "PT. Eco Industri", type: "Limbah Domestik", volume: 300, unit: "kg", date: "2026-05-19", method: "Mandiri", status: "Terjadwal_Pickup" },
  { id: "W-004", companyId: "COM-004", companyName: "Pabrik Kimia Farma", type: "Limbah Padat B3", volume: 85, unit: "kg", date: "2026-05-17", method: "Mandiri", status: "Terverifikasi" }
];

export const initialPickupRequests: PickupRequest[] = [
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

export const initialInvoices: Invoice[] = [
  { id: "INV-001", companyId: "COM-002", companyName: "Bengkel Jaya Motor", type: "Pengangkutan", amount: 450000, date: "2026-05-20", status: "SETTLED" },
  { id: "INV-002", companyId: "COM-001", companyName: "PT. Tekstil Sejahtera", type: "Retribusi UKL-UPL", amount: 1500000, date: "2026-05-10", status: "SETTLED" },
  { id: "INV-003", companyId: "COM-003", companyName: "Restoran Sunda Nikmat", type: "Pengangkutan", amount: 150000, date: "2026-05-20", status: "UNPAID" },
  { id: "INV-004", companyId: "COM-004", companyName: "Pabrik Kimia Farma", type: "Denda Keterlambatan", amount: 250000, date: "2026-05-05", status: "UNPAID" },
  { id: "INV-005", companyId: "COM-003", companyName: "Restoran Sunda Nikmat", type: "Retribusi SPPL", amount: 500000, date: "2026-05-15", status: "SETTLED" },
  { id: "INV-006", companyId: "COM-004", companyName: "Pabrik Kimia Farma", type: "Retribusi UKL-UPL", amount: 1500000, date: "2026-05-16", status: "SETTLED" }
];

export const initialInspections: Inspection[] = [
  {
    id: "INSP-001",
    companyId: "COM-001",
    companyName: "PT. Tekstil Sejahtera",
    inspectorId: "OFF-001",
    inspectorName: "Heryanto, S.T.",
    date: "2026-05-14",
    score: 100,
    status: "Selesai",
    location: "Kec. Cicadas, Bandung",
    notes: "TPS B3 sudah tertata rapi, saluran IPAL lancar.",
    bapSigned: true,
    checklist: {
      sumberDampakStatus: "SESUAI",
      sumberDampakNotes: "",
      jenisDampakStatus: "SESUAI",
      jenisDampakNotes: "",
      besaranDampakStatus: "SESUAI",
      besaranDampakNotes: "",
      pengelolaanBentukStatus: "SESUAI",
      pengelolaanBentukNotes: "",
      pengelolaanLokasiStatus: "SESUAI",
      pengelolaanLokasiNotes: "",
      pengelolaanPeriodeStatus: "SESUAI",
      pengelolaanPeriodeNotes: "",
      pemantauanBentukStatus: "SESUAI",
      pemantauanBentukNotes: "",
      pemantauanLokasiStatus: "SESUAI",
      pemantauanLokasiNotes: "",
      pemantauanPeriodeStatus: "SESUAI",
      pemantauanPeriodeNotes: "",
      institusiStatus: "SESUAI",
      institusiNotes: "",
      keteranganStatus: "SESUAI",
      keteranganNotes: ""
    }
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
    checklist: {
      spplBersih: false,
      spplBebasLimbah: false,
      spplDrainase: false,
      spplBebasBakar: false,
      spplTempatSampah: false
    }
  },
  {
    id: "INSP-003",
    companyId: "COM-004",
    companyName: "Pabrik Kimia Farma",
    inspectorId: "OFF-001",
    inspectorName: "Heryanto, S.T.",
    date: "2026-05-18",
    score: 50,
    status: "Selesai",
    location: "Bandung",
    notes: "TPS B3 kurang rapi, air IPAL mendekati ambang batas pH 9.",
    bapSigned: true,
    checklist: {
      sumberDampakStatus: "SESUAI",
      sumberDampakNotes: "",
      jenisDampakStatus: "SESUAI",
      jenisDampakNotes: "",
      besaranDampakStatus: "SESUAI",
      besaranDampakNotes: "",
      pengelolaanBentukStatus: "SESUAI",
      pengelolaanBentukNotes: "",
      pengelolaanLokasiStatus: "SESUAI",
      pengelolaanLokasiNotes: "",
      pengelolaanPeriodeStatus: "SESUAI",
      pengelolaanPeriodeNotes: "",
      pemantauanBentukStatus: "TIDAK_SESUAI",
      pemantauanBentukNotes: "Parameter pemantauan emisi cerobong tidak lengkap sesuai dokumen.",
      pemantauanLokasiStatus: "SESUAI",
      pemantauanLokasiNotes: "",
      pemantauanPeriodeStatus: "SESUAI",
      pemantauanPeriodeNotes: "",
      institusiStatus: "SESUAI",
      institusiNotes: "",
      keteranganStatus: "SESUAI",
      keteranganNotes: ""
    }
  }
];

export const initialNotifications: SystemNotification[] = [
  {
    id: "NTF-001",
    title: "Kebocoran pH Terdeteksi",
    message: "Volume limbah cair di PT. Tekstil Sejahtera melampaui debit normal 120m\u00b3.",
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

export const initialAuditLogs: AuditLog[] = [
  { id: "LOG-001", timestamp: "2026-05-20T08:00:00Z", user: "super@sijaga.id", role: "SUPER_ADMIN", action: "Konfigurasi payment gateway dimodifikasi ke Sandbox Mode." },
  { id: "LOG-002", timestamp: "2026-05-20T09:12:00Z", user: "admin@dlh.go.id", role: "ADMIN_DLH", action: "Menyetujui dokumen UKL-UPL PT. Tekstil Sejahtera." }
];
