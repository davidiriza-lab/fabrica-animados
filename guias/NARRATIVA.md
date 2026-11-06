# Guía narrativa: cómo se escribe un video "problema por problema"

Sale del análisis de 50 videos virales de este formato (noviembre de 2026). De ellos, 31 usan casi la misma plantilla. Las cuentas cambian de estética entre video y video; **la plantilla narrativa no cambia**. El guion es lo que hace el video. La animación solo lo vuelve visible.

## La idea en una línea

Se arranca con la versión más tonta posible del objeto. Cada problema real obliga a agregarle una pieza, y cada pieza se bautiza con su nombre técnico. Al final, el espectador "construyó" el objeto completo y entiende para qué sirve cada parte.

## Formato A · "Construimos X desde cero" (el principal)

| Beat | Fórmula literal (de los videos) | Tipo en `plan.json` |
|---|---|---|
| Base | "Si [acción simple], ya tienes [X]." · "Si uno nomás pone…, ya tiene…" | `base` |
| Problema | "Pero [falla concreta, doméstica, con consecuencia que se ve]." · "Solo que…" | `problema` |
| Solución | "Entonces…" · "Así que…" · "Para eso…" · "Por eso…" · "Lo arreglas con…" · "¿La solución? …" (verbo en 2.ª persona: pones, le metes, cuelgas) | `solucion` |
| Término | "Ese es el [término]." · "Esa es la…" · "Esos son los…" · "Se llama…" · "Acabas de inventar…" | `termino` (lleva `termino`) |
| Giro (a ~2/3) | "Ahora sí [logro]." → "Hasta que [llueve / llega una tormenta / pasan los años / construyes otro piso]." | `giro` y luego `problema` |
| Dato | "Con el viento al doble, tu molino da 8 veces más." (cifra que sorprende) | `dato` (puede llevar `dato: {numero, texto}`) |


**El formato A termina en el último término.** La última pieza completa el objeto y ahí se acaba: sin tip, sin consejo y sin frase de cierre que lo resuma. Basta con ir sumando elementos hasta tener el objeto completo, igual que los videos de referencia. Tampoco se meten consejos de buenas prácticas (pauta, presupuesto, métricas) en estos guiones.

**Llamado a la acción (opcional, solo si se pide):** después del último término puede ir UNA frase de CTA tipo "Si quieres aprender a hacer todo esto utilizando inteligencia artificial, comenta la palabra: Embudo." (tipo `cta`). Es el remate comercial, no un resumen ni un consejo. Para agregarla sin volver a grabar todo: `python3 scripts/reemplazar_frase.py videos/<slug> cta "…" --agregar cta --clave "…"`.

**Un solo caso de principio a fin:** si el video arranca con un producto de venta directa, todo el embudo es de venta directa (página de producto, prueba social, carrito, oferta). No mezclar con piezas de evento o webinar (registro, clase, recordatorio); eso es otro video. Si a la mitad cambia de caso, el espectador se pierde.

`tip` y `cierre` solo existen para los formatos B, C y D (mito, comparación, lista), o si se piden explícitamente:

| Beat (solo B/C/D) | Fórmula | Tipo |
|---|---|---|
| Tip práctico | "Si ves [X], no está descompuesto: [explicación]." · "Ojo, …" | `tip` |
| Cierre | Espejo: "Ya no es una lámina sobre cuatro postes. Es una cochera de acero." | `cierre` |

**Ciclos:** de 4 a 11 problema → solución → término. Hay dos duraciones que funcionan:
- **Corto (55–70 s, 4–5 ciclos):** el formato de Es ingeniería (11M) y Ensamblo (14M y 7.1M). Son los más vistos del lote.
- **Largo (2:00–2:50, 7–11 ciclos):** Stupy Doo, Tumpis R y Doozzy, con más analogías, más datos y fuentes en el post.

**Encadenado (para el corto):** el término y el siguiente problema van en la misma frase: "Se llama impermeabilizante, pero en temporada de lluvias…". Así se elimina la pausa entre ciclos.

### Reglas de oro del guion
1. **La base es ridículamente simple.** "Si amarras una tela grande con cuerdas a tu espalda, ya tienes un paracaídas." El espectador piensa "eso no puede ser todo" y se queda.
2. **Cada problema se ve.** Nada abstracto: el agua se encharca, la torre se voltea, el WiFi se cae cuando calientas comida. Si no se puede animar, no es un buen problema.
3. **Cada solución es física y concreta:** una pieza que se agrega, se mueve o cambia de forma. La animación es literalmente esa pieza apareciendo.
4. **Una analogía casera cada 1–2 ciclos:** "como una manguera pisada", "como una bolsa del súper", "como la pluma del búho", "como tu mano volteada por la ventana del carro", "como chocar en carro".
5. **Números concretos y con letra en el texto que se narra** (la voz los lee mejor): "sesenta veces por segundo", "quince vueltas por minuto".
6. **Vocabulario mexicano de casa:** tinaco, azotea, losa, recámara, refri, CFE, taquetes y pijas, colonia, nomás, tantito, jalarle, céspol. Nada de "coche", "grifo" o "bombilla".
7. **Frases cortas pero conectadas.** Nunca telegramas sueltos; los conectores (y, pero, así que, porque, entonces) son el ritmo.
8. **El orden de los problemas sube de escala:** de lo obvio (no alcanza, se cae) a lo que casi nadie sabe (rayos, ruido, aire en el tubo). El detalle del gancho va al final.
9. **Exactitud.** Cada término y cada dato tienen que ser correctos. Las cuentas grandes citan fuentes en el post (normas NOM, CENAPRED, Conuee, libros de texto). Si no estás seguro de un dato, no va.

## El gancho vive en el POST, no en la voz

En casi todos los videos la voz arranca directo con "Si…". El gancho es la primera línea del texto del post, y casi siempre señala **un objeto cotidiano, visible y misterioso**:
- "Ese tubo dentro del tanque de tu excusado NO está de adorno" (la plantilla de Doozzy: "X NO está de adorno").
- "¿Para qué son los dientes de sierra en las aspas de los molinos?"
- "Ese hueco alrededor del tronco en una casa del árbol…"
- "¿Para qué son esos tubitos que escurren agua en los muros?" (5.9M)

**La respuesta se paga tarde** (70–90 % del video), en el último o penúltimo ciclo. Ese es el motor de la retención. El gancho del paracaídas (sin objeto misterioso y lejos de la casa) sacó 47K; el de los tubitos del muro, 5.9M.

### Copy del post (plantilla)
```
[Gancho: objeto visible + misterio] [emoji]
[Opcional: "Y ojo: si ves X, no está descompuesto."]

Construimos [X] desde cero, problema por problema: [término 1], [término 2], …, [término N].

¿[Pregunta para comentar: "¿Cuál pieza no sabías que existía?"] 👇

📚 Fuentes
• [fuente real 1]
• [fuente real 2]

#comofunciona #ingenieria #[tema] …
```

## Otros formatos que también funcionan (del mismo lote)

- **B · Mito o regla contraintuitiva** (1Volt1Amp, Noet Sci, 1Cell1Life; el 50 es el más viral del lote con 5.9M): "Los pájaros no vuelan en V para cortar el viento…" → lo que parece lógico → la prueba (año, institución, cifra) → la regla práctica → cierre en espejo ("La pastilla no falla. Te avisa."). Se cumple el ciclo abierto: "Al final, el mito que casi todos creen".
- **C · Dato curioso con escalón:** "Si acaricias tus plantas, crecen menos." → "Pero eso no es lo más raro…" → un dato más fuerte.
- **D · Comparación A/B con tres factores:** "¿Compensa poner paneles? Mismos paneles, dos casas…" → factor 1, 2 y 3 con números → veredicto.

El generador soporta los cuatro: son los mismos tipos de beat (`base`, `problema`, `solucion`, `termino`, `dato`, `giro`, `tip`, `cierre`) en otro orden. En B, C y D casi no hay `termino`; lo que domina son `dato` y `tip`.

## Ritmo y voz
- **165–210 palabras por minuto** en el formato de construir (Stupy Doo y Doozzy rozan 200). La voz por defecto usa `velocidad: 1.1`.
- **Un cambio visual por frase** (cada 2 a 5 s). Cada beat del `plan.json` es una frase y le corresponde un momento de animación.
- Voz masculina mexicana, cercana, de "te lo explico en la cocina". No es locutor de radio. No lleva música protagonista; si hay música, va muy baja.

## Checklist antes de narrar
- [ ] El gancho del post señala algo visible y misterioso, y se resuelve en el último tercio.
- [ ] La base cabe en una línea y suena "demasiado simple".
- [ ] Cada problema se puede ANIMAR (algo que se ve fallar).
- [ ] Cada solución es una pieza nueva que aparece.
- [ ] Cada término es correcto y va solo en su frase ("Ese es el flotador.").
- [ ] Hay al menos 2 analogías caseras y 1 dato numérico.
- [ ] Hay un "Ahora sí… / Hasta que…" hacia los 2/3.
- [ ] (Formato A) Termina en el último término: sin tip, sin consejos y sin frase de cierre.
- [ ] Números escritos con letra en `texto`.
- [ ] Datos verificados; las fuentes van en el `copy`.
