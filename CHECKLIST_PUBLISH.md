# 📋 Master Checklist Publikasi Website GBI Getsemani

Dokumen ini adalah panduan kontrol kesiapan rilis (*release readiness checklist*) resmi untuk Website GBI Getsemani. Setiap item yang telah selesai ditandai `[x]`, dan bagian yang membutuhkan kelengkapan data gereja atau proses berikutnya ditandai `[ ]`.

---

## 🔒 1. Keamanan & Privasi Data (Security & Privacy)

- [x] **Proteksi Direktori Data Sensitif (`data/`)**
  - **Status:** SELESAI
  - **Keterangan:** File `.htaccess` telah ditambahkan di dalam folder `data/` (`Require all denied`). File `baptisan.json` dan `persembahan.json` tidak dapat diakses atau diunduh langsung lewat browser oleh pihak luar.
- [x] **File Locking Konkurensi Database JSON**
  - **Status:** SELESAI
  - **Keterangan:** Flag `LOCK_EX` telah ditambahkan pada semua fungsi penyimpanan di:
    - `api/baptisan.php`
    - `api/persembahan.php`
    - `api/pengumuman.php`
    - `api/kegiatan.php`
    - `api/khotbah.php`
    - `api/umkm.php`
    Mencegah file korup/timpa saat banyak jemaat mengakses bersamaan.
- [x] **Pembersihan Kredensial Default di Form Admin**
  - **Status:** SELESAI
  - **Keterangan:** Input `value="admin"` dan `value="admin123"` di `admin/index.html` telah dihapus agar kredensial tidak muncul otomatis di layar saat halaman admin dibuka.
- [ ] **Ganti Username & Password Default Admin di Backend**
  - **Status:** PERLU DATA DARI PENGURUS
  - **File:** `api/auth.php` (baris 6-7)
  - **Tindakan:** Ganti `'admin'` dan `'admin123'` dengan kredensial baru yang kuat dan rahasia yang hanya diketahui oleh pengurus gereja.
- [ ] **Pembersihan Data Testing Jemaat Sebelum Rilis**
  - **Status:** PENDING
  - **File:** `data/baptisan.json` & `data/persembahan.json`
  - **Tindakan:** Hapus entri data uji coba / dummy ("Test Jemaat", sample KTP) dari sistem admin sebelum website dibuka untuk umum.

---

## 💳 2. Data Kontak, Rekening & Pastoral

- [ ] **Nomor Rekening Bank Resmi Persembahan**
  - **Status:** PERLU DATA DARI BENDAHARA GEREJA
  - **File:** `persembahan.html` (baris 133, 149, 165)
  - **Tindakan:** Ganti nomor dummy berikut dengan nomor rekening resmi atas nama gereja:
    - BCA: dari `1234567890` -> rekening resmi
    - Mandiri: dari `1400111222333` -> rekening resmi
    - BRI: dari `001201002345678` -> rekening resmi
- [ ] **Nomor WhatsApp Resmi Pelayanan & Sekretariat**
  - **Status:** PERLU DATA DARI SEKRETARIAT GEREJA
  - **File:** `index.html`, `app.js` (baris 43), `persembahan.html`, `baptisan.html`
  - **Tindakan:** Ganti nomor dummy `6281234567890` dengan:
    - Nomor WA Sekretariat / Admin Utama
    - Nomor WA Gembala Sidang (Pdt. Ed Merdhiriawan)
    - Nomor WA Pastoral Konseling (Pdm. Yosua & Pdm. Daniel)
- [ ] **Verifikasi Gambar QRIS Resmi**
  - **Status:** CEK KELAYAKAN
  - **File:** `Resource/qris-gbi-getsemani.jpg`
  - **Tindakan:** Pastikan gambar QRIS yang terpasang sudah valid, nama merchant sesuai (GBI Getsemani), dan dapat di-scan oleh aplikasi m-Banking/e-wallet.

---

## 🛠️ 3. Perbaikan Bug & Integritas File

- [x] **Hapus Referensi Video Rusak (404 Not Found)**
  - **Status:** SELESAI
  - **Keterangan:** Tag `<source src="tentang-gereja.mp4">` di `index.html` (baris 929) telah dihapus karena file tersebut tidak ada di server. Video background profil gereja kini berjalan mulus dengan source utama.
- [x] **Pemeriksaan Fungsi Kalender & Jadwal**
  - **Status:** SELESAI
  - **Keterangan:** Fungsi `downloadICS()` dan `copySchedule()` di `app.js` telah terverifikasi terhubung dengan tombol-tombol jadwal kebaktian di `index.html`.
- [x] **Pemeriksaan Floating Chat WhatsApp**
  - **Status:** SELESAI
  - **Keterangan:** Fungsi `toggleWaChat()` di `app.js` telah aktif dan siap membuka popup chat interaktif.

---

## ⚡ 4. Optimasi Performa & Ukuran Aset (Speed Optimization)

- [x] **Kompresi Gambar Background Resolusi Tinggi (CSS Backgrounds)**
  - **Status:** SELESAI
  - **Keterangan:** 
    - `LUP_4558.JPG` (9.25 MB) telah dikompresi menjadi `hero-bg-opt.jpg` (**329 KB**, penghematan 96.5%).
    - `LUP_8538.JPG` (6.29 MB) telah dikompresi menjadi `pengumuman-bg-opt.jpg` (**160 KB**, penghematan 97.5%).
    - File `site.css` telah diperbarui menggunakan aset ringan tersebut.
- [ ] **Optimasi Foto Dokumentasi Tambahan (Opsional)**
  - **Status:** TERSISA DOKUMENTASI TAMBAHAN
  - **File:** `Resource/BANNER NEON BOX.jpg` (11.52 MB), serta foto galeri event jika ingin di-upload ke CMS.

---

## 🌐 5. SEO, Social Share (Open Graph) & Branding

- [x] **Favicon Browser**
  - **Status:** SELESAI
  - **Keterangan:** Tag icon logo resmi GBI Getsemani telah ditambahkan ke `<head>` di `index.html`.
- [x] **Open Graph Meta Tags (Preview WhatsApp / Sosmed)**
  - **Status:** SELESAI
  - **Keterangan:** Metadata `og:title`, `og:description`, `og:image`, dan `twitter:card` telah terpasang di `index.html`. Link website akan menampilkan preview logo & kartu profil yang rapi saat dibagikan di grup WA.
- [x] **File `robots.txt`**
  - **Status:** SELESAI
  - **Keterangan:** Menuntun robot Google mengindeks halaman publik gereja dan memblokir akses crawler ke folder `/admin/`, `/api/`, dan `/data/`.
- [x] **File `sitemap.xml`**
  - **Status:** SELESAI
  - **Keterangan:** Peta situs XML telah dibuat untuk mempercepat indeks mesin pencari.

---

## 🧪 6. Uji Coba Alur Pengguna (End-to-End Verification)

- [ ] **Uji Coba Formulir Pendaftaran Baptisan**
  - Submit formulir via `baptisan.html` -> pastikan notifikasi sukses muncul -> periksa data masuk di Panel Admin (`/admin/` tab Baptisan).
- [ ] **Uji Coba Formulir Konfirmasi Persembahan**
  - Submit bukti transfer via `persembahan.html` -> pastikan data masuk di Panel Admin (`/admin/` tab Persembahan).
- [ ] **Uji Coba Update Warta & Khotbah via Admin CMS**
  - Coba tambah warta pengumuman baru dari `/admin/` -> pastikan langsung tampil di halaman depan `index.html`.
