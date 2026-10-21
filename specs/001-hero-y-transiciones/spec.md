# Spec 001 — Hero cinematográfico y transiciones de scroll

Estado: aprobada

> Amplía la spec 000 (línea base). Todo lo que la spec 000 exige se sigue cumpliendo (RF-22).
> Las microinteracciones de puntero (cursor complementario, botones magnéticos y hovers) se tratan en la
> spec 002; las dos specs comparten el presupuesto de peso (ver requisitos no funcionales).

## Contexto y objetivo
La landing ya impresiona en los primeros 2,6 s, cuando los mockups se ensamblan. Después, el movimiento
desaparece: al bajar, el hero se va sin intención y las secciones cambian de blanco a negro con un corte
seco. Para un estudio que vende «No hacemos lo de siempre», la propia web debe demostrar ese criterio en el
recorrido, sin pagarlo en rendimiento ni en accesibilidad.

Objetivo: convertir el paso del hero a la filosofía en un momento ligado al scroll, dar a los cambios de
tono entre secciones un ritmo de montaje («marco que se abre») y revelar los titulares de sección una sola
vez, con un solo momento dominante por pantalla. Nada de esto alarga la entrada del hero, fija la página,
recorta contenido ni excluye a quien navega con teclado, en táctil o con movimiento reducido.

## Usuarios
- Visitante en escritorio con ratón o trackpad, que evalúa al estudio.
- Visitante en móvil (táctil), que llega desde redes o mensajería.
- Visitante con teclado, lector de pantalla o lupa.
- Visitante con preferencia de movimiento reducido.

## Historias de usuario
- HU-1. Como visitante en escritorio, quiero que al bajar desde el hero la composición reaccione con
  profundidad para sentir que la web está dirigida y no es una plantilla.
- HU-2. Como visitante, quiero que los cambios entre secciones claras y oscuras tengan ritmo para que el
  recorrido se lea como una sola pieza.
- HU-3. Como visitante en móvil, quiero una versión más breve y ligera de estos gestos para que la página
  siga siendo rápida y cómoda con el pulgar.
- HU-4. Como visitante con teclado, lector de pantalla o movimiento reducido, quiero usar la página igual
  que antes, sin mareos, sin recortes y sin perder el foco.

## Definiciones
- **Escritorio / móvil**: ventana de 768 px de ancho o más / de menos de 768 px. Solo cuenta el ancho (una
  ventana de 844×390 es de escritorio). Las comprobaciones de móvil se hacen con la ventana del proyecto
  móvil de las pruebas de interfaz (Pixel 7, 412×915) y las de escritorio a 1440×900, salvo que se indique.
- **Alto de la ventana**: el alto visible actual de la ventana. En móvil puede variar cuando el navegador
  muestra u oculta sus barras; los estados de esta spec se recalculan con el nuevo alto.
- **Puntero fino**: el puntero principal admite hover y es preciso (ratón o trackpad).
- **Movimiento permitido**: el visitante no prefiere movimiento reducido y el script principal de la página
  ya se ha ejecutado.
- **Composición de reposo del hero**: la composición con la que termina la entrada del hero, sin inclinación.
- **Progreso de salida**: desplazamiento vertical de la página dividido por el alto de la ventana, limitado
  a 1 (0 arriba del todo).
- **Desplazamiento de un dispositivo**: distancia entre el centro del dispositivo y el centro que tiene en la
  composición de reposo, ambos medidos respecto a la caja del hero (no respecto a la ventana).
- **Frontera de tono**: paso de una sección clara a una oscura o al revés. Hay exactamente 5: inicio→filosofía,
  filosofía→proyectos, proyectos→servicios, servicios→proceso y proceso→contacto (contacto y el pie son
  ambos oscuros: no hay frontera).
- **Cortina («marco que se abre»)**: el fondo de la sección entrante aparece como un plano enmarcado que se
  ensancha hasta ocupar toda la sección, como ya se abren los escenarios del portafolio. La cortina solo
  actúa sobre el fondo: el contenido de la sección (textos, botones, escenarios) nunca se recorta ni se
  oculta. En la franja aún sin descubrir se ve el fondo de la sección anterior.
- **Progreso de cortina**: 0 cuando el borde superior de la sección asoma por el borde inferior de la ventana
  y 1 cuando ese borde ha subido el 60 % del alto de la ventana en escritorio o el 40 % en móvil. Si la
  página termina antes (ventanas muy altas), avanza de forma lineal entre el inicio de ese tramo y el final
  del scroll disponible, donde vale 1.
- **Titulares de sección**: los titulares principales de Filosofía, Proyectos, Servicios, Proceso y
  Contacto (5). El titular del hero no se incluye: ya tiene su propio revelado.
- **Líneas de un titular**: los renglones en que el navegador corta el texto del titular en el momento en
  que empieza su revelado, con el ancho de la ventana, el tamaño de texto y las tipografías de ese momento.
  Un salto de línea forzado (hoy, solo en Proyectos) también corta línea.
- **Visto al ejecutarse el script**: sección o titular que, en el momento en que se ejecuta el script
  principal, tiene al menos 1 px dentro de la ventana o está por encima de ella.

## Requisitos funcionales

### Salida del hero
- RF-1: MIENTRAS el progreso de salida valga 0, la entrada del hero haya terminado y el puntero no se haya
  movido desde la carga (en las pruebas, sin eventos de ratón), EL SISTEMA mostrará la composición de reposo, con una tolerancia de 1 px en la posición de
  cada dispositivo.
- RF-2: MIENTRAS el movimiento esté permitido, la ventana sea de escritorio y no se muestre el video del hero
  (RF-10 de la spec 000), CUANDO aumente el progreso de salida, EL SISTEMA separará los tres dispositivos en
  profundidad de forma continua: la pantalla del fondo se aleja, el teléfono avanza y la distancia entre los
  centros de cada par de dispositivos crece respecto al reposo. Con progreso 1, las escalas estarán en
  estos rangos (la columna de alto menor de 500 px manda sobre la otra) y el desplazamiento de cada
  dispositivo será como máximo el 30 % del alto de la ventana:

  | Dispositivo        | Alto de ventana ≥ 500 px | Alto de ventana < 500 px |
  |--------------------|--------------------------|--------------------------|
  | Pantalla del fondo | 0,82 – 0,90              | 0,91 – 0,95              |
  | Pantalla intermedia| 0,92 – 1,02              | 0,96 – 1,01              |
  | Teléfono           | 1,08 – 1,15              | 1,04 – 1,075             |

  Con progreso 0,5, la variación de escala (|1 − escala|) y el desplazamiento de cada dispositivo estarán
  entre el 35 % y el 65 % de sus valores con progreso 1 (si un valor es 0 con progreso 1, también con 0,5).
- RF-3: MIENTRAS el movimiento esté permitido y la ventana sea móvil, EL SISTEMA aplicará la misma separación
  a los dos dispositivos de la composición móvil, más contenida: con progreso 1, la pantalla del fondo
  tendrá una escala de entre 0,93 y 0,96, el teléfono de entre 1,03 y 1,07, y el desplazamiento de cada uno
  será como máximo el 15 % del alto de la ventana. Con alto de ventana menor de 500 px, la pantalla del fondo
  tendrá una escala de entre 0,965 y 0,98 y el teléfono de entre 1,015 y 1,035. La regla de progreso 0,5 de
  RF-2 también se aplica.
- RF-4: EL SISTEMA calculará la salida solo a partir de la posición del scroll: la misma posición da siempre
  el mismo estado, al bajar y al subir, y al volver arriba se recupera la composición de reposo (RF-1).
- RF-5: MIENTRAS el titular, la entradilla o los CTA del hero tengan su centro dentro de la ventana y por
  debajo de la barra de navegación, con cualquier progreso de salida, EL SISTEMA los dibujará por encima de
  los dispositivos: el elemento que el navegador encuentra en el centro de cada uno de ellos es ese mismo
  elemento (o uno de sus descendientes), y pulsar el centro de un CTA lo activa. Que los dispositivos salgan
  del encuadre por los bordes de la ventana es intencionado.
- RF-6: MIENTRAS el progreso de salida valga 0, EL SISTEMA mantendrá la inclinación con el puntero que ya
  existe (solo escritorio, con puntero fino y movimiento permitido). CUANDO el progreso de salida pase de 0,
  EL SISTEMA dejará de inclinar la escena y la llevará a neutro en 600 ms como máximo; CUANDO vuelva a 0, la
  inclinación se reanudará con el siguiente movimiento del puntero. Pasados esos 600 ms, inclinación y
  salida nunca se combinan.

### Cortinas entre secciones
- RF-7: MIENTRAS el movimiento esté permitido, EL SISTEMA abrirá con una cortina el fondo de la sección
  entrante en cada una de las 5 fronteras de tono, de forma continua y monótona con su progreso de cortina y
  solo a partir de la posición del scroll (reversible). La cortina sigue el scroll siempre, también en las
  secciones vistas al ejecutarse el script: al subir por encima de su tramo vuelve a cerrarse y al bajar se
  abre de nuevo, tantas veces como se recorra. Con progreso 0, la franja sin descubrir de cada lado
  mide el margen interior propio de esa sección en ese lado menos 8 px (reserva para el indicador de foco),
  nunca menos de 0 (en Proyectos, sin margen lateral, no hay franja lateral); con progreso 0,5, entre el
  35 % y el 65 % de esa medida; con progreso 1, no queda franja.
- RF-8: MIENTRAS una cortina esté en curso, EL SISTEMA mostrará en la franja sin descubrir el fondo de la
  sección anterior (blanco o negro), de modo que la frontera se percibe en ambos sentidos.
- RF-9: EL SISTEMA no recortará ni ocultará con una cortina ningún contenido: con cualquier progreso de
  cortina, la caja de cada texto y de cada elemento pulsable de la sección queda dentro de su plano de fondo
  ya descubierto (tolerancia de 1 px), así que conserva el contraste de hoy, su foco, su selección y su
  lectura. Los escenarios de Proyectos, que tienen fondo propio y van a sangre en móvil, quedan fuera de
  esta comprobación: por RF-13 solo empiezan a abrirse con la cortina de Proyectos ya en 1.
- RF-10: EL SISTEMA no fijará ninguna sección ni añadirá recorrido: la altura desplazable total de la página
  será la misma que con movimiento reducido en la misma ventana (tolerancia de 1 px), en escritorio y en
  móvil.
- RF-11: CUANDO el scroll llegue al final de la página, EL SISTEMA mostrará la cortina de Contacto en 1 y, si
  su titular está dentro de la ventana, revelado o revelándose, también en ventanas en las que la página no
  da recorrido suficiente.

### Un momento dominante por pantalla
- RF-12: MIENTRAS la cortina de Filosofía no haya llegado a 1, EL SISTEMA mantendrá su titular sin revelar y
  todas las palabras del texto de filosofía en su opacidad mínima de hoy. Cambio declarado respecto a la
  spec 000: la iluminación por palabras (ligada al scroll y reversible, como hoy) empieza cuando la cortina
  llega a 1 y deja todas las palabras en opacidad completa, como muy tarde, cuando el centro del texto
  alcanza el centro de la ventana. Si Filosofía fue vista al ejecutarse el script, su titular queda en
  estado final (RF-16) y sus palabras siguen durante toda la carga la regla ligada al scroll de la spec 000;
  su cortina sigue el scroll como las demás (RF-7).
- RF-13: MIENTRAS la cortina de Proyectos no haya llegado a 1, EL SISTEMA mantendrá el primer escenario de
  proyecto en su estado inicial, sin empezar a abrirse, y su titular sin revelar si no fue visto al
  ejecutarse el script. Como la cortina siempre sigue el scroll (RF-7), la condición sobre el escenario se
  aplica en cualquier carga. Comprobado a 1440×900, 1366×600, 844×390 y en el proyecto móvil.

### Revelado de titulares de sección
- RF-14: MIENTRAS el movimiento esté permitido y la ventana sea de escritorio, CUANDO un titular de sección
  aún no revelado, que no fuera visto al ejecutarse el script, tenga alguna parte dentro de la ventana con su
  borde superior por encima del 85 % del alto de la ventana (medido desde arriba) y la cortina de su sección
  esté en 1, EL SISTEMA lo revelará línea a línea:
  - Cada línea del titular (ver Definiciones) sube desde su propia máscara, de arriba abajo, con un
    escalonado de entre 80 y 120 ms entre líneas consecutivas.
  - Las líneas se calculan al empezar el revelado, así que un cambio de ancho de la ventana o de tamaño de
    texto anterior al revelado da las líneas nuevas. El número de máscaras es igual al número de líneas.
  - Un titular de una sola línea se revela como un único bloque. Si tiene más de 6 líneas, de la 6.ª en
    adelante se revelan juntas, en la misma máscara que la 6.ª.
  - El titular completo termina de revelarse en 900 ms como máximo desde que se cumple la condición. Si en
    ese momento las tipografías de la marca aún se están cargando, el revelado espera a que terminen, como
    mucho hasta que arranca la entrada del hero, y los 900 ms cuentan desde entonces.
- RF-15: MIENTRAS el movimiento esté permitido y la ventana sea móvil, CUANDO un titular cumpla la condición
  de RF-14, EL SISTEMA lo revelará entero a la vez, como un único bloque desde una sola máscara aunque ocupe
  varias líneas y sin escalonado, en 600 ms como máximo (con la misma espera a las tipografías de RF-14).
- RF-16: EL SISTEMA revelará cada titular una sola vez por carga: al subir y volver a bajar sigue visible,
  aunque su cortina se cierre y se vuelva a abrir. Los titulares vistos al ejecutarse el script (recarga a
  mitad de página, URL con ancla) se muestran en su estado final desde el principio, sin animación ni
  parpadeo. Terminado el revelado, el titular vuelve a comportarse como texto normal: si después cambian el
  ancho o el tamaño de texto, se recoloca sin restos de las líneas anteriores y sin volver a animarse.
- RF-17: EL SISTEMA expondrá cada titular a los lectores de pantalla como una sola frase con el mismo texto
  que hoy (sin contar espacios), antes, durante y después del revelado. El revelado no desplazará ningún
  elemento: la altura del titular y la posición de los elementos que le siguen no cambian más de 1 px antes,
  durante y después.

### Estado final, carga y compatibilidad
- RF-18: MIENTRAS el visitante prefiera movimiento reducido, EL SISTEMA mostrará el hero en su composición de
  reposo con cualquier scroll, las secciones con su fondo completo y el cambio de tono de hoy, y los
  titulares y el texto de filosofía en su estado final desde el principio.
- RF-19: MIENTRAS el script principal no se haya ejecutado, EL SISTEMA se comportará como en la spec 000 (el
  hero espera a su entrada, con la red de seguridad de 2,5 s) y mostrará todo lo demás en su estado final
  (secciones con su fondo completo, titulares visibles y palabras de filosofía en opacidad completa): las
  cortinas y los revelados nunca ocultan nada antes de que el script los gestione. CUANDO el script se
  ejecute, a tiempo o después de la red de seguridad:
  - Los titulares vistos en ese momento quedan en estado final durante toda la carga, sin animación ni
    parpadeo; solo los que aún están por debajo de la ventana reciben revelado.
  - Las cortinas de todas las secciones, también las vistas, pasan al estado que corresponde a la posición
    del scroll y desde entonces la siguen (RF-7). Como solo actúan sobre el fondo y nunca recortan
    contenido (RF-9), ningún texto ni elemento pulsable se oculta ni cambia de contraste.
  - La salida del hero se aplica según la posición del scroll.
- RF-20: SI no hay JavaScript o el script principal falla, o CUANDO se imprima la página, ENTONCES EL SISTEMA
  mostrará todo en su estado final: hero en reposo, secciones con su fondo completo y titulares visibles. Los
  CTA funcionan como en la spec 000.
- RF-21: CUANDO un elemento reciba el foco con teclado, EL SISTEMA mostrará su indicador de foco completo, sin
  que lo tape ningún dispositivo del hero ni ninguna cortina.
- RF-22: EL SISTEMA seguirá cumpliendo todos los RF de la spec 000 y sus requisitos no funcionales (en
  especial movimiento reducido, ausencia de desplazamiento horizontal entre 320 y 1920 px, cero
  infracciones de axe con el menú abierto y cerrado, consola sin errores y tono de la barra), y no añadirá
  elementos enfocables ni cambiará el orden de tabulación, el indicador de foco, el menú ni los enlaces ancla.

## Requisitos no funcionales
- Peso (decisión del usuario): esta spec añade como máximo **2.560 bytes de JavaScript y 3.072 bytes de CSS**
  (2,5 KB y 3 KB) con gzip y sin contar fuentes, medidos con el mismo método que `npm run budget` respecto a
  la base: el build del commit `5f01f29` (2.236 bytes de JS y 10.080 bytes de CSS, medidos por el
  coordinador). Con la spec 002 (1.536 y 2.048
  bytes) el incremento conjunto máximo es de 4 KB y 5 KB. El sobrante de una spec no pasa a la otra sin
  aprobación del usuario. Se mantiene el límite general de la constitución (15 KB y 20 KB).
- Sin bibliotecas de animación de terceros ni dependencias nuevas: CSS y JavaScript propios (decisión del
  usuario).
- Solo se animan transformaciones, opacidad y recortes (skill motion-rules).
- Sin scroll secuestrado: rueda, teclado, táctil y barra de desplazamiento conservan su comportamiento
  nativo. Nada infinito: todo efecto ligado al scroll se detiene cuando el scroll se detiene.
- La entrada del hero sigue terminando en 2,6 s o menos en escritorio y en menos tiempo en móvil.
- Estabilidad: desplazamiento de diseño acumulado (CLS) = 0 durante un recorrido completo de scroll de
  arriba abajo, en escritorio y en móvil; el CLS de la carga no empeora respecto a la base. Sin tareas de
  más de 50 ms durante ese recorrido en escritorio (navegador de las pruebas, sin limitación de CPU).
- Nitidez (skill mockup-screens): con progreso de salida 0,5, el texto de las pantallas de los mockups se lee
  con la misma nitidez que en reposo (verificación visual documentada a 1440 px y en el proyecto móvil).
- Identidad visual sin cambios: negro, blanco y azul eléctrico solo en acciones y señales; mismas tipografías
  y textos.
- Interfaz en español.

## Casos límite
- **Pantallas bajas** (1366×600; 844×390, móvil en horizontal, que por ancho es escritorio): composición de
  escritorio con la columna de alto menor de 500 px cuando corresponda (RF-2), RF-5 se cumple y no hay
  desplazamiento horizontal. Sin puntero fino no hay inclinación (RF-6).
- **Móvil en horizontal estrecho** (p. ej. 667×375): ancho menor de 768 px, así que recibe el comportamiento
  de móvil con las amplitudes de alto menor de 500 px (RF-3).
- **Barras dinámicas reales del navegador móvil**: Filosofía puede asomar unos píxeles al cargar; su
  titular queda en estado final, sin revelado, y su cortina sigue el scroll; es aceptable (RF-19).
- **Scroll rápido, hacia atrás o salto por ancla con desplazamiento suave**: al detenerse, la salida y las
  cortinas tienen el estado de esa posición (RF-4, RF-7). Un titular que se cruce durante el salto puede
  revelarse fuera de la vista; después sigue visible (RF-16).
- **Carga con la página ya desplazada**: los titulares vistos al ejecutarse el script quedan en estado
  final; las cortinas toman el estado de la posición, también en las secciones a la vista, sin tocar su
  contenido (RF-19).
- **Volver a subir por encima de una sección ya vista**: su cortina se cierra y se vuelve a abrir al bajar;
  su titular sigue revelado (RF-7, RF-16).
- **Script tardío**: si el script se ejecuta con el progreso de salida mayor que 0, los dispositivos pasan
  al estado de esa posición en ese momento; ningún titular ni texto ya visto se oculta y las cortinas toman
  el estado de la posición (RF-19).
- **Cambio de ancho o de tamaño de texto antes del revelado** (giro, redimensionado, zoom, tamaño de texto
  del navegador): el titular se revela con las líneas que tiene en el momento del revelado (RF-14).
- **Cambio de ancho o de tamaño de texto durante el revelado** (900 ms como máximo): las líneas en curso
  pueden quedar desajustadas hasta que termina; al terminar, el titular fluye como texto normal (RF-16).
- **Cambio de escritorio a móvil antes del revelado**: se aplica la regla de la ventana del momento del
  revelado (RF-14 o RF-15).
- **Titular con muchas líneas** (zoom, ventanas de escritorio estrechas): de la 6.ª línea en adelante se
  revelan juntas para no pasar de 900 ms (RF-14).
- **Tipografías de la marca aún sin cargar** cuando un titular cumple la condición: el revelado espera, como
  mucho, hasta que arranca la entrada del hero; si las tipografías no llegan, se usan las de respaldo
  (RF-14).
- **Scroll durante la entrada del hero**: al terminar la entrada, la composición tiene el estado de RF-2 o
  RF-3 para la posición actual.
- **Puntero moviéndose mientras se baja**: la inclinación va a neutro en 600 ms como máximo (RF-6).
- **Redimensionado o giro**: al cruzar los 768 px de ancho o los 500 px de alto se aplican los valores
  correspondientes sin estados residuales.
- **Zoom del navegador** al 200 % y al 400 %: se aplica el comportamiento del ancho resultante, sin
  desplazamiento horizontal y con el foco visible.
- **Menú abierto**: el scroll no cambia, así que la salida y las cortinas mantienen su estado.
- **Video del hero configurado**: no hay separación de dispositivos (RF-2); las cortinas no cambian.
- **Búsqueda del navegador**: encuentra todos los textos, incluidos los titulares sin revelar; si lleva un
  titular a la ventana, este se revela en 900 ms como máximo (600 ms en móvil). Es el único caso en que un
  texto encontrado no se ve al instante.
- **Barra de navegación**: la cortina termina antes de que el borde superior de la sección llegue a la barra,
  así que la barra nunca queda sobre una cortina en curso y su tono sigue la regla de la spec 000.

## Fuera de alcance
- Microinteracciones de puntero (cursor complementario, botones magnéticos y hovers): spec 002.
- Portafolio inmersivo (casos de estudio por concepto) y secciones de conversión: specs posteriores.
- Video del hero con Higgsfield (bloqueado por red). Nada de esta spec depende de él.
- Cambios de textos, nuevas secciones, cambios del menú, sonido y transiciones entre páginas.
- Revelado por palabras o por letras, y revelado del titular del hero (ya tiene el suyo).

## Criterios de finalización
- Cada RF está cubierto por un test en verde dentro de `npm run check` o por una verificación documentada.
- Los tests de la spec 000 siguen en verde sin haberlos debilitado (RF-22).
- Medidas automáticas de la salida del hero con progreso 0, 0,5 y 1 en escritorio, a 1366×600 y en móvil
  (escalas, desplazamientos, distancias entre centros y centros de texto y CTA).
- Medidas automáticas de cada cortina con progreso 0, 0,5 y 1 (franjas y cajas de contenido dentro del
  plano), también tras cargar con la sección a la vista y tras subir y volver a bajar.
- Medidas automáticas del revelado: número de máscaras igual al de líneas reales (también tras cambiar el
  ancho y el tamaño de texto antes del revelado), escalonado, duración total y altura del titular.
- Revisión visual con capturas a 1440 px y en el proyecto móvil: hero con progreso 0 y 0,5; cada frontera con
  la cortina a 0,5; titulares revelados.
- Capturas con movimiento reducido, sin JavaScript, con el script principal bloqueado (pasados 2,5 s) y en
  modo impresión, con todo en su estado final.
- CLS y tareas largas medidos según el requisito de estabilidad, con el resultado documentado.
- Incremento de peso respecto a la base, en bytes, dentro de la parte de esta spec.
- Revisión de @reviewer con veredicto APROBADO.

## Notas para el plan (no son requisitos)
- La cortina necesita un progreso propio por sección. El usuario autorizó ampliar la skill motion-rules con
  ese progreso por sección; la ampliación la hace una tarea del plan.
- Base exacta de peso (build del commit `5f01f29`, gzip por archivo, como `npm run budget`): 2.236 bytes de
  JS y 10.080 bytes de CSS.

## Decisiones del usuario (aprobación de la spec)
- Revelado de titulares línea a línea real, según los cortes del texto con las tipografías definitivas,
  recalculado si cambian el ancho o el tamaño de texto antes del revelado; una línea se revela como bloque;
  móvil sin escalonado (RF-14, RF-15, RF-17).
- Cortinas siempre reversibles, también en las secciones vistas al cargar; los titulares se revelan una
  sola vez por carga y lo visto al ejecutarse el script queda revelado sin animación (RF-7, RF-16, RF-19).
- Autorizada la ampliación de la skill motion-rules con el progreso por sección de las cortinas.

## Dudas abiertas
Ninguna.
