#!/bin/bash

# Script para conectar a MySQL y verificar tablas de seguridad
# Uso: ./connect-mysql.sh

echo "🔐 Conectando a MySQL con las credenciales del proyecto..."
echo ""

# Leer credenciales del .env
source .env

echo "📋 Credenciales a usar:"
echo "   Host: $DB_HOST"
echo "   Puerto: $DB_PORT"  
echo "   Usuario: $DB_USERNAME"
echo "   Base de datos: $DB_DATABASE"
echo ""

echo "💡 Comandos útiles una vez conectado:"
echo "   SHOW TABLES;                           -- Ver todas las tablas"
echo "   DESCRIBE usuarios;                     -- Ver estructura de usuarios"  
echo "   DESCRIBE auth_logs;                    -- Ver estructura de auth_logs"
echo "   DESCRIBE user_sessions;                -- Ver estructura de user_sessions"
echo "   DESCRIBE failed_login_attempts;       -- Ver estructura de failed_login_attempts"
echo ""
echo "   SELECT * FROM usuarios LIMIT 5;       -- Ver usuarios"
echo "   SELECT * FROM auth_logs LIMIT 5;      -- Ver logs recientes"
echo "   SELECT * FROM user_sessions LIMIT 5;  -- Ver sesiones activas"
echo ""

echo "🚀 Conectando ahora..."
echo "   (Se te pedirá la contraseña: \$Rdu1N01)"
echo ""

# Conectar a MySQL
mysql -h $DB_HOST -P $DB_PORT -u $DB_USERNAME -p $DB_DATABASE
