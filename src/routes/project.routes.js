import express from "express";
import {
  getProyectos,
  postProyecto,
  getProyectoById,
  putProyecto,
  patchAbonarProyecto,
  deleteProyecto,
} from "../controllers/project.controller.js";
import verificarToken from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Proyectos
 *   description: Gestión de proyectos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Proyecto:
 *       type: object
 *       required:
 *         - nombre
 *         - cliente
 *         - presupuesto
 *       properties:
 *         id:
 *           type: integer
 *         nombre:
 *           type: string
 *         descripcion:
 *           type: string
 *         cliente:
 *           type: string
 *         presupuesto:
 *           type: number
 *           format: double
 *         fechaInicio:
 *           type: string
 *           format: date
 *         fechaFin:
 *           type: string
 *           format: date
 *         estado:
 *           type: string
 *           enum: [activo, completado, cancelado]
 *     AbonoProyecto:
 *       type: object
 *       required:
 *         - monto
 *       properties:
 *         monto:
 *           type: number
 *           format: double
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Obtener todos los proyectos
 *     tags: [Proyectos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página para paginación
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Límite de items por página
 *     responses:
 *       200:
 *         description: Lista de proyectos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Proyecto'
 *       401:
 *         description: No autorizado
 */
router.get("/", verificarToken, getProyectos);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Obtener un proyecto por ID
 *     tags: [Proyectos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del proyecto
 *     responses:
 *       200:
 *         description: Detalles del proyecto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Proyecto'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Proyecto no encontrado
 */
router.get("/:id", verificarToken, getProyectoById);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Crear un nuevo proyecto
 *     tags: [Proyectos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Proyecto'
 *     responses:
 *       201:
 *         description: Proyecto creado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 */
router.post("/", verificarToken, postProyecto);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Actualizar un proyecto existente
 *     tags: [Proyectos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del proyecto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Proyecto'
 *     responses:
 *       200:
 *         description: Proyecto actualizado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Proyecto no encontrado
 */
router.put("/:id", verificarToken, putProyecto);

/**
 * @swagger
 * /api/projects/{id}/abonar:
 *   patch:
 *     summary: Abonar a un proyecto
 *     tags: [Proyectos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del proyecto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AbonoProyecto'
 *     responses:
 *       200:
 *         description: Abono registrado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Proyecto no encontrado
 */
router.patch("/:id/abonar", verificarToken, patchAbonarProyecto);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Eliminar un proyecto
 *     tags: [Proyectos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del proyecto
 *     responses:
 *       204:
 *         description: Proyecto eliminado exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Proyecto no encontrado
 */
router.delete("/:id", verificarToken, deleteProyecto);

export default router;
