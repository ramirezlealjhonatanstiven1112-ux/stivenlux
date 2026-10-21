import { test } from 'node:test';
import assert from 'node:assert/strict';
import { budgetCheck } from '../../src/lib/budget.js';

const LIMIT = 15 * 1024;

test('budgetCheck: dentro del límite y del margen → ok, con el incremento en bytes', () => {
  assert.deepEqual(budgetCheck({ size: 2236, base: 2236, allowance: 2560, limit: LIMIT }), { delta: 0, ok: true });
  assert.deepEqual(budgetCheck({ size: 3526, base: 2236, allowance: 2560, limit: LIMIT }), { delta: 1290, ok: true });
});

test('budgetCheck: justo en el margen es válido; un byte más, no', () => {
  assert.deepEqual(budgetCheck({ size: 4796, base: 2236, allowance: 2560, limit: LIMIT }), { delta: 2560, ok: true });
  assert.deepEqual(budgetCheck({ size: 4797, base: 2236, allowance: 2560, limit: LIMIT }), { delta: 2561, ok: false });
});

test('budgetCheck: sobre el límite general falla aunque el margen alcance', () => {
  assert.deepEqual(budgetCheck({ size: LIMIT + 1, base: LIMIT - 100, allowance: 2560, limit: LIMIT }), { delta: 101, ok: false });
  assert.equal(budgetCheck({ size: LIMIT, base: LIMIT - 100, allowance: 2560, limit: LIMIT }).ok, true);
});

test('budgetCheck: un margen menor que el incremento falla (también un margen negativo con incremento 0)', () => {
  assert.equal(budgetCheck({ size: 2300, base: 2236, allowance: 50, limit: LIMIT }).ok, false);
  assert.equal(budgetCheck({ size: 2236, base: 2236, allowance: -1, limit: LIMIT }).ok, false);
});

test('budgetCheck: reducir el peso da un incremento negativo y es válido', () => {
  assert.deepEqual(budgetCheck({ size: 2000, base: 2236, allowance: 2560, limit: LIMIT }), { delta: -236, ok: true });
});
