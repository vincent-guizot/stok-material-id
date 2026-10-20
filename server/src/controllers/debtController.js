import { sequelize, Customer, DebtPayment, User, Transaction } from '../models/index.js';

export const payDebt = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
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

    const customer = await Customer.findByPk(customerId, { transaction: t });
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

    const collectorId = req.user.id;

    // Buat catatan pembayaran cicilan
    const payment = await DebtPayment.create({
      customerId,
      transactionId: transactionId || null,
      amount: payAmount,
      paymentMethod,
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
    await t.rollback();
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
