import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, Leaf, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSijagaStore, UserRole } from "@/store/useSijagaStore";
import { apiService } from "@/lib/api";
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden text-left font-sans">

      {/* Visual Ambience - Glassmorphism effects */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />

      <div className="max-w-6xl w-full grid lg:grid-cols-12 gap-12 items-center relative z-10">

        {/* SISI KIRI: Brand Identity */}
        <div className="lg:col-span-6 space-y-8 text-white">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20">
              <Leaf size={28} />
            </div>
            <span className="text-3xl font-black italic tracking-tighter">
              PANTAU <span className="text-emerald-500">LIMBAH</span>
            </span>
          </div>

          <div className="space-y-4">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-none px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px]">
              Sistem Terintegrasi v1.0
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">
              Pusat Pengawasan Dampak Lingkungan
            </h1>
            <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-lg">
              Solusi satu pintu untuk pelaporan limbah industri, pemantauan kepatuhan daerah,
              dan digitalisasi administrasi lingkungan hidup secara akuntabel.
            </p>
          </div>

          <div className="pt-6 border-t border-slate-800">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700" />
                ))}
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dipercaya oleh 1,200+ Pelaku Usaha</p>
            </div>
          </div>
        </div>

        {/* SISI KANAN: Login Form */}
        <div className="lg:col-span-6">
          <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] p-8 md:p-12">
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Selamat Datang.</h2>
                <p className="text-slate-400 text-xs font-bold uppercase mt-3 tracking-widest">Masuk untuk melanjutkan ke dashboard</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">


                {/* Field Email */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Alamat Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                      type="email"
                      placeholder="Masukkan email terdaftar"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                      className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:ring-emerald-500 font-medium transition-all"
                    />
                  </div>
                </div>

                {/* Field Password */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Kata Sandi</label>
                    <button type="button" className="text-[10px] font-black text-emerald-600 uppercase hover:underline">Lupa Sandi?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                      type="password"
                      placeholder="Masukkan kata sandi Anda"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                      className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:ring-emerald-500 font-medium transition-all"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 active:scale-95"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={24} />
                      OTENTIKASI...
                    </>
                  ) : (
                    <>
                      MASUK SEKARANG <ArrowRight size={20} />
                    </>
                  )}
                </Button>
              </form>

              {/* Bottom Call to Action */}
              <div className="text-center pt-4 border-t border-slate-50">
                <p className="text-sm font-medium text-slate-400">
                  Baru di PANTAU LIMBAH?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="text-emerald-600 hover:underline font-black"
                  >
                    Daftar Akun Perusahaan
                  </button>
                </p>
              </div>
            </div>
          </Card>

          {/* Compliance & Security Footer Note */}
          <div className="mt-8 flex items-center justify-center gap-6 opacity-40">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-slate-500" />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">SSL Encrypted</span>
            </div>
            <div className="w-1 h-1 bg-slate-500 rounded-full" />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">ISO 27001 Compliant</span>
          </div>
        </div>

      </div>
    </div>
  );
}