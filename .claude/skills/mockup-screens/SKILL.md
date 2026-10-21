---
name: mockup-screens
description: Úsala siempre que crees, modifiques o revises dispositivos (navegador, teléfono) o pantallas de los proyectos conceptuales de Stiven Lux (src/partials/devices, src/partials/screens, src/styles/devices.css).
---

# Dispositivos y pantallas conceptuales

Los mockups son HTML/CSS, no imágenes. Son la mayor fuente de errores visuales del proyecto.

## Reglas
- Toda medida dentro de una pantalla usa `calc(N * var(--u))`: 1 `--u` = 1 px de un lienzo de 1280 px (navegador) o 390 px (teléfono).
  Excepción: los filetes de 1 px (bordes y separadores finos) pueden quedarse en `px`; no escalan con `--u` a propósito para no desaparecer al reducirse.
- La variante de teléfono se escribe con selectores `.device--phone .<clase>`; nunca con media queries del viewport.
- La capa que contiene un dispositivo debe ser `container-type: inline-size`; si no, los `cqw` del bisel se resuelven contra el viewport.
- Las pantallas se reutilizan con `<include src="devices/…" screen="…">`; no dupliques su HTML.
- Los mockups son decorativos: `aria-hidden="true"` en el dispositivo y, en el portafolio, `role="img"` con `aria-label` en el escenario.
- Aunque sean decorativos, el texto de las pantallas mantiene contraste ≥ 4,5:1 (axe lo revisa).
- Cada concepto conserva su identidad (Maison Aurèle: marfil, espresso, burdeos · Kairo: plata, grafito, ámbar · Halden: verde bosque, hueso, latón). El azul de Stiven Lux no entra en las pantallas.
- Marcas siempre ficticias, dominios `.concept`, sin logotipos ni nombres reales.
- No uses `will-change: transform` en capas con dispositivos: los rasteriza borrosos.

## Checklist de revisión
- [ ] ¿Alguna medida en px, rem o vw dentro de `.scr` (salvo filetes de 1 px)?
- [ ] ¿La capa padre es `container-type: inline-size`?
- [ ] ¿Se ve bien la variante de teléfono a 390 px de ancho de página?
- [ ] ¿Contraste del texto de la pantalla ≥ 4,5:1?
- [ ] ¿Algún nombre, logo o dato que parezca real?

## Al terminar
Indica qué puntos del checklist has comprobado y cómo (captura, axe, inspección).
