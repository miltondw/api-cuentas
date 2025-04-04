import express from "express";
import {
  getAllResumenFinanciero,
  getResumenFinancieroPorFecha,
} from "../controllers/resumenFinanciero.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Resumen Financiero
 *   description: Resúmenes financieros de la empresa
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ResumenFinanciero:
 *       type: object
 *       properties:
 *         fecha:
 *           type: string
 *           format: date
 *         ingresos:
 *           type: number
 *           format: double
 *         gastos:
 *           type: number
 *           format: double
 *         balance:
 *           type: number
 *           format: double
 *         proyectosActivos:
 *           type: integer
 *         proyectosCompletados:
 *           type: integer
 */

/**
 * @swagger
 * /api/resumen:
 *   get:
 *     summary: Obtener todos los resúmenes financieros
 *     tags: [Resumen Financiero]
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
 *         description: Lista de resúmenes financieros
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ResumenFinanciero'
 */
router.get("/", getAllResumenFinanciero);

/**
 * @swagger
 * /api/resumen/fecha:
 *   get:
 *     summary: Obtener resumen financiero por fecha
 *     tags: [Resumen Financiero]
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Fecha del resumen (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Resumen financiero de la fecha especificada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResumenFinanciero'
 *       404:
 *         description: No se encontró resumen para la fecha especificada
 */
router.get("/fecha", getResumenFinancieroPorFecha);

export default router;
