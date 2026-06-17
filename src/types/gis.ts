// src/types/gis.ts

/**
 * Definisi identitas panel untuk logika Shifting Panels (GFW Paradigm).
 * Membantu Orchestrator menentukan komponen mana yang harus dirender di stack.
 */
export type GisPanelType =
    | 'katalog-perusahaan'   // Panel daftar perusahaan
    | 'layer-kewajiban'      // Panel toggle layer AMDAL/UKL-UPL/SPPL & Pengaduan
    | 'detil-perusahaan'     // Panel melayang (floating) untuk detail info perusahaan
    | 'telemetri-lingkungan' // Panel melayang khusus visualisasi & analisis kualitas udara (AQI) & cuaca/air
    | 'tugas-patroli'        // Panel daftar penugasan patroli milik petugas lapangan
    | 'detail-tugas'         // Panel melayang (floating) khusus detail tugas & pengaduan
    | 'armada-tracking'      // Panel pelacakan live armada milik transporter/pengangkut
    | 'basemap-gallery'      // Panel khusus pengaturan peta dasar (Basemap)
    | 'hasil-pencarian'      // Panel untuk hasil search global
    | 'tentang'              // Panel informasi aplikasi
    | 'ai-copilot'           // Asisten AI Forensik Spasial
    | 'sensor-management';   // Panel manajemen & registrasi alat sensor fisik IoT

/**
 * Interface untuk mengelola state panel yang sedang terbuka.
 * Prinsip Larman (Information Expert): Objek ini tahu posisinya sendiri di dalam stack.
 */
export interface GisPanel {
    id: string;          // ID unik instance panel (mencegah React Key Conflict)
    type: GisPanelType;  // Jenis komponen panel
    title: string;       // Judul pada header panel
    isVisible: boolean;  // Status visibility untuk animasi (transisi)
    data?: any;          // Payload data dinamis (misal: ID Perusahaan yang diklik)
}

/**
 * Definisi tipe khusus untuk kewajiban dokumen lingkungan
 */
export type DocObligation = 'AMDAL' | 'UKL-UPL' | 'SPPL';

/**
 * Kontrak konfigurasi warna untuk setiap kewajiban lingkungan (Legenda)
 */
export interface ObligationStyle {
    color: string;      // Warna garis batas (border)
    fillColor: string;  // Warna isian (fill) poligon
    label: string;      // Label untuk UI
    tailwind: string;   // Class utility tailwind untuk komponen UI HTML
    hex: string;        // Hex murni untuk komponen yang butuh inline-style
}

// ============================================================================
// SPASIAL BAKU MUTU KUALITAS AIR (PP No. 22 Tahun 2021)
// ============================================================================

/**
 * Representasi parameter hasil uji sampel laboratorium air sungai bulanan.
 * Diperluas secara dinamis untuk menampung status telemetri atmosfer koralatif [1].
 */
export interface WaterSampleData {
    month: string;      // Singkatan nama bulan (Jan, Feb, Mar, dsb.)
    bod: number;        // Biochemical Oxygen Demand (mg/L) — Standar Kelas II: <= 3 mg/L
    cod: number;        // Chemical Oxygen Demand (mg/L) — Standar Kelas II: <= 25 mg/L
    do: number;         // Dissolved Oxygen / Oksigen Terlarut (mg/L) — Standar Kelas II: >= 4 mg/L
    ph: number;         // Derajat Keasaman — Standar Kelas II: 6.0 - 9.0

    // INJEKSI BARU: Parameter cuaca mikro BMKG real-time untuk pemodelan Digital Twin [1]
    weather?: {
        temperature: number;
        humidity: number;
        weatherDesc: string;
        windSpeed: number;
        windDirection: string;
        localTime: string;
        isSimulatedWeather: boolean;
    };

    // INJEKSI BARU: Penanda asal usul saluran transmisi data (live_api vs simulated)
    source?: string;
}

/**
 * Entitas Geospasial Titik Stasiun Pemantauan Kualitas Air Sungai (WaterStation_PT).
 */
export interface WaterStationNode {
    id: string;                         // ID Stasiun Pemantau (WS-01, WS-02, dsb.)
    name: string;                       // Nama stasiun/lokasi aliran sungai
    lat: number;                        // Koordinat Latitude geografis WGS84
    lng: number;                        // Koordinat Longitude geografis WGS84
    currentData: WaterSampleData;       // Hasil pembacaan sampel bulan aktif/terakhir
    monthlyHistory: WaterSampleData[];  // Log historis 12-bulan untuk visualisasi Recharts
    isWaterStation?: boolean;           // Flag polimorfik untuk pemisahan render UI
    sourceType?: "SIMULATED" | "PHYSICAL_IOT"; // Sumber data hibrida
    status?: "ACTIVE" | "MAINTENANCE" | "OFFLINE"; // Status kesehatan perangkat
    deviceId?: string;                  // MAC Address perangkat keras IoT fisik
}