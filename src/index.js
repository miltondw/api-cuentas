import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import cookieParser from "cookie-parser"; // Importa cookie-parser
//swaggerUi
import swaggerUi from "swagger-ui-express"; // Importa Swagger UI
import swaggerJsdoc from "swagger-jsdoc"; // Importa swagger-jsdoc
// Rutas
import projects from "./routes/project.routes.js";
import profiles from "./routes/perfiles.routes.js";
import gastosEmpresa from "./routes/gastos-empresa.routes.js";
import authRoutes from "./routes/auth.routes.js";
import resumen from "./routes/resumen-financiero.routes.js";

// Middleware de errores
import { notFoundHandler, handleError } from "./middleware/errorHandler.js";

// Configuración inicial
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// 1. Middlewares de seguridad
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(",") || ["https://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Agrega cookie-parser para leer cookies en las peticiones
app.use(cookieParser());

// 2. Limitador de tasa
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo de peticiones por IP
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. Middlewares de optimización
app.use(compression());
app.use(express.json({ limit: "10kb" }));

// 4. Logging en desarrollo
if (NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log("Modo desarrollo activado");
}
// Configuración de Swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Gestión de Proyectos",
      version: "1.0.0",
      description:
        "Documentación de la API para gestión de proyectos y autenticación",
      contact: {
        name: "Soporte API",
        email: "mjestradas@ufpso.edu.co",
      },
      license: {
        name: "MIT",
      },
    },
    servers: [
      {
        url: `https://api-cuentas-zlut.onrender.com`,
        description: "Servidor de producción",
      },
      {
        url: `http://localhost:${PORT}`,
        description: "Servidor local de desarrollo",
      },
    ],
  },
  apis: ["./src/routes/*.js"], // Asegúrate de que la ruta sea correcta
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
// 5. Validación de variables de entorno obligatorias
const requiredEnvVars = [
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "DB_HOST",
  "DB_USER",
  "DB_NAME",
];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`❌ Error: La variable de entorno ${varName} es requerida`);
    process.exit(1);
  }
});
// Agrega opciones de personalización para la UI
const swaggerUiOptions = {
  explorer: true,
  customSiteTitle: "API Gestión de Proyectos",
  customCss: ".swagger-ui .topbar { display: none }",
};

// 6. Configuración de rutas
app.use("/api", apiLimiter);
app.use("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/projects", projects);
app.use("/api/projects", profiles);
app.use("/api/gastos-mes", gastosEmpresa);
app.use("/api/resumen", resumen);
app.use("/api/auth", authRoutes);
// Ruta para Swagger UI
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocs, swaggerUiOptions)
);
// 7. Manejo de errores (después de las rutas)
app.use(notFoundHandler);
app.use(handleError);

// 8. Inicio del servidor
const server = app.listen(PORT, () => {
  console.log(`
  🚀 Servidor iniciado en modo ${NODE_ENV}
  📡 Escuchando en el puerto ${PORT}
  📚 Documentación API: ${process.env.API_DOCS_URL || "No configurada"}
  `);
});

// 9. Manejo de cierre elegante
const shutdown = (signal) => {
  console.log(`\n🛑 Recibido ${signal}, cerrando servidor...`);
  server.close(() => {
    console.log("⚡ Servidor cerrado correctamente");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
