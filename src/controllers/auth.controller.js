import { createUsuario, getUsuarioByEmail } from "../models/usuario.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Registrar un nuevo usuario (sin cambios)
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
      .json({ error: "Error al registrar el usuario", details: err.message });
  }
};

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

    // Genera el access token (15 minutos)
    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Genera el refresh token (14 días)
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "14d" }
    );

    // Establece las cookies sin restricciones estrictas (flexible para desarrollo)
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false, // Fijo en false para que no se requiera HTTPS
      sameSite: "None", // "None" para permitir sitios cruzados
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "None",
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "Login exitoso" });
  } catch (err) {
    console.error("🔥 Error en loginUsuario:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const refreshToken = (req, res) => {
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
      secure: false,
      sameSite: "None",
      maxAge: 15 * 60 * 1000,
    });
    return res.status(200).json({ message: "Access token renovado" });
  } catch (error) {
    console.error("Error al refrescar el token:", error);
    return res.status(403).json({ error: "Refresh token inválido o expirado" });
  }
};

export { registrarUsuario, loginUsuario, refreshToken };
