import express from "express";
import {
  registrarUsuario,
  loginUsuario,
} from "../controllers/authController.js";

const router = express.Router();

// Registrar un nuevo usuario
router.post("/register", registrarUsuario);

// Iniciar sesión (login)
router.post("/login", loginUsuario);

export default router;
