// src/modules/inspections/components/SignaturePad.tsx
import React, { useRef, useState, useEffect } from "react";
import { PenTool, RotateCcw } from "lucide-react";

interface SignaturePadProps {
    onChange: (isSigned: boolean, dataUrl: string | null) => void;
}

export default function SignaturePad({ onChange }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isSigned, setIsSigned] = useState(false);

    // Inisialisasi properti gambar pada kanvas saat diload
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.strokeStyle = "#0f172a"; // Slate-900 (Warna tinta pulpen hitam tajam)
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
    }, []);

    // Mendapatkan koordinat coretan (Mendukung Mouse & Sentuhan Jari Layar HP)
    const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        if ("touches" in e) {
            // Skenario HP/Tablet (Touch Screen)
            if (e.touches.length === 0) return { x: 0, y: 0 };
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top,
            };
        } else {
            // Skenario PC/Laptop (Mouse Click)
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        // Mencegah scrolling layar saat petugas mencoret kanvas di HP
        if ("touches" in e) e.preventDefault();

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { x, y } = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        if ("touches" in e) e.preventDefault();

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { x, y } = getCoordinates(e);
        ctx.lineTo(x, y);
        ctx.stroke();

        if (!isSigned) {
            setIsSigned(true);
        }
        // Kirim data Base64 gambar ke form induk secara real-time
        onChange(true, canvas.toDataURL("image/png"));
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsSigned(false);
        onChange(false, null); // Reset status di form induk
    };

    return (
        <div className="space-y-2 text-left">
            <div className="flex justify-between items-center select-none">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <PenTool size={12} className="text-emerald-600" /> Tanda Tangan Digital BAP
                </label>
                {isSigned && (
                    <button
                        type="button"
                        onClick={clearCanvas}
                        className="flex items-center gap-1 text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline outline-none"
                    >
                        <RotateCcw size={10} /> Bersihkan
                    </button>
                )}
            </div>

            {/* Kanvas kaku tanpa rounded */}
            <div className="border border-slate-200 bg-slate-50 rounded-none p-1 relative overflow-hidden">
                <canvas
                    ref={canvasRef}
                    width={480}
                    height={120}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[120px] bg-white rounded-none cursor-crosshair border border-slate-100 touch-none"
                />
                {!isSigned && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-[10px] font-bold uppercase tracking-widest gap-2 select-none">
                        <PenTool size={12} /> Goreskan tanda tangan disini
                    </div>
                )}
            </div>
        </div>
    );
}