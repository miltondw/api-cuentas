import db from "../config/db.js";

// Obtener todas las cuentas del proyecto
const getAllCuentasProyecto = async (page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    const [rows] = await db
      .promise()
      .query("SELECT * FROM cuenta_del_proyecto LIMIT ? OFFSET ?", [
        limit,
        offset,
      ]);
    return rows;
  } catch (err) {
    throw new Error(
      "Error al obtener las cuentas del proyecto: " + err.message
    );
  }
};

// Obtener una cuenta del proyecto por ID
const getCuentaProyectoById = async (id) => {
  try {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM cuenta_del_proyecto WHERE id = ?", [id]);
    return rows[0];
  } catch (err) {
    throw new Error("Error al obtener la cuenta del proyecto: " + err.message);
  }
};

// Crear una nueva cuenta del proyecto
const createCuentaProyecto = async (data) => {
  const {
    fecha,
    solicitante,
    nombreProyecto,
    obrero,
    costoServicio,
    abono,
    gastoCamioneta,
    gastosCampo,
    pagoObreros,
    comidas,
    transporte,
    gastosVarios,
    peajes,
    combustible,
    hospedaje,
  } = data;

  try {
    const [result] = await db.promise().query(
      `INSERT INTO cuenta_del_proyecto 
        (fecha, solicitante, nombreProyecto, obrero, costoServicio, abono, gastoCamioneta, gastosCampo, pagoObreros, comidas, transporte, gastosVarios, peajes, combustible, hospedaje)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fecha,
        solicitante,
        nombreProyecto,
        obrero,
        costoServicio,
        abono,
        gastoCamioneta,
        gastosCampo,
        pagoObreros,
        comidas,
        transporte,
        gastosVarios,
        peajes,
        combustible,
        hospedaje,
      ]
    );
    return result;
  } catch (err) {
    throw new Error("Error al crear la cuenta del proyecto: " + err.message);
  }
};

// Actualizar una cuenta del proyecto por ID
const updateCuentaProyecto = async (id, data) => {
  const {
    fecha,
    solicitante,
    nombreProyecto,
    obrero,
    costoServicio,
    abono,
    gastoCamioneta,
    gastosCampo,
    pagoObreros,
    comidas,
    transporte,
    gastosVarios,
    peajes,
    combustible,
    hospedaje,
  } = data;

  try {
    const [result] = await db.promise().query(
      `UPDATE cuenta_del_proyecto SET 
        fecha = ?, solicitante = ?, nombreProyecto = ?, obrero = ?, costoServicio = ?, abono = ?, gastoCamioneta = ?, gastosCampo = ?, pagoObreros = ?, comidas = ?, transporte = ?, gastosVarios = ?, peajes = ?, combustible = ?, hospedaje = ?
        WHERE id = ?`,
      [
        fecha,
        solicitante,
        nombreProyecto,
        obrero,
        costoServicio,
        abono,
        gastoCamioneta,
        gastosCampo,
        pagoObreros,
        comidas,
        transporte,
        gastosVarios,
        peajes,
        combustible,
        hospedaje,
        id,
      ]
    );
    return result;
  } catch (err) {
    throw new Error(
      "Error al actualizar la cuenta del proyecto: " + err.message
    );
  }
};

// Eliminar una cuenta del proyecto por ID
const deleteCuentaProyecto = async (id) => {
  try {
    const [result] = await db
      .promise()
      .query("DELETE FROM cuenta_del_proyecto WHERE id = ?", [id]);
    return result;
  } catch (err) {
    throw new Error("Error al eliminar la cuenta del proyecto: " + err.message);
  }
};

export {
  getAllCuentasProyecto,
  getCuentaProyectoById,
  createCuentaProyecto,
  updateCuentaProyecto,
  deleteCuentaProyecto,
};
