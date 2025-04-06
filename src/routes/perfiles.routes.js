import express from "express";
import {
  getPerfilesPorProyecto,
  getPerfil,
  postPerfil,
  putPerfil,
  deletePerfil,
} from "../controllers/perfiles.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Perfiles
 *   description: Gestión de perfiles de proyectos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Perfil:
 *       type: object
 *       required:
 *         - projectId
 *         - profileId
 *         - datosPerfil
 *       properties:
 *         projectId:
 *           type: integer
 *         profileId:
 *           type: integer
 *         datosPerfil:
 *           type: object
 *           properties:
 *             profundidad:
 *               type: number
 *             resistencia:
 *               type: number
 *             descripcion:
 *               type: string
 */

/**
 * @swagger
 * /api/projects/{projectId}/profiles:
 *   get:
 *     summary: Obtener todos los perfiles de un proyecto
 *     tags: [Perfiles]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del proyecto
 *     responses:
 *       200:
 *         description: Lista de perfiles del proyecto
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Perfil'
 *       404:
 *         description: Proyecto no encontrado
 */
router.get("/:projectId/profiles", getPerfilesPorProyecto);

/**
 * @swagger
 * /api/projects/{projectId}/profiles/{profileId}:
 *   get:
 *     summary: Obtener un perfil específico
 *     tags: [Perfiles]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del proyecto
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Número de sondeo del perfil
 *     responses:
 *       200:
 *         description: Detalles del perfil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Perfil'
 *       404:
 *         description: Perfil no encontrado
 */
router.get("/:projectId/profiles/:profileId", getPerfil);

/**
 * @swagger
 * /api/projects/{projectId}/profiles:
 *   post:
 *     summary: Crear un nuevo perfil
 *     tags: [Perfiles]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del proyecto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Perfil'
 *     responses:
 *       201:
 *         description: Perfil creado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       404:
 *         description: Proyecto no encontrado
 */
router.post("/:projectId/profiles", postPerfil);

/**
 * @swagger
 * /api/projects/{projectId}/profiles/{profileId}:
 *   put:
 *     summary: Actualizar un perfil existente
 *     tags: [Perfiles]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del proyecto
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Número de sondeo del perfil
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Perfil'
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       404:
 *         description: Perfil no encontrado
 */
router.put("/:projectId/profiles/:profileId", putPerfil);

/**
 * @swagger
 * /api/projects/{projectId}/profiles/{profileId}:
 *   delete:
 *     summary: Eliminar un perfil
 *     tags: [Perfiles]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del proyecto
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Número de sondeo del perfil
 *     responses:
 *       204:
 *         description: Perfil eliminado exitosamente
 *       404:
 *         description: Perfil no encontrado
 */
router.delete("/:projectId/profiles/:profileId", deletePerfil);

export default router;
