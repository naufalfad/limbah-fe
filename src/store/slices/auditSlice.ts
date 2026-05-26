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
      const response = await apiService.auditLogs.create({ user, role, action });
      if (response && response.success) {
        set((state) => ({
          auditLogs: [response.auditLog, ...state.auditLogs]
        }));
        return;
      }
    } catch (e) {
      console.warn("API addAuditLog failed, fallback to local state", e);
    }

    const newId = `LOG-${String(get().auditLogs.length + 1).padStart(3, "0")}`;
    const newLog: AuditLog = {
      id: newId,
      timestamp: new Date().toISOString(),
      user,
      role,
      action
    };
    set((state) => ({
      auditLogs: [newLog, ...state.auditLogs]
    }));
  }
});
