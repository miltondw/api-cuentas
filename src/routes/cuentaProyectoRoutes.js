const express = require("express");
const router = express.Router();
const cuentaProyectoController = require("../controllers/cuentaProyectoController");

router.get("/cuentas", cuentaProyectoController.getCuentasProyecto);
router.post("/cuentas", cuentaProyectoController.addCuentaProyecto);

module.exports = router;
