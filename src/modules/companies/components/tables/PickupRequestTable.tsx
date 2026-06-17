// src/modules/companies/components/tables/PickupRequestTable.tsx
import React, { useState, useMemo } from "react";
import { useSijagaStore, PickupRequest } from "@/store/useSijagaStore";
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
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Truck, Eye, ShieldCheck } from "lucide-react";

export default function PickupRequestTable() {
    const navigate = useNavigate();
    const { pickupRequests, selectedCompanyId } = useSijagaStore();

    // FIX ERROR: Ubah state tracking dari string URL menjadi utuh objek PickupRequest (GRASP Information Expert) [3]
    const [selectedPick, setSelectedPick] = useState<PickupRequest | null>(null);

    // Filter pickup berdasarkan perusahaan aktif [3]
    const companyPickups = useMemo(() => {
        return pickupRequests.filter((p) => p.companyId === selectedCompanyId);
    }, [pickupRequests, selectedCompanyId]);

    // PAGINATION
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;
    const totalPages = Math.ceil(companyPickups.length / ITEMS_PER_PAGE);
    const paginatedPickups = companyPickups.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

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
            <div className="hidden md:block border border-slate-200 bg-white overflow-hidden">
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
                        {paginatedPickups.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                    Belum ada penugasan armada pengangkutan.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedPickups.map((pick) => (
                                <TableRow key={pick.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors h-10">

                                    {/* ID Manifest */}
                                    <TableCell className="pl-4 font-black text-slate-800 text-xs py-1.5">
                                        {pick.id}
                                    </TableCell>

                                    {/* Jenis Limbah & Volume */}
                                    <TableCell className="py-1.5">
                                        <div className="flex flex-col text-left">
                                            <span className="font-bold text-slate-800 text-xs leading-none">{pick.wasteType}</span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{pick.volume}</span>
                                        </div>
                                    </TableCell>

                                    {/* Armada / Driver */}
                                    <TableCell className="py-1.5">
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
                                    <TableCell className="text-center font-bold text-slate-500 text-xs py-1.5">
                                        {pick.date}
                                    </TableCell>

                                    {/* Tarif Jasa */}
                                    <TableCell className="text-center font-black text-slate-900 italic text-xs tracking-tight py-1.5">
                                        {pick.cost ? `Rp ${pick.cost.toLocaleString()}` : "-"}
                                    </TableCell>

                                    {/* Status Badges */}
                                    <TableCell className="text-center py-1.5">
                                        {getStatusBadge(pick.status)}
                                    </TableCell>

                                    {/* Tindakan (Conditional Action based on status) [3] */}
                                    <TableCell className="text-right pr-4 py-1.5">
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
                                                // FIX ERROR: Set state selectedPick dengan seluruh objek data 'pick' yang aman [3]
                                                onClick={() => setSelectedPick(pick)}
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
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={companyPickups.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* Mobile List View */}
            <div className="md:hidden flex flex-col divide-y divide-slate-100 border border-slate-200 bg-white">
                {paginatedPickups.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                        Belum ada penugasan armada pengangkutan.
                    </div>
                ) : (
                    paginatedPickups.map((pick) => (
                        <div key={pick.id} className="p-3 flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="font-black text-slate-800 text-xs">{pick.id}</span>
                                    <div className="mt-0.5">
                                        <span className="font-bold text-slate-800 text-[11px] leading-none">{pick.wasteType}</span>
                                    </div>
                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{pick.volume}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-slate-900 italic text-xs tracking-tight">
                                        {pick.cost ? `Rp ${pick.cost.toLocaleString()}` : "-"}
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-500 mt-1">{pick.date}</div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-1">
                                {pick.driverName ? (
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-700 text-[10px]">{pick.driverName}</span>
                                        <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 border border-emerald-100 mt-1">
                                            {pick.plateNo}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-[9px] text-slate-400 italic font-bold uppercase tracking-wider">Mencari Driver...</span>
                                )}
                            </div>

                            <div className="flex justify-between items-center mt-1 pt-2 border-t border-slate-50">
                                <div>{getStatusBadge(pick.status)}</div>
                                <div>
                                    {pick.status === "PRICED" ? (
                                        <Button
                                            onClick={() => navigate("/company/payments")}
                                            className="bg-amber-500 hover:bg-amber-600 text-white rounded-none h-7 px-2 text-[8px] font-black tracking-widest uppercase shadow-none"
                                        >
                                            BAYAR
                                        </Button>
                                    ) : pick.status === "PAID" ? (
                                        <span className="text-[8px] font-black text-emerald-600 bg-emerald-50/50 border border-emerald-200 px-2 py-1 uppercase tracking-widest">
                                            Lunas
                                        </span>
                                    ) : pick.status === "COMPLETED" && pick.evidencePhoto ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedPick(pick)}
                                            className="text-emerald-600 hover:text-emerald-700 font-black text-[9px] tracking-widest uppercase rounded-none h-7 px-2"
                                        >
                                            <Eye size={12} className="mr-1 inline-block" /> Bukti
                                        </Button>
                                    ) : (
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">-</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                {companyPickups.length > 0 && (
                    <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={companyPickups.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                        className="bg-slate-50 border-t border-slate-200"
                    />
                )}
            </div>

            {/* DIALOG POPUP PREVIEW BUKTI SERAH TERIMA MANIFEST */}
            {selectedPick && (
                <Dialog open={!!selectedPick} onOpenChange={() => setSelectedPick(null)}>
                    <DialogContent className="sm:max-w-[480px] rounded-none bg-white border border-slate-200 text-left p-6 z-[9999]">
                        <DialogHeader className="border-b pb-3">
                            <DialogTitle className="text-xs font-black tracking-widest text-slate-800 uppercase flex items-center gap-2">
                                <Truck size={14} className="text-emerald-600" /> BAP Serah Terima Limbah B3
                            </DialogTitle>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Dokumentasi fisik muatan divalidasi oleh driver</p>
                        </DialogHeader>

                        <div className="py-4 text-left">
                            <div className="flex gap-2 overflow-x-auto pb-4 max-h-[160px] custom-scrollbar">
                                {(() => {
                                    let photos = [];
                                    try {
                                        // FIX ERROR: Akses evidencePhoto aman dari state seleksi 'selectedPick' [3]
                                        photos = JSON.parse(selectedPick.evidencePhoto || "[]");
                                        if (!Array.isArray(photos)) photos = [selectedPick.evidencePhoto];
                                    } catch (e) {
                                        photos = [selectedPick.evidencePhoto || ""];
                                    }
                                    return photos.map((p, i) => (
                                        <img key={i} src={p} alt={`Bukti ${i}`} className="max-h-[150px] rounded-none border border-slate-200 shrink-0" />
                                    ));
                                })()}
                            </div>

                            {/* FIX ERROR: Tampilan aman diakses dari objek status state 'selectedPick' [3] */}
                            <div className="space-y-2.5 bg-slate-50 p-3 border border-slate-200 rounded-none text-xs">
                                <div>
                                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none">Volume Aktual Terangkut</p>
                                    <p className="font-bold text-slate-800 mt-1 leading-none">{selectedPick.actualVolume || "Tidak ada laporan volume"}</p>
                                </div>
                                <div className="border-t pt-2">
                                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none">Catatan Lapangan Transporter</p>
                                    <p className="font-bold text-slate-800 text-xs italic mt-1 leading-normal">"{selectedPick.transportReport || "-"}"</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={() => setSelectedPick(null)}
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