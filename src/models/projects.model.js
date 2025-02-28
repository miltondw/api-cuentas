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

const REQUIRED_FIELDS = [
  "fecha",
  "solicitante",
  "nombre_proyecto",
  "obrero",
  "costo_servicio",
  "abono",
];
const ALL_FIELDS = [
  ...REQUIRED_FIELDS,
  "factura",
  "valor_retencion",
  "metodo_de_pago",
];

/**
 * Valida los datos de un proyecto.
 * @param {Object} data - Datos del proyecto.
 * @throws {Error} Si faltan campos requeridos o los datos no son válidos.
 */
const validateProyectoData = (data) => {
  const missingFields = REQUIRED_FIELDS.filter((field) => !(field in data));
  if (missingFields.length > 0) {
    throw new Error(`Campos faltantes: ${missingFields.join(", ")}`);
  }

  // Validar tipos de datos
  if (isNaN(new Date(data.fecha).getTime())) {
    throw new Error("El campo 'fecha' debe ser una fecha válida");
  }
  if (typeof data.solicitante !== "string" || data.solicitante.trim() === "") {
    throw new Error("El campo 'solicitante' debe ser un texto válido");
  }
};

/**
 * Parsea el campo `otros_campos` de un gasto.
 * @param {string} otros_campos - Cadena JSON con los otros campos.
 * @returns {Object} - Objeto parseado o un objeto vacío si hay un error.
 */
const parseOtrosCampos = (otros_campos) => {
  if (!otros_campos) return {}; // Si es null o undefined, retorna un objeto vacío

  try {
    // Si otros_campos es un string, intenta parsearlo como JSON
    if (typeof otros_campos === "string") {
      return JSON.parse(otros_campos);
    }
    // Si ya es un objeto, retórnalo directamente
    return otros_campos;
  } catch (error) {
    console.error("Error al parsear otros_campos:", error);
    return {}; // Retorna un objeto vacío si hay un error
  }
};

/**
 * Obtiene todos los proyectos con paginación.
 * @param {number} page - Número de página (por defecto 1).
 * @param {number} limit - Número de proyectos por página (por defecto 10).
 * @returns {Object} - Objeto con los proyectos, total de proyectos, página actual y límite.
 */
export const obtenerProyectos = async (page = 1, limit = 10) => {
  page = Number(page) || 1;
  limit = Number(limit) || 10;
  const offset = (page - 1) * limit;

  const [proyectos, totalResult] = await Promise.all([
    executeQuery(
      "SELECT * FROM proyectos ORDER BY proyecto_id DESC LIMIT ? OFFSET ?",
      [limit, offset]
    ),
    executeQuery("SELECT COUNT(*) AS total FROM proyectos"),
  ]);

  const total = totalResult[0].total;
  const totalPages = Math.ceil(total / limit);

  if (!proyectos.length)
    return { success: true, proyectos: [], total, page, limit, totalPages };

  const proyectosIds = proyectos.map((p) => p.proyecto_id);
  const placeholders = proyectosIds.map(() => "?").join(", ");
  const gastos = await executeQuery(
    `SELECT * FROM gastos_proyectos WHERE proyecto_id IN (${placeholders})`,
    proyectosIds
  );

  const proyectosMap = proyectos.map((proyecto) => {
    const gastoProyecto =
      gastos.find((gasto) => gasto.proyecto_id === proyecto.proyecto_id) || {};
    return {
      ...proyecto,
      gastos: {
        ...gastoProyecto,
        otros_campos: parseOtrosCampos(gastoProyecto.otros_campos),
      },
    };
  });

  return {
    success: true,
    proyectos: proyectosMap,
    total,
    page,
    limit,
    totalPages,
  };
};

/**
 * Crea un nuevo proyecto y sus gastos asociados.
 * @param {Object} data - Datos del proyecto y sus gastos.
 * @returns {Object} - Objeto con el ID del proyecto creado y un mensaje de éxito.
 */
export const crearProyecto = async (data) => {
  validateProyectoData(data);
  const { gastos, ...proyectoData } = data;

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const [result] = await connection.query(
      `INSERT INTO proyectos (${ALL_FIELDS.join(
        ", "
      )}) VALUES (${ALL_FIELDS.map(() => "?").join(", ")})`,
      ALL_FIELDS.map((field) => proyectoData[field] ?? null)
    );

    const proyectoId = result.insertId;
    if (gastos) {
      await insertGastos(connection, proyectoId, gastos);
    }

    await connection.commit();
    return { success: true, result, message: "Proyecto creado con éxito" };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Inserta los gastos asociados a un proyecto.
 * @param {Object} connection - Conexión a la base de datos.
 * @param {number} proyectoId - ID del proyecto.
 * @param {Object} gastos - Datos de los gastos.
 */
const insertGastos = async (connection, proyectoId, gastos) => {
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

  // Filtra solo los campos que no están en fixedFields y no son "otros_campos"
  const extras = Object.fromEntries(
    Object.entries(gastos).filter(
      ([key]) => !fixedFields.includes(key) && key !== "otros_campos"
    )
  );

  // Convierte extras a JSON si no está vacío
  const otrosCamposJSON =
    Object.keys(extras).length > 0 ? JSON.stringify(extras) : null;

  // Combina los campos fijos, extras y otros_campos
  await connection.query(
    `INSERT INTO gastos_proyectos (proyecto_id, camioneta, campo, obreros, comidas, otros, peajes, combustible, hospedaje, otros_campos)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      proyectoId,
      gastos.camioneta || 0,
      gastos.campo || 0,
      gastos.obreros || 0,
      gastos.comidas || 0,
      gastos.otros || 0,
      gastos.peajes || 0,
      gastos.combustible || 0,
      gastos.hospedaje || 0,
      gastos.otros_campos
        ? JSON.stringify(gastos.otros_campos)
        : otrosCamposJSON,
    ]
  );
};

/**
 * Obtiene un proyecto por su ID.
 * @param {number} id - ID del proyecto.
 * @returns {Object} - Objeto con el proyecto y sus gastos.
 */
export const obtenerProyecto = async (id) => {
  const [proyecto] = await executeQuery(
    "SELECT * FROM proyectos WHERE proyecto_id = ?",
    [id]
  );
  if (!proyecto) return { success: false, proyecto: null };

  const [gastos] = await executeQuery(
    "SELECT * FROM gastos_proyectos WHERE proyecto_id = ?",
    [id]
  );

  return {
    success: true,
    proyecto: {
      ...proyecto,
      gastos: {
        ...gastos,
        otros_campos: parseOtrosCampos(gastos.otros_campos),
      },
    },
  };
};

/**
 * Actualiza un proyecto y sus gastos.
 * @param {number} id - ID del proyecto.
 * @param {Object} data - Datos actualizados del proyecto y sus gastos.
 * @returns {Object} - Objeto con un mensaje de éxito.
 */
export const actualizarProyecto = async (id, data) => {
  validateProyectoData(data);
  const { gastos, ...proyectoData } = data;

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    await connection.query(
      `UPDATE proyectos SET ${ALL_FIELDS.map((field) => `${field} = ?`).join(
        ", "
      )} WHERE proyecto_id = ?`,
      [...ALL_FIELDS.map((field) => proyectoData[field] ?? null), id]
    );

    if (gastos) {
      await connection.query(
        "DELETE FROM gastos_proyectos WHERE proyecto_id = ?",
        [id]
      );
      await insertGastos(connection, id, gastos);
    }

    await connection.commit();
    return { success: true, message: "Proyecto actualizado con éxito" };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Abona a un proyecto.
 * @param {number} id - ID del proyecto.
 * @param {number} abono - Cantidad a abonar.
 * @returns {Object} - Objeto con un mensaje de éxito.
 */
export const abonarProyecto = async (id, abono) => {
  abono = Number(abono);
  if (isNaN(abono)) throw new Error("El abono debe ser un número válido");

  const [proyecto] = await executeQuery(
    "SELECT costo_servicio, abono FROM proyectos WHERE proyecto_id = ?",
    [id]
  );
  if (!proyecto) throw new Error("Proyecto no encontrado");

  const nuevoAbono = proyecto.abono + abono;
  if (nuevoAbono > proyecto.costo_servicio) {
    throw new Error("El abono no puede exceder el costo del servicio");
  }

  await executeQuery("UPDATE proyectos SET abono = ? WHERE proyecto_id = ?", [
    nuevoAbono,
    id,
  ]);
  return { success: true, message: "Abono realizado con éxito" };
};

/**
 * Elimina un proyecto y sus gastos asociados.
 * @param {number} id - ID del proyecto.
 * @returns {Object} - Objeto con un mensaje de éxito.
 */
export const eliminarProyecto = async (id) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    await connection.query(
      "DELETE FROM gastos_proyectos WHERE proyecto_id = ?",
      [id]
    );
    await connection.query("DELETE FROM proyectos WHERE proyecto_id = ?", [id]);
    await connection.commit();
    return { success: true, message: "Proyecto eliminado con éxito" };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
