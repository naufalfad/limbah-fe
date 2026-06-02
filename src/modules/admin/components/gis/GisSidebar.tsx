// src/modules/admin/components/gis/GisSidebar.tsx
import React, { useMemo } from "react";
import { Layers, Building2, Info, ClipboardList, Truck, Map as MapIcon } from "lucide-react";
import { useGisUIStore } from "@/store/useGisUIStore";
import { useSijagaStore } from "@/store/useSijagaStore";
import { GisPanelType } from "@/types/gis";

/**
 * GisSidebar - The Slim Anchor (Frameless Edition)
 * Menempel persis di bawah Navbar (top-16) dan di tepi kiri layar (w-16).
 * Interaksi visual menggunakan border vertikal alih-alih shadow atau background.
 */
export default function GisSidebar() {
    const { openPanel, activePanels, closePanelsToTheRight } = useGisUIStore();
    const { currentUser } = useSijagaStore();

    const isOfficer = currentUser?.role === "PETUGAS_LAPANGAN";
    const isTransporter = currentUser?.role === "PENGANGKUT";
    const isAuditor = currentUser?.role === "AUDITOR";

    // Menyusun navigasi item secara reaktif sesuai role yang aktif (Adaptive GFW UI)
    const navigationItems = useMemo(() => {
        const items = [
            {
                type: "layer-kewajiban" as GisPanelType,
                label: "Layers",
                icon: Layers,
                title: "Konfigurasi Layer Data"
            },
            // [NEW] Laci khusus pengaturan Basemap Peta
            {
                type: "basemap-gallery" as GisPanelType,
                label: "Basemap",
                icon: MapIcon,
                title: "Katalog Peta Dasar"
            }
        ];

        if (isOfficer) {
            items.push({
                type: "tugas-patroli" as GisPanelType,
                label: "Tugas",
                icon: ClipboardList,
                title: "Daftar Penugasan Patroli"
            });
        } else if (isTransporter) {
            items.push({
                type: "armada-tracking" as GisPanelType,
                label: "Armada",
                icon: Truck,
                title: "Live Pelacakan Armada"
            });
        } else if (isAuditor) {
            items.push({
                type: "katalog-perusahaan" as GisPanelType,
                label: "Kepatuhan",
                icon: Building2,
                title: "Pemantauan Kepatuhan Industri"
            });
        } else {
            items.push({
                type: "katalog-perusahaan" as GisPanelType,
                label: "Industri",
                icon: Building2,
                title: "Katalog Perusahaan Terdaftar"
            });
        }

        return items;
    }, [isOfficer, isTransporter, isAuditor]);

    const isPanelActive = (type: GisPanelType) => {
        return activePanels.some(p => p.type === type);
    };

    const handleNavClick = (item: typeof navigationItems[0]) => {
        closePanelsToTheRight(-1);
        openPanel(item.type, item.title);
    };

    return (
        <aside className="absolute top-16 bottom-0 left-0 w-16 flex flex-col items-center bg-white border-r border-slate-200 z-40 pointer-events-auto">

            <div className="flex-1 flex flex-col items-center w-full">
                {navigationItems.map((item, index) => {
                    const isActive = isPanelActive(item.type);

                    return (
                        <div key={index} className="relative group w-full flex justify-center">
                            <button
                                onClick={() => handleNavClick(item)}
                                className={`w-full h-16 flex flex-col items-center justify-center gap-1 transition-colors relative active:bg-slate-100 rounded-none outline-none
                  ${isActive
                                        ? "bg-emerald-50 text-emerald-700 border-l-[3px] border-emerald-600"
                                        : "bg-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-800 border-l-[3px] border-transparent"
                                    }`}
                            >
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                <span className={`text-[8px] font-bold uppercase tracking-widest ${isActive ? "opacity-100" : "opacity-70"}`}>
                                    {item.label}
                                </span>
                            </button>

                            <div className="absolute top-1/2 left-full -translate-y-1/2 ml-1 px-3 py-2 bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-none opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                {item.title}
                                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45 rounded-none" />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-col items-center w-full mt-auto">
                <div className="w-8 h-px bg-slate-200 mb-1" />

                <div className="relative group w-full flex justify-center">
                    <button
                        onClick={() => {
                            closePanelsToTheRight(-1);
                            openPanel("tentang", "Tentang GIS Pantau Limbah");
                        }}
                        className={`w-full h-16 flex items-center justify-center transition-colors relative active:bg-slate-100 rounded-none outline-none border-l-[3px] ${isPanelActive("tentang") ? "bg-emerald-50 text-emerald-700 border-emerald-600" : "bg-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-800 border-transparent"}`}
                    >
                        <Info size={20} strokeWidth={isPanelActive("tentang") ? 2.5 : 2} />
                    </button>

                    <div className="absolute top-1/2 left-full -translate-y-1/2 ml-1 px-3 py-2 bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-none opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        Tentang Sistem
                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45 rounded-none" />
                    </div>
                </div>
            </div>

        </aside>
    );
}