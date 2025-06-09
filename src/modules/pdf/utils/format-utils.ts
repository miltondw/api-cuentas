/**
 * Mapeo de nombres de campos comunes para el formateo
 */
const FIELD_NAME_MAPPING: Record<string, string> = {
  // Campos de concreto
  slump: 'Slump (cm)',
  resistencia: 'Resistencia (MPa)',
  f_c: "f'c (MPa)",
  fechaVaciado: 'Fecha de Vaciado',
  fechaDesencofrado: 'Fecha de Desencofrado',
  tipoElemento: 'Tipo de Elemento',
  ubicacionElemento: 'Ubicación del Elemento',
  observaciones: 'Observaciones',

  // Campos de muestreo
  tipoMuestra: 'Tipo de Muestra',
  profundidad: 'Profundidad (m)',
  fechaMuestreo: 'Fecha de Muestreo',

  // Campos de agregados
  tipoAgregado: 'Tipo de Agregado',
  origen: 'Origen',

  // Campos generales
  norma: 'Norma',
  metodo: 'Método',
  temperatura: 'Temperatura (°C)',
  humedad: 'Humedad (%)',
  procedencia: 'Procedencia',

  // Identificadores
  identificacionMuestra: 'Identificación de Muestra',
  numeroEspecimen: 'Número de Espécimen',
  codigoMuestra: 'Código de Muestra',
};

/**
 * Formatea el nombre de un campo para mostrar en el PDF
 * @param fieldName - Nombre del campo
 * @returns Nombre formateado
 */
export function formatFieldName(fieldName: string): string {
  // Buscar en el mapeo primero
  if (FIELD_NAME_MAPPING[fieldName]) {
    return FIELD_NAME_MAPPING[fieldName];
  }

  // Convertir camelCase a formato legible
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Formatea un valor para mostrar en el PDF
 * @param value - Valor a formatear
 * @returns Valor formateado
 */
export function formatFieldValue(value: any): string {
  if (value === null || value === undefined || value === '') {
    return '&nbsp;'; // Retorna un espacio HTML para celdas vacías
  }

  // Si es una fecha, formatearla
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    try {
      return new Date(value).toLocaleDateString('es-CO');
    } catch {
      return String(value);
    }
  }

  return String(value);
}

/**
 * Genera contenido HTML horizontal para instancias de servicios
 * @param instances - Array de instancias con su información adicional
 * @returns HTML string
 */
export function generateHorizontalInstancesContent(
  instances: Array<{
    instanceNumber: number;
    additionalInfo: Record<string, any>;
  }>,
): string {
  if (!instances || instances.length === 0) {
    return '';
  }

  // Obtener todos los campos únicos de todas las instancias
  const allFields = new Set<string>();
  instances.forEach(instance => {
    Object.keys(instance.additionalInfo || {}).forEach(field => {
      allFields.add(field);
    });
  });

  // Si no hay claves, continuar con el siguiente servicio
  if (allFields.size === 0) return '';

  const fieldsArray = Array.from(allFields).sort();

  // Construir tabla horizontal
  let html = `
    <table class="horizontal-info-table">
      <thead>
        <tr class="header-row">
          <th class="instance-number-cell">N° Muestra</th>
  `;

  // Encabezados (nombres de campos)
  fieldsArray.forEach(field => {
    html += `<th>${formatFieldName(field)}</th>`;
  });

  html += `
        </tr>
      </thead>
      <tbody>
  `;

  // Filas de datos (valores)
  for (let i = 0; i < instances.length; i++) {
    const instance = instances[i];

    html += `
      <tr>
        <td class="instance-number-cell">${i + 1}</td>
    `;

    // Valores para cada clave
    fieldsArray.forEach(field => {
      const value = instance.additionalInfo && instance.additionalInfo[field];
      html += `<td>${formatFieldValue(value)}</td>`;
    });

    html += `</tr>`;
  }

  html += `
      </tbody>
    </table>
  `;

  return html;
}
