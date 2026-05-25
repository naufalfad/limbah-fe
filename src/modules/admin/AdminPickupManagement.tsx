import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useSijagaStore } from '@/store/useSijagaStore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, MapPin, CheckCircle, Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminPickupManagement() {
  const { pickupRequests, transporters, fetchPickupRequests, fetchTransporters, assignPickupTransporter } = useSijagaStore();
  const [selectedTransporters, setSelectedTransporters] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPickupRequests();
    fetchTransporters();
  }, []);

  const paidRequests = pickupRequests.filter(r => r.status !== 'PENDING' && r.status !== 'PRICED');

  const handleAssign = (pickupId: string) => {
    const transporterId = selectedTransporters[pickupId];
    if (!transporterId) return;
    
    const transporter = transporters.find(t => t.id === transporterId);
    if (transporter) {
      assignPickupTransporter(pickupId, transporter.id, transporter.name);
    }
  };

  return (
    <DashboardLayout role="ADMIN_DLH">
      <div className="space-y-8 text-left">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            PENUGASAN <span className="text-emerald-600 italic">PENGANGKUTAN.</span>
          </h1>
          <p className="text-slate-500 font-medium">Atur dan tugaskan armada untuk pengambilan limbah yang telah lunas.</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {paidRequests.length === 0 ? (
            <Card className="p-12 text-center border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-white">
              <Package className="mx-auto h-16 w-16 text-slate-300 mb-4" />
              <h3 className="text-xl font-black text-slate-700">Belum Ada Request Lunas</h3>
              <p className="text-slate-500 font-medium">Request akan muncul di sini setelah perusahaan membayar tagihan.</p>
            </Card>
          ) : (
            paidRequests.map(req => (
              <Card key={req.id} className="p-6 border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all hover:translate-y-[-2px]">
                
                {/* Info Request */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
                      <Truck size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-slate-900">{req.companyName}</h3>
                      <p className="text-sm font-bold text-slate-500">{req.wasteType} &bull; {req.volume}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <MapPin size={16} className="text-emerald-600" />
                    <span>{req.address || "Lokasi pabrik utama"}</span>
                  </div>
                  
                  {/* Laporan Transporter */}
                  {req.status === 'COMPLETED' && (
                    <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-emerald-800">
                        <CheckCircle size={16} /> Laporan Penjemputan Final
                      </div>
                      <p className="text-sm font-medium text-emerald-700">Volume Aktual: {req.actualVolume || "Tidak dilaporkan"}</p>
                      <p className="text-sm text-emerald-600 italic">Catatan: "{req.transportReport || "-"}"</p>
                    </div>
                  )}
                </div>

                {/* Status & Aksi */}
                <div className="flex flex-col gap-4 min-w-[250px]">
                  <div className="text-right flex items-center justify-end gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Status</span>
                    <Badge className={
                      req.status === 'PAID' ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                      req.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" :
                      "bg-blue-100 text-blue-700 hover:bg-blue-100"
                    }>
                      {req.status}
                    </Badge>
                  </div>

                  {!req.transporterId && req.status === 'PAID' ? (
                    <div className="space-y-3">
                      <Select 
                        value={selectedTransporters[req.id]} 
                        onValueChange={(val) => setSelectedTransporters(prev => ({...prev, [req.id]: val}))}
                      >
                        <SelectTrigger className="w-full h-12 rounded-xl bg-slate-50 border-none font-medium">
                          <SelectValue placeholder="Pilih Akun Pengangkut" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border rounded-xl shadow-2xl z-50 text-slate-900 min-w-[200px]">
                          {transporters.map(t => (
                            <SelectItem key={t.id} value={t.id} className="font-medium cursor-pointer py-3 hover:bg-slate-50">
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={() => handleAssign(req.id)}
                        disabled={!selectedTransporters[req.id]}
                        className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold uppercase tracking-wider"
                      >
                        Tugaskan
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-xl text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Ditugaskan Kepada</p>
                      <p className="font-bold text-slate-800">{req.transporterName}</p>
                    </div>
                  )}
                </div>

              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
