import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, Users, ShieldAlert, Key, 
  Map as MapIcon, Activity, Trash2, CheckCircle2,
  Lock, RefreshCw, Eye, Database, Globe, Search, Download
} from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Circle, FeatureGroup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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

export default function SuperAdminPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { auditLogs, addAuditLog, currentUser } = useSijagaStore();
  
  // Dynamic Tab matching
  const activeTab = tab || "overview";

  // Mock states
  const [sandboxMode, setSandboxMode] = useState(true);
  const [riverLayer, setRiverLayer] = useState(() => {
    const saved = localStorage.getItem("sijaga_river_layer");
    return saved !== null ? saved === "true" : true;
  });
  const [industrialLayer, setIndustrialLayer] = useState(() => {
    const saved = localStorage.getItem("sijaga_industrial_layer");
    return saved !== null ? saved === "true" : true;
  });
  const [selectedGateway, setSelectedGateway] = useState<"XENDIT" | "MIDTRANS">("XENDIT");

  const handleSetRiverLayer = (val: boolean) => {
    setRiverLayer(val);
    localStorage.setItem("sijaga_river_layer", String(val));
    addAuditLog(currentUser?.email || "super@sijaga.id", "SUPER_ADMIN", `Mengubah status GIS Layer River/DAS ke: ${val ? "AKTIF" : "NONAKTIF"}`);
  };

  const handleSetIndustrialLayer = (val: boolean) => {
    setIndustrialLayer(val);
    localStorage.setItem("sijaga_industrial_layer", String(val));
    addAuditLog(currentUser?.email || "super@sijaga.id", "SUPER_ADMIN", `Mengubah status GIS Layer Zonasi Industri ke: ${val ? "AKTIF" : "NONAKTIF"}`);
  };

  const [users, setUsers] = useState([
    { id: "U-001", name: "Super Administrator", email: "super@sijaga.id", role: "SUPER_ADMIN" },
    { id: "U-002", name: "Admin Verifikator DLH", email: "admin@dlh.go.id", role: "ADMIN_DLH" },
    { id: "U-003", name: "Heryanto, S.T.", email: "officer@dlh.go.id", role: "PETUGAS_LAPANGAN" },
    { id: "U-004", name: "Budi Santoso", email: "perusahaan@sijaga.id", role: "PERUSAHAAN" },
    { id: "U-005", name: "PT. Transport Limbah Indonesia", email: "transport@sijaga.id", role: "PENGANGKUT" },
    { id: "U-006", name: "Kepala Dinas LH", email: "auditor@sijaga.id", role: "AUDITOR" },
  ]);

  const [searchLogQuery, setSearchLogQuery] = useState("");

  const handleRoleChange = (userId: string, newRole: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    const targetUser = users.find(u => u.id === userId);
    addAuditLog(currentUser?.email || "super@sijaga.id", "SUPER_ADMIN", `Mengubah role pengguna ${targetUser?.email} menjadi ${newRole}`);
    toast.success(`Role ${targetUser?.name} berhasil diubah.`);
  };

  const handleToggleSandbox = (checked: boolean) => {
    setSandboxMode(checked);
    addAuditLog(currentUser?.email || "super@sijaga.id", "SUPER_ADMIN", `Mengubah Sandbox Payment Gateway ke: ${checked ? "ACTIVE" : "INACTIVE"}`);
    toast.success(`Payment Sandbox Mode: ${checked ? "Enabled" : "Disabled"}`);
  };

  const filteredLogs = auditLogs.filter(log => 
    log.action.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
    log.user.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
    log.role.toLowerCase().includes(searchLogQuery.toLowerCase())
  );

  return (
    <DashboardLayout role="SUPER_ADMIN">
      <div className="space-y-8 text-left">
        
        {/* Header */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Super Admin Console</h1>
            <p className="text-slate-500 font-medium mt-2">Pusat kendali konfigurasi sistem, kelola role pengguna, aktivasi GIS layer, dan pemantauan audit trail keamanan.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200 px-3 py-1.5 rounded-xl font-bold flex gap-1.5 items-center">
              <Database size={14} className="text-emerald-600 animate-pulse" /> DB Status: Connected
            </Badge>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200">
          <TabNavButton active={activeTab === "overview"} label="Overview" icon={<Settings size={16}/>} onClick={() => navigate("/super-admin")} />
          <TabNavButton active={activeTab === "users"} label="Kelola Pengguna" icon={<Users size={16}/>} onClick={() => navigate("/super-admin/users")} />
          <TabNavButton active={activeTab === "gateway"} label="Payment Gateway" icon={<Key size={16}/>} onClick={() => navigate("/super-admin/gateway")} />
          <TabNavButton active={activeTab === "layers"} label="GIS Layers" icon={<Globe size={16}/>} onClick={() => navigate("/super-admin/layers")} />
          <TabNavButton active={activeTab === "logs"} label="Audit Logs" icon={<Activity size={16}/>} onClick={() => navigate("/super-admin/logs")} />
        </div>

        {/* TAB CONTENTS */}
        
        {/* 1. OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Total Pengguna" value={users.length.toString()} icon={<Users size={24}/>} color="blue" />
              <StatCard label="API Gateway" value={selectedGateway} icon={<Key size={24}/>} color="emerald" />
              <StatCard label="GIS Layers Aktif" value={(Number(riverLayer) + Number(industrialLayer)).toString()} icon={<Globe size={24}/>} color="amber" />
              <StatCard label="Total Audit Logs" value={auditLogs.length.toString()} icon={<Activity size={24}/>} color="red" />
            </div>

            {/* Quick Summary Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* System Health */}
              <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 p-8 bg-white space-y-6">
                <h3 className="font-black text-xl tracking-tight text-slate-800 flex items-center gap-2">
                  <Database className="text-emerald-600" size={20} /> System Health & Parameters
                </h3>
                <div className="space-y-4">
                  <HealthItem label="EWS Notification Engine" status="ACTIVE" />
                  <HealthItem label="Automatic Document Generator" status="ACTIVE" />
                  <HealthItem label="Zustand App Store Cache" status="OPTIMAL" />
                  <HealthItem label="Daily Database Auto-Backup" status="02:00 AM" />
                </div>
              </Card>

              {/* Logs Snapshot */}
              <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 p-8 bg-white space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-xl tracking-tight text-slate-800">Log Aktivitas Terbaru</h3>
                  <Button variant="ghost" size="sm" className="text-emerald-600 font-bold" onClick={() => navigate("/super-admin/logs")}>Lihat Semua</Button>
                </div>
                <div className="space-y-3 font-sans text-xs">
                  {auditLogs.slice(0, 3).map((log) => (
                    <div key={log.id} className="p-3 bg-slate-50 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase">
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <Badge className="bg-slate-900 text-white scale-90">{log.role}</Badge>
                      </div>
                      <p className="font-bold text-slate-800">{log.action}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* 2. USERS TAB */}
        {activeTab === "users" && (
          <Card className="rounded-[2rem] p-8 border-none shadow-xl shadow-slate-200/50 bg-white animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h3 className="font-black text-xl tracking-tight text-slate-800">User Management & Role Assignment</h3>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">Kelola dan tentukan tingkat akses otorisasi RBAC (Role-Based Access Control) pengguna.</p>
              </div>
            </div>

            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-black text-slate-700">ID Pengguna</TableHead>
                    <TableHead className="font-black text-slate-700">Nama Lengkap</TableHead>
                    <TableHead className="font-black text-slate-700">Email Utama</TableHead>
                    <TableHead className="font-black text-slate-700">Hak Akses Role</TableHead>
                    <TableHead className="font-black text-slate-700 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-slate-500">{u.id}</TableCell>
                      <TableCell className="font-black text-slate-850">{u.name}</TableCell>
                      <TableCell className="font-medium text-slate-500">{u.email}</TableCell>
                      <TableCell>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="h-9 text-xs border border-slate-200 rounded-xl px-2.5 bg-white font-bold text-slate-600 focus:outline-none"
                        >
                          <option value="SUPER_ADMIN">SUPER ADMIN</option>
                          <option value="ADMIN_DLH">ADMIN DLH</option>
                          <option value="PETUGAS_LAPANGAN">PETUGAS LAPANGAN</option>
                          <option value="PERUSAHAAN">PERUSAHAAN</option>
                          <option value="PENGANGKUT">PENGANGKUT</option>
                          <option value="AUDITOR">AUDITOR</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600"><Lock size={14}/></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* 3. GATEWAY TAB */}
        {activeTab === "gateway" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
            {/* Payment provider selector */}
            <Card className="rounded-[2rem] p-8 border-none shadow-xl shadow-slate-200/50 bg-white space-y-6 lg:col-span-2">
              <h3 className="font-black text-xl tracking-tight text-slate-800 flex items-center gap-2">
                <Key className="text-emerald-600" size={22} /> API Gateway Credentials & Parameters
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih Provider Payment Gateway</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setSelectedGateway("XENDIT")} 
                      className={`p-4 border rounded-2xl font-black text-center transition-all ${
                        selectedGateway === "XENDIT" ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm" : "border-slate-200 text-slate-400"
                      }`}
                    >
                      Xendit Indonesia
                    </button>
                    <button 
                      onClick={() => setSelectedGateway("MIDTRANS")} 
                      className={`p-4 border rounded-2xl font-black text-center transition-all ${
                        selectedGateway === "MIDTRANS" ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm" : "border-slate-200 text-slate-400"
                      }`}
                    >
                      Midtrans (GoTo)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Public API Key</label>
                    <Input value={selectedGateway === "XENDIT" ? "xnd_public_live_8390b4a..." : "mid_server_live_948fcd..."} disabled className="h-12 rounded-xl bg-slate-50 border-none font-mono" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Callback Secret Webhook</label>
                    <Input value="whsec_039b8c2d1e04cf8a27d14..." type="password" disabled className="h-12 rounded-xl bg-slate-50 border-none font-mono" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Sandbox Simulation */}
            <Card className="rounded-[2rem] p-8 border-none shadow-xl shadow-slate-200/50 bg-white space-y-6">
              <h3 className="font-black text-xl tracking-tight text-slate-800">Sandbox Simulator</h3>
              <p className="text-xs text-slate-400 font-bold uppercase leading-relaxed">Gunakan sandbox untuk mensimulasikan virtual account & QRIS tanpa dana riil.</p>
              
              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Sandbox Gateway Simulator</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Mengaktifkan bypass pembayaran VA/QRIS.</p>
                  </div>
                  <Switch checked={sandboxMode} onCheckedChange={handleToggleSandbox} />
                </div>
                
                <div className="space-y-2 pt-4">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Merchant Account ID</label>
                  <Input value="MCH-8492049102" disabled className="h-10 rounded-xl bg-slate-50 border-none" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 4. GIS LAYERS TAB */}
        {activeTab === "layers" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
            {/* Layers Switch Control */}
            <Card className="rounded-[2rem] p-8 border-none shadow-xl shadow-slate-200/50 bg-white space-y-6">
              <h3 className="font-black text-xl tracking-tight text-slate-800 flex items-center gap-2">
                <MapIcon className="text-blue-600" size={22} /> GIS Layers Control
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase leading-relaxed">Aktifkan layer geospasial pendukung di bawah ini untuk ditampilkan di Command Center.</p>
              
              <div className="space-y-6 pt-4 border-t font-sans text-xs font-bold text-slate-600">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500" /> Peta Aliran Sungai & DAS
                  </span>
                  <Switch checked={riverLayer} onCheckedChange={handleSetRiverLayer} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" /> Zonasi Industri & RTRW
                  </span>
                  <Switch checked={industrialLayer} onCheckedChange={handleSetIndustrialLayer} />
                </div>
                <div className="flex justify-between items-center opacity-50">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" /> Kawasan Hutan Lindung
                  </span>
                  <Switch checked={false} disabled />
                </div>
              </div>
            </Card>

            {/* Interactive Layers Map Preview */}
            <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white lg:col-span-2">
              <div className="p-8 border-b flex justify-between items-center bg-white">
                <h3 className="font-black text-xl tracking-tight text-slate-800">GIS Layer Sandbox Preview</h3>
                <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold">Interactive Layer Sandbox</Badge>
              </div>
              <div className="h-[350px] w-full bg-slate-100 relative z-10">
                <MapContainer center={[-6.9147, 107.6098]} zoom={11} style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {riverLayer && (
                    <FeatureGroup>
                      {/* Simulating River / Water Bodies in Bandung region */}
                      <Circle center={[-6.9147, 107.6098]} radius={4000} pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.15 }} />
                      <Circle center={[-6.9388, 107.6255]} radius={3000} pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.15 }} />
                    </FeatureGroup>
                  )}
                  {industrialLayer && (
                    <FeatureGroup>
                      {/* Simulating industrial RTRW zoning zones */}
                      <Circle center={[-6.8245, 107.6190]} radius={2000} pathOptions={{ color: "orange", fillColor: "orange", fillOpacity: 0.2 }} />
                      <Circle center={[-6.9034, 107.6189]} radius={2500} pathOptions={{ color: "orange", fillColor: "orange", fillOpacity: 0.2 }} />
                    </FeatureGroup>
                  )}
                  <ResizeMap />
                </MapContainer>
              </div>
            </Card>
          </div>
        )}

        {/* 5. AUDIT LOGS TAB */}
        {activeTab === "logs" && (
          <Card className="rounded-[2rem] p-8 border-none shadow-xl shadow-slate-200/50 bg-white animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h3 className="font-black text-xl tracking-tight text-slate-800">Security Audit Trail Logs</h3>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">Pemantauan log aktivitas perubahan data sensitif, alur keuangan escrow, dan status approval.</p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input 
                    placeholder="Cari log..." 
                    value={searchLogQuery}
                    onChange={(e) => setSearchLogQuery(e.target.value)}
                    className="pl-9 h-10 rounded-xl"
                  />
                </div>
                <Button variant="outline" className="gap-2 h-10 rounded-xl">
                  <Download size={16} /> Export CSV
                </Button>
              </div>
            </div>

            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm font-sans">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-black text-slate-700">Timestamp</TableHead>
                    <TableHead className="font-black text-slate-700">ID Log</TableHead>
                    <TableHead className="font-black text-slate-700">Pengguna</TableHead>
                    <TableHead className="font-black text-slate-700">Peran Role</TableHead>
                    <TableHead className="font-black text-slate-700">Aktivitas Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="text-slate-400 font-bold text-xs">{new Date(log.timestamp).toLocaleString()}</TableCell>
                      <TableCell className="font-bold text-slate-500 text-xs">{log.id}</TableCell>
                      <TableCell className="font-bold text-slate-800 text-xs">{log.user}</TableCell>
                      <TableCell>
                        <Badge className="bg-slate-900 text-white font-bold text-[8px] tracking-wider uppercase rounded">{log.role}</Badge>
                      </TableCell>
                      <TableCell className="font-bold text-slate-700 text-xs leading-normal">{log.action}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

      </div>
    </DashboardLayout>
  );
}

// --- SUB COMPONENTS ---

function TabNavButton({ active, label, icon, onClick }: { active: boolean, label: string, icon: any, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
        active 
          ? "bg-white text-emerald-700 shadow-sm border border-slate-200/50" 
          : "text-slate-500 hover:text-slate-850 hover:bg-white/50"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

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
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 ${colors[color as keyof typeof colors]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function HealthItem({ label, status }: { label: string, status: string }) {
  const isOptimal = status === "ACTIVE" || status === "OPTIMAL";
  return (
    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl hover:bg-emerald-50/30 transition-colors">
      <span className="font-bold text-xs text-slate-700">{label}</span>
      <Badge className={`border-none font-bold text-[9px] tracking-wider ${isOptimal ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
        {status}
      </Badge>
    </div>
  );
}
