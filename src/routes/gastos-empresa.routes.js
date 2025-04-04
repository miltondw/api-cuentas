import express from "express";
import {
  obtenerGastosEmpresa,
  crearGastoEmpresa,
  actualizarGastoEmpresa,
  eliminarGastoEmpresa,
  obtenerGastoEmpresa,
} from "../controllers/gastosMesEmpresa.controller.js";
import verificarToken from "../middleware/authMiddleware.js";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Gastos Empresa
 *   description: Gestión de gastos mensuales de la empresa
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     GastoEmpresa:
 *       type: object
 *       required:
 *         - concepto
 *         - monto
 *         - fecha
 *       properties:
 *         id:
 *           type: integer
 *         concepto:
 *           type: string
 *         monto:
 *           type: number
 *           format: double
 *         fecha:
 *           type: string
 *           format: date
 *         descripcion:
 *           type: string
 *         categoria:
 *           type: string
 */

/**
 * @swagger
 * /api/gastos-mes:
 *   post:
 *     summary: Crear un nuevo gasto de empresa
 *     tags: [Gastos Empresa]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GastoEmpresa'
 *     responses:
 *       201:
 *         description: Gasto creado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 */
router.post("/", verificarToken, crearGastoEmpresa);

/**
 * @swagger
 * /api/gastos-mes:
 *   get:
 *     summary: Obtener todos los gastos de la empresa
 *     tags: [Gastos Empresa]
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
 *         description: Lista de gastos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GastoEmpresa'
 *       401:
 *         description: No autorizado
 */
router.get("/", verificarToken, obtenerGastosEmpresa);

/**
 * @swagger
 * /api/gastos-mes/{id}:
 *   get:
 *     summary: Obtener un gasto específico por ID
 *     tags: [Gastos Empresa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del gasto
 *     responses:
 *       200:
 *         description: Detalles del gasto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GastoEmpresa'
 *       404:
 *         description: Gasto no encontrado
 *       401:
 *         description: No autorizado
 */
router.get("/:id", verificarToken, obtenerGastoEmpresa);

/**
 * @swagger
 * /api/gastos-mes/{id}:
 *   put:
 *     summary: Actualizar un gasto existente
 *     tags: [Gastos Empresa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del gasto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GastoEmpresa'
 *     responses:
 *       200:
 *         description: Gasto actualizado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Gasto no encontrado
 */
router.put("/:id", verificarToken, actualizarGastoEmpresa);

/**
 * @swagger
 * /api/gastos-mes/{id}:
 *   delete:
 *     summary: Eliminar un gasto
 *     tags: [Gastos Empresa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del gasto
 *     responses:
 *       204:
 *         description: Gasto eliminado exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Gasto no encontrado
 */
router.delete("/:id", verificarToken, eliminarGastoEmpresa);

export default router;
