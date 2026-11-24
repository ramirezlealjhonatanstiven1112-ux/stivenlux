import { existsSync, readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { heroEntranceDone, open } from './support/motion.js';

// Spec 003 · contenido de los conceptos: RF-1…RF-16, RF-18, RF-19b, RF-20 y RF-24. Axe (RNF-6): la página completa se revisa en landing.spec.js.

const CONCEPTS = [
  { key: 'dental', name: 'Esmalte Claro', url: 'esmalteclaro.concept', btn: 'Agendar cita', phoneBtn: 'Continuar', sector: 'odontología', demo: '/demos/esmalte-claro/' },
  { key: 'climate', name: 'Diecinueve Grados', url: 'diecinuevegrados.concept', btn: 'Agendar visita', phoneBtn: 'Agendar visita', sector: 'aires acondicionados', demo: '/demos/diecinueve-grados/' },
  { key: 'store', name: 'Pulso', url: 'pulso.concept', btn: 'Agregar al carrito', phoneBtn: 'Agregar al carrito', sector: 'tecnología', demo: '/demos/pulso/' },
];
const PRICE = /^\$ \d{1,3}(\.\d{3})+$/;
const OLD = /brasa lenta|brasalenta|navaja|restaurante|barber|maison|aur[eè]le|kairo|halden/i;
// Marcas de terceros que no pueden aparecer (RF-5): pasarelas, fabricantes, reparto
const THIRD = /nequi|daviplata|\bpse\b|visa|mastercard|paypal|mercado ?pago|rappi|didi|uber|apple|samsung|bose|sony|jbl|xiaomi|nike|adidas/i;

test.beforeEach(async ({ page }) => {
  await open(page);
});

test('RF-1 · sin conceptos antiguos en texto, aria-label ni URL', async ({ page }) => {
  const html = await page.content();
  expect(html).not.toMatch(OLD);
  const urls = await page.locator('.device__url').allTextContents();
  expect(urls).toEqual(['esmalteclaro.concept', 'pulso.concept', 'esmalteclaro.concept', 'diecinuevegrados.concept', 'pulso.concept']);
});

test('RF-2, RF-3, RF-24 · ficha de cada concepto, identificado como ficticio', async ({ page }) => {
  await expect(page.locator('.work__title')).toHaveText('Tres negocios.Tres webs que venden.');
  await expect(page.locator('.work__note')).toContainText('Las marcas son ficticias: no representan clientes reales.');
  const projects = page.locator('.project');
  await expect(projects).toHaveCount(3);
  for (const [i, c] of CONCEPTS.entries()) {
    const p = projects.nth(i);
    await expect(p.locator('.project__name')).toHaveText(c.name);
    await expect(p.locator('.project__tag')).toContainText('Proyecto conceptual');
    expect((await p.locator('.project__desc').textContent()).split('.').filter((s) => s.trim()).length).toBeGreaterThanOrEqual(2);
    await expect(p.locator('.project__spec dt')).toHaveText(['Tipografía', 'Paleta', 'Idea']);
    await expect(p.locator('.swatches span')).toHaveCount(3);
    const label = await p.locator('.project__stage').getAttribute('aria-label');
    expect(label).toContain(c.name);
    expect(label).toMatch(/ficti/);
    expect(label.toLowerCase()).toContain(c.sector);
    // Spec 004, RF-1 y RF-8: cada proyecto abre su demo
    await expect(p.getByRole('link', { name: `Explorar demo: ${c.name}` })).toHaveAttribute('href', c.demo);
  }
});

test('RF-4, RF-5 · sin reseñas, contactos ni marcas de terceros en las pantallas', async ({ page }) => {
  const text = (await page.locator('.scr').allTextContents()).join(' ');
  expect(text).not.toMatch(/reseña|opinion|estrella|★|clientes felices|seguidores|pedidos/i);
  expect(text).not.toMatch(/@|\+57|\b3\d{2} ?\d{3} ?\d{4}\b|nit\b|calle|carrera|cra\./i);
  expect(text).not.toMatch(THIRD);
  // RF-5: tampoco en las fichas, los aria-label, los title ni los nombres de archivo de las fotos
  const rest = await page.locator('.work, .hero__stage').evaluateAll((els) =>
    els.map((el) => [el.textContent, ...[...el.querySelectorAll('*')].flatMap((n) => ['aria-label', 'title', 'src', 'alt'].map((a) => n.getAttribute(a) ?? ''))].join(' ')).join(' '),
  );
  expect(rest).not.toMatch(THIRD);
});

test('RF-6…RF-14 · primera pantalla, fila y teléfono de cada concepto', async ({ page }) => {
  for (const c of CONCEPTS) {
    const scr = page.locator(`.project .device--browser .scr--${c.key}`);
    const desk = scr.locator('.c-desk');
    await expect(desk.locator('.c-hero .c-photo img')).toHaveCount(1);
    await expect(desk.locator('.c-logo')).toHaveText(c.name);
    await expect(desk.locator('.c-lead')).not.toBeEmpty();
    await expect(desk.locator('.c-hero .c-btn')).toHaveText(c.btn);
    const phone = page.locator(`.project .device--phone .scr--${c.key} .c-phone`);
    await expect(phone.locator('.c-btn')).toHaveText(c.phoneBtn);
  }
  // Odontología: 3 tratamientos con duración y ≥ 4 horas (spec 004, RF-8)
  const services = page.locator('.project .device--browser .scr--dental .c-service');
  await expect(services).toHaveCount(3);
  for (const t of await services.allTextContents()) expect(t).toMatch(/\d+ min/);
  expect(await page.locator('.project .device--phone .scr--dental .c-slots i').count()).toBeGreaterThanOrEqual(4);
  // Aires acondicionados: 4 servicios y visita con servicio y día
  await expect(page.locator('.project .device--browser .scr--climate .c-tile')).toHaveCount(4);
  await expect(page.locator('.project .device--phone .scr--climate .c-field')).toHaveText([/^Servicio/, /^Día/]);
  for (const price of await page.locator('.project .device--browser .scr--store .c-row em').allTextContents()) expect(price).toMatch(PRICE);
  // Tienda: precio en la primera pantalla (RF-12), 3 productos con foto (RF-13) y total en el teléfono (RF-14)
  await expect(page.locator('.project .device--browser .scr--store .c-hero .c-price')).toHaveText(PRICE);
  await expect(page.locator('.project .device--browser .scr--store .c-row .c-card .c-photo')).toHaveCount(3);
  await expect(page.locator('.project .device--phone .scr--store .c-phone .c-price')).toHaveText(PRICE);
});

test('RF-16, RF-17 · al menos 8 fotos propias distintas, sin texto alternativo', async ({ page }) => {
  const srcs = await page.locator('.scr img').evaluateAll((imgs) => imgs.map((i) => i.getAttribute('src')));
  const unique = new Set(srcs.map((s) => s.replace(/-\d+\.jpg$/, '')));
  expect(unique.size).toBeGreaterThanOrEqual(8);
  expect(srcs.every((s) => s.startsWith('/media/conceptos/'))).toBe(true);
  expect(await page.locator('.scr img:not([alt=""])').count()).toBe(0);
  // RF-17, RF-27: cada foto tiene su original y su entrada en el registro; nada llega de otro origen
  const registry = readFileSync('media-src/conceptos/registro.md', 'utf8');
  for (const src of unique) {
    const name = src.split('/').pop();
    expect(existsSync(`media-src/conceptos/${name}.jpg`), name).toBe(true);
    expect(registry, name).toContain(`| ${name}.jpg |`);
  }
  const sets = await page.locator('.scr source').evaluateAll((els) => els.map((e) => e.getAttribute('srcset')));
  for (const set of sets) {
    if (set.startsWith('data:image/gif')) continue;
    for (const part of set.split(', ')) {
      expect(part).toMatch(/^\/media\/conceptos\/[a-z]+-[a-z]+-\d+\.(avif|webp) \d+w$/);
      expect(existsSync(`public${part.split(' ')[0]}`), part).toBe(true);
    }
  }
});

test('RF-18, RF-19b · el hero usa las nuevas pantallas', async ({ page }) => {
  await expect(page.locator('.hero__device--back .scr')).toHaveClass(/scr--dental/);
  await expect(page.locator('.hero__device--mid .scr')).toHaveClass(/scr--store/);
  await expect(page.locator('.hero__device--front .scr')).toHaveClass(/scr--climate/);
});

test('RF-15 · paleta y tipografía distintas en cada concepto', async ({ page }) => {
  const looks = await page.evaluate(() =>
    ['dental', 'climate', 'store'].map((key) => {
      const scr = document.querySelector(`.project .device--browser .scr--${key}`);
      const cs = (sel) => window.getComputedStyle(scr.querySelector(sel));
      const title = cs('.c-title');
      return {
        bg: cs('.c-desk').backgroundColor,
        btn: [cs('.c-btn').backgroundColor, cs('.c-btn').color].join(),
        type: [title.fontFamily, title.fontWeight, title.textTransform].join(),
      };
    }),
  );
  for (const k of ['bg', 'btn', 'type']) expect(new Set(looks.map((l) => l[k])).size, k).toBe(3);
});

test('RF-19 · los tres dispositivos del hero conservan sus escalones de ensamblaje (1 a 4)', async ({ page }) => {
  for (const [sel, block] of [['back', 'c-desk'], ['mid', 'c-desk'], ['front', 'c-phone']]) {
    const steps = await page.locator(`.hero__device--${sel} .${block} [data-a]`).evaluateAll((els) => els.map((e) => e.style.getPropertyValue('--a').trim()));
    expect([...new Set(steps)].sort(), sel).toEqual(['1', '2', '3', '4']);
  }
});

for (const size of [{ width: 768, height: 1024 }, { width: 844, height: 390 }, { width: 864, height: 600 }]) {
  test(`RF-19 · a ${size.width}×${size.height} el texto del hero no cae sobre los mockups`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'escritorio', 'Se prueba en escritorio');
    await page.setViewportSize(size);
    await page.reload();
    await page.waitForFunction(() => document.documentElement.classList.contains('is-ready'));
    await heroEntranceDone(page);
    const hits = await page.evaluate(() => {
      const devices = ['back', 'mid', 'front'].map((k) => document.querySelector(`.hero__device--${k}`).getBoundingClientRect());
      const texts = [...document.querySelectorAll('.hero__title .line > span, .hero__lead, .hero__actions a')].flatMap((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return [...range.getClientRects()];
      });
      return texts.filter((t) => devices.some((d) => t.right > d.left && t.left < d.right && t.bottom > d.top && t.top < d.bottom)).length;
    });
    expect(hits).toBe(0);
  });
}

test('RF-20 · a 390 px, foto, marca y botón del teléfono: ≥ 9 px, sin corte ni solape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await heroEntranceDone(page);
  const phones = await page.locator('.device--phone .c-phone').evaluateAll((els) =>
    els.map((phone) => {
      const scr = phone.closest('.scr');
      const blocks = [...phone.querySelectorAll('.c-logo, .c-photo--top, .c-form > *')];
      // Medidas sin las transformaciones del dispositivo, sumando offsets hasta .scr
      const boxes = blocks.map((el) => {
        let l = 0;
        let t = 0;
        for (let n = el; n && n !== scr; n = n.offsetParent) {
          l += n.offsetLeft;
          t += n.offsetTop;
        }
        return { l, t, r: l + el.offsetWidth, b: t + el.offsetHeight };
      });
      const island = scr.parentElement.querySelector('.device__island');
      return {
        sizes: ['.c-logo', '.c-btn'].map((sel) => parseFloat(window.getComputedStyle(phone.querySelector(sel)).fontSize)),
        photo: boxes[1].b - boxes[1].t,
        ok: {
          inside: boxes.every((b) => b.l >= 0 && b.t >= 0 && b.r <= scr.clientWidth + 1 && b.b <= scr.clientHeight + 1),
          overlaps: boxes.slice(1).filter((b, i) => b.t < boxes[i].b - 1).length,
          clipped: blocks.filter((el) => !el.matches('.c-photo') && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1).length,
          island: island.offsetTop + island.offsetHeight <= boxes[0].t + 1,
          // Sin banda negra detrás de la isla: la pantalla entera lleva el fondo del concepto
          bg: window.getComputedStyle(scr).backgroundColor === window.getComputedStyle(phone).backgroundColor && window.getComputedStyle(scr).backgroundColor !== 'rgba(0, 0, 0, 0)',
        },
      };
    }),
  );
  expect(phones.length).toBe(4);
  for (const p of phones) {
    for (const s of p.sizes) expect(s).toBeGreaterThanOrEqual(9);
    expect(p.photo).toBeGreaterThan(50);
    expect(p.ok).toEqual({ inside: true, overlaps: 0, clipped: 0, island: true, bg: true });
  }
});

