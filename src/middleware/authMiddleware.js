// authMiddleware.js
import jwt from "jsonwebtoken";

const verificarToken = (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(403).json({
      error: "Acceso denegado",
      solution: "Intenta refrescar el token con /api/auth/refresh",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Almacena los datos del usuario decodificados
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expirado",
        actionRequired: "refresh_token",
      });
    }
    return res.status(401).json({
      error: "Token inválido",
    });
  }
};

export default verificarToken;
