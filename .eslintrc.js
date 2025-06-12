module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020,
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended'],
  root: true,
  env: {
    node: true,
    es2020: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/', 'node_modules/'],
  rules: {
    'no-unused-vars': 'off',
    'no-undef': 'off',
    'prefer-const': 'warn',
    'no-var': 'error',
    'no-console': 'off',
  },
};
