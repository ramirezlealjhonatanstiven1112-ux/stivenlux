---
name: motion-rules
description: Úsala siempre que escribas, modifiques o revises animaciones, transiciones, efectos de scroll o interacciones con el puntero en Stiven Lux (src/styles/*.css, src/js/scroll-fx.js, src/js/hero.js).
---

# Movimiento en Stiven Lux

La landing es cinematográfica, pero el movimiento nunca cuesta usabilidad, accesibilidad ni rendimiento.

## Reglas
- Solo se animan `transform`, `opacity` y `clip-path`. Nada de `top`, `width`, `height` ni `filter` pesados.
  Excepción: las transiciones de `color` y `background-color` están permitidas como microinteracciones de respuesta
  (hover de enlaces, cambio de tono de la barra). `visibility` puede acompañar a una cortina como cambio discreto.
- El estado final es el estado por defecto: las variables tienen valor de reposo (`var(--p, 1)`, `var(--e, 1)`), así sin JS o con movimiento reducido todo se ve completo.
- Las animaciones de entrada solo existen dentro de `@media (prefers-reduced-motion: no-preference)` y bajo `html.js`.
- El scroll nunca se bloquea ni se secuestra. Los efectos leen `--p`, `--e`, `--hero-p` y, en las secciones con frontera de tono (`data-curtain`), el progreso de cortina por sección `--c`, más su derivado `--w` (palabras de filosofía, que esperan a que la cortina llegue a 1). Todos los escribe `src/js/scroll-fx.js` en un único `requestAnimationFrame`, leyendo primero y escribiendo después. La cortina solo actúa sobre el fondo (`::before` detrás del contenido) y nunca recorta contenido. No añadas otro listener de scroll.
- Cualquier cálculo nuevo (progresos, umbrales, curvas) va como función pura en `src/lib/` con su test.
- Nada infinito: ni bucles, ni parpadeos, ni autoplay que se repita. El video del hero se reproduce una vez.
- Un solo momento orquestado por pantalla; el resto, microinteracciones que responden a una acción.
- En móvil, duraciones más cortas (≈ 0,6–0,75×) y menos elementos simultáneos. La inclinación con el puntero solo con `(hover: hover) and (pointer: fine)`.
- Curvas del proyecto: `--ease-out` para entradas y `--ease-in-out` para el menú.

## Checklist de revisión
- [ ] ¿Se ve todo con `prefers-reduced-motion: reduce` y sin animaciones en curso (test RF-7)?
- [ ] ¿Se ve todo con JS desactivado?
- [ ] ¿Alguna propiedad animada que no sea transform, opacity o clip-path (salvo `color` y `background-color` de respuesta)?
- [ ] ¿Algún `animation-iteration-count: infinite` o bucle en JS?
- [ ] ¿La cortina deja todo el contenido y su foco dentro del plano descubierto?
- [ ] ¿El JS sigue dentro del presupuesto (`npm run budget`)?

## Al terminar
Indica qué puntos del checklist has comprobado y cómo.
