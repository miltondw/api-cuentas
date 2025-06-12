const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkColumnExists(connection, tableName, columnName) {
  try {
    const [rows] = await connection.execute(
      `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = ? 
      AND COLUMN_NAME = ?
    `,
      [process.env.DB_DATABASE, tableName, columnName],
    );

    return rows.length > 0;
  } catch (error) {
    console.error(
      `Error verificando columna ${columnName} en ${tableName}:`,
      error.message,
    );
    return false;
  }
}

async function addColumnIfNotExists(
  connection,
  tableName,
  columnName,
  definition,
) {
  const exists = await checkColumnExists(connection, tableName, columnName);

  if (!exists) {
    try {
      await connection.execute(
        `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`,
      );
      console.log(`  ✅ Agregada columna: ${columnName} a ${tableName}`);
      return true;
    } catch (error) {
      console.log(`  ❌ Error agregando ${columnName}: ${error.message}`);
      return false;
    }
  } else {
    console.log(`  ⚠️ Columna ya existe: ${columnName} en ${tableName}`);
    return true;
  }
}

async function checkTableExists(connection, tableName) {
  try {
    const [rows] = await connection.execute(
      `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = ?
    `,
      [process.env.DB_DATABASE, tableName],
    );

    return rows.length > 0;
  } catch (error) {
    console.error(`Error verificando tabla ${tableName}:`, error.message);
    return false;
  }
}

async function fixAllSecurityTables() {
  console.log(
    '🔧 Corrigiendo TODAS las tablas de seguridad (MySQL compatible)...',
  );

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    console.log(
      '📝 PASO 1: Agregando columnas de seguridad a tabla usuarios...',
    );

    // Definir todas las columnas de seguridad para usuarios
    const userSecurityColumns = [
      ['lastLogin', 'TIMESTAMP NULL'],
      ['lastLoginIp', 'VARCHAR(45) NULL'],
      ['loginCount', 'INT DEFAULT 0'],
      ['failedAttempts', 'INT DEFAULT 0'],
      ['lastFailedAttempt', 'TIMESTAMP NULL'],
      ['accountLockedUntil', 'TIMESTAMP NULL'],
      ['twoFactorEnabled', 'BOOLEAN DEFAULT FALSE'],
      ['twoFactorSecret', 'VARCHAR(255) NULL'],
      ['lastPasswordChange', 'TIMESTAMP NULL'],
      ['isActive', 'BOOLEAN DEFAULT TRUE'],
      ['last_login', 'TIMESTAMP NULL'],
      ['last_login_ip', 'VARCHAR(45) NULL'],
      ['login_count', 'INT DEFAULT 0'],
      ['failed_attempts', 'INT DEFAULT 0'],
      ['last_failed_attempt', 'TIMESTAMP NULL'],
      ['account_locked_until', 'TIMESTAMP NULL'],
      ['two_factor_enabled', 'BOOLEAN DEFAULT FALSE'],
      ['two_factor_secret', 'VARCHAR(255) NULL'],
      ['last_password_change', 'TIMESTAMP NULL'],
      ['is_active', 'BOOLEAN DEFAULT TRUE'],
      [
        'updated_at',
        'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
      ],
    ];

    for (const [columnName, definition] of userSecurityColumns) {
      await addColumnIfNotExists(
        connection,
        'usuarios',
        columnName,
        definition,
      );
    }

    console.log('\n📝 PASO 2: Creando tabla auth_logs...');

    const authLogsExists = await checkTableExists(connection, 'auth_logs');
    if (!authLogsExists) {
      await connection.execute(`
        CREATE TABLE auth_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          eventType ENUM('login', 'logout', 'failed_login', 'password_change', 'account_locked') NOT NULL,
          ipAddress VARCHAR(45),
          userAgent TEXT,
          deviceInfo JSON,
          success BOOLEAN DEFAULT TRUE,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          details JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_auth_logs_userId (userId),
          INDEX idx_auth_logs_eventType (eventType),
          INDEX idx_auth_logs_timestamp (timestamp),
          INDEX idx_auth_logs_ipAddress (ipAddress)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('  ✅ Tabla auth_logs creada exitosamente');
    } else {
      console.log('  ⚠️ Tabla auth_logs ya existe');
    }

    console.log('\n📝 PASO 3: Creando tabla user_sessions...');

    const userSessionsExists = await checkTableExists(
      connection,
      'user_sessions',
    );
    if (!userSessionsExists) {
      await connection.execute(`
        CREATE TABLE user_sessions (
          id VARCHAR(36) PRIMARY KEY,
          userId INT NOT NULL,
          token VARCHAR(1000) NOT NULL,
          refreshToken VARCHAR(1000),
          deviceInfo JSON,
          ipAddress VARCHAR(45),
          userAgent TEXT,
          isActive BOOLEAN DEFAULT TRUE,
          lastActivity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expiresAt TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_sessions_userId (userId),
          INDEX idx_user_sessions_token (token(255)),
          INDEX idx_user_sessions_isActive (isActive),
          INDEX idx_user_sessions_expiresAt (expiresAt),
          INDEX idx_user_sessions_lastActivity (lastActivity)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('  ✅ Tabla user_sessions creada exitosamente');
    } else {
      console.log('  ⚠️ Tabla user_sessions ya existe');
    }

    console.log('\n📝 PASO 4: Creando tabla failed_login_attempts...');

    const failedAttemptsExists = await checkTableExists(
      connection,
      'failed_login_attempts',
    );
    if (!failedAttemptsExists) {
      await connection.execute(`
        CREATE TABLE failed_login_attempts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          identifier VARCHAR(255) NOT NULL,
          ipAddress VARCHAR(45) NOT NULL,
          userAgent TEXT,
          attemptTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_failed_login_identifier (identifier),
          INDEX idx_failed_login_ipAddress (ipAddress),
          INDEX idx_failed_login_attemptTime (attemptTime)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('  ✅ Tabla failed_login_attempts creada exitosamente');
    } else {
      console.log('  ⚠️ Tabla failed_login_attempts ya existe');
    }

    console.log('\n📝 PASO 5: Verificando estructura final...');

    // Verificar que todas las tablas existen
    const tables = [
      'usuarios',
      'auth_logs',
      'user_sessions',
      'failed_login_attempts',
    ];

    for (const table of tables) {
      const exists = await checkTableExists(connection, table);
      console.log(
        `  ${exists ? '✅' : '❌'} Tabla ${table}: ${exists ? 'EXISTE' : 'NO EXISTE'}`,
      );
    }

    // Verificar algunas columnas clave en usuarios
    const keyColumns = ['lastLogin', 'last_login', 'isActive', 'is_active'];

    console.log('\n📝 Verificando columnas clave en usuarios...');
    for (const column of keyColumns) {
      const exists = await checkColumnExists(connection, 'usuarios', column);
      console.log(
        `  ${exists ? '✅' : '❌'} Columna ${column}: ${exists ? 'EXISTE' : 'NO EXISTE'}`,
      );
    }

    console.log('\n🎉 ¡Proceso completado exitosamente!');
    console.log(
      '✅ Todas las tablas de seguridad han sido creadas/verificadas',
    );
    console.log(
      '✅ Todas las columnas de seguridad han sido agregadas a usuarios',
    );

    return true;
  } catch (error) {
    console.error('❌ Error durante el proceso:', error);
    return false;
  } finally {
    await connection.end();
    console.log('🔐 Conexión cerrada');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  fixAllSecurityTables()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { fixAllSecurityTables };
