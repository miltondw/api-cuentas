const db = require("../config/db");

const getAllCostosFijos = (callback) => {
  db.query("SELECT * FROM costos_fijos_del_mes", (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};

const addCostoFijo = (data, callback) => {
  const {
    mes_de_gastos,
    pago_de_salarios,
    pago_de_luz,
    pago_de_arriendo,
    pago_de_internet,
    pago_de_salud,
  } = data;
  db.query(
    "INSERT INTO costos_fijos_del_mes (mes_de_gastos, pago_de_salarios, pago_de_luz, pago_de_arriendo, pago_de_internet, pago_de_salud) VALUES (?, ?, ?, ?, ?, ?)",
    [
      mes_de_gastos,
      pago_de_salarios,
      pago_de_luz,
      pago_de_arriendo,
      pago_de_internet,
      pago_de_salud,
    ],
    (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    }
  );
};

module.exports = { getAllCostosFijos, addCostoFijo };
