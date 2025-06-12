const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDuplicateTables() {
  console.log('🔧 Eliminando tablas duplicadas...');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    // Las tablas que queremos mantener (versiones en plural)
    const tablesToKeep = [
      'auth_logs',
      'failed_login_attempts',
      'user_sessions',
    ];
    // Las tablas que queremos eliminar (versiones en singular)
    const tablesToDrop = ['auth_log', 'failed_login_attempt', 'user_session'];

    // Primero verificamos que existan datos en las tablas a eliminar
    for (const tablePair of [
      { drop: 'auth_log', keep: 'auth_logs' },
      { drop: 'failed_login_attempt', keep: 'failed_login_attempts' },
      { drop: 'user_session', keep: 'user_sessions' },
    ]) {
      // Comprobar si la tabla existe
      const [tableExists] = await connection.execute(
        `SELECT COUNT(*) AS count FROM information_schema.tables 
         WHERE table_schema = ? AND table_name = ?`,
        [process.env.DB_DATABASE, tablePair.drop],
      );

      if (tableExists[0].count === 0) {
        console.log(`⚠️ La tabla ${tablePair.drop} no existe, se omitirá.`);
        continue;
      }

      // Verificar si hay datos en la tabla a eliminar
      const [dataCount] = await connection.execute(
        `SELECT COUNT(*) AS count FROM ${tablePair.drop}`,
      );

      if (dataCount[0].count > 0) {
        console.log(
          `🔄 Migrando datos de ${tablePair.drop} a ${tablePair.keep}...`,
        );

        // Obtener la estructura de ambas tablas para comparar
        const [dropColumns] = await connection.execute(
          `DESCRIBE ${tablePair.drop}`,
        );
        const [keepColumns] = await connection.execute(
          `DESCRIBE ${tablePair.keep}`,
        );

        // Encontrar los campos en común para la migración
        const dropColumnNames = dropColumns.map(col => col.Field);
        const keepColumnNames = keepColumns.map(col => col.Field);
        const commonColumns = dropColumnNames.filter(col =>
          keepColumnNames.includes(col),
        );

        if (commonColumns.length === 0) {
          console.log(
            `⚠️ No hay columnas en común entre ${tablePair.drop} y ${tablePair.keep}, no se pueden migrar datos.`,
          );
          continue;
        }

        // Construir la consulta de inserción
        const insertQuery = `
          INSERT INTO ${tablePair.keep} (${commonColumns.join(', ')})
          SELECT ${commonColumns.join(', ')}
          FROM ${tablePair.drop}
          ON DUPLICATE KEY UPDATE ${commonColumns.map(col => `${col} = VALUES(${col})`).join(', ')}
        `;

        try {
          await connection.execute(insertQuery);
          console.log(
            `✅ Datos migrados correctamente de ${tablePair.drop} a ${tablePair.keep}`,
          );
        } catch (error) {
          console.error(`❌ Error al migrar datos: ${error.message}`);
          console.log(`⚠️ Continuando con el proceso...`);
        }
      } else {
        console.log(
          `ℹ️ La tabla ${tablePair.drop} no tiene datos para migrar.`,
        );
      }
    }

    // Eliminar tablas duplicadas
    for (const table of tablesToDrop) {
      console.log(`🗑️ Eliminando tabla ${table}...`);

      try {
        await connection.execute(`DROP TABLE IF EXISTS ${table}`);
        console.log(`✅ Tabla ${table} eliminada correctamente.`);
      } catch (error) {
        console.error(
          `❌ Error al eliminar la tabla ${table}: ${error.message}`,
        );
      }
    }

    console.log('🔍 Verificando campos duplicados en la tabla usuarios...');

    // Obtener estructura de la tabla usuarios para los campos duplicados
    const [usuariosStructure] = await connection.execute(`DESCRIBE usuarios`);

    // Mapear campos duplicados a mantener
    const fieldsToKeep = {
      failedAttempts: 'failed_attempts',
      lastFailedAttempt: 'last_failed_attempt',
      accountLockedUntil: 'account_locked_until',
      lastPasswordChange: 'last_password_change',
      lastLogin: 'last_login',
      lastLoginIp: 'last_login_ip',
      loginCount: 'login_count',
      twoFactorEnabled: 'two_factor_enabled',
      twoFactorSecret: 'two_factor_secret',
      isActive: 'is_active',
    };

    // Actualizar valores de campos duplicados y luego eliminarlos
    for (const [camelCaseField, snakeCaseField] of Object.entries(
      fieldsToKeep,
    )) {
      console.log(
        `🔄 Migrando datos de ${camelCaseField} a ${snakeCaseField}...`,
      );

      try {
        // Actualizar el campo snake_case con el valor del campo camelCase si este último no es nulo
        await connection.execute(`
          UPDATE usuarios 
          SET ${snakeCaseField} = ${camelCaseField} 
          WHERE ${camelCaseField} IS NOT NULL AND ${snakeCaseField} IS NULL
        `);
        console.log(
          `✅ Datos migrados de ${camelCaseField} a ${snakeCaseField} correctamente.`,
        );

        // Eliminar el campo camelCase
        console.log(`🗑️ Eliminando campo ${camelCaseField}...`);
        await connection.execute(
          `ALTER TABLE usuarios DROP COLUMN ${camelCaseField}`,
        );
        console.log(`✅ Campo ${camelCaseField} eliminado correctamente.`);
      } catch (error) {
        console.error(
          `❌ Error al procesar el campo ${camelCaseField}: ${error.message}`,
        );
        console.log(`⚠️ Continuando con el proceso...`);
      }
    }

    console.log('\n✅ Proceso de corrección completado');
  } catch (error) {
    console.error('❌ Error general durante el proceso:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  fixDuplicateTables()
    .then(() => {
      console.log('👍 Las tablas duplicadas han sido eliminadas correctamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error en el proceso:', error);
      process.exit(1);
    });
}

module.exports = fixDuplicateTables;
