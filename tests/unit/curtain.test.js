import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rangeProgress } from '../../src/lib/progress.js';
import {
  CURTAIN_RISE,
  curtainRange,
  gated,
  legacyWordsProgress,
  wordsEnd,
  wordsProgress,
} from '../../src/lib/curtain.js';

const close = (actual, expected, eps = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= eps, `${actual} ≉ ${expected}`);

test('CURTAIN_RISE: 0,6 en escritorio y 0,4 en móvil', () => {
  assert.deepEqual(CURTAIN_RISE, { desktop: 0.6, mobile: 0.4 });
});

test('curtainRange: empieza cuando el borde asoma por abajo y acaba al subir rise·alto (escritorio)', () => {
  const { start, end } = curtainRange(2000, 900, 10000, CURTAIN_RISE.desktop);
  assert.equal(start, 1100);
  close(end, 1640);
  close(rangeProgress(1370, start, end), 0.5);
});

test('curtainRange: tramo más corto en móvil (rise 0,4)', () => {
  const { start, end } = curtainRange(2000, 800, 10000, CURTAIN_RISE.mobile);
  assert.equal(start, 1200);
  close(end, 1520);
});

test('curtainRange: tramo acortado al final de página (end = maxScroll) y progreso 1 en maxScroll', () => {
  const { start, end } = curtainRange(5000, 900, 4500, CURTAIN_RISE.desktop);
  assert.equal(start, 4100);
  assert.equal(end, 4500);
  assert.equal(rangeProgress(4500, start, end), 1);
  assert.ok(rangeProgress(4499, start, end) < 1);
});

test('curtainRange: ventana muy alta sin recorrido suficiente → tramo invertido y progreso 1 en maxScroll', () => {
  // 1440×2400: la sección asoma ya con scroll 0 y la página apenas desplaza.
  const { start, end } = curtainRange(3000, 2400, 500, CURTAIN_RISE.desktop);
  assert.equal(start, 600);
  assert.equal(end, 500);
  assert.equal(rangeProgress(500, start, end), 1);
  assert.equal(rangeProgress(0, start, end), 0);
});

test('curtainRange: el progreso vale 1 en maxScroll en cualquier caso', () => {
  for (const vh of [375, 390, 600, 839, 900, 2400]) {
    for (const rise of [CURTAIN_RISE.desktop, CURTAIN_RISE.mobile]) {
      for (const maxScroll of [0, 300, 1500, 4000]) {
        for (const top of [0, 200, 900, 1700, 4000, 6000]) {
          const { start, end } = curtainRange(top, vh, maxScroll, rise);
          assert.equal(rangeProgress(maxScroll, start, end), 1, `vh ${vh} rise ${rise} max ${maxScroll} top ${top}`);
        }
      }
    }
  }
});

test('curtainRange: sección ya visible con scroll 0 → progreso parcial o completo según su posición', () => {
  // asoma 400 px por abajo: a mitad de su tramo
  const partial = curtainRange(500, 900, 5000, CURTAIN_RISE.desktop);
  close(rangeProgress(0, partial.start, partial.end), 400 / 540);
  // su borde ya subió más que rise·alto: abierta del todo
  const open = curtainRange(200, 900, 5000, CURTAIN_RISE.desktop);
  assert.equal(rangeProgress(0, open.start, open.end), 1);
});

test('wordsEnd: el centro del texto en el centro de la ventana', () => {
  assert.equal(wordsEnd(3000, 400, 900), 2750);
});

test('wordsProgress: 0 mientras la cortina no está en 1, 1 con el centro del texto en el centro', () => {
  const curtain = curtainRange(2000, 900, 10000, CURTAIN_RISE.desktop); // end 1640
  const textEnd = wordsEnd(2300, 400, 900); // 2050
  for (let y = curtain.start - 200; y < curtain.end; y += 10) {
    assert.ok(rangeProgress(y, curtain.start, curtain.end) < 1);
    assert.equal(wordsProgress(y, curtain.end, textEnd), 0, `y ${y}`);
  }
  assert.equal(wordsProgress(curtain.end, curtain.end, textEnd), 0);
  close(wordsProgress((curtain.end + textEnd) / 2, curtain.end, textEnd), 0.5);
  assert.equal(wordsProgress(textEnd, curtain.end, textEnd), 1);
  assert.equal(wordsProgress(textEnd + 500, curtain.end, textEnd), 1);
});

test('wordsProgress: si el centro llega antes que la cortina (textEnd ≤ curtainEnd) → 0 antes y 1 desde la cortina', () => {
  assert.equal(wordsProgress(1599, 1600, 1500), 0);
  assert.equal(wordsProgress(1600, 1600, 1500), 1);
  assert.equal(wordsProgress(1600, 1600, 1600), 1);
});

test('legacyWordsProgress: misma opacidad por palabra que la curva de la spec 000', () => {
  // spec 000: opacity = clamp(0.18, (p − 0.12) / 0.38 · n − i, 1)
  const opacity = (t) => Math.min(1, Math.max(0.18, t));
  const n = 24;
  for (let p = 0; p <= 1.0001; p += 0.01) {
    const w = legacyWordsProgress(p);
    assert.ok(w >= 0 && w <= 1);
    for (let i = 0; i < n; i += 1) {
      close(opacity(w * n - i), opacity(((p - 0.12) / 0.38) * n - i), 1e-9);
    }
  }
  assert.equal(legacyWordsProgress(0.12), 0);
  assert.equal(legacyWordsProgress(0.5), 1);
  close(legacyWordsProgress(0.31), 0.5);
});

test('gated: el primer escenario espera a que la cortina llegue a 1', () => {
  assert.equal(gated(0.7, 0), 0);
  assert.equal(gated(0.7, 0.999), 0);
  assert.equal(gated(0.7, 1), 0.7);
  assert.equal(gated(0, 1), 0);
});
