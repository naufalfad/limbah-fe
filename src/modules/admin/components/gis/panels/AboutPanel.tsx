// src/modules/admin/components/gis/panels/AboutPanel.tsx
import React from "react";
import {
    Info, Droplets, Wind, CloudSun, ShieldCheck,
    Gavel, Award, Factory, HelpCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AboutPanel() {
    return (
        <div className="flex flex-col h-full bg-white font-sans text-slate-700 pb-12 select-none text-left">

            {/* --- HEADER BRANDING (Secure Console Style) --- */}
            <div className="text-center py-5 bg-slate-900 border-b border-slate-850 text-white rounded-none shrink-0 font-sans">
                <ShieldCheck size={28} className="mx-auto text-emerald-400 animate-pulse" />
                <h4 className="text-[10px] font-black text-slate-100 uppercase tracking-[0.25em] mt-3 leading-none">
                    GEO LIMBAH GIS
                </h4>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-2 leading-none">
                    Sistem Pemetaan Kepatuhan Lingkungan v1.0
                </p>
            </div>

            {/* --- CONTENT AREA (Scrollable & High-Density) --- */}
            <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar flex-1 font-sans">

                {/* Pengantar Ringkas (Diubah ke Rata Kiri murni) */}
                <p className="text-[11px] font-semibold text-slate-500 leading-relaxed text-left">
                    Geo Limbah GIS beroperasi sebagai platform <strong>Digital Twin & Virtual Sensor (Sensor Virtual)</strong> [3]. Platform ini mensimulasikan dan menganalisis parameter fisik-kimia atmosfer serta hidrologi wilayah secara dinamis dengan mengintegrasikan data cuaca mikro dan beban pembuangan industri nyata tanpa menebak-nebak [1, 3].
                </p>

                {/* --- SEKSI 1: SUMBER DATA UTAMA (Left-Bordered Cohesive List) --- */}
                <div className="space-y-4 pt-2">
                    <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5 border-b pb-1.5 leading-none">
                        <Award size={13} className="text-emerald-600 shrink-0" /> 1. Sumber Data (Data Origin)
                    </h3>

                    <div className="space-y-4">
                        {/* Air */}
                        <div className="border-l-2 border-cyan-500 pl-3.5 py-1 space-y-1">
                            <h4 className="text-[10px] font-black text-slate-800 flex items-center gap-1.5 leading-none uppercase tracking-wide">
                                <Droplets size={12} className="text-cyan-500 shrink-0" /> Hidrologi & Air Sungai
                            </h4>
                            <p className="text-[10.5px] text-slate-500 leading-relaxed text-left">
                                Data dasar stasiun air dan parameter bulanan (*prior seasonal baseline*) bersumber murni dari <strong>UPT Laboratorium Lingkungan Dinas Lingkungan Hidup (DLH) Kabupaten Kotawaringin Timur</strong> dan dikalibrasi 1:1 berdasarkan riset hidrologi resmi Sungai Mentaya [3].
                            </p>
                        </div>

                        {/* Cuaca */}
                        <div className="border-l-2 border-amber-500 pl-3.5 py-1 space-y-1">
                            <h4 className="text-[10px] font-black text-slate-800 flex items-center gap-1.5 leading-none uppercase tracking-wide">
                                <CloudSun size={12} className="text-amber-500 shrink-0" /> Klimatologi & Cuaca Mikro
                            </h4>
                            <p className="text-[10.5px] text-slate-500 leading-relaxed text-left">
                                Parameter cuaca harian (suhu, kelembapan, kecepatan/arah angin, dan presipitasi) ditarik langsung secara asinkron dari stasiun meteorologi terdekat melalui <strong>API BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)</strong> di tingkat kelurahan (ADM4) [1, 3].
                            </p>
                        </div>

                        {/* Udara */}
                        <div className="border-l-2 border-teal-500 pl-3.5 py-1 space-y-1">
                            <h4 className="text-[10px] font-black text-slate-800 flex items-center gap-1.5 leading-none uppercase tracking-wide">
                                <Wind size={12} className="text-teal-500 shrink-0" /> Kualitas Udara (AQI)
                            </h4>
                            <p className="text-[10.5px] text-slate-500 leading-relaxed text-left">
                                Konsentrasi debu halus partikulat PM2.5 dan PM10 eksternal dikonsumsi secara real-time dari stasiun pemantauan terdekat melalui <strong>API IQAir (AirVisual)</strong> dengan algoritma *background caching* di server [3].
                            </p>
                        </div>

                        {/* Industri */}
                        <div className="border-l-2 border-slate-500 pl-3.5 py-1 space-y-1">
                            <h4 className="text-[10px] font-black text-slate-800 flex items-center gap-1.5 leading-none uppercase tracking-wide">
                                <Factory size={12} className="text-slate-500 shrink-0" /> Beban Polusi Sektoral
                            </h4>
                            <p className="text-[10.5px] text-slate-500 leading-relaxed text-left">
                                Beban pencemaran organik (BOD/COD) dihitung berdasarkan data real-time pembuangan limbah cair industri yang dilaporkan pelaku usaha melalui **Logbook Limbah internal (`WasteLog`)** dalam 3 hari terakhir [3].
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- SEKSI 2: STANDAR PERHITUNGAN BATAS AMAN (REGULATION STANDARDS) --- */}
                <div className="space-y-4 pt-2">
                    <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5 border-b pb-1.5 leading-none">
                        <Gavel size={13} className="text-emerald-600 shrink-0" /> 2. Standar Batas Aman & Regulasi
                    </h3>

                    <div className="space-y-4">
                        {/* Regulasi Air */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center leading-none">
                                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wide">Kepatuhan Air Sungai</h4>
                                <Badge className="bg-cyan-50 text-cyan-700 border-none rounded-none text-[8px] font-black px-1.5 py-0.5">PP 22/2021</Badge>
                            </div>
                            <p className="text-[10.5px] text-slate-500 leading-relaxed text-left">
                                Evaluasi kelayakan air sungai diverifikasi ketat mengacu pada **PP No. 22 Tahun 2021 Lampiran VI tentang Kriteria Mutu Air Sungai Kelas II** [3] dengan ambang batas parameter kaku:
                            </p>
                            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[9px] font-black text-slate-700">
                                <div className="bg-slate-50 p-2 border border-slate-200 rounded-none text-left">pH: 6.0 - 9.0</div>
                                <div className="bg-slate-50 p-2 border border-slate-200 rounded-none text-left">DO: &ge; 4.0 mg/L</div>
                                <div className="bg-slate-50 p-2 border border-slate-200 rounded-none text-left">BOD: &le; 3.0 mg/L</div>
                                <div className="bg-slate-50 p-2 border border-slate-200 rounded-none text-left">COD: &le; 25.0 mg/L</div>
                            </div>
                        </div>

                        {/* Regulasi Udara */}
                        <div className="space-y-2 pt-1">
                            <div className="flex justify-between items-center leading-none">
                                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wide">Kepatuhan Atmosfer</h4>
                                <Badge className="bg-teal-50 text-teal-700 border-none rounded-none text-[8px] font-black px-1.5 py-0.5">US EPA</Badge>
                            </div>
                            <p className="text-[10.5px] text-slate-500 leading-relaxed text-left">
                                Perhitungan indeks kualitas udara merujuk murni pada standar **US EPA (United States Environmental Protection Agency) Air Quality Index (AQI)** yang memetakan konsentrasi partikulat mikro PM2.5 [3]:
                            </p>
                            {/* Color Stops List (Strict Circle Shape to match map markers) */}
                            <div className="space-y-1.5 text-[9px] font-bold text-left text-slate-650">
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#10b981] inline-block shrink-0 border border-white shadow-sm" /> 0 - 50: Baik (Aman)</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#facc15] inline-block shrink-0 border border-white shadow-sm" /> 51 - 100: Sedang (Waspada kelompok rentan)</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#f97316] inline-block shrink-0 border border-white shadow-sm" /> 101 - 150: Tidak sehat untuk kelompok sensitif</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#ef4444] inline-block shrink-0 border border-white shadow-sm" /> 151 - 200: Tidak sehat (Gejala iritasi fisik)</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#9333ea] inline-block shrink-0 border border-white shadow-sm" /> 201 - 300: Sangat tidak sehat (Darurat polusi)</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#7e0023] inline-block shrink-0 border border-white shadow-sm" /> 300+: Berbahaya (Evakuasi / Masker Medis)</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- DISCLAIMER & SECURITY (Flat Banner) --- */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-none flex items-start gap-2.5 text-left text-emerald-950">
                    <HelpCircle className="text-emerald-600 shrink-0 mt-0.5" size={14} />
                    <div className="space-y-1">
                        <h5 className="text-[9px] font-black uppercase tracking-widest leading-none">Hak Cipta & Keamanan</h5>
                        <p className="text-[9px] font-semibold leading-normal text-emerald-700 text-left">
                            Seluruh simulasi hidrologi dilindungi oleh hak kepemilikan sistem Dinas Lingkungan Hidup. Setiap akses dan modifikasi parameter terekam di dalam log audit terenkripsi.
                        </p>
                    </div>
                </div>

            </div>

        </div>
    );
}