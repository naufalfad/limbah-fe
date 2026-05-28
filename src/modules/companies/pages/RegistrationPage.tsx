// src/modules/companies/pages/RegistrationPage.tsx
import React, { useState, useRef, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Building2, MapPin, Factory, FileStack,
  CheckCircle2, ChevronRight, ChevronLeft,
  Search, ShieldAlert, Map as MapIcon,
  Loader2, UploadCloud, FileText, X, AlertCircle, Download
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { useSijagaStore } from "@/store/useSijagaStore";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";

// --- Fix Leaflet Default Marker Icons (GFW Paradigm Safety) ---
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Map size invalidator helper (Resolves gray tile bugs on wizard transition)
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

// --- SCHEMA VALIDASI (ZOD) ---
const registrationSchema = z.object({
  companyName: z.string().min(3, "Nama perusahaan wajib diisi"),
  nib: z.string().min(5, "NIB tidak valid"),
  npwp: z.string().min(5, "NPWP tidak valid"),
  picName: z.string().min(3, "Nama penanggung jawab wajib"),
  picPhone: z.string().min(10, "Nomor telepon tidak valid"),
  picRole: z.string().min(1, "Jabatan wajib diisi"),
  kbli: z.string().min(1, "KBLI wajib dipilih"),
  investment: z.coerce.number().min(1, "Modal investasi wajib diisi"),
  landArea: z.coerce.number().min(1, "Luas lahan wajib diisi"),
  employees: z.coerce.number().int().min(1, "Jumlah tenaga kerja wajib"),
  buildingArea: z.coerce.number().min(1, "Luas bangunan wajib"),
  lat: z.string().min(1, "Latitude wajib"),
  lng: z.string().min(1, "Longitude wajib"),
  address: z.string().min(10, "Alamat detail wajib"),
  investmentType: z.enum(["PMDN", "PMA"]),
  yearBuilt: z.string(),
  operationalHours: z.string(),
  rawMaterials: z.string().min(1, "Bahan baku wajib diisi"),
  waterSource: z.string().min(1, "Sumber air wajib diisi"),
  powerSource: z.string().min(1, "Sumber listrik wajib diisi"),
  wasteInfo: z.string().optional(),
  hasTps: z.boolean().default(false),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

export default function RegistrationPage() {
  const currentUser = useSijagaStore((state) => state.currentUser);
  const addCompany = useSijagaStore((state) => state.addCompany);
  const { companies, selectedCompanyId, updateCompany } = useSijagaStore();

  const query = new URLSearchParams(window.location.search);
  const isEdit = query.get("edit") === "true";
  const existingCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];

  const [currentStep, setCurrentStep] = useState(1);
  const [docType, setDocType] = useState<"SPPL" | "UKL-UPL" | null>(null);
  const [loading, setLoading] = useState(false);

  // --- File Upload State (Multipart Files Handler) ---
  const [nibFile, setNibFile] = useState<File | null>(null);
  const [npwpFile, setNpwpFile] = useState<File | null>(null);
  const [siteplanFile, setSiteplanFile] = useState<File | null>(null);
  const [docTemplateFile, setDocTemplateFile] = useState<File | null>(null);

  const methods = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema) as any,
    mode: "onChange",
  });

  const { watch, handleSubmit } = methods;

  // Pre-fill form values in edit/reversion mode
  useEffect(() => {
    if (isEdit && existingCompany) {
      methods.reset({
        companyName: existingCompany.companyName,
        nib: existingCompany.nib,
        npwp: existingCompany.npwp,
        picName: existingCompany.picName,
        picPhone: existingCompany.picPhone,
        picRole: existingCompany.picRole,
        kbli: existingCompany.kbli,
        investment: existingCompany.investment,
        landArea: existingCompany.landArea,
        employees: existingCompany.employees,
        buildingArea: existingCompany.buildingArea,
        lat: existingCompany.lat,
        lng: existingCompany.lng,
        address: existingCompany.address,
        investmentType: existingCompany.investmentType,
        yearBuilt: existingCompany.yearBuilt,
        operationalHours: existingCompany.operationalHours,
        rawMaterials: existingCompany.rawMaterials,
        waterSource: existingCompany.waterSource,
        powerSource: existingCompany.powerSource,
        wasteInfo: existingCompany.wasteInfo || "",
        hasTps: existingCompany.hasTps || false,
      });
      setDocType(existingCompany.docType === "UKL_UPL" ? "UKL-UPL" : existingCompany.docType as any);
    }
  }, [isEdit, existingCompany, methods]);

  // Logika Penapisan Otomatis ESG (Smart Assessment)
  const runAssessment = () => {
    const modal = watch("investment");
    const luas = watch("landArea");

    if (modal >= 5000000000 || luas >= 5000) {
      setDocType("UKL-UPL");
    } else {
      setDocType("SPPL");
    }
    setCurrentStep(3);
  };

  const navigate = useNavigate();

  const onSubmit = async (data: RegistrationFormValues) => {
    // Validasi berkas legalitas wajib sebelum dikirim ke API [3]
    if (!isEdit) {
      if (!nibFile) {
        toast.error("Dokumen NIB wajib diunggah.");
        setCurrentStep(1);
        return;
      }
      if (!npwpFile) {
        toast.error("Dokumen NPWP wajib diunggah.");
        setCurrentStep(1);
        return;
      }
      if (!docTemplateFile) {
        toast.error(`Dokumen Matriks ${docType} wajib diunggah.`);
        setCurrentStep(4);
        return;
      }
    }

    setLoading(true);
    try {
      // Konstruksi payload multipat FormData secara dinamis
      const formData = new FormData();

      // Memasukkan seluruh parameter teks ke FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      // Memasukkan rekomendasi dokumen lingkungan dari assessment
      formData.append("docType", docType || "SPPL");

      // Memasukkan binary berkas fisik ke FormData (opsional jika dalam mode edit)
      if (nibFile) {
        formData.append("nibDoc", nibFile);
      }
      if (npwpFile) {
        formData.append("npwpDoc", npwpFile);
      }
      if (siteplanFile) {
        formData.append("siteplanDoc", siteplanFile);
      }
      if (docTemplateFile) {
        formData.append("docTemplate", docTemplateFile);
      }

      if (isEdit && existingCompany) {
        await updateCompany(existingCompany.id, formData);
      } else {
        await addCompany(formData);
      }
      navigate("/company");
    } catch (error: any) {
      const serverMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Terjadi kesalahan saat menghubungi server.";
      toast.error(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  // Otorisasi Keamanan Sesi Page
  React.useEffect(() => {
    if (!currentUser || currentUser.role !== "PERUSAHAAN") {
      toast.error("Masuk sistem diperlukan.");
      navigate("/login");
    }
  }, [currentUser, navigate]);

  if (!currentUser || currentUser.role !== "PERUSAHAAN") return null;

  const onErrors = (errors: any) => {
    const firstError = Object.values(errors)[0] as any;
    if (firstError && firstError.message) {
      toast.error(`Gagal Mengirim: ${firstError.message}`);
    } else {
      toast.error("Mohon periksa kembali kelengkapan data di langkah sebelumnya.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 text-left font-sans">

      {/* HEADER */}
      <div className="mb-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/company")}
          className="h-8 px-3 rounded-none font-bold text-[10px] border-slate-200 text-slate-500 hover:text-slate-700 uppercase tracking-widest flex items-center gap-1.5"
        >
          <ChevronLeft size={14} /> Kembali ke Dashboard
        </Button>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 border-b pb-4 border-slate-200">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Registrasi <span className="text-emerald-600">Dokumen Lingkungan</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] mt-1 block">
            Wizard Pendaftaran Profil Industri ({currentUser.name})
          </p>
        </div>
        <Badge className="rounded-none bg-slate-100 text-slate-700 font-mono text-[9px] py-1 px-3 border border-slate-200 font-black">
          Langkah {currentStep} Dari 5
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* SIDEBAR PROGRESS TRACKER */}
        <div className="lg:col-span-1 space-y-1 shrink-0 bg-slate-50 border border-slate-200 p-2 h-fit">
          <StepIndicator active={currentStep >= 1} label="Identitas & Legalitas" icon={<Building2 size={14} />} />
          <StepIndicator active={currentStep >= 2} label="Smart Assessment" icon={<Search size={14} />} />
          <StepIndicator active={currentStep >= 3} label="Penentuan Dokumen" icon={<ShieldAlert size={14} />} />
          <StepIndicator active={currentStep >= 4} label="Isian Teknis" icon={<FileStack size={14} />} />
          <StepIndicator active={currentStep >= 5} label="Lokasi GIS" icon={<MapIcon size={14} />} />
        </div>

        {/* FORM GRID */}
        <div className="lg:col-span-3">
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit, onErrors)} className="space-y-4">

              {/* STEP 1: IDENTITAS & UPLOAD DOKUMEN (GFW HIGH DENSITY) */}
              {currentStep === 1 && (
                <Card className="bg-white border border-slate-200 rounded-none shadow-none overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                  <CardHeaderLayout title="Identitas & Legalitas" desc="Masukkan data resmi perusahaan dan unggah dokumen pendukung." />
                  <CardContent className="space-y-6 p-6">

                    {/* Data Identitas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormGroup label="Nama Perusahaan" name="companyName" placeholder="Contoh: PT. Sumber Alam" />
                      <FormGroup label="NIB (Nomor Induk Berusaha)" name="nib" placeholder="13 Digit Angka" />
                      <FormGroup label="NPWP Perusahaan" name="npwp" placeholder="00.000.000.0-000.000" />
                      <FormGroup label="Nama Penanggung Jawab" name="picName" placeholder="Nama PIC sesuai KTP" />
                      <FormGroup label="WhatsApp / HP PIC" name="picPhone" placeholder="0812xxxx" />
                      <FormGroup label="Jabatan Penanggung Jawab" name="picRole" placeholder="Direktur / Pemilik" />
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status Penanaman Modal</Label>
                        <select
                          {...methods.register("investmentType")}
                          className="h-10 w-full rounded-none border border-slate-300 bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-700 focus:outline-none focus:border-emerald-600 focus:ring-0 cursor-pointer"
                        >
                          <option value="PMDN">PMDN (Dalam Negeri)</option>
                          <option value="PMA">PMA (Asing / Luar Negeri)</option>
                        </select>
                      </div>
                      <FormGroup label="Tahun Berdiri" name="yearBuilt" placeholder="2026" type="number" />
                    </div>

                    {/* Dokumen Legalitas Upload (Edge-to-Edge Style) */}
                    <div className="space-y-3 pt-4 border-t border-slate-100 text-left">
                      <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                        <FileText size={14} className="text-emerald-600 shrink-0" />
                        <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Upload Dokumen Legalitas</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* NIB */}
                        <FileUploadBox
                          label="Scan NIB"
                          required={!isEdit}
                          accept=".pdf,.jpg,.jpeg,.png"
                          file={nibFile}
                          onFileChange={setNibFile}
                          hint="PDF / JPG / PNG, maks 5 MB"
                          existingUrl={isEdit ? existingCompany?.docNibUrl || undefined : undefined}
                        />

                        {/* NPWP */}
                        <FileUploadBox
                          label="Scan NPWP"
                          required={!isEdit}
                          accept=".pdf,.jpg,.jpeg,.png"
                          file={npwpFile}
                          onFileChange={setNpwpFile}
                          hint="PDF / JPG / PNG, maks 5 MB"
                          existingUrl={isEdit ? existingCompany?.docNpwpUrl || undefined : undefined}
                        />

                        {/* Siteplan */}
                        <FileUploadBox
                          label="Siteplan / Layout"
                          required={false}
                          accept=".pdf,.jpg,.jpeg,.png"
                          file={siteplanFile}
                          onFileChange={setSiteplanFile}
                          hint="Opsional — denah lokasi usaha"
                          existingUrl={isEdit ? existingCompany?.docSiteplanUrl || undefined : undefined}
                        />
                      </div>

                      {/* Warning box kaku siku */}
                      <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-none">
                        <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold text-amber-700 leading-snug">
                          Dokumen NIB dan NPWP <span className="underline">wajib</span> diunggah. Dokumen tidak lengkap akan menghambat proses verifikasi otomatis [3].
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-3 border-t">
                      <Button type="button" onClick={nextStep} className="bg-slate-900 hover:bg-emerald-600 h-10 px-6 rounded-none font-black text-[10px] uppercase tracking-widest text-white ml-auto">
                        Lanjut ke Penapisan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 2: ASSESSMENT */}
              {currentStep === 2 && (
                <Card className="bg-white border border-slate-200 rounded-none shadow-none overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                  <CardHeaderLayout title="Smart Assessment" desc="Sistem akan menganalisis kewajiban dokumen lingkungan Anda." />
                  <CardContent className="space-y-4 p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">KBLI (Bidang Usaha)</Label>
                        <select
                          {...methods.register("kbli")}
                          className="h-10 w-full rounded-none border border-slate-300 bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-700 focus:outline-none focus:border-emerald-600 focus:ring-0 cursor-pointer"
                        >
                          <option value="">Pilih KBLI...</option>
                          <option value="45201">Perbaikan Kendaraan (45201)</option>
                          <option value="96200">Jasa Laundry (96200)</option>
                          <option value="56101">Restoran (56101)</option>
                          <option value="13111">Industri Tekstil (13111)</option>
                        </select>
                      </div>
                      <FormGroup label="Modal Investasi (Rp)" name="investment" placeholder="Total Modal Usaha" type="number" />
                      <FormGroup label="Luas Lahan Usaha (m²)" name="landArea" placeholder="Contoh: 500" type="number" />
                      <FormGroup label="Jumlah Tenaga Kerja" name="employees" placeholder="Jumlah Orang" type="number" />
                      <FormGroup label="Luas Bangunan (m²)" name="buildingArea" placeholder="Contoh: 300" type="number" />
                      <FormGroup label="Jam/Hari Operasional" name="operationalHours" placeholder="08.00-17.00 / Senin-Sabtu" />
                      <FormGroup label="Bahan Baku Utama" name="rawMaterials" placeholder="Bahan baku yang diproses" />
                      <div className="grid grid-cols-3 gap-2 col-span-1 md:col-span-2">
                        <FormGroup label="Sumber Air" name="waterSource" placeholder="PDAM/Sumur" />
                        <FormGroup label="Sumber Listrik" name="powerSource" placeholder="PLN/Genset" />
                        <FormGroup label="Penggunaan BBM" name="wasteInfo" placeholder="Solar/Gas/Nihil" />
                      </div>
                    </div>
                    <div className="flex justify-between pt-3 border-t gap-2">
                      <Button type="button" variant="outline" onClick={prevStep} className="h-10 px-6 rounded-none font-bold text-[10px] border-slate-200 text-slate-500 uppercase tracking-widest">
                        Kembali
                      </Button>
                      <Button type="button" onClick={runAssessment} className="bg-slate-900 hover:bg-emerald-600 h-10 px-6 rounded-none font-black text-[10px] uppercase tracking-widest text-white ml-auto">
                        Analisis Penapisan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 3: RECOMMENDATION RESULT */}
              {currentStep === 3 && (
                <div className="animate-in zoom-in duration-300">
                  <Card className="border border-emerald-500 bg-emerald-50/20 rounded-none overflow-hidden">
                    <CardContent className="p-8 text-center space-y-4">
                      <div className="bg-emerald-100 border border-emerald-200 w-12 h-12 rounded-none flex items-center justify-center mx-auto shadow-inner text-emerald-700">
                        <CheckCircle2 size={24} />
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none">Rekomendasi Dokumen</h2>
                        <h3 className="text-4xl font-black text-emerald-800 tracking-tighter leading-none italic">{docType}</h3>
                      </div>
                      <p className="max-w-md mx-auto text-slate-500 text-xs font-semibold leading-relaxed">
                        Berdasarkan smart assessment modal investasi dan luas area industri, entitas Anda secara hukum wajib melengkapi registrasi dokumen <strong className="text-emerald-800 font-black">{docType}</strong> [3].
                      </p>
                      <div className="flex justify-center gap-2 pt-2 border-t max-w-sm mx-auto">
                        <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} className="h-9 px-4 border-slate-200 rounded-none text-[9px] font-black uppercase tracking-widest text-slate-600">
                          Ubah Data
                        </Button>
                        <Button type="button" onClick={nextStep} className="bg-slate-900 hover:bg-emerald-600 h-9 px-4 rounded-none text-[9px] font-black uppercase tracking-widest text-white">
                          Isi Template {docType}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* STEP 4: MATRIKS ISIAN TEKNIS (DOWNLOAD & UPLOAD) */}
              {currentStep === 4 && (
                <Card className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none overflow-hidden animate-in fade-in slide-in-from-right-4 text-left">
                  <CardHeaderLayout 
                    title={`Langkah 4: Matriks Isian Teknis ${docType}`} 
                    desc={`Unduh template resmi ${docType} dari DLH, lengkapi, lalu unggah kembali dokumen tersebut.`} 
                  />
                  <CardContent className="p-6 space-y-6">
                    {/* SECTION 1: DOWNLOAD TEMPLATE */}
                    <div className="border border-slate-200 bg-slate-50 p-4 rounded-none space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-none bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                          <CheckCircle2 size={12} />
                        </div>
                        <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest">1. Unduh Template Matriks Resmi</h3>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                        Silakan unduh dokumen format resmi matriks <strong className="text-slate-800 font-black">{docType}</strong> berikut untuk diisi secara offline.
                      </p>
                      <div>
                        <a
                          href={docType === "UKL-UPL" ? "/templates/template-ukl-upl.xlsx" : "/templates/template-sppl.docx"}
                          download={docType === "UKL-UPL" ? "Template_Matriks_UKL-UPL.xlsx" : "Template_Matriks_SPPL.docx"}
                          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-emerald-600 text-white font-black text-[10px] tracking-widest uppercase h-10 px-6 rounded-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] border border-slate-900"
                        >
                          <Download className="w-3.5 h-3.5" /> UNDUH TEMPLATE MATRIKS ({docType})
                        </a>
                      </div>
                    </div>

                    {/* SECTION 2: FILE UPLOAD */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-none bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0">
                          <CheckCircle2 size={12} />
                        </div>
                        <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest">2. Unggah Matriks yang Telah Dilengkapi</h3>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                        Pastikan seluruh data matriks telah terisi dengan benar. Unggah kembali file Anda dalam format spreadsheet (.xlsx, .xls) atau dokumen (.docx, .doc, .pdf).
                      </p>

                      <FileUploadBox
                        label={`Berkas Matriks ${docType} *`}
                        required={!isEdit}
                        accept=".xlsx,.xls,.docx,.doc,.pdf"
                        file={docTemplateFile}
                        onFileChange={setDocTemplateFile}
                        hint="Format Excel, Word, atau PDF, maks 5 MB"
                        existingUrl={isEdit ? existingCompany?.docTemplateUrl || undefined : undefined}
                      />
                    </div>

                    {/* METODE PEMBUANGAN / DETAIL LIMBAH */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-none bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                          <CheckCircle2 size={12} />
                        </div>
                        <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest">3. Keterangan Tambahan Metode Pembuangan Limbah</h3>
                      </div>
                      <FormGroup 
                        label="Uraian Metode Pembuangan / Informasi Limbah" 
                        name="wasteInfo" 
                        placeholder="Contoh: Limbah cair domestik dialirkan ke septik tank, oli bekas disimpan di TPS B3 berizin..." 
                      />
                    </div>

                    {/* BUTTONS NAVIGATION */}
                    <div className="flex justify-between pt-4 border-t gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={prevStep} 
                        className="h-10 px-6 rounded-none font-bold text-[10px] border-slate-200 text-slate-500 uppercase tracking-widest"
                      >
                        Kembali
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => {
                          if (!isEdit && !docTemplateFile && !existingCompany?.docTemplateUrl) {
                            toast.error(`Dokumen Matriks ${docType} wajib diunggah sebelum lanjut.`);
                            return;
                          }
                          nextStep();
                        }}
                        className="bg-slate-900 hover:bg-emerald-600 h-10 px-6 rounded-none font-black text-[10px] uppercase tracking-widest text-white ml-auto"
                      >
                        Lanjut ke Lokasi GIS
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 5: GIS MAPPING */}
              {currentStep === 5 && (
                <Card className="bg-white border border-slate-200 rounded-none shadow-none overflow-hidden animate-in fade-in slide-in-from-right-4">
                  <CardHeaderLayout title="Pemetaan Titik Lokasi GIS" desc="Tentukan koordinat spasial persis pabrik Anda pada kanvas peta." />
                  <CardContent className="p-4 md:p-6 space-y-4">

                    <div className="h-[280px] w-full bg-slate-100 rounded-none border border-slate-300 overflow-hidden relative z-10">
                      <MapContainer
                        center={[parseFloat(watch("lat") || "-6.9175"), parseFloat(watch("lng") || "107.6191")]}
                        zoom={13}
                        zoomControl={true}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <InteractiveMap />
                        <ResizeMap />
                      </MapContainer>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormGroup label="Latitude" name="lat" placeholder="-6.9147" />
                      <FormGroup label="Longitude" name="lng" placeholder="107.6098" />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alamat Penjemputan / Operasional Detail</Label>
                      <textarea
                        {...methods.register("address")}
                        className="w-full min-h-[70px] rounded-none border border-slate-300 p-2.5 text-xs font-bold focus:outline-none focus:border-emerald-600 focus:ring-0 bg-white"
                        placeholder="Contoh: Jl. Cisitu Indah No. 2A, Bandung"
                      />
                    </div>

                    {/* File upload summary before final submit (High-Density) */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-none space-y-2.5 text-left">
                      <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <FileText size={12} /> Ringkasan Dokumen yang Akan Dikirim
                      </h4>
                      <div className="space-y-1.5">
                        <FileStatusRow label="NIB" file={nibFile} required={!isEdit} existingUrl={isEdit ? existingCompany?.docNibUrl || undefined : undefined} />
                        <FileStatusRow label="NPWP" file={npwpFile} required={!isEdit} existingUrl={isEdit ? existingCompany?.docNpwpUrl || undefined : undefined} />
                        <FileStatusRow label="Siteplan / Layout" file={siteplanFile} required={false} existingUrl={isEdit ? existingCompany?.docSiteplanUrl || undefined : undefined} />
                        <FileStatusRow label={`Matriks Isian Teknis ${docType}`} file={docTemplateFile} required={!isEdit} existingUrl={isEdit ? existingCompany?.docTemplateUrl || undefined : undefined} />
                      </div>
                    </div>

                    <div className="flex justify-between pt-4 border-t gap-2">
                      <Button type="button" variant="outline" onClick={prevStep} className="h-10 px-6 rounded-none font-bold text-[10px] border-slate-200 text-slate-500 uppercase tracking-widest">
                        Kembali
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 h-10 px-8 rounded-none font-black text-[10px] uppercase tracking-widest text-white ml-auto shadow-none"
                      >
                        {loading ? (
                          <div className="flex items-center gap-1.5">
                            <Loader2 className="animate-spin" size={14} />
                            <span>MENGIRIM...</span>
                          </div>
                        ) : (
                          "KIRIM REGISTRASI"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-Components (GFW Paradigm Compliant & Complete) ─────────────────────────

interface FileUploadBoxProps {
  label: string;
  required: boolean;
  accept: string;
  file: File | null;
  onFileChange: (f: File | null) => void;
  hint?: string;
  existingUrl?: string;
}

function FileUploadBox({ label, required, accept, file, onFileChange, hint, existingUrl }: FileUploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected && selected.size > 5 * 1024 * 1024) {
      toast.error(`File ${label} melebihi batas ukuran 5 MB.`);
      return;
    }
    onFileChange(selected);
  };

  const isImage = file && file.type.startsWith("image/");

  return (
    <div className="space-y-1.5 text-left">
      <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1 leading-none">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />

      {file ? (
        <div
          className="relative rounded-none border border-emerald-500 bg-emerald-50/20 p-3 flex items-center gap-2.5 cursor-pointer hover:bg-emerald-50/50 transition-all group"
          onClick={handleClick}
        >
          {isImage ? (
            <img
              src={URL.createObjectURL(file)}
              alt="preview"
              className="w-10 h-10 rounded-none object-cover border border-emerald-200 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-none bg-emerald-600 flex items-center justify-center shrink-0">
              <FileText size={18} className="text-white" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black text-emerald-800 truncate uppercase tracking-tight">{file.name}</p>
            <p className="text-[9px] text-emerald-600 font-bold">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onFileChange(null); if (inputRef.current) inputRef.current.value = ""; }}
            className="p-1 rounded-none hover:bg-rose-50 text-emerald-600 hover:text-rose-500 transition-colors shrink-0"
          >
            <X size={12} />
          </button>
        </div>
      ) : existingUrl ? (
        <div
          className="relative rounded-none border border-amber-500 bg-amber-50/20 p-3 flex items-center gap-2.5 cursor-pointer hover:bg-amber-50/50 transition-all group"
          onClick={handleClick}
        >
          <div className="w-10 h-10 rounded-none bg-amber-600 flex items-center justify-center shrink-0">
            <FileText size={18} className="text-white" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest leading-none">BERKAS TERSEDIA DI SERVER</p>
            <p className="text-[8px] text-amber-600 font-bold mt-1 leading-none">Klik untuk mengganti berkas</p>
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className={cn(
            "rounded-none border border-dashed p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all group min-h-[90px]",
            "border-slate-300 bg-slate-50 hover:border-emerald-500 hover:bg-emerald-50/10"
          )}
        >
          <div className="w-8 h-8 rounded-none bg-white border border-slate-200 flex items-center justify-center text-slate-300 group-hover:text-emerald-500 group-hover:border-emerald-300 transition-all shrink-0">
            <UploadCloud size={16} />
          </div>
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">Klik untuk upload</p>
            {hint && <p className="text-[8px] text-slate-300 font-bold italic mt-0.5">{hint}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function FileStatusRow({ label, file, required, existingUrl }: { label: string; file: File | null; required: boolean; existingUrl?: string }) {
  return (
    <div className="flex items-center justify-between text-[11px] font-bold">
      <span className="text-slate-500">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      {file ? (
        <span className="flex items-center gap-1 text-emerald-600 text-[10px]">
          <CheckCircle2 size={11} /> {file.name}
        </span>
      ) : existingUrl ? (
        <span className="flex items-center gap-1 text-amber-600 text-[10px]">
          <CheckCircle2 size={11} /> Berkas Tersimpan di Server
        </span>
      ) : (
        <span className={cn("text-[10px] font-bold uppercase tracking-wider", required ? "text-rose-500" : "text-slate-400 italic")}>
          {required ? "BELUM UNGGAH" : "OPSIONAL"}
        </span>
      )}
    </div>
  );
}

function InteractiveMap() {
  const { setValue, watch } = useFormContext();
  const lat = parseFloat(watch("lat") || "-6.9175");
  const lng = parseFloat(watch("lng") || "107.6191");

  useMapEvents({
    click(e) {
      setValue("lat", e.latlng.lat.toFixed(6));
      setValue("lng", e.latlng.lng.toFixed(6));
    },
  });

  return <Marker position={[lat, lng]} />;
}

function StepIndicator({ active, label, icon }: { active: boolean, label: string, icon: any }) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 border transition-all duration-200 rounded-none",
      active ? "bg-white border-slate-300" : "bg-transparent border-transparent opacity-45"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-none flex items-center justify-center transition-colors border",
        active ? "bg-slate-900 border-slate-900 text-white" : "bg-slate-100 border-slate-200 text-slate-400"
      )}>
        {icon}
      </div>
      <span className={cn("text-[9px] font-black uppercase tracking-widest leading-none", active ? "text-slate-900 font-black" : "text-slate-400")}>
        {label}
      </span>
    </div>
  );
}

function CardHeaderLayout({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="p-4 bg-slate-50 border-b border-slate-200">
      <h2 className="text-xs font-black text-slate-800 tracking-widest uppercase leading-none">{title}</h2>
      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 leading-none">{desc}</p>
    </div>
  );
}

function FormGroup({ label, name, placeholder, type = "text" }: any) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-1.5 text-left">
      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
        {label}
      </Label>

      <Input
        type={type}
        {...register(name)}
        placeholder={placeholder}
        className="h-10 rounded-none border-slate-300 bg-white text-xs font-bold focus-visible:ring-0 focus-visible:border-emerald-600"
      />

      {errors[name] && (
        <p className="text-[9px] text-rose-500 font-black uppercase tracking-wider mt-1 leading-none">
          {errors[name]?.message as string}
        </p>
      )}
    </div>
  );
}

function SPPLTemplate() {
  const commitments = [
    "Menjaga kelestarian fungsi lingkungan hidup berkelanjutan.",
    "Tidak melakukan pencemaran air, udara & tanah.",
    "Bersedia dipantau periodik oleh pengawas DLH daerah.",
    "Mengelola logbook limbah B3 sesuai undang-undang."
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Komitmen Kepatuhan Pengelolaan</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {commitments.map((text, i) => (
            <div key={i} className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-none text-left">
              <div className="w-5 h-5 rounded-none bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                <CheckCircle2 size={12} />
              </div>
              <p className="text-[10px] font-bold text-slate-700 leading-tight">{text}</p>
            </div>
          ))}
        </div>
      </div>
      <FormGroup label="Metode Pembuangan & Informasi Limbah" name="wasteInfo" placeholder="Uraikan jenis emisi / limbah dan metode pembuangan..." />
    </div>
  );
}

function UKLUPTemplate() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 text-left">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">1. Dampak Lingkungan yang Mungkin Timbul</Label>
          <p className="text-[9px] text-slate-400 font-bold uppercase leading-none">Identifikasi dampak air limbah, kebisingan pabrik, dll.</p>
          <textarea className="w-full min-h-[60px] rounded-none border border-slate-300 p-2.5 text-xs font-bold focus:outline-none focus:border-emerald-600 bg-white" placeholder="Uraikan deskripsi dampak..." />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">2. Upaya Pengelolaan Lingkungan (UKL)</Label>
          <p className="text-[9px] text-slate-400 font-bold uppercase leading-none">Tindakan nyata penanggulangan dampak operasional.</p>
          <textarea className="w-full min-h-[60px] rounded-none border border-slate-300 p-2.5 text-xs font-bold focus:outline-none focus:border-emerald-600 bg-white" placeholder="Contoh: Pembuatan tangki IPAL, Penyediaan TPS B3 Berizin..." />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">3. Upaya Pemantauan Lingkungan (UPL)</Label>
          <p className="text-[9px] text-slate-400 font-bold uppercase leading-none">Metodologi pengukuran berkala tingkat efektivitas UKL.</p>
          <textarea className="w-full min-h-[60px] rounded-none border border-slate-300 p-2.5 text-xs font-bold focus:outline-none focus:border-emerald-600 bg-white" placeholder="Contoh: Pemeriksaan uji lab pH air limbah setiap 6 bulan..." />
        </div>

        {/* Informasi Limbah Spesifik GFW Box */}
        <div className="p-4 bg-slate-950 text-white space-y-4 rounded-none border border-slate-800 col-span-full">
          <div className="flex items-center gap-2 text-emerald-400">
            <Factory size={16} />
            <h4 className="font-black uppercase tracking-widest text-[9px]">Informasi Limbah Spesifik</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] text-slate-400 uppercase tracking-wider leading-none">Limbah Cair (Debit/Hari)</Label>
              <Input className="bg-slate-900 border-slate-700 text-white rounded-none h-10 text-xs font-bold focus-visible:ring-0 focus-visible:border-emerald-600" placeholder="Contoh: 5 m3/hari" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] text-slate-400 uppercase tracking-wider leading-none">Limbah B3 (Jenis)</Label>
              <Input className="bg-slate-900 border-slate-700 text-white rounded-none h-10 text-xs font-bold focus-visible:ring-0 focus-visible:border-emerald-600" placeholder="Oli, Aki, Medis, dll" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] text-slate-400 uppercase tracking-wider leading-none">Emisi Udara</Label>
              <Input className="bg-slate-900 border-slate-700 text-white rounded-none h-10 text-xs font-bold focus-visible:ring-0 focus-visible:border-emerald-600" placeholder="Genset / Cerobong" />
            </div>
          </div>
        </div>

        <div className="space-y-1.5 text-left">
          <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">4. Dampak Sosial & Masyarakat</Label>
          <textarea
            className="w-full min-h-[80px] rounded-none border border-slate-300 p-2.5 text-xs font-bold focus:outline-none focus:border-emerald-600 bg-white"
            placeholder="Upaya komunikasi dengan warga sekitar..."
          />
        </div>
      </div>
    </div>
  );
}