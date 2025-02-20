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
  "fecha",
  "solicitante",
  "nombre_proyecto",
  "obrero",
  "costo_servicio",
  "abono",
];

const validateProyectoData = (data) => {
  const missingFields = REQUIRED_PROYECTO_FIELDS.filter(
    (field) => !(field in data)
  );
  if (missingFields.length > 0) {
    throw new Error(`Campos faltantes: ${missingFields.join(", ")}`);
  }
};

// Campos para la inserción (incluimos los nuevos)
const PROYECTO_FIELDS = [
  "fecha",
  "solicitante",
  "nombre_proyecto",
  "obrero",
  "costo_servicio",
  "abono",
  "factura",
  "valor_iva",
  "metodo_de_pago",
];

export const getAllProyectos = async (page = 1, limit = 10) => {
  page = Number(page) || 1;
  limit = Number(limit) || 10;
  const offset = (page - 1) * limit;

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

  const proyectosIds = proyectos.map((p) => p.proyecto_id);
  const gastosQuery = `SELECT * FROM gastos_proyectos WHERE proyecto_id IN (${proyectosIds
    .map(() => "?")
    .join(", ")})`;
  const gastos = await executeQuery(gastosQuery, proyectosIds);

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
  id = Number(id); // Asegúrate de que sea un número

  const proyectoQuery = "SELECT * FROM proyectos WHERE proyecto_id = ?";
  const proyectoResult = await executeQuery(proyectoQuery, [id]);

  if (proyectoResult.length === 0) {
    return null;
  }

  const gastosQuery = `
    SELECT * FROM gastos_proyectos 
    WHERE proyecto_id = ? 
    ORDER BY gasto_proyecto_id ASC
  `;
  const gastosResult = await executeQuery(gastosQuery, [id]);

  console.log("Gastos Result para ID", id, ":", gastosResult); // Verifica si devuelve algo

  return {
    ...proyectoResult[0],
    gastos: gastosResult || [], // Devuelve un array vacío si no hay gastos
  };
};


export const abonar = async (id, abono) => {
  const query = "UPDATE proyectos SET abono = abono + ? WHERE proyecto_id = ?";
  return executeQuery(query, [abono, id]);
};

export const createProyecto = async (data) => {
  validateProyectoData(data);

  const { gastos, ...proyectoData } = data; // Separamos gastos si se incluyen
  const proyectoQuery = `
    INSERT INTO proyectos (fecha, solicitante, nombre_proyecto,obrero, costo_servicio, abono, factura, valor_iva, metodo_de_pago) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)
  `;
  const values = PROYECTO_FIELDS.map((field) => proyectoData[field] || null);

  const result = await executeQuery(proyectoQuery, values);
  const proyectoId = result.insertId;

  if (gastos && gastos.length > 0) {
    // Procesamos cada gasto para separar extras
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
    for (const gasto of gastos) {
      // Extraer extras
      const extras = {};
      for (const key in gasto) {
        if (!fixedFields.includes(key)) {
          extras[key] = gasto[key];
        }
      }
      const gastosQuery = `
        INSERT INTO gastos_proyectos 
        (proyecto_id, camioneta, campo, obreros, comidas, otros, peajes, combustible, hospedaje, otros_campos) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        proyectoId,
        gasto.camioneta,
        gasto.campo,
        gasto.obreros,
        gasto.comidas,
        gasto.otros,
        gasto.peajes,
        gasto.combustible,
        gasto.hospedaje,
        Object.keys(extras).length > 0 ? JSON.stringify(extras) : null,
      ];
      await executeQuery(gastosQuery, params);
    }
  }

  return { proyectoId, message: "Proyecto creado con éxito" };
};

export const updateProyecto = async (id, data) => {
  validateProyectoData(data);

  const { gastos, ...proyectoData } = data;
  const proyectoQuery = `
    UPDATE proyectos 
    SET fecha = ?, solicitante = ?, nombre_proyecto = ?, obrero = ? costo_servicio = ?, abono = ?, factura = ?, valor_iva = ?, metodo_de_pago = ?
    WHERE proyecto_id = ?
  `;
  const values = [
    ...PROYECTO_FIELDS.map((field) => proyectoData[field] || null),
    id,
  ];

  await executeQuery(proyectoQuery, values);

  if (gastos && gastos.length > 0) {
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
    for (const gasto of gastos) {
      const extras = {};
      for (const key in gasto) {
        if (!fixedFields.includes(key)) {
          extras[key] = gasto[key];
        }
      }
      const gastoQuery = `
        INSERT INTO gastos_proyectos 
          (proyecto_id, camioneta, campo, obreros, comidas, otros, peajes, combustible, hospedaje, otros_campos)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          camioneta = VALUES(camioneta), 
          campo = VALUES(camioneta), 
          obreros = VALUES(obreros), 
          comidas = VALUES(comidas), 
          otros = VALUES(otros), 
          peajes = VALUES(peajes), 
          combustible = VALUES(combustible), 
          hospedaje = VALUES(hospedaje), 
          otros_campos = VALUES(otros_campos)
      `;
      await executeQuery(gastoQuery, [
        id,
        gasto.camioneta,
        gasto.campo,
        gasto.obreros,
        gasto.comidas,
        gasto.otros,
        gasto.peajes,
        gasto.combustible,
        gasto.hospedaje,
        Object.keys(extras).length > 0 ? JSON.stringify(extras) : null,
      ]);
    }
  }

  return { proyectoId: id, message: "Proyecto actualizado con éxito" };
};

export const deleteProyecto = async (id) => {
  const query = "DELETE FROM proyectos WHERE proyecto_id = ?";
  return executeQuery(query, [id]);
};
