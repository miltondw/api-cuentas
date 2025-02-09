import express from "express";
import {
  getAllResumenFinanciero,
  getResumenFinancieroPorFecha,
} from "../controllers/resumenFinanciero.controller.js";

const router = express.Router();

// Ruta para obtener el resumen financiero con paginación
router.get("/", getAllResumenFinanciero);

// Ruta para obtener el resumen financiero por una fecha específica
router.get("/fecha", getResumenFinancieroPorFecha);

export default router;
