import React from 'react';
import {
  ShieldCheck, Leaf, BarChart3, MapPin,
  ArrowRight, CheckCircle, Building2,
  Zap, Globe, ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">

      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Leaf size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter italic text-slate-800">
              SIJAGA <span className="text-emerald-600">LINGKUNGAN</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-slate-500">
            <a href="#features" className="hover:text-emerald-600 transition-colors">Fitur</a>
            <a href="#prosedur" className="hover:text-emerald-600 transition-colors">Prosedur</a>
            <a href="#statistik" className="hover:text-emerald-600 transition-colors">Data</a>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => window.location.href = '/login'} variant="ghost" className="font-bold text-slate-600">MASUK</Button>
            <Button
              onClick={() => window.location.href = '/register'}
              className="bg-slate-900 hover:bg-emerald-700 text-white px-6 rounded-full font-bold shadow-xl shadow-slate-200 transition-all hover:scale-105"
            >
              DAFTAR SEKARANG
            </Button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8 text-left"
          >
            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 px-4 py-1 rounded-full font-bold uppercase tracking-[0.2em] text-[10px]">
              Platform Pengawasan Lingkungan Digital
            </Badge>
            <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.95]">
              Membangun Ekosistem <br />
              <span className="text-emerald-600 italic">Smart Environment.</span>
            </h1>
            <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl">
              Satu pintu untuk registrasi SPPL, UKL-UPL, pelaporan limbah rutin, hingga monitoring GIS untuk mewujudkan kepatuhan lingkungan hidup daerah yang akuntabel.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={() => window.location.href = '/register'}
                className="h-16 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg group transition-all shadow-2xl shadow-emerald-200"
              >
                MULAI REGISTRASI <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                      <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-slate-800 leading-none">1,200+</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Perusahaan Terdaftar</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-emerald-400/20 blur-[120px] rounded-full" />
            <div className="relative bg-white border border-slate-200 rounded-[3rem] p-4 shadow-2xl overflow-hidden shadow-emerald-100/50">
              <div className="bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 aspect-video flex items-center justify-center">
                <BarChart3 className="text-emerald-200" size={120} />
                <div className="absolute top-10 right-10 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 animate-pulse cursor-pointer">
                  <ShieldCheck className="text-emerald-600" size={32} />
                </div>
                <div className="absolute bottom-10 left-10 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 animate-pulse">
                  <MapPin className="text-orange-500" size={32} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-4xl font-black tracking-tight text-slate-900">Solusi Digital SIJAGA</h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium text-lg">
              Fitur lengkap yang dirancang khusus untuk memudahkan pelaku usaha dan pengawasan DLH.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="text-yellow-500" />}
              title="Smart Assessment"
              desc="Penentuan otomatis kategori SPPL atau UKL-UPL berdasarkan modal dan luas lahan usaha secara instan."
            />
            <FeatureCard
              icon={<Globe className="text-emerald-500" />}
              title="GIS Monitoring"
              desc="Pemetaan zonasi industri dan titik produksi limbah secara realtime berbasis peta digital (Geospasial)."
            />
            <FeatureCard
              icon={<BarChart3 className="text-blue-500" />}
              title="Early Warning"
              desc="Sistem peringatan dini otomatis jika volume limbah melebihi ambang batas atau dokumen kadaluarsa."
            />
          </div>
        </div>
      </section>

      {/* --- PROSEDUR SECTION --- */}
      <section id="prosedur" className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="h-64 bg-slate-100 rounded-3xl" />
                  <div className="h-40 bg-emerald-600 rounded-3xl" />
                </div>
                <div className="space-y-4 pt-12">
                  <div className="h-40 bg-slate-800 rounded-3xl" />
                  <div className="h-64 bg-slate-100 rounded-3xl" />
                </div>
              </div>
            </div>
            <div className="space-y-10 text-left">
              <h2 className="text-5xl font-black tracking-tighter text-slate-900 leading-none">
                Satu Aplikasi, <br />
                <span className="text-emerald-600">Semua Urusan Lingkungan.</span>
              </h2>
              <div className="space-y-6">
                <StepItem num="01" title="Registrasi Digital" desc="Input data NIB dan identitas penanggung jawab usaha." />
                <StepItem num="02" title="Assessment Otomatis" desc="Sistem menentukan kewajiban dokumen lingkungan Anda." />
                <StepItem num="03" title="Reporting & Monitoring" desc="Lakukan pelaporan limbah harian/bulanan melalui dashboard." />
              </div>
              <Button
                onClick={() => window.location.href = '/register'}
                className="bg-slate-900 text-white h-14 px-8 rounded-xl font-bold group"
              >
                Daftarkan Usaha Sekarang <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-white py-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 border-b border-slate-800 pb-12">
          <div className="col-span-2 space-y-6 text-left">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Leaf size={18} />
              </div>
              <span className="text-2xl font-black italic tracking-tighter">SIJAGA</span>
            </div>
            <p className="text-slate-400 max-w-sm font-medium leading-relaxed">
              Platform pusat data pengawasan dan pelaporan lingkungan hidup digital. Berkomitmen menjaga kelestarian bumi melalui inovasi teknologi.
            </p>
          </div>
          <div className="text-left space-y-4">
            <h4 className="font-black uppercase tracking-widest text-xs text-emerald-500">Tautan Cepat</h4>
            <ul className="space-y-2 text-sm text-slate-300 font-bold">
              <li><a href="#" className="hover:text-white transition-colors">Panduan Registrasi</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Daftar KBLI Risko</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Peta Sebaran Limbah</a></li>
            </ul>
          </div>
          <div className="text-left space-y-4">
            <h4 className="font-black uppercase tracking-widest text-xs text-emerald-500">Kontak DLH</h4>
            <ul className="space-y-2 text-sm text-slate-300 font-bold">
              <li className="flex items-center gap-2 underline">support@sijaga-lingkungan.id</li>
              <li className="flex items-center gap-2">Humas DLH Kabupaten/Kota</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 flex flex-col md:row justify-between items-center gap-4">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
            © 2026 SIJAGA LINGKUNGAN — DINAS LINGKUNGAN HIDUP DAERAH. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <motion.div
      whileHover={{ y: -10 }}
      className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-emerald-100 transition-all text-left space-y-6 group"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center scale-110 group-hover:scale-125 transition-transform duration-500">
        {React.cloneElement(icon, { size: 32 })}
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-black text-slate-800">{title}</h3>
        <p className="text-slate-500 text-sm font-medium leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

function StepItem({ num, title, desc }: { num: string, title: string, desc: string }) {
  return (
    <div className="flex gap-6 items-start group">
      <div className="text-4xl font-black text-emerald-100 group-hover:text-emerald-500 transition-colors duration-500 italic tracking-tighter">
        {num}
      </div>
      <div className="space-y-1">
        <h4 className="font-black text-slate-800 tracking-tight">{title}</h4>
        <p className="text-sm text-slate-400 font-medium">{desc}</p>
      </div>
    </div>
  );
}