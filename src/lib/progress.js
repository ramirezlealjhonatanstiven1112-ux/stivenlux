/* Progresos ligados al scroll, de 0 a 1. Entradas en píxeles. */
export const clamp01 = (value) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0);

/* Recorrido completo: 0 cuando el borde superior entra por abajo, 1 cuando el inferior sale por arriba. */
export function traverseProgress(top, height, viewportHeight) {
  return clamp01((viewportHeight - top) / (viewportHeight + height));
}

/* Entrada: 0 al asomar por abajo, 1 cuando el borde superior ha subido el 75 % del viewport. */
export function enterProgress(top, viewportHeight) {
  return clamp01((viewportHeight - top) / (viewportHeight * 0.75));
}

/* Hero: 0 arriba del todo, 1 tras desplazar una pantalla completa. */
export function heroProgress(scrollY, viewportHeight) {
  return clamp01(scrollY / viewportHeight);
}
