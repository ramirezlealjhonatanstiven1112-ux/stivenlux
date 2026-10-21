import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Cada test indica el requisito de specs/000-landing-base/spec.md que verifica.

/* ignoreResource: URL de un recurso que el test hace fallar a propósito. El registro de red del
   navegador («Failed to load resource») de ese recurso no cuenta como error de la página. */
async function open(page, { ignoreResource } = {}) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    if (ignoreResource && msg.location().url.endsWith(ignoreResource) && /^Failed to load resource/.test(msg.text())) return;
    errors.push(msg.text());
  });
  await page.goto('/');
  await page.waitForFunction(() => document.documentElement.classList.contains('is-ready'));
  return errors;
}

/*
 * Sustituye la configuración de src/config/site.js en el JS servido por el build, para probar
 * los casos con número de WhatsApp o video sin tocar el archivo real.
 * El minificador conserva las claves del objeto `site` y escribe las cadenas vacías como ``, "" o '',
 * así que se busca `whatsapp:{number:<vacía>` y `heroVideo:{mp4:<vacía>` (con espacios opcionales).
 * Si el patrón deja de aparecer (otro minificador, la configuración ya rellena…), el test falla
 * en vez de pasar en falso.
 */
async function overrideSiteConfig(page, { number, mp4 } = {}) {
  const patterns = [];
  if (number !== undefined) patterns.push([/(whatsapp\s*:\s*\{\s*number\s*:\s*)(`|"|')\2/, number]);
  if (mp4 !== undefined) patterns.push([/(heroVideo\s*:\s*\{\s*mp4\s*:\s*)(`|"|')\2/, mp4]);
  const replaced = new Set();

  await page.route('**/assets/*.js', async (route) => {
    const response = await route.fetch();
    let body = await response.text();
    for (const [re, value] of patterns) {
      if (re.test(body)) {
        body = body.replace(re, (_, prefix) => `${prefix}${JSON.stringify(value)}`);
        replaced.add(re);
      }
    }
    await route.fulfill({ response, body });
  });

  // Se llama después de cargar la página: confirma que cada sustitución se aplicó
  return () => expect(replaced.size, 'patrones de configuración encontrados en el bundle').toBe(patterns.length);
}

/* Fin de la secuencia de entrada del hero: el instante (ms desde que empieza) en que termina
   la última animación CSS de la sección, a partir de document.getAnimations(). */
async function heroSequenceEnd(page) {
  return page.evaluate(async () => {
    const animations = document
      .getAnimations()
      .filter((a) => a.effect?.target?.closest?.('.hero'));
    await Promise.all(animations.map((a) => a.ready));
    const starts = animations.map((a) => a.startTime);
    const ends = animations.map((a) => a.startTime + a.effect.getComputedTiming().endTime);
    return { count: animations.length, end: Math.max(...ends) - Math.min(...starts) };
  });
}

test('RF-1 · el hero presenta el titular, el texto y los dos CTA', async ({ page }) => {
  await open(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/No hacemos\s+lo de siempre\./);
  await expect(page.locator('.hero__lead')).toContainText('experiencias web a medida');
  await expect(page.locator('.hero__actions').getByRole('link', { name: 'Iniciar proyecto por WhatsApp' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver proyectos' })).toHaveAttribute('href', '#proyectos');
});

test('RF-2 · con número válido, los CTA de WhatsApp abren la conversación en otra pestaña', async ({ page }) => {
  const applied = await overrideSiteConfig(page, { number: '573001234567' });
  await open(page);
  applied();
  const links = await page
    .locator('[data-whatsapp]')
    .evaluateAll((els) => els.map((a) => ({ href: a.getAttribute('href'), target: a.target, rel: a.rel })));
  expect(links.length).toBeGreaterThanOrEqual(4);
  const expected = `https://wa.me/573001234567?text=${encodeURIComponent('Hola Stiven Lux, quiero iniciar un proyecto web.')}`;
  for (const link of links) expect(link).toEqual({ href: expected, target: '_blank', rel: 'noopener' });
});

test('RF-3 · sin número configurado, los CTA de WhatsApp llevan a #contacto', async ({ page }) => {
  await open(page);
  const hrefs = await page.locator('[data-whatsapp]').evaluateAll((links) => links.map((a) => a.getAttribute('href')));
  expect(hrefs.length).toBeGreaterThanOrEqual(4);
  expect(new Set(hrefs)).toEqual(new Set(['#contacto']));
  await expect(page.locator('[data-whatsapp-pending]')).toBeHidden();
});

test('RF-4 y RF-5 · el menú abre, atrapa el foco, cierra con Escape y al navegar', async ({ page }) => {
  await open(page);
  const toggle = page.locator('[data-menu-toggle]');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.menu__link').first()).toBeFocused();
  expect(await page.evaluate(() => document.querySelector('main').inert)).toBe(true);

  // Pantalla completa: la región ocupa el viewport y, terminada la cortina, no recorta nada
  const menu = page.locator('[data-menu]');
  await expect(menu).toBeVisible();
  await expect(menu).toHaveCSS('clip-path', 'inset(0px)');
  const box = await menu.boundingBox();
  const viewport = page.viewportSize();
  expect(box.x).toBeCloseTo(0, 0);
  expect(box.y).toBeCloseTo(0, 0);
  expect(Math.abs(box.width - viewport.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(box.height - viewport.height)).toBeLessThanOrEqual(1);

  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  expect(await page.evaluate(() => document.querySelector('main').inert)).toBe(false);

  await toggle.click();
  await page.locator('.menu__link[href="#servicios"]').click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page).toHaveURL(/#servicios$/);
  await expect(page.locator('#servicios')).toBeInViewport();
});

test('RF-6 · los tres proyectos se identifican como conceptuales y ficticios', async ({ page }) => {
  await open(page);
  await expect(page.locator('.project')).toHaveCount(3);
  await expect(page.locator('.project__tag')).toHaveText([/^Proyecto conceptual/, /^Proyecto conceptual/, /^Proyecto conceptual/]);
  await expect(page.locator('.work__note')).toContainText('no representan clientes reales');
});

test.describe('RF-7 · movimiento reducido', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('no hay animaciones en curso y la escena está en su estado final', async ({ page }) => {
    await open(page);
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
    expect(running).toBe(0);
    await expect(page.locator('.hero__device--back')).toHaveCSS('opacity', '1');
  });
});

test('RF-8 · sin desplazamiento horizontal de 320 a 1920 px', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'escritorio', 'Se recorren los anchos desde un único proyecto');
  await open(page);
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `desbordamiento a ${width}px`).toBe(0);
  }
});

test.describe('RF-9 · accesibilidad WCAG 2.2 A/AA (axe)', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

  test('página completa sin infracciones', async ({ page }) => {
    await open(page);
    const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
  });

  test('menú abierto sin infracciones', async ({ page }) => {
    await open(page);
    await page.locator('[data-menu-toggle]').click();
    const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
  });
});

test('RF-10 · si el video configurado no puede reproducirse, se muestra la escena animada', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'escritorio', 'El video solo se usa en escritorio');
  const applied = await overrideSiteConfig(page, { mp4: '/media/no-existe.mp4' });
  // vite preview responde 200 con el HTML a cualquier ruta; un servidor real da 404
  await page.route('**/media/no-existe.mp4', (route) => route.fulfill({ status: 404, body: '' }));
  const videoRequested = page.waitForRequest('**/media/no-existe.mp4');
  const errors = await open(page, { ignoreResource: '/media/no-existe.mp4' });
  applied();
  await videoRequested;
  await expect(page.locator('.hero__video')).toHaveCount(0);
  await expect(page.locator('.hero')).not.toHaveClass(/\bis-video\b/);
  await expect(page.locator('.hero__stage')).toBeVisible();
  expect(errors).toEqual([]);
});

test('RNF · la secuencia de entrada del hero termina en ≤ 2,6 s en escritorio y antes en móvil', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'escritorio', 'Se miden ambos anchos desde un único proyecto');
  await open(page);
  const desktop = await heroSequenceEnd(page);
  expect(desktop.count).toBeGreaterThan(0);
  expect(desktop.end, 'fin de la secuencia en escritorio (ms)').toBeLessThanOrEqual(2600);

  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const mobile = await heroSequenceEnd(page);
  expect(mobile.count).toBeGreaterThan(0);
  expect(mobile.end, 'fin de la secuencia en móvil (ms)').toBeLessThan(desktop.end);
});

test('RF-11 · la página carga y se recorre sin errores de consola', async ({ page }) => {
  const errors = await open(page);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  expect(errors).toEqual([]);
});

test('RF-12 · la barra cambia de tono según la sección', async ({ page }) => {
  await open(page);
  const nav = page.locator('[data-nav]');
  await expect(nav).toHaveAttribute('data-tone', 'light');
  await page.evaluate(() => window.scrollTo(0, document.getElementById('servicios').offsetTop + 200));
  await expect(nav).toHaveAttribute('data-tone', 'dark');
  await page.evaluate(() => window.scrollTo(0, document.getElementById('proceso').offsetTop + 200));
  await expect(nav).toHaveAttribute('data-tone', 'light');
});
