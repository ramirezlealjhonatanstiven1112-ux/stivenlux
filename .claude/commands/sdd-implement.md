---
description: SDD · Implementa UNA tarea, tests primero (uso - /sdd-implement 001-nombre T3)
argument-hint: <NNN-nombre> <Tn>
---
Implementa SOLO la tarea $2 de specs/$1/tasks.md, siguiendo specs/$1/plan.md, docs/constitution.md
y la skill sdd (y mockup-screens o motion-rules si la tarea las toca).

1. Escribe primero los tests (node --test para src/lib/, Playwright para la interfaz) y comprueba que fallan.
2. Escribe el código hasta que pasen.
3. Ejecuta `npm test` y, si la tarea toca interfaz, `npm run test:e2e`. Muéstrame el resultado.
4. Si hay cambios visuales, haz capturas a 1440 px y 390 px y revísalas.
5. Marca $2 como hecha en tasks.md e indica qué RF cubre.

Después PÁRATE. No empieces la siguiente tarea.
