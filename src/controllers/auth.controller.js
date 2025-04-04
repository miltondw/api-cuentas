import { createUsuario, getUsuarioByEmail } from "../models/usuario.js";

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const isProd = process.env.NODE_ENV === "production";

// Registrar un nuevo usuario
const registrarUsuario = async (req, res) => {
  const { name, email, password, rol, jwt2 } = req.body;

  if (jwt2 !== process.env.JWT_SECRET_2) {
    return res.status(400).json({ error: "Código de registro inválido" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { name, email, password: hashedPassword, rol };
    const result = await createUsuario(newUser);
    res.status(201).json({
      message: "Usuario registrado exitosamente",
      userId: result.insertId,
    });
  } catch (err) {
    console.error("Error al registrar usuario:", err);
    res
      .status(500)
      .json({ error: "Error al registrar el usuario", details: err.message });
  }
};

// Login de usuario
const loginUsuario = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await getUsuarioByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Generar access token (15 minutos)
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Generar refresh token (7 días)
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Enviar tokens en cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProd, // Solo secure en producción
      sameSite: isProd ? "None" : "Lax", // Ajuste para desarrollo/producción
      maxAge: 15 * 60 * 1000, // 15 minutos
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    res.status(200).json({
      message: "Login exitoso",
      user: { id: user.id, name: user.name, email: user.email, rol: user.rol },
    });
  } catch (err) {
    console.error("Error en loginUsuario:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Refrescar token
const refreshToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token no proporcionado" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = jwt.sign(
      { id: decoded.id, email: decoded.email, rol: decoded.rol },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
      maxAge: 15 * 60 * 1000, // 15 minutos
    });

    res.status(200).json({ message: "Token renovado exitosamente" });
  } catch (err) {
    console.error("Error al refrescar token:", err);
    res.status(403).json({ error: "Refresh token inválido o expirado" });
  }
};

// Verificar autenticación
const verifyAuth = (req, res) => {
  res.status(200).json({
    message: "Autenticado",
    user: { id: req.user.id, email: req.user.email, rol: req.user.rol },
  });
};

// Cerrar sesión
const logoutUsuario = (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "None" : "Lax",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "None" : "Lax",
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
