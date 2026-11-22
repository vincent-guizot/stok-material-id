# Kontrak Respons API — StokMaterial.id

Base URL: `http://localhost:5000/api/v1` (Vite dev meneruskan `/api` ke sini; Docker: `http://localhost:3500/api/v1`).

## 1. Amplop respons

Semua endpoint mengembalikan JSON dengan bentuk tetap:

```json
{ "success": true,  "message": "opsional", "data": <objek | array>, "meta": { } }
{ "success": false, "message": "Pesan galat dalam bahasa Indonesia" }
```

- `success` selalu ada (boolean). `data` ada saat sukses. `meta` hanya untuk data berhalaman/agregat.
- Nilai uang berupa angka Rupiah bulat (dibulatkan half-up); kuantitas stok dalam satuan dasar kecuali dinyatakan lain.
- Tanggal ISO-8601; kolom tanggal saja `YYYY-MM-DD` (zona Asia/Jakarta).

## 2. Autentikasi & peran

`Authorization: Bearer <JWT>` (diperoleh dari `POST /auth/login`). Peran: `admin`, `cashier`, `warehouse`. Pengguna nonaktif ditolak.

## 3. Kode status

| Kode | Arti |
|---|---|
| 200/201 | Sukses |
| 400 | Validasi gagal / stok tidak cukup / aturan bisnis dilanggar |
| 401 | Token tidak ada/tidak valid, atau login salah |
| 403 | Peran tidak diizinkan |
| 404 | Data tidak ditemukan |
| 409 | Konflik (mis. PO sudah lunas, SKU/kode ganda) |
| 500 | Galat server |

## 4. Daftar endpoint

`*` = wajib. Semua path di bawah `/api/v1`.

| Metode | Path | Akses | Fungsi | Request |
|---|---|---|---|---|
| POST | `/auth/login` | publik | Login; mengembalikan JWT | body: username*, password* |
| POST | `/auth/register` | admin | Buat akun (juga lewat /users) | body: name*, username*, password*(min 6), role(admin/cashier/warehouse) |
| GET | `/auth/me` | semua peran (login) | Profil pengguna aktif | — |
| PUT | `/auth/password` | semua peran (login) | Ganti kata sandi sendiri | body: currentPassword*, newPassword*(min 6, ≠ lama) |
| GET | `/settings` | publik | Pengaturan toko (nama, pajak, struk, allowMinusStock, logoUrl, dst.) | — |
| PUT | `/settings` | admin | Ubah pengaturan (POST setara) | body: field pengaturan; perubahan pajak ditolak bila sudah ada transaksi (guardTaxChange) |
| GET | `/categories` | publik | Daftar kategori | — |
| POST | `/categories` | admin | Tambah kategori | body: name*, icon |
| GET | `/brands` | semua peran (login) | Daftar merek | — |
| POST | `/brands` | admin | Tambah merek | body: name* |
| PUT | `/brands/:id` | admin | Ubah merek | body: name |
| DELETE | `/brands/:id` | admin | Hapus merek | — |
| GET | `/products` | semua peran (login) | Daftar produk + satuan + tier grosir + stok | query: search, categoryId, activeOnly |
| GET | `/products/:id` | semua peran (login) | Detail produk | — |
| POST | `/products` | admin | Tambah produk | body: sku*, name*, categoryId, brandId, baseUnit*, minStock, initialStock, location, units[]* |
| PUT | `/products/:id` | admin | Ubah produk | body: seperti POST + buyPrice, sellPrice, currentStockBase |
| DELETE | `/products/:id` | admin | Hapus/nonaktifkan produk | — |
| GET | `/customers` | semua peran (login) | Daftar mandor/pelanggan + sisa hutang | — |
| GET | `/customers/:id` | semua peran (login) | Detail pelanggan | — |
| POST | `/customers` | semua peran (login) | Tambah pelanggan | body: name*, phone, address, creditLimit, termDays |
| PUT | `/customers/:id` | semua peran (login) | Ubah pelanggan | body: sama seperti POST |
| DELETE | `/customers/:id` | admin | Hapus pelanggan | — |
| GET | `/suppliers` | semua peran (login) | Daftar supplier + purchaseCount/purchaseTotal/unpaidTotal/lastPurchaseDate | — |
| GET | `/suppliers/:id` | semua peran (login) | Detail supplier | — |
| POST | `/suppliers` | admin | Tambah supplier (kode otomatis bila kosong) | body: name*, code, category, contactPerson, phone, email, address, paymentTerms, status |
| PUT | `/suppliers/:id` | admin | Ubah supplier | body: sama seperti POST |
| DELETE | `/suppliers/:id` | admin | Hapus supplier | — |
| POST | `/transactions` | semua peran (login) | Checkout kasir (alias /transactions/checkout) | body: items[{productId,unitId,qty}]*, customerId, discount, discountPercent, paymentMethod(default CASH), payments[], dueDate, notes, expectedTotal, idempotencyKey, useWholesale(default true; false = harga normal) |
| GET | `/transactions` | semua peran (login) | Daftar transaksi | query: limit, status, customerId |
| GET | `/transactions/:id` | semua peran (login) | Detail nota + item | — |
| POST | `/debts/pay` | semua peran (login) | Bayar piutang mandor | body: customerId*, amount*, paymentMethod, transactionId, notes |
| GET | `/debts/history` | semua peran (login) | Riwayat pembayaran piutang | query: customerId |
| GET | `/debts/summary` | semua peran (login) | Ringkasan piutang per mandor | — |
| POST | `/stocks/in` | semua peran (login) | Barang masuk manual | body: productId*, unitId*, qty*, notes |
| POST | `/stocks/out` | semua peran (login) | Barang keluar | body: productId*, unitId*, qty*, destination, receiver, driver, notes |
| POST | `/stocks/transfer` | semua peran (login) | Mutasi lokasi | body: productId*, unitId*, qty*, fromLocation, toLocation, notes |
| POST | `/stocks/adjust` | admin | Penyesuaian stok | body: productId*, actualBaseQty*, reason* |
| POST | `/stocks/opname` | admin | Opname stok | body: items[{productId,actualBaseQty}]*, notes |
| GET | `/stocks/movements` | semua peran (login) | Riwayat mutasi stok | query: productId, type, from, to |
| GET | `/purchases` | semua peran (login) | Daftar pembelian (PO) | query: supplierId, from, to, paymentStatus |
| GET | `/purchases/:id` | semua peran (login) | Detail PO | — |
| POST | `/purchases` | admin, warehouse | Terima barang dari supplier; menambah stok & memperbarui HPP | body: supplierId*, items[{productId,unitId,qty,unitCost}]*, paid(default true; false = hutang, jatuh tempo mengikuti termin supplier), purchaseDate, notes |
| POST | `/purchases/:id/pay` | admin | Lunasi PO (409 bila sudah lunas) | — |
| GET | `/expenses` | semua peran (login) | Daftar biaya operasional | query: from, to, category |
| POST | `/expenses` | semua peran (login) | Catat biaya | body: category*, amount*, date, description, paymentMethod(default CASH) |
| DELETE | `/expenses/:id` | semua peran (login) | Hapus biaya | — |
| GET | `/wholesale` | semua peran (login) | Aturan harga grosir | — |
| POST | `/wholesale` | admin | Buat aturan grosir | body: unitId*, minQty*(>0), price*(< harga normal), label, target(semua/mandor), isActive |
| PUT | `/wholesale/:id` | admin | Ubah aturan | body: sama seperti POST |
| DELETE | `/wholesale/:id` | admin | Hapus aturan | — |
| GET | `/branches` | semua peran (login) | Daftar cabang | — |
| POST | `/branches` | admin | Tambah cabang | body: name*, address, type, status |
| PUT | `/branches/:id` | admin | Ubah cabang | body: sama seperti POST |
| DELETE | `/branches/:id` | admin | Hapus cabang | — |
| GET | `/users` | admin | Daftar pengguna (tanpa hash sandi) | — |
| POST | `/users` | admin | Buat pengguna | body: name*, username*, password*, role |
| PUT | `/users/:id` | admin | Ubah pengguna | body: name, role, isActive, password |
| GET | `/help` | semua peran (login) | Konten Pusat Bantuan dikelompokkan per jenis (guide, video, faq, contact, shortcut, about) | — |
| GET | `/notifications` | semua peran (login) | Notifikasi terhitung otomatis (stok menipis, piutang jatuh tempo, PO jatuh tempo, pembelian baru) | — |
| GET | `/backup` | admin | Log backup | — |
| POST | `/backup` | admin | Ekspor backup JSON (tanpa hash sandi) + catat log | — |
| GET | `/reports/summary` | admin | Ringkasan dasbor | query: from, to |
| GET | `/reports/overview` | admin | Ringkasan laporan (total, harian, metode, kategori, top produk, piutang) | query: from, to |
| GET | `/reports/purchases` | admin | Laporan pembelian | query: from, to |
| GET | `/reports/profit-loss` | admin | Laba rugi (penjualan bersih tanpa PPN, HPP dari unitCost, biaya) | query: from, to |
| GET | `/reports/cash-flow` | admin | Arus kas | query: from, to |
| GET | `/reports/stock` | admin | Laporan stok & nilai persediaan | — |

## 5. Contoh respons nyata

Dihasilkan dari server berjalan dengan data seeder (array dipersingkat menjadi 1 elemen).

### `POST /auth/login`

```json
{
  "success": true,
  "message": "Selamat datang, Vincent G (Owner)!",
  "data": {
    "token": "<JWT>",
    "user": {
      "id": "38e01606-1830-4f56-85e9-8813abc314c0",
      "name": "Vincent G (Owner)",
      "username": "admin",
      "role": "admin"
    }
  }
}
```

### `GET /auth/me`

```json
{
  "success": true,
  "data": {
    "id": "38e01606-1830-4f56-85e9-8813abc314c0",
    "name": "Vincent G (Owner)",
    "username": "admin",
    "role": "admin",
    "isActive": true
  }
}
```

### `GET /settings`

```json
{
  "success": true,
  "data": {
    "id": "system_settings",
    "storeName": "Toko Sentosa",
    "storeAddress": "Jl. Raya Gresik No. 123, Gresik, Jawa Timur 61111",
    "storePhone": "031-1234567",
    "storeEmail": "tokosentosa@gmail.com",
    "logoUrl": null,
    "headerReceipt": "TOKO SENTOSA\nToko Bangunan & Material Konstruksi\nJl. Raya Gresik No. 123\nTelp. 031-1234567",
    "footerReceipt": "Terima kasih telah berbelanja\nBarang yang sudah dibeli tidak dapat ditukar/dikembalikan.",
    "showLogo": true,
    "showAddress": true,
    "showPhone": true,
    "showCashier": true,
    "showThanks": true,
    "autoPrint": false,
    "taxRate": "0.00",
    "lowStockAlert": "50",
    "emptyStockAlert": "0",
    "allowMinusStock": "no",
    "showHppCashier": "no",
    "branches": [
      {
        "id": 1,
        "name": "Depo Pusat Sentosa",
        "address": "Jl. Raya Gresik No. 123",
        "type": "Toko Utama & Gudang Pusat",
        "status": "Aktif"
      }
    ],
    "usersList": [
      {
        "id": 1,
        "name": "Vincent (Owner)",
        "username": "admin",
        "role": "Admin (Bos)",
        "status": "Aktif",
        "badge": "👑"
      }
    ],
    "createdAt": "2026-11-21T18:58:42.267Z",
    "updatedAt": "2026-11-21T18:58:42.267Z"
  }
}
```

### `GET /categories`

```json
{
  "success": true,
  "data": [
    {
      "id": "2b9a5004-355c-48d5-bdd8-5068bfe75bff",
      "name": "Atap & Plafon",
      "icon": "🏠",
      "createdAt": "2026-11-21T18:58:42.253Z",
      "updatedAt": "2026-11-21T18:58:42.253Z"
    }
  ]
}
```

### `GET /brands`

```json
{
  "success": true,
  "data": [
    {
      "id": "0140f4b3-db15-432d-bc79-2be5977b2d56",
      "name": "Citicon",
      "origin": "Indonesia",
      "productCount": 1,
      "mainCategory": "Bata & Hebel"
    }
  ]
}
```

### `GET /products?limit=1`

```json
{
  "success": true,
  "data": [
    {
      "id": "e9c019a2-2b43-4c43-b8ce-6df790127141",
      "sku": "BTA-HBL-75",
      "name": "Bata Ringan Hebel 7.5cm",
      "categoryId": "14b07ba6-0d97-4d1e-adf3-75a7d3e631e9",
      "brandId": "0140f4b3-db15-432d-bc79-2be5977b2d56",
      "location": "Gudang Utama - Rak B1",
      "baseUnit": "Pcs",
      "minStock": 100,
      "currentStockBase": 10,
      "isActive": true,
      "createdAt": "2026-11-21T18:58:42.283Z",
      "updatedAt": "2026-11-21T18:58:45.591Z",
      "category": {
        "id": "14b07ba6-0d97-4d1e-adf3-75a7d3e631e9",
        "name": "Bata & Hebel",
        "icon": "🏗️"
      },
      "brand": {
        "id": "0140f4b3-db15-432d-bc79-2be5977b2d56",
        "name": "Citicon"
      },
      "wholesale": [],
      "units": [
        {
          "id": "7520c698-1f41-4eab-aff8-7369e8492f9c",
          "productId": "e9c019a2-2b43-4c43-b8ce-6df790127141",
          "unitName": "Pcs",
          "conversionFactor": 1,
          "buyPrice": "7229.00",
          "sellPrice": "9500.00",
          "level": 1,
          "isBase": true,
          "createdAt": "2026-11-21T18:58:42.288Z",
          "updatedAt": "2026-11-21T18:58:42.473Z"
        }
      ],
      "humanReadableStock": "10 Pcs",
      "isLowStock": true
    }
  ]
}
```

### `GET /customers`

```json
{
  "success": true,
  "data": [
    {
      "id": "b9e74c17-10f0-471c-aee6-a4317cbd3722",
      "name": "Pak Bambang (Mandor Perumahan Graha)",
      "phone": "081234567890",
      "address": "Jl. Melati Blok C-12, Graha Asri",
      "creditLimit": "15000000.00",
      "currentDebt": "2963900.00",
      "termDays": 14,
      "isActive": true,
      "createdAt": "2026-11-21T18:58:42.280Z",
      "updatedAt": "2026-11-21T18:58:42.489Z",
      "remainingCredit": 12036100,
      "usagePercent": 20,
      "creditStatus": "HEALTHY"
    }
  ]
}
```

### `GET /suppliers`

```json
{
  "success": true,
  "data": [
    {
      "id": "48a80483-98a5-49b1-9b57-f1bebdab5f10",
      "code": "SI-001",
      "name": "PT Semen Indonesia (Persero) Tbk",
      "category": "Semen & Mortar",
      "contactPerson": "Bpk. Bambang Wijaya",
      "phone": "031-3981732",
      "email": "sales.gresik@sig.id",
      "address": "Gedung Utama SIG, Jl. Veteran, Gresik 61122",
      "paymentTerms": "Tempo 30 Hari",
      "status": "Aktif",
      "isActive": true,
      "createdAt": "2026-11-21T18:58:42.260Z",
      "updatedAt": "2026-11-21T18:58:42.260Z",
      "purchaseCount": 2,
      "purchaseTotal": 6957000,
      "unpaidTotal": 2907000,
      "lastPurchaseDate": "2026-11-18"
    }
  ]
}
```

### `GET /transactions?limit=2`

```json
{
  "success": true,
  "data": [
    {
      "id": "cdafcd17-b65f-4779-a9c9-7f82a9834bce",
      "invoiceNumber": "INV-20261122-0139",
      "customerId": null,
      "cashierId": "bbaf1b60-1623-41bf-abb4-919cffc8fb8b",
      "transactionDate": "2026-11-21T18:58:47.105Z",
      "subtotal": "32000.00",
      "discount": "0.00",
      "taxRate": "0.00",
      "taxAmount": "0.00",
      "totalAmount": "32000.00",
      "cashReceived": "32000.00",
      "changeAmount": "0.00",
      "idempotencyKey": null,
      "paidAmount": "32000.00",
      "debtAmount": "0.00",
      "paymentStatus": "PAID",
      "dueDate": null,
      "notes": null,
      "createdAt": "2026-11-21T18:58:47.106Z",
      "updatedAt": "2026-11-21T18:58:47.106Z",
      "customer": null,
      "cashier": {
        "id": "bbaf1b60-1623-41bf-abb4-919cffc8fb8b",
        "name": "Nova Philly (Kasir 1)"
      },
      "items": [
        {
          "id": "27f90424-411c-4a80-b8d5-839f30150076",
          "transactionId": "cdafcd17-b65f-4779-a9c9-7f82a9834bce",
          "productId": "f7feae08-499c-4f48-b554-cf182187f1c4",
          "unitId": "fa550ded-f8c3-40a1-bc1d-f1801b628bfb",
          "productName": "Semen Tiga Roda 50 Kg",
          "unitName": "Kg",
          "qty": 20,
          "conversionFactor": 1,
          "qtyBaseUnit": 20,
          "unitPrice": "1600.00",
          "unitCost": "1180.00",
          "subtotal": "32000.00",
          "createdAt": "2026-11-21T18:58:47.107Z",
          "updatedAt": "2026-11-21T18:58:47.107Z"
        }
      ],
      "payments": [
        {
          "id": "46b527ee-41bb-4004-a1ad-4f044ccda407",
          "transactionId": "cdafcd17-b65f-4779-a9c9-7f82a9834bce",
          "paymentMethod": "CASH",
          "amount": "32000.00",
          "referenceNo": null,
          "createdAt": "2026-11-21T18:58:47.110Z",
          "updatedAt": "2026-11-21T18:58:47.110Z"
        }
      ]
    }
  ]
}
```

### `GET /debts/summary`

```json
{
  "success": true,
  "data": {
    "totals": {
      "outstanding": 6783000,
      "overdue": 0,
      "overdueCustomers": 0,
      "overLimitCount": 0,
      "customerCount": 3,
      "paidThisMonthAmount": 4763000,
      "paidThisMonthCount": 3
    },
    "customers": {
      "b9e74c17-10f0-471c-aee6-a4317cbd3722": {
        "txCount": 15,
        "lastTransactionAt": "2026-11-20T02:29:00.000Z",
        "lastPaymentAt": "2026-11-13T07:00:00.000Z",
        "overdue": 0
      },
      "a4df056c-1a89-4b33-87bb-fe86d24dd517": {
        "txCount": 14,
        "lastTransactionAt": "2026-11-20T08:58:00.000Z",
        "lastPaymentAt": "2026-11-19T07:00:00.000Z",
        "overdue": 0
      },
      "d92ca62e-069b-4b6e-8ac9-83b8678916c6": {
        "txCount": 17,
        "lastTransactionAt": "2026-11-19T06:46:00.000Z",
        "lastPaymentAt": "2026-11-17T07:00:00.000Z",
        "overdue": 0
      }
    }
  }
}
```

### `GET /debts/history`

```json
{
  "success": true,
  "data": [
    {
      "id": "5e409d8d-494d-4cba-b2c8-ebe4428608ad",
      "customerId": "a4df056c-1a89-4b33-87bb-fe86d24dd517",
      "transactionId": null,
      "amount": "1119000.00",
      "paymentMethod": "TRANSFER",
      "paymentDate": "2026-11-19T07:00:00.000Z",
      "receivedBy": "38e01606-1830-4f56-85e9-8813abc314c0",
      "notes": "Pelunasan Kasbon Mandor Pak Joko (Kontraktor Ruko Sentosa)",
      "createdAt": "2026-11-19T07:00:00.000Z",
      "updatedAt": "2026-11-19T07:00:00.000Z",
      "customer": {
        "id": "a4df056c-1a89-4b33-87bb-fe86d24dd517",
        "name": "Pak Joko (Kontraktor Ruko Sentosa)",
        "phone": "081987654321"
      },
      "collector": {
        "id": "38e01606-1830-4f56-85e9-8813abc314c0",
        "name": "Vincent G (Owner)"
      }
    }
  ]
}
```

### `GET /stocks/movements`

```json
{
  "success": true,
  "data": [
    {
      "id": "9919d02a-9f1a-464f-8b0f-93464a75b5bd",
      "productId": "f7feae08-499c-4f48-b554-cf182187f1c4",
      "type": "SALE",
      "qtyBaseUnit": -20,
      "previousStock": 23,
      "newStock": 3,
      "notes": "Penjualan Nota INV-20261122-0139 (20 Kg)",
      "refNo": null,
      "fromLocation": null,
      "toLocation": null,
      "destination": null,
      "receiver": null,
      "driver": null,
      "reason": null,
      "unitName": null,
      "qtyInput": null,
      "createdBy": "bbaf1b60-1623-41bf-abb4-919cffc8fb8b",
      "createdAt": "2026-11-21T18:58:47.109Z",
      "updatedAt": "2026-11-21T18:58:47.109Z",
      "product": {
        "id": "f7feae08-499c-4f48-b554-cf182187f1c4",
        "sku": "SMN-TGR-50",
        "name": "Semen Tiga Roda 50 Kg",
        "baseUnit": "Kg"
      },
      "creator": {
        "id": "bbaf1b60-1623-41bf-abb4-919cffc8fb8b",
        "name": "Nova Philly (Kasir 1)"
      }
    }
  ],
  "meta": {
    "count": 100,
    "limit": 100,
    "today": "2026-11-22"
  }
}
```

### `GET /purchases`

```json
{
  "success": true,
  "data": [
    {
      "id": "06d85629-fbb6-4675-9637-fc339fa9c270",
      "number": "PO-20261118-01",
      "supplierId": "48a80483-98a5-49b1-9b57-f1bebdab5f10",
      "purchaseDate": "2026-11-18",
      "paymentTerm": "Tempo 30 Hari",
      "dueDate": "2026-12-18",
      "status": "Diterima Lengkap",
      "paymentStatus": "BELUM_LUNAS",
      "totalAmount": "2907000.00",
      "paidAmount": "0.00",
      "paidAt": null,
      "notes": null,
      "createdBy": "f429ee63-315d-4a39-b3a6-e64c6db7dbb4",
      "createdAt": "2026-11-18T02:30:00.000Z",
      "updatedAt": "2026-11-18T02:30:00.000Z",
      "supplier": {
        "id": "48a80483-98a5-49b1-9b57-f1bebdab5f10",
        "code": "SI-001",
        "name": "PT Semen Indonesia (Persero) Tbk"
      },
      "items": [
        {
          "id": "34bd6739-089b-475b-8977-0053d5aa0993",
          "purchaseId": "06d85629-fbb6-4675-9637-fc339fa9c270",
          "productId": "e4fe6eca-77cc-4c70-957a-5988cd54895a",
          "unitId": "fdfb7132-91dd-41bf-9767-970b1bc81ee6",
          "productName": "Semen Gresik 50 Kg",
          "unitName": "Sak 50kg",
          "qty": 50,
          "conversionFactor": 50,
          "qtyBaseUnit": 2500,
          "unitCost": "58140.00",
          "subtotal": "2907000.00",
          "createdAt": "2026-11-21T18:58:42.368Z",
          "updatedAt": "2026-11-21T18:58:42.368Z"
        }
      ],
      "creator": {
        "id": "f429ee63-315d-4a39-b3a6-e64c6db7dbb4",
        "name": "Novo Phillia (Staf Gudang)"
      }
    }
  ],
  "meta": {
    "count": 6,
    "limit": 100
  }
}
```

### `GET /expenses`

```json
{
  "success": true,
  "data": [
    {
      "id": "40b935ba-41c3-41f1-9b80-dfdaff0ebeac",
      "expenseDate": "2026-11-20",
      "category": "Transport & BBM",
      "description": "Ongkos kirim material ke proyek",
      "amount": "450000.00",
      "paymentMethod": "CASH",
      "createdBy": "38e01606-1830-4f56-85e9-8813abc314c0",
      "createdAt": "2026-11-21T18:58:42.429Z",
      "updatedAt": "2026-11-21T18:58:42.429Z",
      "creator": {
        "id": "38e01606-1830-4f56-85e9-8813abc314c0",
        "name": "Vincent G (Owner)"
      }
    }
  ],
  "meta": {
    "categories": [
      "Gaji & Upah"
    ]
  }
}
```

### `GET /wholesale`

```json
{
  "success": true,
  "data": [
    {
      "id": "56fbb977-0d3f-4dc4-bcc9-e9db2f4a5466",
      "productId": "e4fe6eca-77cc-4c70-957a-5988cd54895a",
      "unitId": "fdfb7132-91dd-41bf-9767-970b1bc81ee6",
      "label": "Grosir 20 sak+",
      "minQty": 20,
      "price": "61000.00",
      "target": "Semua",
      "isActive": true,
      "createdAt": "2026-11-21T18:58:42.296Z",
      "updatedAt": "2026-11-21T18:58:42.296Z",
      "product": {
        "id": "e4fe6eca-77cc-4c70-957a-5988cd54895a",
        "sku": "SMN-GRS-50",
        "name": "Semen Gresik 50 Kg"
      },
      "unit": {
        "id": "fdfb7132-91dd-41bf-9767-970b1bc81ee6",
        "unitName": "Sak 50kg",
        "sellPrice": "64000.00"
      }
    }
  ]
}
```

### `GET /branches`

```json
{
  "success": true,
  "data": [
    {
      "id": "d2cf209d-3196-4fca-887d-1589a032bb55",
      "name": "Toko Sentosa - Pusat",
      "address": "Jl. Raya Gresik No. 123, Gresik, Jawa Timur 61111",
      "type": "Toko & Gudang",
      "status": "Aktif",
      "isMain": true,
      "createdAt": "2026-11-21T18:58:42.272Z",
      "updatedAt": "2026-11-21T18:58:42.272Z"
    }
  ]
}
```

### `GET /users`

```json
{
  "success": true,
  "data": [
    {
      "id": "38e01606-1830-4f56-85e9-8813abc314c0",
      "name": "Vincent G (Owner)",
      "username": "admin",
      "role": "admin",
      "isActive": true,
      "createdAt": "2026-11-21T18:58:42.247Z"
    }
  ]
}
```

### `GET /help`

```json
{
  "success": true,
  "data": {
    "about": [
      {
        "id": "0fa90958-4046-48ad-99fb-f9f6c0871bcc",
        "title": "Versi Aplikasi",
        "body": "1.0.0",
        "extra": null
      }
    ],
    "contact": [
      {
        "id": "9a9c41b2-990d-4ea9-aca2-b30d18395777",
        "title": "WhatsApp",
        "body": "0812-3456-7890",
        "extra": "whatsapp"
      }
    ],
    "faq": [
      {
        "id": "9d62f999-e371-41bd-b8fc-5bbf72856c0c",
        "title": "Bagaimana cara menambah barang baru?",
        "body": "Buka menu Master Data > Data Produk, lalu klik tombol Tambah Produk. Isi nama material, SKU, satuan dasar, serta harga modal dan harga jual.",
        "extra": null
      }
    ],
    "guide": [
      {
        "id": "a46bda2e-7e86-49a7-afa2-0def53768f63",
        "title": "Mulai Menggunakan StokMaterial.id",
        "body": "Pengenalan fitur utama dan pengaturan awal sistem toko bangunan.\n\nLengkapi identitas toko di Pengaturan > Toko.\nTambahkan kategori, merek, dan produk di Data Master.\nCatat stok awal lewat Barang Masuk atau Penyesuaian Stok.\nTambahkan mandor langganan di Data Master > Pelanggan.\nMulai berjualan dari menu Kasir (F1).",
        "extra": "🧱"
      }
    ],
    "shortcut": [
      {
        "id": "581514d2-89ce-43f1-afa6-efd857a11af1",
        "title": "Kasir Penjualan (POS)",
        "body": "F1",
        "extra": null
      }
    ],
    "video": [
      {
        "id": "90daa79f-7fc7-4acb-aa42-a0b421a85eed",
        "title": "Cara Melakukan Penjualan di Kasir",
        "body": "Panduan lengkap transaksi penjualan untuk pemula.",
        "extra": "3:25"
      }
    ]
  }
}
```

### `GET /notifications`

```json
{
  "success": true,
  "data": [
    {
      "id": "stock-a23589ba-1b7b-40ed-afce-dba4ab70a371",
      "type": "danger",
      "title": "Stok Habis",
      "desc": "Cat Tembok Dulux Catylac Putih tersisa 0 Kaleng 1kg (minimum 10 Kaleng 1kg)",
      "at": "2026-11-21T18:58:46.158Z",
      "link": "/inventory?tab=stock-list"
    }
  ],
  "meta": {
    "total": 9
  }
}
```

### `GET /backup`

```json
{
  "success": true,
  "data": []
}
```

### `GET /reports/summary`

```json
{
  "success": true,
  "data": {
    "totalRevenue": 71760700,
    "totalCashReceived": 62464700,
    "totalDebtGiven": 9296000,
    "totalOutstandingDebt": 6783000,
    "transactionCount": 216,
    "totalCustomers": 3,
    "lowStockCount": 9,
    "lowStockProducts": [
      {
        "id": "a23589ba-1b7b-40ed-afce-dba4ab70a371",
        "sku": "CAT-DLX-WHT",
        "name": "Cat Tembok Dulux Catylac Putih",
        "categoryId": "c506a4b4-0be0-4d09-b7a2-56769431b153",
        "brandId": "bfd84f4d-d02c-477b-9c18-e44445fcbbeb",
        "location": "Gudang Utama - Rak D1",
        "baseUnit": "Kaleng 1kg",
        "minStock": 10,
        "currentStockBase": 0,
        "isActive": true,
        "createdAt": "2026-11-21T18:58:42.283Z",
        "updatedAt": "2026-11-21T18:58:46.158Z"
      }
    ],
    "topItems": [
      {
        "productName": "Bata Ringan Hebel 7.5cm",
        "unitName": "m3 (Isi 83 Pcs)",
        "totalSoldQty": 15,
        "totalGrossSales": "10200000.00"
      }
    ],
    "recentTransactions": [
      {
        "id": "cdafcd17-b65f-4779-a9c9-7f82a9834bce",
        "invoiceNumber": "INV-20261122-0139",
        "customerId": null,
        "cashierId": "bbaf1b60-1623-41bf-abb4-919cffc8fb8b",
        "transactionDate": "2026-11-21T18:58:47.105Z",
        "subtotal": "32000.00",
        "discount": "0.00",
        "taxRate": "0.00",
        "taxAmount": "0.00",
        "totalAmount": "32000.00",
        "cashReceived": "32000.00",
        "changeAmount": "0.00",
        "idempotencyKey": null,
        "paidAmount": "32000.00",
        "debtAmount": "0.00",
        "paymentStatus": "PAID",
        "dueDate": null,
        "notes": null,
        "createdAt": "2026-11-21T18:58:47.106Z",
        "updatedAt": "2026-11-21T18:58:47.106Z",
        "customer": null
      }
    ]
  }
}
```

### `GET /reports/overview`

```json
{
  "success": true,
  "data": {
    "range": {
      "from": "2026-11-01",
      "to": "2026-11-22"
    },
    "totals": {
      "count": 216,
      "sales": 71760700,
      "discount": 125000,
      "tax": 0,
      "paid": 62464700,
      "debt": 9296000,
      "average": 332225
    },
    "daily": [
      {
        "date": "2026-11-01",
        "count": 3,
        "sales": 761500
      }
    ],
    "methods": [
      {
        "method": "CASH",
        "amount": 56777700,
        "count": 177
      }
    ],
    "categories": [
      {
        "name": "Semen & Mortar",
        "amount": 18929200
      }
    ],
    "topProducts": [
      {
        "name": "Bata Ringan Hebel 7.5cm",
        "unit": "m3 (Isi 83 Pcs)",
        "qty": 15,
        "amount": 10200000
      }
    ],
    "recent": [
      {
        "id": "cdafcd17-b65f-4779-a9c9-7f82a9834bce",
        "invoiceNumber": "INV-20261122-0139",
        "createdAt": "2026-11-21T18:58:47.105Z",
        "totalAmount": 32000,
        "paymentStatus": "PAID",
        "customer": null
      }
    ],
    "receivable": {
      "outstanding": 6783000,
      "customers": 3
    },
    "lowStockCount": 9
  }
}
```

### `GET /reports/purchases`

```json
{
  "success": true,
  "data": {
    "range": {
      "from": "2026-11-01",
      "to": "2026-11-22"
    },
    "totals": {
      "count": 6,
      "amount": 22308600,
      "paid": 14281200,
      "unpaid": 8027400,
      "unpaidCount": 3
    },
    "bySupplier": [
      {
        "id": "48a80483-98a5-49b1-9b57-f1bebdab5f10",
        "name": "PT Semen Indonesia (Persero) Tbk",
        "count": 2,
        "amount": 6957000
      }
    ],
    "list": [
      {
        "id": "06d85629-fbb6-4675-9637-fc339fa9c270",
        "number": "PO-20261118-01",
        "purchaseDate": "2026-11-18",
        "paymentTerm": "Tempo 30 Hari",
        "paymentStatus": "BELUM_LUNAS",
        "totalAmount": 2907000,
        "dueDate": "2026-12-18",
        "supplier": "PT Semen Indonesia (Persero) Tbk",
        "items": "Semen Gresik 50 Kg (50 Sak 50kg)"
      }
    ]
  }
}
```

### `GET /reports/profit-loss`

```json
{
  "success": true,
  "data": {
    "range": {
      "from": "2026-11-01",
      "to": "2026-11-22"
    },
    "transactionCount": 216,
    "revenue": {
      "gross": 71885700,
      "discount": 125000,
      "net": 71760700,
      "taxCollected": 0
    },
    "cogs": 59046916,
    "grossProfit": 12713784,
    "grossMarginPercent": 17.7,
    "expenses": {
      "total": 4425000,
      "byCategory": [
        {
          "category": "Gaji & Upah",
          "amount": 2000000
        }
      ]
    },
    "netProfit": 8288784,
    "linesWithoutCost": 0
  }
}
```

### `GET /reports/cash-flow`

```json
{
  "success": true,
  "data": {
    "range": {
      "from": "2026-11-01",
      "to": "2026-11-22"
    },
    "cashIn": {
      "sales": 62464700,
      "debtPayments": 4763000,
      "total": 67227700,
      "salesByMethod": [
        {
          "method": "CASH",
          "amount": 56777700
        }
      ]
    },
    "cashOut": {
      "purchases": 14281200,
      "expenses": 4425000,
      "total": 18706200,
      "expensesByCategory": [
        {
          "category": "Gaji & Upah",
          "amount": 2000000
        }
      ]
    },
    "net": 48521500,
    "daily": [
      {
        "date": "2026-11-01",
        "in": 610000,
        "out": 0
      }
    ]
  }
}
```

### `GET /reports/stock`

```json
{
  "success": true,
  "data": {
    "totals": {
      "products": 9,
      "low": 6,
      "empty": 3,
      "costValue": 131284,
      "sellValue": 175800
    },
    "items": [
      {
        "id": "e9c019a2-2b43-4c43-b8ce-6df790127141",
        "sku": "BTA-HBL-75",
        "name": "Bata Ringan Hebel 7.5cm",
        "category": "Bata & Hebel",
        "baseUnit": "Pcs",
        "stock": 10,
        "minStock": 100,
        "status": "menipis",
        "costValue": 72290,
        "sellValue": 95000
      }
    ]
  }
}
```
