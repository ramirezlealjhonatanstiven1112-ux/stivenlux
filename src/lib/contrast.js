/* Contraste WCAG 2.x para los tests de la spec 002 (RF-2, RF-11). La página no lo importa: no pesa. */

/* 'rgb(…)', 'rgba(…)' o '#rrggbb' → [r, g, b] en 0–255. */
export function parseColor(color) {
  if (color.startsWith('#')) return [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  return color.match(/[\d.]+/g).slice(0, 3).map(Number);
}

export function luminance([r, g, b]) {
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a, b) {
  const la = luminance(parseColor(a));
  const lb = luminance(parseColor(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* «Al menos uno de los dos tonos» (RF-2): el mejor contraste de una lista de colores sobre un fondo. */
export const bestOf = (colors, background) => Math.max(...colors.map((c) => contrastRatio(c, background)));
