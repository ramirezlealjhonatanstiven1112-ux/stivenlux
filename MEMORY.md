# MEMORY.md — Stiven Lux
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- v1 de la landing: hero con ensamblaje de mockups (HTML/CSS/JS), filosofía, 3 proyectos conceptuales, servicios, proceso, contacto y menú de pantalla completa. Spec 000 (línea base) APROBADA por @reviewer.
- SDD montado: constitución, skill `sdd`, comandos `/sdd-*` y `/coordinator`, subagentes planner, implementer y reviewer.
- Spec 001 (hero y transiciones) IMPLEMENTADA (T1–T10, commit 2d62516) y VALIDADA con CAMBIOS NECESARIOS por 2 reviewers en paralelo. Correcciones a medio aplicar en el commit WIP 250f3cb (no se ejecutó `npm run check` sobre él). Hecho: salida del hero (`--hero-p`, `.is-leaving`), cortinas (`--c`, marco `::before` en `motion.css`), palabras (`--w`), compuerta del primer escenario, revelado de titulares (`src/js/reveal.js`), asentamiento de la carga (`settleCheck`) e impresión.
- Puerta `npm run check` (dos veces seguidas en verde en T10): 62 unitarios + 114 e2e y 40 omitidos. Peso: JS 3.966 B y CSS 10.583 B gzip = +1.730 B (máx. +2.560) y +503 B (máx. +3.072) sobre la base 5f01f29.
- T10 (`tests/e2e/spec001-rnf.spec.js`): CLS = 0 en el recorrido completo (escritorio y móvil), 0 `longtask` en escritorio, CLS de carga = base (escritorio 0,0000803 por `.nav__actions` al llegar las fuentes, igual en 5f01f29; móvil 0), axe sin infracciones con movimiento y cortina de Servicios a 0,5 (menú cerrado y abierto).
- Capturas (se regeneran en cada e2e): `test-results/capturas-spec001/{escritorio,movil}/`. Revisadas: reposo y p = 0,5 con la misma nitidez (recortes `*-front/mid/back`); cada frontera a 0,5 con el marco del tono anterior y a 1 sin marco; titulares revelados; reducido, sin JS, script bloqueado e impresión con todo final.
- Vista previa privada: https://claude.ai/artifact/UdNpou2Zkd5Ms2F4is6CgU (se regenera desde el build).
- El usuario autoriza cada commit y push. Una sesión nueva clona desde GitHub: sin push no ve el trabajo.

## Decisiones (y por qué)
- Sin framework ni GSAP: la animación son CSS más variables de scroll; ahorra unos 25 KB.
- Mockups en HTML/CSS escalados con `--u` y container queries: nítidos y sin imágenes de terceros.
- Partials en build (plugin de Vite): reutilizar pantallas sin coste en ejecución.
- AGENTS.md es la fuente de verdad; CLAUDE.md lo importa. Coordinador SDD = sesión principal (`/coordinator`).
- Playwright fijado a 1.56.1 para coincidir con el Chromium del entorno. Video del hero con Higgsfield (decisión del usuario).
- `SETTLE.quiet` = 400 ms (no 200): el salto suave de restauración o ancla deja huecos de hasta ~200 ms entre fotogramas. Tope de 1 s.

## Pendiente / bloqueos
- Correcciones de la validación de la spec 001 (vuelta 1 de 2), comprobar qué quedó hecho en 250f3cb:
  1. Filete de 1–2 px en las cortinas con DPR 1,25/1,5/2,625/3 (`motion.css` ::before); e2e con esos deviceScaleFactor.
  2. Corte de la sombra de los dispositivos en el borde inferior del hero durante la salida (`.hero` overflow: hidden), sin scroll horizontal.
  3. RF-14: revelado ≤ 900 ms desde el scroll (total ~780 ms) y test que mida arranque + fin juntos.
  4. Tests frágiles: tolerar `AbortError` en `a.finished` (spec001-rnf :94 :107 :117, hero-exit :395, load-states :255).
  5. RF-21: medir el foco de los CTA de Contacto con su cortina a 0 y 0,5. 6. plan.md:463 «200 ms» → aclarar quiet 200 en tests y SETTLE 400.
- Después: revalidar con 2 reviewers; con APROBADO, spec 001 «implementada». Luego spec 002 (microinteracciones, borrador; duda abierta: hover de Servicios en táctil).
- Número de WhatsApp (`src/config/site.js`). `og:image`, dominio y despliegue.
- Video Higgsfield: la red bloquea `upload.higgsfield.ai` y `d2ol7oe51mr4n9.cloudfront.net`. 10 créditos (solo Grok Lite a 720p). Ver `video/higgsfield/PROMPT.md`.

## Aprendizajes y errores a evitar
- `cqw` sin contenedor padre → biseles deformados. `will-change: transform` en capas animadas → mockups borrosos.
- Barra fija transparente → pisa el texto en móvil: fondo sólido según el tono. En e2e la barra es `.nav__bar`.
- Playwright 1.56: `reducedMotion` va en `contextOptions`. ESLint ignora `.claude/`. Comprobar la red antes de gastar créditos.
- `overrideSiteConfig` (e2e) reescribe `whatsapp:{number:` y `heroVideo:{mp4:` en el JS servido; falla si no encuentra el patrón.
- Proyecto `movil` = Pixel 7: ventana 412×839. Los tests leen `innerWidth/innerHeight`.
- Con progreso de salida 0 el escenario neutro es `perspective(2400px)` (RF-6).
- Cortina: el `clip-path` va a −1 px / 100 % + 1 px; en 0/100 % quedaba un filete gris en la frontera.
- Titulares serif: el área de fuente es 15–20 px más alta que la caja; medir la caja del elemento.
- Posición «alcanzada» en e2e: `Math.ceil` o un 1 % más allá del tramo (redondear deja la cortina en 0,998 y no revela).
- e2e con varios navegadores: el revelado arranca hasta ~60 ms tras el scroll; medir desde `getAnimations`.
- Sin JS no hay `requestAnimationFrame`: desplazar con `scrollTo` y leer estilos sin esperar fotogramas.
- Movimiento reducido crea transiciones de 0,01 ms en la barra: contar animaciones con `expect.poll`.
- `vite preview` responde 200 a rutas inexistentes: un 404 real se fuerza con `page.route`.
- Recarga y ancla: Chromium restaura o salta DESPUÉS del módulo, en suave, hasta ~800 ms tras DOMContentLoaded. `open()` espera al asentamiento (`loadSettled`). No estresar los tests de carga con 6 workers en 4 núcleos.
- Capturas: esperar `getAnimations().finished` (tono de la barra a medias). Las de página completa pintan la barra fija y el skip link en la posición del scroll.
- Los mockups del hero en móvil salen pixelados en las capturas headless (DPR 2,625), igual en 5f01f29 y en reposo: no es de la spec 001.

## Próximos pasos
- Nueva sesión en la rama `claude/admiring-einstein-ruy4my` → `/coordinator revisa el commit WIP de la spec 001: ejecuta npm run check, termina las correcciones y valida con el reviewer`.
