export type EnvironmentalType = "SPPL" | "UKL-UPL";

export const determineEnvironmentalCategory = (data: {
  investment: number; // Rupiah
  landArea: number;   // m2
  employeeCount: number;
}): EnvironmentalType => {
  // Logika Dummy (Contoh: Berdasarkan Modal Usaha)
  // UKL-UPL biasanya untuk Usaha Menengah ke Atas (> 5 Miliar)
  // SPPL untuk Usaha Mikro & Kecil (< 5 Miliar)
  if (data.investment >= 5000000000 || data.landArea > 5000) {
    return "UKL-UPL";
  }
  return "SPPL";
};