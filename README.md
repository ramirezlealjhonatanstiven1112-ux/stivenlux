# Stiven Lux

Landing page oficial de **Stiven Lux** — diseño y desarrollo web premium. *No hacemos lo de siempre.*

## Ejecutar en local

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # genera dist/
npm run preview   # sirve dist/ en http://localhost:4173
npm run lint
npm test          # tests unitarios (node --test)
npm run test:e2e  # Playwright: escritorio, móvil y accesibilidad
npm run check     # todo lo anterior + build + presupuesto de peso
```

La primera vez en tu ordenador, instala el navegador de Playwright con `npx playwright install chromium`.

## Cómo se trabaja (SDD)

Cada mejora sigue Spec-Driven Development: constitución → spec → clarificación → plan → tareas →
implementación → validación. Con Claude Code: `/coordinator` (con o sin idea) coordina a los subagentes
planner, implementer y reviewer. Detalle en `AGENTS.md` y `.claude/skills/sdd/SKILL.md`.

## Configuración pendiente

- **WhatsApp:** edita `src/config/site.js` → `whatsapp.number` (código de país + número, de 8 a 15 dígitos; se admiten espacios, guiones, paréntesis y +).
- **Video del hero (Higgsfield):** sigue `video/higgsfield/PROMPT.md` y activa `heroVideo` en `src/config/site.js`.

Más detalle en `AGENTS.md`, `MEMORY.md`, `docs/constitution.md` y `PROJECT_BRIEF.md`.
