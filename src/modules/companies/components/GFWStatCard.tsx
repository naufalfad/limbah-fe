// src/modules/companies/components/GFWStatCard.tsx
import React from "react";
import { cn } from "@/lib/utils";

export interface GFWStatCardProps {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ReactNode;
    color?: "emerald" | "blue" | "amber" | "red" | "indigo";
}

export default function GFWStatCard({
    label,
    value,
    sub,
    icon,
    color = "emerald",
}: GFWStatCardProps) {
    // Pemetaan warna fungsional GFW (Flat border, light background)
    const colors = {
        emerald: "bg-emerald-50/40 text-emerald-600 border-emerald-200",
        blue: "bg-blue-50/40 text-blue-600 border-blue-200",
        amber: "bg-amber-50/40 text-amber-600 border-amber-200",
        red: "bg-red-50/40 text-red-600 border-red-200",
        indigo: "bg-indigo-50/40 text-indigo-600 border-indigo-200",
    };

    return (
        <div className="border border-slate-200 bg-white p-4 rounded-none shadow-none flex justify-between items-start select-none hover:border-slate-300 transition-colors">

            {/* SISI KIRI: Informasi & Angka Metrik */}
            <div className="space-y-2 text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">
                    {label}
                </p>

                <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
                    {value}
                </h2>

                {sub && (
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                        {sub}
                    </p>
                )}
            </div>

            {/* SISI KANAN: Icon Container Siku Kaku */}
            <div className={cn(
                "w-10 h-10 border flex items-center justify-center shrink-0 rounded-none",
                colors[color]
            )}>
                {React.cloneElement(icon as React.ReactElement<any>, { size: 18, strokeWidth: 2.5 })}
            </div>

        </div>
    );
}