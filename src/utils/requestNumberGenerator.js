/**
 * Genera un número de solicitud único con formato SLAB-AAAA-XXX
 * donde AAAA es el año actual y XXX es un número secuencial con ceros a la izquierda
 * @param {Function} queryFn - Función para ejecutar consultas SQL
 * @returns {String} Número de solicitud generado
 */
export const generateRequestNumber = async (queryFn) => {
  try {
    const year = new Date().getFullYear();
    const prefix = `SLAB-${year}-`;

    // Buscar la última solicitud del año actual
    const lastRequests = await queryFn(
      "SELECT request_number FROM service_requests WHERE request_number LIKE ? ORDER BY request_number DESC LIMIT 1",
      [`${prefix}%`]
    );

    let sequential = 1;

    if (lastRequests && lastRequests.length > 0) {
      const lastRequest = lastRequests[0];
      if (lastRequest.request_number) {
        // Extraer el número secuencial del formato SLAB-AAAA-XXX
        const lastSeq = lastRequest.request_number.split('-')[2];
        if (lastSeq) {
          sequential = parseInt(lastSeq, 10) + 1;
        }
      }
    }

    // Formatear con ceros a la izquierda (001, 002, etc.)
    return `${prefix}${String(sequential).padStart(3, '0')}`;
  } catch (error) {
    console.error("Error generando número de solicitud:", error);
    throw error;
  }
};
