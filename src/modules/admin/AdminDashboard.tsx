import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, ShieldAlert, BarChart3, TrendingUp, Building2,
  Map as MapIcon, ArrowUpRight, Clock, CheckCircle2
} from "lucide-react";

export default function AdminDashboard() {
  return (
    <DashboardLayout role="ADMIN_DLH">
      <div className="space-y-8">

        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
              COMMAND <span className="text-emerald-600 italic">CENTER.</span>
            </h1>
            <p className="text-slate-500 font-medium">Monitoring kepatuhan lingkungan hidup daerah secara realtime.</p>
          </div>
          <Badge className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex gap-2">
            <Clock size={16} /> Update: 12 Menit Lalu
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Total Perusahaan" value="1,280" icon={<Users size={24} />} color="blue" />
          <StatCard label="Antrean Approval" value="42" icon={<ShieldAlert size={24} />} color="amber" />
          <StatCard label="Limbah Terangkut" value="892 Ton" icon={<TrendingUp size={24} />} color="emerald" />
          <StatCard label="EWS Alerts" value="03" icon={<ShieldAlert size={24} />} color="red" />
        </div>

        {/* GIS & Activity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* GIS Preview */}
          <Card className="lg:col-span-2 rounded-[2.5rem] overflow-hidden border-none shadow-xl shadow-slate-200/50">
            <div className="p-8 border-b bg-white flex justify-between items-center">
              <h3 className="font-black text-xl tracking-tight">Geospasial Monitoring</h3>
              <Button variant="ghost" className="text-emerald-600 font-bold">Buka Peta Full <ArrowUpRight size={18} /></Button>
            </div>
            <div className="h-[400px] bg-slate-100 relative group cursor-crosshair">
              <div className="absolute inset-0 bg-[url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')] bg-cover opacity-80 group-hover:scale-105 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
              <div className="absolute top-10 left-10 p-4 bg-white/90 backdrop-blur rounded-2xl border border-white shadow-xl z-10">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Titik Aktif</p>
                <p className="text-2xl font-black text-slate-800 italic">459 Lokasi</p>
              </div>
            </div>
          </Card>

          {/* Recent Registrations */}
          <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 p-8 space-y-6 bg-white">
            <h3 className="font-black text-xl tracking-tight">Registrasi Terbaru</h3>
            <div className="space-y-4">
              <RegItem name="PT. Industri Sejati" type="UKL-UPL" status="Review" />
              <RegItem name="CV. Logam Mulia" type="SPPL" status="Pending" />
              <RegItem name="Klinik Sehat" type="SPPL" status="Review" />
              <RegItem name="Restoran Bintang" type="SPPL" status="Approved" />
            </div>
            <Button className="w-full h-12 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold uppercase tracking-widest text-xs">
              Lihat Semua Antrean
            </Button>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}

// --- SUB COMPONENTS ---

function StatCard({ label, value, icon, color }: any) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600"
  };
  return (
    <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem] p-6 hover:translate-y-[-5px] transition-all bg-white group">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic">{value}</h2>
        </div>
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12", colors[color as keyof typeof colors])}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function RegItem({ name, type, status }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-emerald-50 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-emerald-600">
          <Building2 size={18} />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-800 leading-none">{name}</h4>
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{type}</p>
        </div>
      </div>
      {status === 'Approved' ? <CheckCircle2 className="text-emerald-500" size={18} /> : <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
    </div>
  );
}