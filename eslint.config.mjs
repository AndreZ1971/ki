import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  // 1) Globale Ignores - DIST ORDNER EXPLIZIT AUSSCHLIESSEN
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/public/**',
      '**/*.d.ts', 
      '**/.husky/**',
      '**/.vscode/**',
      '**/*.log',
      'frontend/.next/**',
      'backend/dist/**',
      '!backend/src/**'
    ],
  },
  
  // 2) JavaScript-Basis + Node.js Globals
  {
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2020,
      },
    },
  },

  // 3) TypeScript
  ...tseslint.configs.recommended,

  // 4) Import/Order & allgemeine Regeln
  {
    plugins: {
      import: importPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      'import/order': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { 
          argsIgnorePattern: '^_', 
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
      'prefer-const': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // 5) Spezielle Regeln für Backend Job-Dateien
  {
    files: ['backend/**/jobs/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
];