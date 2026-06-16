import os
import argparse
import logging
from pathlib import Path
from typing import Set, Dict, List

# Konfigurasi Logging yang bersih
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

class ExtractorConfig:
    """Konfigurasi sentral (Information Expert) untuk ekstraksi modul spasial/GIS."""
    
    # Target Direktori Default
    DEFAULT_TARGET = r"C:\Users\PC\Documents\Dev\E-LIMBAD\limbah-fe"
    DEFAULT_OUTPUT = r"C:\Users\PC\Documents\Dev\E-LIMBAD\limbah-fe\limbah-fe-gis-only.txt"

    # Folder yang HARAM hukumnya (Blacklist Folder) - Ditambah folder cache build modern
    FORBIDDEN_DIRS: Set[str] = {
        "node_modules", ".git", "dist", "build", "out", "coverage",
        ".vscode", ".idea", ".next", ".swc", "assets", "public", 
        ".turbo", ".cache", "tmp", "temp"
    }

    # Berkas spasial statis / lock raksasa yang disingkirkan agar context LLM ringan
    FORBIDDEN_FILES: Set[str] = {
        "kotim-desa.json", 
        "kotim-kecamatan.json",
        "bogor-sungai-poly.json",
        "bogor-sungai-line.json",
        "bogor-desa.json",
        "bogor-kecamatan.json",
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml"
    }

    # Ekstensi kode frontend yang diizinkan untuk dipindai
    INCLUDE_EXTENSIONS: Set[str] = {
        ".ts", ".tsx", ".js", ".jsx"
    }

    # File konfigurasi root penunjang konteks arsitektur dependency
    ESSENTIAL_ROOT_FILES: Set[str] = {
        "package.json", "tsconfig.json", "vite.config.ts"
    }

    # A. Kata kunci deteksi pada nama berkas atau jalur folder (Case Insensitive)
    PATH_KEYWORDS: List[str] = [
        "gis", "map", "spatial", "layer", "aqi", "wind", 
        "leaflet", "geo", "telemetry", "location"
    ]

    # B. Kata kunci deteksi logika spasial di dalam kode sumber
    CONTENT_KEYWORDS: List[str] = [
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

    # Ukuran maksimal berkas kode aman (80KB)
    MAX_FILE_SIZE_BYTES: int = 80 * 1024  


class LLMContextOptimizer:
    """Utility untuk memampatkan teks agar menghemat token LLM (Pure Fabrication)."""
    
    @staticmethod
    def compress_code(content: str) -> str:
        """Menghapus spasi trailing dan baris kosong ganda untuk efisiensi token LLM."""
        lines = content.splitlines()
        optimized_lines = []
        previous_empty = False
        
        for line in lines:
            stripped = line.rstrip()
            is_empty = len(stripped) == 0
            
            if is_empty and previous_empty:
                continue # Skip consecutive empty lines
                
            optimized_lines.append(stripped)
            previous_empty = is_empty
            
        return "\n".join(optimized_lines)

    @staticmethod
    def is_binary(file_path: Path) -> bool:
        """Pengecekan biner murah (hanya membaca 512 byte pertama)."""
        try:
            with open(file_path, 'rb') as f:
                return b'\x00' in f.read(512)
        except Exception:
            return True


class GisCodebaseExtractor:
    """Controller utama untuk manajemen pemindaian GIS (GRASP Controller)."""
    
    def __init__(self, target_dir: str, output_file: str):
        self.target_path = Path(target_dir).resolve()
        self.output_file = Path(output_file).resolve()
        self.config = ExtractorConfig()
        self.optimizer = LLMContextOptimizer()
        self.payload_cache: Dict[Path, str] = {} # Menyimpan hasil kompresi kode di memori (Single-Read)

    def _should_process(self, relative_path: Path, file_path: Path) -> bool:
        parts = relative_path.parts
        file_name = file_path.name
        is_root_file = len(parts) == 1

        # 1. Validasi Blacklist File rintangan
        if file_name in self.config.FORBIDDEN_FILES:
            return False

        # 2. Validasi Root Files Utama
        if is_root_file:
            return file_name in self.config.ESSENTIAL_ROOT_FILES

        # 3. Validasi Blacklist Folder
        if any(part in self.config.FORBIDDEN_DIRS for part in parts):
            return False

        # 4. Validasi Ekstensi Kode
        if file_path.suffix not in self.config.INCLUDE_EXTENSIONS:
            return False

        # 5. Sensor Pencocokan Keyword Spasial (GRASP Information Expert)
        # Cek nama jalur folder/file terlebih dahulu (sangat murah)
        lower_path = str(relative_path).lower()
        if any(kw in lower_path for kw in self.config.PATH_KEYWORDS):
            return True

        # Jika nama tidak cocok, baca kode sumber (Deep Scan)
        try:
            content = file_path.read_text("utf-8", errors="ignore")
            if any(kw in content for kw in self.config.CONTENT_KEYWORDS):
                # OPTIMASI: Simpan isi file yang sudah dibaca ke cache agar tidak dibaca lagi nanti
                self.payload_cache[file_path] = content
                return True
        except Exception:
            pass

        return False

    def execute(self):
        if not self.target_path.is_dir():
            logger.error(f"❌ Error: Folder target '{self.target_path}' tidak ditemukan.")
            return

        files_to_process: List[Path] = []
        original_size = 0
        compressed_size = 0
        
        logger.info(f"🔍 Mulai memindai file GIS / Spasial di: {self.target_path}")

        for root, dirs, files in os.walk(self.target_path):
            # Batasi traversal folder haram secara in-place (High-Performance pruning)
            dirs[:] = [d for d in dirs if d not in self.config.FORBIDDEN_DIRS]
            root_path = Path(root)

            for file_name in files:
                file_path = root_path / file_name
                relative_path = file_path.relative_to(self.target_path)

                if self._should_process(relative_path, file_path):
                    # Cheap Binary Guard (Cek biner murah)
                    if self.optimizer.is_binary(file_path):
                        continue

                    # Size Guard
                    file_size = file_path.stat().st_size
                    if file_size > self.config.MAX_FILE_SIZE_BYTES:
                        logger.warning(f"[SKIPPED] {relative_path} terlalu besar (>{self.config.MAX_FILE_SIZE_BYTES/1024:.0f}KB).")
                        continue

                    files_to_process.append(file_path)
                    original_size += file_size

        # Menulis seluruh data ke berkas keluaran terkompresi
        self._write_output(sorted(files_to_process), original_size)

    def _write_output(self, files: List[Path], original_size: int):
        total_compressed_size = 0
        
        # Buat direktori output jika belum ada
        self.output_file.parent.mkdir(parents=True, exist_ok=True)

        with open(self.output_file, "w", encoding="utf-8") as f:
            f.write("=== KUMPULAN KODE SPASIAL (GIS-ONLY MODE - COMPRESSED) ===\n\n")
            
            for file_path in files:
                relative_path = file_path.relative_to(self.target_path)
                try:
                    # Ambil data dari RAM Cache jika ada, jika tidak (seperti file root), baru baca disk
                    content = self.payload_cache.get(
                        file_path, 
                        file_path.read_text("utf-8", errors="ignore")
                    )
                    
                    # Kompresi kode sumber (Token Saver)
                    compressed_content = self.optimizer.compress_code(content)
                    
                    f.write(f"\n--- FILE: {relative_path} ---\n")
                    f.write(compressed_content)
                    f.write("\n")
                    
                    total_compressed_size += len(compressed_content.encode('utf-8'))
                    logger.info(f"-> Mendeteksi Modul GIS: {relative_path}")
                except Exception as e:
                    logger.error(f"-> Gagal membaca {relative_path}: {e}")

        logger.info(f"\n✅ Selesai! Ekstraksi modul GIS berhasil dioptimasi pada:\n   {self.output_file}")
        logger.info(f"📊 Ukuran Asli: {original_size / 1024:.2f} KB")
        logger.info(f"🚀 Ukuran Terkompresi (LLM Ready): {total_compressed_size / 1024:.2f} KB")
        if original_size > 0:
            logger.info(f"📉 Penghematan Token: ~{((original_size - total_compressed_size) / original_size) * 100:.1f}%")


if __name__ == "__main__":
    config = ExtractorConfig()
    
    parser = argparse.ArgumentParser(description="LLM GIS Codebase Extractor - Vite/React SPA")
    parser.add_argument("--dir", type=str, default=config.DEFAULT_TARGET, help="Target directory to scan")
    parser.add_argument("--out", type=str, default=config.DEFAULT_OUTPUT, help="Output file path")
    
    args = parser.parse_args()
    
    extractor = GisCodebaseExtractor(target_dir=args.dir, output_file=args.out)
    extractor.execute()