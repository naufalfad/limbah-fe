import os
from pathlib import Path

# --- KONFIGURASI UMUM ---
TARGET_DIRECTORY = r"C:\Users\PC\Documents\Dev\E-LIMBAD\limbah-fe"
# Output dibedakan agar tidak menimpa file aslinya
OUTPUT_FILE = r"C:\Users\PC\Documents\Dev\E-LIMBAD\limbah-fe\limbah-fe-gis-only.txt"

# 1. Folder yang HARAM hukumnya (Blacklist Folder)
FORBIDDEN_DIRS = {
    "node_modules", ".git", "dist", "build", "out", "coverage",
    ".vscode", ".idea", ".next", ".swc", "assets", "public" # Folder gambar/geojson disingkirkan agar ringan
}

# 1.5. File yang HARAM hukumnya (Blacklist File)
FORBIDDEN_FILES = {
    "kotim-desa.json", 
    "kotim-kecamatan.json",
    "package-lock.json",
    "yarn.lock"
}

# 2. Ekstensi yang diizinkan untuk di-scan
INCLUDE_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx"}

# 3. File konfigurasi root yang WAJIB dibawa untuk konteks arsitektur
ESSENTIAL_ROOT_FILES = {"package.json", "tsconfig.json", "vite.config.ts"}

# =====================================================================
# THE GIS SCANNER ENGINE (Otak Pendeteksi File Spasial)
# =====================================================================

# A. Deteksi dari Nama File / Nama Folder (Case Insensitive)
PATH_KEYWORDS = [
    "gis", "map", "spatial", "layer", "aqi", "wind", 
    "leaflet", "geo", "telemetry", "location"
]

# B. Deteksi dari Isi Kode di Dalam File (Mendeteksi Impor atau Fungsi GIS)
CONTENT_KEYWORDS = [
    "react-leaflet", 
    "MapContainer", 
    "TileLayer", 
    "@turf/turf", 
    "spatialMath", 
    "useGisUIStore", 
    "L.icon", 
    "L.divIcon",
    "calculateCompaniesPerKecamatan"
]

def is_binary(file_path: Path) -> bool:
    try:
        with open(file_path, 'rb') as f:
            return b'\x00' in f.read(512)
    except Exception:
        return True

def is_gis_related(relative_path: Path, file_path: Path) -> bool:
    # 1. Cek berdasarkan nama path atau nama file
    lower_path = str(relative_path).lower()
    if any(kw in lower_path for kw in PATH_KEYWORDS):
        return True
    
    # 2. Jika tidak ketahuan dari nama, kita baca isi kodenya (Deep Scan)
    try:
        content = file_path.read_text("utf-8", errors="ignore")
        if any(kw in content for kw in CONTENT_KEYWORDS):
            return True
    except Exception:
        pass
    
    return False

def main():
    target_path = Path(TARGET_DIRECTORY)
    if not target_path.is_dir():
        print(f"Error: Folder '{TARGET_DIRECTORY}' tidak ditemukan.")
        return

    files_to_process = []
    print("Mulai memindai file-file GIS / Spasial...")
    
    for root, dirs, files in os.walk(target_path):
        # Blokir folder haram
        dirs[:] = [d for d in dirs if d not in FORBIDDEN_DIRS]

        root_path = Path(root)

        for file_name in files:
            if file_name in FORBIDDEN_FILES:
                continue
            
            file_path = root_path / file_name
            relative_path = file_path.relative_to(target_path)
            
            is_essential_root = (len(relative_path.parts) == 1 and file_name in ESSENTIAL_ROOT_FILES)
            
            # Jika bukan file root essential, pastikan ekstensinya kode (ts/tsx/js/jsx)
            if not is_essential_root and file_path.suffix not in INCLUDE_EXTENSIONS:
               continue

            # Logika Pemasukan File: Jika ia file root, ATAU lolos tes GIS Scanner
            if is_essential_root or is_gis_related(relative_path, file_path):
                if not is_binary(file_path):
                    files_to_process.append(file_path)

    # Tulis hasil
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("=== KUMPULAN KODE SPASIAL (GIS-ONLY MODE) ===\n\n")
        for file_path in sorted(files_to_process):
            relative_path = file_path.relative_to(target_path)
            try:
                content = file_path.read_text("utf-8", errors="ignore")
                f.write(f"\n--- FILE: {relative_path} ---\n")
                f.write(content)
                f.write("\n")
                print(f"-> Mendeteksi Modul GIS: {relative_path}")
            except Exception as e:
                print(f"-> Gagal baca {relative_path}: {e}")

    print(f"\nSelesai! Ekstraksi modul GIS tersimpan di: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()