// src/modules/admin/pages/SensorManagementPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    MapPin, Trash2, Settings2, Cpu, CheckCircle2,
    Plus, Search, AlertTriangle, RefreshCw, Layers
} from "lucide-react";
// TERPERBAIKI: Mengimpor Popup secara resmi dari react-leaflet [3]
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// TERPERBAIKI: Impor tipe data 'WaterStationNode' dari pusat kontrak spasial `@/types/gis` [3]
import { WaterStationNode } from "@/types/gis";

// --- Fix Leaflet Default Marker Icons (Vite safety) ---
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
        }, 300);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
}

// Map Click Handler untuk menangkap koordinat spasial perangkat (AFL Buoy)
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        }
    });
    return null;
}

export default function SensorManagementPage() {
    const { waterStations, fetchWaterStations } = useSijagaStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Form States
    const [isEditing, setIsEditMode] = useState(false);
    const [form, setForm] = useState({
        id: "",
        name: "",
        lat: "",
        lng: "",
        sourceType: "SIMULATED" as "SIMULATED" | "PHYSICAL_IOT",
        status: "ACTIVE" as "ACTIVE" | "MAINTENANCE" | "OFFLINE",
        deviceId: ""
    });

    useEffect(() => {
        fetchWaterStations();
    }, [fetchWaterStations]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchWaterStations();
        setIsRefreshing(false);
        toast.success("Database sensor air berhasil disinkronkan.");
    };

    // Handler Ketukan Peta Spasial (Auto-Fill Geotagging)
    const handleMapClick = (lat: number, lng: number) => {
        setForm(prev => ({
            ...prev,
            lat: lat.toFixed(6),
            lng: lng.toFixed(6)
        }));
        toast.info(`Koordinat spasial ditandai: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleEditClick = (station: WaterStationNode) => {
        setIsEditMode(true);
        setForm({
            id: station.id,
            name: station.name,
            lat: String(station.lat),
            lng: String(station.lng),
            sourceType: station.sourceType || "SIMULATED",
            status: station.status || "ACTIVE",
            deviceId: station.deviceId || ""
        });
        toast.info(`Mengedit konfigurasi stasiun ${station.id}`);
    };

    const handleCancel = () => {
        setIsEditMode(false);
        setForm({
            id: "",
            name: "",
            lat: "",
            lng: "",
            sourceType: "SIMULATED",
            status: "ACTIVE",
            deviceId: ""
        });
    };

    // ==========================================================================
    // ACTION HANDLERS: MUTASI STORE LANGSUNG (Zustand Direct State Manipulation)
    // ==========================================================================
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.id.trim() || !form.name.trim() || !form.lat.trim() || !form.lng.trim()) {
            toast.error("Seluruh parameter koordinat dan identitas stasiun wajib dilengkapi.");
            return;
        }

        if (form.sourceType === "PHYSICAL_IOT" && !form.deviceId.trim()) {
            toast.error("ID Perangkat Keras (MAC) wajib diisi jika tipe adalah PHYSICAL_IOT.");
            return;
        }

        const existingStations = [...waterStations];
        const targetIndex = existingStations.findIndex(s => s.id === form.id);

        const payload: WaterStationNode = {
            id: form.id,
            name: form.name,
            lat: parseFloat(form.lat),
            lng: parseFloat(form.lng),
            sourceType: form.sourceType,
            status: form.status,
            deviceId: form.sourceType === "PHYSICAL_IOT" ? form.deviceId : undefined,
            // Pertahankan data logs / history bulanan jika dalam mode edit
            currentData: targetIndex !== -1 ? existingStations[targetIndex].currentData : { month: "Mei", bod: 1.0, cod: 10.0, do: 7.0, ph: 7.0 },
            monthlyHistory: targetIndex !== -1 ? existingStations[targetIndex].monthlyHistory : [
                { month: "Jan", bod: 1.0, cod: 10.0, do: 7.0, ph: 7.0 },
                { month: "Feb", bod: 1.0, cod: 10.0, do: 7.0, ph: 7.0 },
                { month: "Mar", bod: 1.0, cod: 10.0, do: 7.0, ph: 7.0 },
                { month: "Apr", bod: 1.0, cod: 10.0, do: 7.0, ph: 7.0 },
                { month: "Mei", bod: 1.0, cod: 10.0, do: 7.0, ph: 7.0 }
            ]
        };

        if (isEditing && targetIndex !== -1) {
            existingStations[targetIndex] = payload;
            toast.success(`Konfigurasi stasiun ${form.id} berhasil diperbarui.`);
        } else {
            // Validasi duplikasi ID jika tambah baru
            if (existingStations.some(s => s.id === form.id)) {
                toast.error(`ID Stasiun ${form.id} sudah terdaftar di database.`);
                return;
            }
            existingStations.unshift(payload);
            toast.success(`Stasiun pemantau otonom (AFL Buoy) ${form.id} berhasil diregistrasi.`);
        }

        // Terapkan penulisan reaktif ke dalam store Zustand secara langsung
        useSijagaStore.setState({ waterStations: existingStations });
        handleCancel();
    };

    const handleDelete = (id: string) => {
        const filtered = waterStations.filter(s => s.id !== id);
        useSijagaStore.setState({ waterStations: filtered });
        toast.info(`Stasiun ${id} telah dihapus dari pengawasan.`);
    };

    // Filter Pencarian Lokal
    const filteredStations = useMemo(() => {
        return waterStations.filter(s =>
            s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.deviceId && s.deviceId.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [waterStations, searchQuery]);

    return (
        <DashboardLayout role="ADMIN_DLH">
            <div className="space-y-4 text-left font-sans">

                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 border border-slate-200 rounded-none shadow-sm">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
                            Manajemen <span className="text-emerald-600">Sensor Spasial</span>
                        </h1>
                        <p className="text-slate-500 text-xs font-medium mt-1.5">
                            Kelola koordinat stasiun pelampung otonom (*Autonomous Floating Lab*), ubah moda telemetri hibrida, dan daftarkan perangkat keras IoT.
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 font-black border-slate-300 rounded-none h-9 px-4 text-[10px] uppercase tracking-widest hover:bg-slate-50 shrink-0"
                    >
                        <RefreshCw size={12} className={cn(isRefreshing && "animate-spin")} />
                        {isRefreshing ? "MEMUAT..." : "SYNC SENSOR"}
                    </Button>
                </div>

                {/* --- TWO COLUMN TACTICAL GRID --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">

                    {/* KOLOM KIRI (7 Kolom): Peta Interaktif & Tabel Sensor */}
                    <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">

                        {/* Interactive Geotagging Map Canvas */}
                        <Card className="rounded-none border border-slate-200 shadow-none overflow-hidden bg-white">
                            <div className="h-[260px] w-full relative z-10">
                                <div className="absolute top-3 left-10 bg-slate-900/90 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 z-[999] pointer-events-none rounded-none shadow">
                                    Peta Mikro: Klik pada kanvas untuk menandai letak titik koordinat sensor
                                </div>
                                <MapContainer
                                    center={[-6.4816, 106.8560]} // Cibinong
                                    zoom={11}
                                    style={{ height: "100%", width: "100%" }}
                                    zoomControl={true}
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <MapClickHandler onMapClick={handleMapClick} />
                                    <ResizeMap />

                                    {/* Plot seluruh stasiun yang terdaftar */}
                                    {waterStations.map(station => (
                                        <Marker
                                            key={station.id}
                                            position={[station.lat, station.lng]}
                                        >
                                            <Popup>
                                                <div className="p-1 text-left text-xs font-sans">
                                                    <h4 className="font-black text-slate-800 leading-none">{station.name}</h4>
                                                    <span className="text-[9px] text-slate-400 mt-1 block">ID: {station.id}</span>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            </div>
                        </Card>

                        {/* Search Toolbar */}
                        <Card className="rounded-none border border-slate-200 shadow-none p-3 bg-white">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <Input
                                    placeholder="Cari ID, Nama Lokasi, atau MAC Perangkat..."
                                    className="pl-9 h-9 bg-slate-50 border-slate-200 rounded-none font-bold text-xs"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </Card>

                        {/* High Density Sensors Table */}
                        <div className="bg-white rounded-none border border-slate-200 shadow-none overflow-hidden flex-1">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow className="border-b border-slate-200 h-9">
                                        <TableHead className="w-[80px] font-black text-slate-500 uppercase text-[9px] tracking-widest pl-4">ID</TableHead>
                                        <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Nama Stasiun</TableHead>
                                        <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Tipe</TableHead>
                                        <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center">Status</TableHead>
                                        <TableHead className="text-right pr-4 font-black text-slate-500 uppercase text-[9px] tracking-widest w-[140px]">Tindakan</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStations.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-16">
                                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                                    <Cpu size={24} className="opacity-30" />
                                                    <p className="font-black text-[10px] uppercase tracking-widest">Tidak ada sensor terdaftar</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredStations.map((station) => (
                                            <TableRow key={station.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors h-12 group">
                                                <TableCell className="font-mono font-bold text-slate-500 pl-4 text-xs">
                                                    {station.id}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-left">
                                                        <span className="font-bold text-slate-900 text-xs">{station.name}</span>
                                                        <span className="text-[8px] font-mono text-slate-400 font-bold mt-0.5">COORD: {station.lat}, {station.lng}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={cn(
                                                        "rounded-none border-none text-[8px] font-black tracking-widest uppercase px-2 py-0.5",
                                                        station.sourceType === "PHYSICAL_IOT" ? "bg-indigo-50 text-indigo-700" : "bg-cyan-500/10 text-cyan-700"
                                                    )}>
                                                        {station.sourceType || "SIMULATED"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={cn(
                                                        "rounded-none border-none text-[8px] font-black tracking-widest uppercase px-2 py-0.5",
                                                        station.status === "ACTIVE"
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : station.status === "MAINTENANCE"
                                                                ? "bg-amber-50 text-amber-700"
                                                                : "bg-slate-100 text-slate-500"
                                                    )}>
                                                        {station.status || "ACTIVE"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right pr-4">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            variant="ghost"
                                                            size="xs"
                                                            onClick={() => handleEditClick(station)}
                                                            className="text-emerald-600 font-black hover:bg-emerald-50 rounded-none h-7 text-[9px] tracking-widest"
                                                        >
                                                            <Settings2 size={10} className="mr-1" /> KELOLA
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="xs"
                                                            onClick={() => handleDelete(station.id)}
                                                            className="text-rose-600 font-black hover:bg-rose-50 rounded-none h-7 text-[9px] tracking-widest"
                                                        >
                                                            <Trash2 size={10} className="mr-1" /> HAPUS
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                    </div>

                    {/* KOLOM KANAN (5 Kolom): Formulir Pengaturan Perangkat */}
                    <div className="lg:col-span-5">
                        <Card className="rounded-none border border-slate-200 shadow-none bg-white h-full flex flex-col justify-between">
                            <div className="p-4 bg-slate-50 border-b border-slate-200 text-left shrink-0">
                                <h3 className="text-xs font-black text-slate-800 tracking-widest uppercase flex items-center gap-1.5">
                                    <Cpu size={14} className="text-emerald-600" />
                                    {isEditing ? "Konfigurasi Ulang Sensor" : "Registrasi Sensor Baru"}
                                </h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Lengkapi parameter teknis dan tautkan ID perangkat fisik.</p>
                            </div>

                            <form onSubmit={handleSave} className="p-6 space-y-4 flex-1 text-left text-xs">
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID Stasiun Air *</Label>
                                    <Input
                                        name="id"
                                        value={form.id}
                                        onChange={handleInputChange}
                                        disabled={isEditing} // ID dilarang diubah saat mode edit
                                        placeholder="Contoh: WS-05"
                                        className="h-10 rounded-none border-slate-200 font-bold font-mono focus:border-emerald-600"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Stasiun / Alokasi Sungai *</Label>
                                    <Input
                                        name="name"
                                        value={form.name}
                                        onChange={handleInputChange}
                                        placeholder="Contoh: Stasiun Aliran Sungai Cileungsi Hilir"
                                        className="h-10 rounded-none border-slate-200 font-bold focus:border-emerald-600"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Latitude Koordinat *</Label>
                                        <Input
                                            name="lat"
                                            value={form.lat}
                                            onChange={handleInputChange}
                                            placeholder="-6.4816"
                                            className="h-10 rounded-none border-slate-200 font-mono font-bold focus:border-emerald-600"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Longitude Koordinat *</Label>
                                        <Input
                                            name="lng"
                                            value={form.lng}
                                            onChange={handleInputChange}
                                            placeholder="106.8560"
                                            className="h-10 rounded-none border-slate-200 font-mono font-bold focus:border-emerald-600"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipe Sumber Data</Label>
                                        <select
                                            name="sourceType"
                                            value={form.sourceType}
                                            onChange={handleInputChange}
                                            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-none font-bold text-[11px] focus:outline-none focus:border-emerald-600 cursor-pointer"
                                        >
                                            <option value="SIMULATED">SIMULATION MODEL (Mock)</option>
                                            <option value="PHYSICAL_IOT">PHYSICAL HARDWARE (IoT)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status Perangkat</Label>
                                        <select
                                            name="status"
                                            value={form.status}
                                            onChange={handleInputChange}
                                            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-none font-bold text-[11px] focus:outline-none focus:border-emerald-600 cursor-pointer"
                                        >
                                            <option value="ACTIVE">ACTIVE (Membaca Data)</option>
                                            <option value="MAINTENANCE">CALIBRATING (Lab)</option>
                                            <option value="OFFLINE">OFFLINE (Mati Daya)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Field Opsional: Tautkan MAC ID Perangkat keras otonom */}
                                {form.sourceType === "PHYSICAL_IOT" && (
                                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <Label className="text-[9px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1">
                                            <AlertTriangle size={11} /> MAC Address ID Perangkat Fisik *
                                        </Label>
                                        <Input
                                            name="deviceId"
                                            value={form.deviceId}
                                            onChange={handleInputChange}
                                            placeholder="Contoh: A0:B1:C2:D3:E4:F5"
                                            className="h-10 rounded-none border-rose-300 bg-rose-50/10 font-bold font-mono focus:border-rose-500"
                                        />
                                    </div>
                                )}

                                <div className="p-3 bg-slate-50 border border-slate-200 select-none text-slate-500 text-[9.5px] font-semibold leading-relaxed">
                                    <div className="flex items-center gap-1.5 mb-1 text-slate-700 font-black">
                                        <CheckCircle2 size={12} className="text-emerald-600" />
                                        <span>Skema Geotagging Otomatis</span>
                                    </div>
                                    Sistem mendukung penentuan lokasi sensor secara *real-time*. Anda bisa mengetuk peta spasial di sebelah kiri untuk mengisi angka latitude/longitude di atas secara otomatis [3].
                                </div>
                            </form>

                            {/* Form Action Buttons (Sticky) */}
                            <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2 shrink-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                    className="rounded-none border-slate-300 font-bold text-xs h-10 w-1/3 uppercase tracking-wider bg-white"
                                >
                                    BATAL
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSave}
                                    className="flex-1 h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-none font-black text-xs uppercase tracking-widest shadow-none"
                                >
                                    {isEditing ? "SIMPAN PEMBARUAN" : "DAFTARKAN SENSOR"}
                                </Button>
                            </div>
                        </Card>
                    </div>

                </div>

            </div>
        </DashboardLayout>
    );
}