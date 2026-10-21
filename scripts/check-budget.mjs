// Presupuesto de peso (constitución, principio 6): JS ≤ 15 KB y CSS ≤ 20 KB comprimidos con gzip.
// Además, cada spec tiene un margen de incremento en bytes sobre su base.
// Para comprobar que falla: `npm run budget -- --allowance-js=-1` (o `--allowance-css=N`) fuerza un margen menor.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { budgetCheck } from '../src/lib/budget.js';

const LIMITS = { js: 15 * 1024, css: 20 * 1024 };
// Spec 001, build de 5f01f29: base medida por el coordinador y margen aprobado por el usuario.
const SPEC = '001';
const BASE = { js: 2236, css: 10080 };
const ALLOWANCE = { js: 2560, css: 3072 };

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

for (const [ext, limit] of Object.entries(LIMITS)) {
  const files = readdirSync(dir).filter((name) => name.endsWith(`.${ext}`));
  const size = files.reduce((sum, name) => sum + gzipSync(readFileSync(join(dir, name))).length, 0);
  const { delta, ok } = budgetCheck({ size, base: BASE[ext], allowance: ALLOWANCE[ext], limit });
  failed ||= !ok;
  console.log(
    `${ok ? 'OK ' : 'MAL'} ${ext.toUpperCase().padEnd(3)} ${(size / 1024).toFixed(1)} KB gzip (${size} B; límite ${limit / 1024} KB)` +
      ` · ${signed(delta)} B sobre la base (máx. ${signed(ALLOWANCE[ext])} B, spec ${SPEC})`,
  );
}

if (failed) {
  console.error('Presupuesto superado: reduce el peso o justifica el cambio en la spec.');
  process.exit(1);
}
