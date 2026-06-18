// src/modules/admin/AdminDashboard.tsx
import React, { useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSijagaStore } from '@/store/useSijagaStore';
import { useNavigate } from 'react-router-dom';
import {
  Users, ShieldAlert, TrendingUp, Building2,
  Map as MapIcon, ArrowUpRight, Clock, CheckCircle2, XCircle
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- Fix Leaflet Default Marker Icons (Vite Bundler Safety) ---
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    companies,
    wasteLogs,
    notifications,
    fetchCompanies,
    fetchWasteLogs,
    fetchNotifications,
    fetchPickupRequests
  } = useSijagaStore();

  useEffect(() => {
    fetchCompanies();
    fetchWasteLogs();
    fetchNotifications();
    fetchPickupRequests();
  }, [fetchCompanies, fetchWasteLogs, fetchNotifications, fetchPickupRequests]);

  const totalPerusahaan = companies.length;
  const antreanApproval = companies.filter(c => c.status === "PENDING" || c.status === "REVIEW").length;
  const totalVolumeLimbah = wasteLogs.reduce((sum, log) => sum + log.volume, 0);
  const activeAlerts = notifications.filter(n => n.type === "DANGER" || n.type === "WARNING").length;
  const titikAktif = companies.filter(c => c.status === "APPROVED").length;
  const recentRegistrations = [...companies].reverse().slice(0, 4);

  return (
    <DashboardLayout role="ADMIN_DLH">
      <div className="space-y-6 text-left"> {/* DIET: space-y-8 -> space-y-6 */}

        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
              Command <span className="text-emerald-600">Center.</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1.5">Monitoring kepatuhan lingkungan hidup daerah secara realtime.</p>
          </div>
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1.5 rounded-none flex items-center gap-1.5 shadow-sm">
            <Clock size={14} /> <span className="text-[10px]">Live Synchronized</span>
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Perusahaan" value={totalPerusahaan.toLocaleString()} icon={<Users size={20} />} color="blue" />
          <StatCard label="Antrean Approval" value={antreanApproval.toLocaleString()} icon={<ShieldAlert size={20} />} color="amber" />
          <StatCard label="Volume Limbah" value={`${totalVolumeLimbah.toLocaleString()} L`} icon={<TrendingUp size={20} />} color="emerald" />
          <StatCard label="EWS Alerts" value={String(activeAlerts).padStart(2, '0')} icon={<ShieldAlert size={20} />} color="red" />
        </div>

        {/* GIS & Activity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* GIS Preview (GFW TACTICAL MAP CONTAINER) */}
          <Card className="lg:col-span-2 rounded-none border border-slate-200 shadow-sm flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MapIcon size={16} className="text-emerald-600" />
                <h3 className="font-bold text-sm tracking-tight uppercase text-slate-800">Geospasial Monitoring</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-emerald-600 font-bold rounded-none h-8 text-[10px]"
                onClick={() => navigate('/admin/gis')}
              >
                BUKA PETA <ArrowUpRight size={14} className="ml-1" />
              </Button>
            </div>

            <div className="h-[300px] bg-slate-100 relative group overflow-hidden rounded-none z-10">
              {/* Map Container Mini-Preview Taktis (MODIFIED FASE 2 - SINKRON BOGOR) [3] */}
              <MapContainer
                center={[-6.4816, 106.8560]} // SINKRONISASI BOGOR: Diubah ke Cibinong [3]
                zoom={11} // Diubah ke zoom level 11 agar pas melihat luasan Bogor [3]
                className="w-full h-full rounded-none"
                zoomControl={false}
                scrollWheelZoom={false}
                dragging={false}
                doubleClickZoom={false}
              >
                <ResizeMap />
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {companies
                  .filter(c => c.status === "APPROVED" && c.lat && c.lng)
                  .map(c => (
                    <Marker key={c.id} position={[parseFloat(c.lat), parseFloat(c.lng)]} />
                  ))}
              </MapContainer>

              {/* Klik Interseptor */}
              <div
                className="absolute inset-0 bg-transparent cursor-pointer z-[1000] group-hover:bg-slate-900/5 transition-colors"
                onClick={() => navigate('/admin/gis')}
              />

              {/* Overlay Gradient Taktis */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-900/30 to-transparent pointer-events-none z-[1000]" />

              {/* Kotak Status Kepatuhan Spasial (GFW Sharp Style) */}
              <div className="absolute bottom-4 left-4 p-3 bg-white/95 backdrop-blur rounded-none border border-slate-200 shadow-none z-[1010] pointer-events-none">
                <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest leading-none">Titik Aktif</p>
                <p className="text-xl font-black text-emerald-700 leading-none mt-1">{titikAktif} Lokasi</p>
              </div>
            </div>
          </Card>

          {/* Recent Registrations - DIET: Flush List Style */}
          <Card className="rounded-none border border-slate-200 shadow-sm bg-white flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-sm tracking-tight uppercase text-slate-800">Registrasi Terbaru</h3>
            </div>
            <div className="flex-1 flex flex-col">
              {recentRegistrations.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-xs font-bold text-slate-400">Belum ada registrasi berkas.</p>
                </div>
              ) : (
                recentRegistrations.map((c) => (
                  <RegItem
                    key={c.id}
                    name={c.companyName}
                    type={c.docType === "UKL_UPL" ? "UKL-UPL" : c.docType}
                    status={c.status}
                  />
                ))
              )}
            </div>
            <div className="p-3 border-t border-slate-200 bg-slate-50">
              <Button
                variant="outline"
                className="w-full rounded-none border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-emerald-700 font-bold uppercase tracking-widest text-[10px] h-9"
                onClick={() => navigate('/admin/registrations')}
              >
                Lihat Semua Antrean
              </Button>
            </div>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}

// --- SUB COMPONENTS ---

function StatCard({ label, value, icon, color }: any) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    red: "bg-red-50 text-red-600 border-red-100"
  };
  return (
    <Card className="rounded-none border border-slate-200 shadow-sm p-4 bg-white flex justify-between items-start hover:border-emerald-300 transition-colors">
      <div className="space-y-1">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{value}</h2>
      </div>
      <div className={cn("w-10 h-10 border flex items-center justify-center shrink-0", colors[color as keyof typeof colors])}>
        {icon}
      </div>
    </Card>
  );
}

function RegItem({ name, type, status }: any) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-b-0">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-8 h-8 bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 text-slate-500">
          <Building2 size={14} />
        </div>
        <div className="truncate">
          <h4 className="text-[11px] font-black text-slate-800 leading-tight truncate">{name}</h4>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{type}</p>
        </div>
      </div>
      <div className="shrink-0 pl-2">
        {status === 'APPROVED' ? (
          <CheckCircle2 className="text-emerald-500" size={16} />
        ) : status === 'REJECTED' ? (
          <XCircle className="text-rose-500" size={16} />
        ) : (
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse mr-1" />
        )}
      </div>
    </div>
  );
}