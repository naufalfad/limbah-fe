import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Truck, DollarSign, Wallet, CheckCircle2,
  MapPin, Clock, ArrowRight, Upload, Sparkles, Plus
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function TransporterDashboard() {
  const navigate = useNavigate();
  const {
    currentUser, pickupRequests, setPickupPrice, updatePickupStatus, fetchPickupRequests
  } = useSijagaStore();

  useEffect(() => {
    fetchPickupRequests();
  }, [fetchPickupRequests]);

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [evidenceRequest, setEvidenceRequest] = useState<any>(null);
  const [evidencePhotos, setEvidencePhotos] = useState<string[]>([]);
  const [actualVolume, setActualVolume] = useState("");
  const [transportReport, setTransportReport] = useState("");

  const transporterDbId = currentUser?.id;

  // STRICT FILTER: Match exactly the UUID of the transporter
  const myRequests = pickupRequests.filter(p => p.transporterId === transporterDbId);
  const incomingTasks = myRequests.filter(p => p.status === "PAID");
  const activePickups = myRequests.filter(p => p.status === "ON_THE_ROAD" || p.status === "LOADED");
  const completedPickups = myRequests.filter(p => p.status === "COMPLETED");

  const handleStartPickup = (id: string) => {
    updatePickupStatus(id, "ON_THE_ROAD");
    toast.success("Status diperbarui: Armada sedang meluncur ke lokasi.");
  };

  const handleLoadWaste = (id: string) => {
    updatePickupStatus(id, "LOADED");
    toast.success("Status diperbarui: Limbah telah dimuat ke tangki armada.");
  };

  const handlePreComplete = (req: any) => {
    setEvidenceRequest(req);
    // Auto-fill dummy photo path for simulation
    setEvidencePhoto("https://images.unsplash.com/photo-1618090584126-129cd1f3f94c?w=400&auto=format&fit=crop&q=60");
  };

  const handleCompletePickup = () => {
    if (!actualVolume || !transportReport) {
      toast.error("Volume aktual dan laporan penjemputan wajib diisi!");
      return;
    }
    const photoPayload = evidencePhotos.length > 0 ? JSON.stringify(evidencePhotos) : "";
    updatePickupStatus(evidenceRequest.id, "COMPLETED", { evidencePhoto: photoPayload, actualVolume, transportReport });
    toast.success("Order pengangkutan selesai! Bukti serah terima berhasil diunggah.");
    setEvidenceRequest(null);
    setEvidencePhotos([]);
    setActualVolume("");
    setTransportReport("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      Promise.all(files.map(f => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(f);
        });
      })).then(newPhotos => {
        setEvidencePhotos(prev => [...prev, ...newPhotos]);
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      PENDING: "bg-slate-100 text-slate-600 border-slate-200",
      PRICED: "bg-blue-50 text-blue-600 border-blue-100",
      PAID: "bg-amber-50 text-amber-600 border-amber-100",
      ON_THE_ROAD: "bg-indigo-50 text-indigo-600 border-indigo-100 animate-pulse",
      LOADED: "bg-purple-50 text-purple-600 border-purple-100",
      COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-100"
    };
    const labels: any = {
      PENDING: "Tunggu Bid",
      PRICED: "Menunggu Bayar",
      PAID: "Perlu Dijemput",
      ON_THE_ROAD: "Di Jalan",
      LOADED: "Limbah Dimuat",
      COMPLETED: "Selesai"
    };
    return <Badge className={`${styles[status]} border font-black text-[9px] uppercase tracking-wider`}>{labels[status] || status}</Badge>;
  };

  return (
    <DashboardLayout role="PENGANGKUT">
      <div className="space-y-8 text-left">

        {/* Header & Wallet Alternative */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 rounded-[2rem] border-none shadow-sm p-8 bg-white flex flex-col justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Order Pengangkutan Limbah</h1>
              <p className="text-slate-500 font-medium text-sm mt-2">
                Kelola pesanan penjemputan limbah industri, jalankan tracking armada, dan manifest pengangkutan B3.
              </p>
            </div>

            <div className="flex gap-4 mt-6">
              <div className="p-4 bg-slate-50 rounded-2xl flex-1 border">
                <p className="text-[10px] font-black text-slate-400 uppercase">Tugas Baru</p>
                <h4 className="text-2xl font-black text-slate-800 tracking-tighter mt-1">{incomingTasks.length} Permintaan</h4>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl flex-1 border">
                <p className="text-[10px] font-black text-slate-400 uppercase">Sedang Berjalan</p>
                <h4 className="text-2xl font-black text-slate-800 tracking-tighter mt-1">{activePickups.length} Operasional</h4>
              </div>
            </div>
          </Card>

          <Card className="rounded-[2rem] border-none bg-slate-900 text-white p-8 flex flex-col justify-between shadow-xl">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400">
                <Truck size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Kepatuhan Lisensi Transporter</p>
              <h2 className="text-2xl font-black tracking-tight text-white mt-1">
                Aktif & Berlisensi
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mt-2">
                Izin Operasional Angkutan B3 dari DLH Provinsi berlaku s.d. 31 Des 2028. Seluruh manifest terintegrasi langsung dengan database EWS DLH.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 p-3 rounded-xl mt-6">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">E-Manifest Online</span>
            </div>
          </Card>
        </div>

        {/* Dynamic Activity Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Active Pickups & Controls */}
          <Card className="lg:col-span-8 rounded-[2rem] p-8 border-none shadow-xl shadow-slate-200/50 bg-white">
            <h3 className="font-black text-xl tracking-tight text-slate-800 mb-6">Operasional Armada Aktif</h3>

            {activePickups.length === 0 ? (
              <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                <Truck className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-sm font-bold">Tidak ada penjemputan aktif yang perlu diproses.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activePickups.map((pick) => (
                  <div key={pick.id} className="p-5 border border-slate-100 rounded-2xl hover:bg-slate-50/50 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-slate-800 text-sm">{pick.id}</span>
                        {getStatusBadge(pick.status)}
                      </div>
                      <h4 className="font-black text-slate-800 text-sm leading-none mt-1">{pick.companyName}</h4>
                      <p className="text-xs font-bold text-slate-500">{pick.wasteType} — {pick.volume}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                        <MapPin size={10} /> {pick.address}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-none pt-3 md:pt-0">
                      <Button
                        onClick={() => navigate("/transporter/tracking")}
                        variant="outline"
                        className="h-10 rounded-xl text-xs font-bold border-slate-200"
                      >
                        Peta Tracking
                      </Button>

                      {pick.status === "PAID" && (
                        <Button
                          onClick={() => handleStartPickup(pick.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-4 text-xs font-bold shadow-md shadow-emerald-50"
                        >
                          Jalan Jemput
                        </Button>
                      )}

                      {pick.status === "ON_THE_ROAD" && (
                        <Button
                          onClick={() => handleLoadWaste(pick.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-4 text-xs font-bold shadow-md shadow-indigo-50"
                        >
                          Muat Limbah
                        </Button>
                      )}

                      {pick.status === "LOADED" && (
                        <Button
                          onClick={() => handlePreComplete(pick)}
                          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-10 px-4 text-xs font-bold shadow-md shadow-purple-50"
                        >
                          Selesaikan Delivery
                        </Button>
                      )}

                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="lg:col-span-4 rounded-[2rem] p-8 border-none shadow-xl shadow-slate-200/50 bg-white flex flex-col">
            <h3 className="font-black text-xl tracking-tight text-slate-800 mb-6">Penugasan Baru</h3>

            <div className="space-y-4 flex-1 overflow-y-auto divide-y divide-slate-100">
              {incomingTasks.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Clock className="mx-auto text-slate-300 mb-2" size={24} />
                  <p className="text-xs font-bold">Belum ada tugas penjemputan baru.</p>
                </div>
              ) : (
                incomingTasks.map((pick) => (
                  <div key={pick.id} className="pt-4 first:pt-0 text-left space-y-3">
                    <div className="space-y-1">
                      <span className="font-black text-slate-800 text-xs">{pick.id}</span>
                      <h4 className="font-black text-slate-800 text-sm leading-tight">{pick.companyName}</h4>
                      <p className="text-[11px] font-bold text-slate-500">{pick.wasteType} — Estimasi: {pick.volume}</p>
                    </div>
                    <Button
                      onClick={() => handleStartPickup(pick.id)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-9 rounded-xl text-[10px] font-black tracking-wider uppercase"
                    >
                      Terima Tugas & Berangkat
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Riwayat Selesai */}
          <Card className="lg:col-span-12 rounded-[2rem] p-8 border-none shadow-xl shadow-slate-200/50 bg-white">
            <h3 className="font-black text-xl tracking-tight text-slate-800 mb-6 flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" size={24} /> Log Aktivitas (Selesai)
            </h3>
            
            {completedPickups.length === 0 ? (
              <div className="py-8 text-center text-slate-400 border border-slate-100 rounded-2xl bg-slate-50">
                <CheckCircle2 className="mx-auto text-slate-300 mb-2" size={24} />
                <p className="text-xs font-bold">Belum ada tugas yang diselesaikan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedPickups.map((pick) => (
                  <div key={pick.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50 flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <div className="text-left">
                      <span className="font-black text-slate-800 text-[10px]">{pick.id}</span>
                      <h4 className="font-black text-slate-800 text-sm leading-tight mt-0.5">{pick.companyName}</h4>
                      <p className="text-[10px] font-bold text-slate-500 mt-1">{pick.wasteType} &bull; Aktual: {pick.actualVolume || pick.volume}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>



        {/* Upload Evidence Dialog */}
        {evidenceRequest && (
          <Dialog open={!!evidenceRequest} onOpenChange={() => setEvidenceRequest(null)}>
            <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] bg-white border border-slate-200 text-left p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-800">Serah Terima Selesai</DialogTitle>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">Unggah foto muatan sampai di pusat pengelolaan</p>
              </DialogHeader>

              <div className="space-y-5 py-4">
                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center bg-slate-50 text-center relative overflow-hidden min-h-[160px]">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  {evidencePhotos.length > 0 ? (
                    <div className="w-full flex gap-3 overflow-x-auto z-0 pointer-events-none pb-2">
                      {evidencePhotos.map((photo, i) => (
                        <img key={i} src={photo} alt={`Preview ${i}`} className="h-24 w-24 object-cover rounded-xl shrink-0 border border-slate-200 shadow-sm" />
                      ))}
                      <div className="h-24 w-24 shrink-0 flex flex-col items-center justify-center bg-slate-200/50 rounded-xl text-slate-400 border border-slate-200 border-dashed">
                        <Plus size={20} />
                        <span className="text-[9px] font-bold uppercase mt-1">Tambah</span>
                      </div>
                    </div>
                  ) : (
                    <div className="z-0 pointer-events-none">
                      <Upload className="text-slate-400 mb-2 mx-auto" size={32} />
                      <p className="text-xs font-bold text-slate-600">Klik atau drop untuk multi-upload foto</p>
                      <p className="text-[10px] text-slate-400 mt-1">Bisa pilih lebih dari satu foto (PNG, JPG maks 5MB)</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Volume Aktual yang Diangkut</label>
                    <Input
                      placeholder="Contoh: 45 Liter"
                      value={actualVolume}
                      onChange={(e) => setActualVolume(e.target.value)}
                      className="rounded-xl h-12 border-slate-200 bg-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Catatan Tambahan (Opsional)</label>
                    <Input
                      placeholder="Contoh: Kondisi drum aman"
                      value={transportReport}
                      onChange={(e) => setTransportReport(e.target.value)}
                      className="rounded-xl h-12 border-slate-200 bg-white mt-1"
                    />
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="text-emerald-600 shrink-0" size={18} />
                  <div>
                    <h5 className="text-xs font-black text-emerald-950 leading-none">Validasi Manifest Selesai</h5>
                    <p className="text-[10px] text-emerald-700 leading-tight mt-1">Status order pengangkutan akan otomatis diperbarui menjadi SELESAI, dan dokumen BAP serta serah terima dikirimkan ke DLH.</p>
                  </div>
                </div>

                <Button
                  onClick={handleCompletePickup}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-1.5"
                >
                  Selesaikan Order <Sparkles size={16} />
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

      </div>
    </DashboardLayout>
  );
}
