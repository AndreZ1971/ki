// ESLint v9 Flat Config
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  // Ignorieren (ersetzt .eslintignore)
  { ignores: ['dist', 'node_modules', 'coverage', 'build'] },

  // Basis-Configs
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,

  // Globale Spracheinstellungen (Node + Browser)
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // CommonJS-Overrides für *.cjs (z.B. ecosystem.config.cjs)
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node, // 'module', 'require', '__dirname' etc.
      },
    },
    rules: {
      'no-undef': 'off', // Node stellt 'module' u.a. bereit
    },
  },

  // TypeScript-Dateien
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: false, // unblocking (kein zwingendes tsconfig Project)
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      import: importPlugin,
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // Unblock: 'any' vorerst erlauben (kann später verschärft werden)
      '@typescript-eslint/no-explicit-any': 'off',

      // Import-Hygiene
      'import/order': [
        'warn',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          groups: [['builtin', 'external'], ['internal'], ['parent', 'sibling', 'index']],
        },
      ],

      // Verhindert den Fehler in komplexen Regex/Strings
      'no-useless-escape': 'off',
    },
  },
];

