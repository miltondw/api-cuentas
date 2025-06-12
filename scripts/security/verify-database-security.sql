-- Script de verificación de la implementación de seguridad en la base de datos
-- Este script verifica que todas las tablas y campos estén correctamente creados

USE ingeocim_form;

-- =====================================================
-- VERIFICAR ESTRUCTURA DE TABLA USUARIOS
-- =====================================================

SELECT 'VERIFICANDO TABLA USUARIOS...' as status;

-- Verificar que existen todos los campos necesarios
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    EXTRA
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'ingeocim_form' 
AND TABLE_NAME = 'usuarios'
ORDER BY ORDINAL_POSITION;

-- =====================================================
-- VERIFICAR TABLAS DE SEGURIDAD
-- =====================================================

SELECT 'VERIFICANDO TABLAS DE SEGURIDAD...' as status;

-- Verificar que existen las tablas
SELECT 
    TABLE_NAME,
    TABLE_TYPE,
    ENGINE
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'ingeocim_form' 
AND TABLE_NAME IN ('auth_log', 'user_session', 'failed_login_attempt');

-- =====================================================
-- VERIFICAR FOREIGN KEYS
-- =====================================================

SELECT 'VERIFICANDO FOREIGN KEYS...' as status;

SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'ingeocim_form' 
AND REFERENCED_TABLE_NAME IS NOT NULL;

-- =====================================================
-- VERIFICAR ÍNDICES
-- =====================================================

SELECT 'VERIFICANDO ÍNDICES...' as status;

SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'ingeocim_form' 
AND TABLE_NAME IN ('usuarios', 'auth_log', 'user_session', 'failed_login_attempt')
ORDER BY TABLE_NAME, INDEX_NAME;

-- =====================================================
-- VERIFICAR DATOS DE USUARIOS
-- =====================================================

SELECT 'VERIFICANDO USUARIOS Y ROLES...' as status;

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

-- =====================================================
-- RESUMEN DE VERIFICACIÓN
-- =====================================================

SELECT 'RESUMEN DE VERIFICACIÓN:' as status;

SELECT 
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'ingeocim_form' AND TABLE_NAME = 'usuarios') as campos_usuarios,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'ingeocim_form' AND TABLE_NAME = 'auth_log') as tabla_auth_log,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'ingeocim_form' AND TABLE_NAME = 'user_session') as tabla_user_session,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'ingeocim_form' AND TABLE_NAME = 'failed_login_attempt') as tabla_failed_login,
    (SELECT COUNT(*) FROM usuarios WHERE role = 'admin') as usuarios_admin,
    (SELECT COUNT(*) FROM usuarios WHERE role = 'lab') as usuarios_lab,
    (SELECT COUNT(*) FROM usuarios WHERE role = 'client') as usuarios_client;

SELECT '¡VERIFICACIÓN COMPLETADA!' as resultado;
