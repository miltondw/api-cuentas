import db from "../config/db.js";

// Crear un nuevo usuario
const createUsuario = (data, callback) => {
  const { name, email, password } = data;

  const query = "INSERT INTO usuarios (name, email, password) VALUES (?, ?, ?)";
  db.query(query, [name, email, password], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};

// Obtener un usuario por email
const getUsuarioByEmail = (email, callback) => {
  db.query(
    "SELECT * FROM usuarios WHERE email = ?",
    [email],
    (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    }
  );
};

export { createUsuario, getUsuarioByEmail };
