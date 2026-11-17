# Fábrica de videos animados

Generador de videos animados verticales 9:16, todo por código: guion, voz, animación y render, sin generadores de video con IA. Este archivo es para Claude Code: explica cómo se hace un video aquí.

Quien te pide el video casi nunca es programador. Háblale en claro (qué vas a hacer, cuánto tarda, si cuesta algo), no le pidas que edite archivos ni que corra comandos, y enséñale el resultado. El repo es autosuficiente: no depende de skills, scripts ni configuraciones fuera de esta carpeta.

## Antes de empezar
- Corre `scripts/requisitos.sh`. Revisa tres partes: lo que hace falta para renderizar los ejemplos, lo que se suma para hacer videos nuevos (Whisper) y lo opcional. No instala nada. Si falta algo, dile al usuario para qué sirve, muéstrale el comando que imprime y pídele permiso antes de instalar.
- Para probar que todo funciona, renderiza un ejemplo. Los de `videos/` traen narración y tiempos, así que no hace falta Whisper ni ElevenLabs y no gasta créditos: `python3 scripts/armar.py videos/tinaco && scripts/render.sh videos/tinaco`. Queda en `videos/tinaco/renders/tinaco.mp4`; dile dónde quedó y ábrelo (`open`).
- Un render tarda minutos (más en los estilos 3D). Avísalo antes de lanzarlo.

## Qué cuesta y qué no
- **Gratis:** los motores, los revisores, Whisper y el render. Todo corre en la compu del usuario.
- **Cuesta créditos:** solo la voz de ElevenLabs (unos 720 por un video de 1:40). Por eso el guion se aprueba ANTES de grabar.
- **Sin llave de ElevenLabs:** no te detengas ni le pidas que contrate nada. Dile que el video va a salir con la voz de prueba gratis (`--kokoro`: local, suena menos natural, la primera vez baja su modelo) y que cuando tenga llave se vuelve a grabar con `python3 scripts/voz.py videos/<slug> --forzar`. La voz de prueba se elige en `plan.voz.kokoro` (por defecto `em_alex`, español).
- **Imágenes** (solo motion con fotos): son opcionales. Usa las que dé el usuario; si hay que generarlas, pregúntale con qué herramienta y usa la calidad más baja que se vea bien.

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
Atajo cuando ya están el plan y la escena: `python3 scripts/generar.py videos/<slug>` (se detiene en el vigía; después `--vigia-ok`). Con la voz de prueba: agrega `--kokoro`.

Ejemplos completos para copiar: `videos/tinaco/` (3D), `videos/retroexcavadora/` (3D corto, con una máquina articulada), `videos/embudo-meta/` (pizarra), `videos/embudo-lentes/` (motion claro) y `videos/contenido-redes/` (motion noche con fotos). Se hicieron antes de las revisiones más nuevas, así que el revisor todavía les marca algunos detalles (por ejemplo, tramos de voz sin animación). Sirven de referencia, no de techo. Para probar la instalación se renderizan directo con `armar.py` + `render.sh`; `generar.py` volvería a pedir Whisper y se detendría en el revisor.

Al entregar: dile al usuario dónde quedó el MP4, ábrelo y cuéntale en una o dos líneas qué revisaste. Si el plan lleva `gancho_post` y `copy`, enséñale también el texto del post.

## El vigía
Antes de cada render, lanza un subagente independiente (herramienta Agent) con el prompt de `guias/VIGIA.md` y las hojas de `videos/<slug>/vigia/`. No le pases tu opinión de la escena: tiene que mirar con ojos frescos. Corrige lo que encuentre y repite hasta que no haya nada grave.

## Reglas
- **El guion manda.** Si un problema no se puede animar, se cambia el problema, no la animación.
- Ni datos inventados ni términos dudosos. Cada término técnico tiene que ser correcto.
- **Por defecto, corto:** 55 a 70 segundos y 4 o 5 problemas, que es lo más visto de este formato. Largo (7 a 11 problemas) solo si el usuario lo pide.
- **El primer cuadro es la portada:** ya tiene que mostrar algo que detenga (el objeto, el resultado, una pregunta). Nunca un fondo vacío. Compruébalo con `scripts/fotos.sh videos/<slug> 0`.
- Números con letra en `texto` (así los dice bien la voz).
- Un solo caso de principio a fin y un solo plano continuo. Cada término es una pieza que aparece y cada problema se ve fallar en rojo.
- El formato "problema por problema" termina en el último término: sin consejo ni frase de cierre. El llamado a la acción solo va si el usuario lo pide.
- **Siempre algo que ilustre lo que se escucha.** Cada frase tiene su propia animación. No se resuelve moviendo la cámara ni el fondo.
- Subtítulos completos, palabra por palabra. Nunca texto encima de una foto: se reubica en un espacio propio de la interfaz.
- **Se construye por relaciones** (3D): piezas de `motor/piezas.js`, `sobre()`, `conectar(puerto…)`, `montar()` y `camara.mostrar()`. Nada de coordenadas de cámara a mano. Si falta una pieza, se agrega a la biblioteca bien hecha, no se improvisa en la escena.
- **Ningún render sin `revisar.mjs` en cero errores y sin el vigía.** `flota: true` no sirve para callar al revisor.
- **No trabar la compu del usuario.** Lo pesado va uno a la vez y con `nice` (los scripts ya lo hacen: Whisper con 4 hilos y el render con un solo trabajador). Nada de renders en paralelo. Al terminar: `scripts/limpiar.sh` y `pkill -f chrome-headless-shell`.
- Las imágenes que use un video van en `videos/<slug>/assets/` con la clase `imagen`.
- No copies la estética exacta de una cuenta o marca ajena (personajes, logotipos, marca de agua): se usa la técnica, no la identidad.

## Voz
ElevenLabs, con la llave en `~/.config/elevenlabs/api_key` o en la variable `ELEVENLABS_API_KEY` (nunca en el repo). La voz por defecto es `qRUgOhnxGASxirG4fKjv`, un narrador mexicano joven de la biblioteca pública, con `eleven_v4` y velocidad 1.1. Se cambia por video en `plan.voz` (`{"id": "…"}`); ahí también puede ir una voz propia del usuario. Si la API no encuentra la voz, hay que agregarla a "My Voices" en ElevenLabs o elegir otra: `voz.py` lo dice en claro cuando pasa. Para cambiar o agregar una sola frase sin volver a grabar todo (solo con ElevenLabs): `scripts/reemplazar_frase.py`. Con la voz de prueba no hace falta: regrabar todo es gratis (`voz.py --kokoro --forzar`).

Música y efectos son opcionales: si existe `videos/<slug>/audio/musica.mp3`, entra muy baja (`plan.musica.volumen`, 0.12 por defecto). El repo no trae música.

## Salida de cada video
- `videos/<slug>/renders/<slug>.mp4`: H.264 + AAC, 30 fps, 1080×1920, −14 LUFS (volumen de redes).
- `plan.json` puede llevar `gancho_post` y `copy` con el texto del post.

## Opcional: acabado de cine en Blender (experimental)
Solo para escenas 3D y solo si el usuario lo pide y tiene Blender. three.js hace la coreografía y Blender el render de una toma, con biseles, materiales, luz global y desenfoque:
```bash
python3 scripts/armar.py videos/<slug>
node scripts/exportar_animacion.mjs videos/<slug> <t0> <t1>      # → videos/<slug>/blender/toma-<t0>-<t1>.glb + .json
blender -b --factory-startup -P scripts/blender_render.py -- toma.glb toma.json salida/cuadro_ --motor cycles --muestras 64
```
Sale una secuencia de PNG de esa toma (sin subtítulos ni voz): es material para montar aparte, no reemplaza al render normal. Es mucho más pesado; corre una toma corta a la vez y con `nice`.
