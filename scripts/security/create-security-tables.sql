-- Script para crear todas las tablas de seguridad
-- Ejecutar después de add-security-fields-to-usuarios.sql

USE ingeocim_form;

-- Crear tabla auth_logs para logs de autenticación
CREATE TABLE IF NOT EXISTS auth_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    eventType ENUM(
        'login',
        'logout',
        'password_change',
        'failed_login',
        'account_locked',
        'suspicious_activity'
    ) NOT NULL,
    ipAddress VARCHAR(45),
    userAgent TEXT,
    deviceInfo JSON,
    success BOOLEAN NOT NULL,
    details JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_auth_logs_user_id (userId),
    INDEX idx_auth_logs_event_type (eventType),
    INDEX idx_auth_logs_timestamp (timestamp),
    INDEX idx_auth_logs_ip (ipAddress),
    FOREIGN KEY (userId) REFERENCES usuarios (usuario_id) ON DELETE CASCADE
);

-- Crear tabla user_sessions para sesiones activas
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
    FOREIGN KEY (userId) REFERENCES usuarios (usuario_id) ON DELETE CASCADE
);

-- Crear tabla failed_login_attempts para intentos fallidos
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    ipAddress VARCHAR(45) NOT NULL,
    userAgent TEXT,
    attemptTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    isBlocked BOOLEAN DEFAULT FALSE,
    blockedUntil TIMESTAMP NULL,
    INDEX idx_failed_login_attempts_email (email),
    INDEX idx_failed_login_attempts_ip (ipAddress),
    INDEX idx_failed_login_attempts_time (attemptTime),
    INDEX idx_failed_login_attempts_blocked (isBlocked)
);

-- Verificar que todas las tablas se crearon correctamente
SHOW TABLES LIKE '%auth%';

SHOW TABLES LIKE '%session%';

SHOW TABLES LIKE '%failed%';

-- Mostrar estructura de las nuevas tablas
DESCRIBE auth_logs;

DESCRIBE user_sessions;

DESCRIBE failed_login_attempts;