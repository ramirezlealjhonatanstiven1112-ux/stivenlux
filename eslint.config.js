import js from '@eslint/js';

const readonly = (names) => Object.fromEntries(names.map((name) => [name, 'readonly']));

const browser = readonly([
  'window', 'document', 'navigator', 'console', 'requestAnimationFrame', 'cancelAnimationFrame',
  'IntersectionObserver', 'matchMedia', 'setTimeout', 'clearTimeout', 'HTMLElement',
]);

const node = readonly(['process', 'console', 'Buffer']);

export default [
  // .claude/ contiene skills de terceros (HyperFrames, Higgsfield): no es código del proyecto
  {
    ignores: ['dist/**', 'node_modules/**', '.claude/**', 'video/**', 'test-results/**', 'playwright-report/**'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: { globals: browser },
  },
  {
    files: ['*.config.js', 'scripts/**/*.mjs'],
    languageOptions: { globals: node },
  },
  {
    // Los tests corren en Node, pero los callbacks de page.evaluate se ejecutan en el navegador
    files: ['tests/**/*.js'],
    languageOptions: { globals: { ...node, ...browser } },
  },
];
