# StokMaterial.id — Client

React 19 + Vite + Tailwind. Semua data diambil langsung dari API (TanStack Query); tidak ada data dummy/hardcode.

```bash
npm install
npm run dev      # http://localhost:3000, /api diproxy ke http://127.0.0.1:5000
npm run build    # hasil di dist/
npm run lint
```

Struktur: `src/pages` (halaman & sub-tab), `src/components` (shell, UI umum), `src/store` (Zustand: auth, keranjang), `src/services` (Axios), `src/utils/calc.js` (rumus uang, identik dengan server).
Kontrak API: `../docs/API_CONTRACT.md`.
