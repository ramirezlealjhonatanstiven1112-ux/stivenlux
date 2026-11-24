// Presupuesto de las fotos de concepto (spec 003, RNF-1 y RNF-2). Funciones puras: reciben las entradas de
// recursos (PerformanceResourceTiming o equivalentes) o la lista de archivos, sin tocar el DOM ni el disco.

export const IMAGE_BUDGET = {
  perFile: 90 * 1024, // cada archivo AVIF o WebP
  beforeScroll: 200 * 1024, // imágenes pedidas antes del primer scroll
  total: 700 * 1024, // todo lo que descarga un navegador moderno en una visita completa
};

const IMAGE_EXT = /\.(avif|webp|jpe?g|png|gif)(?:[?#]|$)/i;

/** ¿Es una imagen? Por tipo de iniciador `img` o por extensión (las de `<picture>` pueden venir como `other`). */
export function isImage({ name = '', initiatorType = '' }) {
  return initiatorType === 'img' || IMAGE_EXT.test(name);
}

/** Bytes de imagen descargados: `encodedBodySize` (no cambia con caché, a diferencia de `transferSize`). */
export function sumImageBytes(entries) {
  const seen = new Map();
  for (const entry of entries) {
    if (!isImage(entry) || seen.has(entry.name)) continue;
    seen.set(entry.name, entry.encodedBodySize ?? 0);
  }
  let sum = 0;
  for (const bytes of seen.values()) sum += bytes;
  return sum;
}

/** Archivos que superan el límite por foto. */
export function checkImageFiles(files, perFile = IMAGE_BUDGET.perFile) {
  const over = files.filter((file) => file.size > perFile);
  return { ok: over.length === 0, over };
}
