-- Script maestro para actualizar la base de datos con todas las funcionalidades de seguridad
-- Ejecutar este archivo para aplicar todas las actualizaciones necesarias

USE ingeocim_form;

-- =====================================================
-- PASO 1: Actualizar tabla usuarios con roles y usuario_id
-- =====================================================

-- Agregar usuario_id como primary key autoincremental si no existe
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS usuario_id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- Agregar columna role si no existe
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS role ENUM('admin', 'lab', 'client') DEFAULT 'client';

-- Actualizar los roles de los usuarios existentes
UPDATE usuarios SET role = 'admin' WHERE email = 'eider@ingeocimyc.com';
UPDATE usuarios SET role = 'lab' WHERE email = 'milton@ingeocimyc.com';
UPDATE usuarios SET role = 'admin' WHERE email = 'daniel@ingeocimyc.com';

-- =====================================================
-- PASO 2: Agregar campos de seguridad a tabla usuarios
-- =====================================================

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS lastLogin TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS lastLoginIp VARCHAR(45) NULL,
ADD COLUMN IF NOT EXISTS loginCount INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS failedAttempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS lastFailedAttempt TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS accountLockedUntil TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS twoFactorEnabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS twoFactorSecret VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS lastPasswordChange TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT TRUE;

-- Actualizar usuarios existentes con valores por defecto
UPDATE usuarios SET
    loginCount = COALESCE(loginCount, 0),
    failedAttempts = COALESCE(failedAttempts, 0),
    twoFactorEnabled = COALESCE(twoFactorEnabled, FALSE),
    isActive = COALESCE(isActive, TRUE),
    lastPasswordChange = COALESCE(lastPasswordChange, NOW())
WHERE loginCount IS NULL OR failedAttempts IS NULL OR twoFactorEnabled IS NULL OR isActive IS NULL;

-- =====================================================
-- PASO 3: Crear tablas de seguridad
-- =====================================================

-- Crear tabla auth_log para logs de autenticación
CREATE TABLE IF NOT EXISTS auth_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    eventType ENUM('login', 'logout', 'password_change', 'failed_login', 'account_locked', 'suspicious_activity') NOT NULL,
    ipAddress VARCHAR(45),
    userAgent TEXT,
    deviceInfo JSON,
    success BOOLEAN NOT NULL,
    details JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_auth_log_user_id (userId),
    INDEX idx_auth_log_event_type (eventType),
    INDEX idx_auth_log_timestamp (timestamp),
    INDEX idx_auth_log_ip (ipAddress),
    FOREIGN KEY (userId) REFERENCES usuarios(usuario_id) ON DELETE CASCADE
);

-- Crear tabla user_session para sesiones activas
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
);

-- Crear tabla failed_login_attempt para intentos fallidos
CREATE TABLE IF NOT EXISTS failed_login_attempt (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    ipAddress VARCHAR(45) NOT NULL,
    userAgent TEXT,
    attemptTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    isBlocked BOOLEAN DEFAULT FALSE,
    blockedUntil TIMESTAMP NULL,
    INDEX idx_failed_login_email (email),
    INDEX idx_failed_login_ip (ipAddress),
    INDEX idx_failed_login_time (attemptTime),
    INDEX idx_failed_login_blocked (isBlocked)
);

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Verificar estructura de usuarios
SELECT 'TABLA USUARIOS:' as info;
DESCRIBE usuarios;

-- Verificar nuevas tablas
SELECT 'TABLAS DE SEGURIDAD CREADAS:' as info;
SHOW TABLES LIKE '%auth%';
SHOW TABLES LIKE '%session%';
SHOW TABLES LIKE '%failed%';

-- Verificar usuarios con nuevos campos
SELECT 'USUARIOS CON CAMPOS DE SEGURIDAD:' as info;
SELECT 
    usuario_id,
    email, 
    name, 
    role, 
    loginCount,
    failedAttempts,
    twoFactorEnabled,
    isActive,
    created_at
FROM usuarios 
ORDER BY usuario_id;

SELECT 'MIGRACIÓN DE BASE DE DATOS COMPLETADA EXITOSAMENTE!' as resultado;
