// src/modules/admin/components/gis/panels/PatrolTaskPanel.tsx
import React, { useState, useMemo } from "react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { useGisUIStore } from "@/store/useGisUIStore";
import { Search, ClipboardList, MapPin, Calendar, ChevronRight } from "lucide-react";
import { toast } from "sonner";

/**
 * PatrolTaskPanel - GFW Paradigm (High-Density Data & Solid UI)
 * Menampilkan daftar penugasan sidak (terjadwal) yang ditugaskan kepada petugas aktif.
 * Menggunakan arsitektur Flush List yang menyatu dengan panel tanpa padding luar.
 */
export default function PatrolTaskPanel() {
    const { inspections, currentUser, companies } = useSijagaStore();
    const { openPanel, closePanelsToTheRight, setSelectedCompanyId } = useGisUIStore();

    const [searchQuery, setSearchQuery] = useState("");

    // 1. Saring tugas yang "Terjadwal" dan ditugaskan ke petugas ini (Gaya Information Expert)
    const myTasks = useMemo(() => {
        const officerId = currentUser?.officerId || "OFF-001"; // Fallback ke petugas default
        return inspections.filter(
            (i) => i.inspectorId === officerId && i.status === "Terjadwal"
        );
    }, [inspections, currentUser]);

    // 2. Filter pencarian tugas berdasarkan nama perusahaan atau lokasi
    const filteredTasks = useMemo(() => {
        if (!searchQuery) return myTasks;
        const lowerQuery = searchQuery.toLowerCase();
        return myTasks.filter(
            (t) =>
                t.companyName.toLowerCase().includes(lowerQuery) ||
                t.id.toLowerCase().includes(lowerQuery) ||
                (t.location && t.location.toLowerCase().includes(lowerQuery))
        );
    }, [searchQuery, myTasks]);

    // 3. Aksi saat baris tugas di-klik
    const handleTaskClick = (task: any) => {
        // Cari data koordinat spasial lengkap perusahaan dari store
        const company = companies.find((c) => c.id === task.companyId);

        if (!company) {
            toast.error("Data koordinat spasial perusahaan tidak ditemukan di database.");
            return;
        }

        // Set state seleksi agar peta memberikan efek highlight (nyala) pada poligon
        setSelectedCompanyId(company.id);
        closePanelsToTheRight(-1); // Tutup panel detail sebelumnya jika ada

        // Buka panel detail melayang dengan data perusahaan tersebut
        openPanel("detil-perusahaan", `Detail Industri`, company);

        // Kiri-kanan komunikasi bebas ketergantungan (Decoupled Event):
        // Kirim event spasial ke LimbahMap.tsx agar otomatis mengarahkan peta ke koordinat pabrik
        window.dispatchEvent(
            new CustomEvent("map-fly-to-coords", {
                detail: {
                    lat: parseFloat(company.lat),
                    lng: parseFloat(company.lng)
                },
            })
        );
    };

    return (
        <div className="flex flex-col h-full bg-white pb-10">

            {/* SECTION 1: SEARCH & FILTER (Sticky Solid) */}
            <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
                <div className="relative group">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors"
                        size={14}
                    />
                    <input
                        type="text"
                        placeholder="Cari tugas atau nama industri..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-none py-1.5 pl-8 pr-3 text-[12px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                </div>
            </div>

            {/* SECTION 2: TASK FLUSH LIST */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                {/* Info Header */}
                <div className="px-4 py-2.5 bg-emerald-50/50 border-b border-slate-200 flex items-start gap-2.5">
                    <ClipboardList size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                        Menampilkan {myTasks.length} penugasan sidak aktif. Klik baris tugas untuk mendeteksi lokasi industri secara instan pada peta.
                    </p>
                </div>

                {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => (
                        <button
                            key={task.id}
                            onClick={() => handleTaskClick(task)}
                            className="group flex items-center justify-between px-4 py-3 border-b border-slate-200 hover:bg-slate-50 transition-colors text-left w-full bg-white"
                        >
                            <div className="flex flex-col gap-1 pr-4 overflow-hidden">
                                {/* ID Tugas */}
                                <span className="text-[9px] font-black text-slate-400 group-hover:text-slate-500 uppercase tracking-widest leading-none">
                                    {task.id}
                                </span>

                                {/* Nama Industri */}
                                <h4 className="text-[12px] font-bold text-slate-800 leading-tight truncate">
                                    {task.companyName}
                                </h4>

                                {/* Info Detail Tugas (Micro-typography) */}
                                <div className="flex flex-col gap-0.5 mt-1 text-[10px] font-semibold text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <MapPin size={10} className="text-slate-400 shrink-0" />
                                        <span className="truncate">{task.location}</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar size={10} className="text-slate-400 shrink-0" />
                                        <span>Rencana: {task.date}</span>
                                    </span>
                                </div>
                            </div>

                            <ChevronRight
                                size={16}
                                className="shrink-0 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all"
                            />
                        </button>
                    ))
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 px-4">
                        <div className="w-10 h-10 rounded-none bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-200">
                            <ClipboardList size={18} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Tugas Nihil</p>
                            <p className="text-[10px] text-slate-500 font-medium">Anda tidak memiliki jadwal penugasan sidak aktif.</p>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}