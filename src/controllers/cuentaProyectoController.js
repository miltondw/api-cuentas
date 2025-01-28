import {
  getAllCuentasProyecto,
  getCuentaProyectoById,
  createCuentaProyecto,
  updateCuentaProyecto,
  deleteCuentaProyecto,
} from "../models/cuentaProyecto.js";

// Obtener todas las cuentas del proyecto
const getCuentasProyecto = (req, res) => {
  getAllCuentasProyecto((err, results) => {
    if (err) return res.status(500).json({ error: "Error fetching data" });
    res.status(200).json(results);
  });
};

// Obtener una cuenta por ID
const getCuentaProyecto = (req, res) => {
  const { id } = req.params;
  getCuentaProyectoById(id, (err, result) => {
    if (err) return res.status(500).json({ error: "Error fetching data" });
    if (!result)
      return res.status(404).json({ message: "Cuenta no encontrada" });
    res.status(200).json(result);
  });
};

// Crear una nueva cuenta del proyecto
const createCuenta = (req, res) => {
  const data = req.body;
  createCuentaProyecto(data, (err, result) => {
    if (err) return res.status(500).json({ error: "Error creating data" });
    res
      .status(201)
      .json({ message: "Cuenta creada exitosamente", id: result.insertId });
  });
};

// Actualizar una cuenta por ID
const updateCuenta = (req, res) => {
  const { id } = req.params;
  const data = req.body;

  updateCuentaProyecto(id, data, (err, result) => {
    if (err) return res.status(500).json({ error: "Error updating data" });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Cuenta no encontrada" });
    res.status(200).json({ message: "Cuenta actualizada exitosamente" });
  });
};

// Eliminar una cuenta por ID
const deleteCuenta = (req, res) => {
  const { id } = req.params;
  deleteCuentaProyecto(id, (err, result) => {
    if (err) return res.status(500).json({ error: "Error deleting data" });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Cuenta no encontrada" });
    res.status(200).json({ message: "Cuenta eliminada exitosamente" });
  });
};

export {
  getCuentasProyecto,
  getCuentaProyecto,
  createCuenta,
  updateCuenta,
  deleteCuenta,
};
