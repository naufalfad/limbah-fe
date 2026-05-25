import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Building2, ShieldCheck, MapPin, Eye, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Map size invalidator helper
function ResizeMap() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function OfficerGISPage() {
  const { companies } = useSijagaStore();
  const navigate = useNavigate();
  const [activeCompany, setActiveCompany] = useState<any>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "REVIEW": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <DashboardLayout role="PETUGAS_LAPANGAN" noPadding={true}>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden text-left relative">
        
        {/* SIDEBAR: COMPANY LIST */}
        <div className="w-full lg:w-96 bg-white border-r flex flex-col h-full z-10">
          <div className="p-6 border-b shrink-0">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Patroli Wilayah</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-2">Sebaran industri & zonasi kepatuhan</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daftar Pelaku Usaha Terdekat</label>
            
            {companies.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCompany(c)}
                className={`w-full p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all ${activeCompany?.id === c.id ? "border-emerald-500 bg-emerald-50/20" : "border-slate-100 hover:bg-slate-50"}`}
              >
                <div className="flex justify-between items-start">
                  <span className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 border flex items-center justify-center shrink-0">
                    <Building2 size={16} />
                  </span>
                  <Badge className={`${getStatusColor(c.status)} border text-[8px] font-black uppercase tracking-wider`}>
                    {c.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-xs leading-none">{c.companyName}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">{c.address}</p>
                </div>
                {c.score && (
                  <div className="flex items-center gap-1 mt-1 text-[10px] font-black text-amber-600">
                    <Star size={12} fill="currentColor" />
                    <span>Skor: {c.score}/100</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* GEOGRAPHIC MAP CONTAINER */}
        <div className="flex-1 h-full bg-slate-100 relative">
          <MapContainer 
            center={[-6.9175, 107.6191]} 
            zoom={13} 
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {companies.map((c) => (
              <Marker 
                key={c.id} 
                position={[parseFloat(c.lat), parseFloat(c.lng)]}
                eventHandlers={{
                  click: () => setActiveCompany(c)
                }}
              >
                <Popup>
                  <div className="text-left font-sans max-w-xs space-y-2 p-1">
                    <div className="flex justify-between items-start gap-3">
                      <h4 className="font-black text-slate-800 text-xs leading-tight">{c.companyName}</h4>
                      <Badge className={`${getStatusColor(c.status)} border text-[8px] font-bold`}>{c.status}</Badge>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal flex items-center gap-1">
                      <MapPin size={10} className="shrink-0" /> {c.address}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Wajib: {c.docType}</p>
                    {c.score && (
                      <p className="text-[10px] text-emerald-600 font-bold">Skor Evaluasi: {c.score}/100</p>
                    )}
                    <Button 
                      onClick={() => navigate("/officer/inspections")}
                      className="bg-emerald-600 hover:bg-emerald-700 h-8 text-[9px] font-black tracking-wider uppercase text-white rounded-lg w-full mt-2"
                    >
                      Audit Kepatuhan
                    </Button>
                  </div>
                </Popup>
              </Marker>
            ))}
            <ResizeMap />
          </MapContainer>
        </div>

      </div>
    </DashboardLayout>
  );
}
