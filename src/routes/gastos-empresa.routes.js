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

// Ruta para crear un nuevo costo fijo
router.post("/", verificarToken, crearGastoEmpresa);

// Ruta para obtener todos los costos fijos con paginación
router.get("/", verificarToken, obtenerGastosEmpresa);

// Ruta para obtener un costo fijo por ID
router.get("/:id", verificarToken, obtenerGastoEmpresa); // Ruta para actualizar un costo fijo por ID

router.put("/:id", verificarToken, actualizarGastoEmpresa);

// Ruta para eliminar un costo fijo por ID
router.delete("/:id", verificarToken, eliminarGastoEmpresa);

export default router;
