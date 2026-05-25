import React, { useState, useEffect, useCallback } from 'react';
import {
  MapContainer, TileLayer, Polygon, Popup, LayersControl,
  ZoomControl, FeatureGroup, useMap,
} from 'react-leaflet';
import L from 'leaflet';

// Map invalidator helper to handle screen size changes, tab switches, and fullscreen mode transitions
function ResizeMap({ isFullscreen }: { isFullscreen: boolean }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map, isFullscreen]);
  return null;
}
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useSijagaStore } from '@/store/useSijagaStore';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Factory, Navigation, Maximize2, Minimize2, Layers, Globe,
  X, ChevronDown, ChevronUp, Eye, EyeOff, RefreshCw,
  Building2, AlertTriangle, CheckCircle2, Info, PanelLeftClose, PanelLeft,
} from "lucide-react";
import { toast } from "sonner";
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';

// ─── Fix Leaflet default icon ─────────────────────────────────────────────────
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ─── Kewajiban dokumen lingkungan ──────────────────────────────────────────────
type DocObligation = 'AMDAL' | 'UKL-UPL' | 'SPPL';

interface ObligationStyle {
  color: string;
  fillColor: string;
  label: string;
  tailwind: string;
  hex: string;
}

const OBLIGATION_STYLES: Record<DocObligation, ObligationStyle> = {
  AMDAL: { color: '#ef4444', fillColor: '#ef4444', label: 'AMDAL', tailwind: 'bg-red-500', hex: '#ef4444' },
  'UKL-UPL': { color: '#f59e0b', fillColor: '#f59e0b', label: 'UKL-UPL', tailwind: 'bg-amber-500', hex: '#f59e0b' },
  SPPL: { color: '#22c55e', fillColor: '#22c55e', label: 'SPPL', tailwind: 'bg-emerald-500', hex: '#22c55e' },
};

// ─── Mock company data dengan poligon ─────────────────────────────────────────
// Setiap perusahaan memiliki poligon koordinat & jenis kewajiban lingkungan.
// Data ini akan diganti dengan data real dari API ketika backend siap.
interface CompanyPolygon {
  id: string;
  name: string;
  obligation: DocObligation;
  address: string;
  sector: string;
  polygon: [number, number][];
}

const MOCK_COMPANY_POLYGONS: CompanyPolygon[] = [
  {
    id: 'c1', name: 'PT Industri Kimia Nusantara', obligation: 'AMDAL',
    address: 'Jl. Industri Raya No.1, Bandung', sector: 'Kimia & Petrokimia',
    polygon: [
      [-6.9050, 107.6180], [-6.9060, 107.6210], [-6.9085, 107.6215],
      [-6.9080, 107.6175], [-6.9060, 107.6165],
    ],
  },
  {
    id: 'c2', name: 'PT Tekstil Maju Bersama', obligation: 'AMDAL',
    address: 'Kawasan Industri Dayeuhkolot, Bandung', sector: 'Tekstil & Garmen',
    polygon: [
      [-6.9280, 107.6130], [-6.9295, 107.6155], [-6.9315, 107.6148],
      [-6.9305, 107.6115], [-6.9285, 107.6110],
    ],
  },
  {
    id: 'c3', name: 'CV Mitra Bahan Kimia', obligation: 'UKL-UPL',
    address: 'Jl. Raya Majalaya KM 4, Bandung', sector: 'Distribusi Bahan Kimia',
    polygon: [
      [-6.9150, 107.6320], [-6.9160, 107.6345], [-6.9178, 107.6340],
      [-6.9170, 107.6312], [-6.9155, 107.6308],
    ],
  },
  {
    id: 'c4', name: 'PT Logam Karya Mandiri', obligation: 'UKL-UPL',
    address: 'Jl. Leuwipanjang No.12, Bandung', sector: 'Pengolahan Logam',
    polygon: [
      [-6.9400, 107.5980], [-6.9412, 107.6010], [-6.9430, 107.6005],
      [-6.9420, 107.5970], [-6.9405, 107.5965],
    ],
  },
  {
    id: 'c5', name: 'UD Laundry & Celup Bandung', obligation: 'SPPL',
    address: 'Jl. Gedebage No.55, Bandung', sector: 'Laundri & Pencelupan',
    polygon: [
      [-6.9200, 107.6800], [-6.9210, 107.6825], [-6.9228, 107.6820],
      [-6.9218, 107.6792], [-6.9203, 107.6788],
    ],
  },
  {
    id: 'c6', name: 'CV Bengkel Otomotif Sentosa', obligation: 'SPPL',
    address: 'Jl. Soekarno Hatta No.88, Bandung', sector: 'Otomotif & Bengkel',
    polygon: [
      [-6.9350, 107.6390], [-6.9360, 107.6415], [-6.9378, 107.6408],
      [-6.9368, 107.6380], [-6.9353, 107.6375],
    ],
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GISMonitoring() {
  const { companies, fetchCompanies } = useSijagaStore();

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Map center (Bandung)
  const center: [number, number] = [-6.9147, 107.6098];

  // ── Fullscreen state ──────────────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Panel visibility states ───────────────────────────────────────────────
  const [showLeftPanel, setShowLeftPanel] = useState(true);

  // Left panel collapse
  const [leftCollapsed, setLeftCollapsed] = useState(false);

  // ── Layer visibility per obligation ──────────────────────────────────────
  const [showAmdal, setShowAmdal] = useState(true);
  const [showUklUpl, setShowUklUpl] = useState(true);
  const [showSppl, setShowSppl] = useState(true);

  // ── River & industrial overlay ────────────────────────────────────────────
  const [riverLayer, setRiverLayer] = useState(true);
  const [industrialLayer, setIndustrialLayer] = useState(true);

  // ── Selected company ──────────────────────────────────────────────────────
  const [selected, setSelected] = useState<CompanyPolygon | null>(null);

  // Transform real approved companies from DB into CompanyPolygon shape
  const realCompanyPolygons = companies
    .filter(c => c.status === "APPROVED")
    .map(c => {
      const lat = parseFloat(c.lat);
      const lng = parseFloat(c.lng);
      const offset = 0.0008; // approx 80-100m bounding box
      
      const poly: [number, number][] = isNaN(lat) || isNaN(lng)
        ? [[-6.9147, 107.6098], [-6.9147, 107.6098], [-6.9147, 107.6098], [-6.9147, 107.6098]]
        : [
            [lat - offset, lng - offset],
            [lat + offset, lng - offset],
            [lat + offset, lng + offset],
            [lat - offset, lng + offset],
          ];

      const obligation: DocObligation = c.docType === 'AMDAL' ? 'AMDAL' : (c.docType === 'UKL-UPL' || c.docType === 'UKL_UPL' ? 'UKL-UPL' : 'SPPL');

      return {
        id: c.id,
        name: c.companyName,
        obligation,
        address: c.address,
        sector: c.rawMaterials || "Kepatuhan Lingkungan",
        polygon: poly
      };
    });

  // Fallback to mock polygons if no real ones are approved yet
  const allCompanyPolygons = realCompanyPolygons.length > 0 ? realCompanyPolygons : MOCK_COMPANY_POLYGONS;

  // ── Statistics ────────────────────────────────────────────────────────────
  const countAmdal = allCompanyPolygons.filter(c => c.obligation === 'AMDAL').length;
  const countUkl = allCompanyPolygons.filter(c => c.obligation === 'UKL-UPL').length;
  const countSppl = allCompanyPolygons.filter(c => c.obligation === 'SPPL').length;

  // ── Fullscreen toggle — hide/show DashboardLayout chrome ─────────────────
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(fs => {
      const next = !fs;
      if (next) {
        // Force hide sidebar by adding a CSS class to root
        document.documentElement.classList.add('gis-fullscreen');
        toast.success('Mode Layar Penuh diaktifkan. Tekan Esc atau tombol Exit untuk keluar.');
      } else {
        document.documentElement.classList.remove('gis-fullscreen');
        toast.success('Mode Layar Penuh dinonaktifkan.');
      }
      return next;
    });
  }, []);

  // Exit fullscreen on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) toggleFullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen, toggleFullscreen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => document.documentElement.classList.remove('gis-fullscreen');
  }, []);

  // ── Filtered polygon data ─────────────────────────────────────────────────
  const visibleCompanies = allCompanyPolygons.filter(c => {
    if (c.obligation === 'AMDAL' && !showAmdal) return false;
    if (c.obligation === 'UKL-UPL' && !showUklUpl) return false;
    if (c.obligation === 'SPPL' && !showSppl) return false;
    return true;
  });

  // ── Render ────────────────────────────────────────────────────────────────
  const mapContent = (
    <div className="relative w-full h-full">

      {/* ── TOP BAR (title + controls) ────────────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-start gap-3 pointer-events-none">

        {/* Title card */}
        <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/95 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-xl border border-white/5 flex-shrink-0">
          <Globe size={18} className="text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
          <div>
            <h1 className="text-xs font-black tracking-widest uppercase text-emerald-400 leading-none">
              PANTAU LIMBAH GIS
            </h1>
            <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
              Pemantauan Kewajiban Lingkungan
            </p>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right action buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Toggle left panel */}
          <ControlBtn
            icon={showLeftPanel ? <PanelLeftClose size={15} /> : <PanelLeft size={15} />}
            label={showLeftPanel ? 'Tutup Panel' : 'Buka Panel'}
            onClick={() => setShowLeftPanel(v => !v)}
          />
          {/* Refresh */}
          <ControlBtn
            icon={<RefreshCw size={15} />}
            label="Refresh"
            onClick={() => {
              fetchCompanies();
              toast.info('Data GIS disinkronkan.');
            }}
          />
          {/* Fullscreen toggle */}
          <ControlBtn
            icon={isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            label={isFullscreen ? 'Exit Full' : 'Fullscreen'}
            onClick={toggleFullscreen}
            highlight={isFullscreen}
          />
        </div>
      </div>

      {/* ── LEFT PANEL ───────────────────────────────────────────────────── */}
      {showLeftPanel && (
        <div className="absolute top-[4.5rem] left-4 z-[1000] w-[320px] pointer-events-auto flex flex-col gap-3" style={{ maxHeight: 'calc(100vh - 6rem)' }}>
          
          {/* Stats & Filter Panel */}
          <PanelCard
            title="Kewajiban Lingkungan"
            icon={<Layers size={13} />}
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div 
                className={cn("border rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer transition-all", showAmdal ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/20" : "bg-slate-800/50 border-white/5 opacity-60 hover:opacity-100")} 
                onClick={() => setShowAmdal(!showAmdal)}
              >
                <span className={cn("text-xl font-black leading-none", showAmdal ? "text-red-500" : "text-slate-400")}>{countAmdal}</span>
                <span className={cn("text-[9px] font-bold mt-1 uppercase", showAmdal ? "text-red-600" : "text-slate-500")}>AMDAL</span>
                <div className={cn("w-full h-1 mt-1.5 rounded-full transition-all", showAmdal ? "bg-red-500" : "bg-slate-700")} />
              </div>
              <div 
                className={cn("border rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer transition-all", showUklUpl ? "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20" : "bg-slate-800/50 border-white/5 opacity-60 hover:opacity-100")} 
                onClick={() => setShowUklUpl(!showUklUpl)}
              >
                <span className={cn("text-xl font-black leading-none", showUklUpl ? "text-amber-500" : "text-slate-400")}>{countUkl}</span>
                <span className={cn("text-[9px] font-bold mt-1 uppercase", showUklUpl ? "text-amber-600" : "text-slate-500")}>UKL-UPL</span>
                <div className={cn("w-full h-1 mt-1.5 rounded-full transition-all", showUklUpl ? "bg-amber-500" : "bg-slate-700")} />
              </div>
              <div 
                className={cn("border rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer transition-all", showSppl ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20" : "bg-slate-800/50 border-white/5 opacity-60 hover:opacity-100")} 
                onClick={() => setShowSppl(!showSppl)}
              >
                <span className={cn("text-xl font-black leading-none", showSppl ? "text-emerald-500" : "text-slate-400")}>{countSppl}</span>
                <span className={cn("text-[9px] font-bold mt-1 uppercase", showSppl ? "text-emerald-600" : "text-slate-500")}>SPPL</span>
                <div className={cn("w-full h-1 mt-1.5 rounded-full transition-all", showSppl ? "bg-emerald-500" : "bg-slate-700")} />
              </div>
            </div>

            {/* Other Layers Collapsible */}
            <details className="group">
              <summary className="text-[10px] font-bold text-slate-400 cursor-pointer hover:text-emerald-400 transition-colors list-none flex items-center justify-between bg-slate-800/50 px-3 py-2 rounded-lg">
                <span>Overlay Lingkungan Tambahan</span>
                <ChevronDown size={12} className="group-open:rotate-180 transition-transform" />
              </summary>
              <div className="pt-3 pb-1 px-1 space-y-2">
                <LayerToggle
                  color="bg-blue-500"
                  label="DAS Aliran Sungai"
                  checked={riverLayer}
                  onChange={setRiverLayer}
                />
                <LayerToggle
                  color="bg-orange-500"
                  label="RTRW Zonasi Industri"
                  checked={industrialLayer}
                  onChange={setIndustrialLayer}
                />
              </div>
            </details>
          </PanelCard>

          {/* Company list */}
          <div className="flex-1 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl flex flex-col min-h-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2 text-emerald-400">
                <Building2 size={13} />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Daftar Perusahaan</span>
              </div>
              <Badge variant="secondary" className="bg-white/10 hover:bg-white/20 text-[9px] text-slate-300 font-bold border-none">
                {visibleCompanies.length} Data
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
              {visibleCompanies.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs font-semibold">
                  Tidak ada data yang ditampilkan.
                </div>
              ) : (
                visibleCompanies.map(c => {
                  const style = OBLIGATION_STYLES[c.obligation];
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-xl transition-all border",
                        selected?.id === c.id
                          ? "bg-white/10 border-white/20"
                          : "bg-white/5 border-white/5 hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-[11px] font-bold text-white leading-tight truncate mb-1" title={c.name}>{c.name}</p>
                          <p className="text-[9px] text-slate-400 truncate" title={c.sector}>{c.sector}</p>
                        </div>
                        <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded shrink-0 text-white shadow-sm", style.tailwind)}>
                          {c.obligation}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}

      {/* ── SELECTED COMPANY DETAIL PANEL (RIGHT) ────────────────────────── */}
      {selected && (
        <div className="absolute top-[4.5rem] right-4 z-[1000] w-[260px] pointer-events-auto">
          <PanelCard
            title="Detail Perusahaan"
            icon={<Info size={13} />}
            onClose={() => setSelected(null)}
          >
            <div className="space-y-3">
              <div>
                <p className="text-xs font-black text-white leading-snug">{selected.name}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{selected.sector}</p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-white"
                  style={{ backgroundColor: OBLIGATION_STYLES[selected.obligation].hex }}
                >
                  {selected.obligation === 'AMDAL' && <AlertTriangle size={9} />}
                  {selected.obligation === 'SPPL' && <CheckCircle2 size={9} />}
                  {selected.obligation}
                </span>
              </div>

              <div className="text-[10px] text-slate-400 space-y-1">
                <p><span className="text-slate-300 font-semibold">Alamat:</span> {selected.address}</p>
              </div>

              <ObligationInfoBox obligation={selected.obligation} />

              <Button
                size="sm"
                className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black tracking-wider rounded-xl"
                onClick={() => toast.info(`Membuka detail ${selected.name}`)}
              >
                LIHAT DETAIL LENGKAP
              </Button>
            </div>
          </PanelCard>
        </div>
      )}

      {/* ── THE MAP ──────────────────────────────────────────────────────── */}
      <div className="w-full h-full z-0">
        <MapContainer
          center={center}
          zoom={13}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <ZoomControl position="bottomright" />
          <ResizeMap isFullscreen={isFullscreen} />

          <LayersControl position="bottomright">
            <LayersControl.BaseLayer checked name="Voyager (Default)">
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satelit">
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="OpenStreetMap">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* ── Company Polygons ─────────────────────────────────────────── */}
          {visibleCompanies.map(c => {
            const style = OBLIGATION_STYLES[c.obligation];
            const isSelected = selected?.id === c.id;
            return (
              <FeatureGroup key={c.id}>
                <Polygon
                  positions={c.polygon}
                  pathOptions={{
                    color: style.color,
                    fillColor: style.fillColor,
                    fillOpacity: isSelected ? 0.45 : 0.28,
                    weight: isSelected ? 3 : 2,
                    dashArray: c.obligation === 'AMDAL' ? '6,4' : undefined,
                  }}
                  eventHandlers={{
                    click: () => setSelected(c),
                  }}
                >
                  <Popup>
                    <div className="p-3 space-y-2 font-sans text-slate-800 max-w-xs text-left min-w-[200px]">
                      <div className="flex justify-between items-start gap-2 border-b pb-2">
                        <div>
                          <h4 className="font-black text-slate-900 text-xs leading-tight">{c.name}</h4>
                          <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{c.sector}</p>
                        </div>
                        <span
                          className="flex-shrink-0 text-[8px] font-black px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: style.hex }}
                        >
                          {c.obligation}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600">{c.address}</p>
                      <ObligationInfoBox obligation={c.obligation} compact />
                    </div>
                  </Popup>
                </Polygon>
              </FeatureGroup>
            );
          })}

          {/* ── River overlay ────────────────────────────────────────────── */}
          {riverLayer && (
            <FeatureGroup>
              {[
                { center: [-6.9147, 107.6098] as [number, number], r: 3500 },
                { center: [-6.9388, 107.6255] as [number, number], r: 2800 },
                { center: [-6.9550, 107.5900] as [number, number], r: 4000 },
              ].map((c, i) => (
                <Polygon
                  key={i}
                  positions={circleToPolygon(c.center, c.r, 36)}
                  pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.07, weight: 1.5, dashArray: '4,4' }}
                />
              ))}
            </FeatureGroup>
          )}

          {/* ── Industrial RTRW overlay ───────────────────────────────────── */}
          {industrialLayer && (
            <FeatureGroup>
              {[
                { center: [-6.8245, 107.6190] as [number, number], r: 2000 },
                { center: [-6.9034, 107.6189] as [number, number], r: 2500 },
                { center: [-6.9600, 107.6300] as [number, number], r: 3000 },
              ].map((c, i) => (
                <Polygon
                  key={i}
                  positions={circleToPolygon(c.center, c.r, 36)}
                  pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.09, weight: 1.5, dashArray: '4,4' }}
                />
              ))}
            </FeatureGroup>
          )}

        </MapContainer>
      </div>
    </div>
  );

  // ── Fullscreen mode: render outside DashboardLayout ──────────────────────
  if (isFullscreen) {
    return (
      <div
        className="fixed inset-0 z-[9999] bg-black"
        style={{ isolation: 'isolate' }}
      >
        <style>{`
          .gis-fullscreen [data-sidebar],
          .gis-fullscreen nav,
          .gis-fullscreen header,
          .gis-fullscreen footer { display: none !important; }
        `}</style>
        {mapContent}
      </div>
    );
  }

  return (
    <DashboardLayout role="ADMIN_DLH" noPadding={true}>
      <div className="w-full h-full relative text-left">
        {mapContent}
      </div>
    </DashboardLayout>
  );
}

// ─── Helper: approximate circle as polygon ────────────────────────────────────
function circleToPolygon(center: [number, number], radiusM: number, numPoints: number): [number, number][] {
  const earthRadius = 6371000;
  const lat = (center[0] * Math.PI) / 180;
  const lng = (center[1] * Math.PI) / 180;
  const d = radiusM / earthRadius;

  const points: [number, number][] = [];
  for (let i = 0; i < numPoints; i++) {
    const bearing = (2 * Math.PI * i) / numPoints;
    const latPoint = Math.asin(
      Math.sin(lat) * Math.cos(d) +
      Math.cos(lat) * Math.sin(d) * Math.cos(bearing)
    );
    const lngPoint = lng + Math.atan2(
      Math.sin(bearing) * Math.sin(d) * Math.cos(lat),
      Math.cos(d) - Math.sin(lat) * Math.sin(latPoint)
    );
    points.push([(latPoint * 180) / Math.PI, (lngPoint * 180) / Math.PI]);
  }
  return points;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ControlBtn({
  icon, label, onClick, highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "flex flex-col items-center justify-center w-12 h-12 rounded-2xl shadow-xl text-xs font-black uppercase tracking-wider transition-all border",
        highlight
          ? "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700"
          : "bg-slate-900/95 text-slate-300 border-white/5 hover:text-emerald-400 backdrop-blur-xl"
      )}
    >
      {icon}
      <span className="text-[7px] mt-0.5 opacity-70">{label.split(' ')[0]}</span>
    </button>
  );
}

function PanelCard({
  title, icon, children, collapsible = false, onClose,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  onClose?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
        <div className="flex items-center gap-2 text-emerald-400">
          {icon}
          <span className="text-[10px] font-black uppercase tracking-widest text-white">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {collapsible && (
            <button
              onClick={() => setCollapsed(v => !v)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-rose-400 transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>
      {!collapsed && (
        <div className="p-4 text-slate-300">
          {children}
        </div>
      )}
    </div>
  );
}

function LayerToggle({
  color, label, sublabel, checked, onChange,
}: {
  color: string;
  label: string;
  sublabel?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-start gap-2 min-w-0">
        <span className={cn("w-2.5 h-2.5 rounded-full shrink-0 mt-0.5", color)} />
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-slate-200 leading-none">{label}</p>
          {sublabel && <p className="text-[9px] text-slate-500 mt-0.5 leading-none">{sublabel}</p>}
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="shrink-0 data-[state=checked]:bg-emerald-600"
      />
    </div>
  );
}



function ObligationInfoBox({ obligation, compact = false }: { obligation: DocObligation; compact?: boolean }) {
  const info: Record<DocObligation, { icon: React.ReactNode; text: string; bg: string; text_color: string }> = {
    AMDAL: {
      icon: <AlertTriangle size={10} className="text-red-500 shrink-0 mt-0.5" />,
      text: 'Wajib AMDAL — dampak lingkungan besar, perlu kajian mendalam.',
      bg: 'bg-red-50', text_color: 'text-red-800',
    },
    'UKL-UPL': {
      icon: <Navigation size={10} className="text-amber-500 shrink-0 mt-0.5" />,
      text: 'Wajib UKL-UPL — dampak sedang, perlu upaya pengelolaan.',
      bg: 'bg-amber-50', text_color: 'text-amber-800',
    },
    SPPL: {
      icon: <CheckCircle2 size={10} className="text-emerald-600 shrink-0 mt-0.5" />,
      text: 'Wajib SPPL — dampak minimal, perlu pernyataan pengelolaan.',
      bg: 'bg-emerald-50', text_color: 'text-emerald-800',
    },
  };
  const { icon, text, bg, text_color } = info[obligation];
  return (
    <div className={cn("flex items-start gap-1.5 p-2 rounded-lg border", bg, compact ? '' : 'mt-1')}>
      {icon}
      <p className={cn("text-[9px] leading-relaxed", text_color)}>{text}</p>
    </div>
  );
}