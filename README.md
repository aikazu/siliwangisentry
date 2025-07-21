
# Siliwangi Sentry

> Dasbor keamanan dan manajemen kerentanan modern yang dirancang untuk mengorkestrasi, menjalankan, dan memvisualisasikan alur kerja pemindaian keamanan secara lokal.

Siliwangi Sentry adalah dasbor keamanan dan manajemen kerentanan modern yang dibangun dengan Next.js dan ShadCN UI. Aplikasi ini dirancang sebagai alat mandiri (self-contained) untuk mengorkestrasi *tool-tool* keamanan populer seperti `subfinder`, `httpx`, dan `nuclei`, lalu memvisualisasikan hasilnya dalam antarmuka yang bersih, terpusat, dan real-time.

Aplikasi ini bersifat **lokal-pertama**, artinya tidak memerlukan database eksternal seperti Firebase. Semua konfigurasi disimpan secara lokal dalam file `settings.json`, dan hasil pemindaian disimpan di sistem file Anda.

## ✨ Fitur Utama

-   **Manajemen Tool Otomatis**: Aplikasi secara otomatis mengunduh, mengekstrak, dan menyiapkan semua *tool* yang diperlukan (`subfinder`, `httpx`, `nuclei`) saat pertama kali dijalankan.
-   **Alur Kerja Pemindaian Terintegrasi**: Menjalankan alur kerja logis: enumerasi subdomain, penemuan host aktif, dan pemindaian kerentanan.
-   **Dasbor Interaktif**: Visualisasikan target yang dipindai, lihat ringkasan jumlah kerentanan, dan tingkat keparahan tertinggi dalam satu tampilan.
-   **Halaman Detail Target**: Selami hasil pemindaian untuk setiap target, dengan kerentanan yang dikelompokkan berdasarkan host yang terpengaruh.
-   **Pengaturan Pemindaian yang Dapat Disesuaikan**: Konfigurasikan *flag* Nuclei (seperti *rate-limit*, *concurrency*) dan pilih kategori templat melalui dialog pengaturan yang intuitif.
-   **Preset Pemindaian**: Gunakan preset yang telah dikonfigurasi sebelumnya ("Fast", "Comprehensive", "Stealthy") untuk memulai pemindaian dengan cepat.
-   **Pemantauan Real-time & Pembatalan**: Pantau kemajuan pemindaian secara langsung melalui log di UI dan batalkan pemindaian kapan saja.
-   **Desain Responsif**: Antarmuka yang bersih dan modern yang berfungsi dengan baik di berbagai ukuran layar.

## 🚀 Memulai

Proses penyiapan dirancang agar sesederhana mungkin. Anda tidak memerlukan konfigurasi eksternal apa pun.

### 1. Kloning Repositori

```bash
git clone <URL_REPOSITORI_ANDA>
cd <NAMA_DIREKTORI>
```

### 2. Instal Dependensi

Aplikasi ini menggunakan `npm` sebagai manajer paket.

```bash
npm install
```

### 3. Jalankan Aplikasi

Setelah instalasi selesai, jalankan server pengembangan.

```bash
npm run dev
```

Buka [http://localhost:9002](http://localhost:9002) di browser Anda.

### 4. Persiapan Tool Awal

Saat Anda pertama kali memuat aplikasi, Anda akan melihat tombol **"Prepare Tools"**. Klik tombol ini. Aplikasi akan secara otomatis:
1.  Mendeteksi sistem operasi Anda (Linux, macOS, atau Windows).
2.  Mengunduh versi yang benar dari `subfinder`, `httpx`, dan `nuclei`.
3.  Mengunduh repositori `nuclei-templates` terbaru.
4.  Menempatkan semuanya di direktori `tools/` di dalam proyek Anda.

Proses ini mungkin memakan waktu beberapa menit tergantung pada koneksi internet Anda. Setelah selesai, tombol "Prepare Tools" akan berubah menjadi **"New Scan"**, dan Anda siap untuk memulai.

### 5. Menjalankan Pemindaian

1.  Klik tombol **"New Scan"**.
2.  Masukkan domain target (misalnya, `example.com`).
3.  Klik **"Start Scan"**.

Anda akan melihat log kemajuan muncul di dalam dialog. Dasbor akan secara otomatis diperbarui ketika pemindaian selesai.

## ⚙️ Konfigurasi

Semua pengaturan pemindaian dikelola melalui antarmuka pengguna dan disimpan dalam file `settings.json` di root proyek.

-   Klik ikon **Settings** (roda gigi) di bilah navigasi atas.
-   Di sini Anda dapat:
    -   **Menerapkan Preset**: Pilih antara "Fast", "Comprehensive", atau "Stealthy" untuk mengatur semua *flag* secara otomatis.
    -   **Mengubah Flag Nuclei**: Sesuaikan parameter seperti *rate-limit*, *concurrency*, *timeout*, dan lainnya.
    -   **Memilih Template**: Aktifkan atau nonaktifkan kategori template Nuclei yang ingin Anda gunakan dalam pemindaian.
    -   **Mengatur Hasil**: Pilih untuk mengecualikan temuan dengan tingkat keparahan "Info" langsung dari pemindai.
-   Perubahan Anda disimpan secara otomatis.

## 🛠️ Tumpukan Teknologi

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Komponen UI**: [ShadCN UI](https://ui.shadcn.com/)
-   **Tool Keamanan**:
    -   [Subfinder](https://github.com/projectdiscovery/subfinder)
    -   [HTTPX](https://github.com/projectdiscovery/httpx)
    -   [Nuclei](https://github.com/projectdiscovery/nuclei)

## 📜 Perintah yang Tersedia

-   `npm run dev`: Memulai server pengembangan di `http://localhost:9002`.
-   `npm run build`: Mem-build aplikasi untuk produksi.
-   `npm run start`: Menjalankan aplikasi produksi yang telah di-build di `http://localhost:1337`.
-   `npm run lint`: Menjalankan linter ESLint.
-   `npm run typecheck`: Memeriksa tipe TypeScript tanpa menghasilkan file.
