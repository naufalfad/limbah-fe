import { create } from "zustand";
import { SijagaState } from "./types";
import { createAuthSlice } from "./slices/authSlice";
import { createCompanySlice } from "./slices/companySlice";
import { createWasteSlice } from "./slices/wasteSlice";
import { createPickupSlice } from "./slices/pickupSlice";
import { createInvoiceSlice } from "./slices/invoiceSlice";
import { createInspectionSlice } from "./slices/inspectionSlice";
import { createNotificationSlice } from "./slices/notificationSlice";
import { createAuditSlice } from "./slices/auditSlice";

// Re-export all types so that existing imports in components remain unaffected
export type {
  UserRole,
  User,
  Company,
  WasteLog,
  PickupRequest,
  Invoice,
  Inspection,
  SystemNotification,
  AuditLog,
  SijagaState
} from "./types";

export const useSijagaStore = create<SijagaState>((set, get, store) => ({
  ...createAuthSlice(set, get, store),
  ...createCompanySlice(set, get, store),
  ...createWasteSlice(set, get, store),
  ...createPickupSlice(set, get, store),
  ...createInvoiceSlice(set, get, store),
  ...createInspectionSlice(set, get, store),
  ...createNotificationSlice(set, get, store),
  ...createAuditSlice(set, get, store),
}));
