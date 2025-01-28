const cuentaProyectoModel = require("../models/cuentaProyecto");

const getCuentasProyecto = (req, res) => {
  cuentaProyectoModel.getAllCuentasProyecto((err, results) => {
    if (err)
      return res.status(500).send("Error al obtener las cuentas del proyecto");
    res.status(200).json(results);
  });
};

const addCuentaProyecto = (req, res) => {
  const newCuentaProyecto = req.body;
  cuentaProyectoModel.addCuentaProyecto(newCuentaProyecto, (err, results) => {
    if (err)
      return res.status(500).send("Error al agregar la cuenta del proyecto");
    res.status(201).send("Cuenta del proyecto agregada");
  });
};

module.exports = { getCuentasProyecto, addCuentaProyecto };
