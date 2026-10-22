# ⚡ Zynk — Platform Bio Link Multi-User

<p align="center">
  <img src="assets/zynk-badge.svg" alt="Zynk Logo" width="120" height="120" />
</p>

> **Zynk** adalah platform **Multi-User Bio Link** modern, cepat, dan ringan (serupa Linktree).
> Siapa pun dapat mendaftar dengan akun Google, memilih username unik, dan mengelola halaman bio link pribadi mereka sendiri di:
> **`https://zynxid.vercel.app/{username}`**

---

## ✨ Fitur Unggulan

### 🌍 Alur Pengguna & Halaman Publik
- **Landing Page (`/`)**: Penjelasan fitur Zynk, formulir pencarian/klaim username instan, dan tombol masuk dengan Google.
- **Onboarding Interaktif (`/onboarding`)**: Alur pendaftaran awal setelah login Google: pemilihan username dengan pengecekan ketersediaan secara *real-time* (debounced), nama tampilan, bio, dan foto profil.
- **Halaman Profil Publik (`/{username}`)**:
  - Header profil: Avatar, nama tampilan, `@username`, dan bio ringkas.
  - Baris media sosial dinamis (Instagram, TikTok, GitHub, LinkedIn, YouTube, Email, WhatsApp, X/Twitter, Website).
  - Tautan terkelompok berdasarkan **Section** dengan judul rapi, serta tautan tanpa section di bagian teratas.
  - Pengaturan bentuk tombol (*pill/rounded, semi-rounded, square*).
  - Pilihan tema (Terang/Gelap/Otomatis) dan warna aksen sesuai kustomisasi masing-masing pemilik.
  - Halaman 404 ramah bila username belum terdaftar dengan ajakan klaim langsung.
  - Tombol **"Laporkan Halaman Ini"** untuk pelaporan pelanggaran ke pemilik platform.
  - SEO otomatis per halaman (Title, Meta Description, Open Graph & Twitter Card dari foto profil).

### 🛠️ Dashboard Pengguna (`/dashboard`)
1. **Tautan & Section**:
   - Buat, ubah nama, hapus, dan urutkan section.
   - Tambah, edit, aktif/nonaktifkan tautan, dan pindahkan tautan antar-section.
   - Unggah ikon kustom dengan kompresi otomatis atau gunakan ikon bawaan.
   - Batasan keamanan: maksimal 20 section dan 100 tautan per akun untuk mencegah penyalahgunaan.
2. **Profil & Sosial**:
   - Unggah foto profil dengan auto-kompresi via HTML5 Canvas (±256x256 px, <40KB).
   - Ubah nama tampilan, bio (maks 160 karakter dengan penghitung langsung), dan daftar media sosial.
   - Ganti username dengan pembatasan 1x per 30 hari (melepaskan username lama secara atomik).
3. **Tampilan & Tema**:
   - Pilihan tema (Terang, Gelap, Sistem).
   - Palet warna aksen (*Zynk Blue, Cyan, Violet, Emerald, Rose, Amber*) & *custom hex color picker*.
   - Pilihan bentuk sudut kartu tautan (*Pill, Semi-rounded, Kotak*).
   - **Live Smartphone Mockup**: Pratinjau ponsel cerdas langsung di samping form yang merefleksikan perubahan secara instan.
4. **Statistik Transparan**:
   - Total kunjungan (*Page Views*), total klik tautan, dan rata-rata CTR.
   - Grafik tren harian 7 hari dan 30 hari (SVG bersih).
   - Rincian kinerja dan kontribusi klik per tautan.
5. **Pengaturan Akun**:
   - Tombol salin / bagikan tautan profil (`https://zynxid.vercel.app/{username}`).
   - *Toggle* visibilitas halaman (sembunyikan dari publik & mesin pencari bila diinginkan).
   - Hapus akun permanen: Menghapus profil, section, tautan, statistik, dan melepaskan username secara atomik dengan konfirmasi ketik.
   - Panel pemilik platform (`haf.hafian@gmail.com`) untuk meninjau laporan pengguna.

### 🔒 Keamanan Multi-User & Skema Data
- **Aturan Database Firebase RTDB (`database.rules.json`)**:
  - Publik hanya dapat membaca profil, section, dan tautan jika `isPublic === true`.
  - Hak tulis strictly dibatasi: `auth.uid === $uid`. Pengguna A **tidak dapat** memodifikasi data Pengguna B.
  - Indeks `usernames/{usernameLower}` hanya dapat diklaim jika belum ada (`!data.exists()`), atau jika data saat ini milik `auth.uid`.
- **Anti Open-Redirect & Rate Limiting**:
  - Endpoint redirect `/api/go?id=[linkId]&u=[ownerId]` memvalidasi protokol `http:` dan `https:` serta mencegah skema berbahaya (`javascript:`, `data:`).
  - Rate limiting per IP untuk mencegah spam klik dan bot reload.

---

## 🗄️ Model Data (Firebase Realtime Database)

- `artifacts/bhavanix_production/usernames/{usernameLower}`: `{ uid, createdAt }`
- `artifacts/bhavanix_production/users/{uid}/profile`: Info profil, tema, aksen, bentuk tombol, status publik.
- `artifacts/bhavanix_production/users/{uid}/sections/{sectionId}`: Section grup tautan.
- `artifacts/bhavanix_production/users/{uid}/links/{linkId}`: Tautan kartu bio link.
- `artifacts/bhavanix_production/users/{uid}/stats_daily/{YYYY-MM-DD}`: Statistik harian kunjungan & klik per tautan.
- `artifacts/bhavanix_production/reports/{reportId}`: Laporan pelanggaran konten.
- `artifacts/bhavanix_production/public/data/apps`: Arsip data lama (read-only aman).

---

## 🚀 Panduan Menjalankan & Deployment

### 1. Menjalankan Lokal
```bash
# Jalankan server
npm start
# atau: python -m http.server 3000

# Verifikasi sintaksis
npm test
```

### 2. Environment Variables di Vercel
Pastikan variabel berikut diset pada menu **Settings -> Environment Variables** di Dashboard Vercel:
- `FIREBASE_DATABASE_URL`: `https://bhavanix-9dcef-default-rtdb.firebaseio.com`
- `APP_ID`: `bhavanix_production`
- `ADMIN_EMAIL`: `haf.hafian@gmail.com`

### 3. Terapkan Aturan Keamanan Firebase
Salin isi berkas `database.rules.json` ke Firebase Console -> Realtime Database -> Rules untuk mengaktifkan proteksi multi-user di sisi server database.

---

## 🧪 Panduan Uji Manual (Multi-User)

1. **Uji Pengguna Baru**:
   - Buka `https://zynxid.vercel.app/`.
   - Masukkan calon username di halaman beranda, klik **Klaim Sekarang**, lalu masuk dengan Google.
   - Lengkapi onboarding (pilih username unik, nama, dan bio).
   - Pastikan masuk ke `/dashboard` dan halaman publik Anda dapat diakses di `https://zynxid.vercel.app/{username_anda}`.
2. **Uji Isolasi Data (User A vs User B)**:
   - Login dengan Akun A, buat tautan baru.
   - Buka jendela *Incognito* / Akun Google B yang berbeda, login dan buat tautan sendiri.
   - Verifikasi bahwa User B hanya dapat melihat dan mengedit tautannya sendiri di dashboard, dan tidak memiliki akses modifikasi ke data User A.
3. **Uji Halaman 404**:
   - Buka URL sembarang, misalnya `https://zynxid.vercel.app/nama-acak-tidak-ada`.
   - Pastikan muncul halaman 404 ramah dengan tombol klaim username tersebut.
4. **Uji Pengalihan Klik & Statistik**:
   - Klik salah satu kartu tautan di halaman publik; periksa pengalihan ke URL tujuan.
   - Buka tab Statistik di Dashboard pemilik; periksa bahwa hitungan klik dan kunjungan bertambah secara atomik.

---

## 👨‍💻 Author

Made with ❤️ by <a href="https://www.instagram.com/luthafiyyan_/" target="_blank" rel="noopener noreferrer" class="font-medium text-blue-600 hover:underline">Luthafiyyan</a> | Powered by Caffeine & Good Vibes ☕✨
