import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clamp01, enterProgress, heroProgress, rangeProgress, traverseProgress } from '../../src/lib/progress.js';

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

test('rangeProgress: tramo normal, lineal entre start y end y limitado fuera', () => {
  assert.equal(rangeProgress(50, 0, 100), 0.5);
  assert.equal(rangeProgress(1125, 1100, 1200), 0.25);
  assert.equal(rangeProgress(-10, 0, 100), 0);
  assert.equal(rangeProgress(500, 0, 100), 1);
});

test('rangeProgress: 0 en start y 1 en end (límites incluidos)', () => {
  assert.equal(rangeProgress(1100, 1100, 1640), 0);
  assert.equal(rangeProgress(1640, 1100, 1640), 1);
});

test('rangeProgress: tramo vacío o invertido → 1 desde end, 0 antes', () => {
  // vacío
  assert.equal(rangeProgress(100, 100, 100), 1);
  assert.equal(rangeProgress(99, 100, 100), 0);
  // invertido (end < start)
  assert.equal(rangeProgress(500, 600, 500), 1);
  assert.equal(rangeProgress(550, 600, 500), 1);
  assert.equal(rangeProgress(499, 600, 500), 0);
});
