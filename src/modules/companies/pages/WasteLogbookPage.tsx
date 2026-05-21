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
  Trash2, Plus, Search, Filter, AlertTriangle, FileSpreadsheet, Download,
  Sparkles, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function WasteLogbookPage() {
  const { currentUser, companies, wasteLogs, addWasteLog, selectedCompanyId } = useSijagaStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form states
  const [type, setType] = useState("Oli Bekas");
  const [volume, setVolume] = useState("");
  const [unit, setUnit] = useState<"L" | "kg" | "m³">("L");
  const [method, setMethod] = useState<"Dinas" | "Mandiri">("Dinas");
  const [note, setNote] = useState("");
  const [showAnomalyWarning, setShowAnomalyWarning] = useState(false);

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
                Untuk dapat mengakses modul Logbook Limbah Berkala, Anda harus mendaftarkan profil badan usaha atau perusahaan Anda terlebih dahulu ke sistem. Satu akun dapat mengelola beberapa perusahaan sekaligus.
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

  const myWasteLogs = company ? wasteLogs.filter(w => w.companyId === company.id) : [];

  // Filter logs
  const filteredLogs = myWasteLogs.filter(log => 
    log.type.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) {
      toast.error("Anda harus mendaftarkan perusahaan terlebih dahulu.");
      return;
    }
    if (!volume || parseFloat(volume) <= 0) {
      toast.error("Volume harus lebih besar dari 0");
      return;
    }

    const volNum = parseFloat(volume);
    // Smart anomaly detection threshold: volume > 100 triggers warning
    if (volNum > 100) {
      setShowAnomalyWarning(true);
    } else {
      submitLog();
    }
  };

  const submitLog = () => {
    if (!company) {
      toast.error("Anda harus mendaftarkan perusahaan terlebih dahulu.");
      return;
    }
    addWasteLog({
      companyId: company.id,
      type,
      volume: parseFloat(volume),
      unit,
      date: new Date().toISOString().split("T")[0],
      method,
      note
    });

    toast.success("Laporan limbah berhasil dicatat.");
    // Reset form
    setVolume("");
    setNote("");
    setIsDialogOpen(false);
    setShowAnomalyWarning(false);
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      "Terverifikasi": "bg-emerald-50 text-emerald-600 border-emerald-100",
      "Proses Verifikasi": "bg-amber-50 text-amber-600 border-amber-100",
      "Terjadwal Pickup": "bg-blue-50 text-blue-600 border-blue-100",
      "Ditolak": "bg-red-50 text-red-600 border-red-100",
    };
    return <Badge className={`${styles[status]} border font-bold rounded-lg shadow-none`}>{status}</Badge>;
  };

  return (
    <DashboardLayout role="PERUSAHAAN">
      <div className="space-y-8 text-left">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Logbook Limbah Berkala</h1>
            <p className="text-slate-500 font-medium mt-2">Catat produksi limbah industri Anda untuk dilaporkan ke DLH daerah.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none h-11 font-bold gap-2 border-slate-200">
              <FileSpreadsheet size={18} /> Export Excel
            </Button>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 md:flex-none h-11 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 font-bold gap-2 px-6 rounded-xl">
                  <Plus size={18} /> Buat Laporan Baru
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] bg-white border border-slate-200 text-left p-8">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black tracking-tight text-slate-800">Catat Limbah Baru</DialogTitle>
                  <p className="text-xs text-slate-400 font-bold uppercase mt-1">Isi volume limbah beserta metode pengelolaan</p>
                </DialogHeader>

                {showAnomalyWarning ? (
                  <div className="space-y-6 py-4 animate-in zoom-in duration-300">
                    <div className="p-5 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-start gap-4">
                      <AlertTriangle className="text-rose-600 shrink-0 mt-0.5 animate-bounce" size={28} />
                      <div className="space-y-2">
                        <h4 className="font-black text-rose-900 text-sm">DETEKSI ANOMALI: Volume Tidak Wajar</h4>
                        <p className="text-xs text-rose-700 leading-relaxed">
                          Anda memasukkan volume <strong>{volume} {unit}</strong>. Volume ini melampaui batas wajar rata-rata pelaporan (100).
                          Sistem EWS (Early Warning System) SIJAGA secara otomatis akan mengirimkan notifikasi bahaya ke dinas.
                        </p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase text-center">Apakah Anda yakin data ini sudah akurat?</p>
                    <div className="flex gap-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowAnomalyWarning(false)} 
                        className="flex-1 rounded-xl h-11 border-slate-200 font-bold"
                      >
                        Revisi Volume
                      </Button>
                      <Button 
                        type="button" 
                        onClick={submitLog} 
                        className="flex-1 rounded-xl h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold"
                      >
                        Ya, Tetap Kirim
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handlePreSubmit} className="space-y-5 py-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Jenis Limbah</label>
                      <Select value={type} onValueChange={setType}>
                        <SelectTrigger className="rounded-xl h-12 bg-white border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border text-slate-900">
                          <SelectItem value="Oli Bekas">Oli Bekas (B3)</SelectItem>
                          <SelectItem value="Limbah Cair Kimia">Limbah Cair Kimia</SelectItem>
                          <SelectItem value="Minyak Jelantah">Minyak Jelantah (Domestik)</SelectItem>
                          <SelectItem value="Limbah Padat B3">Limbah Padat B3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Volume</label>
                        <Input 
                          type="number" 
                          placeholder="Contoh: 45" 
                          value={volume}
                          onChange={(e) => setVolume(e.target.value)}
                          className="rounded-xl h-12 border-slate-200 bg-white" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Satuan</label>
                        <Select value={unit} onValueChange={(v: any) => setUnit(v)}>
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
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Metode Pengelolaan</label>
                      <Select value={method} onValueChange={(v: any) => setMethod(v)}>
                        <SelectTrigger className="rounded-xl h-12 bg-white border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border text-slate-900">
                          <SelectItem value="Dinas">Melalui Dinas (DLH Transporter)</SelectItem>
                          <SelectItem value="Mandiri">Pengolahan Mandiri (Miliki IPAL/TPS B3)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Catatan Tambahan</label>
                      <Input 
                        placeholder="Contoh: Penampungan drum minggu ke-2" 
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="rounded-xl h-12 border-slate-200 bg-white" 
                      />
                    </div>

                    <div className="space-y-2 pt-2">
                      <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl shadow-lg shadow-emerald-100">
                        Kirim Laporan
                      </Button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* List Section */}
        <Card className="border-none shadow-sm ring-1 ring-slate-200 rounded-[2rem] overflow-hidden bg-white">
          <div className="p-6 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                className="pl-10 bg-white border-slate-200 rounded-xl h-11" 
                placeholder="Cari berdasarkan jenis limbah..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
               <Select defaultValue="all">
                  <SelectTrigger className="w-[180px] h-11 bg-white rounded-xl">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border text-slate-900">
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="verified">Terverifikasi</SelectItem>
                    <SelectItem value="pending">Proses Verifikasi</SelectItem>
                    <SelectItem value="pickup">Terjadwal Pickup</SelectItem>
                  </SelectContent>
               </Select>
               <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200">
                  <Filter size={18} className="text-slate-500" />
               </Button>
            </div>
          </div>

          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-none">
                <TableHead className="font-black text-slate-400 text-[10px] uppercase py-4 pl-8">ID & Tanggal</TableHead>
                <TableHead className="font-black text-slate-400 text-[10px] uppercase">Jenis Limbah</TableHead>
                <TableHead className="font-black text-slate-400 text-[10px] uppercase text-center">Volume</TableHead>
                <TableHead className="font-black text-slate-400 text-[10px] uppercase text-center">Metode Pengelolaan</TableHead>
                <TableHead className="font-black text-slate-400 text-[10px] uppercase">Catatan</TableHead>
                <TableHead className="font-black text-slate-400 text-[10px] uppercase text-center">Status</TableHead>
                <TableHead className="text-right font-black text-slate-400 text-[10px] uppercase pr-8">Unduh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-400 text-sm font-bold">
                    Belum ada pencatatan logbook limbah.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/80 transition-colors border-slate-100 h-20">
                    <TableCell className="pl-8">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900">{log.id}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{log.date}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-slate-800">{log.type}</TableCell>
                    <TableCell className="text-center font-black text-slate-950 text-base">{log.volume} {log.unit}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={log.method === "Dinas" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"}>
                        {log.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 font-medium text-xs max-w-[200px] truncate">{log.note || "-"}</TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(log.status)}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-emerald-600">
                        <Download size={18} />
                      </Button>
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
