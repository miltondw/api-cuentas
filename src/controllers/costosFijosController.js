import {
  getAllCostosFijos,
  addCostoFijo,
  getCostoFijoById,
  updateCostoFijo,
  deleteCostoFijo,
} from "../models/costoFijo.js";

// Obtener todos los costos fijos
const getCostosFijos = async (req, res) => {
  try {
    const costosFijos = await getAllCostosFijos();
    res.json(costosFijos);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching data", error: err.message });
  }
};

// Crear un nuevo costo fijo
const createCostoFijo = async (req, res) => {
  const {
    mes_de_gastos,
    pago_de_salarios,
    pago_de_luz,
    pago_de_arriendo,
    pago_de_internet,
    pago_de_salud,
  } = req.body;
  const newCostoFijo = {
    mes_de_gastos,
    pago_de_salarios,
    pago_de_luz,
    pago_de_arriendo,
    pago_de_internet,
    pago_de_salud,
  };

  try {
    const results = await addCostoFijo(newCostoFijo);
    res.status(201).json({
      message: "Costo fijo created successfully",
      id: results.insertId,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error inserting data", error: err.message });
  }
};

// Obtener un costo fijo por ID
const getCostoFijo = async (req, res) => {
  const { id } = req.params;
  try {
    const costoFijo = await getCostoFijoById(id);
    res.json(costoFijo);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching data", error: err.message });
  }
};

// Actualizar un costo fijo por ID
const updateCostoFijoData = async (req, res) => {
  const { id } = req.params;
  const {
    mes_de_gastos,
    pago_de_salarios,
    pago_de_luz,
    pago_de_arriendo,
    pago_de_internet,
    pago_de_salud,
  } = req.body;
  const updatedData = {
    mes_de_gastos,
    pago_de_salarios,
    pago_de_luz,
    pago_de_arriendo,
    pago_de_internet,
    pago_de_salud,
  };

  try {
    await updateCostoFijo(id, updatedData);
    res.json({ message: "Costo fijo updated successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating data", error: err.message });
  }
};

// Eliminar un costo fijo por ID
const deleteCostoFijoData = async (req, res) => {
  const { id } = req.params;
  try {
    await deleteCostoFijo(id);
    res.json({ message: "Costo fijo deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting data", error: err.message });
  }
};

export {
  getCostosFijos,
  createCostoFijo,
  getCostoFijo,
  updateCostoFijoData,
  deleteCostoFijoData,
};
