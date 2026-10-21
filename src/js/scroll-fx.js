/* Efectos ligados al scroll sin bloquearlo ni secuestrarlo.
   Solo calcula elementos visibles y escribe dos variables CSS por elemento:
   --p: recorrido completo por el viewport (0 → 1)
   --e: entrada en pantalla (0 → 1)
   El hero recibe --hero-p (0 → 1 durante la primera pantalla). */
import { enterProgress, heroProgress, traverseProgress } from '../lib/progress.js';
import { toWords } from '../lib/words.js';

export function initScrollFx() {
  const visible = new Set();
  const hero = document.querySelector('.hero');
  let frame = 0;

  function update() {
    frame = 0;
    const vh = window.innerHeight;

    for (const el of visible) {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--p', traverseProgress(rect.top, rect.height, vh).toFixed(4));
      el.style.setProperty('--e', enterProgress(rect.top, vh).toFixed(4));
    }

    if (hero && window.scrollY < vh * 1.5) {
      hero.style.setProperty('--hero-p', heroProgress(window.scrollY, vh).toFixed(4));
    }
  }

  const request = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

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
  request();
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
