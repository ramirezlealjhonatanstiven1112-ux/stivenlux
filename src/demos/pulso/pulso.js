import { MAX_QTY, addItem, cartTotals, countItems, formatPrice, parseCart, removeItem, setQty } from '../../lib/cart.js';

const KEY = 'stivenlux-demo-pulso';
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// El HTML es la única fuente de productos y precios
const catalog = Object.fromEntries(
  $$('.product').map((el) => [el.id, { name: el.dataset.name, price: Number(el.dataset.price), photo: el.dataset.photo, thumb: el.dataset.thumb }]),
);

let cart = [];
try {
  cart = parseCart(window.localStorage.getItem(KEY), catalog);
} catch {
  // Almacenamiento bloqueado: el carrito vive solo en esta visita
}
let confirmed = false;

function commit(next) {
  cart = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cart));
  } catch {
    // Igual que al leer
  }
  render();
}

/* ── Carrito ────────────────────────────────────────────── */
function node(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

function control(action, id, text, label, disabled = false) {
  const el = node('button', action === 'remove' ? 'line__remove' : 'qty__btn', text);
  el.type = 'button';
  el.disabled = disabled;
  el.setAttribute('aria-label', label);
  Object.assign(el.dataset, { action, id });
  return el;
}

function lineItem({ id, qty }) {
  const { name, price, photo, thumb } = catalog[id];
  const li = node('li', 'line');
  const pic = node('span', `line__photo photo--${photo}`);
  const img = node('img');
  Object.assign(img, { src: `/media/conceptos/tienda-${photo}-${thumb}.webp`, alt: '', width: 120, height: 120 });
  pic.append(img);
  const title = node('a', 'line__name', name);
  title.href = `#${id}`;
  const box = node('div', 'qty');
  box.append(
    control('less', id, '−', `Quitar una unidad de ${name}`, qty <= 1),
    node('span', 'qty__n', String(qty)),
    control('more', id, '+', `Agregar una unidad de ${name}`, qty >= MAX_QTY),
  );
  li.append(pic, title, box, node('span', 'line__price', formatPrice(price * qty)), control('remove', id, 'Quitar', `Quitar ${name} del carrito`));
  return li;
}

function render() {
  const count = countItems(cart);
  const { subtotal } = cartTotals(cart, catalog);
  $('[data-count]').textContent = count;
  $('[data-empty]').hidden = count > 0;
  $('[data-filled]').hidden = count === 0;
  $('[data-lines]').replaceChildren(...cart.map(lineItem));
  $('[data-subtotal]').textContent = formatPrice(subtotal);
  $('[data-cart-total]').textContent = formatPrice(subtotal);
  renderCheckout();
}

const form = $('[data-checkout]');
const totals = () => cartTotals(cart, catalog, Number(form.elements.envio.value));

function renderCheckout() {
  const { subtotal, shipping, total } = totals();
  const count = countItems(cart);
  $('[data-items]').textContent = `${count} ${count === 1 ? 'producto' : 'productos'}`;
  $('[data-buy-subtotal]').textContent = formatPrice(subtotal);
  $('[data-shipping]').textContent = shipping ? formatPrice(shipping) : 'Gratis';
  $('[data-total]').textContent = formatPrice(total);
}

let toastTimer;
function toast(text) {
  const el = $('[data-toast]');
  $('[data-toast-text]').textContent = text;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 3500);
}

document.addEventListener('click', ({ target }) => {
  const add = target.closest('[data-add]');
  if (add) {
    const id = add.dataset.add;
    const before = countItems(cart);
    commit(addItem(cart, id));
    toast(countItems(cart) > before ? `${catalog[id].name} está en tu carrito` : `Máximo ${MAX_QTY} unidades por producto`);
    return;
  }

  const btn = target.closest('[data-action]');
  if (btn) {
    const { action, id } = btn.dataset;
    const qty = cart.find((line) => line.id === id)?.qty ?? 0;
    commit(action === 'remove' ? removeItem(cart, id) : setQty(cart, id, qty + (action === 'more' ? 1 : -1)));
    // La lista se repinta: el foco vuelve al mismo control, a uno activo de la línea o al título
    const again = $(`[data-action="${action}"][data-id="${id}"]:not(:disabled)`) ?? $(`.qty__btn[data-id="${id}"]:not(:disabled)`);
    (again ?? $('#cart-t')).focus();
    toast(action === 'remove' ? `${catalog[id].name} ya no está en el carrito` : `Total: ${formatPrice(cartTotals(cart, catalog).total)}`);
    return;
  }

  const filter = target.closest('[data-filter]');
  if (filter) {
    const value = filter.dataset.filter;
    $$('[data-filter]').forEach((el) => el.setAttribute('aria-pressed', String(el === filter)));
    const cards = $$('.card');
    cards.forEach((el) => (el.hidden = value !== 'todo' && el.dataset.category !== value));
    const shown = cards.filter((el) => !el.hidden).length;
    $('[data-filter-status]').textContent = `${shown} ${shown === 1 ? 'producto' : 'productos'}`;
  }
});

form.addEventListener('change', renderCheckout);
form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!cart.length) return;
  $('[data-done-total]').textContent = formatPrice(totals().total);
  confirmed = true;
  commit([]);
  $('[data-toast]').classList.remove('is-on');
  window.location.replace('#listo');
});

/* ── Vistas: una por ancla, con «atrás» del navegador ───── */
const views = $$('[data-view]');

function route(first = false) {
  let id = window.location.hash.slice(1) || 'catalogo';
  const section = id === 'productos' ? id : null;
  if (section) id = 'catalogo';
  if (id === 'compra' && !cart.length) id = 'carrito';
  if (id === 'listo' && !confirmed) id = 'catalogo';
  if (id !== 'listo') confirmed = false;
  const view = views.find((el) => el.id === id);
  if (!view) return; // p. ej. #contenido: ancla normal

  views.forEach((el) => el.classList.toggle('is-on', el === view));
  const name = view.dataset.name ?? view.dataset.title;
  document.title = `${name} · Pulso · Modelo de demostración de Stiven Lux`;
  if (section) document.getElementById(section).scrollIntoView();
  else window.scrollTo(0, 0);
  if (!first) (section ? $('.shop__title') : view.querySelector('[tabindex="-1"]')).focus({ preventScroll: true });
}

// Otra pestaña cambió el carrito
window.addEventListener('storage', ({ key, newValue }) => {
  if (key !== KEY && key !== null) return;
  cart = parseCart(newValue, catalog);
  render();
});

$('.shop__title').tabIndex = -1;
window.addEventListener('hashchange', () => route());
render();
route(true);
