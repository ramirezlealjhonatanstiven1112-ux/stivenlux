/* Construye el enlace de WhatsApp. Devuelve null si no hay número válido:
   en ese caso los CTA se quedan en #contacto (ver specs/000).
   «Número válido» (spec 000): 8 a 15 dígitos tras quitar espacios, guiones, paréntesis y +.
   Cualquier otro carácter invalida el número; no se descarta en silencio. */
export function buildWhatsappUrl(number, message = '') {
  const digits = String(number ?? '').replace(/[\s()+-]/g, '');
  if (!/^\d{8,15}$/.test(digits)) return null;
  const text = String(message).trim();
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`;
}

/* Aviso para el propietario al generar la web (RF-3). Usa la misma validación que el
   navegador (buildWhatsappUrl): devuelve null si el número es válido o el texto del aviso,
   distinguiendo número sin configurar de número configurado pero inválido. */
export function whatsappBuildWarning(number) {
  if (buildWhatsappUrl(number)) return null;
  const fallback = 'Mientras tanto los CTA de WhatsApp apuntan a la sección #contacto.';
  const value = String(number ?? '').trim();
  if (!value) {
    return `WhatsApp sin configurar: define site.whatsapp.number en src/config/site.js. ${fallback}`;
  }
  return (
    `WhatsApp no válido: site.whatsapp.number vale "${value}" en src/config/site.js. ` +
    'Formato esperado: código de país + número, de 8 a 15 dígitos; se admiten espacios, guiones, ' +
    `paréntesis y +. ${fallback}`
  );
}
