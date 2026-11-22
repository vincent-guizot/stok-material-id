import { Op } from 'sequelize';
import { Customer, DebtPayment, Transaction } from '../models/index.js';

const num = (v) => parseFloat(v) || 0;

// YYYY-MM-DD menurut zona waktu toko (WIB)
const jakartaDate = (d = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

/**
 * Ringkasan piutang mandor (semua angka dihitung dari data nyata).
 *  - Jatuh tempo memakai asumsi FIFO: cicilan melunasi nota TERTUA lebih dulu, jadi bagian yang
 *    sudah jatuh tempo = saldo berjalan dikurangi total nota yang belum jatuh tempo.
 *  - Saldo awal (hutang yang tidak berasal dari nota di sistem) tidak dihitung sebagai jatuh tempo.
 */
export async function computeDebtSummary() {
  {
    const today = jakartaDate();
    const monthStart = new Date(`${today.slice(0, 7)}-01T00:00:00+07:00`);

    const [customers, txs, payments] = await Promise.all([
      Customer.findAll(),
      Transaction.findAll({
        where: { customerId: { [Op.ne]: null } },
        attributes: ['customerId', 'debtAmount', 'dueDate', 'createdAt'],
      }),
      DebtPayment.findAll({ attributes: ['customerId', 'amount', 'paymentDate', 'createdAt'] }),
    ]);

    const per = {};
    const slot = (id) =>
      (per[id] ||= { txCount: 0, lastTransactionAt: null, lastPaymentAt: null, debtIssued: 0, notYetDue: 0, paid: 0 });

    for (const t of txs) {
      const c = slot(t.customerId);
      c.txCount += 1;
      const at = t.createdAt;
      if (!c.lastTransactionAt || at > c.lastTransactionAt) c.lastTransactionAt = at;
      const debt = num(t.debtAmount);
      if (debt > 0) {
        c.debtIssued += debt;
        if (!t.dueDate || String(t.dueDate) >= today) c.notYetDue += debt;
      }
    }

    let paidThisMonthAmount = 0;
    let paidThisMonthCount = 0;
    for (const p of payments) {
      const c = slot(p.customerId);
      c.paid += num(p.amount);
      const at = p.paymentDate || p.createdAt;
      if (!c.lastPaymentAt || at > c.lastPaymentAt) c.lastPaymentAt = at;
      if (at >= monthStart) {
        paidThisMonthAmount += num(p.amount);
        paidThisMonthCount += 1;
      }
    }

    const byCustomer = {};
    let outstanding = 0;
    let overdue = 0;
    let overdueCustomers = 0;
    let overLimitCount = 0;

    for (const cu of customers) {
      const c = slot(cu.id);
      const debt = num(cu.currentDebt);
      const tracked = Math.max(0, c.debtIssued - c.paid);
      const trackedOutstanding = Math.min(debt, tracked);
      const customerOverdue = Math.min(trackedOutstanding, Math.max(0, trackedOutstanding - c.notYetDue));

      byCustomer[cu.id] = {
        txCount: c.txCount,
        lastTransactionAt: c.lastTransactionAt,
        lastPaymentAt: c.lastPaymentAt,
        overdue: customerOverdue,
      };
      outstanding += debt;
      overdue += customerOverdue;
      if (customerOverdue > 0) overdueCustomers += 1;
      if (num(cu.creditLimit) > 0 && debt > num(cu.creditLimit)) overLimitCount += 1;
    }

    return {
      totals: {
        outstanding,
        overdue,
        overdueCustomers,
        overLimitCount,
        customerCount: customers.length,
        paidThisMonthAmount,
        paidThisMonthCount,
      },
      customers: byCustomer,
      customerList: customers,
    };
  }
}
