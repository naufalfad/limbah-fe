import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell 
} from "recharts";
import { 
  TrendingUp, Award, DollarSign, ShieldCheck, 
  Download, Leaf, FileText, CheckCircle2, Map as MapIcon, BarChart4, ClipboardList, Database
} from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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

export default function AuditorDashboardPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { companies, wasteLogs, invoices, inspections } = useSijagaStore();

  const activeTab = tab || "analytics";

  // Computations
  const totalCompanies = companies.length;
  
  const complianceCompanies = companies.filter(c => c.score !== undefined && c.score !== null);
  const avgCompliance = complianceCompanies.length > 0 
    ? Math.round(complianceCompanies.reduce((acc, curr) => acc + (curr.score || 0), 0) / complianceCompanies.length) 
    : 78;

  const totalWasteB3 = wasteLogs
    .filter(w => w.type.toLowerCase().includes("b3") || w.type.toLowerCase().includes("oli"))
    .reduce((acc, curr) => acc + curr.volume, 0);

  const totalRevenue = invoices
    .filter(i => i.status === "SETTLED")
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Chart 1 Data: Compliance scores
  const barData = companies.map(c => ({
    name: c.companyName.split(". ").pop()?.substring(0, 10) || c.companyName,
    "Skor ESG": c.score || 0
  }));

  // Chart 2 Data: Waste volume distribution
  const wasteData = [
    { name: "Oli Bekas", value: 90, color: "#3b82f6" },
    { name: "Cair Kimia", value: 120, color: "#10b981" },
    { name: "Minyak Jelantah", value: 15, color: "#f59e0b" },
    { name: "Padat B3", value: 85, color: "#f43f5e" }
  ];

  // DLH performance metrics
  const pendingApprovals = companies.filter(c => c.status === "PENDING" || c.status === "REVIEW").length;
  const completedInspections = inspections.filter(i => i.status === "Selesai").length;

  const handleExport = () => {
    toast.success("Mengekspor laporan eksekutif ESG (.PDF). Mohon tunggu...");
  };

  const getScoreBadge = (score?: number) => {
    if (!score) return <Badge className="bg-slate-100 text-slate-500 border border-slate-200">Belum Audit</Badge>;
    if (score >= 80) return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold">Excellent ({score})</Badge>;
    if (score >= 60) return <Badge className="bg-amber-50 text-amber-700 border border-amber-100 font-bold">Fair ({score})</Badge>;
    return <Badge className="bg-red-50 text-red-700 border border-red-100 font-bold">Critical ({score})</Badge>;
  };

  return (
    <DashboardLayout role="AUDITOR">
      <div className="space-y-8 text-left">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Command Center Auditor</h1>
            <p className="text-slate-500 font-medium mt-2">Pemantauan tingkat kepatuhan industri, kinerja pengawasan DLH, dan analisis ESG secara geospasial.</p>
          </div>
          
          <Button 
            onClick={handleExport}
            className="w-full md:w-auto h-12 bg-slate-900 hover:bg-emerald-600 text-white shadow-lg font-bold gap-2 px-6 rounded-xl transition-all"
          >
            <Download size={18} /> Export Laporan Eksekutif
          </Button>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200">
          <TabNavButton active={activeTab === "analytics"} label="Executive Analytics" icon={<BarChart4 size={16}/>} onClick={() => navigate("/auditor")} />
          <TabNavButton active={activeTab === "gis"} label="Geospasial Kepatuhan" icon={<MapIcon size={16}/>} onClick={() => navigate("/auditor/gis")} />
          <TabNavButton active={activeTab === "performance"} label="Laporan Kinerja DLH" icon={<ClipboardList size={16}/>} onClick={() => navigate("/auditor/performance")} />
        </div>

        {/* Executive Stats */}
        {activeTab === "analytics" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatMiniCard label="Indeks Kepatuhan" value={`${avgCompliance}/100`} sub="Rata-rata Daerah" icon={<Award className="text-emerald-500"/>} />
              <StatMiniCard label="Total Usaha Terdaftar" value={totalCompanies.toString()} sub="SPPL & UKL-UPL" icon={<Leaf className="text-blue-500"/>} />
              <StatMiniCard label="Akumulasi Limbah B3" value={`${totalWasteB3} L/kg`} sub="Volume Terangkut" icon={<TrendingUp className="text-rose-500"/>} />
              <StatMiniCard label="Retribusi Terkumpul" value={`Rp ${totalRevenue.toLocaleString()}`} sub="PAD Lingkungan Hidup" icon={<DollarSign className="text-amber-500"/>} />
            </div>

            {/* Recharts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* ESG Score distribution chart */}
              <Card className="lg:col-span-8 rounded-[2rem] p-8 border-none shadow-xl shadow-slate-200/50 bg-white">
                <h3 className="font-black text-xl tracking-tight text-slate-800 mb-6">Skor Kepatuhan ESG Perusahaan</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                      <YAxis stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                      <Tooltip cursor={{ fill: "#f8fafc" }} />
                      <Bar dataKey="Skor ESG" fill="#059669" radius={[10, 10, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Waste distribution chart */}
              <Card className="lg:col-span-4 rounded-[2rem] p-8 border-none shadow-xl shadow-slate-200/50 bg-white flex flex-col justify-between">
                <h3 className="font-black text-xl tracking-tight text-slate-800 mb-6">Komposisi Volume Limbah</h3>
                
                <div className="h-[200px] w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={wasteData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {wasteData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Volume</span>
                    <span className="text-xl font-black text-slate-800">310 L/kg</span>
                  </div>
                </div>

                <div className="space-y-2 mt-4 font-sans">
                  {wasteData.map((d, i) => (
                    <div key={i} className="flex justify-between items-center text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-slate-600">{d.name}</span>
                      </div>
                      <span className="text-slate-900 font-black">{d.value} L/kg</span>
                    </div>
                  ))}
                </div>
              </Card>

            </div>

            {/* Industry compliance ranking table */}
            <Card className="border-none shadow-sm ring-1 ring-slate-200 rounded-[2rem] overflow-hidden bg-white">
              <div className="p-6 border-b bg-slate-50/50">
                <h3 className="font-black text-slate-800 tracking-tight">Peringkat Kepatuhan ESG Industri</h3>
              </div>

              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-none">
                    <TableHead className="font-black text-slate-400 text-[10px] py-4 pl-8 uppercase">Perusahaan</TableHead>
                    <TableHead className="font-black text-slate-400 text-[10px] uppercase">Bidang Usaha (KBLI)</TableHead>
                    <TableHead className="font-black text-slate-400 text-[10px] uppercase">Wajib Dokumen</TableHead>
                    <TableHead className="font-black text-slate-400 text-[10px] uppercase text-center">Status</TableHead>
                    <TableHead className="text-right font-black text-slate-400 text-[10px] uppercase pr-8">Kategori Kepatuhan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((c) => (
                    <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors border-slate-100 h-20">
                      <TableCell className="pl-8">
                        <div className="flex flex-col text-left">
                          <span className="font-black text-slate-800">{c.companyName}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{c.address}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-slate-600 text-xs">{c.kbli || "KBLI Default"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-100 text-slate-600 border-none font-bold">
                          {c.docType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${c.status === "APPROVED" ? "text-emerald-600" : "text-amber-500"}`}>
                          {c.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        {getScoreBadge(c.score)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {/* 2. GEOSPASIAL KEPATUHAN TAB */}
        {activeTab === "gis" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
            {/* GIS Overview stats */}
            <Card className="rounded-[2rem] p-8 border-none shadow-xl shadow-slate-200/50 bg-white space-y-6">
              <h3 className="font-black text-xl tracking-tight text-slate-800">Pemetaan Industri & Kepatuhan</h3>
              <p className="text-xs text-slate-400 font-bold uppercase leading-relaxed">
                Legenda titik koordinat industri pada peta didasarkan pada tingkat kepatuhan lingkungan hidup (ESG Score).
              </p>
              
              <div className="space-y-4 pt-4 border-t font-sans">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm border border-white" /> Sangat Patuh (&ge; 80)
                  </span>
                  <Badge className="bg-emerald-50 text-emerald-700 border-none">
                    {companies.filter(c => c.score && c.score >= 80).length} Lokasi
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-sm border border-white" /> Cukup Patuh (60 - 79)
                  </span>
                  <Badge className="bg-amber-50 text-amber-700 border-none">
                    {companies.filter(c => c.score && c.score >= 60 && c.score < 80).length} Lokasi
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-sm border border-white" /> Kepatuhan Kritis (&lt; 60)
                  </span>
                  <Badge className="bg-red-50 text-red-700 border-none">
                    {companies.filter(c => c.score && c.score < 60).length} Lokasi
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Leaflet Map panel */}
            <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white lg:col-span-2">
              <div className="h-[450px] w-full relative z-10">
                <MapContainer center={[-6.9147, 107.6098]} zoom={12} style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {companies.map((c) => {
                    const lat = parseFloat(c.lat);
                    const lng = parseFloat(c.lng);
                    if (isNaN(lat) || isNaN(lng)) return null;

                    // Colored markers simulation
                    return (
                      <Marker key={c.id} position={[lat, lng]}>
                        <Popup>
                          <div className="space-y-1.5 text-left p-1">
                            <h4 className="font-black text-slate-800 text-xs">{c.companyName}</h4>
                            <p className="text-[10px] text-slate-500 font-medium">{c.address}</p>
                            <div className="flex items-center justify-between pt-1 gap-4">
                              <Badge className="bg-slate-100 text-slate-600 scale-90 border-none">{c.docType}</Badge>
                              {getScoreBadge(c.score)}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                  <ResizeMap />
                </MapContainer>
              </div>
            </Card>
          </div>
        )}

        {/* 3. LAPORAN KINERJA DLH TAB */}
        {activeTab === "performance" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* DLH KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem] p-6 bg-white flex justify-between items-start">
                <div className="space-y-1 text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dokumen Diajukan</p>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic">{pendingApprovals} Antrean</h2>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Dalam Proses Review DLH</p>
                </div>
                <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0 border">
                  <FileText size={18} />
                </div>
              </Card>

              <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem] p-6 bg-white flex justify-between items-start">
                <div className="space-y-1 text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inspeksi Lapangan</p>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic">{completedInspections} Selesai</h2>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Kunjungan Patroli Pejabat</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shrink-0 border">
                  <CheckCircle2 size={18} />
                </div>
              </Card>

              <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem] p-6 bg-white flex justify-between items-start">
                <div className="space-y-1 text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Response Time Rerata</p>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic">1.8 Hari</h2>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Durasi Verifikasi DLH</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0 border">
                  <TrendingUp size={18} />
                </div>
              </Card>
            </div>

            {/* Historical inspection and approval trends */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
              
              {/* Inspection Logs list */}
              <Card className="lg:col-span-6 rounded-[2rem] p-8 border-none shadow-xl shadow-slate-200/50 bg-white">
                <h3 className="font-black text-xl tracking-tight text-slate-800 mb-6">Log Kunjungan Inspeksi Lapangan</h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 divide-y divide-slate-100 text-left">
                  {inspections.map((insp) => (
                    <div key={insp.id} className="pt-4 first:pt-0 space-y-1">
                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase">
                        <span>{insp.date} — {insp.id}</span>
                        <Badge className={`border-none scale-90 ${insp.status === "Selesai" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          {insp.status}
                        </Badge>
                      </div>
                      <h4 className="font-black text-slate-800 text-xs leading-none">{insp.companyName}</h4>
                      <p className="text-[11px] text-slate-600 font-medium">Petugas Lapangan: {insp.inspectorName}</p>
                      {insp.notes && <p className="text-[10px] text-slate-400 italic font-bold">Hasil: "{insp.notes}"</p>}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Approval status chart */}
              <Card className="lg:col-span-6 rounded-[2rem] p-8 border-none shadow-xl shadow-slate-200/50 bg-white">
                <h3 className="font-black text-xl tracking-tight text-slate-800 mb-6">Status Registrasi Dokumen Pelaku Usaha</h3>
                <div className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>Dokumen Disetujui (Approved)</span>
                      <span>{companies.filter(c => c.status === "APPROVED").length} dari {companies.length}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(companies.filter(c => c.status === "APPROVED").length / companies.length) * 100}%` }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>Dalam Proses Penelaahan (Review/Pending)</span>
                      <span>{pendingApprovals} dari {companies.length}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(pendingApprovals / companies.length) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </Card>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

// --- SUB-COMPONENTS ---
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

function StatMiniCard({ label, value, sub, icon }: any) {
  return (
    <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem] p-6 hover:-translate-y-1 transition-all bg-white flex justify-between items-start">
      <div className="space-y-1 text-left">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic">{value}</h2>
        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{sub}</p>
      </div>
      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 border">
        {icon}
      </div>
    </Card>
  );
}
