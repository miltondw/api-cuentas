import express from "express";
import {
  createCostoFijo,
  getCostosFijos,
  getCostoFijo,
  updateCostoFijoController,
  deleteCostoFijoController,
} from "../controllers/costosFijosController.js";
import verificarToken from "../middleware/authMiddleware.js";
const router = express.Router();

// Ruta para crear un nuevo costo fijo
router.post("/", verificarToken, createCostoFijo);

// Ruta para obtener todos los costos fijos con paginación
router.get("/", verificarToken, getCostosFijos);

// Ruta para obtener un costo fijo específico por ID
router.get("/:id", verificarToken, getCostoFijo);

// Ruta para actualizar un costo fijo por ID
router.put("/:id", verificarToken, updateCostoFijoController);

// Ruta para eliminar un costo fijo por ID
router.delete("/:id", verificarToken, deleteCostoFijoController);

export default router;
