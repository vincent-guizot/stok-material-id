import { Setting } from '../models/index.js';

export const getSettings = async (req, res, next) => {
  try {
    const [settings] = await Setting.findOrCreate({
      where: { id: 'system_settings' },
      defaults: {
        id: 'system_settings',
        storeName: 'Toko Sentosa',
        storeAddress: 'Jl. Raya Gresik No. 123, Gresik, Jawa Timur 61111',
        storePhone: '031-1234567',
        storeEmail: 'tokosentosa@gmail.com',
        headerReceipt: 'TOKO SENTOSA\nToko Bangunan & Material Konstruksi\nJl. Raya Gresik No. 123\nTelp. 031-1234567',
        footerReceipt: 'Terima kasih telah berbelanja\nBarang yang sudah dibeli tidak dapat ditukar/dikembalikan.',
        showLogo: true,
        showAddress: true,
        showPhone: true,
        showCashier: true,
        showThanks: true,
        autoPrint: false,
        lowStockAlert: '50',
        emptyStockAlert: '0',
        allowMinusStock: 'no',
        showHppCashier: 'no',
      },
    });

    res.json({
      success: true,
      data: settings,
    });
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const [settings] = await Setting.findOrCreate({
      where: { id: 'system_settings' },
    });

    const allowedFields = [
      'storeName',
      'storeAddress',
      'storePhone',
      'storeEmail',
      'logoUrl',
      'headerReceipt',
      'footerReceipt',
      'showLogo',
      'showAddress',
      'showPhone',
      'showCashier',
      'showThanks',
      'autoPrint',
      'lowStockAlert',
      'emptyStockAlert',
      'allowMinusStock',
      'showHppCashier',
      'branches',
      'usersList',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    await settings.update(updates);

    res.json({
      success: true,
      message: 'Pengaturan sistem berhasil disimpan secara permanen.',
      data: settings,
    });
  } catch (err) {
    next(err);
  }
};
