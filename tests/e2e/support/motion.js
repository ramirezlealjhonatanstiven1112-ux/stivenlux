/* Ayudas de e2e de la spec 001 (no es un archivo de tests). */
import { expect } from '@playwright/test';

/* Abre la portada, espera a que arranque la entrada del hero y recoge los errores de la página. */
export async function open(page, path = '/') {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto(path);
  await page.waitForFunction(() => document.documentElement.classList.contains('is-ready'));
  await loadSettled(page);
  return errors;
}

/* Espera al asentamiento de la carga (spec 001): hasta entonces ningún titular está pendiente y lo «visto»
   aún no se ha decidido, así que los tests que desplazan la página empiezan después. Se reconoce porque los
   titulares de debajo de la ventana ya están pendientes; si no hay ninguno, basta con haber pasado el tope
   (1 s desde el script, que se ejecuta antes de DOMContentLoaded, más 100 ms de margen). Con movimiento
   reducido no hay asentamiento. */
export async function loadSettled(page) {
  await page.waitForFunction(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    if (document.readyState !== 'complete') return false;
    const [nav] = window.performance.getEntriesByType('navigation');
    if (window.performance.now() >= nav.domContentLoadedEventStart + 1100) return true;
    const below = [...document.querySelectorAll('[data-reveal]')].filter((h) => h.getBoundingClientRect().top >= window.innerHeight);
    return below.length > 0 && below.every((h) => h.classList.contains('is-pending'));
  });
}

/* Espera a que terminen las animaciones de entrada del hero (composición de reposo). */
export async function heroEntranceDone(page) {
  await page.evaluate(async () => {
    const animations = document.getAnimations().filter((a) => a.effect?.target?.closest?.('.hero'));
    await Promise.all(animations.map((a) => a.finished));
  });
}

/* Desplaza al instante (html tiene scroll-behavior: smooth) y deja pasar dos fotogramas. */
export async function scrollToY(page, y) {
  await page.evaluate(async (top) => {
    window.scrollTo({ top, behavior: 'instant' });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, y);
}

/* Lleva el progreso de salida (scrollY / alto de ventana) al valor pedido y espera a que el
   script lo haya aplicado al hero. */
export async function scrollToHeroProgress(page, p) {
  const vh = await page.evaluate(() => window.innerHeight);
  await scrollToY(page, Math.round(p * vh));
  await expect
    .poll(() => page.evaluate(() => Number(window.getComputedStyle(document.querySelector('.hero')).getPropertyValue('--hero-p'))))
    .toBeCloseTo(p, 2);
}

/* Dispositivos visibles del hero: escala de su capa (DOMMatrix) y centro del dispositivo
   respecto a la caja del hero. */
export async function heroLayers(page) {
  return page.evaluate(() => {
    const hero = document.querySelector('.hero').getBoundingClientRect();
    const layers = {};
    for (const name of ['back', 'mid', 'front']) {
      const layer = document.querySelector(`.hero__layer--${name}`);
      const { display, transform } = window.getComputedStyle(layer);
      if (display === 'none') continue;
      const m = new window.DOMMatrix(transform === 'none' ? undefined : transform);
      const r = layer.querySelector('.hero__device').getBoundingClientRect();
      layers[name] = {
        transform,
        scale: Math.hypot(m.a, m.b),
        x: r.left + r.width / 2 - hero.left,
        y: r.top + r.height / 2 - hero.top,
      };
    }
    return layers;
  });
}

/* Tramo de cortina de una sección según la definición de la spec (sin importar src/lib/): empieza cuando
   su borde superior asoma por abajo y termina cuando ha subido el 60 % (escritorio) o el 40 % (móvil) del
   alto de la ventana, acortado al final del scroll. */
export async function curtainRangeOf(page, id) {
  return page.evaluate((sectionId) => {
    const vh = window.innerHeight;
    const top = document.getElementById(sectionId).getBoundingClientRect().top + window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - vh;
    const rise = window.innerWidth >= 768 ? 0.6 : 0.4;
    const end = Math.min(top - vh * (1 - rise), maxScroll);
    return { start: top - vh, end, natural: top - vh * (1 - rise), maxScroll, y: window.scrollY };
  }, id);
}

/* Progreso de cortina esperado para el scroll actual (definición de la spec). */
export async function expectedCurtain(page, id) {
  const { start, end, y } = await curtainRangeOf(page, id);
  if (end <= start) return y >= end ? 1 : 0;
  return Math.min(1, Math.max(0, (y - start) / (end - start)));
}

/* Espera a que el script haya escrito en la sección el progreso de cortina de la posición actual. */
export async function waitCurtainApplied(page, id) {
  const c = await expectedCurtain(page, id);
  await expect
    .poll(() => page.evaluate((sectionId) => Number(document.getElementById(sectionId).style.getPropertyValue('--c')), id))
    .toBeCloseTo(c, 2);
  return c;
}

/* Lleva la cortina de la sección al progreso pedido. Devuelve el progreso esperado en la posición real
   (null si esa posición no existe: queda por encima del inicio de la página). */
export async function scrollToCurtain(page, id, c) {
  const { start, end } = await curtainRangeOf(page, id);
  const y = start + c * (end - start);
  if (y < 0) return null;
  await scrollToY(page, Math.round(y));
  return waitCurtainApplied(page, id);
}

/* Marco de la cortina de una sección: grosores resueltos del ::before, su fondo y contenido, el padding y
   la caja de la sección (coordenadas de ventana). */
export async function frame(page, id) {
  return page.evaluate((sectionId) => {
    const section = document.getElementById(sectionId);
    const before = window.getComputedStyle(section, '::before');
    const own = window.getComputedStyle(section);
    const r = section.getBoundingClientRect();
    const px = (v) => parseFloat(v) || 0;
    return {
      ft: px(before.getPropertyValue('--ft')),
      fr: px(before.getPropertyValue('--fr')),
      fb: px(before.getPropertyValue('--fb')),
      fl: px(before.getPropertyValue('--fl')),
      content: before.content,
      bg: before.backgroundColor,
      ownBg: own.backgroundColor,
      pt: px(own.paddingTop),
      pr: px(own.paddingRight),
      pb: px(own.paddingBottom),
      pl: px(own.paddingLeft),
      rect: { top: r.top, right: r.right, bottom: r.bottom, left: r.left },
    };
  }, id);
}

/* Espera a que el scroll se detenga (anclas y foco usan el desplazamiento suave de html). */
export async function scrollSettled(page) {
  let last = null;
  await expect
    .poll(async () => {
      const y = await page.evaluate(async () => {
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        return window.scrollY;
      });
      const stable = y === last;
      last = y;
      return stable;
    })
    .toBe(true);
}
