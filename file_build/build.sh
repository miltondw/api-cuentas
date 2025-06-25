#!/bin/bash

echo "🚀 Starting Render Build Process..."
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Elimina archivo dist si existe (y no es un directorio)
if [ -f "dist" ]; then
  echo "⚠️  dist existe como archivo, eliminando..."
  rm -f dist
fi

# Limpia la carpeta dist antes de construir (evita errores EEXIST)
rm -rf dist

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

echo "🔨 Building application..."
echo "Path: $PATH"

# Usa el binario local de NestJS CLI para evitar problemas de PATH
if ./node_modules/.bin/nest build; then
    echo "✅ Build successful using direct path to NestJS CLI"
else
    echo "❌ Build failed. Attempting to diagnose..."
    echo "📑 Debug information:"
    echo "package.json scripts:"
    cat package.json | grep -A 15 '"scripts"'
    echo "Node modules:"
    ls -la node_modules/.bin/
    exit 1
fi

# Verifica la salida del build
echo "📋 Build verification:"
if [ -d "dist" ]; then
    echo "✅ dist/ directory exists"
    ls -la dist/
    if [ -f "dist/main.js" ]; then
        echo "✅ main.js exists"
        ls -la dist/main.js
    else
        echo "❌ main.js not found in dist/"
        exit 1
    fi
else
    echo "❌ dist/ directory not found"
    exit 1
fi

echo "🎉 Build completed successfully!"