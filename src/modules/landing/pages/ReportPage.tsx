// src/modules/landing/pages/ReportPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useSijagaStore } from "@/store/useSijagaStore";
import { useFormPersist } from "@/hooks/useFormPersist";
import { toast } from "sonner";
import {
    MapContainer,
    TileLayer,
    Marker,
    useMap,
    useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Icons
import {
    AlertTriangle,
    Camera,
    Crosshair,
    MapPin,
    User,
    Phone,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    X,
    Loader2,
    UploadCloud,
    ShieldCheck,
    Search,
    FileImage,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// --- Fix Leaflet Default Marker Icons (Vite safety) ---
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Peta default diatur di area pusat kota Bandung
const DEFAULT_CENTER: [number, number] = [-6.9147, 107.6098];

// SOLUSI ARSITEKTURAL: Kunci referensi array di luar komponen agar terhindar dari re-render loop
const EXCLUDED_FORM_FIELDS = ["evidencePhotos"];

// --- SCHEMA VALIDASI KLIEN (ZOD) ---
const reportSchema = z.object({
    incidentType: z.string().min(1, "Harap pilih salah satu jenis insiden"),
    description: z
        .string()
        .min(10, "Harap ceritakan kejadian secara detail (minimal 10 karakter)"),
    lat: z.string().min(1, "Koordinat lokasi Latitude belum ditentukan"),
    lng: z.string().min(1, "Koordinat lokasi Longitude belum ditentukan"),
    reporterName: z.string().optional(),
    reporterContact: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export default function ReportPage() {
    const navigate = useNavigate();
    const { submitCitizenReport, isReportLoading } = useSijagaStore();

    const [currentStep, setCurrentStep] = useState(1);
    const [photos, setPhotos] = useState<File[]>([]);
    const [addressQuery, setAddressQuery] = useState("");
    const [isGeocoding, setIsGeocoding] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const methods = useForm<ReportFormValues>({
        resolver: zodResolver(reportSchema) as any,
        mode: "onChange",
        defaultValues: {
            incidentType: "Pencemaran Air",
            description: "",
            lat: "",
            lng: "",
            reporterName: "",
            reporterContact: "",
        },
    });

    const { watch, setValue, handleSubmit, trigger, formState: { errors } } = methods;

    // --- PROTEKSI DRAF (useFormPersist) ---
    useFormPersist(methods, "SIJAGA_CITIZEN_REPORT_DRAFT", EXCLUDED_FORM_FIELDS);

    // --- MULTI-PHOTO UPLOAD HANDLER ---
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);

            if (photos.length + filesArray.length > 5) {
                toast.error("Batas maksimal dokumen pengaduan adalah 5 foto bukti.");
                return;
            }

            const oversized = filesArray.find((f) => f.size > 5 * 1024 * 1024);
            if (oversized) {
                toast.error(`File "${oversized.name}" melebihi kapasitas batas 5 MB.`);
                return;
            }

            setPhotos((prev) => [...prev, ...filesArray]);
            toast.success(`${filesArray.length} Foto bukti ditambahkan.`);
        }
    };

    const handleRemovePhoto = (index: number) => {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // --- ADDRESS GEOCODING (PURE FABRICATION SEARCH LOGIC) ---
    const handleAddressSearch = async () => {
        if (!addressQuery.trim()) {
            toast.error("Silakan ketik nama lokasi atau jalan terlebih dahulu.");
            return;
        }
        setIsGeocoding(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    addressQuery
                )}&limit=1`
            );
            const data = await res.json();
            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                setValue("lat", parseFloat(lat).toFixed(6));
                setValue("lng", parseFloat(lon).toFixed(6));
                toast.success(`Lokasi ditemukan: ${display_name}`);
            } else {
                toast.error("Lokasi tidak ditemukan. Gunakan nama tempat yang lebih umum.");
            }
        } catch (e) {
            console.error("Geocoding Error:", e);
            toast.error("Gagal terhubung ke server peta geocoding.");
        } finally {
            setIsGeocoding(false);
        }
    };

    // --- DEFINISI UTAMA NAVIGASI HELPER ---
    const nextStep = () => setCurrentStep((prev) => prev + 1);
    const prevStep = () => setCurrentStep((prev) => prev - 1);

    // --- PARTIAL STEP VALIDATION (GRASP: Controller / Protected Variations) ---
    const handleValidateStep1 = async () => {
        const isStep1Valid = await trigger(["incidentType", "description"]);
        if (!isStep1Valid) {
            toast.error("Harap lengkapi detail masalah sebelum melanjutkan.");
            return;
        }
        if (photos.length === 0) {
            toast.error("Wajib melampirkan minimal 1 foto bukti kejadian.");
            return;
        }
        nextStep();
    };

    const handleValidateStep2 = async () => {
        const isStep2Valid = await trigger(["lat", "lng"]);
        if (!isStep2Valid) {
            toast.error("Harap tentukan titik lokasi pada peta terlebih dahulu.");
            return;
        }
        nextStep();
    };

    // --- FORM MULTIPART SUBMISSION ---
    const onSubmit = async (data: ReportFormValues) => {
        if (photos.length === 0) {
            toast.error("Wajib melampirkan minimal 1 foto bukti fisik lapangan.");
            setCurrentStep(1);
            return;
        }

        const formData = new FormData();
        formData.append("incidentType", data.incidentType);
        formData.append("description", data.description);
        formData.append("lat", data.lat);
        formData.append("lng", data.lng);
        if (data.reporterName) formData.append("reporterName", data.reporterName);
        if (data.reporterContact) formData.append("reporterContact", data.reporterContact);

        photos.forEach((file) => {
            formData.append("evidencePhotos", file);
        });

        const result = await submitCitizenReport(formData);

        if (result.success && result.trackingId) {
            const existingReports = localStorage.getItem("sijaga_citizen_reports");
            const reportsList = existingReports ? JSON.parse(existingReports) : [];
            reportsList.unshift({
                trackingId: result.trackingId,
                incidentType: data.incidentType,
                date: new Date().toISOString().split("T")[0],
                status: "PENDING",
            });
            localStorage.setItem("sijaga_citizen_reports", JSON.stringify(reportsList));
            localStorage.setItem("pantau_limbah_report_id", result.trackingId);
            localStorage.removeItem("SIJAGA_CITIZEN_REPORT_DRAFT");

            toast.success("Laporan terkirim! Mengalihkan ke Halaman Pelacakan...");
            navigate(`/lacak/${result.trackingId}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 text-slate-800 flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans text-left">
            {/* Soft Ambient Light Theme Overlay */}
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-emerald-100/20 rounded-full blur-[120px] -translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-amber-100/20 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

            {/* Kanvas Utama Terpadu - Pembagian Kontras Gelap Terang Tanpa Kotak-dalam-Kotak */}
            <div className="max-w-7xl w-full grid lg:grid-cols-12 items-stretch relative z-10 bg-white border border-slate-150 shadow-2xl overflow-hidden rounded-none">

                {/* SISI KIRI (Sidebar - 4 Kolom): Deep Forest Green Command Anchor */}
                <div className="lg:col-span-4 bg-[#022c22] text-white p-8 md:p-10 flex flex-col justify-between space-y-8 relative">
                    {/* Soft Forest Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/40 to-transparent pointer-events-none" />

                    <div className="space-y-8 relative z-10">
                        <Link to="/" className="flex items-center gap-2 w-fit group outline-none">
                            <div className="w-10 h-10 bg-emerald-500 rounded-none flex items-center justify-center text-white shadow-md transition-all group-hover:bg-emerald-600">
                                <ShieldCheck size={22} />
                            </div>
                            <span className="text-xl font-extrabold italic tracking-tight text-white">
                                PANTAU <span className="text-emerald-400 font-extrabold">LIMBAH</span>
                            </span>
                        </Link>

                        <div className="space-y-3">
                            <Badge className="bg-emerald-500/20 text-emerald-300 rounded-none border border-emerald-500/30 font-bold uppercase tracking-wider text-[9px] px-3 py-1">
                                Portal Pelaporan Publik
                            </Badge>
                            <h1 className="text-3xl font-extrabold text-white leading-tight uppercase tracking-tight">
                                Pengaduan <br />
                                Lingkungan.
                            </h1>
                            <p className="text-emerald-100/70 text-xs font-normal leading-relaxed text-justify">
                                Laporkan indikasi pembuangan limbah kimia, asap beracun, atau limbah industri ilegal langsung di daerah Anda. Kami mengamankan penuh privasi pengaduan Anda [3].
                            </p>
                        </div>
                    </div>

                    {/* Stepper Datar Muted untuk Lingkungan Gelap (Sidebar) */}
                    <div className="space-y-1 py-2 relative z-10">
                        <StepBadge active={currentStep >= 1} num={1} label="Detail Kejadian & Foto" />
                        <StepBadge active={currentStep >= 2} num={2} label="Lokasi Spasial Kejadian" />
                        <StepBadge active={currentStep >= 3} num={3} label="Identitas Anda (Opsional)" />
                    </div>

                    <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest leading-none relative z-10">
                        DINAS LINGKUNGAN HIDUP DAERAH © 2026
                    </div>
                </div>

                {/* SISI KANAN (Formulir - 8 Kolom): Pure Alabaster White */}
                <div className="lg:col-span-8 bg-[#FCFDFD] p-8 md:p-10 flex flex-col justify-between min-h-[580px] text-slate-800 relative z-10">
                    <FormProvider {...methods}>
                        <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col justify-between flex-1">

                            {/* STEP 1: DETAIL MASALAH & MULTI-PHOTO */}
                            {currentStep === 1 && (
                                <div className="space-y-6 animate-in fade-in duration-300 flex flex-col h-full text-left">
                                    <div className="border-b border-slate-100 pb-3">
                                        <h3 className="font-semibold text-[10px] uppercase tracking-wider text-emerald-600 leading-none">Langkah 1</h3>
                                        <h2 className="text-xl font-extrabold text-slate-900 leading-none mt-1.5">Kategori Masalah & Bukti Foto</h2>
                                    </div>

                                    <div className="space-y-5 flex-1">
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-bold uppercase text-slate-600 tracking-wider">Pilih Kategori Pencemaran</Label>
                                            <select
                                                {...methods.register("incidentType")}
                                                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-semibold text-slate-700 focus:outline-none focus:border-slate-800 focus:bg-white transition-all cursor-pointer"
                                            >
                                                <option value="Pencemaran Air">Pencemaran Air / Aliran Sungai</option>
                                                <option value="Emisi Asap">Emisi Asap / Polusi Udara</option>
                                                <option value="Pembuangan B3 Liar">Pembuangan Limbah B3 Liar</option>
                                                <option value="Bau Menyengat">Polusi Bau / Kebisingan Kritis</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-bold uppercase text-slate-600 tracking-wider">Deskripsikan laporan anda</Label>
                                            <textarea
                                                {...methods.register("description")}
                                                rows={4}
                                                placeholder="Tuliskan detail warna air/asap, indikasi nama perusahaan terdekat, atau dampak langsung bagi warga sekitar..."
                                                className="w-full rounded-none border border-slate-200 bg-slate-50 p-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white resize-none leading-relaxed transition-all"
                                            />
                                            {errors.description && (
                                                <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wide mt-1.5 flex items-center gap-1.5">
                                                    <AlertTriangle size={12} /> {errors.description.message}
                                                </span>
                                            )}
                                        </div>

                                        {/* Multi-Photo Grid (WhatsApp Style - Tanpa Double Borders) */}
                                        <div className="space-y-3.5">
                                            <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                                                <Label className="text-[11px] font-bold uppercase text-slate-600 tracking-wider">Unggah Foto Bukti Fisik Lapangan</Label>
                                                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Sisa Kuota: {5 - photos.length} Foto</span>
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handlePhotoChange}
                                            />

                                            <div className="grid grid-cols-5 gap-3">
                                                {/* Upload Trigger Card */}
                                                {photos.length < 5 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="aspect-square border border-dashed border-slate-300 bg-slate-50 hover:bg-emerald-50/20 hover:border-emerald-500 flex flex-col items-center justify-center transition-all rounded-none outline-none group"
                                                    >
                                                        <UploadCloud className="text-slate-400 group-hover:text-emerald-600 transition-colors" size={22} />
                                                        <span className="text-[8px] font-bold text-slate-400 group-hover:text-emerald-600 mt-1 uppercase tracking-wider text-center">Tambah</span>
                                                    </button>
                                                )}

                                                {/* Thumbnail Previews */}
                                                {photos.map((photo, i) => (
                                                    <div key={i} className="aspect-square border border-slate-200 relative overflow-hidden group">
                                                        <img src={URL.createObjectURL(photo)} alt={`preview-${i}`} className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemovePhoto(i)}
                                                            className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <div className="w-6 h-6 bg-rose-600 text-white flex items-center justify-center">
                                                                <X size={12} />
                                                            </div>
                                                        </button>
                                                    </div>
                                                ))}

                                                {/* Empty Slots */}
                                                {Array.from({ length: Math.max(0, 5 - (photos.length + (photos.length < 5 ? 1 : 0))) }).map((_, idx) => (
                                                    <div key={`empty-${idx}`} className="aspect-square border border-slate-100 bg-slate-50/20 flex items-center justify-center text-slate-300">
                                                        <FileImage size={20} className="opacity-20" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-6 border-t border-slate-100 mt-auto">
                                        <Button
                                            type="button"
                                            onClick={handleValidateStep1}
                                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-none font-bold text-xs uppercase tracking-widest px-6 h-10 gap-1.5 shadow-md border-none outline-none"
                                        >
                                            Peta Lokasi <ArrowRight size={14} />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: GEOLOCATION & GEOSPATIAL MAP */}
                            {currentStep === 2 && (
                                <div className="space-y-4 animate-in fade-in duration-300 flex flex-col h-full text-left">
                                    <div className="border-b border-slate-100 pb-3">
                                        <h3 className="font-semibold text-[10px] uppercase tracking-wider text-emerald-600 leading-none">Langkah 2</h3>
                                        <h2 className="text-xl font-extrabold text-slate-900 leading-none mt-1.5">Tentukan Lokasi Persis Kejadian</h2>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        {/* Autocomplete Geocoder Search Input */}
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-bold uppercase text-slate-600 tracking-wider">Cari berdasarkan alamat atau landmark wilayah</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Contoh: Rancaekek, Coblong, atau Jl. Merdeka Bandung..."
                                                    value={addressQuery}
                                                    onChange={(e) => setAddressQuery(e.target.value)}
                                                    onKeyDown={(e) => e.key === "Enter" && handleAddressSearch()}
                                                    className="h-11 rounded-none border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-800 focus:border-slate-800 focus:bg-white transition-all outline-none"
                                                />
                                                <Button
                                                    type="button"
                                                    disabled={isGeocoding}
                                                    onClick={handleAddressSearch}
                                                    className="bg-slate-900 hover:bg-emerald-600 text-white rounded-none h-11 px-5 gap-1.5 shrink-0 font-bold text-xs uppercase tracking-wider shadow-none border-none outline-none"
                                                >
                                                    {isGeocoding ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                                                    Cari
                                                </Button>
                                            </div>
                                        </div>

                                        {/* GPS Trigger Panel */}
                                        <div className="p-3.5 bg-emerald-50/40 border border-emerald-100 rounded-none flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                            <div className="space-y-0.5">
                                                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                                                    <Crosshair size={12} className="text-emerald-600 animate-pulse" /> Ambil koordinat GPS perangkat
                                                </span>
                                                <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                                                    Tekan tombol jika Anda saat ini sedang berdiri di dekat tempat pencemaran.
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    if (!navigator.geolocation) {
                                                        toast.error("Browser tidak mendukung penentuan GPS otomatis.");
                                                        return;
                                                    }
                                                    navigator.geolocation.getCurrentPosition(
                                                        (pos) => {
                                                            setValue("lat", pos.coords.latitude.toFixed(6));
                                                            setValue("lng", pos.coords.longitude.toFixed(6));
                                                            toast.success("Koordinat satelit GPS disinkronkan!");
                                                        },
                                                        () => {
                                                            toast.error("Gagal menjangkau sensor GPS. Periksa izin lokasi.");
                                                        },
                                                        { enableHighAccuracy: true }
                                                    );
                                                }}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-none h-9 px-4 text-[9px] font-bold tracking-widest uppercase gap-1.5 shadow-sm shrink-0 border-none outline-none"
                                            >
                                                Pindai Koordinat
                                            </Button>
                                        </div>

                                        {/* Visual Leaflet OSM Container - SPACIOUS CANVAS */}
                                        <div className="h-[400px] w-full bg-slate-100 rounded-none border border-slate-200 overflow-hidden relative z-10">
                                            <div className="absolute top-2 left-10 bg-slate-900/90 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 z-[999] pointer-events-none rounded-none shadow">
                                                Tip: Anda dapat mengetuk langsung pada peta untuk menyelaraskan Pin lokasi aduan
                                            </div>
                                            <MapContainer
                                                center={
                                                    watch("lat") && watch("lng")
                                                        ? [parseFloat(watch("lat")), parseFloat(watch("lng"))]
                                                        : DEFAULT_CENTER
                                                }
                                                zoom={13}
                                                style={{ height: "100%", width: "100%" }}
                                            >
                                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                <InteractiveMapEvents setValue={setValue} />
                                                <ResizeMapHelper />
                                                <MapCenterFlyer lat={watch("lat")} lng={watch("lng")} />
                                                {watch("lat") && watch("lng") && (
                                                    <Marker position={[parseFloat(watch("lat")), parseFloat(watch("lng"))]} />
                                                )}
                                            </MapContainer>
                                        </div>

                                        {/* Read-Only Coordinate Details */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Latitude</Label>
                                                <Input
                                                    readOnly
                                                    {...methods.register("lat")}
                                                    placeholder="Menunggu ketukan peta..."
                                                    className="h-10 rounded-none border-slate-200 bg-slate-50 font-mono text-xs font-bold"
                                                />
                                                {errors.lat && (
                                                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1 mt-1">
                                                        <AlertTriangle size={10} /> {errors.lat.message}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Longitude</Label>
                                                <Input
                                                    readOnly
                                                    {...methods.register("lng")}
                                                    placeholder="Menunggu ketukan peta..."
                                                    className="h-10 rounded-none border-slate-200 bg-slate-50 font-mono text-xs font-bold"
                                                />
                                                {errors.lng && (
                                                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1 mt-1">
                                                        <AlertTriangle size={10} /> {errors.lng.message}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-4 border-t border-slate-100 mt-auto gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={prevStep}
                                            className="rounded-none font-bold text-xs uppercase tracking-widest text-slate-500 hover:text-slate-800"
                                        >
                                            <ArrowLeft size={14} className="mr-1" /> Kembali
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={handleValidateStep2}
                                            className="bg-slate-900 hover:bg-emerald-600 text-white rounded-none font-bold text-xs uppercase tracking-widest px-6 h-10 gap-1.5 shadow-md border-none outline-none"
                                        >
                                            Tahap Akhir <ArrowRight size={14} />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: CONTACT INFORMATION (OPTIONAL) */}
                            {currentStep === 3 && (
                                <div className="space-y-6 animate-in fade-in duration-300 flex flex-col h-full text-left">
                                    <div className="border-b border-slate-100 pb-3">
                                        <h3 className="font-semibold text-[10px] uppercase tracking-wider text-emerald-600 leading-none">Langkah 3</h3>
                                        <h2 className="text-xl font-extrabold text-slate-900 leading-none mt-1.5">Kontak Pelapor (Opsional)</h2>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-none flex items-start gap-3">
                                            <ShieldCheck className="text-emerald-600 shrink-0 mt-0.5 animate-pulse" size={18} />
                                            <div className="space-y-1">
                                                <h4 className="text-[10px] font-bold text-emerald-950 uppercase tracking-widest leading-none">Keamanan Enkripsi Whistleblower</h4>
                                                <p className="text-[9px] font-medium text-emerald-700 leading-normal">
                                                    Formulir kontak ini bersifat *OPSIONAL*. Jika dikosongkan, laporan akan terdaftar secara *ANONIM* sehingga tidak ada pihak mana pun yang dapat melacak identitas Anda.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Nama Lengkap (Opsional)</Label>
                                                <div className="relative">
                                                   
                                                    <Input
                                                        {...methods.register("reporterName")}
                                                        placeholder="Sembunyikan / Anonim"
                                                        className="h-11 rounded-none border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-800 focus:border-slate-800 focus:bg-white transition-all outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">No. WhatsApp / Email (Opsional)</Label>
                                                <div className="relative">
                                                    <Input
                                                        {...methods.register("reporterContact")}
                                                        placeholder="Untuk pembaruan status tiket"
                                                        className="h-11 rounded-none border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-800 focus:border-slate-800 focus:bg-white transition-all outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-6 border-t border-slate-100 mt-auto gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={prevStep}
                                            className="rounded-none font-bold text-xs uppercase tracking-widest text-slate-500 hover:text-slate-800"
                                        >
                                            <ArrowLeft size={14} className="mr-1" /> Kembali
                                        </Button>

                                        <Button
                                            type="submit"
                                            disabled={isReportLoading}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest px-8 h-12 gap-2 shadow-lg rounded-none border-none outline-none"
                                        >
                                            {isReportLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    KIRIM LAPORAN...
                                                </>
                                            ) : (
                                                <>
                                                    KIRIM ADUAN SEKARANG <CheckCircle2 size={14} />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}

                        </form>
                    </FormProvider>
                </div>

            </div>
        </div>
    );
}

// --- SUB-COMPONENTS & HELPERS ---

function StepBadge({ active, num, label }: { active: boolean; num: number; label: string }) {
    return (
        <div className={`flex items-center gap-3 p-2.5 transition-all duration-300 ${active ? "opacity-100" : "opacity-30"}`}>
            <div className={`w-6 h-6 flex items-center justify-center font-bold text-xs rounded-none border ${active ? "bg-emerald-500 border-emerald-400 text-white" : "border-emerald-800/80 text-emerald-700/60"}`}>
                {num}
            </div>
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${active ? "text-white" : "text-emerald-700/60"}`}>
                {label}
            </span>
        </div>
    );
}

function InteractiveMapEvents({ setValue }: { setValue: any }) {
    useMapEvents({
        click(e) {
            setValue("lat", e.latlng.lat.toFixed(6));
            setValue("lng", e.latlng.lng.toFixed(6));
        },
    });
    return null;
}

function MapCenterFlyer({ lat, lng }: { lat: string; lng: string }) {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.flyTo([parseFloat(lat), parseFloat(lng)], 16, { animate: true });
        }
    }, [lat, lng, map]);
    return null;
}

function ResizeMapHelper() {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 250);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
}