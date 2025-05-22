import db from "../config/db.js";
import { generateRequestNumber } from "../utils/requestNumberGenerator.js";
import { getFirstResultFromQuery, getResultsFromQuery } from "../utils/dbUtils.js";

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
    !["pendiente", "en proceso", "completado", "cancelado"].includes(formData.status)
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
 * Obtiene todas las categorías y servicios disponibles
 * @returns {Array} - Lista de categorías con sus servicios
 */
export const getServicesModel = async () => {
  try {
    // Obtener categorías
    const categories = await executeQuery(
      "SELECT id, code, name AS category FROM service_categories"
    );
    console.log("Categorías recuperadas:", categories); // Depuración

    if (!categories || categories.length === 0) {
      throw new Error("No se encontraron categorías de servicios");
    }

    // Obtener servicios con campos adicionales
    const services = await executeQuery(
      `SELECT 
        s.id, s.code, s.name, s.category_id,
        saf.field_name AS field, saf.type, saf.required, saf.options, 
        saf.depends_on_field, saf.depends_on_value, saf.label
       FROM services s
       LEFT JOIN service_additional_fields saf ON s.id = saf.service_id`
    );
    console.log("Servicios recuperados:", services); // Depuración

    if (!services || services.length === 0) {
      console.warn("No se encontraron servicios, retornando categorías vacías");
    }

    // Organizar servicios por categoría
    const result = categories.map((category) => ({
      id: category.id,
      code: category.code,
      category: category.category,
      items: services
        .filter((service) => service.category_id === category.id)
        .reduce((acc, service) => {
          const existingService = acc.find((s) => s.id === service.id);
          const additionalInfo = service.field
            ? {
                field: service.field,
                type: service.type,
                label: service.label || service.field, // Usar field si label es null
                required: !!service.required,
                options: service.options
                  ? (() => {
                      try {
                        return service.options;
                      } catch {
                        console.warn(
                          `Opciones inválidas para ${service.field}`
                        );
                        return null;
                      }
                    })()
                  : null,
                dependsOn: service.depends_on_field
                  ? {
                      field: service.depends_on_field,
                      value: service.depends_on_value,
                    }
                  : null,
              }
            : null;

          if (existingService) {
            if (additionalInfo) {
              existingService.additionalInfo.push(additionalInfo);
            }
          } else {
            acc.push({
              id: service.id,
              code: service.code,
              name: service.name,
              additionalInfo: additionalInfo ? [additionalInfo] : [],
            });
          }
          return acc;
        }, []),
    }));

    return {
      success: true,
      services: result,
    };
  } catch (error) {
    console.error("Error al obtener servicios:", error);
    throw error;
  }
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
    // Generar número de solicitud único (formato: SLAB-AAAA-XXX)
    const requestNumber = await generateRequestNumber(async (query, params) => {
      const [results] = await connection.query(query, params);
      return results;
    });

    // Insertar solicitud
    const [requestResult] = await connection.query(
      `INSERT INTO service_requests (
        request_number, name, name_project, location, identification, phone, email, description, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        requestNumber,
        formData.name,
        formData.name_project,
        formData.location,
        formData.identification,
        formData.phone,
        formData.email,
        formData.description,
        formData.status || "pendiente",
      ]
    );

    const requestId = requestResult.insertId;    // Insertar servicios seleccionados
    for (const service of selectedServices) {
      // Verificar que el servicio existe
      const existingService = await getFirstResultFromQuery(
        connection,
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
        const validFields = await getResultsFromQuery(
          connection,
          "SELECT field_name, required, label, depends_on_field, depends_on_value FROM service_additional_fields WHERE service_id = ?",
          [existingService.id]
        );
        
        const validFieldNames = validFields.map((f) => f.field_name);

        // Validar dependencias condicionales
        for (const field of validFields) {
          if (field.depends_on_field) {
            const dependsOnValue = service.additionalInfo[field.depends_on_field];
            
            if (
              dependsOnValue &&
              field.depends_on_value &&
              dependsOnValue !== field.depends_on_value &&
              service.additionalInfo[field.field_name]
            ) {
              throw new Error(
                `El campo ${
                  field.label || field.field_name
                } solo es válido cuando ${field.depends_on_field} es ${
                  field.depends_on_value
                }`
              );
            }
          }
        }

        // Validar campos
        for (const fieldName of Object.keys(service.additionalInfo)) {
          if (!validFieldNames.includes(fieldName)) {
            throw new Error(
              `Campo no válido para ${service.item.code}: ${fieldName}`
            );
          }
          const field = validFields.find((f) => f.field_name === fieldName);
          if (field.required && !service.additionalInfo[fieldName]) {
            throw new Error(
              `El campo ${field.label || field.field_name} es requerido para ${
                service.item.code
              }`
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
        const additionalValues = Object.entries(service.additionalInfo)
          .filter(([_, value]) => value !== null && value !== "")
          .map(([field_name, field_value]) => [
            serviceResult.insertId,
            field_name,
            field_value,
          ]);

        if (additionalValues.length > 0) {
          await connection.query(
            `INSERT INTO service_additional_values (selected_service_id, field_name, field_value) VALUES ?`,
            [additionalValues]
          );
        }
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
export const getServiceRequestModel = async (id) => {  try {
    const [request] = await executeQuery(
      `SELECT id, request_number, name, name_project, location, identification, phone, email, description, status, created_at, updated_at
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
      item: {
        code: service.service_code,
        name: service.service_name,
      },
      quantity: service.quantity,
      additionalInfo: additionalInfo
        .filter((info) => info.selected_service_id === service.id)
        .reduce((acc, { field_name, field_value }) => {
          acc[field_name] = field_value;
          return acc;
        }, {}),
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

  validateServiceRequestData(formData);
  validateSelectedServices(selectedServices);

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
    const selectedServicesToDelete = await getResultsFromQuery(
      connection,
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
      const existingService = await getFirstResultFromQuery(
        connection,
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
        const validFields = await getResultsFromQuery(
          connection,
          "SELECT field_name, required, label, depends_on_field, depends_on_value FROM service_additional_fields WHERE service_id = ?",
          [existingService.id]
        );
        
        const validFieldNames = validFields.map((f) => f.field_name);

        // Validar dependencias condicionales
        for (const field of validFields) {
          if (field.depends_on_field) {
            const dependsOnValue = service.additionalInfo[field.depends_on_field];
            
            if (
              dependsOnValue &&
              field.depends_on_value &&
              dependsOnValue !== field.depends_on_value &&
              service.additionalInfo[field.field_name]
            ) {
              throw new Error(
                `El campo ${
                  field.label || field.field_name
                } solo es válido cuando ${field.depends_on_field} es ${
                  field.depends_on_value
                }`
              );
            }
          }
        }

        // Validar campos
        for (const fieldName of Object.keys(service.additionalInfo)) {
          if (!validFieldNames.includes(fieldName)) {
            throw new Error(
              `Campo no válido para ${service.item.code}: ${fieldName}`
            );
          }
          const field = validFields.find((f) => f.field_name === fieldName);
          if (field.required && !service.additionalInfo[fieldName]) {
            throw new Error(
              `El campo ${field.label || field.field_name} es requerido para ${
                service.item.code
              }`
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
        const additionalValues = Object.entries(service.additionalInfo)
          .filter(([_, value]) => value !== null && value !== "")
          .map(([field_name, field_value]) => [
            serviceResult.insertId,
            field_name,
            field_value,
          ]);

        if (additionalValues.length > 0) {
          await connection.query(
            `INSERT INTO service_additional_values (selected_service_id, field_name, field_value) VALUES ?`,
            [additionalValues]
          );
        }
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
    // Verificar el estado actual de la solicitud
    const [currentRequest] = await connection.query(
      "SELECT status FROM service_requests WHERE id = ?",
      [id]
    );

    if (!currentRequest || currentRequest.length === 0) {
      throw new Error("Solicitud no encontrada");
    }

    // Solo permitir eliminar solicitudes en estado "pendiente"
    if (currentRequest[0].status !== 'pendiente') {
      throw new Error("Solo se pueden eliminar solicitudes en estado pendiente");
    }

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
    let additionalInfo = [];    if (selectedServiceIds.length > 0) {
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
      item: {
        code: service.service_code,
        name: service.service_name,
      },
      quantity: service.quantity,
      additionalInfo: additionalInfo
        .filter((info) => info.selected_service_id === service.id)
        .reduce((acc, { field_name, field_value }) => {
          acc[field_name] = field_value;
          return acc;
        }, {}),
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
      `SELECT field_name, type, required, options, depends_on_field, depends_on_value, label
       FROM service_additional_fields
       WHERE service_id = ?`,
      [service.id]
    );

    console.log(`Campos recuperados para ${serviceCode}:`, fields); // Depuración

    const formattedFields = fields.map((field) => ({
      field: field.field_name,
      type: field.type,
      label: field.label || field.field_name, // Usar field_name si label es null
      required: !!field.required,
      options: field.options
        ? (() => {
            try {
              return field.options;
            } catch {
              console.warn(`Opciones inválidas para ${field.field_name}`);
              return null;
            }
          })()
        : null,
      dependsOn: field.depends_on_field
        ? {
            field: field.depends_on_field,
            value: field.depends_on_value,
          }
        : null,
    }));

    return {
      success: true,
      fields: formattedFields,
    };
  } catch (error) {
    console.error("Error al obtener campos adicionales:", error);
    throw error;
  }
};
