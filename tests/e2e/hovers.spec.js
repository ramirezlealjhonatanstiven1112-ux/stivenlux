import { test, expect } from '@playwright/test';
import { contrastRatio } from '../../src/lib/contrast.js';
import { animationsDone, scrollToY } from './support/motion.js';
import { centerOf, noFollow, openFx, recordFrames } from './support/pointer.js';

// Spec 002 · hovers con dirección (RF-10, RF-11), foco al instante (RF-12), movimiento reducido (RF-13),
// sin hover en lo no pulsable (RF-14) y filas de servicios como hoy (RF-15). Escritorio con ratón, salvo
// el foco, que se prueba también en el proyecto móvil.

const desktop = (testInfo) => test.skip(testInfo.project.name !== 'escritorio', 'Se prueba en escritorio');

/* Fotogramas de una salida hasta su final: el borde izquierdo llega a ~100 % y, al acabar, el estado vuelve a
   (0, 0) sin transición (invisible), así que puede no haber un fotograma con exactamente 100 %. */
function exitSpan(frames) {
  const start = frames.findIndex((f) => f.a > 0);
  const reset = frames.findIndex((f, i) => i > start && f.a === 0 && f.b === 0);
  const end = frames.findIndex((f, i) => i > start && (f.a >= 99.9 || f.a === 0));
  return { start, end, during: frames.slice(0, reset < 0 ? frames.length : reset) };
}

/* Bordes --sa/--sb calculados (porcentaje). */
const edges = (page, sel) =>
  page.locator(sel).first().evaluate((el) => {
    const cs = window.getComputedStyle(el);
    return { a: parseFloat(cs.getPropertyValue('--sa')), b: parseFloat(cs.getPropertyValue('--sb')) };
  });

/* Pausa las transiciones de --sa/--sb del elemento con el borde derecho en `target` % (bisección sobre el
   tiempo de la transición) y devuelve los bordes en ese instante. */
async function pauseAt(page, sel, target) {
  return page.locator(sel).first().evaluate((el, goal) => {
    const list = el.getAnimations().filter((a) => ['--sa', '--sb'].includes(a.transitionProperty));
    const sb = () => parseFloat(window.getComputedStyle(el).getPropertyValue('--sb'));
    const seek = (t) => list.forEach((a) => (a.currentTime = t));
    list.forEach((a) => a.pause());
    let lo = 0;
    let hi = Math.max(...list.map((a) => a.effect.getTiming().duration));
    for (let i = 0; i < 30; i += 1) {
      const mid = (lo + hi) / 2;
      seek(mid);
      if (sb() < goal) lo = mid;
      else hi = mid;
    }
    seek(hi);
    const cs = window.getComputedStyle(el);
    return { n: list.length, a: parseFloat(cs.getPropertyValue('--sa')), b: parseFloat(cs.getPropertyValue('--sb')) };
  }, target);
}

/* Columnas de píxeles de una banda horizontal (fila central ± 30 % del alto) del recorte: por cada columna,
   los colores [r, g, b] de sus filas. Análisis en la página con canvas, como pixelBand de la 001. */
async function pixelColumns(page, box) {
  const clip = { x: Math.floor(box.x), y: Math.floor(box.y + box.height * 0.2), width: Math.ceil(box.width), height: Math.ceil(box.height * 0.6) };
  const png = (await page.screenshot({ clip })).toString('base64');
  return page.evaluate(async ({ png }) => {
    const blob = await (await window.fetch(`data:image/png;base64,${png}`)).blob();
    const bitmap = await window.createImageBitmap(blob);
    const canvas = new window.OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    const dpr = window.devicePixelRatio;
    const cols = [];
    for (let x = 0; x < width; x += 1) {
      const col = [];
      for (let y = 0; y < height; y += 1) {
        const i = (y * width + x) * 4;
        col.push([data[i], data[i + 1], data[i + 2]]);
      }
      cols.push({ x: x / dpr, col });
    }
    return cols;
  }, { png });
}

const rgb = ([r, g, b]) => `rgb(${r}, ${g}, ${b})`;
const dist = (p, q) => Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1]), Math.abs(p[2] - q[2]));

/* En un lado del frente: el fondo es el color dominante y el texto, el núcleo de los trazos (píxeles a ≥ 85 %
   de la mayor distancia al fondo; los del suavizado de los bordes de las letras mezclan los dos colores). El
   texto tiene que existir y verse con ≥ 4,5:1. Devuelve cuántos píxeles de núcleo hay y el peor contraste. */
function sideReport(cols) {
  const counts = new Map();
  for (const { col } of cols) for (const p of col) counts.set(p.join(), (counts.get(p.join()) || 0) + 1);
  const bg = [...counts].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number);
  let far = 0;
  for (const { col } of cols) for (const p of col) far = Math.max(far, dist(p, bg));
  let text = 0;
  let worst = Infinity;
  if (far < 60) return { bg: rgb(bg), text, worst: 1 }; // sin texto visible: todo del tono del fondo
  for (const { col } of cols) {
    for (const p of col) {
      if (dist(p, bg) < far * 0.85) continue;
      text += 1;
      worst = Math.min(worst, contrastRatio(rgb(p), rgb(bg)));
    }
  }
  return { bg: rgb(bg), text, worst };
}

test('RF-11 · técnica del barrido (P1): a mitad, cada lado del frente con su fondo y el texto legible', async ({ page }, testInfo) => {
  desktop(testInfo);
  await openFx(page);
  for (const sel of ['.contact .btn', '.menu .btn']) {
    if (sel === '.menu .btn') {
      await scrollToY(page, 0);
      await page.locator('[data-menu-toggle]').click();
      await animationsDone(page);
    }
    const c = await centerOf(page, sel);
    // Quieto: el imán no debe mover el botón durante la medida (centro: desplazamiento 0)
    await page.mouse.move(c.x, c.y);
    await page.waitForTimeout(30);
    for (const target of [40, 70]) {
      const e = await pauseAt(page, sel, target);
      expect(e.n, `${sel}: transición del borde derecho (--sb)`).toBeGreaterThanOrEqual(1);
      // El punto (aro sobre el botón) no es lo que se mide: fuera de la captura
      await page.addStyleTag({ content: '.cursor { visibility: hidden !important; }' });
      const box = await page.locator(sel).boundingBox();
      const front = box.x + (box.width * e.b) / 100;
      const cols = await pixelColumns(page, box);
      // Sin la primera y la última columna: el recorte redondea la caja y toma fondo de fuera del botón
      const inside = cols.filter((k) => Math.floor(box.x) + k.x >= box.x + 1 && Math.floor(box.x) + k.x <= box.x + box.width - 2);
      const left = inside.filter((k) => Math.floor(box.x) + k.x < front - 1.5);
      const right = inside.filter((k) => Math.floor(box.x) + k.x > front + 1.5);
      const L = sideReport(left);
      const R = sideReport(right);
      const label = `${sel} pausado en ${Math.round(e.b)} %`;
      expect(L.bg, `${label}: fondo barrido distinto del de reposo`).not.toBe(R.bg);
      expect(L.text, `${label}: texto a la izquierda`).toBeGreaterThan(20);
      expect(R.text, `${label}: texto a la derecha`).toBeGreaterThan(20);
      expect(L.worst, `${label}: contraste a la izquierda`).toBeGreaterThanOrEqual(4.5);
      expect(R.worst, `${label}: contraste a la derecha`).toBeGreaterThanOrEqual(4.5);
      // Reanuda para la siguiente medida
      await page.locator(sel).evaluate((el) => el.getAnimations().forEach((a) => a.play()));
      await page.mouse.move(5, c.y);
      await page.waitForTimeout(450);
      await page.mouse.move(c.x, c.y);
      await page.waitForTimeout(30);
    }
    await page.mouse.move(5, 5);
  }
});

test('RF-11 · los 3 botones: barrido ≤ 400 ms de izquierda a derecha y retirada hacia la derecha ≤ 400 ms; texto y nombre sin cambios', async ({ page }, testInfo) => {
  desktop(testInfo);
  await openFx(page);
  for (const sel of ['.hero .btn', '.contact .btn', '.menu .btn']) {
    if (sel === '.menu .btn') {
      await scrollToY(page, 0);
      await page.locator('[data-menu-toggle]').click();
      await animationsDone(page);
    }
    const el = page.locator(sel);
    const name = await el.evaluate((n) => [n.textContent, n.childNodes.length, n.getAttribute('aria-label')]);
    const accessible = await el.ariaSnapshot();
    const c = await centerOf(page, sel);
    await page.mouse.move(c.x, c.y - 200);
    await page.waitForTimeout(100);

    const enter = recordFrames(page, `const cs = window.getComputedStyle(document.querySelector(arg));
      return { a: parseFloat(cs.getPropertyValue('--sa')), b: parseFloat(cs.getPropertyValue('--sb')), t: window.performance.now() };`, sel, 600);
    await page.mouse.move(c.x, c.y);
    const inFrames = await enter;
    const startIn = inFrames.findIndex((f) => f.b > 0);
    const endIn = inFrames.findIndex((f) => f.b >= 100);
    expect(startIn, `${sel}: empieza`).toBeGreaterThanOrEqual(0);
    expect(inFrames[endIn].t - inFrames[startIn].t, `${sel}: entrada ≤ 400 ms`).toBeLessThanOrEqual(400);
    for (const f of inFrames) expect(f.a, `${sel}: entra por la izquierda (borde izquierdo fijo)`).toBe(0);
    expect(await el.evaluate((n) => [n.textContent, n.childNodes.length, n.getAttribute('aria-label')])).toEqual(name);

    const exit = recordFrames(page, `const cs = window.getComputedStyle(document.querySelector(arg));
      return { a: parseFloat(cs.getPropertyValue('--sa')), b: parseFloat(cs.getPropertyValue('--sb')), t: window.performance.now() };`, sel, 600);
    await page.mouse.move(c.x, c.y - 200);
    const outFrames = await exit;
    const out = exitSpan(outFrames);
    expect(out.start, `${sel}: empieza a salir`).toBeGreaterThanOrEqual(0);
    expect(outFrames[out.end].t - outFrames[out.start].t, `${sel}: salida ≤ 400 ms`).toBeLessThanOrEqual(400);
    for (const f of out.during) expect(f.b, `${sel}: sale por la derecha (borde derecho fijo)`).toBe(100);
    await page.waitForTimeout(100);
    expect(await el.evaluate((n) => [n.textContent, n.childNodes.length, n.getAttribute('aria-label')])).toEqual(name);
    expect(await el.ariaSnapshot()).toBe(accessible);
    // Reposo y hover finales: contraste ≥ 4,5 con los colores calculados. En hover, el texto (color del texto o
    // el de hover si lo pinta la capa de texto) sobre la banda de relleno
    const rest = await el.evaluate((n) => [window.getComputedStyle(n).color, window.getComputedStyle(n).backgroundColor]);
    expect(contrastRatio(rest[0], rest[1]), `${sel}: contraste en reposo`).toBeGreaterThanOrEqual(4.5);
    await page.mouse.move(c.x, c.y);
    await page.waitForTimeout(450);
    const hover = await el.evaluate((n) => {
      const cs = window.getComputedStyle(n);
      const probe = document.createElement('span');
      n.append(probe);
      probe.style.color = 'var(--btn-fill)';
      const fill = window.getComputedStyle(probe).color;
      probe.style.color = 'var(--hover-fg, currentColor)';
      const text = window.getComputedStyle(probe).color;
      probe.remove();
      return { fill, text, sb: parseFloat(cs.getPropertyValue('--sb')) };
    });
    expect(hover.sb, `${sel}: hover completo`).toBe(100);
    expect(contrastRatio(hover.text, hover.fill), `${sel}: contraste en hover (${hover.text} sobre ${hover.fill})`).toBeGreaterThanOrEqual(4.5);
    await page.mouse.move(c.x, c.y - 200);
    await page.waitForTimeout(450);
  }
});

test('RF-10 · subrayados: barra y pie entran por la izquierda y salen por la derecha en ≤ 300 ms; «Ver proyectos» sale y vuelve en ≤ 500 ms', async ({ page }, testInfo) => {
  desktop(testInfo);
  await openFx(page);
  for (const sel of ['.nav__cta', '.footer__nav a']) {
    const c = await centerOf(page, sel);
    await page.mouse.move(c.x, c.y - 120);
    await page.waitForTimeout(100);
    const read = `const cs = window.getComputedStyle(document.querySelector(arg));
      return { a: parseFloat(cs.getPropertyValue('--sa')), b: parseFloat(cs.getPropertyValue('--sb')), clip: window.getComputedStyle(document.querySelector(arg), '::after').clipPath, color: cs.color, t: window.performance.now() };`;
    const enter = recordFrames(page, read, sel, 500);
    await page.mouse.move(c.x, c.y);
    const inF = await enter;
    const s0 = inF.findIndex((f) => f.b > 0);
    const s1 = inF.findIndex((f) => f.b >= 100);
    expect(inF[s1].t - inF[s0].t, `${sel}: entra ≤ 300 ms`).toBeLessThanOrEqual(300);
    for (const f of inF) expect(f.a, `${sel}: por la izquierda`).toBe(0);
    if (sel === '.footer__nav a') expect(inF.at(-1).color, 'pie: color de hoy en hover').toBe('rgb(255, 255, 255)');
    const exit = recordFrames(page, read, sel, 500);
    await page.mouse.move(c.x, c.y - 120);
    const outF = await exit;
    const out = exitSpan(outF);
    expect(out.start, `${sel}: empieza a salir`).toBeGreaterThanOrEqual(0);
    expect(outF[out.end].t - outF[out.start].t, `${sel}: sale ≤ 300 ms`).toBeLessThanOrEqual(300);
    for (const f of out.during) expect(f.b, `${sel}: por la derecha`).toBe(100);
  }

  // «Ver proyectos»: subrayado en reposo; sale por la derecha y vuelve por la izquierda, termina subrayado
  await scrollToY(page, 0);
  const link = await centerOf(page, '.hero .link');
  await page.mouse.move(link.x, link.y - 80);
  await page.waitForTimeout(150);
  const relink = recordFrames(page, `const el = document.querySelector('.hero .link');
    return { clip: window.getComputedStyle(el, '::after').clipPath, on: el.classList.contains('is-relink'), t: window.performance.now() };`, null, 900);
  await page.mouse.move(link.x, link.y);
  await page.waitForTimeout(100);
  await page.mouse.move(link.x, link.y - 80); // sale a los 100 ms: termina igual
  const frames = await relink;
  const on = frames.filter((f) => f.on);
  expect(on.length, 'animación en curso').toBeGreaterThan(3);
  expect(on.at(-1).t - on[0].t, 'sale y vuelve ≤ 500 ms').toBeLessThanOrEqual(500);
  const inset = (f, re) => (re.exec(f.clip) || [])[1];
  // Un barrido, no un parpadeo: en cada fase hay fotogramas intermedios (estrictamente entre 5 y 95 %) y el
  // recorte avanza siempre en el mismo sentido
  const out = on.map((f) => Number(inset(f, /^inset\(0px 0px 0px ([\d.]+)%\)$/))).filter((v) => !Number.isNaN(v));
  const back = on.map((f) => Number(inset(f, /^inset\(0px ([\d.]+)% 0px 0px\)$/))).filter((v) => !Number.isNaN(v));
  expect(out.some((v) => v > 5 && v < 95), `sale por la derecha con fotogramas intermedios (${out.map(Math.round)})`).toBe(true);
  expect(back.some((v) => v > 5 && v < 95), `vuelve por la izquierda con fotogramas intermedios (${back.map(Math.round)})`).toBe(true);
  for (let i = 1; i < out.length; i += 1) expect(out[i], 'la salida avanza').toBeGreaterThanOrEqual(out[i - 1] - 0.01);
  for (let i = 1; i < back.length; i += 1) expect(back[i], 'la vuelta avanza').toBeLessThanOrEqual(back[i - 1] + 0.01);
  expect(frames.at(-1).on, 'termina').toBe(false);
  expect(frames.at(-1).clip, 'termina subrayado').toBe('none');
});

test('RF-10, RF-11 · interrupciones sin saltos: salir a mitad de la entrada y volver a mitad de la salida', async ({ page }, testInfo) => {
  desktop(testInfo);
  await openFx(page);
  for (const sel of ['.nav__cta', '.contact .btn']) {
    const c = await centerOf(page, sel);
    const away = { x: c.x + 300, y: c.y - 140 };
    await page.mouse.move(away.x, away.y);
    await page.waitForTimeout(450);
    const rec = recordFrames(page, `const cs = window.getComputedStyle(document.querySelector(arg));
      return { a: parseFloat(cs.getPropertyValue('--sa')), b: parseFloat(cs.getPropertyValue('--sb')) };`, sel, 1100);
    await page.mouse.move(c.x, c.y);
    await page.waitForTimeout(90);
    await page.mouse.move(away.x, away.y); // sale a mitad de la entrada
    await page.waitForTimeout(90);
    await page.mouse.move(c.x, c.y); // vuelve a mitad de la salida
    await page.waitForTimeout(90);
    await page.mouse.move(away.x, away.y);
    const f = await rec;
    // «Sin saltos» = sin reinicios: cada interrupción sigue desde el estado actual. Con fotogramas headless de
    // hasta 40 ms bajo carga, la curva ease-out avanza legítimamente más de la mitad en un fotograma, así que se
    // comprueba la forma: hasta el reinicio final (100 %, 100 %) → (0, 0), invisible porque no hay banda, el
    // borde derecho nunca baja y el izquierdo solo cambia de sentido en las interrupciones (sube al salir, baja
    // al volver, sube al salir otra vez).
    // El reinicio llega al acabar la salida (a = 100 %); con fotogramas lentos, el último muestreado antes puede
    // quedar algo por debajo (la cola de ease-out es lenta): basta a ≥ 95 % con el borde derecho en 100 %
    const end = f.findIndex((x, i) => i > 0 && f[i - 1].a >= 95 && f[i - 1].b >= 99.9 && x.a === 0 && x.b === 0);
    const run = end < 0 ? f : f.slice(0, end);
    for (let i = 1; i < run.length; i += 1) expect(run[i].b, `${sel}: el borde derecho no retrocede`).toBeGreaterThanOrEqual(run[i - 1].b - 0.01);
    let turns = 0;
    let dir = 0;
    for (let i = 1; i < run.length; i += 1) {
      const d = Math.sign(Math.round((run[i].a - run[i - 1].a) * 100));
      if (d && d !== dir) {
        turns += dir ? 1 : 0;
        dir = d;
      }
    }
    expect(turns, `${sel}: el borde izquierdo cambia de sentido solo en las 2 interrupciones`).toBeLessThanOrEqual(2);
    expect(end, `${sel}: termina en reposo`).toBeGreaterThan(0);
  }
});

test('RF-10 · la marca, el enlace de salto y los enlaces del menú quedan como hoy', async ({ page }, testInfo) => {
  desktop(testInfo);
  await openFx(page);
  const style = (sel) =>
    page.locator(sel).first().evaluate((el) => {
      const pick = (cs) => [cs.color, cs.backgroundColor, cs.transform, cs.clipPath, cs.textDecorationLine].join('|');
      return [pick(window.getComputedStyle(el)), pick(window.getComputedStyle(el, '::after'))];
    });
  const brand = await style('.nav__brand');
  const c = await centerOf(page, '.nav__brand');
  await page.mouse.move(c.x, c.y);
  await page.waitForTimeout(400);
  expect(await style('.nav__brand'), 'marca').toEqual(brand);

  // Enlace de salto: se muestra con el foco (000) y el puntero encima no le añade nada
  await page.locator('.skip-link').focus();
  const skip = await style('.skip-link');
  const s = await page.locator('.skip-link').boundingBox();
  await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2);
  await page.waitForTimeout(400);
  expect(await style('.skip-link'), 'enlace de salto').toEqual(skip);
  await page.locator('.skip-link').evaluate((n) => n.blur());

  await page.locator('[data-menu-toggle]').click();
  await animationsDone(page);
  const link = page.locator('.menu__link').first();
  const b = await link.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.waitForTimeout(400);
  const color = await link.evaluate((el) => window.getComputedStyle(el).color);
  expect(color, 'enlace del menú: el color de hover de hoy').not.toBe('rgb(255, 255, 255)');
  expect(await link.evaluate((el) => window.getComputedStyle(el, '::after').clipPath)).toBe('none');
});

for (const project of ['escritorio', 'movil']) {
  test(`RF-12 · ${project}: con Tab, estado final al instante, con el indicador de foco y sin imán`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== project);
    await openFx(page);
    await noFollow(page);
    const fine = await page.evaluate(() => window.matchMedia('(hover: hover)').matches);
    const targets = ['.nav__cta', '.hero .btn', '.hero .link', '.contact .btn', '.footer__nav a', '.menu .btn'];
    for (const sel of targets) {
      const el = page.locator(sel).first();
      if (sel === '.menu .btn') {
        // El botón de WhatsApp del menú: con el menú abierto
        await scrollToY(page, 0);
        await page.locator('[data-menu-toggle]').click();
        await animationsDone(page);
      }
      if (!(await el.isVisible())) continue;
      // Se tabula desde el elemento anterior en el orden del documento
      await el.evaluate((n) => {
        const all = [...document.querySelectorAll('a[href], button')].filter((x) => !x.closest('[inert]') && x.offsetParent);
        const prev = all[all.indexOf(n) - 1];
        prev.focus();
      });
      if (fine) {
        const c = await centerOf(page, sel);
        await page.mouse.move(c.x, c.y - 1); // con el puntero encima (en el borde de arriba, para el imán)
        await page.waitForTimeout(300);
        await page.mouse.move(c.x - 1000, c.y - 1000 > 0 ? c.y - 1000 : 2); // fuera: sin hover
        await page.waitForTimeout(450);
      }
      await page.keyboard.press('Tab');
      await expect(el).toBeFocused();
      const state = await el.evaluate((n) => {
        const cs = window.getComputedStyle(n);
        const running = n.getAnimations({ subtree: true }).filter((a) => ['--sa', '--sb', 'transform', 'clip-path'].includes(a.transitionProperty) && a.playState === 'running');
        return {
          a: cs.getPropertyValue('--sa'),
          b: cs.getPropertyValue('--sb'),
          running: running.length,
          outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineOffset,
          translate: cs.translate,
        };
      });
      expect(state.running, `${sel}: sin animaciones en curso`).toBe(0);
      expect(state.outline, `${sel}: indicador de foco de la 000`).toBe('solid 2px 4px');
      expect(state.translate === 'none' || state.translate.split(' ').every((v) => Math.abs(parseFloat(v)) < 0.05), `${sel}: sin imán`).toBe(true);
      if (fine && sel === '.hero .link') {
        // «Ver proyectos»: estado final = subrayado completo, sin la salida y vuelta en curso
        const link = await el.evaluate((n) => ({
          clip: window.getComputedStyle(n, '::after').clipPath,
          relink: n.getAnimations({ subtree: true }).filter((a) => a.animationName === 'relink' && a.playState === 'running').length,
        }));
        expect(link, `${sel}: subrayado completo al instante`).toEqual({ clip: 'none', relink: 0 });
      } else if (fine) {
        expect(parseFloat(state.a), `${sel}: borde izquierdo final`).toBe(0);
        expect(parseFloat(state.b), `${sel}: borde derecho final`).toBe(100);
      } else {
        // Sin hover: el mecanismo de hoy, al instante (relleno a scaleX(1) o subrayado completo)
        const shown = await el.evaluate((n) => {
          const pseudo = n.matches('.btn') ? '::before' : '::after';
          const cs = window.getComputedStyle(n, pseudo);
          return cs.content !== 'none' && (cs.transform === 'none' || cs.transform === 'matrix(1, 0, 0, 1, 0, 0)');
        });
        expect(shown, `${sel}: estado final visible`).toBe(true);
      }
      await el.evaluate((n) => n.blur());
    }
  });
}

test.describe('RF-13 · movimiento reducido', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  test('estados finales al instante, sin punto ni imán', async ({ page }, testInfo) => {
    desktop(testInfo);
    await openFx(page);
    for (const sel of ['.nav__cta', '.footer__nav a', '.contact .btn']) {
      const c = await centerOf(page, sel);
      await page.mouse.move(c.x, c.y - 150);
      await page.waitForTimeout(100);
      await page.mouse.move(c.x, c.y);
      await page.waitForTimeout(60);
      const e = await edges(page, sel);
      expect([e.a, e.b], `${sel}: estado final al instante`).toEqual([0, 100]);
      if (sel === '.footer__nav a') {
        const clip = await page.locator(sel).first().evaluate((n) => window.getComputedStyle(n, '::after').clipPath);
        expect(clip, 'pie: subrayado nuevo, completo').toMatch(/^inset\(0px( 0%)?\)$/);
      }
    }
    expect(await page.locator('.cursor').count()).toBe(0);
    const t = await page.locator('.contact .btn').evaluate((n) => window.getComputedStyle(n).translate);
    expect(t).toBe('none');
  });
});

test('RF-14, RF-15 · escenarios sin hover; filas de servicios como hoy, con el cursor normal y no enfocables', async ({ page }, testInfo) => {
  desktop(testInfo);
  await openFx(page);
  const snap = (sel) =>
    page.locator(sel).first().evaluate((el) => {
      const cs = window.getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return [Math.round(r.width), Math.round(r.height), cs.transform, cs.boxShadow, cs.cursor].join('|');
    });
  for (const sel of ['.project__stage', '.project']) {
    const before = await snap(sel);
    const c = await centerOf(page, sel);
    const now = await snap(sel);
    await page.mouse.move(c.x, c.y);
    await page.waitForTimeout(400);
    expect(await snap(sel), `${sel}: sin hover`).toBe(now);
    void before;
  }
  const row = page.locator('.service').first();
  const c = await centerOf(page, '.service');
  await page.mouse.move(c.x, c.y - 400);
  await page.waitForTimeout(800);
  await page.mouse.move(c.x, c.y);
  await page.waitForTimeout(900);
  const s = await row.evaluate((el) => ({
    line: window.getComputedStyle(el, '::before').transform,
    name: window.getComputedStyle(el.querySelector('.service__name')).transform,
    cursor: window.getComputedStyle(el).cursor,
    tab: el.tabIndex,
  }));
  expect(s.line).toBe('matrix(1, 0, 0, 1, 0, 0)');
  expect(s.name).toMatch(/^matrix\(1, 0, 0, 1, (7\.\d+|8|8\.\d+), 0\)$/);
  expect(s.cursor).toBe('auto');
  expect(s.tab).toBe(-1);
  expect(await page.evaluate(() => document.querySelector('.cursor').classList.contains('is-ring'))).toBe(false);
});

test('RF-10, RF-12 · el foco a mitad de una salida no deja la salida pendiente', async ({ page }, testInfo) => {
  desktop(testInfo);
  await openFx(page);
  await noFollow(page);
  const c = await centerOf(page, '.contact .btn');
  await page.mouse.move(c.x, c.y);
  await page.waitForTimeout(450);
  await page.mouse.move(c.x, c.y - 200); // empieza la salida
  await page.waitForTimeout(60);
  expect(await page.locator('.contact .btn').evaluate((n) => n.classList.contains('is-out'))).toBe(true);
  // Foco con el teclado desde el elemento anterior: la salida se cancela y la clase se quita
  await page.locator('.contact .btn').evaluate((n) => {
    const all = [...document.querySelectorAll('a[href], button')].filter((x) => !x.closest('[inert]') && x.offsetParent);
    all[all.indexOf(n) - 1].focus();
  });
  await page.keyboard.press('Tab');
  await expect(page.locator('.contact .btn')).toBeFocused();
  await expect.poll(() => page.locator('.contact .btn').evaluate((n) => n.classList.contains('is-out'))).toBe(false);
  // Al perder el foco no se reproduce ninguna salida sin el puntero
  await page.locator('.contact .btn').evaluate((n) => n.blur());
  await page.waitForTimeout(450);
  const e = await edges(page, '.contact .btn');
  expect([e.a, e.b], 'en reposo').toEqual([0, 0]);
});
