// Aritmetika uang Rupiah untuk TAMPILAN di kasir. Ini salinan identik dari
// server/src/utils/money.js (server tetap sumber kebenaran: total dikirim sebagai
// expectedTotal dan ditolak jika berbeda). Test server/__tests__/money_parity.test.js
// memastikan kedua file selalu menghasilkan angka yang sama. JANGAN ubah salah satu saja.

/** Bulatkan ke Rupiah utuh (setengah ke atas). toFixed(6) membuang noise float, mis. 21700.499999999996. */
export const roundRp = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.round(Number(x.toFixed(6)));
};

/** Bulatkan kuantitas ke 3 desimal (mis. 2,5 sak). */
export const roundQty = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.round(Number(x.toFixed(6)) * 1000) / 1000;
};

/** Bulatkan stok satuan dasar ke 4 desimal agar tidak muncul 0.30000000000000004. */
export const roundStock = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.round(Number(x.toFixed(8)) * 10000) / 10000;
};

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/**
 * Hitung seluruh angka nota.
 *  - items: [{ qty, unitPrice }]
 *  - discountPercent: 0..100 (jika > 0 mengalahkan discountAmount)
 *  - discountAmount: nominal Rp (dibatasi 0..subtotal)
 *  - taxRate: persen PPN (0 = tanpa PPN), dikenakan pada (subtotal - diskon)
 */
export function calcTotals({ items = [], discountPercent = 0, discountAmount = 0, taxRate = 0 }) {
  const lineSubtotals = items.map((it) => roundRp(roundQty(it.qty) * Number(it.unitPrice || 0)));
  const subtotal = lineSubtotals.reduce((a, b) => a + b, 0);

  const pct = clamp(Number(discountPercent) || 0, 0, 100);
  const discount =
    pct > 0
      ? roundRp((subtotal * pct) / 100)
      : clamp(roundRp(Number(discountAmount) || 0), 0, subtotal);

  const taxableBase = subtotal - discount;
  const rate = clamp(Number(taxRate) || 0, 0, 100);
  const taxAmount = roundRp((taxableBase * rate) / 100);
  const total = taxableBase + taxAmount;

  return { lineSubtotals, subtotal, discount, taxableBase, taxRate: rate, taxAmount, total };
}

/**
 * Pecah pembayaran menjadi bagian yang benar-benar dipakai.
 *  - payments: [{ method: 'CASH'|'TRANSFER'|'QRIS'|'DEBT', amount }]
 * Aturan:
 *  - total uang masuk + kasbon harus >= total nota (kurang = ditolak)
 *  - kelebihan hanya boleh dari TUNAI dan menjadi kembalian (tidak boleh lebih besar dari tunai yang diberikan)
 *  - paid + debt === total (selalu persis)
 * Mengembalikan { ok, error?, paid, debt, change, cashReceived, cashApplied, otherPaid }
 */
export function settlePayments(total, payments) {
  let cashTendered = 0;
  let otherPaid = 0;
  let debt = 0;
  for (const p of payments) {
    const amt = roundRp(p.amount);
    if (amt <= 0) continue;
    if (p.method === 'DEBT') debt += amt;
    else if (p.method === 'CASH') cashTendered += amt;
    else otherPaid += amt;
  }

  const received = cashTendered + otherPaid + debt;
  if (received < total) {
    return { ok: false, error: `Pembayaran kurang Rp ${(total - received).toLocaleString('id-ID')}.` };
  }

  const excess = received - total;
  if (excess > cashTendered) {
    return {
      ok: false,
      error: 'Pembayaran melebihi total. Kelebihan hanya boleh dari uang tunai (menjadi kembalian).',
    };
  }

  const change = excess;
  const cashApplied = cashTendered - change;
  const paid = cashApplied + otherPaid;

  return { ok: true, paid, debt, change, cashReceived: cashTendered, cashApplied, otherPaid };
}

/**
 * Harga per satuan menurut tingkat grosir. Memakai harga terendah dari semua tingkat yang
 * terpenuhi (qty >= minQty), dan tidak pernah lebih mahal dari harga jual normal.
 * tiers: [{ minQty, price }]
 */
export function pickUnitPrice(sellPrice, tiers, qty) {
  const base = Number(sellPrice) || 0;
  let best = base;
  let tier = null;
  for (const t of tiers || []) {
    const min = Number(t.minQty);
    const price = Number(t.price);
    if (!(min > 0) || !(price >= 0)) continue;
    if (Number(qty) >= min && price < best) {
      best = price;
      tier = t;
    }
  }
  return { price: best, tier };
}
