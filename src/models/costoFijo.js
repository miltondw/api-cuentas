// models/costoFijo.js
import db from "../config/db.js";

// Helper para ejecutar consultas
const executeQuery = async (query, params = []) => {
  try {
    const [results] = await db.query(query, params);
    return results;
  } catch (error) {
    console.error(`Error en consulta: ${query}`, error);
    throw error;
  }
};

export const getAllCostosFijos = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  console.log(`Ejecutando query con LIMIT ${limit} OFFSET ${offset}`); // Debug

  const query = `
    SELECT * FROM costos_fijos_del_mes 
    ORDER BY mes_de_gastos DESC 
    LIMIT ? OFFSET ?
  `;

  const results = await executeQuery(query, [limit, offset]);
  return results;
};
export const getTotalCostosFijos = async () => {
  const query = "SELECT COUNT(*) AS total FROM costos_fijos_del_mes";
  const result = await executeQuery(query);
  return result[0].total; // Extraer directamente el valor numérico
};

export const getCostoFijoById = async (id) => {
  const query = "SELECT * FROM costos_fijos_del_mes WHERE id = ?";
  const results = await executeQuery(query, [id]);
  return results[0] || null;
};

export const addCostoFijo = async (data) => {
  const query = "INSERT INTO costos_fijos_del_mes SET ?";
  return executeQuery(query, data);
};

export const updateCostoFijo = async (id, data) => {
  const query = "UPDATE costos_fijos_del_mes SET ? WHERE id = ?";
  return executeQuery(query, [data, id]);
};

export const deleteCostoFijo = async (id) => {
  const query = "DELETE FROM costos_fijos_del_mes WHERE id = ?";
  return executeQuery(query, [id]);
};
