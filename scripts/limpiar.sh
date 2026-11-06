#!/bin/zsh
# Deja un video con SOLO lo esencial (cuidar el espacio de la compu).
# Se queda:  renders/<slug>.mp4 (el final) · plan.json · escena.js · timing.json · audio/narracion-fuente.mp3 (costó créditos)
# Se borra:  fotos/, vigia/, .hyperframes/, motor/ (copia), index.html, hyperframes.json, meta.json, revision.json,
#            audio/narracion.wav (se rehace de la fuente con tiempos.py) y cualquier render que no sea el final.
# Uso: scripts/limpiar.sh videos/<slug>
set -e
V=${1:?uso: scripts/limpiar.sh videos/<slug>}; V=${V%/}; SLUG=$(basename $V)
[ -f "$V/plan.json" ] || { echo "no parece un video: $V"; exit 1; }
antes=$(du -sk "$V" | cut -f1)
rm -rf "$V/fotos" "$V/vigia" "$V/.hyperframes" "$V/motor" "$V/renders/.hf-segments"
rm -f "$V/index.html" "$V/hyperframes.json" "$V/meta.json" "$V/revision.json" "$V/audio/narracion.wav" "$V/audio/texto.txt"
find "$V/renders" -type f ! -name "$SLUG.mp4" -delete 2>/dev/null || true
pkill -f "chrome-headless-shell" 2>/dev/null || true
despues=$(du -sk "$V" | cut -f1)
echo "limpio: $V · $(( (antes - despues) / 1024 )) MB liberados · quedan $(( despues / 1024 )) MB"
