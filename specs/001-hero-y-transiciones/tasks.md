# Tareas 001 — Hero cinematográfico y transiciones de scroll

Plan: `specs/001-hero-y-transiciones/plan.md`. Una tarea cada vez: tests primero (en rojo), código, tests en
verde, marcar y parar. Cada tarea termina con `npm run check` en verde y `MEMORY.md` actualizado.
Base de peso: JS 2.236 B y CSS 10.080 B (gzip); margen de esta spec: +2.560 B y +3.072 B.

- [ ] **T1. Presupuesto de la spec y ampliación de motion-rules.** RNF peso
  - `src/lib/budget.js` con `budgetCheck()` y `tests/unit/budget.test.js`; `scripts/check-budget.mjs` con la
    base y el margen de la spec 001. Ampliar `.claude/skills/motion-rules/SKILL.md` con el texto del plan
    (`--c` por sección, `--w` derivado, checklist de la cortina).
  - Hecho cuando: `npm test` pasa `budget.test.js`; `npm run budget` imprime para JS y CSS el total, el
    límite general y el incremento en bytes con su máximo (+2560 / +3072), con un incremento de +0 B en JS y
    en CSS sobre el código actual (HEAD = `5f01f29`, sin cambios de la spec todavía) y sale con error si se
    fuerza un margen menor; la skill contiene la regla ampliada y el punto nuevo del checklist.

- [ ] **T2. Lógica pura de cortinas y palabras.** RF-4, RF-7, RF-11, RF-12, RF-13
  - `rangeProgress` en `src/lib/progress.js`; `src/lib/curtain.js` con `CURTAIN_RISE`, `curtainRange`,
    `wordsEnd`, `wordsProgress`, `legacyWordsProgress` y `gated`.
  - Hecho cuando: `tests/unit/progress.test.js` y `tests/unit/curtain.test.js` cubren los casos de la tabla
    del plan (tramo normal, acortado al final de página, vacío o invertido, progreso 1 en `maxScroll`,
    palabras a 0 antes de la cortina y a 1 en el centro, curva de la spec 000) y `npm test` está en verde.

- [ ] **T3. Lógica pura del revelado.** RF-11, RF-14, RF-15, RF-16, RF-19
  - `src/lib/reveal.js` con `seenAtStart`, `shouldReveal`, `groupLines` y `revealTiming`.
  - Hecho cuando: `tests/unit/reveal.test.js` comprueba el borde de 1 px, el umbral del 85 %, la cortina < 1,
    `atEnd` y `ready`, la agrupación con tolerancia y la fusión desde la 6.ª línea, y que para 1 a 10 líneas
    el escalonado está entre 80 y 120 ms y el total es ≤ 900 ms (móvil: sin escalonado, ≤ 600 ms); `npm test`
    en verde.

- [ ] **T4. Salida del hero ligada al scroll.** RF-1, RF-2, RF-3, RF-4, RF-5, RF-22
  - Amplitudes por capa y perfil en `hero.css` (tabla del plan), `is-video` sin separación, `--hero-p` escrito
    siempre que cambie en `scroll-fx.js` (lecturas antes que escrituras). Confirmar la ventana real del
    proyecto `movil` y anotarla en `MEMORY.md`.
  - Hecho cuando: `tests/e2e/hero-exit.spec.js` está en verde en ambos proyectos con las medidas del plan
    (reposo ±1 px, escalas en rango, desplazamiento ≤ 30 %/15 % vh, distancias entre centros crecientes,
    regla de 0,5, mismo estado al bajar y subir, `elementFromPoint` y clic en los CTA) en 1440×900,
    1366×600, 844×390, 667×375 y móvil; `landing.spec.js` sigue en verde.

- [ ] **T5. Inclinación y salida no se combinan.** RF-6
  - `.hero.is-leaving` desde `scroll-fx.js` (borra `--mx/--my` al entrar), `hero.js` ignora el puntero con
    esa clase y `transition-duration: 0.5s` en el escenario.
  - Hecho cuando: el test RF-6 de `hero-exit.spec.js` (escritorio) comprueba con el ratón que, con progreso
    > 0, la transformación del escenario es neutra en ≤ 600 ms y no cambia al mover el puntero, y que al volver
    a 0 sigue neutra hasta el siguiente movimiento, tras el cual vuelve a inclinarse.

- [ ] **T6. Cortinas entre secciones.** RF-7, RF-8, RF-9, RF-10, RF-11, RF-20, RF-21
  - `data-curtain` en las 5 secciones, padding como `--pt/--px/--pb` (mismo valor que hoy), `motion.css`
    (`@property`, marco `::before`, impresión) importado en `main.js`, y `--c` por sección en `scroll-fx.js`.
  - Hecho cuando: `tests/e2e/curtains.spec.js` está en verde en ambos proyectos: grosores = (padding − 8)·(1 − c)
    ±1 px con c = 0; 0,5; 1 en las 5 fronteras (Proyectos sin lateral), tono anterior en el marco, cajas de
    contenido dentro del plano, `scrollHeight` igual con movimiento reducido, Contacto en 1 al final (también
    a 1440×2400), cierre y reapertura tras cargar con Servicios a la vista, anillo de foco dentro del plano
    al tabular, y sin marco en impresión.

- [ ] **T7. Palabras de filosofía y primer escenario esperan a su cortina.** RF-12, RF-13
  - `--w` en el texto de filosofía (`wordsProgress` o `legacyWordsProgress` si Filosofía fue vista al
    ejecutarse el script) y fórmula de `sections.css` con `--w`; `--e = gated(e, c)` en el primer escenario.
  - Hecho cuando: en `reveal.spec.js`, con la cortina de Filosofía a 0,9 todas las palabras tienen opacidad
    0,18 y con el centro del texto en el centro de la ventana todas tienen 1; con la cortina de Proyectos a 0,9
    el primer escenario tiene su `clip-path` inicial, en 1440×900, 1366×600, 844×390 y móvil; sin JS las
    palabras siguen a opacidad 1.

- [ ] **T8. Revelado de titulares línea a línea.** RF-11, RF-12, RF-13, RF-14, RF-15, RF-16, RF-17
  - `data-reveal` en los 5 `h2`, `src/js/reveal.js` (pendientes, palabras, medida, máscaras, restauración),
    reglas de titulares en `motion.css`, integración en `scroll-fx.js` y promesa de fuentes desde `main.js`.
  - Hecho cuando: `reveal.spec.js` está en verde en ambos proyectos: titulares de Filosofía y Proyectos sin
    revelar con su cortina a 0,9; nº de máscaras = nº de líneas medidas justo antes (también tras cambiar a
    1100 px y a `font-size` 125 %); 6 máscaras como máximo; escalonado 80–120 ms y fin ≤ 900 ms en escritorio;
    1 máscara y ≤ 600 ms en móvil; sin animaciones nuevas al subir y bajar; HTML original tras revelar;
    nombre accesible, altura del titular y posición del siguiente elemento iguales (±1 px) antes, durante y
    después; Contacto revelado al final de página a 1440×2400.

- [ ] **T9. Estados finales: reducido, sin JS, script bloqueado o tardío, impresión y recarga.** RF-16,
  RF-18, RF-19, RF-20
  - Solo tests y los ajustes que pidan (`tests/e2e/load-states.spec.js`).
  - Hecho cuando: en verde en ambos proyectos: movimiento reducido (capas en reposo con scroll, sin marco,
    titulares y palabras finales, 0 animaciones), sin JavaScript, módulo bloqueado (pasados 2,5 s), módulo
    retrasado 3 s con la página en Servicios, impresión con una cortina a 0,5 y titulares pendientes, recarga
    a mitad de página y `/#servicios` sin animación ni `is-pending` en lo visto. Si el test de recarga o de
    ancla falla por la restauración del scroll del navegador, se para y se informa (riesgo del plan).

- [ ] **T10. Requisitos no funcionales y cierre.** RF-22, RNF estabilidad, nitidez y peso
  - `tests/e2e/spec001-rnf.spec.js`: CLS, tareas largas, axe con movimiento permitido (cortina a 0,5, menú
    cerrado y abierto) y capturas para la revisión; base de CLS de carga medida sobre el build de `5f01f29`
    en el scratchpad y anotada en el test.
  - Hecho cuando: CLS = 0 en el recorrido completo (escritorio y móvil) y CLS de carga ≤ la base; ninguna
    `longtask` > 50 ms en escritorio; axe sin infracciones; capturas generadas a 1440 px y en móvil (hero con
    p = 0 y 0,5, cada frontera a 0,5, titulares revelados, reducido, sin JS, impresión) y revisadas en
    `MEMORY.md` (incluida la nitidez de los mockups con p = 0,5); `npm run check` en verde con el incremento de
    peso de la spec dentro de +2560 B de JS y +3072 B de CSS.
