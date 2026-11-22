import { readFileSync } from 'node:fs';
import * as server from '../src/utils/money.js';
import * as client from '../../client/src/utils/calc.js';

// Rumus tampilan kasir (client) harus identik dengan server. Jika salah satu diubah sendirian, test ini gagal.
describe('Kesamaan rumus uang client <-> server', () => {
  let seed = 987654321;
  const rnd = (n) => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed % n;
  };

  it('badan kode kedua file identik (selain komentar header)', () => {
    const body = (f) => readFileSync(f, 'utf8').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    expect(body(new URL('../../client/src/utils/calc.js', import.meta.url))).toBe(
      body(new URL('../src/utils/money.js', import.meta.url)),
    );
  });

  it('calcTotals sama pada 10.000 kasus acak (qty & harga pecahan, diskon % / nominal, PPN)', () => {
    for (let i = 0; i < 10000; i++) {
      const n = 1 + rnd(8);
      const items = Array.from({ length: n }, () => ({
        qty: (1 + rnd(5000)) / [1, 2, 4, 10, 100, 1000][rnd(6)],
        unitPrice: rnd(2) ? 50 * (1 + rnd(4000)) : (1 + rnd(2000000)) / 7,
      }));
      const input = {
        items,
        discountPercent: rnd(3) === 0 ? 0 : rnd(1500) / 10,
        discountAmount: rnd(500000),
        taxRate: [0, 11, 11, 2.5, 10][rnd(5)],
      };
      expect(client.calcTotals(input)).toEqual(server.calcTotals(input));
    }
  });

  it('settlePayments sama pada 10.000 kasus acak', () => {
    for (let i = 0; i < 10000; i++) {
      const total = 1 + rnd(9000000);
      const payments = ['CASH', 'TRANSFER', 'DEBT', 'CASH']
        .slice(0, 1 + rnd(4))
        .map((method) => ({ method, amount: rnd(3) ? rnd(6000000) : total }));
      expect(client.settlePayments(total, payments)).toEqual(server.settlePayments(total, payments));
    }
  });

  it('pembulatan sama: roundRp, roundQty, roundStock', () => {
    const samples = [0, 0.5, 1.5, 2.5, 37.5, 160.82, 21700.499999999996, 21700.4999, -0.4, -1.5, 1e9 + 0.5, NaN, Infinity, '12.5', null];
    for (const v of samples) {
      expect(client.roundRp(v)).toBe(server.roundRp(v));
      expect(client.roundQty(v)).toBe(server.roundQty(v));
      expect(client.roundStock(v)).toBe(server.roundStock(v));
    }
  });
});
