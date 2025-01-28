import db from "../config/db.js";

// Función para obtener todos los costos fijos
const getAllCostosFijos = async () => {
  try {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM costos_fijos_del_mes");
    return rows;
  } catch (err) {
    throw new Error("Error fetching all fixed costs: " + err.message);
  }
};

// Función para agregar un nuevo costo fijo
const addCostoFijo = async (data) => {
  const {
    mes_de_gastos,
    pago_de_salarios,
    pago_de_luz,
    pago_de_arriendo,
    pago_de_internet,
    pago_de_salud,
  } = data;

  try {
    const [results] = await db
      .promise()
      .query(
        "INSERT INTO costos_fijos_del_mes (mes_de_gastos, pago_de_salarios, pago_de_luz, pago_de_arriendo, pago_de_internet, pago_de_salud) VALUES (?, ?, ?, ?, ?, ?)",
        [
          mes_de_gastos,
          pago_de_salarios,
          pago_de_luz,
          pago_de_arriendo,
          pago_de_internet,
          pago_de_salud,
        ]
      );
    return results;
  } catch (err) {
    throw new Error("Error inserting fixed cost: " + err.message);
  }
};

// Función para obtener un costo fijo por ID
const getCostoFijoById = async (id) => {
  try {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM costos_fijos_del_mes WHERE id = ?", [id]);
    if (rows.length === 0) throw new Error("Costo fijo not found");
    return rows[0];
  } catch (err) {
    throw new Error("Error fetching fixed cost by ID: " + err.message);
  }
};

// Función para actualizar un costo fijo por ID
const updateCostoFijo = async (id, data) => {
  const {
    mes_de_gastos,
    pago_de_salarios,
    pago_de_luz,
    pago_de_arriendo,
    pago_de_internet,
    pago_de_salud,
  } = data;

  try {
    const [results] = await db
      .promise()
      .query(
        "UPDATE costos_fijos_del_mes SET mes_de_gastos = ?, pago_de_salarios = ?, pago_de_luz = ?, pago_de_arriendo = ?, pago_de_internet = ?, pago_de_salud = ? WHERE id = ?",
        [
          mes_de_gastos,
          pago_de_salarios,
          pago_de_luz,
          pago_de_arriendo,
          pago_de_internet,
          pago_de_salud,
          id,
        ]
      );

    if (results.affectedRows === 0) throw new Error("Costo fijo not found");
    return results;
  } catch (err) {
    throw new Error("Error updating fixed cost: " + err.message);
  }
};

// Función para eliminar un costo fijo por ID
const deleteCostoFijo = async (id) => {
  try {
    const [results] = await db
      .promise()
      .query("DELETE FROM costos_fijos_del_mes WHERE id = ?", [id]);
    if (results.affectedRows === 0) throw new Error("Costo fijo not found");
    return results;
  } catch (err) {
    throw new Error("Error deleting fixed cost: " + err.message);
  }
};

export {
  getAllCostosFijos,
  addCostoFijo,
  getCostoFijoById,
  updateCostoFijo,
  deleteCostoFijo,
};
