import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toWords } from '../../src/lib/words.js';

test('divide por cualquier espacio en blanco y descarta vacíos', () => {
  assert.deepEqual(toWords('  Internet está\n  lleno   de webs. '), ['Internet', 'está', 'lleno', 'de', 'webs.']);
});

test('texto vacío o ausente devuelve una lista vacía', () => {
  assert.deepEqual(toWords(''), []);
  assert.deepEqual(toWords(null), []);
});
