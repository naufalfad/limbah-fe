import { StateCreator } from "zustand";
import { SijagaState, PickupSlice, PickupRequest, Invoice } from "../types";
import { apiService } from "../../lib/api";
import { toast } from "sonner";
import { initialPickupRequests } from "../mockData";

export const createPickupSlice: StateCreator<
  SijagaState,
  [],
  [],
  PickupSlice
> = (set, get) => ({
  pickupRequests: initialPickupRequests,
  transporters: [],

  fetchPickupRequests: async (companyId) => {
    try {
      const response = await apiService.pickups.getAll(companyId);
      if (response && response.success) {
        const rawPickups = response.pickups || response.pickupRequests || [];
        const pickups = rawPickups.map((item: any) => ({
          ...item,
          companyName: item.companyName || item.company?.companyName || "Unknown Company"
        }));
        set({ pickupRequests: pickups });
      }
    } catch (e) {
      console.warn("fetchPickupRequests failed", e);
    }
  },

  createPickupRequest: async (requestData) => {
    try {
      const response = await apiService.pickups.create(requestData);
      if (response && response.success) {
        const newPickup: PickupRequest = response.pickup;
        set((state) => ({
          pickupRequests: [...state.pickupRequests, {
            ...newPickup,
            companyName: newPickup.companyName || state.companies.find(c => c.id === newPickup.companyId)?.companyName || "Unknown Company"
          }]
        }));
        toast.success("Permintaan pengangkutan limbah telah diajukan.");
        return;
      }
    } catch (e: any) {
      if (e.response) {
        throw e;
      }
      console.warn("Pengajuan pickup API gagal, fallback offline.", e);
    }

    // --- FALLBACK OFFLINE ---
    const newId = `PICK-${String(get().pickupRequests.length + 1).padStart(3, "0")}`;
    const newInvId = `INV-${String(get().invoices.length + 1).padStart(3, "0")}`;
    
    const parsedVol = parseFloat(requestData.volume.replace(/[^0-9.]/g, '')) || 0;
    const calcCost = parsedVol > 0 ? parsedVol * 10000 : 50000;

    const newRequest: PickupRequest = {
      ...requestData,
      id: newId,
      status: "PRICED",
      cost: calcCost,
      invoiceId: newInvId
    };

    const newInvoice: Invoice = {
      id: newInvId,
      companyId: requestData.companyId,
      companyName: requestData.companyName,
      type: "Pengangkutan",
      amount: calcCost,
      date: new Date().toISOString().split("T")[0],
      status: "UNPAID"
    };

    set((state) => ({
      pickupRequests: [...state.pickupRequests, newRequest],
      invoices: [...state.invoices, newInvoice]
    }));

    toast.success("Permintaan pengangkutan diajukan (Offline)!");
    get().addAuditLog("PERUSAHAAN", "PERUSAHAAN", `Membuat request penjemputan limbah ${requestData.wasteType}`);
    get().addNotification(
      "Permintaan Penjemputan Limbah",
      `${requestData.companyName} mengajukan pickup untuk limbah ${requestData.wasteType} (${requestData.volume}).`,
      "INFO"
    );
  },

  setPickupPrice: async (id, cost, driverName, plateNo) => {
    try {
      const response = await apiService.pickups.setPrice(id, cost, driverName, plateNo);
      if (response && response.success) {
        const updatedPickup: PickupRequest = response.pickup;
        const newInvoice: Invoice = response.invoice;

        set((state) => ({
          pickupRequests: state.pickupRequests.map((r) => r.id === id ? updatedPickup : r),
          invoices: [...state.invoices.filter((i) => i.id !== updatedPickup.invoiceId), newInvoice]
        }));
        toast.success("Tarif penjemputan dan armada berhasil dikirimkan!");
        return;
      }
    } catch (e) {
      console.warn("Penetapan harga API gagal, fallback offline.", e);
    }

    // --- FALLBACK OFFLINE ---
    const req = get().pickupRequests.find((r) => r.id === id);
    if (!req) return;

    const newInvoice: Invoice = {
      id: req.invoiceId || `INV-${String(Math.random())}`,
      companyId: req.companyId,
      companyName: req.companyName,
      type: "Pengangkutan",
      amount: cost,
      date: new Date().toISOString().split("T")[0],
      status: "UNPAID"
    };

    set((state) => ({
      pickupRequests: state.pickupRequests.map((r) =>
        r.id === id ? { ...r, cost, driverName, plateNo, status: "PRICED" } : r
      ),
      invoices: [...state.invoices.filter((i) => i.id !== req.invoiceId), newInvoice]
    }));

    toast.success("Tarif berhasil disubmit (Offline)!");
    get().addAuditLog("PT. Transport Limbah Indonesia", "PENGANGKUT", `Menetapkan biaya pengangkutan order ${id} sebesar Rp ${cost.toLocaleString()}`);
    get().addNotification(
      "Biaya Pengangkutan Ditetapkan",
      `Invoice pengangkutan ${id} senilai Rp ${cost.toLocaleString()} diterbitkan untuk ${req.companyName}.`,
      "INFO"
    );
  },

  updatePickupStatus: async (id, status, payload) => {
    try {
      const response = await apiService.pickups.updateStatus(id, status, payload);
      if (response && response.success) {
        const updatedPickup: PickupRequest = response.pickup;
        set((state) => ({
          pickupRequests: state.pickupRequests.map((r) => r.id === id ? updatedPickup : r)
        }));
        if (status === "COMPLETED") {
          set((state) => ({
            invoices: state.invoices.map((inv) =>
              inv.id === updatedPickup.invoiceId ? { ...inv, status: "SETTLED" } : inv
            )
          }));
        }
        toast.success(`Status pengangkutan berhasil diubah ke: ${status}`);
        return;
      }
    } catch (e) {
      console.warn("Pembaruan armada API gagal, fallback offline.", e);
    }

    // --- FALLBACK OFFLINE ---
    set((state) => ({
      pickupRequests: state.pickupRequests.map((r) =>
        r.id === id ? { ...r, status, ...(payload || {}) } : r
      )
    }));

    const req = get().pickupRequests.find((r) => r.id === id);
    if (!req) return;

    get().addAuditLog("PT. Transport Limbah Indonesia", "PENGANGKUT", `Mengubah status pickup ${id} menjadi ${status}`);

    if (status === "COMPLETED") {
      set((state) => ({
        invoices: state.invoices.map((inv) =>
          inv.id === req.invoiceId ? { ...inv, status: "SETTLED" } : inv
        )
      }));

      toast.success("Manifest pengangkutan telah dinyatakan selesai!");
      get().addAuditLog("SYSTEM", "BILLING", `Order pengangkutan ${id} telah terselesaikan (Dana disetor langsung Pemda).`);
      get().addNotification(
        "Pengangkutan Selesai & Lunas",
        `Limbah ${req.wasteType} dari ${req.companyName} telah terangkut dan tercatat lunas di kas Pemda.`,
        "SUCCESS"
      );
    }
  },

  fetchTransporters: async () => {
    try {
      const response = await apiService.admin.getTransporters();
      if (response && response.success) {
        set({ transporters: response.transporters });
      }
    } catch (e) {
      console.warn("API fetchTransporters failed, using mock data", e);
      set({ transporters: [{ id: "TRANS-1", name: "PT. Maju Transport", email: "t1@mail.com", role: "PENGANGKUT" }] as any });
    }
  },

  assignPickupTransporter: async (id, transporterId, transporterName) => {
    try {
      const response = await apiService.pickups.assignTransporter(id, transporterId, transporterName);
      if (response && response.success) {
        const updatedPickup = response.pickup;
        set((state) => ({
          pickupRequests: state.pickupRequests.map((r) => r.id === id ? updatedPickup : r)
        }));
        toast.success("Transporter berhasil ditugaskan!");
        return;
      }
    } catch (e) {
      console.warn("API assignTransporter failed, fallback to local state", e);
    }

    // Fallback offline
    set((state) => ({
      pickupRequests: state.pickupRequests.map((r) =>
        r.id === id ? { ...r, transporterId, transporterName } : r
      )
    }));
    toast.success("Transporter berhasil ditugaskan (Offline)!");
  },
});
