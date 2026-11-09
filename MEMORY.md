# MEMORY.md — Stiven Lux
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- v1 de la landing: hero con ensamblaje de mockups (HTML/CSS/JS), filosofía, 3 proyectos conceptuales, servicios, proceso, contacto y menú de pantalla completa. Spec 000 (línea base) APROBADA por @reviewer.
- SDD montado: constitución, skill `sdd`, comandos `/sdd-*` y `/coordinator`, subagentes planner, implementer y reviewer.
- Spec 001 (hero y transiciones) IMPLEMENTADA y VALIDADA (2 reviewers, 3 vueltas de correcciones), en el commit 0f6b12d.
- Spec 002 (microinteracciones de puntero): IMPLEMENTADA (T1–T10), VALIDADA (6 @reviewer, 2 vueltas de corrección) en b8d1745 y subida (2026-11-08). `npm run check` en verde: 81 unitarios y 206 e2e. Lo que difiere del plan está en plan.md, «Implementado frente al plan».
  - Base 0f6b12d = JS 3.965 B y CSS 10.731 B. Peso: JS +1.590 B (máx. +1.636: +100 B del sobrante de la 001, decisión 23) y CSS +922 B (máx. +2.048). CLS del recorrido igual que la base (0,000114 / 0,000130). `tests/e2e/fixtures/spec002-base.json` no se regenera.
  - Puerta: tareas largas y `load-states` «/#servicios» (inestables bajo carga; la base también) corren en proyectos aislados de `playwright.config.js` (decisión del usuario); `--project=escritorio` o `movil` no los incluye: añadir `--project=aislado-*`. Verificaciones 4–6 pasan (2026-11-08, navegador integrado; traducción simulada con `<font>` porque el traductor de Chrome no se lanza ni por CDP). Pendientes opcionales del usuario: portátil táctil, tableta, traducción real.
  - Checklist motion-rules: solo transform/opacity/clip-path/translate y color como respuesta (P1); un solo rAF y listener de scroll (`addFrameHook` en scroll-fx.js); sin will-change; nada infinito; todo visible sin JS y con reducido. mockup-screens: no se toca ninguna pantalla; el punto va en `body`, fuera de las capas con `cqw`.
- Capturas (se regeneran en cada e2e): `test-results/capturas-spec00{1,2}/`. 002 revisadas (1440, movil, 844×390, estrecha): barrido a medias alineado al frente, aro sin relleno sobre blanco, negro y azul, colores forzados con botón del sistema, sin hover ni punto tras tocar.
- Vista previa privada: https://claude.ai/artifact/UdNpou2Zkd5Ms2F4is6CgU (se regenera desde el build).

## Riesgos aceptados por el usuario
- Spec 001: si un visitante en móvil baja durante la entrada del hero (< 1,5 s), puede ver un borde brusco de 2–4 px en el teléfono.

## Opcionales abiertos (no bloquean)
- `::selection` global (azul y blanco, `base.css`, de la 000) es invisible sobre el botón azul en reposo; la selección existe y se copia.
- Con c = 0 el degradado vela los ~37–48 px inferiores del hero (p. ej. a 1366×600). La spec no lo describe: añadir una línea en «Casos límite» requiere la aprobación del usuario.
- Capturas: el filete de 1 px en el borde derecho del proyecto en Pixel 7 es un artefacto de la emulación (412 × 2,625 = 1081,5 px); el recorte `02-hero-p05-back` de escritorio sale vacío porque esa pantalla queda bajo la barra.
- A 844×390, al tabular al CTA del hero, quedan 5,8 px del anillo fuera de la ventana (viene de la spec 000).

## Decisiones (y por qué)
- Sin framework ni GSAP (CSS + variables de scroll, ~25 KB menos). Mockups en HTML/CSS con `--u` y container queries: nítidos y sin imágenes de terceros.
- Partials en build (plugin de Vite): reutilizar pantallas sin coste en ejecución.
- AGENTS.md es la fuente de verdad; CLAUDE.md lo importa. Coordinador SDD = sesión principal (`/coordinator`).
- Playwright fijado a 1.56.1 para coincidir con el Chromium del entorno. Video del hero con Higgsfield (decisión del usuario).
- `SETTLE.quiet` = 400 ms (no 200): el salto suave de restauración o ancla deja huecos de hasta ~200 ms entre fotogramas. Tope de 1 s.

## Aprendizajes y errores a evitar
- `cqw` sin contenedor padre → biseles deformados. `will-change: transform` en capas animadas → mockups borrosos.
- Barra fija transparente → pisa el texto en móvil: fondo sólido según el tono. En e2e la barra es `.nav__bar`.
- Playwright 1.56: `reducedMotion` va en `contextOptions`. ESLint ignora `.claude/`. Comprobar la red antes de gastar créditos.
- `overrideSiteConfig` (e2e) reescribe `whatsapp:{number:` y `heroVideo:{mp4:` en el JS servido; falla si no encuentra el patrón.
- Proyecto `movil` = Pixel 7: ventana 412×839, DPR 2,625. Los tests leen `innerWidth/innerHeight`. Sus mockups del hero salen pixelados en las capturas headless, igual en 5f01f29: no es de la spec 001.
- Cortina: el `clip-path` va a −1 px / 100 % + 1 px; en 0/100 % quedaba un filete gris en la frontera.
- Titulares serif: el área de fuente es 15–20 px más alta que la caja; medir la caja del elemento.
- Posición «alcanzada» en e2e: `Math.ceil` o un 1 % más allá del tramo (redondear deja la cortina en 0,998 y no revela). Con varios navegadores el revelado arranca hasta ~60 ms tras el scroll: medir desde `getAnimations`.
- Sin JS no hay `requestAnimationFrame`: desplazar con `scrollTo` y leer estilos sin esperar fotogramas. Movimiento reducido crea transiciones de 0,01 ms en la barra: contar animaciones con `expect.poll`.
- Base en worktree: unión `mklink /J node_modules` (en Git Bash, `MSYS_NO_PATHCONV=1 cmd /c …`); quitarla con `cmd /c rmdir` ANTES de `git worktree remove`. Sin JS el menú no abre: el `:hover` de su botón se fuerza con CDP `CSS.forcePseudoState`.
- `vite preview` responde 200 a rutas inexistentes: un 404 real se fuerza con `page.route`.
- Recarga y ancla: Chromium restaura o salta DESPUÉS del módulo, en suave, hasta ~800 ms tras DOMContentLoaded. `open()` espera al asentamiento (`loadSettled`). No estresar los tests de carga con 6 workers en 4 núcleos.
- Capturas: esperar `getAnimations().finished` (tono de la barra a medias). Las de página completa pintan la barra fija y el skip link en la posición del scroll.
- Medir el hero tras `heroEntranceDone`: con la entrada en curso el teléfono cruza el borde y el resultado depende de la carga (la spec solo regula el estado final, spec.md:288).
- Pie del hero: un degradado lineal deja un salto de 5–13 niveles por fila sobre un dispositivo oscuro junto al borde (6–9 a 844×390, 5–13 a 360×640); la curva suave (98,5 % a 4 px del borde) lo baja a ≤ 3. Lo que vive con la solapa del marco usa su mismo factor (×100000, c con 4 decimales): con ×200, en c ∈ (0,995, 1) el degradado quedaba a medio apagar (opacidad 0,12–0,98) y el salto llegaba a 225. Medir hasta la última posición entera antes de c = 1, a 844×390 y 360×640.

- Headless sin GPU con varios workers: cada fotograma dura 50–100 ms cerca del hero. Los tiempos de la 002 se miden en fotogramas (a 60 Hz) + la transición declarada, con un tope real holgado; la referencia es el `pointermove` o el evento dentro de la página, nunca antes de la llamada de Playwright.
- Con `hasTouch` Playwright vuelve grueso el puntero principal: el híbrido se emula con `PointerEvent` táctiles; el cambio de puntero, con CDP `setTouchEmulationEnabled` (`setEmulatedMedia` no cambia pointer/hover).
- Ediciones con `node -` desde Bash pierden las barras invertidas de las expresiones regulares: usar Edit para código con `\`.

## Próximos pasos
- El usuario autoriza cada commit y push. Skill `ahorro` instalada: cargarla al empezar y antes de encargar a subagentes.
- Siguiente idea: video del hero con Google Flow (spec pequeña o `/feature`).
- Siguen pendientes: número de WhatsApp (`src/config/site.js`), `og:image`, dominio, despliegue y video de Higgsfield (la red bloquea `upload.higgsfield.ai` y `d2ol7oe51mr4n9.cloudfront.net`; 10 créditos, solo Grok Lite a 720p; ver `video/higgsfield/PROMPT.md`).
