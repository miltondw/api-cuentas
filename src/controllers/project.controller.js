import {
  getAllProyectos,
  getProyectoById,
  abonar,
  createProyecto,
  updateProyecto,
  deleteProyecto,
} from "../models/projects.model.js";
import { getGastosByProyectoId } from "../models/gastosProjects.model.js";
import { handleError } from "../middleware/errorHandler.js";

// Controlador de Proyectos
export const obtenerProyectos = async (req, res) => {
  try {
    const proyectos = await getAllProyectos();
    res.json({ success: true, data: proyectos });
  } catch (error) {
    handleError(res, error, "Error al obtener proyectos");
  }
};

export const obtenerProyecto = async (req, res) => {
  try {
    const proyecto = await getProyectoById(req.params.id);
    if (!proyecto)
      return res
        .status(404)
        .json({ success: false, message: "Proyecto no encontrado" });

    const gastos = await getGastosByProyectoId(req.params.id);
    res.json({ success: true, data: { ...proyecto, gastos } });
  } catch (error) {
    handleError(res, error, "Error al obtener proyecto");
  }
};

export const crearProyecto = async (req, res) => {
  try {
    const result = await createProyecto(req.body);
    res.status(201).json({
      success: true,
      data: { id: result.insertId, ...req.body },
      message: "Proyecto creado",
    });
  } catch (error) {
    handleError(res, error, "Error al crear proyecto");
  }
};

export const actualizarProyecto = async (req, res) => {
  try {
    const result = await updateProyecto(req.params.id, req.body);
    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Proyecto no encontrado" });
    res.json({ success: true, message: "Proyecto actualizado" });
  } catch (error) {
    handleError(res, error, "Error al actualizar proyecto");
  }
};

export const eliminarProyecto = async (req, res) => {
  try {
    await deleteGastoProyecto(req.params.id); // Eliminar gastos asociados primero
    const result = await deleteProyecto(req.params.id);
    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Proyecto no encontrado" });
    res.json({ success: true, message: "Proyecto y sus gastos eliminados" });
  } catch (error) {
    handleError(res, error, "Error al eliminar proyecto");
  }
};

export const abonarProyecto = async (req, res) => {
  try {
    const { abono } = req.body;
    if (abono === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "El abono es requerido" });
    }

    const result = await abonar(req.params.id, abono);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Proyecto no encontrado" });
    }

    res.json({ success: true, message: "Abono actualizado correctamente" });
  } catch (error) {
    handleError(res, error, "Error al abonar al proyecto");
  }
};
