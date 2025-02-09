import db from "../config/db.js";

// Helper reutilizable para ejecutar consultas
const executeQuery = async (query, params = []) => {
  try {
    const [results] = await db.query(query, params);
    return results;
  } catch (error) {
    console.error(`Error en consulta SQL: ${query}`, error);
    throw new Error(`Error en la base de datos: ${error.message}`);
  }
};

// Campos permitidos para validación
const PROYECTO_FIELDS = [
  "fecha",
  "solicitante",
  "nombre_proyecto",
  "costo_servicio",
  "abono",
];

const validateProyectoData = (data) => {
  const missingFields = PROYECTO_FIELDS.filter((field) => !(field in data));
  if (missingFields.length > 0) {
    throw new Error(`Campos faltantes: ${missingFields.join(", ")}`);
  }
};

export const getAllProyectos = async (page = 1, limit = 10) => {
  page = Number(page) || 1; // Convertir a número y manejar valores inválidos
  limit = Number(limit) || 10;
  const offset = (page - 1) * limit;

  // Obtener los proyectos paginados
  const proyectosQuery =
    "SELECT * FROM proyectos ORDER BY fecha DESC LIMIT ? OFFSET ?";
  const totalQuery = "SELECT COUNT(*) AS total FROM proyectos";

  const [proyectos, totalResult] = await Promise.all([
    executeQuery(proyectosQuery, [limit, offset]),
    executeQuery(totalQuery),
  ]);

  if (proyectos.length === 0) {
    return {
      proyectos: [],
      total: totalResult[0].total,
      page,
      limit,
    };
  }

  // Obtener los gastos de los proyectos obtenidos
  const proyectosIds = proyectos.map((p) => p.proyecto_id);
  const gastosQuery = `SELECT * FROM gastos_proyectos WHERE proyecto_id IN (${proyectosIds
    .map(() => "?")
    .join(", ")})`;
  const gastos = await executeQuery(gastosQuery, proyectosIds);

  // Mapear proyectos y agrupar los gastos
  const proyectosMap = proyectos.map((proyecto) => ({
    ...proyecto,
    gastos: gastos.filter(
      (gasto) => gasto.proyecto_id === proyecto.proyecto_id
    ),
  }));

  return {
    proyectos: proyectosMap,
    total: totalResult[0].total,
    page,
    limit,
  };
};

export const getProyectoById = async (id) => {
  // Obtener el proyecto por ID
  const proyectoQuery = "SELECT * FROM proyectos WHERE proyecto_id = ?";
  const proyectoResult = await executeQuery(proyectoQuery, [id]);

  if (proyectoResult.length === 0) {
    return null; // Si no hay proyecto, retornamos null
  }

  // Obtener los gastos asociados al proyecto
  const gastosQuery = "SELECT * FROM gastos_proyectos WHERE proyecto_id = ?";
  const gastosResult = await executeQuery(gastosQuery, [id]);

  // Retornar el proyecto con los gastos agrupados en un array
  return {
    ...proyectoResult[0],
    gastos: gastosResult,
  };
};

export const abonar = async (id, abono) => {
  const query = "UPDATE proyectos SET abono = abono + ? WHERE proyecto_id = ?";
  return executeQuery(query, [abono, id]);
};

export const createProyecto = async (data) => {
  validateProyectoData(data);

  const { gastos, ...proyectoData } = data; // Extraer gastos si vienen en la solicitud
  const proyectoQuery = `INSERT INTO proyectos (fecha, solicitante, nombre_proyecto, costo_servicio, abono) 
                         VALUES (?, ?, ?, ?, ?)`;
  const values = PROYECTO_FIELDS.map((field) => proyectoData[field]);

  // Ejecutamos la inserción del proyecto
  const result = await executeQuery(proyectoQuery, values);
  const proyectoId = result.insertId;

  // Si hay gastos, los insertamos en la tabla gastos_proyectos
  if (gastos && gastos.length > 0) {
    const gastosQuery = `INSERT INTO gastos_proyectos (proyecto_id, camioneta, campo, obreros, comidas, transporte, otros, peajes, combustible, hospedaje) 
                         VALUES ?`;

    const gastosValues = gastos.map((g) => [
      proyectoId,
      g.camioneta,
      g.campo,
      g.obreros,
      g.comidas,
      g.transporte,
      g.otros,
      g.peajes,
      g.combustible,
      g.hospedaje,
    ]);

    await executeQuery(gastosQuery, [gastosValues]);
  }

  return { proyectoId, message: "Proyecto creado con éxito" };
};

export const updateProyecto = async (id, data) => {
  validateProyectoData(data);

  const { gastos, ...proyectoData } = data;
  const proyectoQuery = `UPDATE proyectos SET fecha = ?, solicitante = ?, nombre_proyecto = ?, costo_servicio = ?, abono = ? 
                         WHERE proyecto_id = ?`;
  const values = [...PROYECTO_FIELDS.map((field) => proyectoData[field]), id];

  // Ejecutamos la actualización del proyecto
  await executeQuery(proyectoQuery, values);

  // Si hay gastos, los actualizamos o insertamos
  if (gastos && gastos.length > 0) {
    for (const g of gastos) {
      const gastoQuery = `
        INSERT INTO gastos_proyectos (proyecto_id, camioneta, campo, obreros, comidas, transporte, otros, peajes, combustible, hospedaje)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        camioneta = VALUES(camioneta), campo = VALUES(campo), obreros = VALUES(obreros), 
        comidas = VALUES(comidas), transporte = VALUES(transporte), otros = VALUES(otros), 
        peajes = VALUES(peajes), combustible = VALUES(combustible), hospedaje = VALUES(hospedaje)
      `;

      await executeQuery(gastoQuery, [
        id,
        g.camioneta,
        g.campo,
        g.obreros,
        g.comidas,
        g.transporte,
        g.otros,
        g.peajes,
        g.combustible,
        g.hospedaje,
      ]);
    }
  }

  return { proyectoId: id, message: "Proyecto actualizado con éxito" };
};

export const deleteProyecto = async (id) => {
  const query = "DELETE FROM proyectos WHERE proyecto_id = ?";
  return executeQuery(query, [id]);
};
