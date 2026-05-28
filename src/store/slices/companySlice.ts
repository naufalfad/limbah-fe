import { StateCreator } from "zustand";
import { SijagaState, CompanySlice, Company, Invoice } from "../types";
import { apiService } from "../../lib/api";
import { toast } from "sonner";
import { initialAuth } from "./authSlice";

export const createCompanySlice: StateCreator<
  SijagaState,
  [],
  [],
  CompanySlice
> = (set, get) => ({
  companies: initialAuth.companies,

  fetchCompanies: async () => {
    try {
      const response = await apiService.companies.getAll();
      if (response && response.success) {
        const list = response.companies || [];
        set({ companies: list });
      }
    } catch (e) {
      console.warn("fetchCompanies failed", e);
    }
  },

  addCompany: async (formData: FormData) => {
    const companyName = formData.get("companyName") as string || "Unknown Company";
    const picPhone = formData.get("picPhone") as string || "";
    const docType = formData.get("docType") as string || "SPPL";

    try {
      const response = await apiService.companies.create(formData);
      if (response && response.success) {
        const newComp: Company = response.company;
        set((state) => {
          const updatedCompanies = [...state.companies, newComp];
          const updatedUser = state.currentUser ? {
            ...state.currentUser,
            companies: [...(state.currentUser.companies || []), newComp]
          } : null;

          if (updatedUser) {
            localStorage.setItem("sijaga_user", JSON.stringify(updatedUser));
          }

          return {
            companies: updatedCompanies,
            currentUser: updatedUser,
            selectedCompanyId: state.selectedCompanyId || newComp.id
          };
        });
        toast.success("Perusahaan baru berhasil terdaftar di database!");
        get().addAuditLog(picPhone, "PERUSAHAAN", `Registrasi perusahaan baru (API): ${companyName}`);
        get().addNotification(
          "Registrasi Perusahaan Baru",
          `${companyName} telah mendaftarkan dokumen ${docType}. Perlu verifikasi.`,
          "INFO"
        );
        return;
      }
    } catch (error: any) {
      if (error.response) {
        throw error;
      }
      console.warn("Registrasi perusahaan gagal/offline. Menggunakan fallback offline.", error);
    }

    // --- FALLBACK OFFLINE (tanpa file upload) ---
    const newId = `COM-${String(get().companies.length + 1).padStart(3, "0")}`;
    const newCompany: Company = {
      id: newId,
      companyName,
      nib: formData.get("nib") as string || "",
      npwp: formData.get("npwp") as string || "",
      picName: formData.get("picName") as string || "",
      picPhone,
      picRole: formData.get("picRole") as string || "",
      investmentType: (formData.get("investmentType") as "PMDN" | "PMA") || "PMDN",
      yearBuilt: formData.get("yearBuilt") as string || "",
      buildingArea: parseFloat(formData.get("buildingArea") as string) || 0,
      operationalHours: formData.get("operationalHours") as string || "",
      rawMaterials: formData.get("rawMaterials") as string || "",
      waterSource: formData.get("waterSource") as string || "",
      powerSource: formData.get("powerSource") as string || "",
      kbli: formData.get("kbli") as string || "",
      investment: parseFloat(formData.get("investment") as string) || 0,
      landArea: parseFloat(formData.get("landArea") as string) || 0,
      employees: parseInt(formData.get("employees") as string) || 0,
      lat: formData.get("lat") as string || "-6.9147",
      lng: formData.get("lng") as string || "107.6098",
      address: formData.get("address") as string || "",
      docType: docType as "SPPL" | "UKL-UPL" | "UKL_UPL" | "AMDAL",
      status: "PENDING",
    };

    set((state) => {
      const updatedCompanies = [...state.companies, newCompany];
      const updatedUser = state.currentUser ? {
        ...state.currentUser,
        companies: [...(state.currentUser.companies || []), newCompany]
      } : null;

      if (updatedUser) {
        localStorage.setItem("sijaga_user", JSON.stringify(updatedUser));
      }

      return {
        companies: updatedCompanies,
        currentUser: updatedUser,
        selectedCompanyId: state.selectedCompanyId || newId
      };
    });

    toast.success("Registrasi berhasil disimpan (Simulasi Offline)!");
    get().addAuditLog(picPhone, "PERUSAHAAN", `Registrasi perusahaan baru (Offline): ${companyName}`);
    get().addNotification(
      "Registrasi Perusahaan Baru",
      `${companyName} telah mendaftarkan dokumen ${docType}. Perlu verifikasi.`,
      "INFO"
    );
  },

  updateCompany: async (id: string, formData: FormData) => {
    const companyName = formData.get("companyName") as string || "Unknown Company";
    const docType = formData.get("docType") as string || "SPPL";

    try {
      const response = await apiService.companies.update(id, formData);
      if (response && response.success) {
        const updatedComp: Company = response.company;
        set((state) => {
          const updatedCompanies = state.companies.map((c) => c.id === id ? updatedComp : c);
          const updatedUser = state.currentUser ? {
            ...state.currentUser,
            companies: state.currentUser.companies?.map((c) => c.id === id ? updatedComp : c) || []
          } : null;

          if (updatedUser) {
            localStorage.setItem("sijaga_user", JSON.stringify(updatedUser));
          }

          return {
            companies: updatedCompanies,
            currentUser: updatedUser,
            selectedCompanyId: state.selectedCompanyId || id
          };
        });
        toast.success("Revisi berkas perusahaan berhasil dikirim ke DLH!");
        const userEmail = get().currentUser?.email || "USER";
        get().addAuditLog(userEmail, "PERUSAHAAN", `Mengirim revisi berkas registrasi: ${companyName}`);
        get().addNotification(
          "Revisi Berkas Dikirim",
          `Revisi dokumen ${docType} untuk perusahaan ${companyName} telah berhasil diajukan.`,
          "INFO"
        );
        return;
      }
    } catch (error: any) {
      if (error.response) {
        throw error;
      }
      console.warn("Revisi perusahaan gagal.", error);
      throw error;
    }
  },

  updateCompanyStatus: async (id, status) => {
    try {
      const response = await apiService.companies.updateStatus(id, status);
      if (response && response.success) {
        set((state) => ({
          companies: state.companies.map((c) => (c.id === id ? { ...c, status } : c))
        }));
        toast.success(`Status perusahaan berhasil diperbarui ke ${status}`);
        return;
      }
    } catch (e) {
      console.warn("Gagal memperbarui status via API, fallback offline.", e);
    }

    // --- FALLBACK OFFLINE ---
    const activeUntilDate = new Date();
    activeUntilDate.setFullYear(activeUntilDate.getFullYear() + 1);
    const certificateActiveUntil = activeUntilDate.toISOString().split('T')[0];

    set((state) => ({
      companies: state.companies.map((c) => (c.id === id ? { 
        ...c, 
        status,
        ...(status === "APPROVED" && c.status !== "APPROVED" && { certificateActiveUntil })
      } : c))
    }));

    const comp = get().companies.find((c) => c.id === id);
    if (comp) {
      if (status === "APPROVED" && comp.status !== "APPROVED") {
        const isUklUpl = comp.docType === "UKL-UPL" || comp.docType === "UKL_UPL";
        const invoiceType = isUklUpl ? "Retribusi UKL-UPL" : "Retribusi SPPL";
        const amount = isUklUpl ? 1500000 : 750000;
        
        const existingInvoice = get().invoices.find(
          (i) => i.companyId === id && i.type === invoiceType && (i.status === "UNPAID" || i.status === "SETTLED")
        );

        if (!existingInvoice) {
          const newInvoice: Invoice = {
            id: `INV-${String(get().invoices.length + 1).padStart(3, "0")}`,
            companyId: id,
            companyName: comp.companyName,
            type: invoiceType,
            amount: amount,
            date: new Date().toISOString().split("T")[0],
            status: "UNPAID",
          };
          set((state) => ({ invoices: [...state.invoices, newInvoice] }));
        }
      }

      const user = get().currentUser;
      get().addAuditLog(user?.email || "SYSTEM", user?.role || "ADMIN_DLH", `Mengubah status perusahaan ${comp.companyName} menjadi ${status}`);
      get().addNotification(
        "Pemberitahuan Status Registrasi",
        `Dokumen lingkungan ${comp.companyName} berstatus: ${status}`,
        status === "APPROVED" ? "SUCCESS" : (status === "REJECTED" || status === "SUSPENDED") ? "DANGER" : "WARNING"
      );
    }
  },

  createRetribusiInvoice: async (id) => {
    try {
      const response = await apiService.companies.createRetribusiInvoice(id);
      if (response && response.success) {
        const newInvoice: Invoice = response.invoice;
        set((state) => ({
          invoices: [...state.invoices.filter((i) => i.id !== newInvoice.id), {
            ...newInvoice,
            companyName: newInvoice.companyName || state.companies.find(c => c.id === newInvoice.companyId)?.companyName || "Unknown Company"
          }]
        }));
        toast.success("Invoice retribusi baru berhasil dibuat!");
        return;
      }
    } catch (e) {
      console.warn("Gagal membuat invoice retribusi via API, fallback offline.", e);
    }

    // --- FALLBACK OFFLINE ---
    const comp = get().companies.find((c) => c.id === id);
    if (comp) {
      const isUklUpl = comp.docType === "UKL-UPL" || comp.docType === "UKL_UPL";
      const invoiceType = isUklUpl ? "Retribusi UKL-UPL" : "Retribusi SPPL";
      const amount = isUklUpl ? 1500000 : 500000;

      const existingInvoice = get().invoices.find(
        (i) => i.companyId === id && i.type === invoiceType && i.status === "UNPAID"
      );

      if (!existingInvoice) {
        const newInvoice: Invoice = {
          id: `INV-${String(get().invoices.length + 1).padStart(3, "0")}`,
          companyId: id,
          companyName: comp.companyName,
          type: invoiceType,
          amount: amount,
          date: new Date().toISOString().split("T")[0],
          status: "UNPAID",
        };
        set((state) => ({ invoices: [...state.invoices, newInvoice] }));
        toast.success("Invoice retribusi baru berhasil dibuat (Offline)!");
      } else {
        toast.info("Invoice retribusi belum dibayar sudah tersedia.");
      }
    }
  },

  downloadCompanyCertificate: async (id, companyName) => {
    try {
      const blob = await apiService.companies.downloadCertificatePdf(id);
      
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Sertifikat_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      document.body.appendChild(link);
      
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to download certificate", e);
      toast.error("Gagal mengunduh sertifikat PDF dari server.");
      throw e;
    }
  },

  addManualAmdalCompany: async (payload) => {
    try {
      const response = await apiService.companies.createManualAmdal(payload);
      if (response && response.success) {
        const newComp: Company = response.company;
        set((state) => ({
          companies: [...state.companies, newComp]
        }));
        toast.success("Perusahaan wajib AMDAL berhasil didaftarkan secara manual!");
        
        const user = get().currentUser;
        get().addAuditLog(user?.email || "SYSTEM", user?.role || "ADMIN_DLH", `Mendaftarkan wajib AMDAL manual: ${payload.companyName}`);
        get().addNotification(
          "Registrasi AMDAL Manual",
          `Admin DLH telah mendaftarkan koordinat wajib AMDAL untuk ${payload.companyName} secara manual.`,
          "SUCCESS"
        );
        return;
      }
    } catch (e: any) {
      const serverMsg = e.response?.data?.error || e.response?.data?.message;
      if (serverMsg) {
        toast.error(`Gagal: ${serverMsg}`);
        throw e;
      }
      console.warn("Gagal mendaftarkan AMDAL via API, menggunakan fallback offline.", e);
    }

    // --- FALLBACK OFFLINE ---
    const newId = `COM-AMD-${String(get().companies.length + 1).padStart(3, "0")}`;
    const activeUntilDate = new Date();
    activeUntilDate.setFullYear(activeUntilDate.getFullYear() + 1);
    const certificateActiveUntil = activeUntilDate.toISOString().split('T')[0];

    const newCompany: Company = {
      id: newId,
      companyName: payload.companyName,
      nib: payload.nib,
      npwp: payload.npwp || "-",
      picName: "Admin DLH Manual",
      picPhone: "-",
      picRole: "Admin",
      investmentType: "PMDN",
      yearBuilt: String(new Date().getFullYear()),
      buildingArea: 0,
      operationalHours: "-",
      rawMaterials: "-",
      waterSource: "-",
      powerSource: "-",
      kbli: "00000",
      investment: 0,
      landArea: 0,
      employees: 0,
      lat: payload.lat,
      lng: payload.lng,
      address: payload.address,
      docType: "AMDAL",
      status: "APPROVED",
      certificateActiveUntil,
    };

    set((state) => ({
      companies: [...state.companies, newCompany]
    }));

    toast.success("Perusahaan wajib AMDAL disimpan (Simulasi Offline)!");
    const user = get().currentUser;
    get().addAuditLog(user?.email || "SYSTEM", user?.role || "ADMIN_DLH", `Mendaftarkan wajib AMDAL manual (Offline): ${payload.companyName}`);
    get().addNotification(
      "Registrasi AMDAL Manual (Offline)",
      `Admin DLH telah mendaftarkan koordinat wajib AMDAL untuk ${payload.companyName} secara manual (Offline).`,
      "SUCCESS"
    );
  },
});
