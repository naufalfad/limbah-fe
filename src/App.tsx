// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

// Landing & Registration
import LandingPage from "./modules/landing/LandingPage";
import RegistrationPage from "./modules/companies/pages/RegistrationPage";

// PUBLIC CITIZEN PAGES (INJEKSI BARU: Migrasi dari Modals ke Halaman Dedikatif)
import ReportPage from "./modules/landing/pages/ReportPage";
import TrackPage from "./modules/landing/pages/TrackPage";

// Auth
import LoginPage from "./modules/auth/pages/LoginPage";
import UserRegisterPage from "./modules/auth/pages/UserRegisterPage";

// Admin DLH
import AdminDashboard from "./modules/admin/AdminDashboard";
import RegistrationList from "./modules/admin/RegistrationList";
import WasteMonitoring from "./modules/admin/WasteMonitoring";
import GISMonitoring from "./modules/admin/GISMonitoring";
import TransactionManagement from "./modules/admin/TransactionManagement";
import InspectionManagement from "./modules/admin/InspectionManagement";
import AdminPickupManagement from "./modules/admin/AdminPickupManagement";
import CompanyManagement from "./modules/admin/CompanyManagement";
import CitizenReportManagement from "./modules/admin/CitizenReportManagement"; // INJEKSI BARU: Komponen triage pengaduan warga [3]
import AddAmdalPage from "./modules/admin/pages/AddAmdalPage";

// Perusahaan
import CompanyDashboard from "./modules/companies/pages/CompanyDashboard";
import WasteLogbookPage from "./modules/companies/pages/WasteLogbookPage";
import PickupRequestPage from "./modules/companies/pages/PickupRequestPage";
import DigitalPaymentPage from "./modules/companies/pages/DigitalPaymentPage";
import DocumentStatusPage from "./modules/companies/pages/DocumentStatusPage";

// Transporter
import TransporterDashboard from "./modules/transport/pages/TransporterDashboard";
import TransporterTracking from "./modules/transport/pages/TransporterTracking";

// Petugas Lapangan (Officer)
import OfficerInspectionsPage from "./modules/inspections/pages/OfficerInspectionsPage";
import OfficerGISPage from "./modules/inspections/pages/OfficerGISPage";

// Auditor / Pimpinan
import AuditorDashboardPage from "./modules/dashboard/pages/AuditorDashboardPage";
import AuditorGISPage from "./modules/dashboard/pages/AuditorGISPage"; // Impor Command Center Spasial Pimpinan

// Super Admin
import SuperAdminPage from "./modules/admin/pages/SuperAdminPage";

function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors />

      <Routes>
        {/* ==========================================
            Public & Auth Routes (Gerbang Terbuka)
           ========================================== */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<UserRegisterPage />} />

        {/* RUTE DEDIKATIF PENGADUAN WARGA (GRASP: Protected Variations) */}
        <Route path="/lapor" element={<ReportPage />} />
        <Route path="/lacak" element={<TrackPage />} />
        <Route path="/lacak/:trackingId" element={<TrackPage />} />

        {/* ==========================================
            Admin DLH Routes (Terproteksi)
           ========================================== */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/reports" element={<CitizenReportManagement />} /> {/* INJEKSI BARU: Rute halaman Triage Pengaduan [3] */}
        <Route path="/admin/registrations" element={<RegistrationList />} />
        <Route path="/admin/companies" element={<CompanyManagement />} />
        <Route path="/admin/companies/add-amdal" element={<AddAmdalPage />} />
        <Route path="/admin/waste" element={<WasteMonitoring />} />
        <Route path="/admin/gis" element={<GISMonitoring />} />
        <Route path="/admin/payments" element={<TransactionManagement />} />
        <Route path="/admin/pickups" element={<AdminPickupManagement />} />
        <Route path="/admin/inspections" element={<InspectionManagement />} />

        {/* ==========================================
            Perusahaan Routes (Terproteksi)
           ========================================== */}
        <Route path="/company" element={<CompanyDashboard />} />
        <Route path="/company/register" element={<RegistrationPage />} />
        <Route path="/company/logbook" element={<WasteLogbookPage />} />
        <Route path="/company/pickup" element={<PickupRequestPage />} />
        <Route path="/company/payments" element={<DigitalPaymentPage />} />
        <Route path="/company/documents" element={<DocumentStatusPage />} />

        {/* ==========================================
            Transporter Routes (Terproteksi)
           ========================================== */}
        <Route path="/transporter" element={<TransporterDashboard />} />
        <Route path="/transporter/tracking" element={<TransporterTracking />} />

        {/* ==========================================
            Petugas Lapangan (Officer) Routes
           ========================================== */}
        <Route path="/officer/inspections" element={<OfficerInspectionsPage />} />
        <Route path="/officer/gis" element={<OfficerGISPage />} />

        {/* ==========================================
            Auditor / Pimpinan Routes (Terproteksi)
           ========================================== */}
        <Route path="/auditor" element={<AuditorDashboardPage />} />
        {/* SOLUSI DECOUPLING: Mengubah rute menjadi /auditor-gis agar terpisah mutlak dari parameter dinamis /auditor/:tab */}
        <Route path="/auditor-gis" element={<AuditorGISPage />} />
        <Route path="/auditor/:tab" element={<AuditorDashboardPage />} />

        {/* ==========================================
            Super Admin Routes (Terproteksi)
           ========================================== */}
        <Route path="/super-admin" element={<SuperAdminPage />} />
        <Route path="/super-admin/:tab" element={<SuperAdminPage />} />

        {/* ==========================================
            404 Route (Fail-Safe)
           ========================================== */}
        <Route
          path="*"
          element={
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white text-left">
              <h1 className="text-6xl font-black italic tracking-tighter text-emerald-500">404</h1>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">Halaman Tidak Ditemukan</p>
              <a href="/" className="mt-6 bg-emerald-600 hover:bg-emerald-700 font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md">
                Kembali ke Beranda
              </a>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;