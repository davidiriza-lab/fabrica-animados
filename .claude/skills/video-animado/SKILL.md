---
name: video-animado
description: Hace videos animados verticales con la fábrica de este repo - explicadores "problema por problema" en 3D (toon, maqueta, plano), pizarra o motion graphics con pantallas web, con voz, subtítulos y render. Úsala cuando el usuario pida un video animado, un "cómo funciona" animado, motion graphics de un proceso o de marketing, o renderizar uno de los ejemplos.
---

# Video animado

1. Lee `CLAUDE.md` en la raíz del repo y síguelo. Empieza por la tabla de estilos y avisa en una línea cuál elegiste.
2. Si es la primera vez, corre `scripts/requisitos.sh`. Para renderizar un ejemplo basta la primera parte (no gasta créditos); para un video nuevo hace falta también Whisper.
3. Guion: `guias/NARRATIVA.md`. Por defecto corto (55 a 70 s, 4 o 5 problemas). Muéstrale el guion al usuario y espera su OK antes de generar la voz.
4. Voz: ElevenLabs si hay llave; si no, dilo y usa la voz de prueba gratis (`--kokoro`). Nunca te detengas por falta de llave.
5. Animación: `guias/ESCENAS.md`. Copia la estructura del ejemplo más parecido en `videos/`.
6. Antes del render: `node scripts/revisar.mjs` en cero errores y el vigía de `guias/VIGIA.md` en un subagente aparte.
7. Lo pesado va uno a la vez. Al terminar, `scripts/limpiar.sh videos/<slug>`, dile al usuario dónde quedó el MP4 y ábrelo.
