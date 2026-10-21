import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWhatsappUrl } from '../../src/lib/whatsapp.js';

test('sin número devuelve null (RF-3)', () => {
  assert.equal(buildWhatsappUrl('', 'Hola'), null);
  assert.equal(buildWhatsappUrl(undefined), null);
  assert.equal(buildWhatsappUrl('abc'), null);
});

test('rechaza números fuera del rango E.164 (8 a 15 dígitos)', () => {
  assert.equal(buildWhatsappUrl('1234567'), null);
  assert.equal(buildWhatsappUrl('1234567890123456'), null);
});

test('limpia el formato y codifica el mensaje (RF-2)', () => {
  assert.equal(
    buildWhatsappUrl('+57 300-123 4567', 'Hola Stiven Lux, quiero iniciar un proyecto web.'),
    'https://wa.me/573001234567?text=Hola%20Stiven%20Lux%2C%20quiero%20iniciar%20un%20proyecto%20web.',
  );
});

test('sin mensaje no añade el parámetro text', () => {
  assert.equal(buildWhatsappUrl('573001234567', '   '), 'https://wa.me/573001234567');
});

test('solo elimina espacios, guiones, paréntesis y + (definición «Número válido» de spec 000)', () => {
  assert.equal(buildWhatsappUrl('+57 (300) 123-4567'), 'https://wa.me/573001234567');
  assert.equal(buildWhatsappUrl('abc12345678'), null);
  assert.equal(buildWhatsappUrl('57300123456x'), null);
  assert.equal(buildWhatsappUrl('57.300.123.4567'), null);
});
