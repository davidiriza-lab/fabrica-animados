"""Narración con ElevenLabs, de corrido (una sola toma suena más natural que frase por frase).

Uso: python3 scripts/voz.py videos/<slug> [--forzar]
Lee   plan.json  (beats[].texto y, opcional, plan.voz = {id, modelo, estabilidad, velocidad})
Crea  audio/narracion-fuente.mp3

La llave vive en ~/.config/elevenlabs/api_key (nunca en el repo). Si no hay llave, usa
--kokoro para una voz de prueba local y gratis (HyperFrames TTS).
"""
import argparse
import json
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comun import leer_plan, texto_narrado, correr  # noqa: E402

LLAVE = Path.home() / ".config" / "elevenlabs" / "api_key"
# "David - Energetic, Deep and Pleasant", narrador mexicano joven de la biblioteca pública
# (agregada a My Voices como "Narrador MX - animados"). Los videos de referencia van a ~190 palabras/min.
VOZ_DEFECTO = {"id": "qRUgOhnxGASxirG4fKjv", "modelo": "eleven_v4", "estabilidad": 0.45, "similitud": 0.8, "estilo": 0.15, "velocidad": 1.1}


def elevenlabs(texto: str, voz: dict, destino: Path) -> None:
    cuerpo = json.dumps({
        "text": texto,
        "model_id": voz["modelo"],
        "language_code": "es",
        "voice_settings": {"stability": voz["estabilidad"], "similarity_boost": voz["similitud"], "style": voz["estilo"],
                           "speed": voz["velocidad"], "use_speaker_boost": True},
    }).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{voz['id']}?output_format=mp3_44100_192", data=cuerpo,
                                 headers={"xi-api-key": LLAVE.read_text().strip(), "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        destino.write_bytes(r.read())
        print(f"  créditos usados: {r.headers.get('character-cost', '?')}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--forzar", action="store_true", help="regenera aunque ya exista")
    ap.add_argument("--kokoro", action="store_true", help="voz de prueba local (gratis) en vez de ElevenLabs")
    a = ap.parse_args()
    video = Path(a.video).resolve()
    plan = leer_plan(video)
    destino = video / "audio" / "narracion-fuente.mp3"
    destino.parent.mkdir(parents=True, exist_ok=True)
    if destino.exists() and not a.forzar:
        print(f"ya existe {destino.relative_to(video)} (usa --forzar para rehacerla)")
        return
    # Cada beat termina en punto: la pausa natural entre frases marca el ritmo del video.
    texto = " ".join(t if t[-1] in ".?!…" else t + "." for t in texto_narrado(plan))
    print(f"narrando {len(texto)} caracteres…")
    if a.kokoro:
        wav = destino.with_suffix(".wav")
        (video / "audio" / "texto.txt").write_text(texto)
        correr(["npx", "hyperframes", "tts", str(video / "audio" / "texto.txt"), "--voice", plan.get("voz", {}).get("kokoro", "em_alex"), "-o", str(wav)])
        correr(["ffmpeg", "-loglevel", "error", "-y", "-i", str(wav), "-b:a", "192k", str(destino)])
        wav.unlink(missing_ok=True)
    else:
        elevenlabs(texto, {**VOZ_DEFECTO, **plan.get("voz", {})}, destino)
    print(f"listo: {destino.relative_to(video)}")


if __name__ == "__main__":
    main()
