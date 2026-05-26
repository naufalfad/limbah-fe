// src/modules/transport/components/IncomingBids.tsx
import React, { useMemo } from "react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Navigation } from "lucide-react";

interface IncomingBidsProps {
    onSelectRequest: (req: any) => void;
}

export default function IncomingBids({ onSelectRequest }: IncomingBidsProps) {
    const { pickupRequests, currentUser } = useSijagaStore();
    const transporterId = currentUser?.id;

    // Memfilter penugasan berstatus PENDING (menunggu penawaran harga)
    const pendingBids = useMemo(() => {
        return pickupRequests.filter(
            (p) => p.transporterId === transporterId && p.status === "PENDING"
        );
    }, [pickupRequests, transporterId]);

    return (
        <Card className="rounded-none border border-slate-200 shadow-sm bg-white flex flex-col h-full text-left">
            {/* Header Laci */}
            <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">
                    Permintaan Masuk
                </h3>
            </div>

            {/* Flush Inbox List */}
            <div className="flex-1 flex flex-col divide-y divide-slate-150 overflow-y-auto custom-scrollbar">
                {pendingBids.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 p-4 flex flex-col items-center justify-center gap-2">
                        <Clock className="text-slate-200" size={24} />
                        <p className="text-[10px] font-bold uppercase tracking-wider">Belum Ada Order Baru</p>
                    </div>
                ) : (
                    pendingBids.map((pick) => (
                        <div key={pick.id} className="p-4 bg-white hover:bg-slate-50 transition-colors space-y-3">
                            <div className="space-y-1">
                                <span className="font-black text-slate-400 text-[9px] uppercase tracking-widest leading-none block">
                                    {pick.id}
                                </span>
                                <h4 className="font-black text-slate-800 text-xs leading-tight line-clamp-2">
                                    {pick.companyName}
                                </h4>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none">
                                    {pick.wasteType} — {pick.volume}
                                </p>
                            </div>

                            {/* Action Button */}
                            <Button
                                onClick={() => onSelectRequest(pick)}
                                className="w-full bg-slate-900 hover:bg-emerald-600 text-white h-8 rounded-none text-[9px] font-black tracking-widest uppercase shadow-sm"
                            >
                                Beri Penawaran
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}