// src/modules/admin/components/gis/panels/PatrolTaskPanel.tsx
import React, { useState, useMemo } from "react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { useGisUIStore } from "@/store/useGisUIStore";
import { Search, ClipboardList, MapPin, Calendar, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
        // FASE 2: Memperbaiki Filter Mismatch dengan menggunakan UUID asli (currentUser.id) 
        // serta fallback ke officerId jika di-set.
        const userId = currentUser?.id;
        const officerId = currentUser?.officerId;

        return inspections.filter(
            (i) => (i.inspectorId === userId || i.inspectorId === officerId) && i.status === "Terjadwal"
        );
    }, [inspections, currentUser]);

    // 2. Filter pencarian tugas berdasarkan nama perusahaan atau lokasi
    const filteredTasks = useMemo(() => {
        if (!searchQuery) return myTasks;
        const lowerQuery = searchQuery.toLowerCase();
        return myTasks.filter(
            (t) =>
                t.companyName.toLowerCase().includes(lowerQuery) ||
                (t.notes && t.notes.toLowerCase().includes(lowerQuery)) ||
                (t.location && t.location.toLowerCase().includes(lowerQuery))
        );
    }, [searchQuery, myTasks]);

    // 3. FASE 3 ARSITEKTUR: Aksi saat baris tugas di-klik (Polymorphic Coordinate Extraction)
    const handleTaskClick = (task: any) => {
        // Tutup panel detail sebelumnya jika ada (Zero Gap Overlay)
        closePanelsToTheRight(-1);

        // Buka panel detail melayang khusus untuk TUGAS (bukan profil perusahaan utuh)
        openPanel("detail-tugas", `Sidak: ${task.id}`, task);

        let targetLat = 0;
        let targetLng = 0;

        // Logika Pintar: Mengekstrak koordinat berdasarkan sumber penugasan
        if (task.companyId === "COM-UNKNOWN" && task.location.includes(",")) {
            // Skenario A: Ini adalah aduan masyarakat (Koordinat disimpan di field location 'lat,lng')
            const coords = task.location.split(",");
            targetLat = parseFloat(coords[0]);
            targetLng = parseFloat(coords[1]);
            setSelectedCompanyId(null); // Unselect poligon perusahaan (karena belum diketahui)
        } else {
            // Skenario B: Ini adalah audit rutin pabrik (Koordinat dari entitas Company)
            const company = companies.find((c) => c.id === task.companyId);
            if (company) {
                targetLat = parseFloat(company.lat);
                targetLng = parseFloat(company.lng);
                setSelectedCompanyId(company.id); // Highlight poligon perusahaan di peta
            } else {
                toast.error("Data spasial perusahaan tidak ditemukan di database.");
                return;
            }
        }

        // Kiri-kanan komunikasi bebas ketergantungan (Decoupled Event):
        // Kirim event spasial ke LimbahMap.tsx agar otomatis mengarahkan peta ke koordinat target
        if (!isNaN(targetLat) && !isNaN(targetLng) && targetLat !== 0) {
            window.dispatchEvent(
                new CustomEvent("map-fly-to-coords", {
                    detail: {
                        lat: targetLat,
                        lng: targetLng
                    },
                })
            );
        }
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
                        placeholder="Cari tugas atau lokasi..."
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
                        Menampilkan {myTasks.length} penugasan sidak aktif. Klik baris tugas untuk mendeteksi lokasi target secara instan pada peta.
                    </p>
                </div>

                {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => {
                        // FASE 3: UI Polymorphism untuk render baris tugas
                        const isUnknown = task.companyId === "COM-UNKNOWN";
                        const title = isUnknown ? "🚨 Penyelidikan Laporan Warga" : task.companyName;
                        const displayNotes = task.notes ? task.notes : (isUnknown ? "Investigasi lapangan atas laporan masyarakat." : "Inspeksi kepatuhan lingkungan rutin.");

                        return (
                            <button
                                key={task.id}
                                onClick={() => handleTaskClick(task)}
                                className="group flex items-center justify-between px-4 py-3 border-b border-slate-200 hover:bg-slate-50 transition-colors text-left w-full bg-white outline-none"
                            >
                                <div className="flex flex-col gap-1 pr-4 overflow-hidden">
                                    {/* Tipe Tugas (Menggantikan ID UUID yang jelek) */}
                                    <span className={cn(
                                        "text-[8px] font-black uppercase tracking-widest leading-none px-1.5 py-0.5 w-fit border",
                                        isUnknown
                                            ? "bg-rose-50 text-rose-700 border-rose-200"
                                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    )}>
                                        {isUnknown ? "Tindak Lanjut Aduan" : "Audit Rutin DLH"}
                                    </span>

                                    {/* Nama Industri / Target */}
                                    <h4 className="text-[12px] font-bold text-slate-800 leading-tight truncate mt-1">
                                        {title}
                                    </h4>

                                    {/* Notes / Instruksi */}
                                    <p className="text-[10px] font-semibold text-slate-600 italic line-clamp-2 mt-0.5 leading-snug">
                                        "{displayNotes}"
                                    </p>

                                    {/* Info Detail Tugas (Micro-typography) */}
                                    <div className="flex flex-col gap-0.5 mt-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                                        <span className="flex items-center gap-1">
                                            <MapPin size={10} className="text-slate-400 shrink-0" />
                                            <span className="truncate">
                                                {isUnknown ? "Titik Koordinat Penyelidikan" : task.location}
                                            </span>
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar size={10} className="text-slate-400 shrink-0" />
                                            <span>Rencana: {task.date}</span>
                                        </span>
                                    </div>
                                </div>

                                <ChevronRight
                                    size={16}
                                    className="shrink-0 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all"
                                />
                            </button>
                        );
                    })
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 px-4">
                        <div className="w-10 h-10 rounded-none bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-200">
                            <ClipboardList size={18} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Tugas Nihil</p>
                            <p className="text-[10px] text-slate-500 font-medium">Anda tidak memiliki jadwal penugasan sidak aktif saat ini.</p>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}