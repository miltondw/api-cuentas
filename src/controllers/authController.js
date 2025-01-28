<<<<<<< HEAD
import { createUsuario, getUsuarioByEmail } from "../models/usuario.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
=======
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createUsuario, getUsuarioByEmail } from "../models/usuario.js";

>>>>>>> a6a652929535e95280c5d297be89a0e5300c5d62
// Registrar un nuevo usuario
const registrarUsuario = async (req, res) => {
  const { name, email, password, jwt2 } = req.body;

<<<<<<< HEAD
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
=======
  // Verificar el token de seguridad
  if (jwt2 !== process.env.JWT_SECRET_2) {
    return res.status(403).json({ error: "Acceso denegado: JWT incorrecto" });
  }

  try {
    // Hashear la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name,
      email,
      password: hashedPassword,
    };

    // Crear usuario
    const result = await createUsuario(newUser);

    // Enviar respuesta exitosa
    return res
      .status(201)
      .json({ message: "Usuario registrado exitosamente", user: result });
  } catch (err) {
    return res.status(500).json({ error: "Error al registrar el usuario" });
>>>>>>> a6a652929535e95280c5d297be89a0e5300c5d62
  }
};

// Iniciar sesión y generar el JWT
const loginUsuario = async (req, res) => {
  const { email, password } = req.body;

  try {
<<<<<<< HEAD
    // Obtener usuario por email
    const user = await getUsuarioByEmail(email); // Usamos la promesa

    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    // Comparar la contraseña proporcionada con la almacenada
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: "Contraseña incorrecta" });
=======
    // Obtener el usuario por email
    const user = await getUsuarioByEmail(email);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Comparar la contraseña proporcionada con la almacenada
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }
>>>>>>> a6a652929535e95280c5d297be89a0e5300c5d62

    // Crear el token JWT
    const payload = { id: user.id, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

<<<<<<< HEAD
    res.status(200).json({ message: "Inicio de sesión exitoso", token });
  } catch (err) {
    console.error("Error en loginUsuario:", err); // Agregar un log detallado
    res
      .status(500)
      .json({ error: "Error al iniciar sesión", details: err.message || err });
=======
    // Enviar respuesta exitosa
    return res.status(200).json({ message: "Inicio de sesión exitoso", token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al iniciar sesión" });
>>>>>>> a6a652929535e95280c5d297be89a0e5300c5d62
  }
};

export { registrarUsuario, loginUsuario };
