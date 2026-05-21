import React, { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Building2, Trash2, Map, 
  ShieldCheck, CreditCard, Bell, UserCircle, 
  LogOut, Menu, X, ChevronRight, Search, 
  Settings, Truck, ClipboardList, BarChart4,
  Users, Key, Layers, Activity, AlertTriangle, CheckCircle, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSijagaStore } from "@/store/useSijagaStore";

// --- MENU CONFIG FOR 6 ROLES ---
const MENU_CONFIG = {
  SUPER_ADMIN: [
    { label: "Dashboard", icon: <LayoutDashboard size={20}/>, path: "/super-admin" },
    { label: "Kelola Pengguna", icon: <Users size={20}/>, path: "/super-admin/users" },
    { label: "Payment Gateway", icon: <Key size={20}/>, path: "/super-admin/gateway" },
    { label: "GIS Layers", icon: <Layers size={20}/>, path: "/super-admin/layers" },
    { label: "Audit Logs", icon: <Activity size={20}/>, path: "/super-admin/logs" },
  ],
  ADMIN_DLH: [
    { label: "Overview", icon: <LayoutDashboard size={20}/>, path: "/admin" },
    { label: "Registrasi SPPL/UKL", icon: <ShieldCheck size={20}/>, path: "/admin/registrations" },
    { label: "Monitoring Limbah", icon: <Trash2 size={20}/>, path: "/admin/waste" },
    { label: "GIS Geospasial", icon: <Map size={20}/>, path: "/admin/gis" },
    { label: "Transaksi Jasa", icon: <CreditCard size={20}/>, path: "/admin/payments" },
    { label: "Inspeksi Lapangan", icon: <ClipboardList size={20}/>, path: "/admin/inspections" },
  ],
  PETUGAS_LAPANGAN: [
    { label: "Jadwal Inspeksi", icon: <ClipboardList size={20}/>, path: "/officer/inspections" },
    { label: "Peta GIS Patroli", icon: <Map size={20}/>, path: "/officer/gis" },
  ],
  PERUSAHAAN: [
    { label: "Dashboard", icon: <LayoutDashboard size={20}/>, path: "/company" },
    { label: "Logbook Limbah", icon: <Trash2 size={20}/>, path: "/company/logbook" },
    { label: "Request Pickup", icon: <Truck size={20}/>, path: "/company/pickup" },
    { label: "Pembayaran Digital", icon: <CreditCard size={20}/>, path: "/company/payments" },
    { label: "Dokumen Lingkungan", icon: <ShieldCheck size={20}/>, path: "/company/documents" },
  ],
  PENGANGKUT: [
    { label: "Order Masuk", icon: <Truck size={20}/>, path: "/transporter" },
    { label: "Tracking Armada", icon: <Map size={20}/>, path: "/transporter/tracking" },
  ],
  AUDITOR: [
    { label: "Executive Analytics", icon: <BarChart4 size={20}/>, path: "/auditor" },
    { label: "Geospasial Kepatuhan", icon: <Map size={20}/>, path: "/auditor/gis" },
    { label: "Laporan Kinerja", icon: <ClipboardList size={20}/>, path: "/auditor/performance" },
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
        <p className="font-bold text-slate-500">Redirecting to Login...</p>
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
      case "DANGER": return <AlertTriangle className="text-red-500 shrink-0" size={16} />;
      case "WARNING": return <AlertTriangle className="text-amber-500 shrink-0" size={16} />;
      case "SUCCESS": return <CheckCircle className="text-emerald-500 shrink-0" size={16} />;
      default: return <Info className="text-blue-500 shrink-0" size={16} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* --- SIDEBAR (FIXED HEIGHT) --- */}
      <aside className={cn(
        "bg-slate-900 text-slate-300 transition-all duration-300 border-r border-slate-800 flex flex-col h-screen sticky top-0 z-50",
        sidebarOpen ? "w-72" : "w-20"
      )}>
        
        {/* 1. Logo Section (Static) */}
        <div className="h-20 flex items-center px-6 gap-3 border-b border-slate-800 shrink-0">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20">
            <ShieldCheck size={20} />
          </div>
          {sidebarOpen && (
            <span className="font-black text-xl tracking-tighter text-white italic">
              SIJAGA <span className="text-emerald-500">SYSTEM</span>
            </span>
          )}
        </div>

        {/* 2. Menu Items (Scrollable) */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-hide">
          {menuItems.map((item, i) => {
            const isActive = location.pathname === item.path;
            
            return (
              <Link 
                key={i} 
                to={item.path}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" 
                    : "hover:bg-slate-800 hover:text-white text-slate-400"
                )}
              >
                <div className={cn(
                  "transition-colors",
                  isActive ? "text-white" : "text-slate-500 group-hover:text-emerald-400"
                )}>
                  {item.icon}
                </div>
                {sidebarOpen && <span className="text-sm font-bold tracking-tight">{item.label}</span>}
                
                {isActive && sidebarOpen && (
                  <div className="absolute right-2 w-1.5 h-5 bg-white/40 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* 3. Logout Section (Fixed at Bottom) */}
        <div className="p-4 border-t border-slate-800 shrink-0 bg-slate-900">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 w-full text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all group"
          >
            <LogOut size={20} className="group-hover:rotate-180 transition-transform duration-500" />
            {sidebarOpen && <span className="text-sm font-bold">Keluar Sistem</span>}
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Navbar */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              {sidebarOpen ? <X size={20}/> : <Menu size={20}/>}
            </button>
            <div className="hidden lg:flex items-center bg-slate-100 px-4 py-2 rounded-full gap-2 border border-slate-200">
              <Search size={16} className="text-slate-400" />
              <input type="text" placeholder="Cari data..." className="bg-transparent border-none text-xs font-bold outline-none w-64" />
            </div>

            {/* Multi-Company Selector Dropdown */}
            {currentUser && currentUser.role === "PERUSAHAAN" && (
              <div className="flex items-center gap-2 ml-4 bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5 shadow-sm">
                <Building2 size={16} className="text-emerald-600 font-bold" />
                <select
                  value={selectedCompanyId || ""}
                  onChange={(e) => {
                    if (e.target.value === "ADD_NEW") {
                      navigate("/company/register");
                    } else {
                      setSelectedCompanyId(e.target.value || null);
                    }
                  }}
                  className="bg-transparent text-xs font-black text-slate-800 outline-none cursor-pointer"
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

          <div className="flex items-center gap-6">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  if (!notifOpen) readAllNotifications();
                }}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full relative transition-all"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Overlay Popover */}
              {notifOpen && (
                <div className="absolute right-0 mt-3 w-96 bg-white border border-slate-200 rounded-3xl shadow-2xl z-[999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-5 border-b bg-slate-50/50 flex justify-between items-center">
                    <span className="font-black text-sm text-slate-800">NOTIFIKASI EWS</span>
                    <button 
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-bold text-emerald-600 hover:underline"
                    >
                      Tutup
                    </button>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs font-medium">
                        Tidak ada notifikasi baru
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className={cn("p-4 flex gap-3 text-left transition-colors hover:bg-slate-50", !notif.read && "bg-emerald-50/30")}>
                          {getNotifIcon(notif.type)}
                          <div className="space-y-1">
                            <p className="text-xs font-black text-slate-800 leading-tight">{notif.title}</p>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{notif.message}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(notif.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t bg-slate-50/30 text-center">
                    <button 
                      onClick={() => {
                        readAllNotifications();
                        setNotifOpen(false);
                      }} 
                      className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors"
                    >
                      Tandai Semua Dibaca
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-800 leading-none">{currentUser.name}</p>
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">
                  {getRoleLabel(role)}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-full border-2 border-emerald-500 flex items-center justify-center font-black text-emerald-700 shadow-md shadow-emerald-100">
                {currentUser.name.split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2)}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <section className={cn(
            "flex-1 overflow-y-auto bg-slate-50/50",
            noPadding ? "p-0" : "p-8"
          )}>
            {children}
          </section>
        </main>
      </div>
    </div>
  );
}