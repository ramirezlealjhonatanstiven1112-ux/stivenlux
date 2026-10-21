import { test } from 'node:test';
import assert from 'node:assert/strict';
import { whatsappBuildWarning } from '../../src/lib/whatsapp.js';

test('sin número configurado avisa de que falta (RF-3)', () => {
  for (const number of ['', '   ', undefined, null]) {
    const warning = whatsappBuildWarning(number);
    assert.match(warning, /WhatsApp sin configurar/);
    assert.match(warning, /site\.whatsapp\.number/);
    assert.match(warning, /#contacto/);
  }
});

test('con número configurado pero inválido avisa e indica el formato esperado (RF-3)', () => {
  for (const number of ['12345', '57.300.123.4567']) {
    const warning = whatsappBuildWarning(number);
    assert.match(warning, /WhatsApp no válido/);
    assert.ok(warning.includes(`"${number}"`), 'el aviso cita el valor configurado');
    assert.match(warning, /8 a 15 dígitos/);
    assert.match(warning, /espacios, guiones, paréntesis y \+/);
    assert.match(warning, /#contacto/);
  }
});

test('con número válido no avisa', () => {
  assert.equal(whatsappBuildWarning('573001234567'), null);
  assert.equal(whatsappBuildWarning('+57 (300) 123-4567'), null);
});
