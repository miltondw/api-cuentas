#!/bin/bash

echo "🚀 Starting Render Build Process..."
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Ensure NestJS CLI is installed
echo "🔨 Installing NestJS CLI..."
npm install -g @nestjs/cli

# Wait a moment to ensure CLI is available
sleep 1

echo "🔨 Building application..."
echo "Path: $PATH"
echo "Which nest: $(which nest)"

# Attempt build methods in order of preference
if nest build; then
    echo "✅ Build successful with global NestJS CLI"
elif npm run build; then
    echo "✅ Build successful with npm run build"
elif npx --yes @nestjs/cli build; then
    echo "✅ Build successful with npx @nestjs/cli"
else
    echo "❌ All build methods failed"
    
    # Debug information
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
