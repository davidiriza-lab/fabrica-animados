"""Cambia UNA frase de la narración sin volver a grabar todo (ahorra créditos de ElevenLabs).

Uso: python3 scripts/reemplazar_frase.py videos/<slug> <id_del_beat> "Texto nuevo."
     python3 scripts/reemplazar_frase.py videos/<slug> <id_nuevo> "Texto." --agregar <tipo> [--clave "…"]
       (agrega una frase NUEVA al final, p. ej. un llamado a la acción)

1. Actualiza el texto del beat en plan.json.
2. Graba solo esa frase con ElevenLabs, dándole la frase anterior y la siguiente como contexto
   (previous_text / next_text) para que la entonación empate.
3. La empalma en audio/narracion-fuente.mp3 en lugar de la vieja (cortes en el silencio entre frases)
   y guarda la versión anterior como narracion-fuente-antes.mp3.
4. Vuelve a sacar los tiempos (tiempos.py).
"""
import json
import subprocess
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comun import NICE, correr, leer_plan  # noqa: E402
from voz import LLAVE, VOZ_DEFECTO  # noqa: E402


def main() -> None:
    video, bid, nuevo = Path(sys.argv[1]).resolve(), sys.argv[2], sys.argv[3].strip()
    plan = leer_plan(video)
    ids = [b["id"] for b in plan["beats"]]
    agregar = "--agregar" in sys.argv
    if agregar:   # frase nueva al final: se agrega el beat y se graba con la anterior como contexto
        tipo = sys.argv[sys.argv.index("--agregar") + 1]
        beat = {"id": bid, "tipo": tipo, "texto": nuevo}
        if "--clave" in sys.argv: beat["clave"] = sys.argv[sys.argv.index("--clave") + 1]
        plan["beats"].append(beat); ids.append(bid)
    i = ids.index(bid)
    tim = json.loads((video / "timing.json").read_text())
    ps = lambda k: [p for p in tim["palabras"] if p["beat"] == k]
    # cortes: a la mitad del silencio antes y después de la frase vieja
    if agregar:
        ini, fin = ps(i - 1)[-1]["fin"] + 0.3, None   # después de la última frase, con su pausa
    else:
        ini = (ps(i - 1)[-1]["fin"] + ps(i)[0]["ini"]) / 2 if i > 0 else 0.0
        fin = (ps(i)[-1]["fin"] + ps(i + 1)[0]["ini"]) / 2 if i + 1 < len(ids) else None

    plan["beats"][i]["texto"] = nuevo
    (video / "plan.json").write_text(json.dumps(plan, ensure_ascii=False, indent=2))

    voz = {**VOZ_DEFECTO, **plan.get("voz", {})}
    cuerpo = json.dumps({
        "text": nuevo, "model_id": voz["modelo"], "language_code": "es",
        "previous_text": plan["beats"][i - 1]["texto"] if i > 0 else None,
        "next_text": plan["beats"][i + 1]["texto"] if i + 1 < len(ids) else None,
        "voice_settings": {"stability": voz["estabilidad"], "similarity_boost": voz["similitud"], "style": voz["estilo"], "speed": voz["velocidad"], "use_speaker_boost": True},
    }).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{voz['id']}?output_format=mp3_44100_192", data=cuerpo,
                                 headers={"xi-api-key": LLAVE.read_text().strip(), "Content-Type": "application/json"})
    frase = video / "audio" / "frase-nueva.mp3"
    with urllib.request.urlopen(req, timeout=120) as r:
        frase.write_bytes(r.read())
        print(f"  créditos usados: {r.headers.get('character-cost', '?')}")

    fuente = video / "audio" / "narracion-fuente.mp3"
    antes = video / "audio" / "narracion-fuente-antes.mp3"
    fuente.replace(antes)
    # recorta silencios de la frase nueva y deja 0.12 s de aire a cada lado; une a 44.1 kHz
    # al AGREGAR al final se usa la narración completa tal cual (recortarla en un punto que rebasa su duración la desfasaba)
    inicio = "[0:a]asetpts=PTS-STARTPTS,apad=pad_dur=0.35[a];" if agregar else f"[0:a]atrim=0:{ini:.3f},asetpts=PTS-STARTPTS[a];"
    filtro = (inicio +
              "[1:a]silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
              "adelay=120|120,apad=pad_dur=0.12,asetpts=PTS-STARTPTS[b];"
              + (f"[0:a]atrim={fin:.3f},asetpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=0:a=1[o]" if fin else "[a][b]concat=n=2:v=0:a=1[o]"))
    correr(NICE + ["ffmpeg", "-loglevel", "error", "-y", "-i", str(antes), "-i", str(frase), "-filter_complex", filtro, "-map", "[o]", "-ar", "44100", "-b:a", "192k", str(fuente)])
    frase.unlink(missing_ok=True)
    print(f"frase del beat «{bid}» reemplazada; versión anterior en {antes.name}")
    subprocess.run([sys.executable, str(Path(__file__).parent / "tiempos.py"), str(video)], check=True)


if __name__ == "__main__":
    main()
