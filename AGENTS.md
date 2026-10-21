# AGENTS.md — Stiven Lux
Landing oficial de Stiven Lux, estudio de diseño y desarrollo web premium («No hacemos lo de siempre»). Objetivo: que marcas que quieren destacar inicien un proyecto por WhatsApp.

## Stack y estructura
- Vite 8 + HTML/CSS/JS sin framework. Node ≥ 20.
- `index.html` monta `src/partials/` con `<include src="…" clave="valor">` (plugin propio en `vite.config.js`).
- `src/lib/` lógica pura con tests · `src/js/` solo DOM y eventos · `src/styles/` estilos por capa · `src/config/site.js` datos de marca (WhatsApp, video).
- `docs/constitution.md` principios · `specs/NNN-nombre/` spec, plan y tareas · `tests/unit` (node --test) · `tests/e2e` (Playwright).
- `PROJECT_BRIEF.md` dirección de marca · `video/higgsfield/` referencia, prompt y posproceso del video del hero.

## Comandos
- `npm run dev` · `npm run build` · `npm run preview` · `npm run lint`
- `npm test` (unitarios) · `npm run test:e2e` (escritorio + móvil + axe) · `npm run budget` (peso)
- `npm run check`: lint + test + build + budget + e2e. Es la puerta: nada se da por hecho en rojo.

## Convenciones
- Identificadores en inglés; interfaz, comentarios y documentación en español.
- Cálculos en `src/lib/` con sus entradas como parámetros; `src/js/` solo los conecta al DOM.
- Pantallas de mockup: skill `mockup-screens`. Movimiento y scroll: skill `motion-rules`.

## Trampas conocidas
- Los proyectos del portafolio son conceptos ficticios, siempre identificados: nunca clientes, testimonios ni métricas inventadas.
- WhatsApp y video solo salen de `src/config/site.js`; si faltan, quedan pendientes, nunca se inventan.
- Una capa con dispositivos sin `container-type: inline-size` resuelve los `cqw` contra el viewport.
- Sin JS todo es visible; las animaciones solo existen con `html.js` y fuera de `prefers-reduced-motion`.

## Forma de trabajar (SDD)
- Antes de tocar código: `docs/constitution.md`, `MEMORY.md` y la spec activa (`specs/NNN-*/`).
- Al abrir sesión: `/coordinator` (continúa donde quedó) o `/coordinator <idea>` (con @planner, @implementer, @reviewer). Fase a fase: `/sdd-*`. Cambio pequeño: `/feature`.
- Nunca pases de fase sin aprobación explícita del usuario.

## Límites
- ✅ Siempre: `npm run check` antes de dar algo por terminado; actualizar `MEMORY.md` al terminar cada tarea.
- ⚠️ Pregunta antes: dependencias nuevas, archivos fuera de la spec, cambios de identidad visual, gastar créditos de Higgsfield.
- 🚫 Nunca: commit o push sin autorización, secretos en el repo, editar skills de terceros en `.claude/skills/`, datos inventados.

## Verificación
- `npm run check` en verde y revisión visual con capturas a 1440 px y 390 px.

## Memoria
- Al empezar, lee `MEMORY.md`; al terminar, actualízalo (estado, decisiones con su porqué, errores a evitar).
- Máximo ~50 líneas. Lo que sea regla permanente se propone para este archivo. Nunca datos sensibles.
