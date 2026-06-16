// src/modules/admin/components/gis/layers/CompanyMarkerLayer.tsx
import React, { useMemo } from 'react';
import { Polygon, Marker } from 'react-leaflet';
import L from 'leaflet';
import { useGisUIStore } from '@/store/useGisUIStore';

interface CompanyMarkerLayerProps {
    companies: any[];
    currentZoom: number;
    mapOpacity: number;
    isOfficer: boolean;
}

// ============================================================================
// PURE FABRICATION: GENERATOR IKON MARKER (SIMPLIFIED SOLID & ALARM SYSTEM)
// ============================================================================
const createCompanyMarkerIcon = (score?: number | null, docType?: string, isSelected?: boolean) => {
    const normalizedDoc = docType === "UKL_UPL" ? "UKL-UPL" : docType || "SPPL";

    // 1. KORELASI UTAMA: Warna penanda (Dot & Ring) murni mewakili perizinan agar selaras dengan legenda
    let colorClass = "bg-emerald-500"; // Emerald (SPPL)
    let ringClass = "border-emerald-200 bg-emerald-500/20"; // Emerald (SPPL)

    if (normalizedDoc === 'AMDAL') {
        colorClass = "bg-red-500";
        ringClass = "border-red-200 bg-red-500/20";
    } else if (normalizedDoc === 'UKL-UPL') {
        colorClass = "bg-amber-500";
        ringClass = "border-amber-200 bg-amber-500/20";
    }

    // 2. ALARM KRITIS (Status NGGAK OK / EWS Alarm):
    // Jika skor audit di bawah 60, cincin luar otomatis beralih menjadi cincin merah berdenyut
    let pulseClass = "";
    const isCritical = score !== undefined && score !== null && score < 60;

    if (isCritical) {
        ringClass = "border-red-500 bg-red-500/25";
        pulseClass = "animate-pulse";
    }

    // Timpa styling jika marker sedang diklik/di-select oleh pengguna (Fokus Siku Kaku)
    if (isSelected) {
        ringClass = "border-slate-800 bg-slate-900/30 ring-2 ring-slate-800/10";
        pulseClass = ""; // Hentikan kedipan radar agar tampilan stabil saat diinspeksi
    }

    return L.divIcon({
        html: `
            <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
                <span class="absolute inline-flex h-6 w-6 rounded-full border-2 ${ringClass} ${pulseClass}"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 ${colorClass} border border-white shadow-sm"></span>
            </div>
        `,
        className: "custom-company-marker-wrapper bg-transparent border-none",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });
};

/**
 * ============================================================================
 * COMPANY MARKER LAYER (LOD & POLYMORPHIC RENDERER)
 * ============================================================================
 * Komponen ini bertanggung jawab mem-parsing data perusahaan dan 
 * merendernya di peta. Mematuhi prinsip LOD (Level of Detail).
 */
export default function CompanyMarkerLayer({ companies, currentZoom, mapOpacity, isOfficer }: CompanyMarkerLayerProps) {
    // Menarik state global yang dibutuhkan (Low Coupling ke LimbahMap)
    const {
        activeLayers,
        selectedCompanyId,
        setSelectedCompanyId,
        openPanel,
        closePanelsToTheRight
    } = useGisUIStore();

    // 1. Ekstraksi Poligon & Klasifikasi Layer (Information Expert)
    const processedCompanies = useMemo(() => {
        // Petugas lapangan tidak melihat katalog pabrik umum, mereka hanya melihat pin tugas.
        if (isOfficer) return [];

        return companies.map(c => {
            const lat = parseFloat(c.lat);
            const lng = parseFloat(c.lng);

            // Tentukan ke layer mana entitas ini masuk (berdasarkan regulasi)
            const layerId = c.docType === 'AMDAL' ? 'layer-amdal' :
                (c.docType === 'UKL-UPL' || c.docType === 'UKL_UPL') ? 'layer-uklupl' :
                    'layer-sppl';

            // Simulasi luasan bangunan pabrik (Bounding Box offset)
            const offset = 0.0008;
            const poly: [number, number][] = (isNaN(lat) || isNaN(lng))
                ? []
                : [
                    [lat - offset, lng - offset], [lat + offset, lng - offset],
                    [lat + offset, lng + offset], [lat - offset, lng + offset],
                ];

            // Konfigurasi warna poligon berdasarkan regulasi (Sesuai dengan warna marker)
            let style = { color: '#10b981', fillColor: '#10b981' }; // Emerald (SPPL)
            if (c.status === "PENDING" || c.status === "REVIEW") {
                style = { color: '#3b82f6', fillColor: '#3b82f6' }; // Biru (Pending)
            } else if (c.status === "SUSPENDED" || c.status === "REJECTED") {
                style = { color: '#64748b', fillColor: '#64748b' }; // Abu-abu (Suspend)
            } else {
                if (c.docType === 'AMDAL') style = { color: '#ef4444', fillColor: '#ef4444' }; // Merah
                else if (c.docType === 'UKL-UPL' || c.docType === 'UKL_UPL') style = { color: '#f59e0b', fillColor: '#f59e0b' }; // Amber
            }

            return { ...c, lat, lng, polygon: poly, layerId, style };
        }).filter(c => !isNaN(c.lat) && !isNaN(c.lng));
    }, [companies, isOfficer]);

    // 2. Click Handler (Trigger Laci Konteks GFW)
    const handleEntityClick = (c: any, e: L.LeafletMouseEvent) => {
        e.originalEvent.stopPropagation();

        // REVISI / PENYELARASAN POLIMORFISME: Menguji eksistensi getBounds sebelum melakukan fly
        const hasGetBounds = typeof e.target.getBounds === 'function';
        if (currentZoom >= 16 && hasGetBounds) {
            e.target._map.flyToBounds(e.target.getBounds(), { padding: [100, 100], duration: 1.5 });
        } else {
            const coords = typeof e.target.getLatLng === 'function'
                ? e.target.getLatLng()
                : [c.lat, c.lng];
            e.target._map.flyTo(coords, 16, { animate: true, duration: 1.5 });
        }

        setSelectedCompanyId(c.id);

        // Memutus rantai laci melayang sebelumnya (Zero-Gap Stack Policy)
        closePanelsToTheRight(-1);

        // Buka laci Administrasi Perusahaan wajib (data dasar)
        openPanel("detil-perusahaan", `Detail Industri`, c);

        // [CONTEXT-AWARE PANEL ORCHESTRATION]: 
        // Hanya buka laci telemetri udara jika layer kualitas udara (layer-aqi) sedang aktif dicentang!
        if (activeLayers.includes("layer-aqi")) {
            openPanel("telemetri-lingkungan", `Telemetri Spasial`, c);
        }
    };

    if (isOfficer) return null;

    return (
        <React.Fragment>
            {processedCompanies.map(c => {
                // Cek apakah layer dari entitas ini sedang dihidupkan di menu samping
                if (!activeLayers.includes(c.layerId)) return null;

                const isSelected = selectedCompanyId === c.id;

                // [LOD RENDERER] 
                // Jika zoom 16 atau lebih dekat, render bentuk asli Poligon pabrik.
                if (currentZoom >= 16 && c.polygon.length > 0) {
                    return (
                        <Polygon
                            key={`poly-${c.id}`}
                            positions={c.polygon}
                            pathOptions={{
                                color: isSelected ? '#0f172a' : c.style.color, // Jika dipilih, garis luar jadi tegas
                                fillColor: c.style.fillColor,
                                fillOpacity: isSelected ? 0.7 : (0.4 * (mapOpacity / 100)),
                                weight: isSelected ? 3 : 2,
                                dashArray: c.layerId === 'layer-amdal' ? '6,4' : undefined,
                            }}
                            eventHandlers={{ click: (e) => handleEntityClick(c, e) }}
                        />
                    );
                }

                // Jika zoom di bawah 16, render Pin Minimalis untuk hemat memori
                return (
                    <Marker
                        key={`marker-${c.id}`}
                        position={[c.lat, c.lng]}
                        icon={createCompanyMarkerIcon(c.score, c.docType, isSelected)}
                        eventHandlers={{ click: (e) => handleEntityClick(c, e) }}
                    />
                );
            })}
        </React.Fragment>
    );
}