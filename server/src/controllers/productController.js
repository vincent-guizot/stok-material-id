import { Op } from 'sequelize';
import { Product, ProductUnit, Category, StockMovement, sequelize } from '../models/index.js';

export const getAllProducts = async (req, res, next) => {
  try {
    const { search, categoryId, activeOnly } = req.query;
    const where = {};

    if (activeOnly === 'true' || activeOnly === undefined) {
      where.isActive = true;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search && search.trim() !== '') {
      where[Op.or] = [
        { name: { [Op.like]: `%${search.trim()}%` } },
        { sku: { [Op.like]: `%${search.trim()}%` } },
      ];
    }

    const products = await Product.findAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon'] },
        {
          model: ProductUnit,
          as: 'units',
          order: [['level', 'ASC']],
        },
      ],
      order: [['name', 'ASC']],
    });

    // Format tampilan stok ramah kasir toko bangunan
    const formatted = products.map(p => {
      const pJson = p.toJSON();
      const units = pJson.units || [];
      const highestUnit = units.length > 0 ? units[units.length - 1] : null;
      let humanReadableStock = `${pJson.currentStockBase} ${pJson.baseUnit}`;

      if (highestUnit && highestUnit.conversionFactor > 1) {
        const fullHighest = Math.floor(pJson.currentStockBase / highestUnit.conversionFactor);
        const remainder = pJson.currentStockBase % highestUnit.conversionFactor;
        if (fullHighest > 0) {
          humanReadableStock += ` (~${fullHighest} ${highestUnit.unitName}${remainder > 0 ? ` + ${remainder} ${pJson.baseUnit}` : ''})`;
        }
      }

      pJson.humanReadableStock = humanReadableStock;
      pJson.isLowStock = pJson.currentStockBase <= pJson.minStock;
      return pJson;
    });

    res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: ProductUnit, as: 'units', order: [['level', 'ASC']] },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produk material tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { sku, name, categoryId, baseUnit, minStock, initialStock, units } = req.body;

    if (!sku || !name || !baseUnit) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Kode SKU, nama produk, dan satuan dasar wajib diisi.',
      });
    }

    const currentStockBase = parseFloat(initialStock) || 0;

    const product = await Product.create({
      sku,
      name,
      categoryId: categoryId || null,
      baseUnit,
      minStock: parseFloat(minStock) || 0,
      currentStockBase,
    }, { transaction: t });

    // Tambahkan unit-unit bertingkat jika ada
    if (Array.isArray(units) && units.length > 0) {
      const unitsToCreate = units.map((u, idx) => ({
        productId: product.id,
        unitName: u.unitName,
        conversionFactor: parseFloat(u.conversionFactor) || 1,
        buyPrice: parseFloat(u.buyPrice) || 0,
        sellPrice: parseFloat(u.sellPrice) || 0,
        level: u.level || (idx + 1),
        isBase: u.isBase || (parseFloat(u.conversionFactor) === 1),
      }));

      await ProductUnit.bulkCreate(unitsToCreate, { transaction: t });
    } else {
      // Default: set Base Unit sebagai level 1
      await ProductUnit.create({
        productId: product.id,
        unitName: baseUnit,
        conversionFactor: 1,
        buyPrice: 0,
        sellPrice: 0,
        level: 1,
        isBase: true,
      }, { transaction: t });
    }

    // Catat mutasi stok awal jika ada
    if (currentStockBase > 0) {
      await StockMovement.create({
        productId: product.id,
        type: 'IN',
        qtyBaseUnit: currentStockBase,
        previousStock: 0,
        newStock: currentStockBase,
        notes: 'Stok awal produk baru',
        createdBy: req.user ? req.user.id : null,
      }, { transaction: t });
    }

    await t.commit();

    const created = await Product.findByPk(product.id, {
      include: [{ model: ProductUnit, as: 'units' }, { model: Category, as: 'category' }],
    });

    res.status(201).json({
      success: true,
      message: 'Produk material baru berhasil disimpan.',
      data: created,
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};
