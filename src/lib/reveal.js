/* Revelado de titulares de sección (spec 001). Entradas en píxeles, relativas a la ventana. Sin DOM. */

/* Asentamiento de la carga, en ms: intervalo corto sin scroll y tope desde la ejecución del script.
   quiet = 400 (el plan parte de 200): en las pruebas, el salto suave al ancla o la restauración del scroll
   llegan a pasar ~200 ms entre fotogramas con el hilo principal ocupado; el tope de 1 s no cambia. */
export const SETTLE = { quiet: 400, max: 1000 };

/* Visto al asentarse la carga: al menos 1 px dentro de la ventana o por encima de ella (RF-16, RF-19). */
export function seenOnSettle(top, viewportHeight) {
  return top < viewportHeight;
}

/* ¿Se ha asentado la carga? Tiempos de performance.now(): start = ejecución del script, loadedAt = fin de
   la carga (null si aún no), lastMove = último fotograma con scroll distinto. Se asienta tras quiet ms sin
   scroll desde la carga o, como muy tarde, max ms después del script. wait: cuándo volver a mirar. */
export function settleCheck({ now, start, loadedAt, lastMove, quiet = SETTLE.quiet, max = SETTLE.max }) {
  const untilMax = max - (now - start);
  if (untilMax <= 0) return { due: true, wait: 0 };
  if (loadedAt == null) return { due: false, wait: untilMax };
  const calm = now - Math.max(loadedAt, lastMove);
  if (calm >= quiet) return { due: true, wait: 0 };
  return { due: false, wait: Math.min(quiet - calm, untilMax) };
}

/* Condición de revelado: fuentes listas, cortina en 1, dentro de la ventana y con el borde superior por
   encima del 85 % del alto, o al final de página con cualquier parte dentro (RF-11, RF-12, RF-13, RF-14). */
export function shouldReveal({ top, bottom, viewportHeight, curtain, atEnd, ready }) {
  const inside = bottom > 0 && top < viewportHeight;
  return Boolean(ready) && curtain >= 1 && inside && (top < 0.85 * viewportHeight || Boolean(atEnd));
}

/* Agrupa palabras en líneas según su posición vertical (en orden). Un top que se separa más de tolerance
   del de la línea actual abre una nueva; de la línea maxLines en adelante van todas juntas (RF-14).
   Devuelve un array de líneas, cada una con los índices de sus palabras. */
export function groupLines(tops, maxLines = 6, tolerance = 1) {
  const lines = [];
  let lineTop = 0;
  tops.forEach((top, index) => {
    if (!lines.length || Math.abs(top - lineTop) > tolerance) {
      lines.push([]);
      lineTop = top;
    }
    lines[lines.length - 1].push(index);
  });
  if (lines.length > maxLines) lines.push(lines.splice(maxLines - 1).flat());
  return lines;
}

/* Tiempos en ms. Escritorio: 90 ms entre máscaras y total ≤ 880 ms (margen de 20 ms sobre los 900 de
   RF-14). Móvil: un único bloque sin escalonado en 500 ms (RF-15). */
export function revealTiming(lineCount, mobile) {
  if (mobile) return { duration: 500, stagger: 0 };
  const masks = Math.min(Math.max(lineCount, 1), 6);
  const stagger = 90;
  return { duration: Math.min(700, 880 - (masks - 1) * stagger), stagger };
}
