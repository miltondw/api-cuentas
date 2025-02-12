import {
  getAllProyectos,
  getProyectoById,
  abonar,
  createProyecto,
  updateProyecto,
  deleteProyecto,
} from "../models/projects.model.js";
import {
  getGastosByProyectoId,
  deleteGastosByProyectoId,
} from "../models/gastosProjects.model.js";
import { handleError } from "../middleware/errorHandler.js";

// Controlador para obtener todos los proyectos
export const obtenerProyectos = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const proyectos = await getAllProyectos(page, limit);
    res.json({ success: true, data: proyectos });
  } catch (error) {
    handleError(res, error, "Error al obtener proyectos");
  }
};

// Controlador para obtener un proyecto por ID
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

// Controlador para crear un proyecto
export const crearProyecto = async (req, res) => {
  try {
    const result = await createProyecto(req.body);
    res.status(201).json({
      success: true,
      data: { id: result.proyectoId, ...req.body },
      message: "Proyecto creado",
    });
  } catch (error) {
    handleError(res, error, "Error al crear proyecto");
  }
};

// Controlador para actualizar un proyecto
export const actualizarProyecto = async (req, res) => {
  try {
    const result = await updateProyecto(req.params.id, req.body);
    res.json({ success: true, message: "Proyecto actualizado" });
  } catch (error) {
    handleError(res, error, "Error al actualizar proyecto");
  }
};

// Controlador para eliminar un proyecto y sus gastos asociados
export const eliminarProyecto = async (req, res) => {
  try {
    // Eliminar primero todos los gastos asociados al proyecto
    await deleteGastosByProyectoId(req.params.id);
    // Luego eliminar el proyecto
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

// Controlador para abonar a un proyecto
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
