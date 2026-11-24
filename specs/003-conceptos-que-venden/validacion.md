# Validación — Spec 003

Veredicto (2026-11-24, un @reviewer): **CAMBIOS NECESARIOS**, 4 bloqueantes.
Estado validado: código sin commit sobre `18cd88b`; `npm run check` en verde (87 unitarios, 240 e2e).

Ya aceptado por el usuario: el parecido del reloj con un modelo comercial y los cambios en los tests de la
001 y la 002.

Este archivo recoge el informe tal como llegó resumido a esta sesión; las cifras son del reviewer y no se
han vuelto a medir aquí.

## Bloqueantes
- B1 (RNF-2): antes del scroll se piden 235,2 KB a 1440×900 DPR 2, 277,1 KB a 390×844 DPR 3 y 318 KB a
  844×390 DPR 2. Límite: 200 KB. La medición previa («111 KB») era a DPR 1,25.
- B2 (RF-20): a 390 px los navegadores muestran el botón a 4,7–5,4 px y la marca a 8,2–9,4 px (mínimo 9).
  Los teléfonos cumplen. El teléfono tapa parte de la foto. El restaurante en el hero móvil solo sale en
  navegador.
- B3 (RNF-7, RF-5): letras falsas en `tienda-hero.jpg` (~1168,493) y `barberia-hero.jpg` (placa, ~1092,393);
  los audífonos recuerdan a un modelo comercial. «11 de 11 sin texto» resultó falso.
- B4: `.scr` sin `background` deja una banda negra sobre la isla del teléfono (`devices.css`).

## Decisiones (el usuario acepta las 10 recomendaciones, 2026-11-24)
| N.º | Hallazgo | Recomendación |
|---|---|---|
| 1 | B1 | Mantener 200 KB, `sizes` por contexto (hero y proyectos), variante intermedia, no bajar la tienda oculta del hero a 390, test a DPR 2 y 3 |
| 2 | B2 | Exigir 9 px solo en teléfonos y enmendar RF-20 |
| 3 | B3 | Regenerar ambas fotos (Nano Banana en Google Flow, 0 créditos: confirmar coste); el usuario aprueba las nuevas |
| 4 | A 844 y 768 px el lead del hero cae sobre el mockup, ahora oscuro (geometría ya en la base) | Desplazar el mockup solo en esos anchos |
| 5 | «Gratis a todo el país» y «Vie 14 nov» (en 2026 es sábado) | «Envío: 2 a 4 días» y «Viernes» |
| 6 | RF-6: la foto ocupa el 62 % derecho, no es a sangre | Foto en toda la cabecera, texto sobre su zona oscura, AA medido sobre lo pintado |
| 7 | RF-14: el «total» rige solo para el carrito | Aclararlo en la spec |
| 8 | RF-19: el teléfono del hero perdió el escalón `data-a` 4 | Reponerlo |
| 9 | Sin fuente: «los negocios que más compran web en Colombia» (`PROJECT_BRIEF.md:28`) y «los servicios locales son la mayoría…» (`spec.md`) | Quitarlas; citar la URL del 19,9 % (Tiendanube) aclarando que mide compras en línea, o quitarlo si no se verifica |
| 10 | RF-15: barbería y Pulso comparten Inter Tight | Aceptar peso y mayúsculas y enmendar RF-15 |

Fuente citada, sin verificar en la página:
https://www.tiendanube.com/co/blog/productos-mas-vendidos-en-colombia/

## Correcciones
- C1: B4.
- C2: `project--flip`: el teléfono tapa «BARBERÍA», parte del título y del botón; más margen en
  `.scr--barber .c-copy`.
- C3: muestras de `work.html` (#c4532b, #b08d57) ≠ pintado (#e0703f, #c9a46a).
- C4 (RF-25): botones sin borde en colores forzados (`border: 1px solid transparent`).
- C5 (RNF-4): `barberia-herramientas` necesita 560 px a 1440 DPR 2 y se sirve 400. Miniaturas y hero
  sobredimensionados.
- C6 (RF-27): `registro.md` guarda resúmenes; debe llevar los prompts completos, sacados del historial del
  proyecto de Flow «nov 08 - 20:52». No se inventan.
- C7: JetBrains Mono (`main.js:3`) ya no se usa: comprobarlo y quitarla.
- C8 (RNF-3): quitar el +0,0005 (usar 1e-6); corregir `_origen` de `spec003-base.json` y `tasks.md`: el
  reviewer midió `18cd88b` = 0,000114 / 0,000130, idéntico al actual.
- C9: `curtains.spec.js`: reformular el comentario. El margen no tapa defectos de la 003 (sin tolerancia
  fallan base 8/30 y actual 5/30; con margen 0/30), pero la causa no está probada.
- C10: `spec002-base.spec.js`: excluir solo `.scr`, textos y alturas cambiados, no `.hero__stage` y `.work`
  enteros.
- C11: cobertura floja en RF-5, 15, 17, 19, 20, 21 (solo restaurante), 22 (una foto), 23 (tamaño
  antes/después), 25 (legibilidad y fondo), 27 (64 KB) y RNF-2. Comprobar que cada test falla al romper el
  requisito.
- C12: los comentarios de `build-concept-images.mjs` y `registro.md` no coinciden con 800/1376; faltan
  capturas en `test-results/capturas-spec003/`.
