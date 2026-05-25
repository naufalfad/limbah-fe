// src/modules/companies/components/tables/PickupRequestTable.tsx
import React, { useState, useMemo } from "react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Truck, Eye, ShieldCheck, MapPin } from "lucide-react";

export default function PickupRequestTable() {
    const navigate = useNavigate();
    const { pickupRequests, selectedCompanyId } = useSijagaStore();

    // State Bukti Serah Terima Dialog
    const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

    // Filter pickup berdasarkan perusahaan aktif (Information Expert) [3]
    const companyPickups = useMemo(() => {
        return pickupRequests.filter((p) => p.companyId === selectedCompanyId);
    }, [pickupRequests, selectedCompanyId]);

    const getStatusBadge = (status: string) => {
        const styles: any = {
            PENDING: "bg-slate-100 text-slate-600 border-slate-200",
            PRICED: "bg-blue-50 text-blue-600 border-blue-100 animate-pulse",
            PAID: "bg-amber-50 text-amber-700 border-amber-200",
            ON_THE_ROAD: "bg-indigo-50 text-indigo-700 border-indigo-100 animate-pulse",
            LOADED: "bg-purple-50 text-purple-700 border-purple-100",
            COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
        const labels: any = {
            PENDING: "Menunggu Harga",
            PRICED: "Perlu Dibayar",
            PAID: "Tunggu Jemput",
            ON_THE_ROAD: "Armada Di Jalan",
            LOADED: "Limbah Dimuat",
            COMPLETED: "Selesai",
        };
        return (
            <Badge className={`${styles[status] || styles.PENDING} px-2 py-0.5 rounded-none text-[8px] font-black border uppercase tracking-widest border-none shadow-none`}>
                {labels[status] || status}
            </Badge>
        );
    };

    return (
        <div className="font-sans text-left">

            {/* TABLE CONTENT */}
            <div className="border border-slate-200 bg-white rounded-none overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow className="border-b border-slate-200 h-9">
                            <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest pl-4">ID Manifest</TableHead>
                            <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Limbah & Volume</TableHead>
                            <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Armada / Driver</TableHead>
                            <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center">Tanggal</TableHead>
                            <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center">Biaya Jasa</TableHead>
                            <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center">Status</TableHead>
                            <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-right pr-4">Tindakan</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {companyPickups.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                    Belum ada penugasan armada pengangkutan.
                                </TableCell>
                            </TableRow>
                        ) : (
                            companyPickups.map((pick) => (
                                <TableRow key={pick.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors h-14">

                                    {/* ID Manifest */}
                                    <TableCell className="pl-4 font-black text-slate-800 text-xs">
                                        {pick.id}
                                    </TableCell>

                                    {/* Jenis Limbah & Volume */}
                                    <TableCell>
                                        <div className="flex flex-col text-left">
                                            <span className="font-bold text-slate-800 text-xs leading-none">{pick.wasteType}</span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{pick.volume}</span>
                                        </div>
                                    </TableCell>

                                    {/* Armada / Driver */}
                                    <TableCell>
                                        {pick.driverName ? (
                                            <div className="flex flex-col text-left">
                                                <span className="font-bold text-slate-700 text-xs leading-none">{pick.driverName}</span>
                                                <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 border border-emerald-100 rounded-none mt-1 w-max leading-none">
                                                    {pick.plateNo}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-slate-400 italic font-bold uppercase tracking-wider">Mencari Driver...</span>
                                        )}
                                    </TableCell>

                                    {/* Tanggal Rencana Jemput */}
                                    <TableCell className="text-center font-bold text-slate-500 text-xs">
                                        {pick.date}
                                    </TableCell>

                                    {/* Tarif Jasa */}
                                    <TableCell className="text-center font-black text-slate-900 italic text-xs tracking-tight">
                                        {pick.cost ? `Rp ${pick.cost.toLocaleString()}` : "-"}
                                    </TableCell>

                                    {/* Status Badges */}
                                    <TableCell className="text-center">
                                        {getStatusBadge(pick.status)}
                                    </TableCell>

                                    {/* Tindakan (Conditional Action based on status) [3] */}
                                    <TableCell className="text-right pr-4">
                                        {pick.status === "PRICED" ? (
                                            <Button
                                                onClick={() => navigate("/company/payments")}
                                                className="bg-amber-500 hover:bg-amber-600 text-white rounded-none h-8 px-3 text-[9px] font-black tracking-widest uppercase shadow-none"
                                            >
                                                BAYAR INVOICE
                                            </Button>
                                        ) : pick.status === "PAID" ? (
                                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50/50 border border-emerald-200 px-2 py-1 uppercase tracking-widest">
                                                Lunas
                                            </span>
                                        ) : pick.status === "COMPLETED" && pick.evidencePhoto ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedProofUrl(pick.evidencePhoto || null)}
                                                className="text-emerald-600 hover:text-emerald-700 font-black text-[9px] tracking-widest uppercase rounded-none h-8 px-2"
                                            >
                                                <Eye size={12} className="mr-1 inline-block" /> Bukti
                                            </Button>
                                        ) : (
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">-</span>
                                        )}
                                    </TableCell>

                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* DIALOG POPUP PREVIEW BUKTI SERAH TERIMA MANIFEST */}
            {selectedProofUrl && (
                <Dialog open={!!selectedProofUrl} onOpenChange={() => setSelectedProofUrl(null)}>
                    <DialogContent className="sm:max-w-[400px] rounded-none bg-white border border-slate-200 text-left p-6 z-[9999]">
                        <DialogHeader className="border-b pb-3">
                            <DialogTitle className="text-xs font-black tracking-widest text-slate-800 uppercase flex items-center gap-2">
                                <Truck size={14} className="text-emerald-600" /> BAP Serah Terima Limbah B3
                            </DialogTitle>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Dokumentasi fisik muatan divalidasi oleh driver</p>
                        </DialogHeader>

                        <div className="py-4">
                            <div className="border border-slate-200 p-1 bg-slate-50 rounded-none max-h-[260px] overflow-hidden flex items-center justify-center">
                                <img
                                    src={selectedProofUrl}
                                    alt="Bukti Serah Terima"
                                    className="w-full h-full object-cover rounded-none"
                                />
                            </div>

                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-none flex items-start gap-2 text-emerald-900 mt-4">
                                <ShieldCheck className="text-emerald-600 shrink-0 mt-0.5" size={14} />
                                <p className="text-[9px] font-semibold leading-relaxed text-emerald-700">
                                    Data manifest pengangkutan telah diverifikasi secara elektronik oleh petugas transporter dan disinkronkan dengan peta patroli DLH [3].
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={() => setSelectedProofUrl(null)}
                                className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white font-black text-[9px] tracking-widest uppercase rounded-none"
                            >
                                Tutup Dokumen
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

        </div>
    );
}