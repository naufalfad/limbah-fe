// src/modules/inspections/components/AuditEvaluationModal.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ClipboardList, Camera, X, CheckCircle2, Loader2, AlertTriangle, Building2, Gavel, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSijagaStore } from "@/store/useSijagaStore";
import { toast } from "sonner";
import SignaturePad from "./SignaturePad";
import { DocPreviewer } from "@/modules/admin/components/DocPreviewer";
import { Separator } from "@/components/ui/separator";

const BACKEND_URL = "http://localhost:5000";
const docUrl = (path: string | null | undefined) => {
    if (!path) return null;
    return path.startsWith("http") ? path : `${BACKEND_URL}${path}`;
};

interface AuditEvaluationModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedInsp: any;
}

const UKL_UPL_ITEMS = [
    { key: "sumberDampak", label: "Sumber Dampak", category: "SUMBER DAMPAK", isCritical: false },
    { key: "jenisDampak", label: "Jenis Dampak", category: "JENIS DAMPAK", isCritical: false },
    { key: "besaranDampak", label: "Besaran Dampak", category: "BESARAN DAMPAK", isCritical: false },
    { key: "pengelolaanBentuk", label: "Bentuk Upaya Pengelolaan", category: "UPAYA PENGELOLAAN LINGKUNGAN (BENTUK)", isCritical: true },
    { key: "pengelolaanLokasi", label: "Lokasi Pengelolaan", category: "UPAYA PENGELOLAAN LINGKUNGAN (LOKASI)", isCritical: true },
    { key: "pengelolaanPeriode", label: "Periode Pengelolaan", category: "UPAYA PENGELOLAAN LINGKUNGAN (PERIODE)", isCritical: true },
    { key: "pemantauanBentuk", label: "Bentuk Upaya Pemantauan", category: "UPAYA PEMANTAUAN LINGKUNGAN (BENTUK)", isCritical: true },
    { key: "pemantauanLokasi", label: "Lokasi Pemantauan", category: "UPAYA PEMANTAUAN LINGKUNGAN (LOKASI)", isCritical: true },
    { key: "pemantauanPeriode", label: "Periode Pemantauan", category: "UPAYA PEMANTAUAN LINGKUNGAN (PERIODE)", isCritical: true },
    { key: "institusi", label: "Institusi Pengelola & Pemantauan", category: "INSTITUSI PENGELOLAAN & PEMANTAUAN", isCritical: false },
    { key: "keterangan", label: "Keterangan Aspek Lain", category: "KETERANGAN LAIN", isCritical: false },
] as const;

const AMDAL_ITEMS = [
    { key: "amdalA1", label: "Persetujuan Lingkungan tersedia", category: "A. KEPATUHAN DOKUMEN LINGKUNGAN", isCritical: true },
    { key: "amdalA2", label: "SK Kelayakan Lingkungan tersedia", category: "A. KEPATUHAN DOKUMEN LINGKUNGAN", isCritical: true },
    { key: "amdalA3", label: "Dokumen AMDAL tersedia di lokasi usaha", category: "A. KEPATUHAN DOKUMEN LINGKUNGAN", isCritical: false },
    { key: "amdalA4", label: "Dokumen RKL-RPL tersedia", category: "A. KEPATUHAN DOKUMEN LINGKUNGAN", isCritical: false },
    { key: "amdalA5", label: "Laporan pelaksanaan RKL-RPL telah disampaikan", category: "A. KEPATUHAN DOKUMEN LINGKUNGAN", isCritical: false },

    { key: "amdalB1", label: "Program pengelolaan lingkungan dilaksanakan", category: "B. PELAKSANAAN RKL (PENGELOLAAN)", isCritical: false },
    { key: "amdalB2", label: "Fasilitas pengendalian pencemaran tersedia", category: "B. PELAKSANAAN RKL (PENGELOLAAN)", isCritical: true },
    { key: "amdalB3", label: "Terdapat bukti pelaksanaan pengelolaan lingkungan", category: "B. PELAKSANAAN RKL (PENGELOLAAN)", isCritical: false },
    { key: "amdalB4", label: "Tindakan pengelolaan sesuai dokumen RKL", category: "B. PELAKSANAAN RKL (PENGELOLAAN)", isCritical: true },
    { key: "amdalB5", label: "Tidak ditemukan kegiatan yang menyimpang dari komitmen RKL", category: "B. PELAKSANAAN RKL (PENGELOLAAN)", isCritical: false },

    { key: "amdalC1", label: "Monitoring lingkungan dilakukan sesuai jadwal", category: "C. PELAKSANAAN RPL (PEMANTAUAN)", isCritical: false },
    { key: "amdalC2", label: "Hasil monitoring terdokumentasi", category: "C. PELAKSANAAN RPL (PEMANTAUAN)", isCritical: false },
    { key: "amdalC3", label: "Parameter lingkungan dipantau sesuai RPL", category: "C. PELAKSANAAN RPL (PEMANTAUAN)", isCritical: true },
    { key: "amdalC4", label: "Hasil pengujian berasal dari laboratorium yang sah", category: "C. PELAKSANAAN RPL (PEMANTAUAN)", isCritical: false },
    { key: "amdalC5", label: "Terdapat tindak lanjut atas hasil monitoring", category: "C. PELAKSANAAN RPL (PEMANTAUAN)", isCritical: false },

    { key: "amdalD1", label: "Limbah dikelola sesuai ketentuan", category: "D. PENGELOLAAN LIMBAH", isCritical: false },
    { key: "amdalD2", label: "Tersedia TPS Limbah B3", category: "D. PENGELOLAAN LIMBAH", isCritical: true },
    { key: "amdalD3", label: "TPS Limbah B3 memenuhi persyaratan", category: "D. PENGELOLAAN LIMBAH", isCritical: true },
    { key: "amdalD4", label: "Manifest limbah tersedia", category: "D. PENGELOLAAN LIMBAH", isCritical: false },
    { key: "amdalD5", label: "Kerja sama pengangkutan/pengolahan limbah tersedia", category: "D. PENGELOLAAN LIMBAH", isCritical: false },

    { key: "amdalE1", label: "Tidak ditemukan pencemaran air", category: "E. PENGENDALIAN PENCEMARAN", isCritical: true },
    { key: "amdalE2", label: "Tidak ditemukan pencemaran udara", category: "E. PENGENDALIAN PENCEMARAN", isCritical: true },
    { key: "amdalE3", label: "Tidak ditemukan pencemaran tanah", category: "E. PENGENDALIAN PENCEMARAN", isCritical: true },
    { key: "amdalE4", label: "Tidak terdapat bau yang mengganggu", category: "E. PENGENDALIAN PENCEMARAN", isCritical: false },
    { key: "amdalE5", label: "Tingkat kebisingan terkendali", category: "E. PENGENDALIAN PENCEMARAN", isCritical: false },

    { key: "amdalF1", label: "Area usaha dalam kondisi bersih", category: "F. KONDISI LAPANGAN", isCritical: false },
    { key: "amdalF2", label: "Tidak terdapat tumpahan limbah", category: "F. KONDISI LAPANGAN", isCritical: true },
    { key: "amdalF3", label: "Saluran drainase berfungsi baik", category: "F. KONDISI LAPANGAN", isCritical: false },
    { key: "amdalF4", label: "Tidak ditemukan pembakaran limbah terbuka", category: "F. KONDISI LAPANGAN", isCritical: true },
    { key: "amdalF5", label: "Tidak ada indikasi gangguan lingkungan sekitar", category: "F. KONDISI LAPANGAN", isCritical: false },
] as const;

export default function AuditEvaluationModal({ isOpen, onClose, selectedInsp }: AuditEvaluationModalProps) {
    const { companies, fetchCompanies, submitInspectionResult } = useSijagaStore();
    const [loading, setLoading] = useState(false);
    const [activeAmdalMatrix, setActiveAmdalMatrix] = useState<'RKL' | 'RPL'>('RKL');

    // UKL-UPL Checklist State object
    const [uklUplChecklist, setUklUplChecklist] = useState({
        sumberDampakStatus: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        sumberDampakNotes: "",
        jenisDampakStatus: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        jenisDampakNotes: "",
        besaranDampakStatus: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        besaranDampakNotes: "",
        pengelolaanBentukStatus: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        pengelolaanBentukNotes: "",
        pengelolaanLokasiStatus: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        pengelolaanLokasiNotes: "",
        pengelolaanPeriodeStatus: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        pengelolaanPeriodeNotes: "",
        pemantauanBentukStatus: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        pemantauanBentukNotes: "",
        pemantauanLokasiStatus: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        pemantauanLokasiNotes: "",
        pemantauanPeriodeStatus: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        pemantauanPeriodeNotes: "",
        institusiStatus: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        institusiNotes: "",
        keteranganStatus: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        keteranganNotes: "",
    });

    // AMDAL Checklist State object
    const [amdalChecklist, setAmdalChecklist] = useState({
        amdalA1Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalA1Notes: "",
        amdalA2Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalA2Notes: "",
        amdalA3Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalA3Notes: "",
        amdalA4Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalA4Notes: "",
        amdalA5Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalA5Notes: "",

        amdalB1Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalB1Notes: "",
        amdalB2Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalB2Notes: "",
        amdalB3Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalB3Notes: "",
        amdalB4Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalB4Notes: "",
        amdalB5Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalB5Notes: "",

        amdalC1Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalC1Notes: "",
        amdalC2Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalC2Notes: "",
        amdalC3Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalC3Notes: "",
        amdalC4Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalC4Notes: "",
        amdalC5Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalC5Notes: "",

        amdalD1Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalD1Notes: "",
        amdalD2Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalD2Notes: "",
        amdalD3Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalD3Notes: "",
        amdalD4Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalD4Notes: "",
        amdalD5Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalD5Notes: "",

        amdalE1Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalE1Notes: "",
        amdalE2Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalE2Notes: "",
        amdalE3Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalE3Notes: "",
        amdalE4Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalE4Notes: "",
        amdalE5Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalE5Notes: "",

        amdalF1Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalF1Notes: "",
        amdalF2Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalF2Notes: "",
        amdalF3Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalF3Notes: "",
        amdalF4Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalF4Notes: "",
        amdalF5Status: "SESUAI" as "SESUAI" | "TIDAK_SESUAI",
        amdalF5Notes: "",
    });

    // SPPL Checklist State
    const [spplBersih, setSpplBersih] = useState(false);
    const [spplBebasLimbah, setSpplBebasLimbah] = useState(false);
    const [spplDrainase, setSpplDrainase] = useState(false);
    const [spplBebasBakar, setSpplBebasBakar] = useState(false);
    const [spplTempatSampah, setSpplTempatSampah] = useState(false);
    const [notes, setNotes] = useState("");

    // Signature State
    const [isSigned, setIsSigned] = useState(false);
    const [signatureData, setSignatureData] = useState<string | null>(null);

    // Photo Upload State
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoBase64, setPhotoBase64] = useState<string | null>(null);

    // --- REBINDING LOGIC FOR UNKNOWN COMPANY [3] ---
    const isUnknown = selectedInsp?.companyId === "COM-UNKNOWN";
    const [correctedCompanyId, setCorrectedCompanyId] = useState("COM-UNKNOWN");

    useEffect(() => {
        if (isOpen) {
            fetchCompanies();
            setCorrectedCompanyId(selectedInsp?.companyId || "COM-UNKNOWN");

            const chk = selectedInsp?.checklist || {};

            // UKL-UPL object structure loading
            setUklUplChecklist({
                sumberDampakStatus: chk.sumberDampakStatus || "SESUAI",
                sumberDampakNotes: chk.sumberDampakNotes || "",
                jenisDampakStatus: chk.jenisDampakStatus || "SESUAI",
                jenisDampakNotes: chk.jenisDampakNotes || "",
                besaranDampakStatus: chk.besaranDampakStatus || "SESUAI",
                besaranDampakNotes: chk.besaranDampakNotes || "",
                pengelolaanBentukStatus: chk.pengelolaanBentukStatus || "SESUAI",
                pengelolaanBentukNotes: chk.pengelolaanBentukNotes || "",
                pengelolaanLokasiStatus: chk.pengelolaanLokasiStatus || "SESUAI",
                pengelolaanLokasiNotes: chk.pengelolaanLokasiNotes || "",
                pengelolaanPeriodeStatus: chk.pengelolaanPeriodeStatus || "SESUAI",
                pengelolaanPeriodeNotes: chk.pengelolaanPeriodeNotes || "",
                pemantauanBentukStatus: chk.pemantauanBentukStatus || "SESUAI",
                pemantauanBentukNotes: chk.pemantauanBentukNotes || "",
                pemantauanLokasiStatus: chk.pemantauanLokasiStatus || "SESUAI",
                pemantauanLokasiNotes: chk.pemantauanLokasiNotes || "",
                pemantauanPeriodeStatus: chk.pemantauanPeriodeStatus || "SESUAI",
                pemantauanPeriodeNotes: chk.pemantauanPeriodeNotes || "",
                institusiStatus: chk.institusiStatus || "SESUAI",
                institusiNotes: chk.institusiNotes || "",
                keteranganStatus: chk.keteranganStatus || "SESUAI",
                keteranganNotes: chk.keteranganNotes || "",
            });

            // AMDAL object structure loading
            setAmdalChecklist({
                amdalA1Status: chk.amdalA1Status || "SESUAI",
                amdalA1Notes: chk.amdalA1Notes || "",
                amdalA2Status: chk.amdalA2Status || "SESUAI",
                amdalA2Notes: chk.amdalA2Notes || "",
                amdalA3Status: chk.amdalA3Status || "SESUAI",
                amdalA3Notes: chk.amdalA3Notes || "",
                amdalA4Status: chk.amdalA4Status || "SESUAI",
                amdalA4Notes: chk.amdalA4Notes || "",
                amdalA5Status: chk.amdalA5Status || "SESUAI",
                amdalA5Notes: chk.amdalA5Notes || "",

                amdalB1Status: chk.amdalB1Status || "SESUAI",
                amdalB1Notes: chk.amdalB1Notes || "",
                amdalB2Status: chk.amdalB2Status || "SESUAI",
                amdalB2Notes: chk.amdalB2Notes || "",
                amdalB3Status: chk.amdalB3Status || "SESUAI",
                amdalB3Notes: chk.amdalB3Notes || "",
                amdalB4Status: chk.amdalB4Status || "SESUAI",
                amdalB4Notes: chk.amdalB4Notes || "",
                amdalB5Status: chk.amdalB5Status || "SESUAI",
                amdalB5Notes: chk.amdalB5Notes || "",

                amdalC1Status: chk.amdalC1Status || "SESUAI",
                amdalC1Notes: chk.amdalC1Notes || "",
                amdalC2Status: chk.amdalC2Status || "SESUAI",
                amdalC2Notes: chk.amdalC2Notes || "",
                amdalC3Status: chk.amdalC3Status || "SESUAI",
                amdalC3Notes: chk.amdalC3Notes || "",
                amdalC4Status: chk.amdalC4Status || "SESUAI",
                amdalC4Notes: chk.amdalC4Notes || "",
                amdalC5Status: chk.amdalC5Status || "SESUAI",
                amdalC5Notes: chk.amdalC5Notes || "",

                amdalD1Status: chk.amdalD1Status || "SESUAI",
                amdalD1Notes: chk.amdalD1Notes || "",
                amdalD2Status: chk.amdalD2Status || "SESUAI",
                amdalD2Notes: chk.amdalD2Notes || "",
                amdalD3Status: chk.amdalD3Status || "SESUAI",
                amdalD3Notes: chk.amdalD3Notes || "",
                amdalD4Status: chk.amdalD4Status || "SESUAI",
                amdalD4Notes: chk.amdalD4Notes || "",
                amdalD5Status: chk.amdalD5Status || "SESUAI",
                amdalD5Notes: chk.amdalD5Notes || "",

                amdalE1Status: chk.amdalE1Status || "SESUAI",
                amdalE1Notes: chk.amdalE1Notes || "",
                amdalE2Status: chk.amdalE2Status || "SESUAI",
                amdalE2Notes: chk.amdalE2Notes || "",
                amdalE3Status: chk.amdalE3Status || "SESUAI",
                amdalE3Notes: chk.amdalE3Notes || "",
                amdalE4Status: chk.amdalE4Status || "SESUAI",
                amdalE4Notes: chk.amdalE4Notes || "",
                amdalE5Status: chk.amdalE5Status || "SESUAI",
                amdalE5Notes: chk.amdalE5Notes || "",

                amdalF1Status: chk.amdalF1Status || "SESUAI",
                amdalF1Notes: chk.amdalF1Notes || "",
                amdalF2Status: chk.amdalF2Status || "SESUAI",
                amdalF2Notes: chk.amdalF2Notes || "",
                amdalF3Status: chk.amdalF3Status || "SESUAI",
                amdalF3Notes: chk.amdalF3Notes || "",
                amdalF4Status: chk.amdalF4Status || "SESUAI",
                amdalF4Notes: chk.amdalF4Notes || "",
                amdalF5Status: chk.amdalF5Status || "SESUAI",
                amdalF5Notes: chk.amdalF5Notes || "",
            });

            // SPPL
            setSpplBersih(!!chk.spplBersih);
            setSpplBebasLimbah(!!chk.spplBebasLimbah);
            setSpplDrainase(!!chk.spplDrainase);
            setSpplBebasBakar(!!chk.spplBebasBakar);
            setSpplTempatSampah(!!chk.spplTempatSampah);

            setNotes(selectedInsp?.notes || "");
            setIsSigned(!!selectedInsp?.bapSigned);
        }
    }, [isOpen, selectedInsp, fetchCompanies]);

    const approvedCompanies = useMemo(() => {
        return companies.filter(c => c.status === "APPROVED" && c.id !== "COM-UNKNOWN");
    }, [companies]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setPhotoFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoBase64(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemovePhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setPhotoFile(null);
        setPhotoBase64(null);
    };

    if (!selectedInsp) return null;

    // Identify company docType
    const company = companies.find(c => c.id === (isUnknown ? correctedCompanyId : selectedInsp.companyId));
    const isSppl = company?.docType === "SPPL";
    const isAmdal = company?.docType === "AMDAL";

    // Scoring for UKL-UPL Matrix
    const uklUplMetCount = Object.keys(uklUplChecklist).filter(
        key => key.endsWith("Status") && uklUplChecklist[key as keyof typeof uklUplChecklist] === "SESUAI"
    ).length;
    const rawUklUplScore = Math.round((uklUplMetCount / 11) * 100);

    const hasUklUplCriticalViolation = [
        uklUplChecklist.pengelolaanBentukStatus,
        uklUplChecklist.pengelolaanLokasiStatus,
        uklUplChecklist.pengelolaanPeriodeStatus,
        uklUplChecklist.pemantauanBentukStatus,
        uklUplChecklist.pemantauanLokasiStatus,
        uklUplChecklist.pemantauanPeriodeStatus
    ].some(status => status === "TIDAK_SESUAI");

    const uklUplScore = hasUklUplCriticalViolation ? Math.min(rawUklUplScore, 50) : rawUklUplScore;

    // Scoring for SPPL
    const rawSpplScore =
        (spplBersih ? 20 : 0) +
        (spplBebasLimbah ? 25 : 0) +
        (spplDrainase ? 15 : 0) +
        (spplBebasBakar ? 20 : 0) +
        (spplTempatSampah ? 20 : 0);

    const hasSpplCriticalViolation = !spplBebasLimbah || !spplBebasBakar;
    const spplScore = hasSpplCriticalViolation ? Math.min(rawSpplScore, 50) : rawSpplScore;

    // Scoring for AMDAL
    const amdalMetCount = Object.keys(amdalChecklist).filter(
        key => key.endsWith("Status") && amdalChecklist[key as keyof typeof amdalChecklist] === "SESUAI"
    ).length;
    const rawAmdalScore = Math.round((amdalMetCount / 30) * 100);

    const hasAmdalCriticalViolation = AMDAL_ITEMS.filter(item => item.isCritical).some(item => {
        const statusKey = `${item.key}Status` as keyof typeof amdalChecklist;
        return amdalChecklist[statusKey] === "TIDAK_SESUAI";
    });

    const amdalScore = hasAmdalCriticalViolation ? Math.min(rawAmdalScore, 50) : rawAmdalScore;

    const calculatedScore = isSppl ? spplScore : isAmdal ? amdalScore : uklUplScore;
    const hasCriticalViolation = isSppl ? hasSpplCriticalViolation : isAmdal ? hasAmdalCriticalViolation : hasUklUplCriticalViolation;

    // Determine compliance category & styling
    let complianceLabel = "";
    let complianceDesc = "";
    let complianceColorClass = "";

    if (isSppl) {
        if (spplScore === 100) {
            complianceLabel = "PATUH SEUTUHNYA";
            complianceDesc = "Semua item SPPL telah terpenuhi secara sempurna.";
            complianceColorClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
        } else if (spplScore >= 60 && !hasSpplCriticalViolation) {
            complianceLabel = "PATUH BERSYARAT";
            complianceDesc = "Mayoritas item SPPL terpenuhi, tanpa adanya pelanggaran kritis.";
            complianceColorClass = "bg-amber-50 text-amber-800 border-amber-200";
        } else {
            complianceLabel = "TIDAK PATUH";
            complianceDesc = hasSpplCriticalViolation
                ? "Pelanggaran aspek kritis terdeteksi! (Tidak Membuang Limbah / Tidak Membakar)."
                : "Tingkat kepatuhan rendah (skor di bawah 60%).";
            complianceColorClass = "bg-rose-50 text-rose-800 border-rose-200 animate-pulse";
        }
    } else if (isAmdal) {
        if (amdalScore === 100) {
            complianceLabel = "PATUH SEUTUHNYA";
            complianceDesc = "Semua 30 parameter evaluasi wajib AMDAL berstatus SESUAI.";
            complianceColorClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
        } else if (amdalScore >= 60 && !hasAmdalCriticalViolation) {
            complianceLabel = "PATUH BERSYARAT";
            complianceDesc = "Kepatuhan AMDAL memadai, pelanggaran hanya terjadi pada aspek minor.";
            complianceColorClass = "bg-amber-50 text-amber-800 border-amber-200";
        } else {
            complianceLabel = "TIDAK PATUH";
            complianceDesc = hasAmdalCriticalViolation
                ? "Pelanggaran aspek kritis AMDAL terdeteksi! Skor akhir dibatasi maks 50."
                : "Tingkat kepatuhan kualitatif AMDAL rendah (di bawah 60%).";
            complianceColorClass = "bg-rose-50 text-rose-800 border-rose-200 animate-pulse";
        }
    } else {
        if (uklUplScore === 100) {
            complianceLabel = "PATUH SEUTUHNYA";
            complianceDesc = "Semua 11 parameter matriks kualitatif UKL-UPL berstatus SESUAI.";
            complianceColorClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
        } else if (uklUplScore >= 60 && !hasUklUplCriticalViolation) {
            complianceLabel = "PATUH BERSYARAT";
            complianceDesc = "Kepatuhan kualitatif memadai, pelanggaran hanya terjadi pada aspek minor.";
            complianceColorClass = "bg-amber-50 text-amber-800 border-amber-200";
        } else {
            complianceLabel = "TIDAK PATUH";
            complianceDesc = hasUklUplCriticalViolation
                ? "Pelanggaran kritis matriks (Pengelolaan / Pemantauan)! Skor akhir dibatasi maks 50."
                : "Tingkat kepatuhan kualitatif rendah (di bawah 60%).";
            complianceColorClass = "bg-rose-50 text-rose-800 border-rose-200 animate-pulse";
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isSigned) {
            toast.error("Tanda tangan digital BAP wajib dilengkapi.");
            return;
        }

        // Validasi ekstra khusus untuk Penindakan Pengaduan
        if (isUnknown && !notes.trim()) {
            toast.error("Hasil investigasi (Catatan/Temuan Lapangan) wajib diisi untuk penindakan aduan warga.");
            return;
        }

        // Validasi deskripsi ketidaksesuaian UKL-UPL & AMDAL
        if (!isSppl && !isUnknown) {
            if (isAmdal) {
                for (const item of AMDAL_ITEMS) {
                    const statusKey = `${item.key}Status` as keyof typeof amdalChecklist;
                    const notesKey = `${item.key}Notes` as keyof typeof amdalChecklist;
                    if (amdalChecklist[statusKey] === "TIDAK_SESUAI" && !amdalChecklist[notesKey].trim()) {
                        toast.error(`Catatan ketidaksesuaian untuk aspek "${item.label}" wajib diisi!`);
                        return;
                    }
                }
            } else {
                for (const item of UKL_UPL_ITEMS) {
                    const statusKey = `${item.key}Status` as keyof typeof uklUplChecklist;
                    const notesKey = `${item.key}Notes` as keyof typeof uklUplChecklist;
                    if (uklUplChecklist[statusKey] === "TIDAK_SESUAI" && !uklUplChecklist[notesKey].trim()) {
                        toast.error(`Catatan ketidaksesuaian untuk aspek "${item.label}" wajib diisi!`);
                        return;
                    }
                }
            }
        }

        setLoading(true);
        try {
            const payloadScore = isUnknown ? null : calculatedScore;
            const payloadChecklist = isUnknown ? null : (isSppl ? {
                spplBersih, spplBebasLimbah, spplDrainase, spplBebasBakar, spplTempatSampah
            } : isAmdal ? amdalChecklist : uklUplChecklist);

            await submitInspectionResult(
                selectedInsp.id,
                payloadScore as any,
                notes,
                payloadChecklist as any,
                photoBase64 || undefined,
                isUnknown ? correctedCompanyId : undefined
            );

            if (isUnknown) {
                if (correctedCompanyId !== "COM-UNKNOWN") {
                    toast.success(`BAP Penindakan diamankan. Pelaku berhasil diidentifikasi.`);
                } else {
                    toast.success(`BAP Penindakan diamankan. Kasus ditutup.`);
                }
            } else {
                toast.success(`Evaluasi Kepatuhan Selesai. Skor: ${calculatedScore}/100.`);
            }

            onClose();
        } catch (err) {
            toast.error("Terjadi kesalahan saat memproses laporan BAP.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[98vw] lg:max-w-[96vw] p-0 overflow-hidden rounded-xl border border-slate-200 shadow-2xl bg-white font-sans">

                {/* HEADER - Frameless & Sharp */}
                <div className={cn("p-4 flex justify-between items-center shrink-0 border-b", isUnknown ? "bg-rose-950 border-rose-900 text-white" : "bg-slate-900 border-slate-800 text-white")}>
                    <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 flex items-center justify-center text-white rounded shadow-sm", isUnknown ? "bg-rose-600" : "bg-emerald-600")}>
                            {isUnknown ? <Gavel size={18} /> : <ClipboardList size={18} />}
                        </div>
                        <div className="text-left">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest leading-none border",
                                    isUnknown ? "bg-rose-600/20 text-rose-400 border-rose-500/50" : "bg-emerald-600/20 text-emerald-400 border-emerald-500/50"
                                )}>
                                    {isUnknown ? "TINDAK LANJUT PENGADUAN" : "INTERNAL AUDIT"}
                                </span>
                                <span className="text-slate-400 font-mono text-[9px] tracking-widest uppercase leading-none">BAP-AUTO</span>
                            </div>
                            <DialogTitle className="text-sm font-black tracking-wider text-white uppercase leading-none">
                                {isUnknown ? "BAP Penyelidikan Lapangan" : "Evaluasi Fisik Lapangan"}
                            </DialogTitle>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400">
                        <X size={16} />
                    </button>
                </div>

                {/* FORM BODY - Two Column Grid on Desktop */}
                <form onSubmit={handleSubmit} className="bg-slate-50 max-h-[82vh] overflow-y-auto custom-scrollbar p-5">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                        {/* LEFT COLUMN: The Checklist (7/12 Width) */}
                        <div className="lg:col-span-7 space-y-4">

                            {/* Seksi Objek Inspeksi */}
                            <div className="p-3 bg-white border border-slate-200 text-left shadow-sm rounded-lg">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none">Lokasi / Objek Inspeksi</span>
                                <h4 className="text-xs font-black text-slate-800 mt-1 leading-normal uppercase">{selectedInsp.companyName || selectedInsp.company?.companyName || "Perusahaan"}</h4>
                                <p className="text-[9px] text-slate-500 font-bold mt-0.5 leading-normal uppercase">{selectedInsp.location}</p>
                            </div>

                            {/* BLOK A: LOGIKA PENINDAKAN PENGADUAN (isUnknown === true) */}
                            {isUnknown && (
                                <div className="p-4 bg-rose-50 border border-rose-200 text-left space-y-3.5 animate-in fade-in rounded-lg">
                                    <div className="flex items-start gap-2.5 text-rose-800">
                                        <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                                        <div className="space-y-1">
                                            <h5 className="text-[9px] font-black uppercase tracking-widest leading-none">Identifikasi Pelanggar</h5>
                                            <p className="text-[9px] font-medium leading-normal text-rose-700 mt-1">
                                                Surat tugas ini berawal dari laporan masyarakat. Jika Anda berhasil menemukan identitas pelaku (pabrik/industri terdaftar) di lokasi, hubungkan BAP ini ke entitas tersebut.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none flex items-center gap-1">
                                            <Building2 size={12} className="text-rose-500" /> Tetapkan Target Pelanggar
                                        </Label>
                                        <select
                                            value={correctedCompanyId}
                                            onChange={(e) => {
                                                setCorrectedCompanyId(e.target.value);
                                                if (e.target.value !== "COM-UNKNOWN") {
                                                    toast.info(`Target BAP diredireksi ke entitas industri terdaftar.`);
                                                }
                                            }}
                                            className="h-10 w-full rounded border border-rose-200 bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-700 focus:outline-none focus:border-rose-500 cursor-pointer"
                                        >
                                            <option value="COM-UNKNOWN">-- PELAKU TIDAK DIKETAHUI / SULIT DIIDENTIFIKASI --</option>
                                            {approvedCompanies.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.companyName} ({c.nib})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* BLOK B: LOGIKA AUDIT RUTIN DLH (isUnknown === false) */}
                            {!isUnknown && (
                                <div className="space-y-3 text-left animate-in fade-in">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                            <FileText size={12} className="text-slate-400" /> Parameter Evaluasi Kepatuhan ({isSppl ? "Wajib SPPL" : isAmdal ? "Wajib AMDAL" : "Wajib UKL-UPL"})
                                        </label>
                                    </div>

                                    <div className="border border-slate-200 bg-white overflow-y-auto max-h-[480px] shadow-sm rounded-lg custom-scrollbar">
                                        {isSppl ? (
                                            <table className="w-full text-[11px] font-sans border-collapse text-left">
                                                <thead>
                                                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-black uppercase text-[8px] tracking-wider">
                                                        <th className="py-2.5 px-3 text-center w-8">ID</th>
                                                        <th className="py-2.5 px-3">Kategori</th>
                                                        <th className="py-2.5 px-3">Item Inspeksi SPPL</th>
                                                        <th className="py-2.5 px-3 text-center w-14">Bobot</th>
                                                        <th className="py-2.5 px-3 text-center w-16">Kritis</th>
                                                        <th className="py-2.5 px-3 text-center w-14">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    <InspectionRow id={1} category="Kebersihan" item="Lingkungan usaha bersih" weight={20} isCritical={false} checked={spplBersih} onClick={() => setSpplBersih(!spplBersih)} />
                                                    <InspectionRow id={2} category="Limbah" item="Tidak membuang limbah sembarangan" weight={25} isCritical={true} checked={spplBebasLimbah} onClick={() => setSpplBebasLimbah(!spplBebasLimbah)} />
                                                    <InspectionRow id={3} category="Drainase" item="Saluran drainase baik" weight={15} isCritical={false} checked={spplDrainase} onClick={() => setSpplDrainase(!spplDrainase)} />
                                                    <InspectionRow id={4} category="Limbah" item="Tidak ada pembakaran limbah" weight={20} isCritical={true} checked={spplBebasBakar} onClick={() => setSpplBebasBakar(!spplBebasBakar)} />
                                                    <InspectionRow id={5} category="Kebersihan" item="Tempat sampah tersedia" weight={20} isCritical={false} checked={spplTempatSampah} onClick={() => setSpplTempatSampah(!spplTempatSampah)} />
                                                </tbody>
                                            </table>
                                        ) : isAmdal ? (
                                            <table className="w-full text-[11px] font-sans border-collapse text-left">
                                                <thead>
                                                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-black uppercase text-[8px] tracking-wider">
                                                        <th className="py-2.5 px-3">Parameter Matriks AMDAL</th>
                                                        <th className="py-2.5 px-3 text-center w-20">Parameter</th>
                                                        <th className="py-2.5 px-3 text-center w-36">Evaluasi</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {AMDAL_ITEMS.map((item, index) => {
                                                        const statusKey = `${item.key}Status` as keyof typeof amdalChecklist;
                                                        const notesKey = `${item.key}Notes` as keyof typeof amdalChecklist;
                                                        const status = amdalChecklist[statusKey];
                                                        const notesVal = amdalChecklist[notesKey] as string;

                                                        return (
                                                            <React.Fragment key={item.key}>
                                                                <tr className={cn(
                                                                    "hover:bg-slate-50/50 transition-colors select-none",
                                                                    status === "TIDAK_SESUAI" ? "bg-rose-50/10" : ""
                                                                )}>
                                                                    <td className="py-2.5 px-3">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[7.5px] font-black text-slate-450 uppercase tracking-widest leading-none mb-1">
                                                                                {item.category}
                                                                            </span>
                                                                            <span className="text-[11px] font-bold text-slate-800 leading-normal">
                                                                                {index + 1}. {item.label}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2.5 px-3 text-center align-middle">
                                                                        {item.isCritical ? (
                                                                            <span className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded text-[8px] uppercase font-black tracking-wider border border-rose-200">
                                                                                KRITIS
                                                                            </span>
                                                                        ) : (
                                                                            <span className="bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold border border-slate-200">
                                                                                MINOR
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-2.5 px-3 text-center align-middle">
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setAmdalChecklist(prev => ({
                                                                                    ...prev,
                                                                                    [statusKey]: "SESUAI",
                                                                                    [notesKey]: ""
                                                                                }))}
                                                                                className={cn(
                                                                                    "px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider transition-all rounded border",
                                                                                    status === "SESUAI"
                                                                                        ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                                                                                        : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
                                                                                )}
                                                                            >
                                                                                SESUAI
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setAmdalChecklist(prev => ({
                                                                                    ...prev,
                                                                                    [statusKey]: "TIDAK_SESUAI"
                                                                                }))}
                                                                                className={cn(
                                                                                    "px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider transition-all rounded border",
                                                                                    status === "TIDAK_SESUAI"
                                                                                        ? "bg-rose-600 border-rose-600 text-white shadow-sm"
                                                                                        : "bg-white border-slate-200 text-slate-450 hover:bg-slate-50"
                                                                                )}
                                                                            >
                                                                                TIDAK
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                                {status === "TIDAK_SESUAI" && (
                                                                    <tr className="bg-rose-50/20">
                                                                        <td colSpan={3} className="py-2 px-3 border-b border-rose-100/50">
                                                                            <div className="space-y-1">
                                                                                <span className="text-[8px] font-black text-rose-700 uppercase tracking-widest block leading-none">
                                                                                    Temuan Ketidaksesuaian Aspek *
                                                                                </span>
                                                                                <textarea
                                                                                    value={notesVal}
                                                                                    onChange={(e) => setAmdalChecklist(prev => ({
                                                                                        ...prev,
                                                                                        [notesKey]: e.target.value
                                                                                    }))}
                                                                                    className="w-full min-h-[45px] border border-rose-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-white p-2 text-xs font-medium rounded shadow-inner"
                                                                                    placeholder={`Jelaskan ketidaksesuaian aspek ${item.label.toLowerCase()} secara spesifik...`}
                                                                                    required
                                                                                />
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <table className="w-full text-[11px] font-sans border-collapse text-left">
                                                <thead>
                                                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-black uppercase text-[8px] tracking-wider">
                                                        <th className="py-2.5 px-3">Parameter Matriks UKL-UPL</th>
                                                        <th className="py-2.5 px-3 text-center w-20">Parameter</th>
                                                        <th className="py-2.5 px-3 text-center w-36">Evaluasi</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {UKL_UPL_ITEMS.map((item) => {
                                                        const statusKey = `${item.key}Status` as keyof typeof uklUplChecklist;
                                                        const notesKey = `${item.key}Notes` as keyof typeof uklUplChecklist;
                                                        const status = uklUplChecklist[statusKey];
                                                        const notesVal = uklUplChecklist[notesKey] as string;

                                                        return (
                                                            <React.Fragment key={item.key}>
                                                                <tr className={cn(
                                                                    "hover:bg-slate-50/50 transition-colors select-none",
                                                                    status === "TIDAK_SESUAI" ? "bg-rose-50/10" : ""
                                                                )}>
                                                                    <td className="py-2.5 px-3">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[7.5px] font-black text-slate-450 uppercase tracking-widest leading-none mb-1">
                                                                                {item.category}
                                                                            </span>
                                                                            <span className="text-[11px] font-bold text-slate-800 leading-normal">
                                                                                {item.label}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2.5 px-3 text-center align-middle">
                                                                        {item.isCritical ? (
                                                                            <span className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded text-[8px] uppercase font-black tracking-wider border border-rose-200">
                                                                                KRITIS
                                                                            </span>
                                                                        ) : (
                                                                            <span className="bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold border border-slate-200">
                                                                                MINOR
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-2.5 px-3 text-center align-middle">
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setUklUplChecklist(prev => ({
                                                                                    ...prev,
                                                                                    [statusKey]: "SESUAI",
                                                                                    [notesKey]: ""
                                                                                }))}
                                                                                className={cn(
                                                                                    "px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider transition-all rounded border",
                                                                                    status === "SESUAI"
                                                                                        ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                                                                                        : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
                                                                                )}
                                                                            >
                                                                                SESUAI
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setUklUplChecklist(prev => ({
                                                                                    ...prev,
                                                                                    [statusKey]: "TIDAK_SESUAI"
                                                                                }))}
                                                                                className={cn(
                                                                                    "px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider transition-all rounded border",
                                                                                    status === "TIDAK_SESUAI"
                                                                                        ? "bg-rose-600 border-rose-600 text-white shadow-sm"
                                                                                        : "bg-white border-slate-200 text-slate-450 hover:bg-slate-50"
                                                                                )}
                                                                            >
                                                                                TIDAK
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                                {status === "TIDAK_SESUAI" && (
                                                                    <tr className="bg-rose-50/20">
                                                                        <td colSpan={3} className="py-2 px-3 border-b border-rose-100/50">
                                                                            <div className="space-y-1">
                                                                                <span className="text-[8px] font-black text-rose-700 uppercase tracking-widest block leading-none">
                                                                                    Temuan Ketidaksesuaian Matriks *
                                                                                </span>
                                                                                <textarea
                                                                                    value={notesVal}
                                                                                    onChange={(e) => setUklUplChecklist(prev => ({
                                                                                        ...prev,
                                                                                        [notesKey]: e.target.value
                                                                                    }))}
                                                                                    className="w-full min-h-[45px] border border-rose-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-white p-2 text-xs font-medium rounded shadow-inner"
                                                                                    placeholder={`Jelaskan ketidaksesuaian aspek ${item.label.toLowerCase()} secara spesifik...`}
                                                                                    required
                                                                                />
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: Summary & Signatures (5/12 Width) */}
                        <div className="lg:col-span-5 space-y-4">

                            {/* Visual Score & Compliance Badge Card */}
                            {!isUnknown && (
                                <div className="bg-white border border-slate-200 p-4 shadow-sm rounded-lg space-y-4 text-left">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none">Skor Kepatuhan</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black text-slate-800 italic tracking-tighter leading-none">{calculatedScore}</span>
                                                <span className="text-xs font-bold text-slate-400">/ 100</span>
                                            </div>
                                        </div>

                                        {/* Status Evaluation box */}
                                        <div className={cn("px-3 py-2 border rounded font-black text-[10px] tracking-wider text-center shrink-0 uppercase",
                                            calculatedScore === 100 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                calculatedScore >= 60 && !hasCriticalViolation ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                    "bg-rose-50 text-rose-600 border-rose-200 animate-pulse"
                                        )}>
                                            {complianceLabel}
                                        </div>
                                    </div>

                                    {/* Description box */}
                                    <div className={cn("p-2.5 border rounded text-[9.5px] leading-relaxed font-bold", complianceColorClass)}>
                                        {complianceDesc}
                                    </div>
                                </div>
                            )}

                            {/* Catatan Lapangan / BAP Notes */}
                            <div className="space-y-1.5 text-left">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                    {isUnknown ? "Kronologi Penindakan & Hasil Investigasi" : "Catatan Khusus BAP / Rekomendasi Petugas"}
                                    {isUnknown && <span className="text-rose-500">*</span>}
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full min-h-[90px] rounded border border-slate-200 p-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white shadow-sm"
                                    placeholder={isUnknown ? "Uraikan kronologi penindakan, pembuangan limbah ilegal, atau identifikasi pelaku di lapangan..." : "Uraikan catatan, temuan khusus di luar matriks, atau tenggat perbaikan..."}
                                />
                            </div>

                            {/* Foto Dokumentasi */}
                            <div className="space-y-1.5 text-left">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Dokumentasi Sidak Lapangan</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id="bap-photo-upload"
                                    onChange={handleFileChange}
                                />
                                {photoBase64 ? (
                                    <div className="border border-slate-200 bg-slate-100 rounded h-[90px] relative overflow-hidden group shadow-sm">
                                        <img
                                            src={photoBase64}
                                            alt="Evidence Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={handleRemovePhoto}
                                                className="bg-red-600 hover:bg-red-700 text-white font-black text-[8px] tracking-widest uppercase px-3 py-1.5 rounded shadow-md flex items-center gap-1"
                                            >
                                                <X size={10} /> HAPUS FOTO
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <label
                                        htmlFor="bap-photo-upload"
                                        className="border border-dashed border-slate-350 bg-white rounded p-4 flex flex-col items-center justify-center text-center h-[90px] relative overflow-hidden group cursor-pointer hover:bg-slate-50 hover:border-slate-450 transition-colors shadow-sm"
                                    >
                                        <div className="relative z-10 text-slate-500 group-hover:text-emerald-600 flex flex-col items-center gap-1.5 transition-colors">
                                            <Camera size={18} />
                                            <span className="text-[8.5px] font-black uppercase tracking-widest block leading-none">UNGGAH FOTO BAP (JPG/PNG)</span>
                                        </div>
                                    </label>
                                )}
                            </div>

                            {/* Tanda Tangan Canvas */}
                            <div className="shadow-sm rounded border border-slate-200 overflow-hidden">
                                <SignaturePad onChange={(signed, data) => {
                                    setIsSigned(signed);
                                    setSignatureData(data);
                                }} />
                            </div>

                            {/* Submit Button Area */}
                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className={cn(
                                        "w-full h-11 rounded text-white font-black text-[11px] tracking-widest uppercase transition-colors shadow-md",
                                        isUnknown ? "bg-slate-900 hover:bg-rose-700" : "bg-slate-900 hover:bg-emerald-600"
                                    )}
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-1.5 justify-center">
                                            <Loader2 className="animate-spin" size={14} /> MENGIRIM BAP...
                                        </span>
                                    ) : (
                                        "SAHKAN & KIRIM BAP RESMI"
                                    )}
                                </Button>
                            </div>

                        </div>
                    </div>

                    {/* FULL WIDTH DOKUMEN PREVIEW DI BAWAH */}
                    {!isUnknown && (
                        <div className="mt-5 space-y-3 text-left">
                            <Separator className="bg-slate-200" />
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                <FileText size={12} className="text-slate-400" /> Lampiran Matriks Kepatuhan Teknis yang Diunggah Perusahaan
                            </label>
                            {company?.docType === "AMDAL" ? (
                                <div className="space-y-4">
                                    <div className="flex gap-2 bg-slate-100 p-1 border border-slate-200">
                                        <button
                                            type="button"
                                            onClick={() => setActiveAmdalMatrix('RKL')}
                                            className={cn(
                                                "flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all border rounded-none",
                                                activeAmdalMatrix === 'RKL'
                                                    ? "bg-slate-900 text-white border-slate-950"
                                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                            )}
                                        >
                                            Matriks RKL (Pengelolaan)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveAmdalMatrix('RPL')}
                                            className={cn(
                                                "flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all border rounded-none",
                                                activeAmdalMatrix === 'RPL'
                                                    ? "bg-slate-900 text-white border-slate-950"
                                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                            )}
                                        >
                                            Matriks RPL (Pemantauan)
                                        </button>
                                    </div>

                                    {((activeAmdalMatrix === 'RKL' && company.docRklUrl) || (activeAmdalMatrix === 'RPL' && company.docRplUrl)) ? (
                                        <div className="border border-slate-200 rounded-none overflow-hidden bg-white shadow-sm flex flex-col animate-in fade-in duration-200">
                                            <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={15} className="text-emerald-400" />
                                                    <span className="text-[10px] font-black uppercase tracking-wider">
                                                        {activeAmdalMatrix === 'RKL' ? 'Matriks RKL (Pengelolaan)' : 'Matriks RPL (Pemantauan)'}: {company.companyName}
                                                    </span>
                                                </div>
                                                <a
                                                    href={docUrl(activeAmdalMatrix === 'RKL' ? company.docRklUrl : company.docRplUrl) || undefined}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-[9px] font-black uppercase bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded border border-slate-700 transition-all flex items-center gap-1"
                                                >
                                                    Unduh Berkas Asli
                                                </a>
                                            </div>
                                            <div className="h-[500px] flex flex-col bg-slate-950/5 overflow-hidden">
                                                <DocPreviewer 
                                                    fileUrl={docUrl(activeAmdalMatrix === 'RKL' ? company.docRklUrl : company.docRplUrl)} 
                                                    companyId={company.id} 
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6 border border-dashed border-slate-200 text-center rounded-none text-slate-400 font-bold text-xs uppercase tracking-widest bg-white">
                                            ⚠ Berkas {activeAmdalMatrix === 'RKL' ? 'Matriks RKL' : 'Matriks RPL'} belum diunggah.
                                        </div>
                                    )}
                                </div>
                            ) : company?.docTemplateUrl ? (
                                <div className="border border-slate-250 rounded-none overflow-hidden bg-white shadow-sm flex flex-col">
                                    <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText size={15} className="text-emerald-400" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">
                                                Matriks Isian Teknis Resmi: {company.companyName}
                                            </span>
                                        </div>
                                        <a
                                            href={docUrl(company.docTemplateUrl) || undefined}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[9px] font-black uppercase bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded border border-slate-700 transition-all flex items-center gap-1"
                                        >
                                            Unduh Berkas Asli
                                        </a>
                                    </div>
                                    <div className="h-[500px] flex flex-col bg-slate-950/5 overflow-hidden">
                                        <DocPreviewer fileUrl={docUrl(company.docTemplateUrl)} companyId={company.id} />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 border border-dashed border-slate-200 text-center rounded-xl text-slate-400 font-bold text-xs uppercase tracking-widest bg-white">
                                    ⚠ Perusahaan belum mengunggah dokumen matriks isian teknis (UKL-UPL / SPPL).
                                </div>
                            )}
                        </div>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Sub-Komponen Baris Tabel Parameter SPPL
function InspectionRow({ id, category, item, weight, isCritical, checked, onClick }: {
    id: number;
    category: string;
    item: string;
    weight: number;
    isCritical: boolean;
    checked: boolean;
    onClick: () => void;
}) {
    return (
        <tr
            onClick={onClick}
            className={cn(
                "hover:bg-slate-50/80 transition-colors cursor-pointer text-slate-700 font-bold select-none h-11",
                checked ? "bg-emerald-50/10 text-emerald-950" : ""
            )}
        >
            <td className="py-2 px-3 text-center text-slate-450 font-mono text-[9px] border-r border-slate-100">{id}</td>
            <td className="py-2 px-3 border-r border-slate-100">
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-black border border-slate-200">
                    {category}
                </span>
            </td>
            <td className="py-2 px-3 text-[10.5px] text-slate-800 border-r border-slate-100 font-bold">{item}</td>
            <td className="py-2 px-3 text-center text-slate-500 text-[9px] font-black border-r border-slate-100">{weight} Pts</td>
            <td className="py-2 px-3 text-center border-r border-slate-100">
                {isCritical ? (
                    <span className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded text-[8px] uppercase font-black tracking-wider border border-rose-250">
                        YA
                    </span>
                ) : (
                    <span className="bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold border border-slate-200">
                        TIDAK
                    </span>
                )}
            </td>
            <td className="py-2 px-3">
                <div className={cn(
                    "mx-auto w-4.5 h-4.5 rounded border flex items-center justify-center transition-all",
                    checked ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 bg-white"
                )}>
                    {checked && <CheckCircle2 size={10} />}
                </div>
            </td>
        </tr>
    );
}