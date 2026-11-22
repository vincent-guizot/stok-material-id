# 🧱 StokMaterial.id
**Sistem Kasir (POS) & Manajemen Stok Multi-Satuan Toko Bangunan**

Sistem Point of Sale (POS) modern yang dirancang khusus untuk operasional **Toko Bahan Bangunan & Depo Material Konstruksi** di Indonesia. Antarmuka dirancang **sangat jelas, besar (*chunky*), dan ramah bagi pengguna yang kurang terbiasa dengan teknologi**, tanpa mengurangi kecanggihan dan interaktivitasnya.

---

## 🌟 Fitur Utama (MVP)

1. **Mesin Multi-Satuan Dinamis (3-Tingkat)**:
   - Setiap produk memiliki **Satuan Dasar (*Base Unit*)** sebagai patokan mutlak penyimpanan stok di database (misal: `Kg`, `Meter`, `Pcs`, `Keping`).
   - Mendukung satuan jual bertingkat dengan faktor konversi otomatis:
     - *Semen*: 1 Sak 50kg = 50 Kg | 1 Sak 40kg = 40 Kg | Eceran per Kg.
     - *Bata Ringan*: 1 m³ = 83 Pcs | Eceran per Pcs.
     - *Besi Beton*: 1 Lonjor 12m = 12 Meter | 1 Batang 6m = 6 Meter | Eceran per Meter.
     - *Cat Tembok*: 1 Pail 20kg | 1 Galon 5kg | 1 Kaleng 1kg.
     - *Keramik*: 1 Dus = 6 Keping (= 1 m²).
   - Penjualan eceran maupun sak otomatis memotong stok satuan dasar tanpa selisih.

2. **Buku Kasbon Mandor & Piutang Proyek (*Simple Ledger*)**:
   - Profil Mandor / Kontraktor dengan **Batas Plafon Kredit** dan **Tenor Jatuh Tempo**.
   - **Meteran Kredit Lampu Lalu Lintas (*Traffic Light Health Bar*)**:
     - 🟢 **Hijau (< 70%)**: Kasbon aman.
     - 🟡 **Kuning (70% - 90%)**: Peringatan kredit menipis.
     - 🔴 **Merah (> 90% / Over Limit)**: Peringatan berkedip bahwa plafon terlampaui.
   - Pencatatan pembayaran cicilan kasbon yang otomatis mengurangi saldo hutang mandor.

3. **Kasir Cepat & Split Payment**:
   - Pilihan satuan instan (*One-Click Unit Switcher*) langsung dari kartu katalog.
   - Dukungan pembayaran **Tunai**, **Transfer/QRIS**, **Kasbon (Tempo)**, dan **Split Payment (DP Tunai + Sisa Kasbon)**.
   - Tombol cepat pecahan uang rupiah (`Uang Pas`, `50rb`, `100rb`, `200rb`, `500rb`).
   - Kotak raksasa **KEMBALIAN: Rp X** yang anti-salah hitung.
   - Efek konfeti mikro selebrasi saat transaksi berhasil diselesaikan.

4. **Dukungan Cetak Struk Ganda**:
   - **Struk Kasir Thermal (80mm)**: Untuk transaksi ritel harian.
   - **Faktur Surat Jalan Toko Bangunan (A5)**: Format resmi lengkap dengan 3 kotak tanda tangan (*Kasir/Toko*, *Sopir Pengantar*, *Mandor/Penerima Proyek*).

5. **3 Peran Pengguna (*Role-Based Access Control*)**:
   - **Bos / Admin**: Akses penuh ke seluruh fitur dan Laporan Keuangan (Omset, Laba Kotor, Rekap Kasbon).
   - **Kasir**: Operasional kasir penjualan, terima cicilan kasbon, dan cetak struk.
   - **Staf Gudang**: Penerimaan barang masuk dari supplier dan opname fisik material.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Shadcn UI primitives, Zustand, TanStack Query (React Query v5), Axios, Lucide Icons, Framer Motion, Canvas Confetti.
- **Backend**: Node.js, Express.js (ES Module), Sequelize ORM, PostgreSQL (`pg`).
- **Testing**: Jest, Supertest (96 test otomatis, termasuk ketepatan hitungan uang).
- **Database Routing**: Smart Fallback (*Otomatis mendeteksi `NEON_DATABASE_URL`; jika tidak ada, otomatis fallback ke PostgreSQL lokal `localhost:1000`*).

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Prasyarat
- Node.js v20+
- PostgreSQL. Paling mudah lewat Docker: `docker compose up -d db` (Postgres tersedia di **localhost:1000**, user `postgres`, password `admin`, db `stokmaterial_db`).

### 2. Backend
```bash
cd server
cp .env.example .env       # sesuaikan bila perlu (DB_PORT=1000)
npm install
npm run dev                # API di http://localhost:5000/api/v1
```
Saat start, server otomatis menjalankan **migration** yang belum terpasang, dan mengisi **seeder** hanya jika belum ada pengguna.

| Perintah | Fungsi |
| :--- | :--- |
| `npm run db:migrate` | Jalankan migration yang belum dijalankan (umzug, tabel `SequelizeMeta`) |
| `npm run db:rollback` | Batalkan migration terakhir |
| `npm run db:status` | Lihat migration terpasang/tertunda |
| `npm run db:seed` | Isi data awal (idempoten: aman dijalankan berulang) |
| `npm run db:reset` | Kosongkan semua tabel lalu seed ulang |
| `npm run db:fresh` | Hapus skema, migrate dari nol, lalu seed |

Seeder membuat data master (akun, kategori, merek, produk bertingkat satuan, supplier, mandor, cabang, aturan grosir, konten bantuan) dan data demo transaksi 24 hari terakhir (pembelian, penjualan, mutasi stok, cicilan piutang, biaya) yang konsisten: stok = jumlah mutasi, piutang = saldo awal + nota − cicilan.

### 3. Frontend
```bash
cd client
npm install
npm run dev                # http://localhost:3000 (proxy /api -> :5000)
```

### 4. Docker penuh
`docker compose up --build` → web, API (host `3500`) dan Postgres (host `1000`).

### 5. Impor CSV
Tombol *Import Excel* (Master Data → Produk dan Data Supplier) membaca file `.csv` (pemisah `,` atau `;`) dan menyimpan baris ke database lewat API.
- Produk: `sku, nama, satuan, kategori, merek, stok_min, stok_awal, harga_beli, harga_jual, lokasi`
- Supplier: `nama, kategori, kontak, telepon, email, alamat, termin`

### 6. Kontrak API
`docs/API_CONTRACT.md` (amplop respons, peran, semua endpoint + contoh respons nyata) dan `docs/openapi.yaml`.

---

## 🧮 Aturan Hitungan Uang (server = sumber kebenaran)

- Semua nominal dibulatkan ke Rupiah utuh (setengah ke atas). Urutan: `subtotal → diskon → PPN → total`.
- **PPN** diatur di *Pengaturan → Preferensi Sistem* (hanya Bos/Admin). Bawaan: **tanpa PPN**. Jika aktif (11%), PPN dikenakan pada `subtotal − diskon`.
- Total selalu `dibayar + kasbon`. Kelebihan hanya boleh dari **tunai** dan menjadi **kembalian**; transfer/QRIS/kartu harus pas.
- Layar kasir mengirim `expectedTotal`; server menolak (409) jika berbeda dengan hitungannya sendiri.
- Kunci `idempotencyKey` mencegah transaksi ganda saat tombol ditekan berulang / jaringan lambat.
- Rumus identik ada di `server/src/utils/money.js` dan `client/src/utils/calc.js`; test `money_parity` menjaga keduanya tetap sama.
- Harga grosir bertingkat dihitung server saat checkout; keranjang menghitung dengan fungsi yang sama dan kasir dapat mematikannya (`useWholesale:false`).

## 🖨️ Cetak

Struk thermal **80mm** dan Faktur Surat Jalan **A5** dibuat dari data transaksi server dan Pengaturan Nota (logo, header, footer).
Gunakan *Cetak / Simpan PDF*; ukuran kertas diatur otomatis dan header/footer browser tidak ikut tercetak.

## 🔑 Akun Default untuk Pengujian

Akun berikut dibuat oleh seeder (ganti sandinya lewat *Pengaturan → Keamanan* sebelum dipakai sungguhan):

| Peran | Username | Password | Deskripsi Akses |
| :--- | :--- | :--- | :--- |
| **Bos / Owner** | `admin` | `admin123` | Akses penuh, master produk, & laporan omset/piutang |
| **Kasir Depan** | `kasir` | `kasir123` | Layar kasir penjualan, terima cicilan bon, & cetak nota |
| **Staf Gudang** | `gudang` | `gudang123` | Penerimaan barang masuk truk supplier & opname fisik |

---

## 🧪 Menjalankan Automated Tests (Jest & Supertest)

Backend dilengkapi test suite otomatis (hitungan uang, stok multi-satuan, pembelian/HPP, grosir, laporan, hak akses, kontrak endpoint):

```bash
cd server
npm test
```
