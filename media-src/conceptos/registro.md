# Registro de fotos de concepto — Spec 003 (RF-17, RF-27)

Fotos originales generadas con IA para los conceptos ficticios de la landing. No se publican: las variantes
optimizadas (sin metadatos) se generan con `npm run images` en `public/media/conceptos/`.

Convención de nombres: `<concepto>-<foto>.jpg|png`; las protagonistas terminan en `-hero`. Variantes: protagonistas a
640, 1000 y 1376 px; `barberia-barbero` a 320, 480 y 800; `barberia-herramientas` a 400, 640 y 800; el resto a 240,
360 y 480 (nunca por encima del original).

Herramienta común: Google Flow · Nano Banana 2.1 · thinking «Alto» · x1 · 0 créditos · salida 1K (tamaño original,
sin reescalar) · marca de agua visible desactivada en la cuenta. Fecha: 2026-11-08. Proyecto de Flow «nov 08 - 20:52».
Los prompts completos están al final; la tabla solo los resume.

| Archivo | Formato | Prompt (resumen fiel) | Revisada (RNF-7) | Aprobada |
|---|---|---|---|---|
| restaurante-hero.jpg | 16:9, 1376×768 | Picanha en lonchas con costra y chimichurri sobre piedra oscura, brasas y humo al fondo, luz ámbar, espacio negativo oscuro a la izquierda | Sí: sin texto ni defectos | Sí (usuario, 2026-11-08) |
| restaurante-costillas.jpg | 1:1, 1024 | Costillas de cerdo a la brasa glaseadas con panela y café, mazorca asada, plato negro | Sí | Sí (usuario, 2026-11-08) |
| restaurante-trucha.jpg | 1:1, 1024 | Trucha entera a la brasa con limón y hierbas, patacón, pizarra oscura | Sí | Sí (usuario, 2026-11-08) |
| restaurante-postre.jpg | 1:1, 1024 | Crema de maracuyá quemada con maracuyás abiertos, plato oscuro, brasas tenues | Sí | Sí (usuario, 2026-11-08) |
| barberia-hero.jpg | 16:9, 1376×768 | Manos de barbero haciendo un degradado con máquina, cliente de espaldas (sin cara), interior negro con latón y roble | Letras falsas en la placa; no se corrige porque el concepto se sustituirá | Sí (usuario, 2026-11-08) |
| barberia-barbero.jpg | 3:4, 896×1200 | Barbero perfilando barba con navaja y toalla, cliente de perfil desde atrás, luz cálida | Sí: perfil parcial, persona generada | Sí (usuario, 2026-11-08) |
| barberia-herramientas.jpg | 1:1, 1024 | Navaja de latón, brocha y máquina antigua sobre roble con toalla negra | Sí | Sí (usuario, 2026-11-08) |
| tienda-hero.jpg | 16:9, 1376×768 | Audífonos de diseño original (diadema de tela, copas circulares lisas) flotando sobre fondo blanco roto, luz lima desde abajo; sustituye el 2026-11-24 a la primera versión, que llevaba letras falsas | Sí: ampliada, sin letras ni marcas | Sí (usuario, 2026-11-24) |
| tienda-audifonos.jpg | 1:1, 1024 | Audífonos in-ear grafito con estuche abierto, reflejo lima | Sí | Sí (usuario, 2026-11-08) |
| tienda-parlante.jpg | 1:1, 1024 | Parlante cilíndrico de tela grafito con correa lima | Sí | Sí (usuario, 2026-11-08) |
| tienda-reloj.jpg | 1:1, 1024 | Reloj inteligente grafito con correa lima y pantalla apagada | Ojo: forma parecida a un modelo comercial conocido; el usuario la acepta tal cual | Sí (usuario, 2026-11-08) |
| odonto-hero.jpg | 16:9, 1376×768 | Consultorio blanco con sillón cobalto | Sí | Sí (usuario, 2026-11-24) |
| odonto-retrato.jpg | 1:1, 1024 | Retrato con camisa azul (persona generada) | Sí | Sí (usuario, 2026-11-24) |
| odonto-bodegon.jpg | 1:1, 1024 | Cepillo azul en vaso de porcelana | Sí | Sí (usuario, 2026-11-24) |
| clima-hero.jpg | 16:9, 1376×768 | Sala azul hielo con aire de pared y sillón naranja | Sí | Sí (usuario, 2026-11-24) |
| clima-manos.jpg | 1:1, 1024 | Manos con guantes lavando un filtro | Sí | Sí (usuario, 2026-11-24) |

Descartada: «Grilled pork ribs and trout» (dos prompts mezclados por un error al escribir; no se usa).

## Prompts completos
Copiados del historial del proyecto de Flow «nov 08 - 20:52» (2026-11-24).

- **restaurante-hero**: Restaurant hero photo for a contemporary Colombian wood-fire restaurant: a thick sliced picanha steak with charred crust and chimichurri on a dark stone plate, glowing embers and soft smoke in the dark background, warm amber rim light, low three-quarter angle, shallow depth of field, rich dark moody tones, ample dark negative space on the left side. Photorealistic high-end food photography, no text, no logos, no watermark, no people.
- **restaurante-costillas**: Square food photo for a contemporary Colombian wood-fire restaurant: slow-grilled pork ribs glazed with dark panela and coffee, charred edges, on a black ceramic plate, grilled corn on the side, dark moody background, warm amber side light, overhead three-quarter angle. Photorealistic high-end food photography, no text, no logos, no watermark, no people.
- **restaurante-trucha**: Square food photo for a contemporary Colombian wood-fire restaurant: whole charcoal-grilled river trout with crispy skin, lime and fresh herbs, crispy green plantain on the side, on a dark slate plate, dark moody background, warm amber side light, overhead three-quarter angle. Photorealistic high-end food photography, no text, no logos, no watermark, no people.
- **restaurante-postre**: Square dessert photo for a contemporary Colombian wood-fire restaurant: a torched passion fruit cream with a caramelized burnt top, a few fresh passion fruit halves, on a dark ceramic plate, dark moody background with faint embers, warm amber side light. Photorealistic high-end food photography, no text, no logos, no watermark, no people.
- **barberia-hero**: Barbershop hero photo: close-up of a barber's hands giving a sharp skin fade with clippers to a client seen from behind and the side, face not visible, black interior with warm brass accents and dark oak wood, dramatic low-key lighting with a warm highlight on the fresh fade, shallow depth of field, cinematic, ample dark negative space on the left. Photorealistic premium commercial photography, no text, no logos, no watermark, no recognizable faces.
- **barberia-barbero**: Vertical barbershop photo: a barber's hands shaping a client's beard with a straight razor and warm towel, client seen in profile from behind, face not visible, black interior with brass details and dark oak, warm dramatic low-key light, shallow depth of field. Photorealistic premium commercial photography, no text, no logos, no watermark, no recognizable faces.
- **barberia-herramientas**: Square detail photo for a classic gentleman's barbershop: brass straight razor, badger shaving brush and vintage clippers neatly arranged on a dark oak counter with a folded black towel, warm low-key light with brass highlights, black background. Photorealistic premium still life photography, no text, no logos, no watermark, no people.
- **tienda-hero (primera versión)**: E-commerce hero product photo: premium matte graphite over-ear wireless headphones floating at a slight angle above a warm off-white seamless background, a single subtle lime green accent light from below, soft realistic shadow, crisp studio lighting, minimal and bold, generous empty space on the left for a headline. Photorealistic high-end product photography, no text, no logos, no brand marks, no watermark.
- **tienda-hero (segunda versión, en uso, 2026-11-24)**: E-commerce hero product photo: over-ear wireless headphones of an original design, a slim flat woven-fabric headband in graphite, thin straight cylindrical matte metal arms, large perfectly circular flat disc ear cups with a completely smooth blank matte graphite surface, thick round light gray cushions, floating at a slight angle above a warm off-white seamless background, placed on the right third, a single subtle lime green accent light from below, soft realistic shadow, crisp studio lighting, minimal and bold, generous empty space on the left. Plain unmarked surfaces: no buttons, no ports, no grilles, no engravings. Photorealistic high-end product photography, no text, no letters, no logos, no brand marks, no watermark.
- **tienda-audifonos**: Square product photo: matte graphite true wireless earbuds with their open charging case on a warm off-white seamless background, subtle lime green accent reflection, soft realistic shadow, crisp studio lighting, minimal. Photorealistic high-end product photography, no text, no logos, no brand marks, no watermark.
- **tienda-parlante**: Square product photo: compact cylindrical portable bluetooth speaker in graphite fabric with a lime green strap, standing on a warm off-white seamless background, soft realistic shadow, crisp studio lighting, minimal. Photorealistic high-end product photography, no text, no logos, no brand marks, no watermark.
- **tienda-reloj**: Square product photo: sleek graphite smartwatch with a lime green sport band and a blank dark screen, lying at an angle on a warm off-white seamless background, soft realistic shadow, crisp studio lighting, minimal. Photorealistic high-end product photography, no text, no logos, no brand marks, no watermark, nothing displayed on the screen.

## Spec 004 · Esmalte Claro (2026-11-24, aprobadas por el usuario)
Misma herramienta, 0 créditos, proyecto de Flow «nov 24 - 07:54». Personas generadas. Primera sonrisa descartada por el usuario.
- **odonto-hero** (16:9, 1376×768): Wide interior photo of a bright modern dental studio without people: a single elegant white dental chair with vivid cobalt blue upholstery on the right third, pure white walls, pale polished floor, large window with soft morning light, long clean shadows, minimal architecture, generous empty white wall on the left. Photorealistic high-end architectural photography, no text, no letters, no logos, no brand marks, no watermark.
- **odonto-retrato** (1:1, 1024): Square editorial portrait of an anonymous young woman with a relaxed closed-lip to gentle soft smile showing only a little of her natural upper teeth, calm and confident, dark wavy hair, natural skin texture, head and shoulders, looking slightly away, wearing a cobalt blue linen shirt, pure white background, soft daylight. Photorealistic editorial photography, no text, no logos, no watermark.
- **odonto-bodegon** (1:1, 1024): Square still life: a cobalt blue minimalist toothbrush standing in a white porcelain cup next to a small round white ceramic dish and a clear glass of water, on a white surface against a pure white background, crisp soft shadow, bright morning light, minimal. Photorealistic high-end product photography, no text, no letters, no logos, no brand marks, no watermark.

## Spec 004 · Diecinueve Grados (2026-11-24, aprobadas por el usuario)
Misma herramienta y proyecto de Flow, 0 créditos. La rejilla generada se descartó.
- **clima-hero** (16:9, 1376×768): Wide interior photo without people: a calm minimalist living room, plain white wall-mounted split air conditioner high on the right side of a pale icy blue wall, light linen curtain softly blowing in the cool air on the right, a low burnt orange armchair on the right third, warm sun entering from the side, large empty pale icy blue wall on the left half. Photorealistic high-end architectural photography, no text, no letters, no logos, no display, no brand marks, no watermark.
- **clima-manos** (1:1, 1024): Square close-up photo of two hands in plain light gray work gloves gently rinsing a white air conditioner mesh filter under clear running water, droplets frozen in motion, plain burnt orange background wall, crisp daylight, no face. Photorealistic editorial photography, no text, no letters, no logos, no brand marks, no watermark.
