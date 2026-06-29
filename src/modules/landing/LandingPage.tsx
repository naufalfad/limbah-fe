// src/modules/landing/LandingPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, Leaf, BarChart3, MapPin,
  ArrowRight, AlertTriangle, Search, ChevronRight,
  Cpu, Clock, Lock, Settings2, TrendingUp, Droplets, Wind, Factory, Award
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Mengimpor elemen chart Recharts terpercaya (Information Expert)
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip
} from "recharts";
import { toast } from 'sonner';

type SectorType = "AIR" | "WATER" | "WASTE" | "INSPECTION";

interface SectorData {
  label: string;
  title: string;
  desc: string;
  metrics: { name: string; val: string; percent: number; color: string }[];
  chartData: { name: string; value: number }[];
  chartColor: string;
  btnLabel: string;
}

// --- DATASET INTERAKTIF SHIELD (Information Expert) ---
const SECTOR_DATA: Record<SectorType, SectorData> = {
  AIR: {
    label: "Atmosfer & Udara",
    title: "Pemantauan Kualitas Udara Real-time",
    desc: "Integrasi stasiun sensor udara hibrida untuk melacak pergerakan debu halus PM2.5 dan emisi cerobong industri di wilayah rawan paparan polusi asap.",
    metrics: [
      { name: "Indeks Standar PM2.5", val: "38 µg/m³", percent: 45, color: "bg-emerald-500" },
      { name: "Kadar Karbon Monoksida (CO)", val: "1.2 ppm", percent: 30, color: "bg-emerald-500" },
      { name: "Akurasi Interpolasi IDW", val: "99.4%", percent: 92, color: "bg-emerald-500" }
    ],
    chartData: [
      { name: "Sen", value: 45 },
      { name: "Sel", value: 52 },
      { name: "Rab", value: 68 },
      { name: "Kam", value: 40 },
      { name: "Jum", value: 55 },
      { name: "Sab", value: 72 },
      { name: "Min", value: 35 }
    ],
    chartColor: "#10b981", // Emerald
    btnLabel: "Akses Konsol Udara"
  },
  WATER: {
    label: "Hidrologi & Sungai",
    title: "Baku Mutu Aliran Air Sungai Daerah",
    desc: "Sensor pelampung otonom (AFL Buoy) memantau kadar parameter kimia organik (BOD, COD, DO) aliran air sungai guna mendeteksi indikasi kebocoran limbah cair.",
    metrics: [
      { name: "Biochemical Oxygen Demand (BOD)", val: "2.4 mg/L", percent: 65, color: "bg-amber-500" },
      { name: "Oksigen Terlarut (DO)", val: "5.8 mg/L", percent: 85, color: "bg-emerald-500" },
      { name: "Stasiun Pengamatan Aktif", val: "4 Unit", percent: 100, color: "bg-emerald-500" }
    ],
    chartData: [
      { name: "Jan", value: 1.8 },
      { name: "Feb", value: 2.1 },
      { name: "Mar", value: 2.7 },
      { name: "Apr", value: 3.4 },
      { name: "Mei", value: 2.4 },
      { name: "Jun", value: 1.9 }
    ],
    chartColor: "#06b6d4", // Cyan
    btnLabel: "Akses Konsol Sungai"
  },
  WASTE: {
    label: "Logbook & Manifest B3",
    title: "Pelacakan Logistik Logbook B3",
    desc: "Mekanisme rekaman data produksi limbah berbahaya (B3) industri harian yang mewajibkan seluruh muatan terverifikasi dari pengirim hingga tiba di tempat tujuan.",
    metrics: [
      { name: "Volume Limbah Terkelola", val: "145.2 Ton", percent: 80, color: "bg-emerald-500" },
      { name: "Rasio Angkut Berlisensi", val: "98.4%", percent: 98, color: "bg-emerald-500" },
      { name: "Armada Transporter Aktif", val: "8 Truk", percent: 40, color: "bg-emerald-500" }
    ],
    chartData: [
      { name: "W1", value: 20 },
      { name: "W2", value: 35 },
      { name: "W3", value: 48 },
      { name: "W4", value: 42 }
    ],
    chartColor: "#6366f1", // Indigo
    btnLabel: "Akses Konsol B3"
  },
  INSPECTION: {
    label: "Sidak & Kepatuhan",
    title: "Kinerja Inspeksi Lapangan DLH",
    desc: "Pusat manajemen penugasan surat tugas dan sidak fisik secara mendadak. Membantu petugas lapangan menerbitkan Berita Acara Pemeriksaan (BAP) digital terenkripsi.",
    metrics: [
      { name: "Sidak Lapangan Selesai", val: "48 Lokasi", percent: 75, color: "bg-emerald-500" },
      { name: "Skor Rata-rata Kepatuhan", val: "85/100", percent: 85, color: "bg-emerald-500" },
      { name: "Rekomendasi SP Terbit", val: "3 Berkas", percent: 15, color: "bg-rose-500" }
    ],
    chartData: [
      { name: "Q1", value: 12 },
      { name: "Q2", value: 18 },
      { name: "Q3", value: 24 },
      { name: "Q4", value: 32 }
    ],
    chartColor: "#f59e0b", // Amber
    btnLabel: "Akses Konsol Sidak"
  }
};

export default function LandingPage() {
  const navigate = useNavigate();

  // Membaca tracking token dari localStorage untuk badge lapor instan warga
  const [localReportId, setLocalReportId] = useState<string | null>(null);

  // State Pengendali Sektor Explorer yang sedang Aktif (Default: AIR/Udara)
  const [activeSector, setActiveSector] = useState<SectorType>("AIR");

  useEffect(() => {
    const savedId = localStorage.getItem('geo_pedal_report_id');
    if (savedId) {
      setLocalReportId(savedId);
    }
  }, []);

  const currentSector = SECTOR_DATA[activeSector];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 font-sans">

      {/* --- NAVIGATION (Sharp & Minimalist) --- */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-slate-200 h-16 flex items-center">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full flex items-center justify-between">

          <div className="flex items-center gap-2 md:gap-2.5">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-emerald-50 border border-emerald-500/20 flex items-center justify-center text-emerald-600 rounded-none shrink-0">
              <Leaf size={16} strokeWidth={2.5} className="md:w-[18px] md:h-[18px]" />
            </div>
            <span className="font-sans font-semibold text-lg md:text-xl tracking-tight text-slate-800">
              Geo <span className="text-emerald-600">Pedal</span>
            </span>
          </div>

          <div className="flex items-center gap-1 md:gap-1.5">
            <Button
              onClick={() => {
                if (localReportId) {
                  navigate(`/lacak/${localReportId}`);
                } else {
                  navigate('/lacak');
                }
              }}
              variant="ghost"
              title="Lacak Pengaduan Aktif"
              className="font-black text-slate-700 hover:bg-slate-50 relative rounded-none h-9 px-2 md:px-3 text-[10px] uppercase tracking-widest gap-1.5 border-none outline-none"
            >
              <Search size={12} className="text-slate-400 shrink-0" />
              <span className="hidden sm:inline">Lacak Pengaduan</span>
              <span className="sm:hidden">Lacak</span>
              {/* Indikator Senyap: Hanya berdenyut halus di pojok kanan atas ikon jika ada draf lokal */}
              {localReportId && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </Button>

            {/* Garis Slate Pembatas Vertikal Tipis */}
            <div className="h-5 w-px bg-slate-200 mx-1 shrink-0" />

            {/* Tombol MASUK (Ghost Style) */}
            <Button
              onClick={() => navigate('/login')}
              variant="ghost"
              className="font-black text-slate-650 hover:bg-slate-50 text-[10px] tracking-widest uppercase h-9 px-3 rounded-none border-none outline-none"
            >
              MASUK
            </Button>
          </div>

        </div>
      </nav>

      {/* --- HERO SECTION (Atmospheric Full-Bleed Background Wash) --- */}
      <section className="relative min-h-[85vh] flex items-center bg-slate-950 text-white overflow-hidden py-20 px-4 lg:px-6">
        {/* Gambar Latar Belakang Pembangunan Lingkungan Beresolusi Tinggi */}
        <div
          className="absolute inset-0 bg-cover bg-center z-0 scale-105 filter saturate-75"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=2000&q=80')` }}
        />
        {/* Lapisan Gradien Overlay Pemda Taktis */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/45 z-10" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center relative z-20 w-full mt-10 md:mt-0">

          {/* Teks Informasi & Narasi Baru (Tighter & Compact Copywriting) */}
          <div className="lg:col-span-7 space-y-5 text-left">
            <span className="uppercase tracking-[0.25em] text-[8px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 w-max block">
              GeoPedal
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none uppercase">
              Satu Pintu Pengawasan <br />
              <span className="text-emerald-400 italic">Dampak Lingkungan.</span>
            </h1>

            <p className="text-xs md:text-sm text-slate-350 font-semibold leading-relaxed max-w-xl">
              Platform geospasial terintegrasi untuk registrasi dokumen SPPL, matriks UKL-UPL, pelaporan harian logbook limbah berkala, dan penugasan sidak lapangan yang akuntabel.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={() => navigate('/register')}
                className="h-11 px-6 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] tracking-widest uppercase transition-all gap-1.5 shadow-none"
              >
                MULAI REGISTRASI <ArrowRight size={12} />
              </Button>

              <Button
                onClick={() => navigate('/lapor')}
                className="h-11 px-6 rounded-none bg-amber-600 hover:bg-amber-700 text-white font-black text-[11px] tracking-widest uppercase transition-all gap-1.5 shadow-none"
              >
                <AlertTriangle className="animate-pulse text-amber-100" size={14} /> LAPOR PELANGGARAN LIMBAH
              </Button>
            </div>
          </div>

          {/* SISI KANAN: Panel Telemetri Kompak Tanpa Nested Box (Single-Level Card) */}
          <div className="lg:col-span-5 bg-slate-950/75 border border-white/10 p-6 rounded-none backdrop-blur-sm space-y-4 text-left">
            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block leading-none">
              REALTIME TELEMETRY REPORT
            </span>
            <h3 className="text-xs font-black text-white uppercase tracking-wider leading-none">
              Indikator Kepatuhan Industri
            </h3>

            <div className="grid grid-cols-2 gap-5 pt-2 font-mono">
              <div className="border-l-2 border-emerald-500 pl-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Perusahaan Terdaftar</p>
                <p className="text-xl font-black text-white mt-1 leading-none">1,200+</p>
              </div>
              <div className="border-l-2 border-emerald-500 pl-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Izin Terbit</p>
                <p className="text-xl font-black text-white mt-1 leading-none">940 Berkas</p>
              </div>
              <div className="border-l-2 border-emerald-500 pl-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sidak Terjadwal</p>
                <p className="text-xl font-black text-white mt-1 leading-none">12 Lokasi</p>
              </div>
              <div className="border-l-2 border-emerald-500 pl-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Rasio Kepatuhan</p>
                <p className="text-xl font-black text-emerald-400 mt-1 leading-none">91.6%</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- PROSEDUR SECTION (Editorial Newspaper Style - Bersih Tanpa nested boxes) --- */}
      <section id="prosedur" className="py-16 md:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 space-y-10 md:space-y-12">

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-5 text-left">
            <div className="space-y-2">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.25em] block leading-none">WORKFLOW PROCESS</span>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                Satu Sistem, Semua Urusan Lingkungan
              </h2>
            </div>
          </div>

          {/* Symmetrical step list - Editorial layout, no cards, no borders inside */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepItem
              num="01"
              title="Registrasi Digital"
              desc="Pengisian berkas identitas legalitas badan usaha, nomor NIB, serta data penanggung jawab secara mandiri."
            />
            <StepItem
              num="02"
              title="Assessment Otomatis"
              desc="Sistem menapis parameter teknis dan menentukan instrumen kewajiban lingkungan hidup secara instan."
            />
            <StepItem
              num="03"
              title="Reporting & Monitoring"
              desc="Pelaku usaha melaporkan logbook limbah berkala dan mendokumentasikan manifest penjemputan B3."
            />
          </div>

        </div>
      </section>

      {/* --- SECTION 1: INTERACTIVE CIVIC DATA EXPLORER (MENGGANTIKAN FEATURE CARDS KAKU) --- */}
      <section id="civic-explorer" className="py-16 md:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 space-y-6 md:space-y-8">

          {/* Header Seksi */}
          <div className="space-y-2 text-left">
            <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 w-max block leading-none uppercase tracking-widest">
              Portal Statistik Wilayah
            </span>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
              Eksplorasi Parameter Kepatuhan Lingkungan
            </h2>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed max-w-xl">
              Sistem visualisasi parameter dinamis. Klik tab sektor data di bawah untuk mensimulasikan metrik pengawasan lingkungan hidup daerah secara real-time.
            </p>
          </div>

          {/* 1. SECTOR TABS SELECTOR (Flat Siku Kaku Grid, No Nested Container) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 p-1 bg-slate-200/50 border border-slate-200 w-full">
            {(["AIR", "WATER", "WASTE", "INSPECTION"] as SectorType[]).map((type) => {
              const item = SECTOR_DATA[type];
              const isSelected = activeSector === type;
              return (
                <button
                  key={type}
                  onClick={() => {
                    setActiveSector(type);
                    toast.info(`Menampilkan visualisasi parameter: ${item.label}`);
                  }}
                  className={cn(
                    "py-2.5 text-[10px] font-black uppercase tracking-wider transition-all border outline-none rounded-none text-center",
                    isSelected
                      ? "bg-slate-950 border-slate-950 text-white"
                      : "bg-white text-slate-600 border-slate-250 hover:bg-slate-50"
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* 2. DYNAMIC WORKSPACE PANEL (No nested box inside box, single level bordered card) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch text-left">

            {/* Kiri: Deskripsi & Live Progress Bars */}
            <div className="md:col-span-6 bg-white border border-slate-200 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest block leading-none">Fokus pengawasan aktif</span>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{currentSector.label}</span>
                  <h3 className="text-sm font-black text-slate-800 leading-none">{currentSector.title}</h3>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 leading-relaxed text-justify">
                  {currentSector.desc}
                </p>
              </div>

              {/* Progress bars representing active telemetry values */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                {currentSector.metrics.map((metric, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-end text-[11px] font-bold text-slate-700">
                      <span className="uppercase tracking-wider text-[9px] font-black text-slate-400">{metric.name}</span>
                      <span>{metric.val}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-none overflow-hidden">
                      <div className={cn("h-full rounded-none transition-all duration-1000", metric.color)} style={{ width: `${metric.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kanan: Recharts BarChart yang Ter-update secara Dinamis */}
            <div className="md:col-span-6 bg-white border border-slate-200 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest block leading-none">Rekaman tren historis daerah</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Grafik pemantauan berkala</span>
              </div>

              {/* Recharts Widescreen BarChart */}
              <div className="h-[180px] w-full font-sans text-[10px] pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentSector.chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} />
                    <ChartTooltip
                      cursor={{ fill: "#f8fafc" }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-2 border border-slate-800 text-[9px] space-y-0.5 text-left rounded-none">
                              <p className="text-slate-400 border-b border-white/10 pb-0.5 mb-1">{data.name}</p>
                              <p className="font-bold text-emerald-400 leading-none">Nilai: {data.value}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" fill={currentSector.chartColor} barSize={24} radius={[0, 0, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* CTA untuk login akses penuh */}
              <Button
                onClick={() => navigate('/login')}
                className="w-full h-11 bg-slate-900 hover:bg-emerald-600 text-white font-black text-[10px] tracking-widest uppercase rounded-none shadow-none flex items-center justify-center gap-1.5"
              >
                {currentSector.btnLabel} <ChevronRight size={12} />
              </Button>
            </div>

          </div>

        </div>
      </section>

      {/* --- FOOTER (Editorial & Clean) --- */}
      <footer className="bg-slate-950 text-white py-12 md:py-16 px-4 lg:px-6 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 border-b border-slate-900 pb-8 md:pb-12 text-left">

          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center rounded-none">
                <Leaf size={16} strokeWidth={2.5} />
              </div>
              <span className="font-sans font-semibold text-xl tracking-tight text-white">GeoPedal</span>
            </div>
            <p className="text-slate-400 max-w-sm font-semibold leading-relaxed">
              Platform integrasi satu pintu pengawasan, verifikasi administrasi SPPL/UKL-UPL, serta monitoring limbah industri terpadu Dinas Lingkungan Hidup.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-black uppercase tracking-widest text-[12px] text-emerald-500">Tautan Regulasi</h4>
            <ul className="space-y-2 text-slate-400 font-bold text-[11px] tracking-wider">
              <li><a href="#" className="hover:text-white transition-colors">Panduan Sistem Registrasi</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Daftar Kode KBLI Berisiko</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Undang-Undang Cipta Kerja</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-black uppercase tracking-widest text-[12px] text-emerald-500">Kontak Pengaduan</h4>
            <ul className="space-y-2 text-slate-400 font-bold text-[11px] tracking-wider">
              <li className="underline text-emerald-400 hover:text-emerald-300"><a href="mailto:support@geopedal.id">support@geopedal.id</a></li>
              <li>Sekretariat DLH Bidang Tata Lingkungan</li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
          <p>© 2026 GeoPedal — DINAS LINGKUNGAN HIDUP DAERAH. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>

    </div>
  );
}

// --- SUB-COMPONENTS (Clean Editorial Layout - Zero Nested Boxes) ---

function StepItem({ num, title, desc }: { num: string, title: string, desc: string }) {
  return (
    // Menggunakan tumpukan border atas hitam tebal editorial gaya koran modern (Tanpa card abu-abu)
    <div className="border-t-2 border-slate-900 pt-6 text-left flex flex-col justify-between h-full transition-colors group">
      <div className="space-y-3.5">
        <span className="font-mono text-3xl font-black text-emerald-600 italic tracking-tighter block leading-none">
          {num}
        </span>
        <div className="space-y-1.5">
          <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider leading-none group-hover:text-emerald-600 transition-colors">{title}</h4>
          <p className="text-slate-500 text-[11px] font-semibold leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}