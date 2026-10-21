import { test, expect } from '@playwright/test';
import { open, animationsDone, heroEntranceDone, scrollToHeroProgress, heroLayers } from './support/motion.js';

// Salida del hero ligada al scroll. Cada test indica el RF de specs/001-hero-y-transiciones/spec.md.
// Las ventanas con tamaño se prueban desde el proyecto `escritorio`; «móvil» es la ventana del
// proyecto `movil` (Pixel 7 de Playwright: 412×839). Las medidas leen innerWidth/innerHeight.

const WINDOWS = [
  { name: '1440×900', size: { width: 1440, height: 900 } },
  { name: '1366×600', size: { width: 1366, height: 600 } },
  { name: '844×390', size: { width: 844, height: 390 } },
  { name: '667×375', size: { width: 667, height: 375 } },
  { name: 'móvil', size: null },
];

const only = (names) => WINDOWS.filter((w) => names.includes(w.name));

/* Cada ventana se prueba en un único proyecto: las de tamaño fijo en escritorio, «móvil» en movil. */
async function setup(page, testInfo, { size }) {
  if (size) {
    test.skip(testInfo.project.name !== 'escritorio', 'Ventana con tamaño fijo: se prueba en escritorio');
    await page.setViewportSize(size);
  } else {
    test.skip(testInfo.project.name !== 'movil', 'Ventana del proyecto móvil');
  }
  const errors = await open(page);
  await heroEntranceDone(page);
  return errors;
}

/* Rangos de la spec (RF-2 y RF-3) para la ventana actual. */
function expectedFor(width, height) {
  const low = height < 500;
  if (width >= 768) {
    return {
      count: 3,
      maxShift: 0.3,
      scales: low
        ? { back: [0.91, 0.95], mid: [0.96, 1.01], front: [1.04, 1.075] }
        : { back: [0.82, 0.9], mid: [0.92, 1.02], front: [1.08, 1.15] },
    };
  }
  return {
    count: 2,
    maxShift: 0.15,
    scales: low ? { back: [0.965, 0.98], front: [1.015, 1.035] } : { back: [0.93, 0.96], front: [1.03, 1.07] },
  };
}

const shift = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function pairDistances(layers) {
  const names = Object.keys(layers);
  const out = {};
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) out[`${names[i]}-${names[j]}`] = shift(layers[names[i]], layers[names[j]]);
  }
  return out;
}

/* Valor con progreso 0,5 frente al de progreso 1: entre el 35 % y el 65 % (o 0 si el de 1 es 0). */
function expectHalf(half, full, label) {
  if (full < 1e-3) {
    expect(half, label).toBeLessThan(1e-3);
    return;
  }
  expect(half / full, label).toBeGreaterThanOrEqual(0.35);
  expect(half / full, label).toBeLessThanOrEqual(0.65);
}

for (const win of only(['1440×900', 'móvil'])) {
  test(`RF-1 y RF-4 · ${win.name} · con progreso 0 la composición es la de reposo, también al volver arriba`, async ({ page }, testInfo) => {
    await setup(page, testInfo, win);
    await scrollToHeroProgress(page, 0);
    const start = await heroLayers(page);

    // Referencia: la misma composición sin ninguna transformación de salida
    const style = await page.addStyleTag({ content: '.hero__layer { transform: none !important; }' });
    const rest = await heroLayers(page);
    await style.evaluate((el) => el.remove());

    for (const name of Object.keys(rest)) {
      expect(Math.abs(start[name].x - rest[name].x), `${name} x`).toBeLessThanOrEqual(1);
      expect(Math.abs(start[name].y - rest[name].y), `${name} y`).toBeLessThanOrEqual(1);
      expect(start[name].scale, `${name} escala`).toBeCloseTo(1, 3);
    }

    await scrollToHeroProgress(page, 1);
    await scrollToHeroProgress(page, 0);
    const back = await heroLayers(page);
    for (const name of Object.keys(rest)) {
      expect(shift(back[name], rest[name]), `${name} al volver arriba`).toBeLessThanOrEqual(1);
      expect(back[name].scale, `${name} escala al volver arriba`).toBeCloseTo(1, 3);
    }
  });
}

for (const win of WINDOWS) {
  test(`RF-2 y RF-3 · ${win.name} · los dispositivos se separan en profundidad dentro de los rangos`, async ({ page }, testInfo) => {
    const errors = await setup(page, testInfo, win);
    const { width, height } = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
    const exp = expectedFor(width, height);

    const at = {};
    for (const p of [0, 0.5, 1]) {
      await scrollToHeroProgress(page, p);
      at[p] = await heroLayers(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `desbordamiento horizontal con p = ${p}`).toBe(0);
    }

    expect(Object.keys(at[1]).sort()).toEqual(Object.keys(exp.scales).sort());
    expect(Object.keys(at[1])).toHaveLength(exp.count);

    for (const [name, [min, max]] of Object.entries(exp.scales)) {
      const s1 = at[1][name].scale;
      expect(s1, `escala de ${name} con p = 1`).toBeGreaterThanOrEqual(min);
      expect(s1, `escala de ${name} con p = 1`).toBeLessThanOrEqual(max);

      const d1 = shift(at[1][name], at[0][name]);
      expect(d1, `desplazamiento de ${name} con p = 1 (px)`).toBeLessThanOrEqual(exp.maxShift * height);

      expectHalf(Math.abs(1 - at[0.5][name].scale), Math.abs(1 - s1), `variación de escala de ${name} con p = 0,5`);
      expectHalf(shift(at[0.5][name], at[0][name]), d1, `desplazamiento de ${name} con p = 0,5`);
    }

    // Separación en profundidad: crece la distancia entre los centros de cada par
    const d0 = pairDistances(at[0]);
    const dHalf = pairDistances(at[0.5]);
    const dFull = pairDistances(at[1]);
    for (const pair of Object.keys(d0)) {
      expect(dHalf[pair], `distancia ${pair} con p = 0,5`).toBeGreaterThan(d0[pair]);
      expect(dFull[pair], `distancia ${pair} con p = 1`).toBeGreaterThan(dHalf[pair]);
    }

    expect(errors).toEqual([]);
  });
}

for (const win of only(['1440×900'])) {
  test(`RF-4 · ${win.name} · la misma posición da el mismo estado al bajar y al subir`, async ({ page }, testInfo) => {
    await setup(page, testInfo, win);
    await scrollToHeroProgress(page, 0.3);
    const down = await heroLayers(page);
    await scrollToHeroProgress(page, 1);
    await scrollToHeroProgress(page, 0.3);
    const up = await heroLayers(page);
    for (const name of Object.keys(down)) {
      expect(shift(up[name], down[name]), name).toBeLessThanOrEqual(0.5);
      expect(up[name].scale, name).toBeCloseTo(down[name].scale, 4);
    }
  });
}

for (const win of only(['1440×900', '1366×600', '844×390', 'móvil'])) {
  test(`RF-5 · ${win.name} · titular, entradilla y CTA quedan por encima de los dispositivos y el CTA se pulsa`, async ({ page }, testInfo) => {
    await setup(page, testInfo, win);
    const selectors = ['.hero__title', '.hero__lead', '.hero__actions .btn', '.hero__actions .link'];

    // Centro de cada elemento si está dentro de la ventana y por debajo de la barra
    const probe = () =>
      page.evaluate((sels) => {
        const navBottom = document.querySelector('.nav__bar').getBoundingClientRect().bottom;
        return sels.map((sel) => {
          const el = document.querySelector(sel);
          const r = el.getBoundingClientRect();
          const x = r.left + r.width / 2;
          const y = r.top + r.height / 2;
          const inside = y > navBottom && y < window.innerHeight && x > 0 && x < window.innerWidth;
          const hit = inside ? document.elementFromPoint(x, y) : null;
          return { sel, x, y, inside, onTop: Boolean(hit && el.contains(hit)) };
        });
      }, selectors);

    let clickAt = null;
    for (const p of [0, 0.5, 1]) {
      await scrollToHeroProgress(page, p);
      const points = await probe();
      if (p === 0) expect(points[0].inside, 'titular a la vista con p = 0').toBe(true);
      for (const pt of points.filter((q) => q.inside)) expect(pt.onTop, `${pt.sel} con p = ${p}`).toBe(true);
      if (points[2].inside) clickAt = p;
    }

    // Se pulsa el CTA principal con el mayor progreso en que está a la vista
    expect(clickAt, 'el CTA principal está a la vista con algún progreso').not.toBeNull();
    await scrollToHeroProgress(page, clickAt);
    const [cta] = (await probe()).slice(2, 3);
    await page.mouse.click(cta.x, cta.y);
    await expect(page).toHaveURL(/#contacto$/);
  });
}

for (const win of only(['1440×900'])) {
  test(`RF-2 · ${win.name} · con el video del hero no hay separación de dispositivos`, async ({ page }, testInfo) => {
    await setup(page, testInfo, win);
    await page.evaluate(() => document.querySelector('.hero').classList.add('is-video'));
    for (const p of [0.5, 1]) {
      await scrollToHeroProgress(page, p);
      const layers = await heroLayers(page);
      for (const [name, layer] of Object.entries(layers)) expect(layer.transform, `${name} con p = ${p}`).toBe('none');
    }
  });
}

/* Inclinación del escenario: mayor diferencia entre su matriz y la neutra (solo la perspectiva).
   Devuelve también si quedan --mx/--my en línea. */
const stageTilt = (page) =>
  page.evaluate(() => {
    const stage = document.querySelector('[data-hero-stage]');
    const m = new window.DOMMatrix(window.getComputedStyle(stage).transform);
    const neutral = new window.DOMMatrix('perspective(2400px)');
    const a = m.toFloat64Array();
    const b = neutral.toFloat64Array();
    return {
      tilt: Math.max(...a.map((v, i) => Math.abs(v - b[i]))),
      inline: stage.style.getPropertyValue('--mx') + stage.style.getPropertyValue('--my'),
    };
  });

const NEUTRAL = 1e-4;
const TILTED = 0.01;

for (const win of only(['1440×900'])) {
  test(`RF-6 · ${win.name} · la inclinación con el puntero y la salida nunca se combinan`, async ({ page }, testInfo) => {
    await setup(page, testInfo, win);
    expect(await page.evaluate(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches)).toBe(true);

    // Con progreso 0 el ratón inclina la escena
    await scrollToHeroProgress(page, 0);
    await page.mouse.move(720, 450);
    await page.mouse.move(150, 150, { steps: 5 });
    await expect.poll(async () => (await stageTilt(page)).tilt).toBeGreaterThan(TILTED);
    await animationsDone(page, '[data-hero-stage]');
    expect((await stageTilt(page)).tilt, 'inclinación de partida').toBeGreaterThan(0.03);

    // Al pasar de 0, vuelve a neutro en ≤ 600 ms desde el desplazamiento
    const elapsed = await page.evaluate(async (top) => {
      const stage = document.querySelector('[data-hero-stage]');
      const b = new window.DOMMatrix('perspective(2400px)').toFloat64Array();
      const tilt = () => {
        const a = new window.DOMMatrix(window.getComputedStyle(stage).transform).toFloat64Array();
        return Math.max(...a.map((v, i) => Math.abs(v - b[i])));
      };
      const t0 = window.performance.now();
      window.scrollTo({ top, behavior: 'instant' });
      while (tilt() >= 1e-4 && window.performance.now() - t0 < 2000) await new Promise((r) => requestAnimationFrame(r));
      return window.performance.now() - t0;
    }, Math.round(0.3 * 900));
    expect(elapsed, 'ms hasta la inclinación neutra').toBeLessThanOrEqual(600);
    expect(await page.evaluate(() => document.querySelector('.hero').classList.contains('is-leaving'))).toBe(true);

    // Con progreso > 0 el puntero no la inclina
    await page.mouse.move(1300, 800, { steps: 8 });
    await page.mouse.move(200, 600, { steps: 8 });
    await page.waitForTimeout(400);
    let state = await stageTilt(page);
    expect(state.tilt, 'inclinación al mover con p > 0').toBeLessThan(NEUTRAL);
    expect(state.inline, '--mx/--my con p > 0').toBe('');

    // Al volver a 0 sigue neutra hasta el siguiente movimiento
    await scrollToHeroProgress(page, 0);
    expect(await page.evaluate(() => document.querySelector('.hero').classList.contains('is-leaving'))).toBe(false);
    await page.waitForTimeout(400);
    state = await stageTilt(page);
    expect(state.tilt, 'inclinación al volver a 0 sin mover').toBeLessThan(NEUTRAL);
    expect(state.inline, '--mx/--my al volver a 0 sin mover').toBe('');

    // Tras mover el puntero, vuelve a inclinarse
    await page.mouse.move(1300, 150, { steps: 5 });
    await expect.poll(async () => (await stageTilt(page)).tilt).toBeGreaterThan(TILTED);
  });
}
