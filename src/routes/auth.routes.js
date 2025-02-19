import express from "express";
import {
  registrarUsuario,
  loginUsuario,
  refreshToken,
  logoutUsuario,
  verificarToken
} from "../controllers/auth.controller.js";

const router = express.Router();

// Registrar un nuevo usuario
router.post("/register", registrarUsuario);

// Iniciar sesión (login)
router.post("/login", loginUsuario);
router.post("/refresh", refreshToken);
router.get("/verify", verificarToken, verifyAuth);
router.post("/logout", logoutUsuario);

export default router;
 