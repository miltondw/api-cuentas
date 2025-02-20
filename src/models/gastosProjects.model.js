// gastosProjects.model.js
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

export const getGastosByProyectoId = async (id) => {
  const query = "SELECT * FROM gastos_proyectos WHERE gasto_proyecto_id  = ?";
  return executeQuery(query, [id]);
};

/**
 * Extrae los campos adicionales (no fijos) de un objeto gasto.
 * Los campos fijos son: camioneta, campo, obreros, comidas, otros, peajes, combustible, hospedaje
 */
const extractExtras = (gasto) => {
  const fixedFields = [
    "camioneta",
    "campo",
    "obreros",
    "comidas",
    "otros",
    "peajes",
    "combustible",
    "hospedaje",
  ];
  const extras = {};
  for (const key in gasto) {
    if (!fixedFields.includes(key)) {
      extras[key] = gasto[key];
    }
  }
  return Object.keys(extras).length > 0 ? extras : null;
};

export const createGastoProyecto = async (proyecto_id, gasto) => {
  // Extraer los campos extras (si existen)
  const extras = extractExtras(gasto);
  const query = `INSERT INTO gastos_proyectos 
    (proyecto_id, camioneta, campo, obreros, comidas, otros, peajes, combustible, hospedaje, otros_campos) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    proyecto_id,
    gasto.camioneta,
    gasto.campo,
    gasto.obreros,
    gasto.comidas,
    gasto.otros,
    gasto.peajes,
    gasto.combustible,
    gasto.hospedaje,
    extras ? JSON.stringify(extras) : null,
  ];
  return executeQuery(query, params);
};

export const updateGastoProyecto = async (id, gasto) => {
  const extras = extractExtras(gasto);
  const query = `UPDATE gastos_proyectos SET 
    camioneta = ?, campo = ?, obreros = ?, comidas = ?, otros = ?, peajes = ?, combustible = ?, hospedaje = ?, otros_campos = ?
    WHERE gasto_proyecto_id = ?`;
  const params = [
    gasto.camioneta,
    gasto.campo,
    gasto.obreros,
    gasto.comidas,
    gasto.otros,
    gasto.peajes,
    gasto.combustible,
    gasto.hospedaje,
    extras ? JSON.stringify(extras) : null,
    id,
  ];
  return executeQuery(query, params);
};

export const deleteGastoProyecto = async (id) => {
  const query = "DELETE FROM gastos_proyectos WHERE gasto_proyecto_id = ?";
  return executeQuery(query, [id]);
};

// Nueva función: elimina TODOS los gastos asociados a un proyecto
export const deleteGastosByProyectoId = async (proyecto_id) => {
  const query = "DELETE FROM gastos_proyectos WHERE proyecto_id = ?";
  return executeQuery(query, [proyecto_id]);
};
