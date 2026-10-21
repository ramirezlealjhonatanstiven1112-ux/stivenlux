/*
 * Configuración central de la marca.
 * Este archivo lo leen tanto el navegador (src/main.js) como el build (vite.config.js).
 */
export const site = {
  name: 'Stiven Lux',
  tagline: 'No hacemos lo de siempre',

  whatsapp: {
    /*
     * PENDIENTE: número oficial de WhatsApp de Stiven Lux.
     * Formato internacional, solo dígitos: código de país + número, sin "+", espacios ni guiones.
     * Mientras esté vacío, todos los CTA de WhatsApp llevan a la sección #contacto
     * y el build muestra un aviso.
     */
    number: '',
    message: 'Hola Stiven Lux, quiero iniciar un proyecto web.',
  },
};

export function whatsappUrl(message = site.whatsapp.message) {
  const number = String(site.whatsapp.number).replace(/\D/g, '');
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
