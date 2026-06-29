// src/modules/admin/CitizenReportManagement.tsx
import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
    Search, Filter, RefreshCw, AlertTriangle, Eye, ShieldCheck, MapPin,
    User, Phone, Calendar, Clock, XCircle, CheckCircle2, FileText, Image as ImageIcon
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { API_URL } from "@/lib/api";

// --- Fix Leaflet Default Marker Icons (Vite Bundler Safety) ---
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const BACKEND_URL = API_URL;

// Helper untuk memaksa Leaflet menghitung ulang ukuran kanvas (Menyelesaikan bug gray tiles di modal) [3]
function InvalidateMapSize() {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 300);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
}

type StatusFilter = "ALL" | "PENDING" | "VERIFIED" | "INVESTIGATING" | "RESOLVED" | "REJECTED";

export default function CitizenReportManagement() {
    // MODIFIKASI ARSITEKTURAL: Hanya mengimpor data pengaduan spasial publik (Decoupled dari Officers & Companies) [3]
    const {
        adminReports,
        isReportLoading,
        fetchAdminReports
    } = useSijagaStore();

    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // States Detail Modal
    const [selectedReport, setSelectedReport] = useState<any | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Inisialisasi Sinkronisasi Master Data Pengaduan secara mandiri [3]
    useEffect(() => {
        fetchAdminReports();
    }, [fetchAdminReports]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchAdminReports();
        setIsRefreshing(false);
        toast.success("Database pengaduan warga berhasil disinkronkan.");
    };

    const handleOpenDetail = (report: any) => {
        setSelectedReport(report);
        setIsDetailOpen(true);
    };

    // Safe Multi-Photo Parser (Pilihan B: Multipart Multer) [3]
    const parsePhotos = (photoStr: string | null | undefined): string[] => {
        if (!photoStr) return [];
        try {
            const parsed = JSON.parse(photoStr);
            return Array.isArray(parsed) ? parsed : [photoStr];
        } catch (e) {
            return [photoStr];
        }
    };

    // Filter gabungan tabel arsip statis [3]
    const filteredReports = useMemo(() => {
        return adminReports.filter(r => {
            const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
            const matchesSearch =
                r.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.incidentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.reporterName && r.reporterName.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesStatus && matchesSearch;
        });
    }, [adminReports, statusFilter, searchQuery]);

    // Reset pagination on filter
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);

    const totalItems = filteredReports.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const paginatedReports = filteredReports.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const getStatusStyle = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: "text-blue-600",
            VERIFIED: "text-emerald-600",
            INVESTIGATING: "text-indigo-600",
            RESOLVED: "text-teal-600",
            REJECTED: "text-rose-600"
        };
        return styles[status] || "text-slate-500";
    };

    return (
        <DashboardLayout role="ADMIN_DLH">
            <div className="space-y-4 text-left">

                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
                            Arsip Pengaduan <span className="text-emerald-600">Masyarakat</span>
                        </h1>
                        <p className="text-slate-500 text-xs font-medium mt-1.5">
                            Katalog data pengaduan spasial luring/daring masyarakat. Berfungsi sebagai pangkalan data referensi pemantauan internal [3].
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={isRefreshing || isReportLoading}
                        className="flex items-center gap-2 font-black border-slate-300 rounded-none h-9 px-4 text-[10px] uppercase tracking-widest hover:bg-slate-50"
                    >
                        <RefreshCw size={12} className={cn((isRefreshing || isReportLoading) && "animate-spin")} />
                        {isRefreshing || isReportLoading ? "MEMUAT..." : "SYNC DATABASE"}
                    </Button>
                </div>

                {/* --- TABS SYSTEM (BORDERLESS UNDERLINE) --- */}
                <div className="flex flex-wrap gap-6 border-b border-slate-200 w-full mb-4">
                    {(["ALL", "PENDING", "VERIFIED", "INVESTIGATING", "RESOLVED", "REJECTED"] as StatusFilter[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab)}
                            className={cn(
                                "flex items-center gap-2 pb-3 text-[10px] font-black uppercase tracking-wider transition-all outline-none border-b-2",
                                statusFilter === tab
                                    ? "border-emerald-600 text-emerald-600"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                            )}
                        >
                            <span>{tab === "ALL" ? "Semua Aduan" : tab}</span>
                            <span className={cn(
                                "inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-black font-mono rounded-full",
                                statusFilter === tab ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                            )}>
                                {tab === "ALL" ? adminReports.length : adminReports.filter(r => r.status === tab).length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* --- SEARCH TOOLBAR --- */}
                <div className="py-2 border-y border-slate-200 bg-transparent flex flex-col md:flex-row gap-3">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <Input
                            placeholder="Cari ID Pelacakan, Kategori Masalah, Pelapor..."
                            className="pl-9 h-9 bg-slate-50 border-slate-200 rounded-none font-bold text-xs"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* --- DENSE TABLE (DESKTOP) --- */}
                <div className="hidden md:block bg-transparent overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50 border-y border-slate-200">
                            <TableRow className="border-b border-slate-200 h-9">
                                <TableHead className="w-[140px] font-black text-slate-500 uppercase text-[9px] tracking-widest pl-4">ID Pelacakan</TableHead>
                                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest w-[320px]">Laporan & Deskripsi</TableHead>
                                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest w-[160px]">Identitas Pelapor</TableHead>
                                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest w-[100px]">Tgl Masuk</TableHead>
                                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center w-[120px]">Status</TableHead>
                                <TableHead className="text-right pr-4 font-black text-slate-500 uppercase text-[9px] tracking-widest w-[80px]">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedReports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-16">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <FileText size={24} className="opacity-40" />
                                            <p className="font-black text-[10px] uppercase tracking-widest">Tidak ada pengaduan warga ditemukan</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedReports.map((r) => {
                                    return (
                                        <TableRow key={r.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors h-14 group">

                                            {/* Tracking ID */}
                                            <TableCell className="font-mono font-bold text-slate-500 pl-4 text-xs w-[140px]">
                                                {r.trackingId}
                                            </TableCell>

                                            {/* Kategori & Deskripsi Kejadian (Auto-wraps, extremely clean, no nested box) */}
                                            <TableCell className="max-w-[320px] whitespace-normal break-words py-2.5">
                                                <div className="flex flex-col text-left">
                                                    <span className="font-black text-slate-900 text-xs leading-tight group-hover:text-emerald-700 transition-colors">
                                                        {r.incidentType}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-1">
                                                        {r.description}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* Reporter Contact */}
                                            <TableCell className="w-[160px] whitespace-normal">
                                                {r.reporterName ? (
                                                    <div className="flex flex-col text-left text-xs font-semibold text-slate-600">
                                                        <span className="flex items-center gap-1 leading-tight text-slate-700 font-bold">
                                                            <User size={10} className="text-slate-400 shrink-0" /> {r.reporterName}
                                                        </span>
                                                        {r.reporterContact && (
                                                            <a href={`tel:${r.reporterContact}`} className="flex items-center gap-1 text-[10px] text-emerald-600 hover:underline mt-1 font-black tracking-tight leading-none shrink-0">
                                                                <Phone size={10} className="shrink-0" /> {r.reporterContact}
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex px-1.5 py-0.5 border border-emerald-100 bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase tracking-widest leading-none">
                                                        ANONIM (SECURE)
                                                    </span>
                                                )}
                                            </TableCell>

                                            {/* Submitted Date */}
                                            <TableCell className="text-slate-500 font-bold text-xs w-[100px]">
                                                {new Date(r.createdAt).toLocaleDateString("id-ID")}
                                            </TableCell>

                                            {/* Status Badge */}
                                            <TableCell className="text-center w-[120px]">
                                                <div className={cn("flex justify-center items-center gap-1.5 font-black text-[9px] uppercase tracking-widest leading-none", getStatusStyle(r.status))}>
                                                    <span className="w-1.5 h-1.5 rounded-full currentColor bg-current shrink-0" />
                                                    <span>{r.status}</span>
                                                </div>
                                            </TableCell>

                                            {/* Compact Icon Action Button */}
                                            <TableCell className="text-right pr-4 w-[80px]">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    title="Detail Pengaduan"
                                                    className="font-black text-[9px] text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 tracking-widest h-8 w-8 p-0 rounded-none outline-none"
                                                    onClick={() => handleOpenDetail(r)}
                                                >
                                                    <Eye size={14} />
                                                </Button>
                                            </TableCell>

                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* --- LIST VIEW (MOBILE) --- */}
                <div className="md:hidden flex flex-col divide-y divide-slate-100 border-y border-slate-200">
                    {paginatedReports.length === 0 ? (
                        <div className="text-center py-10 bg-transparent">
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                <FileText size={24} className="opacity-40" />
                                <p className="font-black text-[10px] uppercase tracking-widest">Tidak ada pengaduan warga ditemukan</p>
                            </div>
                        </div>
                    ) : (
                        paginatedReports.map((r) => {
                            return (
                                <div key={r.id} className="bg-transparent py-4 flex flex-col gap-3 relative overflow-hidden">
                                    <div className={cn("absolute top-0 left-0 w-1 h-full", 
                                        r.status === "PENDING" ? "bg-blue-500" :
                                        r.status === "VERIFIED" ? "bg-emerald-500" :
                                        r.status === "INVESTIGATING" ? "bg-indigo-500" :
                                        r.status === "RESOLVED" ? "bg-teal-500" : "bg-rose-500"
                                    )} />

                                    <div className="flex justify-between items-start gap-2 pt-0 pl-3 text-left">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-900 text-xs leading-tight">{r.incidentType}</span>
                                            <span className="font-mono text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{r.trackingId}</span>
                                        </div>
                                        <div className="shrink-0">
                                            <div className={cn("flex items-center gap-1.5 font-black text-[9px] uppercase tracking-widest", getStatusStyle(r.status))}>
                                                <span className="w-1.5 h-1.5 rounded-full currentColor bg-current" />
                                                {r.status}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 pl-3 text-left">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pelapor</span>
                                            <span className="font-bold text-slate-700 mt-0.5 line-clamp-1">{r.reporterName || "ANONIM"}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tgl Masuk</span>
                                            <span className="font-bold text-slate-700 mt-0.5">{new Date(r.createdAt).toLocaleDateString("id-ID")}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-1 pl-3">
                                        <div className="flex-1 text-left">
                                            <span className="text-[9px] text-slate-500 line-clamp-1 italic">"{r.description}"</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            title="Detail Pengaduan"
                                            className="text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-none h-8 w-8 p-0 border-slate-200 shrink-0 ml-2 flex items-center justify-center"
                                            onClick={() => handleOpenDetail(r)}
                                        >
                                            <Eye size={13} />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* --- PAGINATION CONTROLS --- */}
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                />

            </div>

            {/* --- DETAILED VIEW MODAL (Larman Expert Layout - Read Only) --- */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-[95vw] lg:max-w-4xl p-0 overflow-hidden rounded-none border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-left bg-white">

                    <DialogHeader className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-600 flex items-center justify-center text-white rounded-none">
                                <AlertTriangle size={20} />
                            </div>
                            <div className="text-left">
                                <DialogTitle className="text-sm font-black tracking-widest uppercase text-white">
                                    Pengaduan Warga: {selectedReport?.trackingId}
                                </DialogTitle>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-wider leading-none">
                                    Kategori Instiden: {selectedReport?.incidentType}
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    {selectedReport && (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">

                            {/* KOLOM KIRI (7 Kolom): Informasi Kronologi & Peta Spasial */}
                            <div className="md:col-span-7 space-y-4">

                                {/* Kronologi */}
                                <div className="space-y-1 text-left">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Deskripsi Kejadian Lapangan</p>
                                    <p className="text-xs font-semibold text-slate-700 bg-slate-50 p-4 border border-slate-150 leading-relaxed whitespace-pre-wrap text-justify">
                                        {selectedReport.description}
                                    </p>
                                </div>

                                {/* Geotagging Map (Leaflet) */}
                                <div className="space-y-1.5 text-left">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Koordinat Spasial Laporan (Peta GIS)</p>
                                    <div className="h-[220px] w-full border border-slate-200 relative z-10">
                                        <MapContainer
                                            center={[parseFloat(selectedReport.lat), parseFloat(selectedReport.lng)]}
                                            zoom={14}
                                            zoomControl={true}
                                            style={{ height: "100%", width: "100%" }}
                                        >
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <Marker position={[parseFloat(selectedReport.lat), parseFloat(selectedReport.lng)]} />
                                            <InvalidateMapSize />
                                        </MapContainer>
                                    </div>
                                    <div className="flex justify-between font-mono text-[9px] text-slate-500 font-bold uppercase tracking-wider pt-1 border-t">
                                        <span>LATITUDE: {selectedReport.lat}</span>
                                        <span>LONGITUDE: {selectedReport.lng}</span>
                                    </div>
                                </div>

                                {/* Whistleblower Identity */}
                                <div className="p-3 bg-slate-50 border border-slate-200">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Identitas Pengirim</p>
                                    {selectedReport.reporterName ? (
                                        <div className="grid grid-cols-2 gap-4 mt-2 font-sans text-xs">
                                            <div>
                                                <span className="text-[9px] text-slate-400 font-bold block leading-none">Nama Lengkap</span>
                                                <span className="font-bold text-slate-800 mt-1 block">{selectedReport.reporterName}</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] text-slate-400 font-bold block leading-none">Kontak WhatsApp</span>
                                                <span className="font-bold text-slate-800 mt-1 block">{selectedReport.reporterContact || "-"}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 mt-2 text-emerald-800">
                                            <ShieldCheck size={14} className="text-emerald-600 animate-pulse" />
                                            <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                                                Anonim (Whistleblower Protection diaktifkan)
                                            </span>
                                        </div>
                                    )}
                                </div>

                            </div>

                            {/* KOLOM KANAN (5 Kolom): Bukti Foto & Status Arsip Statis */}
                            <div className="md:col-span-5 space-y-4 flex flex-col justify-between">

                                {/* Multi-Photo Grid */}
                                <div className="space-y-2 text-left">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dokumentasi Bukti Fisik</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {parsePhotos(selectedReport.evidencePhoto).map((path, idx) => (
                                            <a
                                                key={idx}
                                                href={`${BACKEND_URL}${path}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="aspect-square border border-slate-200 bg-slate-50 overflow-hidden relative group cursor-zoom-in"
                                            >
                                                <img
                                                    src={`${BACKEND_URL}${path}`}
                                                    alt={`bukti-${idx}`}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                </div>

                                {/* METADATA ARSIP PENGADUAN (READ ONLY - DECOUPLED FROM TASKS) [3] */}
                                <div className="bg-slate-50 p-4 border border-slate-200 space-y-3.5 text-left rounded-none">
                                    <div className="border-b pb-1.5 flex justify-between items-center">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Status Arsip</span>
                                        <Badge className={cn("rounded-none shadow-none border text-[8px] font-black uppercase tracking-widest", getStatusStyle(selectedReport.status))}>
                                            {selectedReport.status}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3 font-sans text-xs">
                                        <div className="p-3 bg-white border border-slate-150 text-slate-700">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Catatan Administrasi</p>
                                            <p className="text-[10px] font-semibold text-slate-500 mt-2 leading-relaxed text-justify">
                                                Pengaduan masyarakat ini tersimpan secara aman sebagai dokumen pelaporan publik pasif (*Independent Data*).
                                                Guna menjaga netralitas dan kerahasiaan pelapor, data ini diisolasi sepenuhnya dari modul penugasan internal [3].
                                            </p>
                                        </div>

                                        <div className="space-y-1 pt-1">
                                            <span className="text-[8px] font-black text-slate-400 uppercase block">Tanggal Laporan Masuk</span>
                                            <span className="font-bold text-slate-700 block text-xs">
                                                {new Date(selectedReport.createdAt).toLocaleDateString("id-ID", {
                                                    weekday: "long",
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric"
                                                })}
                                            </span>
                                        </div>

                                        {selectedReport.adminNotes && (
                                            <div className="border-t pt-2 mt-2 space-y-1">
                                                <span className="text-[8px] font-black text-slate-400 uppercase block">Catatan Tambahan</span>
                                                <span className="font-bold text-slate-700 italic block">"{selectedReport.adminNotes}"</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>

                        </div>
                    )}

                    <div className="border-t border-slate-200 p-4 bg-slate-50 flex justify-end">
                        <Button
                            onClick={() => {
                                setIsDetailOpen(false);
                                setSelectedReport(null);
                            }}
                            className="rounded-none bg-slate-950 hover:bg-slate-800 text-white font-black text-xs px-6 h-9"
                        >
                            TUTUP DETAIL
                        </Button>
                    </div>

                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );

    // Helper click row handler
    function handleCompanyClick(report: any) {
        handleOpenDetail(report);
    }
}