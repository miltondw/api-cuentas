import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import projects from "./routes/project.routes.js";
import profiles from "./routes/perfiles.routes.js";
import gastosEmpresa from "./routes/gastos-empresa.routes.js";
import authRoutes from "./routes/auth.routes.js";
import resumen from "./routes/resumen-financiero.routes.js";
import { notFoundHandler, handleError } from "./middleware/errorHandler.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5050;
const NODE_ENV = process.env.NODE_ENV || "development";

app.set("trust proxy", true);

app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  })
);
app.use(cookieParser());
app.use(compression());
app.use(express.json({ limit: "10kb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

if (NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log("Modo desarrollo activado");
}

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Gestión de Proyectos",
      version: "1.0.0",
      description:
        "Documentación de la API para gestión de proyectos y autenticación",
      contact: { name: "Soporte API", email: "mjestradas@ufpso.edu.co" },
      license: { name: "MIT" },
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
  apis: ["./src/routes/*.js"],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
const swaggerUiOptions = {
  explorer: true,
  customSiteTitle: "API Gestión de Proyectos",
  customCss: ".swagger-ui .topbar { display: none }",
};

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

app.use("/api", apiLimiter);
app.use("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/projects", projects);
app.use("/api/projects", profiles);
app.use("/api/gastos-mes", gastosEmpresa);
app.use("/api/resumen", resumen);
app.use("/api/auth", authRoutes);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocs, swaggerUiOptions)
);

app.use(notFoundHandler);
app.use(handleError);

const server = app.listen(PORT, () => {
  console.log(`
    🚀 Servidor iniciado en modo ${NODE_ENV}
    📡 Escuchando en el puerto ${PORT}
    📚 Documentación API: ${process.env.API_DOCS_URL || "No configurada"}
  `);
});

const shutdown = (signal) => {
  console.log(`\n🛑 Recibido ${signal}, cerrando servidor...`);
  server.close(() => {
    console.log("⚡ Servidor cerrado correctamente");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
