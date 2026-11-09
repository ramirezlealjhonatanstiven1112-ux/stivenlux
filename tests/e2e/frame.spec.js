import { test, expect } from '@playwright/test';
import { animationsDone, open } from './support/motion.js';

// Spec 002 · planificador único de fotogramas: un solo listener de scroll en window, también con movimiento
// reducido (RF-4, RF-19, motion-rules); html.fx solo cuando el script principal se ha ejecutado (RF-17);
// evento menuchange al abrir y al cerrar el menú (RF-3, RF-9).

/* Cuenta los listeners de scroll de window que siguen registrados (altas menos bajas). */
async function countScrollListeners(page) {
  await page.addInitScript(() => {
    const live = new Set();
    const add = window.EventTarget.prototype.addEventListener;
    const remove = window.EventTarget.prototype.removeEventListener;
    window.EventTarget.prototype.addEventListener = function (type, fn, opts) {
      if (this === window && type === 'scroll') live.add(fn);
      return add.call(this, type, fn, opts);
    };
    window.EventTarget.prototype.removeEventListener = function (type, fn, opts) {
      if (this === window && type === 'scroll') live.delete(fn);
      return remove.call(this, type, fn, opts);
    };
    window.__scrollListeners = () => live.size;
  });
}

for (const reduced of [false, true]) {
  test.describe(`RF-4, RF-19 · un solo listener de scroll${reduced ? ' con movimiento reducido' : ''}`, () => {
    if (reduced) test.use({ contextOptions: { reducedMotion: 'reduce' } });
    test('exactamente 1 en window', async ({ page }) => {
      await countScrollListeners(page);
      const errors = await open(page);
      expect(await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(reduced);
      expect(await page.evaluate(() => window.__scrollListeners())).toBe(1);
      expect(errors).toEqual([]);
    });
  });
}

test.describe('RF-17 · html.fx', () => {
  test('existe cuando el script principal se ha ejecutado', async ({ page }) => {
    await open(page);
    await expect(page.locator('html')).toHaveClass(/(^|\s)fx(\s|$)/);
  });

  test('no existe con el módulo bloqueado', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'escritorio', 'Se prueba en escritorio');
    await page.route('**/assets/*.js', (route) => route.abort());
    await page.goto('/');
    await page.waitForLoadState('load');
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.documentElement.classList.contains('js'))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.classList.contains('fx'))).toBe(false);
  });

  test.describe('sin JS', () => {
    test.use({ javaScriptEnabled: false });
    test('no existe', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'escritorio', 'Se prueba en escritorio');
      await page.goto('/');
      await page.waitForLoadState('load');
      expect(await page.evaluate(() => document.documentElement.className)).toBe('');
    });
  });
});

test('RF-3, RF-9 · menuchange al abrir y al cerrar (botón, Escape y enlace)', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'escritorio', 'Se prueba en escritorio');
  await open(page);
  await page.evaluate(() => {
    window.__menu = [];
    document.addEventListener('menuchange', () =>
      window.__menu.push(document.documentElement.classList.contains('menu-open') ? 'open' : 'close'),
    );
  });
  const toggle = page.locator('[data-menu-toggle]');
  const events = () => page.evaluate(() => window.__menu);

  await toggle.click();
  await expect.poll(events).toEqual(['open']);
  await animationsDone(page);
  await page.keyboard.press('Escape');
  await expect.poll(events).toEqual(['open', 'close']);
  await animationsDone(page);

  await toggle.click();
  await animationsDone(page);
  await page.locator('.menu__link').first().click();
  await expect.poll(events).toEqual(['open', 'close', 'open', 'close']);
  await animationsDone(page);

  await toggle.click();
  await animationsDone(page);
  await toggle.click();
  await expect.poll(events).toEqual(['open', 'close', 'open', 'close', 'open', 'close']);
});

test('RF-17 · al cargar no nace ninguna transición en el hero (solo las animaciones de su entrada)', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => document.documentElement.classList.contains('is-ready'));
  const transitions = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.effect?.target?.closest?.('.hero') && a.transitionProperty)
      .map((a) => `${a.transitionProperty} en ${a.effect.target.className}`),
  );
  expect(transitions).toEqual([]);
});
