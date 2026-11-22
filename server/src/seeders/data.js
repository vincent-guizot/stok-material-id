// Data master & demo untuk seeder. Semua berasal dari sini, tidak ada data dummy di client.
  export const PRODUCTS = [
    {
      sku: "SMN-GRS-50",
      name: "Semen Gresik 50 Kg",
      category: "Semen & Mortar",
      baseUnit: "Kg",
      minStock: 500,
      openingStock: 5000, // 5.000 Kg = 100 Sak @ 50kg
      units: [
        {
          unitName: "Kg",
          conversionFactor: 1,
          buyPrice: 1200,
          sellPrice: 1500,
          level: 1,
          isBase: true,
        },
        {
          unitName: "Sak 40kg",
          conversionFactor: 40,
          buyPrice: 46000,
          sellPrice: 52000,
          level: 2,
          isBase: false,
        },
        {
          unitName: "Sak 50kg",
          conversionFactor: 50,
          buyPrice: 57000,
          sellPrice: 64000,
          level: 3,
          isBase: false,
        },
      ],
    },
    {
      sku: "SMN-TGR-50",
      name: "Semen Tiga Roda 50 Kg",
      category: "Semen & Mortar",
      baseUnit: "Kg",
      minStock: 500,
      openingStock: 4000, // 4.000 Kg = 80 Sak @ 50kg
      units: [
        {
          unitName: "Kg",
          conversionFactor: 1,
          buyPrice: 1250,
          sellPrice: 1600,
          level: 1,
          isBase: true,
        },
        {
          unitName: "Sak 40kg",
          conversionFactor: 40,
          buyPrice: 48000,
          sellPrice: 54000,
          level: 2,
          isBase: false,
        },
        {
          unitName: "Sak 50kg",
          conversionFactor: 50,
          buyPrice: 59000,
          sellPrice: 66000,
          level: 3,
          isBase: false,
        },
      ],
    },
    {
      sku: "BTA-HBL-75",
      name: "Bata Ringan Hebel 7.5cm",
      category: "Bata & Hebel",
      baseUnit: "Pcs",
      minStock: 100,
      openingStock: 830, // 830 Pcs = 10 m3
      units: [
        {
          unitName: "Pcs",
          conversionFactor: 1,
          buyPrice: 8000,
          sellPrice: 9500,
          level: 1,
          isBase: true,
        },
        {
          unitName: "m3 (Isi 83 Pcs)",
          conversionFactor: 83,
          buyPrice: 600000,
          sellPrice: 680000,
          level: 2,
          isBase: false,
        },
      ],
    },
    {
      sku: "BSI-BTN-08",
      name: "Besi Beton Polos 8mm SNI",
      category: "Besi & Baja Ringan",
      baseUnit: "Meter",
      minStock: 120,
      openingStock: 1200, // 1.200 Meter = 100 Lonjor 12m
      units: [
        {
          unitName: "Meter",
          conversionFactor: 1,
          buyPrice: 4200,
          sellPrice: 5500,
          level: 1,
          isBase: true,
        },
        {
          unitName: "Batang 6m",
          conversionFactor: 6,
          buyPrice: 24000,
          sellPrice: 30000,
          level: 2,
          isBase: false,
        },
        {
          unitName: "Lonjor 12m",
          conversionFactor: 12,
          buyPrice: 46000,
          sellPrice: 58000,
          level: 3,
          isBase: false,
        },
      ],
    },
    {
      sku: "BSI-ULR-10",
      name: "Besi Beton Ulir 10mm SNI",
      category: "Besi & Baja Ringan",
      baseUnit: "Meter",
      minStock: 120,
      openingStock: 1200,
      units: [
        {
          unitName: "Meter",
          conversionFactor: 1,
          buyPrice: 7000,
          sellPrice: 9000,
          level: 1,
          isBase: true,
        },
        {
          unitName: "Batang 6m",
          conversionFactor: 6,
          buyPrice: 40000,
          sellPrice: 50000,
          level: 2,
          isBase: false,
        },
        {
          unitName: "Lonjor 12m",
          conversionFactor: 12,
          buyPrice: 78000,
          sellPrice: 96000,
          level: 3,
          isBase: false,
        },
      ],
    },
    {
      sku: "CAT-DLX-WHT",
      name: "Cat Tembok Dulux Catylac Putih",
      category: "Cat & Pelapis",
      baseUnit: "Kaleng 1kg",
      minStock: 10,
      openingStock: 120,
      units: [
        {
          unitName: "Kaleng 1kg",
          conversionFactor: 1,
          buyPrice: 30000,
          sellPrice: 38000,
          level: 1,
          isBase: true,
        },
        {
          unitName: "Galon 5kg",
          conversionFactor: 5,
          buyPrice: 135000,
          sellPrice: 165000,
          level: 2,
          isBase: false,
        },
        {
          unitName: "Pail 20kg",
          conversionFactor: 20,
          buyPrice: 510000,
          sellPrice: 610000,
          level: 3,
          isBase: false,
        },
      ],
    },
    {
      sku: "PPA-WVN-34",
      name: "Pipa PVC Wavin AW 3/4 inch",
      category: "Pipa & Sanitasi",
      baseUnit: "Meter",
      minStock: 20,
      openingStock: 200, // 200m = 50 Batang 4m
      units: [
        {
          unitName: "Meter",
          conversionFactor: 1,
          buyPrice: 8000,
          sellPrice: 11000,
          level: 1,
          isBase: true,
        },
        {
          unitName: "Batang 4m",
          conversionFactor: 4,
          buyPrice: 30000,
          sellPrice: 40000,
          level: 2,
          isBase: false,
        },
      ],
    },
    {
      sku: "PKU-KYU-MIX",
      name: "Paku Kayu Campur (5cm - 7cm)",
      category: "Paku & Perlengkapan",
      baseUnit: "Kg",
      minStock: 15,
      openingStock: 100, // 100 Kg = 5 Dus 20kg
      units: [
        {
          unitName: "Kg",
          conversionFactor: 1,
          buyPrice: 16000,
          sellPrice: 20000,
          level: 1,
          isBase: true,
        },
        {
          unitName: "Dus 20kg",
          conversionFactor: 20,
          buyPrice: 290000,
          sellPrice: 360000,
          level: 2,
          isBase: false,
        },
      ],
    },
    {
      sku: "KRM-PLN-40",
      name: "Keramik Lantai Polos 40x40 Putih",
      category: "Keramik & Lantai",
      baseUnit: "Keping",
      minStock: 30,
      openingStock: 360, // 360 Keping = 60 Dus (1 m2 = 6 keping)
      units: [
        {
          unitName: "Keping",
          conversionFactor: 1,
          buyPrice: 8500,
          sellPrice: 11000,
          level: 1,
          isBase: true,
        },
        {
          unitName: "Dus (1 m2 / 6 kpg)",
          conversionFactor: 6,
          buyPrice: 48000,
          sellPrice: 60000,
          level: 2,
          isBase: false,
        },
      ],
    },
  ];

export const SUPPLIERS = [
  {
    code: 'SI-001',
    name: 'PT Semen Indonesia (Persero) Tbk',
    category: 'Semen & Mortar',
    contactPerson: 'Bpk. Bambang Wijaya',
    phone: '031-3981732',
    email: 'sales.gresik@sig.id',
    address: 'Gedung Utama SIG, Jl. Veteran, Gresik 61122',
    paymentTerms: 'Tempo 30 Hari',
    status: 'Aktif',
  },
  {
    code: 'SI-002',
    name: 'Toko Besi Jaya Abadi Steel',
    category: 'Besi & Baja',
    contactPerson: 'Ko Hendra',
    phone: '0812-3456-7890',
    email: 'jayasteel.sby@gmail.com',
    address: 'Kawasan Industri Margomulyo Permai Blok D-14, Surabaya',
    paymentTerms: 'Tempo 14 Hari',
    status: 'Aktif',
  },
  {
    code: 'SI-003',
    name: 'CV Sumber Bangunan Hebel',
    category: 'Bata & Hebel',
    contactPerson: 'Ibu Ratna',
    phone: '0813-9876-5432',
    email: 'sumberbangunan.hebel@yahoo.com',
    address: 'Jl. Raya Krian KM 28, Sidoarjo',
    paymentTerms: 'Tempo 7 Hari',
    status: 'Aktif',
  },
  {
    code: 'SI-004',
    name: 'Distributor Cat Maju Jaya Paint',
    category: 'Cat & Pelapis',
    contactPerson: 'Bpk. Agus Santoso',
    phone: '0821-4455-6677',
    email: 'aguscatsby@duluxdealer.co.id',
    address: 'Ruko Surya Inti Permata Blok C-8, Jl. Jemur Andayani, Surabaya',
    paymentTerms: 'Tempo 30 Hari',
    status: 'Aktif',
  },
  {
    code: 'SI-005',
    name: 'PT Rucika Mas Pipa Indonesia',
    category: 'Pipa & Sanitasi',
    contactPerson: 'Ibu Linda Susanti',
    phone: '021-8983-2000',
    email: 'order@rucika.co.id',
    address: 'Kawasan Industri MM2100 Blok C-3, Cikarang Barat',
    paymentTerms: 'Tempo 45 Hari',
    status: 'Aktif',
  },
];


export const USERS = [
  { name: 'Vincent G (Owner)', username: 'admin', password: 'admin123', role: 'admin' },
  { name: 'Nova Philly (Kasir 1)', username: 'kasir', password: 'kasir123', role: 'cashier' },
  { name: 'Novo Phillia (Staf Gudang)', username: 'gudang', password: 'gudang123', role: 'warehouse' },
];

export const CATEGORIES = [
  { name: 'Semen & Mortar', icon: '🧱' }, { name: 'Bata & Hebel', icon: '🏗️' }, { name: 'Besi & Baja Ringan', icon: '⛓️' },
  { name: 'Cat & Pelapis', icon: '🪣' }, { name: 'Pipa & Sanitasi', icon: '🚰' }, { name: 'Paku & Perlengkapan', icon: '🔨' },
  { name: 'Keramik & Lantai', icon: '🏛️' }, { name: 'Kayu & Triplek', icon: '🪵' }, { name: 'Atap & Plafon', icon: '🏠' },
  { name: 'Listrik & Elektrikal', icon: '💡' },
];

export const BRANDS = [
  { name: 'Semen Gresik', origin: 'Indonesia' }, { name: 'Tiga Roda', origin: 'Indonesia' }, { name: 'Citicon', origin: 'Indonesia' },
  { name: 'Master Steel', origin: 'Indonesia' }, { name: 'Dulux', origin: 'Inggris' }, { name: 'Wavin', origin: 'Belanda' },
  { name: 'Roman', origin: 'Indonesia' }, { name: 'Lokal', origin: 'Indonesia' },
];

// sku -> merek & lokasi rak gudang
export const PRODUCT_META = {
  'SMN-GRS-50': { brand: 'Semen Gresik', location: 'Gudang Utama - Rak A1' },
  'SMN-TGR-50': { brand: 'Tiga Roda', location: 'Gudang Utama - Rak A2' },
  'BTA-HBL-75': { brand: 'Citicon', location: 'Gudang Utama - Rak B1' },
  'BSI-BTN-08': { brand: 'Master Steel', location: 'Gudang Utama - Rak C1' },
  'BSI-ULR-10': { brand: 'Master Steel', location: 'Gudang Utama - Rak C2' },
  'CAT-DLX-WHT': { brand: 'Dulux', location: 'Gudang Utama - Rak D1' },
  'PPA-WVN-34': { brand: 'Wavin', location: 'Gudang Utama - Rak E1' },
  'PKU-KYU-MIX': { brand: 'Lokal', location: 'Gudang Utama - Rak F1' },
  'KRM-PLN-40': { brand: 'Roman', location: 'Gudang Utama - Rak G1' },
};

// Pemasok utama tiap produk (kode supplier)
export const PRODUCT_SUPPLIER = {
  'SMN-GRS-50': 'SI-001', 'SMN-TGR-50': 'SI-001', 'BTA-HBL-75': 'SI-003', 'BSI-BTN-08': 'SI-002', 'BSI-ULR-10': 'SI-002',
  'CAT-DLX-WHT': 'SI-004', 'PPA-WVN-34': 'SI-005', 'PKU-KYU-MIX': 'SI-002', 'KRM-PLN-40': 'SI-003',
};

// saldoAwal = kasbon lama sebelum sistem dipakai (tanpa nota di sistem)
export const CUSTOMERS = [
  { name: 'Pak Bambang (Mandor Perumahan Graha)', phone: '081234567890', address: 'Jl. Melati Blok C-12, Graha Asri', creditLimit: 15000000, openingDebt: 0, termDays: 14 },
  { name: 'Pak Joko (Kontraktor Ruko Sentosa)', phone: '081987654321', address: 'Jl. Ahmad Yani No. 88, Pusat Niaga', creditLimit: 25000000, openingDebt: 2000000, termDays: 30 },
  { name: 'Pak Budi Tukang Harian', phone: '081345678901', address: 'Kampung Suka Maju RT 03/04', creditLimit: 5000000, openingDebt: 250000, termDays: 7 },
];

export const BRANCHES = [
  { name: 'Toko Sentosa - Pusat', address: 'Jl. Raya Gresik No. 123, Gresik, Jawa Timur 61111', type: 'Toko & Gudang', status: 'Aktif', isMain: true },
  { name: 'Gudang Cadangan Driyorejo', address: 'Jl. Raya Driyorejo KM 5, Gresik', type: 'Gudang', status: 'Aktif', isMain: false },
  { name: 'Cabang Menganti (Persiapan)', address: 'Jl. Raya Menganti No. 40, Gresik', type: 'Toko', status: 'Dalam Persiapan', isMain: false },
];

// Harga grosir bertingkat: unit = nama satuan, price harus di bawah harga normal satuan itu
export const WHOLESALE = [
  { sku: 'SMN-GRS-50', unit: 'Sak 50kg', label: 'Grosir 20 sak+', minQty: 20, price: 61000, target: 'Semua' },
  { sku: 'SMN-TGR-50', unit: 'Sak 50kg', label: 'Grosir 20 sak+', minQty: 20, price: 63000, target: 'Semua' },
  { sku: 'BSI-BTN-08', unit: 'Lonjor 12m', label: 'Proyek 20 lonjor+', minQty: 20, price: 55000, target: 'Mandor' },
  { sku: 'BSI-ULR-10', unit: 'Lonjor 12m', label: 'Proyek 20 lonjor+', minQty: 20, price: 92000, target: 'Mandor' },
  { sku: 'CAT-DLX-WHT', unit: 'Pail 20kg', label: 'Grosir 5 pail+', minQty: 5, price: 580000, target: 'Semua' },
  { sku: 'KRM-PLN-40', unit: 'Dus (1 m2 / 6 kpg)', label: 'Grosir 30 dus+', minQty: 30, price: 56000, target: 'Semua' },
];

export const EXPENSES = [
  { daysAgo: 19, category: 'Gaji & Upah', description: 'Gaji karyawan toko', amount: 2000000, paymentMethod: 'TRANSFER' },
  { daysAgo: 17, category: 'Listrik & Air', description: 'Tagihan listrik & air bulan berjalan', amount: 750000, paymentMethod: 'TRANSFER' },
  { daysAgo: 12, category: 'Transport & BBM', description: 'BBM mobil pengantar barang', amount: 600000, paymentMethod: 'CASH' },
  { daysAgo: 8, category: 'Perawatan', description: 'Servis troli & timbangan gudang', amount: 350000, paymentMethod: 'CASH' },
  { daysAgo: 5, category: 'Perlengkapan', description: 'Kertas struk, plastik, dan alat tulis', amount: 275000, paymentMethod: 'CASH' },
  { daysAgo: 2, category: 'Transport & BBM', description: 'Ongkos kirim material ke proyek', amount: 450000, paymentMethod: 'CASH' },
];

export const HELP = [
  // guide: title, body = ringkasan, extra = langkah-langkah dipisah baris baru (di body setelah baris kosong)
  { kind: 'guide', title: 'Mulai Menggunakan StokMaterial.id', extra: '🧱', body: 'Pengenalan fitur utama dan pengaturan awal sistem toko bangunan.\n\nLengkapi identitas toko di Pengaturan > Toko.\nTambahkan kategori, merek, dan produk di Data Master.\nCatat stok awal lewat Barang Masuk atau Penyesuaian Stok.\nTambahkan mandor langganan di Data Master > Pelanggan.\nMulai berjualan dari menu Kasir (F1).' },
  { kind: 'guide', title: 'Kelola Data Barang', extra: '📦', body: 'Cara menambah barang, mengatur harga, stok, dan satuan bertingkat.\n\nBuka Data Master > Data Produk lalu klik Tambah Produk.\nIsi nama, SKU, kategori, satuan dasar, dan harga beli/jual.\nTambahkan satuan lain (sak, dus, lonjor) di Konversi Satuan beserta isinya.\nAtur harga grosir di tab Harga Grosir bila diperlukan.' },
  { kind: 'guide', title: 'Transaksi Penjualan', extra: '🛒', body: 'Langkah melakukan penjualan cepat di kasir dan cetak nota belanja.\n\nBuka Kasir (F1) dan pilih barang serta satuannya.\nAtur jumlah; harga grosir terpasang otomatis bila memenuhi syarat.\nTekan F10 untuk pembayaran, pilih metode tunai, transfer, QRIS, atau kasbon.\nSelesaikan transaksi lalu cetak nota atau faktur jalan.' },
  { kind: 'guide', title: 'Barang Masuk dari Supplier', extra: '🚚', body: 'Cara mencatat pembelian material dan penerimaan barang masuk (PO).\n\nBuka Inventori > Barang Masuk lalu klik Input Barang Masuk Baru.\nPilih supplier, tanggal, dan status pembayaran (lunas atau hutang).\nTambahkan material, jumlah, dan harga beli per satuan.\nSimpan: stok bertambah dan harga modal diperbarui otomatis.' },
  { kind: 'guide', title: 'Kasbon Mandor dan Piutang', extra: '👷', body: 'Kelola plafon kredit, pencatatan kasbon, dan cicilan mandor.\n\nAtur plafon kredit mandor di Data Master > Pelanggan.\nDi Kasir, pilih metode Kasbon lalu pilih mandor.\nCatat cicilan atau pelunasan di menu Piutang Mandor (F2).\nPantau tagihan jatuh tempo lewat notifikasi di bagian atas.' },
  { kind: 'guide', title: 'Laporan Keuangan', extra: '📊', body: 'Membaca penjualan, laba rugi, arus kas, dan kondisi stok.\n\nBuka Laporan (F4) lalu pilih rentang tanggal.\nGunakan tab Laba Rugi untuk melihat laba kotor dan laba bersih.\nCatat biaya operasional di tab Laba Rugi agar laba bersih akurat.\nGunakan tombol Export untuk mengunduh data ke CSV.' },

  { kind: 'video', title: 'Cara Melakukan Penjualan di Kasir', body: 'Panduan lengkap transaksi penjualan untuk pemula.', extra: '3:25' },
  { kind: 'video', title: 'Menambah Barang Baru & Multi Satuan', body: 'Cara input barang, harga, dan konversi sak ke kg.', extra: '4:10' },
  { kind: 'video', title: 'Mengelola Kasbon Mandor & Plafon', body: 'Pencatatan kasbon dan pembayaran piutang mandor.', extra: '5:22' },
  { kind: 'video', title: 'Mencetak Laporan Penjualan & Faktur', body: 'Cara membuat dan mengekspor laporan serta mencetak faktur.', extra: '4:38' },

  { kind: 'faq', title: 'Bagaimana cara menambah barang baru?', body: 'Buka menu Master Data > Data Produk, lalu klik tombol Tambah Produk. Isi nama material, SKU, satuan dasar, serta harga modal dan harga jual.' },
  { kind: 'faq', title: 'Cara melakukan penjualan dan mencetak nota?', body: 'Pilih barang di Kasir, lalu tekan F10 atau tombol Lanjut ke Pembayaran. Pilih metode bayar, masukkan nominal, dan selesaikan transaksi. Nota atau faktur jalan dapat dicetak setelahnya.' },
  { kind: 'faq', title: 'Bagaimana cara mencatat kasbon mandor?', body: 'Di halaman pembayaran pilih metode Kasbon lalu pilih mandor. Sistem memeriksa plafon kredit. Cicilan dicatat di menu Piutang Mandor.' },
  { kind: 'faq', title: 'Cara melihat laporan laba rugi?', body: 'Buka Laporan Keuangan lalu pilih tab Laba Rugi. Periode dapat diatur harian, mingguan, bulanan, atau tahunan.' },
  { kind: 'faq', title: 'Mengapa stok tidak bisa dikurangi di bawah nol?', body: 'Pengaturan Izinkan Stok Minus mengaturnya. Aktifkan di Pengaturan > Sistem bila ingin menjual walau stok kosong.' },
  { kind: 'faq', title: 'Bagaimana HPP dihitung?', body: 'HPP memakai harga beli terakhir dari pembelian terbaru dan dicatat pada setiap baris nota saat terjadi penjualan.' },

  { kind: 'shortcut', title: 'Kasir Penjualan (POS)', body: 'F1' },
  { kind: 'shortcut', title: 'Piutang Mandor', body: 'F2' },
  { kind: 'shortcut', title: 'Stok & Barang Masuk', body: 'F3' },
  { kind: 'shortcut', title: 'Laporan Keuangan', body: 'F4' },
  { kind: 'shortcut', title: 'Master Data', body: 'F5' },
  { kind: 'shortcut', title: 'Supplier', body: 'F6' },
  { kind: 'shortcut', title: 'Pengaturan', body: 'F7' },
  { kind: 'shortcut', title: 'Pusat Bantuan', body: 'F8' },
  { kind: 'shortcut', title: 'Pembayaran / selesaikan transaksi', body: 'F10' },
  { kind: 'shortcut', title: 'Fokus pencarian global', body: 'Ctrl + K' },
  { kind: 'shortcut', title: 'Tutup panel / kembali', body: 'Esc' },

  { kind: 'contact', title: 'WhatsApp', body: '0812-3456-7890', extra: 'whatsapp' },
  { kind: 'contact', title: 'Email', body: 'support@stokmaterial.id', extra: 'email' },
  { kind: 'contact', title: 'Telepon', body: '031-1234567', extra: 'phone' },
  { kind: 'contact', title: 'Jam Layanan', body: 'Senin - Sabtu, 08.00 - 17.00 WIB', extra: 'hours' },

  { kind: 'about', title: 'Versi Aplikasi', body: '1.0.0' },
  { kind: 'about', title: 'Basis Data', body: 'PostgreSQL' },
  { kind: 'about', title: 'Lisensi', body: 'Lisensi toko tunggal (self-hosted)' },
];
