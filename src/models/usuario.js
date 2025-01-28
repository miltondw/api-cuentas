import db from "../config/db.js";

// Crear un nuevo usuario
<<<<<<< HEAD
const createUsuario = (data) => {
  const { name, email, password } = data;

  const query = "INSERT INTO usuarios (name, email, password) VALUES (?, ?, ?)";
  return new Promise((resolve, reject) => {
    db.query(query, [name, email, password], (err, results) => {
      if (err) return reject(err); // Rechazar la promesa si hay error
      resolve(results); // Resolver la promesa con los resultados
    });
=======
const createUsuario = (data, callback) => {
  const { name, email, password } = data;

  const query = "INSERT INTO usuarios (name, email, password) VALUES (?, ?, ?)";
  db.query(query, [name, email, password], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
>>>>>>> a6a652929535e95280c5d297be89a0e5300c5d62
  });
};

// Obtener un usuario por email
<<<<<<< HEAD
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
=======
const getUsuarioByEmail = (email, callback) => {
  db.query(
    "SELECT * FROM usuarios WHERE email = ?",
    [email],
    (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    }
  );
>>>>>>> a6a652929535e95280c5d297be89a0e5300c5d62
};

export { createUsuario, getUsuarioByEmail };
