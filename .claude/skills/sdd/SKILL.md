---
name: sdd
description: Úsala siempre que trabajes con Spec-Driven Development en Stiven Lux (docs/constitution.md o cualquier archivo dentro de specs/) — redactar, revisar o cambiar specs, planes y tareas, o implementar y validar tareas de una spec.
---

# Spec-Driven Development (SDD) — Stiven Lux

## Flujo
Constitución → Spec → Clarificación → Plan → Tareas → Implementación → Validación → Cambio.

- Nunca pases a la siguiente fase sin la aprobación explícita del usuario.
- La spec manda: si algo no está en la spec, no se implementa. Si falta una decisión, para y pregunta.
- Un cambio de requisitos se hace primero en la spec, luego en el plan y las tareas, y por último en el código.
- Cada spec vive en su carpeta: `specs/NNN-nombre/` con `spec.md`, `plan.md` y `tasks.md` (NNN = siguiente número libre, con tres cifras).
- Taxonomía: spec-anchored. La spec se mantiene viva y describe siempre el comportamiento actual.
- Al terminar cada fase, actualiza `MEMORY.md`.

## Plantilla de spec (spec.md)
```
# Spec NNN — <Nombre>

Estado: borrador | aprobada | implementada

## Contexto y objetivo
## Usuarios
## Historias de usuario
- HU-1. Como <rol>, quiero <acción> para <beneficio>.
## Definiciones (solo si hay términos que puedan interpretarse de varias formas)
## Requisitos funcionales
## Requisitos no funcionales
## Casos límite
## Fuera de alcance
## Criterios de finalización
## Dudas abiertas
- [NECESITA ACLARACIÓN] <duda>
```
La spec describe el QUÉ y el POR QUÉ. Nada de stack, arquitectura ni nombres de archivos.
Usuarios típicos: visitante en escritorio, visitante en móvil, visitante con teclado o lector de pantalla,
visitante con movimiento reducido, y el propietario de la marca (configura WhatsApp y video).

## Requisitos en EARS (en español)
- RF-x: CUANDO <evento>, EL SISTEMA <respuesta>.
- RF-x: SI <condición no deseada>, ENTONCES EL SISTEMA <respuesta>.
- RF-x: MIENTRAS <estado>, EL SISTEMA <respuesta>.
- RF-x: EL SISTEMA <comportamiento permanente>.

Cada RF debe ser verificable: nada de «impactante», «premium», «fluido» o «bonito» sin un criterio medible
(duración en ms, ancho en px, contraste, número de elementos, estado final visible, presupuesto en KB).
Toda mejora visual incluye su RF de movimiento reducido y su RF de móvil.

## Plan (plan.md)
Archivos y responsabilidades · Funciones puras en `src/lib/` (entradas como parámetros, sin DOM) ·
Algoritmo en pseudocódigo · Interfaz en escritorio y en móvil · Movimiento (skill `motion-rules`) ·
Decisiones justificadas con su alternativa descartada · Impacto en el presupuesto de peso ·
Estrategia de tests: `node --test` para `src/lib/`, Playwright para la interfaz. Indica qué RF cubre cada parte.

## Tareas (tasks.md)
```
- [ ] **Tn. <Descripción>.** RF-x, RF-y
  - Hecho cuando: <comprobación verificable>.
```
Máximo 20–30 min por tarea, en orden de dependencia. Si salen más de 10, propón dividir la spec.

## Implementación
Una sola tarea cada vez: tests primero (en rojo), después el código, tests en verde
(`npm test` y, si toca interfaz, `npm run test:e2e`), marcar la tarea y parar.

## Validación
RF por RF: qué test lo cubre y su resultado. `npm run check` completo. Los RF visuales se revisan
además con capturas de Playwright a 1440 px y 390 px. Veredicto: APROBADO o CAMBIOS NECESARIOS.
