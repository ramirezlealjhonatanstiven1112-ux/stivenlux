import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bestOf, contrastRatio, luminance, parseColor } from '../../src/lib/contrast.js';

const close = (actual, expected, eps) => assert.ok(Math.abs(actual - expected) <= eps, `${actual} ≉ ${expected}`);

test('parseColor: rgb(), rgba() y hexadecimal', () => {
  assert.deepEqual(parseColor('rgb(35, 64, 255)'), [35, 64, 255]);
  assert.deepEqual(parseColor('rgba(0, 0, 0, 0.5)'), [0, 0, 0]);
  assert.deepEqual(parseColor('#2340ff'), [35, 64, 255]);
  assert.deepEqual(parseColor('#FFFFFF'), [255, 255, 255]);
});

test('luminance: WCAG 2.x (0 negro, 1 blanco)', () => {
  assert.equal(luminance([0, 0, 0]), 0);
  assert.equal(luminance([255, 255, 255]), 1);
});

test('contrastRatio: blanco/negro 21, blanco/azul de acento 6,46, igual 1 y simétrico', () => {
  close(contrastRatio('#ffffff', '#000000'), 21, 1e-9);
  close(contrastRatio('rgb(255, 255, 255)', '#2340ff'), 6.46, 0.01);
  close(contrastRatio('#2340ff', '#2340ff'), 1, 1e-9);
  assert.equal(contrastRatio('#2340ff', '#ffffff'), contrastRatio('#ffffff', '#2340ff'));
});

test('bestOf (RF-2): el mejor de los dos tonos del punto sobre un fondo', () => {
  const tones = ['#ffffff', '#000000'];
  close(bestOf(tones, '#ffffff'), 21, 1e-9);
  close(bestOf(tones, '#000000'), 21, 1e-9);
  assert.ok(bestOf(tones, '#2340ff') >= 3);
  assert.ok(bestOf(tones, '#808080') >= 3);
});
