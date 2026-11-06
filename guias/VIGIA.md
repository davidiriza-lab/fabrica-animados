# Vigía: el sentido común antes del render

Nace de un error real: un tinaco con el agua corriendo antes de que existiera el tubo y una escalera recargada al revés. El revisor automático no lo vio porque no tiene sentido común; el vigía sí.

El vigía tiene dos capas. Las dos corren antes de cada render.

## 1. Reglas (automáticas, en `revisar.mjs`)
Las comprueba el motor sin renderizar. Además, el motor ya no deja cometer algunas:

| Regla | Qué la garantiza |
|---|---|
| El agua (o la energía) solo corre por un tubo ya puesto y lo llena desde su origen | `flujo(tubo, …)` espera al tubo y no pasa del frente tendido. Un flujo sin tubo debe ir pegado a uno, o declararse `libre: true` (caída, chorro, derrame) |
| Lo inclinado se recarga en algo | `recargar(pieza, pared)` calcula el ángulo; el revisor marca "inclinada sin recargarse" |
| Lo que se apoya tiene algo debajo | `sobre()`; el revisor marca "sin nada abajo" |
| Un tubo no atraviesa piezas (solo muros, losas y terreno: `estructura`) | el revisor marca "un tubo atraviesa…"; las uniones en T se reconocen |
| Nada se mueve solo | lo que mueve la escena necesita un **agente** (`persona()`) o una **causa** declarada (`mover(obj, t, {por, causa: "el aire lo empuja"})`) |
| Una pieza montada no cuelga en el aire | las prefabricadas traen su soporte (la regadera trae brazo al muro) |

`flota: true` NO es para silenciar al revisor: es solo para lo que de verdad flota (nubes, cotas, letreros). Si algo marcado `flota` se mueve sin causa, el revisor pregunta quién lo mueve.

## 2. Vigía visual (ojos frescos)
Las reglas no ven todo. Un revisor independiente (un agente que NO escribió la escena) mira 2 fotos por beat con su frase narrada y responde con esta lista:

1. **Física:** ¿algo flota, atraviesa a otra cosa, está al revés, chueco, encimado o fuera de escala?
2. **Causa → efecto:** ¿algo pasa antes de su causa (agua antes del tubo, luz antes del cable, el tinaco lleno antes de conectarlo)?
3. **Apoyos:** ¿cada cosa está apoyada, colgada o sostenida por algo creíble?
4. **Agentes:** ¿algo se mueve sin que nada lo mueva?
5. **Lo que dice la voz:** ¿lo que se ve en la foto coincide con la frase? ¿La pieza nombrada se ve y se reconoce?
6. **Legibilidad:** ¿se entiende qué está pasando sin audio? ¿El subtítulo tapa la acción?
7. **Continuidad:** ¿algo desaparece o cambia sin razón entre un beat y otro?

**Cómo correrlo:**
```bash
scripts/vigia.sh videos/<slug>        # → videos/<slug>/vigia/hoja-N.jpg + vigia/beats.md
```
Después, en Claude Code, lanzar un agente independiente con este prompt (no darle la escena ni las conclusiones propias):

> Eres el vigía de sentido común de un video animado. Lee `guias/VIGIA.md` (sección 2), `videos/<slug>/vigia/beats.md` y las imágenes `videos/<slug>/vigia/hoja-*.jpg`. Cada imagen trae 2 fotos por beat con su frase. Revisa la lista de 7 puntos beat por beat. Responde SOLO los problemas reales, uno por línea: `beat N · foto A|B · qué está mal · por qué rompe el sentido común`. Si un beat está bien, no lo menciones. No inventes: si no estás seguro, dilo.

Lo que encuentre se corrige **en el sistema** cuando sea una regla general (pieza prefabricada, regla del motor o del revisor) y en la escena solo cuando sea un caso particular.

## Lo que el vigía encontró en el tinaco y cómo quedó resuelto en el SISTEMA (6-nov-2026)
| Hallazgo | Arreglo general (vale para todo video) |
|---|---|
| Agua corriendo antes de que existiera el tubo | `flujo(tubo)` espera al tubo y lo llena desde su origen |
| Burbuja saliendo por el costado del jarro | el agua sigue EXACTO la polilínea del tubo (antes, una curva que se comía las esquinas) |
| Escalera "cayendo del cielo" inclinada | lo recargado aparece en su lugar (`crecer`), nunca cae |
| Persona flotando junto a la escalera | `persona.subirPor(escalera)`: pies sobre los peldaños |
| Cubeta subiendo sola | agentes: lo que se mueve lo mueve alguien (`persona`) o tiene `causa` |
| Cisterna "saliéndose" del terreno al latir | `latir` / `crecer` escalan desde el CENTRO de la pieza, no desde el origen del mundo |
| Chorro de lodo invisible | chorros con líneas gruesas (antes 1 px; con supermuestreo, medio píxel) |
| Tinaco "con agua roja" en la alerta | la alerta no tiñe envases translúcidos ni contenidos; pone un "!" rojo encima |
| Regadera colgando en el aire | la regadera trae brazo empotrado en el muro y existe desde que se arma la casa |
| Cisterna bajo la calle; red desconectada | terreno con huecos en la cara lateral (dentro del predio); la red va calle → medidor → cisterna → bomba → tinaco |
| El filtro "limpiaba" el agua que ya estaba en el tinaco | `flujo(…, {tramo})`: la tierra llega hasta el filtro y se queda en el cartucho; el tinaco se aclara despacio |
| La voz decía "dos metros" y la cota "3 m" | cotas que miden de verdad y una por cada cosa que se nombra |
| "loza" (vajilla) por "losa" | corregido en todo el proyecto |

## Lo que encontraron el vigía y el revisor del MP4 en maqueta y pizarra, y cómo quedó en el SISTEMA (6-nov-2026)
| Hallazgo | Arreglo general (vale para todo video) |
|---|---|
| Salto en la maqueta: la cámara viajaba ~37 m en menos de un segundo, pegada al suelo | tope de velocidad **relativa** (recorrido ÷ distancia a lo que se mira, `velocidadCamara`, 3.2/s): la toma arranca antes si hay espacio; si no cabe, aviso `[cámara] … se verá como salto` |
| Entre dos tomas la cámara cortaba en línea recta (podía cruzar el terreno) | la cámara gira alrededor de lo que mira (interpolación orbital); el revisor marca `camara-dentro` si en algún instante queda dentro de un sólido |
| Pizarra: el subtítulo quedaba encima del dibujo de arriba (10 beats) | franja de papel FIJA arriba (encabezado de 450 px): el subtítulo vive ahí y lo dibujado se desliza por debajo. (Primero probé un parche por frase y el vigía lo cachó: borraba y devolvía piezas = parpadeo) |
| Pizarra: la marca "!" caía sobre los renglones o sobre el subtítulo | en 2D la marca va en la esquina superior derecha de la pieza, siempre por delante (sin prueba de profundidad) |
| Pizarra: letreros y piezas cortados en la orilla | la pizarra se ve **siempre de lado a lado** (`anchoPizarra`, 6.8): la cámara solo sube y baja. Encuadre limpio: la toma se abre (hasta 30 %) o se corre dentro de su holgura para que cada pieza quede completa adentro o completa afuera. El revisor marca "cortada con la cámara quieta" |
| La cámara tomaba como obstáculo una pieza ya borrada | los obstáculos se filtran por la visibilidad de toda su cadena de padres |
| "Toma imposible" sin decir cuál pieza | el aviso dice qué pieza no se ve y qué la tapa |
| El embudo final dejaba piezas afuera o les pasaba encima | `pz.embudo({ envolver: [piezas] })` calcula la boca y el cuello para rodearlas a todas |

## Lo que encontró el vigía en el motor MOTION (embudo en Meta) y cómo quedó en el SISTEMA (6-nov-2026)
| Hallazgo | Arreglo general |
|---|---|
| Textos de 18–24 px que no se leen en celular | el revisor exige **26 px** reales en pantalla ("Texto que no se lee"); las piezas traen letra de 28–34 px |
| Piezas en la franja de abajo que tapan los botones de Reels/TikTok | la cámara encuadra en 470–1660 px; el revisor marca lo que baje de 1740 px |
| Flechas que salen "de la nada" (su origen quedó fuera de cuadro) | el revisor marca "Flecha que no conecta nada visible"; las flechas de paso se borran con `t1` |
| Una flecha con punta para decir "no se conecta" | `flecha(…, {cortada: true})`: punteada, sin punta y con ✕ roja |
| Vecinos asomándose a medias en la orilla | encuadre limpio de la cámara (abre o corre la toma) |
| Ventanas que tapan el botón donde ocurre la acción | (escena) el botón de la acción siempre visible cuando la voz la nombra |
| El mismo público "malo" reaparece como el "bueno"; el regalo nombrado no es el que se usa después | (escena) continuidad: lo que representa algo distinto se ve distinto, y lo que se nombra es lo que sigue |
