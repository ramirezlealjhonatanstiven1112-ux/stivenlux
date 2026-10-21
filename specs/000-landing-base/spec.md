# Spec 000 — Landing base

Estado: implementada

> Línea base: describe el comportamiento que la landing ya tenía al adoptar SDD. Es la referencia que las
> specs siguientes amplían o cambian (spec-anchored). Sin plan.md ni tasks.md: se construyó antes del flujo SDD.

## Contexto y objetivo
Stiven Lux necesita una presencia web que demuestre con hechos lo que vende: diseño y desarrollo web premium,
hecho a medida. La landing debe impresionar, explicar la propuesta en segundos y convertir visitas en
conversaciones de WhatsApp, sin inventar clientes ni resultados.

## Usuarios
- Visitante en escritorio que evalúa al estudio.
- Visitante en móvil, que llega casi siempre desde redes o mensajería.
- Visitante con teclado, lector de pantalla o preferencia de movimiento reducido.
- Propietario de la marca, que configura el número de WhatsApp y el video del hero.

## Historias de usuario
- HU-1. Como visitante, quiero entender en segundos qué hace el estudio para decidir si sigo leyendo.
- HU-2. Como visitante, quiero ver ejemplos de su criterio para confiar en su nivel.
- HU-3. Como visitante, quiero iniciar un proyecto por WhatsApp desde cualquier punto de la página.
- HU-4. Como visitante con teclado o movimiento reducido, quiero usar la página sin barreras ni mareos.
- HU-5. Como propietario, quiero configurar el contacto y el video sin tocar el diseño.

## Definiciones
- **CTA de WhatsApp**: cualquier botón o enlace cuyo fin es iniciar una conversación de WhatsApp.
- **Número válido**: entre 8 y 15 dígitos tras eliminar espacios, guiones, paréntesis y el signo +.
- **Escena animada**: composición de mockups del hero construida con la propia web, sin video.

## Requisitos funcionales
- RF-1: EL SISTEMA mostrará al cargar el titular «No hacemos lo de siempre.», un texto que explica que el estudio diseña y desarrolla experiencias web a medida, un CTA de WhatsApp y un CTA que lleva a los proyectos.
- RF-2: CUANDO el visitante pulse un CTA de WhatsApp y exista un número válido configurado, EL SISTEMA abrirá en una pestaña nueva una conversación con ese número y el mensaje predefinido.
- RF-3: SI no hay un número válido configurado, ENTONCES EL SISTEMA llevará todos los CTA de WhatsApp a la sección de contacto, no mostrará al visitante ningún aviso técnico y advertirá al propietario al generar la web.
- RF-4: CUANDO el visitante abra el menú, EL SISTEMA lo mostrará a pantalla completa, indicará que está desplegado, pondrá el foco en el primer enlace y hará no interactivo el resto de la página.
- RF-5: CUANDO el menú esté abierto y el visitante pulse Escape, EL SISTEMA lo cerrará y devolverá el foco al botón del menú; CUANDO pulse un enlace del menú, EL SISTEMA lo cerrará y llevará a la sección elegida.
- RF-6: EL SISTEMA presentará exactamente tres proyectos (moda de lujo, tecnología y servicios premium), cada uno identificado como «Proyecto conceptual», e indicará que las marcas son ficticias y no representan clientes reales.
- RF-7: MIENTRAS el visitante prefiera movimiento reducido, EL SISTEMA no ejecutará animaciones y mostrará cada elemento en su estado final.
- RF-8: EL SISTEMA no generará desplazamiento horizontal con anchos de ventana entre 320 y 1920 px.
- RF-9: EL SISTEMA no tendrá infracciones de accesibilidad WCAG 2.2 A/AA detectables de forma automática, en escritorio y en móvil, con el menú cerrado y abierto.
- RF-10: MIENTRAS haya un video del hero configurado y el visitante esté en escritorio, sin ahorro de datos ni movimiento reducido, EL SISTEMA reproducirá el video una sola vez y sin sonido en lugar de la escena animada; SI el video no puede reproducirse, ENTONCES EL SISTEMA mostrará la escena animada.
- RF-11: EL SISTEMA cargará y se podrá recorrer de principio a fin sin errores en la consola.
- RF-12: CUANDO la barra de navegación quede sobre una sección oscura, EL SISTEMA la mostrará en tono oscuro con texto claro; CUANDO quede sobre una sección clara, en tono claro con texto oscuro.

## Requisitos no funcionales
- Peso: JavaScript ≤ 15 KB y CSS ≤ 20 KB comprimidos con gzip, sin contar fuentes.
- Sin JavaScript, todo el contenido es visible y los CTA funcionan.
- La secuencia de entrada del hero termina en ≤ 2,6 s en escritorio y es más corta en móvil.
- En móvil, el hero tiene una composición propia (texto primero, dos dispositivos), no un recorte del escritorio.
- Interfaz en español.

## Casos límite
- Las fuentes tardan: la secuencia del hero empieza como máximo a 1,2 s (a 2,5 s si falla el script principal).
- Número con formato (+57 300-123 4567): se normaliza a dígitos. Número demasiado corto o largo: se trata como ausente.
- Video configurado pero inexistente o bloqueado: se muestra la escena animada sin errores.
- Sin JavaScript: el menú desplegable no está disponible; la barra conserva la marca y el CTA de escritorio.

## Fuera de alcance
- El video real del hero (bloqueado por red; ver video/higgsfield/PROMPT.md).
- Formularios, analítica, multidioma, imagen para redes (og:image) y despliegue.

## Criterios de finalización
- Todos los RF cubiertos por un test en verde dentro de `npm run check`, o por una verificación documentada.
- Revisión visual a 1440 px y 390 px sin solapamientos ni recortes.
- RF-3 (aviso al propietario): se verifica con los tests unitarios de `whatsappBuildWarning` (`src/lib/whatsapp.js`) y en la salida de `npm run build`, que muestra el aviso tanto con el número vacío (sin configurar) como con un número inválido.

## Dudas abiertas
- Ninguna. El número de WhatsApp y el video son configuración pendiente, no dudas de la spec.
