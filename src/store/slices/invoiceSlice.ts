import { StateCreator } from "zustand";
import { SijagaState, InvoiceSlice, Invoice } from "../types";
import { apiService } from "../../lib/api";
import { toast } from "sonner";
import { initialInvoices } from "../mockData";

export const createInvoiceSlice: StateCreator<
  SijagaState,
  [],
  [],
  InvoiceSlice
> = (set, get) => ({
  invoices: initialInvoices,

  fetchInvoices: async (companyId) => {
    try {
      const response = await apiService.invoices.getAll(companyId);
      if (response && response.success) {
        const rawInvoices = response.invoices || [];
        const invoices = rawInvoices.map((item: any) => ({
          ...item,
          companyName: item.companyName || item.company?.companyName || "Unknown Company"
        }));
        set({ invoices });
      }
    } catch (e) {
      console.warn("fetchInvoices failed", e);
    }
  },

  payInvoice: async (id) => {
    try {
      const response = await apiService.invoices.pay(id);
      if (response && response.success) {
        const updatedInvoice: Invoice = response.invoice;
        set((state) => ({
          invoices: state.invoices.map((inv) => (inv.id === id ? {
            ...updatedInvoice,
            companyName: updatedInvoice.companyName || state.companies.find(c => c.id === updatedInvoice.companyId)?.companyName || "Unknown Company"
          } : inv)),
          pickupRequests: state.pickupRequests.map((r) =>
            r.invoiceId === id ? { ...r, status: "PAID" } : r
          )
        }));
        toast.success("Pembayaran tagihan sukses! Dana disetor ke Kas Daerah Pemda.");
        return;
      }
    } catch (e: any) {
      if (e.response) {
        throw e;
      }
      console.warn("Pembayaran tagihan API gagal, fallback offline.", e);
    }

    // --- FALLBACK OFFLINE ---
    set((state) => ({
      invoices: state.invoices.map((inv) => (inv.id === id ? { ...inv, status: "SETTLED" } : inv))
    }));

    const invoice = get().invoices.find((i) => i.id === id);
    if (invoice) {
      set((state) => ({
        pickupRequests: state.pickupRequests.map((r) =>
          r.invoiceId === id ? { ...r, status: "PAID" } : r
        )
      }));

      toast.success("Pembayaran Tagihan Berhasil (Simulasi Offline)!");
      get().addAuditLog(invoice.companyName, "PERUSAHAAN", `Melakukan pembayaran digital invoice ${id} senilai Rp ${invoice.amount.toLocaleString()} (Langsung Lunas).`);
      get().addNotification(
        "Pembayaran Diterima (Lunas)",
        `Dana invoice ${id} sebesar Rp ${invoice.amount.toLocaleString()} berhasil disetorkan ke Kas Daerah. Pengangkutan segera meluncur.`,
        "SUCCESS"
      );
    }
  },
});
