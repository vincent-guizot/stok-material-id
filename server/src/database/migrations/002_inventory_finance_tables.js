// Tabel & kolom baru: pembelian, biaya operasional, harga grosir, cabang, konten bantuan, log backup,
// serta kolom dokumen stok, HPP per item transaksi, lokasi produk, status aktif pengguna.
export async function up({ sequelize }) {
  const run = (sql) => sequelize.query(sql);
  const ts = `"createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(), "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()`;

  await run(`CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number VARCHAR(255) NOT NULL UNIQUE,
    "supplierId" UUID NOT NULL REFERENCES suppliers(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    "purchaseDate" DATE NOT NULL,
    "paymentTerm" VARCHAR(255),
    "dueDate" DATE,
    status VARCHAR(255) NOT NULL DEFAULT 'Diterima Lengkap',
    "paymentStatus" VARCHAR(255) NOT NULL DEFAULT 'LUNAS',
    "totalAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paidAt" DATE,
    notes TEXT,
    "createdBy" UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    ${ts})`);
  await run(`CREATE INDEX IF NOT EXISTS purchases_date_idx ON purchases ("purchaseDate")`);
  await run(`CREATE INDEX IF NOT EXISTS purchases_supplier_idx ON purchases ("supplierId")`);

  await run(`CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "purchaseId" UUID NOT NULL REFERENCES purchases(id) ON UPDATE CASCADE ON DELETE CASCADE,
    "productId" UUID NOT NULL REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    "unitId" UUID NOT NULL,
    "productName" VARCHAR(255) NOT NULL,
    "unitName" VARCHAR(255) NOT NULL,
    qty DOUBLE PRECISION NOT NULL,
    "conversionFactor" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "qtyBaseUnit" DOUBLE PRECISION NOT NULL,
    "unitCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,
    ${ts})`);
  await run(`CREATE INDEX IF NOT EXISTS purchase_items_purchase_idx ON purchase_items ("purchaseId")`);

  await run(`CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "expenseDate" DATE NOT NULL,
    category VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    amount DECIMAL(14,2) NOT NULL,
    "paymentMethod" VARCHAR(255) NOT NULL DEFAULT 'CASH',
    "createdBy" UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    ${ts})`);
  await run(`CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses ("expenseDate")`);

  await run(`CREATE TABLE IF NOT EXISTS wholesale_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE,
    "unitId" UUID NOT NULL REFERENCES product_units(id) ON UPDATE CASCADE ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    "minQty" DOUBLE PRECISION NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    target VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    ${ts})`);
  await run(`CREATE INDEX IF NOT EXISTS wholesale_prices_unit_idx ON wholesale_prices ("unitId")`);

  await run(`CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    type VARCHAR(255),
    status VARCHAR(255) NOT NULL DEFAULT 'Aktif',
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    ${ts})`);

  await run(`CREATE TABLE IF NOT EXISTS help_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind VARCHAR(255) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    extra VARCHAR(255),
    ${ts})`);
  await run(`CREATE INDEX IF NOT EXISTS help_contents_kind_idx ON help_contents (kind, "sortOrder")`);

  await run(`CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "fileName" VARCHAR(255) NOT NULL,
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "rowCounts" JSONB,
    "createdBy" UUID,
    ${ts})`);

  // Dokumen stok
  for (const v of ['OUT', 'TRANSFER', 'OPNAME']) {
    await run(`ALTER TYPE enum_stock_movements_type ADD VALUE IF NOT EXISTS '${v}'`);
  }
  for (const [col, type] of [
    ['refNo', 'VARCHAR(255)'], ['fromLocation', 'VARCHAR(255)'], ['toLocation', 'VARCHAR(255)'],
    ['destination', 'VARCHAR(255)'], ['receiver', 'VARCHAR(255)'], ['driver', 'VARCHAR(255)'],
    ['reason', 'VARCHAR(255)'], ['unitName', 'VARCHAR(255)'], ['qtyInput', 'DOUBLE PRECISION'],
  ]) {
    await run(`ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS "${col}" ${type}`);
  }
  await run(`CREATE INDEX IF NOT EXISTS stock_movements_type_idx ON stock_movements (type, "createdAt")`);

  await run(`ALTER TABLE products ADD COLUMN IF NOT EXISTS location VARCHAR(255)`);
  await run(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true`);

  // HPP per item transaksi; isi data lama dengan harga modal satuan yang sama (perkiraan terbaik yang ada)
  await run(`ALTER TABLE transaction_items ADD COLUMN IF NOT EXISTS "unitCost" DECIMAL(12,2) NOT NULL DEFAULT 0`);
  await run(`UPDATE transaction_items ti SET "unitCost" = COALESCE(pu."buyPrice", 0)
             FROM product_units pu WHERE pu.id = ti."unitId" AND ti."unitCost" = 0`);

  await run(`CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions ("transactionDate")`);
  await run(`CREATE INDEX IF NOT EXISTS transaction_items_tx_idx ON transaction_items ("transactionId")`);
  await run(`CREATE INDEX IF NOT EXISTS debt_payments_customer_idx ON debt_payments ("customerId")`);
}

export async function down({ sequelize }) {
  const run = (sql) => sequelize.query(sql);
  for (const t of ['backup_logs', 'help_contents', 'branches', 'wholesale_prices', 'expenses', 'purchase_items', 'purchases']) {
    await run(`DROP TABLE IF EXISTS ${t} CASCADE`);
  }
  for (const c of ['refNo', 'fromLocation', 'toLocation', 'destination', 'receiver', 'driver', 'reason', 'unitName', 'qtyInput']) {
    await run(`ALTER TABLE stock_movements DROP COLUMN IF EXISTS "${c}"`);
  }
  await run(`ALTER TABLE products DROP COLUMN IF EXISTS location`);
  await run(`ALTER TABLE users DROP COLUMN IF EXISTS "isActive"`);
  await run(`ALTER TABLE transaction_items DROP COLUMN IF EXISTS "unitCost"`);
}
