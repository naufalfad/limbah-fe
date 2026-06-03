import React, { useState, useEffect } from 'react';
import axios from 'axios';
import mammoth from 'mammoth';
import { Loader2, AlertCircle, Download, FileSpreadsheet, FileText, Columns, AlignLeft } from 'lucide-react';
import { api } from '@/lib/api';

interface DocPreviewerProps {
  fileUrl: string | null;
  fileName?: string;
  companyId?: string; // ID perusahaan opsional untuk memicu preview terstruktur backend
}

interface ParsedSheet {
  name: string;
  headers: string[];
  rows: string[][];
}

export function DocPreviewer({ fileUrl, fileName, companyId }: DocPreviewerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Excel Structured states
  const [excelSheets, setExcelSheets] = useState<ParsedSheet[]>([]);
  const [activeSheetIdx, setActiveSheetIdx] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'original' | 'transpose'>('original');

  // Legacy Word (.docx) state
  const [docxHtml, setDocxHtml] = useState<string>("");

  useEffect(() => {
    if (!fileUrl) return;

    setError(null);
    setExcelSheets([]);
    setDocxHtml("");
    setActiveSheetIdx(0);

    const isImage = !!(fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || fileUrl.startsWith("data:image/"));
    const isPdf = !!(fileUrl.match(/\.pdf$/i) || fileUrl.startsWith("data:application/pdf"));
    const isExcel = !!(fileUrl.match(/\.xlsx$/i) || fileUrl.match(/\.xls$/i));
    const isDocx = !!(fileUrl.match(/\.docx$/i) || fileUrl.startsWith("data:application/vnd.openxmlformats-officedocument.wordprocessingml.document") || fileUrl.startsWith("data:application/msword"));

    if (isImage || isPdf) return;

    if (!isExcel && !isDocx) {
      setError("Pratinjau tidak didukung secara langsung untuk jenis berkas ini. Silakan unduh berkas untuk melihat isinya.");
      return;
    }

    const fetchStructuredPreview = async () => {
      setLoading(true);
      try {
        // JIKA file adalah Excel DAN kita punya companyId, panggil API terstruktur
        if (isExcel && companyId) {
          let previewUrl = `/api/companies/${companyId}/preview`;
          const urlLower = fileUrl.toLowerCase();
          if (urlLower.includes('rkl')) {
            previewUrl += '?type=rkl';
          } else if (urlLower.includes('rpl')) {
            previewUrl += '?type=rpl';
          }
          const response = await api.get(previewUrl);
          if (response.data.success && Array.isArray(response.data.data)) {
            setExcelSheets(response.data.data);
            setLoading(false);
            return;
          }
        }

        // FALLBACK: Menggunakan parser client-side jika tidak ada companyId atau jika API gagal
        let arrayBuffer: ArrayBuffer;
        if (fileUrl.startsWith("data:")) {
          const base64Data = fileUrl.split(",")[1];
          const binaryString = window.atob(base64Data);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          arrayBuffer = bytes.buffer;
        } else {
          const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
          arrayBuffer = response.data;
        }

        if (isExcel) {
          // Dinamis mengimpor XLSX agar frontend tetap sangat ringan
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
          const sheets: ParsedSheet[] = workbook.SheetNames.map((name) => {
            const worksheet = workbook.Sheets[name];
            const rawJson = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
            if (rawJson.length === 0) return { name, headers: [], rows: [] };
            
            const headers = (rawJson[0] as any[]).map(val => val !== null && val !== undefined ? String(val) : "");
            const rows = rawJson.slice(1).map(row => 
              headers.map((_, colIdx) => row[colIdx] !== null && row[colIdx] !== undefined ? String(row[colIdx]) : "")
            );
            return { name, headers, rows };
          });
          setExcelSheets(sheets);
        } else if (isDocx) {
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setDocxHtml(result.value || "<p class='text-slate-400 italic text-center'>Dokumen kosong</p>");
        }
      } catch (err: any) {
        console.error("Gagal memuat pratinjau terstruktur:", err);
        setError("Gagal memuat atau mengurai berkas secara lokal. File mungkin korup atau tidak valid.");
      } finally {
        setLoading(false);
      }
    };

    fetchStructuredPreview();
  }, [fileUrl, companyId]);

  if (!fileUrl) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-450 gap-2 p-12 rounded-none">
        <FileText size={48} className="opacity-30" />
        <p className="text-xs font-bold uppercase tracking-widest">Tidak ada file untuk pratinjau</p>
      </div>
    );
  }

  const isImage = !!(fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || fileUrl.startsWith("data:image/"));
  const isPdf = !!(fileUrl.match(/\.pdf$/i) || fileUrl.startsWith("data:application/pdf"));

  if (isImage) {
    return (
      <div className="flex-1 overflow-hidden p-6 bg-slate-950/20 flex items-center justify-center relative backdrop-blur-sm rounded-none">
        <img src={fileUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded-none shadow-2xl ring-1 ring-white/10" />
      </div>
    );
  }

  if (isPdf) {
    return <iframe src={fileUrl} title="PDF Preview" className="w-full flex-1 border-none bg-slate-100 rounded-none" />;
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white text-slate-500 gap-3 p-12 rounded-none">
        <Loader2 size={36} className="animate-spin text-emerald-600" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sedang Mengurai Dokumen...</p>
        <p className="text-[9px] text-slate-450 font-bold">Mengonversi file ke format pratinjau teroptimasi</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-650 gap-4 p-8 text-center rounded-none">
        <div className="w-12 h-12 bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 rounded-none">
          <AlertCircle size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Pratinjau Tidak Tersedia</h4>
          <p className="text-[10px] font-bold text-slate-500 leading-relaxed">{error}</p>
        </div>
        <a href={fileUrl} download className="flex items-center gap-2 bg-slate-900 hover:bg-emerald-600 text-white font-black text-[10px] uppercase h-10 px-6 rounded-none transition-all shadow-md">
          <Download size={14} /> Unduh & Buka Berkas
        </a>
      </div>
    );
  }

  // EXCEL SPREADSHEET RENDERER (Dengan Mode Transpose Baru & Desain Siku)
  if (excelSheets.length > 0) {
    const activeSheet = excelSheets[activeSheetIdx];
    
    // Hitung data transpose jika mode transpose aktif
    const displayData = viewMode === 'transpose' 
      ? (() => {
          const { headers, rows } = activeSheet;
          if (rows.length === 0) return { headers: ["Field", "Record 1"], rows: headers.map(h => [h, ""]) };
          const tHeaders = ["Field", ...rows.map((_, idx) => `Record ${idx + 1}`)];
          const tRows = headers.map((header, colIndex) => [
            header,
            ...rows.map(row => row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : "")
          ]);
          return { headers: tHeaders, rows: tRows };
        })()
      : activeSheet;

    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-100 text-left rounded-none h-full">
        
        {/* Sub-Header: Kontrol Mode Pratinjau & Tab Sheet */}
        <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 shrink-0 select-none rounded-none">
          
          {/* Kiri: Selector Tab Lembar Kerja */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar rounded-none">
            <FileSpreadsheet size={14} className="text-emerald-600 shrink-0" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mr-2 border-r pr-3 shrink-0">Lembar Kerja:</span>
            <div className="flex gap-1.5">
              {excelSheets.map((sheet, index) => (
                <button
                  key={sheet.name}
                  onClick={() => setActiveSheetIdx(index)}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all border outline-none rounded-none whitespace-nowrap ${
                    activeSheetIdx === index
                      ? "bg-slate-900 border-slate-950 text-white shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100"
                  }`}
                >
                  {sheet.name}
                </button>
              ))}
            </div>
          </div>

          {/* Kanan: Toggle Mode Tampilan (Original vs Transpose) */}
          <div className="flex items-center bg-slate-100 p-1 border border-slate-200 rounded-none shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('original')}
              className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all rounded-none border ${
                viewMode === 'original'
                  ? "bg-white border-slate-200 text-slate-900 shadow-sm"
                  : "bg-transparent border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <AlignLeft size={12} />
              Original View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('transpose')}
              className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all rounded-none border ${
                viewMode === 'transpose'
                  ? "bg-white border-slate-200 text-slate-900 shadow-sm"
                  : "bg-transparent border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Columns size={12} />
              Transpose View
            </button>
          </div>
        </div>

        {/* Area Scrollable Rendering Tabel */}
        <div className="flex-1 overflow-auto bg-white custom-scrollbar border-t border-slate-100 rounded-none">
          {displayData.headers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest rounded-none">
              Lembar Kerja ini Kosong
            </div>
          ) : (
            <table className="w-full border-collapse text-[11px] font-medium text-slate-700 rounded-none">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                  {displayData.headers.map((header, idx) => (
                    <th
                      key={idx}
                      className={`px-4 py-3 font-black text-slate-800 border-r border-slate-200 uppercase tracking-wider text-[9px] text-left min-w-[120px] max-w-[300px] whitespace-normal ${
                        viewMode === 'transpose' && idx === 0 
                          ? "bg-slate-100 font-black tracking-widest text-emerald-800 text-center sticky left-0 z-20 shadow-[1px_0_0_0_rgba(226,232,240,1)]" 
                          : ""
                      }`}
                    >
                      {header || `Kolom ${idx + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayData.rows.map((row, rowIdx) => (
                  <tr 
                    key={rowIdx} 
                    className="border-b border-slate-150 hover:bg-slate-50/50 transition-colors"
                  >
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className={`px-4 py-3 border-r border-slate-200 max-w-[350px] whitespace-normal break-words align-top ${
                          viewMode === 'transpose' && cellIdx === 0 
                            ? "bg-slate-50/80 font-black text-slate-700 sticky left-0 z-10 border-r-2 border-r-slate-300 shadow-[1px_0_0_0_rgba(226,232,240,1)]" 
                            : ""
                        }`}
                      >
                        {cell || <span className="text-slate-300 font-normal italic">-</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // WORD DOCUMENT (.DOCX) RENDERER
  if (docxHtml) {
    return (
      <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center custom-scrollbar rounded-none">
        <div className="bg-white max-w-5xl w-full min-h-[1100px] p-12 lg:p-16 shadow-2xl border border-slate-200/80 text-slate-800 leading-relaxed text-left relative overflow-hidden rounded-none">
          <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-[8px] font-black uppercase tracking-widest select-none rounded-none">
            Pratinjau Dokumen
          </div>
          <div className="prose prose-sm max-w-none prose-slate docx-preview-content" dangerouslySetInnerHTML={{ __html: docxHtml }} />
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          .docx-preview-content { font-size: 13px; }
          .docx-preview-content h1 { font-size: 20px; font-weight: 800; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px; margin-bottom: 16px; text-transform: uppercase; }
          .docx-preview-content table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
          .docx-preview-content th, .docx-preview-content td { border: 1px solid #cbd5e1; padding: 8px 12px; }
          .docx-preview-content th { background-color: #f8fafc; font-weight: 700; }
        `}} />
      </div>
    );
  }

  return null;
}
