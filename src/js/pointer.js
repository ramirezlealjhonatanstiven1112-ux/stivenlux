/* Microinteracciones de puntero (spec 002): cursor complementario, botones magnéticos y hovers con dirección.
   Las entradas solo guardan el dato y piden fotograma; las lecturas y escrituras van en el planificador único
   de scroll-fx.js (sin listener de scroll propio). Los cálculos están en src/lib/pointer.js. */
import {
  boxDistance,
  isFullWidth,
  isModifierKey,
  isRing,
  magnetActive,
  magnetAllowed,
  magnetOffset,
  parseTranslate,
  pointerMode,
} from '../lib/pointer.js';
import { addFrameHook } from './scroll-fx.js';

export function initPointer() {
  const root = document.documentElement;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const forced = matchMedia('(forced-colors: active)');
  const actions = document.querySelector('.hero__actions');
  const menu = document.querySelector('[data-menu]');
  let px = 0;
  let py = 0;
  let inside = false; // puntero dentro de la ventana
  let moved = false; // se ha movido desde la última tecla o toque
  let touch = false; // último dato de entrada táctil (híbrido)
  let menuMoving = false;
  let gen = 0;
  let mode;
  let show = false;
  let ring = false;
  let dot = null;
  let placed = false; // el punto ya está colocado y se puede mostrar
  const magnets = [...document.querySelectorAll('[data-magnet]')].map((el) => ({ el, hero: !!el.closest('.hero'), on: false }));

  /* Los CTA del hero aún no se ven o siguen en su fundido de entrada. */
  const entering = () => !root.classList.contains('is-ready') || actions?.getAnimations().some((a) => a.playState !== 'finished');

  function read() {
    mode = pointerMode(fine.matches, reduce.matches, forced.matches);
    const present = inside && !touch;
    show = mode.dot && present && moved;
    // Imanes: destino desde el área de reposo (caja actual − desplazamiento animado), con histéresis (RF-7–RF-9)
    for (const m of magnets) {
      m.to = { x: 0, y: 0 };
      if (!mode.magnet || !present) {
        m.on = false;
        continue;
      }
      const r = m.el.getBoundingClientRect();
      const t = parseTranslate(window.getComputedStyle(m.el).translate);
      const box = new window.DOMRect(r.x - t.x, r.y - t.y, r.width, r.height);
      m.on =
        magnetAllowed(
          root.classList.contains('menu-open'),
          menuMoving,
          m.el.matches(':focus-visible'),
          m.hero && entering(),
          isFullWidth(r.width, m.el.parentElement.clientWidth),
        ) && magnetActive(m.on, boxDistance(px, py, box));
      if (m.on) m.to = magnetOffset(px, py, box);
    }
    // El punto no cuenta: pointer-events: none
    const hit = show ? document.elementFromPoint(px, py)?.closest('a[href], button') : null;
    ring = isRing(hit, hit?.closest('.hero__actions'), hit && entering(), menuMoving);
  }

  function write() {
    // Solo si cambia el destino: en táctil (siempre 0) no se escribe nada (RF-20)
    for (const m of magnets) {
      const x = `${m.to.x.toFixed(2)}px`;
      const y = `${m.to.y.toFixed(2)}px`;
      if (x + y === (m.v ?? '0.00px0.00px')) continue;
      m.v = x + y;
      m.el.style.setProperty('--mgx', x);
      m.el.style.setProperty('--mgy', y);
    }
    if (!mode.dot && dot) {
      dot.remove();
      dot = null;
    }
    if (show && !dot) {
      document.body.insertAdjacentHTML('beforeend', '<div class="cursor is-off" aria-hidden="true"><i></i><i></i></div>');
      dot = document.body.lastChild;
    }
    if (!dot) return;
    dot.style.transform = `translate3d(${px}px,${py}px,0)`;
    dot.classList.toggle('is-ring', ring);
    if (!show) {
      dot.classList.add('is-off');
      placed = false;
    } else if (placed) dot.classList.remove('is-off');
    else {
      // Colocado sin transición; se muestra en el siguiente fotograma, sin deslizarse desde la última posición
      placed = true;
      request();
    }
  }

  const request = addFrameHook({ read, write });

  const onTouch = () => {
    if (!fine.matches) return; // sin puntero fino no hay nada que apagar (RF-20)
    touch = true;
    moved = false;
    root.classList.add('is-touch');
    request();
  };
  const leave = () => {
    inside = false;
    request();
  };
  const passive = { capture: true, passive: true };

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return onTouch();
      px = e.clientX;
      py = e.clientY;
      inside = moved = true;
      if (touch) {
        touch = false;
        root.classList.remove('is-touch');
      }
      request();
    },
    passive,
  );
  window.addEventListener('pointerdown', (e) => e.pointerType === 'touch' && onTouch(), passive);
  window.addEventListener('keydown', (e) => {
    if (isModifierKey(e.key)) return;
    moved = false;
    request();
  });
  document.addEventListener('mouseout', (e) => !e.relatedTarget && leave());
  window.addEventListener('blur', leave);
  document.addEventListener('focusin', request);
  document.addEventListener('focusout', request);
  actions?.addEventListener('animationend', request);
  // Menú en transición hasta que acaban todas sus animaciones (sin los colores de hover de sus enlaces)
  document.addEventListener('menuchange', () => {
    const g = ++gen;
    menuMoving = true;
    request();
    const anims = menu.getAnimations({ subtree: true }).filter((a) => a.transitionProperty !== 'color');
    Promise.allSettled(anims.map((a) => a.finished)).then(() => {
      if (g !== gen) return;
      menuMoving = false;
      request();
    });
  });
  for (const mq of [fine, reduce, forced]) mq.addEventListener('change', request);

  // Hovers con dirección (RF-10, RF-11): al salir, .is-out (sale por la derecha) hasta acabar su transición, o
  // hasta que el foco con teclado la cancela (sin transición, no llegaría su fin). Una cancelación por volver a
  // salir no lo quita: la nueva salida ya está en curso. Con colores forzados no hay transición: no se pone
  const animated = (e) => e.pointerType !== 'touch' && !forced.matches;
  for (const el of document.querySelectorAll('.btn, .nav__cta, .footer__nav a')) {
    el.addEventListener('pointerleave', (e) => animated(e) && el.classList.add('is-out'));
    el.addEventListener('transitionend', (e) => e.propertyName === '--sa' && el.classList.remove('is-out'));
    el.addEventListener('transitioncancel', () => el.matches(':focus-visible') && el.classList.remove('is-out'));
  }
  // «Ver proyectos»: la salida y vuelta del subrayado termina aunque el puntero salga
  const link = document.querySelector('.hero .link');
  link?.addEventListener('pointerenter', (e) => animated(e) && link.classList.add('is-relink'));
  for (const t of ['animationend', 'animationcancel']) link?.addEventListener(t, () => link.classList.remove('is-relink'));
}
