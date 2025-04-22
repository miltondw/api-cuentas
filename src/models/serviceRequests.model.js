import db from "../config/db.js";

const executeQuery = async (query, params = []) => {
  try {
    const [results] = await db.query(query, params);
    return results;
  } catch (error) {
    console.error(`Error en consulta SQL: ${query}`, error);
    const isProd = process.env.NODE_ENV === "production";
    const errorMsg = isProd
      ? `Error en la base de datos: ${error.code || "DB_ERROR"}`
      : `Error en la base de datos: ${error.message}`;
    const customError = new Error(errorMsg);
    customError.code = error.code;
    customError.sqlState = error.sqlState;
    throw customError;
  }
};

/**
 * Valida los datos de una solicitud de servicio
 * @param {Object} formData - Datos de la solicitud
 * @throws {Error} - Si los datos no son válidos
 */
const validateServiceRequestData = (formData) => {
  const {
    name,
    name_project,
    location,
    identification,
    phone,
    email,
    description,
  } = formData;

  if (!name) throw new Error("El nombre es obligatorio");
  if (!name_project) throw new Error("El nombre del proyecto es obligatorio");
  if (!location) throw new Error("La ubicación es obligatoria");
  if (!identification) throw new Error("La identificación es obligatoria");
  if (!phone) throw new Error("El teléfono es obligatorio");
  if (!email) throw new Error("El correo electrónico es obligatorio");
  if (!description) throw new Error("La descripción es obligatoria");

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("El correo electrónico no es válido");
  }

  if (
    formData.status &&
    !["pending", "approved", "rejected", "completed"].includes(formData.status)
  ) {
    throw new Error("Estado inválido");
  }
};

/**
 * Valida los servicios seleccionados
 * @param {Array} selectedServices - Lista de servicios seleccionados
 * @throws {Error} - Si los datos no son válidos
 */
const validateSelectedServices = (selectedServices) => {
  if (!Array.isArray(selectedServices) || selectedServices.length === 0) {
    throw new Error("Debe seleccionar al menos un servicio");
  }

  selectedServices.forEach((service, index) => {
    if (!service.item || !service.item.code) {
      throw new Error(`Código del servicio requerido en la posición ${index}`);
    }
    if (
      !service.quantity ||
      isNaN(parseInt(service.quantity)) ||
      parseInt(service.quantity) < 1
    ) {
      throw new Error(
        `Cantidad inválida para el servicio en la posición ${index}`
      );
    }
  });
};

/**
 * Crea una nueva solicitud de servicio
 * @param {Object} data - Datos de la solicitud (formData y selectedServices)
 * @returns {Object} - Resultado de la operación
 */
export const createServiceRequestModel = async (data) => {
  const { formData, selectedServices } = data;

  validateServiceRequestData(formData);
  validateSelectedServices(selectedServices);

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Insertar solicitud
    const [requestResult] = await connection.query(
      `INSERT INTO service_requests (
        name, name_project, location, identification, phone, email, description, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        formData.name,
        formData.name_project,
        formData.location,
        formData.identification,
        formData.phone,
        formData.email,
        formData.description,
        formData.status || "pending",
      ]
    );

    const requestId = requestResult.insertId;

    // Insertar servicios seleccionados
    for (const service of selectedServices) {
      // Verificar que el servicio existe
      const [existingService] = await connection.query(
        "SELECT id FROM services WHERE code = ?",
        [service.item.code]
      );

      if (!existingService) {
        throw new Error(
          `Servicio con código ${service.item.code} no encontrado`
        );
      }

      // Validar additionalInfo
      if (
        service.additionalInfo &&
        Object.keys(service.additionalInfo).length > 0
      ) {
        const [validFields] = await connection.query(
          "SELECT field_name FROM service_additional_fields WHERE service_id = ?",
          [existingService.id]
        );
        const validFieldNames = validFields.map((f) => f.field_name);
        for (const fieldName of Object.keys(service.additionalInfo)) {
          if (!validFieldNames.includes(fieldName)) {
            throw new Error(
              `Campo no válido para ${service.item.code}: ${fieldName}`
            );
          }
        }
      }

      // Insertar servicio seleccionado
      const [serviceResult] = await connection.query(
        `INSERT INTO selected_services (request_id, service_id, quantity) VALUES (?, ?, ?)`,
        [requestId, existingService.id, service.quantity]
      );

      // Insertar valores adicionales
      if (
        service.additionalInfo &&
        Object.keys(service.additionalInfo).length > 0
      ) {
        const additionalValues = Object.entries(service.additionalInfo).map(
          ([field_name, field_value]) => [
            serviceResult.insertId,
            field_name,
            field_value,
          ]
        );

        await connection.query(
          `INSERT INTO service_additional_values (selected_service_id, field_name, field_value) VALUES ?`,
          [additionalValues]
        );
      }
    }

    await connection.commit();
    return {
      success: true,
      request_id: requestId,
      message: "Solicitud de servicio creada exitosamente",
    };
  } catch (error) {
    await connection.rollback();
    console.error("Error al crear solicitud de servicio:", error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Obtiene todas las solicitudes de servicio con paginación
 * @param {Object} options - Opciones de paginación
 * @returns {Object} - Lista de solicitudes
 */
export const getServiceRequestsModel = async ({ page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;

  try {
    const requests = await executeQuery(
      `SELECT id, name, name_project, location, identification, phone, email, description, status, created_at, updated_at
       FROM service_requests
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [totalResult] = await executeQuery(
      "SELECT COUNT(*) as total FROM service_requests"
    );
    const total = totalResult.total;

    return {
      success: true,
      requests,
      total,
      page,
      limit,
    };
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    throw error;
  }
};

/**
 * Obtiene una solicitud de servicio específica
 * @param {number} id - ID de la solicitud
 * @returns {Object} - Detalles de la solicitud
 */
export const getServiceRequestModel = async (id) => {
  try {
    const [request] = await executeQuery(
      `SELECT id, name, name_project, location, identification, phone, email, description, status, created_at, updated_at
       FROM service_requests
       WHERE id = ?`,
      [id]
    );

    if (!request) {
      throw new Error("Solicitud no encontrada");
    }

    const selectedServices = await executeQuery(
      `SELECT ss.id, s.code as service_code, s.name as service_name, ss.quantity
       FROM selected_services ss
       JOIN services s ON ss.service_id = s.id
       WHERE ss.request_id = ?`,
      [id]
    );

    const selectedServiceIds = selectedServices.map((s) => s.id);
    let additionalInfo = [];
    if (selectedServiceIds.length > 0) {
      additionalInfo = await executeQuery(
        `SELECT selected_service_id, field_name, field_value
         FROM service_additional_values
         WHERE selected_service_id IN (${selectedServiceIds
           .map(() => "?")
           .join(", ")})`,
        selectedServiceIds
      );
    }

    const servicesWithAdditionalInfo = selectedServices.map((service) => ({
      ...service,
      additionalInfo: additionalInfo
        .filter((info) => info.selected_service_id === service.id)
        .map(({ field_name, field_value }) => ({ field_name, field_value })),
    }));

    return {
      success: true,
      request,
      selectedServices: servicesWithAdditionalInfo,
    };
  } catch (error) {
    console.error("Error al obtener solicitud:", error);
    throw error;
  }
};

/**
 * Actualiza una solicitud de servicio
 * @param {number} id - ID de la solicitud
 * @param {Object} data - Datos de la solicitud (formData y selectedServices)
 * @returns {Object} - Resultado de la operación
 */
export const updateServiceRequestModel = async (id, data) => {
  const { formData, selectedServices } = data;

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Verificar existencia
    const [existingRequest] = await connection.query(
      "SELECT id FROM service_requests WHERE id = ?",
      [id]
    );

    if (!existingRequest) {
      throw new Error("Solicitud no encontrada");
    }

    // Actualizar solicitud
    await connection.query(
      `UPDATE service_requests SET
        name = ?, name_project = ?, location = ?, identification = ?,
        phone = ?, email = ?, description = ?, status = ?
       WHERE id = ?`,
      [
        formData.name,
        formData.name_project,
        formData.location,
        formData.identification,
        formData.phone,
        formData.email,
        formData.description,
        formData.status || "pending",
        id,
      ]
    );

    // Eliminar servicios seleccionados y valores adicionales existentes
    const [selectedServicesToDelete] = await connection.query(
      "SELECT id FROM selected_services WHERE request_id = ?",
      [id]
    );
    const selectedServiceIds = selectedServicesToDelete.map((s) => s.id);

    if (selectedServiceIds.length > 0) {
      await connection.query(
        `DELETE FROM service_additional_values WHERE selected_service_id IN (${selectedServiceIds
          .map(() => "?")
          .join(", ")})`,
        selectedServiceIds
      );
    }
    await connection.query(
      "DELETE FROM selected_services WHERE request_id = ?",
      [id]
    );

    // Insertar nuevos servicios seleccionados
    for (const service of selectedServices) {
      const [existingService] = await connection.query(
        "SELECT id FROM services WHERE code = ?",
        [service.item.code]
      );

      if (!existingService) {
        throw new Error(
          `Servicio con código ${service.item.code} no encontrado`
        );
      }

      // Validar additionalInfo
      if (
        service.additionalInfo &&
        Object.keys(service.additionalInfo).length > 0
      ) {
        const [validFields] = await connection.query(
          "SELECT field_name FROM service_additional_fields WHERE service_id = ?",
          [existingService.id]
        );
        const validFieldNames = validFields.map((f) => f.field_name);
        for (const fieldName of Object.keys(service.additionalInfo)) {
          if (!validFieldNames.includes(fieldName)) {
            throw new Error(
              `Campo no válido para ${service.item.code}: ${fieldName}`
            );
          }
        }
      }

      // Insertar servicio seleccionado
      const [serviceResult] = await connection.query(
        `INSERT INTO selected_services (request_id, service_id, quantity) VALUES (?, ?, ?)`,
        [id, existingService.id, service.quantity]
      );

      // Insertar valores adicionales
      if (
        service.additionalInfo &&
        Object.keys(service.additionalInfo).length > 0
      ) {
        const additionalValues = Object.entries(service.additionalInfo).map(
          ([field_name, field_value]) => [
            serviceResult.insertId,
            field_name,
            field_value,
          ]
        );

        await connection.query(
          `INSERT INTO service_additional_values (selected_service_id, field_name, field_value) VALUES ?`,
          [additionalValues]
        );
      }
    }

    await connection.commit();
    return {
      success: true,
      message: "Solicitud de servicio actualizada exitosamente",
    };
  } catch (error) {
    await connection.rollback();
    console.error("Error al actualizar solicitud:", error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Elimina una solicitud de servicio
 * @param {number} id - ID de la solicitud
 * @returns {Object} - Resultado de la operación
 */
export const deleteServiceRequestModel = async (id) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const [result] = await connection.query(
      "DELETE FROM service_requests WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      throw new Error("Solicitud no encontrada");
    }

    await connection.commit();
    return {
      success: true,
      message: "Solicitud de servicio eliminada exitosamente",
    };
  } catch (error) {
    await connection.rollback();
    console.error("Error al eliminar solicitud:", error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Obtiene los servicios seleccionados de una solicitud
 * @param {number} requestId - ID de la solicitud
 * @returns {Object} - Lista de servicios seleccionados
 */
export const getSelectedServicesModel = async (requestId) => {
  try {
    const [request] = await executeQuery(
      "SELECT id FROM service_requests WHERE id = ?",
      [requestId]
    );

    if (!request) {
      throw new Error("Solicitud no encontrada");
    }

    const selectedServices = await executeQuery(
      `SELECT ss.id, s.code as service_code, s.name as service_name, ss.quantity
       FROM selected_services ss
       JOIN services s ON ss.service_id = s.id
       WHERE ss.request_id = ?`,
      [requestId]
    );

    const selectedServiceIds = selectedServices.map((s) => s.id);
    let additionalInfo = [];
    if (selectedServiceIds.length > 0) {
      additionalInfo = await executeQuery(
        `SELECT selected_service_id, field_name, field_value
         FROM service_additional_values
         WHERE selected_service_id IN (${selectedServiceIds
           .map(() => "?")
           .join(", ")})`,
        selectedServiceIds
      );
    }

    const servicesWithAdditionalInfo = selectedServices.map((service) => ({
      ...service,
      additionalInfo: additionalInfo
        .filter((info) => info.selected_service_id === service.id)
        .map(({ field_name, field_value }) => ({ field_name, field_value })),
    }));

    return {
      success: true,
      services: servicesWithAdditionalInfo,
    };
  } catch (error) {
    console.error("Error al obtener servicios seleccionados:", error);
    throw error;
  }
};

/**
 * Obtiene los campos adicionales de un servicio
 * @param {string} serviceCode - Código del servicio
 * @returns {Object} - Lista de campos adicionales
 */
export const getServiceFieldsModel = async (serviceCode) => {
  try {
    const [service] = await executeQuery(
      "SELECT id FROM services WHERE code = ?",
      [serviceCode]
    );

    if (!service) {
      throw new Error("Servicio no encontrado");
    }

    const fields = await executeQuery(
      "SELECT field_name FROM service_additional_fields WHERE service_id = ?",
      [service.id]
    );

    return {
      success: true,
      fields: fields.map((f) => f.field_name),
    };
  } catch (error) {
    console.error("Error al obtener campos adicionales:", error);
    throw error;
  }
};
