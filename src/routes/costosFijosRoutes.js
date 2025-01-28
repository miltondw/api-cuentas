import express from "express";
import {
  getCostosFijos,
  createCostoFijo,
  getCostoFijo,
  updateCostoFijoData,
  deleteCostoFijoData,
} from "../controllers/costosFijosController.js";

const router = express.Router();

// Obtener todos los costos fijos
router.get("/", getCostosFijos);

// Crear un nuevo costo fijo
router.post("/", createCostoFijo);

// Obtener un costo fijo por ID
router.get("/:id", getCostoFijo);

// Actualizar un costo fijo por ID
router.put("/:id", updateCostoFijoData);

// Eliminar un costo fijo por ID
router.delete("/:id", deleteCostoFijoData);

export default router;
