// src/lib/spatialAnalytics.ts

// @ts-ignore - Bypass issue mapping exports Turf.js v6.5 di TypeScript modern (Vite Bundler)
import * as turf from '@turf/turf';

/**
 * 1. MENGHITUNG KEPADATAN INDUSTRI PER KECAMATAN (Choropleth Aggregation)
 * Menggunakan algoritma Point-in-Polygon (PIP) untuk agregasi spasial industri.
 * 
 * @param companies - Array data perusahaan dari store (memiliki lat & lng)
 * @param geojsonKecamatan - FeatureCollection GeoJSON dari Kecamatan Kabupaten Bogor
 * @returns Object Record berisi { "Nama Kecamatan": JumlahPabrik }
 */
export const calculateCompaniesPerKecamatan = (
    companies: any[],
    geojsonKecamatan: any
): Record<string, number> => {
    const counts: Record<string, number> = {};

    if (!geojsonKecamatan || !geojsonKecamatan.features) return counts;

    geojsonKecamatan.features.forEach((feature: any) => {
        const kecName = feature.properties?.WADMKC;
        if (!kecName) return;

        counts[kecName] = 0;

        companies.forEach((company) => {
            const lat = parseFloat(company.lat);
            const lng = parseFloat(company.lng);

            if (isNaN(lat) || isNaN(lng)) return;

            // Turf.js menggunakan format [Longitude, Latitude]
            const pt = turf.point([lng, lat]);

            try {
                if (turf.booleanPointInPolygon(pt, feature)) {
                    counts[kecName] += 1;
                }
            } catch (error) {
                console.warn(`Turf Error pada kecamatan ${kecName}:`, error);
            }
        });
    });

    return counts;
};

/**
 * 2. MENGHITUNG RADIUS DAMPAK BENCANA PENCEMARAN (Buffer Intersection)
 * Membuat lingkaran (Buffer) lalu mendeteksi poligon Kelurahan/Desa mana saja yang tertabrak.
 * 
 * @param lat - Latitude pusat kejadian / pabrik
 * @param lng - Longitude pusat kejadian / pabrik
 * @param radiusKm - Jarak radius dampak dalam Kilometer (misal: 5)
 * @param geojsonDesa - FeatureCollection GeoJSON dari Desa/Kelurahan Kabupaten Bogor
 * @returns Array object berisi Desa dan Kecamatan yang terdampak
 */
export const getAffectedVillages = (
    lat: number,
    lng: number,
    radiusKm: number,
    geojsonDesa: any
) => {
    const affected: Array<{ desa: string; kecamatan: string }> = [];

    if (!geojsonDesa || !geojsonDesa.features || isNaN(lat) || isNaN(lng)) {
        return affected;
    }

    try {
        const center = turf.point([lng, lat]);
        const impactBuffer = turf.circle(center, radiusKm, { units: 'kilometers' });

        geojsonDesa.features.forEach((feature: any) => {
            const desaName = feature.properties?.WADMKD;
            const kecName = feature.properties?.WADMKC;

            if (!desaName) return;

            if (turf.booleanIntersects(impactBuffer, feature)) {
                affected.push({
                    desa: desaName,
                    kecamatan: kecName || 'Tidak Diketahui'
                });
            }
        });
    } catch (error) {
        console.error("Gagal menghitung radius dampak spasial Kabupaten Bogor:", error);
    }

    return affected;
};