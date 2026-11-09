# Verificaciones documentadas — Spec 002

Comprobaciones que la spec acepta como verificación documentada porque no se pueden automatizar del todo
(spec.md, «Criterios de finalización», y plan.md, «Verificaciones documentadas»). Actualizado: 2026-11-08
(filas 4–6 comprobadas en el navegador integrado de Claude, a petición del usuario).

| # | Qué | Método | Resultado |
|---|---|---|---|
| 1 | Dispositivo híbrido (RF-21): un toque apaga hovers, punto e imán; mover el ratón los devuelve | Emulación en `tests/e2e/touch.spec.js`. Playwright con `hasTouch` vuelve grueso el puntero principal, así que se usa el ratón real (puntero fino) y se despachan con `dispatchEvent` `PointerEvent` sintéticos con `pointerType: 'touch'` (`isTrusted` falso). No reproducen el cambio de `:hover` que hace Chrome al tocar: cubren la lógica (`is-touch`), no el navegador | Emulación: pasa. **Pendiente (usuario): portátil táctil real** — tocar un botón con barrido, una fila de servicios y un enlace del pie: ni barrido, ni punto, ni imán, ni línea en la fila; mover el ratón: todo vuelve |
| 2 | Cambio del puntero principal a mitad de sesión (casos límite) | Emulación en `touch.spec.js` con CDP `Emulation.setTouchEmulationEnabled` (pasa `pointer` a `coarse` y `hover` a `none` sin recargar) | Emulación: pasa (sin punto ni imán en ≤ 200 ms). **Pendiente (usuario): tableta real** conectando y desconectando un ratón |
| 3 | Umbral de retirada del imán a 32 px (RF-7) | No se observa desde fuera: entre 24 y 32 px el botón está en reposo con el efecto activo o retirado. Test unitario de `magnetActive` (`tests/unit/pointer.test.js`: inactivo a 28 → no; activo a 28 → sí; a 32 → sí; a 32,01 → no) y lectura del código: en `src/js/pointer.js`, con el imán permitido (modo de imán, puntero presente y `magnetAllowed`), el efecto solo se retira cuando `magnetActive` devuelve falso, es decir, con `distance > MAGNET.release`. Sin modo, sin presencia o sin permiso se retira siempre | Hecho |
| 4 | Traducción del navegador (RF-11): el texto de los botones cambia una sola vez y el barrido pinta el texto traducido | **Pasos (usuario)**: Chrome → clic derecho → «Traducir al inglés»; pasar el puntero por «Iniciar proyecto por WhatsApp», «Escribir por WhatsApp» y el botón del menú. Esperado: cada botón muestra su texto traducido una sola vez y, durante el barrido, en dos colores alineados con el frente | **Pasa (2026-11-08, simulada).** El menú «Traducir» de Chrome no se puede lanzar desde la página ni por CDP, así que se imitó lo que hace el traductor: en `npm run preview` (Chromium del navegador integrado, 1280×800) se cambiaron los 5 textos (CTA de la barra, los 2 «Iniciar proyecto por WhatsApp», «Escribir por WhatsApp» y «Menú») por su traducción envuelta en dos `<font style="vertical-align: inherit">`. Con el ratón real: texto traducido una sola vez (1 nodo de texto) y, a media barrida, «Wr» en azul sobre el frente blanco y el resto en blanco sobre azul, alineado; al final, todo azul sobre blanco. El botón del menú reescribe su etiqueta («Cerrar»/«Menú») con `textContent` al abrir y cerrar, igual que en la base; el traductor real la vuelve a traducir. Traducción real en Chrome: opcional (usuario). Apoyo automático: `hovers.spec.js` comprueba que `textContent`, el número de nodos y el nombre accesible no cambian antes, durante y después del barrido |
| 5 | Selección de texto en los botones, en reposo y con hover: un solo texto, legible | **Pasos (usuario)**: seleccionar con el ratón el texto de «Escribir por WhatsApp» en reposo y con el barrido completo; copiar y pegar. Esperado: un solo texto, legible, y el pegado sin duplicados. Ojo: el `::after` transparente del imán queda encima del botón; comprobar que no impide seleccionar | **Pasa (2026-11-08).** Navegador integrado (Chromium, 1280×800, ratón real por CDP) sobre `npm run preview`: arrastre desde fuera del botón hasta el final del texto, con el barrido completo y después en reposo → `getSelection()` = «Escribir por WhatsApp», una sola vez y legible; el doble clic dentro del botón selecciona una palabra. El `::after` no impide seleccionar. Observación (viene de la spec 000, no de la 002): la regla global `::selection` de `base.css` (fondo azul y texto blanco) coincide con el botón azul en reposo, así que el resaltado no se ve, aunque la selección existe y se copia. Queda como opcional |
| 6 | Arrastre de la barra de desplazamiento: el punto no interfiere y el scroll es el nativo | **Pasos (usuario)**: con el punto visible, arrastrar la barra de desplazamiento de arriba abajo. Esperado: scroll nativo, sin saltos; el punto no bloquea el arrastre | **Pasa (2026-11-08).** Navegador integrado (Chromium, 1280×800, barra de 15 px) sobre `npm run preview`: con el punto presente, arrastre del pulgar de la barra con el ratón real → scroll nativo de 0 a 4.847 px, proporcional al arrastre (la herramienta mueve en pocos pasos, de ahí los saltos entre eventos), ningún evento cancelado (`defaultPrevented` = 0 en todos) y el punto con `pointer-events: none`. Arrastre lento a mano: opcional (usuario). Apoyo: el punto tiene `pointer-events: none` y `spec002-rnf.spec.js` comprueba que ninguna rueda, tecla ni toque queda cancelado |
| 7 | Opcionales: colores forzados reales (tema de contraste de Windows) y zoom real al 200 % y al 400 % | Manual | Opcional, no hecho. Automático: `spec002-states.spec.js` (colores forzados emulados, con y sin script) y `spec002-rnf.spec.js` (ventanas de 720×450 y 360×225 con ratón) |

## Resultados medidos
- **CLS del recorrido de la spec** (todas las entradas, también las de `hadRecentInput`; máximo de 3 ejecuciones
  iguales): base `0f6b12d` = 0,000114 en escritorio y 0,000130 en movil; spec 002 = **0,000114 y 0,000130**,
  idénticos. Los desplazamientos son los de la base (`.nav__actions` al cargar y al cambiar «Menú»/«Cerrar»).
- **Tareas largas** durante el recorrido del puntero a 1440×900: ninguna con el test en serie (5 de 5, y en el
  proyecto aislado de la puerta). Con 6 navegadores en paralelo aparecieron tareas de 65 y 239 ms por la carga
  de la máquina; por eso el test corre en el proyecto aislado (decisión del usuario, `playwright.config.js`).
- **Peso** (gzip, `npm run budget`): JS +1.590 B (máximo +1.636 B tras la decisión 23) y CSS +922 B (máximo
  +2.048 B) sobre la base `0f6b12d`.

## Skips de emulación
- Ninguno queda en `skip`: el híbrido y el cambio de puntero se emulan como se describe arriba.

## Notas de medida (por qué los tests miden así)
- **Tiempos de forma y de posición del punto y destino del imán**: con varios navegadores en paralelo, cada
  fotograma headless dura 50–100 ms por la carga de la máquina (la escena del hero inclinada se repinta sin
  GPU). Los tests registran en la página, con un `MutationObserver` armado antes de la acción, el fotograma en
  que el sistema aplica el estado; lo cuentan a 60 Hz desde el evento y suman la transición declarada. Además
  exigen el estado final visual y un tope de tiempo real holgado. El código no tiene temporizadores, así que el
  retraso del sistema se mide en fotogramas; un retraso medido en tiempo (un `setTimeout`) lo cazaría el tope
  real o los tests que miden en tiempo real (fin del fundido, menú).
- **Entrada del CTA del hero**: los tests pausan las animaciones del hero mientras recorren los CTA y las
  terminan con `finish()`. La lógica solo mira si el fundido ha terminado.
- **Imán forzado a ±8 px**: el destino del imán solo se escribe cuando cambia, así que el valor forzado por el
  test se mantiene; aun así, cada test fuerza después del último scroll o movimiento y comprueba el `translate`
  calculado antes de medir.
