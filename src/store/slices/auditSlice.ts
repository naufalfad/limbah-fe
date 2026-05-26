import { StateCreator } from "zustand";
import { SijagaState, AuditSlice, AuditLog } from "../types";
import { apiService } from "../../lib/api";
import { initialAuditLogs } from "../mockData";

export const createAuditSlice: StateCreator<
  SijagaState,
  [],
  [],
  AuditSlice
> = (set, get) => ({
  auditLogs: initialAuditLogs,

  addAuditLog: async (user, role, action) => {
    try {
      const data = await apiService.auditLogs.create({ user, role, action });
      if (data && data.success && data.auditLog) {
        set((state) => ({
          auditLogs: [data.auditLog, ...state.auditLogs],
        }));
      }
    } catch (error) {
      console.error("Failed to add audit log:", error);
    }
  },

  fetchAuditLogs: async () => {
    try {
      const data = await apiService.auditLogs.getAll();
      if (data && data.success) {
        set({ auditLogs: data.auditLogs });
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    }
  },
});
