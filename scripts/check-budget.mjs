// Presupuesto de peso (constitución, principio 6): JS ≤ 15 KB y CSS ≤ 20 KB comprimidos con gzip.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const LIMITS = { '.js': 15 * 1024, '.css': 20 * 1024 };
const dir = 'dist/assets';
let failed = false;

for (const [ext, limit] of Object.entries(LIMITS)) {
  const files = readdirSync(dir).filter((name) => name.endsWith(ext));
  const size = files.reduce((sum, name) => sum + gzipSync(readFileSync(join(dir, name))).length, 0);
  const ok = size <= limit;
  failed ||= !ok;
  console.log(`${ok ? 'OK ' : 'MAL'} ${ext.slice(1).toUpperCase().padEnd(3)} ${(size / 1024).toFixed(1)} KB gzip (límite ${limit / 1024} KB)`);
}

if (failed) {
  console.error('Presupuesto superado: reduce el peso o justifica el cambio en la spec.');
  process.exit(1);
}
