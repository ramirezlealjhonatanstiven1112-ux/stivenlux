import { test, expect } from '@playwright/test';
import { animationsDone, heroEntranceDone, open } from './support/motion.js';
import { fingerprintDiff, noFollow, styleFingerprint } from './support/pointer.js';

// Spec 002 · táctil (sin puntero fino): tocar un enlace, un botón o una fila de servicios no deja ningún estado
// de hover (RF-15, RF-16, RF-20), con y sin JS, en el proyecto móvil y a 844×390 táctil. Un solo toque activa
// el elemento (RF-16).

const TARGETS = 'a[href]:not([data-menu] *), button:not([data-menu] *), .service';

const desktopOnly = (testInfo) => test.skip(testInfo.project.name !== 'escritorio', 'Se prueba en escritorio');
const mobileOnly = (testInfo) => test.skip(testInfo.project.name !== 'movil', 'Se prueba en el proyecto móvil');

async function ready(page, js) {
  if (js) {
    const errors = await open(page);
    await heroEntranceDone(page);
    await animationsDone(page);
    expect(errors).toEqual([]);
    // Con JS se cancela la navegación para que el tono de la barra no cambie entre medidas; la activación
    // se cuenta con los clics
    await noFollow(page);
    await page.evaluate(() => {
      window.__clicks = [];
      window.addEventListener('click', (e) => window.__clicks.push(e.target.closest('a, button, .service')), true);
    });
  } else {
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe('loaded');
    expect(await page.evaluate(() => document.documentElement.className)).toBe('');
  }
  expect(await page.evaluate(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches), 'sin puntero fino').toBe(false);
}

/* Propiedades calculadas del elemento tocado (sin sus descendientes). */
const ownStyles = (page) =>
  page.evaluate(() => {
    const cs = window.getComputedStyle(document.querySelector('[data-tap]'));
    const out = {};
    for (let i = 0; i < cs.length; i += 1) if (!cs[i].startsWith('--')) out[cs[i]] = cs.getPropertyValue(cs[i]);
    return out;
  });

/* El elemento sigue :active y lo único que cambia es su transform: el hundimiento de 1 px de .btn:active. */
async function pressedOnly(page, rest) {
  const active = await page.evaluate(() => document.querySelector('[data-tap]').matches(':active'));
  const now = await ownStyles(page);
  const diff = Object.keys(rest).filter((k) => rest[k] !== now[k]);
  return active && diff.length === 1 && diff[0] === 'transform' && now.transform === 'matrix(1, 0, 0, 1, 0, 1)';
}

/* Lleva cada pulsable a la vista, guarda su huella en reposo, lo toca y comprueba la huella a 0, 100 y 500 ms. */
async function tapEach(page, js) {
  const targets = page.locator(TARGETS);
  const count = await targets.count();
  let tapped = 0;
  for (let i = 0; i < count; i += 1) {
    const target = targets.nth(i);
    const info = await target.evaluate((el) => {
      el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
      el.dataset.tap = '';
      return {
        label: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40),
        href: el.getAttribute('href'),
        toggle: el.matches('[data-menu-toggle]'),
      };
    });
    await page.waitForTimeout(js ? 50 : 100);
    const box = await target.boundingBox();
    const x = box ? box.x + box.width / 2 : -1;
    const y = box ? box.y + box.height / 2 : -1;
    const reachable =
      box && box.width > 0 && (await target.evaluate((el, [px, py]) => el.contains(document.elementFromPoint(px, py)), [x, y]));
    if (!reachable) {
      // No se pinta en este perfil o queda fuera de la pantalla (enlace de salto): no se puede tocar
      await target.evaluate((el) => delete el.dataset.tap);
      continue;
    }
    if (!js) await page.evaluate(() => window.history.replaceState(null, '', '/'));
    const rest = await styleFingerprint(page, '[data-tap]');
    const restSelf = await ownStyles(page);

    await page.touchscreen.tap(x, y);
    for (const ms of [0, 100, 500]) {
      if (ms) await page.waitForTimeout(ms === 100 ? 100 : 400);
      if (info.toggle) break; // abre el menú: sus estilos cambian a propósito (se comprueba abajo)
      let { changed } = fingerprintDiff(rest, await styleFingerprint(page, '[data-tap]'));
      // Tras el toque, Chromium mantiene :active algo más de 100 ms (hundimiento de 1 px de la spec 000): es
      // la respuesta a la pulsación, no un hover. Solo se admite esa diferencia, mientras dure :active y
      // nunca a los 500 ms. Si :active acaba entre dos lecturas se vuelve a medir: un hover pegado seguiría.
      for (let retry = 0; ms < 500 && changed.length === 1 && retry < 3; retry += 1) {
        if (await pressedOnly(page, restSelf)) changed = [];
        else ({ changed } = fingerprintDiff(rest, await styleFingerprint(page, '[data-tap]')));
      }
      expect(changed, `${info.label}: sin hover a ${ms} ms tras el toque`).toEqual([]);
      // Tampoco aparecen ni desaparecen pseudo-elementos (un subrayado creado por un estado pegado)
      const { missing, extra } = fingerprintDiff(rest, await styleFingerprint(page, '[data-tap]'));
      expect({ missing, extra }, `${info.label}: mismos pseudo-elementos a ${ms} ms`).toEqual({ missing: [], extra: [] });
    }

    // Un solo toque activa el elemento
    if (info.toggle) {
      if (js) {
        await expect(target).toHaveAttribute('aria-expanded', 'true');
        await animationsDone(page);
        await page.keyboard.press('Escape');
        await expect(target).toHaveAttribute('aria-expanded', 'false');
        await animationsDone(page);
      }
    } else if (info.href) {
      if (js) expect(await page.evaluate(() => window.__clicks.length), `${info.label}: un toque, un clic`).toBe(1);
      else expect(await page.evaluate(() => window.location.hash), `${info.label}: un toque navega`).toBe(info.href);
    }
    if (js) await page.evaluate(() => (window.__clicks = []));
    await target.evaluate((el) => delete el.dataset.tap);
    tapped += 1;
  }
  expect(tapped, 'pulsables tocados').toBeGreaterThan(8);
  // Sin puntero fino no se crea el punto ni se apaga nada con is-touch (RF-16, RF-20)
  expect(await page.locator('.cursor').count(), 'sin punto en táctil').toBe(0);
  expect(await page.evaluate(() => document.documentElement.classList.contains('is-touch'))).toBe(false);
  // Ni imán: ningún botón magnético se desplaza (RF-16) y no se escribe ningún estilo nuevo en ellos (RF-20)
  const magnets = await page.evaluate(() =>
    [...document.querySelectorAll('[data-magnet]')].map((el) => ({
      translate: window.getComputedStyle(el).translate,
      style: el.getAttribute('style'),
    })),
  );
  expect(magnets, 'sin imán ni estilos en línea').toEqual(magnets.map(() => ({ translate: 'none', style: null })));
}

for (const js of [true, false]) {
  const mode = js ? 'con JS' : 'sin JS';

  test.describe(`RF-15, RF-16, RF-20 · movil ${mode}: tocar no deja hover`, () => {
    test.use({ javaScriptEnabled: js });
    test('cada enlace, botón y fila', async ({ page }, testInfo) => {
      mobileOnly(testInfo);
      await ready(page, js);
      await tapEach(page, js);
    });
  });

  test.describe(`RF-15, RF-16, RF-20 · 844×390 táctil ${mode}: tocar no deja hover`, () => {
    test.use({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, javaScriptEnabled: js });
    test('cada enlace, botón y fila', async ({ page }, testInfo) => {
      desktopOnly(testInfo);
      await ready(page, js);
      await tapEach(page, js);
    });
  });
}

/* Ventana estrecha con ratón (perfil de escritorio): hay puntero fino, así que hay punto (casos límite). */
for (const viewport of [{ width: 390, height: 844 }, { width: 700, height: 900 }]) {
  test.describe(`ventana estrecha con ratón ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport });
    test('existe el punto', async ({ page }, testInfo) => {
      desktopOnly(testInfo);
      const errors = await open(page);
      await heroEntranceDone(page);
      expect(await page.evaluate(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches), 'puntero fino').toBe(true);
      await page.mouse.move(100, 300);
      await page.mouse.move(120, 320);
      await expect(page.locator('.cursor')).toHaveCount(1);
      await expect.poll(() => page.evaluate(() => !document.querySelector('.cursor').classList.contains('is-off'))).toBe(true);
      // RF-8: los botones ocupan todo el ancho de su contenedor, así que no hay imán con el puntero en su borde
      for (const sel of ['.hero [data-magnet]', '.contact [data-magnet]']) {
        const el = page.locator(sel);
        await el.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' }));
        const b = await el.boundingBox();
        expect(await el.evaluate((n) => Math.abs(n.offsetWidth - n.parentElement.clientWidth) <= 1), `${sel}: a todo el ancho`).toBe(true);
        await page.mouse.move(b.x + b.width / 2, b.y - 2);
        await page.mouse.move(b.x + b.width / 2, b.y);
        await page.waitForTimeout(260);
        const t = await el.evaluate((n) => window.getComputedStyle(n).translate);
        expect(t === 'none' || t.split(' ').every((v) => Math.abs(parseFloat(v)) < 0.05), `${sel}: sin imán (${t})`).toBe(true);
      }
      expect(errors).toEqual([]);
    });
  });
}

/* ---------- T8: híbrido (RF-21) y cambio del puntero principal (casos límite) ---------- */

/* Playwright con hasTouch convierte el puntero principal en grueso, así que el híbrido (ratón principal y
   pantalla táctil) se emula con el ratón real y los pointerdown/pointerup táctiles que envía la pantalla
   (pointerType 'touch'). El dispositivo real queda como verificación documentada (verificaciones.md). */
async function fingerTap(page, x, y) {
  await page.evaluate(
    ([px, py]) => {
      const el = document.elementFromPoint(px, py);
      const init = { bubbles: true, cancelable: true, composed: true, pointerType: 'touch', isPrimary: true, clientX: px, clientY: py, pointerId: 7 };
      el.dispatchEvent(new window.PointerEvent('pointerdown', init));
      el.dispatchEvent(new window.PointerEvent('pointerup', init));
    },
    [x, y],
  );
}

test.describe('RF-21 · dispositivo híbrido: ratón como puntero principal y pantalla táctil', () => {
  test('un toque apaga hovers, punto e imán; mover el ratón los devuelve', async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    const errors = await open(page);
    await heroEntranceDone(page);
    expect(await page.evaluate(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches), 'puntero principal fino').toBe(true);

    const btn = page.locator('.contact [data-magnet]');
    await btn.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForTimeout(100);
    const b = await btn.boundingBox();
    const at = { x: b.x + b.width - 10, y: b.y + b.height / 2 };
    await page.mouse.move(at.x - 3, at.y);
    await page.mouse.move(at.x, at.y);
    await page.waitForTimeout(450);
    const state = () =>
      page.evaluate(() => {
        const el = document.querySelector('.contact [data-magnet]');
        const cs = window.getComputedStyle(el);
        const d = document.querySelector('.cursor');
        return {
          touch: document.documentElement.classList.contains('is-touch'),
          dot: !!d && !d.classList.contains('is-off'),
          sb: parseFloat(cs.getPropertyValue('--sb')),
          moved: cs.translate !== 'none' && cs.translate.split(' ').some((v) => Math.abs(parseFloat(v)) >= 1),
        };
      });
    expect(await state()).toEqual({ touch: false, dot: true, sb: 100, moved: true });

    // Un toque con el dedo en otra zona (no pulsable)
    const p = await page.locator('.contact__hint').boundingBox();
    await fingerTap(page, p.x + 10, p.y + p.height / 2);
    await page.waitForTimeout(450);
    const after = await state();
    expect(after.touch, 'is-touch').toBe(true);
    expect(after.dot, 'punto oculto').toBe(false);
    expect(after.moved, 'imán en reposo').toBe(false);
    // Ningún hover nuevo activo, aunque el ratón siga encima del botón; tampoco en las filas de servicios
    expect(after.sb, 'sin barrido').toBe(0);
    const row = page.locator('.service').first();
    await row.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForTimeout(100);
    const r = await row.boundingBox();
    await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
    await page.waitForTimeout(100);
    await fingerTap(page, r.x + r.width / 2, r.y + r.height / 2);
    await page.waitForTimeout(800);
    expect(await row.evaluate((n) => window.getComputedStyle(n, '::before').transform), 'fila sin hover').toBe('matrix(0, 0, 0, 1, 0, 0)');
    await btn.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForTimeout(100);

    // Mover el ratón: todo vuelve
    await page.mouse.move(at.x - 3, at.y);
    await page.mouse.move(at.x, at.y);
    await page.waitForTimeout(450);
    expect(await state()).toEqual({ touch: false, dot: true, sb: 100, moved: true });
    expect(errors).toEqual([]);
  });
});

test('casos límite · el puntero principal deja de ser fino: sin punto ni imán en ≤ 200 ms', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await open(page);
  await heroEntranceDone(page);
  const btn = page.locator('.contact [data-magnet]');
  await btn.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(100);
  const b = await btn.boundingBox();
  await page.mouse.move(b.x + b.width - 3, b.y + b.height / 2);
  await page.mouse.move(b.x + b.width, b.y + b.height / 2);
  await page.waitForTimeout(450);
  expect(await page.locator('.cursor').count()).toBe(1);

  // La emulación táctil de CDP cambia el puntero principal (pointer: coarse, hover: none) a mitad de sesión
  const cdp = await page.context().newCDPSession(page);
  await page.evaluate(() => (window.__t0 = window.performance.now()));
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  expect(await page.evaluate(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches), 'puntero principal ya no fino').toBe(false);
  const t = await page.evaluate(async () => {
    for (;;) {
      const el = document.querySelector('.contact [data-magnet]');
      const tr = window.getComputedStyle(el).translate;
      if (!document.querySelector('.cursor') && tr === 'none') return window.performance.now() - window.__t0;
      if (window.performance.now() - window.__t0 > 1500) return Infinity;
      await new Promise((r) => requestAnimationFrame(r));
    }
  });
  expect(t, 'sin punto ni imán, sin restos').toBeLessThanOrEqual(200);
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
});
