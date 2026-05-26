import { StateCreator } from "zustand";
import { SijagaState, WasteSlice, WasteLog } from "../types";
import { apiService } from "../../lib/api";
import { toast } from "sonner";
import { initialWasteLogs } from "../mockData";

export const createWasteSlice: StateCreator<
  SijagaState,
  [],
  [],
  WasteSlice
> = (set, get) => ({
  wasteLogs: initialWasteLogs,

  fetchWasteLogs: async (companyId) => {
    try {
      const response = await apiService.waste.getAll(companyId);
      if (response && response.success) {
        const rawLogs = response.logs || response.wasteLogs || [];
        const logs = rawLogs.map((item: any) => ({
          ...item,
          companyName: item.companyName || item.company?.companyName || "Unknown Company"
        }));
        set({ wasteLogs: logs });
      }
    } catch (e) {
      console.warn("fetchWasteLogs failed", e);
    }
  },

  addWasteLog: async (logData) => {
    try {
      const response = await apiService.waste.create(logData);
      if (response && response.success) {
        const newLog: WasteLog = response.log;
        set((state) => ({
          wasteLogs: [...state.wasteLogs, {
            ...newLog,
            companyName: newLog.companyName || state.companies.find(c => c.id === newLog.companyId)?.companyName || "Unknown Company"
          }]
        }));
        toast.success("Limbah berhasil dilaporkan ke dinas!");
        return;
      }
    } catch (e: any) {
      if (e.response) {
        throw e;
      }
      console.warn("Pelaporan limbah API gagal, fallback offline.", e);
    }

    // --- FALLBACK OFFLINE ---
    const newId = `W-${String(get().wasteLogs.length + 1).padStart(3, "0")}`;
    const comp = get().companies.find((c) => c.id === logData.companyId);

    const newLog: WasteLog = {
      ...logData,
      id: newId,
      companyName: comp?.companyName || "PT. Demo Company",
      status: logData.method === "Dinas" ? "Terjadwal_Pickup" : "Proses_Verifikasi"
    };

    set((state) => ({
      wasteLogs: [...state.wasteLogs, newLog]
    }));

    toast.success("Limbah berhasil dilaporkan (Offline)!");
    get().addAuditLog(comp?.picPhone || "PERUSAHAAN", "PERUSAHAAN", `Melaporkan limbah ${logData.type} sebesar ${logData.volume} ${logData.unit}`);

    if (logData.volume > 100) {
      get().addNotification(
        "ALERT EWS: Volume Limbah Abnormal",
        `${comp?.companyName} melaporkan volume ${logData.type} sebesar ${logData.volume}${logData.unit} (Melebihi ambang batas 100).`,
        "DANGER"
      );
    }
  },

  verifyWasteLog: async (id, status) => {
    try {
      const response = await apiService.waste.verify(id, status);
      if (response && response.success) {
        set((state) => ({
          wasteLogs: state.wasteLogs.map(log => log.id === id ? { ...log, status } : log)
        }));
        toast.success(`Logbook berhasil di-${status.toLowerCase()}.`);
        return;
      }
    } catch (e) {
      console.warn("API verifyWasteLog failed, fallback to local state", e);
    }
    
    // Fallback offline
    set((state) => ({
      wasteLogs: state.wasteLogs.map(log => log.id === id ? { ...log, status } : log)
    }));
    toast.success(`[Offline] Logbook berhasil di-${status.toLowerCase()}.`);
  },
});
