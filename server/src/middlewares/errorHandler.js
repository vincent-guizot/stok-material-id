export const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  // Sequelize Unique Constraint Error
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Data sudah ada (duplikat). Harap gunakan nilai lain.',
      errors: err.errors.map(e => ({ field: e.path, message: e.message })),
    });
  }

  // Sequelize Validation Error
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validasi data gagal.',
      errors: err.errors.map(e => ({ field: e.path, message: e.message })),
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server.',
  });
};
