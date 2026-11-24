import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_QTY, addItem, cartTotals, countItems, formatPrice, parseCart, removeItem, setQty } from '../../src/lib/cart.js';

const catalog = { one: { name: 'One', price: 459900 }, go: { name: 'Go', price: 189900 } };

test('agregar suma a la línea existente y no muta', () => {
  const cart = addItem([], 'one');
  assert.deepEqual(addItem(cart, 'one'), [{ id: 'one', qty: 2 }]);
  assert.deepEqual(cart, [{ id: 'one', qty: 1 }]);
});

test('la cantidad tiene tope, 0 quita y lo inválido no entra', () => {
  assert.equal(addItem([{ id: 'one', qty: MAX_QTY }], 'one')[0].qty, MAX_QTY);
  assert.deepEqual(setQty([{ id: 'one', qty: 2 }], 'one', 0), []);
  assert.deepEqual(setQty([], 'one', Number.NaN), []);
  assert.deepEqual(removeItem([{ id: 'one', qty: 2 }, { id: 'go', qty: 1 }], 'one'), [{ id: 'go', qty: 1 }]);
});

test('cuenta y totales con envío; vacío no cobra envío', () => {
  const cart = [{ id: 'one', qty: 2 }, { id: 'go', qty: 1 }];
  assert.equal(countItems(cart), 3);
  assert.deepEqual(cartTotals(cart, catalog, 12900), { subtotal: 1109700, shipping: 12900, total: 1122600 });
  assert.deepEqual(cartTotals([], catalog, 12900), { subtotal: 0, shipping: 0, total: 0 });
});

test('lo guardado se valida contra el catálogo', () => {
  assert.deepEqual(parseCart(null, catalog), []);
  assert.deepEqual(parseCart('{mal', catalog), []);
  assert.deepEqual(parseCart('{"a":1}', catalog), []);
  const raw = JSON.stringify([null, { id: 'x', qty: 1 }, { id: 'toString', qty: 1 }, { id: 'go', qty: 99 }, { id: 'one', qty: -2 }]);
  assert.deepEqual(parseCart(raw, catalog), [{ id: 'go', qty: MAX_QTY }]);
});

test('precio con separador de miles', () => {
  assert.equal(formatPrice(0), '$\u00a00');
  assert.equal(formatPrice(459900), '$\u00a0459.900');
  assert.equal(formatPrice(1109700), '$\u00a01.109.700');
});
