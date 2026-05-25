# Walkthrough: Alur Pengangkutan Terpusat (Admin DLH)

Seluruh instruksi Anda terkait perubahan alur pengangkutan limbah telah berhasil diintegrasikan. Berikut adalah rangkuman dari sistem terbaru:

## 1. Perubahan Database & Backend
- Model `PickupRequest` pada Prisma Schema telah diperbarui. Transporter kini bersifat opsional dan ditugaskan secara dinamis.
- Kami menambahkan dua kolom baru: `actualVolume` dan `transportReport` untuk mengakomodasi pelaporan dari transporter.
- Endpoint `createPickup` telah diotomatisasi agar langsung mengkalkulasi tarif *flat-rate* (sesuai persetujuan Anda: Rp 10.000 per satuan volume). Hal ini memicu terbitnya Invoice secara langsung (`UNPAID`), dan status request otomatis menjadi `PRICED`.
- Menambahkan API baru untuk Admin DLH: `GET /api/admin/transporters` dan `PATCH /api/pickups/:id/assign`.

> [!TIP]
> Otomatisasi biaya secara flat ini memungkinkan Perusahaan (Pelaku Usaha) untuk menyelesaikan tagihan (Direct Billing ke Kas Daerah) di saat yang sama ketika mereka melakukan request!

## 2. Pembaruan Modul Admin DLH
- **Penugasan Armada**: Modul baru `AdminPickupManagement` (`/admin/pickups`) kini tersedia di Sidebar Admin DLH.
- Admin dapat melihat daftar request pengangkutan dari perusahaan yang sudah berstatus lunas (`PAID`).
- Melalui halaman ini, Admin menyeleksi transporter terdaftar dan menggunakan tombol "Tugaskan" untuk mendelegasikan order kepada akun pengangkut terkait.
- Pada halaman yang sama, Admin dapat memantau **Laporan Akhir** (volume aktual dan catatan operasional) jika status order telah `COMPLETED`.

## 3. Pembaruan Modul Transporter
- **Hanya Order Tertugaskan**: Transporter kini tidak lagi melakukan "bidding". Mereka hanya akan melihat request yang ditugaskan khusus oleh Admin DLH.
- Tombol **"Terima Tugas & Berangkat"** disediakan agar transporter bisa segera mengubah status menjadi `ON_THE_ROAD`.
- Pada jendela pop-up **Serah Terima Selesai**, transporter wajib mengisi `Volume Aktual` dan `Catatan Tambahan` selain mengunggah foto. 

## 4. Pembaruan Modul Perusahaan
- Label dan instruksi pada pop-up pengajuan pickup telah diselaraskan. Sistem menginformasikan bahwa tarif langsung dihitung otomatis.
- Setelah transporter menyelesaikan tugas (`COMPLETED`), Perusahaan dapat menekan tombol **"LIHAT BUKTI"** untuk memverifikasi foto bukti pengangkutan beserta Laporan Volume Aktual yang diserahkan transporter, memastikan tidak ada manipulasi data berat muatan.

> [!IMPORTANT]
> Sistem pembayaran antar dinas dengan pihak transporter berada sepenuhnya di luar sistem e-Limbah seperti permintaan Anda. Semua transaksi keuangan di dalam sistem e-Limbah ini murni antara Perusahaan ke Rekening Kas Umum Daerah (melalui Admin DLH).

## Validasi End-to-End
Sistem ini telah dimodifikasi langsung pada inti `pickupController.ts` dan global state Zustand (`useSijagaStore.ts`), tanpa celah pada *fallback state* (saat offline mode). Seluruh navigasi rute juga telah tersambung sempurna pada `App.tsx` dan `DashboardLayout.tsx`. 
