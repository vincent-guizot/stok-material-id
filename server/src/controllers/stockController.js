import { sequelize, Product, ProductUnit, StockMovement, User } from '../models/index.js';

export const addStock = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { productId, unitId, qty, notes } = req.body;

    if (!productId || !qty) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Produk dan kuantitas barang masuk wajib diisi.',
      });
    }

    const product = await Product.findByPk(productId, { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Produk material tidak ditemukan.',
      });
    }

    let conversionFactor = 1;
    let unitName = product.baseUnit;

    if (unitId) {
      const unit = await ProductUnit.findByPk(unitId, { transaction: t });
      if (unit && unit.productId === product.id) {
        conversionFactor = parseFloat(unit.conversionFactor);
        unitName = unit.unitName;
      }
    }

    const numQty = parseFloat(qty);
    const addedBaseQty = numQty * conversionFactor;
    const prevStock = product.currentStockBase;
    const newStock = prevStock + addedBaseQty;

    await product.update({ currentStockBase: newStock }, { transaction: t });

    const movement = await StockMovement.create({
      productId: product.id,
      type: 'IN',
      qtyBaseUnit: addedBaseQty,
      previousStock: prevStock,
      newStock: newStock,
      notes: notes || `Penerimaan Barang Masuk: ${numQty} ${unitName}`,
      createdBy: req.user ? req.user.id : null,
    }, { transaction: t });

    await t.commit();

    res.status(201).json({
      success: true,
      message: `Stok "${product.name}" berhasil ditambah sebanyak ${numQty} ${unitName} (= +${addedBaseQty} ${product.baseUnit}). Total stok baru: ${newStock} ${product.baseUnit}.`,
      data: {
        product,
        movement,
      },
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

export const adjustStock = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { productId, actualBaseQty, reason } = req.body;

    if (!productId || actualBaseQty === undefined) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Produk dan kuantitas fisik riil (dalam satuan dasar) wajib diisi.',
      });
    }

    const product = await Product.findByPk(productId, { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Produk material tidak ditemukan.',
      });
    }

    const targetStock = parseFloat(actualBaseQty);
    const prevStock = product.currentStockBase;
    const difference = targetStock - prevStock;

    await product.update({ currentStockBase: targetStock }, { transaction: t });

    const movement = await StockMovement.create({
      productId: product.id,
      type: 'ADJUSTMENT',
      qtyBaseUnit: difference,
      previousStock: prevStock,
      newStock: targetStock,
      notes: reason || `Penyesuaian Fisik Opname (Selisih: ${difference >= 0 ? '+' : ''}${difference} ${product.baseUnit})`,
      createdBy: req.user ? req.user.id : null,
    }, { transaction: t });

    await t.commit();

    res.json({
      success: true,
      message: `Stok "${product.name}" berhasil disesuaikan menjadi ${targetStock} ${product.baseUnit}.`,
      data: {
        product,
        movement,
      },
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

export const getMovements = async (req, res, next) => {
  try {
    const { productId, limit = 50 } = req.query;
    const where = {};
    if (productId) {
      where.productId = productId;
    }

    const movements = await StockMovement.findAll({
      where,
      limit: parseInt(limit, 10),
      order: [['createdAt', 'DESC']],
      include: [
        { model: Product, as: 'product', attributes: ['id', 'sku', 'name', 'baseUnit'] },
      ],
    });

    res.json({
      success: true,
      data: movements,
    });
  } catch (err) {
    next(err);
  }
};
