import { Company, WasteLog, PickupRequest, Invoice, Inspection, SystemNotification, AuditLog } from "./types";

export const initialCompanies: Company[] = [
  {
    id: "COM-001",
    companyName: "PT. Indocement Tunggal Prakarsa Tbk",
    nib: "9120301294821",
    npwp: "01.234.567.8-401.000",
    picName: "Budi Santoso",
    picPhone: "08123456789",
    picRole: "Direktur Utama",
    investmentType: "PMA",
    yearBuilt: "1975",
    buildingArea: 120000,
    operationalHours: "24 Jam",
    rawMaterials: "Batu Kapur, Tanah Liat, Pasir Silika, Batu Bara",
    waterSource: "Sungai Cileungsi & Recycled Water",
    powerSource: "Captive Power Plant 120 MW",
    kbli: "23941",
    investment: 850000000000,
    landArea: 250000,
    employees: 1200,
    lat: "-6.4862",
    lng: "106.8833",
    address: "Jl. Mayor Oking No. 1, Citeureup, Kabupaten Bogor",
    docType: "AMDAL",
    status: "APPROVED",
    score: 85
  },
  {
    id: "COM-002",
    companyName: "PT. Indo Kordsa Tbk",
    nib: "9120301290004",
    npwp: "01.234.567.8-401.004",
    picName: "Hendra Wijaya",
    picPhone: "08123456004",
    picRole: "Manager Utility",
    investmentType: "PMA",
    yearBuilt: "1997",
    buildingArea: 28000,
    operationalHours: "24 Jam",
    rawMaterials: "Nylon Yarn, Polyester Industrial Yarn",
    waterSource: "Sungai Cileungsi",
    powerSource: "PLN & Generator",
    kbli: "13940",
    investment: 78000000000,
    landArea: 45000,
    employees: 410,
    lat: "-6.5050",
    lng: "106.8790",
    address: "Jl. Raya Citeureup, Desa Leuwinutug, Citeureup, Kabupaten Bogor",
    docType: "UKL-UPL",
    status: "APPROVED",
    score: 92
  },
  {
    id: "COM-003",
    companyName: "PT. Argha Karya Prima Industry Tbk",
    nib: "9120301290014",
    npwp: "01.234.567.8-401.014",
    picName: "Sarah Azhari",
    picPhone: "08123456014",
    picRole: "Direktur HSE",
    investmentType: "PMDN",
    yearBuilt: "1980",
    buildingArea: 35000,
    operationalHours: "24 Jam",
    rawMaterials: "Polypropylene Resin, Polyethylene Resin",
    waterSource: "Sumur Bor",
    powerSource: "PLN 10 MVA",
    kbli: "22211",
    investment: 62000000000,
    landArea: 70000,
    employees: 520,
    lat: "-6.4950",
    lng: "106.8710",
    address: "Jl. Pahlawan, Karang Asem Barat, Citeureup, Kabupaten Bogor",
    docType: "UKL-UPL",
    status: "APPROVED",
    score: 35
  },
  {
    id: "COM-004",
    companyName: "PT. Solusi Bangun Indonesia Tbk Narogong",
    nib: "8820301294112",
    npwp: "02.345.678.9-402.000",
    picName: "Budi Santoso",
    picPhone: "08129876543",
    picRole: "HSE Superintendent",
    investmentType: "PMDN",
    yearBuilt: "1995",
    buildingArea: 65000,
    operationalHours: "24 Jam",
    rawMaterials: "Klinker, Gypsum, Batu Bara",
    waterSource: "Air Tanah & Air Permukaan",
    powerSource: "PLN 45 MVA",
    kbli: "23941",
    investment: 420000000000,
    landArea: 150000,
    employees: 680,
    lat: "-6.4520",
    lng: "106.9210",
    address: "Jl. Raya Narogong KM 7, Klapanunggal, Kabupaten Bogor",
    docType: "AMDAL",
    status: "APPROVED",
    score: 61
  },
  {
    id: "COM-005",
    companyName: "PT. Ricky Putra Globalindo Tbk",
    nib: "9120301290007",
    npwp: "01.234.567.8-401.007",
    picName: "Rian Hidayat",
    picPhone: "08123456007",
    picRole: "HSE Manager",
    investmentType: "PMDN",
    yearBuilt: "1990",
    buildingArea: 18000,
    operationalHours: "24 Jam",
    rawMaterials: "Benang Katun, Zat Kimia Pewarna Reaktif, Batubara Boiler",
    waterSource: "PDAM",
    powerSource: "PLN 1.5 MVA",
    kbli: "14111",
    investment: 52000000000,
    landArea: 32000,
    employees: 850,
    lat: "-6.4816",
    lng: "106.8560",
    address: "Jl. Raya Jakarta-Bogor KM 46, Cibinong, Kabupaten Bogor",
    docType: "UKL-UPL",
    status: "APPROVED",
<<<<<<< Updated upstream
    score: 65
=======
    score: 82
  },
  {
    id: "COM-006",
    companyName: "PT. Mercedes-Benz Indonesia Wanaherang",
    nib: "7720301294553",
    npwp: "03.456.789.0-403.000",
    picName: "Agus Pratama",
    picPhone: "08771234567",
    picRole: "Plant Manager",
    investmentType: "PMA",
    yearBuilt: "1982",
    buildingArea: 25000,
    operationalHours: "08:00 - 17:00",
    rawMaterials: "Komponen Otomotif CKD, Cat, Cairan Kimia",
    waterSource: "PDAM & Sungai Cikeas",
    powerSource: "PLN 2.5 MVA",
    kbli: "29101",
    investment: 145000000000,
    landArea: 50000,
    employees: 550,
    lat: "-6.4020",
    lng: "106.9180",
    address: "Jl. Mercedes-Benz, Cicadas, Gunung Putri, Kabupaten Bogor",
    docType: "AMDAL",
    status: "APPROVED",
    score: 68
>>>>>>> Stashed changes
  }
];

export const initialWasteLogs: WasteLog[] = [
  { id: "W-001", companyId: "COM-002", companyName: "PT. Indo Kordsa Tbk", type: "Oli Bekas", volume: 45, unit: "L", date: "2026-05-15", method: "Dinas", status: "Terverifikasi" },
  { id: "LOG-006", companyId: "COM-005", companyName: "PT. Ricky Putra Globalindo Tbk", type: "Limbah Cair", volume: 150, unit: "m³", date: "2026-05-18", method: "Dinas", status: "Proses_Verifikasi" },
  { id: "LOG-007", companyId: "COM-001", companyName: "PT. Indocement Tunggal Prakarsa Tbk", type: "Limbah Domestik", volume: 300, unit: "kg", date: "2026-05-19", method: "Mandiri", status: "Terjadwal_Pickup" },
  { id: "W-004", companyId: "COM-004", companyName: "PT. Solusi Bangun Indonesia Tbk Narogong", type: "Limbah Padat B3", volume: 85, unit: "kg", date: "2026-05-17", method: "Mandiri", status: "Terverifikasi" }
];

export const initialPickupRequests: PickupRequest[] = [
  {
    id: "PICK-001",
    companyId: "COM-002",
    companyName: "PT. Indo Kordsa Tbk",
    wasteType: "Oli Bekas",
    volume: "45 L",
    date: "2026-05-20",
    status: "PAID",
    transporterId: "TRANS-001",
    transporterName: "PT. Transport Limbah Indonesia",
    cost: 450000,
    plateNo: "B 1234 DLH",
    driverName: "Ahmad Junaedi",
    invoiceId: "INV-001",
    address: "Jl. Raya Citeureup, Citeureup, Kabupaten Bogor"
  },
  {
    id: "PICK-002",
    companyId: "COM-005",
    companyName: "PT. Ricky Putra Globalindo Tbk",
    wasteType: "Minyak Jelantah",
    volume: "15 L",
    date: "2026-05-21",
    status: "PRICED",
    transporterId: "TRANS-001",
    transporterName: "PT. Transport Limbah Indonesia",
    cost: 150000,
    plateNo: "B 5678 DLH",
    driverName: "Samsudin",
    invoiceId: "INV-003",
    address: "Jl. Raya Jakarta-Bogor KM 46, Cibinong, Kabupaten Bogor"
  }
];

export const initialInvoices: Invoice[] = [
  { id: "INV-001", companyId: "COM-002", companyName: "PT. Indo Kordsa Tbk", type: "Pengangkutan", amount: 450000, date: "2026-05-20", status: "SETTLED" },
  { id: "INV-002", companyId: "COM-001", companyName: "PT. Indocement Tunggal Prakarsa Tbk", type: "Retribusi UKL-UPL", amount: 1500000, date: "2026-05-10", status: "SETTLED" },
  { id: "INV-003", companyId: "COM-005", companyName: "PT. Ricky Putra Globalindo Tbk", type: "Pengangkutan", amount: 150000, date: "2026-05-20", status: "UNPAID" },
  { id: "INV-004", companyId: "COM-004", companyName: "PT. Solusi Bangun Indonesia Tbk Narogong", type: "Denda Keterlambatan", amount: 250000, date: "2026-05-05", status: "UNPAID" },
  { id: "INV-005", companyId: "COM-005", companyName: "PT. Ricky Putra Globalindo Tbk", type: "Retribusi SPPL", amount: 500000, date: "2026-05-15", status: "SETTLED" },
  { id: "INV-006", companyId: "COM-004", companyName: "PT. Solusi Bangun Indonesia Tbk Narogong", type: "Retribusi UKL-UPL", amount: 1500000, date: "2026-05-16", status: "SETTLED" }
];

export const initialInspections: Inspection[] = [
  {
    id: "INSP-001",
    companyId: "COM-001",
    companyName: "PT. Indocement Tunggal Prakarsa Tbk",
    inspectorId: "OFF-001",
    inspectorName: "Heryanto, S.T.",
    date: "2026-05-14",
    score: 85,
    status: "Selesai",
    location: "Citeureup, Kabupaten Bogor",
    notes: "TPS B3 sudah tertata rapi, saluran IPAL lancar.",
    bapSigned: true,
    checklist: { tpsB3: true, ipal: true, apar: true, noise: false, safetyEquipment: true }
  },
  {
    id: "INSP-002",
    companyId: "COM-002",
    companyName: "PT. Indo Kordsa Tbk",
    inspectorId: "OFF-001",
    inspectorName: "Heryanto, S.T.",
    date: "2026-05-25",
    score: null,
    status: "Terjadwal",
<<<<<<< Updated upstream
    location: "Kec. Coblong, Bandung",
    checklist: { tpsB3: false, ipal: false, apar: false, noise: false, safetyEquipment: false }
=======
    location: "Citeureup, Kabupaten Bogor",
    checklist: {
      spplBersih: false,
      spplBebasLimbah: false,
      spplDrainase: false,
      spplBebasBakar: false,
      spplTempatSampah: false
    }
>>>>>>> Stashed changes
  },
  {
    id: "INSP-003",
    companyId: "COM-004",
    companyName: "PT. Solusi Bangun Indonesia Tbk Narogong",
    inspectorId: "OFF-001",
    inspectorName: "Heryanto, S.T.",
    date: "2026-05-18",
    score: 65,
    status: "Selesai",
    location: "Klapanunggal, Kabupaten Bogor",
    notes: "TPS B3 kurang rapi, air IPAL mendekati ambang batas pH 9.",
    bapSigned: true,
    checklist: { tpsB3: true, ipal: true, apar: false, noise: false, safetyEquipment: false }
  }
];

export const initialNotifications: SystemNotification[] = [
  {
    id: "NTF-001",
    title: "Kebocoran pH Terdeteksi",
    message: "Volume limbah cair di PT. Ricky Putra Globalindo Tbk melampaui debit normal 120m³.",
    type: "DANGER",
    timestamp: "2026-05-20T09:30:00Z",
    read: false
  },
  {
    id: "NTF-002",
    title: "Jadwal Inspeksi Baru",
    message: "Inspeksi terjadwal untuk PT. Indo Kordsa Tbk pada 25 Mei 2026.",
    type: "INFO",
    timestamp: "2026-05-20T08:15:00Z",
    read: false
  },
  {
    id: "NTF-003",
    title: "Pembayaran Diterima",
    message: "Invoice INV-001 senilai Rp 450.000 telah dibayar oleh PT. Indo Kordsa Tbk (Langsung disetor ke Kas Daerah).",
    type: "SUCCESS",
    timestamp: "2026-05-20T10:10:00Z",
    read: false
  }
];

export const initialAuditLogs: AuditLog[] = [
  { id: "LOG-001", timestamp: "2026-05-20T08:00:00Z", user: "super@sijaga.id", role: "SUPER_ADMIN", action: "Konfigurasi payment gateway dimodifikasi ke Sandbox Mode." },
  { id: "LOG-002", timestamp: "2026-05-20T09:12:00Z", user: "admin@dlh.go.id", role: "ADMIN_DLH", action: "Menyetujui dokumen UKL-UPL PT. Indo Kordsa Tbk." }
];