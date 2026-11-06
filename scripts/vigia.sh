#!/bin/zsh
# Prepara lo que mira el vigía visual: 2 fotos por beat (en la palabra clave y al final del beat),
# cada una con el número de beat y su frase, en hojas de 4 beats. Un solo Chrome, prioridad baja.
# Uso: scripts/vigia.sh videos/<slug>      → videos/<slug>/vigia/hoja-N.jpg + beats.md
set -e
V=${1:?uso: scripts/vigia.sh videos/<slug>}; V=${V%/}
AQUI=${0:A:h}
rm -rf $V/vigia; mkdir -p $V/vigia
# instantes y etiquetas (palabra clave del beat y su final)
python3 - $V <<'EOF'
import json, sys, unicodedata
from pathlib import Path
v = Path(sys.argv[1]); plan = json.loads((v / "plan.json").read_text()); tim = json.loads((v / "timing.json").read_text())
norm = lambda w: "".join(c for c in unicodedata.normalize("NFD", w.lower()) if c.isalnum() and unicodedata.category(c) != "Mn")
tiempos, filas = [], ["# Beats para el vigía", "", "Cada beat tiene foto A (palabra clave) y foto B (final del beat).", ""]
for i, b in enumerate(plan["beats"]):
    ps = [p for p in tim["palabras"] if p["beat"] == i]
    if not ps: continue
    clave = (b.get("termino") or b.get("clave") or "").split()
    k = next((p for p in ps if clave and norm(p["w"]) == norm(clave[0])), ps[len(ps) // 2])
    sig = next((tim["palabras"][j]["ini"] for j in range(len(tim["palabras"])) if tim["palabras"][j]["beat"] == i + 1), tim["duracion"])
    a, z = round(k["ini"] + 0.35, 2), round(min(ps[-1]["fin"] + 0.3, sig - 0.05, tim["duracion"] - 0.1), 2)
    tiempos += [a, z]
    filas.append(f"- **beat {i}** ({b['tipo']}) · A {a} s · B {z} s · «{b['texto']}»")
(v / "vigia" / "tiempos.txt").write_text(",".join(str(x) for x in tiempos))
(v / "vigia" / "beats.md").write_text("\n".join(filas) + "\n")
EOF
nice -n 19 npx hyperframes snapshot $V --at $(cat $V/vigia/tiempos.txt) -o $V/vigia/cuadros >/dev/null 2>&1
pkill -f "chrome-headless-shell" 2>/dev/null || true
# etiquetar y armar hojas de 4 beats (8 fotos)
python3 - $V <<'EOF'
import subprocess, sys, json, re
from pathlib import Path
v = Path(sys.argv[1]); cu = sorted((v / "vigia" / "cuadros").glob("frame-*.png"))
ts = [float(x) for x in (v / "vigia" / "tiempos.txt").read_text().split(",")]
beats = [l for l in (v / "vigia" / "beats.md").read_text().splitlines() if l.startswith("- **beat")]
pares = []
for k, t in enumerate(ts):
    f = next((c for c in cu if abs(float(re.search(r"at-([\d.]+)s", c.name).group(1)) - t) < 0.02), None)
    if f: pares.append((k, f))
etiquetadas = []
for k, f in pares:
    n = re.search(r"\*\*beat (\d+)\*\*", beats[k // 2]).group(1)
    out = v / "vigia" / f"e-{k:03d}.png"
    texto = f"beat {n} · {'A' if k % 2 == 0 else 'B'}"
    subprocess.run(["nice", "-n", "19", "ffmpeg", "-v", "error", "-y", "-i", str(f), "-vf",
                    f"scale=360:-2,drawbox=y=ih-40:w=iw:h=40:color=0x1b1d24:t=fill,drawtext=text='{texto}':x=10:y=h-33:fontsize=26:fontcolor=yellow", str(out)], check=True)
    etiquetadas.append(out)
for h in range(0, len(etiquetadas), 8):
    grupo = etiquetadas[h:h + 8]
    entradas = sum([["-i", str(g)] for g in grupo], [])
    filtro = "".join(f"[{i}]" for i in range(len(grupo))) + f"xstack=inputs={len(grupo)}:layout=" + "|".join(f"{(i % 4) * 364}_{(i // 4) * 650}" for i in range(len(grupo))) + ":fill=white" if len(grupo) > 1 else "null"
    subprocess.run(["nice", "-n", "19", "ffmpeg", "-v", "error", "-y", *entradas, "-filter_complex", filtro, str(v / "vigia" / f"hoja-{h // 8 + 1}.jpg")], check=True)
for g in etiquetadas: g.unlink()
EOF
rm -rf $V/vigia/cuadros $V/.hyperframes
ls $V/vigia
