# SOLUSI DEPLOY LANGSUNG UNTUK dermagagizi.puskesmasseribuselatan.com

Dokumen ini adalah solusi langsung terhadap kendala yang terdeteksi di Hostinger:
> *"Penyebabnya sudah terkonfirmasi: situs masih menyajikan source React/Vite (memanggil /src/main.tsx), bukan hasil build produksinya."*

---

## MENGAPA INI TERJADI DI HOSTINGER?
Ketika Anda menghubungkan Hostinger Git ke branch `main`, Hostinger menarik kode mentah proyek yang `index.html`-nya memanggil `/src/main.tsx`. Browser internet tidak bisa membaca file TypeScript mentah tersebut.

---

## DUA CARA AGAR WEB LANGSUNG TAMPIL

### METODE 1: Otomatis Sinkronisasi via Branch `production` (Rekomendasi Hostinger Git)
Kami telah memasang sistem otomatis GitHub Actions (`.github/workflows/deploy-production.yml`).

1. **Publish ke GitHub**:
   - Di Google AI Studio, klik **Publish to GitHub** (atau Export to GitHub).
   - Begitu ter-publish ke branch `main`, GitHub Actions akan otomatis meng-compile proyek dan memasukkan file jadinya ke branch baru bernama **`production`**.
   - Di branch `production` ini, file `index.html` hasil compile **sudah berada tepat di posisi root / utama**!

2. **Atur di Hostinger hPanel**:
   - Masuk ke Hostinger hPanel -> Buka website **`dermagagizi.puskesmasseribuselatan.com`**.
   - Masuk ke menu **Tingkat Lanjut (Advanced)** -> **Git**.
   - Jika sudah ada repository sebelumnya, klik **Hapus (Delete)** repository lama tersebut.
   - Buat baru:
     - **Repository URL**: URL repository GitHub Anda
     - **Branch**: Ganti `main` menjadi **`production`**
     - **Install in Directory**: Kosongkan atau biarkan `public_html`
   - Klik **Deploy**.
   - Selesai! Web Anda akan langsung tampil karena branch `production` berisi file kompilasi murni yang siap disajikan oleh Hostinger.

---

### METODE 2: Upload Cepat Langsung Melalui File Manager (1 Menit Selesai)
Folder **`dist`** sudah kami compile-kan langsung di dalam sistem ini dan sudah siap pakai.

1. Buka **Hostinger hPanel** -> **File Manager** untuk domain `dermagagizi.puskesmasseribuselatan.com`.
2. Masuk ke folder **`public_html`**.
3. Jika di dalam `public_html` ada folder `src/`, file `package.json`, atau `tsconfig.json`, hapus atau kosongkan isi `public_html`.
4. Ambil isi dari folder **`dist`** (yang berisi `index.html`, folder `assets/`, dan file `.htaccess`).
5. Upload langsung ke dalam **`public_html`**, sehingga susunannya menjadi:
   ```
   public_html/
   ├── assets/
   │   ├── index-CD2ZNZPF.css
   │   └── index-Cem06OLe.js
   ├── .htaccess
   └── index.html
   ```
6. Buka **https://dermagagizi.puskesmasseribuselatan.com** di browser lalu tekan `Ctrl + F5`.
7. Web aplikasi **DERMAGA GIZI** langsung tampil aktif dan berfungsi 100%!
