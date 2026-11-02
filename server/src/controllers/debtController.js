import { sequelize, Customer, DebtPayment, User, Transaction } from '../models/index.js';

export const payDebt = async (req, res, next) => {
  let t;
  try {
    t = await sequelize.transaction();
    const { customerId, amount, paymentMethod = 'CASH', transactionId, notes } = req.body;

    if (!customerId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Pelanggan / Mandor wajib dipilih.',
      });
    }

    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Nominal cicilan pembayaran harus lebih dari Rp 0.',
      });
    }

    const customer = await Customer.findByPk(customerId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!customer) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Data Mandor / Pelanggan tidak ditemukan.',
      });
    }

    const currentDebt = parseFloat(customer.currentDebt) || 0;
    if (currentDebt <= 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Mandor "${customer.name}" tidak memiliki tanggungan kasbon (saldo hutang: Rp 0).`,
      });
    }

    if (payAmount > currentDebt) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Nominal pembayaran (Rp ${payAmount.toLocaleString('id-ID')}) melebihi total kasbon mandor (Rp ${currentDebt.toLocaleString('id-ID')}).`,
      });
    }

    const normalizedMethod = String(paymentMethod).toUpperCase();
    if (!['CASH', 'TRANSFER', 'QRIS'].includes(normalizedMethod)) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Metode pembayaran tidak valid.' });
    }
    const invoices = await Transaction.findAll({
      where: { customerId, ...(transactionId ? { id: transactionId } : {}) },
      order: [['transactionDate', 'ASC'], ['id', 'ASC']], transaction: t, lock: t.LOCK.UPDATE,
    });
    if (transactionId && (!invoices.length || Number(invoices[0].debtAmount) < payAmount)) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Nota tidak sesuai pelanggan atau pembayaran melebihi saldo nota.' });
    }
    let remaining = payAmount;
    for (const invoice of invoices) {
      const allocation = Math.min(remaining, Number(invoice.debtAmount));
      if (allocation <= 0) continue;
      const debtAmount = Number(invoice.debtAmount) - allocation;
      await invoice.update({ debtAmount, paidAmount: Number(invoice.paidAmount) + allocation,
        paymentStatus: debtAmount <= 0 ? 'PAID' : 'PARTIAL' }, { transaction: t });
      remaining -= allocation;
    }
    const collectorId = req.user.id;

    // Buat catatan pembayaran cicilan
    const payment = await DebtPayment.create({
      customerId,
      transactionId: transactionId || null,
      amount: payAmount,
      paymentMethod: normalizedMethod,
      receivedBy: collectorId,
      notes: notes || `Pelunasan Kasbon Mandor ${customer.name}`,
    }, { transaction: t });

    // Potong saldo hutang berjalan
    const newDebt = currentDebt - payAmount;
    await customer.update({ currentDebt: newDebt }, { transaction: t });

    await t.commit();

    const result = await DebtPayment.findByPk(payment.id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'collector', attributes: ['id', 'name'] },
      ],
    });

    res.status(201).json({
      success: true,
      message: `Cicilan kasbon sebesar Rp ${payAmount.toLocaleString('id-ID')} berhasil dicatat. Sisa hutang ${customer.name}: Rp ${newDebt.toLocaleString('id-ID')}.`,
      data: {
        payment: result,
        previousDebt: currentDebt,
        remainingDebt: newDebt,
      },
    });
  } catch (err) {
    if (t && !t.finished) await t.rollback();
    next(err);
  }
};

export const getDebtHistory = async (req, res, next) => {
  try {
    const { customerId } = req.query;
    const where = {};
    if (customerId) {
      where.customerId = customerId;
    }

    const history = await DebtPayment.findAll({
      where,
      order: [['paymentDate', 'DESC']],
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] },
        { model: User, as: 'collector', attributes: ['id', 'name'] },
      ],
    });

    res.json({
      success: true,
      data: history,
    });
  } catch (err) {
    next(err);
  }
};
