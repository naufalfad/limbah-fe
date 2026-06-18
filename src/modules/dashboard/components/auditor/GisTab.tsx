// src/modules/dashboard/components/auditor/GisTab.tsx
import React, { useMemo } from "react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- Fix Leaflet Default Icon ---
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// PUSAT PETA DIKUNCI DI KOTA SAMPIT (KABUPATEN KOTAWARINGIN TIMUR) [3]
const DEFAULT_CENTER: [number, number] = [-6.4816, 106.8560];

export default function GisTab() {
    // MODIFIKASI ARSITEKTURAL: Menghapus fetchAdminReports & adminReports demi isolasi data [3]
    const { companies } = useSijagaStore();

    // Menghitung statistik kepatuhan industri aktif (APPROVED) di wilayah Kotim
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

                    {/* SEKSI LEGENDA TITIK ADUAN LIAR DIHAPUS TOTAL DI SINI DEMI PRIVASI DATA [3] */}
                </div>

                <div className="bg-slate-50 p-3 border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider leading-snug">
                    Total Industri Dipetakan: <strong className="text-slate-800">{stats.total} Perusahaan</strong>
                </div>
            </Card>

            {/* PANEL KANAN: Peta Spasial (Tanpa rounded) */}
            <Card className="rounded-none border border-slate-200 shadow-sm overflow-hidden bg-white lg:col-span-2">
                <div className="h-[400px] w-full relative z-10">
                    {/* FASE 2: Sinkronisasi Default Center peta pimpinan ke Sampit Kotim [3] */}
                    <MapContainer center={DEFAULT_CENTER} zoom={11} zoomControl={true} style={{ height: "100%", width: "100%" }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* 1. PLOTTING PERUSAHAAN (APPROVED) */}
                        {companies
                            .filter(c => c.status === "APPROVED")
                            .map((c) => {
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
                            })
                        }

                        {/* 2. PLOTTING TITIK ADUAN WARGA DIHAPUS TOTAL DI SINI DEMI PRIVASI DATA [3] */}
                    </MapContainer>
                </div>
            </Card>

        </div>
    );
}