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
- **Testing**: Jest, Supertest (9 Automated Integration Tests).
- **Database Routing**: Smart Fallback (*Otomatis mendeteksi `NEON_DATABASE_URL`; jika tidak ada, otomatis fallback ke PostgreSQL lokal `localhost:5432`*).

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Prasyarat
- Node.js v18+ (direkomendasikan v20+)
- PostgreSQL lokal aktif di `localhost:5432` (user: `postgres`, password: `admin`) atau URL Neon PostgreSQL.

### 2. Setup Backend & Seed Database
```bash
# Masuk ke folder server
cd server

# Install dependensi (jika belum)
npm install

# Isi database dengan data bawaan material bangunan nyata Indonesia & 3 akun default
npm run seed

# Jalankan server API (port 5000)
npm run dev
```

### 3. Setup Frontend
Buka terminal baru:
```bash
# Masuk ke folder client
cd client

# Install dependensi (jika belum)
npm install

# Jalankan aplikasi web kasir (port 3000)
npm run dev
```
Buka browser di: **`http://localhost:3000`**

---

## 🔑 Akun Default untuk Pengujian

Aplikasi dilengkapi tombol **1-Click Quick Demo Login** di halaman masuk:

| Peran | Username | Password | Deskripsi Akses |
| :--- | :--- | :--- | :--- |
| **Bos / Owner** | `admin` | `admin123` | Akses penuh, master produk, & laporan omset/piutang |
| **Kasir Depan** | `kasir` | `kasir123` | Layar kasir penjualan, terima cicilan bon, & cetak nota |
| **Staf Gudang** | `gudang` | `gudang123` | Penerimaan barang masuk truk supplier & opname fisik |

---

## 🧪 Menjalankan Automated Tests (Jest & Supertest)

Backend dilengkapi test suite otomatis untuk memverifikasi keakuratan potongan stok satuan dasar, pencegahan stok minus, validasi batas plafon kasbon, dan autentikasi JWT:

```bash
cd server
npm test
```

Hasil test:
```text
PASS __tests__/pos_checkout.test.js
  POS Checkout & Konversi Multi-Satuan Test
    √ Harus berhasil mengambil katalog produk dengan informasi satuan bertingkat
    √ Harus memotong stok satuan dasar (Base Unit) secara tepat saat kasir menjual satuan tingkat atas (Sak)
    √ Harus menolak transaksi jika kuantitas barang melebihi sisa stok riil
    √ Harus menolak transaksi Kasbon jika melebihi plafon batas kredit mandor
    √ Harus sukses mencatat pembayaran cicilan kasbon dan mengurangi saldo hutang mandor

PASS __tests__/auth.test.js
  Auth Endpoints (Otentikasi Pengguna POS)
    √ Harus sukses login dengan kredensial yang benar
    √ Harus menolak login dengan password yang salah
    √ Harus mengembalikan data profil pengguna saat menyertakan token JWT valid
    √ Harus menolak akses /me jika tidak menyertakan token

Test Suites: 2 passed, 2 total
Tests:       9 passed, 9 total
```
