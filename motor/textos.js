// =====================================================================================
//  textos.js — subtítulos clave y títulos de término, amarrados a la voz
//
//  Lee window.T (timing.json: palabras con tiempo y beat) y window.PLAN (plan.json).
//  Modos (PLAN.textos.modo, o el que trae el estilo):
//    "frase"   → arriba, la frase clave del beat se arma palabra por palabra mientras se dice;
//                negra con borde blanco; ROJA si el beat es un problema. (Stupy Doo)
//    "palabra" → una sola palabra a la vez, la que se está diciendo, centrada abajo;
//                los términos en amarillo. (Mono que habla, Es ingeniería, Ensamblo)
//  En los beats tipo "termino" sale además un TÍTULO grande del término ("Esa es la chimenea").
// =====================================================================================
(function () {
  const T = window.T, PLAN = window.PLAN;
  const tl = window.tl;
  const capa = document.getElementById("textos");
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ%]/g, "");
  const PRESETS = {
    toon: { modo: "frase" },
    maqueta: { modo: "palabra", titulos: false },   // como Es ingeniería: una palabra chica, sin títulos grandes
    plano: { modo: "palabra" },
    pizarra: { modo: "frase" },   // letra de plumón arriba; el término, con marcatexto
    motion: { modo: "completo" }, // motion graphics: TODA la narración, palabra por palabra; la clave resaltada
  };
  const cfg = { ...PRESETS[PLAN.estilo || "toon"], ...(PLAN.textos || {}) };
  document.body.classList.add("textos-" + cfg.modo, "estilo-" + (PLAN.estilo || "toon"));
  const beats = PLAN.beats;
  const palabrasDe = (i) => T.palabras.filter((p) => p.beat === i);

  // ---------------- modo frase: la clave del beat, palabra por palabra ----------------
  function buscarClave(i, clave) {
    // Encuentra en la narración del beat la secuencia de palabras de la clave; devuelve sus tiempos.
    const ps = palabrasDe(i), ks = clave.split(/\s+/).filter(Boolean);
    const kn = ks.map(norm);
    for (let a = 0; a < ps.length; a++) {
      let ok = true;
      for (let k = 0; k < kn.length; k++) if (!ps[a + k] || norm(ps[a + k].w) !== kn[k]) { ok = false; break; }
      if (ok) return ks.map((w, k) => ({ w, ini: ps[a + k].ini }));
    }
    // si no aparece literal (sinónimo, número), se reparte desde la primera palabra que coincida
    const ancla = ps.find((p) => kn.includes(norm(p.w))) || ps[Math.floor(ps.length * 0.4)] || ps[0];
    return ks.map((w, k) => ({ w, ini: (ancla ? ancla.ini : 0) + k * 0.18 }));
  }
  if (cfg.modo === "frase") {
    beats.forEach((b, i) => {
      const clave = b.clave || b.termino;
      if (!clave) return;
      const ps = palabrasDe(i);
      if (!ps.length) return;
      const ws = buscarClave(i, clave);
      const sig = beats.slice(i + 1).findIndex((x) => x.clave || x.termino);
      const fin = Math.min(ps[ps.length - 1].fin + 0.6, sig >= 0 && palabrasDe(i + 1 + sig)[0] ? palabrasDe(i + 1 + sig)[0].ini - 0.05 : Infinity, T.duracion);
      const el = document.createElement("div");
      el.className = "frase" + (b.tipo === "problema" ? " roja" : "") + (b.tipo === "termino" ? " termino" : "");
      ws.forEach((w) => { const s = document.createElement("span"); s.textContent = w.w; el.appendChild(s); });
      capa.appendChild(el);
      const spans = [...el.children];
      tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2 }, Math.max(0, ws[0].ini - 0.2));   // entra suave: en pizarra trae un parche de papel
      spans.forEach((s, k) => {
        tl.fromTo(s, { scale: 0.55, opacity: 0, y: 14 }, { scale: 1, opacity: 1, y: 0, duration: 0.22, ease: "back.out(2.6)" }, ws[k].ini);
        tl.fromTo(s, { color: "#9aa0a8" }, { color: getComputedStyle(el).getPropertyValue("--color-frase") || "#15171c", duration: 0.25 }, ws[k].ini + 0.05);
      });
      tl.to(el, { opacity: 0, y: -10, duration: 0.18 }, fin - 0.18);
      tl.set(el, { opacity: 0 }, fin);
    });
  }

  // ---------------- modo completo: toda la narración, en páginas de máximo 2 renglones ----------------
  // Cada palabra entra cuando se dice; las de la clave (o el término) van resaltadas. "subtitula todo, no ciertas partes"
  if (cfg.modo === "completo") {
    const MAX = cfg.caracteres ?? 34;   // ~2 renglones a 70 px en 980 px de ancho
    beats.forEach((b, i) => {
      const ps = palabrasDe(i);
      if (!ps.length) return;
      // la clave se resalta como FRASE (la secuencia exacta dentro del beat), no palabra suelta: "que" o "a" no se pintan por todos lados
      const marcadas = new Set();
      for (const frase of [b.clave, b.termino].filter(Boolean)) {
        const kn = frase.split(/\s+/).map(norm).filter(Boolean);
        for (let a0 = 0; a0 + kn.length <= ps.length; a0++) if (kn.every((k, j) => norm(ps[a0 + j].w) === k)) { for (let j = 0; j < kn.length; j++) marcadas.add(ps[a0 + j]); break; }
      }
      // páginas: se corta al pasar de MAX caracteres, o en una coma / dos puntos si la página ya va a la mitad
      const paginas = []; let pag = [], largo = 0;
      ps.forEach((p, k) => {
        const ant = pag[pag.length - 1];
        const nombrePropio = ant && /^[A-ZÁÉÍÓÚÑ]/.test(ant.w) && /^[A-ZÁÉÍÓÚÑ]/.test(p.w) && !/[.,:;!?]$/.test(ant.w);   // "Ciudad de México" no se parte
        const dentroDeClave = pag.length && ((marcadas.has(ant) && marcadas.has(p)) || nombrePropio);   // no partir la frase resaltada ni un nombre
        if (pag.length && largo + p.w.length + 1 > (dentroDeClave ? MAX + 14 : MAX)) { paginas.push(pag); pag = []; largo = 0; }
        pag.push(p); largo += p.w.length + 1;
        if (/[,:;]$/.test(p.w) && largo > MAX * 0.45 && k < ps.length - 1) { paginas.push(pag); pag = []; largo = 0; }
      });
      if (pag.length) paginas.push(pag);
      // una página de una sola palabra al final se une a la anterior
      if (paginas.length > 1 && paginas[paginas.length - 1].length === 1) paginas[paginas.length - 2].push(...paginas.pop());
      const sigBeat = palabrasDe(i + 1)[0];
      paginas.forEach((pg, j) => {
        const sig = paginas[j + 1] ? paginas[j + 1][0].ini : sigBeat ? sigBeat.ini : T.duracion;
        const fin = Math.min(sig - 0.08, j + 1 < paginas.length ? sig - 0.08 : pg[pg.length - 1].fin + 0.9, T.duracion);   // la página se va ANTES de que entre la siguiente (no se enciman)
        const el = document.createElement("div");
        el.className = "frase completa" + (b.tipo === "problema" ? " problema" : "") + (b.tipo === "termino" ? " termino" : "");
        pg.forEach((p) => { const sp = document.createElement("span"); sp.textContent = p.w; sp.style.opacity = 0; sp.dataset.ini = p.ini; if (marcadas.has(p)) sp.className = "clave"; el.appendChild(sp); });   // nace oculta: si no, se ve antes de tiempo y "parpadea" al entrar
        capa.appendChild(el);
        // cada palabra aparece cuando se dice: sube un poco con un rebote suave (sin gris previo ni destello).
        // La página sale deslizándose hacia arriba (un destello rápido se ve raro).
        const t0 = Math.max(0, pg[0].ini - 0.06);
        tl.fromTo(el, { opacity: 0, y: 0 }, { opacity: 1, y: 0, duration: 0.01, immediateRender: false }, t0);
        [...el.children].forEach((sp, k) => tl.fromTo(sp, { opacity: 0, y: 28, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.32, ease: "back.out(1.8)", immediateRender: false }, Math.max(t0, pg[k].ini - 0.04)));
        tl.fromTo(el, { opacity: 1, y: 0 }, { opacity: 0, y: -22, duration: 0.2, ease: "power2.in", immediateRender: false }, Math.max(t0 + 0.3, fin - 0.2));
      });
    });
  }

  // ---------------- modo palabra: la palabra que se está diciendo ----------------
  if (cfg.modo === "palabra") {
    const terminos = new Set(beats.flatMap((b) => [b.termino, b.clave].filter(Boolean).flatMap((x) => x.split(/\s+/)).map(norm)));
    const vacias = new Set(["el", "la", "los", "las", "un", "una", "y", "o", "de", "del", "a", "al", "en", "que", "se", "lo", "le", "por", "con", "su", "es", "no", "si", "mas", "tu", "te", "mi"]);
    const lista = T.palabras.filter((p) => (cfg.todas ?? true) || !vacias.has(norm(p.w)));
    lista.forEach((p, k) => {
      const el = document.createElement("div");
      const limpio = p.w.replace(/[.,;:¿?¡!"“”]/g, "");
      if (!limpio) return;
      el.className = "palabra" + (terminos.has(norm(limpio)) ? " clave" : "");
      el.textContent = limpio;
      capa.appendChild(el);
      const fin = lista[k + 1] ? Math.min(lista[k + 1].ini, p.fin + 0.5) : p.fin + 0.4;
      tl.fromTo(el, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.09, ease: "back.out(3)" }, p.ini);
      tl.set(el, { opacity: 0 }, Math.max(p.ini + 0.1, fin));
    });
  }

  // ---------------- título grande del término ----------------
  if (cfg.titulos ?? cfg.modo === "palabra") {   // en modo frase el término ya sale como frase
    beats.forEach((b, i) => {
      if (b.tipo !== "termino" || !b.termino) return;
      const ps = palabrasDe(i);
      if (!ps.length) return;
      const kn = norm(b.termino.split(/\s+/)[0]);
      const ancla = ps.find((p) => norm(p.w) === kn) || ps[ps.length - 1];
      const el = document.createElement("div");
      el.className = "titulo-termino";
      el.textContent = b.termino;
      capa.appendChild(el);
      const t0 = ancla.ini, t1 = Math.min(ps[ps.length - 1].fin + 1.1, T.duracion);
      tl.fromTo(el, { opacity: 0, scale: 0.3, rotation: -14 }, { opacity: 1, scale: 1, rotation: -5, duration: 0.42, ease: "back.out(2.2)" }, t0);
      tl.to(el, { scale: 1.06, duration: (t1 - t0) * 0.8, ease: "sine.inOut" }, t0 + 0.42);
      tl.to(el, { opacity: 0, scale: 0.8, duration: 0.2 }, t1 - 0.2);
    });
  }

  const inicioBeat = (i) => (palabrasDe(i)[0] || {}).ini;
  const crear = (cls, html) => { const el = document.createElement("div"); el.className = cls; el.innerHTML = html; capa.appendChild(el); return el; };

  // ---------------- rótulos binarios (Numeronauta): "PERO…" rojo / "ENTONCES" amarillo ----------------
  if (cfg.rotulos) {
    const r = typeof cfg.rotulos === "object" ? cfg.rotulos : {};
    beats.forEach((b, i) => {
      const t0 = inicioBeat(i);
      if (t0 === undefined) return;
      const txt = b.tipo === "problema" ? r.problema || "PERO…" : b.tipo === "solucion" ? r.solucion || "ENTONCES" : null;
      if (!txt) return;
      const el = crear("rotulo " + (b.tipo === "problema" ? "rojo" : "amarillo"), txt);
      tl.fromTo(el, { opacity: 0, scale: 0.4, rotation: -10 }, { opacity: 1, scale: 1, rotation: -4, duration: 0.3, ease: "back.out(2.5)" }, t0);
      tl.to(el, { opacity: 0, y: -20, duration: 0.2 }, t0 + 1.1);
    });
  }

  // ---------------- rebobinado (Un Ingeniero): ◀◀ entre el problema y su solución ----------------
  if (cfg.rebobinar) {
    beats.forEach((b, i) => {
      if (b.tipo !== "solucion" || !beats[i - 1] || beats[i - 1].tipo !== "problema") return;
      const t0 = inicioBeat(i);
      if (t0 === undefined) return;
      const el = crear("rebobinar", "◀◀");
      tl.fromTo(el, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.15 }, t0 - 0.15);
      tl.to(el, { opacity: 0, duration: 0.2 }, t0 + 0.55);
    });
  }

  // ---------------- barra de piezas (Doozzy): una casilla por término, se llena al nombrarlo ----------------
  if (cfg.progreso) {
    const terms = beats.map((b, i) => ({ b, i })).filter(({ b }) => b.tipo === "termino" && b.termino);
    if (terms.length) {
      const barra = crear("progreso", "");
      const t0 = inicioBeat(0) || 0;
      terms.forEach(({ b, i }) => {
        const c = document.createElement("div"); c.className = "casilla"; barra.appendChild(c);
        const s = document.createElement("span"); s.textContent = b.termino; c.appendChild(s);
        const t = inicioBeat(i);
        tl.fromTo(c, { backgroundColor: "rgba(255,255,255,0.25)" }, { backgroundColor: cfg.colorProgreso || "#ffd23f", duration: 0.25 }, t);
        tl.fromTo(s, { opacity: 0 }, { opacity: 1, duration: 0.2 }, t);
        tl.fromTo(c, { scale: 1 }, { scale: 1.25, duration: 0.15, yoyo: true, repeat: 1 }, t);
      });
      tl.fromTo(barra, { opacity: 0 }, { opacity: 1, duration: 0.3 }, t0 + 0.3);
    }
  }

  // ---------------- tarjetas de dato: beat.dato = {numero, texto} (cifras que dan credibilidad) ----------------
  beats.forEach((b, i) => {
    if (!b.dato) return;
    const ps = palabrasDe(i);
    if (!ps.length) return;
    const k = b.dato.palabra ? norm(b.dato.palabra) : null;
    const ancla = (k && ps.find((p) => norm(p.w).startsWith(k))) || ps[Math.floor(ps.length / 3)];
    const el = crear("tarjeta-dato", `<b>${b.dato.numero}</b><span>${b.dato.texto || ""}</span>`);
    tl.fromTo(el, { opacity: 0, y: 40, scale: 0.85 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(2)" }, ancla.ini);
    tl.to(el, { opacity: 0, y: -20, duration: 0.25 }, Math.min(ps[ps.length - 1].fin + 0.8, T.duracion - 0.1));
  });

  // ---------------- marca de agua ----------------
  if (PLAN.marca) {
    const m = document.createElement("div");
    m.className = "marca"; m.textContent = PLAN.marca;
    capa.appendChild(m);
  }
})();
