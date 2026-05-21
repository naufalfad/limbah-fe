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
    login: async (email: string, password: string) => {
      const response = await api.post("/api/auth/login", { email, password });
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
  companies: {
    getAll: async () => {
      const response = await api.get("/api/companies");
      return response.data;
    },
    create: async (payload: any) => {
      const response = await api.post("/api/companies", payload);
      return response.data;
    },
    updateStatus: async (id: string, status: string) => {
      const response = await api.patch(`/api/companies/${id}/status`, { status });
      return response.data;
    }
  },
  waste: {
    getAll: async () => {
      const response = await api.get("/api/waste");
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
    getAll: async () => {
      const response = await api.get("/api/pickups");
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
    updateStatus: async (id: string, status: string, evidencePhoto?: string) => {
      const response = await api.patch(`/api/pickups/${id}/status`, { status, evidencePhoto });
      return response.data;
    }
  },
  invoices: {
    getAll: async () => {
      const response = await api.get("/api/invoices");
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
    submit: async (id: string, score: number, notes: string, checklist: any) => {
      const response = await api.post(`/api/inspections/${id}/submit`, { score, notes, checklist });
      return response.data;
    }
  },
  notifications: {
    getAll: async () => {
      const response = await api.get("/api/notifications");
      return response.data;
    },
    readAll: async () => {
      const response = await api.post("/api/notifications/read");
      return response.data;
    }
  },
  auditLogs: {
    getAll: async () => {
      const response = await api.get("/api/audit-logs");
      return response.data;
    }
  }
};
