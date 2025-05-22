/**
 * Función de utilidad para ejecutar consultas y extraer el primer resultado
 * En mysql2, connection.query devuelve un array [results, fields]
 * y results es un array de objetos con las filas resultantes
 * 
 * @param {Object} connection - Conexión a la base de datos
 * @param {String} query - Consulta SQL
 * @param {Array} params - Parámetros para la consulta
 * @returns {Object|null} - El primer resultado de la consulta o null si no hay resultados
 */
export const getFirstResultFromQuery = async (connection, query, params = []) => {
  const [results] = await connection.query(query, params);
  return results && results.length > 0 ? results[0] : null;
};

/**
 * Función de utilidad para ejecutar consultas y devolver todos los resultados
 * 
 * @param {Object} connection - Conexión a la base de datos
 * @param {String} query - Consulta SQL
 * @param {Array} params - Parámetros para la consulta
 * @returns {Array} - Array de resultados
 */
export const getResultsFromQuery = async (connection, query, params = []) => {
  const [results] = await connection.query(query, params);
  return results || [];
};
