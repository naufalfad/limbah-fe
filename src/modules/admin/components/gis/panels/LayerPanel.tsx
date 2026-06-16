// src/modules/admin/components/gis/panels/LayerPanel.tsx
import React from "react";
import {
    Layers, Settings2, ShieldCheck,
    MapPin, Wind, Droplets
} from "lucide-react";
import { useGisUIStore } from "@/store/useGisUIStore";
import { useSijagaStore } from "@/store/useSijagaStore";
import { cn } from "@/lib/utils";

export default function LayerPanel() {
    const {
        activeLayers, toggleLayer,
        mapOpacity, setMapOpacity,
        maskOpacity, setMaskOpacity, // Kontrol Opacity Masking Luar Wilayah (Clipped)
        activeAdminBoundary, setActiveAdminBoundary
    } = useGisUIStore();

    const { currentUser } = useSijagaStore();
    const isOfficer = currentUser?.role === "PETUGAS_LAPANGAN";

    // 1. Kelompok 1: Klasifikasi Risiko Limbah
    const riskLayers = [
        { id: "layer-amdal", label: "AMDAL", desc: "Pabrik wajib risiko tinggi", color: "bg-red-500" },
        { id: "layer-uklupl", label: "UKL-UPL", desc: "Pabrik wajib risiko menengah", color: "bg-amber-500" },
        { id: "layer-sppl", label: "SPPL", desc: "Pabrik wajib risiko rendah", color: "bg-emerald-500" },
    ];

    // 2. Kelompok 2: Kualitas Udara
    const airLayers = [
        { id: "layer-aqi", label: "Kualitas udara (AQI)", desc: "Telemetri atmosfer real-time", color: "bg-teal-500" },
    ];

    // 3. Kelompok 3: Kualitas Air
    const waterLayers = [
        { id: "layer-river", label: "Aliran sungai (Bogor)", desc: "Jejak geospasial aliran sungai", color: "bg-cyan-400" },
        { id: "layer-water-stations", label: "Stasiun sampel air", desc: "Parameter baku mutu air sungai", color: "bg-blue-600" },
    ];

    return (
        <div className="flex flex-col h-full bg-white pb-10 font-sans text-slate-800">

            {/* HANYA DIAKSES OLEH VERIFIKATOR / AUDITOR / SUPER ADMIN */}
            {!isOfficer && (
                <div className="flex flex-col animate-in fade-in duration-300">

                    {/* --- KATEGORI 1: KLASIFIKASI RISIKO LIMBAH --- */}
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-slate-700 select-none">
                        <ShieldCheck size={13} className="text-emerald-700" />
                        <h4 className="text-xs font-bold text-slate-800">Klasifikasi risiko limbah</h4>
                    </div>
                    <div className="flex flex-col">
                        {riskLayers.map((layer) => {
                            const isActive = activeLayers.includes(layer.id);
                            return (
                                <button
                                    key={layer.id}
                                    onClick={() => toggleLayer(layer.id)}
                                    className="group flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white hover:bg-slate-50/60 transition-colors text-left w-full outline-none"
                                >
                                    <div className="flex items-center gap-3">
                                        {/* KEMBALI KE DESAIN TOGGLE KLASIK (KONTRAK VISUAL JELAS) [3] */}
                                        <div className={`relative inline-flex h-3.5 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${isActive ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <span className={cn("w-2 h-2 rounded-full shrink-0 border border-slate-200", layer.color)} />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-normal text-slate-700 leading-none">{layer.label}</span>
                                                <span className="text-[10px] font-normal text-slate-400 leading-none mt-1">{layer.desc}</span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* --- KATEGORI 2: KUALITAS UDARA --- */}
                    <div className="px-5 py-3 bg-slate-50 border-y border-slate-100 flex items-center gap-2 text-slate-700 select-none">
                        <Wind size={13} className="text-emerald-700" />
                        <h4 className="text-xs font-bold text-slate-800">Kualitas udara</h4>
                    </div>
                    <div className="flex flex-col">
                        {airLayers.map((layer) => {
                            const isActive = activeLayers.includes(layer.id);
                            return (
                                <button
                                    key={layer.id}
                                    onClick={() => toggleLayer(layer.id)}
                                    className="group flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white hover:bg-slate-50/60 transition-colors text-left w-full outline-none"
                                >
                                    <div className="flex items-center gap-3">
                                        {/* KEMBALI KE DESAIN TOGGLE KLASIK (KONTRAK VISUAL JELAS) [3] */}
                                        <div className={`relative inline-flex h-3.5 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${isActive ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <span className={cn("w-2 h-2 rounded-full shrink-0 border border-slate-200", layer.color)} />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-normal text-slate-700 leading-none">{layer.label}</span>
                                                <span className="text-[10px] font-normal text-slate-400 leading-none mt-1">{layer.desc}</span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* --- KATEGORI 3: KUALITAS AIR --- */}
                    <div className="px-5 py-3 bg-slate-50 border-y border-slate-100 flex items-center gap-2 text-slate-700 select-none">
                        <Droplets size={13} className="text-emerald-700" />
                        <h4 className="text-xs font-bold text-slate-800">Kualitas air</h4>
                    </div>
                    <div className="flex flex-col">
                        {waterLayers.map((layer) => {
                            const isActive = activeLayers.includes(layer.id);
                            return (
                                <button
                                    key={layer.id}
                                    onClick={() => toggleLayer(layer.id)}
                                    className="group flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white hover:bg-slate-50/60 transition-colors text-left w-full outline-none"
                                >
                                    <div className="flex items-center gap-3">
                                        {/* KEMBALI KE DESAIN TOGGLE KLASIK (KONTRAK VISUAL JELAS) [3] */}
                                        <div className={`relative inline-flex h-3.5 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${isActive ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <span className={cn("w-2 h-2 rounded-full shrink-0 border border-slate-200", layer.color)} />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-normal text-slate-700 leading-none">{layer.label}</span>
                                                <span className="text-[10px] font-normal text-slate-400 leading-none mt-1">{layer.desc}</span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                </div>
            )}

            {/* SECTION 2: BATAS ADMINISTRASI & SPATIAL ANALYTICS (Flat Seamless) */}
            <div className="flex flex-col mt-0">
                <div className="px-5 py-3 bg-slate-50 border-y border-slate-100 flex items-center gap-2 text-slate-700 select-none">
                    <MapPin size={13} className="text-emerald-700" />
                    <h4 className="text-xs font-bold text-slate-800">Batas wilayah & analitik</h4>
                </div>

                <div className="flex flex-col">
                    <button
                        onClick={() => setActiveAdminBoundary(activeAdminBoundary === 'kecamatan' ? 'none' : 'kecamatan')}
                        className="group flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white hover:bg-slate-50/60 transition-colors text-left w-full outline-none"
                    >
                        <div className="flex items-center gap-3">
                            {/* KEMBALI KE DESAIN TOGGLE KLASIK (KONTRAK VISUAL JELAS) [3] */}
                            <div className={`relative inline-flex h-3.5 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${activeAdminBoundary === 'kecamatan' ? "bg-indigo-500" : "bg-slate-300"}`}>
                                <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${activeAdminBoundary === 'kecamatan' ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                            </div>
                            <div className="flex items-center gap-2.5">
                                <span className="w-2 h-2 rounded-none shrink-0 bg-indigo-500 border border-slate-200" />
                                <div className="flex flex-col">
                                    <span className="text-xs font-normal text-slate-700">Peta kepadatan kecamatan</span>
                                    <span className="text-[10px] font-normal text-slate-400 leading-none mt-1">Agregasi pabrik per wilayah (Bogor)</span>
                                </div>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveAdminBoundary(activeAdminBoundary === 'desa' ? 'none' : 'desa')}
                        className="group flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white hover:bg-slate-50/60 transition-colors text-left w-full outline-none"
                    >
                        <div className="flex items-center gap-3">
                            {/* KEMBALI KE DESAIN TOGGLE KLASIK (KONTRAK VISUAL JELAS) [3] */}
                            <div className={`relative inline-flex h-3.5 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${activeAdminBoundary === 'desa' ? "bg-blue-500" : "bg-slate-300"}`}>
                                <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${activeAdminBoundary === 'desa' ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                            </div>
                            <div className="flex items-center gap-2.5">
                                <span className="w-2 h-2 rounded-none shrink-0 bg-transparent border-2 border-blue-500 border-dashed" />
                                <div className="flex flex-col">
                                    <span className="text-xs font-normal text-slate-700">Garis batas desa</span>
                                    <span className="text-[10px] font-normal text-slate-400 leading-none mt-1">Pemetaan wilayah tingkat kelurahan</span>
                                </div>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* SECTION 3: VISUAL CONTROLS (OPACITY - Flat Seamless) */}
            {!isOfficer && (
                <div className="flex flex-col">
                    <div className="px-5 py-3 bg-slate-50 border-y border-slate-100 flex items-center gap-2 text-slate-700 select-none">
                        <Settings2 size={13} className="text-emerald-700" />
                        <h4 className="text-xs font-bold text-slate-800">Kontrol visual peta</h4>
                    </div>

                    <div className="flex flex-col divide-y divide-slate-100">
                        {/* Slider 1: Poligon/Heatmap Opacity */}
                        <div className="px-5 py-3.5 bg-white space-y-2.5 border-b border-slate-100">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-normal text-slate-700">Transparansi layer aktif</span>
                                <span className="text-[10px] font-normal text-emerald-800 font-mono bg-emerald-50 px-1.5 py-0.5 border border-emerald-100">{mapOpacity}%</span>
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
                        <div className="px-5 py-3.5 bg-white space-y-2.5 border-b border-slate-100">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-normal text-slate-700">Peredupan luar wilayah</span>
                                <span className="text-[10px] font-normal text-slate-800 font-mono bg-slate-100 px-1.5 py-0.5 border border-slate-200">{maskOpacity}%</span>
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