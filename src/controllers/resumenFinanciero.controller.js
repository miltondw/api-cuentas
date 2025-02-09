import {
  getResumenFinanciero,
  getResumenFinancieroByFecha,
} from "../models/resumenFinanciero.model.js";

export const getAllResumenFinanciero = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const resumen = await getResumenFinanciero(page, limit);

    res.json({ success: true, data: resumen });
  } catch (error) {
    console.error("❌ Error en getAllResumenFinanciero:", error);
    res.status(500).json({ error: "Error al obtener resumen financiero" });
  }
};

export const getResumenFinancieroPorFecha = async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha) {
      return res.status(400).json({ error: "Se requiere una fecha" });
    }

    const resultado = await getResumenFinancieroByFecha(fecha);

    if (!resultado.length) {
      return res.status(404).json({
        message: "No se encontraron registros para la fecha proporcionada",
      });
    }

    res.json({ success: true, data: resultado });
  } catch (error) {
    console.error("❌ Error en getResumenFinancieroPorFecha:", error);
    res
      .status(500)
      .json({ error: "Error al obtener el resumen financiero por fecha" });
  }
};
