-- Script para agregar todos los campos de seguridad a la tabla usuarios
-- Este script debe ejecutarse después de update-usuarios-table.sql

USE ingeocim_form;

-- Agregar campos de seguridad a la tabla usuarios
ALTER TABLE usuarios
ADD COLUMN lastLogin TIMESTAMP NULL,
ADD COLUMN lastLoginIp VARCHAR(45) NULL,
ADD COLUMN loginCount INT DEFAULT 0,
ADD COLUMN failedAttempts INT DEFAULT 0,
ADD COLUMN lastFailedAttempt TIMESTAMP NULL,
ADD COLUMN accountLockedUntil TIMESTAMP NULL,
ADD COLUMN twoFactorEnabled BOOLEAN DEFAULT FALSE,
ADD COLUMN twoFactorSecret VARCHAR(255) NULL,
ADD COLUMN lastPasswordChange TIMESTAMP NULL,
ADD COLUMN isActive BOOLEAN DEFAULT TRUE;

-- Actualizar usuarios existentes con valores por defecto
UPDATE usuarios
SET
    loginCount = 0,
    failedAttempts = 0,
    twoFactorEnabled = FALSE,
    isActive = TRUE,
    lastPasswordChange = NOW()
WHERE
    loginCount IS NULL;

-- Verificar los cambios
DESCRIBE usuarios;

-- Mostrar algunos usuarios con los nuevos campos
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
LIMIT 5;