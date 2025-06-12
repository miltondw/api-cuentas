const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixUserSessionsTable() {
  console.log('🔧 Corrigiendo tabla user_sessions...');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    // Según la entidad UserSession, necesitamos estas columnas:
    const columnsToAdd = [
      'isRememberMe BOOLEAN DEFAULT FALSE',
      'country VARCHAR(100) NULL',
      'city VARCHAR(100) NULL',
    ];

    console.log('📝 Verificando y agregando columnas faltantes...');

    for (const columnDef of columnsToAdd) {
      const columnName = columnDef.split(' ')[0];

      try {
        // Verificar si la columna existe
        const [existing] = await connection.execute(
          `
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = ? 
          AND TABLE_NAME = 'user_sessions' 
          AND COLUMN_NAME = ?
        `,
          [process.env.DB_DATABASE, columnName],
        );

        if (existing.length === 0) {
          console.log(`  ➕ Agregando columna ${columnName}...`);
          await connection.execute(
            `ALTER TABLE user_sessions ADD COLUMN ${columnDef}`,
          );
          console.log(`  ✅ Columna ${columnName} agregada exitosamente`);
        } else {
          console.log(`  ⚠️ Columna ${columnName} ya existe`);
        }
      } catch (error) {
        console.error(
          `  ❌ Error agregando columna ${columnName}:`,
          error.message,
        );
      }
    }

    // También necesitamos cambiar el tipo de ID si es necesario
    console.log('📝 Verificando tipo de columna id...');
    const [idInfo] = await connection.execute(
      `
      SELECT DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'user_sessions' 
      AND COLUMN_NAME = 'id'
    `,
      [process.env.DB_DATABASE],
    );

    if (idInfo.length > 0) {
      const idColumn = idInfo[0];
      console.log(
        `  📋 Tipo actual de 'id': ${idColumn.DATA_TYPE} (Extra: ${idColumn.EXTRA})`,
      );

      if (idColumn.DATA_TYPE === 'varchar') {
        console.log(
          '  🔄 Cambiando tipo de id de VARCHAR a INT AUTO_INCREMENT...',
        );

        // Primero verificar si hay datos en la tabla
        const [dataCount] = await connection.execute(
          'SELECT COUNT(*) as count FROM user_sessions',
        );

        if (dataCount[0].count > 0) {
          console.log('  ⚠️ La tabla tiene datos. Respaldando y limpiando...');
          await connection.execute(
            'DELETE FROM user_sessions WHERE id IS NOT NULL',
          );
        }

        // Cambiar tipo de columna
        await connection.execute(`
          ALTER TABLE user_sessions 
          MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY
        `);

        console.log('  ✅ Tipo de columna id cambiado exitosamente');
      } else {
        console.log('  ✅ Tipo de columna id ya es correcto');
      }
    }

    console.log('📝 Verificando estructura final de user_sessions...');
    const [finalStructure] = await connection.execute(
      `
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'user_sessions'
      ORDER BY ORDINAL_POSITION
    `,
      [process.env.DB_DATABASE],
    );

    console.log('🔍 Estructura final de user_sessions:');
    finalStructure.forEach(col => {
      console.log(
        `  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''}`,
      );
    });

    console.log('✅ Tabla user_sessions corregida exitosamente');
  } catch (error) {
    console.error('❌ Error ejecutando el script:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  fixUserSessionsTable()
    .then(() => {
      console.log('✅ Proceso completado exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error en el proceso:', error);
      process.exit(1);
    });
}

module.exports = fixUserSessionsTable;
