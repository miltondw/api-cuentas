const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyTableNames() {
  console.log('🔍 Verificando nombres de tablas en la base de datos...');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    // Verificar qué tablas existen
    console.log('\n📋 TABLAS EN LA BASE DE DATOS:');
    const [tables] = await connection.execute(
      `SELECT TABLE_NAME 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ?
       ORDER BY TABLE_NAME`,
      [process.env.DB_DATABASE],
    );

    const tableNames = tables.map(table => table.TABLE_NAME);

    // Tablas específicas a verificar
    const securityTables = {
      auth_logs: true,
      user_sessions: true,
      failed_login_attempts: true,
    };

    // Verificar si hay tablas antiguas
    const oldTables = {
      auth_log: false,
      user_session: false,
      failed_login_attempt: false,
    };

    console.log(`Total de tablas encontradas: ${tableNames.length}`);

    // Verificar tablas de seguridad
    for (const tableName of tableNames) {
      if (securityTables[tableName]) {
        console.log(`✅ Tabla ${tableName} encontrada`);
        securityTables[tableName] = true;
      }

      if (Object.prototype.hasOwnProperty.call(oldTables, tableName)) {
        console.log(`⚠️ Tabla antigua ${tableName} todavía existe`);
        oldTables[tableName] = true;
      }
    }

    // Verificar si falta alguna tabla de seguridad
    for (const [table, exists] of Object.entries(securityTables)) {
      if (!exists) {
        console.log(`❌ Tabla ${table} NO encontrada`);
      }
    }

    // Verificar si hay tablas antiguas
    const oldTablesExist = Object.values(oldTables).some(exists => exists);
    if (oldTablesExist) {
      console.log(
        '\n⚠️ ADVERTENCIA: Algunas tablas antiguas todavía existen y deberían eliminarse',
      );
    } else {
      console.log('\n✅ No se encontraron tablas antiguas');
    }

    // Verificar estructura de las tablas de seguridad
    for (const tableName of Object.keys(securityTables)) {
      if (securityTables[tableName]) {
        console.log(`\n📋 ESTRUCTURA DE TABLA ${tableName}:`);
        const [structure] = await connection.execute(`DESCRIBE ${tableName}`);
        structure.forEach(column => {
          console.log(
            `  - ${column.Field}: ${column.Type} ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`,
          );
        });
      }
    }
  } catch (error) {
    console.error('❌ Error verificando estructura:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  verifyTableNames()
    .then(() => {
      console.log('\n✅ Verificación de nombres de tablas completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error en la verificación:', error);
      process.exit(1);
    });
}

module.exports = verifyTableNames;
