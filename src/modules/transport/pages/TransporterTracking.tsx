import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { 
  Truck, Navigation, Activity, Thermometer, 
  AlertCircle, Compass, Play, RotateCcw, ShieldAlert 
} from "lucide-react";
import { toast } from "sonner";

// Fix leaflet icon issue in react-leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom truck icon representation
const truckSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#059669" width="32" height="32" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
  <circle cx="5.5" cy="18.5" r="2.5" />
  <circle cx="18.5" cy="18.5" r="2.5" />
</svg>
`;

const TruckIcon = L.divIcon({
  html: truckSvg,
  className: "truck-leaflet-icon",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function TransporterTracking() {
  const { pickupRequests } = useSijagaStore();
  const activeOrders = pickupRequests.filter(p => p.status === "ON_THE_ROAD" || p.status === "LOADED" || p.status === "PAID");

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Simulation Coordinates (From Coblong to Rancaekek)
  const routePoints: L.LatLngTuple[] = [
    [-6.9034, 107.6189], // Coblong
    [-6.9100, 107.6250],
    [-6.9150, 107.6350],
    [-6.9200, 107.6450],
    [-6.9250, 107.6550],
    [-6.9300, 107.6650],
    [-6.9350, 107.6750],
    [-6.9300, 107.6850],
    [-6.9250, 107.6950],
    [-6.9147, 107.6098], // Destination (Cicadas Facility)
  ];

  const [truckPos, setTruckPos] = useState<[number, number]>([-6.9034, 107.6189]);
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

  const startSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSpeed(45);
    toast.success("Simulasi GPS Armada Dimulai");

    let idx = routeIndex;
    simulationRef.current = setInterval(() => {
      if (idx < routePoints.length - 1) {
        idx++;
        setRouteIndex(idx);
        setTruckPos([routePoints[idx][0], routePoints[idx][1]]);
        
        // Decrement distance left
        setDistanceLeft(prev => Math.max(0, parseFloat((prev - 1.25).toFixed(2))));
        
        // Mock sensors fluctuation slightly
        setPhVal(parseFloat((7.2 + (Math.random() - 0.5) * 0.4).toFixed(2)));
        setTempVal(parseFloat((28.4 + (Math.random() - 0.5) * 0.8).toFixed(1)));
      } else {
        stopSimulation();
        setSpeed(0);
        setDistanceLeft(0);
        toast.success("Armada telah sampai di lokasi tujuan (Pusat Pengolahan Limbah DLH).");
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
    setTruckPos([routePoints[0][0], routePoints[0][1]]);
    setDistanceLeft(12.5);
    setPhVal(7.2);
    setTempVal(28.4);
    toast.info("Simulasi rute armada di-reset");
  };

  useEffect(() => {
    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, []);

  return (
    <DashboardLayout role="PENGANGKUT" noPadding={true}>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden text-left relative">
        
        {/* LEFT PANEL: FLEET SELECTION & CONTROLLER */}
        <div className="w-full lg:w-96 bg-white border-r flex flex-col h-full z-10">
          
          <div className="p-6 border-b shrink-0">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Tracking Armada</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-2">Simulasi live GPS & sensor B3</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Active Truck Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih Order Aktif</label>
              
              {activeOrders.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Tidak ada armada bertugas di jalan.</p>
              ) : (
                activeOrders.map((ord) => (
                  <button
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className={`w-full p-4 rounded-2xl border text-left flex flex-col gap-1.5 transition-all ${selectedOrder?.id === ord.id ? "border-emerald-500 bg-emerald-50/20" : "border-slate-100 hover:bg-slate-50"}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-800 text-xs">{ord.id}</span>
                      <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-black">
                        {ord.plateNo || "D 1234 DLH"}
                      </Badge>
                    </div>
                    <h4 className="font-bold text-slate-800 text-xs leading-none">{ord.companyName}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{ord.wasteType} ({ord.volume})</p>
                  </button>
                ))
              )}
            </div>

            {selectedOrder && (
              <div className="border-t pt-6 space-y-6">
                
                {/* Simulation Control buttons */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Simulator GPS</label>
                  <div className="flex gap-2">
                    {isSimulating ? (
                      <Button 
                        onClick={stopSimulation} 
                        className="bg-amber-500 hover:bg-amber-600 font-bold rounded-xl text-xs h-11 flex-1 gap-2"
                      >
                        Pause GPS
                      </Button>
                    ) : (
                      <Button 
                        onClick={startSimulation}
                        disabled={routeIndex === routePoints.length - 1}
                        className="bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl text-xs h-11 flex-1 gap-2 shadow-md shadow-emerald-50"
                      >
                        <Play size={14} /> Mulai Simulasi
                      </Button>
                    )}
                    <Button 
                      onClick={resetSimulation} 
                      variant="outline" 
                      className="rounded-xl h-11 border-slate-200"
                    >
                      <RotateCcw size={16} />
                    </Button>
                  </div>
                </div>

                {/* Live Telemetry Info */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telemetri Real-time</label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    
                    <div className="p-3 bg-slate-50 border rounded-2xl flex flex-col justify-between">
                      <div className="flex justify-between items-center text-slate-400">
                        <Compass size={14} />
                        <span className="text-[9px] font-bold">KECEPATAN</span>
                      </div>
                      <span className="text-lg font-black text-slate-800 tracking-tight mt-2">{speed} km/h</span>
                    </div>

                    <div className="p-3 bg-slate-50 border rounded-2xl flex flex-col justify-between">
                      <div className="flex justify-between items-center text-slate-400">
                        <Navigation size={14} />
                        <span className="text-[9px] font-bold">SISA JARAK</span>
                      </div>
                      <span className="text-lg font-black text-slate-800 tracking-tight mt-2">{distanceLeft} km</span>
                    </div>

                    <div className="p-3 bg-slate-50 border rounded-2xl flex flex-col justify-between">
                      <div className="flex justify-between items-center text-slate-400">
                        <Activity size={14} />
                        <span className="text-[9px] font-bold">SENSOR PH</span>
                      </div>
                      <span className="text-lg font-black text-emerald-600 tracking-tight mt-2">{phVal} pH</span>
                    </div>

                    <div className="p-3 bg-slate-50 border rounded-2xl flex flex-col justify-between">
                      <div className="flex justify-between items-center text-slate-400">
                        <Thermometer size={14} />
                        <span className="text-[9px] font-bold">SUHU TANGKI</span>
                      </div>
                      <span className="text-lg font-black text-slate-800 tracking-tight mt-2">{tempVal} °C</span>
                    </div>

                  </div>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3 text-left">
                  <Activity className="text-emerald-600 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h5 className="text-[10px] font-black text-emerald-950 uppercase leading-none">Sensor Normal</h5>
                    <p className="text-[9px] text-emerald-700 leading-tight mt-1">
                      Parameter tangki B3 dalam kondisi stabil. Data pH terkirim ke dinas untuk mencegah kebocoran kimia.
                    </p>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* MAP PANEL */}
        <div className="flex-1 h-full bg-slate-100 relative">
          <MapContainer 
            center={[-6.9034, 107.6189]} 
            zoom={13} 
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Draw Path Polyline */}
            <Polyline positions={routePoints} color="#059669" weight={4} dashArray="5, 10" />

            {/* Truck Marker moving */}
            <Marker position={truckPos} icon={TruckIcon}>
              <Popup>
                <div className="text-left font-sans">
                  <h4 className="font-bold text-slate-800">Armada Transporter</h4>
                  <p className="text-xs text-slate-500">Plate: {selectedOrder?.plateNo || "D 1234 DLH"}</p>
                  <p className="text-xs font-black text-emerald-600 mt-1">Status: {speed > 0 ? "Berjalan" : "Berhenti"}</p>
                </div>
              </Popup>
            </Marker>

            {/* Start Marker */}
            <Marker position={[-6.9034, 107.6189]}>
              <Popup>
                <div className="text-left">
                  <h4 className="font-bold text-slate-800">Titik Muat Limbah</h4>
                  <p className="text-xs text-slate-500">{selectedOrder?.companyName}</p>
                </div>
              </Popup>
            </Marker>

            {/* End Marker */}
            <Marker position={[-6.9147, 107.6098]}>
              <Popup>
                <div className="text-left">
                  <h4 className="font-bold text-slate-800">Pusat Pengolahan Limbah</h4>
                  <p className="text-xs text-slate-500">TPA / IPAL Daerah</p>
                </div>
              </Popup>
            </Marker>

            <MapCenterUpdater pos={truckPos} />
          </MapContainer>
        </div>

      </div>
    </DashboardLayout>
  );
}

// Map helper to center on truck position
function MapCenterUpdater({ pos }: { pos: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(pos);
  }, [pos, map]);
  return null;
}
