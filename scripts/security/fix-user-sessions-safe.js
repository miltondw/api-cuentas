const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixUserSessionsTableSafe() {
  console.log('🔧 Corrigiendo tabla user_sessions de forma segura...');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    // Primero, vamos a verificar si hay datos en la tabla
    const [dataCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM user_sessions',
    );
    console.log(`📊 Datos en user_sessions: ${dataCount[0].count} registros`);

    if (dataCount[0].count > 0) {
      console.log(
        '⚠️ Hay datos en la tabla. Limpiando para hacer el cambio de estructura...',
      );
      await connection.execute('DELETE FROM user_sessions');
    }

    // Eliminar la tabla y recrearla con la estructura correcta
    console.log('🗑️ Eliminando tabla user_sessions...');
    await connection.execute('DROP TABLE IF EXISTS user_sessions');

    console.log('🏗️ Recreando tabla user_sessions con estructura correcta...');
    await connection.execute(`
      CREATE TABLE user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token VARCHAR(500) NOT NULL UNIQUE,
        userId INT NOT NULL,
        ipAddress VARCHAR(45) NOT NULL,
        userAgent TEXT NOT NULL,
        deviceInfo JSON NULL,
        isActive BOOLEAN DEFAULT TRUE,
        isRememberMe BOOLEAN DEFAULT FALSE,
        expiresAt TIMESTAMP NOT NULL,
        lastActivity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        country VARCHAR(100) NULL,
        city VARCHAR(100) NULL,
        loggedOutAt TIMESTAMP NULL,
        logoutReason VARCHAR(100) NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_user_sessions_user_id (userId),
        INDEX idx_user_sessions_token (token),
        INDEX idx_user_sessions_active (isActive),
        INDEX idx_user_sessions_expires (expiresAt),
        INDEX idx_userid_active (userId, isActive),
        
        FOREIGN KEY (userId) REFERENCES usuarios(usuario_id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Tabla user_sessions recreada exitosamente');

    console.log('📝 Verificando estructura final...');
    const [finalStructure] = await connection.execute(
      `
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'user_sessions'
      ORDER BY ORDINAL_POSITION
    `,
      [process.env.DB_DATABASE],
    );

    console.log('🔍 Estructura final de user_sessions:');
    finalStructure.forEach(col => {
      const extra = col.EXTRA ? ` ${col.EXTRA}` : '';
      const defaultVal = col.COLUMN_DEFAULT
        ? ` DEFAULT ${col.COLUMN_DEFAULT}`
        : '';
      console.log(
        `  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}${defaultVal}${extra}`,
      );
    });

    // Verificar que todas las columnas esperadas existen
    const expectedColumns = [
      'id',
      'token',
      'userId',
      'ipAddress',
      'userAgent',
      'deviceInfo',
      'isActive',
      'isRememberMe',
      'expiresAt',
      'lastActivity',
      'country',
      'city',
      'loggedOutAt',
      'logoutReason',
      'createdAt',
      'updatedAt',
    ];

    const existingColumns = finalStructure.map(col => col.COLUMN_NAME);
    const missingColumns = expectedColumns.filter(
      col => !existingColumns.includes(col),
    );

    if (missingColumns.length === 0) {
      console.log('✅ Todas las columnas esperadas están presentes');
    } else {
      console.log('⚠️ Columnas faltantes:', missingColumns);
    }

    console.log('🎉 Tabla user_sessions corregida completamente');
  } catch (error) {
    console.error('❌ Error ejecutando el script:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  fixUserSessionsTableSafe()
    .then(() => {
      console.log('✅ Proceso completado exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error en el proceso:', error);
      process.exit(1);
    });
}

module.exports = fixUserSessionsTableSafe;
