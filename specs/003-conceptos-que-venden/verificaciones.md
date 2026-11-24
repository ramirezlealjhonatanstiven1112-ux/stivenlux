# Verificaciones documentadas — Spec 003

Lo que no se puede automatizar del todo (spec.md, «Criterios de finalización»). Actualizado: 2026-11-24 (corrección tras la validación).

| # | Qué | Método | Resultado |
|---|---|---|---|
| 1 | RNF-6 · contraste de la marca, la propuesta y el botón | El texto de la primera pantalla no va sobre la foto: va sobre un panel sólido de la paleta (`.c-copy`) y la foto ocupa el 62 % derecho. Por eso el contraste es el del panel. Medido con `contrastRatio` (`src/lib/contrast.js`) | Brasa Lenta: texto 15,20, secundario 9,97, acento 5,87, botón 5,87 · Navaja & Roble: 15,79, 8,63, 8,33, 8,33 · Pulso: 15,32, 6,60, botón 13,42. Todos ≥ 4,5:1. Axe de la página completa (landing.spec.js) sin infracciones |
| 2 | RNF-4 · nitidez a 1440 px | Navegador integrado a 1440×900 (DPR 1,25). Capturas de los tres proyectos y del hero. La foto protagonista se sirve a 640, 1000 o 1376 px según `sizes`; Flow entrega 1K y no se reescala (inventaría detalle) | Sin pixelado visible a 1440. A DPR 2 lo comprueba un test (RNF-4: cada foto llega al 97 % del ancho que necesita). **Pendiente (usuario, opcional)**: pantalla real con DPR 2 y móvil real a 390×844 |
| 3 | RNF-7 · calidad de las fotos | Revisión una a una en una hoja de contacto (`media-src/conceptos/registro.md`) | La revisión inicial («11 de 11 sin texto») era falsa: `tienda-hero` y `barberia-hero` llevan letras falsas, y los audífonos de `tienda-hero` recuerdan a un modelo comercial. `tienda-hero` se regeneró y el usuario aprobó la nueva, revisada ampliada (2026-11-24); `barberia-hero` desaparece con el cambio de sectores. El reloj se parece a un modelo comercial: el usuario lo aprueba igual (2026-11-08) |
| 4 | Nombres de las marcas | Búsqueda web rápida (2026-11-08) | Ninguno aparece como negocio en Colombia; existe una marca «Pulse» en Falabella Perú (aceptado por el usuario) |
| 5 | RF-20 · tamaño a 390 px | El navegador de cada proyecto mide unos 460 px y queda recortado por el escenario: es una vista reducida, como en la base. El concepto se lee en su teléfono, donde la marca y el botón miden ≥ 9 px (test automático) | Teléfonos: marca 10,5–10,8 px, botón 9,5–9,7 px |

## Medidas
- Imágenes antes del primer scroll (los «111 KB» anteriores eran a DPR 1,25): 164,3 KB a 1440×900 DPR 2, 77,8 y
  123,0 KB a 390×844 DPR 2 y 3, y 156,6 KB a 844×390 DPR 2. Límite 200 KB, con test.
- Peso: JS +0 B; CSS 8.389 B gzip (−3.264 B sobre `18cd88b`, en buena parte por quitar JetBrains Mono).
- Fotos: 33 variantes en uso; la mayor pesa 67,1 KB en AVIF y 78,1 KB en WebP (límite: 90 KB).
