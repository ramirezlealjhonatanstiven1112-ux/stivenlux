// Imagen al compartir (spec 005, RF-4): public/og-image.png, 1200×630. Uso: node scripts/build-og-image.mjs
// Solo tipografía de la marca: los proyectos conceptuales no aparecen, porque aquí no podrían identificarse como ficticios.
import { readFileSync } from 'node:fs';
import { URL, fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const font = (path) =>
  `data:font/woff2;base64,${readFileSync(new URL(`../node_modules/${path}`, import.meta.url)).toString('base64')}`;
const serif = font('@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2');
const sans = font('@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2');

const html = `<!doctype html><html lang="es"><meta charset="utf-8"><style>
  @font-face { font-family: BrandSerif; src: url(${serif}); }
  @font-face { font-family: BrandSans; src: url(${sans}); font-weight: 100 900; }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; padding: 64px 72px 60px; background: #000; color: #fff;
    display: flex; flex-direction: column; justify-content: space-between; }
  .brand { font: 34px/1 BrandSerif; letter-spacing: .16em; text-transform: uppercase; }
  h1 { font: 400 196px/.9 BrandSerif; letter-spacing: -.02em; white-space: nowrap; }
  /* El punto final es el cuadrado azul del favicon */
  h1 i { display: inline-block; width: 30px; height: 30px; margin-left: 12px; background: #2340ff; }
  p { font: 450 30px/1.2 BrandSans; }
</style><div class="brand">Stiven Lux</div><h1>No hacemos<br>lo de siempre<i></i></h1><p>Diseño y desarrollo web premium</p></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.evaluate('document.fonts.ready.then(() => {})');
await page.screenshot({ path: fileURLToPath(new URL('../public/og-image.png', import.meta.url)) });
await browser.close();
