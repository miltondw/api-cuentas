export const handleError = (res, error, context = "Error") => {
  console.error(`${context}:`, error);

  const response = {
    success: false,
    message: context,
    error: {
      code: error.code || "INTERNAL_ERROR",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    },
  };

  const statusCode = error.statusCode || 500;
  res.status(statusCode).json(response);
};

// Middleware para rutas no encontradas
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
    requestedUrl: req.originalUrl,
  });
};
