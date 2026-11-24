import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coolness } from '../../src/lib/thermostat.js';
import { firstMissing } from '../../src/lib/appointment.js';

test('frío: extremos, mitad y fuera de rango', () => {
  assert.deepEqual([31, 25, 19, 40, 5].map((t) => coolness(t, 31, 19)), [0, 0.5, 1, 0, 1]);
  assert.equal(coolness(19, 19, 19), 1);
});

test('la visita solo exige servicio y día', () => {
  const steps = ['service', 'date'];
  assert.equal(firstMissing({ service: 'a' }, steps), 'date');
  assert.equal(firstMissing({ service: 'a', date: '2026-11-30' }, steps), null);
});
