# agregator.py
import os
import re
from pathlib import Path

# =========================================================================
# KONFIGURASI CORE (Gunakan r"" jika ingin jalur absolut kaku)
# =========================================================================
TARGET_DIRECTORY = r"C:\Users\PC\Documents\Dev\E-LIMBAD\limbah-fe"
OUTPUT_FILE_NAME = "limbah-fe.txt"

# 1. Folder yang diblokir murni (Default)
FORBIDDEN_DIRS = {
    "node_modules", ".git", "dist", "build", "out", "coverage",
    ".vscode", ".idea", ".next", ".swc", "recovered"
}

# 2. File spesifik yang diblokir murni (Default)
FORBIDDEN_FILES = {
    "kotim-desa.json", "kotim-kecamatan.json", "bogor-sungai-line.json",
    "bogor-sungai-poly.json", 'bogor-desa.json', 'bogor-kecamatan.json',
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml", 'mock-data.json', 
    'sample-geojson.json', 'mockData.ts', "limbah-fe.txt"
}

# 3. Kredensial Sensitif yang Wajib Diblokir demi Keamanan (Security Guard)
SENSITIVE_PATTERNS = [
    r"\.env.*", r"key.*\.pem", r".*\.key", r"id_rsa.*", r"credentials.*"
]

# 4. Folder Whitelist (Folder yang diizinkan)
ALLOWED_DIRS = {"src", "components", "pages", "hooks", "utils", "context", "public"}

# 5. Ekstensi file teks yang diperbolehkan masuk agregat
INCLUDE_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".scss", ".html"}

# 6. File konfigurasi penting di root folder yang wajib dibawa
ESSENTIAL_ROOT_FILES = {"package.json", "tsconfig.json", "vite.config.ts", "vite.config.js"}

# Batas maksimum ukuran file yang dibaca (Default: 1 MB) untuk mencegah token AI membengkak
MAX_FILE_SIZE_BYTES = 1024 * 1024  


def is_binary(file_path: Path) -> bool:
    """Mendeteksi apakah file berupa binary dengan membaca 1024 byte awal."""
    try:
        with open(file_path, 'rb') as f:
            chunk = f.read(1024)
            return b'\x00' in chunk
    except Exception:
        return True


def is_sensitive(file_name: str) -> bool:
    """Mencegah kebocoran file kredensial / .env."""
    return any(re.match(pattern, file_name, re.IGNORECASE) for pattern in SENSITIVE_PATTERNS)


def parse_gitignore(target_path: Path) -> set:
    """Membaca file .gitignore jika ada, dan memanfaatkannya sebagai blacklist otomatis."""
    ignored_items = set()
    gitignore_path = target_path / ".gitignore"
    if gitignore_path.exists():
        try:
            for line in gitignore_path.read_text("utf-8").splitlines():
                line = line.strip()
                if line and not line.startswith("#"):
                    # Bersihkan karakter penunjuk folder di gitignore
                    clean_line = line.replace("/", "").replace("*", "")
                    if clean_line:
                        ignored_items.add(clean_line)
        except Exception as e:
            print(f"[WARN] Gagal mengurai .gitignore: {e}")
    return ignored_items


def main():
    # --- AUTO DETECT ROOT PATH (Portabilitas Maksimal) ---
    target_path = Path(TARGET_DIRECTORY)
    if not target_path.is_dir():
        # Fallback cerdas: Gunakan lokasi skrip ini berada jika folder default tidak ditemukan
        target_path = Path(__file__).parent
        print(f"[SYSTEM] Jalur kaku tidak ditemukan. Menggunakan mode portabel di: {target_path}")

    # Gabungkan blacklist bawaan dengan gitignore jika ada (Smart Blacklist)
    git_ignored = parse_gitignore(target_path)
    forbidden_dirs_union = FORBIDDEN_DIRS.union(git_ignored)
    forbidden_files_union = FORBIDDEN_FILES.union(git_ignored)

    output_path = target_path / OUTPUT_FILE_NAME
    
    print("Memproses penelusuran kode reaktif (Streaming Mode)...")
    file_count = 0

    try:
        # Buka file output dengan mode tulis langsung (Streaming Buffer)
        with open(output_path, "w", encoding="utf-8") as out_file:
            out_file.write("=== STRUKTUR & ISI KODE (REACT PROJECT MODE) ===\n\n")

            for root, dirs, files in os.walk(target_path):
                # Memotong navigasi folder terlarang sedini mungkin (Sangat cepat & hemat CPU)
                dirs[:] = [d for d in dirs if d not in forbidden_dirs_union]

                root_path = Path(root)

                for file_name in files:
                    # 1. Penyaringan Blacklist File & Kredensial Rahasia
                    if file_name in forbidden_files_union or is_sensitive(file_name):
                        continue

                    file_path = root_path / file_name
                    
                    # Cegah skrip membaca file output-nya sendiri jika diletakkan di folder yang sama
                    if file_path.resolve() == output_path.resolve():
                        continue

                    relative_path = file_path.relative_to(target_path)

                    # 2. Evaluasi apakah file berada di root (package.json, tsconfig.json, dsb)
                    is_essential_root = (len(relative_path.parts) == 1 and file_name in ESSENTIAL_ROOT_FILES)

                    # 3. Evaluasi apakah berada di folder whitelist (src, public, dsb)
                    is_in_allowed_dir = any(part in ALLOWED_DIRS for part in relative_path.parts)

                    if not is_essential_root and not is_in_allowed_dir:
                        continue

                    # 4. Filter ekstensi file
                    if not is_essential_root and file_path.suffix not in INCLUDE_EXTENSIONS:
                        continue

                    # 5. Filter file binary (gambar, pdf, font)
                    if is_binary(file_path):
                        continue

                    # 6. Batasi ukuran pembacaan file (Guard Limit)
                    try:
                        file_size = file_path.stat().st_size
                        if file_size > MAX_FILE_SIZE_BYTES:
                            print(f"[SKIP] File terlalu besar ({file_size / 1024:.1f} KB): {relative_path}")
                            continue

                        # Tulis langsung ke buffer output file tanpa menahan data di RAM
                        content = file_path.read_text("utf-8", errors="ignore")
                        out_file.write(f"\n--- FILE: {relative_path} ---\n")
                        out_file.write(content)
                        out_file.write("\n")
                        
                        file_count += 1
                        print(f"-> Menyalin: {relative_path}")

                    except Exception as e:
                        print(f"-> Gagal menyalin {relative_path}: {e}")

        print(f"\nSelesai! {file_count} File React tersimpan secara efisien di: {output_path}")

    except Exception as e:
        print(f"Critical Error: Gagal menulis file output: {e}")


if __name__ == "__main__":
    main()