// Skema dasar (snapshot). Pada database kosong: membuat seluruh tabel dari 001_baseline.sql.
// Pada database lama (dibuat dulu lewat sequelize.sync): hanya menambal kolom/tabel yang kurang.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export async function up({ sequelize }) {
  const [rows] = await sequelize.query(`SELECT to_regclass('public.users') AS t`);
  if (!rows[0].t) {
    await sequelize.query(fs.readFileSync(path.join(here, '001_baseline.sql'), 'utf8'));
    return;
  }
  // Jalur upgrade untuk database lama
  const run = (sql) => sequelize.query(sql);
  await run(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0`);
  await run(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0`);
  await run(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "cashReceived" DECIMAL(12,2) NOT NULL DEFAULT 0`);
  await run(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "changeAmount" DECIMAL(12,2) NOT NULL DEFAULT 0`);
  await run(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "idempotencyKey" VARCHAR(64)`);
  await run(`CREATE UNIQUE INDEX IF NOT EXISTS transactions_idempotency_key_uq ON transactions ("idempotencyKey") WHERE "idempotencyKey" IS NOT NULL`);
  await run(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0`);
  await run(`ALTER TYPE "enum_transaction_payments_paymentMethod" ADD VALUE IF NOT EXISTS 'CARD'`);
  await run(`CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY, name VARCHAR(255) NOT NULL UNIQUE, origin VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL, "updatedAt" TIMESTAMPTZ NOT NULL)`);
  await run(`ALTER TABLE products ADD COLUMN IF NOT EXISTS "brandId" UUID`);
}

export async function down({ sequelize }) {
  // Baseline tidak dibatalkan sebagian: reset penuh lewat `npm run db:reset`.
  await sequelize.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
}
