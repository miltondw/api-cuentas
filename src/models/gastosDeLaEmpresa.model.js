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

export const getAll = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  // Consultas SQL
  const query =
    "SELECT * FROM gastos_empresa ORDER BY mes DESC LIMIT ? OFFSET ?";
  const totalQuery = "SELECT COUNT(*) AS total FROM gastos_empresa";

  // Ejecutar consultas en paralelo
  const [gastos, totalResult] = await Promise.all([
    executeQuery(query, [limit, offset]),
    executeQuery(totalQuery),
  ]);

  return {
    gastos,
    total: totalResult[0].total,
    page,
    limit,
  };
};

export const getGastoById = async (empresa_id) => {
  const query = "SELECT * FROM gastos_empresa WHERE gasto_empresa_id = ?";
  return executeQuery(query, [empresa_id]);
};
export const create = async (gasto) => {
  const { mes, salarios, luz, agua, arriendo, internet, salud } = gasto;
  const query =
    "INSERT INTO gastos_empresa (mes, salarios, luz, agua, arriendo, internet, salud) VALUES (?, ?, ?, ?, ?, ?, ?)";
  return executeQuery(query, [
    mes,
    salarios,
    luz,
    agua,
    arriendo,
    internet,
    salud,
  ]);
};

export const update = async (id, gasto) => {
  const { mes, salarios, luz, agua, arriendo, internet, salud } = gasto;
  const query =
    "UPDATE gastos_empresa SET mes = ?, salarios = ?, luz = ?, agua = ?, arriendo = ?, internet = ?, salud = ? WHERE gasto_empresa_id = ?";
  return executeQuery(query, [
    mes,
    salarios,
    luz,
    agua,
    arriendo,
    internet,
    salud,
    id,
  ]);
};

export const deleteEmpresa = async (id) => {
  const query = "DELETE FROM gastos_empresa WHERE gasto_empresa_id = ?";
  return executeQuery(query, [id]);
};
