import express from "express";
import {
  registrarUsuario,
  loginUsuario,
  refreshToken,
  logoutUsuario,
  verifyAuth,
} from "../controllers/auth.controller.js";
import { verificarToken, verificarRol } from "../middleware/authMiddleware.js";
import {
  validateLogin,
  validateRegister,
} from "../middleware/validationMiddleware.js";
import {
  loginLimiter,
  registerLimiter,
} from "../middleware/rateLimitMiddleware.js";
import {
  verifyCsrfToken,
  generateCsrfToken,
} from "../middleware/csrfMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Gestión de usuarios, login, tokens y seguridad
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: refreshToken
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Usuario:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "5f8d04b3ab35a2d9c4c2d3b1"
 *         name:
 *           type: string
 *           example: "Juan Pérez"
 *         email:
 *           type: string
 *           format: email
 *           example: "juan@ejemplo.com"
 *         rol:
 *           type: string
 *           enum: [admin, usuario]
 *           example: "usuario"
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Credenciales inválidas"
 *         details:
 *           type: array
 *           items:
 *             type: string
 *           example: ["El email debe ser válido"]
 */

// Ruta de registro
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
 *             required: [name, email, password, rol]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: "Juan Pérez"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan@ejemplo.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 maxLength: 100
 *                 example: "Password123"
 *               rol:
 *                 type: string
 *                 enum: [admin, usuario]
 *                 example: "usuario"
 *               jwt2:
 *                 type: string
 *                 description: Código secreto requerido para crear usuarios admin
 *                 example: "CODIGO_SECRETO_ADMIN"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Código secreto inválido para crear admin
 *       409:
 *         description: El usuario o email ya existe
 *       429:
 *         description: Demasiados intentos, intente más tarde
 */
router.post("/register", registerLimiter, validateRegister, registrarUsuario);

// Ruta de login
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
 *             required: [email, password]
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
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: "refreshToken=abcde12345; HttpOnly; Path=/api/auth/refresh; SameSite=Strict"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: Credenciales inválidas
 *       429:
 *         description: Demasiados intentos, cuenta bloqueada temporalmente
 */
router.post(
  "/login",
  loginLimiter,
  validateLogin,
  generateCsrfToken, // Generar CSRF token en login exitoso
  loginUsuario
);

// Ruta de refresh token
/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refrescar token de acceso
 *     tags: [Autenticación]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Token refrescado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Token de refresco no proporcionado o inválido
 */
router.post(
  "/refresh",
  verifyCsrfToken, // Verificar CSRF token para refresh
  refreshToken
);

// Ruta de verificación
/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verificar autenticación
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: No autenticado o token inválido
 */
router.get("/verify", verificarToken, verifyAuth);

// Ruta de logout
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Autenticación]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: "refreshToken=; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
 *       401:
 *         description: No autenticado
 */
router.post("/logout", verificarToken, verifyCsrfToken, logoutUsuario);

// Ruta administrativa de ejemplo
/**
 * @swagger
 * /api/auth/admin:
 *   get:
 *     summary: Ruta protegida para administradores
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Acceso permitido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Acceso permitido a ruta administrativa"
 *                 user:
 *                   $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado (rol insuficiente)
 */
router.get("/admin", verificarToken, verificarRol(["admin"]), (req, res) => {
  res.status(200).json({
    message: "Acceso permitido a ruta administrativa",
    user: {
      id: req.user.id,
      email: req.user.email,
      rol: req.user.rol,
    },
  });
});

export default router;
