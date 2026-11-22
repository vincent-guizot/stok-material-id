import { Supplier, sequelize } from '../models/index.js';

const withTotals = async (rows) => {
  const stats = await sequelize.query(
    `SELECT "supplierId" AS id, COUNT(*)::int AS "purchaseCount", COALESCE(SUM("totalAmount"),0) AS "purchaseTotal",
            COALESCE(SUM("totalAmount") FILTER (WHERE "paymentStatus"='BELUM_LUNAS'),0) AS "unpaidTotal",
            MAX("purchaseDate") AS "lastPurchaseDate"
     FROM purchases GROUP BY "supplierId"`,
    { type: sequelize.QueryTypes.SELECT },
  );
  const byId = new Map(stats.map((x) => [x.id, x]));
  return rows.map((r) => {
    const j = r.toJSON();
    const st = byId.get(r.id);
    return {
      ...j,
      purchaseCount: st?.purchaseCount || 0,
      purchaseTotal: parseFloat(st?.purchaseTotal) || 0,
      unpaidTotal: parseFloat(st?.unpaidTotal) || 0,
      lastPurchaseDate: st?.lastPurchaseDate || null,
    };
  });
};

export const getAllSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.findAll({
      where: { isActive: true },
      order: [['createdAt', 'ASC']],
    });

    res.json({
      success: true,
      data: await withTotals(suppliers),
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
      data: (await withTotals([supplier]))[0],
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

    let finalCode = code;
    if (!finalCode) {
      const maxN = (await Supplier.findAll({ attributes: ['code'], raw: true }))
        .map((x) => parseInt(String(x.code).replace(/\D/g, ''), 10) || 0)
        .reduce((a, b) => Math.max(a, b), 0);
      finalCode = `SI-${String(maxN + 1).padStart(3, '0')}`;
    }

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
