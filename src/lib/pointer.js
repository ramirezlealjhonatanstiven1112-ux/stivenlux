/* Microinteracciones de puntero (spec 002): imán, histéresis, modo de puntero y forma del punto.
   Coordenadas del viewport en px; una caja es { left, top, right, bottom, width, height }. Sin DOM. */

/* reach: alcance del imán; release: retirada (histéresis); edge: desplazamiento con el puntero en el borde
   (≥ 3 px); max: tope del desplazamiento (RF-7). */
export const MAGNET = { reach: 24, release: 32, edge: 5, max: 8 };

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/* Distancia del puntero al área de reposo: 0 dentro o en el borde. */
export function boxDistance(px, py, box) {
  return Math.hypot(Math.max(box.left - px, 0, px - box.right), Math.max(box.top - py, 0, py - box.bottom));
}

/* Destino del imán hacia el puntero. Dentro: edge·(posición relativa al centro), 0 en el centro y edge en el
   borde. Fuera: el valor del punto más cercano del borde, que se apaga de forma lineal hasta 0 a reach px.
   Continuo en el borde y en reach, sin pasar de max. Entre reach y release vale 0 (la histéresis solo decide
   cuándo se retira el efecto). */
export function magnetOffset(px, py, box) {
  const { reach, edge, max } = MAGNET;
  const hw = box.width / 2;
  const hh = box.height / 2;
  if (hw <= 0 || hh <= 0) return { x: 0, y: 0 };
  const qx = clamp(px, box.left, box.right);
  const qy = clamp(py, box.top, box.bottom);
  const d = Math.hypot(px - qx, py - qy);
  if (d >= reach) return { x: 0, y: 0 };
  const k = (1 - d / reach) * edge;
  let x = ((qx - box.left - hw) / hw) * k;
  let y = ((qy - box.top - hh) / hh) * k;
  const m = Math.hypot(x, y);
  if (m > max) {
    x *= max / m;
    y *= max / m;
  }
  return { x, y };
}

/* Histéresis: se activa a reach px o menos y solo se retira a más de release px. */
export function magnetActive(active, distance) {
  return distance <= MAGNET.reach || (active && distance <= MAGNET.release);
}

/* El botón ocupa todo el ancho de su contenedor (RF-8). */
export function isFullWidth(width, containerWidth, tolerance = 1) {
  return Math.abs(width - containerWidth) <= tolerance;
}

/* fine = puntero principal fino con hover. Sin punto con movimiento reducido o colores forzados; sin imán
   con movimiento reducido (RF-1, RF-6, RF-16, RF-22). Argumentos posicionales: los nombres de propiedad no se
   minifican y el presupuesto de JS es estrecho. */
export function pointerMode(fine, reduced, forced) {
  return { dot: fine && !reduced && !forced, magnet: fine && !reduced };
}

/* Aro (true) sobre un pulsable, salvo los CTA del hero durante su entrada y el menú en transición (RF-3,
   RF-5); disco (false) en otro caso. */
export function isRing(pressable, heroCta, ctaEntering, menuMoving) {
  return !!pressable && !menuMoving && !(heroCta && ctaEntering);
}

/* Imán permitido, con modo de imán y puntero presente (dentro de la ventana y último dato de entrada no
   táctil; lo comprueba quien llama): sin menú abierto ni en transición, sin foco de teclado, fuera de la
   entrada del CTA y sin ocupar todo el ancho (RF-7–RF-9, RF-21). */
export function magnetAllowed(menuOpen, menuMoving, focused, entering, fullWidth) {
  return !menuOpen && !menuMoving && !focused && !entering && !fullWidth;
}

/* Las teclas modificadoras no ocultan el punto (RF-6). AltGraph es el Alt derecho; Cmd llega como Meta. */
export const isModifierKey = (key) => ['Control', 'Shift', 'Alt', 'AltGraph', 'Meta'].includes(key);

/* Valor calculado de la propiedad translate («none», «5px» o «5px 3px»). */
export function parseTranslate(value) {
  const [x = 0, y = 0] = value && value !== 'none' ? value.split(' ').map(parseFloat) : [];
  return { x: x || 0, y: y || 0 };
}
