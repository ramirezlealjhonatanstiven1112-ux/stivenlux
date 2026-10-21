import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { site } from './src/config/site.js';

const root = dirname(fileURLToPath(import.meta.url));
const partialsDir = resolve(root, 'src/partials');

/*
 * Partials HTML en tiempo de build:
 *   <include src="devices/browser.html" url="dominio.concept" screen="fashion"></include>
 * Cada atributo extra se sustituye como {{atributo}} dentro del partial.
 * Los partials pueden incluir otros partials. Sin coste en tiempo de ejecución.
 */
const INCLUDE_RE = /<include\s+([^>]*?)\s*(?:\/>|><\/include>)/g;
const ATTR_RE = /([\w-]+)="([^"]*)"/g;

function renderIncludes(html, depth = 0) {
  if (depth > 8) throw new Error('Partials: demasiados niveles de anidación');
  return html.replace(INCLUDE_RE, (_, rawAttrs) => {
    const attrs = Object.fromEntries([...rawAttrs.matchAll(ATTR_RE)].map((m) => [m[1], m[2]]));
    if (!attrs.src) throw new Error(`Partials: <include> sin src (${rawAttrs})`);
    let partial = readFileSync(resolve(partialsDir, attrs.src), 'utf8');
    partial = partial.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (match, key) => attrs[key] ?? '');
    return renderIncludes(partial, depth + 1);
  });
}

function htmlPartials() {
  return {
    name: 'stivenlux:html-partials',
    transformIndexHtml: { order: 'pre', handler: (html) => renderIncludes(html) },
    handleHotUpdate({ file, server }) {
      if (file.startsWith(partialsDir)) server.ws.send({ type: 'full-reload' });
    },
  };
}

function whatsappCheck() {
  return {
    name: 'stivenlux:whatsapp-check',
    apply: 'build',
    buildStart() {
      if (!site.whatsapp.number) {
        this.warn(
          'WhatsApp sin configurar: define site.whatsapp.number en src/config/site.js. ' +
            'Mientras tanto los CTA de WhatsApp apuntan a la sección #contacto.',
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [htmlPartials(), whatsappCheck()],
  build: {
    target: 'es2020',
    cssMinify: true,
  },
});
