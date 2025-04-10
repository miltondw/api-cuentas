import express from "express";
import {
  registrarUsuario,
  loginUsuario,
  refreshToken,
  logoutUsuario,
  verifyAuth,
} from "../controllers/auth.controller.js";
import { verificarToken, verificarRol } from "../middleware/authMiddleware.js";
import { validateLogin, validateRegister } from "../middleware/validationMiddleware.js";
import { loginLimiter, registerLimiter } from "../middleware/rateLimitMiddleware.js";
import { verifyCsrfToken, generateCsrfToken } from "../middleware/csrfMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Endpoints para registro, login y gestión de tokens
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - rol
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Juan Pérez"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan@ejemplo.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "Password123"
 *               rol:
 *                 type: string
 *                 enum: [admin, usuario]
 *                 example: "usuario"
 *               jwt2:
 *                 type: string
 *                 description: "Código secreto requerido para crear usuarios admin"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       403:
 *         description: Código secreto inválido para crear admin
 *       409:
 *         description: El usuario o email ya existe
 *       429:
 *         description: Demasiados intentos, intente más tarde
 */
router.post(
  "/register", 
  registerLimiter,
  validateRegister,
  registrarUsuario
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan@ejemplo.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Password123"
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales inválidas
 *       429:
 *         description: Demasiados intentos, cuenta bloqueada temporalmente
 */
router.post(
  "/login",
  loginLimiter,
  validateLogin,
  loginUsuario
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Obtener un nuevo token de acceso usando el token de refresco
 *     tags: [Autenticación]
 *     responses:
 *       200:
 *         description: Token refrescado exitosamente
 *       401:
 *         description: Token de refresco no proporcionado o inválido
 */
router.post(
  "/refresh", 
  generateCsrfToken,
  refreshToken
);

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verificar si el usuario está autenticado
 *     tags: [Autenticación]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Usuario autenticado
 *       401:
 *         description: No autenticado o token inválido
 */
router.get(
  "/verify", 
  verificarToken, 
  verifyAuth
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Autenticación]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 */
router.post(
  "/logout",
  verifyCsrfToken,
  logoutUsuario
);

/**
 * @swagger
 * /api/auth/admin:
 *   get:
 *     summary: Ruta de ejemplo protegida para administradores
 *     tags: [Autenticación]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Acceso permitido (solo admin)
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado (rol insuficiente)
 */
router.get(
  "/admin",
  verificarRol(['admin']),
  (req, res) => {
    res.status(200).json({ 
      message: "Acceso permitido a ruta administrativa",
      user: {
        id: req.user.id,
        email: req.user.email,
        rol: req.user.rol
      }
    });
  }
);

export default router;
