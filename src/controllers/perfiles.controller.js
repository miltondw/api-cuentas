// profiles.controller.js
import {
  obtenerPerfilesPorProyecto,
  obtenerPerfil,
  crearPerfil,
  actualizarPerfil,
  eliminarPerfil,
} from "../models/profiles.model.js";

const handleError = (res, error, message = "Error en el servidor") => {
  console.error(message, error);
  res.status(500).json({ success: false, message: error.message });
};

/**
 * Obtiene todos los perfiles de un proyecto.
 */
export const getPerfilesPorProyecto = async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await obtenerPerfilesPorProyecto(projectId);
    res.json(result);
  } catch (error) {
    handleError(res, error, "Error al obtener perfiles");
  }
};

/**
 * Obtiene un perfil específico.
 */
export const getPerfil = async (req, res) => {
  try {
    const { projectId, profileId } = req.params;
    const result = await obtenerPerfil(projectId, profileId);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    handleError(res, error, "Error al obtener perfil");
  }
};

/**
 * Crea un nuevo perfil.
 */
export const postPerfil = async (req, res) => {
  try {
    const { projectId } = req.params;
    const profileData = { ...req.body, project_id: projectId };
    const result = await crearPerfil(profileData);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error, "Error al crear perfil");
  }
};

/**
 * Actualiza un perfil existente.
 */
export const putPerfil = async (req, res) => {
  try {
    const { projectId, profileId } = req.params;
    const result = await actualizarPerfil(projectId, profileId, req.body);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    handleError(res, error, "Error al actualizar perfil");
  }
};

/**
 * Elimina un perfil.
 */
export const deletePerfil = async (req, res) => {
  try {
    const { projectId, profileId } = req.params;
    const result = await eliminarPerfil(projectId, profileId);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    handleError(res, error, "Error al eliminar perfil");
  }
};
