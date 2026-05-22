# Rencana Implementasi Pemilihan Role Otomatis Saat Login

Dokumen ini menjelaskan langkah-langkah teknis untuk menghapus dropdown seleksi peran (role) pada halaman login, menyelaraskan backend agar melakukan otentikasi berbasis email & password saja, serta secara dinamis mengarahkan pengguna ke dashboard masing-masing sesuai hak akses di database.

## Rangkuman Perubahan

Sistem akan mendeteksi peran pengguna secara otomatis:
1. **Di Backend**: Menghapus kewajiban menyertakan `role` saat otentikasi. Sistem mencocokkan email dan kata sandi, lalu mengembalikan entitas user lengkap beserta `role` aslinya dari database.
2. **Di Frontend**: Menghapus dropdown pemilihan peran di UI `LoginPage.tsx` agar tampilan form login menjadi lebih minimalis, bersih, dan premium. 
3. **Di State Store**: Menyederhanakan alur `login` di Zustand (`useSijagaStore.ts`) agar hanya melakukan satu kali pemanggilan API (mengeliminasi redundansi hit API ganda) dan mengembalikan objek `user` hasil otentikasi untuk kebutuhan navigasi instan.

---

## Proposed Changes

### 1. Backend: Otentikasi Dinamis (`limbah-be`)

#### [MODIFY] [authController.ts](file:///d:/Pekerjaan/E-Limbah/limbah-be/src/controllers/authController.ts)
- Mengubah `loginSchema` (Zod) untuk membuat field `role` bersifat opsional:
  ```typescript
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    role: z.nativeEnum(UserRole).optional(),
  });
  ```
- Menyesuaikan penanganan validasi peran dalam fungsi `login`. Jika `role` tidak dikirim dalam request body, bypass pemeriksaan kecocokan peran manual (`user.role !== role`). Jika dikirim, tetap lakukan pencocokan demi backward compatibility:
  ```typescript
  // Match role (only if explicitly provided)
  if (role && user.role !== role) {
    return res.status(403).json({ success: false, error: 'Role mismatch' });
  }
  ```

---

### 2. Frontend: API Client (`limbah-fe`)

#### [MODIFY] [api.ts](file:///d:/Pekerjaan/E-Limbah/limbah-fe/src/lib/api.ts)
- Mengubah tipe parameter `role` pada `apiService.auth.login` menjadi opsional:
  ```typescript
  login: async (email: string, password: string, role?: string) => {
    const response = await api.post("/api/auth/login", { email, password, role });
    return response.data;
  },
  ```

---

### 3. Frontend: State Management Zustand (`limbah-fe`)

#### [MODIFY] [useSijagaStore.ts](file:///d:/Pekerjaan/E-Limbah/limbah-fe/src/store/useSijagaStore.ts)
- Mengubah deklarasi interface `login` pada `SijagaState` agar parameter `role` opsional dan mengembalikan objek `User | null` alih-alih `boolean`:
  ```typescript
  login: (email: string, password: string, role?: UserRole) => Promise<User | null>;
  ```
- Memperbarui implementasi fungsi `login` di store:
  - Melakukan panggilan API login.
  - Jika otentikasi sukses, lakukan penyimpanan token dan inisialisasi state global (`currentUser`, `companies`, `selectedCompanyId`).
  - Mengembalikan data `apiUser` (User) ke pemanggil alih-alih nilai `true`.

---

### 4. Frontend: Halaman UI Login (`limbah-fe`)

#### [MODIFY] [LoginPage.tsx](file:///d:/Pekerjaan/E-Limbah/limbah-fe/src/modules/auth/pages/LoginPage.tsx)
- Menghapus komponen `Select` (Dropdown Role) beserta label pendukungnya dari JSX (Baris 141-157).
- Menyesuaikan form layout agar tetap seimbang secara estetika visual (glassmorphism premium dan spasi presisi).
- Menghapus pemanggilan API ganda. Fungsi `handleLogin` akan langsung memanggil `loginStore(email, password)` (tanpa parameter `role`).
- Mengambil properti `role` dari objek user hasil return `loginStore`, lalu memanggil `handleRoleRedirection(user.role)` untuk navigasi instan ke modul/dashboard yang tepat.

---

## Verification Plan

### Automated Verification
1. **Pemeriksaan Kompilasi TypeScript**: Menjalankan perintah `npm run build` pada folder `limbah-fe` untuk memastikan seluruh tipe data ter-resolusi sempurna tanpa ada error.

### Manual Verification
1. **Login PIC Perusahaan**:
   - Masukkan kredensial email PIC (`company@sijaga.id` atau sejenisnya) dan kata sandi.
   - Verifikasi halaman langsung beralih secara dinamis ke `/company` (Dashboard Perusahaan).
2. **Login Transporter**:
   - Masukkan kredensial email Transporter.
   - Verifikasi halaman langsung beralih ke `/transporter` (Transporter Dashboard).
3. **Login Admin DLH**:
   - Masukkan kredensial email Admin DLH.
   - Verifikasi halaman langsung beralih ke `/admin` (Admin DLH Dashboard).
4. **Verifikasi Penanganan Error**:
   - Coba masuk dengan kata sandi salah. Verifikasi pesan kesalahan muncul dengan benar tanpa ada crash pada UI.
