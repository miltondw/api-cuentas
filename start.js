#!/usr/bin/env node

// Register tsconfig paths before any other imports
const tsConfigPaths = require('tsconfig-paths');
const tsConfig = require('./tsconfig.paths.json');

// Setup the path mapping
tsConfigPaths.register({
  baseUrl: './',
  paths: tsConfig.compilerOptions.paths
});

// Start the application
require('./dist/main');
