"""Tiempo de cada palabra narrada y a qué beat pertenece.

Uso: python3 scripts/tiempos.py videos/<slug> [--solo-audio]
Lee   audio/narracion-fuente.mp3 + plan.json
Crea  audio/narracion.wav   (volumen de redes: -14 LUFS, con 1.2 s de cola)
      timing.json           {duracion, beats:[{i, ini, fin}], palabras:[{w, ini, fin, beat}]}

Whisper (large-v3-turbo, local, UNO a la vez y con prioridad baja) da cada palabra con su tiempo;
luego se alinea con el guion para saber a qué beat pertenece, aunque Whisper escriba "60"
donde el guion dice "sesenta".

--solo-audio rehace únicamente audio/narracion.wav y deja timing.json como está (no necesita
Whisper). Lo usa render.sh cuando la narración WAV se borró pero los tiempos ya existen.
"""
import difflib
import json
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comun import WHISPER, MODELO_WHISPER, NICE, leer_plan, texto_narrado, norm, duracion, correr  # noqa: E402

COLA = 1.2


def normalizar(fuente: Path, salida: Path, cola: float) -> None:
    """Volumen de redes en DOS pasadas y en estéreo (en mono, el MP4 final quedaba 3 dB más fuerte: −11.8 LUFS)."""
    medida = subprocess.run(NICE + ["ffmpeg", "-hide_banner", "-nostats", "-i", str(fuente), "-ac", "2", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                            capture_output=True, text=True).stderr
    m = json.loads(medida[medida.rindex("{"):medida.rindex("}") + 1])
    filtro = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
              f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,apad=pad_dur={cola}")
    correr(["ffmpeg", "-loglevel", "error", "-y", "-i", str(fuente), "-ac", "2", "-af", filtro, "-ar", "48000", str(salida)])


def main() -> None:
    video = Path(sys.argv[1]).resolve()
    plan = leer_plan(video)
    frases = texto_narrado(plan)
    fuente = video / "audio" / "narracion-fuente.mp3"
    if "--solo-audio" in sys.argv[2:] and (video / "timing.json").exists():
        normalizar(fuente, video / "audio" / "narracion.wav", plan.get("cola", COLA))
        print("narracion.wav lista (timing.json sin cambios)")
        return

    with tempfile.TemporaryDirectory() as d:
        wav16 = Path(d) / "n.wav"
        correr(["ffmpeg", "-loglevel", "error", "-y", "-i", str(fuente), "-ar", "16000", "-ac", "1", str(wav16)])
        correr([WHISPER, "-m", str(MODELO_WHISPER), "-t", "4", "-l", "es", "-ml", "1", "-sow", "-oj", "-np",
                "-of", str(Path(d) / "out"), str(wav16)], capture_output=True)
        datos = json.loads((Path(d) / "out.json").read_text())
    oidas = [{"w": s["text"].strip(), "ini": s["offsets"]["from"] / 1000, "fin": s["offsets"]["to"] / 1000}
             for s in datos["transcription"] if s["text"].strip()]

    # Se usan las palabras del GUION (bien escritas) con los tiempos de Whisper.
    guion = [(w, i) for i, f in enumerate(frases) for w in f.split() if norm(w)]
    a, b = [norm(g[0]) for g in guion], [norm(o["w"]) for o in oidas]
    pareja = [None] * len(guion)
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            pareja[blk.a + k] = blk.b + k
    palabras = []
    for k, (w, i) in enumerate(guion):
        j = pareja[k]
        if j is not None:
            palabras.append({"w": w, "ini": round(oidas[j]["ini"], 3), "fin": round(oidas[j]["fin"], 3), "beat": i})
        else:
            palabras.append({"w": w, "ini": None, "fin": None, "beat": i})
    # Las palabras sin pareja (números, nombres) se reparten entre sus vecinas con tiempo.
    for k, p in enumerate(palabras):
        if p["ini"] is None:
            ant = next((palabras[j] for j in range(k - 1, -1, -1) if palabras[j]["ini"] is not None), None)
            sig = next((palabras[j] for j in range(k + 1, len(palabras)) if palabras[j]["ini"] is not None), None)
            t0 = ant["fin"] if ant else 0.0
            t1 = sig["ini"] if sig else t0 + 0.4
            p["ini"], p["fin"] = round(t0, 3), round(max(t0 + 0.05, t1), 3)

    beats = []
    for i in range(len(frases)):
        ps = [p for p in palabras if p["beat"] == i]
        beats.append({"i": i, "ini": ps[0]["ini"] if ps else 0, "fin": ps[-1]["fin"] if ps else 0})

    salida = video / "audio" / "narracion.wav"
    normalizar(fuente, salida, plan.get("cola", COLA))
    total = round(duracion(salida), 3)
    (video / "timing.json").write_text(json.dumps({"duracion": total, "beats": beats, "palabras": palabras}, ensure_ascii=False, indent=1))
    sin = sum(1 for k in pareja if k is None)
    for bt in beats:
        print(f"  {bt['i']:02d}  {bt['ini']:6.2f}-{bt['fin']:6.2f}  {frases[bt['i']][:64]}")
    print(f"timing.json · {total} s · {len(beats)} beats · {len(palabras)} palabras ({sin} sin pareja exacta)")


if __name__ == "__main__":
    main()
