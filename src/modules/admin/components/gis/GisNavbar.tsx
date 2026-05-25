// src/modules/admin/components/gis/GisNavbar.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Leaf, Share2, RefreshCw } from "lucide-react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { useGisUIStore } from "@/store/useGisUIStore";
import { toast } from "sonner";

/**
 * GisNavbar - Komponen Navigasi Frameless (GFW Paradigm)
 * Menggunakan sudut siku tegas (rounded-none) dan tata letak padat (high-density).
 * Berada di Z-Index 50, tinggi fixed 64px (h-16).
 */
export default function GisNavbar() {
    const navigate = useNavigate();
    const { currentUser } = useSijagaStore();
    const { clearPanels, resetMapContext } = useGisUIStore();

    // Helper untuk inisial nama
    const getInitials = (name: string) => {
        return name?.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2) || "AD";
    };

    const handleLogoClick = () => {
        clearPanels();
        resetMapContext();
        toast.info("Kanvas Geospasial di-reset ke tampilan awal.");
    };

    return (
        <nav className="absolute top-0 left-0 right-0 h-16 px-6 flex items-center justify-between bg-white border-b border-slate-200 z-50 pointer-events-auto">

            {/* KIRI: Tombol Back & Branding */}
            <div className="flex items-center gap-5">
                <button
                    onClick={() => navigate('/admin')}
                    className="group flex items-center gap-2 text-slate-500 hover:text-emerald-700 transition-all rounded-none outline-none"
                >
                    <div className="p-1.5 group-hover:bg-slate-100 transition-colors rounded-none">
                        <ChevronLeft size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">
                        Dashboard
                    </span>
                </button>

                <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                <button
                    onClick={handleLogoClick}
                    className="flex items-center gap-3 active:scale-95 transition-transform group rounded-none outline-none text-left"
                >
                    <div className="w-8 h-8 bg-emerald-600 flex items-center justify-center text-white rounded-none shadow-sm group-hover:bg-emerald-700 transition-colors">
                        <Leaf size={18} />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="text-sm font-black text-slate-800 tracking-tighter uppercase">
                            PANTAU <span className="text-emerald-600">LIMBAH</span>
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-0.5">
                            Geospasial Kepatuhan
                        </span>
                    </div>
                </button>
            </div>

            {/* KANAN: Tools & Profile */}
            <div className="flex items-center gap-1 md:gap-3">

                {/* Sync / Refresh Button (Tanpa Border) */}
                <button
                    onClick={() => toast.success("Data spasial disinkronkan.")}
                    className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:bg-slate-100 hover:text-emerald-700 transition-all active:scale-95 rounded-none outline-none"
                    title="Sinkronisasi Data"
                >
                    <RefreshCw size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest hidden sm:block">
                        Sync
                    </span>
                </button>

                {/* Share Button (Tanpa Border) */}
                <button
                    onClick={() => toast.info("Tautan peta berhasil disalin.")}
                    className="flex items-center justify-center px-3 py-2 text-slate-500 hover:bg-slate-100 hover:text-emerald-700 transition-all active:scale-95 rounded-none outline-none"
                    title="Bagikan Tampilan"
                >
                    <Share2 size={14} />
                </button>

                <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>

                {/* Profile Label (Tanpa Border Luar, Menyatu dengan background) */}
                <div className="flex items-center gap-3 pl-2 pr-2 py-1 group cursor-default">
                    <div className="w-8 h-8 bg-emerald-100 flex items-center justify-center text-[11px] font-black text-emerald-700 rounded-none">
                        {getInitials(currentUser?.name || "Admin")}
                    </div>
                    <div className="hidden sm:flex flex-col items-start text-left">
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight line-clamp-1 max-w-[100px]">
                            {currentUser?.name || "Admin DLH"}
                        </span>
                        <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-widest">
                            Verifikator
                        </span>
                    </div>
                </div>
            </div>

        </nav>
    );
}