// profiles.model.js
import db from "../config/db.js";

const executeQuery = async (query, params = []) => {
  try {
    const [results] = await db.query(query, params);
    return results;
  } catch (error) {
    console.error(`Error en consulta SQL: ${query}`, error);
    throw new Error(`Error en la base de datos: ${error.message}`);
  }
};

/**
 * Obtiene todos los perfiles de un proyecto con sus golpes.
 * @param {number} projectId - ID del proyecto.
 * @returns {Object} - Lista de perfiles con sus datos de golpes.
 */
export const obtenerPerfilesPorProyecto = async (projectId) => {
  const perfiles = await executeQuery(
    "SELECT * FROM profiles WHERE project_id = ?",
    [projectId]
  );

  const profileIds = perfiles.map((p) => p.profile_id);
  const blows = profileIds.length
    ? await executeQuery(
        `SELECT * FROM blows WHERE profile_id IN (${profileIds
          .map(() => "?")
          .join(", ")})`,
        profileIds
      )
    : [];

  const perfilesConBlows = perfiles.map((perfil) => ({
    ...perfil,
    blows_data: blows.filter((b) => b.profile_id === perfil.profile_id),
  }));

  return { success: true, perfiles: perfilesConBlows };
};

/**
 * Obtiene un perfil específico con sus golpes.
 * @param {number} projectId - ID del proyecto.
 * @param {number} profileId - Número del sondeo.
 * @returns {Object} - Perfil encontrado o null.
 */
export const obtenerPerfil = async (projectId, profileId) => {
  const [perfil] = await executeQuery(
    "SELECT * FROM profiles WHERE project_id = ? AND profile_id = ?",
    [projectId, profileId]
  );
  if (!perfil) {
    return { success: false, message: "Perfil no encontrado" };
  }

  const blows = await executeQuery("SELECT * FROM blows WHERE profile_id = ?", [
    perfil.profile_id,
  ]);

  return {
    success: true,
    perfil: { ...perfil, blows_data: blows },
  };
};

/**
 * Crea un nuevo perfil y sus datos de golpes.
 * @param {Object} data - Datos del perfil.
 * @returns {Object} - Resultado de la creación.
 */
export const crearPerfil = async (data) => {
  const {
    project_id,
    profile_id,
    water_level,
    profile_date,
    samples_number,
    blows_data,
  } = data;

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const [profileResult] = await connection.query(
      `INSERT INTO profiles (project_id, profile_id, water_level, profile_date, samples_number)
       VALUES (?, ?, ?, ?, ?)`,
      [project_id, profile_id, water_level, profile_date, samples_number]
    );

    const profileId = profileResult.insertId;
    if (blows_data && blows_data.length > 0) {
      const blowValues = blows_data.map((blow) => [
        profileId,
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
      profile_id: profileId,
      message: "Perfil creado con éxito",
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Actualiza un perfil existente y sus datos de golpes.
 * @param {number} projectId - ID del proyecto.
 * @param {number} profileId - Número del sondeo.
 * @param {Object} data - Datos actualizados del perfil.
 * @returns {Object} - Resultado de la actualización.
 */
export const actualizarPerfil = async (projectId, profileId, data) => {
  const { water_level, profile_date, samples_number, blows_data } = data;

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const [profile] = await connection.query(
      "SELECT profile_id FROM profiles WHERE project_id = ? AND profile_id = ?",
      [projectId, profileId]
    );
    if (!profile) {
      throw new Error("Perfil no encontrado");
    }
    const profileId = profile.profile_id;

    await connection.query(
      `UPDATE profiles SET water_level = ?, profile_date = ?, samples_number = ?
       WHERE profile_id = ?`,
      [water_level, profile_date, samples_number, profileId]
    );

    // Eliminar los golpes existentes y volver a insertarlos
    await connection.query("DELETE FROM blows WHERE profile_id = ?", [
      profileId,
    ]);
    if (blows_data && blows_data.length > 0) {
      const blowValues = blows_data.map((blow) => [
        profileId,
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
    return { success: true, message: "Perfil actualizado con éxito" };
  } catch (error) {
    await connection.rollback();
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
  const [result] = await executeQuery(
    "DELETE FROM profiles WHERE project_id = ? AND profile_id = ?",
    [projectId, profileId]
  );

  if (result.affectedRows === 0) {
    return { success: false, message: "Perfil no encontrado" };
  }

  // La eliminación de los golpes se maneja automáticamente por ON DELETE CASCADE
  return { success: true, message: "Perfil eliminado con éxito" };
};
