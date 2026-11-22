import { formatRupiah } from '../../utils/formatters.js';

export const DEFAULT_LOGO = '/07_mono-hitam-putih.png';

const n = (v) => parseFloat(v) || 0;

export const money = (v) => formatRupiah(n(v));

export const fmtQty = (v) =>
  n(v).toLocaleString('id-ID', { maximumFractionDigits: 3 });

export const fmtDateTime = (v) => {
  if (!v) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(v));
};

export const fmtDate = (v) => {
  if (!v) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(v));
};

export const METHOD_LABEL = {
  CASH: 'Tunai',
  TRANSFER: 'Transfer',
  QRIS: 'QRIS',
  CARD: 'Kartu',
  DEBT: 'Kasbon',
};

export const STATUS_LABEL = {
  PAID: 'LUNAS',
  PARTIAL: 'DP / BELUM LUNAS',
  UNPAID: 'KASBON / BELUM LUNAS',
};

/** Semua angka nota dibaca dari data server (tidak dihitung ulang di sini). */
export function readTotals(tx) {
  return {
    subtotal: n(tx.subtotal),
    discount: n(tx.discount),
    taxRate: n(tx.taxRate),
    taxAmount: n(tx.taxAmount),
    total: n(tx.totalAmount),
    paid: n(tx.paidAmount),
    debt: n(tx.debtAmount),
    cashReceived: n(tx.cashReceived),
    change: n(tx.changeAmount),
  };
}

/** Pembayaran non-tunai & kasbon yang tercatat di server. */
export function otherPayments(tx) {
  return (tx.payments || [])
    .filter((p) => p.paymentMethod !== 'CASH' && n(p.amount) > 0)
    .map((p) => ({ label: METHOD_LABEL[p.paymentMethod] || p.paymentMethod, amount: n(p.amount), ref: p.referenceNo }));
}

/** Baris header nota dari Pengaturan; toggle alamat/telepon menyaring baris yang sesuai. */
export function headerLines(settings) {
  const s = settings || {};
  const raw = (s.headerReceipt || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const lines = raw.length ? raw : [s.storeName || 'TOKO'];

  const addrKey = (s.storeAddress || '').split('\n')[0].trim().slice(0, 12).toLowerCase();
  const phoneKey = (s.storePhone || '').replace(/\s/g, '').toLowerCase();

  return lines.filter((l, i) => {
    if (i === 0) return true;
    const low = l.toLowerCase();
    if (s.showAddress === false && addrKey && low.includes(addrKey)) return false;
    if (s.showPhone === false && phoneKey && low.replace(/\s/g, '').includes(phoneKey)) return false;
    return true;
  });
}

export const footerLines = (settings) =>
  (settings?.footerReceipt || '').split('\n').map((l) => l.trim()).filter(Boolean);
