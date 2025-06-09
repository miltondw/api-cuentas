#!/bin/bash

echo "=== RENDER DEPLOYMENT VERIFICATION ==="
echo "Current working directory: $(pwd)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

echo -e "\n=== CHECKING PROJECT STRUCTURE ==="
echo "Package.json exists: $(test -f package.json && echo 'YES' || echo 'NO')"
echo "Source directory exists: $(test -d src && echo 'YES' || echo 'NO')"
echo "Main.ts exists: $(test -f src/main.ts && echo 'YES' || echo 'NO')"

echo -e "\n=== BUILDING PROJECT ==="
npm ci
npm run build

echo -e "\n=== POST-BUILD VERIFICATION ==="
echo "Dist directory exists: $(test -d dist && echo 'YES' || echo 'NO')"
echo "Main.js exists: $(test -f dist/main.js && echo 'YES' || echo 'NO')"

if [ -d dist ]; then
    echo "Contents of dist directory:"
    ls -la dist/
fi

echo -e "\n=== STARTING APPLICATION ==="
npm start
