# Tareas 002 — Microinteracciones de puntero

Plan: `specs/002-microinteracciones/plan.md`. @implementer hace una tarea por llamada:
1. escribe los tests y comprueba que fallan (en rojo);
2. escribe el código;
3. pone los tests en verde;
4. marca la tarea y para.

Cada tarea termina con `npm run check` en verde, el peso dentro del margen y `MEMORY.md` actualizado. Si falta una
decisión, o el peso proyectado pasa del margen, se para y se pregunta.

Base de peso: build limpio de `0f6b12d`, JS 3.965 B y CSS 10.731 B (gzip). Margen de la spec: +1.636 B de JS (+1.536 más 100 B del sobrante de la 001, decisión 23 de spec.md) y +2.048 B de CSS.

- [x] **T1. Base `0f6b12d`, presupuesto de la 002 y datos de la base.** RF-17, RF-19, RF-20, RNF peso, RNF estabilidad
  - Archivos: `scripts/check-budget.mjs`, `tests/e2e/support/pointer.js` (`styleFingerprint`, `tabOrder`,
    `clsRoute`, `noFollow`), `tests/e2e/spec002-base.spec.js`, `tests/e2e/fixtures/spec002-base.json`.
  - Primero, sin tocar código:
    1. Comprobar que el árbol coincide con `0f6b12d`: fuera de `specs/` y de `MEMORY.md` no hay cambios. Si no
       coincide, usar un worktree en el scratchpad.
    2. Borrar `dist/`, hacer el build y medir el peso.
    3. Generar los datos de la base, en dos pasadas: CLS del recorrido (el máximo de 3 ejecuciones), orden de
       tabulación, huellas de estilos en reposo (movil y 844×390 táctil, con y sin JS; escritorio sin JS),
       hovers sin JS en escritorio y `cursor` calculado.
  - Después: `SPEC = '002'`, `BASE = { js: 3965, css: 10731 }` y `ALLOWANCE = { js: 1536, css: 2048 }`.
  - Hecho cuando:
    - la medida da 3.965 B de JS y 10.731 B de CSS (si no, se para y se pregunta);
    - `npm run budget` imprime +0 B en JS y en CSS (máx. +1536 / +2048, spec 002) y falla con
      `--allowance-js=-1`;
    - el JSON se repite entre las dos pasadas, salvo las propiedades excluidas con su comentario;
    - `spec002-base.spec.js`, en modo comparación, está en verde en `escritorio` y `movil`.
  - Comprobación: `npm run build; npm run budget; npx playwright test tests/e2e/spec002-base.spec.js`.

- [x] **T2. Lógica pura del puntero y del contraste.** RF-1–RF-9, RF-16, RF-21, RF-22
  - Archivos: `src/lib/pointer.js`, `src/lib/contrast.js`, `tests/unit/pointer.test.js`,
    `tests/unit/contrast.test.js`.
  - Funciones:
    - `pointer.js`: `MAGNET`, `boxDistance`, `magnetOffset`, `magnetActive`, `isFullWidth`, `pointerMode`,
      `isRing` (antes `cursorShape`), `magnetAllowed`, `isModifierKey`, `parseTranslate`, con firmas
      posicionales (plan.md, «Implementado frente al plan»);
    - `contrast.js`: `parseColor`, `luminance`, `contrastRatio`, `bestOf`.
  - Hecho cuando los unitarios cubren los casos de la tabla del plan y `npm test` está en verde:
    - el perfil del imán: 0 a ≥ 24 px y entre 24 y 32 px; creciente hasta el borde; ≥ 3 px en el borde; 0 en el
      centro; ≤ 8 px; sin saltos de más de 0,5 px; siempre hacia el puntero;
    - la histéresis a 32 px;
    - las tablas de verdad;
    - las teclas modificadoras;
    - el contraste 21 y 6,46.
  - Comprobación: `npm test`.

- [x] **T3. Hovers de hoy solo en dispositivos con hover.** RF-15, RF-16, RF-17, RF-20
  - Archivos: `src/styles/base.css`, `src/styles/nav.css`, `src/styles/sections.css` (los `:hover` pasan a
    `@media (hover: hover)`, con `html:not(.fx)` o `html:not(.is-touch)` según el plan), y
    `tests/e2e/touch.spec.js` (toques).
  - Hecho cuando, en `touch.spec.js`, con y sin JS, en movil y a 844×390 táctil:
    - tocar cada enlace, botón y fila de servicios no deja ningún estado de hover a 0, 100 y 500 ms;
    - un solo toque activa el elemento.
    Además:
    - `spec002-base.spec.js` sigue en verde (huella en reposo = base; hovers sin JS en escritorio = base);
    - los tests de las specs 000 y 001 siguen en verde;
    - el peso de CSS sube como mucho ≈ +120 B.
  - Comprobación: `npx playwright test tests/e2e/touch.spec.js tests/e2e/spec002-base.spec.js; npm run check`.

- [x] **T4. Planificador único de fotogramas, `html.fx`, `menuchange` y esqueleto del puntero.** RF-4, RF-17, RF-19
  - Archivos:
    - `src/js/scroll-fx.js`: `addFrameHook`; `initScrollFx` pasa a ser un hook, sin cambiar la lógica de
      `update()`;
    - `src/js/menu.js`: evento `menuchange`;
    - `src/js/pointer.js`: `initPointer` con sus entradas, `matchMedia` y el hook de lectura y escritura,
      todavía sin punto ni imán visibles;
    - `src/main.js`: importa `micro.css`, llama siempre a `initPointer()` y pone `fx` al final;
    - `src/styles/micro.css`: vacío, con solo las `@property`;
    - `data-magnet` en `hero.html` y en `contact.html`;
    - `tests/e2e/frame.spec.js`.
  - Hecho cuando:
    - `frame.spec.js` cuenta exactamente 1 listener de `scroll` en `window`, con y sin movimiento reducido;
    - `html.fx` existe con el script y no existe sin JS ni con el módulo bloqueado;
    - `menuchange` se emite al abrir y al cerrar (botón, Escape, enlace);
    - todos los e2e de las specs 000 y 001 siguen en verde sin haberlos tocado;
    - el JS sube ≤ ≈ +250 B.
  - Comprobación: `npx playwright test tests/e2e/frame.spec.js; npm run check`.

- [x] **T5. Punto (cursor complementario).** RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-14, RF-16
  - Archivos:
    - `src/js/pointer.js`: crear, colocar, ocultar y borrar el punto; `is-ring`; excepciones de la entrada del
      CTA y del menú en transición;
    - `src/styles/micro.css`: estilos del punto y su ocultación con reducido, colores forzados e impresión;
    - `tests/e2e/cursor.spec.js`;
    - ampliar `touch.spec.js`: sin punto en táctil; con punto en la ventana estrecha con ratón.
  - Hecho cuando `cursor.spec.js` está en verde con las medidas del plan:
    - aparece al primer movimiento y alcanza al puntero (±1 px) en ≤ 150 ms; quieto, sin animaciones;
    - disco de 8 ± 1 px y aro de 40 ± 1 px en ≤ 200 ms;
    - aro sin relleno en todos los fotogramas, salvo en las excepciones; disco sobre los dos CTA durante su
      entrada y aro en la barra; disco durante la transición del menú y aro ≤ 200 ms después;
    - con scroll y el puntero quieto, cambia en ≤ 200 ms;
    - colores blanco y negro, ≥ 3:1 sobre blanco, negro, azul y cada pantalla de mockup;
    - accesibilidad: `aria-hidden`, sin enfocables nuevos, el clic lo atraviesa;
    - la salida de la ventana y las teclas no modificadoras lo ocultan; las modificadoras no;
    - la inclinación del hero sigue igual.
    Además, en táctil no hay `.cursor`, y en la ventana estrecha con ratón sí.
  - Comprobación: `npx playwright test tests/e2e/cursor.spec.js tests/e2e/touch.spec.js; npm run check`.

- [x] **T6. Botones magnéticos.** RF-7, RF-8, RF-9, RF-16, RF-19
  - Archivos:
    - `src/js/pointer.js`: imanes en `read` y `write`, con foco, menú abierto o en transición, entrada del CTA,
      ancho completo, salida de la ventana y `blur`;
    - `src/styles/micro.css`: `translate`, el `::before` del área de reposo y la transición de 160 ms;
    - `tests/e2e/magnet.spec.js`.
  - Hecho cuando `magnet.spec.js` está en verde, a 1440×900 y 1024×768:
    - el perfil medido: 0 a ≥ 24 px y entre 24 y 32 px; creciente; ≥ 3 px en el borde; 0 en el centro; ≤ 8 px;
      sin saltos; hacia el puntero;
    - nunca sobrepasa el destino, queda quieto en ≤ 300 ms y se recalcula con scroll en ≤ 200 ms;
    - no hay imán durante la entrada del CTA ni durante la transición del menú;
    - nada más se mueve;
    - el clic en el área de reposo activa el botón, también tras barridos rápidos y con la pulsación;
    - vuelve al reposo en ≤ 300 ms con foco de teclado, con el menú abierto, al salir de la ventana y con
      `blur`;
    - 001/RF-5 y 001/RF-9 se cumplen con ±8 px forzados;
    - sin imán en táctil ni con el botón a todo el ancho.
  - Comprobación: `npx playwright test tests/e2e/magnet.spec.js tests/e2e/touch.spec.js; npm run check`.

- [x] **T7. Hovers con dirección, foco y movimiento reducido.** RF-10, RF-11, RF-12, RF-13, RF-14, RF-15
  - Archivos:
    - `src/js/pointer.js`: `initSweeps` (`is-out`, `is-relink`);
    - `src/styles/micro.css`: barrido en capas de fondo, estados de `--sa/--sb`, subrayados de la barra y del pie,
      `@keyframes relink`, foco con y sin hover;
    - `tests/e2e/hovers.spec.js`.
  - Primer test, antes de seguir: los píxeles del botón de Contacto en reposo, en hover y pausado al 40 % y al
    70 %. Si el recorte `text` por capa no funciona, se para y se informa.
  - Hecho cuando `hovers.spec.js` está en verde:
    - la barra y el pie entran por la izquierda y salen por la derecha en ≤ 300 ms (el pie, con el color de
      hoy);
    - «Ver proyectos» sale por la derecha y vuelve por la izquierda en ≤ 500 ms, y termina aunque el puntero
      salga;
    - interrupciones sin saltos;
    - la marca, el enlace de salto y los enlaces del menú quedan como hoy;
    - el barrido de los 3 botones dura ≤ 400 ms y se retira hacia la derecha en ≤ 400 ms; texto, nombre
      accesible y nodos sin cambios; contraste ≥ 4,5:1 en reposo, en hover y a cada lado del frente medido en
      píxeles;
    - con Tab, el estado final llega al instante, con el indicador de foco de la 000 y sin imán (escritorio y
      movil);
    - con movimiento reducido, todo al instante;
    - los escenarios no tienen hover;
    - las filas de servicios con ratón quedan como hoy.
    Además, `spec002-base.spec.js` y `touch.spec.js` siguen en verde.
  - Comprobación: `npx playwright test tests/e2e/hovers.spec.js tests/e2e/spec002-base.spec.js tests/e2e/touch.spec.js; npm run check`.

- [x] **T8. Estados: híbrido, colores forzados, impresión, sin JS y cambio de preferencia.** RF-5, RF-13, RF-17, RF-18, RF-20, RF-21, RF-22
  - Archivos:
    - `src/js/pointer.js`: `is-touch` en el toque con puntero fino; respuesta a `change`;
    - `src/styles/micro.css`: bloques de colores forzados e impresión;
    - `tests/e2e/spec002-states.spec.js`;
    - ampliar `touch.spec.js` con el híbrido y el cambio de puntero, por emulación CDP o `skip` documentado.
  - Hecho cuando `spec002-states.spec.js` está en verde:
    - sin JS y con el módulo bloqueado, no hay punto ni imán y los CTA son los de la 000;
    - impresión: sin punto ni desplazamiento ni barrido, y el texto con su color;
    - colores forzados, con y sin script: botones del sistema con borde y sin barrido, sin punto; con script,
      subrayados en `LinkText` sin animación;
    - el cambio de preferencia de movimiento, en los dos sentidos, se aplica en ≤ 200 ms sin restos.
    Además:
    - el test del híbrido pasa, o queda en `skip` con su motivo anotado para T10;
    - la huella de la base sigue igual.
  - Comprobación: `npx playwright test tests/e2e/spec002-states.spec.js tests/e2e/touch.spec.js; npm run check`.

- [x] **T9. Requisitos no funcionales y capturas.** RF-8, RF-19, RNF estabilidad, RNF sin secuestro, nada infinito
  - Archivos: `tests/e2e/spec002-rnf.spec.js`; se vuelve a ejecutar `spec002-base.spec.js` (CLS).
  - Hecho cuando:
    - el CLS del recorrido es ≤ la base en escritorio y en movil;
    - no hay `longtask` de más de 50 ms en el recorrido del puntero;
    - axe no da infracciones con el punto en aro, un barrido en curso y el menú cerrado y abierto;
    - no hay scroll horizontal de 320 a 1920 px con el imán a ±8 px y el punto en el borde derecho;
    - con el zoom emulado (720 y 360 px) no hay scroll horizontal y el foco se ve sin tapar;
    - no hay `defaultPrevented` en la rueda, las teclas ni los toques;
    - no quedan animaciones en curso 500 ms después de parar;
    - las capturas del plan se generan en `test-results/capturas-spec002/`.
  - Comprobación: `npx playwright test tests/e2e/spec002-rnf.spec.js tests/e2e/spec002-base.spec.js; npm run check`.

- [x] **T10. Cierre: puerta, revisión visual, verificaciones y memoria.** Todos los RF (RF-1–RF-22), RNF peso
  - Archivos: `specs/002-microinteracciones/verificaciones.md`, `MEMORY.md`, este `tasks.md` (marcas).
  - Hecho cuando:
    - `npm run check` está en verde (una vuelta, decisión del usuario del 2026-10-25; antes, dos seguidas);
    - `npm run budget` indica un incremento ≤ +1636 B de JS (decisión 23) y ≤ +2048 B de CSS sobre la base `0f6b12d`;
    - las capturas a 1440 px y en el proyecto movil (también a 844×390 y en la ventana estrecha con ratón) están
      revisadas y anotadas en `MEMORY.md`;
    - `verificaciones.md` recoge, con fecha, método y resultado: el híbrido, el cambio de puntero principal, el
      umbral de 32 px, la traducción, la selección de texto, el arrastre de la barra de desplazamiento, y los
      `skip` de emulación con su motivo;
    - el checklist de motion-rules y el de mockup-screens están rellenados en `MEMORY.md`;
    - `MEMORY.md` está actualizado (estado, decisiones con su porqué, errores a evitar) y no pasa de ~50 líneas;
    - queda listo para la revisión de @reviewer.
  - Comprobación: `npm run check; npm run budget`.
