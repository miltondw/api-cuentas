const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixAllSecurityTables() {
  console.log('🔧 Corrigiendo TODAS las tablas de seguridad...');

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

    // Agregar todas las columnas de seguridad a la tabla usuarios
    const securityColumns = [
      'ADD COLUMN IF NOT EXISTS lastLogin TIMESTAMP NULL',
      'ADD COLUMN IF NOT EXISTS lastLoginIp VARCHAR(45) NULL',
      'ADD COLUMN IF NOT EXISTS loginCount INT DEFAULT 0',
      'ADD COLUMN IF NOT EXISTS failedAttempts INT DEFAULT 0',
      'ADD COLUMN IF NOT EXISTS lastFailedAttempt TIMESTAMP NULL',
      'ADD COLUMN IF NOT EXISTS accountLockedUntil TIMESTAMP NULL',
      'ADD COLUMN IF NOT EXISTS twoFactorEnabled BOOLEAN DEFAULT FALSE',
      'ADD COLUMN IF NOT EXISTS twoFactorSecret VARCHAR(255) NULL',
      'ADD COLUMN IF NOT EXISTS lastPasswordChange TIMESTAMP NULL',
      'ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT TRUE',
      'ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL',
      'ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45) NULL',
      'ADD COLUMN IF NOT EXISTS login_count INT DEFAULT 0',
      'ADD COLUMN IF NOT EXISTS failed_attempts INT DEFAULT 0',
      'ADD COLUMN IF NOT EXISTS last_failed_attempt TIMESTAMP NULL',
      'ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP NULL',
      'ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE',
      'ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255) NULL',
      'ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP NULL',
      'ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE',
      'ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    ];

    for (const column of securityColumns) {
      try {
        await connection.execute(`ALTER TABLE usuarios ${column}`);
        console.log(`  ✅ ${column}`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`  ⚠️ Columna ya existe: ${column}`);
        } else {
          console.log(`  ❌ Error: ${column} - ${error.message}`);
        }
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
        loggedOutAt TIMESTAMP NULL,
        logoutReason VARCHAR(100) NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_sessions_user_id (userId),
        INDEX idx_user_sessions_token (token),
        INDEX idx_user_sessions_expires (expiresAt),
        INDEX idx_user_sessions_active (isActive),
        FOREIGN KEY (userId) REFERENCES usuarios(usuario_id) ON DELETE CASCADE
      )
    `);

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

    console.log('📝 PASO 5: Actualizando valores por defecto en usuarios...');

    await connection.execute(`
      UPDATE usuarios SET
        loginCount = COALESCE(loginCount, 0),
        failedAttempts = COALESCE(failedAttempts, 0),
        twoFactorEnabled = COALESCE(twoFactorEnabled, FALSE),
        isActive = COALESCE(isActive, TRUE),
        login_count = COALESCE(login_count, 0),
        failed_attempts = COALESCE(failed_attempts, 0),
        two_factor_enabled = COALESCE(two_factor_enabled, FALSE),
        is_active = COALESCE(is_active, TRUE),
        lastPasswordChange = COALESCE(lastPasswordChange, NOW()),
        last_password_change = COALESCE(last_password_change, NOW())
      WHERE loginCount IS NULL OR failedAttempts IS NULL OR twoFactorEnabled IS NULL OR isActive IS NULL
         OR login_count IS NULL OR failed_attempts IS NULL OR two_factor_enabled IS NULL OR is_active IS NULL
    `);

    console.log('✅ PASO 6: Verificando todas las tablas...');

    // Verificar que las tablas existen
    const [tables] = await connection.execute(
      `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('auth_logs', 'user_sessions', 'failed_login_attempts', 'usuarios')
    `,
      [process.env.DB_DATABASE],
    );

    console.log('🔍 Tablas encontradas:');
    tables.forEach(table => {
      console.log(`  ✅ ${table.TABLE_NAME}`);
    });

    // Verificar columnas de usuarios
    const [columns] = await connection.execute(
      `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios'
      AND COLUMN_NAME IN ('lastLogin', 'last_login', 'loginCount', 'login_count', 'isActive', 'is_active')
    `,
      [process.env.DB_DATABASE],
    );

    console.log('🔍 Columnas de seguridad en usuarios:');
    columns.forEach(column => {
      console.log(`  ✅ ${column.COLUMN_NAME}`);
    });

    if (tables.length === 4 && columns.length >= 4) {
      console.log(
        '🎉 ¡TODAS LAS TABLAS Y COLUMNAS ESTÁN CONFIGURADAS CORRECTAMENTE!',
      );
    } else {
      console.log(
        '⚠️ Faltan algunas tablas o columnas. Revisa la configuración.',
      );
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
  fixAllSecurityTables()
    .then(() => {
      console.log('✅ ¡TODAS LAS CORRECCIONES COMPLETADAS EXITOSAMENTE!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error en el proceso:', error);
      process.exit(1);
    });
}

module.exports = fixAllSecurityTables;
