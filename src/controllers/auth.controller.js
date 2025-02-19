import { createUsuario, getUsuarioByEmail } from "../models/usuario.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Registrar un nuevo usuario (se mantiene igual)
const registrarUsuario = async (req, res) => {
  const { name, email, password, rol, jwt2 } = req.body;
  if (jwt2 !== process.env.JWT_SECRET_2) {
    return res.status(400).json({ error: "Error al registrar el usuario" });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { name, email, password: hashedPassword, rol };
    const result = await createUsuario(newUser);
    res
      .status(201)
      .json({ message: "Usuario registrado exitosamente", user: result });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al registrar el usuario", details: err });
  }
}; 

const loginUsuario = async (req, res) => {
  const { email, password } = req.body;
  const isProd = process.env.NODE_ENV === "production";
  try {
    const user = await getUsuarioByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Genera el access token (15 minutos)
    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Genera el refresh token (14 días, por ejemplo)
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "14d" }
    );

    // Envía ambos tokens en cookies httpOnly
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProd, // secure: true solo en producción
      sameSite: isProd ? "None" : "Lax", // en desarrollo puedes usar Lax
      maxAge: 15 * 60 * 1000, // 15 minutos
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd, // secure: true solo en producción
      sameSite: isProd ? "None" : "Lax", // en desarrollo puedes usar Lax
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 días
    });

    res.status(200).json({ 
  message: "Login exitoso",
  user: { id: user.id, name: user.name, rol: user.rol } // Datos públicos del usuario
});
  } catch (err) {
    console.error("🔥 Error en loginUsuario:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const refreshToken = (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token no proporcionado" });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = jwt.sign(
      { id: payload.id, email: payload.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: isProd, // secure: true solo en producción
      sameSite: isProd ? "None" : "Lax", // en desarrollo puedes usar Lax
      maxAge: 15 * 60 * 1000,
    });
    return res.status(200).json({ message: "Access token renovado" });
  } catch (error) {
    console.error("Error al refrescar el token:", error);
    return res.status(403).json({ error: "Refresh token inválido o expirado" });
  }
};
const verifyAuth = (req, res) => {
  res.status(200).json({ message: "Autenticado" });
};
const logoutUsuario = (req, res) => {
  // Eliminar cookies
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax"
  });
  
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax"
  });

  res.status(200).json({ message: "Sesión cerrada exitosamente" });
};
export { registrarUsuario, loginUsuario, refreshToken,verifyAuth,logoutUsuario };
