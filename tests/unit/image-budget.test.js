import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IMAGE_BUDGET, checkImageFiles, isImage, sumImageBytes } from '../../src/lib/image-budget.js';

test('límites de la spec 003 (RNF-1, RNF-2)', () => {
  assert.deepEqual(IMAGE_BUDGET, { perFile: 92160, beforeScroll: 204800, total: 716800 });
});

test('isImage reconoce imágenes por tipo de iniciador o por extensión', () => {
  assert.equal(isImage({ name: 'https://x/a.avif', initiatorType: 'other' }), true);
  assert.equal(isImage({ name: 'https://x/a.webp?v=1', initiatorType: 'other' }), true);
  assert.equal(isImage({ name: 'https://x/a.JPG', initiatorType: 'other' }), true);
  assert.equal(isImage({ name: 'https://x/sin-extension', initiatorType: 'img' }), true);
  assert.equal(isImage({ name: 'https://x/app.js', initiatorType: 'script' }), false);
  assert.equal(isImage({ name: 'https://x/font.woff2', initiatorType: 'css' }), false);
  assert.equal(isImage({ name: 'https://x/favicon.svg', initiatorType: 'link' }), false);
});

test('sumImageBytes suma solo imágenes, con encodedBodySize (vale también con caché)', () => {
  assert.equal(sumImageBytes([]), 0);
  const entries = [
    { name: '/media/conceptos/a-800.avif', initiatorType: 'img', encodedBodySize: 1000, transferSize: 0 },
    { name: '/media/conceptos/b-400.webp', initiatorType: 'img', encodedBodySize: 250, transferSize: 550 },
    { name: '/assets/index.js', initiatorType: 'script', encodedBodySize: 9999 },
  ];
  assert.equal(sumImageBytes(entries), 1250);
});

test('sumImageBytes cuenta cada URL una sola vez', () => {
  const e = { name: '/a.avif', initiatorType: 'img', encodedBodySize: 100 };
  assert.equal(sumImageBytes([e, { ...e }]), 100);
});

test('checkImageFiles: justo en el límite pasa y 1 B más falla', () => {
  const ok = checkImageFiles([{ name: 'a.avif', size: 92160 }]);
  assert.deepEqual(ok, { ok: true, over: [] });
  const bad = checkImageFiles([
    { name: 'a.avif', size: 92161 },
    { name: 'b.webp', size: 10 },
  ]);
  assert.deepEqual(bad, { ok: false, over: [{ name: 'a.avif', size: 92161 }] });
});

test('checkImageFiles acepta otro límite y una lista vacía', () => {
  assert.deepEqual(checkImageFiles([], 10), { ok: true, over: [] });
  assert.equal(checkImageFiles([{ name: 'a', size: 11 }], 10).ok, false);
});
