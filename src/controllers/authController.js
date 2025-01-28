import { createUsuario, getUsuarioByEmail } from "../models/usuario.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
// Registrar un nuevo usuario
const registrarUsuario = async (req, res) => {
  const { name, email, password, jwt2 } = req.body;

  if (jwt2 !== process.env.JWT_SECRET_2) {
    return res.json({ error: "Error al registrar el usuario" });
  } else {
    try {
      // Hashear la contraseña antes de guardarla
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = { name, email, password: hashedPassword };

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
    // Obtener usuario por email
    const user = await getUsuarioByEmail(email); // Usamos la promesa

    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    // Comparar la contraseña proporcionada con la almacenada
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: "Contraseña incorrecta" });

    // Crear el token JWT
    const payload = { id: user.id, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(200).json({ message: "Inicio de sesión exitoso", token });
  } catch (err) {
    console.error("Error en loginUsuario:", err); // Agregar un log detallado
    res
      .status(500)
      .json({ error: "Error al iniciar sesión", details: err.message || err });
  }
};

export { registrarUsuario, loginUsuario };
