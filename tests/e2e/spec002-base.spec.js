import { test, expect } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { animationsDone, heroEntranceDone, open, scrollToY } from './support/motion.js';
import { FINGERPRINT_PATH_FN, clsRoute, fingerprintDiff, styleFingerprint, tabOrder } from './support/pointer.js';

// Spec 002 · comparaciones con la base 0f6b12d (spec 001 implementada): huella de estilos en reposo en táctil
// (RF-16, RF-20), hovers y página sin JS en escritorio (RF-17), cursor del sistema (RF-5), orden de tabulación
// (RF-19) y CLS del recorrido de la spec (RNF estabilidad).
//
// Los datos están en tests/e2e/fixtures/spec002-base.json y NO se vuelven a generar después de T1. Se
// generaron sobre un build limpio de 0f6b12d (worktree aparte), en dos pasadas, con
//   SPEC002_BASE=write SPEC002_BASE_OUT=<carpeta> npx playwright test tests/e2e/spec002-base.spec.js
// (cada test escribe su parte en <carpeta>/<clave>.json) y se unieron tras comprobar que las dos pasadas
// coincidían. Sin SPEC002_BASE, cada test compara con el archivo.

const WRITE = process.env.SPEC002_BASE === 'write';
const FIXTURE = 'tests/e2e/fixtures/spec002-base.json';

let fixture = null;
function base(key) {
  if (!fixture) {
    expect(existsSync(FIXTURE), `falta ${FIXTURE} (datos de la base 0f6b12d)`).toBe(true);
    fixture = JSON.parse(readFileSync(FIXTURE, 'utf8'));
  }
  expect(fixture[key], `${FIXTURE}: falta la clave ${key}`).toBeDefined();
  return fixture[key];
}

/* En modo escritura guarda la medida y devuelve true; en modo comparación devuelve false. */
function record(key, value) {
  if (!WRITE) return false;
  const dir = process.env.SPEC002_BASE_OUT;
  if (!dir) throw new Error('SPEC002_BASE=write necesita SPEC002_BASE_OUT (carpeta de salida)');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${key}.json`), `${JSON.stringify(value, null, 1)}\n`);
  return true;
}

const desktopOnly = (testInfo) => test.skip(testInfo.project.name !== 'escritorio', 'Se prueba en escritorio');
const mobileOnly = (testInfo) => test.skip(testInfo.project.name !== 'movil', 'Se prueba en el proyecto móvil');

/* Comprueba el perfil de puntero de la ventana antes de medir (plan, «Interfaz»). */
async function expectFinePointer(page, fine) {
  expect(await page.evaluate(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches), 'puntero fino').toBe(fine);
}

/* Página en reposo para la huella: con JS, entrada del hero terminada; sin JS, carga y fuentes listas. En los
   dos casos, en y = 0 y sin animaciones en curso. */
async function atRest(page, js) {
  if (js) {
    const errors = await open(page);
    await heroEntranceDone(page);
    await scrollToY(page, 0);
    await animationsDone(page);
    expect(errors).toEqual([]);
  } else {
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe('loaded');
    expect(await page.evaluate(() => document.documentElement.className)).toBe('');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    // Sin JS no hay fotogramas que esperar (MEMORY.md): un margen corto para el pintado de las fuentes
    await page.waitForTimeout(300);
  }
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
}

function expectSameFingerprint(name, baseFp, now) {
  const { missing, extra, changed } = fingerprintDiff(baseFp, now);
  expect({ missing: missing.slice(0, 20), extra: extra.slice(0, 20), changed: changed.slice(0, 20) }, `${name}: huella = base`).toEqual({
    missing: [],
    extra: [],
    changed: [],
  });
}

/* La spec 003 sustituye a propósito las pantallas y los textos de los conceptos (subárboles) y, con ellos, las
   alturas y los colores de unos pocos contenedores (solo el nodo, no sus hijos). La huella de la 002 sigue
   vigilando las capas, los dispositivos y el resto de la página. */
const SPEC003_REPLACED = {
  subtrees: ['.scr', '.device__url', '.work__head', '.project__info'],
  nodes: ['html', 'body', 'main', '.work', '.project', '.project__stage'],
  // Entre 768 y 864 px la 003 desplaza el escenario del hero (RF-19)
  shifted: { min: 768, max: 864, nodes: ['.hero__stage'] },
};

async function replacedBySpec003(page) {
  return page.evaluate(
    ({ pathSrc, subtrees, nodes, shifted }) => {
      const path = new Function(`return ${pathSrc}`)();
      return {
        prefixes: subtrees.flatMap((sel) => [...document.querySelectorAll(sel)].map(path)),
        exact: [...nodes, ...(window.innerWidth >= shifted.min && window.innerWidth <= shifted.max ? shifted.nodes : [])].flatMap((sel) => [...document.querySelectorAll(sel)].map(path)),
      };
    },
    { pathSrc: FINGERPRINT_PATH_FN, ...SPEC003_REPLACED },
  );
}

function withoutReplaced(fp, { prefixes, exact }) {
  const inside = (k) => exact.includes(k.replace(/::.*$/, '')) || prefixes.some((p) => k === p || k.startsWith(`${p}>`) || k.startsWith(`${p}::`));
  return Object.fromEntries(Object.entries(fp).filter(([k]) => !inside(k)));
}

async function fingerprintCase(page, key, js, fine) {
  await atRest(page, js);
  await expectFinePointer(page, fine);
  const fp = await styleFingerprint(page);
  if (record(`huella-${key}`, fp)) return;
  const replaced = await replacedBySpec003(page);
  expectSameFingerprint(key, withoutReplaced(base('huella')[key], replaced), withoutReplaced(fp, replaced));
}

/* ---------- RF-16, RF-20 · huella de estilos en reposo en táctil (con y sin JS) ---------- */

test.describe('RF-16, RF-20 · movil: huella de estilos en reposo = base', () => {
  test('con JS', async ({ page }, testInfo) => {
    mobileOnly(testInfo);
    await fingerprintCase(page, 'movil-js', true, false);
  });

  test.describe('sin JS', () => {
    test.use({ javaScriptEnabled: false });
    test('sin JS', async ({ page }, testInfo) => {
      mobileOnly(testInfo);
      await fingerprintCase(page, 'movil-nojs', false, false);
    });
  });
});

test.describe('RF-16, RF-20 · 844×390 táctil: huella de estilos en reposo = base', () => {
  test.use({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });

  test('con JS', async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await fingerprintCase(page, '844x390-js', true, false);
  });

  test.describe('sin JS', () => {
    test.use({ javaScriptEnabled: false });
    test('sin JS', async ({ page }, testInfo) => {
      desktopOnly(testInfo);
      await fingerprintCase(page, '844x390-nojs', false, false);
    });
  });
});

/* ---------- RF-17 · escritorio sin JS: reposo y hovers como hoy ---------- */

/* Elementos con hover de RF-10, RF-11 y RF-15. El botón del menú no se puede señalar sin JS (el menú no
   se abre): su :hover se fuerza por CDP (CSS.forcePseudoState), que aplica las mismas reglas. */
const HOVERS = {
  'boton-hero': '.hero .btn',
  'ver-proyectos': '.hero .link',
  'iniciar-proyecto': '.nav__cta',
  fila: '.service',
  'boton-contacto': '.contact .btn',
  pie: '.footer__nav a',
  'boton-menu': '.menu .btn',
};

/* Estilo calculado de cada elemento con el puntero encima (1 s después, transiciones terminadas): huella
   del elemento, sus descendientes y sus pseudo-elementos (incluye las transition-*). */
async function hoverStyles(page) {
  const out = {};
  for (const [name, sel] of Object.entries(HOVERS)) {
    const el = page.locator(sel).first();
    if (name === 'boton-menu') {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('DOM.enable');
      await cdp.send('CSS.enable');
      const { root } = await cdp.send('DOM.getDocument');
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel });
      await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] });
      await page.waitForTimeout(1000);
      out[name] = await styleFingerprint(page, sel);
      await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
      await cdp.detach();
      continue;
    }
    await el.evaluate((node) => node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }));
    const box = await el.boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    expect(await el.evaluate((node, [px, py]) => node.contains(document.elementFromPoint(px, py)), [x, y]), `${name}: alcanzable`).toBe(true);
    await page.mouse.move(x, y, { steps: 5 });
    await page.waitForTimeout(1000);
    out[name] = await styleFingerprint(page, sel);
  }
  return out;
}

test.describe('RF-17 · escritorio sin JS', () => {
  test.use({ javaScriptEnabled: false });

  test('huella de estilos en reposo = base', async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await fingerprintCase(page, 'escritorio-nojs', false, true);
  });

  test('hovers (estado final y transiciones) = base', async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await atRest(page, false);
    await expectFinePointer(page, true);
    const now = await hoverStyles(page);
    if (record('hovers-nojs', now)) return;
    const baseHovers = base('hoversSinJs');
    expect(Object.keys(now)).toEqual(Object.keys(baseHovers));
    for (const name of Object.keys(baseHovers)) expectSameFingerprint(`hover ${name}`, baseHovers[name], now[name]);
  });
});

/* ---------- RF-5 · cursor del sistema ---------- */

const CURSOR_TARGETS = { enlace: '.hero .link', 'boton-enlace': '.hero .btn', boton: '.nav__toggle', fila: '.service' };

test('RF-5 · cursor calculado (html, body y con el puntero sobre un enlace, un botón y una fila) = base', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = await open(page);
  await expectFinePointer(page, true);
  await heroEntranceDone(page);
  const read = () =>
    page.evaluate(() => ({
      html: window.getComputedStyle(document.documentElement).cursor,
      body: window.getComputedStyle(document.body).cursor,
    }));
  const now = { reposo: await read() };
  for (const [name, sel] of Object.entries(CURSOR_TARGETS)) {
    const el = page.locator(sel).first();
    await el.evaluate((node) => node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }));
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const box = await el.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
    await page.waitForTimeout(300);
    now[name] = { ...(await read()), elemento: await el.evaluate((node) => window.getComputedStyle(node).cursor) };
  }
  expect(errors).toEqual([]);
  if (record('cursor', now)) return;
  expect(now).toEqual(base('cursor'));
});

/* ---------- RF-19 · orden de tabulación ---------- */

test('RF-19 · orden de tabulación = base', async ({ page }, testInfo) => {
  const errors = await open(page);
  await heroEntranceDone(page);
  const fine = testInfo.project.name === 'escritorio';
  await expectFinePointer(page, fine);
  if (fine && !WRITE) {
    // También con el punto visible (no añade enfocables ni cambia el orden): se muestra moviendo el ratón
    await page.mouse.move(300, 300);
    await page.mouse.move(320, 320);
    await expect.poll(() => page.evaluate(() => !!document.querySelector('.cursor:not(.is-off)'))).toBe(true);
  }
  const order = await tabOrder(page);
  expect(errors).toEqual([]);
  if (record(`tab-${testInfo.project.name}`, order)) return;
  // La spec 004 añade a propósito un enlace «Explorar demo» por proyecto: lo demás sigue igual que la base
  expect(order.filter((el) => !el.label.startsWith('Explorar demo'))).toEqual(base('tabOrder')[testInfo.project.name]);
});

/* ---------- RNF estabilidad · CLS del recorrido ---------- */

test('RNF estabilidad · CLS del recorrido ≤ base', async ({ context }, testInfo) => {
  const profile = testInfo.project.name;
  test.setTimeout(WRITE ? 240_000 : 120_000);
  // La base es el máximo de 3 ejecuciones (plan, riesgo 13); al comparar basta una
  const runs = [];
  for (let i = 0; i < (WRITE ? 3 : 1); i += 1) {
    const page = await context.newPage();
    const run = await clsRoute(page, profile);
    expect(run.errors).toEqual([]);
    runs.push({ cls: run.cls, shifts: run.shifts, visited: run.visited });
    await page.close();
  }
  if (record(`cls-${profile}`, { max: Math.max(...runs.map((r) => r.cls)), runs })) return;
  const baseCls = base('cls')[profile];
  expect(runs[0].visited.filter((label) => label !== 'Explorar demo'), 'mismo recorrido que la base').toEqual(baseCls.runs[0].visited);
  expect(runs[0].cls, `CLS (desplazamientos: ${JSON.stringify(runs[0].shifts)})`).toBeLessThanOrEqual(baseCls.max + 1e-6);
});
