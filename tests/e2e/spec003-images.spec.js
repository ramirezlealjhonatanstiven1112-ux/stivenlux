import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { heroEntranceDone, open } from './support/motion.js';
import { clsRoute } from './support/pointer.js';
import { contrastRatio } from '../../src/lib/contrast.js';
import { IMAGE_BUDGET, sumImageBytes } from '../../src/lib/image-budget.js';

// Spec 003 · fotos: carga (RF-19c, RNF-1, RNF-2), reserva (RF-19d, RF-23), sin JS (RF-22), movimiento reducido
// (RF-21), colores forzados (RF-25), impresión (RF-26), metadatos (RF-27) y estabilidad (RNF-3).

const BASE = JSON.parse(readFileSync('tests/e2e/fixtures/spec003-base.json', 'utf8'));
const desktop = (testInfo) => test.skip(testInfo.project.name !== 'escritorio', 'Se prueba en escritorio');
/* Fotos del bloque que se ve en cada dispositivo */
const VISIBLE = '.device--browser .c-desk img, .device--phone .c-phone img';
const imageEntries = (page) =>
  page.evaluate(() => window.performance.getEntriesByType('resource').map(({ name, initiatorType, encodedBodySize }) => ({ name, initiatorType, encodedBodySize })));

const LOADS = [
  { width: 1440, height: 900, dpr: 2 },
  { width: 390, height: 844, dpr: 2 },
  { width: 390, height: 844, dpr: 3 },
  { width: 844, height: 390, dpr: 2 },
];
for (const { width, height, dpr } of LOADS) {
  test(`RNF-2 · imágenes antes del primer scroll ≤ 200 KB a ${width}×${height} DPR ${dpr}`, async ({ browser }, testInfo) => {
    desktop(testInfo);
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr });
    const page = await context.newPage();
    await open(page);
    await page.waitForLoadState('networkidle');
    const entries = await imageEntries(page);
    const bytes = sumImageBytes(entries);
    expect(bytes, `${bytes} B`).toBeGreaterThan(0);
    expect(bytes).toBeLessThanOrEqual(IMAGE_BUDGET.beforeScroll);
    // A 390 la tienda del hero no se ve: sus fotos no se descargan
    const store = entries.filter((e) => /\/conceptos\/tienda-/.test(e.name)).length;
    if (width < 768) expect(store).toBe(0);
    else expect(store).toBeGreaterThanOrEqual(4);
    await context.close();
  });
}

test('RNF-4 · a 1440 DPR 2 cada foto visible llega a la resolución que necesita', async ({ browser }, testInfo) => {
  desktop(testInfo);
  test.setTimeout(60_000);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await open(page);
  const imgs = page.locator(VISIBLE);
  for (let i = 0; i < (await imgs.count()); i += 1) {
    const img = imgs.nth(i);
    await img.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
    const { file, real, need } = await img.evaluate((el) => {
      // Ancho pintado con object-fit: cover. naturalWidth viene corregido por densidad: el ancho real va en el nombre
      const cover = Math.max(el.offsetWidth, (el.offsetHeight * Number(el.getAttribute('width'))) / Number(el.getAttribute('height')));
      const name = el.currentSrc.split('/').pop();
      return { file: name, real: Number(/-(\d+)\.\w+$/.exec(name)[1]), need: cover * 2 };
    });
    expect(real, `${file} para ${need.toFixed(0)} px`).toBeGreaterThanOrEqual(need * 0.97);
  }
  await context.close();
});

test('RNF-1 · una visita completa descarga ≤ 700 KB de fotos, ninguna > 90 KB', async ({ page }) => {
  await open(page);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 400) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(60);
  }
  await page.waitForLoadState('networkidle');
  const entries = (await imageEntries(page)).filter((e) => e.name.includes('/media/conceptos/'));
  expect(entries.length).toBeGreaterThanOrEqual(8);
  expect(entries.every((e) => /\.(avif|webp)$/.test(e.name)), 'el navegador moderno no baja el JPEG').toBe(true);
  for (const e of entries) expect(e.encodedBodySize, e.name).toBeLessThanOrEqual(IMAGE_BUDGET.perFile);
  expect(sumImageBytes(entries)).toBeLessThanOrEqual(IMAGE_BUDGET.total);
});

test('RF-19c · carga inmediata en el hero (solo el bloque visible) y diferida en proyectos', async ({ page }) => {
  await open(page);
  const loading = (sel) => page.locator(sel).evaluateAll((imgs) => imgs.map((i) => i.getAttribute('loading')));
  expect(await loading('.hero .device--browser .c-desk img')).toEqual(Array(6).fill('eager'));
  expect(await loading('.hero .device--phone .c-phone img')).toEqual(['eager']);
  expect(new Set(await loading('.hero .device--browser .c-phone img, .hero .device--phone .c-desk img'))).toEqual(new Set(['lazy']));
  expect(new Set(await loading('.project img'))).toEqual(new Set(['lazy']));
});

test('RF-19d, RF-23 · sin foto: color de la paleta, misma geometría que con foto y sin fundido', async ({ page, context }) => {
  const read = (p) =>
    p.locator(VISIBLE).evaluateAll((imgs) =>
      imgs.map((img) => {
        const photo = img.closest('.c-photo');
        const i = window.getComputedStyle(img);
        return {
          geom: [photo.offsetLeft, photo.offsetTop, photo.offsetWidth, photo.offsetHeight, img.offsetWidth, img.offsetHeight],
          bg: window.getComputedStyle(photo).backgroundColor,
          key: photo.closest('.scr').className.replace('scr scr--', ''),
          still: [i.transitionDuration, i.animationName, i.color].join(),
        };
      }),
    );
  await open(page);
  const before = await read(page);
  const broken = await context.newPage();
  await broken.route('**/media/conceptos/**', (route) => route.abort());
  await broken.goto('/');
  await broken.waitForFunction(() => document.documentElement.classList.contains('is-ready'));
  const after = await read(broken);
  expect(after.length).toBe(before.length);
  expect(after.map((a) => a.geom)).toEqual(before.map((b) => b.geom));
  const palette = { dental: 'rgb(227, 231, 238)', climate: 'rgb(185, 217, 234)', store: 'rgb(226, 226, 219)' };
  for (const a of after) {
    expect(a.bg, a.key).toBe(palette[a.key]);
    expect(a.still).toBe('0s,none,rgba(0, 0, 0, 0)');
  }
});

test.describe('RF-21 · movimiento reducido', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  test('las pantallas están en su estado final, sin animaciones', async ({ page }) => {
    await open(page);
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.effect?.target?.closest?.('.scr') && a.playState === 'running').length);
    expect(running).toBe(0);
    const final = await page.locator('.scr [data-a]').evaluateAll((els) => els.map((e) => window.getComputedStyle(e)).map((c) => [c.opacity, c.transform, c.clipPath].join()));
    expect(final.length).toBeGreaterThan(30);
    expect([...new Set(final)]).toEqual(['1,none,none']);
  });
});

test.describe('RF-22 · sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('las tres marcas y sus fotos se ven', async ({ page }) => {
    await page.goto('/');
    for (const name of ['Esmalte Claro', 'Diecinueve Grados', 'Pulso']) await expect(page.locator('.project__name', { hasText: name })).toBeVisible();
    const imgs = page.locator('.project .device--browser .c-desk img, .project .device--phone .c-phone img');
    const total = await imgs.count();
    expect(total).toBe(10);
    for (let i = 0; i < total; i += 1) {
      const img = imgs.nth(i);
      await img.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0), { message: await img.getAttribute('src') }).toBe(true);
    }
  });
});

test('RF-25 · colores forzados: sin fotos', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  expect(new Set(await page.locator('.c-photo').evaluateAll((els) => els.map((e) => window.getComputedStyle(e).display)))).toEqual(new Set(['none']));
  const parts = await page.locator('.device--browser .c-desk').evaluateAll((desks) =>
    desks.flatMap((desk) =>
      ['.c-logo', '.c-lead', '.c-hero .c-btn'].map((sel) => {
        const el = desk.querySelector(sel);
        const cs = window.getComputedStyle(el);
        const border = sel.endsWith('btn') ? [cs.borderTopWidth, cs.borderTopStyle, cs.borderTopColor] : null;
        return { sel, text: el.textContent.trim(), color: cs.color, bg: window.getComputedStyle(desk).backgroundColor, border };
      }),
    ),
  );
  expect(parts.length).toBe(15);
  const canvas = await page.evaluate(() => {
    const probe = document.body.appendChild(document.createElement('div'));
    probe.style.background = 'Canvas';
    const bg = window.getComputedStyle(probe).backgroundColor;
    probe.remove();
    return bg;
  });
  for (const p of parts) {
    expect(p.text, p.sel).not.toBe('');
    expect(p.bg, p.sel).toBe(canvas);
    expect(contrastRatio(p.color, p.bg), p.sel).toBeGreaterThanOrEqual(4.5);
    if (p.border) {
      expect(p.border[1]).toBe('solid');
      expect(parseFloat(p.border[0])).toBeGreaterThan(0);
      expect(p.border[2]).not.toBe('rgba(0, 0, 0, 0)');
      expect(contrastRatio(p.border[2], p.bg), 'borde del botón').toBeGreaterThanOrEqual(3);
    }
  }
});

test('RF-26 · impresión: sin fotos, con los textos de proyectos', async ({ page }) => {
  await open(page);
  await page.emulateMedia({ media: 'print' });
  expect(new Set(await page.locator('.c-photo').evaluateAll((els) => els.map((e) => window.getComputedStyle(e).display)))).toEqual(new Set(['none']));
  await expect(page.locator('.project__name').first()).toBeVisible();
});

test('RF-27 · fotos publicadas sin EXIF ni XMP', () => {
  const dir = 'public/media/conceptos';
  const files = readdirSync(dir);
  expect(files.length).toBeGreaterThanOrEqual(9 * 3);
  for (const name of files) {
    const head = readFileSync(join(dir, name)).toString('latin1');
    expect(/Exif\0\0|<x:xmpmeta|c2pa|Photoshop 3\.0/.test(head), name).toBe(false);
  }
});

test('RNF-3 · CLS del recorrido ≤ 0,1 y no peor que la base', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const run = await clsRoute(page, testInfo.project.name);
  const base = BASE.cls[testInfo.project.name];
  expect(run.cls).toBeLessThanOrEqual(0.1);
  expect(run.cls, `base ${base}`).toBeLessThanOrEqual(base + 1e-6);
});

// Capturas para la revisión visual (tasks.md, T10)
for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 768, height: 1024 }]) {
  test(`capturas a ${size.width} px`, async ({ browser }, testInfo) => {
    desktop(testInfo);
    test.setTimeout(60_000);
    const context = await browser.newContext({ viewport: size, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await open(page);
    await heroEntranceDone(page);
    const dir = 'test-results/capturas-spec003';
    await page.screenshot({ path: `${dir}/${size.width}-hero.png` });
    for (const key of ['dental', 'climate', 'store']) {
      const stage = page.locator(`.project--${key} .project__stage`);
      await stage.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${dir}/${size.width}-${key}.png` });
    }
    await context.close();
  });
}
