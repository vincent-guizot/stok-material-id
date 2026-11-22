// Migration runner (umzug). File migrasi: src/database/migrations/NNN_nama.js (ESM, export up & down).
// Riwayat tersimpan di tabel "SequelizeMeta". Aman dijalankan berulang.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Umzug, SequelizeStorage } from 'umzug';
import sequelize from '../config/database.js';

const here = path.dirname(fileURLToPath(import.meta.url));

export function createMigrator() {
  return new Umzug({
    migrations: {
      glob: ['migrations/*.js', { cwd: here }],
      resolve: ({ name, path: file }) => ({
        name,
        up: async () => (await import(pathToFileURL(file).href)).up({ sequelize, queryInterface: sequelize.getQueryInterface() }),
        down: async () => (await import(pathToFileURL(file).href)).down({ sequelize, queryInterface: sequelize.getQueryInterface() }),
      }),
    },
    context: sequelize,
    storage: new SequelizeStorage({ sequelize }),
    logger: process.env.NODE_ENV === 'test' ? undefined : console,
  });
}

export const migrateUp = async () => (await createMigrator().up()).map((m) => m.name);
export const migrateDown = async (opts = { to: 0 }) => (await createMigrator().down(opts)).map((m) => m.name);
export const migrationStatus = async () => {
  const m = createMigrator();
  return { executed: (await m.executed()).map((x) => x.name), pending: (await m.pending()).map((x) => x.name) };
};
