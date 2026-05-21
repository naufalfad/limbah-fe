import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registrationSchema, RegistrationFormValues } from '../schemas/registrationSchema';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronRight, ChevronLeft, Info } from "lucide-react";
import { useSijagaStore } from '@/store/useSijagaStore';
import { toast } from 'sonner';

// Import Partisi
import { LocationPicker } from './LocationPicker';
import { UKLUPLFormFields } from './UKLUPLFormFields'; 
import { SPPLFormFields } from './SPPLFormFields'; 
import { FileUploadWithPreview } from './FileUploadWithPreview';
import { useFormPersist } from '@/hooks/useFormPersist';

export const EnvironmentalRegistration = () => {
  const { addCompany } = useSijagaStore();
  const [step, setStep] = useState(1);
  const [docType, setDocType] = useState<'SPPL' | 'UKL_UPL' | null>(null);

  const methods = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema) as any,
    mode: "onChange", // Validasi langsung saat user mengetik
    defaultValues: {
      status_penanaman_modal: 'PMDN',
      jumlah_karyawan: 0,
      luas_lahan_m2: 0,
      latitude: 0,
      longitude: 0
    }
  });

  const { register, handleSubmit, setValue, watch, formState: { errors, isValid } } = methods;
  const formValues = watch();

  useFormPersist(methods, 'SIJAGA_REG_DRAFT', ['file_nib', 'file_npwp', 'file_pkkpr', 'file_siteplan', 'foto_lokasi']);

  const onSubmit: any = (data: any) => {
    addCompany({
      companyName: data.nama_perusahaan,
      nib: data.nib,
      npwp: data.npwp_perusahaan,
      picName: data.nama_penanggung_jawab,
      picPhone: "081234567890",
      picRole: data.jabatan_penanggung_jawab || "Penanggung Jawab",
      investmentType: data.status_penanaman_modal,
      yearBuilt: data.tahun_berdiri || "2026",
      buildingArea: Number(data.luas_bangunan_m2) || 0,
      operationalHours: `${data.jam_operasional} (${data.hari_operasional})`,
      rawMaterials: data.bahan_baku || "-",
      waterSource: data.sumber_air || "-",
      powerSource: data.sumber_listrik || "-",
      kbli: data.kbli || "-",
      investment: 1000000000,
      landArea: Number(data.luas_lahan_m2) || 0,
      employees: Number(data.jumlah_karyawan) || 0,
      lat: String(data.latitude || "-6.9175"),
      lng: String(data.longitude || "107.6191"),
      address: `${data.alamat_lengkap}, ${data.kecamatan || ""}, ${data.kabupaten_kota || ""}`,
      docType: docType === "UKL_UPL" ? "UKL-UPL" : "SPPL"
    });
    toast.success("Dokumen registrasi lingkungan berhasil diajukan!");
    window.location.href = "/";
  };

  const determineType = () => {
    const isUklUpl = 
      Number(formValues.luas_lahan_m2) > 10000 || 
      Number(formValues.jumlah_karyawan) > 100 || 
      formValues.status_penanaman_modal === 'PMA';
    
    setDocType(isUklUpl ? 'UKL_UPL' : 'SPPL');
    setStep(4); 
  };

  const steps = [
    { id: 1, label: "Identitas" },
    { id: 2, label: "Lokasi" },
    { id: 3, label: "Operasional" },
    { id: 4, label: "Detail Teknis" },
    { id: 5, label: "Lampiran" }
  ];

  return (
    <FormProvider {...methods}>
      <div className="container mx-auto max-w-5xl py-8 px-4">
        
        {/* STEPPER UI - Membuat user nyaman tahu progresnya */}
        <div className="flex items-center justify-between mb-8 px-4">
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  step >= s.id ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-slate-200 text-slate-400"
                }`}>
                  {step > s.id ? <CheckCircle2 className="w-6 h-6" /> : s.id}
                </div>
                <span className={`text-xs font-medium ${step >= s.id ? "text-brand-700" : "text-slate-400"}`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${step > s.id ? "bg-brand-600" : "bg-slate-100"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <Card className="shadow-2xl border-none ring-1 ring-slate-200">
          <CardHeader className="bg-slate-50/50 border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800">
                  {steps.find(s => s.id === step)?.label} Usaha
                </CardTitle>
                <CardDescription>Lengkapi data sesuai dokumen legalitas perusahaan Anda.</CardDescription>
              </div>
              {docType && <Badge variant="outline" className="bg-brand-50 text-brand-700 border-brand-200 text-lg py-1 px-4">{docType}</Badge>}
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            
            {/* STEP 1: IDENTITAS */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-600">Nama Perusahaan</Label>
                    <Input {...register("nama_perusahaan")} placeholder="Masukkan nama resmi PT/CV" className="focus-visible:ring-brand-500" />
                    {errors.nama_perusahaan && <p className="text-xs text-red-500">{errors.nama_perusahaan.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600">NPWP Perusahaan</Label>
                    <Input {...register("npwp_perusahaan")} placeholder="00.000.000.0-000.000" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600">Nama Penanggung Jawab</Label>
                    <Input {...register("nama_penanggung_jawab")} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600">Status Penanaman Modal</Label>
                    <Select 
                      value={formValues.status_penanaman_modal} // Perbaikan: Tambahkan value agar Select sinkron
                      onValueChange={(v) => setValue('status_penanaman_modal', v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PMDN">PMDN (Dalam Negeri)</SelectItem>
                        <SelectItem value="PMA">PMA (Asing)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600">Jumlah Karyawan</Label>
                    <Input type="number" {...register("jumlah_karyawan", { valueAsNumber: true })} />
                  </div>
                </div>
                <Button onClick={() => setStep(2)} className="w-full bg-brand-600 hover:bg-brand-700 h-12 text-lg">
                  Lanjut ke Informasi Lokasi <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            )}

            {/* STEP 2: LOKASI */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-3 space-y-2">
                    <Label>Alamat Lengkap</Label>
                    <Input {...register("alamat_lengkap")} placeholder="Jalan, No Rumah/Blok, RT/RW" />
                  </div>
                  <Input {...register("provinsi")} placeholder="Provinsi" />
                  <Input {...register("kabupaten_kota")} placeholder="Kabupaten/Kota" />
                  <Input {...register("kecamatan")} placeholder="Kecamatan" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-brand-600" /> Titik Koordinat Usaha
                    </Label>
                    <div className="flex gap-2">
                      <Input {...register("latitude")} placeholder="Lat" readOnly className="bg-slate-50" />
                      <Input {...register("longitude")} placeholder="Lng" readOnly className="bg-slate-50" />
                    </div>
                    <div className="rounded-xl overflow-hidden border-2 border-slate-100">
                      <LocationPicker 
                        lat={formValues.latitude} 
                        lng={formValues.longitude}
                        onLocationSelected={(lat: number, lng: number) => {
                          setValue('latitude', lat);
                          setValue('longitude', lng);
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-4 bg-slate-50 p-6 rounded-xl">
                     <div className="space-y-2">
                      <Label>Luas Lahan (m2)</Label>
                      <Input type="number" {...register("luas_lahan_m2", { valueAsNumber: true })} className="bg-white" />
                     </div>
                     <div className="space-y-2">
                      <Label>Luas Bangunan (m2)</Label>
                      <Input type="number" {...register("luas_bangunan_m2", { valueAsNumber: true })} className="bg-white" />
                     </div>
                     <div className="space-y-2">
                      <Label>Status Lahan</Label>
                      <Input {...register("status_lahan")} placeholder="Contoh: Milik Sendiri / Sewa" className="bg-white" />
                     </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="h-12 px-8">
                    <ChevronLeft className="mr-2 w-5 h-5" /> Kembali
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1 bg-brand-600 hover:bg-brand-700 h-12 text-lg">
                    Lanjut ke Operasional
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: OPERASIONAL & KLASIFIKASI */}
            {step === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Jam Operasional</Label>
                    <Input {...register("jam_operasional")} placeholder="Contoh: 08:00 - 17:00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Hari Operasional</Label>
                    <Input {...register("hari_operasional")} placeholder="Contoh: Senin - Sabtu" />
                  </div>
                  <div className="space-y-2">
                    <Label>Kapasitas Produksi</Label>
                    <Input {...register("kapasitas_produksi")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bahan Baku Utama</Label>
                    <Input {...register("bahan_baku")} />
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl">
                  <div className="flex gap-3">
                    <Info className="w-6 h-6 text-blue-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-blue-900">Analisis Klasifikasi Otomatis</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Berdasarkan data Luas Lahan ({formValues.luas_lahan_m2} m2) dan Karyawan ({formValues.jumlah_karyawan} orang), sistem akan menentukan kategori dokumen lingkungan Anda secara otomatis.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="h-12 px-8">
                    <ChevronLeft className="mr-2 w-5 h-5" /> Kembali
                  </Button>
                  <Button onClick={determineType} className="flex-1 bg-brand-600 hover:bg-brand-700 h-12 text-lg shadow-lg">
                    Analisis Kewajiban Lingkungan
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4 & 5 tetap seperti logika sebelumnya namun dibungkus animasi */}
            {step === 4 && (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                 {/* Header penentu tipe yang lebih mencolok */}
                 <div className="text-center mb-8 bg-brand-50 p-8 rounded-2xl border-2 border-dashed border-brand-200">
                    <Badge className="mb-2 bg-brand-600">Sistem SIJAGA Berhasil Menganalisis</Badge>
                    <h2 className="text-4xl font-black text-brand-900 tracking-tight">WAJIB {docType}</h2>
                    <p className="text-slate-600 mt-2">Silakan lengkapi rincian teknis pengelolaan lingkungan di bawah ini.</p>
                 </div>
                 
                 {docType === 'SPPL' ? <SPPLFormFields /> : <UKLUPLFormFields />}
                 
                 <div className="flex gap-3 mt-10 pt-6 border-t">
                  <Button variant="outline" onClick={() => setStep(1)} className="h-12">Ubah Data Identitas</Button>
                  <Button onClick={() => setStep(5)} className="flex-1 bg-brand-600 h-12 text-lg">
                    Lanjut ke Lampiran Dokumen <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div>
                  <h2 className="text-2xl font-bold text-gov-600">D/I. Lampiran Dokumen</h2>
                  <p className="text-sm text-gray-500">Upload dokumen legalitas dan teknis pendukung.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FileUploadWithPreview label="File NIB (Nomor Induk Berusaha)" accept=".pdf" onChange={(f) => setValue('file_nib', f)} />
                  <FileUploadWithPreview label="File NPWP Perusahaan" accept=".pdf,.jpg" onChange={(f) => setValue('file_npwp', f)} />
                  
                  {/* Partisi Lampiran Khusus UKL-UPL */}
                  {docType === 'UKL_UPL' && (
                    <>
                      <FileUploadWithPreview label="File Izin Lokasi / PKKPR" accept=".pdf" onChange={(f) => setValue('file_pkkpr', f)} />
                      <FileUploadWithPreview label="Layout Mesin & Siteplan" accept=".pdf,.jpg" onChange={(f) => setValue('file_siteplan', f)} />
                    </>
                  )}
                  
                  <FileUploadWithPreview label="Foto Lokasi Usaha" accept="image/*" onChange={(f) => setValue('foto_lokasi', f)} />
                </div>

                <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed">
                    <h3 className="font-bold mb-4">Pernyataan Pertanggungjawaban</h3>
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" required className="mt-1 w-5 h-5" />
                        <span className="text-sm text-gray-600 leading-relaxed">
                            Saya penanggung jawab usaha menyatakan bahwa seluruh data yang diisikan benar dan saya bersedia melakukan pengelolaan lingkungan sesuai dokumen yang diajukan.
                        </span>
                    </label>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(4)} className="w-1/3 py-6">Kembali</Button>
                  <Button onClick={handleSubmit(onSubmit)} className="flex-1 bg-gov-600 text-lg py-6 shadow-lg hover:bg-gov-700">
                    Kirim Dokumen ke Dinas Lingkungan Hidup
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </FormProvider>
  );
};