/* Menú de pantalla completa: patrón de divulgación (botón + región).
   Mientras está abierto, el resto de la página queda inerte y Escape lo cierra. */
export function initMenu() {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;

  const toggle = nav.querySelector('[data-menu-toggle]');
  const label = nav.querySelector('[data-menu-label]');
  const menu = nav.querySelector('[data-menu]');
  const links = [...menu.querySelectorAll('[data-menu-link]')];
  const outside = [...document.querySelectorAll('main, footer, .skip-link')];
  let open = false;

  menu.querySelectorAll('.menu__link').forEach((link, i) => link.style.setProperty('--i', i));
  menu.inert = true;

  function setOpen(next, { restoreFocus = true } = {}) {
    if (next === open) return;
    open = next;
    nav.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    label.textContent = open ? 'Cerrar' : 'Menú';
    menu.inert = !open;
    outside.forEach((el) => (el.inert = open));

    if (open) links[0]?.focus({ preventScroll: true });
    else if (restoreFocus) toggle.focus({ preventScroll: true });
  }

  toggle.addEventListener('click', () => setOpen(!open));

  // Cualquier enlace interno del encabezado cierra el menú antes de navegar
  nav.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (link && open) setOpen(false, { restoreFocus: false });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && open) setOpen(false);
  });
}
