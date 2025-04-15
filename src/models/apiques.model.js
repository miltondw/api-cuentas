import db from "../config/db.js";

// Reutilizamos la función executeQuery del archivo de perfiles
const executeQuery = async (query, params = []) => {
  try {
    const [results] = await db.query(query, params);
    return results;
  } catch (error) {
    console.error(`Error en consulta SQL: ${query}`, error);
    const isProd = process.env.NODE_ENV === "production";
    const errorMsg = isProd
      ? `Error en la base de datos: ${error.code || "DB_ERROR"}`
      : `Error en la base de datos: ${error.message}`;
    const customError = new Error(errorMsg);
    customError.code = error.code;
    customError.sqlState = error.sqlState;
    throw customError;
  }
};

/**
 * Valida los datos de un apique
 * @param {Object} data - Datos del apique
 * @throws {Error} - Si los datos no son válidos
 */
const validarDatosApique = (data) => {
  const { project_id, apique_id, location, depth, date } = data;

  if (!project_id) throw new Error("El ID del proyecto es obligatorio");
  if (!apique_id) throw new Error("El ID del apique es obligatorio");
  if (!location) throw new Error("La ubicación es obligatoria");

  if (depth && isNaN(parseFloat(depth))) {
    throw new Error("La profundidad debe ser un número válido");
  }

  if (date && isNaN(new Date(date).getTime())) {
    throw new Error("La fecha debe ser válida");
  }
};

/**
 * Valida los datos de las capas
 * @param {Array} layersData - Datos de las capas
 * @throws {Error} - Si los datos no son válidos
 */
const validarCapas = (layersData) => {
  if (!Array.isArray(layersData)) {
    throw new Error("Las capas deben ser un array");
  }

  layersData.forEach((capa, index) => {
    if (!capa.layer_number || isNaN(parseInt(capa.layer_number))) {
      throw new Error(`Número de capa inválido en la posición ${index}`);
    }

    if (capa.thickness && isNaN(parseFloat(capa.thickness))) {
      throw new Error(`Espesor inválido en la capa ${index + 1}`);
    }
  });
};

export const obtenerApiquesPorProyecto = async (projectId) => {
  try {
    const apiques = await executeQuery(
      `SELECT a.*, p.nombre_proyecto as proyecto_nombre 
       FROM apiques a
       JOIN proyectos p ON a.proyecto_id = p.proyecto_id
       WHERE a.proyecto_id = ?`,
      [projectId]
    );

    if (!apiques.length) return { success: true, apiques: [] };

    const apiqueIds = apiques.map((a) => a.apique_id);
    const capas = await executeQuery(
      `SELECT * FROM layers WHERE apique_id IN (${apiqueIds
        .map(() => "?")
        .join(", ")})`,
      apiqueIds
    );

    const apiquesConCapas = apiques.map((apique) => ({
      ...apique,
      layers: capas.filter((c) => c.apique_id === apique.apique_id),
    }));

    return { success: true, apiques: apiquesConCapas };
  } catch (error) {
    console.error("Error al obtener apiques:", error);
    throw error;
  }
};

export const obtenerApique = async (projectId, apiqueId) => {
  try {
    const [apique] = await executeQuery(
      `SELECT a.*, p.nombre_proyecto as proyecto_nombre 
       FROM apiques a
       JOIN proyectos p ON a.proyecto_id = p.proyecto_id
       WHERE a.proyecto_id = ? AND a.apique_id = ?`,
      [projectId, apiqueId]
    );

    if (!apique) return { success: false, message: "Apique no encontrado" };

    const capas = await executeQuery(
      "SELECT * FROM layers WHERE apique_id = ? ORDER BY layer_number",
      [apiqueId]
    );

    return {
      success: true,
      apique: { ...apique, layers: capas },
    };
  } catch (error) {
    console.error("Error al obtener apique:", error);
    throw error;
  }
};

export const crearApique = async (data) => {
  validarDatosApique(data);
  validarCapas(data.layers || []);

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Verificar apique único por proyecto
    const [existente] = await connection.query(
      "SELECT apique_id FROM apiques WHERE proyecto_id = ? AND apique_id = ?",
      [data.project_id, data.apique_id]
    );

    if (existente.length > 0) {
      throw new Error("Ya existe un apique con este ID en el proyecto");
    }

    // Insertar apique
    await connection.query(
      `INSERT INTO apiques (
        apique_id, proyecto_id, location, depth, date, 
        cbr_unaltered, depth_tomo, molde
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.apique_id,
        data.project_id,
        data.location,
        data.depth,
        data.date,
        data.cbr_unaltered || false,
        data.depth_tomo,
        data.molde,
      ]
    );

    // Insertar capas
    if (data.layers && data.layers.length > 0) {
      const valoresCapas = data.layers.map((capa) => [
        data.apique_id,
        capa.layer_number,
        capa.thickness,
        capa.sample_id || null,
        capa.observation || null,
      ]);

      await connection.query(
        `INSERT INTO layers (
          apique_id, layer_number, thickness, sample_id, observation
        ) VALUES ?`,
        [valoresCapas]
      );
    }

    await connection.commit();
    return {
      success: true,
      apique_id: data.apique_id,
      message: "Apique creado exitosamente",
    };
  } catch (error) {
    await connection.rollback();
    console.error("Error al crear apique:", error);
    throw error;
  } finally {
    connection.release();
  }
};

export const actualizarApique = async (projectId, apiqueId, data) => {
  validarCapas(data.layers || []);

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Verificar existencia
    const [existente] = await connection.query(
      "SELECT proyecto_id FROM apiques WHERE proyecto_id = ? AND apique_id = ?",
      [projectId, apiqueId]
    );

    if (!existente.length) {
      throw new Error("Apique no encontrado");
    }

    // Actualizar apique
    await connection.query(
      `UPDATE apiques SET
        location = ?, depth = ?, date = ?, cbr_unaltered = ?,
        depth_tomo = ?, molde = ?
       WHERE proyecto_id = ? AND apique_id = ?`,
      [
        data.location,
        data.depth,
        data.date,
        data.cbr_unaltered,
        data.depth_tomo,
        data.molde,
        projectId,
        apiqueId,
      ]
    );

    // Actualizar capas (eliminar y recrear)
    await connection.query("DELETE FROM layers WHERE apique_id = ?", [
      apiqueId,
    ]);

    if (data.layers && data.layers.length > 0) {
      const valoresCapas = data.layers.map((capa) => [
        apiqueId,
        capa.layer_number,
        capa.thickness,
        capa.sample_id || null,
        capa.observation || null,
      ]);

      await connection.query(
        `INSERT INTO layers (
          apique_id, layer_number, thickness, sample_id, observation
        ) VALUES ?`,
        [valoresCapas]
      );
    }

    await connection.commit();
    return {
      success: true,
      message: "Apique actualizado exitosamente",
    };
  } catch (error) {
    await connection.rollback();
    console.error("Error al actualizar apique:", error);
    throw error;
  } finally {
    connection.release();
  }
};

export const eliminarApique = async (projectId, apiqueId) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Eliminar capas primero
    await connection.query("DELETE FROM layers WHERE apique_id = ?", [
      apiqueId,
    ]);

    // Eliminar apique
    const [result] = await connection.query(
      "DELETE FROM apiques WHERE proyecto_id = ? AND apique_id = ?",
      [projectId, apiqueId]
    );

    if (result.affectedRows === 0) {
      throw new Error("Apique no encontrado");
    }

    await connection.commit();
    return {
      success: true,
      message: "Apique eliminado exitosamente",
    };
  } catch (error) {
    await connection.rollback();
    console.error("Error al eliminar apique:", error);
    throw error;
  } finally {
    connection.release();
  }
};
