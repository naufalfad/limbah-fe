import React, { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Truck, Plus, ArrowUpRight, DollarSign, Calendar, MapPin, CheckCircle2,
  Sparkles, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function PickupRequestPage() {
  const { currentUser, companies, pickupRequests, createPickupRequest, selectedCompanyId, fetchPickupRequests } = useSijagaStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Sync data with backend API
  React.useEffect(() => {
    if (selectedCompanyId) {
      fetchPickupRequests(selectedCompanyId);
    }
  }, [selectedCompanyId, fetchPickupRequests]);

  // Form states
  const [wasteType, setWasteType] = useState("Oli Bekas");
  const [volume, setVolume] = useState("");
  const [unit, setUnit] = useState("L");
  const [date, setDate] = useState("");
  const [address, setAddress] = useState("");

  // Find company
  const company = companies.find(c => c.id === selectedCompanyId) || companies.find(c => c.id === currentUser?.companyId) || companies[0];

  if (!company) {
    return (
      <DashboardLayout role="PERUSAHAAN">
        <div className="max-w-4xl mx-auto py-12 text-left font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 md:p-12 relative overflow-hidden border border-slate-800 shadow-2xl">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px]" />
            <div className="relative z-10 space-y-6 max-w-xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider animate-pulse">
                <Sparkles size={14} /> Hubungkan Perusahaan
              </div>
              <h1 className="text-3xl font-black italic tracking-tighter leading-tight">
                Belum Ada Perusahaan Terdaftar
              </h1>
              <p className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed">
                Untuk dapat mengakses modul Jasa Pengangkutan Limbah B3, Anda harus mendaftarkan profil badan usaha atau perusahaan Anda terlebih dahulu ke sistem. Satu akun dapat mengelola beberapa perusahaan sekaligus.
              </p>
              <div className="pt-4">
                <Button 
                  onClick={() => navigate("/company/register")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm px-8 py-6 rounded-2xl shadow-lg shadow-emerald-950/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  Registrasi Perusahaan Baru <ChevronRight size={18} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const myPickups = company ? pickupRequests.filter(p => p.companyId === company.id) : [];

  // Initialize address on load
  React.useEffect(() => {
    if (company && company.address) {
      setAddress(company.address);
    }
  }, [company]);

  // Cost estimator logic
  const volumeNumber = parseFloat(volume) || 0;
  const estimatedCost = volumeNumber * 10000; // Rp 10.000 per unit

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) {
      toast.error("Anda harus mendaftarkan perusahaan terlebih dahulu.");
      return;
    }
    if (!volume || volumeNumber <= 0) {
      toast.error("Volume penjemputan wajib diisi");
      return;
    }
    if (!date) {
      toast.error("Tanggal penjemputan wajib diisi");
      return;
    }
    if (!address) {
      toast.error("Alamat penjemputan wajib diisi");
      return;
    }

    try {
      await createPickupRequest({
        companyId: company.id,
        companyName: company.companyName,
        wasteType,
        volume: `${volume} ${unit}`,
        date,
        address,
      });

      setIsDialogOpen(false);
      // Reset Form
      setVolume("");
      setDate("");
    } catch (error: any) {
      const serverMsg = error.response?.data?.error || error.response?.data?.message || "Gagal mengajukan permintaan penjemputan.";
      toast.error(serverMsg);
      console.error("API Error:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      PENDING: "bg-slate-100 text-slate-600 border-slate-200",
      PRICED: "bg-blue-50 text-blue-600 border-blue-100 animate-pulse",
      PAID: "bg-amber-50 text-amber-600 border-amber-100",
      ON_THE_ROAD: "bg-indigo-50 text-indigo-600 border-indigo-100",
      LOADED: "bg-purple-50 text-purple-600 border-purple-100",
      COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-100"
    };
    const labels: any = {
      PENDING: "Menunggu Harga",
      PRICED: "Perlu Dibayar",
      PAID: "Menunggu Penjemputan",
      ON_THE_ROAD: "Armada Di Jalan",
      LOADED: "Limbah Dimuat",
      COMPLETED: "Selesai & Tersalurkan"
    };
    return <Badge className={`${styles[status]} border font-black text-[9px] uppercase tracking-wider`}>{labels[status] || status}</Badge>;
  };

  return (
    <DashboardLayout role="PERUSAHAAN">
      <div className="space-y-8 text-left">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Jasa Pengangkutan Limbah</h1>
            <p className="text-slate-500 font-medium mt-2">Ajukan pengangkutan limbah berbahaya (B3) Anda ke transporter berlisensi.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto h-12 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 font-bold gap-2 px-6 rounded-xl">
                <Plus size={18} /> Request Pickup Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] bg-white border border-slate-200 text-left p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-800">Ajukan Pickup Limbah</DialogTitle>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">Biaya dihitung otomatis, harap segera lunasi tagihan</p>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Jenis Limbah</label>
                  <Select value={wasteType} onValueChange={setWasteType}>
                    <SelectTrigger className="rounded-xl h-12 bg-white border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border text-slate-900">
                      <SelectItem value="Oli Bekas">Oli Bekas (B3)</SelectItem>
                      <SelectItem value="Limbah Cair Kimia">Limbah Cair Kimia</SelectItem>
                      <SelectItem value="Minyak Jelantah">Minyak Jelantah</SelectItem>
                      <SelectItem value="Limbah Padat B3">Limbah Padat B3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Volume Muatan</label>
                    <Input 
                      type="number" 
                      placeholder="Contoh: 50" 
                      value={volume}
                      onChange={(e) => setVolume(e.target.value)}
                      className="rounded-xl h-12 border-slate-200 bg-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Satuan</label>
                    <Select value={unit} onValueChange={setUnit}>
                      <SelectTrigger className="rounded-xl h-12 bg-white border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border text-slate-900">
                        <SelectItem value="L">Liter (L)</SelectItem>
                        <SelectItem value="kg">Kilogram (kg)</SelectItem>
                        <SelectItem value="m³">Meter Kubik (m³)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Tanggal Pickup Rencana</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="rounded-xl h-12 pl-12 border-slate-200 bg-white text-slate-600" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Alamat Lengkap Titik Jemput</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 text-slate-400" size={16} />
                    <textarea 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full min-h-[80px] rounded-xl border border-slate-200 pl-12 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                      placeholder="Masukkan alamat pabrik/bengkel detail..."
                    />
                  </div>
                </div>

                {/* Estimate Section */}
                {volumeNumber > 0 && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="text-emerald-600" size={18} />
                      <span className="text-xs font-bold text-emerald-900">Estimasi Biaya Awal</span>
                    </div>
                    <span className="font-black text-emerald-800 text-sm italic">Rp {estimatedCost.toLocaleString()}</span>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl shadow-lg shadow-emerald-100">
                    Ajukan Penjemputan
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pickup Requests Table */}
        <Card className="border-none shadow-sm ring-1 ring-slate-200 rounded-[2rem] overflow-hidden bg-white">
          <div className="p-6 border-b bg-slate-50/50">
            <h3 className="font-black text-slate-800 tracking-tight">Riwayat Pengangkutan Limbah</h3>
          </div>

          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-none">
                <TableHead className="font-black text-slate-400 text-[10px] uppercase py-4 pl-8">ID Order</TableHead>
                <TableHead className="font-black text-slate-400 text-[10px] uppercase">Limbah & Volume</TableHead>
                <TableHead className="font-black text-slate-400 text-[10px] uppercase">Petugas Driver / Nopol</TableHead>
                <TableHead className="font-black text-slate-400 text-[10px] uppercase text-center">Tanggal Jemput</TableHead>
                <TableHead className="font-black text-slate-400 text-[10px] uppercase text-center">Biaya Jasa</TableHead>
                <TableHead className="font-black text-slate-400 text-[10px] uppercase text-center">Status</TableHead>
                <TableHead className="text-right font-black text-slate-400 text-[10px] uppercase pr-8">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myPickups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-sm font-bold">
                    Belum ada pengajuan pengangkutan limbah.
                  </TableCell>
                </TableRow>
              ) : (
                myPickups.map((pick) => (
                  <TableRow key={pick.id} className="hover:bg-slate-50/50 transition-colors border-slate-100 h-24">
                    <TableCell className="pl-8 font-black text-slate-800">{pick.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-800">{pick.wasteType}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{pick.volume}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {pick.driverName ? (
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-slate-700">{pick.driverName}</span>
                          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mt-1 w-max">
                            {pick.plateNo}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic font-medium">Menunggu armada...</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-bold text-slate-500 text-xs">{pick.date}</TableCell>
                    <TableCell className="text-center font-black text-slate-800 italic text-sm">
                      {pick.cost ? `Rp ${pick.cost.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(pick.status)}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      {pick.status === "PRICED" ? (
                        <Button 
                          onClick={() => navigate("/company/payments")}
                          className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-9 px-4 text-[10px] font-black tracking-wider shadow-md shadow-amber-100"
                        >
                          BAYAR INVOICE
                        </Button>
                      ) : pick.status === "PAID" ? (
                        <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg py-1 px-3 text-[10px] font-bold">
                          LUNAS (SIAP JEMPUT)
                        </Badge>
                      ) : pick.status === "COMPLETED" && pick.evidencePhoto ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" className="h-9 text-[10px] font-black text-emerald-600 hover:bg-emerald-50 tracking-wider">
                              LIHAT BUKTI
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-white border text-center p-6 rounded-3xl max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle className="text-slate-800 font-bold">Bukti Serah Terima Limbah</DialogTitle>
                            </DialogHeader>
                            <div className="py-4 text-left">
                              <div className="flex gap-4 overflow-x-auto pb-4">
                                {(() => {
                                  let photos = [];
                                  try {
                                    photos = JSON.parse(pick.evidencePhoto);
                                    if (!Array.isArray(photos)) photos = [pick.evidencePhoto];
                                  } catch (e) {
                                    photos = [pick.evidencePhoto];
                                  }
                                  return photos.map((p, i) => (
                                    <img key={i} src={p} alt={`Bukti ${i}`} className="max-h-[200px] rounded-2xl border shrink-0" />
                                  ));
                                })()}
                              </div>
                              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div>
                                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Volume Aktual yang Diangkut</p>
                                  <p className="font-bold text-slate-800">{pick.actualVolume || "Tidak ada laporan volume"}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Catatan Pengangkutan</p>
                                  <p className="font-bold text-slate-800 text-sm italic">{pick.transportReport || "-"}</p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Button variant="ghost" className="text-slate-400 h-9 text-[10px] font-bold">
                          Detail
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
