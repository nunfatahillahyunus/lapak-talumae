# 🌾 Lapak Desa Talumae - Digitalisasi & Peta Sebaran UMKM

![Status](https://img.shields.io/badge/Status-Aktif-brightgreen)
![Tech Stack](https://img.shields.io/badge/Tech-HTML%20%7C%20Tailwind%20%7C%20JS-blue)
![Database](https://img.shields.io/badge/Database-Google%20Sheets-10b981)
![License](https://img.shields.io/badge/License-MIT-gray)

**Lapak Desa Talumae** adalah sebuah platform berbasis *web* yang dirancang untuk mendigitalkan, memetakan, dan mempromosikan produk-produk Usaha Mikro, Kecil, dan Menengah (UMKM) milik warga Desa Talumae. Proyek ini dibangun sebagai luaran inovasi program Kuliah Kerja Nyata (KKN) Universitas Hasanuddin guna mendorong kemandirian ekonomi desa melalui pemanfaatan teknologi tepat guna.

## ✨ Fitur Utama

- **🗺️ Peta Sebaran UMKM Interaktif:** Memanfaatkan Leaflet.js untuk memvisualisasikan titik koordinat pasti setiap lapak/etalase warga desa, lengkap dengan fitur penyaringan (*filter*) kategori toko secara *real-time*.
- **🛍️ Katalog Etalase Dinamis:** Menampilkan kartu produk warga dengan antarmuka yang bersih dan responsif (didukung oleh Tailwind CSS).
- **⏳ Sistem Harga Coret & Diskon (Waktu Terbatas):** Mesin JavaScript kustom yang membaca rentang waktu kalender. Jika penjual mengatur promo, *website* otomatis mencoret harga asli dan menampilkan lencana diskon selama periode promo berlangsung.
- **🕒 Indikator Buka/Tutup Real-time:** Sistem akan melacak jam di HP pengunjung web, lalu mencocokkannya dengan hari dan jadwal operasional toko untuk menampilkan status **🟢 Buka** atau **🔴 Tutup**.
- **📱 Dasbor Penjual Terintegrasi AppSheet:** Warga (penjual) dapat menambah, mengedit, dan mengatur etalase mereka langsung dari *smartphone* melalui aplikasi Google AppSheet menggunakan sistem "Kode Unik Toko".
- **💬 Checkout via WhatsApp:** Terhubung secara mulus dengan API WhatsApp untuk memfasilitasi transaksi langsung antara pembeli dan penjual tanpa biaya potongan aplikasi.

## 🏗️ Arsitektur Sistem (Serverless)

Aplikasi ini menggunakan pendekatan arsitektur *zero-cost* (tanpa biaya langganan *server*) dengan memanfaatkan ekosistem Google:
1. **Frontend:** HTML Statis, Tailwind CSS, dan Vanilla JavaScript di-*hosting* menggunakan GitHub Pages.
2. **Backend / Database:** Memanfaatkan **Google Sheets** sebagai basis data relasional utama. Data diekspor secara publik menjadi tautan CSV.
3. **Data Fetching:** Modul `PapaParse` digunakan di sisi *client* untuk mengunduh, mengurai (*parsing*), dan menyaring data CSV dalam hitungan milidetik.
4. **Content Management System (CMS):** Google AppSheet digunakan sebagai antarmuka/aplikasi bagi warga untuk menginput data ke Google Sheets tanpa perlu menyentuh *database* secara langsung.

## 🚀 Cara Menjalankan secara Lokal

Karena proyek ini bersifat statis (*Client-Side Rendering* murni), instalasinya sangat mudah:

1. *Clone repository* ini ke komputer Anda:
   ```bash
   git clone [https://github.com/USERNAME_ANDA/lapak-talumae.git](https://github.com/USERNAME_ANDA/lapak-talumae.git)
