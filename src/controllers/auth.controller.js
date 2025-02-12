import { createUsuario, getUsuarioByEmail } from "../models/usuario.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Registrar un nuevo usuario
const registrarUsuario = async (req, res) => {
  const { name, email, password, rol, jwt2 } = req.body;

  if (jwt2 !== process.env.JWT_SECRET_2) {
    return res.status(400).json({ error: "Error al registrar el usuario" });
  }
  try {
    // Hashear la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { name, email, password: hashedPassword, rol };

    // Crear el usuario
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

// Iniciar sesión y generar el JWT, enviándolo en una cookie httpOnly
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

    // Genera el access token (por ejemplo, de 15 minutos)
    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Genera el refresh token (por ejemplo, de 7 días)
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "14d" }
    );

    // Envía ambos tokens en cookies httpOnly
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", // o 'lax' según convenga
      maxAge: 15 * 60 * 1000, // 15 minutos
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    res.status(200).json({ message: "Login exitoso" });
  } catch (err) {
    console.error("🔥 Error en loginUsuario:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
// auth.controller.js (o en un archivo separado para refresh)
const refreshToken = (req, res) => {
  // Se asume que usas cookie-parser y, por tanto, req.cookies tiene las cookies.
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token no proporcionado" });
  }

  try {
    // Verifica el refresh token con su propio secreto
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    // Si es válido, genera un nuevo access token
    const newAccessToken = jwt.sign(
      { id: payload.id, email: payload.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Envía el nuevo access token en una cookie httpOnly
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutos
    });

    return res.status(200).json({ message: "Access token renovado" });
  } catch (error) {
    console.error("Error al refrescar el token:", error);
    return res.status(403).json({ error: "Refresh token inválido o expirado" });
  }
};

export { registrarUsuario, loginUsuario, refreshToken };
