# ⚡ Zynk — Personal Bio Link & Portfolio

<p align="center">
  <img src="assets/zynk-badge.svg" alt="Zynk Logo" width="120" height="120" />
</p>

> **Zynk** adalah platform **Personal Bio Link** modern, ringan, dan elegan (serupa Linktree) yang dirancang khusus untuk memusatkan profil pribadi, tautan sosial, dan proyek terkurasi dalam satu halaman responsif berestetika *glassmorphism*.
> Dilengkapi Dashboard Admin yang aman dengan Google Authentication, kustomisasi tema live preview, manajemen tautan *drag-and-drop*, dan pelacakan statistik analitik harian.

---

## ✨ Fitur Utama

### 📱 Halaman Publik (`/`)
- **Header Profil**: Foto avatar berbingkai gradien lembut, nama lengkap, dan bio ringkas satu kalimat.
- **Baris Sosial Media**: Ikon tautan sosial dinamis (GitHub, Instagram, LinkedIn, Email, WhatsApp, X/Twitter, YouTube, dll.).
- **Daftar Kartu Tautan Mobile-First**: Kartu tautan interaktif dengan ikon, judul, deskripsi ringkas, dan efek *hover/tap* halus. Hanya menampilkan tautan aktif (`isActive = true`) yang diurutkan berdasarkan `position`.
- **Filter Kategori Dinamis**: Tab kategori otomatis berdasarkan data tautan ditambah opsi "Semua".
- **Dukungan Tema Terang / Gelap & Aksen Warna**: Mode Terang, Gelap, atau Otomatis (mengikuti sistem OS), dengan pilihan aksen warna dinamis (*Zynk Blue, Cyan, Violet, Emerald, Rose, Amber*).
- **Cepat & Ringan**: Dilengkapi *skeleton loading state* dan *empty state* yang rapi.
- **SEO & Social Share Friendly**: Open Graph dan Twitter Card siap pakai untuk tampilan pratinjau tautan di WhatsApp, Telegram, Twitter, dan media sosial lainnya.

### 🔐 Dashboard Admin (`/admin`)
- **Autentikasi Google Aman**: Pembatasan akses ke email admin (`haf.hafian@gmail.com`) ditegakkan di sisi client dan aturan keamanan database (`database.rules.json`). Form login publik tidak mengekspos alamat email admin.
- **Tab 1 — Tautan**:
  - Tambah, edit, dan hapus tautan dengan dialog konfirmasi aman.
  - *Toggle switch* cepat untuk mengaktifkan / menonaktifkan tautan secara *real-time*.
  - *Drag-and-Drop Reordering* (dan tombol panah naik/turun yang ramah layar sentuh mobile) untuk mengatur urutan posisi.
  - Unggah ikon kustom dengan auto-kompresi gambar.
- **Tab 2 — Profil & Sosial**:
  - Edit nama lengkap dan bio satu kalimat (dengan pembatas karakter).
  - Unggah foto avatar dengan kompresi otomatis via HTML5 Canvas (±256x256 px).
  - Tambah, atur, dan hapus tautan media sosial secara dinamis.
- **Tab 3 — Tampilan & Tema**:
  - Pilih mode tema (*Terang / Gelap / Otomatis*).
  - Pilih palet warna aksen atau gunakan *custom color picker*.
  - **Live Preview Smartphone Mockup**: Pratinjau interaktif langsung di sebelah form yang merefleksikan perubahan warna, profil, dan kartu secara instan.
- **Tab 4 — Statistik & Analitik**:
  - Ringkasan KPI: Total Kunjungan (*Views*), Total Klik Tautan (*Clicks*), Rata-rata CTR, dan Tautan Terpopuler.
  - Grafik tren aktivitas harian 7 hari dan 30 hari.
  - Tabel rincian kinerja dan kontribusi persentase per tautan.

### ⚡ Pelacakan Klik & Kunjungan Aman
- **Endpoint Redirect**: `/api/go?id=[id]` atau `/api/go/[id]` melakukan validasi skema URL (`http://` dan `https://`), menangkal celah *open-redirect*, menerapkan *rate-limiting* sederhana anti-spam, menaikkan jumlah klik secara atomik, lalu me-redirect ke alamat tujuan (302).
- **Pencatatan Kunjungan**: `/api/visit` mencatat *page views* harian secara anonim tanpa menyimpan IP, cookies, atau data pribadi (PII).
- **Client Fallback**: Jika dijalankan di server statis lokal tanpa serverless, tautan tetap berfungsi dengan pencatatan langsung ke Firebase RTDB.

---

## 🏗️ Struktur Proyek

```text
Zynk/
├── .env.example            # Contoh konfigurasi environment variable
├── .gitignore              # Berkas yang diabaikan oleh Git
├── database.rules.json     # Aturan keamanan Firebase Realtime Database
├── index.html              # Aplikasi Single Page (Publik + Admin Dashboard)
├── package.json            # Konfigurasi npm & skrip pengujian
├── README.md               # Dokumentasi proyek
├── vercel.json             # Konfigurasi rewrite SPA & serverless Vercel
├── api/
│   ├── go.js               # Vercel Serverless Function: Redirect & atomic click tracking
│   └── visit.js            # Vercel Serverless Function: Anonymous page view tracking
├── assets/                 # Brand assets Zynk (badge, favicon, full logo, icon)
│   ├── zynk-badge.svg
│   ├── zynk-favicon.svg
│   ├── zynk-full.svg
│   └── zynk-icon.svg
└── scripts/
    ├── migrate.js          # Skrip migrasi data lama apps -> links (idempotent)
    └── verify.js           # Skrip pengujian sintaksis ES Module
```

---

## 🛠️ Cara Menjalankan Secara Lokal

Pastikan Node.js telah terinstal di komputer Anda:

```bash
# 1. Jalankan server lokal
npm start
# Atau gunakan Python: python -m http.server 3000

# 2. Akses di browser:
# Halaman Publik: http://localhost:3000
# Portal Admin:   http://localhost:3000/#admin
```

---

## 🔄 Migrasi Data Lama (`apps` ke `links`)

Zynk menyediakan dua cara aman dan idempotent untuk memigrasikan data aplikasi lama ke skema baru tanpa menghapus data lama:

### Cara 1: Lewat Dashboard Admin (Direkomendasikan)
1. Buka browser dan login ke `/admin` menggunakan akun Google admin (`haf.hafian@gmail.com`).
2. Jika terdeteksi data lama yang belum termigrasi, banner notifikasi kuning akan muncul otomatis di atas tab tautan.
3. Klik tombol **"Migrasikan Sekarang"**. Data lama akan disalin ke skema `links` dengan posisi berurutan dan `isActive = true`.

### Cara 2: Lewat Command Line (CLI)
```bash
# Preview migrasi (dry-run aman)
npm run migrate

# Eksekusi dengan Firebase Auth Token
node scripts/migrate.js --write --token="YOUR_FIREBASE_ID_TOKEN"
```

---

## 🔒 Aturan Keamanan Firebase (`database.rules.json`)

Terapkan aturan berikut pada Firebase Console -> Realtime Database -> Rules:

```json
{
  "rules": {
    "artifacts": {
      "bhavanix_production": {
        "public": {
          "data": {
            "profile": {
              ".read": true,
              ".write": "auth != null && auth.token.email === 'haf.hafian@gmail.com'"
            },
            "links": {
              ".read": true,
              ".write": "auth != null && auth.token.email === 'haf.hafian@gmail.com'",
              "$linkId": {
                ".write": "auth != null && auth.token.email === 'haf.hafian@gmail.com' || (newData.child('clickCount').exists() && (!data.exists() || newData.child('clickCount').val() >= data.child('clickCount').val()))"
              }
            },
            "stats_daily": {
              ".read": "auth != null && auth.token.email === 'haf.hafian@gmail.com'",
              "$date": {
                ".read": "auth != null && auth.token.email === 'haf.hafian@gmail.com'",
                ".write": true
              }
            },
            "apps": {
              ".read": true,
              ".write": "auth != null && auth.token.email === 'haf.hafian@gmail.com'"
            }
          }
        }
      }
    }
  }
}
```

---

## 🚀 Environment Variables untuk Deploy ke Vercel

Tambahkan variabel berikut pada menu **Settings -> Environment Variables** di Dashboard Vercel Anda (lihat berkas `.env.example`):

| Variable | Deskripsi | Default / Rekomendasi |
| :--- | :--- | :--- |
| `FIREBASE_DATABASE_URL` | URL Database Firebase | `https://bhavanix-9dcef-default-rtdb.firebaseio.com` |
| `APP_ID` | Identifier root path data | `bhavanix_production` |
| `ADMIN_EMAIL` | Alamat email administrator | `haf.hafian@gmail.com` |

---

## 👨‍💻 Author

Made with ❤️ by <a href="https://www.instagram.com/luthafiyyan_/" target="_blank" rel="noopener noreferrer" class="font-medium text-blue-600 hover:underline">Luthafiyyan</a> | Powered by Caffeine & Good Vibes ☕✨
