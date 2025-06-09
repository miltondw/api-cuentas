#!/bin/bash

echo "🚀 Starting Render Build Process..."
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Try NestJS CLI first, fallback to TypeScript compiler
echo "🔨 Building application..."
if npx nest build; then
    echo "✅ Build successful with NestJS CLI"
elif npx tsc -p tsconfig.build.json; then
    echo "✅ Build successful with TypeScript compiler"
elif npx tsc; then
    echo "✅ Build successful with default TypeScript config"
else
    echo "❌ Build failed with all methods"
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
