# Video del hero — Higgsfield

Estado: **no generado**. El contenedor de desarrollo no puede subir la referencia ni descargar el resultado:
la red bloquea `upload.higgsfield.ai` y `d2ol7oe51mr4n9.cloudfront.net`.
No se ha gastado ningún crédito en generación (solo consultas de coste).

## Restricciones reales comprobadas (21-10-2026)

- Cuenta: plan gratuito, **10 créditos**.
- Coste de 8 s, 16:9 (consultado con `get_cost`):

| Modelo | Resolución | Fotogramas admitidos | Créditos |
|---|---|---|---|
| `grok_video_v15_lite` | 720p | solo inicial | **8** ← único que cabe |
| `grok_video_v15_lite` | 1080p (reescalado) | solo inicial | 32 |
| `minimax_h3_max` | 768p | inicial + final | 20 |
| `flux_3_video` | 1080p | inicial + final | 64 |
| `seedance_2_5` | 720p | inicial + final | 56 |
| `seedance_2_5` | 1080p | inicial + final | 128 |

## Referencia

`reference-1920x1080.png`: la composición final del hero renderizada desde la propia web
(Playwright, 1920×1080, sin titular ni navegación). Garantiza que las pantallas del video
coinciden con los conceptos reales: Maison Aurèle, Kairo Systems y Halden.

## Estrategia A — con 10 créditos (Grok Lite, solo fotograma inicial)

Como el modelo no admite fotograma final, se genera la secuencia **al revés**: empieza en la
composición final (la referencia) y las pantallas se retiran hasta dejar el fondo blanco.
`postprocess.sh` invierte el clip. Resultado: blanco → sube la pantalla central → entran las laterales →
composición estable, con el último fotograma idéntico a la referencia.

Parámetros:

```json
{
  "model": "grok_video_v15_lite",
  "duration": 8,
  "resolution": "720p",
  "aspect_ratio": "16:9",
  "medias": [{ "role": "start_image", "value": "<media_id de reference-1920x1080.png>" }]
}
```

Prompt:

> Premium advertising product film, locked-off camera, pure white editorial studio background, soft
> refined studio lighting, realistic soft contact shadows. The frame starts exactly as the reference image:
> a large browser window, a smaller browser window and a smartphone overlapping, with perspective depth.
> 0–1 s: everything holds perfectly still. 1–2.8 s: the devices separate very slightly, a calm drift.
> 2.8–5.2 s: the smartphone glides smoothly out of frame to the left and the lower-right browser window
> glides smoothly out of frame to the right. 5.2–6.8 s: the large central browser window sinks smoothly
> downward and exits through the bottom of the frame. 6.8–8 s: only the clean, empty white background
> remains. Devices stay rigid and undistorted, screens keep exactly their original content, no new objects,
> no added text, no camera shake, no morphing, elegant slow ease-in-out motion.

## Estrategia B — con créditos suficientes (orden natural, inicial + final)

`flux_3_video` o `seedance_2_5` (modo `omni_reference`) a 1080p, 8 s, `generate_audio: false`:
`start_image` = fotograma blanco de 1920×1080, `end_image` = `reference-1920x1080.png`.
Prompt: la misma dirección visual en orden directo (0–1,2 s blanco; 1,2–2,8 s la pantalla central sube
desde abajo; 2,8–5,2 s las dos secundarias entran por los laterales; 5,2–7 s se estabilizan; 7–8 s quieto).
Posproceso con `REVERSE=0 video/higgsfield/postprocess.sh clip.mp4`.

## Después de generar

1. Descargar el MP4 del resultado (requiere acceso al CDN).
2. `video/higgsfield/postprocess.sh ruta/clip.mp4` → `public/media/hero-desktop.{mp4,webm}` + `hero-poster.jpg`
   (probado con un clip sintético: H.264 1920×1080, 30 fps, 8,000 s, sin audio).
3. Revisar los fotogramas (pantallas deformadas, texto ilegible) antes de publicarlo.
4. Activar en `src/config/site.js` → `heroVideo`.
