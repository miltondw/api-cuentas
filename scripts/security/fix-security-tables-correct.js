const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixAllSecurityTablesCorrect() {
  console.log(
    '🔧 Corrigiendo TODAS las tablas de seguridad (método correcto)...',
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
      '📝 PASO 1: Verificando y agregando columnas de seguridad a tabla usuarios...',
    );

    // Primero verificamos qué columnas ya existen
    const [columns] = await connection.execute(
      `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios'
    `,
      [process.env.DB_DATABASE],
    );

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('  📋 Columnas existentes:', existingColumns);

    // Lista de columnas que necesitamos agregar
    const columnsToAdd = [
      { name: 'lastLogin', sql: 'lastLogin TIMESTAMP NULL' },
      { name: 'lastLoginIp', sql: 'lastLoginIp VARCHAR(45) NULL' },
      { name: 'loginCount', sql: 'loginCount INT DEFAULT 0' },
      { name: 'failedAttempts', sql: 'failedAttempts INT DEFAULT 0' },
      { name: 'lastFailedAttempt', sql: 'lastFailedAttempt TIMESTAMP NULL' },
      { name: 'accountLockedUntil', sql: 'accountLockedUntil TIMESTAMP NULL' },
      {
        name: 'twoFactorEnabled',
        sql: 'twoFactorEnabled BOOLEAN DEFAULT FALSE',
      },
      { name: 'twoFactorSecret', sql: 'twoFactorSecret VARCHAR(255) NULL' },
      { name: 'lastPasswordChange', sql: 'lastPasswordChange TIMESTAMP NULL' },
      { name: 'isActive', sql: 'isActive BOOLEAN DEFAULT TRUE' },
      { name: 'last_login', sql: 'last_login TIMESTAMP NULL' },
      { name: 'last_login_ip', sql: 'last_login_ip VARCHAR(45) NULL' },
      { name: 'login_count', sql: 'login_count INT DEFAULT 0' },
      { name: 'failed_attempts', sql: 'failed_attempts INT DEFAULT 0' },
      {
        name: 'last_failed_attempt',
        sql: 'last_failed_attempt TIMESTAMP NULL',
      },
      {
        name: 'account_locked_until',
        sql: 'account_locked_until TIMESTAMP NULL',
      },
      {
        name: 'two_factor_enabled',
        sql: 'two_factor_enabled BOOLEAN DEFAULT FALSE',
      },
      { name: 'two_factor_secret', sql: 'two_factor_secret VARCHAR(255) NULL' },
      {
        name: 'last_password_change',
        sql: 'last_password_change TIMESTAMP NULL',
      },
      { name: 'is_active', sql: 'is_active BOOLEAN DEFAULT TRUE' },
      {
        name: 'updated_at',
        sql: 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
      },
    ];

    // Agregar columnas solo si no existen
    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        try {
          await connection.execute(
            `ALTER TABLE usuarios ADD COLUMN ${column.sql}`,
          );
          console.log(`  ✅ Columna agregada: ${column.name}`);
        } catch (error) {
          console.log(
            `  ⚠️ No se pudo agregar ${column.name}: ${error.message}`,
          );
        }
      } else {
        console.log(`  ⏭️ Columna ya existe: ${column.name}`);
      }
    }

    console.log('📝 PASO 2: Creando tabla auth_logs...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS auth_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        eventType ENUM('login', 'logout', 'token_expired', 'session_extended', 'failed_login', 'password_changed', 'account_locked', 'suspicious_activity') NOT NULL,
        userEmail VARCHAR(100),
        userId INT,
        ipAddress VARCHAR(45),
        userAgent TEXT,
        country VARCHAR(100),
        city VARCHAR(100),
        metadata JSON,
        success BOOLEAN NOT NULL DEFAULT TRUE,
        errorMessage TEXT,
        sessionDuration INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_auth_logs_user_email (userEmail),
        INDEX idx_auth_logs_user_id (userId),
        INDEX idx_auth_logs_event_type (eventType),
        INDEX idx_auth_logs_timestamp (createdAt),
        INDEX idx_auth_logs_ip (ipAddress),
        INDEX idx_email_created (userEmail, createdAt),
        INDEX idx_event_created (eventType, createdAt),
        INDEX idx_ip_created (ipAddress, createdAt)
      )
    `);
    console.log('  ✅ Tabla auth_logs verificada/creada');

    console.log('📝 PASO 3: Creando tabla user_sessions (con s)...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id VARCHAR(36) PRIMARY KEY,
        userId INT NOT NULL,
        token VARCHAR(500) NOT NULL,
        refreshToken VARCHAR(500),
        deviceInfo JSON,
        ipAddress VARCHAR(45),
        userAgent TEXT,
        expiresAt TIMESTAMP NOT NULL,
        isActive BOOLEAN DEFAULT TRUE,
        lastActivity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_sessions_user_id (userId),
        INDEX idx_user_sessions_token (token),
        INDEX idx_user_sessions_expires (expiresAt),
        INDEX idx_user_sessions_active (isActive),
        FOREIGN KEY (userId) REFERENCES usuarios(usuario_id) ON DELETE CASCADE
      )
    `);
    console.log('  ✅ Tabla user_sessions verificada/creada');

    console.log('📝 PASO 4: Verificando tabla failed_login_attempts...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS failed_login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL,
        ipAddress VARCHAR(45) NOT NULL,
        userAgent TEXT,
        reason VARCHAR(255),
        attemptCount INT DEFAULT 1,
        blocked BOOLEAN DEFAULT FALSE,
        blockedUntil TIMESTAMP NULL,
        metadata JSON,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_failed_login_email (email),
        INDEX idx_failed_login_ip (ipAddress),
        INDEX idx_failed_login_time (createdAt),
        INDEX idx_failed_login_blocked (blocked),
        INDEX idx_email_created (email, createdAt),
        INDEX idx_ip_created (ipAddress, createdAt)
      )
    `);
    console.log('  ✅ Tabla failed_login_attempts verificada/creada');

    console.log('📝 PASO 5: Verificando qué columnas existen ahora...');
    const [updatedColumns] = await connection.execute(
      `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios'
    `,
      [process.env.DB_DATABASE],
    );

    const currentColumns = updatedColumns.map(col => col.COLUMN_NAME);
    console.log('  📋 Columnas actuales:', currentColumns);

    // Solo actualizar columnas que realmente existen
    const updateFields = [];
    const whereConditions = [];

    if (currentColumns.includes('loginCount')) {
      updateFields.push('loginCount = COALESCE(loginCount, 0)');
      whereConditions.push('loginCount IS NULL');
    }
    if (currentColumns.includes('failedAttempts')) {
      updateFields.push('failedAttempts = COALESCE(failedAttempts, 0)');
      whereConditions.push('failedAttempts IS NULL');
    }
    if (currentColumns.includes('twoFactorEnabled')) {
      updateFields.push('twoFactorEnabled = COALESCE(twoFactorEnabled, FALSE)');
      whereConditions.push('twoFactorEnabled IS NULL');
    }
    if (currentColumns.includes('isActive')) {
      updateFields.push('isActive = COALESCE(isActive, TRUE)');
      whereConditions.push('isActive IS NULL');
    }
    if (currentColumns.includes('login_count')) {
      updateFields.push('login_count = COALESCE(login_count, 0)');
      whereConditions.push('login_count IS NULL');
    }
    if (currentColumns.includes('failed_attempts')) {
      updateFields.push('failed_attempts = COALESCE(failed_attempts, 0)');
      whereConditions.push('failed_attempts IS NULL');
    }
    if (currentColumns.includes('two_factor_enabled')) {
      updateFields.push(
        'two_factor_enabled = COALESCE(two_factor_enabled, FALSE)',
      );
      whereConditions.push('two_factor_enabled IS NULL');
    }
    if (currentColumns.includes('is_active')) {
      updateFields.push('is_active = COALESCE(is_active, TRUE)');
      whereConditions.push('is_active IS NULL');
    }
    if (currentColumns.includes('lastPasswordChange')) {
      updateFields.push(
        'lastPasswordChange = COALESCE(lastPasswordChange, NOW())',
      );
      whereConditions.push('lastPasswordChange IS NULL');
    }
    if (currentColumns.includes('last_password_change')) {
      updateFields.push(
        'last_password_change = COALESCE(last_password_change, NOW())',
      );
      whereConditions.push('last_password_change IS NULL');
    }

    if (updateFields.length > 0) {
      console.log('📝 PASO 6: Actualizando valores por defecto en usuarios...');
      const updateQuery = `
        UPDATE usuarios SET ${updateFields.join(', ')}
        WHERE ${whereConditions.join(' OR ')}
      `;
      console.log('  📋 Query de actualización:', updateQuery);

      const [updateResult] = await connection.execute(updateQuery);
      console.log(`  ✅ Usuarios actualizados: ${updateResult.affectedRows}`);
    } else {
      console.log('  ⏭️ No hay columnas para actualizar');
    }

    console.log('📝 PASO 7: Verificación final...');

    // Verificar todas las tablas
    const [allTables] = await connection.execute(
      `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('auth_logs', 'user_sessions', 'failed_login_attempts', 'usuarios')
    `,
      [process.env.DB_DATABASE],
    );

    console.log('🔍 Tablas encontradas:');
    allTables.forEach(table => {
      console.log(`  ✅ ${table.TABLE_NAME}`);
    });

    // Verificar algunas columnas críticas
    const [criticalColumns] = await connection.execute(
      `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios'
      AND COLUMN_NAME IN ('loginCount', 'failedAttempts', 'isActive', 'login_count', 'failed_attempts', 'is_active')
    `,
      [process.env.DB_DATABASE],
    );

    console.log('🔍 Columnas críticas encontradas:');
    criticalColumns.forEach(col => {
      console.log(`  ✅ ${col.COLUMN_NAME}`);
    });

    if (allTables.length === 4) {
      console.log('🎉 ¡Todas las tablas de seguridad están correctas!');
    } else {
      console.log('⚠️ Faltan algunas tablas. Revisa la configuración.');
    }
  } catch (error) {
    console.error('❌ Error ejecutando el script:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  fixAllSecurityTablesCorrect()
    .then(() => {
      console.log('✅ Proceso completado exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error en el proceso:', error);
      process.exit(1);
    });
}

module.exports = fixAllSecurityTablesCorrect;
