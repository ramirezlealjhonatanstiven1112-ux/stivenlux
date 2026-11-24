import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const URL = '/demos/pulso/';

async function shot(page, info, name) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' ')}`), name).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), name).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `test-results/capturas-spec004/${info.project.name}-${name}.png`, fullPage: name === '1-catalogo' });
}

test.use({ contextOptions: { reducedMotion: 'reduce' } });

test('RF-1…RF-7, RF-9, RF-10 · recorrido completo de Pulso', async ({ page }, info) => {
  test.setTimeout(60_000); // cinco análisis de axe
  await page.goto('/');
  await page.locator('.project--store').getByRole('link', { name: 'Explorar demo: Pulso' }).click();
  await expect(page).toHaveURL(/\/demos\/pulso\/$/);
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex');
  await expect(page.getByText('Modelo de demostración · negocio ficticio')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Volver a Stiven Lux' })).toHaveAttribute('href', '/#proyectos');
  await expect(page.locator('.demo').getByRole('link', { name: 'Quiero una web así' })).toHaveAttribute('href', '/#contacto');
  await page.locator('.grid img').evaluateAll(async (imgs) => {
    imgs.forEach((img) => (img.loading = 'eager'));
    await Promise.all(imgs.map((img) => img.decode()));
  });
  await shot(page, info, '1-catalogo');

  await page.getByRole('button', { name: 'Wearables' }).click();
  await expect(page.locator('.card:visible')).toHaveCount(1);
  await page.getByRole('button', { name: 'Todo', exact: true }).click();
  await page.locator('.card__link', { hasText: 'Pulso Buds' }).click();
  await expect(page.getByRole('heading', { name: 'Pulso Buds' })).toBeFocused();
  await page.locator('#buds img').evaluate((img) => img.decode());
  await shot(page, info, '2-ficha');

  await page.getByRole('button', { name: 'Agregar al carrito: Pulso Buds' }).click();
  await expect(page.locator('[data-toast]')).toContainText('Pulso Buds está en tu carrito');
  await page.goBack();
  await page.getByRole('button', { name: 'Agregar Pulso Go al carrito' }).click();
  await page.locator('.top__cart').click();
  await page.getByRole('button', { name: 'Agregar una unidad de Pulso Buds' }).click();
  await expect(page.getByRole('button', { name: 'Agregar una unidad de Pulso Buds' })).toBeFocused();
  await expect(page.locator('[data-cart-total]')).toHaveText('$\u00a0649.700');
  await page.reload();
  await expect(page.locator('[data-count]')).toHaveText('3');
  await shot(page, info, '3-carrito');
  await page.getByRole('button', { name: 'Quitar Pulso Go del carrito' }).click();
  await expect(page.locator('.line')).toHaveCount(1);

  await page.getByRole('link', { name: 'Continuar con la compra' }).click();
  await page.getByLabel(/Exprés/).check();
  await expect(page.locator('[data-total]')).toHaveText('$\u00a0472.700');
  await expect(page.locator('input:not([type=radio])')).toHaveCount(0);
  await shot(page, info, '4-compra');
  await page.getByRole('button', { name: 'Confirmar compra simulada' }).click();
  await expect(page.getByRole('heading', { name: /Compra simulada/ })).toBeVisible();
  await expect(page.locator('.done__text')).toContainText('No se ha cobrado ni enviado nada');
  await expect(page.locator('[data-count]')).toHaveText('0');
  await shot(page, info, '5-listo');

  await page.goto(`${URL}#compra`);
  await page.reload();
  await expect(page.getByText('Todavía no hay nada aquí.')).toBeVisible();
});

test('RF-9 · con teclado: saltar, filtrar y agregar', async ({ page }) => {
  await page.goto(URL);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await expect(page.locator('#catalogo')).toBeVisible();
  await page.getByRole('button', { name: 'Audio', exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(page.locator('.card:visible')).toHaveCount(3);
  await page.getByRole('button', { name: 'Agregar Pulso One al carrito' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-count]')).toHaveText('1');
});

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('RF-9 · se lee el catálogo y las fichas', async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator('.product:visible')).toHaveCount(4);
    await expect(page.locator('[data-add]:visible')).toHaveCount(0);
    await expect(page.getByText('necesitan JavaScript')).toBeVisible();
  });
});
