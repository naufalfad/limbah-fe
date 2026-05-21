import { CompanyMasterData } from "@/types/environmental";

export const determineRegistrationType = (data: Partial<CompanyMasterData>): 'SPPL' | 'UKL_UPL' => {
  // LOGIKA SMART SYSTEM (Contoh Sederhana):
  // 1. Jika luas lahan > 10.000 m2 (1 Hektar) wajib UKL-UPL
  // 2. Jika karyawan > 100 orang wajib UKL-UPL
  // 3. Jika status penanaman modal PMA (Asing) wajib UKL-UPL
  
  if (
    (data.luas_lahan_m2 && data.luas_lahan_m2 > 10000) || 
    (data.jumlah_karyawan && data.jumlah_karyawan > 100) ||
    (data.status_penanaman_modal === 'PMA')
  ) {
    return 'UKL_UPL';
  }

  return 'SPPL';
};