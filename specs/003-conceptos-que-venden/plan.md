# Plan 003 — Conceptos que venden

Spec: `specs/003-conceptos-que-venden/spec.md` (aprobada el 2026-11-08). Skills: `mockup-screens` (pantallas y
dispositivos) y `motion-rules` (no se añade movimiento; solo se comprueba que el ensamblaje sigue igual).

## Resumen
Se sustituyen las tres pantallas HTML/CSS (`fashion`, `tech`, `services`) por tres nuevas (`restaurant`,
`barber`, `store`), que llevan fotos propias generadas con IA en `<picture>` (AVIF y WebP, más un JPEG de
respaldo). No hace falta JS nuevo: la carga inmediata o diferida, la reserva de color, los colores forzados y la
impresión se resuelven con HTML y CSS. La lógica de presupuesto de imágenes va en `src/lib/` con tests.

## Archivos y responsabilidades
| Archivo | Cambio | RF |
|---|---|---|
| `src/partials/screens/restaurant.html`, `barber.html`, `store.html` | Nuevas. Bloque de escritorio y bloque de teléfono en un mismo partial; cada dispositivo oculta el que no es suyo | RF-6…14, RF-19b |
| `src/partials/screens/fashion.html`, `tech.html`, `services.html` | Se borran | RF-1 |
| `src/partials/devices/browser.html`, `phone.html` | Pasan a la pantalla `device` y `loading` (y `sizes` por dispositivo) | RF-19c, RNF-2 |
| `src/partials/sections/hero.html` | Atrás: restaurante; en medio: tienda; delante: barbería. `loading="eager"` | RF-18, RF-19c |
| `src/partials/sections/work.html` | Título, textos, paletas, `aria-label`, URL `.concept`, `loading="lazy"` | RF-1…3, RF-24 |
| `src/styles/devices.css` | Se quitan `.scr--fashion/tech/services` y se añaden `.scr--restaurant/barber/store` (todo en `--u`) | RF-15, RF-20 |
| `src/styles/devices.css` (bloque final) | Reserva de color, colores forzados e impresión de las fotos | RF-19d, RF-23, RF-25, RF-26 |
| `vite.config.js` | Solo si T1 demuestra que los atributos no llegan al `<include>` anidado: reenviar los atributos del padre | RF-19c |
| `scripts/build-concept-images.mjs` | Nuevo. Con ffmpeg del sistema, de `media-src/conceptos/*.png` a `public/media/conceptos/*-{w}.{avif,webp,jpg}`, sin metadatos | RNF-1, RF-27 |
| `media-src/conceptos/` + `registro.md` | Originales de Flow (no se publican) y registro de prompt, herramienta y fecha por foto | RF-17, RF-27 |
| `src/lib/image-budget.js` | Nuevo, puro: suma recursos de imagen y comprueba límites (por foto, antes del scroll, total) | RNF-1, RNF-2 |
| `scripts/check-budget.mjs` | `SPEC = '003'`, base `18cd88b`, margen de CSS y comprobación de ≤ 90 KB por archivo AVIF/WebP | RNF-1, RNF-5 |
| `tests/unit/image-budget.test.js` | Tests de la lógica de presupuesto | RNF-1, RNF-2 |
| `tests/e2e/spec003-*.spec.js` | Nuevos (ver Estrategia de tests) | todos |
| `.claude/skills/mockup-screens/SKILL.md`, `PROJECT_BRIEF.md` | Identidades nuevas y regla de fotos (es una skill del proyecto, no de terceros) | — |

## Pantallas
Lienzo de siempre: 1 `--u` = 1 px de 1280 (navegador) o de 390 (teléfono). Cada partial tiene:
- `.s?-desk`: primera pantalla (foto a sangre, marca, propuesta y botón) y fila inferior (3 platos, servicios o
  productos). Se ve en `.device--browser`.
- `.s?-phone`: la reserva, la cita o la ficha o carrito. Se ve en `.device--phone`, con la marca y una foto arriba.
- Los `data-a style="--a: N"` se mantienen en los mismos huecos que hoy, para que el ensamblaje del hero no cambie
  (RF-19).

Identidades (RF-15; el azul de Stiven Lux no entra):
- **Brasa Lenta**: carbón `#14110f`, brasa `#c4532b`, crema `#efe6d8`. Serif de alto contraste (Instrument
  Serif, ya cargada) en los titulares y precios en COP.
- **Navaja & Roble**: negro `#0d0d0d`, latón `#b08d57`, hueso `#ece7df`. Inter Tight en mayúsculas espaciadas.
- **Pulso**: neutro `#f2f2ee`, grafito `#1b1b1d` y un acento lima `#c6f432` (solo en el botón y el precio).
  Inter Tight en negrita.
Sin fuentes nuevas: se reutilizan las tres que ya se cargan (peso y constitución).

## Fotos
- Cantidad: Brasa Lenta 4 (plato protagonista y 3 platos), Navaja & Roble 3 (corte protagonista, barbero en el
  teléfono y detalle de herramientas), Pulso 4 (producto protagonista y 3 productos). Total 11 (RF-16 pide ≥ 9).
- Generación: Nano Banana 2.1 en Google Flow (0 créditos), con la sesión del usuario en el navegador integrado.
  Prompts en `registro.md`, sin texto, logos ni personas reconocibles. **Puerta**: el usuario aprueba las 11
  fotos antes de usarlas (RNF-7, criterios de finalización).
- Variantes: las protagonistas a 800 y 1600 px de ancho y las miniaturas a 400 y 800 px. AVIF (calidad ajustada
  hasta ≤ 90 KB), WebP y JPEG de respaldo. Se quitan los metadatos con `-map_metadata -1`, y la marca de agua
  visible se desactiva en Flow (ya está desactivada) o se recorta.
- `<picture>`: `<source type="image/avif">`, `<source type="image/webp">`, `<img src=jpg alt="" width height
  loading decoding="async">`. `sizes` llega desde el dispositivo: el navegador y el teléfono tienen tamaños
  distintos en pantalla.
- Reserva (RF-19d, RF-23): el contenedor de cada foto tiene `background-color` de la paleta y relación de aspecto
  fija. Un `<img alt="">` roto no pinta icono en Chromium ni en Firefox, y se oculta con `color: transparent`
  por si acaso. Sin `transition` ni `animation` en la foto.
- Carga (RF-19c): el hero pasa `loading="eager"` y la sección de proyectos `loading="lazy"` (nativo, funciona sin
  JS: RF-22). El bloque oculto de cada dispositivo usa `display: none`: así las imágenes `lazy` que contiene no se
  descargan. Las `eager` sí, de modo que en el hero **solo** el bloque visible de cada dispositivo lleva fotos
  `eager` (el otro bloque recibe `lazy`).

## Interfaz en escritorio y en móvil
- Escritorio: la composición y los tamaños de los dispositivos no cambian. Solo cambia el interior.
- Móvil a 390 px (RF-20): se comprueba que la marca y el botón miden ≥ 9 px una vez escalados (alto de la caja
  de texto con `getBoundingClientRect` en el hero y en cada proyecto). Si no llegan, se ajustan solo los
  `calc(N * var(--u))` de ese texto. Todas las capas con dispositivo ya son `container-type: inline-size`; T1
  lo comprueba.
- Colores forzados (RF-25) e impresión (RF-26): `@media (forced-colors: active), print { .scr picture { display:
  none } }`; el contenedor deja de tener fondo de paleta y queda el del sistema.
- Contraste sobre foto (RNF-6): la marca, la propuesta y el botón van sobre un panel sólido de la paleta o sobre
  la zona oscura de la foto. Se documenta la medida en 5 puntos de muestra por concepto en `verificaciones.md`.

## Movimiento
No hay animaciones nuevas (RF-21). Las clases y los `data-a` del ensamblaje se conservan. Checklist de
motion-rules: sin `will-change`, nada infinito, todo visible sin JS y con movimiento reducido.

## Decisiones (y alternativa descartada)
1. **`<picture>` con AVIF, WebP y JPEG**, y no solo WebP: AVIF pesa un 20–30 % menos y así 11 fotos nítidas caben
   en RNF-1. El JPEG solo lo descargan navegadores antiguos (no cuenta: RNF-1).
2. **Un partial por concepto con dos bloques**, y no partials separados para navegador y teléfono: la skill pide
   no duplicar y el hero y el portafolio comparten la misma pantalla (RF-19b).
3. **Script de imágenes con el ffmpeg del sistema** (instalado con winget), y no `sharp` ni `ffmpeg-static`: sin
   dependencias nuevas (constitución 1). Si falta ffmpeg, el script falla con un mensaje claro. Las variantes
   generadas se versionan en `public/`, así el build no depende de ffmpeg.
4. **Sin JS para la carga ni para la reserva**: con `loading` nativo y CSS se cumple RF-22 y no se toca el
   presupuesto de JS.
5. **Originales en `media-src/`** (versionados, fuera de `public/`): permiten regenerar las variantes y
   respaldan el registro de RF-27. Si pesan demasiado para el repo, se proponen en `.gitignore` (decide el
   usuario).
6. Las clases internas se renombran (`--restaurant`, `--barber`, `--store`), porque los estilos antiguos se
   borran de todos modos.

## Impacto en el peso
- Base: build limpio de `18cd88b`. JS: sin cambios (margen 0). CSS: las tres pantallas antiguas ocupan unos
  2,5 KB con gzip; las nuevas, con fotos, deberían quedar parecidas. Margen propuesto: **+1.024 B de CSS**.
- Imágenes: ≤ 90 KB por archivo moderno, ≤ 200 KB antes del primer scroll y ≤ 700 KB en total (RNF-1, RNF-2).
  Estimación: protagonistas a 800 px ≈ 45 KB en AVIF y miniaturas a 400 px ≈ 12 KB. Hero a 1440: 45 + 36
  (restaurante) + 45 + 36 (tienda) + 20 (teléfono) ≈ 182 KB. Si se pasa, se baja la calidad de AVIF antes que la
  resolución.

## Estrategia de tests
- `node --test`: `image-budget.js`. Suma por tipo de imagen, ignora lo que no es imagen, comprueba los límites
  por foto, antes del scroll y en total, y redondea a bytes.
- Playwright (escritorio y movil, con axe):
  - `spec003-content.spec.js`: RF-1 (sin nombres antiguos en el texto, los `aria-label` ni las URL), RF-2/3/4/5
    (textos, identificación como concepto, sin teléfonos, @, NIT ni nombres de marcas de terceros de una lista),
    RF-6…14 (marca, propuesta, botón, platos, servicios o productos con precio `$ … COP` o `$` con miles en cada
    bloque), RF-16 (≥ 9 fotos distintas), RF-18/19b (pantallas y URL del hero), RF-24 (`aria-label`).
  - `spec003-images.spec.js`: RNF-2 (bytes de imagen antes del scroll a 1440×900 y 390×844, con
    `performance.getEntriesByType('resource')`), RF-19c (`loading` de cada `<img>` en el hero y en los
    proyectos), RNF-1 (total de una sesión con scroll completo), RF-19d y RF-23 (se bloquean las imágenes con
    `page.route`: el contenedor sigue con el color de la paleta, el tamaño de la caja no cambia y no hay
    `transition` ni `animation` en la foto), RF-27 (sin EXIF: los primeros bytes de cada AVIF y WebP no contienen
    `Exif`).
  - `spec003-states.spec.js`: RF-20 (≥ 9 px a 390), RF-21 (movimiento reducido: sin animaciones en las
    pantallas), RF-22 (sin JS: las 3 marcas y las fotos con `naturalWidth > 0` tras el scroll), RF-25 (colores
    forzados emulados: `picture` con `display: none`), RF-26 (`emulateMedia print`), RNF-3 (CLS ≤ 0,1 y no peor
    que la base `18cd88b`, medida en T1).
- Verificación documentada (`verificaciones.md`): nitidez a 1440 con DPR 2 y en móvil real a 390×844 (RNF-4),
  contraste sobre foto (RNF-6), revisión de las fotos una a una (RNF-7) y nombres.
- Capturas en `test-results/capturas-spec003/`: los tres proyectos y el hero, a 1440 y 390.
