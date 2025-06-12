const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixMissingTables() {
  console.log('🔧 Creando tablas de seguridad que faltan...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
  });

  try {
    console.log('📝 Creando tabla failed_login_attempts...');
    
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

    console.log('📝 Creando tabla auth_log...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS auth_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        eventType ENUM('login', 'logout', 'password_change', 'failed_login', 'account_locked', 'suspicious_activity') NOT NULL,
        ipAddress VARCHAR(45),
        userAgent TEXT,
        deviceInfo JSON,
        success BOOLEAN NOT NULL,
        details JSON,
        metadata JSON,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_auth_log_user_id (userId),
        INDEX idx_auth_log_event_type (eventType),
        INDEX idx_auth_log_timestamp (timestamp),
        INDEX idx_auth_log_ip (ipAddress),
        FOREIGN KEY (userId) REFERENCES usuarios(usuario_id) ON DELETE CASCADE
      )
    `);

    console.log('📝 Creando tabla user_session...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_session (
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
        INDEX idx_user_session_user_id (userId),
        INDEX idx_user_session_token (token),
        INDEX idx_user_session_expires (expiresAt),
        INDEX idx_user_session_active (isActive),
        FOREIGN KEY (userId) REFERENCES usuarios(usuario_id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Todas las tablas creadas exitosamente');

    // Verificar que las tablas existen
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('auth_log', 'user_session', 'failed_login_attempts')
    `, [process.env.DB_DATABASE]);

    console.log('🔍 Tablas encontradas:');
    tables.forEach(table => {
      console.log(`  ✅ ${table.TABLE_NAME}`);
    });

    if (tables.length === 3) {
      console.log('🎉 Todas las tablas de seguridad están creadas correctamente!');
    } else {
      console.log('⚠️ Faltan algunas tablas. Revisa la ejecución del script.');
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
  fixMissingTables()
    .then(() => {
      console.log('✅ Proceso completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el proceso:', error);
      process.exit(1);
    });
}

module.exports = fixMissingTables;
