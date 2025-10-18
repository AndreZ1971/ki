// ESLint Flat Config (ESLint ≥ 9)
// Tipp: Benenne die Datei in `eslint.config.mjs` um, dann verschwindet die ESM-Warnung.

import js from "@eslint/js";
import importPlugin from "eslint-plugin-import"; // ← vor typescript-eslint
import tseslint from "typescript-eslint";

export default [
  // 1) Globale Ignores (ersetzt .eslintignore)
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "**/*.d.ts",
      ".husky/**",
      ".vscode/**",
      "*.log",
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
      "import/order": [
        "warn",
        {
          groups: [
            "external",
            "builtin",
            "internal",
            ["parent", "sibling", "index"],
            "object",
            "type",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "off",
    },
  },

  // 5) CJS-Override
  {
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        module: "readonly",
        require: "readonly",
        __dirname: "readonly",
        process: "readonly",
      },
    },
    rules: { "no-undef": "off" },
  },
];


