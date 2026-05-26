import React, { useMemo } from "react";
import { useSijagaStore } from "@/store/useSijagaStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Truck } from "lucide-react";

export default function WasteLogbookTable() {
    const { wasteLogs, selectedCompanyId } = useSijagaStore();

    // Memfilter logbook secara spesifik untuk perusahaan yang sedang aktif (Strict Scope)
    const companyLogs = useMemo(() => {
        return wasteLogs.filter((log) => log.companyId === selectedCompanyId);
    }, [wasteLogs, selectedCompanyId]);

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
            <div className="border border-slate-200 bg-white rounded-none overflow-hidden">
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
                        {companyLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                    Belum ada catatan logbook limbah B3.
                                </TableCell>
                            </TableRow>
                        ) : (
                            companyLogs.map((log) => (
                                <TableRow key={log.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors h-14">
                                    
                                    {/* ID Logbook */}
                                    <TableCell className="pl-4 font-black text-slate-800 text-xs">
                                        {log.id}
                                    </TableCell>

                                    {/* Jenis Limbah */}
                                    <TableCell>
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
                                    <TableCell className="text-right">
                                        <span className="font-black text-slate-800 text-xs">{log.volume}</span>
                                        <span className="text-[9px] text-slate-500 font-bold ml-1">{log.unit}</span>
                                    </TableCell>

                                    {/* Tanggal Rilis */}
                                    <TableCell className="text-center font-bold text-slate-500 text-xs">
                                        {log.date}
                                    </TableCell>

                                    {/* Metode Kelola */}
                                    <TableCell className="text-center">
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
                                    <TableCell className="text-center">
                                        {getStatusBadge(log.status)}
                                    </TableCell>

                                    {/* Catatan Keterangan */}
                                    <TableCell className="text-right pr-4">
                                        <span className="text-[9px] font-bold text-slate-500 italic max-w-[120px] truncate inline-block">
                                            {log.note || "-"}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}