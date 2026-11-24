import { test } from 'node:test';
import assert from 'node:assert/strict';
import { choose, dropPast, firstMissing, formatDate, isoDate, nextDays, slotsFor } from '../../src/lib/appointment.js';

test('días: desde mañana, sin domingos y cruzando de año', () => {
  assert.deepEqual(nextDays('2026-11-27', 3), ['2026-11-28', '2026-11-30', '2026-12-01']);
  assert.deepEqual(nextDays('2026-12-31', 2), ['2027-01-01', '2027-01-02']);
  assert.equal(isoDate(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
});

test('horas: sábado corto, domingo cerrado, estables y con alguna libre', () => {
  assert.equal(slotsFor('2026-11-28').length, 4);
  assert.equal(slotsFor('2026-11-30').length, 8);
  assert.deepEqual(slotsFor('2026-11-29'), []);
  assert.deepEqual(slotsFor('2026-11-30'), slotsFor('2026-11-30'));
  for (const day of nextDays('2026-11-24', 60)) assert.ok(slotsFor(day).some((s) => s.free), day);
});

test('pasos: primero que falta y cita completa', () => {
  assert.equal(firstMissing({}), 'service');
  assert.equal(firstMissing({ service: 'a' }), 'date');
  assert.equal(firstMissing({ service: 'a', date: '2026-11-30' }), 'time');
  assert.equal(firstMissing({ service: 'a', date: '2026-11-30', time: '08:00' }), null);
});

test('cambiar de fecha conserva la hora solo si sigue libre', () => {
  const state = { service: 'a', date: '2026-11-30', time: '17:00' };
  assert.equal(choose(state, 'date', '2026-11-28').time, undefined); // sábado
  const free = slotsFor('2026-12-01').find((s) => s.free).time;
  assert.equal(choose({ ...state, time: free }, 'date', '2026-12-01').time, free);
  assert.equal(state.time, '17:00');
});

test('fecha en español sin desfase horario', () => {
  assert.equal(formatDate('2026-11-30'), 'lunes, 30 de noviembre');
});

test('un día que ya pasó se descarta con su hora', () => {
  const state = { service: 'a', date: '2026-11-30', time: '08:00' };
  assert.equal(dropPast(state, '2026-11-29'), state);
  assert.deepEqual(dropPast(state, '2026-11-30'), { service: 'a' });
});
