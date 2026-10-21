import { Op } from 'sequelize';
import { Customer, Transaction, DebtPayment } from '../models/index.js';

export const getAllCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.findAll({
      order: [['name', 'ASC']],
    });

    const enriched = customers.map((c) => {
      const cJson = c.toJSON();
      const limit = parseFloat(cJson.creditLimit) || 0;
      const debt = parseFloat(cJson.currentDebt) || 0;
      const remainingCredit = Math.max(0, limit - debt);
      const usagePercent = limit > 0 ? Math.min(100, Math.round((debt / limit) * 100)) : 0;

      let status = 'HEALTHY'; // Hijau
      if (debt >= limit && limit > 0) {
        status = 'OVER_LIMIT'; // Merah
      } else if (usagePercent >= 75) {
        status = 'WARNING'; // Kuning
      }

      cJson.remainingCredit = remainingCredit;
      cJson.usagePercent = usagePercent;
      cJson.creditStatus = status;
      return cJson;
    });

    res.json({
      success: true,
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByPk(id, {
      include: [
        {
          model: Transaction,
          as: 'transactions',
          where: { debtAmount: { [Op.gt]: 0 } },
          required: false,
          limit: 10,
          order: [['transactionDate', 'DESC']],
        },
        {
          model: DebtPayment,
          as: 'debtPayments',
          required: false,
          limit: 10,
          order: [['paymentDate', 'DESC']],
        },
      ],
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Pelanggan / Mandor tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, address, creditLimit, termDays } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nama pelanggan / mandor wajib diisi.',
      });
    }

    const customer = await Customer.create({
      name,
      phone: phone || null,
      address: address || null,
      creditLimit: parseFloat(creditLimit) || 0,
      termDays: parseInt(termDays, 10) || 14,
      currentDebt: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Data Mandor / Pelanggan berhasil ditambahkan.',
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, address, creditLimit, termDays } = req.body;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Pelanggan / Mandor tidak ditemukan.',
      });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (creditLimit !== undefined) updates.creditLimit = parseFloat(creditLimit) || 0;
    if (termDays !== undefined) updates.termDays = parseInt(termDays, 10) || 14;

    await customer.update(updates);

    res.json({
      success: true,
      message: `Data Mandor "${customer.name}" berhasil diperbarui.`,
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Pelanggan / Mandor tidak ditemukan.',
      });
    }

    const name = customer.name;
    // Check if customer has outstanding debt
    if (parseFloat(customer.currentDebt) > 0) {
      return res.status(400).json({
        success: false,
        message: `Mandor "${name}" tidak dapat dihapus karena masih memiliki saldo kasbon sebesar Rp ${parseFloat(customer.currentDebt).toLocaleString('id-ID')}.`,
      });
    }

    await customer.destroy();

    res.json({
      success: true,
      message: `Data Mandor "${name}" berhasil dihapus.`,
    });
  } catch (err) {
    next(err);
  }
};
