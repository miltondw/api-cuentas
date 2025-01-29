import db from "../config/db.js";

// Crear un nuevo usuario
const createUsuario = async (data) => {
  const { name, email, password } = data;

  try {
    const [results] = await db.query(
      "INSERT INTO usuarios (name, email, password) VALUES (?, ?, ?)",
      [name, email, password]
    );

    return results; // Retorna el resultado de la inserción
    // Si necesitas el ID insertado: return results.insertId;
  } catch (err) {
    console.error("Error en createUsuario:", err);
    throw err; // Propaga el error para manejarlo en el controlador
  }
};
// Obtener un usuario por email
const getUsuarioByEmail = async (email) => {
  try {
    const [results] = await db.query("SELECT * FROM usuarios WHERE email = ?", [
      email,
    ]);
    return results[0] || null; // Retorna el usuario o null
  } catch (err) {
    console.error("❌ Error en getUsuarioByEmail:", err);
    throw err; // Propaga el error para manejarlo en el controlador
  }
};

export { createUsuario, getUsuarioByEmail };
