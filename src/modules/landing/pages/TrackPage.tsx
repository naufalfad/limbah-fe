// src/modules/landing/pages/TrackPage.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSijagaStore } from "@/store/useSijagaStore";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";

// Icons (Dibersihkan dari ikon timeline dinamis yang tidak terpakai)
import {
    Search,
    CheckCircle,
    ShieldCheck,
    ArrowLeft,
    MapPin,
    Calendar,
    AlertTriangle,
    Loader2,
    FileText,
    Image as ImageIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { API_URL } from "@/lib/api";

// Base URL Backend untuk meload gambar fisik (Pilihan B)
const BACKEND_URL = API_URL;

// --- Fix Leaflet Default Marker Icons (Vite safety) ---
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocalReportItem {
    trackingId: string;
    incidentType: string;
    date: string;
    status: string;
}

export default function TrackPage() {
    const { trackingId: paramTrackingId } = useParams();
    const navigate = useNavigate();
    const { trackCitizenReport, publicReportTrackData, isReportLoading, clearPublicReportData } = useSijagaStore();

    const [searchId, setSearchId] = useState("");
    const [localReports, setLocalReports] = useState<LocalReportItem[]>([]);

    // 1. Membaca jejak laporan lokal dari perangkat saat inisiasi (Silent Tracking)
    useEffect(() => {
        const saved = localStorage.getItem("sijaga_citizen_reports");
        if (saved) {
            setLocalReports(JSON.parse(saved));
        }
    }, []);

    // 2. Mendukung Magic Link: Otomatis melacak jika ada ID di parameter URL rute (/lacak/:trackingId)
    useEffect(() => {
        if (paramTrackingId) {
            setSearchId(paramTrackingId);
            trackCitizenReport(paramTrackingId);
        } else {
            clearPublicReportData();
        }
    }, [paramTrackingId, trackCitizenReport, clearPublicReportData]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchId.trim()) return;
        navigate(`/lacak/${searchId.trim().toUpperCase()}`);
    };

    const handleSelectLocalReport = (id: string) => {
        navigate(`/lacak/${id}`);
    };

    // --- ADAPTIVE PHOTO GRID PARSER ---
    const parsePhotos = (photoStr: string | null | undefined): string[] => {
        if (!photoStr) return [];
        try {
            // Mengurai string JSON array dari database
            const parsed = JSON.parse(photoStr);
            return Array.isArray(parsed) ? parsed : [photoStr];
        } catch (e) {
            // Fallback apabila data berupa string tunggal (Backward Compatibility)
            return [photoStr];
        }
    };

    const photoList = parsePhotos(publicReportTrackData?.evidencePhoto);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 text-slate-800 flex flex-col font-sans text-left relative overflow-hidden">
            {/* Soft Ambience Layer (Light Theme Style) */}
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-emerald-100/30 rounded-full blur-[120px] -translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-amber-100/30 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

            {/* HEADER BAR (Light & Clean Theme) */}
            <header className="h-16 border-b border-slate-100 bg-white/80 backdrop-blur px-6 flex items-center justify-between shrink-0 z-40 relative">
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-600 transition-colors font-bold text-xs uppercase tracking-wider outline-none">
                        <ArrowLeft size={16} /> Beranda
                    </Link>
                    <div className="h-4 w-px bg-slate-200" />
                    <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                        SISTEM PELACAKAN SPASIAL PUBLIK
                    </span>
                </div>
            </header>

            {/* INFINITE WRAPPER (Kanvas Flat Tanpa Garis Pembatas Berlapis) */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-7xl w-full mx-auto my-4 bg-white border border-slate-150 shadow-2xl rounded-none relative z-10">

                {/* KOLOM KIRI (SIDEBAR - 320px): Deep Forest Green Command Anchor */}
                <aside className="w-full md:w-80 bg-[#022c22] text-white flex flex-col shrink-0 overflow-y-auto custom-scrollbar p-6 space-y-6 relative">
                    {/* Soft Forest Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/40 to-transparent pointer-events-none" />

                    <div className="space-y-2 relative z-10">
                        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Lacak No. Pengaduan</h3>
                        <form onSubmit={handleSearchSubmit} className="flex gap-2">
                            <Input
                                placeholder="RPT-YYYYMMDD-XXXX"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                className="h-10 rounded-none bg-[#011a14] border-emerald-900/60 text-xs font-mono font-medium uppercase text-white placeholder:font-sans placeholder:font-medium placeholder:text-emerald-700/60 focus:border-emerald-500"
                            />
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-none h-10 w-10 shrink-0 border-none outline-none">
                                <Search size={14} />
                            </Button>
                        </form>
                    </div>

                    <div className="space-y-3 flex-1 flex flex-col relative z-10">
                        <div className="border-b border-emerald-900/50 pb-2">
                            <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Aduan Saya di Perangkat Ini</h4>
                        </div>

                        {localReports.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-emerald-700/50 space-y-2">
                                <FileText size={24} className="opacity-30" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Tidak ada riwayat lokal</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[440px] overflow-y-auto custom-scrollbar pr-1">
                                {localReports.map((report) => {
                                    const isActive = paramTrackingId === report.trackingId;
                                    return (
                                        <button
                                            key={report.trackingId}
                                            onClick={() => handleSelectLocalReport(report.trackingId)}
                                            className={`w-full p-3.5 border text-left flex flex-col gap-1 transition-all outline-none rounded-none ${isActive
                                                ? "bg-emerald-900/40 border-emerald-500 text-white"
                                                : "bg-[#011a14]/40 border-emerald-950 text-emerald-100/60 hover:border-emerald-800"
                                                }`}
                                        >
                                            <div className="flex justify-between items-center leading-none text-[10px] font-medium font-mono">
                                                <span>{report.trackingId}</span>
                                                <span className="opacity-60">{report.date}</span>
                                            </div>
                                            <h5 className="font-semibold text-xs leading-tight mt-1.5 truncate text-slate-100">{report.incidentType}</h5>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </aside>

                {/* KOLOM KANAN: Panel Detail Status (Pure Alabaster White) */}
                <main className="flex-1 bg-[#FCFDFD] overflow-y-auto custom-scrollbar p-6 md:p-8 flex flex-col">
                    {isReportLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 animate-pulse">
                                Menghubungi Server Pengawasan Spasial...
                            </p>
                        </div>
                    ) : publicReportTrackData ? (
                        <div className="space-y-6 max-w-4xl w-full mx-auto animate-in fade-in duration-300">

                            {/* Header Info Aduan */}
                            <div className="bg-slate-50 border border-slate-100 p-6 rounded-none text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-white text-slate-600 rounded-none border border-slate-200 font-mono text-[10px] tracking-widest font-bold px-3 py-1">
                                            {publicReportTrackData.trackingId}
                                        </Badge>
                                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-none text-[8px] font-black uppercase tracking-wider shadow-none">
                                            TERARSIP (PERMANENT ARCHIVE)
                                        </Badge>
                                    </div>
                                    <h2 className="text-xl font-extrabold text-slate-900 pt-1 leading-none">
                                        {publicReportTrackData.incidentType}
                                    </h2>
                                </div>

                                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider leading-none">
                                    <Calendar size={12} /> Dikirim pada: {new Date(publicReportTrackData.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                            </div>

                            {/* TATA LETAK DETAIL: GRID 12 KOLOM */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

                                {/* BLOK DETIL (7 Kolom) */}
                                <div className="lg:col-span-7 space-y-6 flex flex-col">

                                    {/* PANEL STATUS STATIS COHESIVE (MEMBUANG TIMELINE USANG) [3] */}
                                    <div className="p-6 bg-emerald-50/20 border border-emerald-200 text-left flex flex-col space-y-4 rounded-none shadow-none">
                                        <div className="border-b border-emerald-100 pb-2.5 flex items-center gap-2">
                                            <ShieldCheck className="text-emerald-600 shrink-0" size={16} />
                                            <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none">Status Dokumentasi Spasial</h4>
                                        </div>

                                        <div className="space-y-3 font-sans text-xs leading-relaxed">
                                            <p className="font-bold text-slate-800 text-justify">
                                                Laporan Pengaduan Anda telah **berhasil direkam dan diarsipkan secara permanen** di basis data geospasial Dinas Lingkungan Hidup (DLH) Kabupaten/Kota.
                                            </p>
                                            <p className="text-slate-600 text-justify">
                                                Sesuai dengan ketentuan perlindungan hak pelapor (*Whistleblower Protection*), sistem mengisolasi penuh data pengaduan ini agar tidak terekspos secara bebas ke pihak eksternal industri [3].
                                            </p>
                                            <div className="bg-emerald-50/50 border border-emerald-100 p-3 flex items-start gap-2 text-emerald-800 font-bold text-[9px] uppercase tracking-wider leading-snug">
                                                <span>INFO: DATA KOORDINAT INI BERFUNGSI SEBAGAI INSTRUMEN RUJUKAN DOKUMENTASI PENGAWASAN SEKTORAL WILAYAH DLH.</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Deskripsi & Catatan Admin */}
                                    <div className="p-6 bg-slate-50/50 border border-slate-100 text-left space-y-4 flex-1 flex flex-col justify-between">
                                        <div className="space-y-1.5">
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Kronologi Masalah Terlapor</h4>
                                            <p className="text-xs text-slate-600 leading-relaxed font-medium text-justify">
                                                {publicReportTrackData.description}
                                            </p>
                                        </div>

                                        {publicReportTrackData.adminNotes && (
                                            <div className="p-4 bg-emerald-50/40 border border-emerald-100 text-slate-800">
                                                <span className="text-[8px] font-bold text-emerald-700 uppercase tracking-wider block leading-none">Tanggapan Dinas Lingkungan Hidup</span>
                                                <p className="text-xs font-semibold text-slate-600 italic mt-2">"{publicReportTrackData.adminNotes}"</p>
                                            </div>
                                        )}
                                    </div>

                                </div>

                                {/* BLOK VISUAL SPASIAL (5 Kolom) */}
                                <div className="lg:col-span-5 space-y-6">

                                    {/* Foto Gallery (Adaptive Grid - WhatsApp Style) */}
                                    <div className="p-6 bg-slate-50/50 border border-slate-100 text-left space-y-4">
                                        <div className="border-b border-slate-150 pb-2 flex items-center gap-1.5">
                                            <ImageIcon size={12} className="text-slate-400" />
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Arsip Bukti Kejadian</h4>
                                        </div>

                                        {photoList.length === 0 ? (
                                            <div className="py-6 text-center text-slate-400 text-[10px] font-bold uppercase">Tidak ada foto terlampir</div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2">
                                                {photoList.map((path, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={`${BACKEND_URL}${path}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="aspect-square border border-slate-100 bg-white overflow-hidden relative group cursor-zoom-in"
                                                    >
                                                        <img src={`${BACKEND_URL}${path}`} alt={`bukti-${idx}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Leaflet Map TKP - SPACIOUS GEOMETRY */}
                                    <div className="p-6 bg-slate-50/50 border border-slate-100 text-left space-y-4">
                                        <div className="border-b border-slate-150 pb-2 flex items-center gap-1.5">
                                            <MapPin size={12} className="text-slate-400" />
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Peta Lokasi TKP</h4>
                                        </div>

                                        {/* NULL-SAFE COORDINATES GEOMETRY CHECK */}
                                        {publicReportTrackData.lat && publicReportTrackData.lng ? (
                                            <div className="h-[260px] w-full bg-slate-50 border border-slate-200 relative z-10">
                                                <MapContainer
                                                    center={[parseFloat(publicReportTrackData.lat), parseFloat(publicReportTrackData.lng)]}
                                                    zoom={14}
                                                    zoomControl={false}
                                                    dragging={false}
                                                    scrollWheelZoom={false}
                                                    doubleClickZoom={false}
                                                    style={{ height: "100%", width: "100%" }}
                                                >
                                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                    <Marker position={[parseFloat(publicReportTrackData.lat), parseFloat(publicReportTrackData.lng)]} />
                                                    <ChangeMapCenterHelper lat={parseFloat(publicReportTrackData.lat)} lng={parseFloat(publicReportTrackData.lng)} />
                                                </MapContainer>
                                            </div>
                                        ) : (
                                            <div className="h-[260px] w-full bg-white border border-dashed border-slate-250 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                                                <AlertTriangle size={20} className="mb-2 animate-pulse text-amber-500" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">Koordinat Spasial Kosong</span>
                                                <p className="text-[9px] font-medium text-slate-500 mt-2">
                                                    Data koordinat (lat/lng) tidak ditemukan di database.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                </div>

                            </div>

                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
                            <AlertTriangle size={32} className="text-amber-500/40 animate-bounce" />
                            <div className="space-y-1 max-w-sm">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Laporan Tidak Ditemukan</p>
                                <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase leading-relaxed">
                                    Masukkan Tracking ID valid pada bilah kiri, atau silakan buat pengaduan baru melalui halaman pelaporan.
                                </p>
                            </div>
                            <Button
                                onClick={() => navigate("/lapor")}
                                className="bg-slate-900 hover:bg-emerald-600 text-white rounded-none text-[10px] font-bold tracking-widest uppercase h-10 px-6 border-none"
                            >
                                Buat Laporan Baru
                            </Button>
                        </div>
                    )}
                </main>

            </div>
        </div>
    );
}

// --- HELPERS ---

// Helper pemutakhiran dinamis titik pusat peta saat data pengaduan yang aktif berganti
function ChangeMapCenterHelper({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], 14, { animate: true });

        // REKAYASA SPASIAL: Membantu re-render ukuran Leaflet Map Container agar terhindar dari gray tiles
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 250);
        return () => clearTimeout(timer);
    }, [lat, lng, map]);
    return null;
}