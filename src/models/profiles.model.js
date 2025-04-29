// profiles.model.js
import db from "../config/db.js";

/**
 * Ejecuta una consulta SQL con manejo de errores mejorado
 * @param {string} query - Consulta SQL
 * @param {Array} params - Parámetros para la consulta
 * @returns {Promise<Array>} - Resultados de la consulta
 * @throws {Error} - Error detallado si falla la consulta
 */
const executeQuery = async (query, params = []) => {
  try {
    const [results] = await db.query(query, params);
    return results;
  } catch (error) {
    console.error(`Error en consulta SQL: ${query}`, error);
    // Crear un error más descriptivo y seguro (sin exponer detalles sensibles en producción)
    const isProd = process.env.NODE_ENV === "production";
    const errorMsg = isProd
      ? `Error en la base de datos: ${error.code || "DB_ERROR"}`
      : `Error en la base de datos: ${error.message}`;
    const customError = new Error(errorMsg);
    customError.code = error.code; // Mantener el código de error original
    customError.sqlState = error.sqlState; // Mantener el estado SQL si existe
    throw customError;
  }
};

/**
 * Valida los datos de un perfil antes de realizar operaciones
 * @param {Object} data - Datos del perfil a validar
 * @throws {Error} - Si los datos no son válidos
 */
const validarDatosPerfil = (data) => {
  const { project_id, profile_date, samples_number, sounding_number } = data;

  if (!project_id) throw new Error("El ID del proyecto es obligatorio");
  if (!sounding_number) throw new Error("El número de sondeo es obligatorio");

  if (
    samples_number !== null &&
    samples_number !== undefined &&
    isNaN(parseInt(samples_number))
  ) {
    throw new Error("El número de muestras debe ser un número entero válido");
  }

  // Verificar que la fecha sea válida
  if (profile_date && isNaN(new Date(profile_date).getTime())) {
    throw new Error("La fecha del perfil debe ser válida");
  }
};

/**
 * Valida los datos de golpes antes de realizar operaciones
 * @param {Array} blowsData - Datos de golpes a validar
 * @throws {Error} - Si los datos no son válidos
 */
const validarDatosGolpes = (blowsData) => {
  if (!Array.isArray(blowsData)) {
    throw new Error("Los datos de golpes deben ser un array");
  }

  blowsData.forEach((blow, index) => {
    if (blow.depth === undefined || blow.depth === null) {
      throw new Error(
        `La profundidad es obligatoria para el golpe en la posición ${index}`
      );
    }

    if (isNaN(parseFloat(blow.depth))) {
      throw new Error(
        `La profundidad debe ser un número válido para el golpe en la posición ${index}`
      );
    }

    // Validar que los golpes sean números enteros válidos
    ["blows6", "blows12", "blows18", "n"].forEach((campo) => {
      if (
        blow[campo] !== undefined &&
        blow[campo] !== null &&
        isNaN(parseInt(blow[campo]))
      ) {
        throw new Error(
          `El campo ${campo} debe ser un número entero válido para el golpe en la posición ${index}`
        );
      }
    });
  });
};

/**
 * Obtiene todos los perfiles de un proyecto con sus golpes.
 * @param {number} projectId - ID del proyecto.
 * @returns {Object} - Lista de perfiles con sus datos de golpes.
 */
export const obtenerPerfilesPorProyecto = async (projectId) => {
  if (!projectId) throw new Error("El ID del proyecto es obligatorio");

  try {
    const perfiles = await executeQuery(
      "SELECT * FROM profiles WHERE project_id = ? ORDER BY profile_id",
      [projectId]
    );

    // Si no hay perfiles, devolver array vacío
    if (!perfiles.length) {
      return { success: true, perfiles: [] };
    }

    const profileIds = perfiles.map((p) => p.profile_id);

    // Si no hay profileIds, devolver perfiles sin datos de golpes
    if (profileIds.length === 0) {
      return { success: true, perfiles };
    }

    const blows = await executeQuery(
      `SELECT * FROM blows WHERE profile_id IN (${profileIds
        .map(() => "?")
        .join(", ")}) ORDER BY depth ASC`,
      profileIds
    );

    const perfilesConBlows = perfiles.map((perfil) => ({
      ...perfil,
      blows_data: blows.filter((b) => b.profile_id === perfil.profile_id),
    }));

    return { success: true, perfiles: perfilesConBlows };
  } catch (error) {
    console.error("Error al obtener perfiles por proyecto:", error);
    throw error;
  }
};

/**
 * Obtiene un perfil específico con sus golpes.
 * @param {number} projectId - ID del proyecto.
 * @param {number} profileId - Número del id del sondeo.
 * @returns {Object} - Perfil encontrado o null.
 */
export const obtenerPerfil = async (projectId, profileId) => {
  if (!projectId) throw new Error("El ID del proyecto es obligatorio");
  if (!profileId) throw new Error("El ID del perfil es obligatorio");

  try {
    const [perfil] = await executeQuery(
      "SELECT * FROM profiles WHERE project_id = ? AND profile_id = ?",
      [projectId, profileId]
    );

    if (!perfil) {
      return { success: false, message: "Perfil no encontrado" };
    }

    const blows = await executeQuery(
      "SELECT * FROM blows WHERE profile_id = ? ORDER BY depth ASC",
      [perfil.profile_id]
    );

    return {
      success: true,
      perfil: { ...perfil, blows_data: blows },
    };
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    throw error;
  }
};

/**
 * Crea un nuevo perfil y sus datos de golpes.
 * @param {Object} data - Datos del perfil.
 * @returns {Object} - Resultado de la creación.
 */
export const crearPerfil = async (data) => {
  // Validar los datos antes de proceder
  validarDatosPerfil(data);

  const {
    project_id,
    location,
    sounding_number,
    water_level,
    profile_date,
    samples_number,
    blows_data,
  } = data;

  // Validar datos de golpes si se proporcionan
  if (blows_data && blows_data.length) {
    validarDatosGolpes(blows_data);
  }

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Crear el perfil
    const [profileResult] = await connection.query(
      `INSERT INTO profiles (project_id, location,sounding_number,water_level, profile_date, samples_number)
       VALUES (?, ?, ?, ?, ?,?)`,
      [
        project_id,
        location,
        sounding_number,
        water_level,
        profile_date,
        samples_number,
      ]
    );
    const profile_id = profileResult.insertId;
    // Insertar datos de golpes si existen
    if (blows_data && blows_data.length > 0) {
      const blowValues = blows_data.map((blow) => [
        profile_id,
        blow.depth,
        blow.blows6 || 0,
        blow.blows12 || 0,
        blow.blows18 || 0,
        blow.n || 0,
        blow.observation || null,
      ]);

      await connection.query(
        "INSERT INTO blows (profile_id, depth, blows6, blows12, blows18, n, observation) VALUES ?",
        [blowValues]
      );
    }

    await connection.commit();
    return {
      success: true,
      profile_id,
      project_id,
      message: "Perfil creado con éxito",
    };
  } catch (error) {
    await connection.rollback();
    console.error("Error al crear perfil:", error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Actualiza un perfil existente y sus datos de golpes.
 * @param {number} projectId - ID del proyecto.
 * @param {number} profileId - Número del id del sondeo.
 * @param {Object} data - Datos actualizados del perfil.
 * @returns {Object} - Resultado de la actualización.
 */
export const actualizarPerfil = async (projectId, profileId, data) => {
  if (!projectId) throw new Error("El ID del proyecto es obligatorio");
  if (!profileId) throw new Error("El ID del perfil es obligatorio");

  const {
    sounding_number,
    location,
    water_level,
    profile_date,
    samples_number,
    blows_data,
  } = data;

  // Validar datos de golpes si se proporcionan
  if (blows_data && blows_data.length) {
    validarDatosGolpes(blows_data);
  }

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Verificar si el perfil existe
    const [existingProfiles] = await connection.query(
      "SELECT profile_id FROM profiles WHERE project_id = ? AND profile_id = ?",
      [projectId, profileId]
    );

    if (!existingProfiles || existingProfiles.length === 0) {
      throw new Error("Perfil no encontrado");
    }

    // Actualizar los datos del perfil
    await connection.query(
      `UPDATE profiles SET location=?, sounding_number=?, water_level = ?, profile_date = ?, samples_number = ?, 
      updated_at = CURRENT_TIMESTAMP
       WHERE project_id = ? AND profile_id = ?`,
      [
        location,
        sounding_number,
        water_level,
        profile_date,
        samples_number,
        projectId,
        profileId,
      ]
    );

    // Eliminar los golpes existentes y volver a insertarlos
    await connection.query("DELETE FROM blows WHERE profile_id = ?", [
      profileId,
    ]);

    if (blows_data && blows_data.length > 0) {
      const blowValues = blows_data.map((blow) => [
        profileId,
        blow.depth,
        blow.blows6 !== undefined ? blow.blows6 : 0,
        blow.blows12 !== undefined ? blow.blows12 : 0,
        blow.blows18 !== undefined ? blow.blows18 : 0,
        blow.n !== undefined ? blow.n : 0,
        blow.observation || null,
      ]);

      await connection.query(
        "INSERT INTO blows (profile_id, depth, blows6, blows12, blows18, n, observation) VALUES ?",
        [blowValues]
      );
    }

    await connection.commit();
    return {
      success: true,
      message: "Perfil actualizado con éxito",
      project_id: projectId,
      profile_id: profileId,
    };
  } catch (error) {
    await connection.rollback();
    console.error("Error al actualizar perfil:", error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Elimina un perfil y sus datos de golpes.
 * @param {number} projectId - ID del proyecto.
 * @param {number} profileId - Número del sondeo.
 * @returns {Object} - Resultado de la eliminación.
 */
export const eliminarPerfil = async (projectId, profileId) => {
  if (!projectId) throw new Error("El ID del proyecto es obligatorio");
  if (!profileId) throw new Error("El ID del perfil es obligatorio");

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Primero verificar si el perfil existe
    const [existingProfile] = await connection.query(
      "SELECT COUNT(*) as count FROM profiles WHERE project_id = ? AND profile_id = ?",
      [projectId, profileId]
    );

    if (!existingProfile || existingProfile[0].count === 0) {
      return { success: false, message: "Perfil no encontrado" };
    }

    // Eliminar primero los golpes relacionados (por seguridad en caso de que no exista CASCADE)
    await connection.query("DELETE FROM blows WHERE profile_id = ?", [
      profileId,
    ]);

    // Eliminar el perfil
    const [result] = await connection.query(
      "DELETE FROM profiles WHERE project_id = ? AND profile_id = ?",
      [projectId, profileId]
    );

    await connection.commit();

    return {
      success: true,
      message: "Perfil eliminado con éxito",
      project_id: projectId,
      profile_id: profileId,
      affectedRows: result.affectedRows,
    };
  } catch (error) {
    await connection.rollback();
    console.error("Error al eliminar perfil:", error);
    throw error;
  } finally {
    connection.release();
  }
};
