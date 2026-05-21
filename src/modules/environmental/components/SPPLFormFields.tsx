import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, ShieldCheck, Trash2 } from 'lucide-react';

export const SPPLFormFields = () => {
  const { register, setValue, watch } = useFormContext();
  
  // Mengawasi nilai checkbox untuk integrasi dengan react-hook-form
  const watchLimbah = watch("menghasilkan_limbah");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* SEKSI A: PERNYATAAN KESANGGUPAN */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-6 h-6 text-brand-600" />
          <h3 className="text-lg font-bold">A. Pernyataan Kesanggupan</h3>
        </div>
        
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-slate-600 mb-4 italic">
              "Kami yang bertanda tangan di bawah ini, menyatakan sanggup untuk:"
            </p>
            
            {[
              { id: "kesanggupan_menjaga_lingkungan", label: "Menjaga kelestarian fungsi lingkungan hidup secara berkelanjutan." },
              { id: "kesanggupan_tidak_mencemari", label: "Tidak melakukan pencemaran dan/atau perusakan lingkungan hidup." },
              { id: "kesanggupan_mengelola_limbah", label: "Mengelola limbah yang dihasilkan sesuai dengan standar peraturan." },
              { id: "kesanggupan_mematuhi_peraturan", label: "Mematuhi segala ketentuan peraturan perundang-undangan di bidang lingkungan hidup." }
            ].map((item) => (
              <div key={item.id} className="flex items-start space-x-3 p-3 bg-white rounded-md border shadow-sm">
                <Checkbox 
                  id={item.id}
                  onCheckedChange={(checked) => setValue(item.id, checked)}
                  className="mt-1"
                />
                <label htmlFor={item.id} className="text-sm font-medium leading-relaxed cursor-pointer">
                  {item.label}
                </label>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* SEKSI B: INFORMASI LIMBAH SEDERHANA */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="w-6 h-6 text-orange-600" />
          <h3 className="text-lg font-bold">B. Informasi Limbah & Dampak</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>Apakah usaha menghasilkan limbah?</Label>
            <div className="flex gap-4">
               <label className="flex items-center gap-2">
                 <input type="radio" value="true" {...register("menghasilkan_limbah")} /> Ya
               </label>
               <label className="flex items-center gap-2">
                 <input type="radio" value="false" {...register("menghasilkan_limbah")} /> Tidak
               </label>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Volume Limbah Per Hari (Estimasi)</Label>
            <Input {...register("volume_limbah_per_hari")} placeholder="Contoh: 5 Liter / 2 Kg" />
          </div>

          <div className="md:col-span-2 space-y-3">
            <Label>Jenis Limbah yang dihasilkan</Label>
            <Textarea {...register("jenis_limbah")} placeholder="Sebutkan jenis limbah (misal: sisa makanan, air bekas cucian, kertas)" />
          </div>

          <div className="md:col-span-2 space-y-3">
            <Label>Metode Pembuangan / Pengelolaan</Label>
            <Textarea {...register("metode_pembuangan")} placeholder="Bagaimana limbah dibuang? (misal: Diangkut DLH, masuk septic tank)" />
          </div>

          <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-100 rounded-lg md:col-span-2">
             <Checkbox id="memiliki_tps" onCheckedChange={(v) => setValue("memiliki_tps", v)} />
             <Label htmlFor="memiliki_tps" className="text-orange-800 cursor-pointer">Kami memiliki Tempat Penampungan Sementara (TPS) sampah/limbah.</Label>
          </div>
        </div>
      </section>

      {/* SEKSI C: ADMINISTRASI PENANDATANGANAN */}
      <section className="space-y-4 border-t pt-8">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-bold">C. Pengesahan Dokumen</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label>Kota Penandatanganan</Label>
            <Input {...register("kota_penandatanganan")} placeholder="Contoh: Jakarta Selatan" />
          </div>
          <div className="space-y-2">
            <Label>Tanggal Pernyataan</Label>
            <Input type="date" {...register("tanggal_pernyataan")} />
          </div>
          <div className="space-y-2">
            <Label>Nama Lengkap Penandatangan</Label>
            <Input {...register("nama_penandatangan")} placeholder="Sesuai KTP" />
          </div>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-md border border-blue-100 mt-4">
          <p className="text-xs text-blue-700 leading-relaxed">
            * Dengan mengisi formulir ini, Anda memahami bahwa SPPL ini berlaku sebagai komitmen hukum yang mengikat. Pelanggaran terhadap poin-poin di atas dapat dikenakan sanksi sesuai UU Perlindungan dan Pengelolaan Lingkungan Hidup.
          </p>
        </div>
      </section>

    </div>
  );
};