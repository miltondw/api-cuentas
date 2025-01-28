import db from "../config/db.js";

// Obtener todas las cuentas del proyecto
const getAllCuentasProyecto = (callback) => {
  db.query("SELECT * FROM cuenta_del_proyecto", (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};

// Obtener una cuenta del proyecto por ID
const getCuentaProyectoById = (id, callback) => {
  db.query(
    "SELECT * FROM cuenta_del_proyecto WHERE id = ?",
    [id],
    (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]); // Retorna solo el primer resultado
    }
  );
};

// Crear una nueva cuenta del proyecto
const createCuentaProyecto = (data, callback) => {
  const {
    fecha,
    solicitante,
    nombreProyecto,
    obrero,
    costoServicio,
    abono,
    gastoCamioneta,
    gastosCampo,
    pagoObreros,
    comidas,
    transporte,
    gastosVarios,
    peajes,
    combustible,
    hospedaje,
  } = data;

  db.query(
    `INSERT INTO cuenta_del_proyecto 
    (fecha, solicitante, nombreProyecto, obrero, costoServicio, abono, gastoCamioneta, gastosCampo, pagoObreros, comidas, transporte, gastosVarios, peajes, combustible, hospedaje)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      fecha,
      solicitante,
      nombreProyecto,
      obrero,
      costoServicio,
      abono,
      gastoCamioneta,
      gastosCampo,
      pagoObreros,
      comidas,
      transporte,
      gastosVarios,
      peajes,
      combustible,
      hospedaje,
    ],
    (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    }
  );
};

// Actualizar una cuenta del proyecto por ID
const updateCuentaProyecto = (id, data, callback) => {
  const {
    fecha,
    solicitante,
    nombreProyecto,
    obrero,
    costoServicio,
    abono,
    gastoCamioneta,
    gastosCampo,
    pagoObreros,
    comidas,
    transporte,
    gastosVarios,
    peajes,
    combustible,
    hospedaje,
  } = data;

  db.query(
    `UPDATE cuenta_del_proyecto SET 
    fecha = ?, solicitante = ?, nombreProyecto = ?, obrero = ?, costoServicio = ?, abono = ?, gastoCamioneta = ?, gastosCampo = ?, pagoObreros = ?, comidas = ?, transporte = ?, gastosVarios = ?, peajes = ?, combustible = ?, hospedaje = ?
    WHERE id = ?`,
    [
      fecha,
      solicitante,
      nombreProyecto,
      obrero,
      costoServicio,
      abono,
      gastoCamioneta,
      gastosCampo,
      pagoObreros,
      comidas,
      transporte,
      gastosVarios,
      peajes,
      combustible,
      hospedaje,
      id,
    ],
    (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    }
  );
};

// Eliminar una cuenta del proyecto por ID
const deleteCuentaProyecto = (id, callback) => {
  db.query(
    "DELETE FROM cuenta_del_proyecto WHERE id = ?",
    [id],
    (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    }
  );
};

export {
  getAllCuentasProyecto,
  getCuentaProyectoById,
  createCuentaProyecto,
  updateCuentaProyecto,
  deleteCuentaProyecto,
};
