import React, { useMemo } from "react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Truck } from "lucide-react";

export default function WasteLogbookTable() {
    const { wasteLogs, selectedCompanyId } = useSijagaStore();

    // Memfilter logbook secara spesifik untuk perusahaan yang sedang aktif (Strict Scope)
    const companyLogs = useMemo(() => {
        return wasteLogs.filter((log) => log.companyId === selectedCompanyId);
    }, [wasteLogs, selectedCompanyId]);

    // PAGINATION
    const [currentPage, setCurrentPage] = React.useState(1);
    const ITEMS_PER_PAGE = 5;
    const totalPages = Math.ceil(companyLogs.length / ITEMS_PER_PAGE);
    const paginatedLogs = companyLogs.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Generator Lencana Status dengan skema warna yang kohesif
    const getStatusBadge = (status: string) => {
        const styles: any = {
            "Proses_Verifikasi": "bg-amber-50 text-amber-700 border-amber-200 animate-pulse",
            "Terverifikasi": "bg-emerald-50 text-emerald-700 border-emerald-200",
            "Terjadwal_Pickup": "bg-indigo-50 text-indigo-700 border-indigo-200",
            "Ditolak": "bg-rose-50 text-rose-700 border-rose-200",
        };
        const labels: any = {
            "Proses_Verifikasi": "Proses Verifikasi",
            "Terverifikasi": "Terverifikasi DLH",
            "Terjadwal_Pickup": "Terjadwal Angkut",
            "Ditolak": "Laporan Ditolak",
        };
        return (
            <Badge className={`${styles[status] || "bg-slate-100 text-slate-600"} px-2 py-0.5 rounded-none text-[8px] font-black border uppercase tracking-widest shadow-none`}>
                {labels[status] || status}
            </Badge>
        );
    };

    return (
        <div className="font-sans text-left">
            {/* Desktop Table View */}
            <div className="hidden md:block border border-slate-200 bg-white overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow className="border-b border-slate-200 h-9">
                            <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest pl-4">ID Log</TableHead>
                            <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Jenis Limbah</TableHead>
                            <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-right">Volume</TableHead>
                            <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center">Tanggal</TableHead>
                            <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center">Metode Kelola</TableHead>
                            <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-center">Status</TableHead>
                            <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest text-right pr-4">Catatan</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                    Belum ada catatan logbook limbah B3.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedLogs.map((log) => (
                                <TableRow key={log.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors h-10">
                                    
                                    {/* ID Logbook */}
                                    <TableCell className="pl-4 font-black text-slate-800 text-xs py-1.5">
                                        {log.id}
                                    </TableCell>

                                    {/* Jenis Limbah */}
                                    <TableCell className="py-1.5">
                                        <div className="flex flex-col text-left">
                                            <span className="font-bold text-slate-800 text-xs leading-none">{log.type}</span>
                                            {log.type.toLowerCase().includes("b3") || log.type.toLowerCase().includes("kimia") || log.type.toLowerCase().includes("oli") ? (
                                                <span className="text-[8px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 border border-rose-100 rounded-none mt-1 w-max leading-none">
                                                    LIMBAH BERBAHAYA
                                                </span>
                                            ) : (
                                                <span className="text-[8px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 border border-slate-200 rounded-none mt-1 w-max leading-none">
                                                    NON-B3
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Volume */}
                                    <TableCell className="text-right py-1.5">
                                        <span className="font-black text-slate-800 text-xs">{log.volume}</span>
                                        <span className="text-[9px] text-slate-500 font-bold ml-1">{log.unit}</span>
                                    </TableCell>

                                    {/* Tanggal Rilis */}
                                    <TableCell className="text-center font-bold text-slate-500 text-xs py-1.5">
                                        {log.date}
                                    </TableCell>

                                    {/* Metode Kelola */}
                                    <TableCell className="text-center py-1.5">
                                        {log.method === "Dinas" ? (
                                            <div className="flex items-center justify-center gap-1.5 text-indigo-700">
                                                <Truck size={12} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Jasa Transporter</span>
                                            </div>
                                        ) : (
                                            <span className="text-[9px] text-emerald-700 font-black uppercase tracking-widest bg-emerald-50 px-2 py-1">
                                                Mandiri (IPAL)
                                            </span>
                                        )}
                                    </TableCell>

                                    {/* Status Verifikasi */}
                                    <TableCell className="text-center py-1.5">
                                        {getStatusBadge(log.status)}
                                    </TableCell>

                                    {/* Catatan Keterangan */}
                                    <TableCell className="text-right pr-4 py-1.5">
                                        <span className="text-[9px] font-bold text-slate-500 italic max-w-[120px] truncate inline-block">
                                            {log.note || "-"}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={companyLogs.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* Mobile List View */}
            <div className="md:hidden flex flex-col divide-y divide-slate-100 border border-slate-200 bg-white">
                {paginatedLogs.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                        Belum ada catatan logbook limbah B3.
                    </div>
                ) : (
                    paginatedLogs.map((log) => (
                        <div key={log.id} className="p-3 flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="font-black text-slate-800 text-xs">{log.id}</span>
                                    <div className="mt-0.5">
                                        <span className="font-bold text-slate-800 text-[11px] leading-none">{log.type}</span>
                                    </div>
                                    {log.type.toLowerCase().includes("b3") || log.type.toLowerCase().includes("kimia") || log.type.toLowerCase().includes("oli") ? (
                                        <span className="inline-block text-[8px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 border border-rose-100 mt-1 leading-none">
                                            LIMBAH BERBAHAYA
                                        </span>
                                    ) : (
                                        <span className="inline-block text-[8px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 border border-slate-200 mt-1 leading-none">
                                            NON-B3
                                        </span>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-slate-800 text-xs">{log.volume} <span className="text-[9px] text-slate-500 font-bold">{log.unit}</span></div>
                                    <div className="text-[9px] font-bold text-slate-500 mt-1">{log.date}</div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-1 pt-2 border-t border-slate-50">
                                <div>
                                    {log.method === "Dinas" ? (
                                        <div className="flex items-center gap-1 text-indigo-700">
                                            <Truck size={10} />
                                            <span className="text-[8px] font-black uppercase tracking-widest">Jasa Transporter</span>
                                        </div>
                                    ) : (
                                        <span className="text-[8px] text-emerald-700 font-black uppercase tracking-widest bg-emerald-50 px-2 py-0.5 border border-emerald-100">
                                            Mandiri (IPAL)
                                        </span>
                                    )}
                                </div>
                                <div>{getStatusBadge(log.status)}</div>
                            </div>
                        </div>
                    ))
                )}
                {companyLogs.length > 0 && (
                    <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={companyLogs.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                        className="bg-slate-50 border-t border-slate-200"
                    />
                )}
            </div>
        </div>
    );
}