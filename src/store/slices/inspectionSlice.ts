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

  /**
   * ACTION: Menjadwalkan Surat Tugas Baru (Direct DLH Assignment)
   * 
   * Aksi ini diselaraskan untuk menerima payload koordinat spasial custom (pada field location)
   * dan rincian instruksi dinas (pada field notes) dari form penugasan mandiri [3].
   */
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
    const company = get().companies.find(c => c.id === inspectionData.companyId);
    const isSppl = company?.docType === "SPPL";

    const newInspection: Inspection = {
      ...inspectionData,
      id: newId,
      status: "Terjadwal",
      score: null,
      bapSigned: false, // SINKRONISASI COHESION: Menjaga UI Safety agar tidak crash saat membaca status tanda tangan [3]
      // RESOLUSI KONFLIK: Memakai data struktur checklist detail spasial SPPL/UKL-UPL milik rekan Anda
      checklist: isSppl ? {
        spplBersih: false,
        spplBebasLimbah: false,
        spplDrainase: false,
        spplBebasBakar: false,
        spplTempatSampah: false
      } : {
        sumberDampakStatus: "SESUAI",
        sumberDampakNotes: "",
        jenisDampakStatus: "SESUAI",
        jenisDampakNotes: "",
        besaranDampakStatus: "SESUAI",
        besaranDampakNotes: "",
        pengelolaanBentukStatus: "SESUAI",
        pengelolaanBentukNotes: "",
        pengelolaanLokasiStatus: "SESUAI",
        pengelolaanLokasiNotes: "",
        pengelolaanPeriodeStatus: "SESUAI",
        pengelolaanPeriodeNotes: "",
        pemantauanBentukStatus: "SESUAI",
        pemantauanBentukNotes: "",
        pemantauanLokasiStatus: "SESUAI",
        pemantauanLokasiNotes: "",
        pemantauanPeriodeStatus: "SESUAI",
        pemantauanPeriodeNotes: "",
        institusiStatus: "SESUAI",
        institusiNotes: "",
        keteranganStatus: "SESUAI",
        keteranganNotes: ""
      }
    };

    set((state) => ({
      inspections: [...state.inspections, newInspection]
    }));

    toast.success("Jadwal inspeksi berhasil disimpan (Offline)!");
    const user = get().currentUser;

    // Catat tindakan ke log audit luring
    get().addAuditLog(
      user?.email || "SYSTEM",
      user?.role || "ADMIN_DLH",
      `Menjadwalkan inspeksi lapangan untuk ${inspectionData.companyName}`
    );

    // Menerbitkan notifikasi sistem luring
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
        const targetCompanyId = updatedInsp.companyId;
        set((state) => ({
          inspections: state.inspections
            .filter((insp) => {
              if (
                insp.id !== id &&
                insp.companyId === targetCompanyId &&
                insp.status === "Selesai" &&
                insp.score !== null &&
                insp.score !== undefined &&
                insp.score < 60
              ) {
                return false;
              }
              return true;
            })
            .map((insp) => insp.id === id ? updatedInsp : insp),
          // DATA INTEGRITY GUARD: Hanya update skor ESG perusahaan jika BAP memiliki skor valid
          companies: state.companies.map((c) => {
            if (c.id === targetCompanyId) {
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
    const currentInsp = get().inspections.find((i) => i.id === id);
    const targetCompanyId = correctedCompanyId || currentInsp?.companyId;

    set((state) => ({
      inspections: state.inspections
        .filter((insp) => {
          if (
            insp.id !== id &&
            insp.companyId === targetCompanyId &&
            insp.status === "Selesai" &&
            insp.score !== null &&
            insp.score !== undefined &&
            insp.score < 60
          ) {
            return false;
          }
          return true;
        })
        .map((insp) =>
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
    const finalTargetCompanyId = correctedCompanyId || insp.companyId;

    // DATA INTEGRITY GUARD: Update state perusahaan lokal HANYA JIKA score adalah angka
    if (typeof score === 'number') {
      set((state) => ({
        companies: state.companies.map((c) => (c.id === finalTargetCompanyId ? { ...c, score } : c))
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