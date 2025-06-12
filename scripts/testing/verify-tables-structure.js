/**
 * Script para verificar la estructura y consistencia de las tablas de seguridad
 * Este script comprueba que las tablas de seguridad estén creadas correctamente
 * y que no haya tablas duplicadas o con nombres incorrectos
 */

const mysql = require('mysql2/promise');
const { config } = require('dotenv');
const chalk = require('chalk');

// Cargar variables de entorno
config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

// Definición de las tablas que deben existir
const correctTables = {
  auth_logs: {
    description: 'Tabla de logs de autenticación',
    requiredColumns: ['id', 'eventType', 'userId', 'createdAt'],
  },
  user_sessions: {
    description: 'Tabla de sesiones de usuario',
    requiredColumns: ['id', 'token', 'userId', 'expiresAt', 'isActive'],
  },
  failed_login_attempts: {
    description: 'Tabla de intentos fallidos de login',
    requiredColumns: ['id', 'email', 'ipAddress', 'createdAt'],
  },
  usuarios: {
    description: 'Tabla de usuarios',
    requiredColumns: ['usuario_id', 'email', 'password', 'role'],
  },
};

// Tablas que NO deberían existir (versiones antiguas o duplicadas)
const oldTables = {
  auth_log: 'auth_logs',
  user_session: 'user_sessions',
  failed_login_attempt: 'failed_login_attempts',
};

// Funciones de utilidad para mensajes en consola
const log = {
  info: msg => console.log(chalk.blue(`[INFO] ${msg}`)),
  success: msg => console.log(chalk.green(`[SUCCESS] ${msg}`)),
  error: msg => console.log(chalk.red(`[ERROR] ${msg}`)),
  warning: msg => console.log(chalk.yellow(`[WARNING] ${msg}`)),
  section: title => console.log(chalk.yellow(`\n===== ${title} =====`)),
};

/**
 * Conectar a la base de datos
 */
async function connectToDatabase() {
  try {
    log.info('Conectando a la base de datos...');
    const connection = await mysql.createConnection(dbConfig);
    log.success('Conexión exitosa a la base de datos');
    return connection;
  } catch (error) {
    log.error(`Error al conectar a la base de datos: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Listar todas las tablas en la base de datos
 */
async function listAllTables(connection) {
  log.section('LISTANDO TABLAS DE LA BASE DE DATOS');

  try {
    const [rows] = await connection.execute('SHOW TABLES');
    const tables = rows.map(row => Object.values(row)[0]);

    log.info(`Total de tablas encontradas: ${tables.length}`);

    return tables;
  } catch (error) {
    log.error(`Error al listar tablas: ${error.message}`);
    return [];
  }
}

/**
 * Verificar que las tablas correctas existan
 */
async function verifyCorrectTables(connection, allTables) {
  log.section('VERIFICANDO TABLAS REQUERIDAS');

  let allTablesCorrect = true;

  for (const tableName of Object.keys(correctTables)) {
    if (allTables.includes(tableName)) {
      log.success(`Tabla ${tableName} encontrada`);

      // Verificar estructura de la tabla
      await verifyTableStructure(
        connection,
        tableName,
        correctTables[tableName].requiredColumns,
      );
    } else {
      log.error(`Tabla ${tableName} NO encontrada`);
      allTablesCorrect = false;
    }
  }

  return allTablesCorrect;
}

/**
 * Verificar que no existan tablas con nombres antiguos o duplicados
 */
async function checkForOldTables(connection, allTables) {
  log.section('VERIFICANDO TABLAS DUPLICADAS');

  let oldTablesFound = false;

  for (const tableName of allTables) {
    if (Object.prototype.hasOwnProperty.call(oldTables, tableName)) {
      log.warning(
        `Tabla antigua encontrada: ${tableName} (debería ser ${oldTables[tableName]})`,
      );
      oldTablesFound = true;

      // Comprobar si hay datos en la tabla antigua
      const [rowCountResult] = await connection.execute(
        `SELECT COUNT(*) as count FROM ${tableName}`,
      );
      const rowCount = rowCountResult[0].count;

      if (rowCount > 0) {
        log.warning(
          `La tabla antigua ${tableName} contiene ${rowCount} registros que deben migrarse`,
        );
      }
    }
  }

  if (!oldTablesFound) {
    log.success('No se encontraron tablas duplicadas o con nombres antiguos');
  }

  return !oldTablesFound;
}

/**
 * Verificar la estructura de una tabla
 */
async function verifyTableStructure(connection, tableName, requiredColumns) {
  try {
    const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
    const columnNames = columns.map(col => col.Field);

    log.info(`Estructura de tabla ${tableName}:`);
    columns.forEach(col => {
      const isRequired = requiredColumns.includes(col.Field);
      const prefix = isRequired ? '✅' : '  ';
      console.log(
        `  ${prefix} ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`,
      );
    });

    // Verificar que estén todas las columnas requeridas
    const missingColumns = requiredColumns.filter(
      col => !columnNames.includes(col),
    );

    if (missingColumns.length > 0) {
      log.warning(
        `Columnas requeridas faltantes en ${tableName}: ${missingColumns.join(', ')}`,
      );
      return false;
    }

    return true;
  } catch (error) {
    log.error(
      `Error al verificar estructura de ${tableName}: ${error.message}`,
    );
    return false;
  }
}

/**
 * Verificar los índices de una tabla
 */
async function verifyTableIndexes(connection, tableName) {
  try {
    const [indexes] = await connection.execute(`SHOW INDEX FROM ${tableName}`);

    log.info(`Índices de tabla ${tableName}:`);

    const uniqueIndexNames = new Set();
    indexes.forEach(idx => {
      if (!uniqueIndexNames.has(idx.Key_name)) {
        uniqueIndexNames.add(idx.Key_name);
        console.log(
          `  - ${idx.Key_name} ${idx.Non_unique === 0 ? '(UNIQUE)' : ''}`,
        );
      }
    });

    return true;
  } catch (error) {
    log.error(`Error al verificar índices de ${tableName}: ${error.message}`);
    return false;
  }
}

/**
 * Verificar entidad TypeORM
 */
async function verifyEntities() {
  log.section('VERIFICANDO ARCHIVOS DE ENTIDADES');

  const fs = require('fs').promises;
  const path = require('path');

  const entityFiles = {
    auth_logs: 'src/modules/auth/entities/auth-log.entity.ts',
    user_sessions: 'src/modules/auth/entities/user-session.entity.ts',
    failed_login_attempts:
      'src/modules/auth/entities/failed-login-attempt.entity.ts',
  };

  for (const [tableName, filePath] of Object.entries(entityFiles)) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      const content = await fs.readFile(fullPath, 'utf8');

      // Verificar que la entidad apunte a la tabla correcta
      const entityMatch = content.match(/@Entity\(['"]([^'"]+)['"]\)/);

      if (entityMatch && entityMatch[1] === tableName) {
        log.success(
          `Entidad en ${filePath} apunta correctamente a la tabla ${tableName}`,
        );
      } else if (entityMatch) {
        log.warning(
          `Entidad en ${filePath} apunta a tabla ${entityMatch[1]}, pero debería ser ${tableName}`,
        );
      } else {
        log.error(`No se pudo encontrar la anotación @Entity en ${filePath}`);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        log.error(`Archivo de entidad no encontrado: ${filePath}`);
      } else {
        log.error(
          `Error al leer archivo de entidad ${filePath}: ${error.message}`,
        );
      }
    }
  }
}

/**
 * Función principal para verificar la estructura de la base de datos
 */
async function verifyDatabaseStructure() {
  let connection;

  try {
    log.section('INICIANDO VERIFICACIÓN DE ESTRUCTURA DE BASE DE DATOS');
    connection = await connectToDatabase();

    // Listar todas las tablas
    const allTables = await listAllTables(connection);

    // Verificar que las tablas correctas existan
    const correctTablesExist = await verifyCorrectTables(connection, allTables);

    // Verificar que no existan tablas con nombres antiguos
    const noOldTables = await checkForOldTables(connection, allTables);

    // Verificar índices de las tablas principales
    for (const tableName of Object.keys(correctTables)) {
      if (allTables.includes(tableName)) {
        await verifyTableIndexes(connection, tableName);
      }
    }

    // Verificar entidades TypeORM
    await verifyEntities();

    log.section('RESULTADO DE LA VERIFICACIÓN');
    if (correctTablesExist && noOldTables) {
      log.success('✅ Todas las tablas tienen la estructura correcta');
    } else {
      log.warning('⚠️ Se encontraron problemas en la estructura de las tablas');
    }
  } catch (error) {
    log.error(`Error durante la verificación: ${error.message}`);
  } finally {
    if (connection) {
      await connection.end();
      log.info('Conexión a la base de datos cerrada');
    }
  }
}

// Ejecutar la verificación
verifyDatabaseStructure();
