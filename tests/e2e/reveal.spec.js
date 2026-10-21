import { test, expect } from '@playwright/test';
import { open, scrollToY, curtainRangeOf, scrollToCurtain, scrollSettled, waitCurtainApplied } from './support/motion.js';

// Palabras de filosofía y primer escenario de proyectos esperan a su cortina, y revelado de titulares de
// sección línea a línea (escritorio) o en bloque (móvil). Cada test indica el RF de specs/001-hero-y-transiciones/spec.md. Las ventanas con tamaño se
// prueban desde el proyecto `escritorio`; «móvil» es la ventana del proyecto `movil` (Pixel 7 de
// Playwright: 412×839). Las medidas leen innerWidth/innerHeight.

const WINDOWS = [
  { name: '1440×900', size: { width: 1440, height: 900 } },
  { name: '1366×600', size: { width: 1366, height: 600 } },
  { name: '844×390', size: { width: 844, height: 390 } },
  { name: 'móvil', size: null },
];

const MIN_OPACITY = 0.18; // opacidad mínima de las palabras (spec 000)
const STAGE_CLOSED = 'inset(7% 5%)'; // clip-path del escenario con --e = 0 (estado inicial)

/* Cada ventana se prueba en un único proyecto: las de tamaño fijo en escritorio, «móvil» en movil. */
async function setup(page, testInfo, { size }) {
  if (size) {
    test.skip(testInfo.project.name !== 'escritorio', 'Ventana con tamaño fijo: se prueba en escritorio');
    await page.setViewportSize(size);
  } else {
    test.skip(testInfo.project.name !== 'movil', 'Ventana del proyecto móvil');
  }
  return open(page);
}

const HIDDEN = { pending: true, clipPath: 'inset(0px 0px 100%)', masks: 0 }; // titular sin revelar

/* Estado del titular de una sección: pendiente, revelándose, recorte y número de máscaras. */
const titleState = (page, id) =>
  page.evaluate((sectionId) => {
    const h = document.querySelector(`#${sectionId} [data-reveal]`);
    return {
      pending: h.classList.contains('is-pending'),
      revealing: h.classList.contains('is-revealing'),
      clipPath: window.getComputedStyle(h).clipPath,
      masks: h.querySelectorAll('.ln').length,
    };
  }, id);

/* Opacidad resuelta de cada palabra del texto de filosofía. */
const wordOpacities = (page) =>
  page.$$eval('.philosophy__statement .w', (words) => words.map((w) => Number(window.getComputedStyle(w).opacity)));

/* Texto de filosofía: scroll en el que su centro alcanza el centro de la ventana, recorrido actual
   (definición de la spec 000) y --w escrito por el script. */
const statement = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('.philosophy__statement');
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    return {
      centered: r.top + window.scrollY + r.height / 2 - vh / 2,
      traverse: Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height))),
      w: el.style.getPropertyValue('--w'),
      y: window.scrollY,
    };
  });

/* Primer escenario de proyectos: --e resuelto y clip-path. */
const firstStage = (page) =>
  page.evaluate(() => {
    const stage = document.querySelector('.project__stage');
    const style = window.getComputedStyle(stage);
    return { e: parseFloat(style.getPropertyValue('--e')), clipPath: style.clipPath, top: stage.getBoundingClientRect().top };
  });

for (const win of WINDOWS) {
  test(`RF-12 · ${win.name} · palabras de filosofía a la opacidad mínima con la cortina a 0,9 y completas con el texto centrado`, async ({ page }, testInfo) => {
    const errors = await setup(page, testInfo, win);
    const count = (await wordOpacities(page)).length;
    expect(count, 'palabras partidas').toBeGreaterThan(5);

    expect(await titleState(page, 'filosofia'), 'titular pendiente al cargar').toMatchObject({ pending: true });

    // Cortina a 0,9: todas las palabras en su opacidad mínima y el titular sin revelar
    const c = await scrollToCurtain(page, 'filosofia', 0.9);
    expect(c, 'progreso alcanzado').toBeCloseTo(0.9, 2);
    await expect.poll(() => wordOpacities(page)).toEqual(Array(count).fill(MIN_OPACITY));
    expect(await titleState(page, 'filosofia'), 'titular sin revelar con la cortina a 0,9').toMatchObject(HIDDEN);

    // Ligada al scroll: a medio camino entre la cortina en 1 y el texto centrado, la mitad del progreso
    const { end } = await curtainRangeOf(page, 'filosofia');
    const { centered } = await statement(page);
    expect(centered, 'el texto se centra después de que la cortina llegue a 1').toBeGreaterThan(end);
    const mid = Math.round((end + centered) / 2);
    await scrollToY(page, mid);
    const expectedMid = (mid - end) / (centered - end);
    await expect.poll(async () => Number((await statement(page)).w)).toBeCloseTo(expectedMid, 2);

    // Centro del texto en el centro de la ventana (primer px entero en que lo alcanza): todas completas
    await scrollToY(page, Math.ceil(centered));
    await expect.poll(() => wordOpacities(page)).toEqual(Array(count).fill(1));

    // Reversible: al volver a la cortina a 0,9, otra vez en su opacidad mínima
    await scrollToCurtain(page, 'filosofia', 0.9);
    await expect.poll(() => wordOpacities(page)).toEqual(Array(count).fill(MIN_OPACITY));
    expect(errors).toEqual([]);
  });

  test(`RF-13 · ${win.name} · el primer escenario sigue cerrado con la cortina de Proyectos a 0,9`, async ({ page }, testInfo) => {
    const errors = await setup(page, testInfo, win);
    expect(await titleState(page, 'proyectos'), 'titular pendiente al cargar').toMatchObject({ pending: true });

    for (const pass of ['bajando', 'tras abrirlo y volver']) {
      // 0,9 (la medida de la tarea) y 0,99, donde en 1440×900 el escenario ya asoma por abajo
      for (const target of [0.9, 0.99]) {
        const c = await scrollToCurtain(page, 'proyectos', target);
        expect(c, `${pass}: progreso alcanzado`).toBeCloseTo(target, 2);
        await expect
          .poll(() => firstStage(page), `${pass}, cortina a ${target}: estado inicial`)
          .toMatchObject({ e: 0, clipPath: STAGE_CLOSED });
        if (pass === 'bajando') {
          expect(await titleState(page, 'proyectos'), `titular sin revelar con la cortina a ${target}`).toMatchObject(HIDDEN);
        }
      }

      if (pass === 'bajando') {
        // Se abre al entrar con la cortina ya en 1 (regla de la spec 000)…
        const { top } = await firstStage(page);
        const y = await page.evaluate(() => window.scrollY);
        const vh = await page.evaluate(() => window.innerHeight);
        await scrollToY(page, Math.round(y + top - vh * 0.25));
        await expect.poll(async () => (await firstStage(page)).clipPath, 'abierto').not.toBe(STAGE_CLOSED);
        // …y la siguiente vuelta salta de golpe desde ahí a la cortina a 0,9
      }
    }
    expect(errors).toEqual([]);
  });
}

test('RF-12 · si Filosofía estaba a la vista al asentarse la carga, sus palabras siguen la regla de la spec 000', async ({ page }) => {
  // El script principal se retiene hasta haber llevado la página a Filosofía
  let release;
  const held = new Promise((r) => (release = r));
  await page.route('**/assets/*.js', async (route) => {
    await held;
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'commit' });
  await page.waitForSelector('#contacto', { state: 'attached' });
  const { start, end } = await curtainRangeOf(page, 'filosofia');
  const target = Math.round(start + 0.95 * (end - start)); // cortina < 1 y sección a la vista
  await scrollToY(page, target);
  expect(await page.evaluate(() => document.getElementById('filosofia').getBoundingClientRect().top < window.innerHeight)).toBe(true);
  release();
  await page.waitForFunction(() => document.querySelector('.philosophy__statement .w'));
  await scrollSettled(page);

  // Regla de la spec 000 en varias posiciones, también con la cortina por debajo de 1
  const legacy = (traverse) => Math.min(1, Math.max(0, (traverse - 0.12) / 0.38));
  const { centered } = await statement(page);
  let differs = false;
  for (const y of [target, Math.round((end + centered) / 2), Math.round(centered), target]) {
    await scrollToY(page, y);
    await expect
      .poll(async () => {
        const s = await statement(page);
        return Math.abs(Number(s.w) - legacy(s.traverse)) <= 0.001 && s.w !== '';
      }, `--w con la regla de la spec 000 en y = ${y}`)
      .toBe(true);
    const s = await statement(page);
    const fresh = s.y < end ? 0 : Math.min(1, (s.y - end) / (centered - end));
    if (Math.abs(legacy(s.traverse) - fresh) > 0.01) differs = true;
  }
  expect(differs, 'la prueba distingue la regla de la spec 000 de la nueva').toBe(true);
});

test.describe('RF-12 · sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('las palabras de filosofía se ven a opacidad completa', async ({ page }) => {
    await page.goto('/');
    const statementEl = page.locator('.philosophy__statement');
    await statementEl.scrollIntoViewIfNeeded();
    const state = await statementEl.evaluate((el) => {
      const words = [...el.querySelectorAll('.w')].map((w) => Number(window.getComputedStyle(w).opacity));
      return { opacity: Number(window.getComputedStyle(el).opacity), words, text: el.textContent.trim().length };
    });
    expect(state.text).toBeGreaterThan(20);
    expect(state.opacity).toBe(1);
    expect(state.words.every((o) => o === 1)).toBe(true);
  });
});

/* ── Revelado de titulares (RF-11, RF-14 a RF-17) ─────────────────────────────────────────────────── */

const SECTIONS = ['filosofia', 'proyectos', 'servicios', 'proceso', 'contacto'];
const titleOf = (id) => `#${id} [data-reveal]`;

/* Líneas reales del titular en este momento: rectángulos de un Range sobre su contenido, agrupados por su
   borde superior (tolerancia de 1 px). */
const measureLines = (page, id) =>
  page.evaluate((sel) => {
    const range = document.createRange();
    range.selectNodeContents(document.querySelector(sel));
    const tops = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1).map((r) => r.top);
    tops.sort((a, b) => a - b);
    let lines = 0;
    let last = -Infinity;
    for (const top of tops) {
      if (top - last > 1) {
        lines += 1;
        last = top;
      }
    }
    return lines;
  }, titleOf(id));

/* Primer scroll en el que el titular cumple la condición de revelado (cortina en 1 y borde superior por
   encima del 85 % del alto), limitado al final de la página. */
async function revealPoint(page, id) {
  const { end, maxScroll } = await curtainRangeOf(page, id);
  const { top, vh } = await page.evaluate(
    (sel) => ({ top: document.querySelector(sel).getBoundingClientRect().top + window.scrollY, vh: window.innerHeight }),
    titleOf(id),
  );
  return Math.min(Math.floor(maxScroll), Math.ceil(Math.max(end, top - 0.85 * vh + 2)));
}

/* Caja del titular y posición del elemento que le sigue, en coordenadas de documento. */
const layoutOf = (page, id) =>
  page.evaluate((sel) => {
    const h = document.querySelector(sel);
    const next = h.nextElementSibling ?? h.parentElement.nextElementSibling;
    const r = h.getBoundingClientRect();
    return { top: r.top + window.scrollY, height: r.height, next: next.getBoundingClientRect().top + window.scrollY };
  }, titleOf(id));

/* Nombre accesible del titular (árbol de accesibilidad de Playwright), con los espacios normalizados. */
async function accessibleName(page, id) {
  const snapshot = await page.locator(titleOf(id)).ariaSnapshot();
  return snapshot.replace(/\s+/g, ' ').trim();
}

/* Lleva la página a y y, en cuanto aparecen las máscaras, devuelve su número, las animaciones (inicio y
   fin planificado medidos desde el scroll que cumple la condición), el texto visible y la caja del titular
   y del siguiente elemento. */
const trigger = (page, id, y) =>
  page.evaluate(
    async ({ sel, top }) => {
      const h = document.querySelector(sel);
      const t0 = window.performance.now();
      window.scrollTo({ top, behavior: 'instant' });
      while (!h.querySelector('.ln') && window.performance.now() - t0 < 3000) {
        await new Promise((r) => requestAnimationFrame(r));
      }
      const masks = h.querySelectorAll('.ln').length;
      const animations = await Promise.all(
        h.getAnimations({ subtree: true }).map(async (a) => {
          await a.ready;
          const { delay, duration, endTime } = a.effect.getComputedTiming();
          return { name: a.animationName, start: a.startTime - t0, end: a.startTime - t0 + endTime, delay, duration };
        }),
      );
      const next = h.nextElementSibling ?? h.parentElement.nextElementSibling;
      const r = h.getBoundingClientRect();
      return {
        masks,
        animations: animations.sort((a, b) => a.delay - b.delay),
        text: h.innerText.replace(/\s+/g, ' ').trim(),
        layout: { top: r.top + window.scrollY, height: r.height, next: next.getBoundingClientRect().top + window.scrollY },
      };
    },
    { sel: titleOf(id), top: y },
  );

/* Espera a que el titular termine su revelado y vuelva a ser texto normal. */
async function revealDone(page, id) {
  await expect
    .poll(() => titleState(page, id), `${id}: revelado terminado`)
    .toEqual({ pending: false, revealing: false, clipPath: 'none', masks: 0 });
}

/* Lleva el titular justo antes de su condición (sigue pendiente), mide sus líneas y lo revela. */
async function revealTitle(page, id) {
  const y = await revealPoint(page, id);
  await scrollToY(page, y - 4);
  expect(await titleState(page, id), `${id}: pendiente justo antes de la condición`).toMatchObject(HIDDEN);
  const lines = await measureLines(page, id);
  const result = await trigger(page, id, y);
  return { lines, ...result };
}

/* Comprueba los tiempos de escritorio: escalonado de 80–120 ms y fin ≤ 900 ms desde el scroll que cumple la
   condición (RF-14), con el arranque incluido: no hay un límite aparte para la latencia de arranque. */
function expectDesktopTiming(id, { masks, animations }) {
  expect(animations.length, `${id}: una animación por máscara`).toBe(masks);
  expect(animations.every((a) => a.name === 'hero-line'), `${id}: animación hero-line`).toBe(true);
  for (let i = 1; i < animations.length; i += 1) {
    const step = animations[i].delay - animations[i - 1].delay;
    expect(step, `${id}: escalonado entre las líneas ${i} y ${i + 1}`).toBeGreaterThanOrEqual(80);
    expect(step, `${id}: escalonado entre las líneas ${i} y ${i + 1}`).toBeLessThanOrEqual(120);
  }
  expect(Math.min(...animations.map((a) => a.start)), `${id}: arranca después del scroll`).toBeGreaterThanOrEqual(0);
  expect(Math.max(...animations.map((a) => a.end)), `${id}: fin del revelado desde el scroll`).toBeLessThanOrEqual(900);
}

const desktopOnly = (testInfo) => test.skip(testInfo.project.name !== 'escritorio', 'Se prueba en escritorio');
const mobileOnly = (testInfo) => test.skip(testInfo.project.name !== 'movil', 'Se prueba en móvil');

test('RF-14 · 1440×900 · cada titular se revela línea a línea: máscaras = líneas, escalonado 80–120 ms y fin ≤ 900 ms', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = await open(page);
  const counts = {};
  for (const id of SECTIONS) {
    expect(await titleState(page, id), `${id}: pendiente al cargar`).toMatchObject({ pending: true });
    const result = await revealTitle(page, id);
    counts[id] = result.lines;
    expect(result.masks, `${id}: máscaras = líneas medidas justo antes`).toBe(result.lines);
    expectDesktopTiming(id, result);
    await revealDone(page, id);
  }
  expect(counts.filosofia, 'un titular de una línea se revela como un bloque').toBe(1);
  expect(Math.max(...Object.values(counts)), 'hay titulares de varias líneas').toBeGreaterThan(1);
  expect(errors).toEqual([]);
});

/* Cambios antes del revelado. Con 1100 px o con el texto al 125 % los titulares conservan su número de
   líneas; el tercer caso lo cambia y prueba que las líneas se recalculan. */
for (const change of [
  { name: 'ancho de 1440 a 1100 px', width: 1100 },
  { name: 'tamaño de texto al 125 %', fontSize: '125%' },
  { name: 'ancho de 1100 px y texto al 200 %', width: 1100, fontSize: '200%', changes: true },
]) {
  test(`RF-14 · ${change.name} antes del revelado: las máscaras son las líneas de ese momento`, async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    const errors = await open(page);
    const before = {};
    for (const id of SECTIONS) before[id] = await measureLines(page, id);
    if (change.width) await page.setViewportSize({ width: change.width, height: 900 });
    if (change.fontSize) await page.evaluate((size) => (document.documentElement.style.fontSize = size), change.fontSize);
    let changed = false;
    for (const id of SECTIONS) {
      const result = await revealTitle(page, id);
      expect(result.masks, `${id}: máscaras = líneas medidas justo antes`).toBe(result.lines);
      expectDesktopTiming(id, result);
      if (result.lines !== before[id]) changed = true;
      await revealDone(page, id);
    }
    if (change.changes) expect(changed, 'el cambio altera el número de líneas de algún titular').toBe(true);
    expect(errors).toEqual([]);
  });
}

/* Más de 6 líneas solo se da con ventanas de escritorio estrechas y texto muy grande: con 800 px y el
   texto al 400 %, Servicios y Contacto ocupan 7 líneas (con el 200 % ningún titular pasa de 4). */
test('RF-14 · titulares de más de 6 líneas (800 px, texto al 400 %): 6 máscaras y fin ≤ 900 ms', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.setViewportSize({ width: 800, height: 900 });
  const errors = await open(page);
  await page.evaluate(() => (document.documentElement.style.fontSize = '400%'));
  for (const id of ['servicios', 'contacto']) {
    const result = await revealTitle(page, id);
    expect(result.lines, `${id}: el titular ocupa más de 6 líneas`).toBeGreaterThan(6);
    expect(result.masks, `${id}: de la 6.ª línea en adelante, en la misma máscara`).toBe(6);
    expectDesktopTiming(id, result);
    await revealDone(page, id);
  }
  expect(errors).toEqual([]);
});

test('RF-15 · móvil · cada titular se revela en un bloque: 1 máscara, sin escalonado, ≤ 600 ms', async ({ page }, testInfo) => {
  mobileOnly(testInfo);
  const errors = await open(page);
  let multiline = 0;
  for (const id of SECTIONS) {
    expect(await titleState(page, id), `${id}: pendiente al cargar`).toMatchObject({ pending: true });
    const { lines, masks, animations } = await revealTitle(page, id);
    if (lines > 1) multiline += 1;
    expect(masks, `${id}: una sola máscara (${lines} líneas)`).toBe(1);
    expect(animations.map((a) => a.name), `${id}: una animación hero-line`).toEqual(['hero-line']);
    expect(animations[0].delay, `${id}: sin escalonado`).toBe(0);
    expect(animations[0].start, `${id}: arranca después del scroll`).toBeGreaterThanOrEqual(0);
    expect(animations[0].end, `${id}: fin ≤ 600 ms desde el scroll`).toBeLessThanOrEqual(600);
    await revealDone(page, id);
  }
  expect(multiline, 'hay titulares de varias líneas en móvil').toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('RF-16 · cada titular se revela una vez: HTML original, sin animaciones al subir y bajar ni tras cambiar el ancho', async ({ page }, testInfo) => {
  const errors = await open(page);
  const html = await page.evaluate((ids) => ids.map((id) => document.querySelector(`#${id} [data-reveal]`).innerHTML), SECTIONS);
  for (const id of SECTIONS) {
    await revealTitle(page, id);
    await revealDone(page, id);
  }
  const titlesState = () =>
    page.evaluate((ids) => {
      const titles = ids.map((id) => document.querySelector(`#${id} [data-reveal]`));
      return {
        html: titles.map((h) => h.innerHTML),
        classes: titles.map((h) => h.className),
        masks: document.querySelectorAll('[data-reveal] .ln').length,
        animations: titles.flatMap((h) => h.getAnimations({ subtree: true })).length,
      };
    }, SECTIONS);
  const final = await titlesState();
  expect(final.html, 'HTML original tras revelar').toEqual(html);
  expect(final.masks).toBe(0);

  // Subir hasta arriba (las cortinas se cierran) y volver a bajar por cada titular: nada se vuelve a animar
  await scrollToY(page, 0);
  for (const id of SECTIONS) {
    await scrollToY(page, await revealPoint(page, id));
    await waitCurtainApplied(page, id);
    expect(await titlesState(), `${id}: sin animaciones nuevas`).toEqual(final);
  }

  // Tras revelar, un cambio de ancho recoloca el texto sin máscaras ni animaciones
  const width = testInfo.project.name === 'escritorio' ? 1100 : 360;
  await page.setViewportSize({ width, height: await page.evaluate(() => window.innerHeight) });
  await scrollSettled(page);
  expect(await titlesState(), 'tras cambiar el ancho').toEqual(final);
  expect(errors).toEqual([]);
});

test('RF-17 · nombre accesible, altura del titular y siguiente elemento iguales antes, durante y después', async ({ page }) => {
  const errors = await open(page);
  for (const id of SECTIONS) {
    const y = await revealPoint(page, id);
    await scrollToY(page, y - 4);
    const name = await accessibleName(page, id);
    const text = await page.evaluate((sel) => document.querySelector(sel).innerText.replace(/\s+/g, ' ').trim(), titleOf(id));
    expect(name, `${id}: un único titular de nivel 2`).toMatch(/^- heading ".+" \[level=2\]$/);
    const before = await layoutOf(page, id);

    const during = await trigger(page, id, y);
    expect(during.masks, `${id}: revelándose`).toBeGreaterThan(0);
    const nameDuring = await accessibleName(page, id);
    expect((await titleState(page, id)).revealing, `${id}: nombre leído durante el revelado`).toBe(true);
    expect(nameDuring, `${id}: nombre accesible durante`).toBe(name);
    expect(during.text, `${id}: texto durante`).toBe(text);
    for (const key of ['top', 'height', 'next']) {
      expect(Math.abs(during.layout[key] - before[key]), `${id}: ${key} durante (±1 px)`).toBeLessThanOrEqual(1);
    }

    await revealDone(page, id);
    expect(await accessibleName(page, id), `${id}: nombre accesible después`).toBe(name);
    const after = await layoutOf(page, id);
    for (const key of ['top', 'height', 'next']) {
      expect(Math.abs(after[key] - before[key]), `${id}: ${key} después (±1 px)`).toBeLessThanOrEqual(1);
    }
  }
  expect(errors).toEqual([]);
});

test('RF-11 · 1440×2400 · al final de la página el titular de Contacto está revelado o revelándose', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.setViewportSize({ width: 1440, height: 2400 });
  const errors = await open(page);
  expect(await titleState(page, 'contacto'), 'pendiente al cargar').toMatchObject({ pending: true });
  const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  await scrollToY(page, maxScroll);
  await expect.poll(async () => (await titleState(page, 'contacto')).pending, 'revelado o revelándose').toBe(false);
  await revealDone(page, 'contacto');
  expect(errors).toEqual([]);
});
