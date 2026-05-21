import React, { useState, useEffect } from 'react';
import { FileText, Image as ImageIcon, X, Eye, UploadCloud } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface FileUploadProps {
  label: string;
  accept?: string;
  onChange: (file: File | null) => void;
  error?: string;
}

export const FileUploadWithPreview = ({ label, accept, onChange, error }: FileUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onChange(file);
      
      // Buat URL untuk preview jika itu gambar
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null); // Reset preview jika PDF
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    onChange(null);
  };

  // Cleanup URL object untuk mencegah memory leak
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">{label}</Label>
      
      {!selectedFile ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center cursor-pointer relative">
          <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
          <p className="text-xs text-gray-500 text-center">
            Klik atau seret file ke sini <br/> (PDF, JPG, PNG - Max 5MB)
          </p>
          <input
            type="file"
            accept={accept}
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="relative border rounded-lg p-3 bg-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Tampilan Icon Berdasarkan Tipe File */}
            <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
              {selectedFile.type.startsWith('image/') && previewUrl ? (
                <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <FileText className="w-6 h-6 text-blue-500" />
              )}
            </div>
            
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</p>
              <p className="text-xs text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>

          <div className="flex gap-1">
            {/* Tombol Preview untuk PDF */}
            {selectedFile.type === 'application/pdf' && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => window.open(URL.createObjectURL(selectedFile), '_blank')}
              >
                <Eye className="w-4 h-4 text-gray-500" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={removeFile}
            >
              <X className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
      )}
      
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};