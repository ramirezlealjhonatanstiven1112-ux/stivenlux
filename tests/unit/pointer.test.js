import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAGNET,
  boxDistance,
  isFullWidth,
  isModifierKey,
  isRing,
  magnetActive,
  magnetAllowed,
  magnetOffset,
  parseTranslate,
  pointerMode,
} from '../../src/lib/pointer.js';

const close = (actual, expected, eps = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= eps, `${actual} ≉ ${expected}`);

// Botón de 200×56 px con la esquina superior izquierda en (100, 100)
const box = { left: 100, top: 100, right: 300, bottom: 156, width: 200, height: 56 };
const cx = 200;
const cy = 128;
const len = ({ x, y }) => Math.hypot(x, y);
// 8 direcciones desde el centro: el punto del borde y el vector unitario hacia fuera
const DIRS = [
  [[300, 128], [1, 0]],
  [[100, 128], [-1, 0]],
  [[200, 100], [0, -1]],
  [[200, 156], [0, 1]],
  [[300, 100], [Math.SQRT1_2, -Math.SQRT1_2]],
  [[300, 156], [Math.SQRT1_2, Math.SQRT1_2]],
  [[100, 100], [-Math.SQRT1_2, -Math.SQRT1_2]],
  [[100, 156], [-Math.SQRT1_2, Math.SQRT1_2]],
];
const along = ([[ex, ey], [ux, uy]], d) => [ex + ux * d, ey + uy * d];

test('MAGNET: alcance 24 px, retirada 32 px, 5 px en el borde y 8 px como máximo', () => {
  assert.deepEqual(MAGNET, { reach: 24, release: 32, edge: 5, max: 8 });
});

test('boxDistance: 0 dentro y en el borde; distancia en un eje; hypot en diagonal', () => {
  assert.equal(boxDistance(150, 120, box), 0);
  assert.equal(boxDistance(300, 156, box), 0);
  assert.equal(boxDistance(310, 120, box), 10);
  assert.equal(boxDistance(150, 90, box), 10);
  close(boxDistance(303, 160, box), 5);
});

test('magnetOffset (RF-7): 0 a 24 px o más, también entre 24 y 32 px', () => {
  for (const dir of DIRS) {
    for (const d of [24, 28, 32, 40]) {
      const o = magnetOffset(...along(dir, d), box);
      // En diagonal, 24·√½ da 23,999…: se admite el error de coma flotante
      assert.ok(len(o) <= 1e-9, `a ${d} px: ${JSON.stringify(o)}`);
    }
  }
});

test('magnetOffset (RF-7): crece de 24 px al borde, ≥ 3 px en el borde y decrece hasta 0 en el centro', () => {
  for (const dir of DIRS) {
    let prev = 0;
    for (let d = 23; d >= 0; d--) {
      const m = len(magnetOffset(...along(dir, d), box));
      assert.ok(m > prev, `creciente hacia el borde (${d} px)`);
      prev = m;
    }
    assert.ok(prev >= 3, `borde ≥ 3 px (${prev})`);
    // Del borde al centro, por dentro
    const [[ex, ey]] = dir;
    for (let t = 0.1; t <= 1.0001; t += 0.1) {
      const m = len(magnetOffset(ex + (cx - ex) * t, ey + (cy - ey) * t, box));
      assert.ok(m < prev, `decreciente hacia el centro (t = ${t.toFixed(1)})`);
      prev = m;
    }
  }
  assert.equal(len(magnetOffset(cx, cy, box)), 0);
});

test('magnetOffset (RF-7): ≥ 3 px en todo el perímetro (5 en los lados, 7,07 en las esquinas)', () => {
  for (let x = 100; x <= 300; x++) {
    assert.ok(len(magnetOffset(x, 100, box)) >= 3);
    assert.ok(len(magnetOffset(x, 156, box)) >= 3);
  }
  for (let y = 100; y <= 156; y++) {
    assert.ok(len(magnetOffset(100, y, box)) >= 3);
    assert.ok(len(magnetOffset(300, y, box)) >= 3);
  }
  close(len(magnetOffset(300, 128, box)), 5);
  close(len(magnetOffset(300, 156, box)), 5 * Math.SQRT2);
});

test('magnetOffset (RF-7): ≤ 8 px, sin saltos de más de 0,5 px y siempre hacia el puntero', () => {
  let prevRow = null;
  for (let y = 60; y <= 196; y++) {
    const row = [];
    for (let x = 60; x <= 340; x++) {
      const o = magnetOffset(x, y, box);
      assert.ok(len(o) <= 8 + 1e-9, `≤ 8 px en (${x}, ${y})`);
      assert.ok(o.x * (x - cx) + o.y * (y - cy) >= -1e-9, `hacia el puntero en (${x}, ${y})`);
      if (row.length) assert.ok(len({ x: o.x - row.at(-1).x, y: o.y - row.at(-1).y }) <= 0.5);
      if (prevRow) {
        const up = prevRow[row.length];
        assert.ok(len({ x: o.x - up.x, y: o.y - up.y }) <= 0.5);
      }
      row.push(o);
    }
    prevRow = row;
  }
});

test('magnetOffset (RF-9): con el puntero dentro, el botón desplazado sigue debajo del puntero', () => {
  for (let x = 100; x <= 300; x += 5) {
    for (let y = 100; y <= 156; y += 2) {
      const o = magnetOffset(x, y, box);
      assert.ok(x >= box.left + o.x && x <= box.right + o.x && y >= box.top + o.y && y <= box.bottom + o.y);
    }
  }
});

test('magnetOffset: caja degenerada → 0', () => {
  assert.deepEqual(magnetOffset(10, 10, { left: 10, top: 10, right: 10, bottom: 10, width: 0, height: 0 }), {
    x: 0,
    y: 0,
  });
});

test('magnetActive (RF-7): histéresis entre 24 y 32 px', () => {
  assert.equal(magnetActive(false, 28), false);
  assert.equal(magnetActive(true, 28), true);
  assert.equal(magnetActive(true, 32), true);
  assert.equal(magnetActive(true, 32.01), false);
  assert.equal(magnetActive(false, 24), true);
  assert.equal(magnetActive(false, 0), true);
});

test('isFullWidth (RF-8): mismo ancho que el contenedor con ±1 px', () => {
  assert.equal(isFullWidth(320, 320), true);
  assert.equal(isFullWidth(319, 320), true);
  assert.equal(isFullWidth(321, 320), true);
  assert.equal(isFullWidth(318.99, 320), false);
  assert.equal(isFullWidth(200, 320), false);
});

test('pointerMode (RF-1, RF-6, RF-16, RF-22): tabla de verdad', () => {
  // [puntero fino, movimiento reducido, colores forzados] → [punto, imán], escrita a mano
  const table = [
    [[true, false, false], [true, true]],
    [[true, false, true], [false, true]],
    [[true, true, false], [false, false]],
    [[true, true, true], [false, false]],
    [[false, false, false], [false, false]],
    [[false, false, true], [false, false]],
    [[false, true, false], [false, false]],
    [[false, true, true], [false, false]],
  ];
  for (const [args, [dot, magnet]] of table) assert.deepEqual(pointerMode(...args), { dot, magnet }, args.join());
});

test('isRing (RF-3, RF-5): aro sobre pulsables salvo CTA del hero en su entrada y menú en transición', () => {
  // (pulsable, CTA del hero, CTA en su entrada, menú en transición)
  assert.equal(isRing(true, false, false, false), true);
  assert.equal(isRing(false, false, false, false), false);
  assert.equal(isRing(true, false, false, true), false);
  assert.equal(isRing(true, true, true, false), false);
  assert.equal(isRing(true, true, false, false), true);
  assert.equal(isRing(true, false, true, false), true); // la barra, durante la entrada
});

test('magnetAllowed (RF-7, RF-9, RF-21): cada condición lo apaga por separado', () => {
  // (menú abierto, menú en transición, foco, entrada del CTA, ancho completo); el modo de imán y la presencia
  // del puntero los comprueba quien llama
  const ok = [false, false, false, false, false];
  assert.equal(magnetAllowed(...ok), true);
  for (let i = 0; i < ok.length; i += 1) {
    const args = [...ok];
    args[i] = !args[i];
    assert.equal(magnetAllowed(...args), false, `argumento ${i}`);
  }
});

test('isModifierKey (RF-6): las modificadoras no ocultan el punto', () => {
  for (const key of ['Control', 'Shift', 'Alt', 'AltGraph', 'Meta']) assert.equal(isModifierKey(key), true, key);
  for (const key of ['a', 'Tab', 'Enter', 'Escape', ' ', 'ArrowDown', 'ArrowUp', 'CapsLock']) {
    assert.equal(isModifierKey(key), false, key);
  }
});

test('parseTranslate: valor calculado de la propiedad translate', () => {
  assert.deepEqual(parseTranslate('none'), { x: 0, y: 0 });
  assert.deepEqual(parseTranslate(''), { x: 0, y: 0 });
  assert.deepEqual(parseTranslate('5px'), { x: 5, y: 0 });
  assert.deepEqual(parseTranslate('5px 3px'), { x: 5, y: 3 });
  assert.deepEqual(parseTranslate('-2.5px 0px'), { x: -2.5, y: 0 });
});
