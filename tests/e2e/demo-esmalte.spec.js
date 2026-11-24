import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const URL = '/demos/esmalte-claro/';

async function shot(page, info, name) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' ')}`), name).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), name).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `test-results/esmalte/${info.project.name}-${name}.png`, fullPage: name === '1-inicio' });
}

test.use({ contextOptions: { reducedMotion: 'reduce' } });

test('RF-2, RF-3, RF-6, RF-7, RF-9, RF-10 · cita completa en Esmalte Claro', async ({ page }, info) => {
  test.setTimeout(60_000); // siete análisis de axe
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

  // Un paso posterior sin los anteriores vuelve al primero que falta
  await page.goto(`${URL}#cita-resumen`);
  await expect(page.getByRole('heading', { name: '¿Qué necesitas?' })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('alert').first()).toHaveText('Elige un tratamiento para continuar.');

  await page.getByRole('link', { name: 'Tratamientos' }).click();
  await shot(page, info, '2-tratamientos');
  await page.getByRole('link', { name: 'Agendar Limpieza' }).click();
  await expect(page.getByRole('heading', { name: '¿Qué necesitas?' })).toBeFocused();
  await expect(page.getByRole('radio', { name: 'Limpieza' })).toBeChecked();
  await shot(page, info, '3-servicio');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.locator('[data-days] input')).toHaveCount(12);
  await page.getByLabel('lunes, 30 de noviembre').check();
  await shot(page, info, '4-dia');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.locator('[data-times] input:disabled').first()).toBeAttached();
  await page.getByLabel('09:00').check();
  await shot(page, info, '5-hora');
  await page.goBack();
  await expect(page.getByLabel('lunes, 30 de noviembre')).toBeChecked();
  await page.goForward();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.locator('.review')).toContainText('Lunes, 30 de noviembre');
  await expect(page.locator('input:not([type=radio]), textarea, select')).toHaveCount(0);
  await shot(page, info, '6-resumen');
  await page.getByRole('button', { name: 'Confirmar cita simulada' }).click();
  await expect(page.locator('.done__text')).toHaveText('Limpieza, lunes, 30 de noviembre a las 09:00. No se ha reservado nada y no guardamos ningún dato tuyo.');
  expect(await page.evaluate(() => window.localStorage.length + window.sessionStorage.length)).toBe(0);
  await shot(page, info, '7-listo');
  await page.reload();
  await expect(page.locator('#inicio')).toBeVisible();
});

test('RF-9 · la cita se hace con teclado', async ({ page }) => {
  await page.goto(`${URL}#cita`);
  await page.locator('[name=service]').first().focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: '¿Qué día?' })).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Space');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: '¿A qué hora?' })).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Space');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: '¿Todo claro?' })).toBeFocused();
  await page.getByRole('button', { name: 'Confirmar cita simulada' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: /Cita simulada/ })).toBeFocused();
});

test('si pasa la medianoche, el día elegido se pide de nuevo', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-24T23:50:00'));
  await page.goto(`${URL}#cita`);
  await page.getByRole('radio', { name: 'Limpieza' }).check();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByLabel('miércoles, 25 de noviembre').check();
  await page.clock.setFixedTime(new Date('2026-11-25T00:05:00'));
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.locator('#cita-fecha .error')).toHaveText('Elige un día para continuar.');
});

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('RF-9 · se leen inicio y tratamientos', async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator('.treat:visible')).toHaveCount(5);
    await expect(page.locator('form:visible')).toHaveCount(0);
    await expect(page.getByText('necesita JavaScript')).toBeVisible();
  });
});
