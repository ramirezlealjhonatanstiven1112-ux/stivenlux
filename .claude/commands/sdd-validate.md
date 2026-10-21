---
description: SDD · Valida la spec RF por RF (tests + capturas de escritorio y móvil)
argument-hint: <NNN-nombre>
---
Recorre specs/$1/spec.md requisito por requisito. Usa la skill sdd. Para cada RF indica qué test lo cubre
y el resultado de ejecutarlo.

Ejecuta `npm run check`. Los RF visuales que no cubra un test, verifícalos con capturas de Playwright
a 1440 px y 390 px (y con movimiento reducido si aplica).

Si algún RF no está cubierto o falla, dilo claramente. NO arregles nada todavía.
Después comprueba los criterios de finalización y dame un veredicto: ¿la spec está cumplida?
