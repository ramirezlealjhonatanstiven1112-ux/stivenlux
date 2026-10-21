import { test, expect, devices } from '@playwright/test';
import {
  open,
  pixelBand,
  scrollToHeroProgress,
  scrollToY,
  curtainRangeOf,
  expectedCurtain,
  waitCurtainApplied,
  scrollToCurtain,
  frame,
  scrollSettled,
} from './support/motion.js';

// Cortinas entre secciones («marco que se abre»). Cada test indica el RF de
// specs/001-hero-y-transiciones/spec.md. Se ejecutan en `escritorio` (1440×900) y en `movil`
// (Pixel 7 de Playwright: 412×839) salvo que se indique; las medidas leen innerWidth/innerHeight.

/* Las 5 fronteras de tono: sección entrante y tono de la sección anterior. */
const BORDERS = [
  { id: 'filosofia', prev: 'light' },
  { id: 'proyectos', prev: 'dark' },
  { id: 'servicios', prev: 'light' },
  { id: 'proceso', prev: 'dark' },
  { id: 'contacto', prev: 'light' },
];

const TONE = { light: 'rgb(255, 255, 255)', dark: 'rgb(0, 0, 0)' };
const OWN_BG = { light: 'rgba(0, 0, 0, 0)', dark: 'rgb(0, 0, 0)' };
const RESERVE = 8; // reserva para el indicador de foco (px)
const RING = 6; // outline de 2 px + offset de 4 px

const strip = (padding) => Math.max(0, padding - RESERVE);

/* Plano descubierto: la caja de la sección menos el marco. */
const planeOf = (f) => ({
  top: f.rect.top + f.ft,
  right: f.rect.right - f.fr,
  bottom: f.rect.bottom - f.fb,
  left: f.rect.left + f.fl,
});

/* Cajas de texto y de pulsables de la sección que se salen del plano (tolerancia de 1 px). Los escenarios
   de Proyectos quedan fuera (RF-9).
   - Caja de un texto: la caja de layout del elemento que lo contiene (si es `inline`, la de su primer
     ancestro que no lo es), con cualquier progreso.
   - Además, ningún rango de texto que esté dentro de la ventana pisa el marco. (El área de la fuente de
     los titulares serif, con interlineado < 1, sobresale unos px de su caja: solo puede alcanzar el
     marco con c < 0,07, cuando el titular aún está por debajo de la ventana.) */
async function boxesOutside(page, id, plane) {
  return page.evaluate(
    ({ sectionId, p }) => {
      const section = document.getElementById(sectionId);
      const vh = window.innerHeight;
      const out = [];
      const check = (r, label) => {
        if (r.width === 0 && r.height === 0) return;
        if (r.top < p.top - 1 || r.left < p.left - 1 || r.bottom > p.bottom + 1 || r.right > p.right + 1) {
          out.push({ label, top: r.top, right: r.right, bottom: r.bottom, left: r.left });
        }
      };
      const boxes = new Set();
      const walker = document.createTreeWalker(section, window.NodeFilter.SHOW_TEXT);
      let count = 0;
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent.trim() || node.parentElement.closest('.project__stage')) continue;
        let el = node.parentElement;
        while (el !== section && window.getComputedStyle(el).display === 'inline') el = el.parentElement;
        boxes.add(el);
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const r of range.getClientRects()) {
          if (r.bottom <= 0 || r.top >= vh) continue;
          count++;
          check(r, `texto en la ventana: ${node.textContent.trim().slice(0, 30)}`);
        }
      }
      for (const el of section.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])')) {
        if (!el.closest('.project__stage')) boxes.add(el);
      }
      for (const el of boxes) {
        count++;
        check(el.getBoundingClientRect(), el.outerHTML.slice(0, 50));
      }
      return { count, out };
    },
    { sectionId: id, p: plane },
  );
}

for (const { id, prev } of BORDERS) {
  test(`RF-7, RF-8 y RF-9 · ${id} · marco con c = 0; 0,5 y 1: grosor = (padding − 8)·(1 − c), tono anterior y contenido dentro del plano`, async ({ page }) => {
    const errors = await open(page);
    const own = await page.evaluate((sectionId) => document.getElementById(sectionId).dataset.theme, id);
    let measured = 0;

    for (const target of [0, 0.5, 1]) {
      const c = await scrollToCurtain(page, id, target);
      if (c === null) continue; // la posición queda por encima del inicio de la página
      measured++;
      expect(c, `${id}: progreso alcanzado`).toBeCloseTo(target, 2);

      const f = await frame(page, id);
      const label = `${id} con c = ${target}`;
      expect(f.content, `${label}: el marco existe`).not.toBe('none');

      // RF-7: franja de cada lado = (padding propio − 8 px)·(1 − c), ±1 px
      expect(Math.abs(f.ft - strip(f.pt) * (1 - c)), `${label}: arriba`).toBeLessThanOrEqual(1);
      expect(Math.abs(f.fb - strip(f.pb) * (1 - c)), `${label}: abajo`).toBeLessThanOrEqual(1);
      expect(Math.abs(f.fl - strip(f.pl) * (1 - c)), `${label}: izquierda`).toBeLessThanOrEqual(1);
      expect(Math.abs(f.fr - strip(f.pr) * (1 - c)), `${label}: derecha`).toBeLessThanOrEqual(1);
      if (target === 0) expect(f.ft, `${label}: hay franja superior`).toBeGreaterThan(40);
      if (id === 'proyectos') expect(f.fl + f.fr, `${label}: Proyectos no tiene franja lateral`).toBe(0);

      // RF-8: el marco es del tono anterior y la sección conserva su fondo
      expect(f.bg, `${label}: tono del marco`).toBe(TONE[prev]);
      expect(f.ownBg, `${label}: fondo propio`).toBe(OWN_BG[own]);

      // RF-9: textos y pulsables dentro del plano descubierto
      const { count, out } = await boxesOutside(page, id, planeOf(f));
      expect(count, `${label}: cajas medidas`).toBeGreaterThan(0);
      expect(out, `${label}: cajas fuera del plano`).toEqual([]);
    }

    expect(measured, `${id}: progresos medidos`).toBeGreaterThanOrEqual(2);
    expect(errors).toEqual([]);
  });
}

test('RF-7 · la cortina es continua y monótona con el scroll, también al subir', async ({ page }) => {
  await open(page);
  const { start, end } = await curtainRangeOf(page, 'servicios');
  const values = [];
  for (let i = 0; i <= 8; i++) {
    await scrollToY(page, Math.round(start + ((end - start) * i) / 8));
    values.push(await waitCurtainApplied(page, 'servicios'));
  }
  for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
  expect(values[0]).toBeCloseTo(0, 2); // la posición se redondea a px enteros
  expect(values.at(-1)).toBeCloseTo(1, 2);

  // Misma posición, mismo marco al subir
  await scrollToY(page, Math.round(start + (end - start) / 2));
  await waitCurtainApplied(page, 'servicios');
  const down = await frame(page, 'servicios');
  await scrollToY(page, Math.round(end + 300));
  await waitCurtainApplied(page, 'servicios');
  await scrollToY(page, Math.round(start + (end - start) / 2));
  await waitCurtainApplied(page, 'servicios');
  const up = await frame(page, 'servicios');
  expect(Math.abs(up.ft - down.ft)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(up.fl - down.fl)).toBeLessThanOrEqual(0.5);
});

test('RF-10 · la altura desplazable es la misma que con movimiento reducido', async ({ page }) => {
  await open(page);
  const withMotion = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  const reduced = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    content: window.getComputedStyle(document.getElementById('servicios'), '::before').content,
  }));
  expect(reduced.content, 'con movimiento reducido no hay marco').toBe('none');
  expect(Math.abs(withMotion - reduced.height)).toBeLessThanOrEqual(1);
});

const END_WINDOWS = [
  { name: 'ventana del proyecto', size: null },
  { name: '1440×2400', size: { width: 1440, height: 2400 } },
];

for (const win of END_WINDOWS) {
  test(`RF-11 · ${win.name} · al final de la página la cortina de Contacto está en 1`, async ({ page }, testInfo) => {
    if (win.size) {
      test.skip(testInfo.project.name !== 'escritorio', 'Ventana con tamaño fijo: se prueba en escritorio');
      await page.setViewportSize(win.size);
    }
    await open(page);
    const range = await curtainRangeOf(page, 'contacto');
    if (win.size) {
      // En esta ventana la página termina antes del tramo normal: el tramo se acorta al final del scroll
      expect(range.natural, 'tramo acortado').toBeGreaterThan(range.maxScroll);
      expect(range.end).toBeGreaterThan(range.start);
      await scrollToY(page, Math.round((range.start + range.end) / 2));
      const mid = await waitCurtainApplied(page, 'contacto');
      expect(mid).toBeGreaterThan(0.3);
      expect(mid).toBeLessThan(0.7);
    }
    await scrollToY(page, range.maxScroll);
    expect(await waitCurtainApplied(page, 'contacto')).toBe(1);
    const f = await frame(page, 'contacto');
    expect([f.ft, f.fr, f.fb, f.fl]).toEqual([0, 0, 0, 0]);
  });
}

test('RF-7 · cargada con Servicios a la vista, su cortina se cierra al subir y se reabre al bajar', async ({ page }) => {
  await open(page, '/#servicios');
  await scrollSettled(page);
  const loaded = await page.evaluate(() => ({
    y: window.scrollY,
    top: document.getElementById('servicios').getBoundingClientRect().top,
    vh: window.innerHeight,
  }));
  expect(loaded.top, 'Servicios a la vista al cargar').toBeLessThan(loaded.vh);
  const atLoad = await waitCurtainApplied(page, 'servicios');
  expect(atLoad).toBe(1);

  for (let round = 0; round < 2; round++) {
    const { start } = await curtainRangeOf(page, 'servicios');
    await scrollToY(page, Math.max(0, Math.round(start - 200)));
    expect(await waitCurtainApplied(page, 'servicios'), `vuelta ${round + 1}: cerrada`).toBe(0);
    const closed = await frame(page, 'servicios');
    expect(Math.abs(closed.ft - strip(closed.pt)), `vuelta ${round + 1}: franja completa`).toBeLessThanOrEqual(1);

    await scrollToY(page, loaded.y);
    expect(await waitCurtainApplied(page, 'servicios'), `vuelta ${round + 1}: abierta`).toBe(1);
    const open1 = await frame(page, 'servicios');
    expect([open1.ft, open1.fr, open1.fb, open1.fl]).toEqual([0, 0, 0, 0]);
  }
});

test('RF-21 · al tabular, el anillo de foco queda dentro del plano y por encima del hero', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'escritorio', 'Navegación con teclado: escritorio');
  await open(page);
  const seen = new Set();
  let checked = 0;
  const inSections = [];

  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    await scrollSettled(page); // el foco puede desplazar la página
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const section = el.closest('[data-curtain]');
      const r = el.getBoundingClientRect();
      const key = el.outerHTML.slice(0, 80) + r.top;
      if (el.closest('.hero')) {
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { key, kind: 'hero', onTop: Boolean(hit && el.contains(hit)) };
      }
      if (!section) return { key, kind: 'other' };
      return { key: el.outerHTML.slice(0, 80), kind: 'section', id: section.id };
    });
    if (!info) continue;
    if (seen.has(info.key)) break;
    seen.add(info.key);

    if (info.kind === 'hero') {
      expect(info.onTop, `${info.key}: visible por encima de los dispositivos`).toBe(true);
      checked++;
    } else if (info.kind === 'section') {
      await waitCurtainApplied(page, info.id);
      const f = await frame(page, info.id);
      const p = planeOf(f);
      const r = await page.evaluate(() => {
        const b = document.activeElement.getBoundingClientRect();
        return { top: b.top, right: b.right, bottom: b.bottom, left: b.left };
      });
      const label = `${info.key} en ${info.id} (c = ${await expectedCurtain(page, info.id)})`;
      expect(r.top - RING, `${label}: arriba`).toBeGreaterThanOrEqual(p.top - 1);
      expect(r.left - RING, `${label}: izquierda`).toBeGreaterThanOrEqual(p.left - 1);
      expect(r.bottom + RING, `${label}: abajo`).toBeLessThanOrEqual(p.bottom + 1);
      expect(r.right + RING, `${label}: derecha`).toBeLessThanOrEqual(p.right + 1);
      checked++;
      inSections.push(label);
    }
  }
  testInfo.annotations.push({ type: 'enfocables en secciones', description: inSections.join(' · ') });
  expect(checked, 'enfocables comprobados').toBeGreaterThanOrEqual(3);
  expect(inSections.length, 'enfocables dentro de secciones con cortina').toBeGreaterThanOrEqual(1);
});

/* RF-21 con la cortina en curso: los CTA de Contacto se enfocan sin desplazar la página (preventScroll,
   tras un Tab para que el foco sea de teclado y se vea su indicador) con la cortina a 0 y a 0,5, sin llegar
   al final de la página, y su anillo queda dentro del plano descubierto. */
for (const target of [0, 0.5]) {
  test(`RF-21 · con la cortina de Contacto a ${target}, el anillo de foco de sus CTA queda dentro del plano`, async ({ page }) => {
    const errors = await open(page);
    await page.keyboard.press('Tab');
    expect(await scrollToCurtain(page, 'contacto', target)).toBeCloseTo(target, 2);
    const { y, maxScroll } = await curtainRangeOf(page, 'contacto');
    expect(y, 'sin llegar al final de la página').toBeLessThan(maxScroll - 1);
    const count = await page.evaluate(
      () => [...document.querySelectorAll('#contacto a[href], #contacto button, #contacto [tabindex]')].filter((el) => el.getClientRects().length).length,
    );
    expect(count, 'CTA de Contacto').toBeGreaterThanOrEqual(1);

    for (let i = 0; i < count; i++) {
      const focused = await page.evaluate((index) => {
        const el = [...document.querySelectorAll('#contacto a[href], #contacto button, #contacto [tabindex]')].filter((e) => e.getClientRects().length)[index];
        el.focus({ preventScroll: true });
        const r = el.getBoundingClientRect();
        return {
          label: el.textContent.trim(),
          visible: el.matches(':focus-visible') && window.getComputedStyle(el).outlineStyle !== 'none',
          y: window.scrollY,
          rect: { top: r.top, right: r.right, bottom: r.bottom, left: r.left },
        };
      }, i);
      expect(focused.visible, `${focused.label}: indicador de foco visible`).toBe(true);
      expect(focused.y, `${focused.label}: el foco no desplaza la página`).toBe(y);
      expect(await waitCurtainApplied(page, 'contacto')).toBeCloseTo(target, 2);
      const p = planeOf(await frame(page, 'contacto'));
      const r = focused.rect;
      const label = `${focused.label} con c = ${target}`;
      expect(r.top - RING, `${label}: arriba`).toBeGreaterThanOrEqual(p.top - 1);
      expect(r.left - RING, `${label}: izquierda`).toBeGreaterThanOrEqual(p.left - 1);
      expect(r.bottom + RING, `${label}: abajo`).toBeLessThanOrEqual(p.bottom + 1);
      expect(r.right + RING, `${label}: derecha`).toBeLessThanOrEqual(p.right + 1);
    }
    expect(errors).toEqual([]);
  });
}

/* RF-8 con cualquier densidad de píxeles. Con DPR fraccionario o 3 el borde superior de una sección cae a
   mitad de un píxel de dispositivo; la fila del borde no puede quedar a medio cubrir (dejaría ver el fondo
   propio como un filete). Se miran todas las filas de dispositivo desde 1 px por encima del borde hasta
   1 px antes del plano descubierto, a todo el ancho: todas del tono anterior. Contextos propios con
   browser.newContext, así que se prueba solo desde el proyecto `escritorio`. */
const DENSITIES = [
  { name: 'DPR 1,25 (1440×900)', options: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.25 } },
  { name: 'DPR 1,5 (1366×768)', options: { viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1.5 } },
  { name: 'DPR 2,625 (Pixel 7)', options: devices['Pixel 7'] },
  { name: 'DPR 3 (iPhone 13)', options: devices['iPhone 13'] },
];

for (const density of DENSITIES) {
  test(`RF-8 · ${density.name} · la franja superior de cada cortina es del tono anterior, también en la fila del borde`, async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'escritorio', 'Contextos propios: se prueba una vez');
    // eslint-disable-next-line no-unused-vars
    const { defaultBrowserType, ...options } = density.options;
    const context = await browser.newContext({ ...options, baseURL: testInfo.project.use.baseURL });
    const page = await context.newPage();
    const errors = await open(page);
    expect(await page.evaluate(() => window.devicePixelRatio)).toBe(options.deviceScaleFactor);
    for (const { id, prev } of BORDERS) {
      for (const target of [0.25, 0.5, 0.75]) {
        const c = await scrollToCurtain(page, id, target);
        const f = await frame(page, id);
        expect(f.ft, `${id} con c = ${c}: hay franja`).toBeGreaterThan(4);
        const band = await pixelBand(page, { from: f.rect.top - 1, to: f.rect.top + f.ft - 1, ref: prev === 'light' ? 255 : 0 });
        expect(band.worst, `${id} con c = ${c}: franja uniforme (peor píxel ${JSON.stringify(band.at)})`).toBeLessThanOrEqual(2);
      }
    }
    expect(errors).toEqual([]);
    await context.close();
  });
}

/* HU-1 y RF-8: el hero recorta lo que sale de su caja. Mientras la cortina de Filosofía está en curso, su
   franja blanca queda justo debajo, así que la sombra (o el propio dispositivo) no puede terminar en un
   corte: entre 4 px por encima del borde del hero y 2 px por debajo, ninguna fila de dispositivo cambia más
   de 4 niveles respecto a la anterior. */
test('HU-1 · la sombra de los dispositivos no se corta en el borde del hero mientras se abre la cortina de Filosofía', async ({ page }) => {
  const errors = await open(page);
  let checked = 0;
  for (const p of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6]) {
    await scrollToHeroProgress(page, p);
    const c = await waitCurtainApplied(page, 'filosofia');
    const { bottom, vh } = await page.evaluate(() => ({ bottom: document.querySelector('.hero').getBoundingClientRect().bottom, vh: window.innerHeight }));
    if (c <= 0 || c >= 1 || bottom > vh - 4) continue;
    const band = await pixelBand(page, { from: bottom - 4, to: bottom + 2 });
    expect(band.worst, `progreso ${p} (cortina ${c.toFixed(2)}): sin corte en el borde (${JSON.stringify(band.at)})`).toBeLessThanOrEqual(4);
    checked++;
  }
  expect(checked, 'posiciones con la cortina de Filosofía en curso').toBeGreaterThanOrEqual(2);
  expect(errors).toEqual([]);
});

test('RF-20 · al imprimir no hay marco, aunque una cortina esté a 0,5', async ({ page }) => {
  await open(page);
  expect(await scrollToCurtain(page, 'proceso', 0.5)).toBeCloseTo(0.5, 2);
  expect((await frame(page, 'proceso')).content).not.toBe('none');
  await page.emulateMedia({ media: 'print' });
  for (const { id } of BORDERS) {
    expect((await frame(page, id)).content, `${id}: sin marco al imprimir`).toBe('none');
  }
});
