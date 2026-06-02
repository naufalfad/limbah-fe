// src/modules/admin/components/gis/panels/TaskDetailPanel.tsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSijagaStore } from "@/store/useSijagaStore";
import { useGisUIStore } from "@/store/useGisUIStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    AlertTriangle, ClipboardList, MapPin, Calendar,
    Camera, FileText, ArrowRight, CheckCircle2, User,
    Target
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// FASE 4 INJEKSI: Mengimpor fungsi otak analitik Turf.js dan data batas desa
import { getAffectedVillages } from "@/lib/spatialAnalytics";
import desaData from "@/assets/geojson/kotim-desa.json";

interface TaskDetailPanelProps {
    taskData: any; // Menerima payload Polimorfik (Bisa Inspection, bisa CitizenReport)
}

const BACKEND_URL = "http://localhost:5000";

export default function TaskDetailPanel({ taskData }: TaskDetailPanelProps) {
    const navigate = useNavigate();
    const { currentUser, inspections, adminReports } = useSijagaStore();

    // FASE 4 INJEKSI: Memanggil state pengontrol cincin radius bencana
    const { showImpactRadius, setShowImpactRadius } = useGisUIStore();

    if (!taskData) return null;

    // 1. DETEKSI POLIMORFISME PAYLOAD (Information Expert)
    const isReportPayload = !!taskData.trackingId;

    // 2. CROSS-REFERENCE DATA (Menyatukan Surat Tugas & Laporan Warga)
    const reportObj = isReportPayload
        ? taskData
        : adminReports.find(r => r.inspectionId === taskData.id || (taskData.citizenReport && r.id === taskData.citizenReport.id));

    const inspectionObj = !isReportPayload
        ? taskData
        : inspections.find(i => i.id === taskData.inspectionId);

    // 3. PARSER FOTO BUKTI WARGA (Aman & Tahan Banting)
    const photoList = useMemo(() => {
        if (!reportObj?.evidencePhoto) return [];
        try {
            const parsed = JSON.parse(reportObj.evidencePhoto);
            return Array.isArray(parsed) ? parsed : [reportObj.evidencePhoto];
        } catch (e) {
            return [reportObj.evidencePhoto];
        }
    }, [reportObj]);

    // 4. MENGHITUNG DESA TERDAMPAK (Turf.js Spatial Analytics)
    const affectedVillages = useMemo(() => {
        if (!showImpactRadius) return [];

        let lat = NaN, lng = NaN;

        // Ekstrak koordinat yang presisi
        if (reportObj && reportObj.lat && reportObj.lng) {
            lat = parseFloat(reportObj.lat);
            lng = parseFloat(reportObj.lng);
        } else if (inspectionObj && inspectionObj.location.includes(",")) {
            const coords = inspectionObj.location.split(",");
            lat = parseFloat(coords[0]);
            lng = parseFloat(coords[1]);
        }

        if (!isNaN(lat) && !isNaN(lng)) {
            // Memanggil Turf.js: Cari desa yang tertabrak radius 5 KM
            return getAffectedVillages(lat, lng, 5, desaData);
        }

        return [];
    }, [showImpactRadius, reportObj, inspectionObj]);

    // 5. ACTION HANDLER (Role-Based Navigation & Safe Routing)
    const handleActionClick = () => {
        if (currentUser?.role === "PETUGAS_LAPANGAN") {
            if (inspectionObj && inspectionObj.status !== "Selesai") {
                toast.success("Menyiapkan dokumen BAP Lapangan...");
                navigate("/officer/inspections", { state: { preSelectedInspectionId: inspectionObj.id } });
            } else if (inspectionObj && inspectionObj.status === "Selesai") {
                toast.info("Tugas ini sudah diselesaikan.");
            } else {
                toast.error("Surat Tugas belum diterbitkan oleh Admin DLH.");
            }
        } else {
            navigate("/admin/reports");
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-white relative font-sans">
            <div className="flex-1 overflow-y-auto custom-scrollbar text-left pb-6">

                {/* --- SEKSI 1: HEADER KONTEKS (GFW TACTICAL) --- */}
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                        {reportObj ? (
                            <Badge className="bg-rose-50 text-rose-700 border border-rose-200 rounded-none text-[8px] font-black uppercase tracking-widest px-2 shadow-none">
                                Investigasi Aduan
                            </Badge>
                        ) : (
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-none text-[8px] font-black uppercase tracking-widest px-2 shadow-none">
                                Audit Rutin DLH
                            </Badge>
                        )}
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            {inspectionObj?.id || reportObj?.trackingId}
                        </span>
                    </div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight leading-none uppercase">
                        {inspectionObj && inspectionObj.companyId !== "COM-UNKNOWN"
                            ? inspectionObj.companyName
                            : reportObj?.incidentType || "Penyelidikan Lapangan"}
                    </h2>
                </div>

                {/* --- SEKSI 2: INFORMASI SURAT TUGAS --- */}
                {inspectionObj && (
                    <div className="p-5 border-b border-slate-100 space-y-3.5">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                            <ClipboardList size={12} className="text-emerald-600" /> Detail Penugasan
                        </h3>
                        <div className="space-y-2">
                            <div className="flex items-start gap-2.5">
                                <Calendar size={12} className="text-slate-400 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Rencana Pelaksanaan</p>
                                    <p className="text-xs font-bold text-slate-800 leading-none">{inspectionObj.date}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <User size={12} className="text-slate-400 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Petugas Pelaksana</p>
                                    <p className="text-xs font-bold text-slate-800 leading-none">{inspectionObj.inspectorName}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Titik Sasaran</p>
                                    <p className="text-xs font-semibold text-slate-600 leading-snug">
                                        {inspectionObj.companyId === "COM-UNKNOWN" ? "Penyelidikan Lokasi (Pelaku Belum Diketahui)" : inspectionObj.location}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- SEKSI 3: KRONOLOGI PENGADUAN WARGA --- */}
                {reportObj && (
                    <div className="p-5 space-y-4">
                        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-none flex items-start gap-2.5">
                            <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={14} />
                            <div className="space-y-1">
                                <h4 className="text-[9px] font-black text-rose-900 uppercase tracking-widest leading-none">Laporan Masyarakat</h4>
                                <p className="text-[10px] font-semibold text-rose-700 leading-normal italic text-justify">
                                    "{reportObj.description}"
                                </p>
                            </div>
                        </div>

                        {/* Foto Bukti Fisik Lapangan */}
                        <div className="space-y-2">
                            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                                <Camera size={12} className="text-slate-400" /> Dokumentasi Warga
                            </h3>
                            {photoList.length === 0 ? (
                                <div className="p-4 border border-dashed border-slate-200 text-center">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nihil Foto Bukti</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {photoList.map((path, idx) => (
                                        <a
                                            key={idx}
                                            href={`${BACKEND_URL}${path}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="aspect-square border border-slate-200 bg-slate-50 overflow-hidden relative group cursor-zoom-in"
                                        >
                                            <img src={`${BACKEND_URL}${path}`} alt={`bukti-${idx}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Catatan Arahan Admin (Triage) */}
                        {reportObj.adminNotes && (
                            <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                                    <FileText size={12} className="text-slate-400" /> Instruksi Verifikator
                                </h3>
                                <p className="text-[11px] font-semibold text-slate-700 leading-snug bg-slate-50 p-3 border border-slate-150 rounded-none">
                                    {reportObj.adminNotes}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* --- SEKSI 4: ANALISIS RISIKO BENCANA / SPATIAL ANALYTICS (FASE 4) --- */}
                {reportObj && (
                    <div className="p-5 border-t border-slate-100 space-y-4">
                        <h3 className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                            <Target size={14} className="text-rose-600 animate-pulse" /> Analisis Risiko (Radius 5 KM)
                        </h3>

                        {!showImpactRadius ? (
                            <Button
                                variant="outline"
                                onClick={() => setShowImpactRadius(true)}
                                className="w-full h-10 rounded-none border-rose-200 text-rose-600 hover:bg-rose-50 text-[10px] font-black uppercase tracking-widest shadow-none"
                            >
                                Aktifkan Simulasi Dampak
                            </Button>
                        ) : (
                            <div className="space-y-3 animate-in fade-in zoom-in duration-300">
                                <div className="bg-rose-50 border border-rose-200 p-3 rounded-none">
                                    <p className="text-[9px] font-semibold text-rose-800 leading-relaxed">
                                        🚨 <strong className="font-black">PROYEKSI DAMPAK:</strong> Pencemaran berpotensi menyebar sejauh 5 KM dari titik episentrum kejadian, mengenai <strong className="font-black">{affectedVillages.length} Desa/Kelurahan</strong> di sekitarnya.
                                    </p>
                                </div>

                                <div className="max-h-[150px] overflow-y-auto custom-scrollbar border border-slate-200 divide-y divide-slate-100">
                                    {affectedVillages.length === 0 ? (
                                        <div className="p-3 text-center text-[9px] text-slate-500 font-bold uppercase">
                                            Kawasan aman / Tidak mendeteksi pemukiman
                                        </div>
                                    ) : (
                                        affectedVillages.map((v, i) => (
                                            <div key={i} className="p-2.5 bg-white flex justify-between items-center hover:bg-slate-50">
                                                <span className="text-[10px] font-bold text-slate-800 uppercase">{v.desa}</span>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">{v.kecamatan}</span>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <Button
                                    variant="ghost"
                                    onClick={() => setShowImpactRadius(false)}
                                    className="w-full h-8 rounded-none text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-[9px] font-black uppercase tracking-widest"
                                >
                                    Tutup Simulasi
                                </Button>
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* --- SEKSI 5: ACTION FOOTER (Sticky) --- */}
            <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                {currentUser?.role === "PETUGAS_LAPANGAN" ? (
                    inspectionObj?.status === "Selesai" ? (
                        <div className="flex items-center justify-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700">
                            <CheckCircle2 size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">BAP Selesai Ditindak</span>
                        </div>
                    ) : (
                        <Button
                            onClick={handleActionClick}
                            className="w-full h-12 bg-slate-900 hover:bg-emerald-600 text-white rounded-none font-black text-[11px] uppercase tracking-widest shadow-none transition-colors gap-2"
                        >
                            Mulai Eksekusi / BAP <ArrowRight size={14} />
                        </Button>
                    )
                ) : (
                    <Button
                        onClick={handleActionClick}
                        variant="outline"
                        className="w-full h-11 border-slate-300 text-slate-600 hover:bg-slate-50 rounded-none font-black text-[10px] uppercase tracking-widest shadow-none"
                    >
                        Lihat Data di Triage
                    </Button>
                )}
            </div>
        </div>
    );
}