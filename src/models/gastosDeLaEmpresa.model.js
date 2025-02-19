import db from "../config/db.js";

const executeQuery = async (query, params = []) => {
  try {
    const [results] = await db.query(query, params);
    return results;
  } catch (error) {
    console.error(`Error en consulta: ${query}`, error);
    throw new Error(`Database Error: ${error.message}`);
  }
};

// Función para extraer campos adicionales
const extractExtras = (gasto) => {
  if (!gasto.otros_campos) return null;
  
  // Debe recibir un array y convertirlo a objeto plano
  const extras = {};
  gasto.otros_campos.forEach(item => {
    const [key] = Object.keys(item);
    extras[key] = item[key];
  });
  
  return Object.keys(extras).length > 0 ? extras : null;
};

export const getAll = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const query = `
    SELECT *, 
           JSON_UNQUOTE(JSON_EXTRACT(otros_campos, '$')) AS otros_campos 
    FROM gastos_empresa 
    ORDER BY mes DESC 
    LIMIT ? OFFSET ?
  `;
  
  const totalQuery = "SELECT COUNT(*) AS total FROM gastos_empresa";

  const [gastos, totalResult] = await Promise.all([
    executeQuery(query, [limit, offset]),
    executeQuery(totalQuery),
  ]);

  return {
    gastos: gastos.map(g => ({
      ...g,
      otros_campos: g.otros_campos ? JSON.parse(g.otros_campos) : null
    })),
    total: totalResult[0].total,
    page,
    limit,
  };
};
export const getGastoById = async (id) => {
  const query = `
    SELECT *, 
           JSON_UNQUOTE(JSON_EXTRACT(otros_campos, '$')) AS otros_campos 
    FROM gastos_empresa 
    WHERE gasto_empresa_id = ?
  `;
  
  const result = await executeQuery(query, [id]);
  
  if (!result[0]) return null;

  // Convertir el objeto plano de vuelta a array
  const otrosCampos = result[0].otros_campos 
    ? Object.entries(JSON.parse(result[0].otros_campos))
        .map(([nombre, monto]) => ({ [nombre]: monto }))
    : [];

  return {
    ...result[0],
    otros_campos: otrosCampos
  };
};
export const create = async (gasto) => {
  const extras = extractExtras(gasto);
  
  const query = `
    INSERT INTO gastos_empresa 
    (mes, salarios, luz, agua, arriendo, internet, salud, otros_campos) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  return executeQuery(query, [
    gasto.mes,
    gasto.salarios,
    gasto.luz,
    gasto.agua,
    gasto.arriendo,
    gasto.internet,
    gasto.salud,
    extras ? JSON.stringify(extras) : null
  ]);
};

export const update = async (id, gasto) => {
  const extras = extractExtras(gasto);
  
  const query = `
    UPDATE gastos_empresa 
    SET mes = ?, 
        salarios = ?, 
        luz = ?, 
        agua = ?, 
        arriendo = ?, 
        internet = ?, 
        salud = ?, 
        otros_campos = ? 
    WHERE gasto_empresa_id = ?
  `;
  
  return executeQuery(query, [
    gasto.mes,
    gasto.salarios,
    gasto.luz,
    gasto.agua,
    gasto.arriendo,
    gasto.internet,
    gasto.salud,
    extras ? JSON.stringify(extras) : null,
    id
  ]);
};

export const deleteEmpresa = async (id) => {
  const query = "DELETE FROM gastos_empresa WHERE gasto_empresa_id = ?";
  return executeQuery(query, [id]);
};