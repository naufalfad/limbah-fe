// src/modules/admin/components/gis/panels/BasemapPanel.tsx
import React from "react";
import { Map as MapIcon, Sun, Moon, Layers, Info } from "lucide-react";
import { useGisUIStore } from "@/store/useGisUIStore";

/**
 * BasemapPanel - GFW Paradigm (High-Density Data & Solid UI)
 * Komponen terisolasi khusus mengatur kanvas peta dasar.
 * Memisahkan logika ini dari LayerPanel meningkatkan kohesi arsitektur.
 */
export default function BasemapPanel() {
    const { activeBaseMap, setActiveBaseMap } = useGisUIStore();

    // 5 Standar Peta Dasar
    const baseMaps = [
        { id: "dark", label: "Carto Dark", icon: Moon, desc: "Kanvas Gelap (Mode Optimal AQI)" },
        { id: "satellite", label: "Google Satellite", icon: Sun, desc: "Citra Satelit Resolusi Tinggi" },
        { id: "street", label: "Google Roadmap", icon: MapIcon, desc: "Navigasi Jalan & Fasilitas" },
        { id: "esri", label: "Esri World Imagery", icon: MapIcon, desc: "Citra Satelit Alternatif" },
        { id: "osm", label: "OpenStreetMap", icon: Layers, desc: "Peta Komunitas Global" },
    ];

    return (
        <div className="flex flex-col h-full bg-white pb-10 font-sans">

            {/* HEADER INFORMASI */}
            <div className="px-4 py-3 bg-emerald-50/50 border-b border-slate-200 flex items-start gap-2.5 text-left">
                <MapIcon size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                    Ubah kanvas peta dasar sesuai kebutuhan pengamatan spasial Anda.
                    <strong className="text-slate-800 font-bold"> Carto Dark</strong> direkomendasikan untuk melihat persebaran Kualitas Udara (AQI).
                </p>
            </div>

            {/* LIST BASEMAP (FLUSH LIST) */}
            <div className="flex flex-col">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200 text-slate-500 text-left">
                    <Layers size={14} className="text-emerald-700" />
                    <h4 className="text-[11px] font-bold uppercase tracking-wider">Katalog Peta Dasar</h4>
                </div>

                <div className="flex flex-col">
                    {baseMaps.map((map) => {
                        const isActive = activeBaseMap === map.id;

                        return (
                            <button
                                key={map.id}
                                onClick={() => setActiveBaseMap(map.id)}
                                className="group flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left w-full outline-none"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Custom UI Toggle Switch */}
                                    <div className={`relative inline-flex h-3.5 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                        <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${isActive ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                    </div>

                                    <div className="flex items-center gap-2.5">
                                        {/* Ikon Dinamis */}
                                        <div className={`transition-colors ${isActive ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-600"}`}>
                                            <map.icon size={16} strokeWidth={2} />
                                        </div>

                                        {/* Label Tipografi Rapat */}
                                        <div className="flex flex-col">
                                            <span className={`text-[12px] transition-colors ${isActive ? 'text-emerald-800 font-bold' : 'text-slate-700 font-medium group-hover:text-slate-900'}`}>
                                                {map.label}
                                            </span>
                                            <span className="text-[10px] font-medium text-slate-500 leading-none mt-0.5">{map.desc}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-1 hover:bg-slate-200 rounded-none transition-colors" title="Informasi Peta Dasar">
                                    <Info size={14} className="text-slate-400 group-hover:text-emerald-600" />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}