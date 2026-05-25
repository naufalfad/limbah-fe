// src/components/layouts/DashboardLayout.tsx
import React, { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, Trash2, Map,
  ShieldCheck, CreditCard, Bell, LogOut, Menu, X,
  ChevronRight, Search, Truck, ClipboardList, BarChart4,
  Users, Key, Layers, Activity, AlertTriangle, CheckCircle, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSijagaStore } from "@/store/useSijagaStore";

// --- MENU CONFIG FOR 6 ROLES ---
const MENU_CONFIG = {
  SUPER_ADMIN: [
    { label: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/super-admin" },
    { label: "Kelola Pengguna", icon: <Users size={18} />, path: "/super-admin/users" },
    { label: "Payment Gateway", icon: <Key size={18} />, path: "/super-admin/gateway" },
    { label: "GIS Layers", icon: <Layers size={18} />, path: "/super-admin/layers" },
    { label: "Audit Logs", icon: <Activity size={18} />, path: "/super-admin/logs" },
  ],
  ADMIN_DLH: [
    { label: "Overview", icon: <LayoutDashboard size={18} />, path: "/admin" },
    { label: "Registrasi SPPL/UKL", icon: <ShieldCheck size={18} />, path: "/admin/registrations" },
    { label: "Monitoring Limbah", icon: <Trash2 size={18} />, path: "/admin/waste" },
    { label: "GIS Geospasial", icon: <Map size={18} />, path: "/admin/gis" },
    { label: "Transaksi Jasa", icon: <CreditCard size={18} />, path: "/admin/payments" },
    { label: "Inspeksi Lapangan", icon: <ClipboardList size={18} />, path: "/admin/inspections" },
  ],
  PETUGAS_LAPANGAN: [
    { label: "Jadwal Inspeksi", icon: <ClipboardList size={18} />, path: "/officer/inspections" },
    { label: "Peta GIS Patroli", icon: <Map size={18} />, path: "/officer/gis" },
  ],
  PERUSAHAAN: [
    { label: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/company" },
    { label: "Logbook Limbah", icon: <Trash2 size={18} />, path: "/company/logbook" },
    { label: "Request Pickup", icon: <Truck size={18} />, path: "/company/pickup" },
    { label: "Pembayaran Digital", icon: <CreditCard size={18} />, path: "/company/payments" },
    { label: "Dokumen Lingkungan", icon: <ShieldCheck size={18} />, path: "/company/documents" },
  ],
  PENGANGKUT: [
    { label: "Order Masuk", icon: <Truck size={18} />, path: "/transporter" },
    { label: "Tracking Armada", icon: <Map size={18} />, path: "/transporter/tracking" },
  ],
  AUDITOR: [
    { label: "Executive Analytics", icon: <BarChart4 size={18} />, path: "/auditor" },
    { label: "Geospasial Kepatuhan", icon: <Map size={18} />, path: "/auditor/gis" },
    { label: "Laporan Kinerja", icon: <ClipboardList size={18} />, path: "/auditor/performance" },
  ]
};

export default function DashboardLayout({ children, noPadding = false }: any) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Read state from Zustand
  const { currentUser, logout, notifications, readAllNotifications, selectedCompanyId, setSelectedCompanyId } = useSijagaStore();

  // If no user is logged in, redirect to login page (safeguard)
  React.useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="font-bold text-slate-500 text-sm">Sedang memuat data sesi...</p>
      </div>
    );
  }

  const role = currentUser.role;
  const menuItems = MENU_CONFIG[role as keyof typeof MENU_CONFIG] || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getRoleLabel = (r: string) => {
    const labels: any = {
      SUPER_ADMIN: "SUPER ADMIN",
      ADMIN_DLH: "VERIFIKATOR DLH",
      PETUGAS_LAPANGAN: "PETUGAS LAPANGAN",
      PERUSAHAAN: "PERUSAHAAN",
      PENGANGKUT: "PENGANGKUT LIMBAH",
      AUDITOR: "AUDITOR / PIMPINAN"
    };
    return labels[r] || r;
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "DANGER": return <AlertTriangle className="text-red-500 shrink-0" size={14} />;
      case "WARNING": return <AlertTriangle className="text-amber-500 shrink-0" size={14} />;
      case "SUCCESS": return <CheckCircle className="text-emerald-500 shrink-0" size={14} />;
      default: return <Info className="text-blue-500 shrink-0" size={14} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">

      {/* --- SIDEBAR (DIET WIDTH: w-72 -> w-64) --- */}
      <aside className={cn(
        "bg-slate-900 text-slate-300 transition-all duration-300 flex flex-col h-screen sticky top-0 z-50",
        sidebarOpen ? "w-64" : "w-16"
      )}>

        {/* 1. Logo Section (DIET HEIGHT: h-20 -> h-16) */}
        <div className="h-16 flex items-center px-4 gap-3 border-b border-white/10 shrink-0">
          <div className="w-8 h-8 bg-emerald-600 flex items-center justify-center text-white shrink-0">
            <ShieldCheck size={18} />
          </div>
          {sidebarOpen && (
            <div className="flex flex-col leading-none overflow-hidden">
              <span className="font-black text-lg tracking-tighter text-white whitespace-nowrap">
                PANTAU <span className="text-emerald-500">LIMBAH</span>
              </span>
            </div>
          )}
        </div>

        {/* 2. Menu Items (Flush List style) */}
        <nav className="flex-1 py-4 flex flex-col overflow-y-auto custom-scrollbar">
          {menuItems.map((item, i) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={i}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-colors border-l-[3px] outline-none group",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500"
                    : "text-slate-400 border-transparent hover:bg-slate-800 hover:text-white"
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <div className={cn("transition-colors shrink-0", isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-emerald-400")}>
                  {item.icon}
                </div>
                {sidebarOpen && <span className="text-xs font-bold tracking-wider uppercase truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* 3. Logout Section */}
        <div className="border-t border-white/10 shrink-0 bg-slate-950">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-4 w-full text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors border-l-[3px] border-transparent hover:border-red-500 outline-none"
            title={!sidebarOpen ? "Keluar Sistem" : undefined}
          >
            <LogOut size={18} className="shrink-0" />
            {sidebarOpen && <span className="text-xs font-bold tracking-wider uppercase">Keluar Sistem</span>}
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Navbar (DIET HEIGHT: h-20 -> h-16) */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-slate-100 text-slate-500 transition-colors outline-none">
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div className="hidden lg:flex items-center bg-slate-50 border border-slate-200 px-3 py-1.5 gap-2 transition-colors focus-within:border-emerald-500">
              <Search size={14} className="text-slate-400" />
              <input type="text" placeholder="Cari data..." className="bg-transparent border-none text-xs font-medium outline-none w-64 text-slate-700 placeholder:text-slate-400" />
            </div>

            {/* Multi-Company Selector Dropdown (Sharp Edges) */}
            {currentUser && currentUser.role === "PERUSAHAAN" && (
              <div className="flex items-center gap-2 ml-2 bg-slate-50 border border-slate-200 px-3 py-1.5 shadow-sm">
                <Building2 size={14} className="text-emerald-600 shrink-0" />
                <select
                  value={selectedCompanyId || ""}
                  onChange={(e) => {
                    if (e.target.value === "ADD_NEW") {
                      navigate("/company/register");
                    } else {
                      setSelectedCompanyId(e.target.value || null);
                    }
                  }}
                  className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer w-48 truncate"
                >
                  {currentUser.companies && currentUser.companies.length > 0 ? (
                    currentUser.companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Belum Ada Perusahaan</option>
                  )}
                  <option value="ADD_NEW" className="text-emerald-600 font-bold">+ Registrasi Perusahaan Baru</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  if (!notifOpen) readAllNotifications();
                }}
                className="p-2 hover:bg-slate-100 text-slate-500 relative transition-colors outline-none"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border border-white rounded-none flex items-center justify-center animate-pulse" />
                )}
              </button>

              {/* Notification Overlay Popover (Diet Padding & Corners) */}
              {notifOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 shadow-xl z-[999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b bg-slate-50 flex justify-between items-center">
                    <span className="font-black text-[10px] uppercase tracking-widest text-slate-800">NOTIFIKASI EWS</span>
                    <button
                      onClick={() => setNotifOpen(false)}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 transition-colors"
                    >
                      Tutup
                    </button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs font-medium">
                        Tidak ada notifikasi baru
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className={cn("px-4 py-3 flex gap-3 text-left transition-colors hover:bg-slate-50", !notif.read && "bg-emerald-50/50")}>
                          {getNotifIcon(notif.type)}
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-slate-800 leading-tight">{notif.title}</p>
                            <p className="text-[10px] text-slate-500 font-medium leading-snug">{notif.message}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{new Date(notif.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-2.5 border-t bg-slate-50 text-center">
                    <button
                      onClick={() => {
                        readAllNotifications();
                        setNotifOpen(false);
                      }}
                      className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors"
                    >
                      Tandai Semua Dibaca
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Section (Sharp Edges, Minimalist) */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-800 leading-none uppercase tracking-tight">{currentUser.name}</p>
                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">
                  {getRoleLabel(role)}
                </p>
              </div>
              <div className="w-8 h-8 bg-emerald-100 flex items-center justify-center font-black text-[11px] text-emerald-700">
                {currentUser.name.split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2)}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area (DIET PADDING: p-8 -> p-6) */}
        <main className="flex-1 overflow-hidden flex flex-col bg-slate-50">
          <section className={cn(
            "flex-1 overflow-y-auto custom-scrollbar",
            noPadding ? "p-0" : "p-6"
          )}>
            {children}
          </section>
        </main>
      </div>
    </div>
  );
}