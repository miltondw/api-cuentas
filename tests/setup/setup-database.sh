#!/bin/bash

echo "🔍 Verificando y configurando la base de datos..."

# Variables de base de datos
DB_HOST="162.241.61.244"
DB_USER="ingeocim_miltondw"
DB_PASS="\$Rdu1N01"
DB_NAME="ingeocim_form"

# Función para ejecutar comandos MySQL
run_mysql() {
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "$1"
}

# Verificar conexión
echo "🔌 Probando conexión a la base de datos..."
if run_mysql "SELECT 1 as test;" > /dev/null 2>&1; then
    echo "✅ Conexión exitosa a la base de datos"
else
    echo "❌ Error de conexión a la base de datos"
    echo "Verifique las credenciales y la conectividad"
    exit 1
fi

# Verificar estructura de la tabla usuarios
echo "📋 Verificando estructura de la tabla usuarios..."
echo "Columnas actuales:"
run_mysql "DESCRIBE usuarios;"

# Verificar si existe la columna role
echo ""
echo "🔍 Verificando columna role..."
ROLE_EXISTS=$(run_mysql "SHOW COLUMNS FROM usuarios LIKE 'role';" 2>/dev/null | wc -l)

if [ "$ROLE_EXISTS" -gt 0 ]; then
    echo "✅ La columna role ya existe"
else
    echo "❌ La columna role no existe. Agregándola..."
    
    # Agregar columna role
    echo "🔧 Ejecutando: ALTER TABLE usuarios ADD COLUMN role..."
    if run_mysql "ALTER TABLE usuarios ADD COLUMN role ENUM('admin', 'lab', 'client') DEFAULT 'client';"; then
        echo "✅ Columna role agregada exitosamente"
        
        # Actualizar roles de usuarios específicos
        echo "🔧 Actualizando roles de usuarios existentes..."
        run_mysql "UPDATE usuarios SET role = 'admin' WHERE email = 'eider@ingeocimyc.com';"
        run_mysql "UPDATE usuarios SET role = 'lab' WHERE email = 'milton@ingeocimyc.com';"
        run_mysql "UPDATE usuarios SET role = 'admin' WHERE email = 'daniel@ingeocimyc.com';"
        echo "✅ Roles actualizados"
    else
        echo "❌ Error al agregar la columna role"
        exit 1
    fi
fi

# Mostrar usuarios con sus roles
echo ""
echo "👥 Usuarios en la base de datos:"
run_mysql "SELECT email, name, COALESCE(role, 'sin_rol') as role FROM usuarios ORDER BY email;"

# Verificar estructura final
echo ""
echo "📋 Estructura final de la tabla usuarios:"
run_mysql "DESCRIBE usuarios;"

echo ""
echo "✅ Verificación y configuración completada"
echo "🚀 La base de datos está lista para la aplicación NestJS"
