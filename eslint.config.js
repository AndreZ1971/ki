// ESLint v9 Flat Config
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';

export default [
  // Ordner ignorieren
  { ignores: ['dist', 'node_modules'] },

  // Basisempfehlungen (JS)
  js.configs.recommended,

  // TypeScript-Empfehlungen (Parser+Plugin+Rules)
  ...tseslint.configs.recommended,

  // Prettier-Kompatibilität (schaltet kollidierende Regeln aus)
  prettier,

  // Projektregeln
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      import: importPlugin,
      '@typescript-eslint': tseslint.plugin
    },
    rules: {
      // sinnvolle Defaults
      'no-console': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // (optional) Import-Hygiene
      'import/order': [
        'warn',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          groups: [['builtin', 'external'], ['internal'], ['parent', 'sibling', 'index']]
        }
      ]
    }
  }
];
