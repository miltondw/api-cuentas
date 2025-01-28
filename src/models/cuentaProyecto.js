const db = require("../config/db");

const getAllCuentasProyecto = (callback) => {
  db.query("SELECT * FROM cuenta_del_proyecto", (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};

const addCuentaProyecto = (data, callback) => {
  const {
    fecha,
    solicitante,
    nombreProyecto,
    obrero,
    costoServicio,
    abono,
    gastoCamioneta,
    peajes,
  } = data;
  db.query(
    "INSERT INTO cuenta_del_proyecto (fecha, solicitante, nombreProyecto, obrero, costoServicio, abono, gastoCamioneta, peajes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      fecha,
      solicitante,
      nombreProyecto,
      obrero,
      costoServicio,
      abono,
      gastoCamioneta,
      peajes,
    ],
    (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    }
  );
};

module.exports = { getAllCuentasProyecto, addCuentaProyecto };
