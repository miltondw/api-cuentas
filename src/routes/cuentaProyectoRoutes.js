import express from "express";
import {
  getCuentasProyecto,
  getCuentaProyecto,
  createCuenta,
  updateCuenta,
  deleteCuenta,
} from "../controllers/cuentaProyectoController.js";

const router = express.Router();

// Obtener todas las cuentas del proyecto
router.get("/", getCuentasProyecto);

// Obtener una cuenta del proyecto por ID
router.get("/:id", getCuentaProyecto);

// Crear una nueva cuenta del proyecto
router.post("/", createCuenta);

// Actualizar una cuenta del proyecto por ID
router.put("/:id", updateCuenta);

// Eliminar una cuenta del proyecto por ID
router.delete("/:id", deleteCuenta);

export default router;
