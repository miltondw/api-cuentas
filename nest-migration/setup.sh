#!/bin/bash

echo "🚀 Configurando proyecto Nest.js - API Cuentas Ingeocimyc"
echo "=================================================="

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js primero."
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Por favor instala npm primero."
    exit 1
fi

echo "📦 Instalando dependencias de Nest.js..."
npm install

echo "📋 Configurando variables de entorno..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Archivo .env creado desde .env.example"
    echo "⚠️  Por favor edita el archivo .env con tus configuraciones de base de datos"
else
    echo "ℹ️  El archivo .env ya existe"
fi

echo "🏗️  Compilando el proyecto..."
npm run build

echo ""
echo "✅ ¡Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Edita el archivo .env con tus configuraciones de base de datos"
echo "2. Ejecuta 'npm run migrate:data' para migrar la estructura de la base de datos"
echo "3. Ejecuta 'npm run start:dev' para iniciar en modo desarrollo"
echo ""
echo "📖 Documentación disponible en: http://localhost:5050/api/docs"
echo ""
