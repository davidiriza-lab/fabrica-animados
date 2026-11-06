#!/bin/zsh
# Render final del video: UN solo trabajador de Chrome y prioridad baja (la compu nunca se traba).
# Uso: scripts/render.sh videos/<slug> [--borrador]
set -e
V=${1:?uso: scripts/render.sh videos/<slug> [--borrador]}
V=${V%/}; SLUG=$(basename $V)
Q=looks; FPS=30
[ "$2" = "--borrador" ] && Q=draft && FPS=24
mkdir -p $V/renders
# lo que limpiar.sh borra se regenera solo (la narración WAV y el index.html con su motor)
AQUI=${0:A:h}
[ -f $V/audio/narracion.wav ] || nice -n 19 python3 $AQUI/tiempos.py $V --solo-audio
[ -f $V/index.html ] && [ -d $V/motor ] || python3 $AQUI/armar.py $V
# CRF 21: calidad de entrega para redes (Instagram/Facebook recomprimen); con CRF 16 un video con texturas pasaba de 150 MB
nice -n 19 npx hyperframes render $V --workers 1 --quality $Q --fps $FPS --crf ${CRF:-21} -o $V/renders/$SLUG.mp4 --quiet
# limpieza: lo que HyperFrames deja en disco y cualquier Chrome huérfano
rm -rf $V/.hyperframes $V/renders/.hf-segments 2>/dev/null || true
pkill -f "chrome-headless-shell" 2>/dev/null || true
ls -lh $V/renders/$SLUG.mp4
