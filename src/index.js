import express from "express";
import dotenv from "dotenv";
import costosFijosRoutes from "./routes/costosFijosRoutes.js";
import cuentaProyectoRoutes from "./routes/cuentaProyectoRoutes.js";
import db from "./config/db.js";

dotenv.config();
const app = express();
app.use(express.json());

// Rutas principales
app.use("/api/costos-fijos", costosFijosRoutes);
app.use("/api/cuenta-proyecto", cuentaProyectoRoutes);

// Manejo de rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found" });
});

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
