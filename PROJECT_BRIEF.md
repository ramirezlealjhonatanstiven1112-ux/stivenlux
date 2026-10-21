# Stiven Lux — Brief del proyecto

> No existía un brief previo en el repositorio. Este documento recoge la dirección acordada con el
> cliente en la sesión de desarrollo del 21-10-2026 y los cambios respecto al plan original.

## Marca

- **Nombre:** STIVEN LUX — estudio de diseño y desarrollo web premium.
- **Eslogan:** «No hacemos lo de siempre».
- **Personalidad:** creativa, segura, directa y memorable.

## Dirección visual

- Editorial de lujo, minimalista, moderna y atrevida. Mucho espacio negativo y tipografía a gran escala.
- **Color:** negro `#000`, blanco `#FFF` y azul eléctrico `#2340FF` como acento selectivo (solo en acciones y
  señales: CTA final, relleno de botones al pasar, línea de progreso, hover de servicios).
- **Tipografía:** Instrument Serif (titulares) + Inter Tight (interfaz). JetBrains Mono solo dentro del concepto
  tecnológico. Todas autoalojadas (Fontsource, licencia OFL).
- **Mockups:** dispositivos grandes y superpuestos con perspectiva y sombras de estudio, construidos en HTML/CSS.
- **Evitar:** gradientes decorativos, tarjetas repetitivas, iconos innecesarios, botones genéricos, plantillas.

## Estructura de la landing

1. **Hero cinematográfico** — titular, texto breve, CTA a WhatsApp, CTA a proyectos y mockups que se ensamblan.
2. **Filosofía** — declaración editorial que se ilumina palabra a palabra con el scroll y tres principios.
3. **Portafolio conceptual** — Maison Aurèle (moda de lujo), Kairo Systems (tecnología), Halden (servicios
   premium). Marcas ficticias, identificadas como conceptos. Sin clientes, testimonios ni resultados inventados.
4. **Servicios** — dirección de arte, diseño a medida, desarrollo premium, landings de lanzamiento, evolución.
5. **Proceso** — estrategia, dirección visual, diseño, desarrollo y lanzamiento.
6. **Cierre** — declaración de marca y CTA a WhatsApp.

## Conversión

Todos los CTA usan `data-whatsapp` y toman el número de `src/config/site.js`.
**Pendiente:** número oficial. Sin él, los CTA llevan a `#contacto` y el build avisa.

## Video del hero — cambio de plan

| | Plan anterior | Plan vigente |
|---|---|---|
| Herramienta | HyperFrames (composición HTML renderizada) | **Higgsfield** (generación de video con IA, vía MCP) |
| Formato | 8 s · 1920×1080 · 30 fps | 8 s · 16:9 · escritorio |

Secuencia: 0–1,2 s blanco; 1,2–2,8 s la pantalla central sube; 2,8–5,2 s entran las laterales;
5,2–7 s se estabilizan; 7–8 s composición final. Sin titular ni botones dentro del video: el titular, la
navegación y los CTA son HTML encima.

**Estado:** no generado. Bloqueos y estrategia en `video/higgsfield/PROMPT.md`.
Mientras tanto, el hero usa una **alternativa web en vivo** (HTML/CSS/JS) con la misma secuencia de
ensamblaje. En móvil, con movimiento reducido o ahorro de datos se usa siempre la versión web, aunque exista
el video.

HyperFrames queda instalado solo como skills de proyecto (`.claude/skills/hyperframes*`), no se usa para
generar el video.
