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

const BACKEND_URL = "http://localhost:5000";

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

    const getStatusStyle = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: "bg-blue-50 text-blue-700 border-blue-200",
            VERIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
            INVESTIGATING: "bg-indigo-50 text-indigo-700 border-indigo-200",
            RESOLVED: "bg-teal-50 text-teal-700 border-teal-200",
            REJECTED: "bg-rose-50 text-rose-700 border-rose-200"
        };
        return styles[status] || "bg-slate-50 text-slate-500 border-slate-200";
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

                {/* --- TABS SYSTEM --- */}
                <div className="flex flex-wrap gap-1 bg-slate-100 p-1 border border-slate-200 w-max max-w-full">
                    {(["ALL", "PENDING", "VERIFIED", "INVESTIGATING", "RESOLVED", "REJECTED"] as StatusFilter[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab)}
                            className={cn(
                                "px-3.5 py-1.5 rounded-none text-[9px] font-black uppercase tracking-wider transition-all border outline-none",
                                statusFilter === tab
                                    ? "bg-slate-950 border-slate-950 text-white"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            )}
                        >
                            {tab === "ALL" ? "Semua Aduan" : tab}
                            <span className={cn(
                                "inline-flex items-center justify-center px-1.5 h-4 text-[8px] font-black font-mono ml-1.5",
                                statusFilter === tab ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
                            )}>
                                {tab === "ALL" ? adminReports.length : adminReports.filter(r => r.status === tab).length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* --- SEARCH TOOLBAR --- */}
                <Card className="rounded-none border border-slate-200 shadow-none p-3 bg-white">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <Input
                            placeholder="Cari ID Pelacakan, Kategori Masalah, Pelapor..."
                            className="pl-9 h-9 bg-slate-50 border-slate-200 rounded-none font-bold text-xs"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </Card>

                {/* --- DENSE TABLE --- */}
                <div className="bg-white rounded-none border border-slate-200 shadow-none overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow className="border-b border-slate-200 h-9">
                                <TableHead className="w-[150px] font-black text-slate-500 uppercase text-[9px] tracking-widest pl-4">ID Pelacakan</TableHead>
                                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Kategori Laporan</TableHead>
                                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Deskripsi Kejadian</TableHead>
                                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Identitas Pelapor</TableHead>
                                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Tgl Masuk</TableHead>
                                <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center">Status</TableHead>
                                <TableHead className="text-right pr-4 font-black text-slate-500 uppercase text-[9px] tracking-widest w-[140px]">Tindakan</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-16">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <FileText size={24} className="opacity-40" />
                                            <p className="font-black text-[10px] uppercase tracking-widest">Tidak ada pengaduan warga ditemukan</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredReports.map((r) => {
                                    return (
                                        <TableRow key={r.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors h-14 group">

                                            {/* Tracking ID */}
                                            <TableCell className="font-mono font-bold text-slate-500 pl-4 text-xs">
                                                {r.trackingId}
                                            </TableCell>

                                            {/* Category */}
                                            <TableCell className="font-bold text-slate-900 text-xs">
                                                {r.incidentType}
                                            </TableCell>

                                            {/* Description */}
                                            <TableCell className="max-w-xs truncate text-xs text-slate-600 font-medium">
                                                {r.description}
                                            </TableCell>

                                            {/* Reporter */}
                                            <TableCell className="text-xs text-slate-600">
                                                {r.reporterName ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800">{r.reporterName}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium mt-0.5">{r.reporterContact || "-"}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 border border-emerald-100 uppercase tracking-wider">
                                                        ANONIM (SECURE)
                                                    </span>
                                                )}
                                            </TableCell>

                                            {/* Submitted Date */}
                                            <TableCell className="text-slate-500 font-bold text-xs">
                                                {new Date(r.createdAt).toLocaleDateString("id-ID")}
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell className="text-center">
                                                <Badge className={cn("px-2 py-0.5 rounded-none text-[8px] font-black uppercase tracking-widest border shadow-none", getStatusStyle(r.status))}>
                                                    {r.status}
                                                </Badge>
                                            </TableCell>

                                            {/* Action */}
                                            <TableCell className="text-right pr-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleCompanyClick(r)}
                                                    className="text-emerald-600 font-black hover:bg-emerald-50 rounded-none h-8 text-[10px] tracking-widest gap-1.5"
                                                >
                                                    <Eye size={12} /> PERIKSA
                                                </Button>
                                            </TableCell>

                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

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
                                    Kategori Insiden: {selectedReport?.incidentType}
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