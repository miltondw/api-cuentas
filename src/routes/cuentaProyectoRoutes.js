import express from "express";
import {
  getCuentasProyecto,
  getCuentaProyecto,
  createCuenta,
  updateCuenta,
  deleteCuenta,
} from "../controllers/cuentaProyectoController.js";
import verificarToken from "../middleware/authMiddleware.js";

const router = express.Router();

// Obtener todas las cuentas del proyecto
router.get("/", verificarToken, getCuentasProyecto);

// Obtener una cuenta del proyecto por ID
router.get("/:id", verificarToken, getCuentaProyecto);

// Crear una nueva cuenta del proyecto
router.post("/", verificarToken, createCuenta);

// Actualizar una cuenta del proyecto por ID
router.put("/:id", verificarToken, updateCuenta);

// Eliminar una cuenta del proyecto por ID
router.delete("/:id", verificarToken, deleteCuenta);

export default router;
