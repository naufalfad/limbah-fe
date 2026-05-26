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

  submitInspectionResult: async (id, score, notes, checklist, photo) => {
    try {
      const response = await apiService.inspections.submit(id, score, notes, checklist, photo);
      if (response && response.success) {
        const updatedInsp: Inspection = response.inspection;
        set((state) => ({
          inspections: state.inspections.map((insp) => insp.id === id ? updatedInsp : insp),
          companies: state.companies.map((c) => c.id === updatedInsp.companyId ? { ...c, score } : c)
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
        insp.id === id ? { ...insp, score, notes, checklist, photo, status: "Selesai", bapSigned: true } : insp
      )
    }));

    const insp = get().inspections.find((i) => i.id === id);
    if (!insp) return;

    set((state) => ({
      companies: state.companies.map((c) => (c.id === insp.companyId ? { ...c, score } : c))
    }));

    toast.success("BAP Inspeksi disubmit (Offline)!");
    const user = get().currentUser;
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
  },
});
