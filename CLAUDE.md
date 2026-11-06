# Fábrica de videos animados

Generador de videos animados verticales 9:16, todo por código: guion, voz, animación y render, sin generadores de video con IA. Este archivo es para Claude Code: explica cómo se hace un video aquí.

## Antes de empezar
- Corre `scripts/requisitos.sh`. Si falta algo, muéstrale al usuario el comando que imprime y pídele permiso antes de instalar.
- Para probar que todo funciona, renderiza un ejemplo: los de `videos/` traen narración y tiempos, así que basta con `python3 scripts/armar.py videos/tinaco && scripts/render.sh videos/tinaco`.

## Estilos: cuál usar
| Estilo | Para qué | Motor |
|---|---|---|
| `toon`, `maqueta`, `plano` | "Cómo funciona X" de algo físico (una casa, una máquina, una instalación): un mundo 3D que se arma pieza por pieza en un solo plano continuo | `motor/` (Three.js) |
| `pizarra` | temas no físicos con look de plumón sobre papel | `motor/` en 2D |
| `motion` | marketing, procesos digitales y negocios: pantallas web realistas (celular, anuncio, landing, WhatsApp, métricas). Temas `claro` (por defecto) y `noche` | `motor-motion/` (HTML + GSAP) |

Si el usuario no dice el estilo, elige por el tema y avisa en una línea cuál elegiste. La tabla completa está en `guias/ESCENAS.md` → Estilos.

## Flujo de un video

```bash
python3 scripts/nuevo.py <slug> "Tema" --estilo toon|maqueta|plano   # crea videos/<slug>/ (para motion o pizarra, copia un ejemplo)
# 1. Guion en plan.json → guias/NARRATIVA.md. MUÉSTRASELO AL USUARIO y espera su OK: la voz cuesta créditos.
python3 scripts/voz.py videos/<slug>          # ElevenLabs (o --kokoro: voz de prueba gratis)
python3 scripts/tiempos.py videos/<slug>      # Whisper → timing.json (cada palabra con su tiempo y su beat)
# 2. Coreografía en escena.js con V.dice(beat, palabra) → guias/ESCENAS.md
python3 scripts/armar.py videos/<slug>        # index.html autocontenido
node scripts/revisar.mjs videos/<slug>        # revisor automático: tiene que dar cero errores
scripts/vigia.sh videos/<slug>                # hojas para el VIGÍA visual (ver abajo)
scripts/fotos.sh videos/<slug> 2,8,15,30      # fotos sueltas para revisar a ojo
scripts/render.sh videos/<slug>               # → videos/<slug>/renders/<slug>.mp4
python3 scripts/revisar_video.py videos/<slug> # saltos, parpadeos, volumen, duración y partes estáticas
scripts/limpiar.sh videos/<slug>              # borra lo intermedio
```
Atajo cuando ya están el plan y la escena: `python3 scripts/generar.py videos/<slug>` (se detiene en el vigía; después `--vigia-ok`).

Ejemplos completos para copiar: `videos/tinaco/` (3D), `videos/embudo-meta/` (pizarra), `videos/embudo-lentes/` (motion claro) y `videos/contenido-redes/` (motion noche con fotos). Se hicieron antes de las revisiones más nuevas, así que el revisor todavía les marca algunos detalles (por ejemplo, tramos de voz sin animación). Sirven de referencia, no de techo.

## El vigía
Antes de cada render, lanza un subagente independiente (herramienta Agent) con el prompt de `guias/VIGIA.md` y las hojas de `videos/<slug>/vigia/`. No le pases tu opinión de la escena: tiene que mirar con ojos frescos. Corrige lo que encuentre y repite hasta que no haya nada grave.

## Reglas
- **El guion manda.** Si un problema no se puede animar, se cambia el problema, no la animación.
- Ni datos inventados ni términos dudosos. Cada término técnico tiene que ser correcto.
- Números con letra en `texto` (así los dice bien la voz).
- Un solo caso de principio a fin y un solo plano continuo. Cada término es una pieza que aparece y cada problema se ve fallar en rojo.
- El formato "problema por problema" termina en el último término: sin consejo ni frase de cierre. El llamado a la acción solo va si el usuario lo pide.
- **Siempre algo que ilustre lo que se escucha.** Cada frase tiene su propia animación. No se resuelve moviendo la cámara ni el fondo.
- Subtítulos completos, palabra por palabra. Nunca texto encima de una foto: se reubica en un espacio propio de la interfaz.
- **Se construye por relaciones** (3D): piezas de `motor/piezas.js`, `sobre()`, `conectar(puerto…)`, `montar()` y `camara.mostrar()`. Nada de coordenadas de cámara a mano. Si falta una pieza, se agrega a la biblioteca bien hecha, no se improvisa en la escena.
- **Ningún render sin `revisar.mjs` en cero errores y sin el vigía.** `flota: true` no sirve para callar al revisor.
- **No trabar la compu del usuario.** Lo pesado va uno a la vez y con `nice` (los scripts ya lo hacen: Whisper con 4 hilos y el render con un solo trabajador). Nada de renders en paralelo. Al terminar: `scripts/limpiar.sh` y `pkill -f chrome-headless-shell`.
- Las imágenes que use un video van en `videos/<slug>/assets/` con la clase `imagen`. Si se generan con IA, primero reutiliza lo que ya hay y usa la calidad más baja que se vea bien.
- No copies la estética exacta de una cuenta o marca ajena (personajes, logotipos, marca de agua): se usa la técnica, no la identidad.

## Voz
ElevenLabs, con la llave en `~/.config/elevenlabs/api_key` (nunca en el repo). La voz por defecto es `qRUgOhnxGASxirG4fKjv`, un narrador mexicano joven de la biblioteca pública, con `eleven_v4` y velocidad 1.1. Se cambia por video en `plan.voz` (`{"id": "…"}`). Si la API no encuentra la voz, hay que agregarla a "My Voices" en ElevenLabs o elegir otra. Para cambiar o agregar una sola frase sin volver a grabar todo: `scripts/reemplazar_frase.py`.

## Salida de cada video
- `videos/<slug>/renders/<slug>.mp4`: H.264 + AAC, 30 fps, 1080×1920, −14 LUFS (volumen de redes).
- `plan.json` puede llevar `gancho_post` y `copy` con el texto del post.
