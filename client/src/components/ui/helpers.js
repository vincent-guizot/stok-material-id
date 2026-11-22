export const inputCls =
  'w-full px-3 py-2 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-semibold text-[#252922] focus:outline-none focus:border-[#234536] focus:bg-white transition disabled:opacity-60';
export const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#234536] hover:bg-[#1c372b] text-white rounded-control text-xs font-extrabold transition shadow-xs disabled:opacity-60 cursor-pointer';
export const btnGhost =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-bold text-[#252922] transition shadow-xs disabled:opacity-60 cursor-pointer';

export const errMsg = (err, fallback = 'Terjadi kesalahan. Coba lagi.') =>
  err?.response?.data?.message || (err?.code === 'ERR_NETWORK' ? 'Server API tidak dapat dihubungi.' : fallback);

export const todayStr = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

const dfmt = (opts) => (v) => (v ? new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', ...opts }).format(new Date(v)) : '-');
export const fmtDate = (v) => {
  if (!v) return '-';
  // tanggal murni (YYYY-MM-DD) ditampilkan apa adanya tanpa geser zona waktu
  const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T12:00:00+07:00`) : new Date(v);
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric' }).format(d);
};
export const fmtDateTime = dfmt({ day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export const fmtNum = (n, max = 3) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: max }).format(Number(n) || 0);

