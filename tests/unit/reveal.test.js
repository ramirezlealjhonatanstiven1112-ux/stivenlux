import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SETTLE, groupLines, revealTiming, seenOnSettle, settleCheck, shouldReveal } from '../../src/lib/reveal.js';

/* Titular de escritorio a la vista, con la cortina en 1 y las fuentes listas: se revela. */
const base = { top: 500, bottom: 600, viewportHeight: 900, curtain: 1, atEnd: false, ready: true };

test('seenOnSettle: 1 px dentro de la ventana cuenta como visto', () => {
  assert.equal(seenOnSettle(899, 900), true);
});

test('seenOnSettle: justo en el borde inferior (0 px dentro) no está visto', () => {
  assert.equal(seenOnSettle(900, 900), false);
  assert.equal(seenOnSettle(1500, 900), false);
});

test('seenOnSettle: dentro o por encima de la ventana está visto', () => {
  assert.equal(seenOnSettle(0, 900), true);
  assert.equal(seenOnSettle(-2000, 900), true);
});

/* Asentamiento de la carga (T9): tiempos en ms de performance.now(); el script se ejecuta en start = 100.
   Los casos fijan quiet = 200 (valor de partida del plan); el valor en uso se prueba aparte. */
const run = { start: 100, loadedAt: null, lastMove: 100, quiet: 200 };

test('SETTLE: intervalo corto de 400 ms (subido desde 200 según el plan) y tope de 1 s', () => {
  assert.deepEqual(SETTLE, { quiet: 400, max: 1000 });
});

test('settleCheck: sin quiet ni max usa SETTLE', () => {
  const plain = { start: 100, loadedAt: 150, lastMove: 100 };
  assert.deepEqual(settleCheck({ ...plain, now: 549 }), { due: false, wait: 1 });
  assert.deepEqual(settleCheck({ ...plain, now: 550 }), { due: true, wait: 0 });
  assert.deepEqual(settleCheck({ start: 100, loadedAt: null, lastMove: 100, now: 1100 }), { due: true, wait: 0 });
});

test('settleCheck: sin terminar la carga no se asienta y vuelve a mirar en el tope', () => {
  assert.deepEqual(settleCheck({ ...run, now: 100 }), { due: false, wait: 1000 });
  assert.deepEqual(settleCheck({ ...run, now: 700, lastMove: 650 }), { due: false, wait: 400 });
});

test('settleCheck: a 1 s de la ejecución del script se asienta aunque falte la carga o siga el scroll', () => {
  assert.deepEqual(settleCheck({ ...run, now: 1100 }), { due: true, wait: 0 });
  assert.deepEqual(settleCheck({ ...run, now: 1100, loadedAt: 300, lastMove: 1090 }), { due: true, wait: 0 });
  assert.deepEqual(settleCheck({ ...run, now: 1500, loadedAt: 1400, lastMove: 1450 }), { due: true, wait: 0 });
  assert.equal(settleCheck({ ...run, now: 1099, lastMove: 1090 }).due, false);
});

test('settleCheck: 200 ms sin scroll desde la carga lo asientan; antes, espera lo que falta', () => {
  assert.deepEqual(settleCheck({ ...run, now: 350, loadedAt: 150 }), { due: true, wait: 0 });
  assert.deepEqual(settleCheck({ ...run, now: 349, loadedAt: 150 }), { due: false, wait: 1 });
  assert.deepEqual(settleCheck({ ...run, now: 200, loadedAt: 150 }), { due: false, wait: 150 });
});

test('settleCheck: un scroll posterior a la carga reinicia la calma (restauración o ancla suaves)', () => {
  assert.deepEqual(settleCheck({ ...run, now: 500, loadedAt: 150, lastMove: 400 }), { due: false, wait: 100 });
  assert.deepEqual(settleCheck({ ...run, now: 600, loadedAt: 150, lastMove: 400 }), { due: true, wait: 0 });
  // Un scroll anterior a la carga no cuenta: la calma se mide desde la carga
  assert.deepEqual(settleCheck({ ...run, now: 400, loadedAt: 300, lastMove: 250 }), { due: false, wait: 100 });
});

test('settleCheck: la espera nunca pasa del tope de 1 s', () => {
  assert.deepEqual(settleCheck({ ...run, now: 1000, loadedAt: 150, lastMove: 990 }), { due: false, wait: 100 });
  assert.deepEqual(settleCheck({ ...run, now: 1050, loadedAt: 1000 }), { due: false, wait: 50 });
});

test('settleCheck: script tardío (carga ya terminada, loadedAt = start): 200 ms de calma desde el script', () => {
  const late = { start: 3000, loadedAt: 3000, lastMove: 3000, quiet: 200 };
  assert.deepEqual(settleCheck({ ...late, now: 3000 }), { due: false, wait: 200 });
  assert.deepEqual(settleCheck({ ...late, now: 3200 }), { due: true, wait: 0 });
});

test('settleCheck: quiet y max son parámetros', () => {
  assert.deepEqual(settleCheck({ ...run, now: 350, loadedAt: 150, quiet: 400 }), { due: false, wait: 200 });
  assert.deepEqual(settleCheck({ ...run, now: 550, loadedAt: 150, quiet: 400 }), { due: true, wait: 0 });
  assert.deepEqual(settleCheck({ ...run, now: 600, max: 500 }), { due: true, wait: 0 });
});

test('shouldReveal: se revela con el borde superior por encima del 85 % y la cortina en 1', () => {
  assert.equal(shouldReveal(base), true);
  assert.equal(shouldReveal({ ...base, top: 764, bottom: 864 }), true); // 0,85·900 = 765
});

test('shouldReveal: con el borde superior en el 85 % o por debajo no se revela', () => {
  assert.equal(shouldReveal({ ...base, top: 765, bottom: 865 }), false);
  assert.equal(shouldReveal({ ...base, top: 850, bottom: 950 }), false);
});

test('shouldReveal: con la cortina por debajo de 1 no se revela', () => {
  assert.equal(shouldReveal({ ...base, curtain: 0.9 }), false);
  assert.equal(shouldReveal({ ...base, curtain: 0.999 }), false);
  assert.equal(shouldReveal({ ...base, curtain: 0 }), false);
});

test('shouldReveal: fuera de la ventana no se revela', () => {
  assert.equal(shouldReveal({ ...base, top: -200, bottom: 0 }), false); // ya salió por arriba
  assert.equal(shouldReveal({ ...base, top: -200, bottom: 1 }), true); // 1 px dentro
  assert.equal(shouldReveal({ ...base, top: 900, bottom: 1000, atEnd: true }), false); // por abajo
});

test('shouldReveal: al final de página basta con estar dentro de la ventana (RF-11)', () => {
  assert.equal(shouldReveal({ ...base, top: 850, bottom: 950, atEnd: true }), true);
  assert.equal(shouldReveal({ ...base, top: 899, bottom: 999, atEnd: true }), true);
  assert.equal(shouldReveal({ ...base, top: 850, bottom: 950, atEnd: true, curtain: 0.5 }), false);
});

test('shouldReveal: sin fuentes listas (ready = false) no se revela', () => {
  assert.equal(shouldReveal({ ...base, ready: false }), false);
  assert.equal(shouldReveal({ ...base, ready: false, atEnd: true }), false);
});

test('groupLines: sin palabras no hay líneas', () => {
  assert.deepEqual(groupLines([]), []);
});

test('groupLines: una sola línea es un único grupo', () => {
  assert.deepEqual(groupLines([100, 100, 100]), [[0, 1, 2]]);
});

test('groupLines: varias líneas en orden, con un salto forzado (<br>) que corta línea', () => {
  // «Conceptos que | <br> | rompen el molde»: el <br> se traduce en un top distinto.
  assert.deepEqual(groupLines([100, 100, 160, 160, 160]), [
    [0, 1],
    [2, 3, 4],
  ]);
  assert.deepEqual(groupLines([10, 70, 130]), [[0], [1], [2]]);
});

test('groupLines: tolera diferencias de hasta 1 px dentro de la misma línea', () => {
  assert.deepEqual(groupLines([100, 100.6, 99.2, 101]), [[0, 1, 2, 3]]);
  assert.deepEqual(groupLines([100, 101.5]), [[0], [1]]);
  assert.deepEqual(groupLines([100, 102], 6, 3), [[0, 1]]);
});

test('groupLines: de la 6.ª línea en adelante se funden en el mismo grupo', () => {
  const tops = [0, 0, 50, 100, 150, 200, 250, 250, 300, 350];
  assert.deepEqual(groupLines(tops), [[0, 1], [2], [3], [4], [5], [6, 7, 8, 9]]);
  assert.equal(groupLines([0, 50, 100, 150, 200, 250]).length, 6);
  assert.deepEqual(groupLines([0, 50, 100], 2), [[0], [1, 2]]);
});

/* RF-14 cuenta 900 ms desde que se cumple la condición; el revelado arranca unos fotogramas después del
   scroll (8–64 ms medidos, más con la máquina cargada). Total planificado ≤ 780 ms: 120 ms para el arranque. */
const DESKTOP_TOTAL = 780;

test('revealTiming: escritorio, de 1 a 10 líneas, escalonado 80–120 ms y total ≤ 780 ms (120 ms para el arranque)', () => {
  for (let lines = 1; lines <= 10; lines += 1) {
    const { duration, stagger } = revealTiming(lines, false);
    const masks = Math.min(lines, 6);
    const total = duration + (masks - 1) * stagger;
    assert.ok(stagger >= 80 && stagger <= 120, `${lines} líneas: escalonado ${stagger}`);
    assert.ok(duration > 0, `${lines} líneas: duración ${duration}`);
    assert.ok(total <= DESKTOP_TOTAL, `${lines} líneas: total ${total}`);
  }
});

test('revealTiming: valores del plan (700 ms por línea como máximo, 80 ms de escalonado, 780 ms con 2 o más)', () => {
  assert.deepEqual(revealTiming(1, false), { duration: 700, stagger: 80 });
  assert.deepEqual(revealTiming(2, false), { duration: 700, stagger: 80 });
  assert.deepEqual(revealTiming(3, false), { duration: 620, stagger: 80 });
  assert.deepEqual(revealTiming(4, false), { duration: 540, stagger: 80 });
  assert.deepEqual(revealTiming(6, false), { duration: 380, stagger: 80 });
  assert.deepEqual(revealTiming(10, false), revealTiming(6, false));
  assert.deepEqual(revealTiming(0, false), revealTiming(1, false));
});

test('revealTiming: móvil, un bloque sin escalonado en ≤ 480 ms con cualquier nº de líneas (120 ms para el arranque)', () => {
  for (let lines = 1; lines <= 10; lines += 1) {
    const { duration, stagger } = revealTiming(lines, true);
    assert.equal(stagger, 0);
    assert.ok(duration > 0 && duration <= 480, `${lines} líneas: duración ${duration}`);
  }
});
