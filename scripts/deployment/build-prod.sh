#!/bin/bash
# ====================================================
# 🚀 SCRIPT DE BUILD PARA PRODUCCIÓN
# ====================================================

set -e  # Salir en caso de error

echo "🔧 Iniciando build de producción..."

# Limpiar directorios previos
echo "🧹 Limpiando build anterior..."
rm -rf dist/
rm -rf node_modules/.cache/

# Verificar Node.js version
NODE_VERSION=$(node --version)
echo "📦 Node.js version: $NODE_VERSION"

# Instalar dependencias
echo "📥 Instalando dependencias..."
npm ci --only=production=false

# Verificar tipos TypeScript
echo "🔍 Verificando tipos TypeScript..."
npm run typecheck

# Ejecutar linter
echo "🔍 Ejecutando linter..."
npm run lint

# Build de la aplicación
echo "🏗️ Construyendo aplicación..."
npm run build:prod

# Verificar que el build fue exitoso
if [ ! -f "dist/main.js" ]; then
  echo "❌ Error: Build falló - main.js no encontrado"
  exit 1
fi

# Limpiar dependencias de desarrollo
echo "🧹 Limpiando devDependencies..."
npm prune --production

# Mostrar tamaño del build
echo "📊 Tamaño del build:"
du -sh dist/

echo "✅ Build de producción completado exitosamente!"
echo "🚀 Listo para desplegar"
