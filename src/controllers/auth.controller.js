import {
  createUsuario,
  getUsuarioByEmail,
  registerFailedAttempt,
  resetFailedAttempts,
  isAccountLocked,
} from "../models/usuario.js";

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const isProd = process.env.NODE_ENV === "production";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

// Generar tokens JWT
const generateTokens = (user) => {
  // Payload solo con información no sensible
  const payload = {
    id: user.usuario_id || user.id, // Usar usuario_id o id si ya está como alias
    email: user.email,
    rol: user.rol,
    // Agregar una marca de tiempo para hacer único cada token
    iat: Math.floor(Date.now() / 1000),
  };

  // Access token (corta duración)
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  // Refresh token (larga duración)
  // Añadimos un identificador único para poder revocar si es necesario
  const jti = crypto.randomBytes(16).toString("hex");
  const refreshToken = jwt.sign(
    { ...payload, jti },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

// Configuración de cookies seguras
const setCookieOptions = (maxAge) => {
  return {
    httpOnly: true,
    secure: isProd, // true en producción para HTTPS
    sameSite: isProd ? "None" : "Lax", // None para permitir cookies cross-site en producción
    maxAge,
    path: "/",
    // Prevenir ataques XSS
    //domain: process.env.COOKIE_DOMAIN || undefined
  };
};

// Registrar un nuevo usuario
const registrarUsuario = async (req, res) => {
  const { name, email, password, rol } = req.body;

  try {
    // Validar el código secreto para registro solo si el rol es admin
    if (rol === "admin") {
      const { jwt2 } = req.body;
      if (!jwt2 || jwt2 !== process.env.JWT_SECRET_2) {
        return res.status(403).json({
          error:
            "Código de autorización inválido para crear cuenta de administrador",
        });
      }
    }

    // Hash de contraseña con costos variables según entorno
    const saltRounds = isProd ? 12 : 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Guardar usuario en la base de datos
    const newUser = { name, email, password: hashedPassword, rol };
    const result = await createUsuario(newUser);

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      userId: result.insertId,
    });
  } catch (err) {
    // Manejar errores específicos
    if (err.status === 409) {
      return res.status(409).json({ error: err.message });
    }

    console.error("Error al registrar usuario:", err);
    res.status(500).json({
      error: "Error al registrar el usuario",
      message: isProd ? "Error interno" : err.message,
    });
  }
};

// Login de usuario
const loginUsuario = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Buscar usuario por email
    const user = await getUsuarioByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: "Credenciales inválidas", // Mensaje genérico para no revelar existencia
      });
    }

    // 2. Verificar si la cuenta está bloqueada
    const lockStatus = await isAccountLocked(user.id);
    if (lockStatus.isLocked) {
      const waitMinutes = Math.ceil(
        (lockStatus.lockedUntil - new Date()) / (1000 * 60)
      );
      return res.status(429).json({
        error: "Cuenta temporalmente bloqueada por múltiples intentos fallidos",
        waitMinutes,
        lockedUntil: lockStatus.lockedUntil,
      });
    }

    // 3. Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // 4. Registrar intento fallido
      const failStatus = await registerFailedAttempt(user.id);

      // Si la cuenta se acaba de bloquear
      if (failStatus.isLocked) {
        return res.status(429).json({
          error: "Cuenta bloqueada por múltiples intentos fallidos",
          waitMinutes: 15,
          lockedUntil: failStatus.lockedUntil,
        });
      }

      // Intentos incorrectos pero cuenta no bloqueada
      return res.status(401).json({
        error: "Credenciales inválidas",
        remainingAttempts: 5 - failStatus.attempts,
      });
    }

    // 5. Resetear intentos fallidos tras login exitoso
    await resetFailedAttempts(user.id);

    // 6. Generar tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // 7. Almacenar tokens en cookies seguras
    const accessMaxAge = 15 * 60 * 1000; // 15 minutos
    const refreshMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 días

    res.cookie("accessToken", accessToken, setCookieOptions(accessMaxAge));
    res.cookie("refreshToken", refreshToken, setCookieOptions(refreshMaxAge));
    console.log("Cookies configuradas:", { accessToken, refreshToken });

    res.status(200).json({
      message: "Login exitoso",
      user: { id: user.id, name: user.name, email: user.email, rol: user.rol },
    });
  } catch (err) {
    console.error("Error en loginUsuario:", err);
    res.status(500).json({
      error: "Error interno del servidor",
      message: isProd ? null : err.message,
    });
  }
};

// Refrescar token
const refreshToken = (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ error: "Refresh token no proporcionado" });
  }

  try {
    // 1. Verificar que el refresh token sea válido
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // 2. Generar nuevo access token
    const newAccessToken = jwt.sign(
      { id: decoded.id, email: decoded.email, rol: decoded.rol },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // 3. Almacenar nuevo access token en cookie
    const accessMaxAge = 15 * 60 * 1000; // 15 minutos
    res.cookie("accessToken", newAccessToken, setCookieOptions(accessMaxAge));

    // 4. Responder con éxito
    res.status(200).json({
      message: "Token renovado exitosamente",
      user: {
        id: decoded.id,
        email: decoded.email,
        rol: decoded.rol,
      },
    });
  } catch (err) {
    // Limpiar cookies si el token es inválido
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "Strict" : "Lax",
    });

    console.error("Error al refrescar token:", err);
    res.status(403).json({ error: "Refresh token inválido o expirado" });
  }
};

// Verificar autenticación
const verifyAuth = (req, res) => {
  // El middleware authMiddleware ya verificó el token
  res.status(200).json({
    message: "Autenticado",
    user: {
      id: req.user.id,
      email: req.user.email,
      rol: req.user.rol,
    },
  });
};

// Cerrar sesión
const logoutUsuario = (req, res) => {
  // Limpiar cookies
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "Strict" : "Lax",
    path: "/",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "Strict" : "Lax",
    path: "/",
  });

  res.status(200).json({ message: "Sesión cerrada exitosamente" });
};

export {
  registrarUsuario,
  loginUsuario,
  refreshToken,
  verifyAuth,
  logoutUsuario,
};
