import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clamp01, enterProgress, heroProgress, traverseProgress } from '../../src/lib/progress.js';

test('clamp01 limita a [0, 1] y trata valores no numéricos como 0', () => {
  assert.equal(clamp01(-2), 0);
  assert.equal(clamp01(0.4), 0.4);
  assert.equal(clamp01(7), 1);
  assert.equal(clamp01(NaN), 0);
  assert.equal(clamp01(Infinity), 0);
});

test('traverseProgress: entra por abajo en 0, sale por arriba en 1', () => {
  assert.equal(traverseProgress(900, 400, 900), 0);
  assert.equal(traverseProgress(-400, 400, 900), 1);
  assert.equal(traverseProgress(250, 400, 900), 0.5);
});

test('enterProgress llega a 1 cuando el borde sube el 75 % del viewport', () => {
  assert.equal(enterProgress(1000, 800), 0);
  assert.equal(enterProgress(800, 800), 0);
  assert.equal(enterProgress(200, 800), 1);
  assert.equal(enterProgress(500, 800), 0.5);
});

test('heroProgress: 0 arriba, 1 tras una pantalla', () => {
  assert.equal(heroProgress(0, 900), 0);
  assert.equal(heroProgress(450, 900), 0.5);
  assert.equal(heroProgress(3000, 900), 1);
  assert.equal(heroProgress(100, 0), 0);
});
