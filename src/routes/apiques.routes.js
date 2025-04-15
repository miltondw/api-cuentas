import express from "express";
import {
  getApiquesPorProyecto,
  getApique,
  postApique,
  putApique,
  deleteApique,
} from "../controllers/apiques.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Apiques
 *   description: Gestión de apiques de proyectos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Apique:
 *       type: object
 *       required:
 *         - project_id
 *         - location
 *       properties:
 *         apique_id:
 *           type: integer
 *           readOnly: true
 *         project_id:
 *           type: integer
 *         location:
 *           type: string
 *         depth:
 *           type: number
 *         date:
 *           type: string
 *           format: date
 *         cbr_unaltered:
 *           type: boolean
 *         depth_tomo:
 *           type: number
 *         molde:
 *           type: string
 *         layers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               layer_number:
 *                 type: integer
 *               thickness:
 *                 type: number
 *               sample_id:
 *                 type: string
 *               observation:
 *                 type: string
 */

/**
 * @swagger
 * /api/projects/{projectId}/apiques:
 *   get:
 *     summary: Obtiene todos los apiques de un proyecto
 *     tags: [Apiques]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de apiques con sus capas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Apique'
 *       404:
 *         description: Proyecto no encontrado
 */
router.get("/:projectId/apiques", getApiquesPorProyecto);

/**
 * @swagger
 * /api/projects/{projectId}/apiques/{apiqueId}:
 *   get:
 *     summary: Obtiene un apique específico
 *     tags: [Apiques]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: apiqueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalles completos del apique
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Apique'
 *       404:
 *         description: Apique no encontrado
 */
router.get("/:projectId/apiques/:apiqueId", getApique);

/**
 * @swagger
 * /api/projects/{projectId}/apiques:
 *   post:
 *     summary: Crea un nuevo apique
 *     tags: [Apiques]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Apique'
 *     responses:
 *       201:
 *         description: Apique creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: El apique ya existe
 */
router.post("/:projectId/apiques", postApique);

/**
 * @swagger
 * /api/projects/{projectId}/apiques/{apiqueId}:
 *   put:
 *     summary: Actualiza un apique existente
 *     tags: [Apiques]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: apiqueId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Apique'
 *     responses:
 *       200:
 *         description: Apique actualizado
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Apique no encontrado
 */
router.put("/:projectId/apiques/:apiqueId", putApique);

/**
 * @swagger
 * /api/projects/{projectId}/apiques/{apiqueId}:
 *   delete:
 *     summary: Elimina un apique
 *     tags: [Apiques]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: apiqueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Apique eliminado exitosamente
 *       404:
 *         description: Apique no encontrado
 */
router.delete("/:projectId/apiques/:apiqueId", deleteApique);

export default router;
