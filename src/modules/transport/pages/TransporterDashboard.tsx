// src/modules/transport/pages/TransporterDashboard.tsx
import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, CheckCircle2, Clock, MapPin } from "lucide-react";

// Mengimpor Sub-Komponen Modular Transporter (Prinsip GRASP: Low Coupling) [3]
import ActiveManifests from "../components/ActiveManifests";
import IncomingBids from "../components/IncomingBids";
import PricingBidModal from "../components/PricingBidModal";
import EvidenceUploadModal from "../components/EvidenceUploadModal";

export default function TransporterDashboard() {
  const { pickupRequests, currentUser, fetchPickupRequests, updatePickupStatus } = useSijagaStore();
  const transporterId = currentUser?.transporterId || "TRANS-001";

  // State Pengendali Modal Penawaran Harga [3]
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [pricingOpen, setPricingOpen] = useState(false);

  // State Pengendali Modal Serah Terima Selesai [3]
  const [evidenceRequest, setEvidenceRequest] = useState<any>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  useEffect(() => {
    fetchPickupRequests();
  }, [fetchPickupRequests]);

  // Melakukan kalkulasi statistik terpusat di Shell (Information Expert) [3]
  const myRequests = useMemo(() => {
    return pickupRequests.filter(p => p.transporterId === transporterId);
  }, [pickupRequests, transporterId]);

  const pendingBidsCount = useMemo(() => {
    return myRequests.filter(p => p.status === "PENDING").length;
  }, [myRequests]);

  const activePickupsCount = useMemo(() => {
    return myRequests.filter(p => p.status !== "PENDING" && p.status !== "COMPLETED").length;
  }, [myRequests]);

  // Adopsi Fitur Baru: Daftar pengangkutan selesai (COMPLETED) [3]
  const completedPickups = useMemo(() => {
    return myRequests.filter(p => p.status === "COMPLETED");
  }, [myRequests]);

  const handleSelectRequest = (req: any) => {
    setSelectedRequest(req);
    setPricingOpen(true);
  };

  const handlePreComplete = (req: any) => {
    setEvidenceRequest(req);
    setEvidenceOpen(true);
  };

  return (
    <DashboardLayout role="PENGANGKUT">
      <div className="space-y-4 text-left animate-in fade-in duration-300"> {/* DIET: space-y-8 -> space-y-4 */}

        {/* --- 1. HEADER BRIEF & STATUS LISENSI (GFW TACTICAL) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 rounded-none border border-slate-200 shadow-none p-4 bg-white flex flex-col justify-between">
            <div className="space-y-1">
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Order Pengangkutan Limbah</h1>
              <p className="text-slate-500 font-medium text-xs mt-1.5">
                Kelola pesanan penjemputan limbah industri, jalankan tracking armada, dan manifest pengangkutan B3.
              </p>
            </div>

            <div className="flex gap-4 mt-4">
              <div className="p-3 bg-slate-50 rounded-none flex-1 border border-slate-200 text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Order Aktif</p>
                <h4 className="text-lg font-black text-slate-800 tracking-tighter mt-1.5 italic leading-none">{activePickupsCount} Penjemputan</h4>
              </div>
              <div className="p-3 bg-slate-50 rounded-none flex-1 border border-slate-200 text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Tunggu Bid</p>
                <h4 className="text-lg font-black text-slate-800 tracking-tighter mt-1.5 italic leading-none">{pendingBidsCount} Permintaan</h4>
              </div>
            </div>
          </Card>

          {/* License Status Card (Sharp & Flat) */}
          <Card className="rounded-none border border-slate-200 bg-slate-900 text-white p-4 flex flex-col justify-between shadow-none">
            <div className="space-y-1.5">
              <div className="w-8 h-8 bg-white/10 rounded-none flex items-center justify-center text-emerald-400 border border-white/5">
                <Truck size={16} />
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pt-2 leading-none">Kepatuhan Lisensi Transporter</p>
              <h2 className="text-sm font-black tracking-widest text-white uppercase mt-1 leading-none">
                Aktif & Berlisensi
              </h2>
              <p className="text-[10px] text-slate-400 leading-relaxed font-semibold mt-1">
                Izin Operasional Angkutan B3 dari DLH Provinsi berlaku s.d. 31 Des 2028. Seluruh e-manifest terintegrasi dinas.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 p-2 rounded-none mt-4">
              <span className="w-2 h-2 bg-emerald-500 rounded-none animate-ping shrink-0" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none">E-Manifest Online</span>
            </div>
          </Card>
        </div>

        {/* --- 2. DOUBLE PANEL ACTIVE ACTIVITIES --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* SISI KIRI (8 Kolom): Operasional Armada Aktif */}
          <div className="lg:col-span-8 h-[calc(100vh-290px)]">
            <ActiveManifests
              onStartPickup={(id) => updatePickupStatus(id, "ON_THE_ROAD")}
              onLoadWaste={(id) => updatePickupStatus(id, "LOADED")}
              onPreComplete={handlePreComplete}
            />
          </div>

          {/* SISI KANAN (4 Kolom): Penugasan Baru (Tunggu Bidding) */}
          <div className="lg:col-span-4 h-[calc(100vh-290px)]">
            <IncomingBids onSelectRequest={handleSelectRequest} />
          </div>

        </div>

        {/* --- 3. ADOPSI FITUR BARU: LOG AKTIVITAS SELESAI (GFW TACTICAL) [3] --- */}
        <Card className="rounded-none border border-slate-200 p-4 bg-white shadow-none space-y-4">
          <div className="border-b pb-3 flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500 shrink-0" size={14} />
            <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest leading-none">Log Aktivitas (Selesai)</h3>
          </div>

          {completedPickups.length === 0 ? (
            <div className="py-8 text-center text-slate-400 border border-slate-100 rounded-none bg-slate-50/50">
              <CheckCircle2 className="mx-auto text-slate-200 mb-1.5" size={24} />
              <p className="text-[10px] font-black uppercase tracking-widest">Belum ada tugas yang diselesaikan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {completedPickups.map((pick) => (
                <div key={pick.id} className="p-3 border border-slate-200 rounded-none bg-slate-50/50 flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-50 text-emerald-600 border border-emerald-150 rounded-none flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="text-left overflow-hidden">
                    <span className="font-black text-slate-400 text-[8px] uppercase tracking-widest font-mono leading-none block">{pick.id}</span>
                    <h4 className="font-bold text-slate-800 text-xs mt-1 truncate leading-none">{pick.companyName}</h4>
                    <p className="text-[10px] font-semibold text-slate-500 mt-1.5 leading-none">
                      {pick.wasteType} • <span className="font-bold text-emerald-700">Aktual: {pick.actualVolume || pick.volume}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* --- 4. MODULAR MODALS --- */}
        {selectedRequest && (
          <PricingBidModal
            isOpen={pricingOpen}
            onClose={() => {
              setPricingOpen(false);
              setSelectedRequest(null);
            }}
            selectedRequest={selectedRequest}
          />
        )}

        {/* Upload Evidence Dialog - Seluruh penanganan multi-photo & actual volume dienkapsulasi penuh */}
        {evidenceRequest && (
          <EvidenceUploadModal
            isOpen={evidenceOpen}
            onClose={() => {
              setEvidenceOpen(false);
              setEvidenceRequest(null);
            }}
            evidenceRequest={evidenceRequest}
          />
        )}

      </div>
    </DashboardLayout>
  );
}