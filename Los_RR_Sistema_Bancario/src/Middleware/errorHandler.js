export const errorHandler = (err, req, res, next) => {
  console.error('Error interno del servidor:', err.stack || err.message || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
  });
};
