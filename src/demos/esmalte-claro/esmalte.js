import { choose, dropPast, firstMissing, formatDate, isoDate, nextDays, slotsFor } from '../../lib/appointment.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const VIEW_OF = { service: 'cita', date: 'cita-fecha', time: 'cita-hora', review: 'cita-resumen' };
const ORDER = Object.keys(VIEW_OF);
const MISSING = { service: 'Elige un tratamiento para continuar.', date: 'Elige un día para continuar.', time: 'Elige una hora para continuar.' };

// Solo en memoria: la demo no guarda ni envía nada
let state = {};
let confirmed = false;

const serviceName = () => $(`[name="service"][value="${state.service}"]`).dataset.name;
const capital = (text) => text[0].toUpperCase() + text.slice(1);

function radio(name, value, { checked = false, disabled = false } = {}, ...parts) {
  const label = document.createElement('label');
  label.className = 'pick';
  const input = document.createElement('input');
  Object.assign(input, { type: 'radio', name, value, checked, disabled });
  label.append(input, ...parts);
  return label;
}

function span(className, text) {
  const el = document.createElement('span');
  el.className = className;
  el.textContent = text;
  return el;
}

function renderDays() {
  $('[data-days]').replaceChildren(
    ...nextDays(isoDate(new Date()), 12).map((iso) => {
      const parts = [span('pick__week', formatDate(iso, { weekday: 'short' })), span('pick__num', formatDate(iso, { day: 'numeric' })), span('pick__month', formatDate(iso, { month: 'short' }))];
      const label = radio('date', iso, { checked: state.date === iso }, ...parts);
      label.firstChild.setAttribute('aria-label', formatDate(iso));
      return label;
    }),
  );
}

function renderTimes() {
  $('[data-day]').textContent = capital(formatDate(state.date));
  $('[data-times]').replaceChildren(
    ...slotsFor(state.date).map(({ time, free }) => {
      const parts = [span('pick__hour', time)];
      if (!free) parts.push(span('pick__busy', 'Ocupada'));
      return radio('time', time, { checked: state.time === time, disabled: !free }, ...parts);
    }),
  );
}

function renderReview() {
  $('[data-r="service"]').textContent = serviceName();
  $('[data-r="date"]').textContent = capital(formatDate(state.date));
  $('[data-r="time"]').textContent = state.time;
}

const RENDER = {
  service: () => $$('[name="service"]').forEach((el) => (el.checked = el.value === state.service)),
  date: renderDays,
  time: renderTimes,
  review: renderReview,
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
    $('[data-done]').textContent = `${serviceName()}, ${formatDate(state.date)} a las ${state.time}.`;
    confirmed = true;
    state = {};
    window.location.replace('#listo');
    return;
  }
  if (!state[step]) {
    event.target.querySelector('.error').textContent = MISSING[step];
    event.target.querySelector('input:not(:disabled)').focus();
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
  const missing = firstMissing(state);
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
  document.title = `${view.dataset.title} · Esmalte Claro · Modelo de demostración de Stiven Lux`;
  window.scrollTo(0, 0);
  if (!first) view.querySelector('[tabindex="-1"]').focus({ preventScroll: true });
}

window.addEventListener('hashchange', () => route());
route(true);
