import { buildWhatsappUrl } from '../lib/whatsapp.js';

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
     * Formato internacional: código de país + número, de 8 a 15 dígitos. Se admiten espacios,
     * guiones, paréntesis y "+" (se eliminan); cualquier otro carácter lo invalida.
     * Mientras esté vacío, todos los CTA de WhatsApp llevan a la sección #contacto
     * y el build muestra un aviso (también si el número no es válido).
     */
    number: '',
    message: 'Hola Stiven Lux, quiero iniciar un proyecto web.',
  },

  heroVideo: {
    /*
     * PENDIENTE: video del hero generado con Higgsfield (ver PROJECT_BRIEF.md y video/higgsfield/).
     * Tras ejecutar video/higgsfield/postprocess.sh, rellena:
     *   mp4: '/media/hero-desktop.mp4', webm: '/media/hero-desktop.webm', poster: '/media/hero-poster.jpg'
     * Vacío = el hero usa la escena animada en HTML/CSS/JS (también en móvil y con movimiento reducido).
     */
    mp4: '',
    webm: '',
    poster: '',
  },
};

export function whatsappUrl(message = site.whatsapp.message) {
  return buildWhatsappUrl(site.whatsapp.number, message);
}
