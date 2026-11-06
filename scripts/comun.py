"""Utilidades compartidas por los scripts de la fábrica."""
import json
import shutil
import subprocess
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
WHISPER = shutil.which("whisper-cli") or "/opt/homebrew/bin/whisper-cli"
MODELO_WHISPER = Path.home() / ".cache" / "whisper-cpp" / "ggml-large-v3-turbo.bin"
NICE = ["nice", "-n", "19"]   # todo lo pesado corre con prioridad baja: la compu nunca se traba


def leer_plan(video: Path) -> dict:
    return json.loads((video / "plan.json").read_text())


def texto_narrado(plan: dict) -> list[str]:
    """Las frases que se narran, una por beat, en orden."""
    return [b["texto"].strip() for b in plan["beats"]]


def norm(w: str) -> str:
    w = unicodedata.normalize("NFD", w.lower())
    return "".join(c for c in w if (c.isalnum() and unicodedata.category(c) != "Mn"))


def duracion(ruta: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(ruta)],
                         capture_output=True, text=True, check=True).stdout
    return float(out)


def correr(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    return subprocess.run(NICE + cmd, check=True, **kw)
