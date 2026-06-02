// src/modules/admin/components/gis/panels/LayerPanel.tsx
import React from "react";
import {
    Layers, Settings2, ShieldCheck,
    AlertTriangle, MapPin, Wind
} from "lucide-react";
import { useGisUIStore } from "@/store/useGisUIStore";
import { useSijagaStore } from "@/store/useSijagaStore";

/**
 * LayerPanel - GFW Paradigm (High-Density Data & Solid UI)
 * Murni mengelola Feature Layers & Administratif. 
 * Basemap & Overlay yang tidak relevan telah di-decouple ke laci terpisah (BasemapPanel).
 */
export default function LayerPanel() {
    const {
        activeLayers, toggleLayer,
        mapOpacity, setMapOpacity,
        maskOpacity, setMaskOpacity, // INJEKSI FASE 4: Kontrol Opacity Masking Luar Wilayah
        activeAdminBoundary, setActiveAdminBoundary
    } = useGisUIStore();

    const { currentUser } = useSijagaStore();
    const isOfficer = currentUser?.role === "PETUGAS_LAPANGAN";

    let complaintLabel = "Aduan Masyarakat";
    let complaintDesc = "Krisis Spasial Warga";

    if (isOfficer) {
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
        { id: "layer-aqi", label: "Kualitas Udara (AQI)", desc: "Telemetri Udara Real-time", color: "bg-teal-500", icon: Wind },
        { id: "layer-complaints", label: complaintLabel, desc: complaintDesc, color: "bg-rose-500", icon: AlertTriangle },
    ];

    return (
        <div className="flex flex-col h-full bg-white pb-10 font-sans">

            {/* SECTION 1: FEATURE LAYERS */}
            {!isOfficer && (
                <div className="flex flex-col animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200 text-slate-500">
                        <Layers size={14} className="text-emerald-700" />
                        <h4 className="text-[11px] font-bold uppercase tracking-wider">Feature Layers</h4>
                    </div>

                    <div className="flex flex-col">
                        {layerKewajiban.map((layer) => {
                            const isActive = activeLayers.includes(layer.id);

                            return (
                                <button
                                    key={layer.id}
                                    onClick={() => toggleLayer(layer.id)}
                                    className="group flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left w-full outline-none"
                                >
                                    <div className="flex items-center gap-3">
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
                            );
                        })}
                    </div>
                </div>
            )}

            {/* SECTION 2: BATAS ADMINISTRASI & SPATIAL ANALYTICS */}
            <div className="flex flex-col mt-0 border-t-4 border-slate-100">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200 text-slate-500">
                    <MapPin size={14} className="text-emerald-700" />
                    <h4 className="text-[11px] font-bold uppercase tracking-wider">Batas Wilayah & Analitik</h4>
                </div>

                <div className="flex flex-col">
                    <button
                        onClick={() => setActiveAdminBoundary(activeAdminBoundary === 'kecamatan' ? 'none' : 'kecamatan')}
                        className="group flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left w-full outline-none"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`relative inline-flex h-3.5 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${activeAdminBoundary === 'kecamatan' ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                                <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${activeAdminBoundary === 'kecamatan' ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                            </div>
                            <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-none shrink-0 bg-indigo-500 shadow-sm border border-slate-200" />
                                <div className="flex flex-col">
                                    <span className={`text-[12px] transition-colors ${activeAdminBoundary === 'kecamatan' ? 'text-indigo-800 font-bold' : 'text-slate-700 font-medium group-hover:text-slate-900'}`}>
                                        Peta Kepadatan Kecamatan
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-500 leading-none">Agregasi pabrik per wilayah (Kotim)</span>
                                </div>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveAdminBoundary(activeAdminBoundary === 'desa' ? 'none' : 'desa')}
                        className="group flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left w-full outline-none"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`relative inline-flex h-3.5 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${activeAdminBoundary === 'desa' ? 'bg-blue-500' : 'bg-slate-300'}`}>
                                <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${activeAdminBoundary === 'desa' ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                            </div>
                            <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-none shrink-0 bg-transparent border-2 border-blue-500 border-dashed" />
                                <div className="flex flex-col">
                                    <span className={`text-[12px] transition-colors ${activeAdminBoundary === 'desa' ? 'text-blue-800 font-bold' : 'text-slate-700 font-medium group-hover:text-slate-900'}`}>
                                        Garis Batas Desa
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-500 leading-none">Pemetaan wilayah tingkat kelurahan</span>
                                </div>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* SECTION 3: VISUAL CONTROLS (OPACITY) */}
            {!isOfficer && (
                <div className="flex flex-col mt-0 border-t-4 border-slate-100 animate-in fade-in duration-350">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200 text-slate-500">
                        <Settings2 size={14} className="text-emerald-700" />
                        <h4 className="text-[11px] font-bold uppercase tracking-wider">Kontrol Visual Peta</h4>
                    </div>

                    <div className="flex flex-col divide-y divide-slate-100">
                        {/* Slider 1: Poligon/Heatmap Opacity */}
                        <div className="px-4 py-3 bg-white space-y-2.5">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Opacity Layer Aktif</span>
                                <span className="text-[9px] font-black text-emerald-800 font-mono bg-emerald-50 px-1.5 py-0.5 border border-emerald-100">{mapOpacity}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={mapOpacity}
                                onChange={(e) => setMapOpacity(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-slate-200 rounded-none appearance-none cursor-pointer accent-emerald-600 outline-none"
                            />
                        </div>

                        {/* Slider 2: Masking Opacity (Area Luar) */}
                        <div className="px-4 py-3 border-b border-slate-200 bg-white space-y-2.5">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Masking Luar Wilayah</span>
                                <span className="text-[9px] font-black text-slate-800 font-mono bg-slate-100 px-1.5 py-0.5 border border-slate-200">{maskOpacity}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={maskOpacity}
                                onChange={(e) => setMaskOpacity(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-slate-200 rounded-none appearance-none cursor-pointer accent-slate-800 outline-none"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}