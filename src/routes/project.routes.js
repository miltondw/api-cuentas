import express from "express";
import {
  obtenerProyectos,
  obtenerProyecto,
  crearProyecto,
  actualizarProyecto,
  abonarProyecto,
  eliminarProyecto,
} from "../controllers/project.controller.js";
import verificarToken from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verificarToken, obtenerProyectos);
router.get("/:id", verificarToken, obtenerProyecto);

router.post("/", verificarToken, crearProyecto);

router.put("/:id", verificarToken, actualizarProyecto);
router.patch("/:id/abonar", verificarToken, abonarProyecto);

router.delete("/:id", verificarToken, eliminarProyecto);

export default router;
