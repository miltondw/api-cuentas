-- Script para crear las tablas de seguridad que faltan
-- Ejecutar este script para corregir los nombres de las tablas

USE ingeocim_form;

-- =====================================================
-- CREAR TABLA failed_login_attempts (con 's' al final)
-- =====================================================

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
);

-- =====================================================
-- CREAR TABLA auth_logs si no existe
-- =====================================================

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
    metadata JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_auth_logs_user_id (userId),
    INDEX idx_auth_logs_event_type (eventType),
    INDEX idx_auth_logs_timestamp (timestamp),
    INDEX idx_auth_logs_ip (ipAddress),
    FOREIGN KEY (userId) REFERENCES usuarios (usuario_id) ON DELETE CASCADE
);

-- =====================================================
-- CREAR TABLA user_sessions si no existe
-- =====================================================

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

-- =====================================================
-- VERIFICAR QUE LAS TABLAS SE CREARON CORRECTAMENTE
-- =====================================================

SELECT 'TABLAS CREADAS:' as resultado;

SHOW TABLES LIKE '%auth%';

SHOW TABLES LIKE '%session%';

SHOW TABLES LIKE '%failed%';

SELECT 'VERIFICACIÓN COMPLETADA!' as resultado;