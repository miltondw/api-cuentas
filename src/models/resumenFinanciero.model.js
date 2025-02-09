import db from "../config/db.js";

// Helper para ejecutar consultas
const executeQuery = async (query, params = []) => {
  try {
    const [results] = await db.query(query, params);
    return results;
  } catch (err) {
    console.error("❌ Error en consulta:", err);
    throw err;
  }
};

export const getResumenFinanciero = async (page = 1, limit = 10) => {
  page = Number(page) || 1; // Convertir a número y manejar valores inválidos
  limit = Number(limit) || 10;
  const offset = (page - 1) * limit;

  // Consulta paginada
  const resumenQuery = `
    SELECT * FROM resumen_financiero 
    ORDER BY mes DESC 
    LIMIT ? OFFSET ?
  `;

  // Consulta para obtener el total de registros
  const totalQuery = "SELECT COUNT(*) AS total FROM resumen_financiero";

  const [resumen, totalResult] = await Promise.all([
    executeQuery(resumenQuery, [limit, offset]),
    executeQuery(totalQuery),
  ]);

  return {
    resumen,
    total: totalResult[0]?.total || 0, // Acceder correctamente al total
    page,
    limit,
    totalPages: Math.ceil(totalResult[0]?.total / limit), // Calcular total de páginas
  };
};

// 📌 Obtener resumen financiero por mes
export const getResumenFinancieroByFecha = async (fecha) => {
  const query = `
    SELECT * FROM resumen_financiero
    WHERE mes = ?;
  `;
  return executeQuery(query, [fecha]);
};
