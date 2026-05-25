// src/modules/dashboard/components/auditor/AuditorStatCard.tsx
import React from "react";
import { cn } from "@/lib/utils";

interface AuditorStatCardProps {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ReactNode;
    color?: "blue" | "emerald" | "amber" | "red";
    trend?: string;
}

export default function AuditorStatCard({
    label,
    value,
    sub,
    icon,
    color = "emerald",
    trend,
}: AuditorStatCardProps) {
    const colors = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        red: "bg-red-50 text-red-600 border-red-100",
    };

    return (
        <div className="border border-slate-200 bg-white p-4 shadow-sm flex items-start justify-between rounded-none select-none hover:border-emerald-300 transition-colors">
            <div className="space-y-1">
                {/* Label Micro: High-Density & Rapat */}
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {label}
                </p>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none italic">
                    {value}
                </h2>
                {trend && (
                    <span className={cn(
                        "inline-flex px-1.5 py-0.5 mt-2 text-[8px] font-bold border rounded-none uppercase tracking-wider",
                        color === "red" ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}>
                        {trend}
                    </span>
                )}
                {sub && !trend && (
                    <p className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider leading-none">
                        {sub}
                    </p>
                )}
            </div>

            {/* Icon Wrapper: Tanpa rounded, kaku siku */}
            <div className={cn("w-10 h-10 border flex items-center justify-center shrink-0 rounded-none", colors[color])}>
                {/* FIXED: Casting ke React.ReactElement<any> agar mengizinkan prop 'size' dinamis */}
                {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
            </div>
        </div>
    );
}