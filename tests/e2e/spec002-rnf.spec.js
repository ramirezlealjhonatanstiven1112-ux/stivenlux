import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';
import { animationsDone, heroEntranceDone, open, scrollSettled, scrollToY } from './support/motion.js';
import { centerOf, noFollow, openFx } from './support/pointer.js';

// Spec 002 · requisitos no funcionales: sin tareas largas con el puntero (RNF estabilidad), axe (000/RF-9),
// sin scroll horizontal (000/RF-8, RF-8), zoom, sin secuestro del scroll y nada infinito. Las capturas no
// afirman nada: son para la revisión visual (MEMORY.md y @reviewer).

const SHOTS = 'test-results/capturas-spec002';
// Escritorio: el proyecto «escritorio» o el aislado de escritorio (playwright.config.js)
const desktop = (testInfo) => test.skip(!testInfo.project.name.endsWith('escritorio'), 'Se prueba en escritorio');
const ROUTE = 'a[href]:not([data-menu] *), button:not([data-menu] *), .service';

/* Recorrido del puntero por todos los pulsables y las filas de servicios (orden del documento, menú cerrado). */
async function pointerRoute(page) {
  const targets = page.locator(ROUTE);
  const n = await targets.count();
  for (let i = 0; i < n; i += 1) {
    const t = targets.nth(i);
    await t.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const b = await t.boundingBox();
    if (!b || b.width === 0) continue;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 5 });
    await page.waitForTimeout(120);
  }
}

test('RNF estabilidad · sin tareas de más de 50 ms durante el recorrido del puntero (1440×900)', async ({ page }, testInfo) => {
  desktop(testInfo);
  const errors = await openFx(page);
  await page.evaluate(() => {
    window.__long = [];
    new window.PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__long.push(Math.round(e.duration));
    }).observe({ type: 'longtask' });
  });
  await pointerRoute(page);
  expect(await page.evaluate(() => window.__long), 'tareas largas').toEqual([]);
  expect(errors).toEqual([]);
});

test.describe('RF-19 (000/RF-9) · axe con el punto en aro y un barrido en curso', () => {
  const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
  for (const menu of [false, true]) {
    test(`menú ${menu ? 'abierto' : 'cerrado'}: sin infracciones`, async ({ page }, testInfo) => {
      await openFx(page);
      const fine = testInfo.project.name === 'escritorio';
      if (menu) {
        await page.locator('[data-menu-toggle]').click();
        await animationsDone(page);
      }
      if (fine) {
        const sel = menu ? '.menu .btn' : '.contact .btn';
        const c = menu ? await page.locator(sel).boundingBox().then((b) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 })) : await centerOf(page, sel);
        await page.mouse.move(c.x, c.y);
        await page.waitForTimeout(60);
        await page.locator(sel).evaluate((el) => el.getAnimations().forEach((a) => a.pause())); // barrido a medias
        expect(await page.evaluate(() => document.querySelector('.cursor')?.classList.contains('is-ring'))).toBe(true);
      }
      const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
      expect(violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
    });
  }
});

test('RF-8, RF-19 (000/RF-8) · sin scroll horizontal de 320 a 1920 px con el imán a ±8 px y el punto en el borde derecho', async ({ page }, testInfo) => {
  desktop(testInfo);
  await openFx(page);
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const x of [8, -8]) {
      await page.mouse.move(width - 1, 450);
      await page.waitForTimeout(150);
      for (const y of [0, 99999]) {
        await scrollToY(page, y);
        // Se fuerza después del movimiento y del scroll (los eventos que despiertan el fotograma) y se comprueba
        // que los botones están de verdad desplazados antes de medir
        const moved = await page.evaluate((v) => {
          const out = [];
          for (const el of document.querySelectorAll('[data-magnet]')) {
            el.style.transition = 'none';
            el.style.setProperty('--mgx', `${v}px`);
            el.style.setProperty('--mgy', `${v}px`);
            out.push(window.getComputedStyle(el).translate);
          }
          return out;
        }, x);
        expect(moved, `${width} px: imán a ${x} px`).toEqual([`${x}px ${x}px`, `${x}px ${x}px`]);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(over, `${width} px, imán ${x}, scroll ${y}`).toBeLessThanOrEqual(0);
      }
    }
  }
});

for (const viewport of [{ width: 720, height: 450 }, { width: 360, height: 225 }]) {
  test.describe(`casos límite · zoom (ventana de ${viewport.width}×${viewport.height} con ratón)`, () => {
    test.use({ viewport });
    test('sin scroll horizontal; foco visible y sin tapar al tabular', async ({ page }, testInfo) => {
      desktop(testInfo);
      await openFx(page);
      await noFollow(page);
      await page.mouse.move(viewport.width / 2, viewport.height / 2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      for (let i = 0; i < 12; i += 1) {
        await page.keyboard.press('Tab');
        await scrollSettled(page); // desplazamiento suave hasta el foco
        // Al final del orden de tabulación el foco sale del documento: no hay más que mirar
        if (await page.evaluate(() => document.activeElement === document.body)) break;
        const r = await page.evaluate(() => {
          const el = document.activeElement;
          const b = el.getBoundingClientRect();
          const cx = Math.min(Math.max(b.left + b.width / 2, 0), window.innerWidth - 1);
          const cy = Math.min(Math.max(b.top + b.height / 2, 0), window.innerHeight - 1);
          const hit = document.elementFromPoint(cx, cy);
          const dot = document.querySelector('.cursor');
          return {
            label: (el.textContent || '').trim().slice(0, 30),
            // El enlace de salto (al volver a empezar el orden) se señala apareciendo en pantalla (000)
            outline: el.matches('.skip-link') && window.getComputedStyle(el).transform === 'none' ? 'solid' : window.getComputedStyle(el).outlineStyle,
            inView: b.bottom > 0 && b.top < window.innerHeight,
            free: !!hit && (el.contains(hit) || hit.contains(el)),
            dotHidden: !dot || dot.classList.contains('is-off'),
          };
        });
        expect(r.outline, `${r.label}: indicador de foco`).toBe('solid');
        expect(r.inView, `${r.label}: a la vista`).toBe(true);
        expect(r.free, `${r.label}: sin tapar`).toBe(true);
        expect(r.dotHidden, `${r.label}: el punto no lo tapa`).toBe(true);
      }
    });
  });
}

test('RNF · sin secuestro del scroll y nada infinito', async ({ page }, testInfo) => {
  await openFx(page);
  const fine = testInfo.project.name === 'escritorio';
  await page.evaluate(() => {
    window.__prevented = [];
    for (const type of ['wheel', 'keydown', 'touchstart', 'touchmove', 'pointerdown']) {
      window.addEventListener(type, (e) => e.defaultPrevented && window.__prevented.push(type));
    }
  });
  const html = await page.evaluate(() => {
    const cs = window.getComputedStyle(document.documentElement);
    return [cs.scrollBehavior, cs.overflowX, cs.overflowY];
  });
  expect(html).toEqual(['smooth', 'visible', 'visible']);
  if (fine) {
    await page.mouse.move(400, 400);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(300);
    for (const key of ['ArrowDown', 'PageDown', 'Space', 'End', 'Home']) {
      await page.keyboard.press(key);
      await page.waitForTimeout(150);
    }
    await pointerRoute(page);
  } else {
    const { width, height } = page.viewportSize();
    await page.touchscreen.tap(width / 2, height / 2);
  }
  expect(await page.evaluate(() => window.__prevented), 'ningún evento cancelado').toEqual([]);
  // Nada infinito: 500 ms después de parar, ninguna animación en curso
  await page.waitForTimeout(500);
  await animationsDone(page);
  await page.waitForTimeout(500);
  const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
  expect(running, 'animaciones en curso tras parar').toBe(0);
});

/* ---------- Capturas para la revisión visual (no afirman nada) ---------- */

function dir(name) {
  const d = `${SHOTS}/${name}`;
  mkdirSync(d, { recursive: true });
  return d;
}

test.describe('Capturas de la spec 002', () => {
  test('escritorio 1440: hovers finales, barrido a medias, punto y aro sobre blanco, negro y azul, fila', async ({ page }, testInfo) => {
    desktop(testInfo);
    const d = dir('escritorio');
    await openFx(page);
    const shot = async (sel, name, pad = 40) => {
      const b = await page.locator(sel).first().boundingBox();
      await page.screenshot({ path: `${d}/${name}.png`, clip: { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: b.width + pad * 2, height: b.height + pad * 2 } });
    };
    // Enlace de la barra en hover final
    let c = await centerOf(page, '.nav__cta');
    await page.mouse.move(c.x, c.y);
    await page.waitForTimeout(500);
    await shot('.nav__cta', '01-barra-hover');
    // Punto (disco) sobre el blanco del hero y aro sobre «Ver proyectos»
    c = await centerOf(page, '.hero__title');
    await page.mouse.move(c.x, c.y);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${d}/02-disco-sobre-blanco.png`, clip: { x: c.x - 60, y: c.y - 60, width: 120, height: 120 } });
    c = await centerOf(page, '.hero .link');
    await page.mouse.move(c.x, c.y);
    await page.waitForTimeout(600);
    await shot('.hero .link', '03-aro-ver-proyectos');
    // Botón de Contacto (azul sobre negro): hover final y barrido a medias
    c = await centerOf(page, '.contact .btn');
    await page.mouse.move(c.x, c.y);
    await page.waitForTimeout(500);
    await shot('.contact .btn', '04-contacto-hover-final');
    await page.mouse.move(c.x, c.y - 200);
    await page.waitForTimeout(500);
    await page.mouse.move(c.x, c.y);
    await page.waitForTimeout(25);
    await page.locator('.contact .btn').evaluate((el) => el.getAnimations().forEach((a) => a.pause()));
    await shot('.contact .btn', '05-contacto-barrido-a-medias');
    await page.locator('.contact .btn').evaluate((el) => el.getAnimations().forEach((a) => a.play()));
    // Disco sobre el negro de Contacto
    const h = await centerOf(page, '.contact__hint');
    await page.mouse.move(h.x, h.y - 40);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${d}/06-disco-sobre-negro.png`, clip: { x: h.x - 60, y: h.y - 100, width: 120, height: 120 } });
    // Aro sobre negro (enlace del pie) y disco y aro sobre el azul del botón de Contacto en reposo
    c = await centerOf(page, '.footer__nav a');
    await page.mouse.move(c.x, c.y);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${d}/06b-aro-sobre-negro.png`, clip: { x: c.x - 60, y: c.y - 60, width: 120, height: 120 } });
    const blue = await page.locator('.contact .btn').boundingBox();
    await page.mouse.move(blue.x + blue.width / 2, blue.y - 120);
    await page.waitForTimeout(500);
    // El disco sobre el azul: se fija el punto sobre el botón sin hover (el aro saldría al estar encima)
    await page.evaluate(({ x, y }) => {
      const dot = document.querySelector('.cursor');
      dot.style.transition = 'none';
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }, { x: blue.x + 20, y: blue.y + blue.height / 2 });
    await page.screenshot({ path: `${d}/06c-disco-sobre-azul.png`, clip: { x: blue.x - 20, y: blue.y - 20, width: 120, height: blue.height + 40 } });
    // Aro sobre el azul: el barrido se deja fijo en su inicio con un estilo en línea (--sb: 0 %) antes de pasar
    // el puntero, así que el botón sigue azul y el aro aparece encima sin depender de la carga de la máquina
    const ringAt = { x: blue.x + blue.width - 30, y: blue.y + blue.height / 2 };
    await page.locator('.contact .btn').evaluate((el) => el.style.setProperty('--sb', '0%'));
    await page.mouse.move(ringAt.x, ringAt.y);
    await expect.poll(() => page.evaluate(() => {
      const d = document.querySelector('.cursor');
      return !!d && d.classList.contains('is-ring') && window.getComputedStyle(d.lastElementChild).opacity === '1';
    })).toBe(true);
    expect(await page.locator('.contact .btn').evaluate((el) => parseFloat(window.getComputedStyle(el).getPropertyValue('--sb'))), 'barrido en su inicio').toBe(0);
    await page.screenshot({ path: `${d}/06d-aro-sobre-azul.png`, clip: { x: ringAt.x - 60, y: blue.y - 20, width: 120, height: blue.height + 40 } });
    await page.locator('.contact .btn').evaluate((el) => el.style.removeProperty('--sb'));
    await page.locator('.contact .btn').evaluate((el) => el.getAnimations().forEach((a) => a.play()));
    // Fila de servicios en hover
    c = await centerOf(page, '.service');
    await page.mouse.move(c.x, c.y);
    await page.waitForTimeout(900);
    await shot('.service', '07-fila-hover', 10);
  });

  test('escritorio 1440: reducido, sin JS, impresión y colores forzados', async ({ browser }, testInfo) => {
    desktop(testInfo);
    const d = dir('escritorio');
    const cases = [
      ['08-reducido', { reducedMotion: 'reduce' }, null],
      ['09-sin-js', { javaScriptEnabled: false }, null],
      ['10-impresion', {}, { media: 'print' }],
      ['11-colores-forzados', {}, { forcedColors: 'active' }],
    ];
    for (const [name, ctx, media] of cases) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, baseURL: 'http://localhost:4173', ...ctx });
      const page = await context.newPage();
      if (media) await page.emulateMedia(media);
      await page.goto('/#contacto');
      await page.waitForLoadState('load');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${d}/${name}.png` });
      await context.close();
    }
  });

  test('móvil y 844×390 táctil: tras tocar un enlace, un botón y una fila', async ({ page }, testInfo) => {
    const name = testInfo.project.name === 'movil' ? 'movil' : '844x390';
    if (name === '844x390') await page.setViewportSize({ width: 844, height: 390 });
    test.skip(name === '844x390', 'La ventana 844×390 táctil necesita un contexto con hasTouch: se captura en touch.spec (verificación)');
    const d = dir(name);
    await open(page);
    await heroEntranceDone(page);
    await noFollow(page);
    let i = 1;
    for (const sel of ['.hero .link', '.contact .btn', '.service']) {
      const el = page.locator(sel).first();
      await el.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.waitForTimeout(200);
      const b = await el.boundingBox();
      await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${d}/${String(i).padStart(2, '0')}-tras-tocar-${sel.replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')}.png` });
      i += 1;
    }
  });

  test.describe('844×390 táctil', () => {
    test.use({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
    test('tras tocar un enlace, un botón y una fila', async ({ page }, testInfo) => {
      desktop(testInfo);
      const d = dir('844x390');
      await open(page);
      await heroEntranceDone(page);
      await noFollow(page);
      let i = 1;
      for (const sel of ['.hero .link', '.contact .btn', '.service']) {
        const el = page.locator(sel).first();
        await el.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await page.waitForTimeout(200);
        const b = await el.boundingBox();
        await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
        await page.waitForTimeout(600);
        await page.screenshot({ path: `${d}/${String(i).padStart(2, '0')}-tras-tocar.png` });
        i += 1;
      }
    });
  });

  test.describe('ventana estrecha con ratón', () => {
    test.use({ viewport: { width: 390, height: 844 } });
    test('con el punto', async ({ page }, testInfo) => {
      desktop(testInfo);
      const d = dir('estrecha');
      await openFx(page);
      const c = await centerOf(page, '.hero .btn');
      await page.mouse.move(c.x, c.y);
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${d}/01-aro-sobre-cta.png` });
    });
  });
});
