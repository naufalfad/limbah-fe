// src/modules/admin/components/gis/panels/LayerPanel.tsx
import React from "react";
import { Layers, Map as MapIcon, Sun, Moon, Info, Settings2, ShieldCheck, Factory, Waves, AlertTriangle } from "lucide-react";
import { useGisUIStore } from "@/store/useGisUIStore";
import { useSijagaStore } from "@/store/useSijagaStore"; // INJEKSI: Mengambil konteks user saat ini

/**
 * LayerPanel - GFW Paradigm (High-Density Data & Solid UI)
 * Menggunakan arsitektur Flush List tanpa margin kontainer internal.
 * Lebar penuh, dipisahkan oleh hairline.
 */
export default function LayerPanel() {
    const {
        activeLayers, toggleLayer,
        mapOpacity, setMapOpacity,
        activeBaseMap, setActiveBaseMap
    } = useGisUIStore();

    const { currentUser } = useSijagaStore(); // Mengambil data pengguna login

    // UI Polymorphism: Sesuaikan terminologi layer pengaduan berdasarkan Otoritas Role (GRASP)
    let complaintLabel = "Aduan Masyarakat";
    let complaintDesc = "Krisis Spasial Warga";

    if (currentUser?.role === "PETUGAS_LAPANGAN") {
        complaintLabel = "Aduan Ditugaskan";
        complaintDesc = "Target Investigasi Anda";
    } else if (currentUser?.role === "AUDITOR") {
        complaintLabel = "Krisis Aduan Daerah";
        complaintDesc = "Pantauan Eksekutif";
    }

    const layerKewajiban = [
        { id: "layer-amdal", label: "AMDAL", desc: "Risiko Tinggi", color: "bg-red-500", icon: ShieldCheck },
        { id: "layer-uklupl", label: "UKL-UPL", desc: "Risiko Menengah", color: "bg-amber-500", icon: ShieldCheck },
        { id: "layer-sppl", label: "SPPL", desc: "Risiko Rendah", color: "bg-emerald-500", icon: ShieldCheck },
        { id: "layer-complaints", label: complaintLabel, desc: complaintDesc, color: "bg-rose-500", icon: AlertTriangle },
    ];

    const layerOverlay = [
        { id: "overlay-das", label: "DAS & Aliran Sungai", desc: "Area Konservasi Air", color: "bg-blue-500", icon: Waves },
        { id: "overlay-rtrw", label: "Zonasi Industri RTRW", desc: "Tata Ruang Wilayah", color: "bg-orange-500", icon: Factory },
    ];

    const baseMaps = [
        { id: "voyager", label: "Carto Voyager", icon: MapIcon, desc: "Peta Vektor Terang (Default)" },
        { id: "satellite", label: "Esri Satellite", icon: Sun, desc: "Citra Satelit Resolusi Tinggi" },
        { id: "osm", label: "OpenStreetMap", icon: MapIcon, desc: "Peta Komunitas Global" },
    ];

    return (
        <div className="flex flex-col h-full bg-white pb-10 font-sans">

            {/* SECTION 1: LAYER KEWAJIBAN & OVERLAY */}
            <div className="flex flex-col">
                {/* Header Section */}
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200 text-slate-500">
                    <Layers size={14} className="text-emerald-700" />
                    <h4 className="text-[11px] font-bold uppercase tracking-wider">Feature Layers</h4>
                </div>

                {/* List Kewajiban (Flush List) */}
                <div className="flex flex-col">
                    {[...layerKewajiban, ...layerOverlay].map((layer, index) => {
                        const isActive = activeLayers.includes(layer.id);
                        // Tambah garis pemisah ekstra jika pindah dari Kewajiban ke Overlay
                        const isSeparator = index === 4; // Bergeser ke index 4 karena layer-complaints nambah di atasnya

                        return (
                            <React.Fragment key={layer.id}>
                                {isSeparator && (
                                    <div className="px-4 py-1.5 bg-slate-50 border-y border-slate-200 mt-2">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Environment Overlay</p>
                                    </div>
                                )}

                                <button
                                    onClick={() => toggleLayer(layer.id)}
                                    className="group flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left w-full outline-none"
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Custom UI Toggle Switch */}
                                        <div className={`relative inline-flex h-3.5 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${isActive ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                        </div>

                                        <div className="flex items-center gap-2.5">
                                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${layer.color} shadow-sm border border-slate-200`} />
                                            <div className="flex flex-col">
                                                <span className={`text-[12px] transition-colors ${isActive ? 'text-emerald-800 font-bold' : 'text-slate-700 font-medium group-hover:text-slate-900'}`}>
                                                    {layer.label}
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-500 leading-none">{layer.desc}</span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* SECTION 2: OPACITY CONTROL */}
            <div className="flex flex-col mt-0 border-t-4 border-slate-100">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Settings2 size={14} className="text-emerald-700" />
                        <h4 className="text-[11px] font-bold uppercase tracking-wider">Opacity Poligon</h4>
                    </div>
                    <span className="text-[10px] font-black text-emerald-800 font-mono bg-emerald-50 px-1.5 py-0.5 border border-emerald-100">
                        {mapOpacity}%
                    </span>
                </div>

                <div className="px-4 py-4 border-b border-slate-200 bg-white space-y-2">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={mapOpacity}
                        onChange={(e) => setMapOpacity(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-none appearance-none cursor-pointer accent-emerald-600 outline-none"
                    />
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>Transparan</span>
                        <span>Solid</span>
                    </div>
                </div>
            </div>

            {/* SECTION 3: BASEMAP GALLERY */}
            <div className="flex flex-col border-t-4 border-slate-100">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200 text-slate-500">
                    <MapIcon size={14} className="text-emerald-700" />
                    <h4 className="text-[11px] font-bold uppercase tracking-wider">Basemap Gallery</h4>
                </div>

                <div className="flex flex-col">
                    {baseMaps.map((map) => {
                        const isActive = activeBaseMap === map.id;
                        return (
                            <button
                                key={map.id}
                                onClick={() => setActiveBaseMap(map.id)}
                                className="group flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left w-full outline-none"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`relative inline-flex h-3.5 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                        <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${isActive ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                    </div>

                                    <div className="flex items-center gap-2.5">
                                        <div className={`transition-colors ${isActive ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-600"}`}>
                                            <map.icon size={16} strokeWidth={2} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-[12px] transition-colors ${isActive ? 'text-emerald-800 font-bold' : 'text-slate-700 font-medium group-hover:text-slate-900'}`}>
                                                {map.label}
                                            </span>
                                            <span className="text-[10px] font-medium text-slate-500 leading-none">{map.desc}</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}