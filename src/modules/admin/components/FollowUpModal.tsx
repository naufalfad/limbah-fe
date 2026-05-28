import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from '@/lib/api';
import { useSijagaStore } from '@/store/useSijagaStore';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: any | null;
}

export function FollowUpModal({ isOpen, onClose, inspection }: FollowUpModalProps) {
  const { fetchInspections, fetchCompanies } = useSijagaStore();
  const [action, setAction] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!action) {
      toast.error('Pilih jenis tindak lanjut terlebih dahulu');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post(`/inspections/${inspection.id}/follow-up`, {
        action,
        notes
      });
      toast.success('Tindak lanjut berhasil disimpan');
      fetchInspections();
      fetchCompanies(); // Refresh company status if suspended
      onClose();
      // Reset form
      setAction('');
      setNotes('');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan tindak lanjut');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!inspection) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] rounded-none border-slate-200 p-0 overflow-hidden bg-slate-50">
        <div className="bg-white p-6 border-b border-slate-200">
          <DialogTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">
            Tindak Lanjut Inspeksi
          </DialogTitle>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
            ID: {inspection.id} • {inspection.companyName}
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Jenis Tindak Lanjut
            </Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="rounded-none border-slate-200 bg-white font-bold h-10 text-xs">
                <SelectValue placeholder="Pilih aksi..." />
              </SelectTrigger>
              <SelectContent className="rounded-none border-slate-200">
                <SelectItem value="SESUAI" className="text-xs font-bold focus:bg-emerald-50">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 size={14} /> Sesuai / Lulus Inspeksi
                  </div>
                </SelectItem>
                <SelectItem value="PERINGATAN" className="text-xs font-bold focus:bg-amber-50">
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle size={14} /> Terbitkan Surat Peringatan
                  </div>
                </SelectItem>
                <SelectItem value="CABUT_IZIN" className="text-xs font-bold focus:bg-rose-50">
                  <div className="flex items-center gap-2 text-rose-600">
                    <XCircle size={14} /> Cabut / Bekukan Izin
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Catatan Tindak Lanjut
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan untuk perusahaan..."
              className="rounded-none border-slate-200 bg-white text-xs font-medium min-h-[100px] resize-none focus-visible:ring-emerald-500"
            />
          </div>
        </div>

        <div className="p-6 bg-white border-t border-slate-200 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-none font-bold text-xs h-10 px-6 uppercase tracking-widest border-slate-200 text-slate-500 hover:bg-slate-50"
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            className="rounded-none font-bold text-xs h-10 px-6 uppercase tracking-widest bg-slate-900 hover:bg-emerald-600"
            disabled={isSubmitting || !action}
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> MENYIMPAN...</>
            ) : (
              'SIMPAN TINDAK LANJUT'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
