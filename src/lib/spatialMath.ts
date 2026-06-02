// src/lib/spatialMath.ts

/**
 * ============================================================================
 * ENGINE MATEMATIKA SPASIAL (PURE FABRICATION)
 * Bertanggung jawab penuh atas kalkulasi interpolasi (IDW), jarak Euclidean,
 * trigonometri vektor angin, dan Gradasi Warna Kontinu (Continuous Color Ramp).
 * Bebas dari dependensi UI (React/Leaflet).
 * ============================================================================
 */

// --- KONTRAK DATA (INTERFACES) ---
export interface SensorNode {
    lat: number;
    lng: number;
}

export interface AqiNode extends SensorNode {
    aqi: number;
}

export interface WindNode extends SensorNode {
    wd: number; // Wind Direction (Derajat Kompas 0 - 360)
    ws: number; // Wind Speed (m/s)
}

export interface GridBounds {
    latMin: number;
    latMax: number;
    lngMin: number;
    lngMax: number;
}

export interface GridPoint extends SensorNode {
    x: number; // Koordinat matriks X pada Canvas
    y: number; // Koordinat matriks Y pada Canvas
}

// --- VIRTUAL BASELINE NODES (ANCHOR MITIGATION) ---
// Untuk mencegah "Ghost Extrapolation" (Peta merah semua karena tidak ada sensor di pedalaman),
// kita memasang sensor bayangan di perbatasan luar Kotawaringin Timur (Kotim).
// DIUPDATE: Menyesuaikan Bounding Box baru (-3.40 s/d -1.30 dan 112.00 s/d 113.60).
// Membentuk cincin 8-titik simetris agar tarikan IDW (20 / Sangat Bersih) merata di seluruh pedalaman.
const KOTIM_VIRTUAL_NODES: AqiNode[] = [
    { lat: -1.30, lng: 112.00, aqi: 20 }, // Barat Laut ekstrem (Pedalaman)
    { lat: -1.30, lng: 112.80, aqi: 20 }, // Utara Tengah (Pedalaman Dalam)
    { lat: -1.30, lng: 113.60, aqi: 20 }, // Timur Laut ekstrem (Pedalaman)
    { lat: -2.35, lng: 112.00, aqi: 20 }, // Sayap Barat
    { lat: -2.35, lng: 113.60, aqi: 20 }, // Sayap Timur
    { lat: -3.40, lng: 112.00, aqi: 20 }, // Barat Daya ekstrem (Pesisir Laut)
    { lat: -3.40, lng: 112.80, aqi: 20 }, // Selatan Tengah (Pesisir)
    { lat: -3.40, lng: 113.60, aqi: 20 }, // Tenggara ekstrem (Pesisir Laut)
];

// Parameter kekuatan tarikan gravitasi polusi (Power parameter).
// Semakin tinggi nilainya, polusi semakin "lokal" (jatuh tajam/drop-off cepat).
// P = 3 ideal untuk mensimulasikan polutan udara industri.
const IDW_POWER = 3;

/**
 * 1. KALKULASI JARAK (Optimasi CPU: Euclidean Squared)
 * 
 * Menggunakan kuadrat jarak Euclidean alih-alih Haversine murni. 
 * Ini menghemat penggunaan Math.sqrt() pada iterasi canvas (2.500+ titik per frame).
 * Akurasi geografis sedikit berkurang, namun sangat bisa ditoleransi untuk skala regional (Kotim).
 */
const getDistanceSq = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const dLat = lat1 - lat2;
    const dLng = lng1 - lng2;
    return (dLat * dLat) + (dLng * dLng);
};

// --- STASIUN WARNA AQI (COLOR STOPS) ---
// Titik jangkar pencampuran warna berdasarkan standar US EPA
const AQI_COLOR_STOPS = [
    { val: 0, rgb: [16, 185, 129] },     // Emerald 500 (Sangat Baik)
    { val: 50, rgb: [16, 185, 129] },    // Emerald 500 (Batas Baik)
    { val: 100, rgb: [250, 204, 21] },   // Yellow 400 (Sedang)
    { val: 150, rgb: [249, 115, 22] },   // Orange 500 (Sensitif)
    { val: 200, rgb: [239, 68, 68] },    // Red 500 (Tidak Sehat)
    { val: 300, rgb: [147, 51, 234] },   // Purple 600 (Sangat Tidak Sehat)
    { val: 400, rgb: [126, 0, 35] }      // Maroon (Berbahaya)
];


export const spatialMath = {

    /**
     * 2. INTERPOLASI KUALITAS UDARA (AQI) MENGGUNAKAN IDW
     * 
     * Menghitung tebakan nilai AQI pada titik koordinat kosong berdasarkan
     * sensor-sensor di sekitarnya dan diakhiri tarikan dari Virtual Nodes.
     */
    interpolateAqi: (targetLat: number, targetLng: number, realSensors: AqiNode[]): number => {
        // Gabungkan sensor nyata (dari pabrik) dengan sensor imajiner pelindung (Virtual Nodes)
        const allSensors = [...realSensors, ...KOTIM_VIRTUAL_NODES];

        if (allSensors.length === 0) return 20; // Fallback sangat bersih

        let totalWeight = 0;
        let weightedSum = 0;

        for (const sensor of allSensors) {
            const distSq = getDistanceSq(targetLat, targetLng, sensor.lat, sensor.lng);

            // Jika titik target sangat dekat dengan sensor (mencegah Division by Zero & Infinity)
            if (distSq < 0.0000001) {
                return sensor.aqi;
            }

            // Rumus Inti IDW: W = 1 / (d^p)
            // Karena distSq sudah d^2, jika P=3, maka kita perlu d^3 = distSq * sqrt(distSq)
            const dist = Math.sqrt(distSq);
            const weight = 1 / Math.pow(dist, IDW_POWER);

            weightedSum += sensor.aqi * weight;
            totalWeight += weight;
        }

        // Kembalikan rata-rata berbobot
        return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 20;
    },

    /**
     * 3. INTERPOLASI VEKTOR ANGIN (TRIGONOMETRIC IDW)
     * 
     * Rata-rata arah angin tidak bisa menggunakan matematika linear (350° dan 10° rata-ratanya bukan 180°, melainkan 0°).
     * Solusinya: Pecah derajat menjadi vektor Sinus (U) dan Cosinus (V), bobotkan dengan IDW, 
     * lalu kembalikan menjadi derajat menggunakan Arc Tangent (Atan2).
     */
    interpolateWind: (targetLat: number, targetLng: number, sensors: WindNode[]): { wd: number, ws: number } => {
        if (sensors.length === 0) return { wd: 0, ws: 0 };

        let totalWeight = 0;
        let weightedU = 0; // Komponen X (Cosinus)
        let weightedV = 0; // Komponen Y (Sinus)
        let weightedSpeed = 0;

        for (const sensor of sensors) {
            const distSq = getDistanceSq(targetLat, targetLng, sensor.lat, sensor.lng);

            // Mencegah error presisi
            const weight = distSq < 0.0000001 ? 1000000 : 1 / Math.pow(Math.sqrt(distSq), 2); // Angin menggunakan p=2 agar persebaran lebih rata

            // Konversi Derajat ke Radian
            const rad = (sensor.wd * Math.PI) / 180;

            // Pecah menjadi Vektor (U, V) dan kalikan dengan kecepatan
            const u = Math.cos(rad) * sensor.ws;
            const v = Math.sin(rad) * sensor.ws;

            weightedU += u * weight;
            weightedV += v * weight;
            weightedSpeed += sensor.ws * weight;
            totalWeight += weight;
        }

        if (totalWeight === 0) return { wd: 0, ws: 0 };

        // Kembalikan Vektor rata-rata
        const avgU = weightedU / totalWeight;
        const avgV = weightedV / totalWeight;
        const avgSpeed = weightedSpeed / totalWeight;

        // Kembalikan ke Derajat (Arc Tangent 2)
        let avgWd = (Math.atan2(avgV, avgU) * 180) / Math.PI;

        // Normalisasi putaran (jika negatif, putar agar menjadi positif dalam skala 360)
        if (avgWd < 0) avgWd += 360;

        return {
            wd: Math.round(avgWd),
            ws: parseFloat(avgSpeed.toFixed(1))
        };
    },

    /**
     * 4. GENERATOR MATRIKS GRID KANVAS
     * 
     * Menghasilkan peta titik-titik (resolusi) untuk digambar oleh HTML5 Canvas.
     * Outputnya akan di-mapping oleh komponen UI Render.
     */
    generateCanvasGrid: (bounds: GridBounds, resolutionX: number, resolutionY: number): GridPoint[] => {
        const points: GridPoint[] = [];

        const latStep = (bounds.latMax - bounds.latMin) / (resolutionY - 1);
        const lngStep = (bounds.lngMax - bounds.lngMin) / (resolutionX - 1);

        for (let y = 0; y < resolutionY; y++) {
            for (let x = 0; x < resolutionX; x++) {
                points.push({
                    x,
                    y,
                    // Titik (0,0) di canvas biasanya kiri atas. Jadi Y harus di-inverse terhadap Latitude jika digambar.
                    lat: bounds.latMin + (y * latStep),
                    lng: bounds.lngMin + (x * lngStep)
                });
            }
        }

        return points;
    },

    /**
     * 5. GRADASI WARNA KONTINU (LINEAR COLOR INTERPOLATION)
     * 
     * Menggantikan Switch-Case warna kaku. Jika nilai AQI jatuh di antara
     * dua titik batas (misal: 75, antara 50 dan 100), algoritma ini akan
     * mencampurkan RGB secara merata untuk menghasilkan gradasi mulus.
     */
    interpolateColorRgb: (aqi: number): [number, number, number] => {
        // Fallback batas aman
        if (aqi <= 0) return [16, 185, 129];
        if (aqi >= 400) return [126, 0, 35];

        let lowerLimit = AQI_COLOR_STOPS[0];
        let upperLimit = AQI_COLOR_STOPS[AQI_COLOR_STOPS.length - 1];

        // Temukan di antara bracket (batas) mana AQI ini jatuh
        for (let i = 0; i < AQI_COLOR_STOPS.length - 1; i++) {
            if (aqi >= AQI_COLOR_STOPS[i].val && aqi <= AQI_COLOR_STOPS[i + 1].val) {
                lowerLimit = AQI_COLOR_STOPS[i];
                upperLimit = AQI_COLOR_STOPS[i + 1];
                break;
            }
        }

        const range = upperLimit.val - lowerLimit.val;
        // Mencegah division by zero jika AQI persis di batas
        if (range === 0) return lowerLimit.rgb as [number, number, number];

        // Hitung persentase posisi AQI di antara dua batas
        const ratio = (aqi - lowerLimit.val) / range;

        // Campurkan (Blend) masing-masing spektrum Merah, Hijau, Biru (RGB)
        const r = Math.round(lowerLimit.rgb[0] + ratio * (upperLimit.rgb[0] - lowerLimit.rgb[0]));
        const g = Math.round(lowerLimit.rgb[1] + ratio * (upperLimit.rgb[1] - lowerLimit.rgb[1]));
        const b = Math.round(lowerLimit.rgb[2] + ratio * (upperLimit.rgb[2] - lowerLimit.rgb[2]));

        return [r, g, b];
    },

    /**
     * 6. KODE WARNA STATIS (Kompabilitas / Fallback UI Tegas)
     * 
     * Digunakan jika komponen UI membutuhkan batas tegas murni sesuai EPA 
     * tanpa efek perpaduan gradasi.
     */
    getStaticAqiColorRgb: (aqi: number): [number, number, number] => {
        if (aqi <= 50) return [16, 185, 129];
        if (aqi <= 100) return [250, 204, 21];
        if (aqi <= 150) return [249, 115, 22];
        if (aqi <= 200) return [239, 68, 68];
        if (aqi <= 300) return [147, 51, 234];
        return [126, 0, 35];
    }
};