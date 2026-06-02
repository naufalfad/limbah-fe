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
// PURE FABRICATION: GENERATOR IKON MARKER
// ============================================================================
const createCompanyMarkerIcon = (score?: number | null, docType?: string, isSelected?: boolean) => {
    let colorClass = "bg-emerald-500";
    let ringClass = "border-emerald-200 bg-emerald-500/20";
    let pulseClass = ""; // Default: TIDAK ADA ANIMASI (Mencegah Cognitive Overload)

    // Logika pewarnaan berdasarkan ESG Score
    if (score !== undefined && score !== null) {
        if (score < 60) {
            colorClass = "bg-red-500";
            ringClass = "border-red-200 bg-red-500/20";
            pulseClass = "animate-pulse"; // UX FIX: Animasi berkedip HANYA untuk status KRITIS
        } else if (score < 80) {
            colorClass = "bg-amber-500";
            ringClass = "border-amber-200 bg-amber-500/20";
        }
    } else if (docType === 'AMDAL') {
        colorClass = "bg-red-500";
        ringClass = "border-red-200 bg-red-500/20";
    }

    // Timpa styling jika marker sedang diklik/di-select user
    if (isSelected) {
        ringClass = "border-slate-800 bg-slate-900/30";
        pulseClass = ""; // Hentikan kedipan jika sudah di-klik (Acknowledged)
    }

    return L.divIcon({
        html: `
            <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
                <span class="absolute inline-flex h-6 w-6 rounded-full border ${ringClass} ${pulseClass}"></span>
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
 * Komponen ini hanya bertanggung jawab mem-parsing data perusahaan dan 
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

            // Konfigurasi warna poligon berdasarkan regulasi
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

    // 2. Click Handler (Trigger Laci Ganda GFW)
    const handleEntityClick = (c: any, e: L.LeafletMouseEvent) => {
        e.originalEvent.stopPropagation();

        // Posisikan kamera secara dinamis
        if (currentZoom >= 16) {
            e.target._map.flyToBounds(e.target.getBounds(), { padding: [100, 100], duration: 1.5 });
        } else {
            e.target._map.flyTo([c.lat, c.lng], 16, { animate: true, duration: 1.5 });
        }

        setSelectedCompanyId(c.id);

        // Memutus rantai laci melayang sebelumnya (Zero-Gap Stack Policy)
        closePanelsToTheRight(-1);

        // [DOUBLE TRIGGER] Buka 2 laci sekaligus: Administrasi & Telemetri Udara
        openPanel("detil-perusahaan", `Detail Industri`, c);
        openPanel("telemetri-lingkungan", `Telemetri Spasial`, c);
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