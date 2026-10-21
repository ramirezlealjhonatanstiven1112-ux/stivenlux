/* Cortinas entre secciones, palabras de filosofía y compuerta del primer escenario (spec 001).
   Entradas en píxeles, en coordenadas de documento salvo que se indique. Sin DOM. */
import { clamp01, rangeProgress } from './progress.js';

/* Fracción de la ventana que sube el borde de la sección hasta que la cortina llega a 1. */
export const CURTAIN_RISE = { desktop: 0.6, mobile: 0.4 };

/* Tramo de scroll de la cortina: empieza cuando el borde asoma por abajo y acaba cuando ha subido rise·alto,
   acortado al final de página para que en maxScroll el progreso valga siempre 1 (RF-11). */
export function curtainRange(sectionTop, viewportHeight, maxScroll, rise) {
  const start = sectionTop - viewportHeight;
  const end = Math.min(sectionTop - viewportHeight * (1 - rise), maxScroll);
  return { start, end };
}

/* Scroll en el que el centro del texto alcanza el centro de la ventana. */
export function wordsEnd(textTop, textHeight, viewportHeight) {
  return textTop + textHeight / 2 - viewportHeight / 2;
}

/* Palabras de filosofía: 0 hasta que la cortina llega a 1 (RF-12), 1 con el centro del texto en el centro. */
export function wordsProgress(scrollY, curtainEnd, textEnd) {
  if (scrollY < curtainEnd) return 0;
  return rangeProgress(scrollY, curtainEnd, textEnd);
}

/* Regla de la spec 000 (hasta el asentamiento de la carga, o si Filosofía fue vista al asentarse): misma
   curva a partir del recorrido. */
export function legacyWordsProgress(traverse) {
  return clamp01((traverse - 0.12) / 0.38);
}

/* Primer escenario de proyectos: no se abre hasta que la cortina de Proyectos llega a 1 (RF-13). */
export function gated(value, curtain) {
  return curtain >= 1 ? value : 0;
}
