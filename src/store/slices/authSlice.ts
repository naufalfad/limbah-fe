import { StateCreator } from "zustand";
import { SijagaState, AuthSlice, User, UserRole } from "../types";
import { apiService } from "../../lib/api";
import { initialCompanies } from "../mockData";

export const getInitialAuthState = () => {
  try {
    const savedUser = localStorage.getItem("sijaga_user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      const companiesList = user.companies || [];
      return {
        currentUser: user as User,
        companies: companiesList.length > 0 ? companiesList : initialCompanies,
        selectedCompanyId: user.companyId || (companiesList.length > 0 ? companiesList[0].id : null),
      };
    }
  } catch (e) {
    console.error("Failed to parse saved sijaga_user from localStorage", e);
  }
  return {
    currentUser: null,
    companies: initialCompanies,
    selectedCompanyId: null,
    users: [],
  };
};

export const initialAuth = getInitialAuthState();

export const createAuthSlice: StateCreator<
  SijagaState,
  [],
  [],
  AuthSlice
> = (set, get) => ({
  currentUser: initialAuth.currentUser,
  companies: initialAuth.companies,
  selectedCompanyId: initialAuth.selectedCompanyId,
  users: initialAuth.users || [],

  setSelectedCompanyId: (id) => {
    set({ selectedCompanyId: id });
  },

  fetchUsers: async () => {
    try {
      const data = await apiService.admin.getAllUsers();
      if (data && data.success) {
        set({ users: data.users });
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  },

  updateUserRole: async (id, role) => {
    try {
      const data = await apiService.admin.updateUserRole(id, role);
      if (data && data.success) {
        set((state) => ({
          users: state.users.map(u => u.id === id ? { ...u, role: role as UserRole } : u)
        }));
      }
    } catch (error) {
      console.error("Failed to update user role:", error);
    }
  },

  login: async (email, password, role) => {
    try {
      const data = await apiService.auth.login(email, password, role);

      if (data && data.success) {
        const token = data.token;
        localStorage.setItem("sijaga_token", token);

        const apiUser = data.user;
        const apiCompanies = apiUser.companies || [];

        localStorage.setItem("sijaga_user", JSON.stringify(apiUser));

        set({
          currentUser: apiUser,
          companies: apiCompanies,
          selectedCompanyId: apiUser.companyId || (apiCompanies.length > 0 ? apiCompanies[0].id : null),
        });

        get().addAuditLog(apiUser.email, apiUser.role, "Melakukan login ke sistem (Autentikasi Terintegrasi).");

        return apiUser;
      }

      return null;
    } catch (error: any) {
      console.error("Login Failure:", error.response?.data?.message || error.message);
      throw error;
    }
  },

  logout: async () => {
    const user = get().currentUser;
    if (user) {
      try {
        await apiService.auth.logout();
      } catch (e) {
        console.warn("Logout API failed, continuing client logout.");
      }
      get().addAuditLog(user.email, user.role, "Melakukan logout dari sistem.");
    }

    localStorage.removeItem("sijaga_token");
    localStorage.removeItem("token");
    localStorage.removeItem("sijaga_user");
    set({ currentUser: null, selectedCompanyId: null });
  },
});
