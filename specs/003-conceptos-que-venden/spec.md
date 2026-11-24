# Spec 003 — Conceptos que venden: restaurante, barbería y e-commerce

Estado: cerrada sin más correcciones (usuario, 2026-11-24); continúa en la spec 004

## Contexto y objetivo
Los tres proyectos conceptuales actuales (moda de lujo, tecnología B2B y servicios premium) no causan impacto
visual y no se parecen a los negocios que van a contratar a Stiven Lux. La landing debe vender: el visitante
tiene que verse reflejado en un concepto y pensar «quiero esto para mi negocio».

Esta spec sustituye los tres conceptos por tres negocios que en Colombia necesitan web y compran por los ojos:
un **restaurante**, una **barbería** y un **e-commerce de tecnología** (la tecnología es el 19,9 % de las compras
en línea en Colombia según Tiendanube, que lo atribuye a la CCCE y no indica el periodo; mide compras en línea,
no demanda de webs: https://www.tiendanube.com/co/blog/productos-mas-vendidos-en-colombia/, consultado el
2026-11-24). Cada concepto tiene su propio mundo visual y
fotografía propia generada con IA, y sigue siendo ficticio e identificado como tal.

Objetivo medible: que cada concepto muestre en su primera pantalla, sin desplazarse dentro del mockup, una
foto protagonista, el nombre de la marca, una propuesta en una frase y una acción de compra o reserva.

## Usuarios
- Dueño de un restaurante, una barbería o una tienda en línea que visita la landing desde el móvil o el
  escritorio, normalmente llegado desde redes sociales.
- Visitante con teclado o lector de pantalla.
- Visitante con movimiento reducido.
- El propietario de la marca Stiven Lux (aprueba nombres, fotos y textos).

## Historias de usuario
- HU-1. Como dueño de un restaurante, quiero ver una web de restaurante que dé hambre y lleve a reservar,
  para imaginar la mía.
- HU-2. Como dueño de una barbería, quiero ver una web con carácter que lleve a agendar cita, para imaginar
  la mía.
- HU-3. Como dueño de una tienda en línea, quiero ver una tienda que haga desear el producto y lleve al
  carrito, para imaginar la mía.
- HU-4. Como visitante, quiero saber sin dudas que son conceptos y no clientes reales.
- HU-5. Como visitante en móvil, quiero que los conceptos se vean igual de bien que en escritorio.

## Definiciones
- **Concepto**: marca ficticia creada por Stiven Lux para mostrar su trabajo. Tiene nombre, sector, paleta,
  tipografía, idea y dos pantallas (navegador de escritorio y teléfono).
- **Pantalla de concepto**: el contenido que se ve dentro de un dispositivo de mockup.
- **Primera pantalla del concepto**: lo visible dentro del mockup sin desplazamiento interno.
- **Foto de concepto**: imagen original generada con IA para un concepto, sin texto, logos ni marcas de agua.

## Requisitos funcionales

### Los tres conceptos
- RF-1: EL SISTEMA muestra exactamente tres conceptos, en este orden: restaurante, barbería y e-commerce de
  tecnología, y ya no muestra Maison Aurèle, Kairo Systems ni Halden en ninguna parte de la landing: ni en
  el texto visible, ni en los textos alternativos o `aria-label`, ni en las direcciones de los mockups, que
  pasan a ser `brasalenta.concept`, `navajayroble.concept` y `pulso.concept`.
- RF-2: EL SISTEMA muestra para cada concepto un nombre de marca ficticio (ver Dudas abiertas), su sector,
  una descripción de 2–3 frases, su tipografía, su paleta (3 colores) y su idea, igual que hoy.
- RF-3: EL SISTEMA identifica cada concepto como «Proyecto conceptual» y mantiene la nota de que las marcas
  son ficticias y no representan clientes reales.
- RF-4: EL SISTEMA no muestra en ninguna pantalla reseñas, valoraciones, testimonios, número de clientes,
  pedidos o seguidores, ni datos de contacto reales (teléfonos, direcciones, redes sociales o NIT).
- RF-5: EL SISTEMA no muestra logos ni nombres de marcas de terceros (pasarelas de pago, fabricantes,
  plataformas de reparto); los métodos de pago, si aparecen, se nombran de forma genérica.

### Restaurante
- RF-6: EL SISTEMA muestra en la primera pantalla del navegador una foto de plato a sangre sobre fondo oscuro,
  el nombre del restaurante, una propuesta en una frase y un botón «Reservar mesa».
- RF-7: EL SISTEMA muestra en el navegador, bajo la primera pantalla visible, al menos 3 platos destacados con
  foto, nombre y precio en pesos colombianos.
- RF-8: EL SISTEMA muestra en el teléfono una reserva: fecha, hora, número de personas y botón de confirmar.

### Barbería
- RF-9: EL SISTEMA muestra en la primera pantalla del navegador una foto de un corte o de un barbero
  trabajando, el nombre de la barbería, una propuesta en una frase y un botón «Agenda tu cita».
- RF-10: EL SISTEMA muestra en el navegador al menos 3 servicios con nombre, duración y precio en pesos
  colombianos.
- RF-11: EL SISTEMA muestra en el teléfono la elección de servicio y horario con al menos 4 horas disponibles.

### E-commerce de tecnología
- RF-12: EL SISTEMA muestra en la primera pantalla del navegador una foto de producto protagonista (audio o
  accesorio tecnológico), su nombre, su precio en pesos colombianos y un botón «Agregar al carrito».
- RF-13: EL SISTEMA muestra en el navegador al menos 3 productos más con foto, nombre y precio.
- RF-14: EL SISTEMA muestra en el teléfono la ficha de un producto (con precio y botón de compra) o el carrito
  (con total y botón de pago); el total solo se exige en el carrito.

### Mundo visual de cada concepto
- RF-15: EL SISTEMA da a cada concepto una paleta y una tipografía propias y distintas entre sí: restaurante
  oscuro y cálido, barbería negro y latón, e-commerce con un color vibrante sobre neutro. Dos conceptos pueden compartir familia
  tipográfica si se distinguen por peso y por mayúsculas.
- RF-16: EL SISTEMA usa en cada pantalla de concepto al menos una foto de concepto, y en total al menos 9
  fotos distintas entre los tres conceptos.
- RF-17: EL SISTEMA no usa fotos de bancos de imágenes ni de terceros: todas las fotos de concepto son
  originales generadas con IA para esta landing.

### Dónde aparecen
- RF-18: EL SISTEMA usa los nuevos conceptos en el hero (dos navegadores y un teléfono) y en la sección de
  proyectos (un navegador y un teléfono por concepto).
- RF-19: EL SISTEMA mantiene la composición, el ensamblaje y las animaciones de scroll actuales del hero y de
  la sección de proyectos; solo cambia el contenido de las pantallas y los textos de cada concepto. Excepción: entre 768
  y 864 px de ancho el escenario del hero se desplaza a la derecha para que el texto no caiga sobre el mockup.
- RF-19b: EL SISTEMA usa en el hero las mismas pantallas que en la sección de proyectos; en el hero solo se
  exige lo que piden RF-6, RF-9 y RF-12 para la primera pantalla (el contenido inferior puede quedar
  recortado).
- RF-19c: EL SISTEMA carga de inmediato las fotos del hero y con carga diferida nativa (sin depender de
  JavaScript) las de la sección de proyectos.
- RF-19d: MIENTRAS una foto de concepto no ha cargado, EL SISTEMA muestra en su lugar un color de la paleta
  del concepto, y la foto aparece sin fundido ni animación.

### Móvil, movimiento reducido y sin JavaScript
- RF-20: MIENTRAS la ventana mida 390 px de ancho, EL SISTEMA muestra en el teléfono de cada concepto una
  foto, su nombre y su botón, sin texto cortado ni solapado, con el nombre y el texto del botón a un tamaño
  final de al menos 9 px. Los navegadores son vistas reducidas: no se les exige tamaño mínimo y el teléfono
  puede tapar parte de ellos.
- RF-21: MIENTRAS el visitante prefiera movimiento reducido, EL SISTEMA muestra los conceptos en su estado
  final, sin animaciones.
- RF-22: SI no hay JavaScript, ENTONCES EL SISTEMA muestra los tres conceptos completos, con sus fotos.
- RF-23: SI una foto de concepto no carga, ENTONCES EL SISTEMA muestra en su lugar un color de fondo de la
  paleta del concepto, sin icono de imagen rota y sin mover la composición.

### Accesibilidad
- RF-24: EL SISTEMA describe cada vista previa de concepto con un texto alternativo que nombra la marca, su
  sector y que es un concepto; las fotos dentro de las pantallas son decorativas para el lector de pantalla.
- RF-25: MIENTRAS estén activos los colores forzados, EL SISTEMA oculta las fotos de concepto y deja el fondo
  del sistema, con la marca, la propuesta y el botón legibles.
- RF-26: CUANDO se imprima la página, EL SISTEMA oculta las fotos de concepto y mantiene los textos de la
  sección de proyectos.
- RF-27: EL SISTEMA mantiene para cada foto de concepto un registro con el prompt, la herramienta y la fecha
  de generación, fuera de la landing publicada; las fotos se publican sin marcas de agua visibles y sin
  metadatos EXIF ni de procedencia incrustados.

## Requisitos no funcionales
- RNF-1 Peso de fotos: cada foto de concepto ≤ 90 KB y el total ≤ 700 KB, contando solo lo que descarga un
  navegador moderno (AVIF o WebP, la variante que elija); el respaldo para navegadores antiguos no suma.
- RNF-2 Carga: las imágenes pedidas antes del primer scroll suman ≤ 200 KB, medidas con un test automático a
  1440×900 (DPR 2), 390×844 (DPR 2 y 3) y 844×390 (DPR 2); el resto se carga solo al acercarse a su sección.
- RNF-3 Estabilidad: el CLS de un recorrido completo de la página (todas las entradas de layout-shift) es
  ≤ 0,1 y no empeora respecto a la base `18cd88b`; todas las fotos tienen dimensiones reservadas.
- RNF-4 Nitidez: a 1440 px con DPR 2 ninguna foto se ve pixelada, sin servir resoluciones por encima de lo que
  necesita ese ancho; si choca con RNF-1, manda RNF-1. En móvil se verifica a mano a 390×844 con DPR 2 (las
  capturas sin interfaz del Pixel 7 pixelan los mockups también en la base).
- RNF-5 JS y CSS: dentro de la constitución (JS ≤ 15 KB, CSS ≤ 20 KB con gzip); el margen de la spec se fija
  en el plan.
- RNF-6 Accesibilidad: axe sin infracciones en escritorio y móvil; los textos de la sección de proyectos
  cumplen contraste AA. La marca y el botón sobre foto, que axe no revisa dentro de una vista previa
  `role="img"`, cumplen AA (3:1 si son texto grande), con verificación documentada.
- RNF-7 Calidad de las fotos: sin texto, logos, marcas de agua ni defectos visibles de IA (manos o caras
  deformadas, objetos fundidos); se revisa una a una antes de usarla.

## Casos límite
- Nombres de marca que coincidan con un negocio real conocido en Colombia: se descartan (ver Dudas abiertas).
- Precios: valores verosímiles en pesos colombianos, presentados como parte del concepto, nunca como oferta.
- Fotos de personas (barbería): personas generadas, no reconocibles como alguien real.
- Ventanas muy anchas (≥ 1920 px) o bajas (844×390): las fotos no se deforman ni dejan huecos.
- Colores forzados e impresión: ver RF-25 y RF-26.
- Conexión lenta: ver RF-19d.

## Fuera de alcance
- El video del hero (en pausa): se retoma después de esta spec, con la nueva composición como fotograma final.
- Páginas propias o enlaces navegables de cada concepto: siguen siendo vistas previas.
- Cambios en el resto de secciones (filosofía, servicios, proceso, contacto) y en la identidad de Stiven Lux.
- Nuevas animaciones o microinteracciones.

## Criterios de finalización
- RF-1…RF-27 cubiertos por tests de Playwright (escritorio y móvil) o, si no se pueden automatizar, por una
  verificación documentada (nitidez, calidad de las fotos y nombres).
- `npm run check` en verde y presupuesto de peso dentro de RNF-1, RNF-2 y RNF-5.
- Capturas revisadas a 1440 px y 390 px de los tres conceptos y del hero.
- El usuario aprueba nombres, fotos y textos.

## Decisiones del usuario (2026-11-08)
- Nombres: restaurante «Brasa Lenta» (cocina de fuego contemporánea), barbería «Navaja & Roble» (barbería
  clásica de autor), e-commerce «Pulso» (audio y accesorios). Búsqueda rápida: ninguno aparece como negocio
  en Colombia; existe una marca «Pulse» de tecnología en Falabella Perú (aceptado).
- Título de la sección de proyectos: «Tres negocios. Tres webs que venden.».
- Hero: navegador de atrás = restaurante, navegador del medio = e-commerce, teléfono delante = barbería.
- Fotos generadas con IA (Nano Banana en Google Flow) y un mundo visual propio por concepto.

- Revisión QA (@reviewer, 16 hallazgos): el usuario acepta en bloque todas las recomendaciones; quedan
  incorporadas en RF-1, RF-19b–d, RF-20, RF-21, RF-25–27, RNF-1–4, RNF-6 y casos límite. Renombrar las
  clases internas de los conceptos es opcional (decide el plan).

## Enmiendas tras la validación (2026-11-24, aprobadas en bloque por el usuario)
- RNF-2, RF-14, RF-15, RF-19, RF-20 y las fuentes del contexto (ver `validacion.md`).
- El usuario sustituirá después restaurante y barbería por odontología y un servicio de mantenimiento. Por eso
  no se corrige lo propio de esos dos conceptos: RF-6 a sangre, foto `barberia-hero`, fecha del restaurante,
  muestras de color y `project--flip`. Entra por `/sdd-change`; la 003 no se da por aprobada hasta entonces.

## Dudas abiertas
- Ninguna.
