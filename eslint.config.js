import js from '@eslint/js';
import globals from 'globals';

/**
 * Config mínima con un objetivo: que `no-undef` sea un error.
 *
 * Tres veces un identificador sin importar (Icon, useConfirm) pasó el build y
 * los tests y explotó recién en el navegador con pantalla en blanco. El build
 * no lo detecta porque un ReferenceError es de runtime; los tests tampoco
 * porque cortan antes de renderizar esa rama. Esto lo caza en frío.
 */
export default [
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.es2021 },
    },
    rules: {
      ...js.configs.recommended.rules,
      // Sólo lo que revienta en runtime; el estilo no es asunto del linter hoy.
      'no-undef': 'error',
      'no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.test.{js,jsx}', 'src/test/**'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
];
