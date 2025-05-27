import {
  createServiceRequestModel,
  getServiceRequestsModel,
  getServiceRequestModel,
  updateServiceRequestModel,
  deleteServiceRequestModel,
  getSelectedServicesModel,
  getServiceFieldsModel,
  getServicesModel,
} from "../models/serviceRequests.model.js";
import { generateServiceRequestPDF } from "../utils/pdfGenerator.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Asegurar que existan los directorios necesarios
const ensureDirectoriesExist = () => {
  const pdfDir = path.join(__dirname, '..', '..', 'uploads', 'pdfs');
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }
  
  const assetsDir = path.join(__dirname, '..', '..', 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
};

ensureDirectoriesExist();

/**
 * Manejador centralizado de errores
 */
const handleError = (
  res,
  error,
  message = "Error en el servidor",
  status = 500
) => {
  console.error(`${message}: ${error.message}`, error.stack);

  let statusCode = status;
  if (error.message.includes("no encontrado")) {
    statusCode = 404; // Not Found
  } else if (
    error.message.includes("obligatorio") ||
    error.message.includes("válido") ||
    error.message.includes("requerido") ||
    error.code === "ER_DUP_ENTRY"
  ) {
    statusCode = 400; // Bad Request
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

export const getServices = async (req, res) => {
  try {
    console.log("Iniciando getServices..."); // Depuración
    const result = await getServicesModel();
    console.log("Resultado de getServicesModel:", result); // Depuración
    res.json(result);
  } catch (error) {
    handleError(res, error, "Error al obtener servicios");
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

    // Validar datos mínimos
    const { formData, selectedServices } = req.body;
    if (!formData || !selectedServices || !Array.isArray(selectedServices) || selectedServices.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Datos de formulario y servicios seleccionados son requeridos",
      });
    }

    // Crear solicitud
    const result = await createServiceRequestModel(req.body);    if (result.success && result.request_id) {
      try {
        // Obtener detalles completos para generar el PDF
        const requestDetails = await getServiceRequestModel(result.request_id);
        if (requestDetails.success) {
          // Determinar si usamos buffer o archivo basado en el entorno
          const useBuffer = process.env.NODE_ENV === 'production';
          
          if (useBuffer) {
            // En producción, no generamos el PDF ahora, lo haremos bajo demanda
            result.pdf = {
              generated: false,
              message: "El PDF será generado bajo demanda"
            };
          } else {
            // En desarrollo, generamos y guardamos el PDF
            const pdfPath = await generateServiceRequestPDF(
              requestDetails.request,
              requestDetails.selectedServices,
              false // No retornar buffer
            );
            
            // Añadir información del PDF a la respuesta
            result.pdf = {
              generated: true,
              path: pdfPath
            };
          }
        }
      } catch (pdfError) {
        console.error("Error generando PDF:", pdfError);
        // No fallamos la solicitud si el PDF falla, solo lo reportamos
        result.pdf = {
          generated: false,
          error: pdfError.message
        };
      }
    }

    res.status(201).json(result);
  } catch (error) {
    handleError(res, error, "Error al crear solicitud de servicio");
  }
};

export const getServiceRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const filters = {};
    
    // Aplicar filtros opcionales
    if (status) {
      filters.status = status;
    }
    
    if (search) {
      filters.search = search;
    }
    
    const result = await getServiceRequestsModel({
      page: parseInt(page),
      limit: parseInt(limit),
      filters
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

    // Validar estado permitido si se está actualizando
    if (req.body.formData && req.body.formData.status) {
      const validStatus = ['pendiente', 'en proceso', 'completado', 'cancelado'];
      if (!validStatus.includes(req.body.formData.status)) {
        return res.status(400).json({
          success: false,
          message: `Estado inválido. Valores permitidos: ${validStatus.join(', ')}`
        });
      }
    }

    const result = await updateServiceRequestModel(id, req.body);
      // Regenerar PDF si la actualización fue exitosa
    if (result.success) {
      try {
        const requestDetails = await getServiceRequestModel(id);
        if (requestDetails.success) {
          // Determinar si usamos buffer o archivo basado en el entorno
          const useBuffer = process.env.NODE_ENV === 'production';
          
          if (useBuffer) {
            // En producción, no generamos el PDF ahora, lo haremos bajo demanda
            result.pdf = {
              generated: false,
              message: "El PDF será generado bajo demanda"
            };
          } else {
            // En desarrollo, generamos y guardamos el PDF
            const pdfPath = await generateServiceRequestPDF(
              requestDetails.request,
              requestDetails.selectedServices,
              false // No retornar buffer
            );
            
            // Añadir información del PDF a la respuesta
            result.pdf = {
              generated: true,
              path: pdfPath
            };
          }
        }
      } catch (pdfError) {
        console.error("Error regenerando PDF:", pdfError);
        result.pdf = {
          generated: false,
          error: pdfError.message
        };
      }
    }
    
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

export const generateServiceRequestPdf = async (req, res) => {
  try {
    const { id } = req.params;
    validateParam(id, "id");

    // Obtener datos de la solicitud
    const requestDetails = await getServiceRequestModel(id);
    
    if (!requestDetails.success || !requestDetails.request) {
      return res.status(404).json({
        success: false,
        message: "Solicitud no encontrada"
      });
    }    // Variable para almacenar si debemos usar el buffer (para entornos como Render)
    // Esta variable puede ser controlada por una variable de entorno
    const useBuffer = process.env.NODE_ENV === 'production' || req.query.buffer === 'true';

    if (useBuffer) {
      // Generar PDF como buffer (opción 3)
      const pdfBuffer = await generateServiceRequestPDF(
        requestDetails.request,
        requestDetails.selectedServices,
        true // returnBuffer = true
      );

      // Configurar encabezados para la descarga del PDF
      const fileName = `Solicitud-${requestDetails.request.request_number || id}.pdf`;
      
      // Asegurar que el buffer es válido
      if (!Buffer.isBuffer(pdfBuffer)) {
        console.error('Error: El PDF generado no es un buffer válido:', typeof pdfBuffer);
        throw new Error('El PDF generado no es un buffer válido');
      }
      
      if (pdfBuffer.length === 0) {
        console.error('Error: El PDF generado está vacío');
        throw new Error('El PDF generado está vacío');
      }
      
      console.log(`Enviando PDF como buffer. Tamaño: ${pdfBuffer.length} bytes`);
      
      // Configurar encabezados HTTP correctos para archivo binario
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Accept-Ranges', 'bytes');
      
      // Enviar el buffer directamente como respuesta binaria
      res.write(pdfBuffer, 'binary');
      return res.end();
    } else {
      // Comportamiento anterior para entorno de desarrollo (guardar en disco)
      const pdfPath = await generateServiceRequestPDF(
        requestDetails.request,
        requestDetails.selectedServices,
        false // returnBuffer = false (comportamiento normal)
      );

      // Verificar que el archivo existe
      if (!fs.existsSync(pdfPath)) {
        return res.status(500).json({
          success: false,
          message: "Error al generar el PDF de la solicitud"
        });
      }

      // Enviar el archivo como respuesta para descarga
      const fileName = `Solicitud-${requestDetails.request.request_number || id}.pdf`;
      return res.download(pdfPath, fileName);
    }
  } catch (error) {
    handleError(res, error, "Error al generar PDF");
  }
};
