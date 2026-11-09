import { test, expect } from '@playwright/test';
import { animationsDone, scrollToY } from './support/motion.js';
import { centerOf, dotState, markNow, openFx, untilFrame } from './support/pointer.js';

// Spec 002 · estados: sin JS y con el módulo bloqueado (RF-17), impresión (RF-18), colores forzados con y sin
// script (RF-22) y cambio de la preferencia de movimiento a mitad de sesión (casos límite, ≤ 200 ms).

const desktop = (testInfo) => test.skip(testInfo.project.name !== 'escritorio', 'Se prueba en escritorio');
const translateOf = (page, sel) => page.locator(sel).evaluate((el) => window.getComputedStyle(el).translate);
/* Centro de un elemento llevado a la vista sin esperar fotogramas (sin JS no hay requestAnimationFrame). */
async function centerNoFrames(page, sel) {
  const el = page.locator(sel).first();
  await el.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(100);
  const b = await el.boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}
const atRest = (t) => t === 'none' || t.split(' ').every((v) => Math.abs(parseFloat(v)) < 0.05);

async function noScriptChecks(page) {
  await page.mouse.move(200, 400);
  await page.mouse.move(220, 420);
  await page.waitForTimeout(200);
  expect(await page.locator('.cursor').count(), 'sin punto').toBe(0);
  for (const sel of ['.hero .btn', '.contact .btn']) expect(atRest(await translateOf(page, sel)), `${sel}: sin imán`).toBe(true);
  // CTA de la 000: sin número configurado apuntan a #contacto
  const hrefs = await page.locator('[data-whatsapp]').evaluateAll((els) => els.map((el) => el.getAttribute('href')));
  expect(hrefs.every((h) => h === '#contacto')).toBe(true);
}

test.describe('RF-17 · sin JS', () => {
  test.use({ javaScriptEnabled: false });
  test('sin punto ni imán y CTA de la 000', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await noScriptChecks(page);
  });
});

test('RF-17 · con el módulo bloqueado: sin punto ni imán y CTA de la 000', async ({ page }) => {
  await page.route('**/assets/*.js', (route) => route.abort());
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => document.documentElement.classList.contains('fx'))).toBe(false);
  await noScriptChecks(page);
});

test('RF-18 · impresión: sin punto, botones en reposo y sin barrido a medias', async ({ page }, testInfo) => {
  desktop(testInfo);
  await openFx(page);
  const b = await page.locator('.contact .btn').evaluate((el) => {
    el.scrollIntoView({ block: 'center', behavior: 'instant' });
    const r = el.getBoundingClientRect();
    return { x: r.right, y: r.top + r.height / 2, w: r.width };
  });
  // Imán desplazado y barrido pausado a la mitad, con el punto visible
  await page.mouse.move(b.x + 2, b.y);
  await page.mouse.move(b.x - 1, b.y);
  // El punto aparece en dos fotogramas (colocado y después visible): se espera, no un tiempo fijo
  await expect.poll(async () => (await dotState(page)).visible).toBe(true);
  await page.locator('.contact .btn').evaluate((el) => el.getAnimations().forEach((a) => a.pause()));
  expect(atRest(await translateOf(page, '.contact .btn'))).toBe(false);

  await page.emulateMedia({ media: 'print' });
  const s = await page.locator('.contact .btn').evaluate((el) => {
    const cs = window.getComputedStyle(el);
    return { translate: cs.translate, image: cs.backgroundImage, color: cs.color, fg: cs.getPropertyValue('--btn-fg').trim() };
  });
  expect(await page.evaluate(() => window.getComputedStyle(document.querySelector('.cursor')).display)).toBe('none');
  expect(s.translate).toBe('none');
  expect(s.image).toBe('none');
  expect(s.color).toBe('rgb(255, 255, 255)'); // texto con su color (blanco sobre azul)
  for (const sel of ['.nav__cta', '.footer__nav a']) {
    const clip = await page.locator(sel).first().evaluate((el) => window.getComputedStyle(el, '::after').clipPath);
    expect(clip, `${sel}: sin subrayado a medias`).toMatch(/^inset\(0px 100% 0px 0%\)$|^inset\(0px 100% 0px 0px\)$/);
  }
  await page.emulateMedia({ media: 'screen' });
});

for (const js of [true, false]) {
  test.describe(`RF-22 · colores forzados ${js ? 'con' : 'sin'} script`, () => {
    test.use({ javaScriptEnabled: js });
    test('botones del sistema con borde y sin barrido; sin punto', async ({ page }, testInfo) => {
      desktop(testInfo);
      await page.emulateMedia({ forcedColors: 'active' });
      if (js) await openFx(page);
      else {
        await page.goto('/');
        await page.waitForLoadState('load');
      }
      // Sonda con los colores del sistema
      const system = await page.evaluate(() => {
        const probe = document.createElement('span');
        probe.style.cssText = 'color: ButtonText; background: ButtonFace; border: 1px solid ButtonText';
        document.body.append(probe);
        const cs = window.getComputedStyle(probe);
        const out = { text: cs.color, face: cs.backgroundColor };
        probe.remove();
        return out;
      });
      const center = js ? centerOf : centerNoFrames;
      const c = await center(page, '.contact .btn');
      await page.mouse.move(c.x, c.y - 200);
      await page.mouse.move(c.x, c.y);
      await page.waitForTimeout(450);
      const s = await page.locator('.contact .btn').evaluate((el) => {
        const cs = window.getComputedStyle(el);
        const before = window.getComputedStyle(el, '::before');
        return {
          border: `${cs.borderTopStyle} ${parseFloat(cs.borderTopWidth)}`,
          color: cs.color,
          bg: cs.backgroundColor,
          image: cs.backgroundImage,
          fill: before.content === 'none' ? 'none' : before.backgroundColor + ' ' + before.backgroundImage,
        };
      });
      expect(s.border, 'borde visible').toBe('solid 1');
      expect(s.color, 'texto del sistema').toBe(system.text);
      expect(s.bg, 'fondo del sistema').toBe(system.face);
      expect(s.image, 'sin banda de barrido').toBe('none');
      expect(s.fill === 'none' || /^rgba\(\d+, \d+, \d+, 0\) none$/.test(s.fill), `sin relleno de hoy (${s.fill})`).toBe(true);
      expect(await page.locator('.cursor').count(), 'sin punto').toBe(0);

      // Sin transiciones no hay fin que quite .is-out ni .is-relink: no se ponen (no quedan restos al salir del modo)
      if (js) {
        await page.mouse.move(c.x, c.y - 200);
        await page.waitForTimeout(100);
        const link = await center(page, '.hero .link');
        await page.mouse.move(link.x, link.y);
        await page.waitForTimeout(100);
        await page.mouse.move(link.x, link.y - 100);
        await page.waitForTimeout(100);
        expect(await page.locator('.is-out, .is-relink').count(), 'sin clases de salida pendientes').toBe(0);
      }
      const nav = await center(page, '.nav__cta');
      await page.mouse.move(nav.x, nav.y);
      await page.waitForTimeout(60);
      const u = await page.locator('.nav__cta').evaluate((el) => {
        const cs = window.getComputedStyle(el, '::after');
        return { bg: cs.backgroundColor, adjust: cs.forcedColorAdjust, transition: cs.transitionDuration, running: el.getAnimations({ subtree: true }).length };
      });
      if (js) {
        const link = await page.evaluate(() => {
          const probe = document.createElement('a');
          probe.style.color = 'LinkText';
          document.body.append(probe);
          const v = window.getComputedStyle(probe).color;
          probe.remove();
          return v;
        });
        expect(u.bg, 'subrayado en el color de los enlaces del sistema').toBe(link);
        expect(u.running, 'sin animación').toBe(0);
        expect(u.transition).toBe('0s');
      } else {
        // Sin script, los subrayados de hoy (transform con transición)
        expect(u.transition).not.toBe('0s');
      }
    });
  });
}

test('casos límite · cambio de la preferencia de movimiento a mitad de sesión, en los dos sentidos, en ≤ 200 ms', async ({ page }, testInfo) => {
  desktop(testInfo);
  await openFx(page);
  const b = await page.locator('.contact .btn').evaluate((el) => {
    el.scrollIntoView({ block: 'center', behavior: 'instant' });
    const r = el.getBoundingClientRect();
    return { x: r.right, y: r.top + r.height / 2 };
  });
  // 10 px dentro del borde derecho: el puntero sigue sobre el botón cuando el imán vuelve al reposo
  await page.mouse.move(b.x - 8, b.y);
  await page.mouse.move(b.x - 10, b.y);
  await page.waitForTimeout(300);
  expect((await dotState(page)).visible).toBe(true);
  expect(atRest(await translateOf(page, '.contact .btn'))).toBe(false);

  // A movimiento reducido: sin punto, imán en reposo y el hover en su estado final, sin restos
  await markNow(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const gone = await untilFrame(
    page,
    `const t = window.getComputedStyle(document.querySelector('.contact .btn')).translate;
     return !document.querySelector('.cursor') && (t === 'none' || t.split(' ').every((v) => Math.abs(parseFloat(v)) < 0.05));`,
  );
  expect(gone, 'reducido en ≤ 200 ms').toBeLessThanOrEqual(200);
  const e = await page.locator('.contact .btn').evaluate((el) => [parseFloat(window.getComputedStyle(el).getPropertyValue('--sb')), el.getAnimations().filter((a) => a.playState === 'running').length]);
  expect(e[0], 'hover en su estado final').toBe(100);

  // De vuelta a permitido: el punto vuelve en la última posición y el imán recalcula
  await markNow(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const back = await untilFrame(
    page,
    `const d = document.querySelector('.cursor'); const t = window.getComputedStyle(document.querySelector('.contact .btn')).translate;
     return !!d && !d.classList.contains('is-off') && t !== 'none' && t.split(' ').some((v) => Math.abs(parseFloat(v)) >= 1);`,
  );
  expect(back, 'permitido en ≤ 200 ms').toBeLessThanOrEqual(200);
  await scrollToY(page, 0);
  await animationsDone(page);
});
