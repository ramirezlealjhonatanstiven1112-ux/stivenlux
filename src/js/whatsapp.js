import { site, whatsappUrl } from '../config/site.js';

/* Todos los CTA con [data-whatsapp] salen de la configuración central.
   Sin número configurado, se quedan apuntando a #contacto. */
export function initWhatsapp() {
  const url = whatsappUrl();
  const links = document.querySelectorAll('[data-whatsapp]');

  if (url) {
    links.forEach((link) => {
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener';
    });
    return;
  }

  if (import.meta.env.DEV) {
    document.querySelectorAll('[data-whatsapp-pending]').forEach((el) => (el.hidden = false));
    console.warn(
      `[${site.name}] WhatsApp sin configurar: define site.whatsapp.number en src/config/site.js`,
    );
  }
}
