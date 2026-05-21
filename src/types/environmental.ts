// src/types/environmental.ts

export type RegistrationType = 'SPPL' | 'UKL_UPL' | 'PENDING';

// --- 1. FIELD MASTER ---
export interface CompanyMasterData {
  // Identitas
  nama_perusahaan: string;
  nama_penanggung_jawab: string;
  jabatan_penanggung_jawab: string;
  npwp_perusahaan: string;
  nib: string;
  kbli: string;
  jenis_usaha: string;
  status_penanaman_modal: 'PMDN' | 'PMA';
  tahun_berdiri: number;
  jumlah_karyawan: number;
  
  // Lokasi
  alamat_lengkap: string;
  provinsi: string;
  kabupaten_kota: string;
  kecamatan: string;
  kelurahan: string;
  kode_pos: string;
  latitude: number;
  longitude: number;
  status_lahan: string;
  luas_lahan_m2: number;
  luas_bangunan_m2: number;

  // Operasional
  jam_operasional: string;
  hari_operasional: string;
  kapasitas_produksi: string;
  satuan_kapasitas: string;
  bahan_baku: string;
  sumber_air: string;
  sumber_listrik: string;
  penggunaan_bbm: string;
}

// --- 2. FIELD KHUSUS SPPL ---
export interface SPPLData {
  kesanggupan_menjaga_lingkungan: boolean;
  kesanggupan_tidak_mencemari: boolean;
  kesanggupan_mengelola_limbah: boolean;
  kesanggupan_mematuhi_peraturan: boolean;
  menghasilkan_limbah: boolean;
  jenis_limbah: string;
  volume_limbah_per_hari: string;
  metode_pembuangan: string;
  memiliki_tps: boolean;
  tanggal_pernyataan: string;
  kota_penandatanganan: string;
  nama_penandatangan: string;
}

// --- 3. FIELD KHUSUS UKL-UPL ---
export interface UKLUPLData {
  deskripsi_usaha: string;
  tahapan_kegiatan: Array<{ tahap: 'Pra-Konstruksi' | 'Konstruksi' | 'Operasional' | 'Pasca-Operasional'; aktivitas: string; dampak: string; source: string }>;
  proses_produksi: string;
  daftar_mesin: any[];
  kapasitas_mesin: any[];
  
  // UKL (Pengelolaan)
  pengelolaan: Array<{
    jenis_dampak: string;
    sumber_dampak: string;
    bentuk_pengelolaan: string;
    lokasi_pengelolaan: string;
    periode_pengelolaan: string;
  }>;

  // UPL (Pemantauan)
  pemantauan: Array<{
    parameter_pantau: string;
    metode_pemantauan: string;
    lokasi_pemantauan: string;
    frekuensi_pemantauan: string;
    standar_acuan: string;
  }>;

  // Limbah Detail
  limbah_cair: { sumber: string; debit: string; metode: string; titik_buang: string };
  limbah_padat: { jenis: string; volume: string; metode: string };
  limbah_b3: { 
    menghasilkan: boolean; 
    jenis: string; 
    kode: string; 
    volume: string; 
    metode_simpan: string;
    transporter: string;
  };
  
  emisi_gangguan: { sumber_emisi: string; kebisingan: string; getaran: string; bau: string };
  sosial: { jarak_pemukiman: string; keluhan_masyarakat: string; komunikasi: string };
}