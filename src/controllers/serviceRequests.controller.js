import {
  createServiceRequestModel,
  getServiceRequestsModel,
  getServiceRequestModel,
  updateServiceRequestModel,
  deleteServiceRequestModel,
  getSelectedServicesModel,
  getServiceFieldsModel,
} from "../models/serviceRequests.model.js";

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
    error.message.includes("no encontrado")
  ) {
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message: error.message,
    ...(error.code && { error_code: error.code }),
  });
};

const validateParam = (value, name) => {
  if (!value) {
    throw new Error(`El parámetro ${name} es obligatorio`);
  }
};

export const createServiceRequest = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Datos de la solicitud requeridos",
      });
    }

    const result = await createServiceRequestModel(req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error, "Error al crear solicitud de servicio");
  }
};

export const getServiceRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await getServiceRequestsModel({
      page: parseInt(page),
      limit: parseInt(limit),
    });
    res.json(result);
  } catch (error) {
    handleError(res, error, "Error al obtener solicitudes");
  }
};

export const getServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    validateParam(id, "id");

    const result = await getServiceRequestModel(id);
    res.json(result);
  } catch (error) {
    handleError(res, error, "Error al obtener solicitud");
  }
};

export const updateServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    validateParam(id, "id");

    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Datos de actualización requeridos",
      });
    }

    const result = await updateServiceRequestModel(id, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error, "Error al actualizar solicitud");
  }
};

export const deleteServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    validateParam(id, "id");

    const result = await deleteServiceRequestModel(id);
    res.json(result);
  } catch (error) {
    handleError(res, error, "Error al eliminar solicitud");
  }
};

export const getSelectedServices = async (req, res) => {
  try {
    const { id } = req.params;
    validateParam(id, "id");

    const result = await getSelectedServicesModel(id);
    res.json(result);
  } catch (error) {
    handleError(res, error, "Error al obtener servicios seleccionados");
  }
};

export const getServiceFields = async (req, res) => {
  try {
    const { code } = req.params;
    validateParam(code, "code");

    const result = await getServiceFieldsModel(code);
    res.json(result);
  } catch (error) {
    handleError(res, error, "Error al obtener campos adicionales");
  }
};
