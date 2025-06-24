#!/bin/bash

echo "🚀 Starting Render Build Process..."
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

echo "🔨 Building application..."
echo "Path: $PATH"

# Esto es solo para depuración. No afectará el resultado si falla.
echo "Which nest: $(./node_modules/.bin/which nest || echo 'Nest CLI not found via direct path')"

# Intenta construir usando la ruta directa al binario de NestJS CLI
if ./node_modules/.bin/nest build; then
    echo "✅ Build successful using direct path to NestJS CLI"
else
    echo "❌ Build failed. Attempting to diagnose..."
    # Si la construcción falla con el path directo, muestra información de depuración
    echo "📑 Debug information:"
    echo "package.json scripts:"
    cat package.json | grep -A 15 '"scripts"'
    echo "Node modules:"
    ls -la node_modules/.bin/
    exit 1
fi

# Verify build output
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