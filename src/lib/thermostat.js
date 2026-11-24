/** Cuánto frío hay entre `hot` y `cold`: 0 en el extremo caliente, 1 en el frío. */
export function coolness(temp, hot, cold) {
  if (hot === cold) return 1;
  return Math.min(1, Math.max(0, (hot - temp) / (hot - cold)));
}
