/* Efectos ligados al scroll sin bloquearlo ni secuestrarlo.
   Solo calcula elementos visibles y escribe dos variables CSS por elemento:
   --p: recorrido completo por el viewport (0 → 1)
   --e: entrada en pantalla (0 → 1)
   El hero recibe --hero-p (0 → 1 durante la primera pantalla), siempre que cambie, y .is-leaving
   mientras valga más de 0: al entrar se borra la inclinación del puntero (RF-6).
   Cada sección con frontera de tono ([data-curtain]) recibe --c, su progreso de cortina (0 → 1), siempre
   ligado al scroll: se cierra al subir y se abre al bajar (RF-7), y vale 1 al final de la página (RF-11).
   El texto de filosofía recibe --w, el progreso de sus palabras: espera a que la cortina de Filosofía llegue
   a 1, salvo que la sección estuviera a la vista al asentarse la carga (regla de la spec 000, RF-12).
   Asentamiento de la carga (RF-16, RF-19): lo «visto» se decide en el primer fotograma con 400 ms sin
   scroll tras `load` (o tras el script, si la carga ya terminó) o 1 s después del script (settleCheck).
   Así se espera a la restauración del scroll al recargar y al salto al ancla, que llegan después del
   script. Hasta entonces nada queda pendiente y las palabras siguen la regla de la spec 000; cortinas,
   salida del hero y primer escenario siguen el scroll desde el principio.
   El primer escenario de proyectos tiene --e = 0 mientras la cortina de Proyectos no llegue a 1 (RF-13).
   Los titulares de sección pendientes se revelan cuando cumplen su condición (reveal.js, RF-14 a RF-17);
   `ready` es la promesa de las fuentes de la marca: al cumplirse se recalcula todo (también --c, por si las
   fuentes han desplazado las secciones sin scroll). */
import { enterProgress, heroProgress, rangeProgress, traverseProgress } from '../lib/progress.js';
import { CURTAIN_RISE, curtainRange, gated, legacyWordsProgress, wordsEnd, wordsProgress } from '../lib/curtain.js';
import { seenOnSettle, settleCheck } from '../lib/reveal.js';
import { toWords } from '../lib/words.js';
import { createReveal, revealTitle } from './reveal.js';

export function initScrollFx(ready = Promise.resolve()) {
  const visible = new Set();
  const hero = document.querySelector('.hero');
  const stage = document.querySelector('[data-hero-stage]');
  const curtains = [...document.querySelectorAll('[data-curtain]')].map((el) => ({ el, c: '' }));
  const desktop = matchMedia('(min-width: 48em)');
  const philosophy = curtains.find(({ el }) => el.id === 'filosofia');
  const statement = document.querySelector('.philosophy__statement[data-words]');
  const workIndex = curtains.findIndex(({ el }) => el.id === 'proyectos');
  const firstStage = document.querySelector('.project__stage');
  const reveal = createReveal();
  const scriptAt = window.performance.now();
  // Script tardío: la carga ya terminó y la calma cuenta desde el script
  let loadedAt = document.readyState === 'complete' ? scriptAt : null;
  let lastMove = scriptAt;
  let lastY = window.scrollY;
  let settled = false;
  let settleTimer = 0;
  let philosophySeen = false;
  let isReady = false;
  let frame = 0;
  let words = '';
  let firstE = '';
  let heroP = '';
  let leaving = false;

  function update() {
    frame = 0;

    // Lecturas: todas antes de escribir, para no forzar layouts intermedios
    const vh = window.innerHeight;
    const y = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - vh;
    const rise = desktop.matches ? CURTAIN_RISE.desktop : CURTAIN_RISE.mobile;
    const exit = heroProgress(y, vh);
    const nextHeroP = exit.toFixed(4);
    let philosophyEnd = 0;
    let philosophyTop = 0;
    const curtainP = curtains.map((curtain) => {
      const top = curtain.el.getBoundingClientRect().top;
      const { start, end } = curtainRange(top + y, vh, maxScroll, rise);
      if (curtain === philosophy) {
        philosophyEnd = end;
        philosophyTop = top;
      }
      return rangeProgress(y, start, end);
    });
    // Asentamiento con este mismo fotograma (el listener de scroll ya lo pide en cada movimiento)
    let toMark = [];
    if (!settled) {
      const now = window.performance.now();
      if (y !== lastY) {
        lastMove = now;
        lastY = y;
      }
      const { due, wait } = settleCheck({ now, start: scriptAt, loadedAt, lastMove });
      clearTimeout(settleTimer);
      if (due) {
        settled = true;
        window.removeEventListener('load', onLoad);
        philosophySeen = philosophy && seenOnSettle(philosophyTop, vh);
        toMark = reveal.settle(vh); // por debajo de la ventana: pendientes (solo lectura)
      } else {
        settleTimer = setTimeout(request, wait); // por si nada más pide fotograma
      }
    }
    const workC = workIndex < 0 ? 1 : curtainP[workIndex];
    const titles = reveal.due({
      vh,
      atEnd: y >= maxScroll - 1,
      ready: isReady,
      curtainOf: (section) => {
        const i = curtains.findIndex(({ el }) => el === section);
        return i < 0 ? 1 : curtainP[i];
      },
    });
    const progress = [];
    for (const el of visible) {
      const rect = el.getBoundingClientRect();
      const e = enterProgress(rect.top, vh);
      progress.push([el, traverseProgress(rect.top, rect.height, vh).toFixed(4), (el === firstStage ? gated(e, workC) : e).toFixed(4)]);
    }
    // Fuera de la zona observada el primer escenario conserva su último --e: con la cortina < 1 se fija a 0
    const nextFirstE = firstStage && !visible.has(firstStage) && workC < 1 ? '0.0000' : '';
    let nextWords = '';
    if (statement) {
      const st = statement.getBoundingClientRect();
      nextWords = (
        !settled || philosophySeen
          ? legacyWordsProgress(traverseProgress(st.top, st.height, vh))
          : wordsProgress(y, philosophyEnd, wordsEnd(st.top + y, st.height, vh))
      ).toFixed(4);
    }

    // Escrituras. --hero-p siempre que cambie: la misma posición da el mismo estado (RF-4)
    if (hero && nextHeroP !== heroP) {
      heroP = nextHeroP;
      hero.style.setProperty('--hero-p', heroP);
    }
    if (hero && exit > 0 !== leaving) {
      leaving = exit > 0;
      hero.classList.toggle('is-leaving', leaving);
      // Vuelve a neutro (transición de 0,5 s) y sigue así hasta el siguiente movimiento con progreso 0
      if (leaving && stage) {
        stage.style.removeProperty('--mx');
        stage.style.removeProperty('--my');
      }
    }
    curtains.forEach((curtain, i) => {
      const c = curtainP[i].toFixed(4);
      if (c === curtain.c) return;
      curtain.c = c;
      curtain.el.style.setProperty('--c', c);
    });
    for (const [el, p, e] of progress) {
      el.style.setProperty('--p', p);
      el.style.setProperty('--e', e);
      if (el === firstStage) firstE = e;
    }
    if (nextFirstE && nextFirstE !== firstE) {
      firstE = nextFirstE;
      firstStage.style.setProperty('--e', firstE);
    }
    if (nextWords !== words) {
      words = nextWords;
      statement.style.setProperty('--w', words);
    }
    for (const title of toMark) title.classList.add('is-pending'); // fuera de la ventana: sin cambio visible
    for (const title of titles) revealTitle(title, !desktop.matches);
  }

  const request = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  function onLoad() {
    loadedAt = window.performance.now();
    request();
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      request();
    },
    { rootMargin: '15% 0px' },
  );

  document.querySelectorAll('[data-scroll]').forEach((el) => observer.observe(el));
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  if (loadedAt === null) window.addEventListener('load', onLoad, { once: true });
  request();
  ready.then(() => {
    isReady = true;
    request();
  });
}

/* Divide un texto en palabras para iluminarlas progresivamente. */
export function splitWords() {
  document.querySelectorAll('[data-words]').forEach((el) => {
    const words = toWords(el.textContent);
    el.textContent = '';
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.style.setProperty('--i', i);
      span.textContent = word;
      el.append(span, i < words.length - 1 ? ' ' : '');
    });
    el.style.setProperty('--n', words.length);
  });
}
