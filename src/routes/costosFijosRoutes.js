const express = require("express");
const router = express.Router();
const costosFijosController = require("../controllers/costosFijosController");

const ruta = "/costos";

router.get(ruta, costosFijosController.getCostosFijos);
router.post(ruta, costosFijosController.addCostoFijo);

module.exports = router;
