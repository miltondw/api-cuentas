import { body, validationResult } from "express-validator";
import {
  getAllCuentasProyecto,
  getCuentaProyectoById,
  createCuentaProyecto,
  updateCuentaProyecto,
  deleteCuentaProyecto,
  getTotalCuentas,
  abonarProyecto,
} from "../models/cuentaProyecto.js";
import { handleError } from "../middleware/errorHandler.js";

// Validación avanzada
const validateCuentaProyecto = [
  body("fecha").isISO8601().toDate().withMessage("Fecha inválida (YYYY-MM-DD)"),
  body("solicitante")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Mínimo 3 caracteres"),
  body("nombreProyecto")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Mínimo 3 caracteres"),
  body("costoServicio")
    .isFloat({ min: 0 })
    .withMessage("Debe ser un número positivo"),
  body("abono").isFloat({ min: 0 }).withMessage("Debe ser un número positivo"),
  body("gastoCamioneta").isFloat({ min: 0 }).withMessage("Valor inválido"),
  body("gastosCampo").isFloat({ min: 0 }).withMessage("Valor inválido"),
  body("pagoObreros").isFloat({ min: 0 }).withMessage("Valor inválido"),
  body("comidas").isFloat({ min: 0 }).withMessage("Valor inválido"),
  body("transporte").isFloat({ min: 0 }).withMessage("Valor inválido"),
  body("gastosVarios").isFloat({ min: 0 }).withMessage("Valor inválido"),
  body("peajes").isFloat({ min: 0 }).withMessage("Valor inválido"),
  body("combustible").isFloat({ min: 0 }).withMessage("Valor inválido"),
  body("hospedaje").isFloat({ min: 0 }).withMessage("Valor inválido"),
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

const getCuentasProyecto = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const [data, total] = await Promise.all([
      getAllCuentasProyecto(page, limit),
      getTotalCuentas(),
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    handleError(res, error, "Error al obtener cuentas");
  }
};

const getCuentaProyecto = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getCuentaProyectoById(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Cuenta no encontrada",
      });
    }

    res.json({
      success: true,
      data: {
        ...data,
        fecha: data.fecha.toISOString().split("T")[0], // Formatear fecha
      },
    });
  } catch (error) {
    handleError(res, error, "Error al obtener cuenta");
  }
};
const abonarCuenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { abono } = req.body;

    // Validar que el abono sea un número positivo
    const abonoFloat = parseFloat(abono);
    if (isNaN(abonoFloat) || abonoFloat <= 0) {
      return res.status(400).json({
        success: false,
        message: "El abono debe ser un número positivo",
      });
    }

    // Obtener la cuenta antes de actualizar
    const cuenta = await getCuentaProyectoById(id);
    if (!cuenta) {
      return res.status(404).json({
        success: false,
        message: "Cuenta no encontrada",
      });
    }

    // Calcular el nuevo abono
    const nuevoAbono = parseFloat(cuenta.abono) + abonoFloat;

    // Actualizar la cuenta con el nuevo abono
    await abonarProyecto(id, nuevoAbono);

    res.json({
      success: true,
      message: "Abono realizado con éxito",
      data: { id, nuevoAbono },
    });
  } catch (error) {
    handleError(res, error, "Error al abonar a la cuenta");
  }
};

const createCuenta = [
  validateCuentaProyecto,
  async (req, res) => {
    try {
      const result = await createCuentaProyecto(req.body);
      res.status(201).json({
        success: true,
        data: { id: result.insertId, ...req.body },
        message: "Cuenta creada exitosamente",
      });
    } catch (error) {
      handleError(res, error, "Error al crear cuenta");
    }
  },
];

const updateCuenta = [
  validateCuentaProyecto,
  async (req, res) => {
    try {
      const { id } = req.params;
      const result = await updateCuentaProyecto(id, req.body);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Cuenta no encontrada",
        });
      }

      res.json({
        success: true,
        message: "Cuenta actualizada",
        data: { id, ...req.body },
      });
    } catch (error) {
      handleError(res, error, "Error al actualizar cuenta");
    }
  },
];

const deleteCuenta = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteCuentaProyecto(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Cuenta no encontrada",
      });
    }

    res.json({
      success: true,
      message: "Cuenta eliminada",
      deletedId: id,
    });
  } catch (error) {
    handleError(res, error, "Error al eliminar cuenta");
  }
};

export {
  getCuentasProyecto,
  getCuentaProyecto,
  createCuenta,
  updateCuenta,
  deleteCuenta,
  abonarCuenta,
};
