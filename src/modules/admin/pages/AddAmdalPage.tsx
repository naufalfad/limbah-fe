// src/modules/admin/pages/AddAmdalPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Building2, MapPin, FileText, ArrowLeft, Save,
  Trash2, CheckCircle2, AlertCircle, Info, UploadCloud
} from "lucide-react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- Leaflet & Map Imports ---
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

function MapPicker({ lat, lng, onChange }: { lat: string; lng: string; onChange: (lat: string, lng: string) => void }) {
  useMapEvents({
    click(e) {
      onChange(String(e.latlng.lat.toFixed(6)), String(e.latlng.lng.toFixed(6)));
    },
  });

  // Fallback dialihkan ke titik pusat kota Sampit, Kabupaten Kotawaringin Timur [3]
  const parsedLat = parseFloat(lat) || -2.5337;
  const parsedLng = parseFloat(lng) || 112.9515;

  return <Marker position={[parsedLat, parsedLng]} />;
}

const AMDAL_DOCS_CONFIG = [
  { key: "andalDoc", label: "Dokumen ANDAL", isRequired: true, accept: ".pdf", acceptLabel: "PDF (.pdf) Saja" },
  { key: "rklDoc", label: "Matriks RKL (Pengelolaan)", isRequired: true, accept: ".xlsx,.xls", acceptLabel: "Excel (.xlsx/.xls) Saja" },
  { key: "rplDoc", label: "Matriks RPL (Pemantauan)", isRequired: true, accept: ".xlsx,.xls", acceptLabel: "Excel (.xlsx/.xls) Saja" },
  { key: "skKelayakanDoc", label: "SK Kelayakan Lingkungan", isRequired: false, accept: ".pdf", acceptLabel: "PDF (.pdf) Saja" },
  { key: "persetujuanDoc", label: "Persetujuan Lingkungan", isRequired: false, accept: ".pdf", acceptLabel: "PDF (.pdf) Saja" },
] as const;

export default function AddAmdalPage() {
  const navigate = useNavigate();
  const { fetchCompanies } = useSijagaStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Form State Default dialihkan ke pusat wilayah Kabupaten Kotawaringin Timur [3]
  const [form, setForm] = useState({
    companyName: "",
    activityName: "",
    address: "",
    lat: "-2.5337", // Diubah secara internal mengikuti koordinat default Sampit
    lng: "112.9515",
    envApprovalNo: "",
    envApprovalDate: "",
    amdalNo: "",
    amdalYear: String(new Date().getFullYear()),
    businessSector: "",
    status: "APPROVED",
    nib: "",
    npwp: "",
  });

  // Document Uploads State (Simpan langsung instansi File)
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [companyPhoto, setCompanyPhoto] = useState<File | null>(null); // State untuk file foto industri baru

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleMapChange = (lat: string, lng: string) => {
    setForm(prev => ({ ...prev, lat, lng }));
  };

  const handleFileUpload = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check extension
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const config = AMDAL_DOCS_CONFIG.find(c => c.key === key);
    if (config) {
      const allowedExts = config.accept.split(",");
      if (!allowedExts.includes(ext)) {
        toast.error(`Format berkas ${file.name} tidak sesuai! Hanya menerima ${config.acceptLabel}.`);
        return;
      }
    }

    setUploadedFiles(prev => ({
      ...prev,
      [key]: file
    }));
    toast.success(`Berkas ${file.name} berhasil dimuat.`);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png"];
    if (!allowedExts.includes(ext)) {
      toast.error(`Format gambar ${file.name} tidak sesuai! Hanya menerima format JPG, JPEG, PNG.`);
      return;
    }

    setCompanyPhoto(file);
    toast.success(`Foto ${file.name} berhasil dimuat.`);
  };

  const removeFile = (key: string) => {
    setUploadedFiles(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    toast.info("Berkas dihapus.");
  };

  // Step Validation Helpers
  const validateStep1 = () => {
    if (!form.companyName.trim()) {
      toast.error("Nama Perusahaan wajib diisi!");
      return false;
    }
    if (!form.activityName.trim()) {
      toast.error("Nama Kegiatan wajib diisi!");
      return false;
    }
    if (!form.businessSector.trim()) {
      toast.error("Jenis / Sektor Usaha wajib diisi!");
      return false;
    }
    if (!form.envApprovalNo.trim()) {
      toast.error("Nomor Persetujuan Lingkungan wajib diisi!");
      return false;
    }
    if (!form.envApprovalDate) {
      toast.error("Tanggal Persetujuan Lingkungan wajib dipilih!");
      return false;
    }
    if (!form.amdalNo.trim()) {
      toast.error("Nomor Dokumen AMDAL wajib diisi!");
      return false;
    }
    if (!form.amdalYear.trim()) {
      toast.error("Tahun AMDAL wajib diisi!");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!form.address.trim()) {
      toast.error("Alamat detail wajib diisi!");
      return false;
    }
    if (form.address.trim().length < 10) {
      toast.error("Alamat detail minimal 10 karakter!");
      return false;
    }
    if (!form.lat.trim() || !form.lng.trim()) {
      toast.error("Koordinat GPS Latitude dan Longitude wajib ditentukan!");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (!validateStep2()) {
      setStep(2);
      return;
    }

    // Validasi Dokumen Wajib
    const missingDocs: string[] = [];
    AMDAL_DOCS_CONFIG.forEach(doc => {
      if (doc.isRequired && !uploadedFiles[doc.key]) {
        missingDocs.push(doc.label);
      }
    });

    if (missingDocs.length > 0) {
      toast.error(`Dokumen wajib berikut belum diunggah: ${missingDocs.join(", ")}`);
      setStep(3);
      return;
    }

    setLoading(true);
    try {
      // Konstruksi FormData multipart/form-data
      const formData = new FormData();

      // Lampirkan data tekstual
      Object.entries(form).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          formData.append(key, val);
        }
      });

      // Lampirkan berkas fisik
      Object.entries(uploadedFiles).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file);
        }
      });

      // Lampirkan biner foto industri baru ke payload form data
      if (companyPhoto) {
        formData.append("companyPhoto", companyPhoto);
      }

      const { addManualAmdalCompany } = useSijagaStore.getState();
      await addManualAmdalCompany(formData);
      await fetchCompanies();

      toast.success("Perusahaan Wajib AMDAL Baru berhasil didaftarkan secara manual!");
      navigate("/admin/companies");
    } catch (err: any) {
      console.error(err);
      toast.error("Terjadi kesalahan saat memproses pendaftaran AMDAL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800 text-left">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* --- HEADER BAR (No Rounded Sides) --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 border border-slate-200 rounded-none shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/companies")}
                className="h-8 w-8 p-0 rounded-none border-slate-200 hover:bg-slate-100 shrink-0"
              >
                <ArrowLeft size={16} />
              </Button>
              <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-none text-[8px] font-black uppercase tracking-widest leading-none">
                MANUAL ENTRY
              </span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase leading-none">
              Registrasi Wajib <span className="text-rose-600">AMDAL</span> Baru
            </h1>
            <p className="text-slate-500 text-[11px] font-semibold mt-1.5">Pendaftaran manual spasial & pemberkasan AMDAL terpadu DLH Kabupaten Kotawaringin Timur.</p>
          </div>
        </div>

        {/* --- STEP PROGRESS BAR (Sharp / Square, No Rounded Sides) --- */}
        <div className="grid grid-cols-3 border border-slate-200 bg-white rounded-none shadow-sm text-center font-bold text-xs select-none">
          <div
            onClick={() => step > 1 && setStep(1)}
            className={cn(
              "py-4 transition-all border-r border-slate-200 cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1.5",
              step === 1 ? "bg-rose-600 text-white" : "bg-slate-50 hover:bg-slate-100 text-slate-500"
            )}
          >
            <span className="text-[10px] opacity-70 font-mono">STEP 1</span>
            <span className="tracking-wide uppercase text-[10px] sm:text-xs">LEGALITAS & KEGIATAN</span>
            {step > 1 && <span className="text-[10px] text-emerald-500 font-bold">✓</span>}
          </div>
          <div
            onClick={() => step > 2 && setStep(2)}
            className={cn(
              "py-4 transition-all border-r border-slate-200 cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1.5",
              step === 2 ? "bg-rose-600 text-white" : "bg-slate-50 hover:bg-slate-100 text-slate-500",
              step < 2 && "cursor-not-allowed pointer-events-none"
            )}
          >
            <span className="text-[10px] opacity-70 font-mono">STEP 2</span>
            <span className="tracking-wide uppercase text-[10px] sm:text-xs">GIS & SPASIAL</span>
            {step > 2 && <span className="text-[10px] text-emerald-500 font-bold">✓</span>}
          </div>
          <div
            className={cn(
              "py-4 transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5",
              step === 3 ? "bg-rose-600 text-white" : "bg-slate-50 text-slate-400",
              step < 3 && "cursor-not-allowed pointer-events-none"
            )}
          >
            <span className="text-[10px] opacity-70 font-mono">STEP 3</span>
            <span className="tracking-wide uppercase text-[10px] sm:text-xs">DOKUMEN & MATRIKS</span>
          </div>
        </div>

        {/* --- FORM BODY CONTROLLER --- */}
        <div className="bg-white border border-slate-200 rounded-none shadow-sm p-6">

          {/* STEP 1: INFORMASI LEGALITAS & KEGIATAN */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building2 size={18} className="text-rose-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Langkah 1: Informasi Legalitas & Kegiatan AMDAL
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="companyName" className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    Nama Perusahaan <span className="text-rose-600">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={form.companyName}
                    onChange={handleTextChange}
                    placeholder="PT. Mentaya Sawit Mas"
                    className="h-10 rounded-none border-slate-200 font-bold text-xs focus:ring-0 focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="activityName" className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    Nama Kegiatan <span className="text-rose-600">*</span>
                  </Label>
                  <Input
                    id="activityName"
                    name="activityName"
                    value={form.activityName}
                    onChange={handleTextChange}
                    placeholder="Pembangunan Pabrik Kelapa Sawit Terintegrasi"
                    className="h-10 rounded-none border-slate-200 font-bold text-xs focus:ring-0 focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="businessSector" className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    Jenis/Sektor Usaha <span className="text-rose-600">*</span>
                  </Label>
                  <Input
                    id="businessSector"
                    name="businessSector"
                    value={form.businessSector}
                    onChange={handleTextChange}
                    placeholder="Industri Pengolahan Minyak Kelapa Sawit"
                    className="h-10 rounded-none border-slate-200 font-bold text-xs focus:ring-0 focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    Status AMDAL <span className="text-rose-600">*</span>
                  </Label>
                  <select
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={handleTextChange}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-none font-bold text-xs focus:outline-none focus:border-rose-500"
                  >
                    <option value="APPROVED">APPROVED (Disetujui)</option>
                    <option value="REVIEW">REVIEW (Dalam Penelaahan)</option>
                    <option value="PENDING">PENDING (Menunggu)</option>
                    <option value="REJECTED">REJECTED (Ditolak)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="envApprovalNo" className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    Nomor Persetujuan Lingkungan <span className="text-rose-600">*</span>
                  </Label>
                  <Input
                    id="envApprovalNo"
                    name="envApprovalNo"
                    value={form.envApprovalNo}
                    onChange={handleTextChange}
                    placeholder="S.120/MENLHK/SETJEN/PLA.4/3/2026"
                    className="h-10 rounded-none border-slate-200 font-bold text-xs focus:ring-0 focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="envApprovalDate" className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    Tanggal Persetujuan Lingkungan <span className="text-rose-600">*</span>
                  </Label>
                  <Input
                    id="envApprovalDate"
                    name="envApprovalDate"
                    type="date"
                    value={form.envApprovalDate}
                    onChange={handleTextChange}
                    className="h-10 rounded-none border-slate-200 font-bold text-xs focus:ring-0 focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="amdalNo" className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    Nomor AMDAL <span className="text-rose-600">*</span>
                  </Label>
                  <Input
                    id="amdalNo"
                    name="amdalNo"
                    value={form.amdalNo}
                    onChange={handleTextChange}
                    placeholder="AMDAL/REG/KWT/0014"
                    className="h-10 rounded-none border-slate-200 font-bold text-xs focus:ring-0 focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="amdalYear" className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    Tahun AMDAL <span className="text-rose-600">*</span>
                  </Label>
                  <Input
                    id="amdalYear"
                    name="amdalYear"
                    type="number"
                    maxLength={4}
                    value={form.amdalYear}
                    onChange={handleTextChange}
                    placeholder="2026"
                    className="h-10 rounded-none border-slate-200 font-bold text-xs focus:ring-0 focus:border-rose-500"
                  />
                </div>

                {/* Optional Fallbacks for database integrity */}
                <div className="space-y-1.5">
                  <Label htmlFor="nib" className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    Nomor NIB (Opsional)
                  </Label>
                  <Input
                    id="nib"
                    name="nib"
                    value={form.nib}
                    onChange={handleTextChange}
                    placeholder="Jika ada, kosongkan untuk auto-generate"
                    className="h-10 rounded-none border-slate-200 font-bold text-xs focus:ring-0 focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="npwp" className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    NPWP Perusahaan (Opsional)
                  </Label>
                  <Input
                    id="npwp"
                    name="npwp"
                    value={form.npwp}
                    onChange={handleTextChange}
                    placeholder="NPWP Perusahaan"
                    className="h-10 rounded-none border-slate-200 font-bold text-xs focus:ring-0 focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  onClick={handleNextStep}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 h-10 rounded-none tracking-wider uppercase"
                >
                  Lanjut ke Langkah 2
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: KOORDINAT & SPASIAL */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <MapPin size={18} className="text-rose-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Langkah 2: Penentuan Koordinat Spasial & Alamat GIS
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form Input Alamat */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      Alamat Operasional Detail <span className="text-rose-600">*</span>
                    </Label>
                    <textarea
                      id="address"
                      name="address"
                      value={form.address}
                      onChange={handleTextChange}
                      placeholder="Jl. Tjilik Riwut KM 32, Cempaga, Kabupaten Kotawaringin Timur"
                      className="w-full min-h-[120px] rounded-none border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-500 transition-all shadow-inner resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="lat" className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Latitude</Label>
                      <Input
                        id="lat"
                        name="lat"
                        value={form.lat}
                        onChange={handleTextChange}
                        placeholder="-2.5337"
                        className="h-10 rounded-none border-slate-200 font-bold text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lng" className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Longitude</Label>
                      <Input
                        id="lng"
                        name="lng"
                        value={form.lng}
                        onChange={handleTextChange}
                        placeholder="112.9515"
                        className="h-10 rounded-none border-slate-200 font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Leaflet Picker Map */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 flex items-center gap-2 rounded-none">
                    <Info size={14} className="text-rose-600 shrink-0" />
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide leading-normal">
                      Klik langsung pada kanvas peta di bawah untuk memetakan koordinat latitude/longitude secara otomatis.
                    </p>
                  </div>

                  <div className="h-[280px] w-full bg-slate-100 border border-slate-200 rounded-none relative z-10 overflow-hidden shadow-inner">
                    <MapContainer
                      center={[-2.5337, 112.9515]} // Pusat peta Sampit
                      zoom={11}
                      zoomControl={true}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <MapPicker
                        lat={form.lat}
                        lng={form.lng}
                        onChange={handleMapChange}
                      />
                      <ResizeMap />
                    </MapContainer>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  className="border-slate-200 hover:bg-slate-100 text-slate-700 font-black text-xs px-5 h-10 rounded-none uppercase tracking-wider"
                >
                  Kembali
                </Button>
                <Button
                  onClick={handleNextStep}
                  className="bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs px-6 h-10 rounded-none tracking-wider uppercase"
                >
                  Lanjut ke Langkah 3
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: UNGGAHAN BERKAS AMDAL */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-rose-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Langkah 3: Unggahan Berkas AMDAL Pendukung & Matriks Excel
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-wide">
                  <span className="bg-rose-500 text-white px-2 py-0.5 rounded-none">3 Wajib</span>
                  <span className="bg-slate-700 text-white px-2 py-0.5 rounded-none">3 Opsional</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AMDAL_DOCS_CONFIG.map((doc, idx) => {
                  const uploaded = uploadedFiles[doc.key];
                  const fileSizeStr = uploaded
                    ? uploaded.size > 1024 * 1024
                      ? `${(uploaded.size / (1024 * 1024)).toFixed(2)} MB`
                      : `${(uploaded.size / 1024).toFixed(1)} KB`
                    : "";

                  return (
                    <div key={doc.key} className={cn(
                      "p-3.5 rounded-none border flex flex-col justify-between gap-3 shadow-sm hover:border-slate-350 transition-all bg-white relative",
                      doc.isRequired ? "border-slate-200" : "border-slate-100 bg-slate-50/20"
                    )}>

                      {/* Meta Title & Badge */}
                      <div className="flex justify-between items-start gap-2 text-left">
                        <div className="space-y-0.5">
                          <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">DOKUMEN KE-{idx + 1}</span>
                          <h4 className="text-xs font-black text-slate-800 leading-snug">{doc.label}</h4>
                          <span className="text-[8.5px] font-bold text-rose-550 block">{doc.acceptLabel}</span>
                        </div>

                        <span className={cn(
                          "px-1.5 py-0.5 rounded-none text-[7.5px] font-black uppercase tracking-widest shrink-0 border leading-none",
                          doc.isRequired
                            ? "bg-rose-50 text-rose-600 border-rose-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        )}>
                          {doc.isRequired ? "WAJIB" : "OPSIONAL"}
                        </span>
                      </div>

                      {/* File display or upload dropzone */}
                      {uploaded ? (
                        <div className="bg-emerald-50/50 border border-emerald-250 rounded-none p-2.5 flex items-center justify-between gap-2 text-xs font-bold text-emerald-950 animate-in zoom-in-95">
                          <div className="min-w-0 flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="truncate text-[10.5px] font-bold text-emerald-950">{uploaded.name}</p>
                              <p className="text-[8px] font-bold text-emerald-650 uppercase tracking-wider">{fileSizeStr}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => removeFile(doc.key)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-none"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="file"
                            accept={doc.accept}
                            id={`file-upload-${doc.key}`}
                            className="hidden"
                            onChange={(e) => handleFileUpload(doc.key, e)}
                          />
                          <label
                            htmlFor={`file-upload-${doc.key}`}
                            className={cn(
                              "border border-dashed border-slate-250 bg-slate-50 hover:bg-slate-100 hover:border-slate-350 rounded-none p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-colors h-[54px] shadow-inner",
                              doc.isRequired ? "border-rose-200/60" : ""
                            )}
                          >
                            <UploadCloud size={16} className="text-slate-400 shrink-0 mb-1" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-450 block leading-none">PILIH BERKAS SCAN</span>
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* FOTO PROFIL INDUSTRI / PABRIK (INJEKSI BARU - MANUAL AMDAL ENTRY) */}
                <div className="p-3.5 rounded-none border border-slate-100 bg-slate-50/20 flex flex-col justify-between gap-3 shadow-sm hover:border-slate-350 transition-all bg-white relative">
                  <div className="flex justify-between items-start gap-2 text-left">
                    <div className="space-y-0.5">
                      <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">ASET VISUAL</span>
                      <h4 className="text-xs font-black text-slate-800 leading-snug">Foto Profil Industri / Pabrik</h4>
                      <span className="text-[8.5px] font-bold text-rose-550 block">Gambar (JPG, JPEG, PNG) Saja</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-none text-[7.5px] font-black uppercase tracking-widest shrink-0 border leading-none bg-slate-100 text-slate-500 border-slate-200">
                      OPSIONAL
                    </span>
                  </div>

                  {companyPhoto ? (
                    <div className="bg-emerald-50/50 border border-emerald-250 rounded-none p-2.5 flex items-center justify-between gap-2 text-xs font-bold text-emerald-950 animate-in zoom-in-95">
                      <div className="min-w-0 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="truncate text-[10.5px] font-bold text-emerald-950">{companyPhoto.name}</p>
                          <p className="text-[8px] font-bold text-emerald-650 uppercase tracking-wider">
                            {(companyPhoto.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => setCompanyPhoto(null)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-none"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        id="file-upload-company-photo"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                      <label
                        htmlFor="file-upload-company-photo"
                        className="border border-dashed border-slate-250 bg-slate-50 hover:bg-slate-100 hover:border-slate-350 rounded-none p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-colors h-[54px] shadow-inner"
                      >
                        <UploadCloud size={16} className="text-slate-400 shrink-0 mb-1" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-450 block leading-none">UNGGAH FOTO PABRIK</span>
                      </label>
                    </div>
                  )}
                </div>

              </div>

              <div className="pt-4 flex justify-between border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  className="border-slate-200 hover:bg-slate-100 text-slate-700 font-black text-xs px-5 h-10 rounded-none uppercase tracking-wider"
                >
                  Kembali
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-6 h-10 rounded-none shadow-sm tracking-wider flex items-center gap-1.5 uppercase"
                >
                  {loading ? "Menyimpan..." : "Simpan Wajib AMDAL"}
                  <Save size={14} />
                </Button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}