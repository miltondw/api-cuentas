import express from "express";
import {
getProyectos,
postProyecto,
getProyectoById,
putProyecto,
patchAbonarProyecto,
deleteProyecto,
} from "../controllers/project.controller.js";
import verificarToken from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verificarToken, getProyectos);
router.get("/:id", verificarToken, getProyectoById);

router.post("/", verificarToken, postProyecto);

router.put("/:id", verificarToken, putProyecto);
router.patch("/:id/abonar", verificarToken, patchAbonarProyecto);

router.delete("/:id", verificarToken, deleteProyecto);

export default router;
