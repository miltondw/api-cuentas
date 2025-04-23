import express from "express";
import {
  createServiceRequest,
  getServiceRequests,
  getServiceRequest,
  updateServiceRequest,
  deleteServiceRequest,
  getSelectedServices,
  getServiceFields,
  getServices,
} from "../controllers/serviceRequests.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ServiceRequests
 *   description: Gestión de solicitudes de servicio
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ServiceRequest:
 *       type: object
 *       required:
 *         - formData
 *         - selectedServices
 *       properties:
 *         formData:
 *           type: object
 *           required:
 *             - name
 *             - name_project
 *             - location
 *             - identification
 *             - phone
 *             - email
 *             - description
 *           properties:
 *             name:
 *               type: string
 *             name_project:
 *               type: string
 *             location:
 *               type: string
 *             identification:
 *               type: string
 *             phone:
 *               type: string
 *             email:
 *               type: string
 *             description:
 *               type: string
 *             status:
 *               type: string
 *               enum: [pending, approved, rejected, completed]
 *               default: pending
 *         selectedServices:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - item
 *               - quantity
 *             properties:
 *               item:
 *                 type: object
 *                 required:
 *                   - code
 *                   - name
 *                 properties:
 *                   code:
 *                     type: string
 *                   name:
 *                     type: string
 *               quantity:
 *                 type: integer
 *               additionalInfo:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 */

/**
 * @swagger
 * /api/service-requests:
 *   post:
 *     summary: Crea una nueva solicitud de servicio
 *     tags: [ServiceRequests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceRequest'
 *     responses:
 *       201:
 *         description: Solicitud de servicio creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 request_id:
 *                   type: integer
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Servicio no encontrado
 */
router.post("/", createServiceRequest);

/**
 * @swagger
 * /api/service-requests:
 *   get:
 *     summary: Obtiene todas las solicitudes de servicio
 *     tags: [ServiceRequests]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de solicitudes por página
 *     responses:
 *       200:
 *         description: Lista de solicitudes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 requests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       name_project:
 *                         type: string
 *                       location:
 *                         type: string
 *                       identification:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       email:
 *                         type: string
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 */
router.get("/", getServiceRequests);
/**
 * @swagger
 * /api/service-requests/services/all:
 *   get:
 *     summary: Obtiene todas las categorías y servicios disponibles
 *     tags: [ServiceRequests]
 *     responses:
 *       200:
 *         description: Lista de categorías con sus servicios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   code:
 *                     type: string
 *                   category:
 *                     type: string
 *                   items:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         code:
 *                           type: string
 *                         name:
 *                           type: string
 *                         additionalInfo:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               field:
 *                                 type: string
 *                               type:
 *                                 type: string
 *                               label:
 *                                 type: string
 *                               required:
 *                                 type: boolean
 *                               options:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                               dependsOn:
 *                                 type: object
 *                                 properties:
 *                                   field:
 *                                     type: string
 *                                   value:
 *                                     type: string
 *       500:
 *         description: Error interno del servidor
 */
router.get("/services/all", getServices);
/**
 * @swagger
 * /api/service-requests/{id}:
 *   get:
 *     summary: Obtiene una solicitud de servicio específica
 *     tags: [ServiceRequests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalles de la solicitud
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 request:
 *                   $ref: '#/components/schemas/ServiceRequest'
 *                 selectedServices:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       service_code:
 *                         type: string
 *                       service_name:
 *                         type: string
 *                       quantity:
 *                         type: integer
 *                       additionalInfo:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             field_name:
 *                               type: string
 *                             field_value:
 *                               type: string
 *       404:
 *         description: Solicitud no encontrada
 */
router.get("/:id", getServiceRequest);

/**
 * @swagger
 * /api/service-requests/{id}/services:
 *   get:
 *     summary: Obtiene los servicios seleccionados de una solicitud
 *     tags: [ServiceRequests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de servicios seleccionados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 services:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       service_code:
 *                         type: string
 *                       service_name:
 *                         type: string
 *                       quantity:
 *                         type: integer
 *                       additionalInfo:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             field_name:
 *                               type: string
 *                             field_value:
 *                               type: string
 *       404:
 *         description: Solicitud no encontrada
 */
router.get("/:id/services", getSelectedServices);
/**
 * @swagger
 * /api/service-requests/services/{code}/fields:
 *   get:
 *     summary: Obtiene los campos adicionales de un servicio
 *     tags: [ServiceRequests]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de campos adicionales
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 fields:
 *                   type: array
 *                   items:
 *                     type: string
 *       404:
 *         description: Servicio no encontrado
 */
router.get("/services/:code/fields", getServiceFields);

/**
 * @swagger
 * /api/service-requests/{id}:
 *   put:
 *     summary: Actualiza una solicitud de servicio
 *     tags: [ServiceRequests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceRequest'
 *     responses:
 *       200:
 *         description: Solicitud actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Solicitud no encontrada
 */
router.put("/:id", updateServiceRequest);

/**
 * @swagger
 * /api/service-requests/{id}:
 *   delete:
 *     summary: Elimina una solicitud de servicio
 *     tags: [ServiceRequests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Solicitud eliminada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Solicitud no encontrada
 */
router.delete("/:id", deleteServiceRequest);

export default router;
