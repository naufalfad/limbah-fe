// src/modules/admin/pages/SuperAdminPage.tsx
import React, { useState } from "react";
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
  Map as MapIcon, Activity, Lock, Eye, Database, Globe, Search, Download
} from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Circle, FeatureGroup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

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
      <div className="space-y-4 text-left"> {/* DIET: space-y-8 -> space-y-4 */}

        {/* Header (DIET CARD) */}
        <div className="bg-white p-4 rounded-none border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">Super Admin Console</h1>
            <p className="text-slate-500 text-xs font-medium mt-1">Pusat kendali konfigurasi sistem, kelola role pengguna, aktivasi GIS layer, dan audit trail.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-slate-50 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-none font-bold flex gap-1.5 items-center">
              <Database size={12} className="text-emerald-600 animate-pulse" /> <span className="text-[9px] font-black uppercase tracking-widest">DB: CONNECTED</span>
            </Badge>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar (DIET CARD) */}
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-none w-fit border border-slate-200">
          <TabNavButton active={activeTab === "overview"} label="Overview" icon={<Settings size={14} />} onClick={() => navigate("/super-admin")} />
          <TabNavButton active={activeTab === "users"} label="Kelola Pengguna" icon={<Users size={14} />} onClick={() => navigate("/super-admin/users")} />
          <TabNavButton active={activeTab === "gateway"} label="Payment Gateway" icon={<Key size={14} />} onClick={() => navigate("/super-admin/gateway")} />
          <TabNavButton active={activeTab === "layers"} label="GIS Layers" icon={<Globe size={14} />} onClick={() => navigate("/super-admin/layers")} />
          <TabNavButton active={activeTab === "logs"} label="Audit Logs" icon={<Activity size={14} />} onClick={() => navigate("/super-admin/logs")} />
        </div>

        {/* TAB CONTENTS */}

        {/* 1. OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Stats Cards (DIET GRID) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Pengguna" value={users.length.toString()} icon={<Users size={20} />} color="blue" />
              <StatCard label="API Gateway" value={selectedGateway} icon={<Key size={20} />} color="emerald" />
              <StatCard label="GIS Layers" value={(Number(riverLayer) + Number(industrialLayer)).toString()} icon={<Globe size={20} />} color="amber" />
              <StatCard label="Audit Logs" value={auditLogs.length.toString()} icon={<Activity size={20} />} color="red" />
            </div>

            {/* Quick Summary Panels (DIET GRID & FLUSH LIST) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* System Health */}
              <Card className="rounded-none border border-slate-200 shadow-sm bg-white">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="font-bold text-sm tracking-tight text-slate-800 uppercase flex items-center gap-2">
                    <Database className="text-emerald-600" size={16} /> System Health & Parameters
                  </h3>
                </div>
                <div className="flex flex-col"> {/* Flush List style */}
                  <HealthItem label="EWS Notification Engine" status="ACTIVE" />
                  <HealthItem label="Automatic Document Generator" status="ACTIVE" />
                  <HealthItem label="Zustand App Store Cache" status="OPTIMAL" />
                  <HealthItem label="Daily Database Auto-Backup" status="02:00 AM" />
                </div>
              </Card>

              {/* Logs Snapshot */}
              <Card className="rounded-none border border-slate-200 shadow-sm bg-white flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <h3 className="font-bold text-sm tracking-tight text-slate-800 uppercase">Log Aktivitas Terbaru</h3>
                  <Button variant="ghost" size="sm" className="text-emerald-600 font-bold text-[9px] rounded-none h-7 px-2" onClick={() => navigate("/super-admin/logs")}>LIHAT SEMUA</Button>
                </div>
                <div className="flex-1 flex flex-col divide-y divide-slate-100 font-sans text-xs">
                  {auditLogs.slice(0, 3).map((log) => (
                    <div key={log.id} className="p-3 bg-white space-y-1">
                      <div className="flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <Badge className="bg-slate-900 text-white rounded-none scale-90 border-none px-1.5 py-0.5">{log.role}</Badge>
                      </div>
                      <p className="font-bold text-slate-700">{log.action}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* 2. USERS TAB */}
        {activeTab === "users" && (
          <Card className="rounded-none p-4 border border-slate-200 shadow-sm bg-white animate-in fade-in duration-300">
            <div className="mb-4">
              <h3 className="font-bold text-sm tracking-tight text-slate-800 uppercase">User Management</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Kelola tingkat akses otorisasi RBAC (Role-Based Access Control) pengguna.</p>
            </div>

            <div className="border border-slate-100 rounded-none overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-b h-10">
                    <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest pl-4">ID Pengguna</TableHead>
                    <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Nama Lengkap</TableHead>
                    <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Email Utama</TableHead>
                    <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Hak Akses Role</TableHead>
                    <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-right pr-4">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} className="hover:bg-slate-50 transition-colors border-b last:border-b-0 h-12">
                      <TableCell className="font-bold text-slate-500 text-xs pl-4">{u.id}</TableCell>
                      <TableCell className="font-bold text-slate-800 text-xs">{u.name}</TableCell>
                      <TableCell className="font-medium text-slate-500 text-xs">{u.email}</TableCell>
                      <TableCell>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="h-8 text-[11px] border border-slate-200 rounded-none px-2 bg-white font-bold text-slate-600 focus:outline-none"
                        >
                          <option value="SUPER_ADMIN">SUPER ADMIN</option>
                          <option value="ADMIN_DLH">ADMIN DLH</option>
                          <option value="PETUGAS_LAPANGAN">PETUGAS LAPANGAN</option>
                          <option value="PERUSAHAAN">PERUSAHAAN</option>
                          <option value="PENGANGKUT">PENGANGKUT</option>
                          <option value="AUDITOR">AUDITOR</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <Button variant="ghost" size="icon-xs" className="text-slate-400 hover:text-slate-600 rounded-none"><Lock size={12} /></Button>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
            {/* Payment provider selector */}
            <Card className="rounded-none p-4 border border-slate-200 shadow-sm bg-white space-y-4 lg:col-span-2">
              <h3 className="font-bold text-sm tracking-tight text-slate-800 uppercase flex items-center gap-2">
                <Key className="text-emerald-600" size={16} /> API Gateway Credentials
              </h3>

              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pilih Provider Payment Gateway</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setSelectedGateway("XENDIT")}
                      className={`p-3 border rounded-none font-black text-xs text-center transition-all ${selectedGateway === "XENDIT" ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-400 bg-white"
                        }`}
                    >
                      Xendit Indonesia
                    </button>
                    <button
                      onClick={() => setSelectedGateway("MIDTRANS")}
                      className={`p-3 border rounded-none font-black text-xs text-center transition-all ${selectedGateway === "MIDTRANS" ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-400 bg-white"
                        }`}
                    >
                      Midtrans (GoTo)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Public API Key</label>
                    <Input value={selectedGateway === "XENDIT" ? "xnd_public_live_8390b4a..." : "mid_server_live_948fcd..."} disabled className="h-10 rounded-none bg-slate-50 border-slate-200 font-mono text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Callback Secret Webhook</label>
                    <Input value="whsec_039b8c2d1e04cf8a27d14..." type="password" disabled className="h-10 rounded-none bg-slate-50 border-slate-200 font-mono text-xs" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Sandbox Simulation */}
            <Card className="rounded-none p-4 border border-slate-200 shadow-sm bg-white space-y-4">
              <h3 className="font-bold text-sm tracking-tight text-slate-800 uppercase">Sandbox Simulator</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Simulasikan virtual account & QRIS tanpa dana riil.</p>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase">Sandbox Mode</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Bypass pembayaran VA/QRIS.</p>
                  </div>
                  <Switch checked={sandboxMode} onCheckedChange={handleToggleSandbox} />
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Merchant Account ID</label>
                  <Input value="MCH-8492049102" disabled className="h-9 rounded-none bg-slate-50 border-slate-200 text-xs" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 4. GIS LAYERS TAB */}
        {activeTab === "layers" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
            {/* Layers Switch Control */}
            <Card className="rounded-none p-4 border border-slate-200 shadow-sm bg-white space-y-4">
              <h3 className="font-bold text-sm tracking-tight text-slate-800 uppercase flex items-center gap-2">
                <MapIcon className="text-blue-600" size={16} /> GIS Layers Control
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aktifkan layer geospasial pendukung di bawah ini.</p>

              <div className="space-y-4 pt-4 border-t border-slate-100 font-sans text-xs font-bold text-slate-600">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-blue-500" /> Peta Aliran Sungai & DAS
                  </span>
                  <Switch checked={riverLayer} onCheckedChange={handleSetRiverLayer} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-orange-500" /> Zonasi Industri & RTRW
                  </span>
                  <Switch checked={industrialLayer} onCheckedChange={handleSetIndustrialLayer} />
                </div>
              </div>
            </Card>

            {/* Interactive Layers Map Preview */}
            <Card className="rounded-none border border-slate-200 shadow-sm overflow-hidden bg-white lg:col-span-2">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-sm tracking-tight text-slate-800 uppercase">GIS Layer Sandbox Preview</h3>
              </div>
              <div className="h-[300px] w-full bg-slate-100 relative z-10">
                <MapContainer center={[-6.9147, 107.6098]} zoom={11} style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {riverLayer && (
                    <FeatureGroup>
                      <Circle center={[-6.9147, 107.6098]} radius={4000} pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.15 }} />
                      <Circle center={[-6.9388, 107.6255]} radius={3000} pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.15 }} />
                    </FeatureGroup>
                  )}
                  {industrialLayer && (
                    <FeatureGroup>
                      <Circle center={[-6.8245, 107.6190]} radius={2000} pathOptions={{ color: "orange", fillColor: "orange", fillOpacity: 0.2 }} />
                      <Circle center={[-6.9034, 107.6189]} radius={2500} pathOptions={{ color: "orange", fillColor: "orange", fillOpacity: 0.2 }} />
                    </FeatureGroup>
                  )}
                </MapContainer>
              </div>
            </Card>
          </div>
        )}

        {/* 5. AUDIT LOGS TAB (DENSE) */}
        {activeTab === "logs" && (
          <Card className="rounded-none p-4 border border-slate-200 shadow-sm bg-white animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
              <div>
                <h3 className="font-bold text-sm tracking-tight text-slate-800 uppercase">Security Audit Trail</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Pemantauan log aktivitas perubahan data sensitif sistem.</p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <Input
                    placeholder="Cari log..."
                    value={searchLogQuery}
                    onChange={(e) => setSearchLogQuery(e.target.value)}
                    className="pl-9 h-9 rounded-none text-xs"
                  />
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 h-9 rounded-none text-[10px] font-bold border-slate-300">
                  <Download size={12} /> EXPORT CSV
                </Button>
              </div>
            </div>

            <div className="border border-slate-100 rounded-none overflow-hidden shadow-sm font-sans">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-b border-slate-200 h-10">
                    <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest pl-4">Timestamp</TableHead>
                    <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">ID Log</TableHead>
                    <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Pengguna</TableHead>
                    <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Role</TableHead>
                    <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Aktivitas Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50 transition-colors border-b last:border-b-0 h-12">
                      <TableCell className="text-slate-400 font-bold text-xs pl-4">{new Date(log.timestamp).toLocaleString()}</TableCell>
                      <TableCell className="font-bold text-slate-500 text-xs">{log.id}</TableCell>
                      <TableCell className="font-bold text-slate-800 text-xs">{log.user}</TableCell>
                      <TableCell>
                        <Badge className="bg-slate-900 text-white font-bold text-[8px] tracking-wider uppercase rounded-none border-none">{log.role}</Badge>
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
      className={`flex items-center gap-1.5 px-3 py-2 rounded-none font-bold text-[10px] uppercase tracking-wider transition-all ${active
        ? "bg-white text-emerald-700 shadow-sm border border-slate-200/50 font-black"
        : "text-slate-500 hover:text-slate-850 hover:bg-white/50"
        }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// DIET: rounded-[2rem] -> rounded-none, p-6 -> p-4
function StatCard({ label, value, icon, color }: any) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    red: "bg-red-50 text-red-600 border-red-100"
  };
  return (
    <div className="border p-4 shadow-sm flex items-start justify-between bg-white rounded-none">
      <div className="space-y-1">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</p>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mt-1">{value}</h2>
      </div>
      <div className={cn("w-10 h-10 border flex items-center justify-center shrink-0", colors[color as keyof typeof colors])}>
        {icon}
      </div>
    </div>
  );
}

// DIET: Flush List style item
function HealthItem({ label, status }: { label: string, status: string }) {
  const isOptimal = status === "ACTIVE" || status === "OPTIMAL";
  return (
    <div className="flex justify-between items-center p-3 bg-white border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
      <span className="font-bold text-xs text-slate-700">{label}</span>
      <Badge className={`border-none font-black text-[9px] tracking-wider rounded-none px-2 py-0.5 ${isOptimal ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
        {status}
      </Badge>
    </div>
  );
}