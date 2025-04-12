import crypto from "crypto";
import jwt from "jsonwebtoken";

const CSRF_SECRET =
  process.env.CSRF_SECRET || crypto.randomBytes(32).toString("hex");
const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "X-CSRF-Token";
const CSRF_TOKEN_EXPIRES = "1h"; // 1 hora de expiración

// Configuración de cookies seguras
const secureCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 60 * 60 * 1000, // 1 hora
  path: "/api", // Solo accesible en rutas /api
};

/**
 * Genera un token CSRF y lo establece en cookie y header
 */
export const generateCsrfToken = (req, res, next) => {
  // Solo para métodos que modifican datos
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    try {
      const payload = {
        timestamp: Date.now(),
        userId: req.user?.id || "anonymous",
        userAgent: req.headers["user-agent"],
        ip: req.ip,
      };

      const csrfToken = jwt.sign(payload, CSRF_SECRET, {
        expiresIn: CSRF_TOKEN_EXPIRES,
      });

      // Cookie segura
      res.cookie(CSRF_COOKIE_NAME, csrfToken, secureCookieOptions);

      // Header para el frontend
      res.set(CSRF_HEADER_NAME, csrfToken);

      // Adjuntar token al request para posible uso posterior
      req.csrfToken = csrfToken;
    } catch (error) {
      console.error("Error generando CSRF token:", error);
      // No bloquear la petición, pero registrar el error
    }
  }
  next();
};

/**
 * Verifica la validez del token CSRF
 */
export const verifyCsrfToken = (req, res, next) => {
  // Solo verificar para métodos que modifican datos
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    const csrfCookie = req.cookies[CSRF_COOKIE_NAME];
    const csrfHeader = req.get(CSRF_HEADER_NAME);

    // Validación básica
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      return res.status(403).json({
        error: "Protección CSRF: Token inválido o no proporcionado",
        code: "invalid_csrf_token",
      });
    }

    try {
      // Verificar firma y expiración
      const decoded = jwt.verify(csrfCookie, CSRF_SECRET);

      // Validaciones adicionales
      if (req.user?.id && decoded.userId !== req.user.id) {
        throw new Error("User mismatch in CSRF token");
      }

      // Regenerar token (one-time use)
      const newPayload = {
        ...decoded,
        timestamp: Date.now(),
      };

      const newCsrfToken = jwt.sign(newPayload, CSRF_SECRET, {
        expiresIn: CSRF_TOKEN_EXPIRES,
      });

      // Actualizar cookie y header
      res.cookie(CSRF_COOKIE_NAME, newCsrfToken, secureCookieOptions);
      res.set(CSRF_HEADER_NAME, newCsrfToken);
      req.csrfToken = newCsrfToken;
    } catch (error) {
      console.error("Error verificando CSRF token:", error);
      return res.status(403).json({
        error: "Protección CSRF: Token expirado o inválido",
        code: "csrf_token_verification_failed",
      });
    }
  }
  next();
};
