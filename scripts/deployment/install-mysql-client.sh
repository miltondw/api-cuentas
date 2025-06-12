#!/bin/bash

# Script para instalar cliente MySQL en Windows
echo "🔧 Instalando cliente MySQL para Windows..."

# Crear directorio temporal
TEMP_DIR="/tmp/mysql-client"
mkdir -p "$TEMP_DIR"

echo "📥 Descargando cliente MySQL..."

# Descargar cliente MySQL portable
curl -L -o "$TEMP_DIR/mysql-client.zip" "https://dev.mysql.com/get/Downloads/MySQL-8.0/mysql-8.0.39-winx64.zip"

if [ $? -eq 0 ]; then
    echo "✅ Descarga completada"
    
    echo "📂 Extrayendo archivos..."
    cd "$TEMP_DIR"
    unzip -q mysql-client.zip
    
    # Crear directorio en Program Files
    MYSQL_DIR="/c/Program Files/MySQL/MySQL Client 8.0"
    mkdir -p "$MYSQL_DIR/bin"
    
    # Copiar solo el cliente
    cp mysql-*/bin/mysql.exe "$MYSQL_DIR/bin/"
    cp mysql-*/bin/mysqldump.exe "$MYSQL_DIR/bin/"
    cp mysql-*/lib/*.dll "$MYSQL_DIR/bin/" 2>/dev/null || true
    
    echo "✅ Cliente MySQL instalado en: $MYSQL_DIR"
    echo "🔧 Agregando al PATH..."
    
    # Mostrar instrucciones para agregar al PATH
    echo ""
    echo "📋 INSTRUCCIONES PARA AGREGAR AL PATH:"
    echo "1. Presiona Win + R, escribe 'sysdm.cpl' y presiona Enter"
    echo "2. Ve a la pestaña 'Avanzado'"
    echo "3. Haz clic en 'Variables de entorno'"
    echo "4. En 'Variables del sistema', busca 'Path' y haz clic en 'Editar'"
    echo "5. Haz clic en 'Nuevo' y agrega esta ruta:"
    echo "   C:\\Program Files\\MySQL\\MySQL Client 8.0\\bin"
    echo "6. Haz clic en 'Aceptar' en todas las ventanas"
    echo "7. Reinicia tu terminal"
    echo ""
    
    # Limpiar archivos temporales
    rm -rf "$TEMP_DIR"
    
else
    echo "❌ Error descargando MySQL Client"
    echo "💡 Intenta con la opción manual"
fi
