import {
  getAll,
  create,
  update,
  deleteEmpresa,
  getGastoById,
} from "../models/gastosDeLaEmpresa.model.js";
import { handleError } from "../middleware/errorHandler.js";

// Controlador para obtener todos los gastos de la empresa
export const obtenerGastosEmpresa = async (req, res) => {
  try {
    const gastos = await getAll();
    res.json({ success: true, data: gastos });
  } catch (error) {
    handleError(res, error, "Error al obtener los gastos de la empresa");
  }
};
// Controlador para obtener gasto de la empresa

export const obtenerGastoEmpresa = async (req, res) => {
  try {
    const gasto = await getGastoById(req.params.id);
    if (!gasto)
      return res
        .status(404)
        .json({ success: false, message: "Gasto no encontrado" });

    const gastos = await getGastosByProyectoId(req.params.id);
    res.json({ success: true, data: { ...gasto, gastos } });
  } catch (error) {
    handleError(res, error, "Error al obtener gasto");
  }
};
// Controlador para crear un nuevo gasto de empresa
export const crearGastoEmpresa = async (req, res) => {
  try {
    const result = await create(req.body);
    res.status(201).json({
      success: true,
      data: { id: result.insertId, ...req.body },
      message: "Gasto de empresa creado",
    });
  } catch (error) {
    handleError(res, error, "Error al crear gasto de empresa");
  }
};

// Controlador para actualizar un gasto de empresa
export const actualizarGastoEmpresa = async (req, res) => {
  try {
    const result = await update(req.params.id, req.body);
    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Gasto no encontrado" });
    res.json({ success: true, message: "Gasto de empresa actualizado" });
  } catch (error) {
    handleError(res, error, "Error al actualizar gasto de empresa");
  }
};

// Controlador para eliminar un gasto de empresa
export const eliminarGastoEmpresa = async (req, res) => {
  try {
    const result = await deleteEmpresa(req.params.id);
    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Gasto no encontrado" });
    res.json({ success: true, message: "Gasto de empresa eliminado" });
  } catch (error) {
    handleError(res, error, "Error al eliminar gasto de empresa");
  }
};
