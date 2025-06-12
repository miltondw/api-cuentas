#!/usr/bin/env node

// Register tsconfig paths before requiring the main module
const tsConfigPaths = require('tsconfig-paths');

// Load the TypeScript config paths for the dist folder
const tsconfigPath = require('path').join(__dirname, 'tscconfig.json');

try {
  const cleanup = tsConfigPaths.register({
    baseUrl: require('path').join(__dirname, 'dist'),
    paths: {
      '@/*': ['*'],
      '@config/*': ['config/*'],
      '@modules/*': ['modules/*'],
      '@common/*': ['common/*'],
    },
  });

  console.log('Path aliases registered successfully');
} catch (error) {
  console.warn('Failed to register path aliases:', error.message);
}

// Start the application
require('./dist/main');
