# Tareas 003 — Conceptos que venden

Plan: `specs/003-conceptos-que-venden/plan.md`. Las tareas las hace la sesión principal, en orden: primero los tests
(en rojo), después el código y por último los tests en verde. Al terminar cada una, se marca, se actualiza
`MEMORY.md` y se para. `npm run check` se ejecuta en T10, y además cuando una tarea toca interfaz compartida (T7 y T8).
Si falta una decisión, o el peso proyectado pasa del margen, se para y se pregunta.

Base de peso: build limpio de `18cd88b`. Margen de la spec: JS +0 B y CSS +1.024 B. Imágenes: RNF-1 y RNF-2.

- [x] **T1. Base y comprobaciones previas.** RNF-3, RNF-5, RF-19c
  - Medir en `18cd88b` el peso (JS y CSS) y el CLS de un recorrido completo, en escritorio y movil, y guardarlo
    en `tests/e2e/fixtures/spec003-base.json`.
  - Comprobar que un atributo (`loading`, `sizes`, `device`) llega del `<include>` de una sección al de la
    pantalla anidada. Si no llega, reenviarlo en `vite.config.js`.
  - Comprobar que todas las capas con dispositivo tienen `container-type: inline-size`.
  - Hecho cuando: el fixture existe con dos pasadas iguales, un build de prueba muestra el atributo en la
    pantalla y `check-budget.mjs` tiene `SPEC = '003'` con la base y el margen nuevos.

- [x] **T2. Lógica de presupuesto de imágenes.** RNF-1, RNF-2
  - `src/lib/image-budget.js` y `tests/unit/image-budget.test.js`; `check-budget.mjs` comprueba ≤ 90 KB por
    archivo AVIF o WebP de `public/media/conceptos/`.
  - Hecho cuando: `npm test` en verde, con los casos límite (sin imágenes, justo en el límite y 1 B por encima).

- [x] **T3. Script de variantes y registro.** RNF-1, RF-27
  - `scripts/build-concept-images.mjs` con ffmpeg del sistema: de `media-src/conceptos/*.png` a 800/1600 o
    400/800 px en AVIF, WebP y JPEG, sin metadatos. Un mensaje claro si falta ffmpeg.
  - `media-src/conceptos/registro.md` con la plantilla (foto, prompt, herramienta, fecha, aprobada).
  - Hecho cuando: con una imagen de prueba salen las variantes esperadas, sin `Exif`, y la de prueba se borra.

- [x] **T4. Generar las 11 fotos en Flow y aprobarlas.** RF-16, RF-17, RNF-7
  - Nano Banana 2.1 (0 créditos) en el navegador integrado; prompts en `registro.md`.
  - Revisión una a una: sin texto, logos, marcas de agua ni defectos de IA.
  - **Puerta**: el usuario aprueba las 11 (se le enseñan en una hoja de contacto). Después se ejecuta el script.
  - Hecho cuando: hay 11 originales aprobados, sus variantes en `public/media/conceptos/` dentro de RNF-1 y el
    registro completo.

- [x] **T5. Pantalla Brasa Lenta.** RF-6, RF-7, RF-8, RF-15
  - `screens/restaurant.html` y `.scr--restaurant` en `devices.css`, con su bloque de escritorio y su bloque de
    teléfono. Todo en `--u`.
  - Hecho cuando: los tests de contenido del restaurante pasan y la captura a 1440 y 390 está revisada.

- [x] **T6. Pantalla Navaja & Roble.** RF-9, RF-10, RF-11, RF-15
  - Igual que T5, con `screens/barber.html`.
  - Hecho cuando: sus tests de contenido pasan y la captura está revisada.

- [x] **T7. Pantalla Pulso e integración.** RF-1…5, RF-12…14, RF-18, RF-19, RF-19b, RF-19c, RF-24
  - `screens/store.html`. Hero (restaurante, tienda, barbería; `eager`) y `work.html` (título «Tres negocios.
    Tres webs que venden.», textos, paletas, `aria-label`, URL `.concept`, `lazy`).
  - Borrar las pantallas y estilos antiguos.
  - Hecho cuando: `spec003-content` pasa entero, no queda ningún nombre antiguo (`grep`), el ensamblaje del hero
    y los e2e de las specs 001 y 002 siguen en verde, y `npm run check` está en verde.

- [x] **T8. Reserva, colores forzados, impresión y carga.** RF-19c, RF-19d, RF-22, RF-23, RF-25, RF-26, RNF-1, RNF-2
  - CSS del bloque final de `devices.css`; `spec003-images.spec.js` y `spec003-states.spec.js`.
  - Hecho cuando: los dos archivos de tests pasan en escritorio y movil, y `npm run check` está en verde.

- [x] **T9. Móvil, movimiento reducido y estabilidad.** RF-20, RF-21, RNF-3, RNF-6
  - Ajustar los tamaños de texto si a 390 px no llegan a 9 px. CLS frente al fixture de T1. Contraste sobre foto
    documentado.
  - Hecho cuando: los tests de RF-20, RF-21 y RNF-3 pasan, y el contraste está anotado en `verificaciones.md`.

- [x] **T10. Documentación y cierre.** RNF-4, criterios de finalización
  - `mockup-screens` (identidades nuevas y regla de fotos), `PROJECT_BRIEF.md` (portafolio) y
    `verificaciones.md` (nitidez y fotos).
  - Capturas en `test-results/capturas-spec003/`.
  - Hecho cuando: `npm run check` en verde, capturas revisadas a 1440 y 390, `MEMORY.md` al día y la spec lista
    para la validación con un solo @reviewer.

## Notas de implementación
- T1: el CLS de la base se reutilizó de la spec 002 sin volver a medirlo; el reviewer lo midió después sobre
  `18cd88b` (0,000114 en escritorio y 0,000130 en movil, idéntico al actual). Los atributos llegan a la pantalla anidada sin tocar `vite.config.js`, porque `{{…}}` se
  sustituye antes de procesar el siguiente nivel; cada dispositivo pasará `desk-loading`/`phone-loading` y sus
  `sizes`.
- T3: comando `npm run images` en `package.json` (un script, no una dependencia). Prueba con una imagen sintética
  de 2048×1152: AVIF de 5,8 KB y 24,8 KB, sin `Exif`.
- T4: Flow entrega las fotos a 1K (1376 px las de 16:9, 1024 las cuadradas y 896×1200 la vertical); el reescalado
  a 2K se descartó porque inventa detalle y podría gastar créditos. El script limita cada variante al ancho original
  (protagonistas: 800 y 1376). Originales en JPEG (`media-src/conceptos/*.jpg`, unos 7,5 MB): el script acepta JPEG
  y PNG. AVIF a crf 28 en todas (mayor: 68,8 KB); WebP con q 72–80 (mayor: 89 KB).
- T5–T7: las tres pantallas comparten la estructura `.c-*`, y cada marca define sus colores y su tipografía con
  variables `--c-*`. El CSS queda en −681 B frente a la base. `vite.config.js` no se tocó.
- T9 (RF-20): a 390 px, el navegador de cada proyecto mide unos 460 px y el escenario lo recorta, igual que en la
  base. El concepto se lee en su teléfono: marca 30 `--u` y botón 27 `--u`, que dan ≥ 9,5 px (test automático).
- Fuera de la spec, con aprobación del usuario (2026-11-08):
  1. La huella de estilos de la 002 (`spec002-base.spec.js`) excluye solo las pantallas (`.scr`), las URL, los textos
     de los proyectos y los contenedores cuya altura o color cambia (más `.hero__stage` entre 768 y 864 px).
  2. El test de cortinas de la 001 (RF-8, densidades) mira la franja hasta 1 px de dispositivo antes del plano.
     La causa no está probada; sin el margen el test es intermitente también en la base (8/30).
- T10: las capturas se generan en `test-results/capturas-spec003/` (1440, 844, 768 y 390 px, DPR 2).

## Corrección tras la validación (2026-11-24)
Alcance elegido por el usuario: «solo lo que queda» (Pulso, hero, dispositivos, peso y tests).
- Hecho: decisiones 1, 2, 4, 5 (Pulso), 7, 8, 9 y 10; C1, C4, C5, C7–C12 de `validacion.md`.
- No se hace (restaurante y barbería se sustituirán): decisión 3 en `barberia-hero`, 5 en la fecha del restaurante,
  6; C2 y C3.
- Pendiente: el @reviewer final. Hecho: decisión 3 en `tienda-hero` (foto nueva aprobada) y C6 en las 11 fotos.
- Variantes nuevas (640/1000/1376, 240/360/480…): los anchos de T3 y T4 ya no valen.
- Cada test reforzado se comprobó rompiendo el requisito: RF-5, 15, 17, 19, 20, 21, 22, 23, 25, 27, RNF-2 y RNF-4.
