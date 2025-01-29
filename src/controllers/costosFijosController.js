// controllers/costoFijoController.js
import { validationResult, body } from "express-validator";
import {
  getAllCostosFijos,
  getCostoFijoById,
  addCostoFijo,
  updateCostoFijo,
  deleteCostoFijo,
  getTotalCostosFijos,
} from "../models/costoFijo.js";
import { handleError } from "../middleware/errorHandler.js";

// Configuración de validación reutilizable
const validateDecimal = (field, min = 0.01) => [
  body(field)
    .isFloat({ min })
    .toFloat()
    .withMessage(`Debe ser un número mayor o igual a ${min}`),
];

const validateDate = body("mes_de_gastos")
  .isISO8601()
  .toDate()
  .withMessage("Formato de fecha inválido (YYYY-MM-DD)");

// Middleware de validación centralizado
const validateCostoFijo = [
  validateDate,
  ...validateDecimal("pago_de_salarios"),
  ...validateDecimal("pago_de_luz"),
  ...validateDecimal("pago_de_arriendo"),
  ...validateDecimal("pago_de_internet"),
  ...validateDecimal("pago_de_salud"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          type: "VALIDATION_ERROR",
          details: errors.array().map((err) => ({
            field: err.param,
            message: err.msg,
          })),
        },
      });
    }
    next();
  },
];

// Operaciones CRUD
const createCostoFijo = [
  validateCostoFijo,
  async (req, res) => {
    try {
      const result = await addCostoFijo(req.body);
      res.status(201).json({
        success: true,
        data: {
          id: result.insertId,
          ...req.body,
        },
        message: "Costo fijo creado exitosamente",
      });
    } catch (error) {
      handleError(res, error, "Error al crear costo fijo");
    }
  },
];

const getCostosFijos = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const [data, total] = await Promise.all([
      getAllCostosFijos(Number(page), Number(limit)),
      getTotalCostosFijos(),
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total, // Ahora es un número directo
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    handleError(res, error, "Error al obtener costos fijos");
  }
};

const getCostoFijo = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getCostoFijoById(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Costo fijo no encontrado",
      });
    }

    res.json({
      success: true,
      data: {
        ...data,
        mes_de_gastos: data.mes_de_gastos.toISOString().split("T")[0], // Formato YYYY-MM-DD
      },
    });
  } catch (error) {
    handleError(res, error, "Error al obtener costo fijo");
  }
};

const updateCostoFijoController = [
  validateCostoFijo,
  async (req, res) => {
    try {
      const { id } = req.params;
      const result = await updateCostoFijo(id, req.body);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Costo fijo no encontrado",
        });
      }

      res.json({
        success: true,
        data: { id, ...req.body },
        message: "Costo fijo actualizado exitosamente",
      });
    } catch (error) {
      handleError(res, error, "Error al actualizar costo fijo");
    }
  },
];

const deleteCostoFijoController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteCostoFijo(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Costo fijo no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Costo fijo eliminado exitosamente",
      deletedId: id,
    });
  } catch (error) {
    handleError(res, error, "Error al eliminar costo fijo");
  }
};

export {
  createCostoFijo,
  getCostosFijos,
  getCostoFijo,
  updateCostoFijoController,
  deleteCostoFijoController,
};
