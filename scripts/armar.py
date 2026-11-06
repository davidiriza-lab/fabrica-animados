"""Arma el index.html del video (proyecto HyperFrames autocontenido) desde plan.json + timing.json + escena.js.

Uso: python3 scripts/armar.py videos/<slug>
Copia el motor dentro de la carpeta del video (HyperFrames sirve solo lo que está dentro del proyecto).
"""
import json
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comun import RAIZ, leer_plan  # noqa: E402


def main() -> None:
    video = Path(sys.argv[1]).resolve()
    plan = leer_plan(video)
    timing = json.loads((video / "timing.json").read_text())
    if not (video / "escena.js").exists():
        sys.exit("falta escena.js (la coreografía 3D del video; ver guias/ESCENAS.md)")

    destino = video / "motor"
    if destino.exists():
        shutil.rmtree(destino)
    motion = plan.get("estilo") == "motion"   # motor de motion graphics (HTML/CSS + GSAP, sin three.js)
    base = RAIZ / ("motor-motion" if motion else "motor")
    shutil.copytree(base, destino, ignore=shutil.ignore_patterns("plantilla.html", ".DS_Store", "muestras"))
    if motion:   # comparte con el motor 3D los subtítulos y GSAP
        (destino / "vendor").mkdir(exist_ok=True)
        shutil.copy(RAIZ / "motor" / "vendor" / "gsap.min.js", destino / "vendor" / "gsap.min.js")
        shutil.copy(RAIZ / "motor" / "textos.js", destino / "textos.js")

    dur = f"{timing['duracion']:.3f}"
    musica = ""
    if (video / "audio" / "musica.mp3").exists():
        vol = plan.get("musica", {}).get("volumen", 0.12)
        musica = f'<audio id="musica" src="audio/musica.mp3" data-start="0" data-duration="{dur}" data-track-index="6" data-volume="{vol}"></audio>'
    sfx = []
    for k, s in enumerate(plan.get("sfx", [])):   # [{archivo, t}] — efectos puntuales opcionales
        sfx.append(f'<audio id="sfx{k}" src="{s["archivo"]}" data-start="{s["t"]}" data-duration="{s.get("dur", 1.5)}" data-track-index="{7 + k}" data-volume="{s.get("volumen", 0.5)}"></audio>')

    html = (base / "plantilla.html").read_text()
    html = (html.replace("__TITULO__", plan.get("titulo", video.name))
                .replace("__DURACION__", dur)
                .replace("__TIMING__", json.dumps(timing, ensure_ascii=False))
                .replace("__PLAN__", json.dumps(plan, ensure_ascii=False))
                .replace("__MUSICA__", musica)
                .replace("__SFX__", "\n      ".join(sfx)))
    (video / "index.html").write_text(html)
    (video / "hyperframes.json").write_text(json.dumps({"$schema": "https://hyperframes.heygen.com/schema/hyperframes.json",
                                                        "paths": {"assets": "assets"}}, indent=2))
    (video / "meta.json").write_text(json.dumps({"id": video.name, "name": plan.get("titulo", video.name)}, ensure_ascii=False))
    print(f"index.html listo · {dur} s · estilo {plan.get('estilo', 'toon')} · {len(plan['beats'])} beats")


if __name__ == "__main__":
    main()
