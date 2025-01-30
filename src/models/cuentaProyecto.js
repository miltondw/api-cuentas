import db from "../config/db.js";

// Helper reutilizable para ejecutar consultas
const executeQuery = async (query, params = []) => {
  try {
    const [results] = await db.query(query, params);
    return results;
  } catch (error) {
    console.error(`Error en consulta: ${query}`, error);
    throw new Error(`Database Error: ${error.message}`);
  }
};

// Campos y validaciones
const CUENTA_FIELDS = [
  "fecha",
  "solicitante",
  "nombreProyecto",
  "obrero",
  "costoServicio",
  "abono",
  "gastoCamioneta",
  "gastosCampo",
  "pagoObreros",
  "comidas",
  "transporte",
  "gastosVarios",
  "peajes",
  "combustible",
  "hospedaje",
];

const validateCuentaData = (data) => {
  const missingFields = CUENTA_FIELDS.filter((field) => !(field in data));
  if (missingFields.length > 0) {
    throw new Error(`Campos faltantes: ${missingFields.join(", ")}`);
  }
};

export const getAllCuentasProyecto = async (page = 1, limit = 10) => {
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  if (
    isNaN(pageNumber) ||
    isNaN(limitNumber) ||
    pageNumber < 1 ||
    limitNumber < 1
  ) {
    throw new Error("Parámetros de paginación inválidos");
  }

  const offset = (pageNumber - 1) * limitNumber;

  const query = `
    SELECT 
      id,
      DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha,  
      solicitante,
      nombreProyecto,
      obrero,
      costoServicio,
      abono,
      gastoCamioneta,
      gastosCampo,
      pagoObreros,
      comidas,
      transporte,
      gastosVarios,
      peajes,
      combustible,
      hospedaje
    FROM cuenta_del_proyecto 
    ORDER BY fecha DESC 
    LIMIT ? OFFSET ?
  `;

  return executeQuery(query, [limitNumber, offset]);
};

export const getTotalCuentas = async () => {
  const query = "SELECT COUNT(*) AS total FROM cuenta_del_proyecto";
  const result = await executeQuery(query);
  return result[0].total;
};

export const getCuentaProyectoById = async (id) => {
  const query = "SELECT * FROM cuenta_del_proyecto WHERE id = ? LIMIT 1";
  const result = await executeQuery(query, [id]);
  return result[0] || null;
};

export const createCuentaProyecto = async (data) => {
  validateCuentaData(data);
  const query = "INSERT INTO cuenta_del_proyecto SET ?";
  return executeQuery(query, [data]);
};

export const updateCuentaProyecto = async (id, data) => {
  validateCuentaData(data);
  const query = "UPDATE cuenta_del_proyecto SET ? WHERE id = ?";
  return executeQuery(query, [data, id]);
};
export const abonarProyecto = async (id, nuevoAbono) => {
  const query = "UPDATE cuenta_del_proyecto SET abono = ? WHERE id = ?";
  return executeQuery(query, [nuevoAbono, id]);
};
export const deleteCuentaProyecto = async (id) => {
  const query = "DELETE FROM cuenta_del_proyecto WHERE id = ?";
  return executeQuery(query, [id]);
};
