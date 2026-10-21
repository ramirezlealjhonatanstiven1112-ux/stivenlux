---
description: SDD · Genera el plan técnico de una spec aprobada
argument-hint: <NNN-nombre>
---
Lee docs/constitution.md, AGENTS.md y specs/$1/spec.md. Usa la skill sdd. NO escribas código.

Genera specs/$1/plan.md con: archivos que se crean o modifican y la responsabilidad de cada uno,
funciones puras en src/lib/ (entradas como parámetros, sin DOM), algoritmo en pseudocódigo, cómo se ve
en escritorio y en móvil, cómo se comporta con movimiento reducido (skill motion-rules), pantallas
afectadas (skill mockup-screens), decisiones técnicas justificadas (con su alternativa descartada),
impacto en el presupuesto de peso y estrategia de tests (node --test y Playwright).

Todo debe respetar la constitución y cubrir todos los RF. Marca qué RF cubre cada parte.
Si la spec no está aprobada o tiene dudas abiertas, para y avísame.
