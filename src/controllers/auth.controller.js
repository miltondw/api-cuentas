import {
  createUsuario,
  getUsuarioByEmail,
  registerFailedAttempt,
  resetFailedAttempts,
  isAccountLocked,
  revokeRefreshToken,
} from "../models/usuario.js";

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

// Configuración de entorno
const isProd = process.env.NODE_ENV === "production";
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const LOCKOUT_TIME_MINUTES = parseInt(process.env.LOCKOUT_TIME_MINUTES) || 15;

// Códigos de error estandarizados
const ERROR_CODES = {
  INVALID_CREDENTIALS: "invalid_credentials",
  ACCOUNT_LOCKED: "account_locked",
  INVALID_AUTH_CODE: "invalid_auth_code",
  DUPLICATE_USER: "duplicate_user",
  TOKEN_REFRESH_FAILED: "token_refresh_failed",
};

/**
 * Genera tokens JWT con seguridad mejorada
 */
const generateTokens = (user, ipAddress, userAgent) => {
  const tokenId = uuidv4(); // Identificador único para cada token

  const commonPayload = {
    jti: tokenId, // ID único del token
    sub: user.id, // Subject (usuario)
    iss: process.env.JWT_ISSUER || "api-cuentas", // Issuer
    aud: process.env.JWT_AUDIENCE || "client-app", // Audience
    iat: Math.floor(Date.now() / 1000), // Issued at
    context: {
      ip: ipAddress,
      ua: userAgent,
    },
  };

  // Access Token (corta duración)
  const accessToken = jwt.sign(
    {
      ...commonPayload,
      type: "access",
      rol: user.rol,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  // Refresh Token (larga duración)
  const refreshToken = jwt.sign(
    {
      ...commonPayload,
      type: "refresh",
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return {
    accessToken,
    refreshToken,
    tokenId, // Para almacenar en BD y poder revocar
  };
};

/**
 * Configuración segura de cookies
 */
const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "Strict" : "Lax",
  maxAge,
  path: "/api/auth", // Solo accesible en rutas de auth
  domain: process.env.COOKIE_DOMAIN || undefined,
  priority: "high",
});

/**
 * Registro de usuario con validaciones mejoradas
 */
const registrarUsuario = async (req, res) => {
  const { name, email, password, rol } = req.body;

  try {
    // Validación de rol admin
    if (rol === "admin") {
      const { jwt2 } = req.body;
      if (!jwt2 || jwt2 !== process.env.JWT_SECRET_2) {
        return res.status(403).json({
          error:
            "Código de autorización inválido para crear cuenta de administrador",
          code: ERROR_CODES.INVALID_AUTH_CODE,
        });
      }
    }

    // Validación de fortaleza de contraseña
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/\d/.test(password)
    ) {
      return res.status(400).json({
        error:
          "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número",
        code: "weak_password",
      });
    }

    // Hash seguro de contraseña
    const saltRounds = isProd ? 12 : 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const newUser = {
      name,
      email,
      password: hashedPassword,
      rol: rol || "usuario", // Valor por defecto
    };

    const result = await createUsuario(newUser);

    // No enviar datos sensibles en la respuesta
    res.status(201).json({
      message: "Usuario registrado exitosamente",
      userId: result.insertId,
      email: newUser.email,
    });
  } catch (err) {
    // Manejo específico de errores
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "El email ya está registrado",
        code: ERROR_CODES.DUPLICATE_USER,
      });
    }

    console.error("Error en registro:", err);
    res.status(500).json({
      error: "Error al registrar el usuario",
      code: "server_error",
      details: isProd ? undefined : err.message,
    });
  }
};

/**
 * Login con protección contra fuerza bruta
 */
const loginUsuario = async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.headers["user-agent"];

  try {
    // 1. Buscar usuario
    const user = await getUsuarioByEmail(email);
    if (!user) {
      // No revelar si el usuario existe
      await new Promise((resolve) => setTimeout(resolve, 500)); // Delay para timing attacks
      return res.status(401).json({
        error: "Credenciales inválidas",
        code: ERROR_CODES.INVALID_CREDENTIALS,
      });
    }

    // 2. Verificar bloqueo de cuenta
    const lockStatus = await isAccountLocked(user.id);
    if (lockStatus.isLocked) {
      const waitMinutes = Math.ceil(
        (lockStatus.lockedUntil - new Date()) / (1000 * 60)
      );
      return res.status(429).json({
        error: "Cuenta temporalmente bloqueada",
        code: ERROR_CODES.ACCOUNT_LOCKED,
        waitMinutes,
        retryAfter: lockStatus.lockedUntil.toISOString(),
      });
    }

    // 3. Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Registrar intento fallido
      const failStatus = await registerFailedAttempt(user.id, ipAddress);

      if (failStatus.isLocked) {
        return res.status(429).json({
          error: "Cuenta bloqueada por seguridad",
          code: ERROR_CODES.ACCOUNT_LOCKED,
          waitMinutes: LOCKOUT_TIME_MINUTES,
          retryAfter: failStatus.lockedUntil.toISOString(),
        });
      }

      return res.status(401).json({
        error: "Credenciales inválidas",
        code: ERROR_CODES.INVALID_CREDENTIALS,
        remainingAttempts: MAX_LOGIN_ATTEMPTS - failStatus.attempts,
      });
    }

    // 4. Login exitoso - resetear intentos
    await resetFailedAttempts(user.id);

    // 5. Generar tokens con información de contexto
    const { accessToken, refreshToken, tokenId } = generateTokens(
      user,
      ipAddress,
      userAgent
    );

    // 6. Almacenar refresh token en BD para posible revocación
    await storeRefreshToken(user.id, tokenId, refreshToken);

    // 7. Setear cookies seguras
    res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie(
      "refreshToken",
      refreshToken,
      getCookieOptions(7 * 24 * 60 * 60 * 1000)
    );

    // 8. Respuesta exitosa
    res.status(200).json({
      message: "Autenticación exitosa",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        rol: user.rol,
      },
      // Enviar token en respuesta solo para clientes no web
      ...(req.query.includeTokens === "true" && {
        accessToken,
        refreshToken,
        expiresIn: 15 * 60, // 15 minutos en segundos
      }),
    });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({
      error: "Error en el servidor",
      code: "server_error",
      details: isProd ? undefined : err.message,
    });
  }
};

/**
 * Refresco de token con revocación
 */
const refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  const ipAddress = req.ip;
  const userAgent = req.headers["user-agent"];

  if (!refreshToken) {
    return res.status(401).json({
      error: "Refresh token requerido",
      code: ERROR_CODES.TOKEN_REFRESH_FAILED,
    });
  }

  try {
    // 1. Verificar token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // 2. Verificar si el token fue revocado
    const isRevoked = await isTokenRevoked(decoded.jti);
    if (isRevoked) {
      throw new Error("Token revocado");
    }

    // 3. Obtener usuario
    const user = await getUsuarioById(decoded.sub);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // 4. Generar nuevo access token
    const { accessToken, tokenId } = generateTokens(user, ipAddress, userAgent);

    // 5. Actualizar cookies
    res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000));

    // 6. Responder
    res.status(200).json({
      message: "Token actualizado",
      accessToken: req.query.includeTokens === "true" ? accessToken : undefined,
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (err) {
    // Limpiar cookies inválidas
    res.clearCookie("accessToken", getCookieOptions(0));
    res.clearCookie("refreshToken", getCookieOptions(0));

    console.error("Error refrescando token:", err);

    const response = {
      error: "No se pudo refrescar el token",
      code: ERROR_CODES.TOKEN_REFRESH_FAILED,
    };

    if (err.name === "TokenExpiredError") {
      response.error = "Sesión expirada";
      response.code = "session_expired";
    } else if (err.name === "JsonWebTokenError") {
      response.error = "Token inválido";
      response.code = "invalid_token";
    }

    res.status(403).json(response);
  }
};

/**
 * Verificación de autenticación
 */
const verifyAuth = (req, res) => {
  res.status(200).json({
    message: "Autenticado",
    user: req.user, // Ya verificado por el middleware
    permissions: getPermissionsForRole(req.user.rol), // Ejemplo de permisos basados en rol
  });
};

/**
 * Logout con revocación de token
 */
const logoutUsuario = async (req, res) => {
  try {
    // Revocar refresh token si existe
    if (req.cookies.refreshToken) {
      try {
        const decoded = jwt.verify(
          req.cookies.refreshToken,
          process.env.JWT_REFRESH_SECRET
        );
        await revokeRefreshToken(decoded.jti);
      } catch (err) {
        console.error("Error revocando token:", err);
      }
    }

    // Limpiar cookies
    res.clearCookie("accessToken", getCookieOptions(0));
    res.clearCookie("refreshToken", getCookieOptions(0));

    res.status(200).json({
      message: "Sesión cerrada exitosamente",
      loggedOut: true,
    });
  } catch (err) {
    console.error("Error en logout:", err);
    res.status(500).json({
      error: "Error al cerrar sesión",
      code: "logout_error",
    });
  }
};

export {
  registrarUsuario,
  loginUsuario,
  refreshToken,
  verifyAuth,
  logoutUsuario,
  ERROR_CODES,
};
