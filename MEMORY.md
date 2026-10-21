# MEMORY.md — Stiven Lux
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- v1 de la landing funcionando: hero con ensamblaje de mockups (HTML/CSS/JS), filosofía, 3 proyectos conceptuales, servicios, proceso, contacto y menú de pantalla completa.
- SDD montado: constitución, skill `sdd`, comandos `/sdd-*` y `/coordinator`, subagentes planner, implementer y reviewer.
- Spec 000 (línea base): APROBADA por @reviewer tras 3 vueltas (la 3.ª autorizada por el usuario). Hero termina en 2,56 s (escritorio) y 2,035 s (móvil, capas a 0,675 s = 0,75×).
- RF-3: el build avisa con `whatsappBuildWarning()` (src/lib/whatsapp.js), misma validación que el navegador; distingue número vacío e inválido.
- Puerta `npm run check`: 16 tests unitarios + 23 e2e y 3 omitidos (escritorio y móvil, axe) + presupuesto (JS 2,2 KB y CSS 9,8 KB gzip).
- Vista previa privada: https://claude.ai/artifact/UdNpou2Zkd5Ms2F4is6CgU (se regenera desde el build).
- El usuario autoriza cada commit y push. Una sesión nueva clona desde GitHub: sin push no ve el trabajo.

## Decisiones (y por qué)
- Sin framework ni GSAP: la animación son CSS más variables de scroll; ahorra unos 25 KB.
- Mockups en HTML/CSS escalados con `--u` y container queries: nítidos y sin imágenes de terceros.
- Partials en build (plugin de Vite): reutilizar pantallas sin coste en ejecución.
- AGENTS.md es la fuente de verdad; CLAUDE.md lo importa, así sirve para cualquier agente.
- Coordinador SDD = sesión principal (`/coordinator`), porque en Claude Code un subagente no lanza otros.
- Playwright fijado a 1.56.1 para coincidir con el Chromium del entorno.
- El video del hero se genera con Higgsfield (decisión del usuario), no con HyperFrames.

## Pendiente / bloqueos
- Número de WhatsApp (`src/config/site.js`).
- Video Higgsfield: la red bloquea `upload.higgsfield.ai` y `d2ol7oe51mr4n9.cloudfront.net`. Hay 10 créditos (solo cabe Grok Lite a 720p). Ver `video/higgsfield/PROMPT.md`.
- `og:image`, dominio definitivo y despliegue.

## Aprendizajes y errores a evitar
- `cqw` sin contenedor padre → biseles deformados.
- `will-change: transform` en capas animadas → mockups borrosos.
- Barra fija transparente → pisa el texto en móvil: fondo sólido según el tono.
- En Playwright 1.56 `reducedMotion` va dentro de `contextOptions`; como opción suelta se ignora.
- ESLint debe ignorar `.claude/` (scripts de skills de terceros).
- Comprobar la red antes de gastar créditos en servicios externos.
- Casos de configuración en e2e: `overrideSiteConfig` reescribe `whatsapp:{number:` y `heroVideo:{mp4:` en el JS servido; falla si no encuentra el patrón.
- Avisos de build: la decisión va en una función pura de `src/lib/` con tests; el plugin de Vite solo la llama.
- `vite preview` responde 200 con el HTML a rutas inexistentes: para probar un 404 real hay que forzarlo con `page.route`.

## Próximos pasos
- Spec 001: mejora de la landing. En una sesión nueva: `/coordinator` → @planner entrevista (máx. 5 preguntas, de una en una).
