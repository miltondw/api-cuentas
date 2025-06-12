#!/bin/bash
# Script de build paso a paso para debugging

echo "🔧 Iniciando build debug..."

# Limpiar archivos previos
echo "🧹 Limpiando archivos previos..."
rm -rf dist/
rm -f tsconfig.build.tsbuildinfo

# Crear directorio dist
echo "📁 Creando directorio dist..."
mkdir -p dist

# Verificar archivos fuente
echo "📂 Verificando archivos fuente..."
find src -name "*.ts" | head -5

# Compilar con TypeScript directamente
echo "🔨 Compilando con TypeScript..."
npx tsc --project tsconfig.build.json --incremental false

# Verificar resultado
echo "✅ Verificando resultado..."
if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
    echo "✅ Build exitoso! Archivos generados:"
    ls -la dist/
else
    echo "❌ Build falló - directorio dist vacío o no existe"
    exit 1
fi
