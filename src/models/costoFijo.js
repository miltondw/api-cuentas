import db from "../config/db.js"; // Suponiendo que tienes tu configuración de DB en db.js

// Función para obtener todos los costos fijos con paginación
const getAllCostosFijos = async (page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit; // Calculamos el offset según la página
    const [rows] = await db
      .promise()
      .query("SELECT * FROM costos_fijos_del_mes LIMIT ? OFFSET ?", [
        limit,
        offset,
      ]);
    return rows;
  } catch (err) {
    throw new Error("Error al obtener los costos fijos: " + err.message);
  }
};

// Función para obtener un costo fijo específico por ID
const getCostoFijoById = async (id) => {
  try {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM costos_fijos_del_mes WHERE id = ?", [id]);
    return rows[0];
  } catch (err) {
    throw new Error("Error al obtener el costo fijo: " + err.message);
  }
};

// Función para agregar un nuevo costo fijo
const addCostoFijo = async (newCostoFijo) => {
  try {
    const {
      mes_de_gastos,
      pago_de_salarios,
      pago_de_luz,
      pago_de_arriendo,
      pago_de_internet,
      pago_de_salud,
    } = newCostoFijo;
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
    throw new Error("Error al insertar los datos: " + err.message);
  }
};

// Función para actualizar un costo fijo por ID
const updateCostoFijo = async (id, updatedCostoFijo) => {
  try {
    const {
      mes_de_gastos,
      pago_de_salarios,
      pago_de_luz,
      pago_de_arriendo,
      pago_de_internet,
      pago_de_salud,
    } = updatedCostoFijo;
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
    return results;
  } catch (err) {
    throw new Error("Error al actualizar el costo fijo: " + err.message);
  }
};

// Función para eliminar un costo fijo por ID
const deleteCostoFijo = async (id) => {
  try {
    const [results] = await db
      .promise()
      .query("DELETE FROM costos_fijos_del_mes WHERE id = ?", [id]);
    return results;
  } catch (err) {
    throw new Error("Error al eliminar el costo fijo: " + err.message);
  }
};

export {
  getAllCostosFijos,
  getCostoFijoById,
  addCostoFijo,
  updateCostoFijo,
  deleteCostoFijo,
};
