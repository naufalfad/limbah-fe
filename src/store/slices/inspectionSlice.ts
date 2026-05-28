// src/store/slices/inspectionSlice.ts
import { StateCreator } from "zustand";
import { SijagaState, InspectionSlice, Inspection } from "../types";
import { apiService } from "../../lib/api";
import { toast } from "sonner";
import { initialInspections } from "../mockData";

export const createInspectionSlice: StateCreator<
  SijagaState,
  [],
  [],
  InspectionSlice
> = (set, get) => ({
  inspections: initialInspections,

  fetchInspections: async () => {
    try {
      const response = await apiService.inspections.getAll();
      if (response && response.success) {
        set({ inspections: response.inspections || [] });
      }
    } catch (e) {
      console.warn("fetchInspections failed", e);
    }
  },

  scheduleInspection: async (inspectionData) => {
    try {
      const response = await apiService.inspections.schedule(inspectionData);
      if (response && response.success) {
        const newInsp: Inspection = response.inspection;
        set((state) => ({
          inspections: [...state.inspections, newInsp]
        }));
        toast.success("Jadwal inspeksi berhasil disimpan di server.");
        return newInsp;
      }
    } catch (e) {
      console.warn("Penjadwalan inspeksi API gagal, fallback offline.", e);
    }

    // --- FALLBACK OFFLINE ---
    const newId = `INSP-${String(get().inspections.length + 1).padStart(3, "0")}`;
    const newInspection: Inspection = {
      ...inspectionData,
      id: newId,
      status: "Terjadwal",
      score: null,
      checklist: { tpsB3: false, ipal: false, apar: false, noise: false, safetyEquipment: false }
    };

    set((state) => ({
      inspections: [...state.inspections, newInspection]
    }));

    toast.success("Jadwal inspeksi berhasil disimpan (Offline)!");
    const user = get().currentUser;
    get().addAuditLog(user?.email || "SYSTEM", user?.role || "ADMIN_DLH", `Menjadwalkan inspeksi lapangan untuk ${inspectionData.companyName}`);
    get().addNotification(
      "Jadwal Inspeksi Lingkungan",
      `Petugas ${inspectionData.inspectorName} dijadwalkan menginspeksi ${inspectionData.companyName} pada ${inspectionData.date}.`,
      "INFO"
    );
    return newInspection;
  },

  // FASE 1 ARSITEKTUR: Menangkap parameter ke-6 (correctedCompanyId) & Handle Null Score
  submitInspectionResult: async (id, score, notes, checklist, photo, correctedCompanyId) => {
    try {
      // Mengirimkan data BAP (Polymorphic: bisa rutinitas, bisa pengaduan) ke API
      const response = await apiService.inspections.submit(
        id,
        score ?? undefined as any, // Ubah null menjadi undefined agar tidak merusak payload axios jika perlu
        notes,
        checklist ?? undefined,
        photo,
        correctedCompanyId
      );

      if (response && response.success) {
        const updatedInsp: Inspection = response.inspection;
        set((state) => ({
          inspections: state.inspections.map((insp) => insp.id === id ? updatedInsp : insp),
          // DATA INTEGRITY GUARD: Hanya update skor ESG perusahaan jika BAP memiliki skor valid
          companies: state.companies.map((c) => {
            if (c.id === updatedInsp.companyId) {
              return typeof score === 'number' ? { ...c, score } : c;
            }
            return c;
          })
        }));
        toast.success("Hasil BAP Inspeksi lapangan berhasil diunggah!");
        return;
      }
    } catch (e) {
      console.warn("Unggah BAP API gagal, fallback offline.", e);
    }

    // --- FALLBACK OFFLINE ---
    set((state) => ({
      inspections: state.inspections.map((insp) =>
        insp.id === id ? {
          ...insp,
          score,
          notes,
          checklist: checklist ?? undefined,
          photo,
          status: "Selesai",
          bapSigned: true,
          // Update companyId di dalam state luring jika petugas melakukan koreksi sasaran
          ...(correctedCompanyId && { companyId: correctedCompanyId })
        } : insp
      )
    }));

    const insp = get().inspections.find((i) => i.id === id);
    if (!insp) return;

    // Tentukan entitas sasaran luring
    const targetCompanyId = correctedCompanyId || insp.companyId;

    // DATA INTEGRITY GUARD: Update state perusahaan lokal HANYA JIKA score adalah angka
    if (typeof score === 'number') {
      set((state) => ({
        companies: state.companies.map((c) => (c.id === targetCompanyId ? { ...c, score } : c))
      }));
    }

    toast.success("BAP Inspeksi disubmit (Offline)!");
    const user = get().currentUser;

    // Pemisahan Logika Notifikasi & Log Audit berdasarkan jenis BAP
    if (typeof score === 'number') {
      get().addAuditLog(user?.email || "OFFICER", "PETUGAS_LAPANGAN", `Mengirimkan hasil inspeksi ${id} untuk ${insp.companyName} dengan skor ${score}`);

      if (score < 60) {
        get().addNotification(
          "WARNING: Kepatuhan Lingkungan Rendah",
          `Hasil inspeksi ${insp.companyName} menunjukkan skor kepatuhan kritis: ${score}/100. Rekomendasi teguran tertulis.`,
          "WARNING"
        );
      } else {
        get().addNotification(
          "Hasil Inspeksi Disubmit",
          `Evaluasi kepatuhan ${insp.companyName} selesai dengan hasil baik: ${score}/100.`,
          "SUCCESS"
        );
      }
    } else {
      // Skenario BAP Pengaduan Warga (Tanpa Skor)
      get().addAuditLog(user?.email || "OFFICER", "PETUGAS_LAPANGAN", `Mengirimkan BAP penindakan pengaduan lapangan untuk ${insp.companyName} (${id})`);
      get().addNotification(
        "BAP Penindakan Selesai",
        `BAP lapangan untuk ${insp.companyName} berhasil diamankan ke sistem.`,
        "INFO"
      );
    }
  },
});