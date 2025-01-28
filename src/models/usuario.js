import db from "../config/db.js";

// Crear un nuevo usuario
const createUsuario = (data) => {
  const { name, email, password } = data;

  const query = "INSERT INTO usuarios (name, email, password) VALUES (?, ?, ?)";
  return new Promise((resolve, reject) => {
    db.query(query, [name, email, password], (err, results) => {
      if (err) return reject(err); // Rechazar la promesa si hay error
      resolve(results); // Resolver la promesa con los resultados
    });
  });
};

// Obtener un usuario por email
const getUsuarioByEmail = (email) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM usuarios WHERE email = ?",
      [email],
      (err, results) => {
        if (err) return reject(err); // Rechazar la promesa si hay error
        resolve(results[0]); // Resolver la promesa con el primer resultado
      }
    );
  });
};

export { createUsuario, getUsuarioByEmail };
