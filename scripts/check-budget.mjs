// Presupuesto de peso (constitución, principio 6): JS ≤ 15 KB y CSS ≤ 20 KB comprimidos con gzip.
// Además, cada spec tiene un margen de incremento en bytes sobre su base.
// Para comprobar que falla: `npm run budget -- --allowance-js=-1` (o `--allowance-css=N`) fuerza un margen menor.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { budgetCheck } from '../src/lib/budget.js';
import { IMAGE_BUDGET, checkImageFiles } from '../src/lib/image-budget.js';

const LIMITS = { js: 15 * 1024, css: 20 * 1024 };
// Spec 003, build de 18cd88b (tests/e2e/fixtures/spec003-base.json) y margen del plan 003: sin JS nuevo.
// La 002 tenía base 0f6b12d (JS 3.965, CSS 10.731) y margen +1.636 / +2.048.
const SPEC = '003';
const BASE = { js: 5555, css: 11653 };
const ALLOWANCE = { js: 0, css: 1024 };

for (const arg of process.argv.slice(2)) {
  const match = /^--allowance-(js|css)=(-?\d+)$/.exec(arg);
  if (!match) {
    console.error(`Argumento no reconocido: ${arg}`);
    process.exit(2);
  }
  ALLOWANCE[match[1]] = Number(match[2]);
}

const signed = (n) => `${n < 0 ? '−' : '+'}${Math.abs(n)}`;
const dir = 'dist/assets';
let failed = false;

// Lo que carga cada página: los archivos de dist/assets que enlaza su HTML (entradas, preloads y estilos)
function pageSize(html, ext) {
  const names = new Set([...readFileSync(html, 'utf8').matchAll(/\/assets\/([\w.-]+)"/g)].map((m) => m[1]));
  return [...names]
    .filter((name) => name.endsWith(`.${ext}`))
    .reduce((sum, name) => sum + gzipSync(readFileSync(join(dir, name))).length, 0);
}

for (const [ext, limit] of Object.entries(LIMITS)) {
  const size = pageSize('dist/index.html', ext);
  failed ||= size === 0;
  const { delta, ok } = budgetCheck({ size, base: BASE[ext], allowance: ALLOWANCE[ext], limit });
  failed ||= !ok;
  console.log(
    `${ok ? 'OK ' : 'MAL'} ${ext.toUpperCase().padEnd(3)} ${(size / 1024).toFixed(1)} KB gzip (${size} B; límite ${limit / 1024} KB)` +
      ` · ${signed(delta)} B sobre la base (máx. ${signed(ALLOWANCE[ext])} B, spec ${SPEC})`,
  );
}

// Demos (spec 004): cada página cumple por separado los límites de la constitución
const demosDir = 'dist/demos';
for (const demo of existsSync(demosDir) ? readdirSync(demosDir) : []) {
  for (const [ext, limit] of Object.entries(LIMITS)) {
    const size = pageSize(join(demosDir, demo, 'index.html'), ext);
    const ok = size > 0 && size <= limit;
    failed ||= !ok;
    console.log(`${ok ? 'OK ' : 'MAL'} ${ext.toUpperCase().padEnd(3)} demo ${demo}: ${size} B gzip (límite ${limit / 1024} KB)`);
  }
}

// Fotos de concepto (spec 003, RNF-1): cada AVIF o WebP publicado ≤ 90 KB. El JPEG de respaldo no cuenta.
const photosDir = 'public/media/conceptos';
if (existsSync(photosDir)) {
  const photos = readdirSync(photosDir)
    .filter((name) => /\.(avif|webp)$/.test(name))
    .map((name) => ({ name, size: statSync(join(photosDir, name)).size }));
  const { ok, over } = checkImageFiles(photos);
  failed ||= !ok;
  const biggest = Math.max(0, ...photos.map((p) => p.size));
  console.log(
    `${ok ? 'OK ' : 'MAL'} IMG ${photos.length} fotos AVIF/WebP · la mayor ${(biggest / 1024).toFixed(1)} KB` +
      ` (máx. ${IMAGE_BUDGET.perFile / 1024} KB por foto)` +
      (ok ? '' : ` · se pasan: ${over.map((p) => `${p.name} ${p.size} B`).join(', ')}`),
  );
}

if (failed) {
  console.error('Presupuesto superado: reduce el peso o justifica el cambio en la spec.');
  process.exit(1);
}
