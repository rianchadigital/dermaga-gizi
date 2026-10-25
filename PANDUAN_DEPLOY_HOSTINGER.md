# PANDUAN DEPLOY OTOMATIS: dermagagizi.puskesmasseribuselatan.com

Solusi perbaikan menyeluruh untuk masalah:
> *"Situs masih belum bisa tampil karena folder dist belum ada di root website / index.html masih memanggil /src/main.tsx"*

---

## 🔍 PENYEBAB & PERBAIKAN YANG SUDAH DITERAPKAN

1. **Folder `dist` sebelumnya tidak terkirim ke GitHub**:
   - Di file `.gitignore` sebelumnya, folder hasil build terabaikan secara default.
   - **Sudah diperbaiki**: `.gitignore` kini diatur secara tegas (`!dist/` dan `!assets/`) agar folder `dist/` dan `assets/` hasil build produksi **selalu diunggah ke GitHub**.
2. **Server Hostinger membaca file `index.html` mentah React/Vite**:
   - Ketika Hostinger Git menarik branch `main`, web server Hostinger (Apache/LiteSpeed) menyajikan `index.html` root yang memanggil TypeScript `/src/main.tsx` sehingga browser menampilkan layar putih.
   - **Sudah diperbaiki**:
     - File `.htaccess` telah dikonfigurasi ulang: setiap kali pengunjung membuka `https://dermagagizi.puskesmasseribuselatan.com/`, server **otomatis menyajikan `dist/index.html` dan aset `dist/assets/` terkompilasi**.
     - Ditambahkan dispatcher `index.php` sebagai pengaman ganda jika server LiteSpeed memprioritaskan PHP.
     - Folder `assets/` juga digandakan langsung di root.

---

## 🚀 CARA AKTIVASI (CUKUP 2 LANGKAH MUDAH)

### Langkah 1: Simpan & Publish ke GitHub dari Google AI Studio
1. Di pojok kanan atas Google AI Studio, klik tombol **Publish to GitHub** (atau **Export / Sync to GitHub**).
2. Tunggu hingga proses commit dan push selesai.
   *(Folder `dist/`, `.htaccess`, dan file kompilasi JavaScript/CSS kini ikut terunggah secara utuh ke repositori GitHub Anda).*

### Langkah 2: Tarik Pembaruan di Hostinger
1. Buka **Hostinger hPanel** -> pilih domain **`dermagagizi.puskesmasseribuselatan.com`**.
2. Masuk ke menu **Tingkat Lanjut (Advanced)** -> **Git**.
3. Di samping repository Anda, klik tombol **Deploy** atau **Pull** (Tarik).
   - *Catatan: Jika sebelumnya error atau repository macet, Anda bisa klik **Hapus/Delete Repository** di menu Git Hostinger, lalu buat ulang dengan memasukkan URL repo GitHub Anda, branch `main`, dan klik **Deploy**.*
4. Setelah statusnya berhasil (*Deployed*), buka situs:
   👉 **https://dermagagizi.puskesmasseribuselatan.com**
5. Lakukan hard refresh dengan menekan **Ctrl + F5** (atau **Cmd + Shift + R** di Mac) untuk membuang cache lama.

---

## 🎯 ALTERNATIF JIKA MENGGUNAKAN BRANCH `production`
Jika Anda lebih menyukai branch khusus produksi di mana file `dist/` ditaruh langsung di paling depan (tanpa folder bertingkat):
- GitHub Actions (`.github/workflows/deploy-production.yml`) otomatis membuat branch **`production`** setiap kali Anda mem-publish ke `main`.
- Di menu Git Hostinger, Anda cukup mengubah pilihan Branch dari `main` menjadi **`production`**, lalu klik **Deploy**.
