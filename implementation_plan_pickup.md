# Rencana Implementasi Alur Baru Pengangkutan Limbah (Sentralisasi Admin DLH)

Dokumen ini memuat langkah-langkah teknis untuk mengubah alur pengangkutan limbah, di mana Admin DLH bertindak sebagai pusat kendali untuk menerima pembayaran, menugaskan transporter, dan memverifikasi laporan.

## Ringkasan Alur Baru
1. **Perusahaan**: Membuat request pickup. Sistem otomatis menghitung biaya dan menerbitkan tagihan (Invoice). Perusahaan langsung membayar ke kas daerah.
2. **Admin DLH**: Melihat request yang sudah dibayar (status `PAID`) dan menugaskan akun Transporter spesifik.
3. **Transporter**: Menerima tugas yang diberikan Admin DLH, melakukan penjemputan, dan mengirimkan laporan akhir (volume aktual & catatan) melalui sistem.
4. **Logbook & Rekapitulasi**: Laporan akhir dapat diakses oleh Perusahaan dan Admin DLH. Pembayaran jasa ke transporter dilakukan secara offline (di luar sistem).

---

## Rencana Perubahan (Proposed Changes)

### 1. Database Schema (`limbah-be/prisma/schema.prisma`)
- Memperbarui model `PickupRequest`:
  - Mengubah `transporterId` dan `transporterName` menjadi opsional (`String?`), karena tidak langsung di-assign saat dibuat.
  - Menambahkan kolom `actualVolume` (`String?`) untuk laporan final transporter.
  - Menambahkan kolom `transportReport` (`String?`) untuk catatan penjemputan.
- **Tindakan**: Menjalankan `npx prisma db push` untuk menerapkan perubahan skema.

### 2. Backend Controller & Routes (`limbah-be`)
- **`pickupController.ts`**:
  - `createPickup`: Menambahkan logika kalkulasi biaya otomatis berdasarkan volume yang diinput. Saat request dibuat, sistem langsung menerbitkan Invoice berstatus `UNPAID` dan set status pickup ke `PRICED`.
  - Membuat endpoint baru `assignTransporter`: Khusus Admin DLH untuk mengisi `transporterId` pada request yang berstatus `PAID`.
  - `updatePickupStatus`: Memperbarui fungsi agar transporter dapat menyisipkan `actualVolume` dan `transportReport` ketika menyelesaikan tugas (status `COMPLETED`).
- **`adminController.ts`**:
  - Membuat endpoint baru `getTransporters` (`GET /api/admin/transporters`) untuk mengambil semua User dengan role `PENGANGKUT`.

### 3. Frontend API & State Store (`limbah-fe`)
- **`api.ts`**: Menambahkan pemanggilan API `admin.getTransporters()` dan `pickups.assignTransporter(id, transporterId, transporterName)`.
- **`useSijagaStore.ts`**: Menambahkan state `transporters`, fungsi fetch data transporter, dan aksi `assignTransporter` agar terhubung reaktif dengan UI.

### 4. Admin DLH Dashboard (`limbah-fe/src/modules/admin`)
- **Membuat Modul Baru `AdminPickupManagement.tsx`**:
  - Menampilkan daftar semua pengajuan penjemputan dari seluruh perusahaan.
  - Untuk request berstatus `PAID` namun belum ada pengangkut, tampilkan tombol **"Tugaskan Pengangkut"**.
  - Menggunakan komponen `Select` (Shadcn UI) untuk memilih akun transporter dan menugaskannya ke tugas tersebut.
  - Menampilkan laporan final dari transporter untuk pengajuan yang sudah `COMPLETED`.

### 5. Transporter Dashboard (`limbah-fe/src/modules/transport`)
- **`TransporterDashboard.tsx` & `TransporterTracking.tsx`**:
  - Hanya menampilkan tugas yang telah di-assign oleh Admin DLH ke `transporterId` milik pengguna.
  - Menambahkan alur **"Terima Tugas"** (Accept Task) untuk merubah status dari `PAID` menjadi `ON_THE_ROAD`.
  - Pada tahap penyelesaian (Completed), memunculkan form input untuk memasukkan `Volume Aktual` dan `Catatan Laporan Pengangkutan` sebelum tugas ditutup.

### 6. Company Dashboard (`limbah-fe/src/modules/companies`)
- **`PickupRequestPage.tsx`**:
  - Menyesuaikan UI agar dapat membaca form laporan final dari transporter.
  - Menegaskan bahwa setelah membuat request, perusahaan harus langsung menuju halaman Pembayaran Digital (Direct Billing).

---

## Pertanyaan Terbuka (User Feedback)
1. Apakah biaya pengangkutan dihitung menggunakan flat rate (misal: Rp 10.000 per Liter/Kg), atau ada kriteria khusus yang harus dimasukkan saat perusahaan membuat request? (Untuk saat ini saya akan menggunakan rumus estimasi biaya otomatis agar invoice bisa langsung terbit).

1. Untuk sementara biaya pengangkutan dibuat flat saja sesuai seperti yang anda pikirkan karena untuk saat ini masih belum ada kriteria pengankutan.

*Mohon berikan konfirmasi atau revisi atas rencana implementasi ini. Jika sudah sesuai, saya akan langsung memulai eksekusi penulisan kode pada backend dan frontend.*
