import js from '@eslint/js';

const browser = Object.fromEntries(
  [
    'window', 'document', 'navigator', 'console', 'requestAnimationFrame', 'cancelAnimationFrame',
    'IntersectionObserver', 'matchMedia', 'setTimeout', 'clearTimeout', 'HTMLElement',
  ].map((name) => [name, 'readonly']),
);

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: { globals: browser },
  },
  {
    files: ['*.config.js'],
    languageOptions: { globals: { process: 'readonly' } },
  },
];
