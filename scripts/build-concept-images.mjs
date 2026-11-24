// Variantes de las fotos de concepto (spec 003, RNF-1, RNF-4 y RF-27).
// Uso: npm run images   (o: FFMPEG=/ruta/ffmpeg node scripts/build-concept-images.mjs)
//
// Lee los originales de media-src/conceptos/*.{png,jpg} (generados con IA; registro en registro.md) y escribe en
// public/media/conceptos/<nombre>-<ancho>.{avif,webp,jpg}, sin metadatos. Los anchos salen de WIDTHS (los que
// piden los srcset de src/partials/screens), sin pasar del ancho original. AVIF y WebP bajan de calidad hasta caber en 90 KB (RNF-1); el JPEG es el respaldo para navegadores antiguos y no cuenta en el presupuesto.
// Usa el ffmpeg del sistema (sin dependencias nuevas). Las variantes se versionan: el build no necesita ffmpeg.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { IMAGE_BUDGET } from '../src/lib/image-budget.js';

const SRC = 'media-src/conceptos';
const OUT = process.env.OUT ?? 'public/media/conceptos';
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';

const probe = spawnSync(FFMPEG, ['-version'], { encoding: 'utf8' });
if (probe.error || probe.status !== 0) {
  console.error(`No encuentro ffmpeg («${FFMPEG}»). Instálalo (winget install Gyan.FFmpeg) o indica FFMPEG=/ruta/ffmpeg.`);
  process.exit(2);
}
if (!existsSync(SRC)) {
  console.error(`No existe ${SRC}: ahí van los originales PNG.`);
  process.exit(2);
}
mkdirSync(OUT, { recursive: true });

function ffmpeg(args) {
  const run = spawnSync(FFMPEG, ['-v', 'error', '-y', ...args], { encoding: 'utf8' });
  if (run.status !== 0) throw new Error(`ffmpeg falló: ${run.stderr}`);
}

// Codifica bajando la calidad hasta caber en el límite. Devuelve el tamaño final.
function encodeWithin(input, output, width, steps, toArgs) {
  for (const q of steps) {
    ffmpeg(['-i', input, '-map_metadata', '-1', '-vf', `scale=${width}:-2:flags=lanczos`, ...toArgs(q), output]);
    const size = statSync(output).size;
    if (size <= IMAGE_BUDGET.perFile) return { size, q };
  }
  throw new Error(`${output} no cabe en ${IMAGE_BUDGET.perFile} B ni con la calidad más baja`);
}

const AVIF_CRF = [28, 32, 36, 40, 44, 48];
const WEBP_Q = [80, 72, 64, 56, 48];
const HERO = [640, 1000, 1376];
const WIDTHS = {
  'clima-manos': [480, 960],
  'odonto-retrato': [480, 960],
  'odonto-bodegon': [480, 960],
  // 960: ficha de producto de la demo Pulso (spec 004)
  'tienda-audifonos': [240, 360, 480, 960],
  'tienda-parlante': [240, 360, 480, 960],
  'tienda-reloj': [240, 360, 480, 960],
  default: [240, 360, 480],
};
// Restaurante y barbería salieron de la portada (spec 004): se conserva el original, no se publica.
const report = [];

// Ancho del original (de la salida de `ffmpeg -i`), para no ampliar nunca por encima de él (RNF-4).
function sourceWidth(input) {
  const run = spawnSync(FFMPEG, ['-hide_banner', '-i', input], { encoding: 'utf8' });
  const match = /Video:.*?\b(\d{2,5})x(\d{2,5})\b/.exec(run.stderr);
  if (!match) throw new Error(`No pude leer el tamaño de ${input}`);
  return Number(match[1]);
}

for (const file of readdirSync(SRC).filter((name) => /\.(png|jpe?g)$/i.test(name) && !/^(restaurante|barberia)-/.test(name)).sort()) {
  const input = join(SRC, file);
  const name = basename(file).replace(/\.(png|jpe?g)$/i, '');
  const max = sourceWidth(input);
  const wanted = name.endsWith('-hero') ? HERO : (WIDTHS[name] ?? WIDTHS.default);
  const widths = [...new Set(wanted.map((w) => Math.min(w, max)))];
  for (const width of widths) {
    const base = join(OUT, `${name}-${width}`);
    const avif = encodeWithin(input, `${base}.avif`, width, AVIF_CRF, (crf) => [
      '-c:v', 'libaom-av1', '-still-picture', '1', '-crf', String(crf), '-cpu-used', '4', '-pix_fmt', 'yuv420p',
    ]);
    const webp = encodeWithin(input, `${base}.webp`, width, WEBP_Q, (q) => ['-c:v', 'libwebp', '-quality', String(q)]);
    ffmpeg(['-i', input, '-map_metadata', '-1', '-vf', `scale=${width}:-2:flags=lanczos`, '-q:v', '4', `${base}.jpg`]);
    report.push({ variante: `${name}-${width}`, avif: avif.size, crf: avif.q, webp: webp.size, q: webp.q, jpg: statSync(`${base}.jpg`).size });
  }
}

console.table(report);
writeFileSync(join(SRC, 'variantes.json'), `${JSON.stringify(report, null, 1)}\n`);
