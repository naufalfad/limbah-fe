import os
from pathlib import Path

# --- KONFIGURASI-- -
TARGET_DIRECTORY = r"C:\Users\PC\Documents\Dev\E-LIMBAD\limbah-fe"
OUTPUT_FILE = r"C:\Users\PC\Documents\Dev\E-LIMBAD\limbah-fe\limbah-fe.txt"

# 1. Folder yang HARAM hukumnya(Blacklist)
# Disesuaikan dengan ekosistem React(node_modules, build, dist, dll)
FORBIDDEN_DIRS = {
    "node_modules", ".git", "dist", "build", "out", "coverage",
    ".vscode", ".idea", ".next", ".swc"
}

# 2. Folder yang BOLEH diambil(Whitelist)
# Biasanya semua source code React ada di 'src' atau 'public'
ALLOWED_DIRS = { "src", "components", "pages", "hooks", "utils", "context", "public"}

# 3. Ekstensi yang diinginkan untuk React(tambah CSS / SCSS / HTML jika perlu)
INCLUDE_EXTENSIONS = { ".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".scss", ".html"}

# 4.(BARU) File penting di root folder yang WAJIB dibawa agar AI / Anda paham konteks project
ESSENTIAL_ROOT_FILES = { "package.json", "tsconfig.json", "vite.config.ts", "vite.config.js"}

def is_binary(file_path: Path) -> bool:
    try:
        with open(file_path, 'rb') as f:
            return b'\x00' in f.read(512)
    except Exception:
        return True

def main():
    target_path = Path(TARGET_DIRECTORY)
    if not target_path.is_dir():
        print(f"Error: Folder '{TARGET_DIRECTORY}' tidak ditemukan.")
        return

    files_to_process = []
    print("Memproses file (React Project Mode)...")
    
    # MENGGUNAKAN os.walk() SEBAGAI PENGGANTI rglob()
    # Ini jauh lebih cepat karena kita bisa memblokir Python masuk ke node_modules
    for root, dirs, files in os.walk(target_path):
        # Cegah Python masuk ke folder terlarang(SANGAT hemat waktu)
        dirs[:] =[d for d in dirs if d not in FORBIDDEN_DIRS]

        root_path = Path(root)

        for file_name in files:
            file_path = root_path / file_name
            relative_path = file_path.relative_to(target_path)
            
            # Cek apakah ini file konfigurasi di root folder(package.json, dll)
            is_essential_root = (len(relative_path.parts) == 1 and file_name in ESSENTIAL_ROOT_FILES)
            
            # Cek apakah file berada di dalam folder yang diizinkan(src, dll)
            is_in_allowed_dir = any(part in ALLOWED_DIRS for part in relative_path.parts)
            
            # Jika bukan file konfigurasi penting DAN tidak ada di whitelist -> abaikan
            if not is_essential_root and not is_in_allowed_dir:
                continue
            
            # Cek ekstensi file(hanya untuk file di dalam ALLOWED_DIRS)
            if not is_essential_root and file_path.suffix not in INCLUDE_EXTENSIONS:
               continue

            # Cek apakah file berupa binary(misal file gambar di folder public)
            if not is_binary(file_path):
               files_to_process.append(file_path)

    # Tulis hasil
    with open(OUTPUT_FILE, "w", encoding = "utf-8") as f:
        f.write("=== STRUKTUR & ISI KODE (REACT PROJECT MODE) ===\n\n")
        for file_path in sorted(files_to_process):
            relative_path = file_path.relative_to(target_path)
            try:
                content = file_path.read_text("utf-8", errors = "ignore")
                f.write(f"\n--- FILE: {relative_path} ---\n")
                f.write(content)
                f.write("\n")
                print(f"-> Menyalin: {relative_path}")
            except Exception as e:
                print(f"-> Gagal baca {relative_path}: {e}")

    print(f"\nSelesai! File React tersimpan di: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()