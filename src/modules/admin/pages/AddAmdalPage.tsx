// src/modules/admin/pages/AddAmdalPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Building2, MapPin, FileText, ArrowLeft, Save,
  Map, Trash2, ShieldCheck, CheckCircle2, AlertCircle, Info, UploadCloud
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

  // Fallback diubah ke titik pusat Cibinong, Kabupaten Bogor
  const parsedLat = parseFloat(lat) || -6.4816;
  const parsedLng = parseFloat(lng) || 106.8560;

  return <Marker position={[parsedLat, parsedLng]} />;
}

interface AmdalFileState {
  fileName: string;
  fileSize: string;
  base64Data: string;
}

const AMDAL_DOCS_CONFIG = [
  { key: "skPersetujuan", label: "SK Persetujuan Lingkungan", isRequired: true },
  { key: "skKelayakan", label: "SK Kelayakan Lingkungan", isRequired: true },
  { key: "ringkasanAmdal", label: "Ringkasan AMDAL", isRequired: false },
  { key: "dokumenAndal", label: "Dokumen ANDAL", isRequired: true },
  { key: "dokumenRkl", label: "Dokumen RKL", isRequired: true },
  { key: "dokumenRpl", label: "Dokumen RPL", isRequired: true },
  { key: "petaLokasi", label: "Peta Lokasi Spasial", isRequired: true },
  { key: "layoutIpal", label: "Layout IPAL Teknis", isRequired: false },
  { key: "layoutTpsB3", label: "Layout TPS B3", isRequired: false },
  { key: "hasilUjiLab", label: "Hasil Uji Laboratorium", isRequired: false },
  { key: "dokumentasiLokasi", label: "Dokumentasi Foto Lokasi", isRequired: false },
] as const;

export default function AddAmdalPage() {
  const navigate = useNavigate();
  const { fetchCompanies } = useSijagaStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Form State Default dialihkan ke pusat wilayah Kabupaten Bogor (Cibinong)
  const [form, setForm] = useState({
    companyName: "",
    nib: "",
    npwp: "",
    address: "",
    lat: "-6.4816",
    lng: "106.8560",
  });

  // Document Uploads State
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, AmdalFileState>>({});

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleMapChange = (lat: string, lng: string) => {
    setForm(prev => ({ ...prev, lat, lng }));
  };

  const handleFileUpload = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${(file.size / 1024).toFixed(1)} KB`;

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedFiles(prev => ({
        ...prev,
        [key]: {
          fileName: file.name,
          fileSize: fileSizeStr,
          base64Data: reader.result as string
        }
      }));
      toast.success(`Berkas ${file.name} berhasil dimuat.`);
    };
    reader.readAsDataURL(file);
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
    if (!form.nib.trim()) {
      toast.error("Nomor NIB wajib diisi!");
      return false;
    }
    if (form.nib.trim().length < 5) {
      toast.error("Nomor Induk Berusaha (NIB) minimal 5 karakter!");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!form.address.trim()) {
      toast.error("Alamat detail wajib diisi!");
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

    // 1. Validasi seluruh step
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (!validateStep2()) {
      setStep(2);
      return;
    }

    // 2. Validasi Dokumen Wajib (6 Dokumen)
    const missingDocs: string[] = [];
    AMDAL_DOCS_CONFIG.forEach(doc => {
      if (doc.isRequired && !uploadedFiles[doc.key]) {
        missingDocs.push(doc.label);
      }
    });

    if (missingDocs.length > 0) {
      toast.error(`Dokumen wajib berikut belum diunggah: ${missingDocs.join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      // 3. Serialisasi Berkas ke JSON di docTemplateUrl
      const amdalDocsJson = JSON.stringify(uploadedFiles);

      const payload = {
        companyName: form.companyName,
        nib: form.nib,
        npwp: form.npwp || "-",
        address: form.address,
        lat: form.lat,
        lng: form.lng,
        docTemplateUrl: amdalDocsJson // Menyimpan seluruh dokumen AMDAL di sini
      };

      const { addManualAmdalCompany } = useSijagaStore.getState();
      await addManualAmdalCompany(payload);
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
              <span className="bg-rose-50 text-rose-700 border border-rose-250 px-2 py-0.5 rounded-none text-[8px] font-black uppercase tracking-widest leading-none">
                MANUAL ENTRY
              </span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase leading-none">
              Registrasi Wajib <span className="text-rose-600">AMDAL</span> Baru
            </h1>
            <p className="text-slate-500 text-[11px] font-semibold mt-1.5">Pendaftaran manual spasial & pemberkasan AMDAL terpadu DLH Kabupaten Bogor.</p>
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
            <span className="tracking-wide uppercase text-[10px] sm:text-xs">LEGALITAS</span>
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
            <span className="tracking-wide uppercase text-[10px] sm:text-xs">DOKUMEN AMDAL</span>
          </div>
        </div>

        {/* --- FORM BODY CONTROLLER --- */}
        <div className="bg-white border border-slate-200 rounded-none shadow-sm p-6">

          {/* STEP 1: INFORMASI LEGALITAS */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building2 size={18} className="text-rose-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Langkah 1: Informasi Legalitas Perusahaan
                </h3>
              </div>

              <div className="space-y-4 max-w-2xl">
                <div className="space-y-1.5">
                  <Label htmlFor="companyName" className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    Nama Perusahaan <span className="text-rose-600">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={form.companyName}
                    onChange={handleTextChange}
                    placeholder="PT. Eco Semen Indonesia"
                    className="h-10 rounded-none border-slate-200 font-bold text-xs focus:ring-0 focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nib" className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      Nomor NIB <span className="text-rose-600">*</span>
                    </Label>
                    <Input
                      id="nib"
                      name="nib"
                      maxLength={13}
                      value={form.nib}
                      onChange={handleTextChange}
                      placeholder="13 Digit NIB"
                      className="h-10 rounded-none border-slate-200 font-bold text-xs focus:ring-0 focus:border-rose-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="npwp" className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      NPWP (Opsional)
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
                      placeholder="Jl. Mayor Oking No. 1, Citeureup, Kabupaten Bogor"
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
                        placeholder="-6.4816"
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
                        placeholder="106.8560"
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
                      center={[-6.4816, 106.8560]} // Pusat peta Cibinong
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
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 h-10 rounded-none tracking-wider uppercase"
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
                    Langkah 3: Unggahan 11 Dokumen AMDAL Pendukung
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-wide">
                  <span className="bg-rose-500 text-white px-2 py-0.5 rounded-none">6 Wajib</span>
                  <span className="bg-slate-700 text-white px-2 py-0.5 rounded-none">5 Opsional</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AMDAL_DOCS_CONFIG.map((doc, idx) => {
                  const uploaded = uploadedFiles[doc.key];
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
                              <p className="truncate text-[10.5px] font-bold text-emerald-950">{uploaded.fileName}</p>
                              <p className="text-[8px] font-bold text-emerald-650 uppercase tracking-wider">{uploaded.fileSize}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
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
                            accept="application/pdf,image/*,.docx,.xlsx"
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
                  onSubmit={handleSubmit}
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