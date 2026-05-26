// src/modules/transport/components/ActiveManifests.tsx
import React, { useMemo } from "react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, MapPin, Navigation } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ActiveManifestsProps {
    onStartPickup: (id: string) => void;
    onLoadWaste: (id: string) => void;
    onPreComplete: (req: any) => void;
}

export default function ActiveManifests({
    onStartPickup,
    onLoadWaste,
    onPreComplete,
}: ActiveManifestsProps) {
    const navigate = useNavigate();
    const { pickupRequests, currentUser } = useSijagaStore();
    const transporterId = currentUser?.id;

    // Memfilter order aktif untuk transporter ini (selain PENDING dan COMPLETED)
    const activePickups = useMemo(() => {
        return pickupRequests.filter(
            (p) => p.transporterId === transporterId && p.status !== "PENDING" && p.status !== "COMPLETED"
        );
    }, [pickupRequests, transporterId]);

    const getStatusBadge = (status: string) => {
        const styles: any = {
            PRICED: "bg-blue-50 text-blue-700 border-blue-100",
            PAID: "bg-amber-50 text-amber-700 border-amber-100",
            ON_THE_ROAD: "bg-indigo-50 text-indigo-700 border-indigo-100 animate-pulse",
            LOADED: "bg-purple-50 text-purple-700 border-purple-100",
        };
        const labels: any = {
            PRICED: "Menunggu Bayar",
            PAID: "Perlu Dijemput",
            ON_THE_ROAD: "Di Jalan",
            LOADED: "Limbah Dimuat",
        };
        return (
            <Badge className={cn("rounded-none border text-[8px] font-black uppercase tracking-widest border-none px-2", styles[status])}>
                {labels[status] || status}
            </Badge>
        );
    };

    return (
        <Card className="rounded-none border border-slate-200 shadow-sm bg-white flex flex-col h-full text-left">
            {/* Header Laci */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                <Navigation size={14} className="text-emerald-700" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">
                    Operasional Armada Aktif
                </h3>
            </div>

            {/* Flush List (Bebas dari card tumpuk melengkung) */}
            <div className="flex-1 flex flex-col divide-y divide-slate-150 overflow-y-auto custom-scrollbar">
                {activePickups.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 p-6 flex flex-col items-center justify-center gap-3">
                        <Truck className="text-slate-200" size={32} />
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-700">Armada Garasi</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                Tidak ada penjemputan aktif yang sedang berjalan.
                            </p>
                        </div>
                    </div>
                ) : (
                    activePickups.map((pick) => (
                        <div
                            key={pick.id}
                            className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 transition-colors border-slate-100 text-left"
                        >
                            <div className="space-y-1 overflow-hidden">
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-slate-800 text-xs">{pick.id}</span>
                                    {getStatusBadge(pick.status)}
                                </div>
                                <h4 className="font-black text-slate-800 text-xs leading-none mt-1 truncate max-w-[280px]">
                                    {pick.companyName}
                                </h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{pick.wasteType} — {pick.volume}</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                                    <MapPin size={10} className="shrink-0 text-slate-400" /> {pick.address}
                                </p>
                            </div>

                            {/* Action Buttons (Diet UI: rounded-none h-8 text-[10px]) */}
                            <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0 border-t md:border-none pt-3 md:pt-0">
                                <Button
                                    onClick={() => navigate("/transporter/tracking")}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-none text-[10px] border-slate-300 font-black uppercase tracking-widest"
                                >
                                    Tracking Map
                                </Button>

                                {pick.status === "PAID" && (
                                    <Button
                                        onClick={() => onStartPickup(pick.id)}
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-none h-8 px-3 text-[10px] font-black uppercase tracking-widest shadow-sm"
                                    >
                                        Jalan Jemput
                                    </Button>
                                )}

                                {pick.status === "ON_THE_ROAD" && (
                                    <Button
                                        onClick={() => onLoadWaste(pick.id)}
                                        size="sm"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-none h-8 px-3 text-[10px] font-black uppercase tracking-widest shadow-sm"
                                    >
                                        Muat Limbah
                                    </Button>
                                )}

                                {pick.status === "LOADED" && (
                                    <Button
                                        onClick={() => onPreComplete(pick)}
                                        size="sm"
                                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-none h-8 px-3 text-[10px] font-black uppercase tracking-widest shadow-sm"
                                    >
                                        Selesaikan
                                    </Button>
                                )}

                                {pick.status === "PRICED" && (
                                    <Badge className="bg-blue-50 text-blue-700 border border-blue-100 rounded-none text-[9px] font-black uppercase tracking-widest py-1 px-3">
                                        Tunggu Bayar
                                    </Badge>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}