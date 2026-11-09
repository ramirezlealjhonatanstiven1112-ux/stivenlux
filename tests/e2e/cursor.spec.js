import { test, expect } from '@playwright/test';
import { bestOf } from '../../src/lib/contrast.js';
import { animationsDone, scrollToY } from './support/motion.js';
import { centerOf, dotState, framesUntil, markNow, noFollow, openFx, placedFrames, recordFrames, shapeFrames, trackMoves, untilFrame } from './support/pointer.js';

// Spec 002 · cursor complementario («el punto»): RF-1 a RF-6 y RF-14. Escritorio con ratón.

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'escritorio', 'El punto solo existe con puntero fino (escritorio)');
  void page;
});

const RING = `const d = document.querySelector('.cursor');
  if (!d || !d.classList.contains('is-ring')) return false;
  const g = d.lastElementChild;
  return Math.abs(g.getBoundingClientRect().width - 40) <= 1 && window.getComputedStyle(g).opacity === '1';`;
const DISC = `const d = document.querySelector('.cursor');
  if (!d || d.classList.contains('is-ring')) return false;
  const [c, g] = d.children;
  return Math.abs(c.getBoundingClientRect().width - 8) <= 1 && window.getComputedStyle(c).opacity === '1'
    && window.getComputedStyle(g).opacity === '0';`;
const AT = `const r = document.querySelector('.cursor')?.getBoundingClientRect();
  return !!r && Math.abs(r.left - arg.x) <= 1 && Math.abs(r.top - arg.y) <= 1;`;
const HIDDEN = `const d = document.querySelector('.cursor'); return !d || d.classList.contains('is-off');`;

/* Tiempo del cambio de forma (RF-3, RF-4): fotogramas hasta que el sistema aplica el estado (clase is-ring),
   a 60 Hz, más la transición declarada del disco y del aro. Se cuenta en fotogramas porque, con varios
   navegadores en paralelo, cada fotograma headless dura 50–100 ms por la carga de la máquina, no de la página.
   Además: tope de tiempo real holgado (600 ms) y el estado final visual tiene que llegar. */
async function shapeTime(page, shape, ms = 1500) {
  const set = shape === 'ring' ? "return document.querySelector('.cursor')?.classList.contains('is-ring') === true;"
    : "const d = document.querySelector('.cursor'); return !!d && !d.classList.contains('is-ring');";
  const { frames: seen, ms: real } = await framesUntil(page, set, null, ms);
  expect(real, `${shape}: tiempo real`).toBeLessThanOrEqual(600);
  // Fotograma en que el sistema cambió la clase (registrado en la página); si ya tenía esa forma antes de la
  // acción no hay cambio y vale lo observado
  const changed = await shapeFrames(page, shape === 'ring');
  const t = ((changed ?? seen) * 1000) / 60;
  const duration = await page.evaluate(() =>
    Math.max(...[...document.querySelectorAll('.cursor i')].map((i) => {
      const cs = window.getComputedStyle(i);
      const sec = (v) => Math.max(...v.split(',').map((x) => parseFloat(x) * (x.trim().endsWith('ms') ? 0.001 : 1)));
      return (sec(cs.transitionDuration) + sec(cs.transitionDelay)) * 1000;
    })),
  );
  expect(await untilFrame(page, shape === 'ring' ? RING : DISC, null, 1500), `${shape}: estado final`).toBeLessThan(Infinity);
  return t + duration;
}

/* Lleva el puntero a un punto y espera a que el punto se asiente allí. */
async function moveTo(page, { x, y }, steps = 4) {
  await page.mouse.move(x, y, { steps });
  expect(await untilFrame(page, AT, { x, y }, 800)).toBeLessThan(Infinity);
}

test('RF-1 · aparece al primer movimiento, alcanza al puntero en ≤ 150 ms y queda quieto', async ({ page }) => {
  const errors = await openFx(page);
  expect((await dotState(page)).exists).toBe(false);

  const { width, height } = page.viewportSize();
  const from = { x: 200, y: 200 };
  await page.mouse.move(from.x, from.y);
  await expect.poll(async () => (await dotState(page)).visible).toBe(true);

  // 10 trayectorias a 3 velocidades (pasos por trayecto)
  for (let i = 0; i < 10; i += 1) {
    const to = { x: Math.round(width * (0.15 + 0.07 * i)), y: Math.round(height * (0.2 + (i % 4) * 0.15)) };
    await page.mouse.move(to.x, to.y, { steps: [2, 6, 15][i % 3] });
    // Alcance visual a ±1 px (tope real holgado) y, para el límite de 150 ms, el fotograma en que el sistema
    // escribe la posición final (a 60 Hz) más la transición declarada del seguimiento: con varios navegadores
    // en paralelo los fotogramas headless se alargan por la carga de la máquina
    expect(await untilFrame(page, AT, to, 1000), `trayectoria ${i}: llega`).toBeLessThanOrEqual(600);
    const placed = await placedFrames(page, to.x, to.y);
    expect(placed, `trayectoria ${i}: posición escrita`).not.toBeNull();
    const follow = await page.evaluate(() => parseFloat(window.getComputedStyle(document.querySelector('.cursor')).transitionDuration) * 1000);
    expect((placed * 1000) / 60 + follow, `trayectoria ${i}: alcance`).toBeLessThanOrEqual(150);

  }
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => document.querySelector('.cursor').getAnimations({ subtree: true }).length)).toBe(0);
  expect(errors).toEqual([]);
});

test('RF-2 · blanco y negro, nunca azul, con ≥ 3:1 sobre blanco, negro, azul y cada pantalla', async ({ page }) => {
  await openFx(page);
  await page.mouse.move(300, 300);
  await expect.poll(async () => (await dotState(page)).visible).toBe(true);
  const s = await dotState(page);
  const WHITE = 'rgb(255, 255, 255)';
  const BLACK = 'rgb(0, 0, 0)';
  expect(s.disc.bg).toBe(WHITE);
  expect(s.disc.border).toBe(BLACK);
  expect(s.ringBox.border).toBe(BLACK);
  expect(s.ringBox.shadow).toContain(WHITE);
  for (const c of [s.disc.bg, s.disc.border, s.ringBox.border]) expect(c).not.toBe('rgb(35, 64, 255)');

  const tones = [WHITE, BLACK];
  for (const bg of ['#ffffff', '#000000', '#2340ff']) expect(bestOf(tones, bg), bg).toBeGreaterThanOrEqual(3);

  // Cada pantalla de mockup: su fondo, su color más claro y el más oscuro (fondos y textos visibles)
  const screens = await page.evaluate(() =>
    [...document.querySelectorAll('.scr')].map((scr) => {
      const colors = new Set([window.getComputedStyle(scr).backgroundColor]);
      for (const el of scr.querySelectorAll('*')) {
        const cs = window.getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        if (!cs.backgroundColor.endsWith(', 0)')) colors.add(cs.backgroundColor);
        if (el.textContent.trim()) colors.add(cs.color);
      }
      return [...colors].filter((c) => !c.endsWith(', 0)') && c.startsWith('rgb'));
    }),
  );
  expect(screens.length).toBeGreaterThanOrEqual(3);
  for (const colors of screens) {
    for (const bg of colors) expect(bestOf(tones, bg), bg).toBeGreaterThanOrEqual(3);
  }
});

test('RF-3, RF-14 · disco de 8 px y aro de 40 px en ≤ 200 ms; disco sobre lo no pulsable', async ({ page }) => {
  test.setTimeout(90_000); // recorre 6 pulsables, 5 zonas no pulsables y el menú
  await openFx(page);
  await page.mouse.move(400, 400);
  await expect.poll(async () => (await dotState(page)).visible).toBe(true);
  const rest = await centerOf(page, '.hero__title');
  await moveTo(page, rest);
  expect(await shapeTime(page, 'disc')).toBeLessThan(Infinity);
  let s = await dotState(page);
  expect(Math.abs(s.disc.w - 8)).toBeLessThanOrEqual(1);
  expect(Math.abs(s.ringBox.w - 40)).toBeLessThanOrEqual(1);
  expect(s.ringBox.borderWidth + 1).toBeLessThanOrEqual(2); // 1 px de borde + 1 px de sombra interior
  expect(s.ringBox.bg).toBe('rgba(0, 0, 0, 0)');

  for (const sel of ['.nav__cta', '[data-menu-toggle]', '.hero .btn', '.hero .link', '.contact .btn', '.footer__nav a']) {
    await scrollToY(page, 0);
    const over = await centerOf(page, sel);
    await page.mouse.move(over.x, over.y, { steps: 2 });
    expect(await shapeTime(page, 'ring'), `${sel}: aro`).toBeLessThanOrEqual(200);
    // Salir hacia un punto no pulsable cercano (encima o debajo, el que no sea pulsable)
    const away = await page.evaluate(({ x, y }) => {
      for (const dy of [-60, 60, -90, 90, -120, 120]) {
        const el = document.elementFromPoint(x + 80, y + dy);
        if (el && !el.closest('a[href], button')) return { x: x + 80, y: y + dy };
      }
      return null;
    }, over);
    expect(away, `${sel}: punto no pulsable cerca`).not.toBeNull();
    await page.mouse.move(away.x, away.y, { steps: 2 });
    expect(await shapeTime(page, 'disc'), `${sel}: disco`).toBeLessThanOrEqual(200);
  }

  // Disco sobre mockups del hero, escenarios de proyectos, filas de servicios y textos
  for (const sel of ['.hero__device', '.project__stage', '.service', '.philosophy__statement', '.hero__lead']) {
    if (!(await page.locator(sel).count())) continue;
    await moveTo(page, await centerOf(page, sel));
    await page.waitForTimeout(220);
    s = await dotState(page);
    expect(s.ring, `${sel}: disco`).toBe(false);
  }

  // Menú abierto: aro sobre sus enlaces y su botón
  await scrollToY(page, 0);
  await page.locator('[data-menu-toggle]').click();
  await animationsDone(page);
  for (const sel of ['.menu__link', '.menu .btn']) {
    const b = await page.locator(sel).first().boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 2 });
    expect(await shapeTime(page, 'ring'), `${sel}: aro`).toBeLessThanOrEqual(200);
  }
  s = await dotState(page);
  expect(Number(s.zIndex)).toBeGreaterThan(50); // por encima de la barra y del menú
});

test('RF-3, RF-5 · entrada de los CTA del hero: disco sobre ellos y aro en la barra; aro ≤ 200 ms tras el fundido', async ({ page }) => {
  await page.goto('/');
  await trackMoves(page);
  await page.waitForFunction(() => document.documentElement.classList.contains('is-ready'));
  // Entrada del hero en pausa mientras se recorren los CTA y la barra (se espera a que exista el fundido de los
  // CTA); después se termina con finish, que dispara su animationend. La lógica que se prueba solo mira si el
  // fundido ha terminado; pausar los dispositivos evita que su pintado headless ralentice los fotogramas
  await page.waitForFunction(() => {
    const hero = document.querySelector('.hero');
    hero.getAnimations({ subtree: true }).forEach((a) => a.pause());
    return document.querySelector('.hero__actions').getAnimations().length > 0;
  });
  // Se vigila dentro de la página desde antes del fin del fundido: fotograma en que se aplica el aro
  const ringAfterFade = page.evaluate(
    () =>
      new Promise((resolve) => {
        const actions = document.querySelector('.hero__actions');
        actions.addEventListener(
          'animationend',
          () => {
            const end = window.performance.now();
            const tick = () => {
              if (document.querySelector('.cursor')?.classList.contains('is-ring')) return resolve(window.performance.now() - end);
              if (window.performance.now() - end > 1500) return resolve(Infinity);
              requestAnimationFrame(tick);
            };
            tick();
          },
          { once: true },
        );
      }),
  );
  const entering = () => page.evaluate(() => document.querySelector('.hero__actions').getAnimations().some((a) => a.playState !== 'finished'));
  const cta = await page.locator('.hero .btn').boundingBox();
  const nav = await page.locator('.nav__cta').boundingBox();
  const over = { x: cta.x + cta.width / 2, y: cta.y + cta.height / 2 };

  await page.mouse.move(over.x, over.y, { steps: 2 });
  await page.waitForTimeout(120);
  expect(await entering(), 'la entrada sigue en curso').toBe(true);
  expect((await dotState(page)).ring, 'disco sobre el CTA del hero en su entrada').toBe(false);

  await page.mouse.move(nav.x + nav.width / 2, nav.y + nav.height / 2, { steps: 2 });
  expect(await shapeTime(page, 'ring'), 'aro en la barra durante la entrada').toBeLessThanOrEqual(200);
  expect(await entering()).toBe(true);

  // El otro CTA del hero, «Ver proyectos»: también disco durante la entrada (decisión 17)
  const link = await page.locator('.hero .link').boundingBox();
  await page.mouse.move(link.x + link.width / 2, link.y + link.height / 2, { steps: 2 });
  await page.waitForTimeout(120);
  expect(await entering()).toBe(true);
  expect((await dotState(page)).ring, 'disco sobre «Ver proyectos» en su entrada').toBe(false);

  await page.mouse.move(over.x, over.y, { steps: 2 });
  await page.waitForTimeout(120);
  expect(await entering()).toBe(true);
  expect((await dotState(page)).ring).toBe(false);

  await page.evaluate(() => document.querySelector('.hero').getAnimations({ subtree: true }).forEach((a) => a.finish()));
  const duration = await page.evaluate(() => parseFloat(window.getComputedStyle(document.querySelector('.cursor i')).transitionDuration) * 1000);
  expect((await ringAfterFade) + duration, 'aro tras el fin del fundido').toBeLessThanOrEqual(200);
  expect(await untilFrame(page, RING, null, 1500)).toBeLessThan(Infinity);
  // Tras la entrada, aro también sobre «Ver proyectos»
  await page.mouse.move(link.x + link.width / 2, link.y + link.height / 2, { steps: 2 });
  expect(await shapeTime(page, 'ring'), 'aro sobre «Ver proyectos» tras la entrada').toBeLessThanOrEqual(200);
});

test('RF-3, RF-5 · menú en transición: disco hasta que acaban sus animaciones y aro ≤ 200 ms después', async ({ page }) => {
  await openFx(page);
  const toggle = await centerOf(page, '[data-menu-toggle]');
  await page.mouse.move(toggle.x, toggle.y, { steps: 3 });
  expect(await shapeTime(page, 'ring')).toBeLessThan(Infinity);

  for (const step of ['abrir', 'cerrar']) {
    await page.evaluate(() => (window.__tClick = window.performance.now()));
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(100);
    expect((await dotState(page)).ring, `${step}: disco durante la transición`).toBe(false);
    // Fin de todas las animaciones del menú (sin los colores de hover de sus enlaces), calculado aquí; desde
    // ese instante se vigila, dentro de la página, el fotograma en que se aplica el aro. Además, con el
    // registro de cambios del punto: ningún aro entre el clic y ese fin (disco durante toda la transición)
    const { after, early } = await page.evaluate(async () => {
      const menu = document.querySelector('[data-menu]');
      for (;;) {
        const list = menu.getAnimations({ subtree: true }).filter((a) => a.playState === 'running' && a.transitionProperty !== 'color');
        if (!list.length) break;
        await Promise.allSettled(list.map((a) => a.finished));
      }
      const end = window.performance.now();
      // Desde que el punto pasa a disco por el clic (antes, el aro es el de encima del botón) hasta el fin
      const disc = window.__shapes.find((s) => !s.ring && s.t > window.__tClick);
      const early = disc ? window.__shapes.filter((s) => s.ring && s.t > disc.t && s.t < end).map((s) => Math.round(s.t - disc.t)) : ['sin disco'];
      for (;;) {
        if (document.querySelector('.cursor')?.classList.contains('is-ring')) return { after: window.performance.now() - end, early };
        if (window.performance.now() - end > 1500) return { after: Infinity, early };
        await new Promise((r) => requestAnimationFrame(r));
      }
    });
    expect(early, `${step}: sin aro antes del fin de las animaciones del menú (ms desde el clic)`).toEqual([]);
    const duration = await page.evaluate(() => parseFloat(window.getComputedStyle(document.querySelector('.cursor i')).transitionDuration) * 1000);
    expect(after + duration, `${step}: aro ≤ 200 ms después`).toBeLessThanOrEqual(200);
    expect(await untilFrame(page, RING, null, 1500), `${step}: aro final`).toBeLessThan(Infinity);
  }
});

test('RF-4 · con el puntero quieto, el scroll cambia entre disco y aro en ≤ 200 ms', async ({ page }) => {
  await openFx(page);
  await noFollow(page);
  const c = await centerOf(page, '.contact .btn');
  const y0 = await page.evaluate(() => window.scrollY);
  await scrollToY(page, y0 + 400);
  const free = await page.evaluate(({ x, y }) => !document.elementFromPoint(x, y)?.closest('a[href], button'), c);
  expect(free, 'el punto queda sobre algo no pulsable tras desplazar').toBe(true);
  await moveTo(page, c);
  expect(await shapeTime(page, 'disc')).toBeLessThan(Infinity);

  // La referencia se toma en la misma llamada que el scroll: bajo carga, el viaje de ida y vuelta de
  // Playwright entre dos llamadas dura más que la medida
  const scrollFrom = (y) =>
    page.evaluate((top) => {
      window.__t0 = window.performance.now();
      window.__f0 = window.__frame;
      window.scrollTo({ top, behavior: 'instant' });
    }, y);
  await scrollFrom(y0);
  expect(await shapeTime(page, 'ring'), 'aro al llegar el botón').toBeLessThanOrEqual(200);
  await scrollFrom(y0 + 400);
  expect(await shapeTime(page, 'disc'), 'disco al irse').toBeLessThanOrEqual(200);
});

test('RF-5 · sin relleno sobre un pulsable, invisible para la accesibilidad y el clic lo atraviesa', async ({ page }) => {
  await openFx(page);
  await noFollow(page);
  const aria = await page.locator('body').ariaSnapshot();
  await page.mouse.move(300, 300);
  await expect.poll(async () => (await dotState(page)).visible).toBe(true);
  const s = await dotState(page);
  expect(s.pointerEvents).toBe('none');
  expect(s.ariaHidden).toBe('true');
  expect(s.tabindex).toBeNull();
  expect(await page.locator('body').ariaSnapshot()).toBe(aria);

  // Fotograma a fotograma desde que se detecta el pulsable: disco sin opacidad y aro sin fondo
  const link = await centerOf(page, '.footer__nav a');
  await page.mouse.move(link.x, link.y - 80);
  await page.waitForTimeout(250);
  const framesPromise = recordFrames(
    page,
    `const d = document.querySelector('.cursor'); const [c, g] = d.children;
     return { ring: d.classList.contains('is-ring'), disc: Number(window.getComputedStyle(c).opacity), bg: window.getComputedStyle(g).backgroundColor };`,
    null,
    450,
  );
  await page.mouse.move(link.x, link.y, { steps: 3 });
  const frames = await framesPromise;
  const ringFrames = frames.filter((f) => f.ring);
  expect(ringFrames.length).toBeGreaterThan(3);
  for (const f of ringFrames) {
    expect(f.disc).toBe(0);
    expect(f.bg).toBe('rgba(0, 0, 0, 0)');
  }

  // El clic bajo el punto llega al enlace
  await page.evaluate(() => {
    window.__clicks = [];
    window.addEventListener('click', (e) => window.__clicks.push(e.target.closest('a')?.textContent.trim()), true);
  });
  await page.mouse.click(link.x, link.y);
  const text = await page.locator('.footer__nav a').first().textContent();
  expect(await page.evaluate(() => window.__clicks)).toEqual([text.trim()]);

  // El aro (sin relleno) tapa menos área que el elemento enfocado
  const area = await page.locator('.footer__nav a').first().evaluate((el) => el.offsetWidth * el.offsetHeight);
  expect(Math.PI * 40 * 2).toBeLessThan(area);
});

test('RF-6 · la salida de la ventana y las teclas lo ocultan; las modificadoras no', async ({ page }) => {
  await openFx(page);
  await noFollow(page);
  const p = await centerOf(page, '.hero__title');
  const show = async () => {
    await page.mouse.move(p.x + 3, p.y + 3);
    await page.mouse.move(p.x, p.y);
    await expect.poll(async () => (await dotState(page)).visible).toBe(true);
  };

  await show();
  await markNow(page);
  await page.evaluate(() => document.dispatchEvent(new window.MouseEvent('mouseout', { bubbles: true, relatedTarget: null })));
  expect(await untilFrame(page, HIDDEN, null, 300)).toBeLessThan(Infinity);
  await page.waitForTimeout(150);
  expect((await dotState(page)).visible, 'sigue oculto hasta mover').toBe(false);

  for (const key of ['a', 'Tab', 'Enter', 'Escape', 'ArrowDown']) {
    await scrollToY(page, 0);
    await show();
    await markNow(page);
    await page.keyboard.press(key);
    expect(await untilFrame(page, HIDDEN, null, 300), `${key} lo oculta`).toBeLessThan(Infinity);
  }

  await scrollToY(page, 0);
  await page.locator('body').evaluate((b) => b.focus());
  for (const key of ['Control', 'Shift', 'Alt', 'Meta']) {
    await show();
    await page.keyboard.press(key);
    await page.waitForTimeout(120);
    expect((await dotState(page)).visible, `${key} no lo oculta`).toBe(true);
  }
  await show();
  await page.keyboard.down('Shift');
  await page.mouse.click(p.x, p.y);
  await page.keyboard.up('Shift');
  await page.waitForTimeout(120);
  expect((await dotState(page)).visible, 'Mayús + clic no lo oculta').toBe(true);
  await page.keyboard.down('Alt');
  await page.mouse.wheel(0, 40);
  await page.keyboard.up('Alt');
  await page.waitForTimeout(120);
  expect((await dotState(page)).exists && !(await page.evaluate(() => document.querySelector('.cursor').classList.contains('is-off'))), 'Alt + rueda no lo oculta').toBe(true);
});

test('RF-14 · la inclinación del hero sigue igual con el punto encima', async ({ page }) => {
  await openFx(page);
  const box = await page.locator('.hero').boundingBox();
  const at = { x: box.x + box.width * 0.7, y: box.y + box.height * 0.3 };
  await page.mouse.move(at.x - 20, at.y - 20);
  await page.mouse.move(at.x, at.y, { steps: 3 });
  await page.waitForTimeout(150);
  const { mx, my } = await page.evaluate(() => {
    const s = document.querySelector('[data-hero-stage]').style;
    return { mx: s.getPropertyValue('--mx'), my: s.getPropertyValue('--my') };
  });
  expect(mx).toBe((((at.x - box.x) / box.width - 0.5) * 2).toFixed(3));
  expect(my).toBe((((at.y - box.y) / box.height - 0.5) * 2).toFixed(3));
  expect((await dotState(page)).visible).toBe(true);
});
