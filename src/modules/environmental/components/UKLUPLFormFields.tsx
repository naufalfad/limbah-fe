import React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const UKLUPLFormFields = () => {
  const { register, control } = useFormContext();

  // Field Array untuk Tahapan Kegiatan
  const { fields: tahapFields, append: appendTahap, remove: removeTahap } = useFieldArray({
    control,
    name: "tahapan_kegiatan"
  });

  // Field Array untuk Pengelolaan (UKL)
  const { fields: uklFields, append: appendUkl, remove: removeUkl } = useFieldArray({
    control,
    name: "pengelolaan_ukl"
  });

  return (
    <div className="space-y-6">
      <Accordion type="single" collapsible className="w-full">
        
        {/* SEKSI A & B: DESKRIPSI & TAHAPAN KEGIATAN */}
        <AccordionItem value="deskripsi">
          <AccordionTrigger className="text-lg font-semibold">A & B. Deskripsi & Tahapan Kegiatan</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Deskripsi Usaha</Label>
              <Textarea {...register("deskripsi_usaha")} placeholder="Jelaskan secara rinci proses bisnis..." />
            </div>

            <div className="border rounded-md p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <Label className="text-base">Tabel Tahapan Kegiatan</Label>
                <Button type="button" size="sm" onClick={() => appendTahap({ tahap: '', aktivitas: '', potensi_dampak: '', sumber_dampak: '' })}>
                  <Plus className="w-4 h-4 mr-1" /> Tambah Tahap
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tahap</TableHead>
                    <TableHead>Aktivitas</TableHead>
                    <TableHead>Potensi Dampak</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tahapFields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <select {...register(`tahapan_kegiatan.${index}.tahap`)} className="w-full border p-1 rounded text-sm">
                          <option>Pra-Konstruksi</option>
                          <option>Konstruksi</option>
                          <option>Operasional</option>
                          <option>Pasca-Operasional</option>
                        </select>
                      </TableCell>
                      <TableCell><Input {...register(`tahapan_kegiatan.${index}.aktivitas`)} placeholder="Contoh: Pembersihan Lahan" /></TableCell>
                      <TableCell><Input {...register(`tahapan_kegiatan.${index}.potensi_dampak`)} placeholder="Contoh: Debu/Kebisingan" /></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeTahap(index)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEKSI C: PENGELOLAAN LINGKUNGAN (UKL) */}
        <AccordionItem value="ukl">
          <AccordionTrigger className="text-lg font-semibold">C. Pengelolaan Lingkungan (UKL)</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="border rounded-md p-4 bg-green-50/30">
              <div className="flex justify-between items-center mb-4">
                <Label className="text-base text-green-800">Bentuk Pengelolaan Lingkungan</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => appendUkl({ jenis_dampak: '', bentuk_pengelolaan: '', lokasi_pengelolaan: '', periode_pengelolaan: '' })}>
                  <Plus className="w-4 h-4 mr-1" /> Tambah Matriks UKL
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jenis Dampak</TableHead>
                    <TableHead>Bentuk Pengelolaan</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uklFields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell><Input {...register(`pengelolaan_ukl.${index}.jenis_dampak`)} placeholder="Limbah Cair" /></TableCell>
                      <TableCell><Input {...register(`pengelolaan_ukl.${index}.bentuk_pengelolaan`)} placeholder="Pembuatan IPAL" /></TableCell>
                      <TableCell><Input {...register(`pengelolaan_ukl.${index}.lokasi_pengelolaan`)} placeholder="Area Belakang" /></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeUkl(index)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEKSI E: INFORMASI LIMBAH DETAIL (B3 & CAIR) */}
        <AccordionItem value="limbah-detail">
          <AccordionTrigger className="text-lg font-semibold">E. Informasi Limbah Detail</AccordionTrigger>
          <AccordionContent className="space-y-6 pt-4">
            {/* Limbah B3 */}
            <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50">
              <h4 className="font-bold flex items-center mb-3">
                <AlertCircle className="w-4 h-4 mr-2" /> Limbah B3 (Bahan Berbahaya & Beracun)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jenis/Nama Limbah B3</Label>
                  <Input {...register("limbah_b3_jenis")} placeholder="Contoh: Oli Bekas, Aki" />
                </div>
                <div className="space-y-2">
                  <Label>Kode Limbah (Jika Tahu)</Label>
                  <Input {...register("limbah_b3_kode")} placeholder="Contoh: B105d" />
                </div>
                <div className="space-y-2">
                  <Label>Metode Penyimpanan</Label>
                  <Input {...register("limbah_b3_metode")} placeholder="TPS Limbah B3" />
                </div>
                <div className="space-y-2">
                  <Label>Transporter/Pengangkut</Label>
                  <Input {...register("limbah_b3_transporter")} placeholder="Nama Perusahaan Pengangkut" />
                </div>
              </div>
            </div>

            {/* Limbah Cair */}
            <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
              <h4 className="font-bold mb-3">Limbah Cair & Domestik</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input {...register("limbah_cair_sumber")} placeholder="Sumber Limbah Cair" />
                <Input {...register("limbah_cair_debit")} placeholder="Debit (M3/Hari)" />
                <Input {...register("limbah_cair_pengolahan")} placeholder="Metode Pengolahan (Septic Tank/IPAL)" />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
};