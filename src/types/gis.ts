// src/types/gis.ts

/**
 * Definisi identitas panel untuk logika Shifting Panels (GFW Paradigm).
 * Membantu Orchestrator menentukan komponen mana yang harus dirender di stack.
 */
export type GisPanelType =
    | 'katalog-perusahaan'   // Panel daftar perusahaan
    | 'layer-kewajiban'      // Panel toggle layer AMDAL/UKL-UPL/SPPL & Pengaduan
    | 'detil-perusahaan'     // Panel melayang (floating) untuk detail info perusahaan
    | 'telemetri-lingkungan' // Panel melayang khusus visualisasi & analisis kualitas udara (AQI) & cuaca
    | 'tugas-patroli'        // Panel daftar penugasan patroli milik petugas lapangan
    | 'detail-tugas'         // Panel melayang (floating) khusus detail tugas & pengaduan
    | 'armada-tracking'      // Panel pelacakan live armada milik transporter/pengangkut
    | 'basemap-gallery'      // Panel khusus pengaturan peta dasar (Basemap)
    | 'hasil-pencarian'      // Panel untuk hasil search global
    | 'tentang'              // Panel informasi aplikasi
    | 'ai-copilot';          // [NEW PANEL] Asisten AI Forensik Spasial

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