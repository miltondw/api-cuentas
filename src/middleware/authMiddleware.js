import jwt from "jsonwebtoken";

// Códigos de error estandarizados
const ERROR_CODES = {
  TOKEN_MISSING: "auth_token_missing",
  TOKEN_EXPIRED: "auth_token_expired",
  TOKEN_INVALID: "auth_token_invalid",
  INSUFFICIENT_PERMISSIONS: "insufficient_permissions",
};

/**
 * Middleware de verificación de token JWT
 */
export const verificarToken = (req, res, next) => {
  // Obtener token de múltiples fuentes
  const token =
    req.cookies.accessToken ||
    (req.headers.authorization?.startsWith("Bearer ") &&
      req.headers.authorization.split(" ")[1]) ||
    req.query.token;

  if (!token) {
    return res.status(401).json({
      error: "Autenticación requerida",
      message: "Token de acceso no proporcionado",
      code: ERROR_CODES.TOKEN_MISSING,
      docs: process.env.API_DOCS_URL + "#autenticacion",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validaciones adicionales del payload
    if (!decoded.id || !decoded.email || !decoded.rol) {
      throw new jwt.JsonWebTokenError("Token con estructura inválida");
    }

    // Adjuntar usuario al request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol,
      ...(decoded.iss && { issuer: decoded.iss }),
      ...(decoded.aud && { audience: decoded.aud }),
    };

    // Registrar acceso para auditoría
    req.audit = {
      userId: decoded.id,
      action: req.method + " " + req.originalUrl,
      timestamp: new Date(),
    };

    next();
  } catch (err) {
    // Manejo detallado de errores
    let response = {
      error: "Error de autenticación",
      code: ERROR_CODES.TOKEN_INVALID,
    };

    if (err.name === "TokenExpiredError") {
      response = {
        ...response,
        error: "Token expirado",
        message: "La sesión ha expirado. Por favor, refresque el token",
        code: ERROR_CODES.TOKEN_EXPIRED,
        actionRequired: "refresh_token",
      };
    } else if (err.name === "JsonWebTokenError") {
      response = {
        ...response,
        message: "Token JWT inválido: " + err.message,
      };
    }

    // Solo mostrar detalles en desarrollo
    if (process.env.NODE_ENV !== "production") {
      response.details = err.message;
    }

    return res.status(401).json(response);
  }
};

/**
 * Middleware de verificación de roles
 */
export const verificarRol = (rolesPermitidos = []) => {
  return (req, res, next) => {
    // Primero verificar autenticación
    verificarToken(req, res, () => {
      if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
        return res.status(403).json({
          error: "Acceso denegado",
          message: `El rol ${
            req.user?.rol || "none"
          } no tiene permisos para esta acción`,
          code: ERROR_CODES.INSUFFICIENT_PERMISSIONS,
          requiredRoles: rolesPermitidos,
          currentRole: req.user?.rol,
          docs: process.env.API_DOCS_URL + "#autorizacion",
        });
      }
      next();
    });
  };
};

// Exportar como objeto para mejor organización
export default {
  verifyToken: verificarToken,
  verifyRole: verificarRol,
  ERROR_CODES,
};
