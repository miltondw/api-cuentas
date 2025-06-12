const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAuthLogsTable() {
  console.log('🔧 Creando tabla auth_logs (con s)...');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    console.log('📝 Creando tabla auth_logs...');

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

    console.log('✅ Tabla auth_logs creada exitosamente');

    // Verificar que la tabla existe
    const [tables] = await connection.execute(
      `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'auth_logs'
    `,
      [process.env.DB_DATABASE],
    );

    if (tables.length > 0) {
      console.log('🎉 Tabla auth_logs verificada correctamente!');
    } else {
      console.log('⚠️ No se pudo verificar la tabla auth_logs');
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
  createAuthLogsTable()
    .then(() => {
      console.log('✅ Proceso completado exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error en el proceso:', error);
      process.exit(1);
    });
}

module.exports = createAuthLogsTable;
