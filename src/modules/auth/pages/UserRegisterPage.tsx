import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, ArrowRight, Leaf, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";
// Import apiService dari folder lib
import { apiService } from "@/lib/api";

export default function UserRegisterPage() {
  const navigate = useNavigate();

  // State Form
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  // Handle Input Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validasi Client-side
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Silakan lengkapi seluruh kolom formulir.");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Kata sandi minimal harus 6 karakter.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);

    try {
      /**
       * 2. Hit API menggunakan apiService
       * Catatan: Backend registerSchema membutuhkan {name, email, password}.
       * apiService Anda memiliki payload {name, email, role}. 
       * Kita kirimkan semua field yang dibutuhkan backend melalui spread operator.
       */
      const response = await apiService.auth.register({
        name: formData.name,
        email: formData.email,
        role: "PERUSAHAAN", // Default role untuk registrasi mandiri
        ...({ password: formData.password } as any) // Memastikan password terkirim sesuai schema backend
      });

      if (response.success) {
        toast.success("Registrasi Berhasil!");
        // Arahkan ke login dan bawa email agar user tidak perlu ngetik ulang
        navigate("/login", {
          state: {
            email: formData.email,
            message: "Akun berhasil dibuat. Silakan masuk."
          }
        });
      }
    } catch (error: any) {
      // 3. Penanganan Error terpusat
      const serverResponse = error.response?.data;

      if (serverResponse?.errors) {
        // Handle error validasi Zod dari backend
        serverResponse.errors.forEach((err: any) => {
          toast.error(`${err.message}`);
        });
      } else if (serverResponse?.message) {
        // Handle error pesan spesifik (misal: "Email sudah terdaftar")
        toast.error(serverResponse.message);
      } else {
        toast.error("Gagal terhubung ke server. Periksa koneksi Anda.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/60 flex items-center justify-center p-6 relative overflow-hidden text-left font-sans">
      {/* Efek Latar Belakang */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-emerald-100 rounded-full blur-[120px] opacity-50 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-50 rounded-full blur-[120px] opacity-60 -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-5">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-semibold text-xs uppercase tracking-wider transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Kembali ke Beranda
        </button>

        <div className="border border-slate-200 shadow-sm bg-white p-8 md:p-10">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-none">
                <Leaf size={24} />
              </div>
              <h1 className="font-sans font-semibold text-xl tracking-tight text-slate-800">
                Geo <span className="text-emerald-600">Limbah</span>
              </h1>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">
                Registrasi Akun Pengguna Baru
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Field Nama */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Nama Lengkap PIC</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    name="name"
                    placeholder="Contoh: Budi Santoso"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-12 pl-11 rounded-none border-slate-200 bg-slate-50 focus-visible:ring-emerald-400 font-bold text-xs"
                  />
                </div>
              </div>

              {/* Field Email */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Alamat Email PIC</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    name="email"
                    type="email"
                    placeholder="nama@perusahaan.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-12 pl-11 rounded-none border-slate-200 bg-slate-50 focus-visible:ring-emerald-400 font-bold text-xs"
                  />
                </div>
              </div>

              {/* Field Password */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Kata Sandi</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    name="password"
                    type="password"
                    placeholder="Min. 6 karakter"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-12 pl-11 rounded-none border-slate-200 bg-slate-50 focus-visible:ring-emerald-400 font-bold text-xs"
                  />
                </div>
              </div>

              {/* Konfirmasi Password */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Konfirmasi Kata Sandi</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    name="confirmPassword"
                    type="password"
                    placeholder="Ulangi kata sandi"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-12 pl-11 rounded-none border-slate-200 bg-slate-50 focus-visible:ring-emerald-400 font-bold text-xs"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-slate-900 hover:bg-emerald-600 text-white rounded-none font-black text-xs uppercase tracking-widest transition-colors shadow-none mt-2 outline-none border-none cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    MEMPROSES...
                  </>
                ) : (
                  <>
                    DAFTAR SEKARANG <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500">Sudah memiliki akun? </span>
              <a href="/login" className="text-xs text-emerald-600 hover:underline font-bold transition-colors">
                Masuk di Sini
              </a>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 leading-relaxed">
          Dengan mendaftar, Anda menyetujui{" "}
          <span className="text-emerald-600 font-semibold cursor-pointer hover:underline">
            Syarat &amp; Ketentuan
          </span>{" "}
          Geo Limbah.
        </p>
      </div>
    </div>
  );
}