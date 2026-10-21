/* Cambia el color de la barra según el tema de la sección que pasa por debajo. */
export function initNavTone() {
  const nav = document.querySelector('[data-nav]');
  const sections = document.querySelectorAll('[data-theme]');
  if (!nav || !sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) nav.dataset.tone = entry.target.dataset.theme;
      }
    },
    // Franja fina a la altura de la barra
    { rootMargin: '-2% 0px -96% 0px' },
  );

  sections.forEach((section) => observer.observe(section));
}
