#!/usr/bin/env node

// Register tsconfig paths before requiring the main module
const tsConfigPaths = require('tsconfig-paths');
const path = require('path');

try {
  tsConfigPaths.register({
    baseUrl: path.join(__dirname, 'dist'),
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
