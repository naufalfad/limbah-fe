# Checklist Implementasi Alur Pengangkutan Terpusat

## Phase 1: Database Schema (`limbah-be/prisma/schema.prisma`)
- [x] Tambahkan `actualVolume` (String?) dan `transportReport` (String?) pada model `PickupRequest`.
- [x] Ubah `transporterId` dan `transporterName` pada model `PickupRequest` menjadi opsional (`String?`).
- [x] Jalankan `npx prisma db push` untuk menerapkan perubahan skema.

## Phase 2: Backend Controller & Routes
- [x] Update `pickupController.ts`: 
  - `createPickup`: Hitung flat-rate cost (10.000 x volume), auto-create Invoice (`UNPAID`), set pickup ke `PRICED`.
  - Buat `assignTransporter`: Endpoint untuk Admin DLH mengatur akun transporter.
  - Update `updatePickupStatus`: Dukung laporan final (`actualVolume`, `transportReport`) saat `COMPLETED`.
- [x] Update `adminController.ts`: Tambah `getTransporters`.
- [x] Update routes (misalnya `adminRoutes.ts` dan `pickupRoutes.ts`) untuk endpoint baru.

## Phase 3: Frontend API & Store
- [x] Update `api.ts`: Tambah endpoint `admin.getTransporters()` dan `pickups.assignTransporter(id, transporterId)`.
- [x] Update `useSijagaStore.ts`: Tambah list transporter, fungsi fetch, dan fungsi aksi penugasan.

## Phase 4: Frontend UI (Views)
- [x] **Admin DLH**: Buat modul penugasan (tampilkan pickup `PAID`, tombol "Tugaskan Pengangkut", pilih transporter dari dropdown).
- [x] **Transporter**: Ubah filter tugas (`transporterId` milik akun aktif), tambah alur "Terima Tugas" (`ON_THE_ROAD`) dan pengisian Laporan Pengangkutan saat `COMPLETED`.
- [x] **Company**: Ubah `PickupRequestPage.tsx` agar menginstruksikan Direct Billing dan menampilkan laporan final dari transporter jika berstatus `COMPLETED`.
