import { validationResult, body } from "express-validator";
import {
  getAllCuentasProyecto,
  getCuentaProyectoById,
  createCuentaProyecto,
  updateCuentaProyecto,
  deleteCuentaProyecto,
} from "../models/cuentaProyecto.js";

// Validación de datos de entrada para crear y actualizar cuenta del proyecto
const validateCuentaProyecto = [
  body("fecha")
    .isDate()
    .withMessage("La fecha es obligatoria y debe ser válida"),
  body("solicitante").notEmpty().withMessage("El solicitante es obligatorio"),
  body("nombreProyecto")
    .notEmpty()
    .withMessage("El nombre del proyecto es obligatorio"),
  // Se pueden agregar validaciones adicionales para otros campos
];

// Manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Obtener todas las cuentas del proyecto
const getCuentasProyecto = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const cuentas = await getAllCuentasProyecto(Number(page), Number(limit));
    res.status(200).json(cuentas);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error al obtener las cuentas del proyecto",
      error: err.message,
    });
  }
};

// Obtener una cuenta del proyecto por ID
const getCuentaProyecto = async (req, res) => {
  const { id } = req.params;
  try {
    const cuenta = await getCuentaProyectoById(id);
    if (!cuenta) {
      return res.status(404).json({ message: "Cuenta no encontrada" });
    }
    res.status(200).json(cuenta);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error al obtener la cuenta del proyecto",
      error: err.message,
    });
  }
};

// Crear una nueva cuenta del proyecto
const createCuenta = [
  validateCuentaProyecto,
  handleValidationErrors,
  async (req, res) => {
    const data = req.body;
    try {
      const result = await createCuentaProyecto(data);
      res
        .status(201)
        .json({ message: "Cuenta creada exitosamente", id: result.insertId });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ message: "Error al crear la cuenta", error: err.message });
    }
  },
];

// Actualizar una cuenta del proyecto por ID
const updateCuenta = [
  validateCuentaProyecto,
  handleValidationErrors,
  async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    try {
      const result = await updateCuentaProyecto(id, data);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Cuenta no encontrada" });
      }
      res.status(200).json({ message: "Cuenta actualizada exitosamente" });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ message: "Error al actualizar la cuenta", error: err.message });
    }
  },
];

// Eliminar una cuenta del proyecto por ID
const deleteCuenta = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await deleteCuentaProyecto(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Cuenta no encontrada" });
    }
    res.status(200).json({ message: "Cuenta eliminada exitosamente" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error al eliminar la cuenta", error: err.message });
  }
};

export {
  getCuentasProyecto,
  getCuentaProyecto,
  createCuenta,
  updateCuenta,
  deleteCuenta,
};
