import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource-variable/inter-tight/wght.css';
import '@fontsource-variable/jetbrains-mono/wght.css';

import './styles/base.css';
import './styles/nav.css';
import './styles/devices.css';
import './styles/hero.css';
import './styles/sections.css';
import './styles/motion.css';

import { initMenu } from './js/menu.js';
import { initNavTone } from './js/nav-tone.js';
import { initWhatsapp } from './js/whatsapp.js';
import { initScrollFx, splitWords } from './js/scroll-fx.js';
import { initHeroTilt, initHeroVideo } from './js/hero.js';

const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

initMenu();
initNavTone();
initWhatsapp();
splitWords();

// La secuencia del hero arranca cuando las fuentes están listas (o en 1,2 s como máximo); el revelado de
// titulares espera a esa misma promesa
const fontsReady = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]);
fontsReady.then(() => {
  root.classList.add('is-ready');
});

document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

if (!reducedMotion) {
  initScrollFx(fontsReady);
  initHeroTilt();
  initHeroVideo();
}
