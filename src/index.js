import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import cookieParser from "cookie-parser";
// swagger
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
// Rutas
import projects from "./routes/project.routes.js";
import profiles from "./routes/perfiles.routes.js";
import gastosEmpresa from "./routes/gastos-empresa.routes.js";
import authRoutes from "./routes/auth.routes.js";
import resumen from "./routes/resumen-financiero.routes.js";
// Middlewares
import { notFoundHandler, handleError } from "./middleware/errorHandler.js";
import { generateCsrfToken } from "./middleware/csrfMiddleware.js";

// Configuración inicial
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// 1. Configuración de proxy y seguridad inicial
app.set("trust proxy", true);

// 2. Configuración de CORS mejorada
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || [
      "https://localhost:5173",
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  exposedHeaders: ["X-CSRF-Token"],
};

app.use(cors(corsOptions));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "cdn.swagger.io"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "cdn.swagger.io",
          "fonts.googleapis.com",
        ],
        imgSrc: ["'self'", "data:", "cdn.swagger.io"],
        fontSrc: ["'self'", "fonts.gstatic.com"],
      },
    },
    crossOriginResourcePolicy: { policy: "same-site" },
  })
);

// 3. Middlewares esenciales
app.use(cookieParser());
app.use(compression());
app.use(express.json({ limit: "10kb" }));

// 4. Rate limiting diferenciado
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Demasiados intentos desde esta IP, por favor intente más tarde",
});

// 5. Logging en desarrollo
if (NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log("Modo desarrollo activado");
}

// 6. Configuración de Swagger
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
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
const swaggerUiOptions = {
  explorer: true,
  customSiteTitle: "API Gestión de Proyectos",
  customCss: ".swagger-ui .topbar { display: none }",
};

// 7. Validación de variables de entorno
const requiredEnvVars = [
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "DB_HOST",
  "DB_USER",
  "DB_NAME",
  "CSRF_SECRET",
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`❌ Error: La variable de entorno ${varName} es requerida`);
    process.exit(1);
  }
});

// Verificación de URLs importantes
const importantUrls = ["CORS_ORIGINS", "API_DOCS_URL"];
importantUrls.forEach((url) => {
  if (!process.env[url]) {
    console.warn(`⚠️ Advertencia: La variable ${url} no está configurada`);
  }
});

// 8. Configuración de rutas
app.use("/api", apiLimiter);
app.use("/api/health", (req, res) => res.json({ status: "ok" }));

// Middlewares CSRF para rutas específicas
app.use("/api/auth", generateCsrfToken);
app.use("/api/projects", generateCsrfToken);
app.use("/api/gastos-mes", generateCsrfToken);
app.use("/api/resumen", generateCsrfToken);

// Rutas principales
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/projects", projects);
app.use("/api/profiles", profiles); // Cambiado de /api/projects a /api/profiles
app.use("/api/gastos-mes", gastosEmpresa);
app.use("/api/resumen", resumen);

// Documentación Swagger
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocs, swaggerUiOptions)
);

// 9. Manejo de errores
app.use(notFoundHandler);
app.use(handleError);

// 10. Inicio del servidor
const server = app.listen(PORT, () => {
  console.log(`
  🚀 Servidor iniciado en modo ${NODE_ENV}
  📡 Escuchando en el puerto ${PORT}
  🌐 Orígenes permitidos: ${
    process.env.CORS_ORIGINS || "https://localhost:5173"
  }
  📚 Documentación API: http://localhost:${PORT}/api-docs
  `);
});

// 11. Manejo de cierre elegante
const shutdown = (signal) => {
  console.log(`\n🛑 Recibido ${signal}, cerrando servidor...`);
  server.close(() => {
    console.log("⚡ Servidor cerrado correctamente");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
