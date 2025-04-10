// authMiddleware.js
import jwt from "jsonwebtoken";

// Middleware para verificar tokens JWT
const verificarToken = (req, res, next) => {
  // Obtener token de diferentes fuentes (prioridad: cookie, header)
  const token = req.cookies.accessToken || 
                (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') && 
                 req.headers.authorization.split(' ')[1]);

  if (!token) {
    return res.status(401).json({
      error: "Acceso no autorizado",
      message: "Token no proporcionado"
    });
  }

  try {
    // Verificar la validez del token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Almacenar los datos del usuario para uso en controladores
    req.user = {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol
    };
    
    next();
  } catch (err) {
    // Manejar diferentes tipos de errores JWT
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expirado",
        message: "La sesión ha expirado. Intente refrescar el token",
        actionRequired: "refresh_token"
      });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Token inválido",
        message: "El token proporcionado no es válido"
      });
    } else {
      return res.status(401).json({
        error: "Error de autenticación",
        message: process.env.NODE_ENV === "production" ? "Error de autenticación" : err.message
      });
    }
  }
};

// Middleware para verificar roles (uso: verificarRol(['admin']) o verificarRol(['admin', 'supervisor']))
const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    // Primero verifica que el usuario esté autenticado
    verificarToken(req, res, () => {
      // Verificar el rol del usuario
      if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
        return res.status(403).json({
          error: "Acceso denegado",
          message: "No tiene permisos suficientes para acceder a este recurso"
        });
      }
      next();
    });
  };
};

export { verificarToken, verificarRol };
export default verificarToken;
