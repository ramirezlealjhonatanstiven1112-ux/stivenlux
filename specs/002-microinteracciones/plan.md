# Plan 002 — Microinteracciones de puntero

Spec: `specs/002-microinteracciones/spec.md` (aprobada). Skills: `sdd`, `motion-rules` (sin ampliar),
`mockup-screens` (solo lectura: no se toca ninguna pantalla).

Estado: aprobado por el usuario el 2026-10-23, con P1 = A y P2 = A (ver «Decisiones del usuario», al final).

## Implementado frente al plan (actualizado en la validación, 2026-10-25)
Donde el resto del plan diga otra cosa, manda esta sección (describe el código tal como está):
- **Firmas de las funciones puras** (`src/lib/pointer.js`): argumentos posicionales, porque los nombres de
  propiedad no se minifican y el presupuesto de JS es estrecho.
  - `pointerMode(fine, reduced, forced)` → `{ dot, magnet }`.
  - `isRing(pressable, heroCta, ctaEntering, menuMoving)` → booleano (sustituye a `cursorShape({…})`, que
    devolvía `'ring'`/`'disc'`).
  - `magnetAllowed(menuOpen, menuMoving, focused, entering, fullWidth)`: el modo de imán y la presencia del
    puntero los comprueba quien llama, antes.
  - `magnetOffset(px, py, box)` y `magnetActive(active, distance)` leen la constante `MAGNET` en lugar de
    recibirla como parámetro.
- **Duraciones**: seguimiento del punto 80 ms (plan: 100) y cambio a aro 120 ms (plan: 160), para tener margen
  con los límites de 150 y 200 ms. Imán 160 ms, barridos 340 ms, subrayados 240 ms y `relink` 420 ms, como en el
  plan.
- **Área de reposo pulsable del imán**: `::after` contratrasladado (plan: `::before`, que es el relleno de hoy
  de `.btn`).
- **Escritura del imán**: `--mgx/--mgy` solo se escriben cuando cambia el destino; en táctil no se escribe nada.
  El `translate` del botón y de su `::after` solo se aplica con `[style*='--mgx']`: si se aplicara siempre, al
  poner `html.fx` el valor pasaría de `none` a `0px 0px` y nacería una transición de 160 ms al cargar (alargaba
  la secuencia de entrada del hero medida por la 000).
- **Salidas con dirección**: `.is-out` se quita con `transitionend` de `--sa` y, si el foco con teclado
  cancela la salida, con `transitioncancel` (solo con `:focus-visible`: una cancelación por volver a salir no
  lo quita). `.is-relink` se quita con `animationend` o `animationcancel`. Con colores forzados no se ponen
  (sin transiciones, nada las quitaría).
- **`@keyframes relink`**: con `0%, 100% { clip-path: inset(0) }` explícitos (sin ellos parpadeaba).
- **Peso**: margen de JS +1.636 B (+1.536 más 100 B del sobrante de la 001, decisión 23 del usuario).
- **Medida de tiempos en los tests**: fotogramas, registrados en la página desde el evento con un
  `MutationObserver`, a 60 Hz, más la transición declarada; además, estado final visual y tope de tiempo real
  holgado (riesgo 12, «Tiempos con la máquina cargada»). Detalle en `verificaciones.md`.
- **Puerta**: el test de tareas largas y `load-states` «/#servicios» (de la 001) corren en proyectos aislados
  de `playwright.config.js`, después del resto y de uno en uno (decisión del usuario).

## Base de peso y de estabilidad (T1, antes de tocar código)
- **Peso**: hay que hacer un build limpio de `0f6b12d` y medirlo con el método de `npm run budget` (gzip por
  archivo, sumado por extensión; las fuentes `.woff2` no cuentan). Lo esperado, según la spec, es **JS 3.965 B
  y CSS 10.731 B**. Margen de la 002: **+1.536 B de JS y +2.048 B de CSS**, así que el techo queda en
  **5.501 B y 12.779 B**. El límite general sigue siendo de 15 KB y 20 KB.
  - Build limpio: si `git rev-parse HEAD` es `0f6b12d` y `git status --porcelain -- . ':!specs' ':!MEMORY.md'`
    sale vacío, se borra `dist/` y se ejecutan `npm run build` y `npm run budget` en el propio repositorio.
  - Si no es así, se crea `git worktree add <scratchpad>/base-0f6b12d 0f6b12d`, con una unión a `node_modules`
    del repositorio y sin instalar nada. Se hace el build allí, se mide igual y se borra el worktree.
  - **Si la medida no coincide con 3.965 / 10.731 B, se para y se pregunta**: la spec fija esos totales.
- **CLS, orden de tabulación y huella de estilos**: se miden sobre el mismo build de la base. El método está en
  «Estrategia de tests · Datos de la base» y los valores se guardan en `tests/e2e/fixtures/spec002-base.json`.

## Resumen de la solución
1. **Planificador único de fotogramas** en `scroll-fx.js`. Sigue habiendo un solo listener de scroll, uno de
   resize y un solo `requestAnimationFrame`, que ahora atiende a varios «hooks» `{ read, write }`. En cada
   fotograma se hacen primero todas las lecturas y después todas las escrituras. Hay dos hooks:
   - el de la spec 001: su `update()` actual, sin cambiar la lógica;
   - el del puntero.
   El scroll despierta a los dos. Un movimiento del puntero solo despierta al del puntero. Así, el recálculo
   con el scroll (RF-4, RF-7) va dentro del único fotograma de scroll, y existe aunque la página haya cargado
   con movimiento reducido.
2. **Punto** (`src/js/pointer.js`): un `div.cursor` decorativo (`aria-hidden`, `pointer-events: none`) con
   dos hijos `<i>`, el disco y el aro.
   - JS solo escribe la posición y la clase `is-ring` en el fotograma compartido. El seguimiento lo hace una
     transición CSS de `transform` de 100 ms; el cambio a aro, una transición de 160 ms de `transform` y
     `opacity`. No hay bucles.
   - El estado se decide con `document.elementFromPoint` en la posición del puntero, así que también cambia
     con el scroll aunque el puntero esté quieto.
3. **Imán** (2 botones con `data-magnet`): `magnetOffset()` calcula el destino y JS lo escribe como
   `--mgx/--mgy`. El botón usa la propiedad `translate` con una transición de 160 ms y curva `--ease-out`, que
   no sobrepasa el destino.
   - Un `::before` invisible, contratrasladado, mantiene pulsable el área de reposo (RF-9).
   - La histéresis (24/32 px) la decide `magnetActive()`.
4. **Hovers con dirección**: modelo de **dos bordes**, con dos variables registradas `--sa` (borde izquierdo)
   y `--sb` (borde derecho), en porcentaje y con transición.
   - Estados: reposo (0, 0), sin transición; `:hover` (0, 100 %); clase `is-out` (100 %, 100 %), que JS pone
     en `pointerleave` y quita al acabar la transición.
   - Entra por la izquierda, sale por la derecha y, si se interrumpe, sigue desde el estado en que está, sin
     saltos.
   - Los subrayados se recortan con `clip-path: inset(0 calc(100% - var(--sb)) 0 var(--sa))`.
   - Los 3 botones pintan el relleno y el texto en capas de fondo con el mismo frente. El texto usa
     `background-clip: text` solo mientras hay barrido (P1). El texto es uno solo y no se duplica.
   - «Ver proyectos» usa una animación `@keyframes` disparada por una clase, que termina aunque el puntero salga.
5. **Hover solo donde hay hover**: todas las reglas `:hover` de hoy pasan a `@media (hover: hover)`, también sin
   JS. En táctil el hover ya no queda pegado (RF-15, RF-16, RF-20) y nada más cambia. Con el script ejecutado
   (`html.fx`), las reglas de hoy de RF-10 y RF-11 ceden ante las nuevas.
6. **`html.fx`** = «el script principal se ha ejecutado». Lo pone `main.js` al final de su inicialización. No se
   usa `html.js`, porque el script en línea lo pone aunque el módulo falle (RF-17).
7. **Híbridos**: un toque con el dedo con puntero principal fino pone `html.is-touch`, que apaga los hovers
   (RF-10, RF-11 y filas), el punto y el imán. El siguiente movimiento del ratón lo quita (RF-21).
8. **Colores forzados, impresión y movimiento reducido**: se resuelven con media queries de CSS, y JS responde
   a los `change` de `matchMedia` en el siguiente fotograma (≤ 200 ms).

## Archivos y responsabilidades

| Archivo | Acción | Responsabilidad | RF |
|---|---|---|---|
| `scripts/check-budget.mjs` | modificar | `SPEC = '002'`, base `0f6b12d` y margen +1.536/+2.048 | RNF peso |
| `src/lib/pointer.js` | crear | Perfil del imán, distancia al área de reposo, histéresis, ancho completo, modo de puntero, forma del punto, permiso del imán, teclas modificadoras, lectura de `translate` | RF-1, RF-3, RF-5–RF-9, RF-16, RF-21 |
| `src/lib/contrast.js` | crear | Luminancia relativa y contraste WCAG (no entra en el bundle: solo lo usan los tests) | RF-2, RF-11 |
| `src/js/scroll-fx.js` | modificar | Planificador único (`addFrameHook`); `initScrollFx` pasa a ser un hook más, sin cambiar su lógica | RF-4, RF-7, RF-19 |
| `src/js/pointer.js` | crear | Entradas (puntero, toque, teclas, salida, `blur`, foco, menú, fin de la entrada del CTA, `matchMedia`); hook de lectura y escritura del punto y de los imanes; clases `is-out` e `is-relink` | RF-1–RF-13, RF-16, RF-21, RF-22 |
| `src/js/menu.js` | modificar | `document.dispatchEvent(new Event('menuchange'))` al abrir o cerrar, sin otro cambio | RF-3, RF-5, RF-7, RF-9 |
| `src/main.js` | modificar | Importar `micro.css`; llamar siempre a `initPointer()`, también con movimiento reducido; añadir `fx` a `html` al final | RF-13, RF-17, casos límite |
| `src/styles/base.css` | modificar | `.btn:hover`, `.btn--light:hover`, `.btn--blue:hover` y `.link:hover` dentro de `@media (hover: hover)` y con `html:not(.fx)`; `:focus-visible` igual que hoy | RF-16, RF-17, RF-20 |
| `src/styles/nav.css` | modificar | `.nav__cta:hover` (con `html:not(.fx)`) y `.menu__link:hover` dentro de `@media (hover: hover)` | RF-10, RF-16, RF-20 |
| `src/styles/sections.css` | modificar | `.service:hover` en `@media (hover: hover)` y con `html:not(.is-touch)`; `.footer__nav a:hover` con `html:not(.fx)` | RF-15, RF-16, RF-21 |
| `src/styles/micro.css` | crear | `@property --sa/--sb`, barrido, subrayados, `relink`, foco (RF-12), imán, punto, colores forzados e impresión | RF-1–RF-3, RF-5, RF-7, RF-9–RF-13, RF-18, RF-22 |
| `src/partials/sections/hero.html`, `contact.html` | modificar | Atributo `data-magnet` en los dos botones de WhatsApp (sin elementos nuevos) | RF-7 |
| `tests/unit/pointer.test.js`, `contrast.test.js` | crear | `node --test` de `src/lib/` | ver tabla |
| `tests/e2e/support/pointer.js` | crear | Ayudas de e2e de la 002 (no es `*.spec.js`) | — |
| `tests/e2e/fixtures/spec002-base.json` | crear (T1) | Datos de la base `0f6b12d`: CLS, orden de tabulación, huellas de estilos y hovers sin JS | RF-17, RF-19, RF-20, RNF |
| `tests/e2e/spec002-base.spec.js` | crear (T1) | Comparaciones con la base | RF-17, RF-19, RF-20, RNF CLS |
| `tests/e2e/frame.spec.js` | crear (T4) | Un solo listener de scroll, `html.fx` y `menuchange` | RF-4, RF-17, RF-19 |
| `tests/e2e/cursor.spec.js` | crear (T5) | Punto | RF-1–RF-6, RF-14 |
| `tests/e2e/magnet.spec.js` | crear (T6) | Imán | RF-7–RF-9, RF-19 |
| `tests/e2e/hovers.spec.js` | crear (T7) | Hovers con dirección, foco y reducido | RF-10–RF-15 |
| `tests/e2e/touch.spec.js` | crear (T3) · ampliar (T8) | Táctil, 844×390, ventana estrecha con ratón, híbrido | RF-15, RF-16, RF-20, RF-21 |
| `tests/e2e/spec002-states.spec.js` | crear (T8) | Sin JS, módulo bloqueado, impresión, colores forzados, cambio de preferencia | RF-17, RF-18, RF-22 |
| `tests/e2e/spec002-rnf.spec.js` | crear (T9) | Tareas largas, axe, zoom, scroll horizontal, sin secuestro, nada infinito, capturas | RF-19, RNF |
| `specs/002-microinteracciones/verificaciones.md` | crear (T10) | Verificaciones documentadas, a mano o por emulación | RF-11, RF-21, casos límite |

No se tocan: `index.html`, `vite.config.js`, `src/config/site.js`, `hero.js` (la inclinación sigue igual),
`nav-tone.js`, `whatsapp.js`, `reveal.js`, `motion.css`, `hero.css`, `devices.css`, las pantallas, los tests de
las specs 000 y 001 (`landing`, `hero-exit`, `curtains`, `reveal`, `load-states`, `spec001-rnf`, `support/motion.js`)
ni `.claude/skills/`. Sin dependencias nuevas.

## Funciones puras (`src/lib/pointer.js`)
Las coordenadas son del viewport, en px. Una caja es `{ left, top, right, bottom, width, height }`.
```
MAGNET = { reach: 24, release: 32, edge: 5, max: 8 }   // px; edge = desplazamiento en el borde (≥ 3)

clamp(v, lo, hi) = min(max(v, lo), hi)

boxDistance(px, py, box):                         // 0 dentro o en el borde
  dx = max(box.left - px, 0, px - box.right); dy = max(box.top - py, 0, py - box.bottom)
  devolver hypot(dx, dy)

magnetOffset(px, py, box, { reach, edge, max } = MAGNET):
  hw = box.width / 2; hh = box.height / 2
  si hw <= 0 o hh <= 0: devolver { x: 0, y: 0 }
  cx = box.left + hw; cy = box.top + hh
  qx = clamp(px, box.left, box.right); qy = clamp(py, box.top, box.bottom)   // punto del área más cercano
  d = hypot(px - qx, py - qy)
  si d >= reach: devolver { x: 0, y: 0 }          // a 24 px o más, y entre 24 y 32 (RF-7)
  k = 1 - d / reach                                // 1 en el borde y dentro; 0 a 24 px
  x = edge * (qx - cx) / hw * k; y = edge * (qy - cy) / hh * k
  m = hypot(x, y); si m > max: x, y *= max / m     // nunca más de 8 px
  devolver { x, y }
// Con el puntero en el borde, |(qx − cx)/hw| o |(qy − cy)/hh| vale 1, así que el desplazamiento es ≥ 5 px; en
// la esquina, 5·√2 ≈ 7,07 px. Hacia el centro decrece de forma lineal hasta 0 en el centro exacto. Fuera crece
// de forma lineal desde 0 (a 24 px) hasta el valor del borde: es continuo en el borde y en 24 px. La dirección
// sale del signo de (qx − cx, qy − cy), que es el de (px − cx, py − cy): siempre hacia el puntero.
// Con el puntero dentro, el botón desplazado sigue cubriendo el puntero porque 2·edge < alto (10 < 56).

magnetActive(active, distance, { reach, release } = MAGNET):
  si distance <= reach: devolver true
  si distance > release: devolver false
  devolver active                                  // entre 24 y 32 px conserva el estado (histéresis)

isFullWidth(width, containerWidth, tolerance = 1): devolver |width - containerWidth| <= tolerance   // RF-8

pointerMode({ fine, reduced, forced }):            // fine = (hover: hover) and (pointer: fine), puntero principal
  devolver { dot: fine y no reduced y no forced, magnet: fine y no reduced }   // RF-1, RF-6, RF-16, RF-22

cursorShape({ pressable, heroCta, ctaEntering, menuMoving }):   // decisión de pulsable (RF-3, RF-5)
  devolver pressable y no menuMoving y no (heroCta y ctaEntering) ? 'ring' : 'disc'

magnetAllowed({ magnet, present, menuOpen, menuMoving, focused, entering, fullWidth }):   // RF-7–RF-9, RF-21
  devolver magnet y present y no menuOpen y no menuMoving y no focused y no entering y no fullWidth
  // present = puntero dentro de la ventana y último dato de entrada no táctil

MODIFIERS = { 'Control', 'Shift', 'Alt', 'AltGraph', 'Meta' }
isModifierKey(key): devolver MODIFIERS contiene key   // RF-6 (AltGraph = Alt derecho; Cmd llega como Meta)

parseTranslate(value):                             // valor calculado de `translate`
  si value es 'none' o vacío: devolver { x: 0, y: 0 }
  [x, y = 0] = value.split(' ').map(parseFloat); devolver { x: x || 0, y: y || 0 }
```

### `src/lib/contrast.js` (solo tests; 0 B en el bundle)
```
parseColor('rgb(…)' | 'rgba(…)' | '#rrggbb') → [r, g, b] (0–255)
luminance([r, g, b]) → WCAG 2.x (canal/255; ≤ 0,04045 ? /12,92 : ((c + 0,055)/1,055)^2,4)
contrastRatio(a, b) = (max(La, Lb) + 0,05) / (min(La, Lb) + 0,05)
bestOf(colors, bg) = max(contrastRatio(c, bg) para c en colors)   // «al menos uno de los dos tonos» (RF-2)
```

## Planificador de fotogramas (`src/js/scroll-fx.js`)
```
hooks = []; frame = 0
schedule(): si no frame: frame = requestAnimationFrame(run)
all(): para h en hooks: h.due = true; schedule()           // scroll y resize despiertan a todos
run():
  frame = 0; due = hooks.filter(h => h.due); para h en due: h.due = false
  para h en due: h.read?.()                                  // 1.º todas las lecturas
  para h en due: h.write?.()                                 // 2.º todas las escrituras
export addFrameHook(hook):
  si hooks está vacío: addEventListener('scroll', all, { passive: true }); addEventListener('resize', all)
  hooks.push(hook)
  devolver () => { hook.due = true; schedule() }             // pide un fotograma solo para ese hook

initScrollFx(ready):          // la lógica de la 001 queda igual
  … mismas variables …
  request = addFrameHook({ write: update })   // update() lee y luego escribe, como hoy; ya no gestiona `frame`
  // Desaparecen sus addEventListener('scroll'/'resize') y la variable frame. IntersectionObserver, load,
  // ready y settleTimer siguen llamando a request().
```
- El hook de la 001 se registra como `write`: su `update()` empieza leyendo después de `pointer.read` (sin
  escrituras en medio, así que el layout está limpio) y escribe antes que `pointer.write`. No se mezclan
  lecturas y escrituras.
- Un movimiento del puntero no despierta a `update()`: la 001 no paga nada por el puntero.
- Con movimiento reducido al cargar no se llama a `initScrollFx`. El primer hook es entonces el del puntero:
  instala el único listener de scroll y su lectura termina en seguida mientras el movimiento no esté permitido.

## Módulo del puntero (`src/js/pointer.js`)
```
initPointer():
  fine = mm('(hover: hover) and (pointer: fine)'); reduce = mm('(prefers-reduced-motion: reduce)')
  forced = mm('(forced-colors: active)'); actions = '.hero__actions'; menu = '[data-menu]'
  magnets = [data-magnet] → { el, hero: el.closest('.hero') != null, active: false, x: '', y: '' }
  px = py = 0; inside = false; moved = false; touch = false; menuMoving = false; gen = 0
  dot = null; off = true; next = null
  request = addFrameHook({ read, write })

  // Entradas: solo guardan el dato y piden fotograma (sin lecturas de layout)
  window pointermove (captura, pasivo): si e.pointerType == 'touch': onTouch(); salir
      px, py = e.clientX, e.clientY; inside = moved = true
      si touch: touch = false; quitar html.is-touch
      request()
  window pointerdown (captura, pasivo): si e.pointerType == 'touch': onTouch()
  onTouch(): si no fine.matches: salir             // sin puntero fino no hay nada que apagar (RF-20)
      touch = true; moved = false; poner html.is-touch; request()                       // RF-6, RF-21
  window keydown: si no isModifierKey(e.key): moved = false; request()                   // RF-6
  document mouseout: si no e.relatedTarget: inside = false; request()                    // salir de la ventana
  window blur: inside = false; request()                                                 // pérdida de foco
  document focusin / focusout: request()                                                  // RF-9, RF-12
  actions animationend: request()                                  // fin de la entrada del CTA (RF-3, RF-7)
  document menuchange: menuMoving = true; g = ++gen; request()
      anims = menu.getAnimations({ subtree: true }).filter(a => a.transitionProperty != 'color')
      Promise.allSettled(anims.map(a => a.finished)).then(() => si g == gen: menuMoving = false; request())
  fine, reduce, forced: 'change' → request()                       // cambio de preferencia (≤ 200 ms)
  initSweeps()

  read():
    mode = pointerMode({ fine: fine.matches, reduced: reduce.matches, forced: forced.matches })
    present = inside y no touch
    hit = present ? document.elementFromPoint(px, py) : null      // el punto no cuenta (pointer-events: none)
    pressable = hit?.closest('a[href], button')
    heroCta = pressable?.closest('.hero__actions') != null
    entering = no html.is-ready o actions.getAnimations().some(a => a.playState != 'finished')
    menuOpen = html.menu-open
    next.dot = mode.dot y present y moved
    next.shape = cursorShape({ pressable: !!pressable, heroCta, ctaEntering: entering, menuMoving })
    para cada m en magnets:
      si no (mode.magnet y present): m.active = false; m.to = 0, 0; continuar            // sin lecturas
      r = m.el.getBoundingClientRect(); t = parseTranslate(getComputedStyle(m.el).translate)
      box = r desplazada −t                                        // área de reposo (valor animado actual)
      ok = magnetAllowed({ magnet: true, present: true, menuOpen, menuMoving,
                           focused: m.el.matches(':focus-visible'), entering: m.hero y entering,
                           fullWidth: isFullWidth(r.width, m.el.parentElement.clientWidth) })
      m.active = ok y magnetActive(m.active, boxDistance(px, py, box))
      m.to = m.active ? magnetOffset(px, py, box) : { x: 0, y: 0 }

  write():
    si no pointerMode(...).dot y dot: dot.remove(); dot = null; off = true          // «no existirá»
    si next.dot y no dot: dot = <div class="cursor is-off" aria-hidden="true"><i></i><i></i></div>; añadir a body
    si dot:
      dot.style.transform = translate3d(px, py, 0); dot.classList.toggle('is-ring', next.shape == 'ring')
      si no next.dot: añadir is-off; off = true
      si no, si off: off = false; request()   // colocado con is-off (sin transición); se muestra en el siguiente
      si no: quitar is-off
    para cada m: escribir --mgx / --mgy (px con 2 decimales) solo si cambian
```
- **Coste**: cada entrada solo copia datos y pide el fotograma. Por fotograma hay un `elementFromPoint`, como
  mucho 2 `getBoundingClientRect` y 2 `getComputedStyle` (con el estilo ya limpio en la fase de lectura) y de 1 a
  5 escrituras de estilo. No hay bucles propios: el movimiento lo hacen las transiciones CSS, que se paran
  solas. El listener de `pointermove` va en captura sobre `window`: se ejecuta antes que el de la inclinación del
  hero, así que nuestro fotograma lee antes de que `hero.js` escriba `--mx/--my`.
- **Punto quieto**: si ni el puntero ni el scroll cambian, no hay fotogramas y las transiciones terminan (RF-1).
- **Entrada del CTA**: antes de `is-ready` los CTA están a opacidad 0, y después dura lo que dure la animación
  `fade-in` de `.hero__actions`. Al terminar, `animationend` pide un fotograma y el aro o el imán llegan en
  ≤ 200 ms aunque el puntero no se mueva.
- **Cambio de preferencia o de puntero**: `change` pide un fotograma.
  - Si deja de haber modo, `write()` borra el punto y los imanes vuelven a 0. Además, el CSS de los imanes
    está bajo `prefers-reduced-motion: no-preference`, así que con reducido vuelven al instante.
  - Si se pasa a permitido, el punto aparece en la última posición conocida y el imán recalcula. La
    transición de 160 ms termina dentro de los 200 ms.

### Hovers con dirección (en `pointer.js`)
```
initSweeps():
  para el en '.btn, .nav__cta, .footer__nav a':
    el pointerleave: si e.pointerType != 'touch': el.classList.add('is-out')
    el transitionend / transitioncancel: si e.propertyName == '--sa': el.classList.remove('is-out')
  link = '.hero .link'
  link pointerenter: si e.pointerType != 'touch': link.classList.add('is-relink')   // no se reinicia si ya está
  link animationend: link.classList.remove('is-relink')
```
Ciclo de un subrayado o un barrido (bordes `a = --sa`, `b = --sb`):

| Estado | a | b | Transición |
|---|---|---|---|
| reposo | 0 % | 0 % | ninguna (cambia al instante: estando vacío no se ve) |
| `:hover` (gana a `is-out`) | 0 % | 100 % | sí |
| `.is-out` | 100 % | 100 % | sí |
| `:focus-visible` | 0 % | 100 % | ninguna (RF-12, al instante) |

- **Entrar desde el reposo**: b va de 0 a 100 % y el frente avanza de izquierda a derecha.
- **Salir**: a va hasta 100 % (y b también, si no había llegado): sale por la derecha. Al acabar, `is-out`
  desaparece y el estado vuelve a (0, 0) sin que se vea nada.
- **Salir a mitad de la entrada**, por ejemplo con (0, 60 %): a y b siguen desde donde estaban, sin saltos.
- **Volver a entrar a mitad de la salida**, por ejemplo con (40 %, 100 %): `:hover` gana, a vuelve a 0 desde
  el 40 % y la transición cancelada quita `is-out`.
- **Duraciones**: subrayados 240 ms (≤ 300); botones 340 ms (≤ 400); «Ver proyectos» 420 ms en total (≤ 500).
  Dejan unos 30–60 ms para el retraso del fotograma y de la medida.

## CSS

### Cambios en los archivos de hoy (mismo resultado que hoy en escritorio sin JS)
```
/* base.css — antes: `.btn:hover::before, .btn:focus-visible::before { … }` */
.btn:focus-visible::before { transform: scaleX(1) }            /* foco: igual que hoy, en todos los dispositivos */
.btn--light:focus-visible { --btn-fg: var(--white) }  .btn--blue:focus-visible { --btn-fg: var(--blue) }
@media (hover: hover) {
  html:not(.fx) .btn:hover::before { transform: scaleX(1) }
  html:not(.fx) .btn--light:hover { --btn-fg: var(--white) }  html:not(.fx) .btn--blue:hover { --btn-fg: var(--blue) }
  html:not(.fx) .link:hover::after { transform: scaleX(0) }
}
/* nav.css */
@media (hover: hover) { html:not(.fx) .nav__cta:hover::after { transform: scaleX(1) }  .menu__link:hover { …igual… } }
/* sections.css */
@media (hover: hover) {
  html:not(.is-touch) .service:hover::before { transform: scaleX(1) }
  html:not(.is-touch) .service:hover .service__name { transform: translateX(0.5rem) }
  html:not(.fx) .footer__nav a:hover { color: var(--white) }
}
```

### `src/styles/micro.css` (se importa después de `motion.css`), esquema
```
@property --sa { syntax: '<percentage>'; inherits: true; initial-value: 0% }   /* el ::after hereda el valor animado */
@property --sb { syntax: '<percentage>'; inherits: true; initial-value: 0% }

@media (hover: hover) {                                  /* RF-10, RF-11: solo con hover y con el script (.fx) */
  .fx .btn { --fill: linear-gradient(90deg, #0000 var(--sa), var(--btn-fill) 0 var(--sb), #0000 0);
             background-image: var(--fill); overflow: visible;
             transition: color .4s var(--ease-out), translate .16s var(--ease-out) }
  .fx .btn::before { content: none }                     /* el relleno de hoy no se usa */
  .fx .btn--light { --hfg: var(--white) }  .fx .btn--blue { --hfg: var(--blue) }
  /* Texto con el mismo frente, solo mientras hay barrido (en reposo y con foco, el color normal) */
  .fx:not(.is-touch) :is(.btn--light, .btn--blue):hover, .fx :is(.btn--light, .btn--blue).is-out {
    color: #0000;
    background-image: linear-gradient(90deg, var(--btn-fg) var(--sa), var(--hfg) 0 var(--sb), var(--btn-fg) 0), var(--fill);
    -webkit-background-clip: text, padding-box; background-clip: text, padding-box }
  .fx:not(.is-touch) :is(.btn, .nav__cta, .footer__nav a):hover { --sa: 0%; --sb: 100% }
  .fx :is(.btn, .nav__cta, .footer__nav a).is-out { --sa: 100%; --sb: 100% }
  .fx .btn:is(:hover, .is-out) { transition: color .4s var(--ease-out), translate .16s var(--ease-out),
                                             --sa .34s var(--ease-out), --sb .34s var(--ease-out) }
  .fx :is(.nav__cta, .footer__nav a):is(:hover, .is-out) { transition: color .3s ease, --sa .24s var(--ease-out), --sb .24s var(--ease-out) }
  .fx .nav__cta::after, .fx .footer__nav a::after { transform: none; transition: none;
                                                    clip-path: inset(0 calc(100% - var(--sb)) 0 var(--sa)) }
  .fx .footer__nav a { position: relative }
  .fx .footer__nav a::after { content: ''; position: absolute; left: 0; right: 0; bottom: .6rem; height: 1px; background: currentColor }
  .fx:not(.is-touch) .footer__nav a:hover { color: var(--white) }
  .fx .link.is-relink::after { animation: relink .42s var(--ease-in-out) }
  /* RF-12: foco con teclado, estado final al instante, sin barrido */
  .fx :is(.btn, .nav__cta, .footer__nav a):focus-visible { --sa: 0%; --sb: 100%; transition: translate .16s var(--ease-out) }
  .fx .footer__nav a:focus-visible { color: var(--white) }
  .fx .link:focus-visible::after { animation: none }
}
@keyframes relink {                                       /* sale por la derecha y vuelve por la izquierda */
  0% { clip-path: inset(0) } 45% { clip-path: inset(0 0 0 100%) }
  45.01% { clip-path: inset(0 100% 0 0) } 100% { clip-path: inset(0) } }

@media (hover: none) {               /* RF-12 sin hover (tableta con teclado): el mecanismo de hoy, al instante */
  .fx .btn:focus-visible, .fx .btn:focus-visible::before, .fx .nav__cta:focus-visible::after { transition: none }
  .fx .nav__cta:focus-visible::after { transform: none }
  .fx .footer__nav a:focus-visible { position: relative; color: var(--white); transition: none }
  .fx .footer__nav a:focus-visible::after { content: ''; position: absolute; left: 0; right: 0; bottom: .6rem; height: 1px; background: currentColor }
}

@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {     /* imán (RF-7, RF-9) */
  .fx [data-magnet] { translate: var(--mgx, 0px) var(--mgy, 0px) }
  .fx [data-magnet]::before { content: ''; position: absolute; inset: 0; z-index: -1; background: none;
    transform: none; translate: calc(var(--mgx, 0px) * -1) calc(var(--mgy, 0px) * -1);
    transition: translate .16s var(--ease-out) }          /* área de reposo, siempre pulsable */
}

.cursor { position: fixed; top: 0; left: 0; z-index: 200; pointer-events: none;
          transition: transform .1s var(--ease-out), opacity .12s }
.cursor.is-off { opacity: 0; transition: none }
.cursor i { position: absolute; border-radius: 50%; transition: transform .16s var(--ease-out), opacity .16s }
.cursor i:first-child { width: 8px; height: 8px; margin: -4px; background: #fff; border: 1px solid #000 }      /* disco */
.cursor i:last-child { width: 40px; height: 40px; margin: -20px; border: 1px solid #000;
                       box-shadow: inset 0 0 0 1px #fff; transform: scale(.2); opacity: 0 }                /* aro */
.cursor.is-ring i:first-child { opacity: 0; transition: none }     /* sin relleno desde que se detecta (RF-5) */
.cursor.is-ring i:last-child { transform: none; opacity: 1 }
@media (prefers-reduced-motion: reduce), (forced-colors: active), print { .cursor { display: none } }

@media (forced-colors: active) {                         /* RF-22, con y sin script */
  .btn, .fx .btn, <selectores de barrido de arriba> { border: 1px solid ButtonText; background: ButtonFace;
    color: ButtonText; -webkit-background-clip: border-box; background-clip: border-box }
  .btn::before { background: none }                      /* sin barrido; el ::before del imán sigue existiendo */
  .fx :is(.nav__cta, .footer__nav a, .link)::after { forced-color-adjust: none; background: LinkText;
    transition: none; animation: none }                  /* con script: color del sistema, sin animación */
}
@media print {                                            /* RF-18 */
  .fx .btn, <selectores de barrido> { translate: none; background-image: none; color: var(--btn-fg); transition: none }
  .fx [data-magnet]::before { translate: none }
  .fx :is(.nav__cta, .footer__nav a) { --sa: 0%; --sb: 0%; transition: none }
  .fx .link::after { animation: none }  .btn::before { transform: scaleX(0); transition: none }
}
```
Notas:
- **Orden de pintado del barrido**: el texto (`background-clip: text`) es la capa superior; debajo va la banda
  de relleno y debajo el color de reposo, `background-color`, que se recorta con la última capa (`padding-box`).
  El frente de la banda y el del texto son la misma longitud sobre la misma caja: desfase de 0 px, más 1 px de
  suavizado del corte del degradado.
- **Botón del hero**: el texto no cambia de color, así que no tiene capa de texto y solo se anima la banda.
- **Contraste**: a cada lado del frente están los colores de hoy (reposo y hover). Negro sobre blanco 21:1;
  blanco sobre `#2340ff` ≈ 6,46:1; `#2340ff` sobre blanco ≈ 6,46:1; blanco sobre negro 21:1. Todos ≥ 4,5:1.
- **Colores forzados**: el navegador fuerza colores y anula los degradados. Las reglas fijan los colores del
  sistema de forma explícita, así que el resultado es el mismo aunque la emulación de Chromium no aplicara la
  paleta. El borde de 1 px solo existe en ese modo. Los subrayados conservan sus estados (aparecen y
  desaparecen con el hover), pero al instante y en `LinkText`. Sin script, los subrayados son los de hoy
  (RF-17).
- **Especificidad**: las reglas de colores forzados e impresión repiten los selectores de barrido, o usan unos
  de especificidad mayor. No se usa `!important`.

## Interfaz

### Escritorio con ratón (1440×900 de referencia; también 768–1440)
- **Punto**: disco blanco de 8 px con borde negro de 1 px. Sobre enlaces y botones, aro de 40 px (1 px negro
  por fuera y 1 px blanco por dentro), sin relleno. Va por encima de todo (`z-index: 200`, también del menú y
  del enlace de salto). El cursor del sistema no cambia.
- **Imán**: el botón de WhatsApp del hero, junto a «Ver proyectos» (separados 32 px), y el de Contacto. Nada
  más se desplaza.
- **Hovers**:
  - «Iniciar proyecto» de la barra: el subrayado entra por la izquierda y sale por la derecha.
  - «Ver proyectos»: el subrayado sale por la derecha y vuelve por la izquierda.
  - Pie: además del color, el subrayado nuevo, de 1 px y en `currentColor`, como el de la barra.
  - Los 3 botones: barrido con el texto sincronizado.
  - Los enlaces del menú, la marca y el enlace de salto quedan como hoy.
- **Filas de servicios**: como hoy, con el cursor normal y el punto en disco.

### Ventana estrecha con ratón (< 768 px, perfil de escritorio)
- Hay punto. Los dos botones ocupan todo el ancho (`width: 100%` de hoy), así que `isFullWidth` apaga el imán
  (RF-8).

### Móvil y tableta táctil (Pixel 7, 412×839; 844×390 con emulación táctil)
- Todo igual que hoy, con dos diferencias permitidas:
  - el hover ya no queda pegado tras un toque (`@media (hover: hover)`);
  - el foco con teclado muestra el estado final al instante (RF-12).
- No se crea el `div.cursor` ni se escribe `--mgx`; `html` lleva `fx`, pero nunca `is-touch`.
- 844×390 es táctil sin puntero fino: lo mismo que el móvil, aunque mida más de 768 px.

### Otros perfiles
- **Tableta con teclado**: RF-12 con el mecanismo de hoy, sin transición (`@media (hover: none)`).
- **Puntero grueso con hover** (algunos televisores): reciben los hovers nuevos, sin punto ni imán.
- **Zoom al 200 % y al 400 %**: equivale a una ventana CSS de 720 y 360 px de ancho; el punto y el aro miden
  lo mismo en px CSS.

## Movimiento (skill `motion-rules`)
- **Propiedades animadas**:
  - `transform` y `opacity`: punto y aro;
  - `translate`: imán (es una transformación, ver P2);
  - `clip-path`: subrayados, mediante `--sa/--sb` o la animación `relink`;
  - color del texto y del fondo como respuesta a una acción: el barrido (P1) y el color del pie de hoy.
  Nada de `top`, `width`, `height` ni `filter`. Ningún `will-change`.
- **Estados por defecto**: son los de reposo. Sin `.fx` (sin JS, script fallido o antes de ejecutarse) se
  aplican las reglas de hoy; el punto no existe y `translate` vale `none`.
- **Movimiento reducido**: no hay punto ni imán; el CSS del imán está bajo `no-preference`. Los hovers se
  aplican al instante por la regla global de `base.css` (`transition-duration: .01ms`), como pide RF-13.
- **Scroll**: un solo listener y un solo `requestAnimationFrame`, en `scroll-fx.js`; no se añade ningún
  listener de scroll; lecturas antes que escrituras. No se toca la skill.
- **Nada infinito**: no hay bucles; las transiciones duran 100–420 ms y empiezan solo tras una acción.
- **Móvil**: no hay movimiento nuevo (sin hover). Las duraciones de escritorio ya son microinteracciones cortas.
- **Curvas**: `--ease-out` en el punto, el imán y los barridos; `--ease-in-out` en `relink`, que es un ida y
  vuelta.
- **Checklist** (se rellena en T10):
  - todo visible con reducido y sin animaciones en curso;
  - todo visible sin JS;
  - ninguna propiedad animada fuera de la lista;
  - nada infinito;
  - el imán deja todo el contenido y su foco dentro del plano de la cortina (8 px ≤ padding − 8 px, ver
    riesgos);
  - presupuesto.

## Pantallas (skill `mockup-screens`)
- No se toca ningún dispositivo ni pantalla. El punto va en `body`, fuera de las capas con dispositivos, sin
  `will-change` y sin `cqw`.
- Sobre los mockups el punto es un disco: la escena del hero tiene `pointer-events: none` y los escenarios no
  son pulsables. La inclinación del hero sigue igual (RF-14).
- RF-2 lee los colores calculados de cada `.scr` (hero y proyectos): fondo de la pantalla, el color más claro
  y el más oscuro, de fondo o de texto, entre todos sus descendientes visibles.

## Decisiones (con la alternativa descartada)
1. **Planificador único con hooks en `scroll-fx.js`**. Descartadas:
   - Un `requestAnimationFrame` propio para el puntero más una llamada desde `update()`: dos rAF en el mismo
     fotograma mezclan lecturas y escrituras, y `update()` no existe si la página carga con movimiento reducido
     (RF-4 y RF-7 fallarían tras pasar a permitido).
   - Un listener de scroll en `pointer.js`: lo prohíben la skill y la decisión del usuario.
2. **Seguimiento con una transición CSS de 100 ms** en lugar de una interpolación en JS. Menos JS, sin bucle que
   parar y sin coste en el hilo principal. El alcance cabe en 150 ms: hasta 33 ms de fotograma más 100 ms.
3. **Imán con la propiedad `translate` y una transición de 160 ms**. Descartadas:
   - `transform` con variables: animaría también el `translateY(1px)` de `:active`, que hoy es instantáneo.
   - Un muelle en JS: puede sobrepasar el destino y cuesta más JS.
   La curva `--ease-out` (0,16, 1, 0,3, 1) no tiene puntos de control por encima de 1, así que no sobrepasa el
   destino, tampoco al cambiar de destino a mitad.
4. **`::before` contratrasladado como área de reposo pulsable**. Descartado dejar la franja del área de reposo
   que el botón destapa al moverse: tras un barrido rápido de un borde al otro, un clic en esa franja durante la
   transición caería fuera del botón (RF-9). Las dos transiciones empiezan en el mismo cambio de estilo, con la
   misma duración y la misma curva, y se anulan en todo momento. El área pulsable es la unión del reposo y de la
   posición desplazada, y esa unión siempre se ve como el botón.
5. **Área de reposo = caja actual − `translate` calculado**. Descartados:
   - `offsetLeft/Top`: redondea a enteros y la tolerancia es de 1 px.
   - Una caché: se invalida con las fuentes, con el aviso de WhatsApp pendiente y con el redimensionado.
6. **Barrido en capas de fondo con `background-clip: text`, movido por `--sa/--sb` registradas** (P1).
   Descartados:
   - Una copia del texto en un pseudo-elemento recortado: duplica el texto y, al traducir la página, la copia
     se queda en español.
   - `mix-blend-mode`: ningún modo de fusión reproduce a la vez los dos pares de colores de hoy.
   - Que el color del texto cambie con una transición normal: el texto quedaría sobre un fondo de su mismo tono
     (incumple RF-11).
7. **Modelo de dos bordes con `is-out`**. Descartado cambiar `transform-origin` al salir: salta si el puntero
   sale a mitad de la entrada.
8. **Hovers de hoy dentro de `@media (hover: hover)`** en lugar de quitarlos desde JS tras un toque. Así
   funciona también sin script (RF-16, RF-17, RF-20) y no cuesta JS.
9. **`html.fx` puesto por `main.js`**. Descartado `html.js`: el script en línea lo pone aunque el módulo falle
   (RF-17).
10. **Fin de la transición del menú con `getAnimations({ subtree: true })` del menú**, tras el evento
    `menuchange` y sin contar las transiciones de `color` (hover de sus enlaces). Descartados:
    - Temporizadores fijos: la apertura dura 1,29 s y el cierre 0,8 s, y los temporizadores quedarían atados al
      CSS.
    - Un `MutationObserver` sobre `aria-expanded`: más código para el mismo dato.
11. **Fin de la entrada del CTA con `is-ready` y `getAnimations()` de `.hero__actions`**, más `animationend`.
    Descartado un temporizador de 1,5 s: no sigue a la red de seguridad de 2,5 s ni a un cambio de preferencia.
12. **Estado del punto con `elementFromPoint`** en lugar de `event.target`: con scroll y el puntero quieto no
    llega ningún evento de puntero (RF-4).
13. **Dos mecanismos de foco**: el nuevo, en dispositivos con hover, y el de hoy sin transición, en los que no
    lo tienen. Descartado un único mecanismo nuevo en todos: en táctil cambiaría estilos en reposo (RF-20 pide
    «exactamente como hoy»).
14. **Borde del imán de 5 px**, con 7,07 px en la esquina. Descartados:
    - 3 px: es el mínimo y apenas se nota.
    - 6 px: daría 8,49 px en la esquina y obligaría a recortar.
15. **AltGraph cuenta como Alt** en las teclas modificadoras: es la tecla Alt derecha en los teclados
    internacionales.
16. **RF-20 se verifica con una huella de estilos calculados de la base**, no con capturas: en las capturas
    headless del Pixel 7 los mockups salen pixelados y la comparación de píxeles no sería estable (MEMORY.md).
17. **`contrast.js` en `src/lib/`** con test unitario. No lo importa la página, así que no pesa, igual que
    `budget.js`.

## Riesgos técnicos y cómo se mitigan
1. **Barrido con el texto sincronizado sin duplicar el texto.**
   - Riesgo: que Chromium no admita un recorte `text` distinto por capa.
   - Mitigación: T7 empieza por un test de píxeles en reposo, en hover y a mitad (transiciones pausadas) que lo
     comprueba antes de seguir. Si falla, se para y se informa, sin buscar otra técnica por nuestra cuenta.
   - Riesgo: el texto transparente durante la búsqueda en la página o al seleccionar.
   - Mitigación: solo es transparente mientras hay barrido (`:hover` o `is-out`); en reposo y con foco el color
     es el normal. La traducción y la selección se verifican a mano.
2. **Imán y cortinas (001/RF-9).** El desplazamiento máximo es de 8 px y cada franja del marco mide como mucho
   padding − 8 px, así que el botón desplazado sigue dentro del plano descubierto. El test fuerza ±8 px en los
   dos ejes y repite la medida de la 001 a c = 0; 0,5; 1. Con foco no hay imán, así que el anillo de foco
   (6 px) no cambia (001/RF-21).
3. **Imán y CTA del hero (001/RF-5).** `translate` no cambia el orden de apilado: el texto sigue en
   `z-index: 2`, por encima de la escena. En el centro el desplazamiento es 0 y el área pulsable es la unión.
   El test fuerza ±8 px y comprueba `elementFromPoint` en el centro y el clic.
4. **`:hover` pegado en táctil sin JS.** Todas las reglas de hover pasan a `@media (hover: hover)`. Hay tests
   de toque con y sin JS en el Pixel 7 y a 844×390, y la huella de estilos en reposo debe ser igual a la base.
5. **Colores forzados.** El navegador anula los degradados y fuerza los colores.
   - Las reglas son explícitas: botón del sistema con borde, `::before` sin fondo y subrayados con
     `forced-color-adjust: none`, porque si no el navegador pinta el fondo de 1 px en `Canvas` y desaparecen.
   - El punto queda oculto por CSS y por JS.
   - Si la emulación de Playwright solo cambiara la media query, el test sigue siendo válido porque comprueba
     los valores explícitos.
6. **Coste de `pointermove`, sin tareas de más de 50 ms.**
   - El listener es pasivo, en captura, y no lee el layout.
   - Hay un solo fotograma por refresco, con lecturas antes que escrituras; las animaciones son transiciones
     CSS.
   - T9 mide las `longtask` en el recorrido del puntero.
7. **Refactorización de `scroll-fx.js` (RF-19).** No cambia la lógica de `update()`. T4 cuenta los listeners de
   scroll (exactamente 1, con y sin movimiento reducido) y ejecuta todos los e2e de la 001.
8. **Tests de las specs 000 y 001 con el ratón.** Ahora hay punto y transiciones nuevas.
   - `elementFromPoint` ignora el punto (`pointer-events: none`).
   - `animationsDone()` espera a transiciones cortas y que terminan solas.
   - Sus capturas no afirman nada.
   - No se modifica ninguno de esos archivos.
9. **Detectar el fin de la transición del menú.** Se usa `allSettled`, porque al cancelarse una transición su
   promesa se rechaza, y un contador de generación descarta los cierres que llegan tarde. El test calcula el fin
   por su cuenta.
10. **Margen de JS estrecho** (estimado ≈ 1.290 de 1.536 B). Se mide el peso al cerrar T4–T8. Si la
    proyección pasa del margen, se para y se pregunta; no se recortan requisitos por nuestra cuenta.
11. **Límites de la emulación**: híbrido, cambio de puntero, salida real de la ventana. Se intenta con CDP
    (`Emulation.setEmulatedMedia` con `pointer`/`hover`, y `hasTouch`) y con un `mouseout` sintético sin
    `relatedTarget`. Si `matchMedia` no refleja el cambio, el test se marca `skip` con su motivo y queda como
    verificación documentada.
12. **Tiempos con la máquina cargada.** Se mide dentro de la página con `performance.now()`, desde el evento
    hasta el fotograma en que se cumple el estado. Las duraciones dejan 30–60 ms de margen y no se fuerzan más
    workers (MEMORY.md).
13. **CLS de la base variable entre ejecuciones** (fuentes). La base es el máximo de 3 ejecuciones del
    recorrido; el test compara con ≤ base + 1e-6.

## Impacto en el peso (estimado, gzip)

| Pieza | JS | CSS |
|---|---|---|
| `src/lib/pointer.js` (9 funciones + `MAGNET`) | ≈ 330 B | — |
| `src/js/pointer.js`: entradas, punto, imanes, menú y CTA | ≈ 700 B | — |
| `src/js/pointer.js`: `initSweeps` | ≈ 120 B | — |
| `scroll-fx.js` (planificador; parte del código se traslada) | ≈ +90 B | — |
| `menu.js` + `main.js` | ≈ +50 B | — |
| Hovers de hoy en `@media (hover: hover)` | — | ≈ +90 B |
| `@property`, barrido, estados, subrayados, `relink`, foco (hover y sin hover) | — | ≈ 650 B |
| Imán | — | ≈ 120 B |
| Punto | — | ≈ 230 B |
| Colores forzados | — | ≈ 180 B |
| Impresión | — | ≈ 110 B |
| **Total estimado** | **≈ 1.290 B de 1.536 B (16 % de margen)** | **≈ 1.380 B de 2.048 B (33 % de margen)** |

Cabe, pero con poco margen en JS. Para no perderlo: funciones puras compactas, ninguna cadena de texto en el
bundle salvo los selectores, la creación del punto con `innerHTML` de una sola cadena y la medida del peso al
cerrar T4–T8. `contrast.js` no entra en el bundle.

**`scripts/check-budget.mjs`** (T1): `SPEC = '002'`, `BASE = { js: 3965, css: 10731 }` (con el comentario
«spec 002, build limpio de 0f6b12d») y `ALLOWANCE = { js: 1536, css: 2048 }`. El resto no cambia: se mantienen
`--allowance-js/css`, la salida y `budgetCheck()`. Ejemplo:
`OK  JS 5.2 KB gzip (5301 B; límite 15 KB) · +1336 B sobre la base (máx. +1536 B, spec 002)`.

## Estrategia de tests

### Unitarios (`node --test`, `tests/unit/`)
| Test | Cubre |
|---|---|
| `pointer.test.js` · `boxDistance`: dentro y en el borde 0; fuera en un eje; en diagonal (hypot) | RF-7 |
| `pointer.test.js` · `magnetOffset`: 0 a ≥ 24 px (24 exacto incluido) y entre 24 y 32; creciente de 24 al borde en 8 direcciones; ≥ 3 px (= 5) en todo el perímetro; decreciente del borde al centro; 0 en el centro exacto; ≤ 8 px en una rejilla de 1 px hasta 40 px fuera; ningún salto > 0,5 px entre puntos vecinos a 1 px; producto escalar con (puntero − centro) ≥ 0; el puntero queda dentro del botón desplazado; caja degenerada → 0 | RF-7, RF-9 |
| `pointer.test.js` · `magnetActive`: tabla (inactivo a 28 → no; activo a 28 → sí; a 32 → sí; a 32,01 → no; a 24 → sí) | RF-7 (umbral de 32 px) |
| `pointer.test.js` · `isFullWidth` (±1 px, 1,01 px → no) | RF-8 |
| `pointer.test.js` · `pointerMode` (tabla de verdad de 8 casos) | RF-1, RF-6, RF-16, RF-22 |
| `pointer.test.js` · `cursorShape` (pulsable o no, CTA en entrada, menú en transición) | RF-3, RF-5 |
| `pointer.test.js` · `magnetAllowed` (cada condición lo apaga por separado) | RF-7, RF-9, RF-21 |
| `pointer.test.js` · `isModifierKey`: Control, Shift, Alt, AltGraph y Meta sí; `a`, Tab, Enter, Escape, espacio, flechas y CapsLock no | RF-6 |
| `pointer.test.js` · `parseTranslate`: `none`, `''`, `5px`, `5px 3px`, `-2.5px 0px` | RF-7 |
| `contrast.test.js` · blanco/negro 21; blanco/`#2340ff` 6,46 ± 0,01; igual 1; simetría; `rgb()`, `rgba()` y hex; `bestOf` | RF-2, RF-11 |
| `budget.test.js` (sin cambios) | RNF peso |

### Datos de la base (T1, `tests/e2e/fixtures/spec002-base.json`)
Se generan con `SPEC002_BASE=write npx playwright test tests/e2e/spec002-base.spec.js` sobre el build de
`0f6b12d`, dos veces, comparando los resultados para descartar valores que no se repitan.
- Si alguna propiedad no se repite entre las dos ejecuciones, se excluye con un comentario.
- **No se vuelven a generar después de T1.**
- Sin esa variable, el mismo archivo compara.

Contenido:
- **CLS del recorrido** de la spec, en `escritorio` y `movil`: máximo de 3 ejecuciones, contando todas las
  entradas, también las de `hadRecentInput`.
  - Recorrido en el orden del documento, con el menú cerrado.
  - El enlace de salto se enfoca con Tab.
  - Cada pulsable fuera del menú se lleva a la vista con `scrollIntoView` instantáneo.
  - En escritorio se pasa el puntero, en 5 pasos y con 400 ms de espera, y también por las 5 filas de
    servicios.
  - En móvil se toca cada pulsable; un listener de `click` en captura cancela la navegación y el
    desplazamiento de los enlaces.
  - El botón «Menú» se pulsa o se toca para abrir y otra vez para cerrar, esperando sus animaciones.
- **Orden de tabulación**: lista de los enfocables visitados con Tab desde el principio, con su etiqueta y su
  selector, en `escritorio` y `movil`.
- **Huella de estilos en reposo**: para cada elemento y sus `::before` y `::after`, un hash FNV de todas las
  propiedades calculadas estándar (sin las que empiezan por `--`), indexado por la ruta del elemento.
  - Se toma en `movil` y a 844×390 táctil, con y sin JS, con la entrada del hero terminada y la página en y = 0.
  - Se toma también en `escritorio` sin JS.
- **Hovers sin JS en escritorio**: estilo calculado de los 3 botones, «Iniciar proyecto», «Ver proyectos», un
  enlace del pie y una fila de servicios, con sus pseudo-elementos y `transition-*`. Se mide con el puntero
  encima, tras 1 s.
- **`cursor` calculado** de `html`, `body`, un enlace, un botón y una fila de servicios.

### Interfaz (Playwright)
Ayudas en `tests/e2e/support/pointer.js`:
- `openFx(page)`: el `open()` de la 001, más esperar a `heroEntranceDone` y a `html.fx`.
- `dotState(page)`: existencia, visibilidad, centro, cajas del disco y del aro, `is-ring`, opacidades y fondo
  del aro.
- `untilFrame(page, fn, ms)`: devuelve el tiempo, medido en la página desde un instante registrado, hasta el
  primer fotograma en que se cumple `fn`.
- `recordFrames(page, fn, ms)`: muestra por fotograma.
- `restBox(page, sel)`: caja menos `translate`.
- `translateOf(page, sel)`.
- `noFollow(page)`: cancela la navegación de los enlaces.
- `pausedAt(page, sel, fraction)`: pausa las transiciones de `--sa/--sb` y fija su `currentTime`.
- `pixelColumns(page, clip)`: análisis por canvas dentro de la página, como `pixelBand` de la 001.
- `styleFingerprint(page)`, `tabOrder(page)` y `clsRoute(page, perfil)`.
- `cdpMedia(page, features)`.

Proyectos: `escritorio` (1440×900) y `movil` (Pixel 7, 412×839, táctil). Además, desde `escritorio`, con
`test.use`:
- `{ viewport: 844×390, isMobile: true, hasTouch: true }` («844×390 táctil»);
- `{ viewport: 390×844 }` y `{ viewport: 700×900 }` («ventana estrecha con ratón»);
- 1024×768.

Cada test que use una ventana sin puntero fino empieza comprobando que
`matchMedia('(hover: hover) and (pointer: fine)')` es falso (y al revés en las de ratón).

| Archivo · test | Ventanas | Cubre |
|---|---|---|
| `spec002-base` · huella en reposo = base (con y sin JS) | movil, 844×390 táctil | RF-20, RF-16 |
| `spec002-base` · sin JS: hovers (estados y transiciones) = base; `cursor` calculado = base | escritorio | RF-17, RF-5 |
| `spec002-base` · orden de tabulación = base; ningún enfocable nuevo (también con el punto visible) | escritorio, movil | RF-19, RF-5 |
| `spec002-base` · CLS del recorrido ≤ base | escritorio, movil | RNF estabilidad |
| `frame` · exactamente 1 listener de `scroll` en `window` (contado con `addInitScript`), con y sin movimiento reducido | escritorio, movil | RF-4, RF-19 |
| `frame` · `html.fx` con el script; sin JS y con el módulo bloqueado (`route.abort`), sin `fx` | escritorio | RF-17 |
| `frame` · `menuchange` al abrir y al cerrar (Escape, enlace, botón) | escritorio | RF-3, RF-9 |
| `touch` · tocar cada enlace y botón y cada fila: sin hover nuevo durante y después (valores de reposo de la base a 0, 100 y 500 ms), un toque activa (hash o menú), sin `.cursor` ni `--mgx` ni `is-touch`; con y sin JS | movil, 844×390 táctil | RF-15, RF-16, RF-20 |
| `touch` · ventana estrecha con ratón: existe el punto; imán apagado con el puntero en el borde (botón a todo el ancho ±1) | 390×844, 700×900 | RF-8, casos límite |
| `cursor` · no hay `.cursor` hasta el primer movimiento; aparece al mover; alcanza (±1 px) en ≤ 150 ms tras detenerse, con 10 trayectorias de 3 velocidades; quieto, sin animaciones del punto a los 200 ms | escritorio, 1024×768 | RF-1 |
| `cursor` · colores: blanco y negro, nunca `#2340ff`; el mejor de los dos tonos ≥ 3:1 sobre blanco, negro, azul y, en cada `.scr`, su fondo, su color más claro y su color más oscuro | escritorio | RF-2 |
| `cursor` · disco 8 ± 1 y aro 40 ± 1, contorno ≤ 2 px, sin relleno; ≤ 200 ms al entrar y al salir en cada tipo de pulsable (barra, CTA, pie, botón Menú, botón y enlaces del menú abierto); disco sobre los mockups del hero, los escenarios, las filas y los textos | escritorio | RF-3, RF-14 |
| `cursor` · entrada del CTA: disco sobre los dos CTA del hero y aro sobre «Iniciar proyecto» de la barra durante la entrada; aro ≤ 200 ms después del fin del fundido | escritorio | RF-3, RF-5 |
| `cursor` · menú en transición: abrir y cerrar con el puntero sobre «Menú»; disco hasta el fin de todas las animaciones del menú (calculado en el test) y aro ≤ 200 ms después; sobre el menú abierto, aro en sus enlaces | escritorio | RF-3, RF-5 |
| `cursor` · scroll con el puntero quieto: un pulsable llega bajo el puntero → aro ≤ 200 ms; se va → disco ≤ 200 ms | escritorio | RF-4 |
| `cursor` · registro por fotograma: desde que hay `is-ring`, el disco tiene opacidad 0 y el aro fondo transparente en todos los fotogramas (fuera de las excepciones); `pointer-events: none`, `aria-hidden`, sin `tabindex`; `ariaSnapshot` del `body` igual con y sin punto; un clic bajo el punto activa el elemento; con el punto sobre el elemento enfocado, el área tapada es menor que la del elemento | escritorio | RF-5 |
| `cursor` · salida de la ventana (`mouse.move` fuera y `mouseout` sintético) → oculto hasta mover; `a`, Tab, Enter, Escape y flechas lo ocultan; Control, Shift, Alt y Meta solas, con clic y con rueda, no | escritorio | RF-6 |
| `cursor` · inclinación del hero: `--mx/--my` = la fórmula de `hero.js` para la posición del puntero, con el punto encima | escritorio | RF-14 |
| `magnet` · perfil medido (≥ 300 ms tras cada movimiento): puntos a 40, 32, 28, 24, 20, 16, 12, 8, 4 y 0 px del área de reposo en 8 direcciones y por dentro hacia el centro; 0 a ≥ 24 (también entre 24 y 32 tras haber estado dentro); creciente; ≥ 3 en el borde; decreciente; 0 ± 0,1 en el centro; ≤ 8; sin saltos > 0,5 px en un barrido de 1 px; hacia el puntero | 1440×900, 1024×768 | RF-7 |
| `magnet` · sin sobrepasar: por fotograma, cada eje es monótono hacia el destino y queda quieto en ≤ 300 ms; scroll con el puntero quieto: nuevo destino en ≤ 200 ms | escritorio | RF-7 |
| `magnet` · sin imán durante la entrada del CTA (hero) y durante la transición del menú; vuelve tras su fin | escritorio | RF-7 |
| `magnet` · no se mueven «Iniciar proyecto», «Menú», el botón del menú, «Ver proyectos» ni `.contact__hint` (cajas ±0,5 px con el imán activo) | escritorio | RF-9 |
| `magnet` · el clic en el área de reposo activa el botón: esquinas a 1 px, bordes y centro; tras barridos rápidos (borde a borde y clic a < 50 ms); con la pulsación (`down`, mover, `up`). Listener en captura con `preventDefault` | escritorio | RF-9 |
| `magnet` · reposo en ≤ 300 ms: foco con Tab con el puntero encima, menú abierto, salida de la ventana, `blur` (y sigue en reposo hasta mover) | escritorio | RF-9 |
| `magnet` · 001/RF-5 y 001/RF-9 con `--mgx/--mgy` forzados a ±8 px: centro del CTA = `elementFromPoint` y el clic navega; cajas de los pulsables dentro del plano a c = 0; 0,5; 1 | escritorio, 1366×600 | RF-19 |
| `hovers` · barra: entra por la izquierda (a = 0 fijo, b crece) ≤ 300 ms y sale por la derecha (b = 100 % fijo, a crece) ≤ 300 ms; pie: igual, más el color de hoy | escritorio | RF-10 |
| `hovers` · «Ver proyectos»: sale por la derecha y vuelve por la izquierda en ≤ 500 ms, termina subrayado; si el puntero sale a 100 ms, completa igual | escritorio | RF-10 |
| `hovers` · interrupciones (subrayado y botón): bordes por fotograma; en la interrupción ningún borde salta más que el mayor paso por fotograma de la misma transición sin interrumpir + 0,05; en la salida a y b no bajan | escritorio | RF-10, RF-11 |
| `hovers` · marca y enlace de salto: estilos calculados iguales antes y durante el hover; enlaces del menú: el hover de color de hoy | escritorio | RF-10 |
| `hovers` · barrido de los 3 botones ≤ 400 ms de izquierda a derecha y retirada hacia la derecha ≤ 400 ms; `textContent`, nombre accesible y nº de nodos iguales antes, durante y después; contraste ≥ 4,5 en reposo y en hover (colores calculados); a mitad (pausado al 40 % y al 70 %), en píxeles a cada lado del frente (±1 px), el texto visible con ≥ 4,5:1 sobre el fondo de su lado; botón del hero con el color de texto sin cambios | escritorio | RF-11 |
| `hovers` · Tab a cada elemento de RF-12: estado final en el mismo fotograma y sin animaciones en curso; indicador de foco de la 000 (2 px, 4 px, color según el tono); sin imán con el puntero encima; marca, salto, «Menú» y enlaces del menú como hoy | escritorio, movil | RF-12 |
| `hovers` · reducido: estados finales al instante (subrayado del pie incluido), sin punto ni imán | escritorio | RF-13 |
| `hovers` · escenarios de proyectos y mockups: sin cambios de caja, `transform`, sombra ni `cursor` al pasar | escritorio | RF-14 |
| `hovers` · filas con ratón: línea `scaleX(1)` y nombre +0,5 rem con los tiempos de hoy, cursor normal, punto en disco, no enfocables | escritorio | RF-15 |
| `touch` (T8) · híbrido: contexto de escritorio con `hasTouch`; si `(pointer: fine)` sigue siendo cierto (o se fuerza con CDP), un toque → ningún hover activo, punto oculto, imán en reposo; mover el ratón → todo vuelve. Si no se puede emular: `skip` y verificación documentada | escritorio | RF-21 |
| `touch` (T8) · cambio del puntero principal (CDP `pointer: coarse`, `hover: none`): ≤ 200 ms sin punto ni `--mgx`; si no se puede emular, `skip` y verificación documentada | escritorio | casos límite |
| `spec002-states` · sin JS y con el módulo bloqueado: sin punto ni imán, CTA con los `href` de la 000 | escritorio, movil | RF-17 |
| `spec002-states` · impresión (`emulateMedia print`) con el imán desplazado, un barrido pausado a la mitad y el punto visible: `.cursor` con `display: none`, `translate: none`, sin imagen de fondo, texto con su color | escritorio | RF-18 |
| `spec002-states` · colores forzados con script: botones con borde ≥ 1 px sólido, colores del sistema (comparados con una sonda `ButtonText/ButtonFace`), sin barrido tras el hover; subrayados en `LinkText` y sin transición ni animación; sin `.cursor`. Sin script: botones igual y subrayados de hoy | escritorio | RF-22 |
| `spec002-states` · cambio de preferencia a mitad de sesión, en los dos sentidos: punto, imán y hovers aplicados en ≤ 200 ms, sin restos (sin `.cursor`, `translate` 0 y `--sa/--sb` finales) | escritorio | casos límite |
| `spec002-rnf` · sin `longtask` > 50 ms durante el recorrido del puntero del RNF | escritorio | RNF estabilidad |
| `spec002-rnf` · axe (A/AA, 2.2) con el punto visible en aro, un barrido en curso, menú cerrado y abierto | escritorio, movil | RF-19 (000/RF-9) |
| `spec002-rnf` · sin scroll horizontal de 320 a 1920 px con el imán forzado a ±8 px y el punto en el borde derecho | escritorio | RF-8, RF-19 (000/RF-8) |
| `spec002-rnf` · zoom (ventanas de 720×450 y 360×225 con ratón): sin scroll horizontal; foco visible y sin tapar al tabular | escritorio | casos límite |
| `spec002-rnf` · sin secuestro: ninguna rueda, tecla ni toque con `defaultPrevented`; `scroll-behavior` y `overflow` del documento como hoy; nada infinito (0 animaciones en curso 500 ms después de parar el puntero) | escritorio, movil | RNF |
| `spec002-rnf` · capturas (no afirman nada) | ver abajo | criterios |
| Tests de las specs 000 y 001, sin cambios y en verde | ambos | RF-19 |
| `npm run budget` | — | RNF peso |

**Capturas** (`test-results/capturas-spec002/{escritorio,movil,844x390,estrecha}/`):
- a 1440 px:
  - enlace en estado final de hover;
  - botón en estado final y a mitad de barrido;
  - punto y aro sobre blanco, negro y azul (botón de Contacto);
  - fila de servicios en hover;
  - reducido, sin JS, impresión y colores forzados;
- en el Pixel 7 y a 844×390: después de tocar un enlace, un botón y una fila;
- en la ventana estrecha con ratón: con el punto.

### Verificaciones documentadas (`specs/002-microinteracciones/verificaciones.md`, T10)
1. **Dispositivo híbrido** (RF-21): portátil táctil real o emulación CDP. Toque, ratón y otra vez toque;
   hovers, punto e imán.
2. **Cambio del puntero principal a mitad de sesión**: conectar o desconectar el ratón en una tableta, o
   emulación CDP de `pointer` y `hover`.
3. **Umbral de retirada de 32 px**: no se observa desde fuera. Lo cubren el test de `magnetActive` y la lectura
   del código (`m.active` solo pasa a falso con `distance > release`).
4. **Traducción** (Chrome, traducir al inglés): el texto de los botones cambia una sola vez y el barrido pinta
   el texto traducido.
5. **Selección de texto** en los botones, en reposo y con hover: un solo texto, legible.
6. **Arrastre de la barra de desplazamiento**: el punto no interfiere y el scroll es el nativo.
7. Opcionales: colores forzados reales (tema de contraste de Windows) y zoom real al 200 % y al 400 %.

## Trazabilidad RF → tarea → test

| RF | Tarea | Test o verificación |
|---|---|---|
| RF-1 | T2, T5 | `pointerMode` · `cursor` (aparición, ≤ 150 ms, quieto) |
| RF-2 | T2, T5 | `contrast.test` · `cursor` (colores y contraste en mockups) |
| RF-3 | T2, T5 | `cursorShape` · `cursor` (tamaños, ≤ 200 ms, excepciones de CTA y menú) |
| RF-4 | T4, T5 | `frame` (un listener) · `cursor` (scroll con el puntero quieto) |
| RF-5 | T5, T8 | `cursor` (sin relleno, accesibilidad, clic, foco) · `spec002-base` (cursor del sistema, tabulación) · `spec002-states` (impresión) · axe en `spec002-rnf` |
| RF-6 | T2, T5 | `isModifierKey`, `pointerMode` · `cursor` (salida, teclas) · `touch` T8 (toque) |
| RF-7 | T2, T6 | `magnetOffset`, `magnetActive` · `magnet` (perfil, sin sobrepasar, scroll, excepciones) · umbral de 32 px documentado |
| RF-8 | T2, T6, T9 | `isFullWidth` · `touch` (ventana estrecha) · `spec002-rnf` (scroll horizontal) |
| RF-9 | T6 | `magnetAllowed` · `magnet` (nada más se mueve, clic en reposo, reposo ≤ 300 ms) |
| RF-10 | T7 | `hovers` (barra, «Ver proyectos», pie, interrupciones, marca, salto, menú) |
| RF-11 | T7 | `hovers` (barrido, contraste en píxeles, nombre accesible) · traducción y selección documentadas |
| RF-12 | T7 | `hovers` (Tab en escritorio y movil) |
| RF-13 | T7, T8 | `hovers` (reducido) · `spec002-states` (cambio de preferencia) |
| RF-14 | T5, T7 | `cursor` (disco sobre mockups, inclinación) · `hovers` (escenarios sin hover) |
| RF-15 | T3, T7 | `touch` (fila estática) · `hovers` (fila con ratón) |
| RF-16 | T3, T5, T6 | `touch` (toques con y sin JS, sin punto ni imán) · `spec002-base` (huella) |
| RF-17 | T1, T3, T4, T8 | `spec002-base` (hovers sin JS = base) · `frame` (`fx`) · `spec002-states` (sin JS, bloqueado) |
| RF-18 | T8 | `spec002-states` (impresión) |
| RF-19 | T1, T4, T6, T9, T10 | tests de 000 y 001 sin cambios · `frame` · `magnet` (001/RF-5, 001/RF-9 a ±8 px) · `spec002-base` (tabulación) · `spec002-rnf` (axe, scroll horizontal) |
| RF-20 | T1, T3, T8 | `spec002-base` (huella en reposo, con y sin JS) · `touch` (toques) |
| RF-21 | T2, T8 | `magnetAllowed` · `touch` (híbrido, si se puede emular) · verificación documentada |
| RF-22 | T2, T8 | `pointerMode` · `spec002-states` (colores forzados, con y sin script) |
| RNF peso | T1, T4–T10 | `npm run budget` (base `0f6b12d`, +1.536/+2.048) |
| RNF estabilidad | T1, T9 | `spec002-base` (CLS ≤ base) · `spec002-rnf` (`longtask`) |
| RNF sin secuestro y nada infinito | T9 | `spec002-rnf` |

## Decisiones del usuario (2026-10-23)
- **P1 = A. Técnica del barrido (RF-11 frente a la skill motion-rules).** El barrido de los 3 botones pinta
  el relleno y el texto en capas de fondo del botón, con el texto recortado con `background-clip: text`. El
  frente lo mueven `--sa/--sb`, dos variables registradas con transición. Se acepta como la excepción de
  motion-rules para las transiciones de color y de color de fondo en respuesta a una acción. Descartadas: B (texto
  duplicado en un pseudo-elemento) y C (el color del texto cambia de golpe a mitad del barrido).
- **P2 = A. Imán con la propiedad `translate`.** Se acepta como transformación (CSS Transforms 2). Descartada
  B (`transform: translate()` con variables), porque haría que se animara el `translateY(1px)` de `:active`.
