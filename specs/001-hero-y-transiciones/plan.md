# Plan 001 — Hero cinematográfico y transiciones de scroll

Spec: `specs/001-hero-y-transiciones/spec.md` (aprobada). Skills: `sdd`, `motion-rules` (con la ampliación
autorizada), `mockup-screens`.

> **Cambio de requisitos durante T9** (decisión del usuario): lo «visto» se decide al **asentarse la carga**,
> no al ejecutarse el script, y la impresión cubre tres casos más (RF-20). Afecta a `src/lib/reveal.js`,
> `scroll-fx.js`, `src/js/reveal.js`, `motion.css` y `load-states.spec.js`. Detalle en «Asentamiento de la
> carga», en el esquema de `motion.css` y en las decisiones 9 y 10. T1–T8 no cambian.

## Base de peso (antes de la primera tarea)
Build del commit `5f01f29`, gzip por archivo y sumado por extensión, igual que `npm run budget`
(medido por el coordinador): **JS 2.236 B · CSS 10.080 B**. Margen de esta spec: **+2.560 B de JS y
+3.072 B de CSS** → techo con esta spec: **4.796 B de JS y 13.152 B de CSS**. Límite general: 15 KB y 20 KB.

## Resumen de la solución
1. **Salida del hero**: solo CSS. Cada capa del hero (`.hero__layer--*`) lee `--hero-p` (ya existe) y sus
   amplitudes de traslación y escala, definidas como propiedades por capa y por perfil (escritorio, escritorio
   bajo, móvil, móvil bajo) con media queries. `scroll-fx.js` escribe `--hero-p` siempre que cambie.
2. **Inclinación**: `scroll-fx.js` marca `.hero.is-leaving` cuando el progreso de salida pasa de 0 y borra
   `--mx/--my`; `hero.js` ignora el puntero mientras exista esa clase.
3. **Cortinas**: cada sección con frontera de tono lleva `data-curtain`. `scroll-fx.js` calcula su progreso
   con funciones puras y escribe una sola variable `--c` por sección. Un `::before` de la sección, detrás del
   contenido y del tono de la sección anterior, dibuja el **marco** (rectángulo exterior menos el plano
   descubierto) con `clip-path: polygon(evenodd, …)`. El grosor de cada lado lo calcula CSS:
   `(1 − c) × max(0, padding propio − 8 px)`, con el padding expuesto como variables (`--pt`, `--pb`, `--px`).
4. **Palabras y primer escenario**: `--w` en el texto de filosofía (progreso de palabras que espera a la
   cortina) y `--e = 0` en el primer escenario mientras la cortina de Proyectos no llegue a 1.
5. **Titulares**: `data-reveal` en los 5 `h2`. Al asentarse la carga (no antes), los que están por debajo
   de la ventana reciben `is-pending` (ocultos con `clip-path`, siguen en el árbol de accesibilidad y en la
   búsqueda). Al cumplir la condición,
   `src/js/reveal.js` parte el texto en palabras, mide sus posiciones, agrupa líneas con una función pura,
   envuelve cada línea en una máscara, anima con el `@keyframes hero-line` existente y, al terminar,
   restaura el HTML original para que el titular vuelva a fluir como texto normal.

## Archivos y responsabilidades

| Archivo | Acción | Responsabilidad | RF |
|---|---|---|---|
| `src/lib/progress.js` | modificar | Añadir `rangeProgress(value, start, end)` | RF-4, RF-7, RF-11, RF-12 |
| `src/lib/curtain.js` | crear | Tramo de cortina, progreso de palabras y compuerta del escenario | RF-7, RF-11, RF-12, RF-13 |
| `src/lib/reveal.js` | crear (T3) · modificar (T9) | Asentamiento (`settleCheck`, `SETTLE`), «visto al asentarse», condición de revelado, agrupación de líneas, tiempos | RF-12, RF-14, RF-15, RF-16, RF-19 |
| `src/lib/budget.js` | crear | Decisión del presupuesto (total y margen sobre la base) | RNF peso |
| `src/js/scroll-fx.js` | modificar | Un único rAF: lecturas primero, escrituras después; `--hero-p`, `is-leaving`, `--c`, `--w`, compuerta de `--e`, detección del asentamiento (T9), llamada al revelado | RF-1–RF-13, RF-19 |
| `src/js/reveal.js` | crear (T8) · modificar (T9) | DOM del revelado: decidir pendientes al asentarse, partir en palabras, medir, montar máscaras, restaurar | RF-14–RF-17, RF-19 |
| `src/js/hero.js` | modificar | La inclinación ignora el puntero con `.hero.is-leaving` | RF-6 |
| `src/main.js` | modificar | Importar `motion.css`; pasar a `initScrollFx` la promesa de fuentes listas | RF-14, RF-19 |
| `src/styles/hero.css` | modificar | Transform de capas con amplitudes por perfil; `is-leaving`; `is-video` sin separación | RF-1–RF-3, RF-5, RF-6 |
| `src/styles/base.css` | modificar | Padding de secciones como `--pt --px --pb` (mismo valor que hoy) | RF-7 |
| `src/styles/sections.css` | modificar | `.work { --px: 0px }`, `.contact { --pb: … }`; fórmula de palabras con `--w` | RF-7, RF-12 |
| `src/styles/motion.css` | crear (T6) · modificar (T9) | `@property` de los grosores, marco de cortina, titulares pendientes y máscaras, impresión (también escenario, inclinación y revelado en curso) | RF-7–RF-9, RF-14–RF-17, RF-20, RF-21 |
| `src/partials/sections/{philosophy,work,services,process,contact}.html` | modificar | `data-curtain` en la `section`, `data-reveal` en el `h2` | RF-7, RF-14 |
| `scripts/check-budget.mjs` | modificar | Base y margen de la spec 001; imprime y comprueba el incremento en bytes | RNF peso |
| `.claude/skills/motion-rules/SKILL.md` | modificar (autorizado) | Progreso por sección de las cortinas (`--c`) y su derivado `--w` | — |
| `tests/unit/{progress,curtain,reveal,budget}.test.js` | crear/modificar | `node --test` de `src/lib/` | ver tabla de tests |
| `tests/e2e/support/motion.js` | crear | Ayudas de e2e de esta spec (no es `*.spec.js`) | — |
| `tests/e2e/hero-exit.spec.js`, `curtains.spec.js`, `reveal.spec.js`, `load-states.spec.js`, `spec001-rnf.spec.js` | crear | Playwright en los proyectos `escritorio` y `movil` | ver tabla de tests |

No se tocan: `index.html`, `vite.config.js`, `src/config/site.js`, `nav-tone.js`, `menu.js`,
`tests/e2e/landing.spec.js` (los tests de la spec 000 no se modifican), `eslint.config.js` (en los
`page.evaluate` se usan `window.PerformanceObserver`, `new window.DOMMatrix` y `window.getComputedStyle`, que
ya pasan el lint con el global `window`).

## Funciones puras (`src/lib/`)
Todas reciben sus entradas como parámetros (píxeles, en coordenadas de documento salvo que se indique), sin DOM.

### `progress.js`
```
rangeProgress(value, start, end):
  si end <= start: devolver value >= end ? 1 : 0        // tramo vacío o invertido
  devolver clamp01((value - start) / (end - start))
```

### `curtain.js`
```
CURTAIN_RISE = { desktop: 0.6, mobile: 0.4 }

curtainRange(sectionTop, viewportHeight, maxScroll, rise):
  start = sectionTop - viewportHeight                    // el borde asoma por abajo
  end   = min(sectionTop - viewportHeight * (1 - rise),  // el borde ha subido rise·alto
              maxScroll)                                  // tramo acortado al final de página (RF-11)
  devolver { start, end }
// progreso de cortina = rangeProgress(scrollY, start, end); en scrollY = maxScroll vale 1 siempre

wordsEnd(textTop, textHeight, viewportHeight):
  devolver textTop + textHeight / 2 - viewportHeight / 2  // centro del texto en el centro de la ventana

wordsProgress(scrollY, curtainEnd, textEnd):
  si scrollY < curtainEnd: devolver 0                     // la cortina aún no está en 1 (RF-12)
  devolver rangeProgress(scrollY, curtainEnd, textEnd)    // si textEnd <= curtainEnd → 1

legacyWordsProgress(traverse):                            // regla de la spec 000, misma curva
  devolver clamp01((traverse - 0.12) / 0.38)

gated(value, curtain):                                    // primer escenario (RF-13)
  devolver curtain >= 1 ? value : 0
```

### `reveal.js`
```
SETTLE = { quiet: 400, max: 1000 }                        // ms (spec: «intervalo corto» y «como muy tarde 1 s»)
// quiet = 400 y no 200 (T9): el salto suave de restauración/ancla deja huecos de hasta 199 ms entre fotogramas

// T9: renombra seenAtStart (misma fórmula); el momento lo decide settleCheck
seenOnSettle(top, viewportHeight): devolver top < viewportHeight  // ≥ 1 px dentro o por encima

// ¿Se ha asentado la carga? Tiempos en ms de performance.now():
// start = ejecución del script · loadedAt = fin de la carga (null si aún no) · lastMove = último fotograma
// en que scrollY cambió (start si no ha cambiado)
settleCheck({ now, start, loadedAt, lastMove, quiet = SETTLE.quiet, max = SETTLE.max }):
  untilMax = max - (now - start)
  si untilMax <= 0: devolver { due: true, wait: 0 }                 // tope de 1 s, aunque siga moviéndose
  si loadedAt es null: devolver { due: false, wait: untilMax }      // la carga no ha terminado
  calm = now - max(loadedAt, lastMove)                              // calma desde la carga o el último movimiento
  si calm >= quiet: devolver { due: true, wait: 0 }
  devolver { due: false, wait: min(quiet - calm, untilMax) }        // cuándo volver a mirar si nada se mueve

shouldReveal({ top, bottom, viewportHeight, curtain, atEnd, ready }):
  dentro = bottom > 0 y top < viewportHeight
  devolver ready y curtain >= 1 y dentro y (top < 0.85 * viewportHeight o atEnd)   // RF-11, RF-14

groupLines(tops, maxLines = 6, tolerance = 1):            // tops = posición vertical de cada palabra, en orden
  lines = []
  para cada (top, i) en tops:
    si lines vacío o |top - topDeLaÚltimaLínea| > tolerance: abrir línea nueva con top
    añadir i a la última línea
  si lines.length > maxLines: fundir lines[maxLines-1 ..] en una sola
  devolver lines                                          // array de arrays de índices de palabra

revealTiming(lineCount, mobile):
  si mobile: devolver { duration: 500, stagger: 0 }       // RF-15: un bloque, ≤ 600 ms
  k = min(max(lineCount, 1), 6)
  stagger = 90                                            // dentro de 80–120 ms
  duration = min(700, 880 - (k - 1) * stagger)            // total = duration + (k-1)·stagger ≤ 880 ms
  devolver { duration, stagger }                          // margen de 20 ms al fotograma de arranque
```
Tiempos resultantes en escritorio: 1 línea 700 ms · 2 → 790 · 3 → 880 · 4 → 610 + 270 = 880 · 6 → 430 + 450 = 880.

### `budget.js`
```
budgetCheck({ size, base, allowance, limit }):
  delta = size - base
  devolver { delta, ok: size <= limit y delta <= allowance }
```

## Algoritmo del fotograma (`scroll-fx.js`)
Un solo listener de scroll y uno de resize (ya existen) que piden un `requestAnimationFrame`. Dentro:
**primero todas las lecturas, después todas las escrituras**, y solo se escribe una variable si su valor
cambió (se guarda el último valor por elemento).

```
init(ready):                                   // se ejecuta una vez, al ejecutarse el script principal
  curtains = [ { el, c: null } por cada [data-curtain] ]
  philosophy = curtain de #filosofia; philosophySeen = null     // T9: se decide al asentarse
  firstStage = primer .project__stage
  reveal = createReveal()                      // T9: no marca nada todavía
  scriptAt = performance.now(); lastMove = scriptAt; lastY = scrollY; settled = false; settleTimer = 0
  loadedAt = document.readyState === 'complete' ? scriptAt : null  // script tardío: la carga ya terminó
  si loadedAt es null: addEventListener('load', () => { loadedAt = performance.now(); request() }, { once: true })
  ready.then(() => { isReady = true; request() })
  observar [data-scroll] como hoy; listeners de scroll y resize como hoy; request()

update():
  // ── lecturas ──
  vh = innerHeight; y = scrollY; maxScroll = scrollHeight - vh
  toMark = []
  si no settled:                               // T9: asentamiento con el mismo rAF del scroll
    now = performance.now()
    si y != lastY: lastMove = now; lastY = y   // el listener de scroll ya pide este fotograma
    { due, wait } = settleCheck({ now, start: scriptAt, loadedAt, lastMove })
    si due:
      settled = true; clearTimeout(settleTimer)
      philosophySeen = seenOnSettle(top de #filosofia, vh)
      toMark = reveal.settle(vh)               // titulares por debajo de la ventana (solo lectura)
    si no:
      clearTimeout(settleTimer); settleTimer = setTimeout(request, wait)   // por si nada más pide fotograma
  mobile = !matchMedia('(min-width: 48em)').matches; rise = mobile ? 0.4 : 0.6
  heroP = heroProgress(y, vh)
  para cada curtain: top = rect.top + y; { start, end } = curtainRange(top, vh, maxScroll, rise)
                     curtain.c = rangeProgress(y, start, end); curtain.end = end
  rects de los [data-scroll] visibles (como hoy)
  st = rect del texto de filosofía
  w = (no settled o philosophySeen) ? legacyWordsProgress(traverseProgress(st.top, st.height, vh))   // spec 000
                                    : wordsProgress(y, philosophy.end, wordsEnd(st.top + y, st.height, vh))
  // ── escrituras ──
  escribir --hero-p si cambió (sin el tope actual de 1,5 pantallas: RF-4)
  leaving = heroP > 0; si cambió: toggle .hero.is-leaving y, al entrar, quitar --mx/--my del escenario
  escribir --c de cada sección si cambió
  escribir --p y --e de los visibles; en el primer escenario, --e = gated(e, work.c)
  escribir --w en el texto de filosofía si cambió
  para cada t en toMark: t.classList.add('is-pending')          // T9: siempre fuera de la ventana
  revelar los titulares de reveal.due({ vh, atEnd: y >= maxScroll - 1, ready: isReady, curtainOf })
```
`reveal.due` va en las lecturas (solo lee rects de los titulares pendientes, ≤ 5; antes del asentamiento no
hay ninguno) y `revealTitle` en las escrituras; el revelado hace su propia medición de palabras en ese mismo
fotograma, una sola vez por titular.

## Asentamiento de la carga (T9, RF-12, RF-16, RF-19)
- **Cuándo se decide**: en el primer fotograma en que `settleCheck` da `due`: 400 ms sin cambios de
  `scrollY` desde el fin de la carga (o desde la ejecución del script, si la carga ya había terminado), o
  1.000 ms desde la ejecución del script, lo que llegue antes. Medido en T9: Chromium ejecuta el módulo a
  ~113–146 ms y restaura o salta al ancla entre ~170 y ~900 ms, con `scroll-behavior: smooth`; el
  desplazamiento suave emite `scroll` en cada fotograma, así que la calma no se cumple mientras dura.
- **Cómo se detecta sin listeners de scroll nuevos**: el listener de scroll existente ya pide el rAF; en las
  lecturas de `update()` se compara `scrollY` con el del fotograma anterior y se guarda `lastMove`. Solo se
  añaden un listener de `load` de una vez y un único `setTimeout` (reprogramado con `wait`) que pide un
  fotograma cuando no lo pide nadie. Ambos desaparecen tras decidir. Se cumple motion-rules («no añadas otro
  listener de scroll»).
- **Antes de decidir**: ningún titular tiene `is-pending` (todos visibles, como sin script), `reveal.due` no
  devuelve nada y las palabras usan `legacyWordsProgress` (regla de la spec 000). Cortinas, `--hero-p`,
  `is-leaving` y la compuerta del primer escenario funcionan desde el primer fotograma (RF-7, RF-13).
- **Al decidir** (un solo fotograma): lecturas de las 5 cajas de titular y de Filosofía; escrituras de
  `is-pending` solo en los que tienen `top >= vh`, es decir, fuera de la ventana: no hay cambio visible. Las
  palabras pasan a `wordsProgress` solo si Filosofía queda pendiente; en ese caso el texto está por debajo de
  la ventana y ambas reglas dan opacidad mínima, así que tampoco hay salto.
- **Script después de la red de seguridad** (2,5 s): `document.readyState` ya es `complete`, así que
  `loadedAt = scriptAt` y la decisión llega a los 400 ms de calma (como mucho 1 s). Hasta entonces todo sigue
  como sin script; la red de seguridad del hero no cambia.
- **`createReveal()`** pasa a no marcar nada al crearse y expone `settle(vh)`: lee la caja de cada
  `[data-reveal]`, guarda como pendientes los que no cumplen `seenOnSettle` y los devuelve para que
  `scroll-fx.js` les ponga `is-pending` en las escrituras.
- **Si en los tests la restauración empezara más de 200 ms después de `load`**: se sube `SETTLE.quiet`
  (hasta 400 ms, sin pasar del tope de 1 s); si ni así pasa, el implementer para e informa.

## Revelado de titulares (`src/js/reveal.js`)
```
createReveal():                                // T9: no marca nada al crearse
  titles = [ { title: h, section: h.closest('[data-curtain]') } por cada h2[data-reveal] ]
  pending = []
  devolver { settle, due }

settle(vh):                                    // lecturas; una vez, al asentarse la carga
  pending = titles.filter(t => no seenOnSettle(t.title.getBoundingClientRect().top, vh))
  devolver pending.map(t => t.title)           // scroll-fx.js les pone is-pending en las escrituras

due({ vh, atEnd, ready, curtainOf }):          // lecturas; [] mientras no se haya asentado
  para cada h en pending:
    r = rect de h
    si shouldReveal({ top: r.top, bottom: r.bottom, viewportHeight: vh, curtain: curtainOf(h), atEnd, ready }):
      quitar h de pending; devolverlo          // scroll-fx.js llama a revealTitle(h, mobile) en las escrituras

revealTitle(h, mobile):
  original = h.innerHTML
  si mobile: grupos = [todos los nodos hijos]                       // un bloque (RF-15)
  si no:
    sustituir cada nodo de texto por <span> por palabra (conservando espacios y <br>)
    tops = offsetTop de cada span de palabra                        // una sola lectura de layout
    grupos = groupLines(tops)                                       // líneas reales (RF-14)
  { duration, stagger } = revealTiming(grupos.length, mobile)
  reconstruir h: por cada grupo i → <span class="ln" style="--li:i"><span>palabras del grupo</span></span>
  h.style --rd = duration ms, --rs = stagger ms
  h.classList.replace('is-pending', 'is-revealing')                 // mismo fotograma: sin parpadeo
  setTimeout(total + 50): h.innerHTML = original; quitar is-revealing, --rd y --rs   // RF-16
```
- Las palabras se crean con `textContent` (nunca HTML de cadena) y se unen con un espacio; los `<br>` solo
  sirven para medir y no se copian a las máscaras (cada máscara ya es un bloque).
- Accesibilidad (RF-17): el `h2` conserva su `id` y su texto; las máscaras son `span` sin roles ni
  `aria-*`, así que el nombre accesible es la misma frase (normalizando espacios) antes, durante y después.

## Interfaz

### Escritorio (≥ 768 px de ancho; 1440×900 de referencia)
- **Hero**: el titular y los CTA no se mueven respecto al hero; la escena (`z-index: 1`, sin eventos de
  puntero) queda bajo el texto (`z-index: 2`), como hoy (RF-5). Amplitudes en `hero.css`:

| Perfil (media query) | Capa | `--es` (escala − 1) | `--ex` (vh) | `--ey` (vh) | Escala p=1 | Desplazamiento p=1 |
|---|---|---|---|---|---|---|
| Escritorio, alto ≥ 500 | fondo | −0,14 | 0 | −8 | 0,86 | 8 % |
| | intermedia | −0,03 | 6 | 3 | 0,97 | 6,7 % |
| | teléfono | +0,115 | −3 | 10 | 1,115 | 10,4 % |
| Escritorio, alto < 500 (`max-height: 499.98px`) | fondo | −0,07 | 0 | −5 | 0,93 | 5 % |
| | intermedia | −0,015 | 4 | 2 | 0,985 | 4,5 % |
| | teléfono | +0,0575 | −2 | 6 | 1,0575 | 6,3 % |

  `transform: translate3d(calc(var(--hero-p,0) * var(--ex,0) * 1vh), calc(var(--hero-p,0) * var(--ey,0) * 1vh), 0) scale(calc(1 + var(--hero-p,0) * var(--es,0)))`.
  La escala se aplica desde el centro de la capa (no mueve su centro). Lineal: con p = 0,5 todo vale el 50 %
  (RF-2). Direcciones elegidas para que crezcan las tres distancias entre centros (fondo arriba; intermedia a
  la derecha y abajo; teléfono a la izquierda y abajo): comprobado a mano con las cajas de 1440×900 y
  1366×600; el test e2e lo mide en todas las ventanas de la spec y, si un par no crece, se ajusta el signo
  en CSS sin tocar los rangos.
- **Tablet (768–1024 px, incluye 844×390)**: misma tabla; la escena ya es más ancha (`70vw`).
- **Cortinas**: marco del tono anterior en los cuatro lados; en Proyectos solo arriba y abajo (`--px: 0px`).
  La franja superior a 1440 px es de 13 rem − 8 px = 200 px con c = 0.
- **Titulares**: línea a línea, 90 ms de escalonado, ≤ 880 ms en total.

### Móvil (< 768 px; proyecto `movil` = Pixel 7 de Playwright)
> La spec cita el Pixel 7 como 412×915 (pantalla); la ventana del descriptor de Playwright es más baja
> (412×839 en la versión instalada, a confirmar en T4). Los tests leen `innerWidth/innerHeight` y nunca fijan
> alturas, así que valen para la ventana real.

| Perfil | Capa | `--es` | `--ex` (vh) | `--ey` (vh) | Escala p=1 | Desplazamiento p=1 |
|---|---|---|---|---|---|---|
| Móvil, alto ≥ 500 | fondo | −0,055 | 0 | −5 | 0,945 | 5 % |
| | teléfono | +0,05 | 2 | 5 | 1,05 | 5,4 % |
| Móvil, alto < 500 (p. ej. 667×375) | fondo | −0,0275 | 0 | −3 | 0,9725 | 3 % |
| | teléfono | +0,025 | 1 | 3 | 1,025 | 3,2 % |

- La capa intermedia sigue oculta en móvil. El `overflow: hidden` del hero evita desplazamiento horizontal.
- Cortinas con `rise = 0,4`: franja superior 6 rem − 8 px = 88 px y laterales `--gutter` − 8 px = 12 px.
- Titulares: un único bloque desde una máscara, 500 ms, sin medir líneas.
- Sin inclinación (sin puntero fino), como hoy.

### Alturas < 500 px
- 1366×600: perfil de escritorio normal (alto ≥ 500). 844×390: escritorio bajo. 667×375: móvil bajo.
- Las cortinas no cambian de regla con la altura; en ventanas bajas el tramo es más corto en píxeles.
- RF-13: en las cuatro ventanas de la spec el primer escenario queda por debajo de la ventana cuando la
  cortina de Proyectos llega a 1 (estimado: 1440×900 asoma ≈ 20 px, el resto fuera); `gated()` lo garantiza
  en cualquier caso, con un salto máximo de ≈ 3 % de apertura al llegar a 1 en 1440×900.

## CSS nuevo (`motion.css`) — esquema
```
@property --ft, --fr, --fb, --fl { syntax: '<length>'; inherits: false; initial-value: 0px }

@media (prefers-reduced-motion: no-preference) {
  .js [data-curtain] { position: relative; isolation: isolate }
  .js [data-curtain]::before {
    content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none;
    background: var(--curtain-bg);                         /* blanco en secciones oscuras y al revés */
    --ft: calc((1 - var(--c, 1)) * max(0px, var(--pt) - 8px));   /* igual --fr/--fl con --px, --fb con --pb */
    clip-path: polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0,
      var(--fl) var(--ft), var(--fl) calc(100% - var(--fb)),
      calc(100% - var(--fr)) calc(100% - var(--fb)), calc(100% - var(--fr)) var(--ft), var(--fl) var(--ft));
  }
  .js [data-reveal].is-pending { clip-path: inset(0 0 100% 0) }
  .is-revealing { display: flow-root }                     /* evita que el margen negativo salga del h2 */
  .is-revealing .ln { display: block; overflow: hidden; padding-bottom: .06em; margin-bottom: -.06em }
  .is-revealing .ln > span { display: block;
    animation: hero-line var(--rd) var(--ease-out) calc(var(--li) * var(--rs)) both }
}
@media print {                       /* mismos selectores (o más específicos) que las reglas que anulan */
  .js [data-curtain]::before { content: none }  .js [data-reveal].is-pending { clip-path: none }
  .hero__layer { transform: none }  .philosophy__statement .w { opacity: 1 }
  /* T9 (RF-20) */
  .project__stage { clip-path: none }                     /* primer escenario completo aunque --e = 0 (inline) */
  .hero .hero__stage { transform: none; transition: none } /* sin inclinación; sin transición al cambiar de medio */
  .js .is-revealing .ln > span { animation: none }        /* titular a medio revelar: líneas en su sitio */
}
```
`motion.css` se importa después de `hero.css` y `sections.css`, así que a igual especificidad gana la regla
de impresión. Notas de T9:
- El escenario recibe `--e` como estilo en línea, que el CSS no puede anular sin `!important`; por eso se
  anula el `clip-path` que lo usa, no la variable. Se aplica a todos los escenarios (un escenario a medio
  abrir tampoco debe salir recortado); las capas internas conservan su posición, sin recorte.
- `.hero .hero__stage` (0,2,0) gana a `.hero__stage` y a sus variantes de móvil; `.hero.is-leaving
  .hero__stage` solo cambia `transition-duration`, que `transition: none` anula igualmente. Sin
  `transition: none`, al pasar a impresión la escena tardaría 1,2 s en llegar a `none`.
- `animation: none` quita la animación de la máscara: `.ln > span` queda sin transformar y con opacidad 1
  (`hero-line` solo anima `transform`). El `setTimeout` que restaura el HTML sigue funcionando igual.
- Con `--c` sin escribir (sin JS, script fallido o antes de ejecutarse) el marco tiene grosor 0: la sección
  se ve con su fondo completo (RF-19, RF-20). Con movimiento reducido no existe el `::before` (RF-18).
- El marco está detrás del contenido (`z-index: -1` en un contexto aislado) y dentro del padding menos 8 px:
  no tapa texto, pulsables ni el indicador de foco (`outline` 2 px + `offset` 4 px = 6 px < 8 px) (RF-9,
  RF-21). El fondo propio de la sección no cambia, así que el contraste del contenido tampoco.
- Los `@property` permiten que el test lea los grosores ya resueltos en px con `getComputedStyle(el, '::before')`.
- Palabras de filosofía en `sections.css`: `--t: calc(var(--w, 1) * var(--n) - var(--i, 0))`. Con
  `--w = (p − 0,12)/0,38` es la fórmula de la spec 000; sin JS, `--w = 1` → todo visible.

## Movimiento (skill motion-rules)
- Solo `transform` (capas del hero, máscaras de línea), `clip-path` (marco y titulares pendientes) y
  `opacity` (palabras, ya existente). Nada de `will-change` en capas con dispositivos (mockup-screens).
- Todo bajo `html.js` y `prefers-reduced-motion: no-preference`; el estado final es el de por defecto
  (`var(--c, 1)`, `var(--w, 1)`, `var(--hero-p, 0)` = reposo).
- Un único rAF y un único listener de scroll en `scroll-fx.js`; nada se anima sin scroll salvo el revelado
  (una vez por titular, ≤ 880 ms) y la vuelta a neutro de la inclinación (500 ms). Nada infinito.
- Móvil: revelado de 500 ms (≈ 0,7× de 700 ms), un solo elemento; amplitudes de salida menores.
- Curvas: `--ease-out` en el revelado (`@keyframes hero-line` reutilizado, sin keyframes nuevos).
- **Ampliación de la skill (autorizada; tarea T1)**. Texto propuesto para la regla del scroll:
  > Los efectos leen `--p`, `--e`, `--hero-p` y, en las secciones con frontera de tono (`data-curtain`), el
  > progreso de cortina por sección `--c`, más su derivado `--w` (palabras de filosofía, que esperan a que la
  > cortina llegue a 1). Todos los escribe `src/js/scroll-fx.js` en un único `requestAnimationFrame`,
  > leyendo primero y escribiendo después. La cortina solo actúa sobre el fondo (`::before` detrás del
  > contenido) y nunca recorta contenido. No añadas otro listener de scroll.

  Y en el checklist: «¿La cortina deja todo el contenido y su foco dentro del plano descubierto?».

## Decisiones (con la alternativa descartada)
1. **Salida del hero en CSS con `--hero-p`** en vez de una función `heroExit()` en `src/lib/` que escriba
   `--x/--y/--s` por capa. Motivo: 0 B de JS, ninguna variable nueva (no hace falta ampliar más la skill),
   y es el patrón que ya usan las capas del hero y de los proyectos. Lo que se pierde (tests unitarios de
   los rangos) lo cubre el e2e midiendo las escalas reales en cada ventana.
2. **Una sola variable `--c` por sección y grosores calculados en CSS** en vez de que JS lea el padding con
   `getComputedStyle` y escriba cuatro insets en px con una función `curtainInsets()`. Motivo: encaja
   exactamente con la ampliación autorizada (un progreso por sección), el padding tiene una sola fuente
   (`--pt/--px/--pb`), se adapta solo a zoom y redimensionado y no hay caché que invalidar. La regla
   «padding − 8 px» se verifica en e2e leyendo los `@property` resueltos.
3. **Marco del tono anterior por encima del fondo propio** en vez de un plano del tono propio sobre un fondo
   del tono anterior. Motivo: el fondo real de la sección no cambia, así que axe, la impresión, la barra y el
   contraste siguen viendo el tono correcto, y sin `--c` el marco simplemente no existe.
4. **Revelado midiendo palabras en el momento del revelado y restaurando el HTML al terminar** en vez de
   envolver las líneas al cargar y recalcularlas con `ResizeObserver`. Motivo: las líneas siempre reflejan el
   ancho, el tamaño de texto y la fuente del momento (RF-14) sin observadores ni recálculos, y después del
   revelado el titular vuelve a ser texto normal (RF-16). Coste: una lectura de layout por titular, una vez.
5. **Titular pendiente oculto con `clip-path`** en vez de `opacity: 0` o `visibility: hidden`. Motivo: no
   altera el layout, mantiene el texto en el árbol de accesibilidad y en la búsqueda del navegador, y es una
   propiedad permitida por motion-rules.
6. **Tope de 6 máscaras** en vez de reducir la duración de cada línea sin límite. Motivo: con 80–120 ms de
   escalonado y 900 ms de total, más de 6 líneas dejarían menos de 400 ms por línea.
7. **Esperar a las fuentes con la promesa que ya usa el hero** (`document.fonts.ready` o 1,2 s) en vez de un
   `MutationObserver` sobre `is-ready`. Motivo: una sola fuente de verdad y ningún observador extra.
8. **Tests de esta spec en archivos e2e nuevos** en vez de ampliar `landing.spec.js`. Motivo: los tests de
   la spec 000 quedan intactos (RF-22) y cada archivo agrupa un bloque de RF.
9. **Decidir lo visto al asentarse la carga, detectado en el rAF existente** (T9) en vez de:
   - **`history.scrollRestoration = 'manual'`** y restaurar nosotros la posición antes de decidir.
     Descartada: sustituye un comportamiento nativo del navegador (contra «sin scroll secuestrado»), obliga a
     guardar la posición (p. ej. en `sessionStorage`), no resuelve el salto al ancla (habría que reimplementarlo
     con `scroll-padding-top` y el desplazamiento suave) ni el script tardío, y cuesta más JS.
   - **Aceptar la animación** en recarga y ancla. Descartada: contradice RF-16 y RF-19 y la decisión del
     usuario (un titular que el visitante ya está leyendo desaparecería y volvería a subir).
   - **Escuchar `scrollend`** o un `IntersectionObserver` por titular para saber cuándo para el scroll.
     Descartada: `scrollend` sería un listener de scroll nuevo (motion-rules lo prohíbe) y no está en todos
     los navegadores objetivo; el observador no sabe cuándo ha terminado la restauración.
10. **Impresión con tres reglas de CSS** (escenario sin `clip-path`, escena sin `transform` ni transición,
    máscaras sin animación) en vez de escuchar `beforeprint` y deshacer estados desde JS. Motivo: 0 B de JS,
    funciona también con «Guardar como PDF» y vista previa sin depender de eventos, y es el mismo patrón que
    ya usa `@media print` en `motion.css`.

## Riesgo resuelto (T9)
- **Restauración del scroll al recargar y anclas**: confirmado en T9 (el módulo ve y = 0; la posición llega
  después y de forma suave). Resuelto con el cambio de requisitos aprobado por el usuario: «Asentamiento de la
  carga» (decisión 9). Riesgo residual aceptado en la spec: una restauración de más de 1 s decide con la
  posición del tope y lo que llegue después se revela con animación.

## Impacto en el peso (estimado, gzip)
| Pieza | JS | CSS |
|---|---|---|
| `curtain.js` + `rangeProgress` | ≈ 180 B | — |
| `reveal.js` (lib) | ≈ 220 B | — |
| `scroll-fx.js` (cortinas, palabras, compuerta, `is-leaving`, lecturas/escrituras) | ≈ 450 B | — |
| `src/js/reveal.js` (DOM) | ≈ 450 B | — |
| `hero.js` / `main.js` | ≈ 40 B | — |
| Amplitudes del hero (4 perfiles) | — | ≈ 300 B |
| `motion.css` (marco, `@property`, titulares, impresión) | — | ≈ 550 B |
| Tokens de padding y fórmula de palabras | — | ≈ 60 B |
| **Total estimado** | **≈ 1,3 KB de 2,5 KB** | **≈ 0,9 KB de 3 KB** |

`budget.js` no entra en el bundle (solo lo importa el script de presupuesto).

**Cambio de T9** (sobre lo medido tras T8: +1.386 B de JS y +487 B de CSS):
| Pieza | JS | CSS |
|---|---|---|
| `settleCheck` + `SETTLE` | ≈ 90 B | — |
| Asentamiento en `scroll-fx.js` (`lastMove`, `load`, temporizador, `toMark`) | ≈ 130 B | — |
| `createReveal().settle` (sustituye al marcado inicial) | ≈ 20 B | — |
| Tres reglas de impresión | — | ≈ 70 B |
| **Total tras T9 (estimado)** | **≈ +1.630 B de +2.560 B** | **≈ +560 B de +3.072 B** |

**Verificación**: `scripts/check-budget.mjs` incorpora `BASE = { js: 2236, css: 10080 }` y
`ALLOWANCE = { js: 2560, css: 3072 }` (comentados como «spec 001, build de 5f01f29») y, con `budgetCheck()`,
imprime por extensión el total, el límite general y el incremento en bytes con su máximo, y sale con error si
se supera cualquiera de los dos. Ejemplo de salida:
`OK  JS 3.5 KB gzip (límite 15 KB) · +1290 B sobre la base (máx. +2560 B, spec 001)`.
Cuando se implemente la spec 002, su plan fijará la nueva base.

## Estrategia de tests

### Unitarios (`node --test`, `tests/unit/`)
| Test | Cubre |
|---|---|
| `progress.test.js`: `rangeProgress` (tramo normal, vacío, invertido, límites) | RF-4, RF-7 |
| `curtain.test.js`: `curtainRange` con 0,6/0,4, tramo acortado (end = maxScroll), progreso 1 en maxScroll, sección visible con scroll 0 | RF-7, RF-11 |
| `curtain.test.js`: `wordsProgress` = 0 antes de la cortina, 1 en el centro, caso textEnd ≤ curtainEnd; `legacyWordsProgress` igual a la curva de la spec 000; `gated` | RF-12, RF-13 |
| `reveal.test.js`: `seenOnSettle` (1 px dentro, por encima, justo en el borde) | RF-16, RF-19 |
| `reveal.test.js` (T9): `settleCheck` — sin carga solo decide el tope (999 → no, 1000 → sí, `wait` = lo que falta); con carga, 200 ms de calma desde `loadedAt` o desde `lastMove` (lo posterior); un movimiento reinicia la calma; tope de 1 s aunque haya movimiento; `wait` ≤ lo que falta al tope; carga anterior al script (`loadedAt` = `start`) | RF-12, RF-16, RF-19 |
| `reveal.test.js`: `shouldReveal` (85 %, cortina < 1, fuera de la ventana, `atEnd`, `ready`) | RF-11, RF-12, RF-13, RF-14 |
| `reveal.test.js`: `groupLines` (una línea, varias, `<br>` simulado, tolerancia, fusión desde la 6.ª) | RF-14 |
| `reveal.test.js`: `revealTiming` (escalonado 80–120, total ≤ 900 de 1 a 10 líneas; móvil sin escalonado ≤ 600) | RF-14, RF-15 |
| `budget.test.js`: `budgetCheck` (dentro, sobre el margen, sobre el límite) | RNF peso |

### Interfaz (Playwright, proyectos `escritorio` y `movil`)
Ayudas en `tests/e2e/support/motion.js`: `open(page)` (como el de la spec 000, recoge errores de consola),
`scrollToY` (con `behavior: 'instant'` y dos rAF de espera, porque `html` tiene `scroll-behavior: smooth`),
`scrollToCurtain(page, id, c)` (calcula la posición con la definición de la spec, sin importar `src/lib/`),
`heroLayers(page)` (escala desde `DOMMatrix` y centro respecto a la caja del hero), `frame(page, id)`
(grosores `--ft/--fr/--fb/--fl` resueltos del `::before`).

| Archivo · test | Ventanas | Cubre |
|---|---|---|
| `hero-exit` · reposo con p = 0 (±1 px) y al volver arriba | 1440×900, móvil | RF-1, RF-4 |
| `hero-exit` · escalas en rango, desplazamiento ≤ 30 %/15 % vh, distancias entre centros crecen, regla de 0,5 | 1440×900, 1366×600, 844×390, 667×375, móvil | RF-2, RF-3 |
| `hero-exit` · misma posición, mismo estado (bajar y subir) | 1440×900 | RF-4 |
| `hero-exit` · `elementFromPoint` en el centro del titular, la entradilla y los CTA con p = 0; 0,5; 1 y clic en el CTA | 1440×900, 1366×600, 844×390, móvil | RF-5 |
| `hero-exit` · con `.is-video` forzado, capas sin transformar | 1440×900 | RF-2 |
| `hero-exit` · inclinación con ratón; con p > 0 neutra en ≤ 600 ms y sin reaccionar; al volver a 0, solo tras mover | escritorio | RF-6 |
| `curtains` · cada frontera con c = 0; 0,5; 1: grosores = (padding − 8)·(1 − c) ±1 px, Proyectos sin lateral | 1440×900, móvil | RF-7 |
| `curtains` · el `::before` es del tono anterior y la sección conserva su fondo | 1440×900, móvil | RF-8 |
| `curtains` · cajas de textos y pulsables dentro del plano (±1 px), salvo escenarios | 1440×900, móvil | RF-9 |
| `curtains` · `scrollHeight` igual con y sin movimiento reducido (±1 px) | 1440×900, móvil | RF-10 |
| `curtains` · final de página: Contacto con c = 1; ventana muy alta (1440×2400) con tramo acortado | 1440×900, 1440×2400 | RF-11 |
| `curtains` · cargar con Servicios a la vista, subir por encima y volver: la cortina se cierra y se reabre | 1440×900 | RF-7 |
| `curtains` · Tab por todos los enfocables: anillo (caja + 6 px) dentro del plano y por encima del hero | escritorio | RF-21 |
| `reveal` · Filosofía: c = 0,9 → titular pendiente y palabras a 0,18; c = 1 → revela; palabras a 1 en el centro | 1440×900, móvil | RF-12 |
| `reveal` · Proyectos: c = 0,9 → titular pendiente y primer escenario sin abrir | 1440×900, 1366×600, 844×390, móvil | RF-13 |
| `reveal` · nº de máscaras = nº de líneas de `Range.getClientRects()` medido justo antes; escalonado 80–120 ms; fin ≤ 900 ms (con `getAnimations()`) | 1440×900 | RF-14 |
| `reveal` · antes del revelado: cambiar ancho (1440 → 1100) y `font-size` raíz (125 %) → máscaras = líneas nuevas | escritorio | RF-14 |
| `reveal` · titular con > 6 líneas (`font-size` raíz 200 %): 6 máscaras y ≤ 900 ms | escritorio | RF-14 |
| `reveal` · móvil: 1 máscara, sin escalonado, ≤ 600 ms | móvil | RF-15 |
| `reveal` · subir y bajar: ninguna animación nueva; tras revelar, cambiar ancho: HTML original y sin máscaras | 1440×900, móvil | RF-16 |
| `reveal` · nombre accesible igual antes/durante/después; altura del titular y `top` del siguiente elemento ±1 px | 1440×900, móvil | RF-17 |
| `reveal` · final de página en ventana muy alta: titular de Contacto revelado o revelándose | 1440×2400 | RF-11 |
| `load-states` · movimiento reducido: capas en reposo con scroll, sin `::before`, titulares y palabras finales, 0 animaciones | 1440×900, móvil | RF-18 |
| `load-states` · sin JavaScript (`javaScriptEnabled: false`): todo final; CTA con `href` de la spec 000 | 1440×900, móvil | RF-20 |
| `load-states` · módulo bloqueado (`route.abort`): pasados 2,5 s, hero visible y todo final | 1440×900 | RF-19, RF-20 |
| `load-states` · módulo retrasado 3 s con la página en Servicios: cortinas y `--hero-p` según posición desde el primer fotograma; titulares vistos nunca pendientes ni animados (registro desde antes del script); los de debajo, pendientes tras el asentamiento (`expect.poll`, ≤ 1.100 ms desde que se escribe `--hero-p`) | 1440×900 | RF-19 |
| `load-states` · recarga a mitad de página (Servicios a la vista con su cortina en 1): `MutationObserver` desde `addInitScript`; ningún titular visto llega a `is-pending`, `is-revealing` ni máscaras; los de debajo quedan pendientes; el primer `is-pending` llega ≤ `domContentLoadedEventStart` + 1.100 ms (el módulo se ejecuta antes de ese evento); cortinas según la posición | 1440×900, móvil | RF-16, RF-19 |
| `load-states` · `/#servicios`: mismas comprobaciones, con Servicios bajo la barra | 1440×900, móvil | RF-16, RF-19 |
| `load-states` · impresión (`emulateMedia print`) con una cortina a 0,5 y titulares pendientes: todo final | 1440×900 | RF-20 |
| `load-states` (T9) · impresión con la cortina de Proyectos a 0,9: el primer escenario tenía `clip-path` de recorte y en impresión es `none` | 1440×900 | RF-20, RF-13 |
| `load-states` (T9) · impresión tras inclinar con el ratón con progreso 0: la escena tenía rotación y en impresión su `transform` es `none` al instante y 200 ms después | 1440×900 | RF-20, RF-6 |
| `load-states` (T9) · impresión a mitad de un revelado (≈ 150 ms tras arrancar, con `.ln` presentes en la misma lectura): cada `.ln > span` sin transformar, opacidad 1 y sin animaciones en curso en el titular | 1440×900 | RF-20, RF-14 |
| `spec001-rnf` · CLS = 0 en un recorrido completo arriba-abajo; CLS de carga ≤ el de la base | 1440×900, móvil | RNF estabilidad |
| `spec001-rnf` · sin `longtask` > 50 ms durante el recorrido | escritorio | RNF estabilidad |
| `spec001-rnf` · axe sin infracciones con movimiento permitido, una cortina a 0,5, menú cerrado y abierto | 1440×900, móvil | RF-22 |
| `spec001-rnf` · capturas para la revisión visual (no afirma nada): hero p = 0 y 0,5; cada frontera a 0,5; titulares revelados; reducido; sin JS; impresión | 1440×900, móvil | RNF nitidez, criterios |
| `landing.spec.js` (spec 000) sin cambios, en verde | ambos | RF-22 |
| `npm run budget` | — | RNF peso |

La base de CLS de carga se mide una vez en T10 sobre el build de `5f01f29` (copia temporal en el
scratchpad, sin tocar el repositorio) y se anota como constante comentada en el test.

## Cobertura RF → parte del plan
| RF | Parte |
|---|---|
| RF-1–RF-5 | Amplitudes en `hero.css`, `--hero-p` siempre actualizado en `scroll-fx.js`, `z-index` existente |
| RF-6 | `is-leaving` en `scroll-fx.js` + `hero.js` + `transition-duration` en `hero.css` |
| RF-7–RF-11 | `curtain.js`, `--c` en `scroll-fx.js`, tokens de padding, marco en `motion.css` |
| RF-12, RF-13 | `wordsProgress`/`legacyWordsProgress`/`gated` + `--w` y `--e` en `scroll-fx.js` + `shouldReveal` |
| RF-14–RF-17 | `reveal.js` (lib y DOM) + máscaras en `motion.css` |
| RF-18 | Todo bajo `no-preference`; `initScrollFx` no se llama con movimiento reducido (como hoy) |
| RF-19, RF-20 | Valores por defecto de reposo, `is-pending` solo al asentarse la carga (`settleCheck` + `createReveal().settle`), `@media print` con escenario, escena y máscaras |
| RF-21 | Marco detrás del contenido y dentro de padding − 8 px; escena bajo el texto |
| RF-22 | Tests de la spec 000 intactos + axe con movimiento + `npm run check` |
