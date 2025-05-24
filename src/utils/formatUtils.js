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
 * en formato horizontal tipo Excel, una página por categoría
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

  // Procesar cada categoría en una página separada
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
    `;

    // Para cada servicio en la categoría
    for (const service of services) {
      serviciosContent += `
        <div class="service-header">
          <strong>${service.item.code} - ${service.item.name}</strong> (Cantidad: ${service.quantity})
        </div>
      `;

      // Si hay instancias con información adicional, mostrarlas en formato horizontal
      if (service.instances && Array.isArray(service.instances) && service.instances.length > 0) {
        // Recolectar todas las claves únicas de todas las instancias
        const allKeys = new Set();
        service.instances.forEach(instance => {
          if (instance.additionalInfo) {
            Object.keys(instance.additionalInfo).forEach(key => allKeys.add(key));
          }
        });
        
        // Si no hay claves, continuar con el siguiente servicio
        if (allKeys.size === 0) continue;
        
        const keysArray = Array.from(allKeys).sort();
        
        // Construir tabla horizontal
        serviciosContent += `
          <table class="horizontal-info-table">
            <thead>
              <tr class="header-row">
                <th class="instance-number-cell">Instancia</th>
        `;
        
        // Encabezados (nombres de campos)
        keysArray.forEach(key => {
          serviciosContent += `<th>${formatFieldName(key)}</th>`;
        });
        
        serviciosContent += `
              </tr>
            </thead>
            <tbody>
        `;
        
        // Filas de datos (valores)
        for (let i = 0; i < service.instances.length; i++) {
          const instance = service.instances[i];
          
          serviciosContent += `
            <tr>
              <td class="instance-number-cell">${i + 1}</td>
          `;
          
          // Valores para cada clave
          keysArray.forEach(key => {
            const value = instance.additionalInfo && instance.additionalInfo[key];
            serviciosContent += `<td>${value ? formatValue(value) : 'N/A'}</td>`;
          });
          
          serviciosContent += `</tr>`;
        }
        
        serviciosContent += `
            </tbody>
          </table>
        `;
      }
      // Compatibilidad con el formato antiguo
      else if (service.additionalInfo && Object.keys(service.additionalInfo).length > 0) {
        const keys = Object.keys(service.additionalInfo).sort();
        
        serviciosContent += `
          <table class="horizontal-info-table">
            <thead>
              <tr class="header-row">
        `;
        
        // Encabezados (nombres de campos)
        keys.forEach(key => {
          serviciosContent += `<th>${formatFieldName(key)}</th>`;
        });
        
        serviciosContent += `
              </tr>
            </thead>
            <tbody>
              <tr>
        `;
        
        // Valores para cada clave
        keys.forEach(key => {
          const value = service.additionalInfo[key];
          serviciosContent += `<td>${value ? formatValue(value) : 'N/A'}</td>`;
        });
        
        serviciosContent += `
              </tr>
            </tbody>
          </table>
        `;      }
    }
  }

  return serviciosContent;
};
