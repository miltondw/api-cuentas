import { validationResult, body } from "express-validator";
import {
  getAllCostosFijos,
  getCostoFijoById,
  addCostoFijo,
  updateCostoFijo,
  deleteCostoFijo,
} from "../models/costoFijo.js";

// Validación de datos de entrada para crear y actualizar costos fijos
const validateCostoFijo = [
  body("mes_de_gastos")
    .notEmpty()
    .withMessage("El mes de gastos es obligatorio"),
  body("pago_de_salarios")
    .isFloat({ gt: 0 })
    .withMessage("El pago de salarios debe ser un número mayor que 0"),
  body("pago_de_luz")
    .isFloat({ gt: 0 })
    .withMessage("El pago de luz debe ser un número mayor que 0"),
  body("pago_de_arriendo")
    .isFloat({ gt: 0 })
    .withMessage("El pago de arriendo debe ser un número mayor que 0"),
  body("pago_de_internet")
    .isFloat({ gt: 0 })
    .withMessage("El pago de internet debe ser un número mayor que 0"),
  body("pago_de_salud")
    .isFloat({ gt: 0 })
    .withMessage("El pago de salud debe ser un número mayor que 0"),
];

// Manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Crear un nuevo costo fijo
const createCostoFijo = [
  validateCostoFijo,
  handleValidationErrors,
  async (req, res) => {
    const {
      mes_de_gastos,
      pago_de_salarios,
      pago_de_luz,
      pago_de_arriendo,
      pago_de_internet,
      pago_de_salud,
    } = req.body;
    const newCostoFijo = {
      mes_de_gastos,
      pago_de_salarios,
      pago_de_luz,
      pago_de_arriendo,
      pago_de_internet,
      pago_de_salud,
    };

    try {
      const results = await addCostoFijo(newCostoFijo);
      res.status(201).json({
        message: "Costo fijo creado exitosamente",
        id: results.insertId,
      });
    } catch (err) {
      console.error(err); // Log del error
      res
        .status(500)
        .json({ message: "Error al insertar los datos", error: err.message });
    }
  },
];

// Obtener todos los costos fijos con paginación
const getCostosFijos = async (req, res) => {
  const { page = 1, limit = 10 } = req.query; // Por defecto la página es 1 y el límite es 10
  try {
    const costosFijos = await getAllCostosFijos(Number(page), Number(limit));
    res.json(costosFijos);
  } catch (err) {
    console.error(err); // Log del error
    res
      .status(500)
      .json({ message: "Error al obtener los datos", error: err.message });
  }
};

// Obtener un costo fijo específico por ID
const getCostoFijo = async (req, res) => {
  const { id } = req.params;
  try {
    const costoFijo = await getCostoFijoById(id);
    if (!costoFijo) {
      return res.status(404).json({ message: "Costo fijo no encontrado" });
    }
    res.json(costoFijo);
  } catch (err) {
    console.error(err); // Log del error
    res
      .status(500)
      .json({ message: "Error al obtener el costo fijo", error: err.message });
  }
};

// Actualizar un costo fijo específico por ID
const updateCostoFijoController = [
  validateCostoFijo,
  handleValidationErrors,
  async (req, res) => {
    const { id } = req.params;
    const {
      mes_de_gastos,
      pago_de_salarios,
      pago_de_luz,
      pago_de_arriendo,
      pago_de_internet,
      pago_de_salud,
    } = req.body;
    const updatedCostoFijo = {
      mes_de_gastos,
      pago_de_salarios,
      pago_de_luz,
      pago_de_arriendo,
      pago_de_internet,
      pago_de_salud,
    };

    try {
      const results = await updateCostoFijo(id, updatedCostoFijo);
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Costo fijo no encontrado" });
      }
      res.json({ message: "Costo fijo actualizado exitosamente" });
    } catch (err) {
      console.error(err); // Log del error
      res.status(500).json({
        message: "Error al actualizar el costo fijo",
        error: err.message,
      });
    }
  },
];

// Eliminar un costo fijo por ID
const deleteCostoFijoController = async (req, res) => {
  const { id } = req.params;
  try {
    const results = await deleteCostoFijo(id);
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Costo fijo no encontrado" });
    }
    res.json({ message: "Costo fijo eliminado exitosamente" });
  } catch (err) {
    console.error(err); // Log del error
    res
      .status(500)
      .json({ message: "Error al eliminar el costo fijo", error: err.message });
  }
};

export {
  createCostoFijo,
  getCostosFijos,
  getCostoFijo,
  updateCostoFijoController,
  deleteCostoFijoController,
};
