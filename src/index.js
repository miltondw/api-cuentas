const express = require("express");
const dotenv = require("dotenv");
const costosFijosRoutes = require("./routes/costosFijosRoutes");
const cuentaProyectoRoutes = require("./routes/cuentaProyectoRoutes");
dotenv.config();

const app = express();
app.use(express.json());

// Usar rutas
app.use("/api", costosFijosRoutes);
app.use("/api", cuentaProyectoRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
