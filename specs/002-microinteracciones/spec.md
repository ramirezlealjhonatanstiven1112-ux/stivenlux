# Spec 002 — Microinteracciones de puntero

Estado: borrador

> Amplía la spec 000 (línea base). Todo lo que la spec 000 exige se sigue cumpliendo (RF-19).
> Depende de la spec 001 (hero y transiciones de scroll) **solo** en el presupuesto de peso compartido (ver
> requisitos no funcionales): puede implementarse antes o después que ella.

## Contexto y objetivo
Hoy la respuesta al puntero de la landing es plana: los enlaces cambian de color o se subrayan por donde
entraron, los botones rellenan su fondo y nada más. Para un estudio que vende «No hacemos lo de siempre», cada
gesto sobre lo que se puede pulsar debe demostrar cuidado del detalle, sin pagarlo en rendimiento ni en
accesibilidad.

Objetivo: añadir un conjunto contenido de microinteracciones de puntero sobre los elementos pulsables — un
cursor complementario que acompaña al del sistema, dos botones magnéticos (los de WhatsApp del contenido) y
hovers con dirección (subrayados que entran y salen, barridos con el texto sincronizado) — de modo que nada
sugiera que se puede pulsar lo que no se puede pulsar. En táctil, con teclado, con movimiento reducido o sin
JavaScript, la página funciona igual que hoy.

## Usuarios
- Visitante en escritorio con ratón o trackpad, que evalúa al estudio.
- Visitante en móvil o tableta (táctil), que llega desde redes o mensajería.
- Visitante con teclado, lector de pantalla o lupa.
- Visitante con preferencia de movimiento reducido.
- Visitante con dispositivo híbrido (pantalla táctil y ratón) o con zoom del navegador.

## Historias de usuario
- HU-1. Como visitante con ratón, quiero que los enlaces y botones respondan a mi puntero para notar el
  cuidado del detalle, sin que nada sugiera que se puede pulsar lo que no se puede pulsar.
- HU-2. Como visitante con ratón, quiero que el botón de WhatsApp «me busque» al acercarme para que la acción
  principal se sienta viva, sin que me cueste acertar el clic.
- HU-3. Como visitante en móvil, quiero tocar enlaces y botones sin cursores fantasma ni estados de hover
  pegados para que la página siga siendo rápida y cómoda con el pulgar.
- HU-4. Como visitante con teclado, lector de pantalla o movimiento reducido, quiero usar la página igual
  que antes, sin mareos, sin elementos que tapen el foco y sin nada nuevo que tabular.

## Definiciones
- **Puntero fino**: el puntero principal del dispositivo admite hover y es preciso (ratón o trackpad). Si el
  puntero principal es táctil o un lápiz sin hover, no hay puntero fino aunque haya un ratón secundario. Lo
  que cuenta es el puntero, no el ancho de la ventana: una ventana estrecha con ratón tiene puntero fino y un
  móvil en horizontal (844×390) no lo tiene.
- **Movimiento permitido**: el visitante no prefiere movimiento reducido y el script principal de la página
  se ha ejecutado. En cualquier otro caso (sin JavaScript, script fallido o todavía sin ejecutar) no hay
  punto ni efecto magnético, y los estados de hover se aplican al instante (RF-13, RF-17).
- **Elemento pulsable**: enlace o botón. Los mockups del hero, los escenarios de proyectos y las filas de
  servicios no son pulsables.
- **Cursor complementario («el punto»)**: punto decorativo que acompaña al puntero del sistema sin
  sustituirlo. En reposo es un disco de 8 px; sobre un elemento pulsable, un aro de 40 px (solo contorno).
- **Botón magnético**: botón que se desplaza unos píxeles hacia el puntero cuando este se acerca. Solo lo son
  los dos botones de WhatsApp del contenido (hero y contacto).
- **Botones con barrido**: los 3 botones cuyo fondo se rellena al pasar el puntero: WhatsApp del hero, del
  contacto y del menú desplegable.
- **Área de reposo de un botón**: la caja que ocupa el botón sin desplazamiento magnético.

## Requisitos funcionales

### Cursor complementario
- RF-1: MIENTRAS haya puntero fino y el movimiento esté permitido, CUANDO el puntero se mueva por primera vez
  sobre la página, EL SISTEMA mostrará el punto, que sigue al puntero y alcanza su posición en un máximo de
  150 ms después de que el puntero se detenga. Si ni el puntero ni el scroll cambian, el punto queda quieto.
- RF-2: EL SISTEMA dibujará el punto en dos tonos, blanco y negro (relleno de uno y borde de 1 px del otro),
  de modo que tenga un contraste de al menos 3:1 sobre blanco, negro, el azul de acento y las pantallas de
  los mockups. El punto no usará el azul de acento.
- RF-3: CUANDO el puntero esté sobre un elemento pulsable, EL SISTEMA convertirá el punto en un aro de 40 px
  (contorno de dos tonos de 2 px como máximo en total, sin relleno) en un máximo de 200 ms; CUANDO salga, lo
  devolverá a 8 px en un máximo de 200 ms. Sobre los mockups, los escenarios de proyectos, las filas de
  servicios y cualquier otro elemento no pulsable, el punto se queda en 8 px.
- RF-4: CUANDO el scroll cambie el elemento que hay bajo un puntero quieto, EL SISTEMA actualizará el estado
  del punto (disco o aro) en un máximo de 200 ms.
- RF-5: EL SISTEMA no ocultará ni sustituirá nunca el cursor del sistema. El punto no interceptará clics, no
  se podrá enfocar, no aparecerá en el árbol de accesibilidad ni al imprimir, y nunca tapará el texto de un
  enlace ni el elemento con foco (el aro no tiene relleno).
- RF-6: CUANDO el puntero salga de la ventana, el último dato de entrada sea táctil o el visitante use el
  teclado para moverse por la página, EL SISTEMA ocultará el punto hasta que el puntero vuelva a moverse. Sin
  puntero fino o sin movimiento permitido, el punto no existirá.

### Botones magnéticos
- RF-7: MIENTRAS haya puntero fino y el movimiento esté permitido, CUANDO el puntero esté sobre uno de los
  dos botones magnéticos o a 24 px o menos de su borde, EL SISTEMA desplazará el botón hacia el puntero un
  máximo de 8 px en cualquier dirección. El efecto solo se retira cuando el puntero se aleja más de 32 px del
  borde (histéresis); entonces el botón vuelve a su posición de reposo en un máximo de 300 ms. Con el
  puntero y el scroll quietos, el botón queda inmóvil en 300 ms como máximo, sin vaivén, y si el scroll
  acerca o aleja el botón de un puntero quieto, el efecto se recalcula en un máximo de 200 ms.
- RF-8: MIENTRAS un botón magnético ocupe todo el ancho disponible de su contenedor, EL SISTEMA no le
  aplicará efecto magnético. El efecto nunca generará desplazamiento horizontal de la página (RF-8 de la spec
  000).
- RF-9: EL SISTEMA no moverá con el efecto magnético ningún otro elemento: ni el enlace «Iniciar proyecto» de
  la barra, ni el botón del menú, ni el botón del menú desplegable, ni el contenido que rodea al botón. Un clic
  dentro del área de reposo del botón siempre lo activará. Con foco de teclado o con el menú abierto, los
  botones no se desplazan; si el puntero sale de la ventana, vuelven a su posición de reposo.

### Hovers de elementos pulsables
- RF-10: MIENTRAS el movimiento esté permitido, CUANDO el puntero pase sobre estos enlaces de texto, EL SISTEMA
  responderá así:
  - «Iniciar proyecto» de la barra: el subrayado entra por la izquierda en un máximo de 300 ms y, al salir el
    puntero, sale por la derecha en un máximo de 300 ms (hoy se recoge por donde entró).
  - «Ver proyectos» del hero (subrayado en reposo): el subrayado sale por la derecha y vuelve a entrar por la
    izquierda, en un máximo de 500 ms en total, y termina subrayado.
  - Los 5 enlaces del pie: además del cambio de color actual, el subrayado entra por la izquierda en un máximo
    de 300 ms y sale por la derecha al salir el puntero.
  - La marca de la barra, los enlaces del menú desplegable y el enlace de salto no cambian.
- RF-11: MIENTRAS el movimiento esté permitido, CUANDO el puntero pase sobre uno de los 3 botones con barrido,
  EL SISTEMA hará el barrido de izquierda a derecha en un máximo de 400 ms, y el texto cambiará de color con el
  mismo frente del barrido: la parte del texto ya barrida en el color de hover y el resto en el color de
  reposo, de modo que ninguna parte del texto quede nunca sobre un fondo de su mismo tono. Los colores de
  reposo y de hover son los de hoy, con un contraste de al menos 4,5:1 en ambos estados finales. CUANDO el
  puntero salga, el barrido se retirará hacia la derecha en un máximo de 400 ms.
- RF-12: CUANDO un enlace o botón reciba el foco con teclado, EL SISTEMA mostrará el indicador de foco de la
  spec 000 sin cambios y, además, el estado final de su hover (subrayado completo o barrido completo), sin
  desplazamiento magnético. El estado de hover nunca sustituye al indicador de foco.
- RF-13: MIENTRAS el visitante prefiera movimiento reducido, EL SISTEMA aplicará los estados de hover de
  subrayado y de color al instante, sin trazado ni barrido, y sin efecto magnético ni punto.
- RF-14: EL SISTEMA no añadirá efectos de hover a elementos no pulsables: los mockups y las vistas previas de
  los proyectos no se elevan ni reaccionan al puntero, salvo la excepción de RF-15.
- RF-15: EL SISTEMA mantendrá sin cambios el hover de las filas de servicios de la spec 000 (línea azul que
  recorre el borde superior de la fila y desplazamiento del nombre hacia la derecha), como única excepción
  documentada a RF-14. Esa excepción no promete clic: sobre las filas el cursor del sistema sigue siendo el
  normal (no la mano de enlace), el punto sigue siendo un disco de 8 px (RF-3) y las filas no se vuelven
  enfocables. Con movimiento reducido, ese hover se aplica al instante, como hoy.

### Táctil, sin JavaScript e impresión
- RF-16: MIENTRAS no haya puntero fino (móvil o tableta táctil, móvil en horizontal), EL SISTEMA no creará el
  punto ni aplicará efecto magnético, y ningún estado de hover de los enlaces y botones de RF-10 y RF-11
  quedará activo después de tocarlos. Un solo toque activa el enlace o el botón, como hoy.
- RF-17: SI no hay JavaScript o el script principal falla, ENTONCES EL SISTEMA no mostrará el punto ni
  aplicará efecto magnético, aplicará los estados de hover al instante (como en RF-13) y los CTA funcionarán
  como en la spec 000.
- RF-18: CUANDO se imprima la página, EL SISTEMA no mostrará el punto y los botones aparecerán en su área de
  reposo, sin desplazamiento magnético ni barrido a medias.

### Compatibilidad y teclado
- RF-19: EL SISTEMA seguirá cumpliendo todos los RF de la spec 000 (RF-1 a RF-12) y sus requisitos no
  funcionales, en especial movimiento reducido (RF-7), ausencia de desplazamiento horizontal entre 320 y
  1920 px (RF-8), cero infracciones de axe con el menú abierto y cerrado (RF-9), consola sin errores (RF-11)
  y tono de la barra (RF-12). No añadirá elementos enfocables ni cambiará el orden de tabulación, el
  indicador de foco ni el comportamiento del menú y de los enlaces ancla de la spec 000.

## Requisitos no funcionales
- Peso (decisión del usuario): las specs 001 y 002 juntas añaden como máximo 4 KB de JavaScript y 5 KB de
  CSS, con gzip y sin contar fuentes, sobre la base actual de 2,2 KB y 9,8 KB (totales máximos con ambas:
  6,2 KB y 14,8 KB). Reparto: esta spec añade como máximo **1,5 KB de JavaScript y 2 KB de CSS** (totales
  máximos con solo esta spec: 3,7 KB y 11,8 KB); la spec 001 dispone de 2,5 KB y 3 KB. El sobrante de una
  spec no pasa a la otra sin aprobación del usuario. El límite general de 15 KB y 20 KB de la constitución se
  mantiene.
- Sin bibliotecas de animación de terceros ni dependencias nuevas en ejecución (decisión del usuario).
- Solo se animan transformaciones, opacidad y recortes. Las únicas excepciones son las transiciones de color
  y de color de fondo como respuesta a una acción (skill motion-rules).
- Sin scroll secuestrado: el punto y los botones magnéticos no alteran la velocidad ni el comportamiento
  nativos de la rueda, el teclado, el táctil ni la barra de desplazamiento.
- Nada infinito: el punto y los botones magnéticos se detienen cuando dejan de cambiar el puntero y el
  scroll (RF-1, RF-7).
- Estabilidad: desplazamiento de diseño acumulado (CLS) = 0, medido con las entradas de desplazamiento de
  diseño de la API de rendimiento del navegador durante la carga y un recorrido del puntero por todos los
  elementos pulsables y por las filas de servicios a 1440×900, y durante la carga y un toque en cada enlace
  y botón a 390×844. Sin tareas de más de 50 ms durante el recorrido del puntero en el perfil de escritorio
  (1440×900, navegador de las pruebas de interfaz, sin limitación de CPU).
- Identidad visual sin cambios: negro, blanco y azul eléctrico solo en acciones y señales (el punto nunca es
  azul), y las mismas tipografías y textos que hoy.
- Interfaz en español.

## Casos límite
- **Dispositivo híbrido**: si el puntero principal es fino (portátil con pantalla táctil), al tocar la
  pantalla se oculta el punto y no hay efecto magnético, y al volver a mover el ratón reaparecen. Si el
  puntero principal es táctil (tableta con ratón conectado), no hay punto ni magnetismo.
- **Móvil en horizontal** (844×390): sin puntero fino, sin punto y sin magnetismo (RF-16).
- **Ventana estrecha con ratón** (menos de 768 px): hay punto; un botón magnético que ocupe todo el ancho de
  su contenedor no se desplaza (RF-8).
- **Cambio del puntero principal o redimensionado**: si el puntero principal deja de ser fino, desaparecen el
  punto y el efecto magnético sin estados residuales.
- **Scroll con el puntero quieto**: el punto cambia entre disco y aro según lo que quede debajo (RF-4) y el
  botón magnético se recalcula (RF-7).
- **Menú abierto**: el punto sigue visible por encima del menú (y se convierte en aro sobre sus enlaces y
  botones); los botones magnéticos de la página (que queda inerte) no reaccionan (RF-9).
- **El puntero sale de la ventana sobre un botón magnético**: el punto se oculta y el botón vuelve a su
  posición de reposo (RF-6, RF-9).
- **Puntero quieto en el límite de la zona magnética**: la histéresis de RF-7 evita que el botón oscile.
- **Foco con teclado sobre un botón con el puntero encima**: estado final de hover e indicador de foco, sin
  desplazamiento magnético (RF-9, RF-12).
- **Filas de servicios**: línea azul y desplazamiento del nombre como en la spec 000, con cursor normal y el
  punto en disco de 8 px (RF-15).
- **Mockups del hero con inclinación** (spec 000): el punto sigue en disco de 8 px sobre ellos y no altera la
  inclinación.
- **Zoom del navegador** al 200 % y al 400 %: sin desplazamiento horizontal y con el foco visible y sin tapar.
- **Lector de pantalla o lupa**: el punto no se anuncia ni se puede enfocar (RF-5).
- **Impresión y sin JavaScript**: sin punto, sin magnetismo y con todo en reposo (RF-17, RF-18).

## Fuera de alcance
- Salida del hero, cortinas entre secciones y revelado de titulares: spec 001.
- Portafolio inmersivo y secciones de conversión: specs posteriores.
- Cambios de textos, del menú (salvo el barrido de su botón de WhatsApp, RF-11), del indicador de foco o de
  la identidad visual; sonido; cursor propio en táctil; cambios del hover de las filas de servicios.

## Criterios de finalización
- Cada RF está cubierto por un test en verde dentro de `npm run check` o por una verificación documentada.
- Los tests de la spec 000 siguen en verde sin haberlos debilitado (RF-19).
- Medidas automáticas: tiempos del punto (150 ms y 200 ms), tamaño del disco y del aro, contraste del punto
  sobre blanco, negro, azul y una pantalla de mockup, desplazamiento magnético máximo de 8 px, umbrales de
  24 px y 32 px, área de reposo que activa el botón, y contraste del texto de los botones con barrido en
  reposo, a mitad de barrido y en hover.
- Revisión visual con capturas a 1440 px: enlace y botón en estado final de hover y a mitad de barrido; punto
  y aro sobre fondo claro, oscuro y azul; fila de servicios en hover. A 390 px: tras tocar un enlace y un
  botón no queda ningún estado de hover y no hay punto.
- Capturas con movimiento reducido, sin JavaScript y en modo impresión, sin punto y con los botones en
  reposo.
- CLS y tareas largas medidos según el requisito de estabilidad, con el resultado documentado.
- Presupuesto de peso dentro de la parte de esta spec, con su incremento indicado en la salida de
  `npm run budget`.
- Revisión de @reviewer con veredicto APROBADO.

## Dudas abiertas
- [NECESITA ACLARACIÓN] Filas de servicios en táctil: hoy, según el navegador, tocar una fila puede dejar
  activos la línea azul y el desplazamiento del nombre hasta tocar otra cosa (hover «pegado»). RF-15 lo deja
  tal cual. ¿Se mantiene así o se aplica también a las filas la regla de RF-16 (ningún hover activo tras
  tocar)?
