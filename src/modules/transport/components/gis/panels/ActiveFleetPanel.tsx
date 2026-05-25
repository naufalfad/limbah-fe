// src/modules/transport/components/gis/panels/ActiveFleetPanel.tsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { useGisUIStore } from "@/store/useGisUIStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Compass, Navigation, Activity, Thermometer, Play, RotateCcw, Truck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Rute Koordinat Koordinasi dengan Peta
const routePoints: [number, number][] = [
    [-6.9034, 107.6189],
    [-6.9100, 107.6250],
    [-6.9150, 107.6350],
    [-6.9200, 107.6450],
    [-6.9250, 107.6550],
    [-6.9300, 107.6650],
    [-6.9350, 107.6750],
    [-6.9300, 107.6850],
    [-6.9250, 107.6950],
    [-6.9147, 107.6098],
];

export default function ActiveFleetPanel() {
    const { pickupRequests, currentUser } = useSijagaStore();
    const { setSelectedCompanyId } = useGisUIStore();

    const transporterId = currentUser?.transporterId || "TRANS-001";

    // Filter truk penjemputan aktif
    const activeOrders = useMemo(() => {
        return pickupRequests.filter(
            (p) => p.transporterId === transporterId && (p.status === "ON_THE_ROAD" || p.status === "LOADED" || p.status === "PAID")
        );
    }, [pickupRequests, transporterId]);

    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    // Simulation States (Teleskopik Konsol)
    const [routeIndex, setRouteIndex] = useState(0);
    const [isSimulating, setIsSimulating] = useState(false);
    const [speed, setSpeed] = useState(0);
    const [distanceLeft, setDistanceLeft] = useState(12.5);
    const [phVal, setPhVal] = useState(7.2);
    const [tempVal, setTempVal] = useState(28.4);

    const simulationRef = useRef<any | null>(null);

    useEffect(() => {
        if (activeOrders.length > 0 && !selectedOrder) {
            setSelectedOrder(activeOrders[0]);
        }
    }, [activeOrders, selectedOrder]);

    // Sinkronisasi data saat user mematikan simulator/memilih order lain
    useEffect(() => {
        if (selectedOrder) {
            setSelectedCompanyId(selectedOrder.companyId);
        }
    }, [selectedOrder, setSelectedCompanyId]);

    const startSimulation = () => {
        if (isSimulating) return;
        setIsSimulating(true);
        setSpeed(45);
        toast.success("Simulasi GPS & Telemetri Tangki Dimulai");

        let idx = routeIndex;
        simulationRef.current = setInterval(() => {
            if (idx < routePoints.length - 1) {
                idx++;
                setRouteIndex(idx);

                // Mutasi jarak & sensor tangki
                setDistanceLeft((prev) => Math.max(0, parseFloat((prev - 1.25).toFixed(2))));
                setPhVal(parseFloat((7.2 + (Math.random() - 0.5) * 0.4).toFixed(2)));
                setTempVal(parseFloat((28.4 + (Math.random() - 0.5) * 0.8).toFixed(1)));

                // KIRIM SIGNAL EVENT: Mengirim koordinat truk secara real-time ke TrackingMap.tsx di Z-0
                window.dispatchEvent(
                    new CustomEvent("map-truck-update", {
                        detail: {
                            lat: routePoints[idx][0],
                            lng: routePoints[idx][1],
                            order: selectedOrder
                        },
                    })
                );
            } else {
                stopSimulation();
                setSpeed(0);
                setDistanceLeft(0);
                toast.success("Truk telah sampai di tujuan (Pusat Pengolahan Limbah DLH).");
            }
        }, 1500);
    };

    const stopSimulation = () => {
        if (simulationRef.current) {
            clearInterval(simulationRef.current);
        }
        setIsSimulating(false);
        setSpeed(0);
    };

    const resetSimulation = () => {
        stopSimulation();
        setRouteIndex(0);
        setDistanceLeft(12.5);
        setPhVal(7.2);
        setTempVal(28.4);

        // Kirim sinyal reset peta kembali ke start point
        window.dispatchEvent(
            new CustomEvent("map-truck-update", {
                detail: { lat: routePoints[0][0], lng: routePoints[0][1], order: selectedOrder },
            })
        );
        toast.info("Simulasi rute armada berhasil di-reset");
    };

    useEffect(() => {
        return () => {
            if (simulationRef.current) clearInterval(simulationRef.current);
        };
    }, []);

    return (
        <div className="flex flex-col h-full bg-white pb-10">

            {/* SECTION 1: ACTIVE FLEET LIST (DENSE) */}
            <div className="flex flex-col">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Order Aktif</span>
                </div>

                {activeOrders.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                        <p className="text-[10px] font-bold uppercase tracking-widest">Tidak Ada Tugas Jalan</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {activeOrders.map((ord) => {
                            const isActive = selectedOrder?.id === ord.id;
                            return (
                                <button
                                    key={ord.id}
                                    onClick={() => setSelectedOrder(ord)}
                                    className={cn(
                                        "w-full p-4 border-b border-slate-200 text-left flex flex-col gap-1 transition-all outline-none rounded-none",
                                        isActive
                                            ? "bg-emerald-50/30 border-l-[3px] border-l-emerald-600"
                                            : "bg-white border-l-[3px] border-l-transparent hover:bg-slate-50"
                                    )}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-black text-slate-800 text-[10px] uppercase tracking-widest">{ord.id}</span>
                                        <Badge className="bg-slate-900 text-white rounded-none border-none text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5">
                                            {ord.plateNo || "D 1234 DLH"}
                                        </Badge>
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-xs leading-none mt-1 truncate">{ord.companyName}</h4>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{ord.wasteType} ({ord.volume})</p>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {selectedOrder && (
                <div className="p-4 space-y-6">

                    {/* SECTION 2: SIMULATOR GPS (Diet UI) */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Simulator GPS</label>
                        <div className="flex gap-2">
                            {isSimulating ? (
                                <Button
                                    onClick={stopSimulation}
                                    size="sm"
                                    className="bg-amber-500 hover:bg-amber-600 font-bold rounded-none text-[10px] tracking-widest uppercase h-9 flex-1 shadow-sm"
                                >
                                    Pause GPS
                                </Button>
                            ) : (
                                <Button
                                    onClick={startSimulation}
                                    disabled={routeIndex === routePoints.length - 1}
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-none text-[10px] tracking-widest uppercase h-9 flex-1 gap-1.5 shadow-sm animate-pulse"
                                >
                                    <Play size={12} /> Mulai Simulasi
                                </Button>
                            )}
                            <Button
                                onClick={resetSimulation}
                                variant="outline"
                                size="sm"
                                className="rounded-none h-9 border-slate-300 text-slate-500 hover:bg-slate-50 active:scale-95 transition-all"
                            >
                                <RotateCcw size={14} />
                            </Button>
                        </div>
                    </div>

                    {/* SECTION 3: TACTICAL INSTRUMENT CONSOLE (Borderless Grid) */}
                    <div className="space-y-2 text-left">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Telemetri Real-time</label>

                        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 border border-slate-200 bg-slate-50/30 text-left rounded-none">

                            {/* Kecepatan */}
                            <div className="p-3.5 flex flex-col justify-between">
                                <div className="flex justify-between items-center text-slate-400">
                                    <Compass size={12} />
                                    <span className="text-[8px] font-black uppercase tracking-widest">KECEPATAN</span>
                                </div>
                                <span className="text-base font-black text-slate-800 tracking-tight mt-1.5 font-mono leading-none">{speed} KM/H</span>
                            </div>

                            {/* Sisa Jarak */}
                            <div className="p-3.5 flex flex-col justify-between border-t-0">
                                <div className="flex justify-between items-center text-slate-400">
                                    <Navigation size={12} />
                                    <span className="text-[8px] font-black uppercase tracking-widest">SISA JARAK</span>
                                </div>
                                <span className="text-base font-black text-slate-800 tracking-tight mt-1.5 font-mono leading-none">{distanceLeft} KM</span>
                            </div>

                            {/* Sensor pH */}
                            <div className="p-3.5 flex flex-col justify-between">
                                <div className="flex justify-between items-center text-slate-400">
                                    <Activity size={12} />
                                    <span className="text-[8px] font-black uppercase tracking-widest">SENSOR PH</span>
                                </div>
                                <span className="text-base font-black text-emerald-600 tracking-tight mt-1.5 font-mono leading-none">{phVal} pH</span>
                            </div>

                            {/* Suhu Tangki */}
                            <div className="p-3.5 flex flex-col justify-between">
                                <div className="flex justify-between items-center text-slate-400">
                                    <Thermometer size={12} />
                                    <span className="text-[8px] font-black uppercase tracking-widest">SUHU TANGKI</span>
                                </div>
                                <span className="text-base font-black text-slate-800 tracking-tight mt-1.5 font-mono leading-none">{tempVal} °C</span>
                            </div>

                        </div>
                    </div>

                    {/* EWS Warning Status */}
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-none flex gap-3 text-left select-none">
                        <Activity className="text-emerald-600 shrink-0 mt-0.5 animate-pulse" size={14} />
                        <div>
                            <h5 className="text-[9px] font-black uppercase tracking-widest text-emerald-950 leading-none">Sensor Normal</h5>
                            <p className="text-[9px] text-emerald-700 leading-normal mt-1 font-medium">
                                Parameter tangki B3 dalam kondisi stabil. Data pH terkirim ke dinas untuk mencegah kebocoran kimia.
                            </p>
                        </div>
                    </div>

                </div>
            )}

        </div>
    );
}