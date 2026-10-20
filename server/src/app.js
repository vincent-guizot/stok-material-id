import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { ensureDatabaseExists } from "./config/database.js";
import sequelize from "./config/database.js";
import { User } from "./models/index.js";
import { runSeeder } from "./seeders/initialSeed.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root info
app.get("/", (req, res) => {
  res.json({
    app: "StokMaterial.id - Sistem POS Toko Bangunan API",
    status: "running",
    docs: "/api/v1/health",
  });
});

// Mount API v1
app.use("/api/v1", routes);
app.use("/api", routes); // Alias

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Jalankan server hanya jika bukan dalam mode test
if (process.env.NODE_ENV !== "test") {
  async function startServer() {
    try {
      await ensureDatabaseExists();
      await sequelize.authenticate();
      console.log("[Database] Terhubung dengan sukses ke PostgreSQL.");

      await sequelize.sync();
      console.log("[Database] Sinkronisasi skema tabel selesai.");

      // Pastikan ada akun user minimal (jika database baru/kosong)
      const userCount = await User.count();
      if (userCount === 0) {
        console.log("[Database] Belum ada data pengguna, menjalankan seeder awal...");
        await runSeeder();
      }

      app.listen(PORT, '0.0.0.0', () => {
        console.log(
          `[Server] StokMaterial.id Backend aktif di http://localhost:${PORT} (dan http://127.0.0.1:${PORT})`,
        );
      });
    } catch (err) {
      console.error("[Server Error] Gagal menyalakan server:", err.message);
    }
  }

  startServer();
}

export default app;
