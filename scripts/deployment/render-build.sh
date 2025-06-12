#!/bin/bash

echo "🚀 Starting Render Build Process..."
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Try NestJS CLI first, fallback to TypeScript compiler with path resolution
echo "🔨 Building application..."
if npm run build; then
    echo "✅ Build successful with npm run build"
elif npx --yes @nestjs/cli build; then
    echo "✅ Build successful with @nestjs/cli"
elif npm install -g @nestjs/cli && nest build; then
    echo "✅ Build successful after installing @nestjs/cli globally"
else
    echo "❌ All build methods failed"
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
