const costoFijoModel = require("../models/costoFijo");

const getCostosFijos = (req, res) => {
  costoFijoModel.getAllCostosFijos((err, results) => {
    if (err) return res.status(500).send("Error al obtener los costos fijos");
    res.status(200).json(results);
  });
};

const addCostoFijo = (req, res) => {
  const newCostoFijo = req.body;
  costoFijoModel.addCostoFijo(newCostoFijo, (err, results) => {
    if (err) return res.status(500).send("Error al agregar el costo fijo");
    res.status(201).send("Costo fijo agregado");
  });
};

module.exports = { getCostosFijos, addCostoFijo };
