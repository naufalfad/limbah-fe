import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Building2, MapPin, Factory, FileStack,
  CheckCircle2, ChevronRight, ChevronLeft,
  Search, ShieldAlert, UploadCloud, Map as MapIcon,
  User, Mail, Lock, ArrowRight, Sparkles
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useSijagaStore } from "@/store/useSijagaStore";
import { useNavigate } from "react-router-dom";

import { apiService } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";

// --- SCHEMA VALIDASI (ZOD) ---
const registrationSchema = z.object({
  // Step 1
  companyName: z.string().min(3, "Nama perusahaan wajib diisi"),
  nib: z.string().min(5, "NIB tidak valid"),
  npwp: z.string().min(5, "NPWP tidak valid"),
  picName: z.string().min(3, "Nama penanggung jawab wajib"),
  picPhone: z.string().min(10, "Nomor telepon tidak valid"),
  picRole: z.string().min(1, "Jabatan wajib diisi"),

  // Step 2
  kbli: z.string().min(1, "KBLI wajib dipilih"),
  // Gunakan z.coerce.number() agar input text otomatis jadi angka saat dikirim ke API
  investment: z.coerce.number().min(1, "Modal investasi wajib diisi"),
  landArea: z.coerce.number().min(1, "Luas lahan wajib diisi"),
  employees: z.coerce.number().int().min(1, "Jumlah tenaga kerja wajib"),
  buildingArea: z.coerce.number().min(1, "Luas bangunan wajib"),

  // Step 3 & 4
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

  const [currentStep, setCurrentStep] = useState(1);
  const [docType, setDocType] = useState<"SPPL" | "UKL-UPL" | null>(null);

  const methods = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema) as any,
    mode: "onChange",
  });

  const { watch, handleSubmit } = methods;

  // Smart Assessment Logic
  const runAssessment = () => {
    const modal = watch("investment");
    const luas = watch("landArea");

    // Logika Penapisan: Jika modal > 5 Miliar atau Luas > 5000m2 masuk UKL-UPL
    if (modal >= 5000000000 || luas >= 5000) {
      setDocType("UKL-UPL");
    } else {
      setDocType("SPPL");
    }
    setCurrentStep(3);
  };

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: RegistrationFormValues) => {
    setLoading(true);
    try {
      // Memanggil API Service yang terhubung ke backend
      const response = await apiService.companies.create(data);

      if (response.success) {
        toast.success("Registrasi Berhasil Terkirim!");
        navigate("/company");
      }
    } catch (error: any) {
      // Menangkap error dari backend (misal: NIB duplikat atau error validasi)
      const serverMsg = error.response?.data?.message || "Terjadi kesalahan saat menghubungi server.";
      toast.error(serverMsg);
      console.error("API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  // Proteksi Halaman: Wajib Login sebagai Perusahaan
  React.useEffect(() => {
    if (!currentUser || currentUser.role !== "PERUSAHAAN") {
      toast.error("Silakan masuk terlebih dahulu untuk mengakses Wizard Registrasi Perusahaan.");
      window.location.href = "/login";
    }
  }, [currentUser]);

  if (!currentUser || currentUser.role !== "PERUSAHAAN") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-left font-sans">
        <p className="font-bold text-slate-400">Memeriksa status sesi login...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 text-left font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-10">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">
            SIJAGA <span className="text-emerald-600 font-black">LINGKUNGAN</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em]">
            Wizard Registrasi Dokumen Lingkungan Perusahaan ({currentUser.name})
          </p>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm font-bold bg-slate-100 px-4 py-2 rounded-full">
          Langkah {currentStep} dari 5
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Left Sidebar: Progress Tracker */}
        <div className="lg:col-span-1 space-y-4">
          <div className="sticky top-24 space-y-2">
            <StepIndicator active={currentStep >= 1} label="Identitas & Legalitas" icon={<Building2 size={18} />} />
            <StepIndicator active={currentStep >= 2} label="Smart Assessment" icon={<Search size={18} />} />
            <StepIndicator active={currentStep >= 3} label="Penentuan Dokumen" icon={<ShieldAlert size={18} />} />
            <StepIndicator active={currentStep >= 4} label="Isian Teknis" icon={<FileStack size={18} />} />
            <StepIndicator active={currentStep >= 5} label="Lokasi GIS" icon={<MapIcon size={18} />} />
          </div>
        </div>

        {/* Right Content: Form Wizard */}
        <div className="lg:col-span-3">
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              {/* STEP 1: IDENTITAS */}
              {currentStep === 1 && (
                <Card className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                  <CardHeaderLayout title="Identitas & Legalitas" desc="Masukkan data resmi perusahaan sesuai NIB." />
                  <CardContent className="space-y-6 p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormGroup label="Nama Perusahaan" name="companyName" placeholder="Contoh: PT. Sumber Alam" />
                      <FormGroup label="NIB (Nomor Induk Berusaha)" name="nib" placeholder="13 Digit Angka" />
                      <FormGroup label="NPWP Perusahaan" name="npwp" placeholder="00.000.000.0-000.000" />
                      <FormGroup label="Nama Penanggung Jawab" name="picName" placeholder="Nama Lengkap sesuai KTP" />
                      <FormGroup label="WhatsApp / HP PIC" name="picPhone" placeholder="0812xxxx" />
                      <FormGroup label="Jabatan Penanggung Jawab" name="picRole" placeholder="Contoh: Direktur / Pemilik" />
                      <div className="space-y-2">
                        <Label className="font-bold text-slate-700 text-sm">Status Modal</Label>
                        <Select onValueChange={(v) => methods.setValue("investmentType", v as any)}>
                          <SelectTrigger className="h-12 rounded-xl border-slate-200 focus:ring-emerald-500 bg-white"><SelectValue placeholder="Pilih Status" /></SelectTrigger>
                          <SelectContent
                            position="popper"
                            sideOffset={5}
                            className="w-[var(--radix-select-trigger-width)] max-h-[300px] z-[999] bg-white border border-slate-200 shadow-md text-slate-900"
                          >
                            <SelectItem value="PMDN">PMDN (Dalam Negeri)</SelectItem>
                            <SelectItem value="PMA">PMA (Asing / Luar Negeri)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <FormGroup label="Tahun Berdiri" name="yearBuilt" placeholder="Contoh: 2024" type="number" />
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button type="button" onClick={nextStep} className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 rounded-xl font-bold gap-2 text-white ml-auto">Lanjut ke Penapisan <ChevronRight size={18} /></Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 2: ASSESSMENT */}
              {currentStep === 2 && (
                <Card className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                  <CardHeaderLayout title="Smart Assessment" desc="Sistem akan menganalisis kewajiban dokumen lingkungan Anda." />
                  <CardContent className="space-y-6 p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="font-bold">KBLI (Bidang Usaha)</Label>
                        <Select onValueChange={(v) => methods.setValue("kbli", v)}>
                          <SelectTrigger className="h-12 rounded-xl border-slate-200 focus:ring-emerald-500 bg-white"><SelectValue placeholder="Pilih KBLI Utama" /></SelectTrigger>
                          <SelectContent
                            position="popper"
                            sideOffset={5}
                            className="w-[var(--radix-select-trigger-width)] max-h-[300px] z-[999] bg-white border border-slate-200 shadow-md text-slate-900"
                          >
                            <SelectItem value="45201">Perbaikan Kendaraan (45201)</SelectItem>
                            <SelectItem value="96200">Jasa Laundry (96200)</SelectItem>
                            <SelectItem value="56101">Restoran (56101)</SelectItem>
                            <SelectItem value="13111">Industri Tekstil (13111)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <FormGroup label="Modal Investasi (Rp)" name="investment" placeholder="Total Modal Usaha" type="number" />
                      <FormGroup label="Luas Lahan Usaha (m2)" name="landArea" placeholder="Contoh: 500" type="number" />
                      <FormGroup label="Jumlah Tenaga Kerja" name="employees" placeholder="Jumlah Orang" type="number" />
                      <FormGroup label="Luas Bangunan (m2)" name="buildingArea" placeholder="Contoh: 300" type="number" />
                      <FormGroup label="Jam/Hari Operasional" name="operationalHours" placeholder="Contoh: 08.00-17.00 / Senin-Sabtu" />
                      <FormGroup label="Bahan Baku Utama" name="rawMaterials" placeholder="Sebutkan bahan baku utama" />
                      <div className="grid grid-cols-3 gap-2 col-span-1 md:col-span-2">
                        <FormGroup label="Sumber Air" name="waterSource" placeholder="PDAM/Sumur" />
                        <FormGroup label="Sumber Listrik" name="powerSource" placeholder="PLN/Genset" />
                        <FormGroup label="Penggunaan BBM" name="powerSource" placeholder="Solar/Gas/Tidak Ada" />
                      </div>
                    </div>
                    <div className="flex justify-between pt-4">
                      <Button type="button" variant="outline" onClick={prevStep} className="h-12 px-8 rounded-xl font-bold border-slate-200 text-slate-500">Kembali</Button>
                      <Button type="button" onClick={runAssessment} className="bg-blue-600 hover:bg-blue-700 h-12 px-8 rounded-xl font-bold gap-2 text-white ml-auto">Proses Penapisan <Search size={18} /></Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 3: RECOMMENDATION RESULT */}
              {currentStep === 3 && (
                <div className="animate-in zoom-in duration-500 space-y-6">
                  <Card className="border-4 border-emerald-500 bg-emerald-50/50 rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-12 text-center space-y-6">
                      <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <CheckCircle2 className="text-emerald-500" size={40} />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-xl font-bold text-slate-600 uppercase tracking-widest leading-none">Hasil Penapisan Otomatis</h2>
                        <h3 className="text-6xl font-black text-emerald-700 italic tracking-tighter">{docType}</h3>
                      </div>
                      <p className="max-w-lg mx-auto text-slate-500 font-medium">
                        Berdasarkan modal investasi dan luas lahan, usaha Anda masuk dalam kategori pengawasan daerah wajib dokumen <span className="text-emerald-700 font-bold">{docType}</span>.
                      </p>
                      <div className="flex justify-center gap-4 pt-4">
                        <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} className="rounded-xl border-slate-300">Ubah Data Assessment</Button>
                        <Button type="button" onClick={nextStep} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-10 font-bold">Lanjut Isi Template {docType}</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* STEP 4: DYNAMIC TEMPLATE FORM */}
              {currentStep === 4 && (
                <Card className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4">
                  <CardHeaderLayout title={`Template Isian Teknis ${docType}`} desc={`Silakan lengkapi detail rencana pengelolaan lingkungan sesuai format ${docType}.`} />
                  <CardContent className="p-8 space-y-8">
                    {docType === "SPPL" ? <SPPLTemplate /> : <UKLUPTemplate />}
                    <div className="flex justify-between pt-6 border-t">
                      <Button type="button" variant="outline" onClick={prevStep} className="h-12 px-8 rounded-xl font-bold border-slate-200 text-slate-500">Kembali</Button>
                      <Button type="button" onClick={nextStep} className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 rounded-xl font-bold gap-2 text-white ml-auto">Lanjut ke Lokasi GIS <ChevronRight size={18} /></Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 5: GIS MAPPING */}
              {currentStep === 5 && (
                <Card className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4">
                  <CardHeaderLayout title="Lokasi GIS & Titik Koordinat" desc="Tentukan lokasi usaha Anda secara akurat pada peta." />
                  <CardContent className="p-8 space-y-6">

                    <div className="h-[400px] w-full bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden relative z-10">
                      <MapContainer
                        center={[parseFloat(watch("lat") || "-6.9175"), parseFloat(watch("lng") || "107.6191")]}
                        zoom={13}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <InteractiveMap />
                      </MapContainer>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormGroup label="Latitude" name="lat" placeholder="-6.9147" />
                      <FormGroup label="Longitude" name="lng" placeholder="107.6098" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Alamat Detail Usaha / Lokasi Penjemputan</Label>
                      <textarea {...methods.register("address")} className="w-full min-h-[100px] rounded-2xl border p-4 text-sm focus-visible:outline-emerald-600" placeholder="Contoh: Jl. Merdeka No. 10 (Depan Kantor Pos)" />
                    </div>
                    <div className="flex justify-between pt-4">
                      <Button type="button" variant="outline" onClick={prevStep} className="h-12 px-8 rounded-xl font-bold border-slate-200 text-slate-500">Kembali</Button>
                      <Button
                        type="submit"
                        disabled={loading} // Disable saat loading agar tidak double submit
                        className="bg-emerald-600 hover:bg-emerald-700 h-14 px-12 rounded-2xl font-black text-lg text-white shadow-xl shadow-emerald-100"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="animate-spin" size={24} />
                            <span>MENGIRIM...</span>
                          </div>
                        ) : (
                          <>
                            KIRIM REGISTRASI <CheckCircle2 size={24} className="ml-2" />
                          </>
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

// --- SUB-COMPONENTS & HELPERS ---

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
      "flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border",
      active ? "bg-white border-emerald-200 shadow-sm" : "bg-transparent border-transparent opacity-40"
    )}>
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
        active ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-400"
      )}>
        {icon}
      </div>
      <span className={cn("text-xs font-black uppercase tracking-widest leading-none", active ? "text-slate-900" : "text-slate-400")}>
        {label}
      </span>
    </div>
  );
}

function CardHeaderLayout({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="p-8 border-b bg-slate-50/50">
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h2>
      <p className="text-sm text-slate-500 font-medium mt-1">{desc}</p>
    </div>
  );
}

function FormGroup({ label, name, placeholder, type = "text" }: any) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-2">
      <Label className="font-bold text-slate-700 text-sm">
        {label}
      </Label>

      <Input
        type={type}
        {...register(name)}
        placeholder={placeholder}
        className="h-12 rounded-xl border-slate-200 focus:ring-emerald-500 transition-all focus-visible:ring-emerald-600"
      />

      {errors[name] && (
        <p className="text-[10px] text-red-500 font-bold uppercase mt-1">
          {errors[name]?.message as string}
        </p>
      )}
    </div>
  );
}

function SPPLTemplate() {
  const commitments = [
    "Menjaga kelestarian fungsi lingkungan hidup.",
    "Tidak melakukan pencemaran/perusakan lingkungan.",
    "Bersedia dipantau oleh pejabat DLH.",
    "Mengelola limbah sesuai standar peraturan."
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="font-black text-lg tracking-tight">Pernyataan Kesanggupan Pelaku Usaha</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {commitments.map((text, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-white border rounded-2xl shadow-sm">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 size={14} />
              </div>
              <p className="text-[11px] font-bold text-slate-700 leading-tight">{text}</p>
            </div>
          ))}
        </div>
      </div>
      <FormGroup label="Informasi Limbah & Cara Pembuangan" name="wasteInfo" placeholder="Jelaskan limbah apa yang dihasilkan dan dibuang kemana..." />
      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
        <input type="checkbox" className="w-5 h-5 accent-emerald-600" />
        <Label className="text-[11px] font-bold text-amber-900 leading-none cursor-pointer">Kami memiliki Tempat Penampungan Sementara (TPS) Limbah.</Label>
      </div>
    </div>
  );
}

function UKLUPTemplate() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2">
          <Label className="font-bold text-slate-900 text-lg tracking-tight">1. Dampak Lingkungan yang Mungkin Timbul</Label>
          <p className="text-xs text-slate-400 mb-2">Identifikasi dampak air, udara, kebisingan, atau limbah padat.</p>
          <textarea className="w-full min-h-[100px] rounded-2xl border p-4 text-sm focus-visible:outline-emerald-600" placeholder="Uraikan dampak teknis..." />
        </div>
        <div className="space-y-2">
          <Label className="font-bold text-slate-900 text-lg tracking-tight">2. Upaya Pengelolaan Lingkungan (UKL)</Label>
          <p className="text-xs text-slate-400 mb-2">Sebutkan tindakan nyata untuk menanggulangi dampak di atas.</p>
          <textarea className="w-full min-h-[100px] rounded-2xl border p-4 text-sm focus-visible:outline-emerald-600" placeholder="Contoh: Pembuatan IPAL Komunal, Penyediaan TPS B3..." />
        </div>
        <div className="space-y-2">
          <Label className="font-bold text-slate-900 text-lg tracking-tight">3. Upaya Pemantauan Lingkungan (UPL)</Label>
          <p className="text-xs text-slate-400 mb-2">Bagaimana Anda memantau efektivitas pengelolaan setiap periode?</p>
          <textarea className="w-full min-h-[100px] rounded-2xl border p-4 text-sm focus-visible:outline-emerald-600" placeholder="Contoh: Uji lab air limbah setiap 6 bulan..." />
        </div>
        <div className="p-6 bg-slate-900 rounded-[2rem] text-white space-y-4 col-span-full">
          <div className="flex items-center gap-2 text-emerald-400">
            <Factory size={20} />
            <h4 className="font-bold uppercase tracking-widest text-xs">Informasi Limbah Spesifik</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-400 uppercase">Limbah Cair (Debit/Hari)</Label>
              <Input className="bg-slate-800 border-slate-700 text-white" placeholder="Contoh: 5 m3/hari" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-400 uppercase">Limbah B3 (Jenis)</Label>
              <Input className="bg-slate-800 border-slate-700 text-white" placeholder="Oli, Aki, Medis, dll" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-400 uppercase">Emisi Udara</Label>
              <Input className="bg-slate-800 border-slate-700 text-white" placeholder="Genset / Cerobong" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-bold text-slate-900 text-lg tracking-tight">4. Dampak Sosial & Masyarakat</Label>
          <textarea className="w-full min-h-[80px] rounded-2xl border p-4 text-sm focus-visible:outline-emerald-600" placeholder="Upaya komunikasi dengan warga sekitar..." />
        </div>
      </div>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in zoom-in duration-500 font-sans">
      <div className="w-32 h-32 bg-emerald-100 rounded-[2.5rem] flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-100 mb-8 rotate-12">
        <CheckCircle2 size={64} />
      </div>
      <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Registrasi Dikirim!</h2>
      <p className="text-slate-500 mt-4 max-w-md text-center font-medium px-6 leading-relaxed">
        Terima kasih. Data perusahaan dan pengajuan dokumen lingkungan Anda berhasil masuk ke database <span className="text-emerald-600 font-bold underline">SIJAGA Lingkungan</span>.
        Petugas DLH akan melakukan verifikasi data dan GIS dalam waktu 1-3 hari kerja.
      </p>
      <div className="mt-10 flex gap-4">
        <Button onClick={() => window.location.href = "/company"} className="bg-slate-900 h-12 rounded-xl px-10 font-bold text-white">Ke Dashboard</Button>
        <Button variant="outline" onClick={() => window.print()} className="h-12 rounded-xl px-10 font-bold border-slate-300 text-slate-700">Cetak Draft</Button>
      </div>
    </div>
  );
}