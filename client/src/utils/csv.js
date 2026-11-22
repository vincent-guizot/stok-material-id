// Pembaca CSV sederhana (koma atau titik koma, tanda kutip ganda, BOM Excel).
// Hasil: array objek dengan kunci header huruf kecil tanpa spasi/simbol.
export const normKey = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function parseCsv(text) {
  const src = String(text || '').replace(/^﻿/, '');
  const firstLine = src.split(/\r?\n/)[0] || '';
  const delim = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let row = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"' && cell === '') q = true;
    else if (c === delim) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  if (rows.length < 2) return [];
  const keys = rows[0].map(normKey);
  return rows.slice(1).map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
}

// Ambil nilai pertama yang ada dari beberapa nama kolom alternatif
export const pick = (row, ...names) => {
  for (const n of names) {
    const v = row[normKey(n)];
    if (v !== undefined && v !== '') return v;
  }
  return '';
};

// Angka gaya Indonesia/Excel: "1.500.000" atau "1500000,50"
export const toNum = (v) => {
  const s = String(v ?? '').trim();
  if (!s) return 0;
  const n = /,\d{1,2}$/.test(s) ? s.replace(/\./g, '').replace(',', '.') : s.replace(/[.,](?=\d{3}\b)/g, '');
  const x = parseFloat(n);
  return Number.isFinite(x) ? x : 0;
};
