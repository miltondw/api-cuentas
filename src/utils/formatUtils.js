/**
 * Formatea un campo camelCase a texto legible
 * @param {string} fieldName - Nombre del campo en camelCase
 * @returns {string} Texto formateado
 */
export const formatFieldName = (fieldName) => {
  return fieldName
    .replace(/([A-Z])/g, " $1") // Inserta espacio antes de mayúsculas
    .replace(/^./, (str) => str.toUpperCase()) // Primera letra mayúscula
    .trim();
};

/**
 * Formatea un valor para mostrarlo en la tabla. Devuelve un espacio en blanco
 * si el valor es nulo o indefinido para evitar que las celdas colapsen.
 * @param {any} value - El valor a formatear.
 * @returns {string} El valor formateado como string.
 */
export const formatValue = (value) => {
  if (value === undefined || value === null || value === "") {
    return "&nbsp;"; // Retorna un espacio HTML para celdas vacías
  }
  return String(value);
};

/**
 * Genera el contenido HTML para los servicios agrupados por categoría
 * @param {Array} services - Array de servicios para procesar
 * @returns {string} HTML generado para los servicios
 */
export const generateServicesContent = (services) => {
  if (!services || !Array.isArray(services) || services.length === 0) {
    return "<p>No hay servicios seleccionados</p>";
  }

  // --- Agrupar servicios por categoría ---
  const servicesByCategory = {};
  for (const service of services) {
    const categoryCode = service.item.code.split("-")[0]; // SR, EDS, EMC, DMC, etc.
    if (!servicesByCategory[categoryCode]) {
      servicesByCategory[categoryCode] = [];
    }
    servicesByCategory[categoryCode].push(service);
  }

  // Títulos de categorías
  const categoryTitles = {
    SR: "Servicios de Caracterización",
    EDS: "Estudios de Suelos",
    EMC: "Ensayos de Muestras de Concreto",
    DMC: "Diseño de Mezclas de Concreto",
  };

  let serviciosContent = "";

  // Procesar cada categoría
  for (const [categoryCode, services] of Object.entries(servicesByCategory)) {
    if (services.length === 0) continue;

    // Agregar salto de página si no es la primera categoría
    if (serviciosContent) {
      serviciosContent += '<div class="page-break"></div>';
    }

    serviciosContent += `
      <div class="section-title">${
        categoryTitles[categoryCode] || categoryCode
      }</div>
      <table class="service-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Servicio</th>
            <th>Cantidad</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Agregar servicios de la categoría
    for (const service of services) {
      serviciosContent += `
        <tr>
          <td>${service.item.code}</td>
          <td>${service.item.name}</td>
          <td>${service.quantity}</td>
        </tr>
      `;      // Si hay instancias con información adicional, mostrarlas
      if (service.instances && Array.isArray(service.instances) && service.instances.length > 0) {
        // Para cada instancia, mostrar su información adicional
        for (let i = 0; i < service.instances.length; i++) {
          const instance = service.instances[i];
          
          if (instance.additionalInfo && Object.keys(instance.additionalInfo).length > 0) {
            serviciosContent += `
              <tr>
                <td colspan="3" style="padding: 0;">
                  <div class="no-break">
                    <div class="instance-header">Instancia ${i + 1} de ${service.instances.length}</div>
                    <table class="additional-info-table">
                      <tbody>
                        ${Object.entries(instance.additionalInfo)
                          .map(
                            ([key, value]) => `
                            <tr>
                              <th class="info-label">${formatFieldName(key)}</th>
                              <td class="info-value">${formatValue(value)}</td>
                            </tr>
                          `
                          )
                          .join("")}
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            `;
          }
        }
      }
      // Compatibilidad con el formato antiguo
      else if (
        service.additionalInfo &&
        Object.keys(service.additionalInfo).length > 0
      ) {
        serviciosContent += `
          <tr>
            <td colspan="3" style="padding: 0;">
              <div class="no-break">
                <table class="additional-info-table">
                  <tbody>
                    ${Object.entries(service.additionalInfo)
                      .map(
                        ([key, value]) => `
                        <tr>
                          <th class="info-label">${formatFieldName(key)}</th>
                          <td class="info-value">${formatValue(value)}</td>
                        </tr>
                      `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        `;
      }
    }

    serviciosContent += `
        </tbody>
      </table>
    `;
  }

  return serviciosContent;
};
