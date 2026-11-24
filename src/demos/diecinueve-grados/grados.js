import { choose, dropPast, firstMissing, formatDate, isoDate, nextDays } from '../../lib/appointment.js';
import { coolness } from '../../lib/thermostat.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const VIEW_OF = { service: 'visita', date: 'visita-fecha', review: 'visita-resumen' };
const ORDER = Object.keys(VIEW_OF);
const REQUIRED = ['service', 'date'];
const MISSING = { service: 'Elige un servicio para continuar.', date: 'Elige un día para continuar.' };

/* ── Termostato ─────────────────────────────────────────── */
const dial = $('[data-dial]');

function setTemp() {
  const temp = Number(dial.value);
  $('[data-temp]').textContent = temp;
  dial.setAttribute('aria-valuetext', `${temp} grados`);
  document.documentElement.style.setProperty('--cool', `${Math.round(coolness(temp, Number(dial.max), Number(dial.min)) * 100)}%`);
}

dial.addEventListener('input', setTemp);

/* ── Visita por pasos: solo en memoria, nada se guarda ni se envía ── */
let state = {};
let confirmed = false;

const serviceName = () => $(`[name="service"][value="${state.service}"]`).dataset.name;
const capital = (text) => text[0].toUpperCase() + text.slice(1);

function span(className, text) {
  const el = document.createElement('span');
  el.className = className;
  el.textContent = text;
  return el;
}

function dayOption(iso) {
  const label = document.createElement('label');
  label.className = 'pick';
  const input = document.createElement('input');
  Object.assign(input, { type: 'radio', name: 'date', value: iso, checked: state.date === iso });
  input.setAttribute('aria-label', formatDate(iso));
  label.append(
    input,
    span('pick__week', formatDate(iso, { weekday: 'short' })),
    span('pick__num', formatDate(iso, { day: 'numeric' })),
    span('pick__month', formatDate(iso, { month: 'short' })),
  );
  return label;
}

const RENDER = {
  service: () => $$('[name="service"]').forEach((el) => (el.checked = el.value === state.service)),
  date: () => $('[data-days]').replaceChildren(...nextDays(isoDate(new Date()), 12).map(dayOption)),
  review() {
    $('[data-r="service"]').textContent = serviceName();
    $('[data-r="date"]').textContent = capital(formatDate(state.date));
  },
};

document.addEventListener('change', ({ target }) => {
  if (!(target.name in MISSING)) return;
  state = choose(state, target.name, target.value);
  target.form.querySelector('.error').textContent = '';
});

document.addEventListener('click', ({ target }) => {
  const link = target.closest('[data-service]');
  if (link) state = choose(state, 'service', link.dataset.service);
});

document.addEventListener('submit', (event) => {
  event.preventDefault();
  const step = event.target.dataset.form;
  state = dropPast(state, isoDate(new Date()));
  if (step === 'review' && !state.date) {
    route();
    return;
  }
  if (step === 'review') {
    $('[data-done]').textContent = `${serviceName()}, ${formatDate(state.date)}.`;
    confirmed = true;
    state = {};
    window.location.replace('#listo');
    return;
  }
  if (!state[step]) {
    event.target.querySelector('.error').textContent = MISSING[step];
    event.target.querySelector('input').focus();
    return;
  }
  window.location.hash = VIEW_OF[ORDER[ORDER.indexOf(step) + 1]];
});

/* ── Vistas: una por ancla; cada paso exige los anteriores ─ */
const views = $$('[data-view]');

function route(first = false) {
  let id = window.location.hash.slice(1) || 'inicio';
  if (id === 'listo' && !confirmed) id = 'inicio';
  let view = views.find((el) => el.id === id);
  if (!view) return; // p. ej. #contenido: ancla normal
  if (id !== 'listo') confirmed = false;

  state = dropPast(state, isoDate(new Date()));
  const missing = firstMissing(state, REQUIRED);
  let { step } = view.dataset;
  if (step && missing && ORDER.indexOf(step) > ORDER.indexOf(missing)) {
    step = missing;
    view = document.getElementById(VIEW_OF[step]);
    window.history.replaceState(null, '', `#${view.id}`);
  }
  if (step) {
    RENDER[step]();
    const error = view.querySelector('.error');
    if (error) error.textContent = '';
  }

  views.forEach((el) => el.classList.toggle('is-on', el === view));
  document.title = `${view.dataset.title} · Diecinueve Grados · Modelo de demostración de Stiven Lux`;
  window.scrollTo(0, 0);
  if (!first) view.querySelector('[tabindex="-1"]').focus({ preventScroll: true });
}

setTemp();
window.addEventListener('hashchange', () => route());
route(true);
