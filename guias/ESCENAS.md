# Guía de escenas: cómo se anima un video "problema por problema"

`escena.js` es la coreografía de cada video. Es código Three.js de alto nivel que usa el motor `motor/mundo.js`. Ejemplo completo y probado: `videos/tinaco/escena.js`.

## Las 7 reglas visuales (salen de los 50 videos)

1. **Un solo mundo, un solo plano continuo.** Ningún video corta. Es un diorama que se va llenando mientras la cámara viaja entre la vista general y el detalle. Nunca hacer escenas separadas.
2. **Cada término = una pieza nueva que aparece en el mundo**, en el instante en que se nombra o se describe (cae con rebote, crece con resorte, se ensambla pieza por pieza o se dibuja a lo largo de un camino).
3. **Cada problema se ve fallar:** el objeto se tiñe de rojo y pulsa (`alerta`), se sacude, gotea, se inunda, se apaga o se dobla. Las flechas rojas indican empuje o presión.
4. **Los flujos invisibles se hacen visibles:** puntos que viajan por cables y tubos (energía amarilla, agua azul, aire blanco, lodo café, calor rojo).
5. **El mundo es una maqueta en corte:** el terreno es un bloque con la tierra visible a los lados y las casas no tienen muro de enfrente, para que se vea lo de adentro (tubos, cisternas, cimientos).
6. **La cámara siempre se mueve:** viaja al lugar de la siguiente pieza un poco antes de que se nombre, sigue cables y tubos, y abre a vista general en el "Ahora sí…" y en el cierre. El motor le agrega una deriva suave para que nunca esté muerta.
7. **El clima y la hora narran:** lluvia en el problema de agua, atardecer cuando "el agua llega sin fuerza", noche cuando "los paneles no dan nada".

## Cómo se construye una escena: POR RELACIONES (obligatorio desde 6-nov-2026)

**Por qué:** el primer demo se rompió porque todo se escribía con coordenadas a mano. Eso dejó un filtro flotando, tubos sobre la calle, un tinaco que flotaba al subir y tomas cortadas o tapadas. Cada número suelto es una oportunidad de error. Ahora se describen **relaciones e intenciones** y el motor calcula los números. Ejemplo completo: `videos/tinaco/escena.js` (comparar con `escena-a-mano.js`: 793 → 194 números y 24 → 1 coordenadas de cámara).

| En vez de… | Se escribe… | Qué garantiza |
|---|---|---|
| `caja(…, {pos:[1.6, 3.25, -0.8]})` encima de algo | `sobre(pieza, base, {en:[x, z]})` | se apoya en la cara de arriba y se mueve con su base: no puede flotar |
| una ruta de tubo punto por punto | `conectar(puerto(a, "salida"), puerto(b, "entrada"), {via, orden})` | sale derecho de cada puerto, codos a 90°, se recalcula si algo se mueve, espera a que existan sus piezas |
| un filtro con coordenadas junto al tubo | `montar(filtro(), tubo, {desdeFin: 1.6})` | queda SOBRE el tubo aunque el tubo cambie |
| `camara.ir(t, {pos, mira})` | `camara.mostrar(t, [piezas], {azimut, elevacion})` | en el instante t esas piezas se ven completas, con holgura, sin que nada las tape y bajo los subtítulos |
| mover dos cosas a la vez con tiempos parecidos | comportamiento de la pieza: `casa.agregarPiso(t)`, `base.crecer(t)` | lo de encima sube con la MISMA curva: nunca hay un cuadro roto |
| un letrero "1 m" y otro "3 m" | `cota(desde, hasta)` | mide de verdad y escribe el número solo |

**Piezas prefabricadas** (`M.piezas`, archivo `motor/piezas.js`). Cada una se hizo bien una vez y trae puertos con nombre:
- `terreno({huecos})`: bloque en corte con calle, banqueta y pasto. Trae `.banqueta`, `.suelo(x, z)`, `.tuberiaGeneral(t)`, `.enTuberia(x)` y `.excavar(i, t)`.
- `cisterna(hueco, t)`: va dentro de un hueco del terreno; el agua es parte de ella. Puertos `entrada` y `succion`; `.nivel([[t, v]…])`.
- `casa({pisos})`: en corte, sin muro de enfrente. `.armar(t)`, `.agregarPiso(t)`, `.azotea` (todo lo que va `sobre(casa)` sube con ella) y `.pisos[i]` con `.regadera`, `.azulejo`, `.bano` y `.cuarto` (zonas invisibles de encuadre). Puertos `esquinaDerecha` y `esquinaIzquierda` (abajo y en la azotea).
- `tinaco()`: puertos `entrada`, `salida`, `jarro` y `fondo`; `.nivel(claves)`, `.flotador(t)` y `.agua`.
- `jarroDeAire(tin, {t0, dur})`, `regadera()` (puerto `entrada`, `.chorro(t0, t1, "fuerte" | "debil" | "lodo")`), `medidor()`, `bomba()`, `filtro()`, `base({alto})` (`.crecer(t)`), `cota(desde, hasta)`, `arbol()`, `nube()`, `escalera()` y `cubeta()`.
- **¿Falta una pieza?** Se agrega a `motor/piezas.js`, no se improvisa en la escena. Reglas: origen en la base, puertos con dirección, sin caras empalmadas, todo nombrado y su contenido (agua, cartucho) como hijo.

**Cámara por intención:**
- `camara.mostrar(t, [piezas], {dur, azimut, elevacion, holgura, vista})`. El tiempo `t` es cuándo ya debe verse; la cámara arranca `dur` antes.
- Si no hay ángulo que muestre todas las piezas, el revisor lo marca como **toma imposible**: divídela en dos. Por ejemplo, primero el tinaco y luego la regadera; no los dos a la vez si uno está bajo una losa.
- Para interiores usa las zonas: `[piso.bano, piso.regadera]`.
- Ver en una escena qué decidió la cámara: `node scripts/revisar.mjs videos/<slug> --js "window.__tomas"`.

**Inspeccionar cualquier cosa sin renderizar:** `node scripts/revisar.mjs videos/<slug> --js "(() => { M.render(6.6); return M.camara3.position })()"`.

## Estilos (`plan.estilo`)

| Estilo | Se parece a | Material | Texto en pantalla por defecto |
|---|---|---|---|
| `toon` | Stupy Doo, Tumpis R, Doozzy | sombreado plano de 3 tonos + contorno de tinta negra, cielo en degradado, pasto con manchas | `frase`: la frase clave arriba, palabra por palabra, negra con borde blanco; ROJA en los problemas |
| `maqueta` | Es ingeniería, Ensamblo, Un Ingeniero, Numeronauta | luz suave realista, sin tinta, fondo azul con cuadrícula blanca, terreno en corte | `palabra`: una palabra a la vez, condensada itálica en mayúsculas; términos en amarillo + título grande del término |
| `plano` | MONO QUE HABLA, Mr. Curioso (versión isométrica) | ilustración vectorial isométrica: cámara ortográfica, 2 tonos, línea delgada, sin sombras, cielo liso | `palabra`, con contorno; términos en amarillo + título grande |
| `pizarra` | explicadores de plumón (temas no físicos: marketing, procesos) | 2D sobre papel, se DIBUJA (`aparecer(…, {modo: "dibujar"})`), piezas `M.piezas.pz` (celular, página, embudo, contador, flecha…) | `frase` en letra Kalam sobre parche de papel; término con marcatexto. La pizarra se ve siempre de lado a lado y la cámara solo sube y baja (`anchoPizarra`) |
| `motion` | explicadores de marketing y procesos digitales (diseño B "claro limpio") | **otro motor** (`motor-motion/`: HTML/CSS + GSAP, sin three.js). Diseño claro limpio, piezas web realistas (celular, publicación, Administrador de anuncios, landing, código, WhatsApp, notificaciones, métricas). Recorrido de pizarra: las piezas se suman en un lienzo grande y la cámara viaja | `frase` en Montserrat negra; el término en negativo (fondo negro, letra blanca) |

La cámara automática deja libre la franja del subtítulo: en modo `frase` reserva arriba (el sujeto va del 24 % al 94 % de la pantalla); en modo `palabra`, abajo (del 7 % al 62 %). La misma escena sirve para los 3 estilos: cambia `plan.estilo` (prueba: `videos/tinaco`, `tinaco-maqueta`, `tinaco-plano`).

Capas de texto opcionales (`plan.textos`):
- `{"modo": "frase" | "palabra"}` cambia el modo de subtítulo.
- `{"titulos": true}` agrega el título grande del término.
- `{"rotulos": true}` agrega "PERO…" en rojo y "ENTONCES" en amarillo, al estilo Numeronauta.
- `{"rebobinar": true}` agrega ◀◀ entre problema y solución, al estilo Un Ingeniero.
- `{"progreso": true}` agrega una barra con una casilla por término, que se llena al nombrarlo (Doozzy).
- En cualquier beat, `"dato": {"numero": "8×", "texto": "más electricidad", "palabra": "ocho"}` saca una tarjeta de cifra.
- `plan.marca` pone la marca de agua.

## El motor (`M`) en una página

Coordenadas: Y arriba, piso en y=0, 1 unidad ≈ 1 m. Rotaciones en grados. Los colores aceptan un nombre de la paleta (`"concreto"`, `"agua"`, `"rojo"`, `"tierra"`, `"pasto"`, `"metal"`, `"acero"`, `"madera"`, `"muro"`, `"azul"`, `"amarillo"`, `"energia"`…) o un hex.

**Piezas** (todas aceptan `{pos, rot, escala, padre, nombre, tinta:false, casco:false, opacidad, vidrio, capa, brilla, sombra:false, flota, revisar:false}`):
- `caja(an, al, pr, color, o)`: el origen está en la base, así que `pos` y es donde se apoya.
- `cilindro(rArriba, rAbajo, alto, color, o)`, `cono(r, alto, color, o)`, `esfera(r, color, o)`, `toro(r, tubo, color, o)`.
- `plano(an, pr, color, {manchas:true})`: suelo; con `manchas` lleva textura de pasto o tierra.
- `extruir([[x,y],…], profundidad, color, o)`: siluetas como techos a dos aguas, perfiles o letras de piezas raras.
- `tornear([[radio,y],…], color, o)`: sólidos de revolución como tinacos, macetas, focos, botellas o cubetas.
- `tubo(puntos, radio, color)`: curvo, para cables, mangueras y cuerdas.
- `tuberiaViva(puntos, radio, color, {t0, dur, t1, nombre})`: tramos rectos con codos que se recalculan cada cuadro. Cada punto es `[x,y,z]` o un anclaje `punto(pieza, [x,y,z] local)`. Con `t0`/`dur` se tiende; con `t1` se quita. **Úsala para toda plomería y cableado.**
- `tuberia(puntos, radio, color)`: versión fija (solo si nada de lo que toca se mueve).
- `grupo(o)` (para mover varias piezas juntas), `letrero(texto, {alto, fondo})` (etiqueta que siempre mira a la cámara), `brillo(color, {tam})` (resplandor), `luz(pos)` (relleno para interiores en corte).

**Animación** (todo en segundos, sacados de la voz):
- `aparecer(obj, t, {modo})`, con modo `caer` | `crecer` | `subir` | `desplegar` | `estirar` | `volar` (con `desde`) | `pop`. Antes de `t` el objeto no existe.
- `desaparecer(obj, t, {modo:'caer'})`.
- `ensamblar(grupo, t, {modo, escalon, total})`: los hijos aparecen uno por uno (muros, rieles, tramos de tubo).
- `mover(obj, t, {a:[x,y,z]} | {por:[dx,dy,dz]} | {rot:[…]} | {escala}, dur, curva)`: los movimientos se encadenan.
- `sacudir`, `latir` (para señalar "esta es la pieza"), `girar(obj, 'y', vel, t0, t1)`, `oscilar(obj, 'position.y', amp, frec)`.
- `alerta(obj, t0, t1)`: pulso rojo del problema. Se apaga sola.
- `teñir(obj, t, color, dur)`: cambios de color encadenados, como agua que se enturbia y luego se limpia.
- `flujo(puntos | tuberia, {t0, t1, color, n, vel, radio, halo})`: puntos que viajan.
- `trazo(puntos, {t0, dur})`: un tubo que se dibuja a lo largo de su camino.
- `lluvia({centro, tam, t0, t1, n, color})`: sirve también para chorros de regadera y goteos.
- `flecha(desde, hacia, {color, t0, t1})`.
- `pista(objeto, "ruta.prop", [[t, v], [t, v, curva]])` anima cualquier número: nivel de agua, intensidad del sol, opacidad.
- `cadaCuadro((t) => …)`: lógica libre por cuadro, por ejemplo que el flotador siga al nivel del agua.
- Curvas disponibles: `suave` (por defecto), `sale`, `entra`, `seno`, `rebote`, `resorte`, `elastico`, `lineal`.

**Cámara** (`M.camara`):
- `ir(t, {pos, mira, fov}, dur, curva)` lleva la cámara a una nueva toma; siempre viaja, nunca corta.
- `seguir(t, puntos, dur, {desfase})` recorre un cable o un tubo.
- `deriva(amp)` es la respiración de fondo (0.06 por defecto).

**La voz (`V`):**
- `V.beat("id")` → `{ini, fin}`.
- `V.dice("id", "palabra")` → segundo exacto en que se dice la palabra dentro del beat. Acepta `"palabra#2"` (la segunda vez que aparece) y `"conect*"` (por prefijo; ignora acentos y mayúsculas).
- `V.dur` es la duración total.

## Receta para coreografiar un beat
1. **0.2–0.4 s antes** de que empiece el beat, la cámara arranca hacia donde va a pasar (`camara.ir(b.ini - 0.2, …, 1.4–2.4 s)`).
2. En la **palabra que nombra la pieza**, la pieza aparece (`aparecer(…, V.dice(id, "bola"))`).
3. En la **palabra de la acción**, pasa la acción (flujo, nivel de agua, giro).
4. Si es un **problema:** `alerta` desde la palabra del fallo hasta el final del beat + 0.3 s, más el efecto físico (charco, sacudida, goteo).
5. En el **término:** `latir(pieza, V.dice(id, termino))`. La frase clave ya sale arriba sola.
6. Lo que una solución vuelve obsoleto se va (`desaparecer`), y el mundo queda acumulado.

## Cómo hacer que NO se rompa (6-nov-2026)

En el primer demo aparecieron piezas que no encajaban y animaciones con ruido. Las causas y sus reglas:

| Lo que se veía | Por qué pasaba | Regla |
|---|---|---|
| Un filtro flotando en el aire | Estaba pegado a una tubería que desapareció | Las piezas montadas sobre otra van como **hijas** de esa otra (`padre: tin`) o ancladas |
| Tubos que se cambiaban de golpe al subir el tinaco | Había una versión de tubería por cada altura | **`tuberiaViva` con anclajes `punto(obj, local)`**: el tubo sigue a la pieza cada cuadro y nunca se despega |
| Tubo acostado sobre la calle; tubería cruzando la boca de la cisterna | Coordenadas a mano sin pensar en el corte | Lo enterrado corre dentro de la tierra y solo asoma en el corte o donde sale |
| Muros y piso que tiemblan en las orillas | Dos caras en el mismo plano mirando al mismo lado | Nunca empatar caras: los muros van ENTRE los laterales, encima del piso; las calcomanías llevan `capa: true` |
| Puntos de agua vistos a través de muros | Halos dibujados sin profundidad | El motor ya los dibuja con profundidad y adelantados hacia la cámara; `brillo(…, {atraviesa: true})` solo si de verdad debe verse a través |
| Agua parpadeando dentro del tinaco | Dos transparentes ordenándose mal | Lo de adentro es OPACO; solo el envase es `vidrio` (se dibuja al final) |
| Bordes dentados que "hierven" al mover la cámara | Render a 1080 sin suavizado suficiente | El motor dibuja al doble (`supermuestreo: 2`) y lo reduce |
| Terreno con costuras | Bloques sueltos uno junto al otro | Una pieza por superficie: `extruir` con `hoyos` para los huecos (cisterna, fosa) |
| Piezas fuera de cuadro o tapadas al aparecer | La cámara llega tarde o mira a otro lado | La cámara llega 0.2–0.5 s ANTES; el lente es de 36° (en 9:16 el ángulo horizontal es angosto) |

**Anclajes y tuberías vivas:**
```js
const tin = grupo({ pos: [1.6, 3.25, -0.8], nombre: "tinaco" });
const bajada = tuberiaViva(
  [punto(tin, [-0.84, 0.2, 0]), punto(tin, [-1.2, 0.2, 0]), [0.4, 2.6, -0.8], [1.2, 2.6, -2.6]],   // anclado + fijo
  0.06, "#eef2f5", { nombre: "bajada", t0: V.dice("gravedad", "tubo"), dur: 1.4 });                 // se tiende en 1.4 s
flujo(bajada, { t0: …, color: "agua" });                // el flujo sigue al tubo aunque se mueva
mover(tin, t, { por: [0, 3.25, 0] }, 0.9, "resorte");   // el tubo se estira solo
```
Para que un tramo quede vertical aunque la pieza suba, usa un punto fijo abajo y un `punto(obj, …)` arriba con la misma x/z.

**Nombra todo** (`nombre: "filtro de sedimentos"`): el revisor reporta por nombre.

**Revisión obligatoria antes del render:**
1. `node scripts/revisar.mjs videos/<slug>` revisa sin renderizar:
   - piezas que aparecen **fuera de cuadro**, **cortadas**, **muy chicas** o **tapadas**;
   - piezas **sueltas** que no tocan nada;
   - **tuberías** que siguen a una pieza invisible;
   - **caras empalmadas** que parpadean;
   - palabras que la escena busca y la voz no dice;
   - errores de JavaScript.

   Escapes válidos: `flota: true` para lo que de verdad flota (nubes, cubeta en la mano, cotas) y `revisar: false` para decoración que la losa tapa a propósito.
2. `scripts/fotos.sh` en 20+ instantes: la revisión a ojo sigue siendo necesaria (encuadre, legibilidad, que se entienda).
3. Después del render, `python3 scripts/revisar_video.py videos/<slug>` revisa saltos, parpadeos, cuadros negros, volumen y duración.

`generar.py` corre los tres. Si la revisión de la escena encuentra errores, se detiene.

## Trucos aprendidos (prueba del tinaco, 5-nov-2026)
- **Objetos translúcidos** (tinacos, tanques, tubos de vidrio): usar `vidrio: true, opacidad: 0.4, casco: false`. El casco de tinta se vería como relleno negro detrás.
- **Interiores en corte:** agregar `M.luz([x, y, z])` dentro de cada piso. Sin ella quedan grises por la sombra de la losa. La intensidad por defecto (2.2) es la buena; con 18 se quema todo.
- **Tuberías que cambian de altura:** ~~una versión por altura~~ → `tuberiaViva` con anclajes (ver arriba).
- **Cámaras de interior:** ponerlas a la altura de los ojos y lejos (z ≈ 9). Si se ponen cerca y arriba, la losa tapa todo.
- **Revisar con `scripts/fotos.sh`** en 15–20 instantes antes del render final; es barato y se ve todo de golpe.


## Motor MOTION (`plan.estilo: "motion"`, 6-nov-2026)
Para temas que no son físicos (marketing, ventas, procesos digitales). Vive en `motor-motion/` y `armar.py` lo elige solo por el estilo. Comparte con el motor 3D la voz, `timing.json`, los subtítulos (`textos.js`), el revisor, el vigía y el render. Al no tener WebGL, HyperFrames usa su captura rápida.

- **Piezas** (`U.p.*`, en `motor-motion/piezas.js`): `celular` + vistas (`post`, `perfil`, `landing`, `whatsapp`, `creativo`), `objetivos` (Administrador de anuncios), `codigo` (píxel), `meta`, `audiencia`, `noti`, `metrica`, `registrados`, `vivo`, `oferta`, `regalo`, `chip`, `globo`, `tarjeta`.
- **Movimiento** (`motor-motion/ui.js`): `entra`/`sale` (nunca de golpe), `cambiar` (cambio de pantalla dentro del celular), `escribir`, `contador`, `alerta` (anillo rojo y "!"), `flecha` (se dibuja), `viaja`/`recorrer` (algo viaja por la flecha), `cursor.clic`.
- **Cámara de pizarra:** `U.cam.mostrar(t, [piezas])` encuadra esas piezas en la zona libre, debajo de la franja del subtítulo. El **encuadre limpio** abre o corre la toma para que ninguna pieza visible quede a medias en la orilla. Si para que quepa todo hay que alejarse tanto que el texto no se leería, avisa "divide la toma".
- **Reglas que el revisor hace cumplir:** pocas cosas a la vez y **nada que no se lea**. Marca como "Texto que no se lee" cualquier texto que en pantalla mida menos de 20 px; también marca piezas cortadas por la orilla o por la franja, piezas bajo el subtítulo y piezas encimadas sin querer (lo que se pone encima a propósito lleva `encima`). Los adornos que no se leen van con la clase `deco` y deben ser mínimos.
- **Diseño:** B "claro limpio" (fondo claro, tarjetas blancas con sombra suave). El estilo A "noche" es el tema `noche`.

- **Subtítulos (motion): modo `completo`.** Se subtitula TODA la narración palabra por palabra, en páginas de máximo 2 renglones (~34 caracteres; corta en comas y dos puntos), con la clave del beat resaltada (azul; roja en problemas; en negativo en términos). Los otros modos (`frase`, `palabra`) siguen disponibles con `plan.textos.modo`.
- **Texto sobre imágenes: NO.** Los textos no se ponen encima de fotos ni ilustraciones (ni con fondo): se REUBICAN en un espacio propio de la interfaz (el botón que cambia a "✓ Campaña activa", un renglón del post o del anuncio, la hoja de pago, la conversación, la parte de abajo del celular). Las imágenes llevan la clase `imagen` y el revisor marca "Texto encima de una imagen".
- **Subtítulos: cada palabra nace oculta** (`opacity: 0`) y entra cuando se dice. Si nace visible, se ve antes de tiempo y "parpadea" al entrar; el revisor lo marca como "Subtítulo que se adelanta a la voz".
- **Temas (`plan.tema`):** `claro` (diseño B, por defecto), `noche` (estilo A: azul noche, pantallas blancas) . Ejemplo de `noche`: `videos/contenido-redes`. Para la identidad de una marca, se agrega su tema en `motor-motion/ui.css` (`.tema-<nombre>`).
- **Imágenes realistas:** primero se reutiliza lo que ya existe (kit de marca); lo que falta se genera con OpenAI `gpt-image-2` en calidad `medium` solo para protagonistas y `low` para apoyos. Van en `videos/<slug>/assets/`. Los íconos 3D con fondo negro cuadrado NO se ponen sobre el fondo del video (se ven recortados): mejor una pantalla real.
- **Subtítulos:** un bloque nunca parte un nombre propio ("Ciudad de México") ni la frase clave.
- **Secciones:** cada grupo de piezas sale (`sale`) cuando empieza la sección siguiente, para que nada se asome en la orilla de la toma nueva.
- **Siempre algo que ILUSTRE lo que se escucha:** cada frase de la voz tiene su animación propia (algo entra, se escribe, cuenta, se marca, viaja o cambia). No se resuelve con movimiento de cámara ni de fondo. El revisor previo marca "Voz sin animación" en tramos de más de 1.5 s, con la frase que suena ahí, y `revisar_video.py` marca "estático" si el contenido (sin la franja del subtítulo) no se mueve en más de 1.5 s.
