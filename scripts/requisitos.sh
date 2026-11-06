#!/bin/zsh
# Revisa que estén instaladas las herramientas de la fábrica y dice cómo instalar lo que falte.
# Uso: scripts/requisitos.sh
ok=0; falta=0
si() { print -P "%F{green}✓%f $1"; ok=$((ok+1)); }
no() { print -P "%F{red}✗%f $1\n    → $2"; falta=$((falta+1)); }
opc() { print -P "%F{yellow}·%f $1\n    → $2"; }

command -v node >/dev/null && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 20 ] \
  && si "Node $(node -v)" || no "Node 20 o más nuevo" "brew install node"
command -v python3 >/dev/null && python3 -c 'import sys; sys.exit(sys.version_info < (3, 10))' \
  && si "Python $(python3 -V | cut -d' ' -f2)" || no "Python 3.10 o más nuevo" "brew install python"
command -v ffmpeg >/dev/null && si "ffmpeg" || no "ffmpeg (audio y revisión del video)" "brew install ffmpeg"
[ -d "$(npm root -g 2>/dev/null)/hyperframes" ] && si "HyperFrames $(npx --no-install hyperframes --version 2>/dev/null)" \
  || no "HyperFrames instalado global (render y revisor)" "npm install -g hyperframes && npx hyperframes browser ensure"
command -v whisper-cli >/dev/null || [ -x /opt/homebrew/bin/whisper-cli ] && si "whisper.cpp" \
  || no "whisper.cpp (tiempo de cada palabra)" "brew install whisper-cpp"
[ -f ~/.cache/whisper-cpp/ggml-large-v3-turbo.bin ] && si "modelo de Whisper large-v3-turbo" \
  || no "modelo de Whisper (1.6 GB, una sola vez)" "mkdir -p ~/.cache/whisper-cpp && curl -L -o ~/.cache/whisper-cpp/ggml-large-v3-turbo.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin"
[ -s ~/.config/elevenlabs/api_key ] && si "llave de ElevenLabs" \
  || opc "Sin llave de ElevenLabs (opcional: sin ella usa la voz gratis de prueba con --kokoro)" "mkdir -p ~/.config/elevenlabs && printf '%s' 'TU_LLAVE' > ~/.config/elevenlabs/api_key"

echo
[ $falta -eq 0 ] && echo "Todo listo." || { echo "Faltan $falta. Instálalos y vuelve a correr scripts/requisitos.sh"; exit 1; }
