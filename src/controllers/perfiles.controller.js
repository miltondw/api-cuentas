// profiles.controller.js
import {
  obtenerPerfilesPorProyecto,
  obtenerPerfil,
  crearPerfil,
  actualizarPerfil,
  eliminarPerfil,
} from "../models/profiles.model.js";

/**
 * Maneja errores en las respuestas HTTP
 * @param {object} res - Objeto de respuesta
 * @param {Error} error - Error capturado
 * @param {string} message - Mensaje descriptivo
 * @param {number} status - Código de estado HTTP (predeterminado: 500)
 */
const handleError = (res, error, message = "Error en el servidor", status = 500) => {
  console.error(`${message}: ${error.message}`);
  
  // Determinar el código de estado según el tipo de error
  let statusCode = status;
  if (error.message.includes("obligatorio") || 
      error.message.includes("válido") ||
      error.message.includes("Ya existe")) {
    statusCode = 400; // Bad Request
  } else if (error.message.includes("no encontrado")) {
    statusCode = 404; // Not Found
  }
  
  // Construir respuesta de error
  const errorResponse = { 
    success: false, 
    message: error.message 
  };
  
  // Agregar código de error si existe
  if (error.code) {
    errorResponse.error_code = error.code;
  }
  
  res.status(statusCode).json(errorResponse);
};

/**
 * Valida que un parámetro sea numérico
 * @param {string} value - Valor a validar
 * @returns {boolean|Error} - true si es válido o lanza error
 */
const validarParametroNumerico = (value, nombre) => {
  if (!value || isNaN(parseInt(value))) {
    throw new Error(`El parámetro ${nombre} debe ser un número válido`);
  }
  return true;
};

/**
 * Obtiene todos los perfiles de un proyecto.
 */
export const getPerfilesPorProyecto = async (req, res) => {
  try {
    const { projectId } = req.params;
    validarParametroNumerico(projectId, 'projectId');
    
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
    validarParametroNumerico(projectId, 'projectId');
    validarParametroNumerico(profileId, 'profileId');
    
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
    validarParametroNumerico(projectId, 'projectId');
    
    // Verificar que hay datos en el cuerpo de la petición
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron datos para crear el perfil"
      });
    }
    
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
    validarParametroNumerico(projectId, 'projectId');
    validarParametroNumerico(profileId, 'profileId');
    
    // Verificar que hay datos para actualizar
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron datos para actualizar el perfil"
      });
    }
    
    const result = await actualizarPerfil(projectId, profileId, req.body);
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
    validarParametroNumerico(projectId, 'projectId');
    validarParametroNumerico(profileId, 'profileId');
    
    const result = await eliminarPerfil(projectId, profileId);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    handleError(res, error, "Error al eliminar perfil");
  }
};
