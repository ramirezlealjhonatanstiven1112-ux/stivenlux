import { site } from '../config/site.js';
import { shouldUseHeroVideo } from '../lib/hero-video.js';

const desktop = matchMedia('(min-width: 48em)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

/* Inclinación sutil de la escena con el puntero (solo escritorio con ratón). */
export function initHeroTilt() {
  const hero = document.querySelector('.hero');
  const stage = document.querySelector('[data-hero-stage]');
  if (!hero || !stage || !finePointer.matches) return;

  let frame = 0;
  let x = 0;
  let y = 0;

  hero.addEventListener('pointermove', (event) => {
    const rect = hero.getBoundingClientRect();
    x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    if (!frame) {
      frame = requestAnimationFrame(() => {
        frame = 0;
        stage.style.setProperty('--mx', x.toFixed(3));
        stage.style.setProperty('--my', y.toFixed(3));
      });
    }
  });

  hero.addEventListener('pointerleave', () => {
    stage.style.setProperty('--mx', 0);
    stage.style.setProperty('--my', 0);
  });
}

/* Video del hero (Higgsfield). Solo escritorio, sin ahorro de datos y con el archivo configurado.
   Sustituye a la escena HTML desde el principio para no ensamblar dos veces; si no puede
   reproducirse, se retira y vuelve la escena HTML. Una sola reproducción: acaba en la composición final. */
export function initHeroVideo() {
  const { mp4, webm, poster } = site.heroVideo;
  const hero = document.querySelector('.hero');
  const useVideo = shouldUseHeroVideo({
    mp4,
    webm,
    isDesktop: desktop.matches,
    saveData: Boolean(navigator.connection?.saveData),
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  });
  if (!hero || !useVideo) return;

  const video = document.createElement('video');
  video.className = 'hero__video';
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.setAttribute('aria-hidden', 'true');
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  if (poster) video.poster = poster;

  for (const [src, type] of [[webm, 'video/webm'], [mp4, 'video/mp4']]) {
    if (!src) continue;
    const source = document.createElement('source');
    source.src = src;
    source.type = type;
    video.append(source);
  }

  const fallback = () => {
    hero.classList.remove('is-video');
    video.remove();
  };

  // El navegador prueba los <source> en orden: solo el fallo del último significa que no hay video
  video.addEventListener('error', fallback);
  video.lastElementChild.addEventListener('error', fallback);
  hero.classList.add('is-video');
  hero.prepend(video);
  video.play().catch(fallback);
}
