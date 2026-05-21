import * as z from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
export const fileSchema = z
  .any()
  .refine((file) => file?.size <= MAX_FILE_SIZE, `Ukuran maksimal 5MB.`)
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
    "Hanya format .jpg, .png, dan .pdf yang didukung."
  );

export const registrationSchema = z.object({
  // FIELD MASTER - Identitas
  nama_perusahaan: z.string().min(3, "Nama perusahaan minimal 3 karakter"),
  nama_penanggung_jawab: z.string().min(3),
  jabatan_penanggung_jawab: z.string(),
  npwp_perusahaan: z.string().length(15, "NPWP harus 15 digit"),
  nib: z.string().min(1, "NIB wajib diisi"),
  kbli: z.string(),
  jenis_usaha: z.string(),
  status_penanaman_modal: z.enum(["PMDN", "PMA"]),
  tahun_berdiri: z.string(),
  jumlah_karyawan: z.coerce.number().min(0),

  // FIELD MASTER - Lokasi
  alamat_lengkap: z.string(),
  provinsi: z.string(),
  kabupaten_kota: z.string(),
  kecamatan: z.string(),
  kelurahan: z.string(),
  kode_pos: z.string(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  status_lahan: z.string(),
  luas_lahan_m2: z.coerce.number().min(1, "Luas lahan harus diisi"),
  luas_bangunan_m2: z.coerce.number(),

  // FIELD MASTER - Operasional
  jam_operasional: z.string(),
  hari_operasional: z.string(),
  kapasitas_produksi: z.string(),
  satuan_kapasitas: z.string(),
  bahan_baku: z.string(),
  sumber_air: z.string(),
  sumber_listrik: z.string(),
  penggunaan_bbm: z.string(),
  
  // Penentu (Internal Logic)
  registration_type: z.enum(["SPPL", "UKL_UPL"]).optional(),

  // Tambahkan ke registrationSchema.ts
tahapan_kegiatan: z.array(z.object({
  tahap: z.string(), // Pra-Konstruksi, Konstruksi, dsb
  aktivitas: z.string(),
  potensi_dampak: z.string(),
  sumber_dampak: z.string()
})).min(1),

pengelolaan_ukl: z.array(z.object({
  jenis_dampak: z.string(),
  bentuk_pengelolaan: z.string(),
  lokasi_pengelolaan: z.string(),
  periode_pengelolaan: z.string()
})).min(1),

  file_nib: z.any().optional(),
  file_npwp: z.any().optional(),
  file_pkkpr: z.any().optional(),
  file_siteplan: z.any().optional(),
  foto_lokasi: z.any().optional(),
});

export type RegistrationFormValues = z.infer<typeof registrationSchema>;