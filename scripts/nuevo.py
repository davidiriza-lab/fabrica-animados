"""Crea la carpeta de un video nuevo con plan.json y escena.js de arranque.

Uso: python3 scripts/nuevo.py <slug> "Tema" [--estilo toon|maqueta|plano]
Después: escribir el guion en plan.json (guias/NARRATIVA.md) y la coreografía en escena.js (guias/ESCENAS.md).
"""
import argparse
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

ESCENA = '''// Coreografía de "{tema}". Se construye POR RELACIONES: guias/ESCENAS.md
// M = el mundo · M.piezas = biblioteca prefabricada · V = tiempos de la voz · PLAN = plan.json
export default function construir(M, V, PLAN) {{
  const {{ sobre, conectar, montar, puerto, aparecer, latir, alerta, flujo, camara }} = M;
  const {{ terreno, casa, arbol }} = M.piezas;
  const b = (id) => V.beat(id), d = (id, w) => V.dice(id, w);

  const T = terreno();
  arbol({{ pos: [-9, 0, -6] }});
  const C = casa({{ pisos: 1 }}).armar(0);

  camara.ir(0, {{ pos: [17, 14, 21], mira: [0, 2, 0] }}, 0);      // toma de apertura (la única coordenada de cámara)
  camara.mostrar(b("base").fin, [C], {{ dur: 2.5 }});              // de aquí en adelante: mostrar(t, [piezas])
}}
'''


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("tema")
    ap.add_argument("--estilo", default="toon", choices=["toon", "maqueta", "plano"])
    a = ap.parse_args()
    v = RAIZ / "videos" / a.slug
    if v.exists():
        raise SystemExit(f"ya existe {v}")
    (v / "audio").mkdir(parents=True)
    plan = {
        "titulo": a.tema,
        "estilo": a.estilo,
        "gancho_post": "",
        "copy": "",
        "voz": {},
        "marca": "",
        "beats": [
            {"id": "base", "tipo": "base", "texto": f"Si …, ya tienes {a.tema.lower()}.", "clave": ""},
        ],
    }
    (v / "plan.json").write_text(json.dumps(plan, ensure_ascii=False, indent=2))
    (v / "escena.js").write_text(ESCENA.format(tema=a.tema))
    print(f"creado {v.relative_to(RAIZ)}/ (plan.json + escena.js)")


if __name__ == "__main__":
    main()
