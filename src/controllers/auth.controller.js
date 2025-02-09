import { createUsuario, getUsuarioByEmail } from "../models/usuario.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
// Registrar un nuevo usuario
const registrarUsuario = async (req, res) => {
  const { name, email, password, rol, jwt2 } = req.body;

  if (jwt2 !== process.env.JWT_SECRET_2) {
    return res.json({ error: "Error al registrar el usuario" });
  } else {
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
  }
};

// Iniciar sesión y generar el JWT
const loginUsuario = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await getUsuarioByEmail(email).catch((err) => {
      throw err; // Propaga el error para capturarlo en el bloque catch externo
    });

    if (!user) {
      console.log("Usuario no encontrado");
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Comparar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({ message: "Login exitoso", token });
  } catch (err) {
    console.error("🔥 Error en loginUsuario:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
export { registrarUsuario, loginUsuario };
