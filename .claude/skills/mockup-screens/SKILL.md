---
name: mockup-screens
description: Úsala siempre que crees, modifiques o revises dispositivos (navegador, teléfono) o pantallas de los proyectos conceptuales de Stiven Lux (src/partials/devices, src/partials/screens, src/styles/devices.css).
---

# Dispositivos y pantallas conceptuales

Los mockups son HTML/CSS con fotos propias generadas con IA (spec 003). Son la mayor fuente de errores visuales del proyecto.

## Reglas
- Toda medida dentro de una pantalla usa `calc(N * var(--u))`: 1 `--u` = 1 px de un lienzo de 1280 px (navegador) o 390 px (teléfono).
  Excepción: los filetes de 1 px (bordes y separadores finos) pueden quedarse en `px`; no escalan con `--u` a propósito para no desaparecer al reducirse.
- La variante de teléfono se escribe con selectores `.device--phone .<clase>`; nunca con media queries del viewport.
- La capa que contiene un dispositivo debe ser `container-type: inline-size`; si no, los `cqw` del bisel se resuelven contra el viewport.
- Las pantallas se reutilizan con `<include src="devices/…" screen="…">`; no dupliques su HTML.
- Los mockups son decorativos: `aria-hidden="true"` en el dispositivo y, en el portafolio, `role="img"` con `aria-label` en el escenario.
- Aunque sean decorativos, el texto de las pantallas mantiene contraste ≥ 4,5:1 (axe lo revisa).
- Cada concepto conserva su identidad (Esmalte Claro: blanco, cobalto, marino · Diecinueve Grados: naranja, hielo, café · Pulso: neutro, grafito, lima). Se define con las variables `--c-*` de `.scr--<concepto>`; la estructura común es `.c-*`. El azul de Stiven Lux no entra en las pantallas.
- Cada pantalla trae `.c-desk` (navegador) y `.c-phone` (teléfono); cada dispositivo oculta el otro bloque. Las fotos usan `<picture>` (AVIF, WebP y JPEG), `alt=""`, `width`/`height` y `loading="{{desk-loading}}"` o `{{phone-loading}}`: el hero pasa `loading="eager"` y los proyectos `lazy`.
- Fotos: solo originales propios registrados en `media-src/conceptos/registro.md`; variantes con `npm run images` (≤ 90 KB por AVIF/WebP, sin metadatos). Sin texto, logos ni caras reconocibles.
- Marcas siempre ficticias, dominios `.concept`, sin logotipos ni nombres reales.
- No uses `will-change: transform` en capas con dispositivos: los rasteriza borrosos.

## Checklist de revisión
- [ ] ¿Alguna medida en px, rem o vw dentro de `.scr` (salvo filetes de 1 px)?
- [ ] ¿La capa padre es `container-type: inline-size`?
- [ ] ¿Se ve bien la variante de teléfono a 390 px de ancho de página?
- [ ] ¿Contraste del texto de la pantalla ≥ 4,5:1?
- [ ] ¿Algún nombre, logo o dato que parezca real?
- [ ] ¿Fotos dentro del presupuesto (`npm run budget`) y registradas?

## Al terminar
Indica qué puntos del checklist has comprobado y cómo (captura, axe, inspección).
