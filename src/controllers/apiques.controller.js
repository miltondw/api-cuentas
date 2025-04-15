import {
  obtenerApiquesPorProyecto,
  obtenerApique,
  crearApique,
  actualizarApique,
  eliminarApique,
} from "../models/apiques.model.js";

const handleError = (
  res,
  error,
  message = "Error en el servidor",
  status = 500
) => {
  console.error(`${message}: ${error.message}`);

  let statusCode = status;
  if (
    error.message.includes("obligatorio") ||
    error.message.includes("válido") ||
    error.message.includes("Ya existe")
  ) {
    statusCode = 400;
  } else if (error.message.includes("no encontrado")) {
    statusCode = 404;
  }

  res.status(statusCode).json({
    success: false,
    message: error.message,
    ...(error.code && { error_code: error.code }),
  });
};

const validarParametro = (value, nombre) => {
  if (!value) {
    throw new Error(`El parámetro ${nombre} es obligatorio`);
  }
};

export const getApiquesPorProyecto = async (req, res) => {
  try {
    const { projectId } = req.params;
    validarParametro(projectId, "projectId");

    const result = await obtenerApiquesPorProyecto(projectId);
    res.json(result);
  } catch (error) {
    handleError(res, error, "Error al obtener apiques");
  }
};

export const getApique = async (req, res) => {
  try {
    const { projectId, apiqueId } = req.params;
    validarParametro(projectId, "projectId");
    validarParametro(apiqueId, "apiqueId");

    const result = await obtenerApique(projectId, apiqueId);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    handleError(res, error, "Error al obtener apique");
  }
};

export const postApique = async (req, res) => {
  try {
    const { projectId } = req.params;
    validarParametro(projectId, "projectId");

    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Datos del apique requeridos",
      });
    }

    const result = await crearApique({
      ...req.body,
      project_id: projectId,
    });

    res.status(201).json(result);
  } catch (error) {
    handleError(res, error, "Error al crear apique");
  }
};

export const putApique = async (req, res) => {
  try {
    const { projectId, apiqueId } = req.params;
    validarParametro(projectId, "projectId");
    validarParametro(apiqueId, "apiqueId");

    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Datos de actualización requeridos",
      });
    }

    const result = await actualizarApique(projectId, apiqueId, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error, "Error al actualizar apique");
  }
};

export const deleteApique = async (req, res) => {
  try {
    const { projectId, apiqueId } = req.params;
    validarParametro(projectId, "projectId");
    validarParametro(apiqueId, "apiqueId");

    const result = await eliminarApique(projectId, apiqueId);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    handleError(res, error, "Error al eliminar apique");
  }
};
