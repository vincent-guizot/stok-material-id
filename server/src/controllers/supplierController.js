import { randomUUID } from 'node:crypto';
import { Supplier } from '../models/index.js';

export const getAllSuppliers = async (req, res, next) => {
  try {
    let suppliers = await Supplier.findAll({
      where: { isActive: true },
      order: [['createdAt', 'ASC']],
    });

    res.json({
      success: true,
      data: suppliers,
    });
  } catch (err) {
    next(err);
  }
};

export const getSupplierById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findByPk(id);

    if (!supplier || !supplier.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Data supplier tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      data: supplier,
    });
  } catch (err) {
    next(err);
  }
};

export const createSupplier = async (req, res, next) => {
  try {
    const { name, code, category, contactPerson, phone, email, address, paymentTerms, status } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nama supplier wajib diisi.',
      });
    }

    const finalCode = code || `SI-${randomUUID()}`;

    const supplier = await Supplier.create({
      code: finalCode,
      name,
      category: category || 'Umum',
      contactPerson: contactPerson || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      paymentTerms: paymentTerms || 'Tempo 30 Hari',
      status: status || 'Aktif',
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: `Supplier "${supplier.name}" berhasil didaftarkan.`,
      data: supplier,
    });
  } catch (err) {
    next(err);
  }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, category, contactPerson, phone, email, address, paymentTerms, status } = req.body;

    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Data supplier tidak ditemukan.',
      });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (code !== undefined) updates.code = code;
    if (category !== undefined) updates.category = category;
    if (contactPerson !== undefined) updates.contactPerson = contactPerson;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (address !== undefined) updates.address = address;
    if (paymentTerms !== undefined) updates.paymentTerms = paymentTerms;
    if (status !== undefined) updates.status = status;

    await supplier.update(updates);

    res.json({
      success: true,
      message: `Data supplier "${supplier.name}" berhasil diperbarui.`,
      data: supplier,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findByPk(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Data supplier tidak ditemukan.',
      });
    }

    const name = supplier.name;
    try {
      await supplier.destroy();
    } catch {
      await supplier.update({ isActive: false });
    }

    res.json({
      success: true,
      message: `Supplier "${name}" berhasil dihapus.`,
    });
  } catch (err) {
    next(err);
  }
};
