# Audit API dan frontend — 1 November 2026

Sumber audit: commit awal `4dbe8f7e6ca146d19a97b211f98fbca3b664839a` pada branch `main`.

## Perbaikan

- OpenAPI 3.0.3 + Swagger UI, mencakup 40 operasi API dan alias server `/api`.
- Semua akses data bisnis memerlukan JWT; pembuatan/manajemen akun, perubahan pengaturan, dan laporan ringkasan dibatasi admin.
- Validasi UUID, angka, diskon, bentuk keranjang dan parameter limit; malformed input menjadi 400, bukan 500.
- Checkout mengunci produk dengan urutan konsisten dan menghitung kebutuhan stok kumulatif antarbaris/satuan. Pembayaran harus tepat total nota; metode yang tidak didukung ditolak.
- Pengeluaran stok tidak lagi dipotong paksa ke nol. Satuan produk lain ditolak. Barang masuk beberapa material disimpan atomik, bukan hanya baris pertama.
- Cicilan memperbarui saldo pelanggan dan nota terkait; alokasi ke nota pelanggan lain ditolak.
- Harga/total/diskon di POS, pembayaran, API dan struk disamakan. PPN implisit yang tidak disimpan API dihapus. Pilihan kartu yang tidak didukung diganti QRIS.
- Kedaluwarsa sesi menghapus state autentikasi, keranjang dan cache akun. Build frontend terpisah mendukung `VITE_API_URL`.
- Manajemen akun dan perubahan password pada Pengaturan menggunakan akun database sebenarnya, bukan JSON dekoratif.
- Laporan keuangan menggunakan data API; angka contoh dan penggantian nilai nol dengan angka demo dihapus. Kartu stok, pelanggan dan supplier tidak lagi menggunakan fallback angka demo.
- Filter kategori inventaris menggunakan UUID. Notifikasi mutasi keluar/transfer menunggu API berhasil.
- GET supplier kosong tidak lagi otomatis membuat data demo. Kode supplier otomatis menggunakan UUID untuk menghindari bentrok setelah penghapusan.

## Verifikasi

| Pemeriksaan | Hasil |
| --- | --- |
| API integration/regression | 102 pengujian lulus, 5 suite |
| Inventaris route vs OpenAPI | Seluruh 40 operasi runtime tercakup |
| Validasi spesifikasi OpenAPI | Lulus swagger-cli |
| Frontend production build | Lulus; masih ada peringatan ukuran bundle |
| Frontend lint | Lulus |
| Browser smoke | Login admin, checkout nyata dan struk, 9 halaman, tab laporan, viewport mobile, sesi kedaluwarsa |

API dan browser diuji terhadap **PGlite PostgreSQL embedded melalui protokol PostgreSQL**, dalam database disposable. Ini memverifikasi query, persistence, transaksi/rollback, dan integrasi HTTP. Pengujian tersebut **bukan** verifikasi deployment Neon/Render atau bukti perilaku locking pada beban konkuren PostgreSQL server. Workflow GitHub Actions ditambahkan dengan PostgreSQL 17 asli untuk menjalankan ulang suite dan browser test; hasil workflow belum tersedia saat audit lokal selesai.

## Batas fitur yang masih perlu implementasi

1. Pembelian ke supplier, biaya operasional, arus kas lengkap, HPP historis dan laporan laba rugi belum memiliki backend. Tampilan laporan sekarang menjelaskan keterbatasan ini.
2. Ringkasan PO/surat jalan/opname di inventaris masih state sesi; perubahan stok dan StockMovement sudah tersimpan, tetapi dokumen procurement/delivery beserta lifecycle-nya belum merupakan entitas persisten.
3. Daftar merek, referensi konversi umum dan aturan grosir pada Master Data masih referensi sesi. Harga POS belum menerapkan aturan grosir otomatis. Konversi nyata transaksi menggunakan ProductUnit per produk.
4. Impor CSV belum mengimpor ke database. Ekspor konfigurasi bukan backup database penuh. Status nonaktif pengguna belum didukung; pilihan tersebut tidak lagi dapat diedit.
5. Laporan penjualan menampilkan maksimal 1.000 transaksi terbaru; ringkasan seluruh periode. Filter tanggal dan paginasi laporan lengkap belum tersedia.
6. Belum dilakukan uji beban, race condition pada PostgreSQL server asli, semua kombinasi perangkat, atau uji end-to-end setiap modal/form. Smoke test bukan jaminan seluruh workflow produksi bebas bug.

Perubahan disiapkan pada branch terpisah untuk review. Tidak ada perubahan pada data produksi atau penggabungan otomatis ke main.
