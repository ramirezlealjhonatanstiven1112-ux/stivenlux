import { test, expect } from '@playwright/test';
import { parseTranslate } from '../../src/lib/pointer.js';
import { animationsDone, frame, scrollToCurtain, scrollToY } from './support/motion.js';
import { noFollow, openFx, recordFrames, trackMoves, untilFrame } from './support/pointer.js';

// Spec 002 · botones magnéticos (RF-7, RF-8, RF-9) y su convivencia con la spec 001 (001/RF-5, 001/RF-9).
// Escritorio con ratón.

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'escritorio', 'El imán solo existe con puntero fino (escritorio)');
  void page;
});

const HERO = '.hero [data-magnet]';
const CONTACT = '.contact [data-magnet]';
const SETTLE = 260; // > transición del imán (160 ms)

/* Desplazamiento actual del botón (valor animado de translate) y su área de reposo (caja − translate). */
async function magnetOf(page, sel) {
  const { t, r } = await page.locator(sel).evaluate((el) => {
    const b = el.getBoundingClientRect();
    return { t: window.getComputedStyle(el).translate, r: { left: b.left, top: b.top, right: b.right, bottom: b.bottom } };
  });
  const o = parseTranslate(t);
  return { o, rest: { left: r.left - o.x, top: r.top - o.y, right: r.right - o.x, bottom: r.bottom - o.y } };
}

const len = ({ x, y }) => Math.hypot(x, y);

/* Lleva el botón a la vista y devuelve su área de reposo con el puntero lejos. */
async function restOf(page, sel) {
  await page.locator(sel).evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.mouse.move(5, 5);
  await page.waitForTimeout(SETTLE);
  const { o, rest } = await magnetOf(page, sel);
  expect(len(o), 'en reposo').toBeLessThanOrEqual(0.05);
  return rest;
}

async function offsetAt(page, sel, x, y) {
  await page.mouse.move(x, y, { steps: 2 });
  await page.waitForTimeout(SETTLE);
  return (await magnetOf(page, sel)).o;
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }]) {
  test.describe(`${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport });

    test('RF-7 · perfil medido: 0 a ≥ 24 px, creciente hasta el borde (≥ 3), 0 en el centro, ≤ 8, hacia el puntero', async ({ page }) => {
      test.setTimeout(240_000); // ~200 posiciones medidas tras asentarse
      const errors = await openFx(page);
      for (const sel of [HERO, CONTACT]) {
        const b = await restOf(page, sel);
        const cx = (b.left + b.right) / 2;
        const cy = (b.top + b.bottom) / 2;
        const dirs = [
          [b.right, cy, 1, 0],
          [b.left, cy, -1, 0],
          [cx, b.top, 0, -1],
          [cx, b.bottom, 0, 1],
          [b.right, b.top, Math.SQRT1_2, -Math.SQRT1_2],
          [b.left, b.bottom, -Math.SQRT1_2, Math.SQRT1_2],
        ];
        for (const [ex, ey, ux, uy] of dirs) {
          let prev = -1;
          for (const d of [40, 32, 28, 24, 20, 16, 12, 8, 4, 0]) {
            const x = ex + ux * d;
            const y = ey + uy * d;
            const o = await offsetAt(page, sel, x, y);
            const m = len(o);
            const label = `${sel} a ${d} px (${ux.toFixed(1)}, ${uy.toFixed(1)})`;
            expect(m, `${label}: ≤ 8`).toBeLessThanOrEqual(8.05);
            if (d >= 24) expect(m, `${label}: 0`).toBeLessThanOrEqual(0.05);
            else expect(m, `${label}: creciente`).toBeGreaterThan(prev);
            if (m > 0.05) expect(o.x * (x - cx) + o.y * (y - cy), `${label}: hacia el puntero`).toBeGreaterThan(0);
            prev = m;
          }
          expect(prev, `${sel}: ≥ 3 px en el borde`).toBeGreaterThanOrEqual(3);
          // Por dentro, hacia el centro: decreciente hasta 0
          for (const t of [0.25, 0.5, 0.75]) {
            const m = len(await offsetAt(page, sel, ex + (cx - ex) * t, ey + (cy - ey) * t));
            expect(m, `${sel}: decreciente hacia el centro (${t})`).toBeLessThan(prev);
            prev = m;
          }
          expect(len(await offsetAt(page, sel, cx, cy)), `${sel}: 0 en el centro`).toBeLessThanOrEqual(0.1);
          // Entre 24 y 32 px tras haber estado dentro (efecto activo): 0
          expect(len(await offsetAt(page, sel, ex + ux * 28, ey + uy * 28)), `${sel}: 0 a 28 px tras estar dentro`).toBeLessThanOrEqual(0.05);
        }

        // Barrido de 1 px a través del borde derecho: sin saltos de más de 0,5 px
        await page.mouse.move(b.right + 30, cy);
        await page.waitForTimeout(SETTLE);
        let last = 0;
        for (let x = b.right + 26; x >= b.right - 6; x -= 1) {
          const m = len(await offsetAt(page, sel, x, cy));
          expect(Math.abs(m - last), `${sel}: sin saltos en x = ${x - b.right}`).toBeLessThanOrEqual(0.5);
          last = m;
        }
      }
      expect(errors).toEqual([]);
    });
  });
}

test('RF-7 · sin sobrepasar el destino, quieto en ≤ 300 ms y recalculado con el scroll en ≤ 200 ms', async ({ page }) => {
  await openFx(page);
  const b = await restOf(page, CONTACT);
  const cy = (b.top + b.bottom) / 2;
  const read = `const t = window.getComputedStyle(document.querySelector('${CONTACT}')).translate;
    const [x = 0, y = 0] = t === 'none' ? [] : t.split(' ').map(parseFloat); return { x, y, t: window.performance.now() };`;
  for (const [x, y] of [[b.right, cy], [b.left - 4, b.top - 4], [b.right + 10, b.bottom]]) {
    await page.mouse.move(5, 5);
    await page.waitForTimeout(SETTLE);
    const frames = recordFrames(page, read, null, 500);
    await page.mouse.move(x, y);
    const list = await frames;
    const end = list.at(-1);
    for (const axis of ['x', 'y']) {
      const sign = Math.sign(end[axis]);
      for (let i = 1; i < list.length; i += 1) {
        const step = list[i][axis] - list[i - 1][axis];
        expect(step * sign, `eje ${axis}: monótono hacia el destino`).toBeGreaterThanOrEqual(-0.01);
        expect(Math.abs(list[i][axis]), `eje ${axis}: no sobrepasa`).toBeLessThanOrEqual(Math.abs(end[axis]) + 0.01);
      }
    }
    // Quieto en ≤ 300 ms desde que empieza a moverse
    const start = list.findIndex((f) => f.x !== 0 || f.y !== 0);
    const stop = list.findLastIndex((f, i) => i > 0 && (f.x !== list[i - 1].x || f.y !== list[i - 1].y));
    expect(list[stop].t - list[start].t, 'quieto en ≤ 300 ms').toBeLessThanOrEqual(300);
  }

  // Scroll con el puntero quieto a 10 px del borde derecho: el destino cambia (a 0 al alejarse) en ≤ 200 ms
  await page.mouse.move(b.right + 10, cy);
  await page.waitForTimeout(SETTLE);
  expect(len((await magnetOf(page, CONTACT)).o)).toBeGreaterThan(1);
  await page.evaluate(() => {
    window.__t0 = window.performance.now();
    window.scrollBy({ top: 60, behavior: 'instant' });
  });
  const written = await untilFrame(page, `return document.querySelector('${CONTACT}').style.getPropertyValue('--mgx') === '0.00px';`);
  expect(written + 160, 'nuevo destino con el scroll').toBeLessThanOrEqual(200);
});

test('RF-7, RF-9 · sin imán durante la entrada de los CTA ni durante la transición del menú', async ({ page }) => {
  await page.goto('/');
  await trackMoves(page);
  await page.waitForFunction(() => document.documentElement.classList.contains('is-ready'));
  // Fundido en pausa mientras se comprueba (se espera a que exista); después se termina (finish dispara
  // animationend). La lógica que se prueba solo mira si la animación ha terminado
  await page.waitForFunction(() => {
    const list = document.querySelector('.hero__actions').getAnimations();
    list.forEach((a) => a.pause());
    return list.length > 0;
  });
  const b = await page.locator(HERO).boundingBox();
  const edge = { x: b.x + b.width, y: b.y + b.height / 2 };
  await page.mouse.move(edge.x + 2, edge.y);
  await page.mouse.move(edge.x, edge.y);
  await page.waitForTimeout(SETTLE);
  expect(await page.evaluate(() => document.querySelector('.hero__actions').getAnimations().some((a) => a.playState !== 'finished'))).toBe(true);
  expect(len((await magnetOf(page, HERO)).o), 'sin imán durante la entrada').toBeLessThanOrEqual(0.05);
  await page.evaluate(() => document.querySelector('.hero__actions').getAnimations().forEach((a) => a.finish()));
  await page.waitForTimeout(SETTLE);
  expect(len((await magnetOf(page, HERO)).o), 'imán tras la entrada').toBeGreaterThanOrEqual(3);

  // Menú: abierto con el teclado (el puntero sigue en el borde del botón)
  await page.locator('[data-menu-toggle]').focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(SETTLE + 40);
  expect(len((await magnetOf(page, HERO)).o), 'reposo con el menú abierto').toBeLessThanOrEqual(0.05);
  await animationsDone(page);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(120);
  expect(len((await magnetOf(page, HERO)).o), 'sin imán mientras se cierra').toBeLessThanOrEqual(0.05);
  await animationsDone(page, '[data-menu]');
  await page.mouse.move(edge.x - 1, edge.y);
  await page.mouse.move(edge.x, edge.y);
  await page.waitForTimeout(SETTLE);
  expect(len((await magnetOf(page, HERO)).o), 'vuelve tras la transición').toBeGreaterThanOrEqual(3);
});

test('RF-9 · nada más se mueve y el clic en el área de reposo siempre activa el botón', async ({ page }) => {
  await openFx(page);
  await noFollow(page);
  await page.evaluate(() => {
    window.__clicks = 0;
    window.addEventListener('click', (e) => e.target.closest('[data-magnet]') && (window.__clicks += 1), true);
  });
  const others = ['.nav__cta', '[data-menu-toggle]', '.hero .link'];
  const boxes = async () => Promise.all(others.map((s) => page.locator(s).boundingBox()));
  const b = await restOf(page, HERO);
  const before = await boxes();
  await page.mouse.move(b.right, (b.top + b.bottom) / 2);
  await page.waitForTimeout(SETTLE);
  expect(len((await magnetOf(page, HERO)).o)).toBeGreaterThanOrEqual(3);
  const after = await boxes();
  for (let i = 0; i < others.length; i += 1) {
    for (const k of ['x', 'y', 'width', 'height']) expect(Math.abs(after[i][k] - before[i][k]), `${others[i]} quieto`).toBeLessThanOrEqual(0.5);
  }
  // Con el imán de Contacto activo, el texto que lo rodea (.contact__hint) tampoco se mueve
  const cb = await restOf(page, CONTACT);
  const hintBefore = await page.locator('.contact__hint').boundingBox();
  await page.mouse.move(cb.right, (cb.top + cb.bottom) / 2);
  await page.waitForTimeout(SETTLE);
  expect(len((await magnetOf(page, CONTACT)).o)).toBeGreaterThanOrEqual(3);
  const hintAfter = await page.locator('.contact__hint').boundingBox();
  for (const k of ['x', 'y', 'width', 'height']) expect(Math.abs(hintAfter[k] - hintBefore[k]), '.contact__hint quieto').toBeLessThanOrEqual(0.5);
  await restOf(page, HERO);

  const cy = (b.top + b.bottom) / 2;
  const cx = (b.left + b.right) / 2;
  const points = [
    [b.left + 1, b.top + 1],
    [b.right - 1, b.top + 1],
    [b.left + 1, b.bottom - 1],
    [b.right - 1, b.bottom - 1],
    [b.left + 1, cy],
    [b.right - 1, cy],
    [cx, b.top + 1],
    [cx, b.bottom - 1],
    [cx, cy],
  ];
  let expected = 0;
  for (const [x, y] of points) {
    await page.mouse.move(x, y, { steps: 2 });
    await page.mouse.click(x, y);
    expected += 1;
    expect(await page.evaluate(() => window.__clicks), `clic en (${Math.round(x - b.left)}, ${Math.round(y - b.top)})`).toBe(expected);
  }
  // Tras barridos rápidos de borde a borde, clic a < 50 ms en el borde de partida
  for (let i = 0; i < 4; i += 1) {
    await page.mouse.move(b.left + 1, cy);
    await page.mouse.move(b.right - 1, cy);
    await page.mouse.move(b.left + 1, cy);
    await page.mouse.click(b.left + 1, cy);
    expected += 1;
  }
  // Con la pulsación: bajar, mover 3 px y soltar
  await page.mouse.move(b.right - 2, b.bottom - 2);
  await page.mouse.down();
  await page.mouse.move(b.right - 5, b.bottom - 2);
  await page.mouse.up();
  expected += 1;
  expect(await page.evaluate(() => window.__clicks)).toBe(expected);
});

test('RF-9 · vuelve al reposo en ≤ 300 ms con el foco, al salir de la ventana y al perder el foco la ventana', async ({ page }) => {
  await openFx(page);
  const b = await restOf(page, HERO);
  const edge = { x: b.right, y: (b.top + b.bottom) / 2 };
  // Se mide el fotograma en que el sistema escribe el destino 0 más la transición declarada (160 ms): cerca
  // del hero, el pintado headless de la escena inclinada pierde fotogramas que no dependen del imán
  const written = `const s = document.querySelector('${HERO}').style; return s.getPropertyValue('--mgx') === '0.00px' && s.getPropertyValue('--mgy') === '0.00px';`;
  const visual = `const t = window.getComputedStyle(document.querySelector('${HERO}')).translate; return t === 'none' || t.split(' ').every((v) => Math.abs(parseFloat(v)) < 0.05);`;
  const toRest = async (label) => {
    expect((await untilFrame(page, written)) + 160, label).toBeLessThanOrEqual(300);
    expect(await untilFrame(page, visual, null, 1500), `${label}: reposo visual`).toBeLessThan(Infinity);
  };
  const engage = async () => {
    await page.mouse.move(edge.x + 1, edge.y);
    await page.mouse.move(edge.x, edge.y);
    await page.waitForTimeout(SETTLE);
    expect(len((await magnetOf(page, HERO)).o)).toBeGreaterThanOrEqual(3);
  };

  await engage();
  await page.locator(HERO).evaluate((el) => el.blur());
  // Foco con el teclado (:focus-visible): se tabula desde el elemento anterior
  await page.locator('[data-menu-toggle]').focus();
  await page.evaluate(() => document.addEventListener('focusin', () => (window.__t0 = window.performance.now()), { once: true }));
  await page.keyboard.press('Tab');
  await expect(page.locator(HERO)).toBeFocused();
  await toRest('foco');
  await page.locator(HERO).evaluate((el) => el.blur());

  await engage();
  await page.evaluate(() => {
    window.__t0 = window.performance.now();
    document.dispatchEvent(new window.MouseEvent('mouseout', { bubbles: true, relatedTarget: null }));
  });
  await toRest('salida de la ventana');

  await engage();
  await page.evaluate(() => {
    window.__t0 = window.performance.now();
    window.dispatchEvent(new window.Event('blur'));
  });
  await toRest('blur');
  await page.waitForTimeout(200);
  expect(len((await magnetOf(page, HERO)).o), 'sigue en reposo hasta mover').toBeLessThanOrEqual(0.05);
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 1366, height: 600 }]) test.describe(`${viewport.width}×${viewport.height}`, () => {
test.use({ viewport });
test('RF-19 · 001/RF-5 y 001/RF-9 con el imán forzado a ±8 px', async ({ page }) => {
  await openFx(page);
  await noFollow(page);
  await page.evaluate(() => {
    window.__clicks = 0;
    window.addEventListener('click', (e) => e.target.closest('[data-magnet]') && (window.__clicks += 1), true);
  });
  // Se fuerza después de cada scroll (el último evento que despierta el fotograma) y se comprueba que el botón
  // está de verdad desplazado antes de medir: si no, el test no mediría lo que dice
  const force = async (sel, x, y) => {
    await page.locator(sel).evaluate(
      (el, [mx, my]) => {
        el.style.transition = 'none';
        el.style.setProperty('--mgx', `${mx}px`);
        el.style.setProperty('--mgy', `${my}px`);
      },
      [x, y],
    );
    expect(await page.locator(sel).evaluate((el) => window.getComputedStyle(el).translate), `${sel} desplazado`).toBe(`${x}px ${y}px`);
  };
  let clicks = 0;
  for (const [x, y] of [[8, 8], [-8, -8], [8, -8], [-8, 8]]) {
    // 001/RF-5, con la salida del hero en 0 y empezada: el centro del CTA es el propio CTA (por encima de la
    // escena) y el clic llega
    for (const top of [0, 120]) {
      await scrollToY(page, top);
      await force(HERO, x, y);
      const { rest } = await magnetOf(page, HERO);
      const c = { x: (rest.left + rest.right) / 2, y: (rest.top + rest.bottom) / 2 };
      expect(await page.evaluate(({ px, py, s }) => document.querySelector(s).contains(document.elementFromPoint(px, py)), { px: c.x, py: c.y, s: HERO }), `CTA del hero en su centro (scroll ${top})`).toBe(true);
      await page.evaluate(({ px, py }) => document.elementFromPoint(px, py).click(), { px: c.x, py: c.y });
      clicks += 1;
      expect(await page.evaluate(() => window.__clicks)).toBe(clicks);
    }

    // 001/RF-9: el botón de Contacto desplazado sigue dentro del plano descubierto por la cortina
    for (const target of [0, 0.5, 1]) {
      const reached = await scrollToCurtain(page, 'contacto', target);
      if (reached === null) continue;
      await force(CONTACT, x, y);
      const f = await frame(page, 'contacto');
      const plane = { top: f.rect.top + f.ft, right: f.rect.right - f.fr, bottom: f.rect.bottom - f.fb, left: f.rect.left + f.fl };
      const r = await page.locator(CONTACT).boundingBox();
      const label = `Contacto a c = ${target} con (${x}, ${y})`;
      expect(r.y, `${label}: arriba`).toBeGreaterThanOrEqual(plane.top - 1);
      expect(r.x, `${label}: izquierda`).toBeGreaterThanOrEqual(plane.left - 1);
      expect(r.x + r.width, `${label}: derecha`).toBeLessThanOrEqual(plane.right + 1);
      expect(r.y + r.height, `${label}: abajo`).toBeLessThanOrEqual(plane.bottom + 1);
    }
  }
});
});
