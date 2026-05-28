import axios from "axios";

const API_URL = "http://localhost:5000";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Token to Authorization header if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sijaga_token") || localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const apiService = {
  auth: {
    login: async (email: string, password: string, role?: string) => {
      const response = await api.post("/api/auth/login", { email, password, role });
      return response.data;
    },
    register: async (payload: { name: string; email: string; role: string }) => {
      const response = await api.post("/api/auth/register", payload);
      return response.data;
    },
    logout: async () => {
      const response = await api.post("/api/auth/logout");
      return response.data;
    }
  },
  admin: {
    getTransporters: async () => {
      const response = await api.get("/api/admin/transporters");
      return response.data;
    },
    // Mengambil seluruh data user untuk Super Admin
    getAllUsers: async () => {
      const response = await api.get("/api/admin/users");
      return response.data;
    },
    // Mengubah hak akses / role dari user
    updateUserRole: async (id: string, role: string) => {
      const response = await api.patch(`/api/admin/users/${id}/role`, { role });
      return response.data;
    }
  },
  companies: {
    getAll: async () => {
      const response = await api.get("/api/companies");
      return response.data;
    },
    create: async (formData: FormData) => {
      // Send as multipart/form-data so Multer on the backend can parse uploaded files
      const response = await api.post("/api/companies", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    update: async (id: string, formData: FormData) => {
      const response = await api.put(`/api/companies/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    updateStatus: async (id: string, status: string) => {
      const response = await api.patch(`/api/companies/${id}/status`, { status });
      return response.data;
    },
    downloadCertificatePdf: async (id: string) => {
      const response = await api.get(`/api/companies/${id}/certificate/pdf`, {
        responseType: "blob"
      });
      return response.data;
    },
    createRetribusiInvoice: async (id: string) => {
      const response = await api.post(`/api/companies/${id}/retribusi-invoice`);
      return response.data;
    },
    createManualAmdal: async (payload: { companyName: string; nib: string; npwp?: string; lat: string; lng: string; address: string }) => {
      const response = await api.post("/api/companies/manual-amdal", payload);
      return response.data;
    }
  },
  waste: {
    getAll: async (companyId?: string) => {
      const response = await api.get("/api/waste", { params: companyId ? { companyId } : {} });
      return response.data;
    },
    create: async (payload: any) => {
      const response = await api.post("/api/waste", payload);
      return response.data;
    },
    verify: async (id: string, status: string) => {
      const response = await api.patch(`/api/waste/${id}/verify`, { status });
      return response.data;
    }
  },
  pickups: {
    getAll: async (companyId?: string) => {
      const response = await api.get("/api/pickups", { params: companyId ? { companyId } : {} });
      return response.data;
    },
    create: async (payload: any) => {
      const response = await api.post("/api/pickups", payload);
      return response.data;
    },
    setPrice: async (id: string, cost: number, driverName: string, plateNo: string) => {
      const response = await api.post(`/api/pickups/${id}/price`, { cost, driverName, plateNo });
      return response.data;
    },
    assignTransporter: async (id: string, transporterId: string, transporterName: string) => {
      const response = await api.patch(`/api/pickups/${id}/assign`, { transporterId, transporterName });
      return response.data;
    },
    updateStatus: async (id: string, status: string, payload?: any) => {
      const response = await api.patch(`/api/pickups/${id}/status`, { status, ...payload });
      return response.data;
    }
  },
  invoices: {
    getAll: async (companyId?: string) => {
      const response = await api.get("/api/invoices", { params: companyId ? { companyId } : {} });
      return response.data;
    },
    pay: async (id: string) => {
      const response = await api.post(`/api/invoices/${id}/pay`);
      return response.data;
    }
  },
  inspections: {
    getAll: async () => {
      const response = await api.get("/api/inspections");
      return response.data;
    },
    schedule: async (payload: any) => {
      const response = await api.post("/api/inspections", payload);
      return response.data;
    },
    submit: async (id: string, score: number, notes: string, checklist: any, photo?: string) => {
      const response = await api.post(`/api/inspections/${id}/submit`, { score, notes, checklist, photo });
      return response.data;
    }
  },
  notifications: {
    getAll: async () => {
      const response = await api.get("/api/notifications");
      return response.data;
    },
    read: async (id: string) => {
      const response = await api.patch(`/api/notifications/${id}/read`);
      return response.data;
    },
    readAll: async () => {
      const response = await api.post("/api/notifications/read");
      return response.data;
    },
    create: async (payload: { title: string, message: string, type: string }) => {
      const response = await api.post("/api/notifications", payload);
      return response.data;
    }
  },
  auditLogs: {
    getAll: async () => {
      const response = await api.get("/api/audit-logs");
      return response.data;
    },
    create: async (payload: { user: string, role: string, action: string }) => {
      const response = await api.post("/api/audit-logs", payload);
      return response.data;
    }
  },
  // BLOK BARU: Sistem pemanggil analitik eksekutif terpusat dari Backend
  analytics: {
    getExecutive: async () => {
      const response = await api.get("/api/analytics/executive");
      return response.data;
    },
    getPerformance: async () => {
      const response = await api.get("/api/analytics/performance");
      return response.data;
    }
  }
};