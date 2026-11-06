#!/bin/zsh
# Fotos sueltas del video para revisarlo sin renderizar (barato). Uso: scripts/fotos.sh videos/<slug> 3.0,10.5,18
set -e
V=${1%/}; AT=${2:?tiempos separados por coma}
rm -rf $V/fotos; mkdir -p $V/fotos
nice -n 19 npx hyperframes snapshot $V --at $AT -o $V/fotos
pkill -f "chrome-headless-shell" 2>/dev/null || true
ls $V/fotos
