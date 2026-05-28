import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { Loader2, AlertCircle, Download, FileSpreadsheet, FileText } from 'lucide-react';

interface DocPreviewerProps {
  fileUrl: string | null;
  fileName?: string;
}

export function DocPreviewer({ fileUrl, fileName }: DocPreviewerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Excel states
  const [excelSheets, setExcelSheets] = useState<{ [key: string]: string }>({});
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>("");

  // Docx states
  const [docxHtml, setDocxHtml] = useState<string>("");

  useEffect(() => {
    if (!fileUrl) return;

    // Reset states
    setError(null);
    setExcelSheets({});
    setSheetNames([]);
    setActiveSheet("");
    setDocxHtml("");

    const isImage = fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isPdf = fileUrl.match(/\.pdf$/i);
    const isExcel = fileUrl.match(/\.xlsx$/i) || fileUrl.match(/\.xls$/i);
    const isDocx = fileUrl.match(/\.docx$/i);

    if (isImage || isPdf) {
      // Browser handles native rendering
      return;
    }

    if (!isExcel && !isDocx) {
      // Fallback for doc or other extensions
      setError("Pratinjau tidak didukung secara langsung untuk jenis berkas ini. Silakan unduh berkas untuk melihat isinya.");
      return;
    }

    const fetchAndParseFile = async () => {
      setLoading(true);
      try {
        const response = await axios.get(fileUrl, {
          responseType: 'arraybuffer',
        });
        const arrayBuffer = response.data;

        if (isExcel) {
          const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
          const sheetsData: { [key: string]: string } = {};
          
          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            // Render spreadsheet to HTML
            sheetsData[sheetName] = XLSX.utils.sheet_to_html(worksheet, {
              header: '',
              footer: ''
            });
          });

          setExcelSheets(sheetsData);
          setSheetNames(workbook.SheetNames);
          if (workbook.SheetNames.length > 0) {
            setActiveSheet(workbook.SheetNames[0]);
          }
        } else if (isDocx) {
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setDocxHtml(result.value || "<p class='text-slate-400 italic text-center'>Dokumen kosong</p>");
        }
      } catch (err: any) {
        console.error("Failed to parse document client-side:", err);
        setError("Gagal memuat atau mengurai berkas secara lokal. File mungkin korup atau tidak valid.");
      } finally {
        setLoading(false);
      }
    };

    fetchAndParseFile();
  }, [fileUrl]);

  if (!fileUrl) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-2 p-12">
        <FileText size={48} className="opacity-30" />
        <p className="text-sm font-bold">Tidak ada file yang dipilih untuk pratinjau</p>
      </div>
    );
  }

  // NATIVE VIEWERS
  const isImage = fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdf = fileUrl.match(/\.pdf$/i);

  if (isImage) {
    return (
      <div className="flex-1 overflow-hidden p-6 bg-slate-950/20 flex items-center justify-center relative backdrop-blur-md">
        <img 
          src={fileUrl} 
          alt="Preview" 
          className="max-w-full max-h-full object-contain rounded-xl shadow-2xl ring-1 ring-white/10" 
        />
      </div>
    );
  }

  if (isPdf) {
    return (
      <iframe 
        src={fileUrl} 
        title="PDF Preview" 
        className="w-full flex-1 border-none bg-slate-100" 
      />
    );
  }

  // LOADING STATE
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white text-slate-500 gap-3 p-12">
        <Loader2 size={36} className="animate-spin text-emerald-600" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sedang Mengurai Dokumen...</p>
        <p className="text-[10px] text-slate-400 font-semibold">Mengonversi file ke format interaktif browser</p>
      </div>
    );
  }

  // ERROR STATE
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-600 gap-4 p-8 max-w-md mx-auto text-center">
        <div className="w-12 h-12 bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 rounded-2xl">
          <AlertCircle size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-black uppercase tracking-wider text-slate-800">Pratinjau Tidak Tersedia</h4>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed">{error}</p>
        </div>
        <a 
          href={fileUrl} 
          download 
          className="flex items-center gap-2 bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs h-10 px-6 rounded-xl transition-all shadow-md"
        >
          <Download size={14} /> Unduh & Buka Berkas
        </a>
      </div>
    );
  }

  // EXCEL SPREADSHEET RENDERER
  if (sheetNames.length > 0) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-100 text-left">
        {/* Dynamic Sheets Tab Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center gap-2 shrink-0 overflow-x-auto select-none custom-scrollbar">
          <FileSpreadsheet size={14} className="text-emerald-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2 border-r pr-3">Lembar Kerja:</span>
          {sheetNames.map((name) => (
            <button
              key={name}
              onClick={() => setActiveSheet(name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border outline-none ${
                activeSheet === name
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Scrollable spreadsheet table */}
        <div className="flex-1 overflow-auto p-6 bg-white excel-preview-container custom-scrollbar">
          <div 
            className="prose prose-sm max-w-none prose-slate excel-table-wrapper"
            dangerouslySetInnerHTML={{ __html: excelSheets[activeSheet] || "" }} 
          />
        </div>

        {/* Dynamic styles injected for spreadsheet layout */}
        <style dangerouslySetInnerHTML={{ __html: `
          .excel-preview-container table {
            border-collapse: collapse;
            width: max-content;
            min-width: 100%;
            font-size: 11px;
            font-family: inherit;
            color: #334155;
          }
          .excel-preview-container th, .excel-preview-container td {
            border: 1px solid #cbd5e1;
            padding: 8px 12px;
            text-align: left;
            min-width: 80px;
          }
          .excel-preview-container tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .excel-preview-container tr:hover {
            background-color: #f1f5f9;
          }
        `}} />
      </div>
    );
  }

  // WORD DOCUMENT (.DOCX) RENDERER
  if (docxHtml) {
    return (
      <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center custom-scrollbar">
        {/* Realistic paper view wrapper */}
        <div className="bg-white max-w-5xl w-full min-h-[1100px] p-12 lg:p-16 shadow-2xl rounded-3xl border border-slate-200/80 animate-in zoom-in-95 duration-200 text-slate-800 leading-relaxed text-left relative overflow-hidden">
          {/* Watermark/Pratinjau tag */}
          <div className="absolute top-4 right-4 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl px-3 py-1 text-[8px] font-black uppercase tracking-widest leading-none select-none">
            Pratinjau Dokumen
          </div>
          
          <div 
            className="prose prose-sm max-w-none prose-slate docx-preview-content"
            dangerouslySetInnerHTML={{ __html: docxHtml }} 
          />
        </div>

        {/* Dynamic styles injected for docx styling */}
        <style dangerouslySetInnerHTML={{ __html: `
          .docx-preview-content {
            font-size: 13px;
          }
          .docx-preview-content h1 {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 8px;
            margin-top: 24px;
            margin-bottom: 16px;
            text-transform: uppercase;
            letter-spacing: -0.025em;
          }
          .docx-preview-content h2 {
            font-size: 16px;
            font-weight: 700;
            color: #1e293b;
            margin-top: 20px;
            margin-bottom: 12px;
            text-transform: uppercase;
          }
          .docx-preview-content h3 {
            font-size: 14px;
            font-weight: 600;
            color: #334155;
            margin-top: 16px;
            margin-bottom: 8px;
          }
          .docx-preview-content p {
            margin-bottom: 12px;
            text-align: justify;
          }
          .docx-preview-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
            font-size: 12px;
          }
          .docx-preview-content th, .docx-preview-content td {
            border: 1px solid #cbd5e1;
            padding: 8px 12px;
          }
          .docx-preview-content th {
            background-color: #f8fafc;
            font-weight: 700;
          }
          .docx-preview-content ul, .docx-preview-content ol {
            margin-left: 20px;
            margin-bottom: 12px;
          }
          .docx-preview-content li {
            margin-bottom: 4px;
          }
        `}} />
      </div>
    );
  }

  return null;
}
