# PANDUAN LENGKAP DEPLOY APLIKASI DERMAGA GIZI KE HOSTINGER

Dokumen ini menjelaskan mengapa aplikasi belum tampil dan langkah demi langkah dari **Google AI Studio -> GitHub -> Hostinger**.

---

## 1. Penyebab Mengapa Web Belum Tampil di Hostinger

Ketika Anda menghubungkan GitHub langsung ke Hostinger (misal via fitur Git di hPanel), file yang ditarik ke `public_html` adalah **Source Code Mentah** (`src/`, `package.json`, `index.html` yang memanggil `/src/main.tsx`).

1. **Browser tidak bisa membaca TypeScript mentah (`.tsx`)**:
   Web browser (Chrome/Edge/Safari) hanya bisa membaca file HTML, CSS, dan JavaScript murni. File di `src/` harus di-*compile (build)* terlebih dahulu menjadi folder `dist`.
2. **Jalur Aset (Base URL)**:
   Sebelumnya jalur aset belum diatur ke relatif. Sekarang di `vite.config.ts` sudah kami ubah menjadi `base: './'` agar terbaca di semua jenis hosting.
3. **Routing Single Page Application (SPA)**:
   Kami sudah menambahkan file `.htaccess` di folder `public/` agar saat Anda me-refresh halaman atau membuka menu, tidak muncul error **404 Not Found**.

---

## 2. Cara Termudah & Tercepat: Upload Folder `dist` (Sangat Direkomendasikan untuk Pemula)

Cara ini paling aman dan pasti 100% langsung tampil di domain Hostinger Anda:

### Langkah 1: Build Aplikasi
Di komputer Anda (setelah Anda clone atau download dari GitHub):
1. Buka terminal di folder proyek ini.
2. Jalankan perintah instalasi dan build:
   ```bash
   npm install
   npm run build
   ```
3. Tunggu beberapa detik sampai selesai. Akan muncul folder baru bernama **`dist`**.

### Langkah 2: Upload ke Hostinger File Manager
1. Login ke akun **Hostinger** Anda -> Masuk ke **hPanel**.
2. Klik menu **Websites** -> Klik **Kelola (Manage)** pada domain Anda.
3. Buka menu **File Manager** -> Masuk ke folder **`public_html`**.
4. Hapus file `default.php` atau file bawaan Hostinger lama yang ada di dalam `public_html` (jika ada).
5. Buka folder **`dist`** di komputer Anda, lalu **upload SEMUA isi di dalam folder `dist`** ke dalam `public_html`.
   *(Catatan: Jangan upload foldernya, melainkan file-file di dalamnya seperti `index.html`, folder `assets/`, dan file `.htaccess`)*.
6. Selesai! Buka domain Anda di browser, aplikasi **DERMAGA GIZI** langsung aktif dan berjalan normal.

---

## 3. Cara Otomatis: Menggunakan GitHub Actions (Sekali Pasang, Otomatis Selamanya)

Jika Anda ingin setiap kali Anda simpan / push ke GitHub aplikasi di Hostinger otomatis ter-update sendiri tanpa perlu upload manual:

### Langkah 1: Dapatkan Akun FTP dari Hostinger
1. Di hPanel Hostinger, cari menu **Akun FTP (FTP Accounts)**.
2. Catat 3 data berikut:
   - **FTP Host / Server** (misal: `ftp.domainanda.com` atau alamat IP)
   - **FTP Username**
   - **FTP Password**

### Langkah 2: Masukkan ke GitHub Secrets
1. Buka repository proyek Anda di **GitHub**.
2. Klik tab **Settings** -> **Secrets and variables** -> **Actions**.
3. Klik tombol **New repository secret**, tambahkan 3 secret berikut:
   - Nama: `HOSTINGER_FTP_SERVER` -> Isi dengan Host FTP Anda
   - Nama: `HOSTINGER_FTP_USERNAME` -> Isi dengan Username FTP Anda
   - Nama: `HOSTINGER_FTP_PASSWORD` -> Isi dengan Password FTP Anda

### Langkah 3: Push ke GitHub
File konfigurasi `.github/workflows/deploy-hostinger.yml` sudah kami siapkan di dalam proyek ini. 
Setiap kali Anda melakukan push ke branch `main`, GitHub akan otomatis:
1. Menjalankan `npm run build` di server GitHub.
2. Mengirimkan file jadi di folder `dist` langsung ke `public_html` di Hostinger Anda.

---

## 4. Hubungan dengan Database Google Spreadsheet (API GAS)
Aplikasi ini sudah dirancang untuk berjalan di hosting statis mana pun (termasuk Hostinger):
- Data dan intervensi tersimpan di **Google Spreadsheet** melalui Web App Google Apps Script (GAS).
- Di aplikasi yang sudah online di Hostinger, Anda tinggal membuka menu **Pengaturan Aplikasi (Settings)** lalu pastikan URL Web App Google Apps Script sudah terpasang.
