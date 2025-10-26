import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';

export default [
  // 1) WICHTIG: dist/ komplett ignorieren
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',           // ← Kompilierte JS Dateien ignorieren
      '**/build/**',
      '**/*.d.ts',
      '**/.husky/**',
      '**/.vscode/**',
      '**/*.log',
      'frontend/.next/**'
    ],
  },

  // 2) JavaScript-Basis
  js.configs.recommended,

  // 3) TypeScript
  ...tseslint.configs.recommended,

  // 4) Import/Order & allgemeine Regeln
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/order': [
        'warn',
        {
          groups: [
            'external',
            'builtin',
            'internal',
            ['parent', 'sibling', 'index'],
            'object',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn', // Nur Warnung, kein Error
      'no-console': 'off',
    },
  },

  // 5) Spezielle Regeln für Backend Job-Dateien
  {
    files: ['backend/**/jobs/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off' // any erlauben in Jobs
    }
  },

  // 6) Backend-spezifische Regeln
  {
    files: ['backend/**/*.ts'],
    rules: {
      'no-console': 'warn',
    }
  },

  // 7) Frontend-spezifische Regeln
  {
    files: ['frontend/**/*.ts', 'frontend/**/*.tsx'],
    rules: {
      'no-console': 'warn',
    }
  },
];