/* Revelado de titulares de sección (spec 001, RF-14 a RF-17). Lo llama scroll-fx.js desde su fotograma:
   - Al asentarse la carga (nunca antes), los titulares que están por debajo de la ventana quedan pendientes
     (.is-pending: ocultos con clip-path, sin cambiar el layout ni salir del árbol de accesibilidad).
   - Cuando cumplen la condición, se parten en palabras, se miden sus líneas reales, cada línea sube desde
     su máscara (@keyframes hero-line) y, al terminar, se restaura el HTML original: vuelve a ser texto normal. */
import { groupLines, revealTiming, seenOnSettle, shouldReveal } from '../lib/reveal.js';
import { toWords } from '../lib/words.js';

export function createReveal() {
  const titles = [...document.querySelectorAll('[data-reveal]')].map((title) => ({ title, section: title.closest('[data-curtain]') }));
  let pending = [];

  /* Lecturas, una vez al asentarse la carga: los de debajo de la ventana pasan a pendientes y se devuelven
     para que scroll-fx.js les ponga .is-pending en las escrituras (fuera de la ventana: sin cambio visible).
     Los vistos quedan en su estado final, sin animación. */
  function settle(vh) {
    pending = titles.filter(({ title }) => !seenOnSettle(title.getBoundingClientRect().top, vh));
    return pending.map(({ title }) => title);
  }

  /* Lecturas: titulares pendientes que cumplen ya la condición (dejan de estar pendientes). */
  function due({ vh, atEnd, ready, curtainOf }) {
    const found = [];
    for (let i = pending.length - 1; i >= 0; i -= 1) {
      const { title, section } = pending[i];
      const { top, bottom } = title.getBoundingClientRect();
      if (shouldReveal({ top, bottom, viewportHeight: vh, curtain: curtainOf(section), atEnd, ready })) {
        pending.splice(i, 1);
        found.unshift(title);
      }
    }
    return found;
  }

  return { settle, due };
}

/* Máscara de una línea: <span class="ln"><span>…</span></span>, con su orden y sus tiempos. */
function mask(index, duration, stagger, content) {
  const line = document.createElement('span');
  const inner = document.createElement('span');
  line.className = 'ln';
  line.style.cssText = `--li:${index};--rd:${duration}ms;--rs:${stagger}ms`;
  inner.append(...content);
  line.append(inner);
  return line;
}

/* Revela un titular: líneas reales en escritorio (RF-14), un único bloque en móvil (RF-15). */
export function revealTitle(title, mobile) {
  const original = title.cloneNode(true);
  let lines;

  if (mobile) {
    lines = [[...title.childNodes]];
  } else {
    // Cada palabra en un span para medir su línea; los <br> se quedan solo para medir
    const words = [];
    for (const node of [...title.childNodes]) {
      if (node.nodeType !== 3) continue; // solo nodos de texto
      const spans = toWords(node.textContent).map((word) => {
        const span = document.createElement('span');
        span.textContent = word;
        words.push(span);
        return span;
      });
      node.replaceWith(...spans.flatMap((span, i) => (i ? [' ', span] : [span])));
    }
    // Una sola lectura de layout por titular, en el momento del revelado
    lines = groupLines(words.map((span) => span.offsetTop)).map((group) => [
      group.map((i) => words[i].textContent).join(' '),
    ]);
  }

  const { duration, stagger } = revealTiming(lines.length, mobile);
  // Un espacio entre máscaras: el texto sigue siendo una sola frase con sus espacios
  title.replaceChildren(
    ...lines.flatMap((content, i) => (i ? [' ', mask(i, duration, stagger, content)] : [mask(i, duration, stagger, content)])),
  );
  title.classList.replace('is-pending', 'is-revealing'); // mismo fotograma: sin parpadeo

  setTimeout(
    () => {
      title.replaceChildren(...original.childNodes); // RF-16: vuelve a fluir como texto normal
      title.classList.remove('is-revealing');
    },
    duration + (lines.length - 1) * stagger + 50,
  );
}
