// src/modules/dashboard/components/auditor/GisTab.tsx
import React, { useEffect, useMemo } from "react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- Fix Leaflet Default Icon ---
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { AlertTriangle } from "lucide-react";

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Generator Ikon Spasial Berkedip (Sama dengan LimbahMap untuk konsistensi UI Eksekutif) [3]
const createPulsingIcon = (status: string) => {
    let colorClass = "bg-rose-600";
    let ringClass = "bg-rose-500 animate-ping";

    if (status === "RESOLVED") {
        colorClass = "bg-teal-600";
        ringClass = "bg-teal-400";
    } else if (status === "INVESTIGATING") {
        colorClass = "bg-indigo-600";
        ringClass = "bg-indigo-400 animate-pulse";
    }

    return L.divIcon({
        html: `
            <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
                <span class="absolute inline-flex h-6 w-6 rounded-full ${ringClass} opacity-75"></span>
                <span class="relative inline-flex rounded-full h-4.5 w-4.5 ${colorClass} border-2 border-white shadow-md flex items-center justify-center">
                    <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
                </span>
            </div>
        `,
        className: "custom-pulsing-marker-wrapper",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
};

export default function GisTab() {
    // INJEKSI STATE: Menarik adminReports dan fetchAdminReports [3]
    const { companies, adminReports, fetchAdminReports } = useSijagaStore();

    // SINKRONISASI DATA SPASIAL ADUAN: Dijalankan saat tab ini dirender
    useEffect(() => {
        fetchAdminReports();
    }, [fetchAdminReports]);

    // Menghitung statistik kepatuhan industri aktif
    const stats = useMemo(() => {
        const approved = companies.filter(c => c.status === "APPROVED");
        const sangatPatuh = approved.filter(c => c.score !== undefined && c.score !== null && c.score >= 80).length;
        const cukupPatuh = approved.filter(c => c.score !== undefined && c.score !== null && c.score >= 60 && c.score < 80).length;
        const kritis = approved.filter(c => c.score !== undefined && c.score !== null && c.score < 60).length;
        return { sangatPatuh, cukupPatuh, kritis, total: approved.length };
    }, [companies]);

    const getScoreBadge = (score?: number) => {
        if (!score) return <Badge className="bg-slate-100 text-slate-500 border border-slate-200 rounded-none text-[8px] font-black uppercase tracking-widest">Belum Audit</Badge>;
        if (score >= 80) return <Badge className="bg-emerald-50 text-emerald-700 border-none rounded-none text-[8px] font-black uppercase tracking-widest">Excellent ({score})</Badge>;
        if (score >= 60) return <Badge className="bg-amber-50 text-amber-700 border-none rounded-none text-[8px] font-black uppercase tracking-widest">Fair ({score})</Badge>;
        return <Badge className="bg-red-50 text-red-700 border-none rounded-none text-[8px] font-black uppercase tracking-widest">Critical ({score})</Badge>;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in duration-300 text-left">

            {/* PANEL KIRI: Legenda Kepatuhan Spasial (Sharp & Flat) */}
            <Card className="rounded-none p-4 border border-slate-200 shadow-sm bg-white space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                    <div className="border-b pb-3 border-slate-200">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">Pemetaan & Kepatuhan</h3>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
                        Legenda titik koordinat industri pada peta didasarkan pada tingkat kepatuhan lingkungan hidup (ESG Score).
                    </p>

                    <div className="space-y-3 pt-2 border-t border-slate-100 font-sans">
                        <div className="flex items-center justify-between text-xs font-bold">
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-none bg-emerald-500 border border-slate-200 shadow-inner" /> Sangat Patuh (&ge; 80)
                            </span>
                            <Badge className="bg-emerald-50 text-emerald-700 border-none rounded-none text-[8px] font-black uppercase tracking-widest">
                                {stats.sangatPatuh} Lokasi
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold">
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-none bg-amber-500 border border-slate-200 shadow-inner" /> Cukup Patuh (60 - 79)
                            </span>
                            <Badge className="bg-amber-50 text-amber-700 border-none rounded-none text-[8px] font-black uppercase tracking-widest">
                                {stats.cukupPatuh} Lokasi
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold">
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-none bg-red-500 border border-slate-200 shadow-inner" /> Kepatuhan Kritis (&lt; 60)
                            </span>
                            <Badge className="bg-red-50 text-red-700 border-none rounded-none text-[8px] font-black uppercase tracking-widest">
                                {stats.kritis} Lokasi
                            </Badge>
                        </div>
                    </div>

                    {/* INJEKSI BARU: Legenda untuk Titik Krisis Pengaduan [3] */}
                    <div className="space-y-3 pt-3 border-t border-slate-100 font-sans">
                        <div className="flex items-center justify-between text-xs font-bold">
                            <span className="flex items-center gap-2 text-rose-700">
                                <AlertTriangle size={12} className="text-rose-500" /> Krisis Spasial (Aduan)
                            </span>
                            <Badge className="bg-rose-50 text-rose-700 border-none rounded-none text-[8px] font-black uppercase tracking-widest">
                                {adminReports.length} Kasus
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 p-3 border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider leading-snug">
                    Total Industri Dipetakan: <strong className="text-slate-800">{stats.total} Perusahaan</strong>
                </div>
            </Card>

            {/* PANEL KANAN: Peta Spasial (Tanpa rounded) */}
            <Card className="rounded-none border border-slate-200 shadow-sm overflow-hidden bg-white lg:col-span-2">
                <div className="h-[400px] w-full relative z-10">
                    <MapContainer center={[-6.9147, 107.6098]} zoom={12} zoomControl={true} style={{ height: "100%", width: "100%" }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* 1. PLOTTING PERUSAHAAN */}
                        {companies.map((c) => {
                            const lat = parseFloat(c.lat);
                            const lng = parseFloat(c.lng);
                            if (isNaN(lat) || isNaN(lng)) return null;

                            return (
                                <Marker key={`comp-${c.id}`} position={[lat, lng]}>
                                    <Popup>
                                        <div className="space-y-1.5 text-left p-1 font-sans">
                                            <h4 className="font-black text-slate-800 text-xs leading-none">{c.companyName}</h4>
                                            <p className="text-[10px] text-slate-500 font-medium">{c.address}</p>
                                            <div className="flex items-center justify-between pt-1.5 gap-4 border-t border-slate-100">
                                                <Badge className="bg-slate-100 text-slate-600 border-none rounded-none text-[8px] font-black uppercase tracking-widest">{c.docType}</Badge>
                                                {getScoreBadge(c.score)}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}

                        {/* 2. PLOTTING ADUAN MASYARAKAT (Titik Krisis) [3] */}
                        {adminReports.map((report) => {
                            const latNum = parseFloat(report.lat);
                            const lngNum = parseFloat(report.lng);
                            if (isNaN(latNum) || isNaN(lngNum)) return null;

                            return (
                                <Marker
                                    key={`rpt-${report.id}`}
                                    position={[latNum, lngNum]}
                                    icon={createPulsingIcon(report.status)}
                                >
                                    <Popup>
                                        <div className="text-left font-sans p-1.5 space-y-2 max-w-[200px] select-none leading-none">
                                            <div className="border-b pb-1">
                                                <span className="font-mono font-bold text-slate-400 text-[8px] tracking-wider block">ID: {report.trackingId}</span>
                                                <h4 className="font-black text-slate-850 text-xs mt-1 leading-none uppercase">{report.incidentType}</h4>
                                            </div>
                                            <p className="text-[10px] text-slate-600 font-medium leading-relaxed italic line-clamp-3 text-justify">
                                                "{report.description}"
                                            </p>
                                            <div className="flex justify-between items-center pt-1.5 border-t">
                                                <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 border ${report.status === "RESOLVED" ? "bg-teal-50 text-teal-700 border-teal-200" :
                                                    report.status === "INVESTIGATING" ? "bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse" :
                                                        "bg-rose-50 text-rose-700 border-rose-200"
                                                    }`}>
                                                    {report.status}
                                                </span>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </div>
            </Card>

        </div>
    );
}