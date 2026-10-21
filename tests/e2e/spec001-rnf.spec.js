import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';
import { animationsDone, heroEntranceDone, open, scrollToCurtain, scrollToHeroProgress, scrollToY } from './support/motion.js';

// Requisitos no funcionales de specs/001-hero-y-transiciones/spec.md (estabilidad, nitidez) y RF-22 (axe con
// movimiento permitido). Las capturas no afirman nada: son para la revisión visual (MEMORY.md y @reviewer).

/* CLS de la carga en la base (build del commit 5f01f29, copia temporal fuera del repositorio, 5 cargas por
   proyecto con el mismo método que el test de abajo): escritorio 0,0000803 en todas (un desplazamiento de
   .nav__actions al llegar las fuentes, igual que hoy) y móvil 0. */
const LOAD_CLS_BASE = { escritorio: 0.0000803, movil: 0 };

const CURTAINS = ['filosofia', 'proyectos', 'servicios', 'proceso', 'contacto'];
const SHOTS = 'test-results/capturas-spec001';

/* Registra los desplazamientos de diseño (y las tareas largas) desde ahora; `buffered` incluye los de la carga. */
async function observe(page, { buffered }) {
  await page.evaluate((withBuffer) => {
    window.__rnf = { shifts: [], long: [] };
    new window.PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__rnf.shifts.push({ value: e.value, sources: e.sources.map((s) => s.node?.className || s.node?.nodeName || '?') });
      }
    }).observe({ type: 'layout-shift', buffered: withBuffer });
    new window.PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__rnf.long.push(Math.round(e.duration));
    }).observe({ type: 'longtask' });
  }, buffered);
}

async function observed(page) {
  return page.evaluate(() => {
    const { shifts, long } = window.__rnf;
    return { cls: shifts.reduce((sum, s) => sum + s.value, 0), shifts, long };
  });
}

/* Recorrido completo de arriba abajo, un paso de 1/8 de ventana por fotograma (como una rueda o un gesto
   rápido), y espera a que terminen los revelados que haya disparado. */
async function traverse(page) {
  await page.evaluate(async () => {
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    const step = Math.round(window.innerHeight / 8);
    const max = () => document.documentElement.scrollHeight - window.innerHeight;
    for (let y = 0; y < max(); y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await frame();
    }
    window.scrollTo({ top: max(), behavior: 'instant' });
    await frame();
  });
  await expect.poll(() => page.locator('[data-reveal].is-pending, .is-revealing').count(), { timeout: 3000 }).toBe(0);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

test.describe('RNF estabilidad', () => {
  test('CLS = 0 durante un recorrido completo de arriba abajo (y sin tareas largas en escritorio)', async ({ page }, testInfo) => {
    const errors = await open(page);
    await heroEntranceDone(page);
    await observe(page, { buffered: false });
    await traverse(page);
    const { cls, shifts, long } = await observed(page);
    expect(shifts, 'desplazamientos de diseño durante el scroll').toEqual([]);
    expect(cls).toBe(0);
    // Todos los titulares pendientes se han revelado durante el recorrido (el recorrido los ejercita)
    expect(await page.locator('[data-reveal].is-pending').count()).toBe(0);
    if (testInfo.project.name === 'escritorio') expect(long, 'tareas de más de 50 ms durante el scroll').toEqual([]);
    expect(errors).toEqual([]);
  });

  test('el CLS de la carga no empeora respecto a la base (5f01f29)', async ({ page }, testInfo) => {
    await page.addInitScript(() => {
      window.__loadShifts = [];
      new window.PerformanceObserver((list) => {
        for (const e of list.getEntries()) if (!e.hadRecentInput) window.__loadShifts.push(e.value);
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await open(page);
    await heroEntranceDone(page);
    const cls = await page.evaluate(() => window.__loadShifts.reduce((sum, v) => sum + v, 0));
    expect(cls).toBeLessThanOrEqual(LOAD_CLS_BASE[testInfo.project.name]);
  });
});

test.describe('RF-22 · axe con movimiento permitido (WCAG 2.2 A/AA)', () => {
  const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

  async function atHalfCurtain(page) {
    await open(page);
    await heroEntranceDone(page);
    expect(await scrollToCurtain(page, 'servicios', 0.5)).toBeCloseTo(0.5, 2);
    await animationsDone(page);
  }

  test('cortina de Servicios a 0,5, menú cerrado: sin infracciones', async ({ page }) => {
    await atHalfCurtain(page);
    const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
  });

  test('cortina de Servicios a 0,5, menú abierto: sin infracciones', async ({ page }) => {
    await atHalfCurtain(page);
    await page.locator('[data-menu-toggle]').click();
    await expect(page.locator('[data-menu]')).toHaveCSS('clip-path', 'inset(0px)');
    await animationsDone(page);
    const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
  });
});

/* ---------- Capturas para la revisión visual (no afirman nada) ---------- */

/* Deja terminar las transiciones y animaciones en curso (tono de la barra, revelados) antes de capturar. */
async function settleAnimations(page) {
  await animationsDone(page);
}

function shotDir(testInfo) {
  const dir = `${SHOTS}/${testInfo.project.name}`;
  mkdirSync(dir, { recursive: true });
  return dir;
}

/* Recorte de cada dispositivo visible del hero (intersección con la ventana), para comparar la nitidez. */
async function deviceShots(page, dir, name) {
  const clips = await page.evaluate(() => {
    const out = [];
    for (const layer of ['back', 'mid', 'front']) {
      const device = document.querySelector(`.hero__layer--${layer} .hero__device`);
      if (!device || window.getComputedStyle(device.closest('.hero__layer')).display === 'none') continue;
      const r = device.getBoundingClientRect();
      const x = Math.max(0, r.left);
      const y = Math.max(0, r.top);
      const width = Math.min(window.innerWidth, r.right) - x;
      const height = Math.min(window.innerHeight, r.bottom) - y;
      if (width > 0 && height > 0) out.push({ layer, clip: { x, y, width, height } });
    }
    return out;
  });
  for (const { layer, clip } of clips) await page.screenshot({ path: `${dir}/${name}-${layer}.png`, clip });
}

test.describe('Capturas de la spec 001', () => {
  test.describe.configure({ timeout: 120_000 });

  test('con movimiento: hero, fronteras, titulares y página completa', async ({ page }, testInfo) => {
    const dir = shotDir(testInfo);
    await open(page);
    await heroEntranceDone(page);
    await page.screenshot({ path: `${dir}/01-hero-p0.png` });
    await deviceShots(page, dir, '01-hero-p0');
    await scrollToHeroProgress(page, 0.5);
    await page.evaluate(() => new Promise((r) => setTimeout(r, 600))); // escena neutra (RF-6)
    await settleAnimations(page);
    await page.screenshot({ path: `${dir}/02-hero-p05.png` });
    await deviceShots(page, dir, '02-hero-p05');

    let n = 3;
    for (const id of CURTAINS) {
      for (const c of [0.5, 1]) {
        const label = `${String(n).padStart(2, '0')}-${id}-c${c === 1 ? '1' : '05'}`;
        n += 1;
        // Un 1 % más allá del final del tramo: redondear la posición al píxel puede dejar la cortina en 0,998
        if ((await scrollToCurtain(page, id, c === 1 ? 1.01 : c)) === null) continue;
        await settleAnimations(page);
        await page.screenshot({ path: `${dir}/${label}.png` });
      }
    }

    // Titulares revelados: cada uno a un tercio de la ventana (Contacto, al final de la página)
    for (const id of CURTAINS) {
      const y = await page.evaluate((sectionId) => {
        const title = document.querySelector(`#${sectionId} [data-reveal]`);
        const top = title.getBoundingClientRect().top + window.scrollY - window.innerHeight / 3;
        return Math.min(Math.max(0, Math.round(top)), document.documentElement.scrollHeight - window.innerHeight);
      }, id);
      await scrollToY(page, y);
      await expect.poll(() => page.locator(`#${id} [data-reveal].is-pending, #${id} .is-revealing`).count()).toBe(0);
      await settleAnimations(page);
      await page.screenshot({ path: `${dir}/${String(n).padStart(2, '0')}-titular-${id}.png` });
      n += 1;
    }

    await scrollToY(page, 0);
    await settleAnimations(page);
    await page.screenshot({ path: `${dir}/${n}-pagina-completa-arriba.png`, fullPage: true, scale: 'css' });
  });

  test.describe('movimiento reducido', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });
    test('página completa', async ({ page }, testInfo) => {
      await open(page);
      await page.screenshot({ path: `${shotDir(testInfo)}/30-reducido.png`, fullPage: true, scale: 'css' });
    });
  });

  test.describe('sin JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('página completa', async ({ page }, testInfo) => {
      await page.goto('/');
      await page.screenshot({ path: `${shotDir(testInfo)}/31-sin-js.png`, fullPage: true, scale: 'css' });
    });
  });

  test('script principal bloqueado, pasados 2,5 s', async ({ page }, testInfo) => {
    await page.route('**/assets/*.js', (route) => route.abort());
    await page.goto('/');
    await page.evaluate(() => new Promise((r) => setTimeout(r, 2800)));
    await settleAnimations(page); // entrada del hero lanzada por la red de seguridad
    await page.screenshot({ path: `${shotDir(testInfo)}/32-script-bloqueado.png`, fullPage: true, scale: 'css' });
  });

  test('impresión con una cortina a 0,5', async ({ page }, testInfo) => {
    await open(page);
    await heroEntranceDone(page);
    await scrollToCurtain(page, 'servicios', 0.5);
    await page.emulateMedia({ media: 'print' });
    await page.screenshot({ path: `${shotDir(testInfo)}/33-impresion.png`, fullPage: true, scale: 'css' });
  });
});
