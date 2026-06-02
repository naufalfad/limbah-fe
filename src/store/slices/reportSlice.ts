// src/store/slices/reportSlice.ts
import { StateCreator } from 'zustand';
import { api } from '../../lib/api'; // ARSITEKTUR TERPADU: Menggunakan instance terpusat pembawa JWT Interceptor
import { toast } from 'sonner';
import { SijagaState, ReportSlice } from '../types';

// Rute relatif yang bersih dari hardcoded host (Protected Variations)
const REPORT_API_URL = '/api/reports';

export const createReportSlice: StateCreator<
    SijagaState,
    [],
    [],
    ReportSlice
> = (set, get) => ({
    // --- STATE ---
    publicReportTrackData: null,
    adminReports: [],
    isReportLoading: false,

    // --- ACTIONS (PUBLIC) ---

    // Menggunakan FormData untuk memfasilitasi transfer biner multi-upload foto
    submitCitizenReport: async (payload: FormData) => {
        try {
            set({ isReportLoading: true });

            // Menggunakan instance 'api' agar adaptif terhadap perubahan host server
            const response = await api.post(`${REPORT_API_URL}/public/submit`, payload, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Browser otomatis menyusun boundary biner secara presisi
                },
            });

            return { success: true, trackingId: response.data.data.trackingId };
        } catch (error: any) {
            console.error('Error submitting report:', error);
            // Penanganan error adaktif membaca pesan kegagalan dari kontroler backend
            toast.error(error.response?.data?.message || 'Gagal mengirim laporan');
            return { success: false };
        } finally {
            set({ isReportLoading: false });
        }
    },

    trackCitizenReport: async (trackingId: string) => {
        try {
            set({ isReportLoading: true, publicReportTrackData: null });

            const response = await api.get(`${REPORT_API_URL}/public/track/${trackingId}`);

            set({ publicReportTrackData: response.data.data });
            return response.data.data;
        } catch (error: any) {
            console.error('Error tracking report:', error);
            toast.error(error.response?.data?.message || 'Laporan tidak ditemukan');
            return null;
        } finally {
            set({ isReportLoading: false });
        }
    },

    clearPublicReportData: () => {
        set({ publicReportTrackData: null });
    },

    // --- ACTIONS (PROTECTED ADMIN - ARSIP PENGADUAN STATIS) ---

    fetchAdminReports: async (status?: string) => {
        try {
            set({ isReportLoading: true });

            // Otomatis membawa header 'Authorization: Bearer <token>' berkat interceptor pada instance 'api'
            const response = await api.get(`${REPORT_API_URL}/admin?status=${status || ''}`);

            set({ adminReports: response.data.data });
        } catch (error: any) {
            console.error('Error fetching admin reports:', error);
            toast.error('Gagal mengambil data pengaduan masyarakat');
        } finally {
            set({ isReportLoading: false });
        }
    }
});