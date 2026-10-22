# MEMORY.md — Stiven Lux
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- v1 de la landing: hero con ensamblaje de mockups (HTML/CSS/JS), filosofía, 3 proyectos conceptuales, servicios, proceso, contacto y menú de pantalla completa. Spec 000 (línea base) APROBADA por @reviewer.
- SDD montado: constitución, skill `sdd`, comandos `/sdd-*` y `/coordinator`, subagentes planner, implementer y reviewer.
- Spec 001 (hero y transiciones) IMPLEMENTADA y VALIDADA: APROBADO por 2 reviewers tras 3 vueltas de correcciones (la 3.ª, autorizada por el usuario); spec.md en «implementada». T1–T10 en 2d62516; vuelta 1 en WIP 250f3cb..f08adf0 (filete con DPR fraccionario, pie del hero, RF-14 ≤ 900 ms, `AbortError` tolerado, foco de Contacto, SETTLE 400).
- PENDIENTE DE COMMIT desde f08adf0: la espera a `heroEntranceDone` del test HU-1, la vuelta 2 (degradado `.philosophy::after` suave; HU-1 con c 0,95/0,98 y ventanas 1366×600 y 844×390), la vuelta 3 (opacidad del degradado ×100000, como `--fx`; HU-1 mide la última posición antes de c = 1), plan.md, spec.md y MEMORY.md. Además, una línea de package-lock.json que solo alinea el lockfile con package.json: el usuario decide si la incluye.
- Puerta `npm run check` en verde dos veces (vuelta 3): 62 unitarios; e2e 126 pasan, 46 omitidos, 0 fallan. Peso gzip: JS 3.965 B (+1.729, máx. +2.560) y CSS 10.731 B (+651, máx. +3.072) sobre la base 5f01f29.
- Capturas (se regeneran en cada e2e): `test-results/capturas-spec001/{escritorio,movil}/`. Revisadas: reposo y p = 0,5 con la misma nitidez (recortes `*-front/mid/back`); cada frontera a 0,5 con el marco del tono anterior y a 1 sin marco; titulares revelados; reducido, sin JS, script bloqueado e impresión con todo final.
- Vista previa privada: https://claude.ai/artifact/UdNpou2Zkd5Ms2F4is6CgU (se regenera desde el build).

## Riesgos aceptados por el usuario
- Spec 001: si un visitante en móvil baja durante la entrada del hero (< 1,5 s), puede ver un borde brusco de 2–4 px en el teléfono.

## Opcionales abiertos (no bloquean)
- Con c = 0 el degradado vela los ~37–48 px inferiores del hero (p. ej. a 1366×600). La spec no lo describe: añadir una línea en «Casos límite» requiere la aprobación del usuario.
- Capturas: el filete de 1 px en el borde derecho del proyecto en Pixel 7 es un artefacto de la emulación (412 × 2,625 = 1081,5 px); el recorte `02-hero-p05-back` de escritorio sale vacío porque esa pantalla queda bajo la barra.
- A 844×390, al tabular al CTA del hero, quedan 5,8 px del anillo fuera de la ventana (viene de la spec 000).
- `animationsDone` devuelve sin error a los 5 s. tasks.md no recoge las vueltas de corrección.

## Decisiones (y por qué)
- Sin framework ni GSAP: la animación son CSS más variables de scroll; ahorra unos 25 KB.
- Mockups en HTML/CSS escalados con `--u` y container queries: nítidos y sin imágenes de terceros.
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
- Con progreso de salida 0 el escenario neutro es `perspective(2400px)` (RF-6).
- Cortina: el `clip-path` va a −1 px / 100 % + 1 px; en 0/100 % quedaba un filete gris en la frontera.
- Titulares serif: el área de fuente es 15–20 px más alta que la caja; medir la caja del elemento.
- Posición «alcanzada» en e2e: `Math.ceil` o un 1 % más allá del tramo (redondear deja la cortina en 0,998 y no revela). Con varios navegadores el revelado arranca hasta ~60 ms tras el scroll: medir desde `getAnimations`.
- Sin JS no hay `requestAnimationFrame`: desplazar con `scrollTo` y leer estilos sin esperar fotogramas. Movimiento reducido crea transiciones de 0,01 ms en la barra: contar animaciones con `expect.poll`.
- `vite preview` responde 200 a rutas inexistentes: un 404 real se fuerza con `page.route`.
- Recarga y ancla: Chromium restaura o salta DESPUÉS del módulo, en suave, hasta ~800 ms tras DOMContentLoaded. `open()` espera al asentamiento (`loadSettled`). No estresar los tests de carga con 6 workers en 4 núcleos.
- Capturas: esperar `getAnimations().finished` (tono de la barra a medias). Las de página completa pintan la barra fija y el skip link en la posición del scroll.
- Medir el hero tras `heroEntranceDone`: con la entrada en curso el teléfono cruza el borde y el resultado depende de la carga (la spec solo regula el estado final, spec.md:288).
- Pie del hero: un degradado lineal deja un salto de 5–13 niveles por fila sobre un dispositivo oscuro junto al borde (6–9 a 844×390, 5–13 a 360×640); la curva suave (98,5 % a 4 px del borde) lo baja a ≤ 3. Lo que vive con la solapa del marco usa su mismo factor (×100000, c con 4 decimales): con ×200, en c ∈ (0,995, 1) el degradado quedaba a medio apagar (opacidad 0,12–0,98) y el salto llegaba a 225. Medir hasta la última posición entera antes de c = 1, a 844×390 y 360×640.

## Próximos pasos
- Commit (y push) de la spec 001 cuando lo autorice el usuario. Él autoriza cada commit y push; una sesión nueva clona desde GitHub: sin push no ve el trabajo.
- Después, spec 002 (microinteracciones, en borrador; duda abierta: el hover de Servicios en táctil).
- Siguen pendientes: número de WhatsApp (`src/config/site.js`), `og:image`, dominio, despliegue y video de Higgsfield (la red bloquea `upload.higgsfield.ai` y `d2ol7oe51mr4n9.cloudfront.net`; 10 créditos, solo Grok Lite a 720p; ver `video/higgsfield/PROMPT.md`).
