import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const isTest = process.env.NODE_ENV === "test";
const neonUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

let sequelize;

// Helper untuk memastikan database lokal sudah dibuat
export async function ensureDatabaseExists(customDbName) {
  if (neonUrl) return;

  const dbHost = process.env.DB_HOST || "127.0.0.1";
  const dbPort = process.env.DB_PORT || 5432;
  const dbUser = process.env.DB_USER || "postgres";
  const dbPass = process.env.DB_PASS || "admin";
  const targetDb =
    customDbName ||
    (isTest
      ? process.env.DB_NAME_TEST || "stokmaterial_test_db"
      : process.env.DB_NAME || "stokmaterial_db");

  const client = new pg.Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPass,
    database: "postgres",
  });

  try {
    await client.connect();
    const checkRes = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDb],
    );
    if (checkRes.rowCount === 0) {
      await client.query(`CREATE DATABASE "${targetDb}"`);
      console.log(
        `[Database] Database '${targetDb}' berhasil dibuat di PostgreSQL lokal.`,
      );
    }
  } catch (err) {
    console.warn(
      `[Database] Catatan: Tidak dapat memverifikasi database '${targetDb}': ${err.message}`,
    );
  } finally {
    try {
      await client.end();
    } catch (_) {}
  }
}

// Inisialisasi Sequelize Instance berdasarkan logika Neon vs Lokal
if (isTest) {
  // Dalam mode test, gunakan PostgreSQL stokmaterial_test_db di lokal
  const dbHost = process.env.DB_HOST || "127.0.0.1";
  const dbPort = process.env.DB_PORT || 5432;
  const dbUser = process.env.DB_USER || "postgres";
  const dbPass = process.env.DB_PASS || "admin";
  const testDbName = process.env.DB_NAME_TEST || "stokmaterial_test_db";

  sequelize = new Sequelize(testDbName, dbUser, dbPass, {
    host: dbHost,
    port: dbPort,
    dialect: "postgres",
    logging: false,
    pool: {
      max: 5,
      min: 0,
      idle: 10000,
    },
  });
} else if (neonUrl && neonUrl.trim() !== "") {
  console.log("[Database] Menggunakan koneksi Cloud: Neon PostgreSQL");
  sequelize = new Sequelize(neonUrl, {
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
  });
} else {
  const dbHost = process.env.DB_HOST || "127.0.0.1";
  const dbPort = process.env.DB_PORT || 5432;
  const dbUser = process.env.DB_USER || "postgres";
  const dbPass = process.env.DB_PASS || "admin";
  const dbName = process.env.DB_NAME || "stokmaterial_db";

  console.log(
    `[Database] Neon URL tidak ditemukan di .env -> Fallback otomatis ke PostgreSQL Lokal: postgres://${dbUser}:****@${dbHost}:${dbPort}/${dbName}`,
  );

  sequelize = new Sequelize(dbName, dbUser, dbPass, {
    host: dbHost,
    port: dbPort,
    dialect: "postgres",
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
}

export default sequelize;
