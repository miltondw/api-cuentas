/**
 * Script para verificar la estructura de las tablas de autenticación en la base de datos
 * Comprueba que las tablas estén correctamente nombradas en plural y tengan la estructura adecuada
 */

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

// Tablas a verificar con sus nombres esperados (en plural)
const TABLES_TO_CHECK = {
  auth_logs: {
    description: 'Logs de autenticación',
    expectedColumns: [
      'id',
      'userId',
      'eventType',
      'ipAddress',
      'userAgent',
      'success',
      'createdAt',
    ],
  },
  user_sessions: {
    description: 'Sesiones de usuario',
    expectedColumns: [
      'id',
      'userId',
      'token',
      'ipAddress',
      'userAgent',
      'isActive',
      'expiresAt',
      'lastActivity',
    ],
  },
  failed_login_attempts: {
    description: 'Intentos fallidos de inicio de sesión',
    expectedColumns: ['id', 'email', 'ipAddress', 'createdAt'],
  },
};

// Tablas obsoletas que ya no deberían existir (nombres en singular)
const DEPRECATED_TABLES = ['auth_log', 'user_session', 'failed_login_attempt'];

// Conexión a la base de datos
const connectToDatabase = async () => {
  try {
    // Obtener parámetros de conexión desde variables de entorno
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || 3306;
    const dbUser = process.env.DB_USERNAME || 'root';
    const dbPassword = process.env.DB_PASSWORD || '';
    const dbName = process.env.DB_NAME || 'ingeocim_form';

    console.log(
      `\n📊 Conectando a la base de datos ${dbName} en ${dbHost}:${dbPort}...`,
    );

    const connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName,
    });

    console.log('✅ Conexión exitosa a la base de datos');
    return connection;
  } catch (error) {
    console.error(
      `❌ Error al conectar con la base de datos: ${error.message}`,
    );
    throw error;
  }
};

// Verificar si una tabla existe
const checkIfTableExists = async (connection, tableName) => {
  try {
    const [rows] = await connection.query(
      `SELECT COUNT(*) as count FROM information_schema.tables 
       WHERE table_schema = DATABASE() 
       AND table_name = ?`,
      [tableName],
    );

    return rows[0].count > 0;
  } catch (error) {
    console.error(
      `❌ Error al verificar la tabla ${tableName}: ${error.message}`,
    );
    return false;
  }
};

// Obtener la estructura de una tabla
const getTableStructure = async (connection, tableName) => {
  try {
    const [columns] = await connection.query(`SHOW COLUMNS FROM ${tableName}`);

    return columns.map(col => ({
      name: col.Field,
      type: col.Type,
      nullable: col.Null === 'YES',
      key: col.Key,
      default: col.Default,
      extra: col.Extra,
    }));
  } catch (error) {
    console.error(
      `❌ Error al obtener la estructura de ${tableName}: ${error.message}`,
    );
    return [];
  }
};

// Verificar la estructura de las tablas
const checkTableStructures = async () => {
  let connection;
  const report = {
    tablesChecked: 0,
    tablesFound: 0,
    deprecatedFound: [],
    missingTables: [],
    validStructures: 0,
    structureIssues: {},
  };

  try {
    connection = await connectToDatabase();

    // Comprobar tablas actuales (plural)
    console.log('\n🔍 Verificando tablas de autenticación...');

    for (const [tableName, tableInfo] of Object.entries(TABLES_TO_CHECK)) {
      report.tablesChecked++;

      const tableExists = await checkIfTableExists(connection, tableName);

      if (tableExists) {
        report.tablesFound++;
        console.log(`✅ Tabla ${tableName} encontrada correctamente`);

        // Verificar estructura
        const columns = await getTableStructure(connection, tableName);
        const columnNames = columns.map(col => col.name);

        const missingColumns = tableInfo.expectedColumns.filter(
          col => !columnNames.includes(col),
        );

        if (missingColumns.length === 0) {
          report.validStructures++;
          console.log(`   ✅ La estructura de ${tableName} es válida`);
        } else {
          report.structureIssues[tableName] = missingColumns;
          console.log(
            `   ❌ La tabla ${tableName} no tiene todas las columnas esperadas`,
          );
          console.log(`      Columnas faltantes: ${missingColumns.join(', ')}`);
        }
      } else {
        report.missingTables.push(tableName);
        console.log(`❌ Tabla ${tableName} no encontrada`);
      }
    }

    // Verificar tablas obsoletas (singular)
    console.log('\n🔍 Verificando si existen tablas obsoletas...');

    for (const tableName of DEPRECATED_TABLES) {
      const tableExists = await checkIfTableExists(connection, tableName);

      if (tableExists) {
        report.deprecatedFound.push(tableName);
        console.log(
          `⚠️ La tabla obsoleta ${tableName} aún existe en la base de datos`,
        );
      } else {
        console.log(`✅ La tabla obsoleta ${tableName} ya no existe`);
      }
    }

    // Verificación de registros
    if (report.tablesFound === Object.keys(TABLES_TO_CHECK).length) {
      console.log('\n🔍 Verificando registros en las tablas...');

      for (const tableName of Object.keys(TABLES_TO_CHECK)) {
        const [rows] = await connection.query(
          `SELECT COUNT(*) as count FROM ${tableName}`,
        );
        const count = rows[0].count;

        console.log(`   📊 Tabla ${tableName} contiene ${count} registros`);
      }
    }
  } catch (error) {
    console.error(`\n❌ Error durante la verificación: ${error.message}`);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión a la base de datos cerrada');
    }

    // Imprimir resumen
    console.log('\n📋 RESUMEN DE LA VERIFICACIÓN:');
    console.log('============================');
    console.log(`✅ Tablas verificadas: ${report.tablesChecked}`);
    console.log(`✅ Tablas encontradas: ${report.tablesFound}`);
    console.log(`✅ Tablas con estructura válida: ${report.validStructures}`);

    if (report.missingTables.length > 0) {
      console.log(`❌ Tablas faltantes: ${report.missingTables.join(', ')}`);
    }

    if (Object.keys(report.structureIssues).length > 0) {
      console.log('❌ Problemas de estructura:');
      for (const [table, issues] of Object.entries(report.structureIssues)) {
        console.log(`   - ${table}: ${issues.join(', ')}`);
      }
    }

    if (report.deprecatedFound.length > 0) {
      console.log(
        `⚠️ Tablas obsoletas encontradas: ${report.deprecatedFound.join(', ')}`,
      );
    } else {
      console.log('✅ No se encontraron tablas obsoletas');
    }

    // Guardar el informe
    try {
      report.timestamp = new Date().toISOString();
      fs.writeFileSync(
        path.join(__dirname, 'table-check-report.json'),
        JSON.stringify(report, null, 2),
      );
      console.log('\n💾 Informe guardado en table-check-report.json');
    } catch (err) {
      console.error('Error al guardar el informe:', err);
    }
  }
};

// Ejecutar la verificación
checkTableStructures().catch(console.error);
