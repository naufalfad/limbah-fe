// src/modules/auth/pages/LoginPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, Leaf, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSijagaStore, UserRole } from "@/store/useSijagaStore";
import { toast } from "sonner";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginStore = useSijagaStore(state => state.login);

  // State Form Utama
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Efek untuk menangkap email jika user diarahkan dari halaman Register
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location]);

  /**
   * Navigasi Presisi Berdasarkan Role
   * Memastikan user mendarat di dashboard yang sesuai dengan otoritasnya di DB.
   */
  const handleRoleRedirection = (role: UserRole) => {
    const routes: Record<string, string> = {
      SUPER_ADMIN: "/super-admin",
      ADMIN_DLH: "/admin",
      PETUGAS_LAPANGAN: "/officer/inspections",
      PERUSAHAAN: "/company",
      PENGANGKUT: "/transporter",
      AUDITOR: "/auditor",
    };
    navigate(routes[role] || "/");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi Sederhana sebelum hit API
    if (!email || !password) {
      toast.error("Silakan masukkan email dan kata sandi Anda.");
      return;
    }

    setLoading(true);
    try {
      /**
       * Eksekusi Login ke Zustand Store
       * Store akan otomatis memanggil API, menyimpan token ke localStorage,
       * memperbarui currentUser, dan mengembalikan user terotentikasi.
       */
      const user = await loginStore(email, password);

      if (user) {
        toast.success(`Berhasil masuk sebagai ${user.name}`);
        // Routing Otomatis sesuai Otoritas Database
        handleRoleRedirection(user.role);
      } else {
        toast.error("Kredensial tidak valid.");
      }
    } catch (error: any) {
      // Penanganan error spesifik dari backend (Controller Auth)
      const serverMsg = error.response?.data?.message || "Kredensial tidak valid.";
      toast.error(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row relative overflow-hidden font-sans">

      {/* =====================================================================
          SISI KIRI: PANEL EDITORIAL JENAMA (HANYA MUNCUL DI DESKTOP - LG)
          - Gambar full-bleed dengan overlay gradien kokoh
          - Menampilkan identitas, jargon, dan enkripsi legalitas
      ====================================================================== */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 text-white p-16 flex-col justify-between overflow-hidden z-10 select-none">

        {/* Gambar Latar Belakang Lingkungan Hidup Kabupaten Bogor */}
        <div
          className="absolute inset-0 bg-cover bg-center z-0 scale-105 filter saturate-75"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=2000&q=80')` }}
        />
        {/* Lapisan Wash Gradien Gelap Premium */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-950/80 to-emerald-950/85 z-10" />

        {/* Logo Brand */}
        <div className="flex items-center gap-2.5 relative z-20 text-left">
          <div className="w-12 h-12 flex items-center justify-center shrink-0">
            <img src="/kotim-logo.png" alt="Logo Kotim" className="w-12 h-12 object-contain" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase italic text-white leading-none">
            GEO <span className="text-emerald-400 font-black">PEDAL</span>
          </span>
        </div>

        {/* Jargon & Deskripsi */}
        <div className="space-y-4 max-w-md text-left relative z-20">
          <span className="uppercase tracking-[0.25em] text-[8px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 w-max block">
            INTEGRATED MONITORING CONSOLE
          </span>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-none uppercase">
            Pusat Pengawasan <br />
            Dampak Lingkungan.
          </h1>
          <p className="text-xs font-semibold leading-relaxed text-slate-300">
            Solusi digital terintegrasi untuk perizinan SPPL/UKL-UPL, pelaporan logbook limbah berkala, pengawasan geospasial (GIS), dan audit kepatuhan industri daerah secara akuntabel.
          </p>
        </div>

        {/* Footer Otoritas */}
        <div className="flex items-center gap-2 text-[9px] font-black tracking-widest text-slate-400 uppercase leading-none relative z-20 text-left">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Sistem Enkripsi Tingkat Otoritas DLH</span>
        </div>

      </div>

      {/* =====================================================================
          SISI KANAN: KONSOL TERMINAL MASUK (ALABASTER WHITE)
          - Menghilangkan tumpukan kartu (No nested box-in-a-box)
          - Form input siku kaku flat yang kompak, padat, dan rapi
      ====================================================================== */}
      <div className="flex-1 bg-white p-6 sm:p-8 md:p-16 flex flex-col justify-center items-center z-10 relative h-full">

        <div className="w-full max-w-sm space-y-6 sm:space-y-8">

          {/* Logo Brand Alternatif (Hanya muncul di Mobile/Tablet sebagai pengganti sidebar kiri) */}
          <div className="lg:hidden flex items-center gap-2.5 text-left select-none pt-4 sm:pt-0">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <img src="/kotim-logo.png" alt="Logo Kotim" className="w-12 h-12 object-contain" />
            </div>
            <span className="text-lg font-black tracking-tighter uppercase italic text-slate-800 leading-none">
              GEO <span className="text-emerald-600">PEDAL</span>
            </span>
          </div>

          {/* Header Title (Natural Sentence Case) */}
          <div className="space-y-1.5 text-left select-none">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Selamat Datang</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">
              Masuk sistem untuk melanjutkan ke dashboard
            </p>
          </div>

          {/* Form Utama */}
          <form onSubmit={handleLogin} className="space-y-5 text-left">

            {/* Field Email */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 shrink-0" size={14} />
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="h-11 pl-10 rounded-none border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            {/* Field Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center leading-none">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  className="text-[9px] font-black text-emerald-600 uppercase tracking-wider hover:underline outline-none"
                >
                  Lupa Sandi?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 shrink-0" size={14} />
                <Input
                  type="password"
                  placeholder="Masukkan kata sandi Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="h-11 pl-10 rounded-none border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            {/* Submit Action (Flat Solid Primary Button) */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-slate-900 hover:bg-emerald-600 text-white rounded-none font-black text-xs uppercase tracking-widest transition-colors shadow-none mt-2 outline-none border-none cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin shrink-0" size={14} />
                  OTENTIKASI DATA...
                </>
              ) : (
                <>
                  MASUK SEKARANG <ArrowRight size={14} />
                </>
              )}
            </Button>

          </form>

          {/* Register Call to Action */}
          <div className="text-left pt-5 border-t border-slate-100 font-sans text-xs">
            <span className="text-slate-400 font-semibold">Baru di GEO PEDAL? </span>
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-emerald-600 hover:underline font-black transition-colors outline-none"
            >
              Daftar Akun Perusahaan
            </button>
          </div>

          {/* Compliance & Security Footer Note */}
          <div className="pt-4 flex items-center justify-start gap-4 opacity-40 select-none">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-slate-500" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">SSL Encrypted</span>
            </div>
            <div className="w-1 h-1 bg-slate-400 rounded-full" />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">ISO 27001 Compliant</span>
          </div>

        </div>

      </div>

    </div>
  );
}