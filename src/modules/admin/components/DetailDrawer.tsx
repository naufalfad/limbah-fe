import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2, MapPin, FileText, User,
  CheckCircle2, AlertTriangle, XCircle,
  Download, ExternalLink, Factory, Phone, X,
  Eye, Loader2, MessageSquare, ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSijagaStore } from '@/store/useSijagaStore';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { DocPreviewer } from './DocPreviewer';

// Map invalidator helper to ensure correct dimensions inside dynamically rendered tabs/modals
function ResizeMap() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

const BACKEND_URL = "http://localhost:5000";

interface AmdalFileState {
  fileName: string;
  fileSize: string;
  base64Data: string;
}

const AMDAL_DOCS_CONFIG = [
  { key: "skPersetujuan", label: "SK Persetujuan Lingkungan", isRequired: true },
  { key: "skKelayakan", label: "SK Kelayakan Lingkungan", isRequired: true },
  { key: "ringkasanAmdal", label: "Ringkasan AMDAL", isRequired: false },
  { key: "dokumenAndal", label: "Dokumen ANDAL", isRequired: true },
  { key: "dokumenRkl", label: "Dokumen RKL", isRequired: true },
  { key: "dokumenRpl", label: "Dokumen RPL", isRequired: true },
  { key: "petaLokasi", label: "Peta Lokasi Spasial", isRequired: true },
  { key: "layoutIpal", label: "Layout IPAL Teknis", isRequired: false },
  { key: "layoutTpsB3", label: "Layout TPS B3", isRequired: false },
  { key: "hasilUjiLab", label: "Hasil Uji Laboratorium", isRequired: false },
  { key: "dokumentasiLokasi", label: "Dokumentasi Foto Lokasi", isRequired: false },
] as const;

export function DetailDrawer({ isOpen, onClose, data }: any) {
  const { updateCompanyStatus } = useSijagaStore();
  const [decision, setDecision] = useState<string>("");
  const [catatanRevisi, setCatatanRevisi] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);

  // Reset keputusan setiap kali modal dibuka dengan data baru
  useEffect(() => {
    if (isOpen) {
      setDecision("");
      setCatatanRevisi("");
      setPreviewDoc(null);
    }
  }, [isOpen, data?.id]);

  if (!data) return null;

  const handleSave = async () => {
    if (!decision) {
      toast.error("Silakan pilih keputusan terlebih dahulu.");
      return;
    }
    if ((decision === "REVISION" || decision === "REJECT") && !catatanRevisi.trim()) {
      toast.error("Catatan alasan wajib diisi untuk keputusan Revisi atau Tolak.");
      return;
    }

    let mappedStatus: "APPROVED" | "REVIEW" | "REJECTED" = "APPROVED";
    if (decision === "APPROVE") mappedStatus = "APPROVED";
    if (decision === "REVISION") mappedStatus = "REVIEW";
    if (decision === "REJECT") mappedStatus = "REJECTED";

    setIsSaving(true);
    try {
      await updateCompanyStatus(data.id, mappedStatus);
      toast.success(
        mappedStatus === "APPROVED"
          ? `✅ ${data.companyName} berhasil DISETUJUI!`
          : mappedStatus === "REVIEW"
            ? `📋 ${data.companyName} dikembalikan untuk REVISI.`
            : `❌ ${data.companyName} DITOLAK.`
      );
      onClose();
    } catch (err) {
      toast.error("Gagal menyimpan keputusan. Periksa koneksi server.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const docUrl = (path: string | null | undefined) => {
    if (!path) return null;
    // Already a full URL or relative path from backend
    return path.startsWith("http") ? path : `${BACKEND_URL}${path}`;
  };

  const nibUrl = docUrl(data.docNibUrl);
  const npwpUrl = docUrl(data.docNpwpUrl);
  const siteplanUrl = docUrl(data.docSiteplanUrl);

  const isAmdalJson = data.docType === "AMDAL" && data.docTemplateUrl && data.docTemplateUrl.trim().startsWith("{");
  let parsedAmdalDocs: Record<string, AmdalFileState> | null = null;
  if (isAmdalJson) {
    try {
      parsedAmdalDocs = JSON.parse(data.docTemplateUrl);
    } catch (e) {
      console.error("Failed to parse docTemplateUrl as AMDAL JSON:", e);
    }
  }

  const docLabel = data.docType === "UKL_UPL" ? "UKL-UPL" : (data.docType || "SPPL");

  const currentStatusColor: Record<string, string> = {
    PENDING: "bg-blue-100 text-blue-700",
    REVIEW: "bg-amber-100 text-amber-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] lg:max-w-7xl p-0 overflow-hidden rounded-none border-none shadow-2xl bg-white text-left">

          {/* --- HEADER --- */}
          <div className="bg-slate-900 text-white px-8 py-6 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-none flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Building2 size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase font-black tracking-widest">
                    {docLabel}
                  </Badge>
                  <Badge className={`${currentStatusColor[data.status] || "bg-slate-100 text-slate-500"} border-none text-[10px] uppercase font-black`}>
                    {data.status}
                  </Badge>
                  <span className="text-slate-500 font-mono text-[10px] tracking-widest hidden md:block">{data.id}</span>
                </div>
                <DialogTitle className="text-2xl font-black tracking-tight leading-none text-white">
                  {data.companyName}
                </DialogTitle>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-none transition-colors text-slate-400">
              <X size={24} />
            </button>
          </div>

          {/* --- BODY (Dua Kolom) --- */}
          <div className="flex h-[78vh] flex-col md:flex-row bg-slate-50 overflow-hidden">

            {/* KOLOM KIRI: Tabs konten */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <Tabs defaultValue="identitas" className="h-full flex flex-col">
                <div className="bg-white border-b border-slate-100 px-8 pt-4 shrink-0">
                  <TabsList className="bg-slate-100 rounded-none h-10">
                    <TabsTrigger value="identitas" className="rounded-none text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <User size={13} className="mr-1.5" /> Identitas
                    </TabsTrigger>
                    <TabsTrigger value="teknis" className="rounded-none text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <Factory size={13} className="mr-1.5" /> Teknis & Operasional
                    </TabsTrigger>
                    <TabsTrigger value="dokumen" className="rounded-none text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <FileText size={13} className="mr-1.5" /> Lampiran Dokumen
                    </TabsTrigger>
                    <TabsTrigger value="gis" className="rounded-none text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <MapPin size={13} className="mr-1.5" /> GIS & Lokasi
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* TAB: IDENTITAS */}
                <TabsContent value="identitas" className="flex-1 p-8 space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InfoCard label="Nama Perusahaan" value={data.companyName} icon={<Building2 size={16} />} />
                    <InfoCard label="Status Modal" value={data.investmentType || "-"} icon={<ClipboardList size={16} />} />
                    <InfoCard label="Penanggung Jawab" value={`${data.picName} — ${data.picRole || "PIC"}`} icon={<User size={16} />} />
                    <InfoCard label="Kontak / WhatsApp" value={data.picPhone || "-"} icon={<Phone size={16} />} />
                    <InfoCard label="NIB" value={data.nib} icon={<ClipboardList size={16} />} />
                    <InfoCard label="NPWP Perusahaan" value={data.npwp} icon={<ClipboardList size={16} />} />
                    <InfoCard label="KBLI (Bidang Usaha)" value={data.kbli || "-"} icon={<Factory size={16} />} />
                    <InfoCard label="Tahun Berdiri" value={data.yearBuilt || "-"} icon={<ClipboardList size={16} />} />
                    <div className="col-span-full">
                      <InfoCard label="Alamat Usaha" value={data.address} icon={<MapPin size={16} />} />
                    </div>
                  </div>
                </TabsContent>

                {/* TAB: TEKNIS */}
                <TabsContent value="teknis" className="flex-1 p-8 space-y-6 mt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard label="Luas Bangunan" value={`${data.buildingArea?.toLocaleString() || 0} m²`} color="bg-blue-50 text-blue-700" />
                    <MetricCard label="Luas Tanah" value={`${data.landArea?.toLocaleString() || 0} m²`} color="bg-indigo-50 text-indigo-700" />
                    <MetricCard label="Modal Investasi" value={`Rp ${data.investment?.toLocaleString() || 0}`} color="bg-emerald-50 text-emerald-700" />
                    <MetricCard label="Tenaga Kerja" value={`${data.employees || 0} Orang`} color="bg-amber-50 text-amber-700" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InfoCard label="Sumber Air" value={data.waterSource || "-"} icon={<Factory size={16} />} />
                    <InfoCard label="Sumber Energi" value={data.powerSource || "-"} icon={<Factory size={16} />} />
                    <InfoCard label="Jam Operasional" value={data.operationalHours || "-"} icon={<ClipboardList size={16} />} />
                  </div>
                  <div className="bg-white p-6 rounded-none border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Bahan Baku Utama</p>
                    <p className="text-sm font-semibold text-slate-700 leading-relaxed">{data.rawMaterials || "Tidak ada data."}</p>
                  </div>
                  {data.wasteInfo && (
                    <div className="bg-white p-6 rounded-none border border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Informasi Limbah</p>
                      <p className="text-sm font-semibold text-slate-700 leading-relaxed">{data.wasteInfo}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-4 rounded-none border border-slate-200 bg-white">
                    <div className={cn("w-5 h-5 rounded-none flex items-center justify-center shrink-0", data.hasTps ? "bg-emerald-500" : "bg-slate-300")}>
                      <CheckCircle2 size={12} className="text-white" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">
                      {data.hasTps ? "Memiliki TPS Limbah" : "Belum memiliki TPS Limbah"}
                    </span>
                  </div>
                </TabsContent>

                {/* TAB: LAMPIRAN DOKUMEN */}
                <TabsContent value="dokumen" className="flex-1 p-8 mt-0">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Berkas yang Diunggah Perusahaan</h3>
                    <div className="space-y-3">
                      {/* Hanya render berkas standar jika datanya ada atau jika bukan AMDAL manual */}
                      {(!isAmdalJson || nibUrl) && (
                        <DocPreviewRow
                          label="Scan NIB (Nomor Induk Berusaha)"
                          url={nibUrl}
                          required
                          onPreview={() => nibUrl && setPreviewDoc(nibUrl)}
                        />
                      )}
                      {(!isAmdalJson || npwpUrl) && (
                        <DocPreviewRow
                          label="Scan NPWP Perusahaan"
                          url={npwpUrl}
                          required
                          onPreview={() => npwpUrl && setPreviewDoc(npwpUrl)}
                        />
                      )}
                      {(!isAmdalJson || siteplanUrl) && (
                        <DocPreviewRow
                          label="Siteplan / Layout Lokasi"
                          url={siteplanUrl}
                          required={false}
                          onPreview={() => siteplanUrl && setPreviewDoc(siteplanUrl)}
                        />
                      )}
                      {!isAmdalJson && (
                        <DocPreviewRow
                          label={`Matriks Isian Teknis (${docLabel})`}
                          url={docUrl(data.docTemplateUrl)}
                          required
                          onPreview={() => data.docTemplateUrl && setPreviewDoc(docUrl(data.docTemplateUrl))}
                        />
                      )}

                      {/* Jika AMDAL manual, render 11 berkas AMDAL dari JSON */}
                      {isAmdalJson && parsedAmdalDocs && (
                        <div className="pt-4 border-t border-slate-200 mt-4">
                          <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-wider mb-3">
                            Daftar Berkas Wajib AMDAL & Pendukung (11 Dokumen)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {AMDAL_DOCS_CONFIG.map((doc) => {
                              const docFile = parsedAmdalDocs ? parsedAmdalDocs[doc.key] : null;
                              return (
                                <DocPreviewRow
                                  key={doc.key}
                                  label={doc.label}
                                  url={docFile ? docFile.base64Data : null}
                                  required={doc.isRequired}
                                  downloadName={docFile ? docFile.fileName : undefined}
                                  onPreview={() => docFile && setPreviewDoc(docFile.base64Data)}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </TabsContent>

                {/* TAB: GIS */}
                <TabsContent value="gis" className="flex-1 p-8 mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 aspect-video bg-slate-200 rounded-none border-4 border-white shadow-lg relative overflow-hidden z-10">
                      {isOpen && data?.lat && data?.lng ? (
                        <MapContainer
                          center={[parseFloat(data.lat) || -6.9175, parseFloat(data.lng) || 107.6191]}
                          zoom={15}
                          style={{ height: "100%", width: "100%" }}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker position={[parseFloat(data.lat) || -6.9175, parseFloat(data.lng) || 107.6191]}>
                            <Popup>
                              <div className="p-2 text-slate-800 text-xs font-sans text-left space-y-1">
                                <h4 className="font-black text-slate-900">{data.companyName}</h4>
                                <p className="text-[10px] text-slate-500 font-medium leading-tight">{data.address}</p>
                                <p className="text-[9px] text-emerald-600 font-bold uppercase">Koordinat: {data.lat}, {data.lng}</p>
                              </div>
                            </Popup>
                          </Marker>
                          <ResizeMap />
                        </MapContainer>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 gap-2">
                          <MapPin className="text-slate-400 animate-bounce" size={32} />
                          <p className="text-slate-400 text-xs font-bold">Koordinat GPS tidak valid atau belum ditentukan</p>
                        </div>
                      )}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${data.lat},${data.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-4 right-4 z-[999] flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-bold px-3 py-2 rounded-none hover:bg-white shadow-md transition-all border border-slate-200"
                      >
                        <ExternalLink size={12} /> Buka di Google Maps
                      </a>
                    </div>
                    <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm flex flex-col gap-5">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Latitude</p>
                        <p className="text-lg font-black text-slate-800 font-mono">{data.lat || "-"}</p>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Longitude</p>
                        <p className="text-lg font-black text-slate-800 font-mono">{data.lng || "-"}</p>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Alamat</p>
                        <p className="text-xs font-semibold text-slate-600 leading-relaxed">{data.address || "-"}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* KOLOM KANAN: Keputusan Verifikasi */}
            <div className="w-full md:w-[340px] bg-white border-l border-slate-200 p-8 flex flex-col gap-6 shrink-0 text-left overflow-y-auto custom-scrollbar">

              {/* Status saat ini */}
              <div className="p-4 bg-slate-50 rounded-none space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Saat Ini</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`${currentStatusColor[data.status] || "bg-slate-100 text-slate-500"} border-none px-3 py-1.5 text-[11px] font-black`}>
                    {data.status}
                  </Badge>
                </div>
              </div>

              {/* Aksi Keputusan */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Keputusan Petugas DLH</h4>
                <div className="space-y-2">
                  <DecisionCard
                    active={decision === "APPROVE"}
                    onClick={() => setDecision("APPROVE")}
                    icon={<CheckCircle2 size={18} className="text-emerald-500" />}
                    label="Setujui Pendaftaran"
                    sublabel="Perusahaan mendapat status APPROVED"
                    color="bg-emerald-50 border-emerald-400"
                  />
                  <DecisionCard
                    active={decision === "REVISION"}
                    onClick={() => setDecision("REVISION")}
                    icon={<AlertTriangle size={18} className="text-amber-500" />}
                    label="Minta Revisi Berkas"
                    sublabel="Kembalikan untuk perbaikan dokumen"
                    color="bg-amber-50 border-amber-400"
                  />
                  <DecisionCard
                    active={decision === "REJECT"}
                    onClick={() => setDecision("REJECT")}
                    icon={<XCircle size={18} className="text-rose-500" />}
                    label="Tolak Pendaftaran"
                    sublabel="Berkas tidak memenuhi persyaratan"
                    color="bg-rose-50 border-rose-400"
                  />
                </div>
              </div>

              {/* Catatan Alasan — hanya muncul jika Revisi atau Tolak */}
              {(decision === "REVISION" || decision === "REJECT") && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <label className="flex items-center gap-1.5 text-xs font-black text-slate-500 uppercase tracking-widest">
                    <MessageSquare size={12} />
                    Catatan / Alasan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={catatanRevisi}
                    onChange={(e) => setCatatanRevisi(e.target.value)}
                    rows={4}
                    className="w-full rounded-none border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none transition-all"
                    placeholder={
                      decision === "REVISION"
                        ? "Sebutkan dokumen mana yang perlu diperbaiki..."
                        : "Jelaskan alasan penolakan secara spesifik..."
                    }
                  />
                </div>
              )}

              {/* Tombol Simpan */}
              <div className="mt-auto pt-4 border-t border-slate-100 space-y-2">
                <Button
                  disabled={!decision || isSaving}
                  onClick={handleSave}
                  className={cn(
                    "w-full h-14 rounded-none font-black text-base transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed",
                    decision === "APPROVE" && "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200",
                    decision === "REVISION" && "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200",
                    decision === "REJECT" && "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200",
                    !decision && "bg-slate-900 text-white"
                  )}
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2 justify-center">
                      <Loader2 size={18} className="animate-spin" /> MEMPROSES...
                    </span>
                  ) : (
                    !decision ? "PILIH KEPUTUSAN" :
                      decision === "APPROVE" ? "✅ SETUJUI SEKARANG" :
                        decision === "REVISION" ? "📋 KIRIM PERMINTAAN REVISI" :
                          "❌ TOLAK PENDAFTARAN"
                  )}
                </Button>
                <p className="text-center text-[10px] text-slate-400 font-bold">
                  Keputusan akan langsung tersinkron ke database & notifikasi perusahaan
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-screen document preview overlay */}
      {previewDoc && (
        <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
          <DialogContent className="w-full max-w-[95vw] lg:max-w-7xl h-[95vh] p-0 overflow-hidden rounded-none border-none shadow-2xl flex flex-col bg-slate-950 z-50 text-left">
            {/* THIN ULTRA-COMPACT HEADER */}
            <div className="bg-slate-900 text-white px-5 h-12 flex justify-between items-center shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-none bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <FileText size={14} />
                </div>
                <div className="truncate">
                  <span className="text-xs font-black tracking-wider text-slate-100 uppercase mr-2 border-r border-slate-700 pr-2">PRATINJAU</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase truncate">{data.companyName}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewDoc}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white px-3 h-8 rounded-none text-[10px] font-black uppercase tracking-wider transition-all border border-slate-700 hover:border-emerald-500 shadow-sm"
                >
                  <Download size={12} /> Unduh Berkas
                </a>
                <div className="w-px h-5 bg-slate-800 mx-0.5" />
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-none transition-all"
                  title="Tutup"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* FULL-SIZE CANVAS PREVIEW */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
              <DocPreviewer fileUrl={previewDoc} companyId={data.id} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function InfoCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-none border border-slate-200 p-5 flex items-start gap-4">
      <div className="w-9 h-9 rounded-none bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-sm font-bold text-slate-900 break-words leading-snug">{value || "-"}</p>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`${color} rounded-none p-5 space-y-1`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</p>
      <p className="text-base font-black leading-tight">{value}</p>
    </div>
  );
}

function DocPreviewRow({ label, url, required, onPreview, downloadName }: {
  label: string;
  url: string | null;
  required: boolean;
  onPreview: () => void;
  downloadName?: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-none border border-slate-200 shadow-sm hover:border-emerald-300 transition-all group">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          "w-9 h-9 rounded-none flex items-center justify-center shrink-0",
          url ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
        )}>
          <FileText size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-black text-slate-700 truncate">{label}</p>
          {url ? (
            <p className="text-[10px] text-emerald-600 font-bold">
              ✓ File tersedia {downloadName ? `(${downloadName})` : ""}
            </p>
          ) : (
            <p className={cn("text-[10px] font-bold", required ? "text-red-500" : "text-slate-400 italic")}>
              {required ? "⚠ Belum diunggah (Wajib)" : "Tidak diunggah (Opsional)"}
            </p>
          )}
        </div>
      </div>
      {url && (
        <div className="flex items-center gap-1.5 ml-3 shrink-0">
          <button
            onClick={onPreview}
            className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 px-2.5 py-1.5 rounded-none transition-all"
          >
            <Eye size={11} /> Preview
          </button>
          <a
            href={url}
            download={downloadName || "dokumen"}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-2.5 py-1.5 rounded-none transition-all"
          >
            <Download size={11} /> Unduh
          </a>
        </div>
      )}
    </div>
  );
}

function DecisionCard({ active, onClick, icon, label, sublabel, color }: any) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-none border-2 cursor-pointer transition-all",
        active ? color : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="text-sm font-black text-slate-800 tracking-tight">{label}</span>
        </div>
        <div className={cn(
          "w-4.5 h-4.5 rounded-none border-2 flex items-center justify-center shrink-0",
          active ? "border-slate-900 bg-slate-900" : "border-slate-300"
        )}>
          {active && <div className="w-2 h-2 bg-white rounded-none" />}
        </div>
      </div>
      <p className="text-[10px] text-slate-400 font-bold ml-7 leading-snug">{sublabel}</p>
    </div>
  );
}
