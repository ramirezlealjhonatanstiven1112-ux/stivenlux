// Spec 005, RF-3 y RF-4: dirección canónica e imagen al compartir
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { URL } from 'node:url';

const root = new URL('../../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

// Contenido de cada <meta property|name="…"> (los atributos pueden ir en varias líneas)
function metas(html) {
  const found = {};
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/g)) {
    const key = /\b(?:property|name)="([^"]*)"/.exec(tag)?.[1];
    if (key) (found[key] ??= []).push(/\bcontent="([^"]*)"/.exec(tag)?.[1]);
  }
  return found;
}

const canonicals = (html) =>
  [...html.matchAll(/<link\b[^>]*\brel="canonical"[^>]*>/g)].map(([tag]) => /\bhref="([^"]*)"/.exec(tag)?.[1]);

// Sin comentarios: una etiqueta comentada no cuenta
const home = read('index.html').replace(/<!--[\s\S]*?-->/g, '');
const homeMetas = metas(home);

test('RF-3: la portada declara canonical y og:url una sola vez, con el dominio propio', () => {
  assert.deepEqual(canonicals(home), ['https://stivenlux.com/']);
  assert.deepEqual(homeMetas['og:url'], ['https://stivenlux.com/']);
  assert.equal(homeMetas.robots, undefined);
});

test('RF-3: las demos siguen con noindex y sin canonical', () => {
  const demos = readdirSync(new URL('demos/', root));
  assert.equal(demos.length, 3);
  for (const demo of demos) {
    const html = read(`demos/${demo}/index.html`).replace(/<!--[\s\S]*?-->/g, '');
    assert.deepEqual(metas(html).robots, ['noindex'], demo);
    assert.deepEqual(canonicals(html), [], demo);
  }
});

test('RF-4: og:image es absoluta, descrita y un PNG real de 1200×630', () => {
  const [url] = homeMetas['og:image'];
  assert.equal(url, 'https://stivenlux.com/og-image.png');
  assert.deepEqual(homeMetas['og:image:width'], ['1200']);
  assert.deepEqual(homeMetas['og:image:height'], ['630']);
  assert.deepEqual(homeMetas['og:image:type'], ['image/png']);
  assert.ok(homeMetas['og:image:alt'][0].length > 0);
  assert.deepEqual(homeMetas['twitter:card'], ['summary_large_image']);

  const png = readFileSync(new URL(`public${new URL(url).pathname}`, root));
  assert.equal(png.toString('latin1', 1, 4), 'PNG');
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [1200, 630]);
  // WhatsApp descarta las vistas previas pesadas
  assert.ok(png.length <= 300 * 1024, `${png.length} B`);
});
