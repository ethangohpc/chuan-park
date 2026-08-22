import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import astro from 'eslint-plugin-astro';

export default [
  {
    // Build output and generated types are not ours to lint.
    ignores: [
      'dist/**',
      '.astro/**',
      '.vercel/**',
      '.output/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.astro'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
      // TypeScript already resolves globals (DOM lib, Node types) far more
      // accurately than ESLint's static globals list. Leaving no-undef on here
      // just produces false positives for Response, URL, AbortController, etc.
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },
  ...astro.configs.recommended,
  {
    files: ['**/*.config.{js,mjs,ts}', 'playwright.config.ts'],
    rules: { 'no-undef': 'off' },
  },
];
