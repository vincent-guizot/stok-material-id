// Perintah database:  node src/database/cli.js <migrate|rollback|status|seed|reset|fresh>
//   migrate   jalankan migration yang belum dijalankan
//   rollback  batalkan 1 migration terakhir
//   status    tampilkan migration yang sudah/belum dijalankan
//   seed      isi data awal (aman diulang, tidak menghapus data)
//   reset     HAPUS semua tabel, jalankan migration dari awal (tanpa seed)
//   fresh     reset + seed
import sequelize, { ensureDatabaseExists } from '../config/database.js';
import { migrateUp, migrateDown, migrationStatus } from './migrator.js';
import { runSeeder } from '../seeders/initialSeed.js';

const cmd = process.argv[2] || 'status';

async function main() {
  await ensureDatabaseExists();
  await sequelize.authenticate();
  switch (cmd) {
    case 'migrate': {
      const done = await migrateUp();
      console.log(done.length ? `Migration dijalankan: ${done.join(', ')}` : 'Database sudah terbaru.');
      break;
    }
    case 'rollback': {
      const { executed } = await migrationStatus();
      if (!executed.length) return console.log('Tidak ada migration untuk dibatalkan.');
      const done = await migrateDown({ step: 1 });
      console.log(`Dibatalkan: ${done.join(', ')}`);
      break;
    }
    case 'status': {
      const s = await migrationStatus();
      console.log('Sudah dijalankan:', s.executed.join(', ') || '-');
      console.log('Belum dijalankan:', s.pending.join(', ') || '-');
      break;
    }
    case 'seed':
      await migrateUp();
      await runSeeder();
      break;
    case 'reset':
    case 'fresh':
      await sequelize.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
      console.log('Skema dikosongkan.');
      await migrateUp();
      if (cmd === 'fresh') await runSeeder();
      break;
    default:
      console.error(`Perintah tidak dikenal: ${cmd}`);
      process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error('[Database] Gagal:', err.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
