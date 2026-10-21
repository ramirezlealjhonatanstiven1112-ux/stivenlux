# Constitución — Stiven Lux

Principios innegociables. Toda spec, plan y tarea debe cumplirlos.

1. **Simplicidad primero**: Vite + HTML/CSS/JS sin framework. Ninguna dependencia de ejecución nueva sin aprobación; las de desarrollo, solo para tests o build.
2. **La spec manda**: nada se implementa si no está en la spec activa aprobada. Si falta una decisión, se para y se pregunta.
3. **Lógica separada de interfaz**: los cálculos (progreso de scroll, enlaces, decisiones de carga) son funciones puras en `src/lib/`, sin DOM, con sus entradas como parámetros.
4. **Tests como puerta**: lógica con `node --test`; interfaz con Playwright en escritorio y móvil, con axe sin infracciones. Prohibido avanzar con `npm run check` en rojo.
5. **Verdad de marca**: los proyectos conceptuales se identifican siempre como ficticios; nada de clientes, testimonios, métricas ni contactos inventados. WhatsApp y video solo desde `src/config/site.js`.
6. **Premium y accesible**: WCAG 2.2 AA, `prefers-reduced-motion` respetado, sin scroll secuestrado ni animaciones infinitas, móvil diseñado aparte, JS ≤ 15 KB y CSS ≤ 20 KB con gzip. Idioma: código en inglés; interfaz y documentación en español.
