import {
  obtenerProyectos,
  crearProyecto,
  obtenerProyecto,
  actualizarProyecto,
  abonarProyecto,
  eliminarProyecto,
} from "../models/projects.model.js";

const handleError = (res, error, message = "Error en el servidor") => {
  console.error(message, error);
  res.status(500).json({ success: false, message: error.message });
};

/**
 * Obtiene todos los proyectos.
 */
export const getProyectos = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await obtenerProyectos(page, limit);
    res.json(result);
  } catch (error) {
    handleError(res, error, "Error al obtener proyectos");
  }
};

/**
 * Crea un nuevo proyecto.
 */
export const postProyecto = async (req, res) => {
  try {
    const result = await crearProyecto(req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error, "Error al crear proyecto");
  }
};

/**
 * Obtiene un proyecto por su ID.
 */
export const getProyectoById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await obtenerProyecto(id);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    handleError(res, error, "Error al obtener proyecto");
  }
};

/**
 * Actualiza un proyecto.
 */
export const putProyecto = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await actualizarProyecto(id, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error, "Error al actualizar proyecto");
  }
};

/**
 * Abona a un proyecto.
 */
export const patchAbonarProyecto = async (req, res) => {
  try {
    const { id } = req.params;
    const { abono } = req.body;
    const result = await abonarProyecto(id, abono);
    res.json(result);
  } catch (error) {
    handleError(res, error, "Error al abonar al proyecto");
  }
};

/**
 * Elimina un proyecto.
 */
export const deleteProyecto = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await eliminarProyecto(id);
    res.json(result);
  } catch (error) {
    handleError(res, error, "Error al eliminar proyecto");
  }
};
