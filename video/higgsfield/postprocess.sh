#!/usr/bin/env bash
# Posproceso del clip de Higgsfield para el hero.
# Uso: video/higgsfield/postprocess.sh ruta/al/clip-higgsfield.mp4
#
# El clip se genera "al revés" (la composición final se desmonta) y aquí se invierte,
# para que el resultado sea: blanco → pantalla central sube → laterales entran → composición final.
# Si el clip ya se generó en el orden correcto, pasa REVERSE=0.
set -euo pipefail

src="${1:?Indica el clip descargado de Higgsfield}"
out="${OUT:-$(dirname "$0")/../../public/media}"
reverse="${REVERSE:-1}"
mkdir -p "$out"

filters="fps=30,scale=1920:1080:flags=lanczos:force_original_aspect_ratio=increase,crop=1920:1080"
[ "$reverse" = "1" ] && filters="reverse,$filters"

# MP4 H.264 (compatibilidad universal), sin audio, con moov al inicio para empezar a reproducir antes
ffmpeg -v error -stats -y -i "$src" -vf "$filters" -an -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p \
  -movflags +faststart -t 8 "$out/hero-desktop.mp4"

# WebM VP9 (más ligero en navegadores que lo soportan)
ffmpeg -v error -stats -y -i "$out/hero-desktop.mp4" -an -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 "$out/hero-desktop.webm"

# Póster: último fotograma (composición final), para cuando el video no pueda reproducirse
ffmpeg -v error -stats -y -sseof -0.05 -i "$out/hero-desktop.mp4" -frames:v 1 -update 1 -q:v 3 "$out/hero-poster.jpg"

ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate \
  -of default=nw=1 "$out/hero-desktop.mp4"
ls -lh "$out"
echo "Listo. Activa el video en src/config/site.js → heroVideo."
