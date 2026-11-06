"""Revisa el MP4 ya renderizado: lo que solo se ve en movimiento.

Uso: python3 scripts/revisar_video.py videos/<slug>
  · saltos   → un cuadro muy distinto a sus vecinos (algo apareció o desapareció de golpe)
  · parpadeo → la imagen sube y baja varias veces seguidas (caras empalmadas, halos, ruido)
  · congelado / negro → tramos sin cambio o en negro
  · audio    → volumen integrado (meta −14 LUFS) y duración igual a la del plan
Corre ffmpeg UNA vez, a 270 px de ancho y con prioridad baja.
"""
import json
import re
import statistics
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comun import NICE  # noqa: E402


def main() -> None:
    video = Path(sys.argv[1]).resolve()
    mp4 = video / "renders" / f"{video.name}.mp4"
    timing = json.loads((video / "timing.json").read_text())
    plan = json.loads((video / "plan.json").read_text())

    out = subprocess.run(NICE + ["ffmpeg", "-v", "info", "-nostats", "-threads", "2", "-i", str(mp4), "-vf",
                                 "scale=270:-2,scdet=threshold=0:sc_pass=0,signalstats,metadata=print:file=-", "-af", "ebur128", "-f", "null", "-"],
                         capture_output=True, text=True)
    t, dif, luz = [], [], []
    actual = None
    for linea in out.stdout.splitlines():
        if "pts_time:" in linea:
            actual = float(linea.split("pts_time:")[1].split()[0])
        elif "lavfi.scd.score=" in linea:
            t.append(actual); dif.append(float(linea.split("=")[1]))
        elif "lavfi.signalstats.YAVG=" in linea:
            luz.append(float(linea.split("=")[1]))
    lufs = re.findall(r"I:\s+(-?[\d.]+) LUFS", out.stderr)
    beat_en = lambda s: max([i for i, b in enumerate(timing["beats"]) if b["ini"] <= s + 0.05] or [0])
    lugar = lambda s: f"{s:6.2f} s · beat {beat_en(s):2d} «{plan['beats'][beat_en(s)]['id']}»"

    problemas, avisos = [], []
    med = statistics.median(dif) if dif else 0
    for i in range(2, len(dif) - 2):
        vecinos = statistics.median([dif[i - 2], dif[i - 1], dif[i + 1], dif[i + 2]])
        if dif[i] > 6 and dif[i] > 4 * vecinos + 1.5:
            problemas.append(f"salto     {lugar(t[i])} · el cuadro cambia {dif[i]:.1f} contra {vecinos:.1f} de sus vecinos")
    # parpadeo: ventanas de 1 s donde la diferencia oscila (sube-baja-sube) muchas veces por encima de lo normal
    fps = round(1 / statistics.median([b - a for a, b in zip(t, t[1:])])) if len(t) > 2 else 30
    ultimo = -10
    for i in range(0, len(dif) - fps, fps // 2):
        v = dif[i:i + fps]
        cambios = sum(1 for k in range(1, len(v) - 1) if (v[k] - v[k - 1]) * (v[k + 1] - v[k]) < 0 and abs(v[k] - v[k - 1]) > max(0.6, 3 * med))
        if cambios >= fps * 0.45 and t[i] - ultimo > 1.5:
            avisos.append(f"parpadeo  {lugar(t[i])} · la imagen tiembla ({cambios} rebotes en 1 s): revisar caras empalmadas o halos")
            ultimo = t[i]
    quieto = 0
    for i, x in enumerate(dif):
        quieto = quieto + 1 if x < 0.002 else 0
        if quieto == fps * 2:
            avisos.append(f"congelado {lugar(t[i])} · 2 s sin ningún movimiento")
    # estático: el CONTENIDO (sin la franja del subtítulo, y=470–1710) no se mueve en más de 1.5 s (siempre algo que ilustre lo que se escucha)
    zona = subprocess.run(NICE + ["ffmpeg", "-v", "info", "-nostats", "-threads", "2", "-i", str(mp4), "-vf",
                                  "crop=1080:1240:0:470,scale=270:-2,scdet=threshold=0:sc_pass=0,metadata=print:file=-", "-an", "-f", "null", "-"],
                          capture_output=True, text=True)
    tz, dz, act = [], [], None
    for linea in zona.stdout.splitlines():
        if "pts_time:" in linea: act = float(linea.split("pts_time:")[1].split()[0])
        elif "lavfi.scd.score=" in linea: tz.append(act); dz.append(float(linea.split("=")[1]))
    voz_fin = max((pp["fin"] for pp in timing["palabras"]), default=dur_aprox) if (dur_aprox := timing["duracion"]) else 0
    corrida, desde = 0, None
    for i, x in enumerate(dz):
        if x < 0.005:
            if corrida == 0: desde = tz[i]
            corrida += 1
        else:
            if corrida >= int(fps * 1.5) and desde is not None and desde < voz_fin:
                problemas.append(f"estático  {lugar(desde)} · {corrida / fps:.1f} s sin movimiento en el contenido (solo subtítulos): ilustra lo que se dice")
            corrida = 0
    oscuros = [t[i] for i, y in enumerate(luz) if y < 12 and i < len(t)]
    if oscuros:
        problemas.append(f"negro     {lugar(oscuros[0])} · {len(oscuros)} cuadros casi negros")
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp4)], capture_output=True, text=True).stdout)
    if abs(dur - timing["duracion"]) > 0.2:
        problemas.append(f"duración  el MP4 dura {dur:.2f} s y la narración {timing['duracion']:.2f} s")
    if lufs:
        I = float(lufs[-1])
        (avisos if abs(I + 14) > 1.5 else []).append(f"audio     volumen integrado {I} LUFS (meta −14)")

    print(f"\nVideo {mp4.name} · {dur:.1f} s · {len(dif)} cuadros · volumen {lufs[-1] if lufs else '?'} LUFS")
    for x in problemas: print("✗ " + x)
    for x in avisos: print("⚠ " + x)
    print("✓ Sin saltos, parpadeos ni cuadros negros." if not problemas and not avisos else f"\n{len(problemas)} por corregir, {len(avisos)} advertencias.")
    sys.exit(1 if problemas else 0)


if __name__ == "__main__":
    main()
