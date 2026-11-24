import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const URL = '/demos/diecinueve-grados/';

async function shot(page, info, name) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' ')}`), name).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), name).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `test-results/grados/${info.project.name}-${name}.png`, fullPage: name === '1-inicio' });
}

test.use({ contextOptions: { reducedMotion: 'reduce' } });

test('RF-2, RF-4, RF-6, RF-7, RF-9, RF-10 · visita completa en Diecinueve Grados', async ({ page }, info) => {
  test.setTimeout(60_000); // ocho análisis de axe
  await page.clock.setFixedTime(new Date('2026-11-24T10:00:00'));
  await page.goto(URL);
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex');
  await expect(page.getByText('Modelo de demostración · negocio ficticio')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Volver a Stiven Lux' })).toHaveAttribute('href', '/#proyectos');
  await expect(page.locator('.demo').getByRole('link', { name: 'Quiero una web así' })).toHaveAttribute('href', '/#contacto');
  await page.locator('img').evaluateAll(async (imgs) => {
    imgs.forEach((img) => (img.loading = 'eager'));
    await Promise.all(imgs.map((img) => img.decode()));
  });
  await shot(page, info, '1-inicio');
  const color = () => page.locator('.hero').evaluate((el) => window.getComputedStyle(el).backgroundColor);
  const hot = await color();
  await page.locator('[data-dial]').fill('25');
  await shot(page, info, '1b-medio');
  await page.locator('[data-dial]').focus();
  await page.keyboard.press('End');
  if ((await page.locator('[data-temp]').textContent()) !== '19') await page.keyboard.press('Home');
  await expect(page.locator('[data-temp]')).toHaveText('19');
  expect(await color()).not.toBe(hot);
  await shot(page, info, '1c-frio');

  // Un paso posterior sin los anteriores vuelve al primero que falta
  await page.goto(`${URL}#visita-resumen`);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('alert').first()).toHaveText('Elige un servicio para continuar.');
  await page.goto(`${URL}#servicios`);
  await shot(page, info, '2-servicios');
  await page.getByRole('link', { name: 'Agendar visita: Limpieza' }).click();
  await expect(page.getByRole('heading', { name: '¿Qué necesita tu aire?' })).toBeFocused();
  await expect(page.getByRole('radio', { name: 'Limpieza' })).toBeChecked();
  await shot(page, info, '3-servicio');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByLabel('lunes, 30 de noviembre').check();
  await shot(page, info, '4-dia');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.locator('.review')).toContainText('Lunes, 30 de noviembre');
  await expect(page.locator('input:not([type=radio], [type=range]), textarea, select')).toHaveCount(0);
  await shot(page, info, '5-resumen');
  await page.getByRole('button', { name: 'Confirmar visita simulada' }).click();
  await expect(page.locator('.done__text')).toHaveText('Limpieza, lunes, 30 de noviembre. No se ha agendado nada y no guardamos ningún dato tuyo.');
  expect(await page.evaluate(() => window.localStorage.length + window.sessionStorage.length)).toBe(0);
  await shot(page, info, '6-listo');
});

test('RF-9 · la visita se hace con teclado', async ({ page }) => {
  await page.goto(`${URL}#visita`);
  await page.locator('[name=service]').first().focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: '¿Qué día vamos?' })).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Space');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: '¿La agendamos?' })).toBeFocused();
});

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('RF-9 · se leen inicio y servicios', async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator('.hero__temp')).toHaveText('19°');
    await expect(page.locator('.service:visible')).toHaveCount(4);
    await expect(page.locator('form:visible')).toHaveCount(0);
    await expect(page.getByText('necesita JavaScript')).toBeVisible();
  });
});
