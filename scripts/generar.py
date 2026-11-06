"""Corre el flujo completo de un video, paso por paso y UNO a la vez.

Uso: python3 scripts/generar.py videos/<slug> [--kokoro] [--borrador] [--sin-render] [--fotos 2,10,30]
  1. voz.py      → audio/narracion-fuente.mp3   (se salta si ya existe)
  2. tiempos.py  → timing.json + audio/narracion.wav
  3. armar.py    → index.html
  4. revisar.mjs → revisa la escena sin renderizar (si hay errores se detiene; --forzar para seguir)
  5. vigia.sh    → vigia/hoja-N.jpg: 2 fotos por beat para el VIGÍA visual (guias/VIGIA.md). Se detiene aquí
                   la primera vez: el vigía (agente independiente) revisa y se corrige; luego --vigia-ok para renderizar.
  6. render.sh   → renders/<slug>.mp4
  7. revisar_video.py → saltos, parpadeos, negros, volumen y duración del MP4
  8. limpiar.sh  → borra todo lo intermedio: queda el MP4 final + plan, escena, tiempos y la narración
"""
import argparse
import subprocess
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent


def paso(nombre: str, cmd: list[str], detener: bool = True) -> int:
    print(f"\n▸ {nombre}")
    r = subprocess.run(cmd)
    if r.returncode and detener:
        sys.exit(f"✗ {nombre} falló: corrige lo de arriba (o usa --forzar si es una advertencia aceptada)")
    return r.returncode


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--kokoro", action="store_true")
    ap.add_argument("--borrador", action="store_true")
    ap.add_argument("--sin-render", action="store_true")
    ap.add_argument("--fotos")
    ap.add_argument("--forzar", action="store_true", help="renderiza aunque el revisor encuentre problemas")
    ap.add_argument("--vigia-ok", action="store_true", help="el vigía visual ya revisó esta versión: renderizar")
    a = ap.parse_args()
    v = str(Path(a.video).resolve())
    py = sys.executable
    paso("voz", [py, str(AQUI / "voz.py"), v] + (["--kokoro"] if a.kokoro else []))
    paso("tiempos", [py, str(AQUI / "tiempos.py"), v])
    paso("armar", [py, str(AQUI / "armar.py"), v])
    paso("revisar escena", ["nice", "-n", "19", "node", str(AQUI / "revisar.mjs"), v], detener=not a.forzar)
    if a.fotos:
        paso("fotos", [str(AQUI / "fotos.sh"), v, a.fotos])
    if not a.vigia_ok and not a.sin_render:
        paso("hojas del vigía", [str(AQUI / "vigia.sh"), v])
        print("\n⏸  Falta el VIGÍA visual: lanza el agente independiente con el prompt de guias/VIGIA.md sobre videos/<slug>/vigia/.")
        print("   Corrige lo que encuentre y vuelve a correr con --vigia-ok para renderizar.")
        return
    if not a.sin_render:
        paso("render", [str(AQUI / "render.sh"), v] + (["--borrador"] if a.borrador else []))
        paso("revisar video", [py, str(AQUI / "revisar_video.py"), v], detener=False)
        paso("limpiar", [str(AQUI / "limpiar.sh"), v], detener=False)   # solo queda el MP4 final y las fuentes


if __name__ == "__main__":
    main()
