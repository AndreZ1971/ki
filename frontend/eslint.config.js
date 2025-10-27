// frontend/eslint.config.js
import js from '@eslint/js';
import react from 'react';
import reactHooks from 'react-hooks';
import reactRefresh from 'react-refresh';

export default [
  {
    ignores: [
      'dist/**',           // Ignoriere kompilierte Dateien
      'build/**',          // Ignoriere Build-Ordner
      'node_modules/**',   // Ignoriere node_modules
      '*.min.js',          // Ignoriere minimierte Dateien
      'coverage/**'        // Ignoriere Test-Coverage
    ]
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        URLSearchParams: 'readonly',
        URL: 'readonly',
        AbortController: 'readonly'
      }
    },
    // ... restliche Konfiguration
  }
];