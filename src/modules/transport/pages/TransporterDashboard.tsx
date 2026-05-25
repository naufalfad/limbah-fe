// src/modules/transport/pages/TransporterDashboard.tsx
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck } from "lucide-react";

// Mengimpor Sub-Komponen Modular Transporter
import ActiveManifests from "../components/ActiveManifests";
import IncomingBids from "../components/IncomingBids";
import PricingBidModal from "../components/PricingBidModal";
import EvidenceUploadModal from "../components/EvidenceUploadModal";

export default function TransporterDashboard() {
  const { pickupRequests, currentUser, fetchPickupRequests } = useSijagaStore();
  const transporterId = currentUser?.transporterId || "TRANS-001";

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [pricingOpen, setPricingOpen] = useState(false);

  const [evidenceRequest, setEvidenceRequest] = useState<any>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  useEffect(() => {
    fetchPickupRequests();
  }, [fetchPickupRequests]);

  // Melakukan kalkulasi statistik secara langsung di Shell (Information Expert)
  const myRequests = pickupRequests.filter(p => p.transporterId === transporterId);
  const pendingBidsCount = myRequests.filter(p => p.status === "PENDING").length;
  const activePickupsCount = myRequests.filter(p => p.status !== "PENDING" && p.status !== "COMPLETED").length;

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
      <div className="space-y-4 text-left"> {/* DIET: space-y-8 -> space-y-4 */}

        {/* Header & Wallet Alternative (Diet visual cards) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 rounded-none border border-slate-200 shadow-sm p-4 bg-white flex flex-col justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Order Pengangkutan Limbah</h1>
              <p className="text-slate-500 font-medium text-xs">
                Kelola pesanan penjemputan limbah industri, jalankan tracking armada, dan manifest pengangkutan B3.
              </p>
            </div>

            <div className="flex gap-4 mt-4">
              <div className="p-3 bg-slate-50 rounded-none flex-1 border border-slate-200 text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Order Aktif</p>
                <h4 className="text-xl font-black text-slate-800 tracking-tighter mt-1 italic">{activePickupsCount} Penjemputan</h4>
              </div>
              <div className="p-3 bg-slate-50 rounded-none flex-1 border border-slate-200 text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tunggu Bid</p>
                <h4 className="text-xl font-black text-slate-800 tracking-tighter mt-1 italic">{pendingBidsCount} Permintaan</h4>
              </div>
            </div>
          </Card>

          {/* License Status Card (Sharp & Flat) */}
          <Card className="rounded-none border border-slate-200 bg-slate-900 text-white p-4 flex flex-col justify-between shadow-sm">
            <div className="space-y-1.5">
              <div className="w-8 h-8 bg-white/10 rounded-none flex items-center justify-center text-emerald-400">
                <Truck size={16} />
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pt-2">Kepatuhan Lisensi Transporter</p>
              <h2 className="text-lg font-black tracking-tight text-white uppercase">
                Aktif & Berlisensi
              </h2>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Izin Operasional Angkutan B3 dari DLH Provinsi berlaku s.d. 31 Des 2028. Seluruh manifest terintegrasi langsung dengan database EWS DLH.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 p-2 rounded-none mt-4">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-none animate-ping shrink-0" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">E-Manifest Online</span>
            </div>
          </Card>
        </div>

        {/* Dynamic Activity Lists (Diet Gaps & Modular components) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Active Pickups & Controls */}
          <div className="lg:col-span-8 h-[calc(100vh-290px)]">
            <ActiveManifests
              onStartPickup={(id) => useSijagaStore.getState().updatePickupStatus(id, "ON_THE_ROAD")}
              onLoadWaste={(id) => useSijagaStore.getState().updatePickupStatus(id, "LOADED")}
              onPreComplete={handlePreComplete}
            />
          </div>

          {/* Incoming Orders Box (Tunggu Bidding) */}
          <div className="lg:col-span-4 h-[calc(100vh-290px)]">
            <IncomingBids onSelectRequest={handleSelectRequest} />
          </div>

        </div>

        {/* Pricing Modal */}
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

        {/* Upload Evidence Dialog */}
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