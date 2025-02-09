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

export const getGastosByProyectoId = async (proyecto_id) => {
  const query = "SELECT * FROM gastos_proyectos WHERE proyecto_id = ?";
  return executeQuery(query, [proyecto_id]);
};

export const createGastoProyecto = async (proyecto_id, gastos) => {
  const query = `INSERT INTO gastos_proyectos 
    (proyecto_id, camioneta, campo, obreros, comidas, transporte, otros, peajes, combustible, hospedaje) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    proyecto_id,
    gastos.camioneta,
    gastos.campo,
    gastos.obreros,
    gastos.comidas,
    gastos.transporte,
    gastos.otros,
    gastos.peajes,
    gastos.combustible,
    gastos.hospedaje,
  ];
  return executeQuery(query, params);
};

export const updateGastoProyecto = async (id, gastos) => {
  const query = `UPDATE gastos_proyectos SET 
    camioneta = ?, campo = ?, obreros = ?, comidas = ?, transporte = ?, otros = ?, peajes = ?, combustible = ?, hospedaje = ? 
    WHERE gasto_proyecto_id = ?`;
  const params = [
    gastos.camioneta,
    gastos.campo,
    gastos.obreros,
    gastos.comidas,
    gastos.transporte,
    gastos.otros,
    gastos.peajes,
    gastos.combustible,
    gastos.hospedaje,
    id,
  ];
  return executeQuery(query, params);
};

export const deleteGastoProyecto = async (id) => {
  const query = "DELETE FROM gastos_proyectos WHERE gasto_proyecto_id = ?";
  return executeQuery(query, [id]);
};
