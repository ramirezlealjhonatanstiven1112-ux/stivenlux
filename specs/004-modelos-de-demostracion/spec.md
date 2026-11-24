# Spec 004 — Modelos de demostración navegables

Estado: implementada, publicada y aprobada por el usuario en su móvil (2026-11-24)

## Objetivo
Que el visitante pueda entrar y usar webs reales hechas por Stiven Lux, no solo ver mockups. Se presentan como
«Modelos de demostración»: negocios ficticios, sin clientes ni datos inventados como reales.
Sustituye el cambio de sectores anunciado en la spec 003.

## Sectores
1. Odontología. 2. Servicio de mantenimiento (tipo por concretar). 3. E-commerce de tecnología («Pulso»).

## Requisitos
- RF-1: CUANDO el visitante pulsa «Explorar demo» en un proyecto, EL SISTEMA abre esa web en una URL propia
  (`/demos/<nombre>/`).
- RF-2: EL SISTEMA muestra en toda página de demo un aviso visible «Modelo de demostración · negocio ficticio» y un
  enlace para volver a Stiven Lux y pedir una web similar.
- RF-3: Odontología: inicio, tratamientos y cita en pasos (servicio, fecha, hora y confirmación simulada).
- RF-4: Mantenimiento: inicio, servicios y solicitud de visita en pasos (servicio, fecha y confirmación simulada).
- RF-5: Pulso: catálogo con filtro, ficha de producto, carrito (agregar, cambiar cantidad, quitar y total) y cierre
  de compra simulado.
- RF-6: EL SISTEMA no envía ni guarda datos personales, no cobra, y la confirmación dice que es una simulación.
  El carrito puede guardarse solo en el navegador.
- RF-7: EL SISTEMA no muestra testimonios, métricas, direcciones, teléfonos ni credenciales profesionales
  inventados, ni promesas médicas.
- RF-8: Los mockups del hero y de proyectos muestran la apariencia de las demos actuales, y cada proyecto lleva
  «Explorar demo»; desaparecen los conceptos de restaurante y barbería.
- RF-9: Cada demo se usa completa en móvil y escritorio, con teclado y con movimiento reducido. Sin JavaScript se
  lee el contenido.
- RF-10: Las páginas de demo llevan `noindex`, para que no parezcan negocios reales en buscadores.

## Límites
- Mismo proyecto (Vite multipágina, sin framework ni dependencias nuevas); cálculos del carrito y la cita en `src/lib/`.
- JS y CSS por página dentro de la constitución; la portada no carga código de las demos.
- Cada demo: 3–4 vistas. Sin panel, cuentas, pagos, correo ni base de datos.

## Fuera de alcance
Videos de Higgsfield (después, con las demos como material) y dominio propio.

## Terminado
Las tres demos se recorren de principio a fin en la web publicada, la puerta pasa y el usuario las aprueba en su móvil.

## Decisiones aprobadas
1. Orden: Pulso, odontología y mantenimiento, con una revisión visual del usuario tras cada una.
2. Mantenimiento de qué: aires acondicionados (agendar visita se entiende al instante).
3. Nombres: proponer al empezar cada demo, tras buscar coincidencias con negocios reales.
4. Fotos: Flow a 0 créditos, aprobadas por el usuario.
5. Despliegue: Vercel con dirección gratuita; requiere permiso antes de publicar.

## Tareas
- [x] T1. Demo Pulso (RF-1, 2, 5, 6, 7, 9, 10) y enlace desde su proyecto. Revisión visual del usuario.
- [x] T2. Demo odontología (RF-3). Revisión visual del usuario.
- [x] T3. Demo mantenimiento de aires acondicionados (RF-4). Revisión visual del usuario.
- [x] T4. Hero y proyectos con las demos (RF-8).
- [x] T5. Puerta, un @reviewer y publicación con permiso.
