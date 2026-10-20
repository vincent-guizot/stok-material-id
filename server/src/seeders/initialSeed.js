import bcrypt from "bcryptjs";
import {
  sequelize,
  User,
  Category,
  Product,
  ProductUnit,
  Customer,
} from "../models/index.js";
import { ensureDatabaseExists } from "../config/database.js";

export async function runSeeder() {
  console.log("[Seeder] Memulai pengisian data awal toko bangunan...");

  await ensureDatabaseExists();
  await sequelize.sync({ force: true });
  console.log("[Seeder] Tabel database berhasil disinkronisasi.");

  // 1. Seed Users (3 Role)
  const passwordHash = await bcrypt.hash("admin123", 10);
  const kasirPasswordHash = await bcrypt.hash("kasir123", 10);
  const gudangPasswordHash = await bcrypt.hash("gudang123", 10);

  const users = await User.bulkCreate([
    {
      name: "Vincent G (Owner)",
      username: "admin",
      password: passwordHash,
      role: "admin",
    },
    {
      name: "Nova Philly (Kasir 1)",
      username: "kasir",
      password: kasirPasswordHash,
      role: "cashier",
    },
    {
      name: "Novo Phillia (Staf Gudang)",
      username: "gudang",
      password: gudangPasswordHash,
      role: "warehouse",
    },
  ]);
  console.log(
    `[Seeder] ${users.length} akun pengguna default berhasil dibuat.`,
  );

  // 2. Seed Categories
  const categories = await Category.bulkCreate([
    { name: "Semen & Mortar", icon: "🧱" },
    { name: "Bata & Hebel", icon: "🏗️" },
    { name: "Besi & Baja Ringan", icon: "⛓️" },
    { name: "Cat & Pelapis", icon: "🪣" },
    { name: "Pipa & Sanitasi", icon: "🚰" },
    { name: "Paku & Perlengkapan", icon: "🔨" },
    { name: "Keramik & Lantai", icon: "🏛️" },
    { name: "Kayu & Triplek", icon: "🪵" },
    { name: "Atap & Plafon", icon: "🏠" },
    { name: "Listrik & Elektrikal", icon: "💡" },
  ]);
  console.log(
    `[Seeder] ${categories.length} kategori material berhasil dibuat.`,
  );

  const catMap = {};
  categories.forEach((c) => {
    catMap[c.name] = c.id;
  });

  // 3. Seed Customers (Mandor & Kontraktor)
  const customers = await Customer.bulkCreate([
    {
      name: "Pak Bambang (Mandor Perumahan Graha)",
      phone: "081234567890",
      address: "Jl. Melati Blok C-12, Graha Asri",
      creditLimit: 15000000,
      currentDebt: 4500000,
      termDays: 14,
    },
    {
      name: "Pak Joko (Kontraktor Ruko Sentosa)",
      phone: "081987654321",
      address: "Jl. Ahmad Yani No. 88, Pusat Niaga",
      creditLimit: 25000000,
      currentDebt: 22000000, // Mendekati limit (Warning)
      termDays: 30,
    },
    {
      name: "Pak Budi Tukang Harian",
      phone: "081345678901",
      address: "Kampung Suka Maju RT 03/04",
      creditLimit: 5000000,
      currentDebt: 950000,
      termDays: 7,
    },
  ]);
  console.log(
    `[Seeder] ${customers.length} data mandor langganan berhasil dibuat.`,
  );

  // 4. Seed Products & Units (Hierarki Satuan 3-Tingkat)
  const productsData = [
    {
      sku: "SMN-GRS-50",
      name: "Semen Gresik 50 Kg",
      categoryId: catMap["Semen & Mortar"],
      baseUnit: "Kg",
      minStock: 500,
      currentStockBase: 5000, // 5.000 Kg = 100 Sak @ 50kg
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
      categoryId: catMap["Semen & Mortar"],
      baseUnit: "Kg",
      minStock: 500,
      currentStockBase: 4000, // 4.000 Kg = 80 Sak @ 50kg
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
      categoryId: catMap["Bata & Hebel"],
      baseUnit: "Pcs",
      minStock: 100,
      currentStockBase: 830, // 830 Pcs = 10 m3
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
      categoryId: catMap["Besi & Baja Ringan"],
      baseUnit: "Meter",
      minStock: 120,
      currentStockBase: 1200, // 1.200 Meter = 100 Lonjor 12m
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
      categoryId: catMap["Besi & Baja Ringan"],
      baseUnit: "Meter",
      minStock: 120,
      currentStockBase: 1200,
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
      categoryId: catMap["Cat & Pelapis"],
      baseUnit: "Kaleng 1kg",
      minStock: 10,
      currentStockBase: 120,
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
      categoryId: catMap["Pipa & Sanitasi"],
      baseUnit: "Meter",
      minStock: 20,
      currentStockBase: 200, // 200m = 50 Batang 4m
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
      categoryId: catMap["Paku & Perlengkapan"],
      baseUnit: "Kg",
      minStock: 15,
      currentStockBase: 100, // 100 Kg = 5 Dus 20kg
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
      categoryId: catMap["Keramik & Lantai"],
      baseUnit: "Keping",
      minStock: 30,
      currentStockBase: 360, // 360 Keping = 60 Dus (1 m2 = 6 keping)
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

  for (const item of productsData) {
    const { units, ...prodProps } = item;
    const prod = await Product.create(prodProps);
    const unitsToCreate = units.map((u) => ({ ...u, productId: prod.id }));
    await ProductUnit.bulkCreate(unitsToCreate);
  }

  console.log(
    `[Seeder] ${productsData.length} produk material dengan multi-satuan 3-tingkat berhasil dibuat.`,
  );
  console.log("[Seeder] Selesai!");
}

// Jalankan langsung jika script dieksekusi via CLI
if (process.argv[1]?.endsWith("initialSeed.js")) {
  runSeeder()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[Seeder Gagal]", err);
      process.exit(1);
    });
}
