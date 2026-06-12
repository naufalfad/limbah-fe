// src/modules/admin/components/gis/MapHUD.tsx
import React, { useMemo } from "react";
import { Plus, Minus, Maximize, Map as MapIcon } from "lucide-react";
import { useGisUIStore } from "@/store/useGisUIStore";
import { useSijagaStore } from "@/store/useSijagaStore";
import { cn } from "@/lib/utils";

export default function MapHUD() {
    const { activeLayers } = useGisUIStore();
    const { currentUser } = useSijagaStore();

    const isOfficer = currentUser?.role === "PETUGAS_LAPANGAN";

    // Cek apakah mode layar penuh (AQI atau Sungai) sedang aktif
    const isAqiActive = activeLayers.includes("layer-aqi");
    const isRiverActive = activeLayers.includes("layer-river");

    const triggerZoomIn = () => window.dispatchEvent(new Event('map-zoom-in'));
    const triggerZoomOut = () => window.dispatchEvent(new Event('map-zoom-out'));
    const triggerResetView = () => window.dispatchEvent(new Event('map-reset-view'));

    type LegendItem = {
        label: string;
        color: string;
        shape: 'square' | 'circle' | 'pulsing' | 'line';
    };

    const legendItems = useMemo<LegendItem[]>(() => {
        if (isOfficer) {
            return [
                { label: "Sasaran Audit Rutin DLH", color: "bg-emerald-500", shape: 'circle' },
                { label: "Sidak Lapangan Khusus", color: "bg-rose-500", shape: 'circle' }
            ];
        }

        const items: LegendItem[] = [];

        if (activeLayers.includes("layer-amdal")) {
            items.push({ label: "Wajib AMDAL (Risiko Tinggi)", color: "bg-red-500", shape: 'square' });
        }
        if (activeLayers.includes("layer-uklupl")) {
            items.push({ label: "Wajib UKL-UPL (Menengah)", color: "bg-amber-500", shape: 'square' });
        }
        if (activeLayers.includes("layer-sppl")) {
            items.push({ label: "Wajib SPPL (Risiko Rendah)", color: "bg-emerald-500", shape: 'square' });
        }
        if (activeLayers.includes("layer-water-stations") && !isRiverActive) {
            items.push({ label: "Stasiun Air: Memenuhi Syarat", color: "bg-cyan-500", shape: 'circle' });
            items.push({ label: "Stasiun Air: Tercemar / Kritis", color: "bg-rose-600", shape: 'pulsing' });
        }

        return items;
    }, [activeLayers, isOfficer, isRiverActive]);

    // ======================================================================
    // UX FOCUS MODE: 
    // Jika layer AQI ATAU Sungai aktif, matikan SELURUH HUD Kanan Bawah
    // karena mereka sudah punya Horizontal Legend di tengah bawah layar.
    // ======================================================================
    if (isAqiActive || isRiverActive) {
        return null;
    }

    const hasLegends = legendItems.length > 0;

    return (
        <div className="absolute bottom-8 right-8 z-30 pointer-events-auto flex flex-row items-end gap-4 select-none">
            {hasLegends && (
                <div className="bg-white/90 backdrop-blur border border-slate-300 shadow-sm rounded-none w-56 animate-in fade-in slide-in-from-bottom-4 flex flex-col max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/90 border-b border-slate-200 sticky top-0 z-10 text-left">
                        <MapIcon size={12} className="text-emerald-700" />
                        <h4 className="text-[9px] font-black text-slate-700 uppercase tracking-widest">
                            {isOfficer ? "Legenda Sasaran Tugas" : "Legenda Kepatuhan"}
                        </h4>
                    </div>
                    <div className="flex flex-col">
                        {legendItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 px-3 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50/40 transition-colors">
                                <div className="relative w-3 h-3 shrink-0 flex items-center justify-center">
                                    {item.shape === 'pulsing' && (
                                        <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping", item.color.replace('600', '400'))} />
                                    )}
                                    {item.shape === 'line' ? (
                                        <div className={cn("w-full h-1 rounded-none", item.color)} />
                                    ) : (
                                        <div className={cn("relative w-full h-full shadow-sm", item.shape === 'square' ? "rounded-none border border-slate-200" : "rounded-full border border-white", item.color)} />
                                    )}
                                </div>
                                <span className="text-[10px] font-bold text-slate-650 tracking-tight leading-none text-left">
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col bg-white/90 backdrop-blur border border-slate-300 shadow-none rounded-none overflow-hidden divide-y divide-slate-200 shrink-0">
                <button onClick={triggerZoomIn} className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-colors active:bg-slate-200 rounded-none outline-none">
                    <Plus size={18} strokeWidth={2.5} />
                </button>
                <button onClick={triggerResetView} className="w-10 h-9 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-emerald-700 transition-colors active:bg-slate-200 group rounded-none outline-none">
                    <Maximize size={14} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                </button>
                <button onClick={triggerZoomOut} className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-colors active:bg-slate-200 rounded-none outline-none">
                    <Minus size={18} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}