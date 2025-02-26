import db from "../config/db.js";

// Helper para ejecutar consultas
const executeQuery = async (query, params = []) => {
  try {
    const [results] = await db.query(query, params);
    return results;
  } catch (error) {
    console.error(`Error en consulta SQL: ${query}`, error);
    throw new Error(`Error en la base de datos: ${error.message}`);
  }
};

const REQUIRED_PROYECTO_FIELDS = [
  "fecha", "solicitante", "nombre_proyecto", "obrero", "costo_servicio", "abono"
];

const validateProyectoData = (data) => {
  const missingFields = REQUIRED_PROYECTO_FIELDS.filter(field => !(field in data));
  if (missingFields.length > 0) {
    throw new Error(`Campos faltantes: ${missingFields.join(", ")}`);
  }
};

const PROYECTO_FIELDS = [
  "fecha", "solicitante", "nombre_proyecto", "obrero", "costo_servicio", "abono", "factura", "valor_iva", "metodo_de_pago"
];

export const getAllProyectos = async (page = 1, limit = 10) => {
  page = Number(page) || 1;
  limit = Number(limit) || 10;
  const offset = (page - 1) * limit;

  // Modifica la consulta para ordenar por proyecto_id DESC
  const proyectosQuery = "SELECT * FROM proyectos ORDER BY proyecto_id DESC LIMIT ? OFFSET ?";
  const totalQuery = "SELECT COUNT(*) AS total FROM proyectos";

  const [proyectos, totalResult] = await Promise.all([
    executeQuery(proyectosQuery, [limit, offset]),
    executeQuery(totalQuery),
  ]);

  if (proyectos.length === 0) {
    return { success: true, data: { proyectos: [], total: totalResult[0].total, page, limit } };
  }

  const proyectosIds = proyectos.map(p => p.proyecto_id);
  const gastosQuery = `SELECT * FROM gastos_proyectos WHERE proyecto_id IN (${proyectosIds.map(() => "?").join(", ")})`;
  const gastos = await executeQuery(gastosQuery, proyectosIds);

  const proyectosMap = proyectos.map(proyecto => ({
    ...proyecto,
    gastos: gastos.filter(gasto => gasto.proyecto_id === proyecto.proyecto_id).map((gasto) => {
      let otrosCampos = {};
      if (gasto.otros_campos) {
        try {
          otrosCampos =
            typeof gasto.otros_campos === "string"
              ? JSON.parse(gasto.otros_campos)
              : gasto.otros_campos;
        } catch (error) {
          console.error("Error al parsear otros_campos:", error);
          otrosCampos = {};
        }
      }

      // Eliminar otros_campos del objeto principal y moverlo dentro del objeto otros_campos
      const gastoFiltrado = { ...gasto };
      delete gastoFiltrado.otros_campos;

      return {
        ...gastoFiltrado,
        otros_campos: otrosCampos,
      };
    }),
  }));

  return { success: true, data: { proyectos: proyectosMap, total: totalResult[0].total, page, limit } };
};

export const getProyectoById = async (id) => {
  id = Number(id);
  const proyectoQuery = "SELECT * FROM proyectos WHERE proyecto_id = ?";
  const proyectoResult = await executeQuery(proyectoQuery, [id]);

  if (proyectoResult.length === 0) return { success: false, data: null };

  const gastosQuery = "SELECT * FROM gastos_proyectos WHERE proyecto_id = ?";
  const gastosResult = await executeQuery(gastosQuery, [id]);

  const proyecto = {
    ...proyectoResult[0],
    gastos: gastosResult.map((gasto) => {
      let otrosCampos = {};
      if (gasto.otros_campos) {
        try {
          otrosCampos =
            typeof gasto.otros_campos === "string"
              ? JSON.parse(gasto.otros_campos)
              : gasto.otros_campos;
        } catch (error) {
          console.error("Error al parsear otros_campos:", error);
          otrosCampos = {};
        }
      }

      // Eliminar otros_campos del objeto principal y moverlo dentro del objeto otros_campos
      const gastoFiltrado = { ...gasto };
      delete gastoFiltrado.otros_campos;

      return {
        ...gastoFiltrado,
        otros_campos: otrosCampos,
      };
    }),
  };

  return { success: true, data: proyecto };
};

export const abonar = async (id, abono) => {
  const query = "UPDATE proyectos SET abono = abono + ? WHERE proyecto_id = ?";
  await executeQuery(query, [abono, id]);
  return { success: true, message: "Abono realizado con éxito" };
};

export const createProyecto = async (data) => {
  validateProyectoData(data);
  const { gastos, ...proyectoData } = data;

  const proyectoQuery = `INSERT INTO proyectos (${PROYECTO_FIELDS.join(", ")}) VALUES (${PROYECTO_FIELDS.map(() => "?").join(", ")})`;
  const values = PROYECTO_FIELDS.map(field => proyectoData[field] || null);

  const result = await executeQuery(proyectoQuery, values);
  const proyectoId = result.insertId;

  if (gastos && Object.keys(gastos).length > 0) {
    const fixedFields = ["camioneta", "campo", "obreros", "comidas", "otros", "peajes", "combustible", "hospedaje"];
    const extras = Object.fromEntries(Object.entries(gastos).filter(([key]) => !fixedFields.includes(key) && key !== "otros_campos"));
    const otrosCampos = gastos.otros_campos || (Object.keys(extras).length > 0 ? extras : null);

    // Convertir otros_campos a JSON si es un objeto
    const otrosCamposJSON = otrosCampos ? JSON.stringify(otrosCampos) : null;

    const gastosQuery = `INSERT INTO gastos_proyectos (proyecto_id, camioneta, campo, obreros, comidas, otros, peajes, combustible, hospedaje, otros_campos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      proyectoId,
      gastos.camioneta || 0,
      gastos.campo || 0,
      gastos.obreros || 0,
      gastos.comidas || 0,
      gastos.otros || 0,
      gastos.peajes || 0,
      gastos.combustible || 0,
      gastos.hospedaje || 0,
      otrosCamposJSON, // Aquí se envía el JSON correctamente
    ];

    await executeQuery(gastosQuery, params);
  }

  return { success: true, data: { proyectoId, message: "Proyecto creado con éxito" } };
};

export const updateProyecto = async (id, data) => {
  validateProyectoData(data);
  const { gastos, ...proyectoData } = data;

  const proyectoQuery = `UPDATE proyectos SET ${PROYECTO_FIELDS.map(field => `${field} = ?`).join(", ")} WHERE proyecto_id = ?`;
  const values = [...PROYECTO_FIELDS.map(field => proyectoData[field] || null), id];
  await executeQuery(proyectoQuery, values);

  if (gastos) {
    const gastosQuery = `DELETE FROM gastos_proyectos WHERE proyecto_id = ?`;
    await executeQuery(gastosQuery, [id]);

    const fixedFields = ["camioneta", "campo", "obreros", "comidas", "otros", "peajes", "combustible", "hospedaje"];
    const extras = Object.fromEntries(Object.entries(gastos).filter(([key]) => !fixedFields.includes(key) && key !== "otros_campos"));
    const otrosCampos = Object.keys(extras).length > 0 ? extras : null;

    const gastosQueryInsert = `INSERT INTO gastos_proyectos (proyecto_id, camioneta, campo, obreros, comidas, otros, peajes, combustible, hospedaje, otros_campos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      id,
      gastos.camioneta || 0,
      gastos.campo || 0,
      gastos.obreros || 0,
      gastos.comidas || 0,
      gastos.otros || 0,
      gastos.peajes || 0,
      gastos.combustible || 0,
      gastos.hospedaje || 0,
      otrosCampos ? JSON.stringify(otrosCampos) : null,
    ];

    await executeQuery(gastosQueryInsert, params);
  }

  return { success: true, data: { proyectoId: id, message: "Proyecto actualizado con éxito" } };
};

export const deleteProyecto = async (id) => {
  await executeQuery("DELETE FROM proyectos WHERE proyecto_id = ?", [id]);
  return { success: true, message: "Proyecto eliminado con éxito" };
};