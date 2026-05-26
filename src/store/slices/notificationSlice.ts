import { StateCreator } from "zustand";
import { SijagaState, NotificationSlice, SystemNotification } from "../types";
import { apiService } from "../../lib/api";
import { initialNotifications } from "../mockData";

export const createNotificationSlice: StateCreator<
  SijagaState,
  [],
  [],
  NotificationSlice
> = (set, get) => ({
  notifications: initialNotifications,

  fetchNotifications: async () => {
    try {
      const response = await apiService.notifications.getAll();
      if (response && response.success) {
        set({ notifications: response.notifications || [] });
      }
    } catch (e) {
      console.warn("fetchNotifications failed", e);
    }
  },

  readNotification: async (id) => {
    try {
      const response = await apiService.notifications.read(id);
      if (response && response.success) {
        set((state) => ({
          notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n)
        }));
      }
    } catch (e) {
      console.warn("readNotification failed, using offline fallback", e);
      set((state) => ({
        notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n)
      }));
    }
  },

  addNotification: async (title, message, type) => {
    try {
      const response = await apiService.notifications.create({ title, message, type });
      if (response && response.success) {
        set((state) => ({
          notifications: [response.notification, ...state.notifications]
        }));
        return;
      }
    } catch (e) {
      console.warn("API addNotification failed, fallback to local state", e);
    }

    const newId = `NTF-${String(get().notifications.length + 1).padStart(3, "0")}`;
    const newNtf: SystemNotification = {
      id: newId,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    set((state) => ({
      notifications: [newNtf, ...state.notifications]
    }));
  },

  readAllNotifications: async () => {
    try {
      await apiService.notifications.readAll();
    } catch (e) {
      console.warn("API readAllNotifications failed", e);
    }
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true }))
    }));
  },
});
