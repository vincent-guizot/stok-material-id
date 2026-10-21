import { Supplier } from '../models/index.js';

const INITIAL_SUPPLIERS = [
  {
    code: 'SI-001',
    name: 'PT Semen Indonesia (Persero) Tbk',
    category: 'Semen & Mortar',
    contactPerson: 'Bpk. Bambang Wijaya',
    phone: '031-3981732',
    email: 'sales.gresik@sig.id',
    address: 'Gedung Utama SIG, Jl. Veteran, Gresik 61122',
    paymentTerms: 'Tempo 30 Hari',
    status: 'Aktif',
  },
  {
    code: 'SI-002',
    name: 'Toko Besi Jaya Abadi Steel',
    category: 'Besi & Baja',
    contactPerson: 'Ko Hendra',
    phone: '0812-3456-7890',
    email: 'jayasteel.sby@gmail.com',
    address: 'Kawasan Industri Margomulyo Permai Blok D-14, Surabaya',
    paymentTerms: 'Tempo 14 Hari',
    status: 'Aktif',
  },
  {
    code: 'SI-003',
    name: 'CV Sumber Bangunan Hebel',
    category: 'Bata & Hebel',
    contactPerson: 'Ibu Ratna',
    phone: '0813-9876-5432',
    email: 'sumberbangunan.hebel@yahoo.com',
    address: 'Jl. Raya Krian KM 28, Sidoarjo',
    paymentTerms: 'Tempo 7 Hari',
    status: 'Aktif',
  },
  {
    code: 'SI-004',
    name: 'Distributor Cat Maju Jaya Paint',
    category: 'Cat & Pelapis',
    contactPerson: 'Bpk. Agus Santoso',
    phone: '0821-4455-6677',
    email: 'aguscatsby@duluxdealer.co.id',
    address: 'Ruko Surya Inti Permata Blok C-8, Jl. Jemur Andayani, Surabaya',
    paymentTerms: 'Tempo 30 Hari',
    status: 'Aktif',
  },
  {
    code: 'SI-005',
    name: 'PT Rucika Mas Pipa Indonesia',
    category: 'Pipa & Sanitasi',
    contactPerson: 'Ibu Linda Susanti',
    phone: '021-8983-2000',
    email: 'order@rucika.co.id',
    address: 'Kawasan Industri MM2100 Blok C-3, Cikarang Barat',
    paymentTerms: 'Tempo 45 Hari',
    status: 'Aktif',
  },
];

export const getAllSuppliers = async (req, res, next) => {
  try {
    let suppliers = await Supplier.findAll({
      where: { isActive: true },
      order: [['createdAt', 'ASC']],
    });

    if (suppliers.length === 0) {
      await Supplier.bulkCreate(INITIAL_SUPPLIERS);
      suppliers = await Supplier.findAll({
        where: { isActive: true },
        order: [['createdAt', 'ASC']],
      });
    }

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

    const count = await Supplier.count();
    const finalCode = code || `SI-${String(count + 1).padStart(3, '0')}`;

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
