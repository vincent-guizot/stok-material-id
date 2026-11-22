/** Variasi warna untuk daftar mandor (dipilih stabil dari id/nama). */
const PALETTE = [
  { helmet: '#F2B418', skin: '#E8B48A', shirt: '#234536' },
  { helmet: '#D94B3B', skin: '#C98C65', shirt: '#3B6E8F' },
  { helmet: '#F2B418', skin: '#8D5A3C', shirt: '#5F7147' },
  { helmet: '#F28C28', skin: '#E8B48A', shirt: '#625D53' },
  { helmet: '#3B6E8F', skin: '#C98C65', shirt: '#C6A46A' },
  { helmet: '#F2B418', skin: '#6B3F26', shirt: '#234536' },
];

export function paletteFor(seed = '') {
  let h = 0;
  for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
