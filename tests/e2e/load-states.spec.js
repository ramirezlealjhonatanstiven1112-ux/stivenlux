import { test, expect } from '@playwright/test';
import { open, animationsDone, scrollToY, heroLayers, curtainRangeOf, scrollToCurtain, waitCurtainApplied, scrollSettled, frame, loadSettled } from './support/motion.js';

// Estados finales y de carga de la spec 001: movimiento reducido, sin JavaScript, script bloqueado o tardío,
// impresión, recarga a mitad de página y URL con ancla. Cada test indica el RF de
// specs/001-hero-y-transiciones/spec.md. Se ejecutan en `escritorio` (1440×900) y en `movil` (Pixel 7 de
// Playwright: 412×839) salvo que se indique; las medidas leen innerWidth/innerHeight.

const SECTIONS = ['filosofia', 'proyectos', 'servicios', 'proceso', 'contacto'];

/* Todo lo que esta spec puede ocultar, leído del navegador (estilos calculados, no clases):
   - marcos de cortina: sin ::before o con grosor 0 en los cuatro lados;
   - titulares: sin recorte, opacidad 1 y sin máscaras;
   - palabras de filosofía (y el texto que las contiene) a opacidad 1;
   - animaciones en curso en toda la página. */
const finalState = (page) =>
  page.evaluate((ids) => {
    const px = (v) => parseFloat(v) || 0;
    const frames = ids.map((id) => {
      const before = window.getComputedStyle(document.getElementById(id), '::before');
      const width = Math.max(...['--ft', '--fr', '--fb', '--fl'].map((p) => px(before.getPropertyValue(p))));
      return { id, framed: before.content !== 'none' && width > 0.5 };
    });
    const titles = ids.map((id) => {
      const h = document.querySelector(`#${id} [data-reveal]`);
      const { clipPath, opacity } = window.getComputedStyle(h);
      return { id, hidden: clipPath !== 'none' || opacity !== '1' || h.querySelectorAll('.ln').length > 0 };
    });
    // Sin el script las palabras no se separan: cuenta la opacidad del texto entero
    const statement = document.querySelector('.philosophy__statement');
    const words = [...statement.querySelectorAll('.w')].map((w) => Number(window.getComputedStyle(w).opacity));
    words.push(Number(window.getComputedStyle(statement).opacity));
    return {
      framed: frames.filter((f) => f.framed).map((f) => f.id),
      hiddenTitles: titles.filter((t) => t.hidden).map((t) => t.id),
      words: words.length,
      dimWords: words.filter((o) => o !== 1).length,
      running: document.getAnimations().filter((a) => a.playState === 'running').length,
    };
  }, SECTIONS);

const FINAL = { framed: [], hiddenTitles: [], dimWords: 0 };

/* Desplaza al instante sin esperar fotogramas (sin JavaScript no hay requestAnimationFrame); los estilos
   y las cajas se leen después, con el layout ya actualizado. */
const jump = (page, y) => page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);

/* Recorre la página (hero con salida 0,5 y 1, y cada sección en el centro de la ventana) y comprueba en
   cada parada el estado final y que los dispositivos del hero están en su composición de reposo. */
async function expectFinalWhileScrolling(page, { animations = false } = {}) {
  await jump(page, 0);
  const rest = await heroLayers(page);
  expect(Object.keys(rest).length).toBeGreaterThanOrEqual(2);
  const vh = await page.evaluate(() => window.innerHeight);
  const stops = [Math.round(vh * 0.5), vh];
  for (const id of SECTIONS) {
    stops.push(await page.evaluate((sectionId) => {
      const r = document.getElementById(sectionId).getBoundingClientRect();
      return Math.max(0, Math.round(r.top + window.scrollY - window.innerHeight / 2));
    }, id));
  }
  for (const y of stops) {
    await jump(page, y);
    expect(await finalState(page), `estado final en y = ${y}`).toMatchObject(FINAL);
    // Movimiento reducido: el cambio de tono de la barra (spec 000) dura 0,01 ms; nada sigue en curso
    if (animations) await expect.poll(async () => (await finalState(page)).running, `animaciones en curso en y = ${y}`).toBe(0);
    // Reposo respecto a la caja del hero (±1 px) y sin escala
    const layers = await heroLayers(page);
    for (const [name, layer] of Object.entries(layers)) {
      expect(Math.abs(layer.scale - 1), `${name}: escala en y = ${y}`).toBeLessThanOrEqual(0.001);
      expect(Math.abs(layer.x - rest[name].x), `${name}: x en y = ${y}`).toBeLessThanOrEqual(1);
      expect(Math.abs(layer.y - rest[name].y), `${name}: y en y = ${y}`).toBeLessThanOrEqual(1);
    }
  }
}

/* Espera a que terminen las animaciones de la entrada del hero. */
const heroDone = (page) => animationsDone(page);

test.describe('RF-18 · movimiento reducido', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('hero en reposo con cualquier scroll, sin marco, titulares y palabras finales y 0 animaciones', async ({ page }) => {
    const errors = await open(page);
    await expectFinalWhileScrolling(page, { animations: true });
    // Ningún marco existe (no solo grosor 0) y el script no ha escrito progresos
    for (const id of SECTIONS) expect((await frame(page, id)).content, `${id}: sin ::before`).toBe('none');
    const written = await page.evaluate(() =>
      [...document.querySelectorAll('[data-curtain], .hero, .philosophy__statement')].filter((el) =>
        ['--c', '--w', '--hero-p'].some((p) => el.style.getPropertyValue(p) !== ''),
      ).length,
    );
    expect(written).toBe(0);
    expect(errors).toEqual([]);
  });
});

test.describe('RF-20 · sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('todo en estado final y los CTA funcionan como en la spec 000', async ({ page }) => {
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.className)).toBe('');
    await expectFinalWhileScrolling(page);
    for (const id of SECTIONS) expect((await frame(page, id)).content, `${id}: sin ::before`).toBe('none');
    await expect(page.locator('.hero__device--back')).toHaveCSS('opacity', '1');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const hrefs = await page.locator('[data-whatsapp]').evaluateAll((links) => links.map((a) => a.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThanOrEqual(4);
    expect(new Set(hrefs)).toEqual(new Set(['#contacto']));
    await expect(page.getByRole('link', { name: 'Ver proyectos' })).toHaveAttribute('href', '#proyectos');
  });
});

test('RF-19 y RF-20 · con el módulo bloqueado, pasados 2,5 s el hero se ve y todo está en estado final', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'escritorio', 'Se prueba a 1440×900');
  await page.route('**/assets/*.js', (route) => route.abort());
  await page.goto('/');
  // Antes de la red de seguridad nada nuevo oculta contenido fuera del hero
  expect(await finalState(page)).toMatchObject(FINAL);
  await page.waitForFunction(() => document.documentElement.classList.contains('is-ready'), null, { timeout: 4000 });
  await heroDone(page);
  for (const sel of ['.hero__title .line > span', '.hero__lead', '.hero__actions', '.hero__device--back', '.hero__device--front']) {
    await expect(page.locator(sel).first(), sel).toHaveCSS('opacity', '1');
  }
  await expectFinalWhileScrolling(page);
});

test('RF-19 · con el módulo retrasado 3 s y la página en Servicios, lo visto queda final y las cortinas siguen la posición', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'escritorio', 'Se prueba a 1440×900');
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let release;
  const held = new Promise((r) => (release = r));
  await page.route('**/assets/*.js', async (route) => {
    await held;
    await route.continue();
  });
  const started = Date.now();
  await page.goto('/', { waitUntil: 'commit' });
  await page.waitForSelector('#contacto', { state: 'attached' });
  await page.evaluate(() => document.fonts.ready);
  const target = await page.evaluate(() => Math.round(document.getElementById('servicios').getBoundingClientRect().top + window.scrollY));
  await scrollToY(page, target);

  // Antes del script: estado de la spec 000 y nada nuevo oculto
  expect(await finalState(page)).toMatchObject(FINAL);
  await page.waitForTimeout(Math.max(0, 3000 - (Date.now() - started)));
  expect(await page.evaluate(() => document.documentElement.classList.contains('is-ready')), 'red de seguridad').toBe(true);

  // Registro de cambios de clase y de contenido de los titulares desde ahora
  const seen = await page.evaluate(() => {
    window.__titleLog = [];
    const observer = new window.MutationObserver((records) => {
      for (const r of records) {
        const h = r.target.closest?.('[data-reveal]');
        if (h) window.__titleLog.push({ id: h.closest('section').id, cls: h.className, masks: h.querySelectorAll('.ln').length });
      }
    });
    for (const h of document.querySelectorAll('[data-reveal]')) {
      observer.observe(h, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
    }
    return [...document.querySelectorAll('[data-reveal]')]
      .filter((h) => h.getBoundingClientRect().top < window.innerHeight)
      .map((h) => h.closest('section').id);
  });
  expect(seen).toEqual(['filosofia', 'proyectos', 'servicios']);
  expect(await page.evaluate(() => window.scrollY)).toBe(target);
  release();

  await page.waitForFunction(() => document.querySelector('.hero').style.getPropertyValue('--hero-p') !== '');
  // Hasta el asentamiento (≤ 1 s desde el script) nada queda pendiente; después, solo lo de abajo
  await loadSettled(page);
  await scrollSettled(page);
  expect(await page.evaluate(() => window.scrollY)).toBe(target);
  // Salida del hero según la posición
  expect(await page.evaluate(() => document.querySelector('.hero').style.getPropertyValue('--hero-p'))).toBe('1.0000');
  // Cortinas de todas las secciones (también las vistas) en el estado de la posición
  for (const id of SECTIONS) await waitCurtainApplied(page, id);
  // Lo visto: final, sin animación ni parpadeo; lo de abajo, pendiente de revelado
  const state = await page.evaluate((ids) =>
    ids.map((id) => {
      const h = document.querySelector(`#${id} [data-reveal]`);
      return {
        id,
        pending: h.classList.contains('is-pending'),
        clipPath: window.getComputedStyle(h).clipPath,
        animations: h.getAnimations({ subtree: true }).length,
      };
    }), SECTIONS);
  for (const t of state) {
    if (seen.includes(t.id)) expect(t, `${t.id}: visto, estado final`).toEqual({ id: t.id, pending: false, clipPath: 'none', animations: 0 });
    else expect(t.pending, `${t.id}: por debajo, pendiente`).toBe(true);
  }
  const log = await page.evaluate(() => window.__titleLog);
  expect(log.filter((entry) => seen.includes(entry.id)), 'cambios en titulares vistos').toEqual([]);
  // Las palabras de Filosofía (vista al asentarse) siguen a opacidad completa: la sección ya está por encima
  expect((await finalState(page)).dimWords).toBe(0);
  expect(errors).toEqual([]);
});

test('RF-20 · al imprimir, con una cortina a 0,5 y titulares pendientes, todo está en estado final', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'escritorio', 'Se prueba a 1440×900');
  const errors = await open(page);
  await heroDone(page);
  // Cortina de Filosofía a 0,5: salida del hero > 0, marco visible, 5 titulares pendientes, palabras al mínimo
  expect(await scrollToCurtain(page, 'filosofia', 0.5)).toBeCloseTo(0.5, 2);
  const before = await finalState(page);
  expect(before.framed).toContain('filosofia');
  expect(before.hiddenTitles).toEqual(SECTIONS);
  expect(before.dimWords).toBe(before.words - 1); // todas las palabras al mínimo (el contenedor, a 1)
  const moved = await heroLayers(page);
  expect(Object.values(moved).some((l) => l.transform !== 'none' && Math.abs(l.scale - 1) > 0.01)).toBe(true);

  await page.emulateMedia({ media: 'print' });
  const printed = await finalState(page);
  expect(printed).toMatchObject(FINAL);
  for (const id of SECTIONS) expect((await frame(page, id)).content, `${id}: sin marco`).toBe('none');
  const layers = await heroLayers(page);
  for (const [name, layer] of Object.entries(layers)) expect(layer.transform, `${name}: en reposo`).toBe('none');
  expect(errors).toEqual([]);
});

/* Impresión con estados a medias (RF-20, cambio de requisitos de T9). Se prueban a 1440×900. */
const printOnly = (testInfo) => test.skip(testInfo.project.name !== 'escritorio', 'Se prueba a 1440×900');

test('RF-20 · al imprimir con la cortina de Proyectos a 0,9, el primer escenario se ve completo, sin recorte', async ({ page }, testInfo) => {
  printOnly(testInfo);
  const errors = await open(page);
  expect(await scrollToCurtain(page, 'proyectos', 0.9)).toBeCloseTo(0.9, 2);
  const stage = () =>
    page.evaluate(() => {
      const el = document.querySelector('.project__stage');
      return { e: parseFloat(window.getComputedStyle(el).getPropertyValue('--e')), clipPath: window.getComputedStyle(el).clipPath };
    });
  await expect.poll(stage, 'en pantalla: estado inicial (RF-13)').toEqual({ e: 0, clipPath: 'inset(7% 5%)' });

  await page.emulateMedia({ media: 'print' });
  expect((await stage()).clipPath, 'impreso: sin recorte').toBe('none');
  const clipped = await page.$$eval('.project__stage', (stages) => stages.filter((el) => window.getComputedStyle(el).clipPath !== 'none').length);
  expect(clipped, 'ningún escenario recortado al imprimir').toBe(0);
  expect(errors).toEqual([]);
});

test('RF-20 · al imprimir tras inclinar el hero con el ratón, la escena sale sin rotación', async ({ page }, testInfo) => {
  printOnly(testInfo);
  const errors = await open(page);
  await heroDone(page);
  const transform = () => page.evaluate(() => window.getComputedStyle(document.querySelector('[data-hero-stage]')).transform);
  const neutral = await page.evaluate(() => new window.DOMMatrix('perspective(2400px)').toString());
  await page.mouse.move(720, 450);
  await page.mouse.move(150, 150, { steps: 5 });
  await expect.poll(async () => (await transform()) !== neutral && (await transform()) !== 'none', 'inclinada').toBe(true);
  await animationsDone(page, '[data-hero-stage]');
  const tilted = await page.evaluate(() => {
    const m = new window.DOMMatrix(window.getComputedStyle(document.querySelector('[data-hero-stage]')).transform);
    return Math.max(Math.abs(m.m13), Math.abs(m.m23), Math.abs(m.m31), Math.abs(m.m32));
  });
  expect(tilted, 'inclinación de partida').toBeGreaterThan(0.01);

  await page.emulateMedia({ media: 'print' });
  // Al instante (sin transición al cambiar de medio)
  expect(await transform(), 'impreso: escena sin transformar').toBe('none');
  expect(errors).toEqual([]);
});

test('RF-20 · al imprimir un titular a medio revelar, todas sus líneas salen en su sitio y con opacidad 1', async ({ page }, testInfo) => {
  printOnly(testInfo);
  const errors = await open(page);
  // Servicios: varias líneas a 1440 px (revelado de 880 ms)
  const { end, maxScroll } = await curtainRangeOf(page, 'servicios');
  const top = await page.evaluate(() => document.querySelector('#servicios [data-reveal]').getBoundingClientRect().top + window.scrollY);
  const y = Math.min(Math.floor(maxScroll), Math.ceil(Math.max(end, top - 0.85 * 900 + 2)));
  await scrollToY(page, y - 4);
  expect(await page.evaluate(() => document.querySelector('#servicios [data-reveal]').classList.contains('is-pending'))).toBe(true);

  // Dispara el revelado y vuelve en cuanto aparecen las máscaras, con las líneas aún desplazadas
  const start = await page.evaluate(async (target) => {
    const h = document.querySelector('#servicios [data-reveal]');
    const t0 = window.performance.now();
    window.scrollTo({ top: target, behavior: 'instant' });
    while (!h.querySelector('.ln') && window.performance.now() - t0 < 3000) await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));
    return {
      masks: h.querySelectorAll('.ln').length,
      moved: [...h.querySelectorAll('.ln > span')].filter((span) => window.getComputedStyle(span).transform !== 'none').length,
    };
  }, y);
  expect(start.masks, 'varias máscaras').toBeGreaterThan(1);
  expect(start.moved, 'líneas desplazadas antes de imprimir').toBe(start.masks);

  await page.emulateMedia({ media: 'print' });
  const printed = await page.evaluate(() => {
    const h = document.querySelector('#servicios [data-reveal]');
    return {
      revealing: h.classList.contains('is-revealing'),
      clipPath: window.getComputedStyle(h).clipPath,
      lines: [...h.querySelectorAll('.ln')].map((ln) => {
        const span = ln.firstElementChild;
        const style = window.getComputedStyle(span);
        return {
          transform: style.transform,
          opacity: style.opacity,
          offset: Math.round(span.getBoundingClientRect().top - ln.getBoundingClientRect().top),
        };
      }),
    };
  });
  expect(printed.revealing, 'sigue a medio revelar al imprimir').toBe(true);
  expect(printed.clipPath).toBe('none');
  expect(printed.lines.length).toBe(start.masks);
  for (const [i, line] of printed.lines.entries()) {
    expect(line, `línea ${i + 1}`).toEqual({ transform: 'none', opacity: '1', offset: 0 });
  }
  expect(errors).toEqual([]);
});

/* Recarga a mitad de página y URL con ancla (RF-16, RF-19). En Chromium la restauración del scroll y el salto
   al ancla llegan DESPUÉS de ejecutarse el módulo principal (y, con `scroll-behavior: smooth`, de forma
   suave): por eso lo «visto» se decide al asentarse la carga (plan 001, decisión 9). */

/* Registra desde el primer instante de cada carga cualquier titular que llegue a estar pendiente o
   revelándose (clase o máscaras), con su sección. */
const LOG_TITLES = () => {
  window.__titleLog = [];
  new window.MutationObserver((records) => {
    for (const r of records) {
      const h = r.target.closest?.('[data-reveal]');
      if (h && (/\bis-(pending|revealing)\b/.test(h.className) || h.querySelector('.ln'))) {
        window.__titleLog.push({ id: h.closest('section').id, pending: h.classList.contains('is-pending'), t: window.performance.now() });
      }
    }
  }).observe(document, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
};

/* Titulares vistos ahora (al menos 1 px dentro de la ventana o por encima) y los que alguna vez estuvieron
   pendientes o revelándose en esta carga. */
const seenAndTouched = (page) =>
  page.evaluate(() => {
    const ids = [...document.querySelectorAll('[data-reveal]')];
    const seen = ids.filter((h) => h.getBoundingClientRect().top < window.innerHeight).map((h) => h.closest('section').id);
    const [nav] = window.performance.getEntriesByType('navigation');
    // Primer instante en que cada titular quedó pendiente, relativo a domContentLoadedEventStart
    const pendingAt = {};
    for (const { id, pending, t } of window.__titleLog) {
      if (pending && !(id in pendingAt)) pendingAt[id] = Math.round(t - nav.domContentLoadedEventStart);
    }
    return {
      seen,
      below: ids.map((h) => h.closest('section').id).filter((id) => !seen.includes(id)),
      touched: [...new Set(window.__titleLog.map((entry) => entry.id))],
      pending: [...document.querySelectorAll('[data-reveal].is-pending')].map((h) => h.closest('section').id),
      pendingAt,
    };
  });

/* Comprobaciones comunes de la carga: lo visto nunca estuvo pendiente, recortado ni animado; lo de abajo
   quedó pendiente como muy tarde 1.100 ms después de domContentLoadedEventStart (el script se ejecuta antes
   de ese evento y el tope es 1 s desde el script; 100 ms de margen de medida); cortinas según la posición. */
async function expectLoadSettled(page, errors) {
  await loadSettled(page);
  await scrollSettled(page);
  const { seen, below, touched, pending, pendingAt } = await seenAndTouched(page);
  expect(seen).toEqual(expect.arrayContaining(['filosofia', 'proyectos', 'servicios']));
  expect(touched.filter((id) => seen.includes(id)), 'titulares vistos que estuvieron pendientes o se animaron').toEqual([]);
  expect(pending.filter((id) => seen.includes(id))).toEqual([]);
  expect(await page.evaluate(() => document.querySelectorAll('[data-reveal] .ln').length), 'máscaras').toBe(0);
  expect(below.length, 'hay titulares por debajo de la ventana').toBeGreaterThan(0);
  expect(pending, 'los de debajo, pendientes').toEqual(below);
  for (const id of below) {
    expect(pendingAt[id], `${id}: ms desde domContentLoadedEventStart hasta quedar pendiente`).toBeLessThanOrEqual(1100);
  }
  for (const id of SECTIONS) await waitCurtainApplied(page, id);
  expect(errors).toEqual([]);
}

test('RF-16 y RF-19 · al recargar a mitad de página, los titulares vistos quedan finales sin animación', async ({ page }) => {
  const errors = await open(page);
  const { start, end } = await curtainRangeOf(page, 'servicios');
  const y = Math.round(end + 100); // Servicios a la vista con su cortina en 1
  expect(start).toBeGreaterThan(0);
  await scrollToY(page, y);
  await scrollSettled(page);
  await page.addInitScript(LOG_TITLES);
  await page.reload();
  await page.waitForFunction(() => document.documentElement.classList.contains('is-ready'));
  await expectLoadSettled(page, errors);
  const restored = await page.evaluate(() => window.scrollY);
  expect(Math.abs(restored - y), `scroll restaurado (${restored} frente a ${y})`).toBeLessThanOrEqual(2);
});

test('RF-16 y RF-19 · con la URL /#servicios, los titulares vistos quedan finales sin animación', async ({ page }) => {
  await page.addInitScript(LOG_TITLES);
  const errors = await open(page, '/#servicios');
  await expectLoadSettled(page, errors);
  // El ancla deja la sección arriba, bajo la barra fija (scroll-padding-top). No se exige ±2 px: si las
  // fuentes llegan después de que Chromium calcule el destino del salto suave, la página se acorta y el salto
  // termina hasta ~100 px más abajo (comportamiento del navegador, ajeno al asentamiento)
  const { offset, vh } = await page.evaluate(() => ({
    offset: document.getElementById('servicios').getBoundingClientRect().top - parseFloat(window.getComputedStyle(document.documentElement).scrollPaddingTop),
    vh: window.innerHeight,
  }));
  expect(Math.abs(offset), 'Servicios arriba de la ventana, bajo la barra').toBeLessThanOrEqual(vh * 0.25);
});
