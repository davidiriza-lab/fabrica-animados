#!/bin/zsh
# Revisa que estén instaladas las herramientas de la fábrica y dice cómo instalar lo que falte.
# Uso: scripts/requisitos.sh
# No instala nada: solo revisa e imprime el comando. Va en tres niveles:
#   1. lo que hace falta para renderizar los ejemplos (no gasta créditos),
#   2. lo que se suma para hacer videos nuevos,
#   3. lo opcional.
base=0; nuevos=0
marca() { print -nP "%F{$1}$2%f "; }
si()  { marca green "✓"; print -r -- "$1"; }
no()  { marca red "✗"; print -r -- "$1"; print -r -- "    → $2"; }
opc() { marca yellow "·"; print -r -- "$1"; print -r -- "    → $2"; }

if [ "$(uname)" = "Darwin" ] && ! command -v brew >/dev/null; then
  opc "Homebrew no está instalado (los comandos de abajo lo usan para instalar lo demás)" \
      '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  echo
fi

echo "Para renderizar los ejemplos"
if command -v node >/dev/null && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 20 ]; then
  si "Node $(node -v)"
else
  no "Node 20 o más nuevo" "brew install node"; base=$((base+1))
fi
if command -v python3 >/dev/null && python3 -c 'import sys; sys.exit(sys.version_info < (3, 10))' 2>/dev/null; then
  si "Python $(python3 -V | cut -d' ' -f2)"
else
  no "Python 3.10 o más nuevo" "brew install python"; base=$((base+1))
fi
if command -v ffmpeg >/dev/null && command -v ffprobe >/dev/null; then
  si "ffmpeg"
else
  no "ffmpeg (audio y revisión del video)" "brew install ffmpeg"; base=$((base+1))
fi
if command -v npm >/dev/null && [ -d "$(npm root -g 2>/dev/null)/hyperframes" ]; then
  si "HyperFrames $(npx --no-install hyperframes --version 2>/dev/null | tail -1)"
else
  no "HyperFrames instalado global (render y revisor)" "npm install -g hyperframes && npx hyperframes browser ensure"; base=$((base+1))
fi

echo
echo "Para hacer tus propios videos"
if command -v whisper-cli >/dev/null || [ -x /opt/homebrew/bin/whisper-cli ]; then
  si "whisper.cpp"
else
  no "whisper.cpp (marca en qué segundo suena cada palabra)" "brew install whisper-cpp"; nuevos=$((nuevos+1))
fi
if [ -f ~/.cache/whisper-cpp/ggml-large-v3-turbo.bin ]; then
  si "modelo de Whisper large-v3-turbo"
else
  no "modelo de Whisper (1.6 GB, se baja una sola vez)" "mkdir -p ~/.cache/whisper-cpp && curl -L -o ~/.cache/whisper-cpp/ggml-large-v3-turbo.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin"; nuevos=$((nuevos+1))
fi

echo
echo "Opcional"
if [ -s ~/.config/elevenlabs/api_key ] || [ -n "$ELEVENLABS_API_KEY" ]; then
  si "llave de ElevenLabs (la voz buena)"
else
  opc "Sin llave de ElevenLabs: los videos nuevos salen con la voz de prueba gratis (--kokoro). Para la voz buena:" \
      "mkdir -p ~/.config/elevenlabs && printf '%s' 'TU_LLAVE' > ~/.config/elevenlabs/api_key"
fi
if command -v blender >/dev/null || [ -d /Applications/Blender.app ]; then
  si "Blender (solo para el acabado de cine de una toma 3D)"
else
  opc "Sin Blender: no hace falta, solo sirve para darle acabado de cine a una toma 3D" "brew install --cask blender"
fi

echo
if [ $base -gt 0 ]; then
  echo "Faltan $base para poder renderizar. Instálalos y vuelve a correr scripts/requisitos.sh"
  exit 1
elif [ $nuevos -gt 0 ]; then
  echo "Ya puedes renderizar los ejemplos (no gasta créditos). Para hacer videos nuevos faltan $nuevos de arriba."
else
  echo "Todo listo."
fi
