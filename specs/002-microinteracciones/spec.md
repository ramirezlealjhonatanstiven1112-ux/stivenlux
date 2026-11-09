# Spec 002 — Microinteracciones de puntero

Estado: implementada

> Amplía la spec 000 (línea base) y parte del estado con la spec 001 ya implementada (build del commit
> `0f6b12d`). Todo lo que exigen la spec 000 y la spec 001 se sigue cumpliendo (RF-19).
> Citas: «RF-x» es un requisito de esta spec; los de la spec 001 se citan como «001/RF-x» y los de la spec
> 000 como «000/RF-x» cuando puede haber ambigüedad.

## Contexto y objetivo
Hoy la respuesta al puntero de la landing es plana: los enlaces cambian de color o se subrayan por donde
entraron, los botones rellenan su fondo y nada más. Para un estudio que vende «No hacemos lo de siempre», cada
gesto sobre lo que se puede pulsar debe demostrar cuidado del detalle, sin pagarlo en rendimiento ni en
accesibilidad.

Objetivo: añadir un conjunto contenido de microinteracciones de puntero sobre los elementos pulsables — un
cursor complementario que acompaña al del sistema, dos botones magnéticos (los de WhatsApp del contenido) y
hovers con dirección (subrayados que entran y salen, barridos con el texto sincronizado) — de modo que nada
sugiera que se puede pulsar lo que no se puede pulsar. En táctil, con teclado, con movimiento reducido o sin
JavaScript, la página funciona igual que hoy, sin punto ni efecto magnético.

## Usuarios
- Visitante en escritorio con ratón o trackpad, que evalúa al estudio.
- Visitante en móvil o tableta (táctil), que llega desde redes o mensajería.
- Visitante con teclado, lector de pantalla o lupa.
- Visitante con preferencia de movimiento reducido.
- Visitante con dispositivo híbrido (pantalla táctil y ratón), con zoom del navegador o con modo de colores
  forzados.

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
  móvil en horizontal (844×390) no lo tiene. En esta spec, «móvil» y «táctil» significan sin puntero fino (no
  el ancho de ventana de la spec 001).
- **Dispositivo con hover**: su puntero principal admite hover. Los hovers nuevos de RF-10 y RF-11 y el hover
  de las filas de servicios solo existen en estos dispositivos.
- **Pruebas sin puntero fino**: se hacen con el proyecto móvil de las pruebas (Pixel 7, táctil, ventana de
  412×839) y con una ventana de 844×390 con emulación táctil. Una ventana estrecha con ratón se prueba en el
  perfil de escritorio y sí muestra el punto. El dispositivo híbrido y el cambio del puntero principal a
  mitad de sesión se cubren con verificación documentada.
- **Movimiento permitido**: el visitante no prefiere movimiento reducido y el script principal de la página
  se ha ejecutado. Sin movimiento permitido no hay punto ni efecto magnético. Con movimiento reducido, los
  estados finales de hover se aplican al instante (RF-13); sin JavaScript, con el script fallido o todavía
  sin ejecutar, se mantienen los hovers de hoy con sus transiciones de hoy, sin hover pegado en táctil
  (RF-17).
- **Elemento pulsable**: enlace o botón. Los mockups del hero, los escenarios de proyectos y las filas de
  servicios no son pulsables.
- **Cursor complementario («el punto»)**: punto decorativo que acompaña al puntero del sistema sin
  sustituirlo. En reposo es un disco de 8 px (± 1 px); sobre un elemento pulsable, un aro de 40 px (± 1 px),
  solo contorno.
- **Botón magnético**: botón que se desplaza unos píxeles hacia el puntero cuando este se acerca. Solo lo son
  los dos botones de WhatsApp del contenido (hero y contacto).
- **Botones con barrido**: los 3 botones cuyo fondo se rellena al pasar el puntero: WhatsApp del hero, del
  contacto y del menú desplegable.
- **Área de reposo de un botón**: la caja que ocupa el botón sin desplazamiento magnético. Las distancias de
  RF-7 (24 px y 32 px) se miden desde el borde de esta área.
- **Entrada del CTA del hero**: desde la carga hasta que termina el fundido de entrada de los dos CTA del hero
  (el botón de WhatsApp y «Ver proyectos»). Sus excepciones (RF-3, RF-5, RF-7) valen solo con el puntero
  sobre esos dos CTA; el resto de pulsables, como los de la barra, se comporta con normalidad durante la
  entrada.
- **Transición del menú**: desde que el menú empieza a abrirse o a cerrarse hasta que terminan todas sus
  animaciones de apertura o de cierre.
- **Ocupar todo el ancho**: el ancho del botón es igual al de su contenedor, con una tolerancia de ±1 px.
- **Tolerancias**: salvo que se indique otra, 1 px en tamaños y posiciones. El punto «alcanza» al puntero
  cuando su centro está a 1 px o menos de él.

## Requisitos funcionales

### Cursor complementario
- RF-1: MIENTRAS haya puntero fino y el movimiento esté permitido, CUANDO el puntero se mueva por primera vez
  sobre la página, EL SISTEMA mostrará el punto, que sigue al puntero y lo alcanza (a 1 px o menos) en un
  máximo de 150 ms después de que el puntero se detenga. Si ni el puntero ni el scroll cambian, el punto
  queda quieto. Con modo de colores forzados, el punto no se muestra (RF-22).
- RF-2: EL SISTEMA dibujará el punto en dos tonos, blanco y negro (relleno de uno y borde de 1 px del otro),
  de modo que al menos uno de los dos tonos tenga un contraste de 3:1 o más sobre blanco, sobre negro, sobre
  el azul de acento y, en cada una de las pantallas de los mockups, sobre su color de fondo, su color más
  claro y su color más oscuro. El punto no usará el azul de acento.
- RF-3: CUANDO el puntero esté sobre un elemento pulsable, EL SISTEMA convertirá el punto en un aro de 40 px
  (± 1 px; contorno de dos tonos de 2 px como máximo en total, sin relleno) en un máximo de 200 ms; CUANDO
  salga, lo devolverá a 8 px (± 1 px) en un máximo de 200 ms. Sobre los mockups, los escenarios de proyectos,
  las filas de servicios y cualquier otro elemento no pulsable, el punto se queda en 8 px. Excepciones, en las
  que el punto se queda en disco: sobre los dos CTA del hero (el botón de WhatsApp y «Ver proyectos») durante
  su entrada, hasta que termina su fundido de entrada; y sobre cualquier pulsable durante la transición del
  menú, hasta que terminan todas sus animaciones de apertura o cierre. Ver Casos límite.
- RF-4: CUANDO el scroll cambie el elemento que hay bajo un puntero quieto, EL SISTEMA actualizará el estado
  del punto (disco o aro) en un máximo de 200 ms.
- RF-5: EL SISTEMA no ocultará ni sustituirá nunca el cursor del sistema. El punto no interceptará clics, no
  se podrá enfocar y no aparecerá en el árbol de accesibilidad ni al imprimir. «Sobre un pulsable» se refiere
  a la posición del puntero, no a la del punto. MIENTRAS el puntero esté sobre un elemento pulsable, el punto
  será un aro sin relleno, salvo en estos casos, en los que se admite el disco con relleno:
  - durante el retraso hasta que se detecta el pulsable: con scroll y el puntero quieto (dentro de los
    200 ms de RF-4) o mientras el punto alcanza al puntero (dentro de los 150 ms de RF-1);
  - sobre los dos CTA del hero (el botón de WhatsApp y «Ver proyectos») durante su entrada, hasta que
    termina su fundido de entrada (RF-3); el resto de pulsables no tiene esta excepción;
  - durante la transición del menú, hasta que terminan todas sus animaciones de apertura o cierre (RF-3).
  Fuera de esos casos, desde que se detecta el pulsable, la transición de disco a aro (RF-3) va siempre sin
  relleno, solo con el contorno. El punto nunca dejará oculto del todo el elemento con foco (WCAG 2.2,
  criterio 2.4.11). Que el contorno de 2 px del aro cruce parte de los glifos de un texto es aceptable.
- RF-6: CUANDO el puntero salga de la ventana, el último dato de entrada sea táctil o el visitante pulse una
  tecla que no sea modificadora, EL SISTEMA ocultará el punto hasta que el puntero vuelva a moverse. Las
  teclas modificadoras (Ctrl, Mayús, Alt, Cmd o Meta), solas o combinadas con clic o rueda, no ocultan el
  punto. Sin puntero fino, sin movimiento permitido o con modo de colores forzados, el punto no existirá.

### Botones magnéticos
- RF-7: MIENTRAS haya puntero fino y el movimiento esté permitido, CUANDO el puntero esté sobre uno de los
  dos botones magnéticos o a 24 px o menos de su área de reposo, EL SISTEMA desplazará el botón hacia el
  puntero, como máximo 8 px en cualquier dirección:
  - Con el puntero sobre el borde del área de reposo, el desplazamiento será de al menos 3 px; hacia el
    centro decrece de forma progresiva y con el puntero en el centro exacto es 0.
  - Fuera del botón, entre 24 px del área de reposo y su borde, el desplazamiento crece de forma progresiva
    desde 0, sin saltos, hasta el valor del borde.
  - El efecto solo se retira cuando el puntero se aleja más de 32 px del área de reposo (histéresis);
    entonces el botón vuelve a su posición de reposo en un máximo de 300 ms. La histéresis solo decide cuándo
    se retira el efecto, para que no se active y desactive sin parar: entre 24 y 32 px, con el efecto activo,
    el desplazamiento es 0 y el botón queda en reposo.
  - Con el puntero y el scroll quietos, el botón queda inmóvil en 300 ms como máximo, sin vaivén: nunca
    sobrepasa su posición destino. Si el scroll acerca o aleja el botón de un puntero quieto, el efecto se
    recalcula en un máximo de 200 ms.
  - Excepciones, sin efecto magnético: el botón de WhatsApp del hero durante la entrada de los CTA del hero
    (hasta que termina su fundido de entrada) y los dos botones durante la transición del menú (hasta que
    terminan todas sus animaciones de apertura o cierre). Ver Casos límite.
- RF-8: MIENTRAS un botón magnético ocupe todo el ancho de su contenedor (±1 px), EL SISTEMA no le aplicará
  efecto magnético. El efecto nunca generará desplazamiento horizontal de la página (000/RF-8).
- RF-9: EL SISTEMA no moverá con el efecto magnético ningún otro elemento: ni el enlace «Iniciar proyecto» de
  la barra, ni el botón del menú, ni el botón del menú desplegable, ni el contenido que rodea al botón. Un clic
  dentro del área de reposo del botón siempre lo activará. Con foco de teclado o con el menú abierto, los
  botones no se desplazan: CUANDO un botón magnético reciba el foco con teclado o se abra el menú, EL SISTEMA
  lo devolverá a su área de reposo en 300 ms como máximo. CUANDO el puntero salga de la ventana, los botones
  volverán a su posición de reposo en 300 ms como máximo.

### Hovers de elementos pulsables
- RF-10: MIENTRAS el dispositivo tenga hover y el script principal se haya ejecutado, CUANDO el puntero pase
  sobre estos enlaces de texto, EL SISTEMA responderá así (con movimiento reducido, los estados finales se
  aplican al instante, RF-13):
  - «Iniciar proyecto» de la barra: el subrayado entra por la izquierda en un máximo de 300 ms y, al salir el
    puntero, sale por la derecha en un máximo de 300 ms (hoy se recoge por donde entró).
  - «Ver proyectos» del hero (subrayado en reposo): el subrayado sale por la derecha y vuelve a entrar por la
    izquierda, en un máximo de 500 ms en total, y termina subrayado. Completa la animación que tenga en curso
    aunque el puntero salga.
  - Los 5 enlaces del pie: además del cambio de color actual, el subrayado entra por la izquierda en un máximo
    de 300 ms y sale por la derecha al salir el puntero. Con movimiento reducido, el subrayado nuevo aparece y
    desaparece al instante.
  - Si el puntero sale a mitad de una entrada o vuelve a entrar a mitad de una salida, la animación continúa
    desde el estado actual, sin saltos.
  - La marca de la barra y el enlace de salto no cambian; los enlaces del menú desplegable conservan su hover
    de color actual.
- RF-11: MIENTRAS el dispositivo tenga hover y el script principal se haya ejecutado, CUANDO el puntero pase
  sobre uno de los 3 botones con barrido, EL SISTEMA hará el barrido de izquierda a derecha en un máximo de
  400 ms (con movimiento reducido, el estado final al instante, RF-13), y el texto cambiará de color con el
  mismo frente del barrido (tolerancia de 1 px de suavizado en el frente): la parte del texto ya barrida en el
  color de hover y el resto en el color de reposo, de modo que ninguna parte del texto quede nunca sobre un
  fondo de su mismo tono.
  - Contraste: los colores de reposo y de hover son los de hoy, con al menos 4,5:1 en ambos estados finales.
    A mitad de barrido, el contraste se mide a cada lado del frente y es de al menos 4,5:1.
  - Si el texto no cambia de color entre reposo y hover (botón del hero), solo se anima el fondo.
  - El texto visible y el nombre accesible de los botones no cambian: sin texto duplicado, ni visible dos
    veces al buscar en la página, al seleccionar o al traducir.
  - CUANDO el puntero salga, el barrido se retirará hacia la derecha en un máximo de 400 ms. Si el puntero
    sale a mitad de la entrada o vuelve a entrar a mitad de la retirada, la animación continúa desde el
    estado actual, sin saltos.
  - Con modo de colores forzados, RF-22.
- RF-12: MIENTRAS el script principal se haya ejecutado, CUANDO uno de los enlaces o botones de RF-10 y RF-11
  («Iniciar proyecto» de la barra, «Ver proyectos», los 5 enlaces del pie y los 3 botones con barrido) reciba
  el foco con teclado, EL SISTEMA mostrará el indicador de foco de la spec 000 sin cambios y, además, al
  instante (sin animación), el estado final de su hover (subrayado completo, incluido el subrayado nuevo del
  pie, o barrido completo), sin desplazamiento magnético. Se aplica también sin puntero fino (por ejemplo,
  una tableta con teclado; RF-20 cede ante esta regla) y con movimiento reducido. Con modo de colores
  forzados, el estado final es el de RF-22. El estado de hover nunca sustituye al indicador de foco. La
  marca, el enlace de salto, el botón «Menú» y los enlaces del menú quedan fuera de esta regla y conservan su
  hover de hoy. Sin script, RF-12 no se exige y el foco se comporta como hoy (RF-17).
- RF-13: MIENTRAS el visitante prefiera movimiento reducido, EL SISTEMA aplicará al instante los estados
  finales de hover de RF-10 y RF-11 (incluido el subrayado nuevo del pie) y de color, sin trazado ni barrido,
  y sin efecto magnético ni punto.
- RF-14: EL SISTEMA no añadirá efectos de hover a elementos no pulsables: los mockups y las vistas previas de
  los proyectos no se elevan ni reaccionan al puntero, salvo dos excepciones documentadas: el hover de las
  filas de servicios (RF-15) y la inclinación de los mockups del hero con el puntero (spec 000 y 001/RF-6),
  que se mantiene sin cambios. Sobre los mockups, el punto sigue siendo un disco de 8 px y no altera la
  inclinación.
- RF-15: MIENTRAS el dispositivo tenga hover, EL SISTEMA mantendrá sin cambios el hover de las filas de
  servicios de la spec 000 (línea azul que recorre el borde superior de la fila y desplazamiento del nombre
  hacia la derecha), como excepción documentada a RF-14. Esa excepción no promete clic: sobre las filas el
  cursor del sistema sigue siendo el normal (no la mano de enlace), el punto sigue siendo un disco de 8 px
  (RF-3) y las filas no se vuelven enfocables. SI el dispositivo no tiene hover (táctil), ENTONCES la fila
  queda estática: tocarla no muestra la línea ni desplaza el nombre, y nunca queda un hover pegado. Con
  movimiento reducido, ese hover se aplica al instante, como hoy.

### Táctil, híbridos, colores forzados, sin JavaScript e impresión
- RF-16: MIENTRAS no haya puntero fino (móvil o tableta táctil, móvil en horizontal), EL SISTEMA no creará el
  punto ni aplicará efecto magnético; al tocar un enlace o un botón no se verá ningún hover nuevo, y ningún
  estado de hover de los enlaces y botones de RF-10 y RF-11 ni de las filas de servicios quedará activo
  después. Un solo toque activa el enlace o el botón, como hoy.
- RF-17: SI no hay JavaScript o el script principal falla, ENTONCES EL SISTEMA no mostrará el punto ni
  aplicará efecto magnético, mantendrá los hovers de hoy con sus transiciones CSS de hoy (no pasan a ser
  instantáneos, para no cambiar la spec 000) y los CTA funcionarán como en la spec 000. RF-12 (estado final
  al instante con el foco) y RF-21 (híbridos) solo se exigen con el script ejecutado. RF-15, RF-16 y RF-20
  se exigen también sin script, porque dependen de si el dispositivo tiene hover (en táctil, sin script,
  tampoco queda ningún hover pegado tras tocar). Con modo de colores forzados, sin script se exige la parte
  de RF-22 que es igual con y sin script (colores del sistema, borde visible, sin barrido y sin punto); los
  subrayados, sin script, son los de hoy.
- RF-18: CUANDO se imprima la página, EL SISTEMA no mostrará el punto y los botones aparecerán en su área de
  reposo, sin desplazamiento magnético ni barrido a medias.
- RF-20: MIENTRAS el dispositivo no tenga hover, EL SISTEMA mostrará la página exactamente como hoy: sin punto, sin
  efecto magnético y sin ningún elemento ni estilo nuevo; tocar un enlace o un botón lo activa como hoy, sin
  mostrar ningún hover nuevo. La única diferencia permitida es que el hover ya no queda pegado tras tocar
  (RF-15, RF-16). RF-20 cede ante RF-12 (foco con teclado, por ejemplo en una tableta con teclado) y ante
  RF-22 (modo de colores forzados). RF-20 se refiere solo a dispositivos sin hover: un dispositivo con hover y
  puntero grueso (por ejemplo, algunos televisores) no tiene punto ni imán, porque no tiene puntero fino, pero
  sí recibe los hovers nuevos de RF-10 y RF-11, porque tiene hover.
- RF-21: MIENTRAS el script principal se haya ejecutado y el puntero principal sea fino (dispositivo
  híbrido), CUANDO el visitante toque la pantalla con el dedo, EL SISTEMA no dejará activo ningún hover de
  RF-10, RF-11 ni de las filas de servicios (RF-15), ocultará el punto (RF-6) y no aplicará efecto magnético;
  CUANDO vuelva a mover el ratón, los hovers, el punto y el efecto magnético funcionarán de nuevo. Se acepta
  verificación documentada si no se puede emular.
- RF-22: MIENTRAS esté activo el modo de colores forzados, EL SISTEMA:
  - con o sin script, mostrará los 3 botones con barrido con los colores del sistema, con un borde visible y
    sin barrido, y no mostrará el punto;
  - con el script ejecutado, mostrará los subrayados de RF-10 en el color del sistema, sin animación; sin
    script, los subrayados son los de hoy (RF-17 prevalece).

### Compatibilidad y teclado
- RF-19: EL SISTEMA seguirá cumpliendo todos los RF y requisitos no funcionales de la spec 000 (000/RF-1 a
  000/RF-12) y de la spec 001 (001/RF-1 a 001/RF-22), y sus tests seguirán en verde sin debilitarse. En
  especial:
  - De la spec 000: movimiento reducido (000/RF-7), ausencia de desplazamiento horizontal entre 320 y 1920 px
    (000/RF-8), cero infracciones de axe con el menú abierto y cerrado (000/RF-9), consola sin errores
    (000/RF-11) y tono de la barra (000/RF-12).
  - De la spec 001, con el efecto magnético en cualquier estado: los CTA del hero siguen por encima de los
    dispositivos y pulsar su centro los activa (001/RF-5); los elementos pulsables siguen dentro del plano
    descubierto por la cortina (001/RF-9); se mantienen la impresión (001/RF-20) y el foco (001/RF-21,
    001/RF-22).
  - No añadirá elementos enfocables ni cambiará el orden de tabulación, el indicador de foco ni el
    comportamiento del menú y de los enlaces ancla.

## Requisitos no funcionales
- Peso (decisión del usuario): la base es el build del commit `0f6b12d` (spec 001 ya implementada): 3.965
  bytes de JavaScript y 10.731 bytes de CSS con gzip, tal como los mide `npm run budget`. Esta spec añade como
  máximo **1.636 bytes de JavaScript y 2.048 bytes de CSS** (totales máximos: 5.601 y 12.779 bytes), medidos
  con `npm run budget` sobre esta nueva base. La comparación es entre builds y excluye solo los archivos de
  fuente. Del sobrante de la spec 001 solo pasan a esta spec 100 bytes de JavaScript (decisión 23). Se
  mantiene el límite general de la constitución (15 KB y 20 KB).
- Sin bibliotecas de animación de terceros ni dependencias nuevas en ejecución (decisión del usuario).
- Solo se animan transformaciones, opacidad y recortes. Las únicas excepciones son las transiciones de color
  y de color de fondo como respuesta a una acción (skill motion-rules).
- Sin scroll secuestrado: el punto y los botones magnéticos no alteran la velocidad ni el comportamiento
  nativos de la rueda, el teclado, el táctil ni la barra de desplazamiento.
- Nada infinito: el punto y los botones magnéticos se detienen cuando dejan de cambiar el puntero y el
  scroll (RF-1, RF-7).
- Estabilidad: esta spec no empeora el desplazamiento de diseño acumulado (CLS) respecto a la base
  `0f6b12d`, medido en los dos builds con el mismo recorrido de carga y de puntero o toques. Se cuentan todos
  los desplazamientos de diseño, también los que siguen a una entrada del visitante. El recorrido sigue el
  orden del documento, con el menú cerrado, y en los dos perfiles entran todos los pulsables de la página
  más el enlace de salto, que se enfoca con Tab porque está fuera de la pantalla hasta recibir el foco; los
  enlaces de dentro del menú quedan fuera. El botón «Menú» se toca (en móvil) o se pulsa (en escritorio) para
  abrir el menú y otra vez para cerrarlo, antes de seguir.
  - A 1440×900: la carga y un recorrido del puntero por esos elementos y por las filas de servicios, sin
    seguir enlaces que abran otra pestaña o desplacen la página.
  - En el proyecto móvil de las pruebas (Pixel 7, 412×839): la carga y un toque en cada uno de esos
    elementos, cancelando su navegación y su desplazamiento (no se siguen).
  Sin tareas de más de 50 ms durante el recorrido del puntero en el perfil de escritorio (1440×900,
  navegador de las pruebas de interfaz, sin limitación de CPU).
- Paleta y tipografía sin cambios: negro, blanco y azul eléctrico solo en acciones y señales (el punto nunca
  es azul), y las mismas tipografías y textos que hoy. Las microinteracciones de esta spec (diseño del punto,
  tiempos, umbrales, 2 botones magnéticos, subrayado del pie, barrido y salida por la derecha del enlace de la
  barra) son un cambio de identidad aprobado por el usuario.
- Interfaz en español.

## Casos límite
- **Dispositivo híbrido**: si el puntero principal es fino (portátil con pantalla táctil), al tocar la
  pantalla se oculta el punto, no hay efecto magnético y no queda ningún hover activo; al volver a mover el
  ratón reaparecen (RF-21; sin script, RF-21 no se exige). Si el puntero principal es táctil (tableta con
  ratón conectado), no hay punto ni magnetismo y ningún hover queda pegado, también sin script (RF-16).
  Verificación documentada.
- **Tableta con teclado** (sin puntero fino): al tabular, el foco muestra al instante el estado final del
  hover (RF-12); RF-20 cede ante esa regla.
- **Móvil en horizontal** (844×390, con emulación táctil): sin puntero fino, sin punto y sin magnetismo
  (RF-16).
- **Ventana estrecha con ratón** (menos de 768 px, perfil de escritorio): hay punto; un botón magnético que
  ocupe todo el ancho de su contenedor no se desplaza (RF-8).
- **Cambio del puntero principal o redimensionado**: si el puntero principal deja de ser fino, desaparecen el
  punto y el efecto magnético sin estados residuales. El cambio a mitad de sesión se cubre con verificación
  documentada.
- **Cambio de preferencia de movimiento a mitad de sesión**: en los dos sentidos, lo de esta spec (punto,
  imán y hovers) se aplica en 200 ms como máximo, sin estados residuales (punto, desplazamiento magnético o
  barrido a medias). Si se pasa de reducido a permitido, la salida del hero y las cortinas de la spec 001
  pueden seguir apagadas hasta recargar, como hoy; es aceptable.
- **Entrada del CTA del hero**: mientras los dos CTA del hero (el botón de WhatsApp y «Ver proyectos») aún no
  son visibles (durante su entrada, hasta que termina su fundido de entrada), no hay efecto magnético sobre el
  botón ni el punto se convierte en aro sobre ninguno de los dos; el disco puede tener relleno. El resto de
  pulsables, como los de la barra, se comporta con normalidad durante la entrada (RF-3, RF-5, RF-7).
- **Menú en transición**: mientras el menú se abre o se cierra, hasta que terminan todas sus animaciones de
  apertura o cierre, no hay efecto magnético ni aro; el disco puede tener relleno (RF-3, RF-5, RF-7).
- **Scroll con el puntero quieto**: el punto cambia entre disco y aro según lo que quede debajo (RF-4) y el
  botón magnético se recalcula (RF-7).
- **Menú abierto**: el punto sigue visible por encima del menú (y, terminada la transición, se convierte en
  aro sobre sus enlaces y botones); los botones magnéticos de la página (que queda inerte) no reaccionan y
  vuelven al reposo en 300 ms como máximo (RF-9).
- **El puntero sale de la ventana sobre un botón magnético**: el punto se oculta y el botón vuelve a su
  posición de reposo en 300 ms como máximo (RF-6, RF-9).
- **Pérdida de foco de la ventana** (cambio de pestaña o de aplicación): al volver, los botones magnéticos
  están en reposo.
- **Puntero quieto en el límite de la zona magnética**: la histéresis de RF-7 solo decide cuándo se retira el
  efecto y evita que se active y desactive sin parar; entre 24 y 32 px, con el efecto activo, el
  desplazamiento es 0 y el botón queda en reposo, así que no oscila.
- **Perfil del imán**: 0 a 24 px del área de reposo, crece sin saltos hasta el valor del borde (al menos
  3 px) y decrece de forma progresiva hasta 0 en el centro exacto del botón; nunca más de 8 px; entre 24 y
  32 px, 0 (RF-7).
- **Punto poniéndose al día** (punto que aún alcanza al puntero o scroll con el puntero quieto): solo
  durante el retraso hasta que se detecta el pulsable (dentro de los 150 ms de RF-1 o de los 200 ms de RF-4)
  puede pasar con relleno sobre un pulsable; desde que se detecta, la transición a aro va siempre sin relleno
  y, con el puntero sobre un pulsable, el punto es un aro sin relleno (RF-5).
- **Imán combinado con la pulsación** (botón presionado): no rompen el clic ni el área de reposo que lo
  activa (RF-9).
- **Interrupciones** (subrayado o barrido): si el puntero sale a mitad de una entrada o vuelve a entrar a
  mitad de una salida, la animación continúa desde el estado actual, sin saltos; «Ver proyectos» completa la
  animación en curso aunque el puntero salga (RF-10, RF-11).
- **Foco con teclado sobre un botón con el puntero encima**: estado final de hover al instante e indicador
  de foco, sin desplazamiento magnético (RF-9, RF-12).
- **Teclas**: cualquier tecla que no sea modificadora oculta el punto hasta que el puntero vuelva a moverse;
  Ctrl, Mayús, Alt, Cmd o Meta, solas o con clic o rueda, no lo ocultan (RF-6).
- **Traducción, selección de texto y arrastre de la barra de desplazamiento**: el texto de los botones no
  cambia ni se duplica y el punto no interfiere (RF-5, RF-11). Verificación manual documentada.
- **Filas de servicios**: con hover, línea azul y desplazamiento del nombre como en la spec 000, con cursor
  normal y el punto en disco de 8 px; en táctil, la fila queda estática (RF-15).
- **Mockups del hero con inclinación** (spec 000 y 001/RF-6): la inclinación se mantiene como excepción de
  RF-14; el punto sigue en disco de 8 px sobre ellos y no altera la inclinación.
- **Modo de colores forzados**: con y sin script, botones con los colores del sistema, borde visible y sin
  barrido, y sin punto; con script, subrayados de RF-10 en el color del sistema, sin animación; sin script,
  los subrayados de hoy (RF-17, RF-22).
- **Zoom del navegador** al 200 % y al 400 %: sin desplazamiento horizontal y con el foco visible y sin tapar.
- **Lector de pantalla o lupa**: el punto no se anuncia ni se puede enfocar (RF-5).
- **Impresión y sin JavaScript**: sin punto, sin magnetismo y con todo en reposo. Sin JavaScript, los hovers
  de hoy con sus transiciones de hoy y RF-12 y RF-21 no se exigen, pero en táctil tampoco queda ningún hover
  pegado: filas estáticas y sin hover pegado en enlaces y botones (RF-15, RF-16, RF-17, RF-18, RF-20).

## Fuera de alcance
- Salida del hero, cortinas entre secciones y revelado de titulares: spec 001.
- Portafolio inmersivo y secciones de conversión: specs posteriores.
- Cambios de textos, del menú (salvo el barrido de su botón de WhatsApp, RF-11), del indicador de foco, de la
  paleta o de la tipografía; sonido; cursor propio en táctil.
- Corregir los desplazamientos de diseño que ya tiene la base en la barra y en el cambio «Menú»/«Cerrar»
  (vienen de las specs 000 y 001).

## Criterios de finalización
- Cada RF está cubierto por un test en verde dentro de `npm run check` o por una verificación documentada.
- Los tests de las specs 000 y 001 siguen en verde sin haberlos debilitado (RF-19).
- Medidas automáticas del punto: tiempos (150 ms y 200 ms), alcance a 1 px o menos, disco de 8 ± 1 px y aro
  de 40 ± 1 px, aro sin relleno con el puntero sobre un pulsable fuera de las excepciones de RF-5, disco
  sobre los dos CTA del hero durante su entrada (y aro normal sobre la barra) y durante la transición del
  menú, teclas modificadoras que no lo ocultan, y
  contraste (al menos uno de sus dos tonos ≥ 3:1) sobre blanco, negro, el azul de acento y, en cada pantalla
  de mockup, sobre su color de fondo, su color más claro y su color más oscuro.
- Medidas automáticas del imán: perfil de RF-7 (0 a 24 px, creciente sin saltos hasta el borde, al menos
  3 px en el borde, decreciente hacia el centro y 0 en el centro exacto, nunca más de 8 px; 0 entre 24 y
  32 px con el efecto activo), sin sobrepasar la posición destino, vuelta al reposo en 300 ms como máximo con foco de
  teclado, al abrir el menú y al salir el puntero de la ventana, área de reposo que activa el botón, CTA del
  hero por encima de los dispositivos con clic en su centro (001/RF-5) y pulsables dentro del plano
  descubierto por la cortina (001/RF-9).
- Medidas automáticas de los hovers: contraste del texto de los botones con barrido en reposo, a cada lado
  del frente a mitad de barrido y en hover; texto y nombre accesible sin cambios; estado final al instante
  con foco de teclado; subrayado del pie al instante con movimiento reducido; continuidad sin saltos al
  salir o volver a entrar a mitad de animación; modo de colores forzados según RF-22, con y sin script.
- Medida automática del cambio de preferencia de movimiento a mitad de sesión, en los dos sentidos: punto,
  imán y hovers de esta spec aplicados en 200 ms como máximo.
- Revisión visual con capturas a 1440 px: enlace y botón en estado final de hover y a mitad de barrido; punto
  y aro sobre fondo claro, oscuro y azul; fila de servicios en hover. En el proyecto móvil de las pruebas y a
  844×390 con emulación táctil: al tocar un enlace, un botón y una fila de servicios no se ve ningún hover
  nuevo, no queda ningún estado de hover y no hay punto. Ventana estrecha con ratón (perfil de escritorio):
  hay punto.
- Capturas con movimiento reducido, sin JavaScript, en modo impresión y con colores forzados.
- Verificación documentada del dispositivo híbrido (RF-21), del cambio del puntero principal a mitad de
  sesión, del umbral de retirada de 32 px del imán (entre 24 y 32 px el botón está en reposo con el efecto
  activo o retirado, así que no se observa desde fuera) y, a mano, de la traducción, la selección de texto y
  el arrastre de la barra de desplazamiento.
- CLS de la base `0f6b12d` y de esta spec medidos con el mismo recorrido (requisito de estabilidad), sin
  empeorar, y tareas largas, con los resultados documentados.
- Incremento de peso en bytes sobre la base `0f6b12d`, dentro de +1.636 B de JS y +2.048 B de CSS, indicado en
  la salida de `npm run budget`.
- Revisión de @reviewer con veredicto APROBADO.

## Notas para el plan (no son requisitos)
- `npm run budget` mide hoy contra la base de la spec 001 (`5f01f29`); su ajuste a la base `0f6b12d` y al
  margen de esta spec lo hace el plan.
- La base de peso debe volver a medirse con un build limpio de `0f6b12d`.
- La base de CSS ya incluye las reglas `@font-face`; lo que se excluye son solo los archivos de fuente.
- El recálculo con el scroll (RF-4, RF-7) va dentro del único `requestAnimationFrame` de scroll que ya
  existe, sin otro listener de scroll y sin ampliar la skill motion-rules (decisión del usuario).
- CLS: se cuentan también las entradas de desplazamiento de diseño con `hadRecentInput`. La base ya da
  0,0000625 en la carga (por `.nav__actions`) y 2 entradas al abrir y cerrar el menú en Pixel 7 (por el
  cambio «Menú»/«Cerrar»); vienen de las specs 000 y 001 y no se tocan.

## Decisiones del usuario (clarificación tras la QA de @reviewer)
- **Peso**: base `0f6b12d` (3.965 B de JS y 10.731 B de CSS con gzip, según `npm run budget`); margen de
  +1.536 B y +2.048 B (totales 5.501 B y 12.779 B); el sobrante de la 001 no pasa; solo se excluyen los
  archivos de fuente. *(Sustituida en el margen de JS por la decisión 23: +1.636 B.)*
- **Inclinación del hero**: se mantiene como segunda excepción de RF-14, junto a las filas de servicios.
- **Compatibilidad**: la 002 cumple las specs 000 y 001 y sus tests siguen en verde sin debilitarse (RF-19).
- **Filas de servicios**: hover solo en dispositivos con hover; en táctil, estáticas y nunca pegadas (RF-15,
  RF-16). En híbridos, tras un toque ningún hover queda activo hasta volver a mover el ratón (RF-21).
- **Pruebas sin puntero fino**: proyecto móvil (Pixel 7, 412×839) y 844×390 con emulación táctil; ventana
  estrecha con ratón en escritorio, con punto; híbrido y cambio de puntero, verificación documentada.
- **Imán**: como máximo 8 px; 24 y 32 px desde el área de reposo; sin sobrepasar el destino; vuelta al reposo
  en ≤ 300 ms con foco o con el menú abierto (RF-7, RF-9). Precisada en la segunda revisión (7).
- **Foco**: RF-12 solo para los elementos de RF-10 y RF-11, con el estado final al instante; marca, enlace
  de salto, botón «Menú» y enlaces del menú conservan su hover de hoy.
- **No tapar**: con el puntero sobre un pulsable, aro sin relleno, y transición de disco a aro solo de
  contorno; el foco nunca queda oculto del todo (WCAG 2.4.11); el contorno puede cruzar glifos (RF-5). Las
  excepciones las fijan la respuesta 7 de abajo y la segunda revisión (2).
- **Barrido**: 1 px de suavizado en el frente, ≥ 4,5:1 a cada lado del frente, texto y nombre accesible sin
  cambios, botón del sistema en colores forzados, solo fondo si el texto no cambia de color (RF-11, RF-22).
  Colores forzados precisados en la segunda revisión (4).
- **Interrupciones**: la salida continúa desde el estado actual. Sustituida en la segunda revisión (8):
  «Ver proyectos» completa la animación en curso.
- **Scroll**: el recálculo va en el único fotograma de scroll actual, sin otro listener ni ampliar la skill.
- **Identidad**: aprobados en bloque el diseño del punto, los tiempos (150, 200, 300, 400 y 500 ms), los
  umbrales (24, 32 y 8 px), los 2 botones magnéticos, el subrayado del pie, el barrido ≤ 400 ms que se
  retira hacia la derecha y la salida por la derecha del enlace de la barra. Paleta y tipografía, sin
  cambios.
- **Sin JavaScript**: se mantienen los hovers de hoy con sus transiciones (RF-17); sin punto ni imán. Ver las
  respuestas 3 y 6 de abajo sobre RF-12, RF-21 y táctil.
- **Contraste del punto**: basta con un tono ≥ 3:1 sobre blanco, negro, azul y cada pantalla de mockup (RF-2).
  Precisada en la segunda revisión (10).
- **Teclado**: cualquier tecla oculta el punto hasta que el puntero vuelva a moverse (RF-6). Precisada en la
  segunda revisión (9): las modificadoras no.
- **Móvil**: la página se ve exactamente como hoy, salvo que el hover ya no queda pegado (RF-20). Precisada
  en la segunda revisión (3).
- **Casos límite añadidos**: entrada del CTA del hero, menú en transición, cambio de movimiento reducido a
  mitad de sesión, pérdida de foco de la ventana, selección de texto y barra de desplazamiento, imán con
  pulsación.
- **CLS**: todas las entradas, incluidas las de entrada reciente, con un recorrido en el orden del documento.
  Sustituida en la segunda revisión (1 y 13): ya no se exige CLS = 0.
- **Tolerancias**: 1 px en tamaños y posiciones; «ocupa todo el ancho» con ±1 px.

## Decisiones del usuario (respuestas a las dudas abiertas de la clarificación)
1. **Imán en el centro**: el mínimo de 3 px se exige con el puntero sobre el borde del área de reposo; hacia
   el centro el desplazamiento decrece de forma progresiva y en el centro exacto es 0 (RF-7).
2. **Relleno del punto y retardos**: «sobre un pulsable» se refiere a la posición del puntero. Mientras el
   punto se pone al día (hasta 150 ms en posición y 200 ms en estado) puede pasar con relleno sobre un
   pulsable; una vez asentado, sobre un pulsable siempre es un aro sin relleno (RF-5). Precisada en la 7.
3. **Sin JavaScript**: RF-12 (estado final de hover al instante con el foco) y RF-21 (sin hover pegado tras un
   toque en un híbrido) solo se exigen con el script ejecutado. Sin script, la página se comporta como hoy
   (RF-17), salvo lo que precisa la 6 para táctil.
4. **Recorrido de CLS en el proyecto móvil**: se toca cada enlace y botón cancelando su navegación y su
   desplazamiento (no se siguen); el botón «Menú» se toca y el menú se cierra antes de seguir. Precisada en la
   segunda revisión (13).
5. **Móvil**: la única diferencia permitida respecto a hoy es que el hover ya no queda pegado tras tocar
   (RF-15, RF-16, RF-20). Precisada en la segunda revisión (3).
6. **Sin JavaScript en táctil**: RF-15 (filas estáticas en táctil), RF-16 (ningún hover de RF-10 y RF-11
   queda pegado tras tocar) y RF-20 se exigen también sin JavaScript, porque dependen de si el dispositivo
   tiene hover y no del script. El único requisito de táctil que depende del script es el del híbrido (RF-21).
   Sin script no hay punto ni imán, se conservan las transiciones CSS de hoy y RF-12 y RF-21 no se exigen
   (RF-17). Precisa la respuesta 3.
7. **Relleno del punto**: el relleno sobre un pulsable solo se admite durante el retraso hasta que se detecta
   el pulsable (con scroll, RF-4, o mientras el punto alcanza al puntero, RF-1). La transición de disco a aro
   (RF-3) va siempre sin relleno, solo con el contorno (RF-5). Precisa la respuesta 2; ampliada en la
   segunda revisión (2).

## Decisiones del usuario (segunda revisión)
1. **CLS**: la regla pasa a ser «la 002 no empeora el CLS respecto a la base `0f6b12d`», medido con el mismo
   recorrido de carga y de puntero o toques. Desaparece «CLS = 0». No se tocan la barra ni el menú
   (requisito de estabilidad).
2. **Relleno durante la entrada del CTA y la transición del menú**: se admite el disco con relleno sobre un
   pulsable también durante la entrada del CTA del hero y mientras el menú está en transición. La excepción
   termina cuando acaba el fundido de entrada del CTA y cuando terminan todas las animaciones de apertura o
   cierre del menú; ese fin se define en Definiciones, RF-3, RF-5, RF-7 y Casos límite. Alcance precisado en
   la 17.
3. **RF-20 y los hovers nuevos**: los hovers nuevos de RF-10 y RF-11 solo existen en dispositivos con hover;
   RF-20 cede ante RF-12 (foco con teclado, por ejemplo en una tableta con teclado) y ante RF-22 (colores
   forzados); al tocar un enlace o un botón no se ve ningún hover nuevo y nada queda activo después (RF-10,
   RF-11, RF-12, RF-16, RF-20).
4. **Colores forzados (RF-22)**: botones con los colores del sistema, con un borde visible y sin barrido;
   subrayados de RF-10 en el color del sistema, sin animación; sin punto; todo igual con y sin script.
   Precisada en la 15: sin script, los subrayados son los de hoy.
5. **Movimiento reducido en el pie**: el subrayado nuevo del pie se aplica al instante, coherente con RF-13
   (RF-10, RF-12, RF-13).
6. **Numeración**: no se renumera. Los RF de la spec 001 se citan como «001/RF-x» y los de la spec 000 como
   «000/RF-x» cuando puede haber ambigüedad, para no confundirlos con RF-20 a RF-22 de esta spec.
7. **Imán fuera del botón**: entre 24 px del área de reposo y su borde, el desplazamiento crece de forma
   progresiva desde 0, sin saltos, hasta el valor del borde. Si el puntero sale de la ventana, el botón vuelve
   al reposo en 300 ms como máximo (RF-7, RF-9). Precisada en la 16.
8. **Interrupciones**: si el puntero vuelve a entrar a mitad de una salida, la animación continúa desde el
   estado actual, sin saltos; «Ver proyectos» completa la animación que tenga en curso aunque el puntero
   salga (RF-10, RF-11).
9. **Teclas modificadoras**: Ctrl, Mayús, Alt, Cmd o Meta, solas o combinadas con clic o rueda, no ocultan
   el punto; cualquier otra tecla sí lo oculta (RF-6).
10. **Verificación**: la traducción, la selección de texto y el arrastre de la barra de desplazamiento («el
    punto no interfiere») se comprueban a mano y se documentan; el cambio de preferencia de movimiento se
    aplica en 200 ms como máximo; el contraste del punto se mide sobre el color de fondo de cada pantalla de
    mockup y sobre su color más claro y su color más oscuro (RF-2).
11. **Técnica fuera de los requisitos**: `hadRecentInput`, `@font-face` y la forma de escuchar el scroll
    pasan a «Notas para el plan». En los requisitos solo queda el comportamiento: «se cuentan todos los
    desplazamientos de diseño, también los que siguen a una entrada del visitante» y «la comparación de peso
    excluye solo los archivos de fuente». El comando de peso (`npm run budget`) y el commit base se quedan,
    como en la 001.
12. **Ventana del Pixel 7**: la de referencia es 412×839, la de los tests (corregida en esta spec; la 001 no
    se toca).
13. **Recorrido de CLS**: en los dos perfiles entran todos los pulsables de la página más el enlace de salto;
    los enlaces de dentro del menú quedan fuera; el botón «Menú» se toca (en móvil) o se recorre (en
    escritorio) y el menú se cierra antes de seguir.
14. **Casos límite confirmados tal como están redactados**: sin aro ni imán durante la entrada del CTA y la
    transición del menú, con el fin definido en la decisión 2; el botón en reposo al volver a la ventana; el
    cambio de preferencia de movimiento, aplicado en 200 ms como máximo. Alcance precisado en la 17.
15. **Colores forzados sin script**: se ven los subrayados de hoy, porque RF-17 prevalece y sin script la
    página se comporta como hoy. Lo que es igual con y sin script en RF-22 es lo demás: colores del sistema,
    borde visible, sin barrido y sin punto (RF-17, RF-22). Precisa la decisión 4.
16. **Imán entre 24 y 32 px**: con el efecto activo, el desplazamiento es 0 y el botón queda en reposo. La
    rampa va de 0, a 24 px del área de reposo, hasta el valor del borde. La histéresis solo decide cuándo se
    retira el efecto, para que no se active y desactive sin parar, y no produce desplazamiento entre 24 y
    32 px (RF-7). Precisa la decisión 7.
17. **Alcance de la entrada del CTA del hero**: la excepción (sin aro, disco con relleno y sin imán) vale
    para los dos CTA del hero, el botón de WhatsApp y «Ver proyectos». El resto de pulsables, como los de la
    barra, se comporta con normalidad durante la entrada (Definiciones, RF-3, RF-5, RF-7). Precisa las
    decisiones 2 y 14.
18. **Enlace de salto en el recorrido de CLS**: se enfoca con Tab y se incluye en el recorrido, porque está
    fuera de la pantalla hasta recibir el foco (requisito de estabilidad). Precisa la decisión 13.
19. **Botón «Menú» en el recorrido de escritorio**: se pulsa para abrir el menú y otra vez para cerrarlo,
    antes de seguir (requisito de estabilidad). Precisa la decisión 13.
20. **Umbral de retirada de 32 px**: sale de las medidas automáticas y queda como verificación documentada,
    porque entre 24 y 32 px el botón está en reposo en ambos estados y no se puede observar desde fuera
    (Criterios de finalización).
21. **Cambio de preferencia de movimiento a mitad de sesión**: los 200 ms se exigen en los dos sentidos para
    lo de esta spec (punto, imán y hovers). Se acepta que la salida del hero y las cortinas de la spec 001
    sigan apagadas hasta recargar si se pasa de reducido a permitido, como hoy (Casos límite). Precisa las
    decisiones 10 y 14.
22. **Hover con puntero grueso** (algunos televisores): esos dispositivos reciben los hovers nuevos de RF-10 y
    RF-11 porque tienen hover; RF-20 se refiere solo a dispositivos sin hover (RF-20).

## Decisiones del usuario (validación, 2026-10-25)
23. **Peso de JS**: para las correcciones de la validación (escribir el destino del imán solo cuando cambia,
    cancelaciones de las transiciones con dirección y colores forzados), la spec puede usar hasta 100 bytes
    de JavaScript del sobrante de la spec 001, después de compactar. El margen pasa a +1.636 B de JS; el de CSS
    no cambia (requisito de peso).

## Dudas abiertas
Ninguna.
