// Carrito de la demo Pulso (spec 004, RF-5). Funciones puras: el carrito es una lista [{ id, qty }] y el catálogo
// un objeto { id: { name, price } } con precios enteros.

export const MAX_QTY = 9;

const clampQty = (qty) => Math.min(MAX_QTY, Math.max(0, Math.trunc(Number(qty)) || 0));

/** Cambia la cantidad de una línea; 0 la quita. Devuelve un carrito nuevo. */
export function setQty(cart, id, qty) {
  const next = clampQty(qty);
  if (next === 0) return cart.filter((line) => line.id !== id);
  if (!cart.some((line) => line.id === id)) return [...cart, { id, qty: next }];
  return cart.map((line) => (line.id === id ? { id, qty: next } : line));
}

export function addItem(cart, id, qty = 1) {
  const current = cart.find((line) => line.id === id)?.qty ?? 0;
  return setQty(cart, id, current + qty);
}

export function removeItem(cart, id) {
  return setQty(cart, id, 0);
}

export function countItems(cart) {
  return cart.reduce((sum, line) => sum + line.qty, 0);
}

export function cartTotals(cart, catalog, shipping = 0) {
  const subtotal = cart.reduce((sum, line) => sum + (catalog[line.id]?.price ?? 0) * line.qty, 0);
  const cost = subtotal > 0 ? shipping : 0;
  return { subtotal, shipping: cost, total: subtotal + cost };
}

/** Lee lo guardado en el navegador; lo que no sea válido se descarta. */
export function parseCart(raw, catalog) {
  let data;
  try {
    data = JSON.parse(raw ?? '[]');
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  return data.reduce(
    (cart, line) => (line && Object.hasOwn(catalog, line.id) ? setQty(cart, line.id, line.qty) : cart),
    [],
  );
}

/** 459900 → «$ 459.900» (espacio duro). */
export function formatPrice(value) {
  return `$\u00a0${String(value).replace(/\B(?=(\d{3})+$)/g, '.')}`;
}
