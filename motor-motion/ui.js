// =====================================================================================
//  ui.js — motor MOTION: piezas web realistas (HTML/CSS) sobre un lienzo grande que la cámara
//  recorre como una pizarra. Todo se anima con la línea de tiempo de GSAP (window.tl), así que es
//  determinista: HyperFrames puede saltar a cualquier segundo.
//
//  Uso en escena.js:   export default function construir(U, V) { … }
//    U.lienzo(ancho, alto)                       tamaño de la pizarra
//    const tel = U.celular(x, y, {nombre})       piezas: devuelven el elemento (con partes útiles)
//    U.entra(el, t, {de}) · U.sale(el, t)        aparecer / desaparecer (con movimiento, nunca de golpe)
//    U.cursor.clic(t, el)                        el cursor viaja y pica
//    U.flecha(desde, hacia, t, {color})          flecha que se dibuja (desde/hacia: elemento o [x, y])
//    U.cam.mostrar(t, [piezas], {dur})           la cámara encuadra esas piezas (deja libre el subtítulo)
//
//  REGLAS: pocas cosas a la vez y nada que no se lea. El revisor marca:
//    texto que en pantalla mide menos de 20 px · piezas cortadas por la orilla o por la franja del
//    subtítulo · piezas encimadas sin querer.
// =====================================================================================
(function () {
  const tl = window.tl;
  const mesa = document.getElementById("mesa"), svg = document.getElementById("trazos");
  // donde vive el contenido: arriba va el subtítulo; abajo (últimos ~260 px) y a la derecha van los botones de Reels/TikTok
  const ZONA = { x0: 50, x1: 1010, y0: 470, y1: 1660 };
  const MIN_TEXTO = 26;   // en un celular, menos de esto ya no se lee (vigía, 6-nov-2026)
  const piezas = [], tomas = [], intenciones = [], flechas = [];
  const NS = "http://www.w3.org/2000/svg";
  const fromTo = (el, a, b, t) => tl.fromTo(el, a, { ...b, immediateRender: false }, t);
  const html = (s) => { const t = document.createElement("template"); t.innerHTML = s.trim(); return t.content.firstElementChild; };

  // ------------------------------------------------------------------ lienzo y piezas
  function lienzo(ancho, alto) {
    mesa.style.width = ancho + "px"; mesa.style.height = alto + "px";
    svg.setAttribute("width", ancho); svg.setAttribute("height", alto); svg.setAttribute("viewBox", `0 0 ${ancho} ${alto}`);
  }
  // pone una pieza en la pizarra (x, y = esquina superior izquierda, en px del lienzo); nace invisible
  function poner(contenido, x, y, o = {}) {
    const e = typeof contenido === "string" ? html(contenido) : contenido;
    e.classList.add("pz");
    Object.assign(e.style, { left: x + "px", top: y + "px", opacity: 0 });
    if (o.rot) e.style.rotate = o.rot + "deg";
    if (o.z) e.style.zIndex = o.z;
    (o.padre || mesa).appendChild(e);
    e.dataset.pieza = o.nombre || "pieza";
    if (o.encima) e.dataset.encima = "1";   // se permite que tape a otra (un globo, un sello)
    piezas.push(e);
    return e;
  }
  // caja de una pieza en coordenadas del lienzo (sin transformaciones)
  function caja(e) {
    let x = 0, y = 0, n = e;
    while (n && n !== mesa) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x, y, w: e.offsetWidth, h: e.offsetHeight, cx: x + e.offsetWidth / 2, cy: y + e.offsetHeight / 2 };
  }
  const punto = (q) => (Array.isArray(q) ? { x: q[0], y: q[1] } : (() => { const c = caja(q); return { x: c.cx, y: c.cy }; })());
  const borde = (e, lado, d = 0) => { const c = caja(e); return { arriba: [c.cx, c.y - d], abajo: [c.cx, c.y + c.h + d], izq: [c.x - d, c.cy], der: [c.x + c.w + d, c.cy] }[lado]; };

  // ------------------------------------------------------------------ movimiento
  const ENTRADAS = { abajo: { y: 90 }, arriba: { y: -90 }, izq: { x: -140 }, der: { x: 140 }, escala: { scale: 0.7 }, pop: { scale: 0.3 }, fundido: {} };
  function entra(e, t, o = {}) {
    const de = ENTRADAS[o.de || "abajo"], dur = o.dur ?? 0.6;
    fromTo(e, { opacity: 0, x: 0, y: 0, scale: 1, ...de }, { opacity: 1, x: 0, y: 0, scale: 1, duration: dur, ease: o.de === "pop" ? "back.out(2)" : "power3.out" }, t);
    e._entra = Math.min(e._entra ?? Infinity, t); e._listo = t + dur;
    return e;
  }
  function sale(e, t, o = {}) {
    const a = ENTRADAS[o.a || "fundido"], dur = o.dur ?? 0.4;
    fromTo(e, { opacity: 1, x: 0, y: 0, scale: 1 }, { opacity: 0, ...a, duration: dur, ease: "power2.in" }, t);
    e._sale = t;
    return e;
  }
  // para partes que NO son piezas (dentro de una pantalla): mostrar / ocultar con fundido
  function mostrar(e, t, dur = 0.35) { e.style.opacity = 0; fromTo(e, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: dur, ease: "power2.out" }, t); return e; }
  function ocultar(e, t, dur = 0.3) { fromTo(e, { opacity: 1 }, { opacity: 0, duration: dur }, t); return e; }
  function pulso(e, t, k = 0.06) { fromTo(e, { scale: 1 }, { scale: 1 + k, duration: 0.22, ease: "power2.out", yoyo: true, repeat: 1 }, t); return e; }
  // cambio de pantalla dentro del celular: la vieja se va a la izquierda, la nueva entra por la derecha
  function cambiar(vieja, nueva, t, dur = 0.55) {
    nueva.style.opacity = 0;
    fromTo(vieja, { x: 0, opacity: 1 }, { x: -120, opacity: 0, duration: dur, ease: "power3.inOut" }, t);
    fromTo(nueva, { x: 160, opacity: 0 }, { x: 0, opacity: 1, duration: dur, ease: "power3.inOut" }, t);
  }
  // texto que se escribe letra por letra (cada letra es un span)
  function escribir(e, texto, t, dur = 1.0) {
    e.textContent = "";
    const n = texto.length;
    [...texto].forEach((ch, i) => { const s = document.createElement("span"); s.textContent = ch; s.style.opacity = 0; e.appendChild(s); fromTo(s, { opacity: 0 }, { opacity: 1, duration: 0.01 }, t + (dur * i) / n); });
    return e;
  }
  // contador: valores que se suceden entre t0 y t1 (cada valor es un span; solo uno visible)
  function contador(e, desde, hasta, t0, t1, o = {}) {
    const pasos = o.pasos ?? 10, fmt = o.formato || ((v) => v.toLocaleString("es-MX"));
    const vals = Array.from({ length: pasos + 1 }, (_, i) => Math.round(desde + ((hasta - desde) * i) / pasos));
    vals.forEach((v, i) => {
      const s = document.createElement("span"); s.className = "num"; s.textContent = (o.antes || "") + fmt(v) + (o.despues || ""); e.appendChild(s);
      const a = i === 0 ? 0 : t0 + ((t1 - t0) * i) / pasos, b = i === pasos ? Infinity : t0 + ((t1 - t0) * (i + 1)) / pasos;
      if (i === 0) s.style.opacity = 1; else fromTo(s, { opacity: 0 }, { opacity: 1, duration: 0.01 }, a);
      if (b !== Infinity) fromTo(s, { opacity: 1 }, { opacity: 0, duration: 0.01 }, b);
    });
    return e;
  }
  // alerta: anillo rojo alrededor + sello "!" en la esquina + sacudida corta
  function alerta(e, t0, t1, o = {}) {
    const c = caja(e), m = o.margen ?? 18;
    const an = html(`<div class="anillo"></div>`); Object.assign(an.style, { left: c.x - m + "px", top: c.y - m + "px", width: c.w + 2 * m + "px", height: c.h + 2 * m + "px", borderRadius: (o.radio ?? 44) + "px" });
    const se = html(`<div class="sello${o.ok ? " ok" : ""}">${o.ok ? "✓" : "!"}</div>`); Object.assign(se.style, { left: c.x + c.w + m - 20 + "px", top: c.y - m - 50 + "px" });   // fuera de la esquina: no tapa lo que alerta
    mesa.appendChild(an); if (!o.sinSello) mesa.appendChild(se);   // sinSello: para renglones pegados a una foto (el "!" caería sobre ella)
    fromTo(an, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }, t0);
    fromTo(se, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2.4)" }, t0 + 0.05);
    fromTo([an, se], { opacity: 1 }, { opacity: 0, duration: 0.3 }, t1);
    if (!o.quieto) tl.to(e, { keyframes: { x: [0, -10, 10, -7, 7, 0] }, duration: 0.45, ease: "none" }, t0);
    return { anillo: an, sello: se };
  }
  // flecha que se dibuja: path con curva suave + punta que aparece al final
  function flecha(desde, hacia, t, o = {}) {
    const a = punto(desde), b = punto(hacia), color = o.color || "#94a3b8";
    const dx = b.x - a.x, dy = b.y - a.y, k = o.curva ?? 0.25;
    const c1 = [a.x + dx * 0.1 - dy * k, a.y + dy * 0.45 + dx * k], c2 = [b.x - dx * 0.1 - dy * k, b.y - dy * 0.45 + dx * k];
    const d = `M${a.x},${a.y} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${b.x},${b.y}`;
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d); p.setAttribute("fill", "none"); p.setAttribute("stroke", color); p.setAttribute("stroke-width", o.grosor ?? 10); p.setAttribute("stroke-linecap", "round");
    if (o.punteada || o.cortada) p.setAttribute("stroke-dasharray", "2 22");
    svg.appendChild(p);
    const L = p.getTotalLength();
    const dur = o.dur ?? 0.6;
    if (!(o.punteada || o.cortada)) { p.style.strokeDasharray = `${L} ${L}`; p.style.strokeDashoffset = L; /* nace sin dibujar */ fromTo(p, { strokeDashoffset: L, opacity: 1 }, { strokeDashoffset: 0, duration: dur, ease: "power2.inOut" }, t); }
    else { p.style.opacity = 0; fromTo(p, { opacity: 0 }, { opacity: 1, duration: dur }, t); }
    // conexión rota: sin punta, con una ✕ roja a la mitad ("no se conecta")
    if (o.cortada) {
      const m = p.getPointAtLength(L / 2), x = document.createElementNS(NS, "g");
      x.innerHTML = `<circle cx="${m.x}" cy="${m.y}" r="38" fill="#fff" stroke="#e5484d" stroke-width="6"/><path d="M${m.x - 15},${m.y - 15} L${m.x + 15},${m.y + 15} M${m.x + 15},${m.y - 15} L${m.x - 15},${m.y + 15}" stroke="#e5484d" stroke-width="8" stroke-linecap="round"/>`;
      x.style.opacity = 0; svg.appendChild(x);
      fromTo(x, { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2.4)" }, t + dur);
      if (o.t1 !== undefined) fromTo([p, x], { opacity: 1 }, { opacity: 0, duration: 0.3 }, o.t1);
      flechas.push({ p, a, b, t, dur, t1: o.t1 });
      return { d, path: p, punta: x, largo: L };
    }
    // punta
    const q = p.getPointAtLength(L), q0 = p.getPointAtLength(Math.max(0, L - 30)), ang = Math.atan2(q.y - q0.y, q.x - q0.x);
    const s = 30, pu = document.createElementNS(NS, "path");
    pu.setAttribute("d", `M${q.x + Math.cos(ang) * 6},${q.y + Math.sin(ang) * 6} L${q.x - Math.cos(ang - 0.5) * s},${q.y - Math.sin(ang - 0.5) * s} L${q.x - Math.cos(ang + 0.5) * s},${q.y - Math.sin(ang + 0.5) * s} Z`);
    pu.setAttribute("fill", color); pu.style.opacity = 0; svg.appendChild(pu);
    fromTo(pu, { opacity: 0 }, { opacity: 1, duration: 0.12 }, t + dur - 0.08);
    if (o.t1 !== undefined) fromTo([p, pu], { opacity: 1 }, { opacity: 0, duration: 0.3 }, o.t1);
    flechas.push({ p, a, b, t, dur, t1: o.t1 });
    return { d, path: p, punta: pu, largo: L };
  }
  // puntos (o un mensaje) que viajan por el camino de una flecha
  function viaja(fl, t0, t1, o = {}) {
    const n = o.n ?? 4, vuelta = o.vuelta ?? 1.1, color = o.color || "#0866ff";
    for (let i = 0; i < n; i++) {
      const p = html(`<div class="punto"></div>`); p.style.background = color; p.style.boxShadow = `0 0 16px ${color}`;
      p.style.offsetPath = `path("${fl.d}")`; mesa.appendChild(p);
      const ini = t0 + (vuelta * i) / n, veces = Math.max(0, Math.floor((t1 - ini) / vuelta) - 1);
      fromTo(p, { opacity: 0 }, { opacity: 1, duration: 0.15 }, ini);
      fromTo(p, { offsetDistance: "0%" }, { offsetDistance: "100%", duration: vuelta, ease: "none", repeat: veces }, ini);
      fromTo(p, { opacity: 1 }, { opacity: 0, duration: 0.15 }, ini + vuelta * (veces + 1) - 0.15);
    }
  }
  // una pieza que viaja por el camino de una flecha (p. ej. la tarjeta "Lead · Ana")
  function recorrer(e, fl, t, dur = 1.0) {
    e.style.left = "0px"; e.style.top = "0px"; e.style.offsetPath = `path("${fl.d}")`; e.style.offsetRotate = "0deg"; e.style.offsetAnchor = "50% 50%";
    fromTo(e, { offsetDistance: "0%" }, { offsetDistance: "100%", duration: dur, ease: "power2.inOut" }, t);
    return e;
  }

  // ------------------------------------------------------------------ cursor
  const cur = html(`<svg class="cursor" viewBox="0 0 64 82"><path d="M9 10 L9 64 L22 51 L32 74 L42 69 L32 47 L51 47 Z" fill="rgba(15,23,42,.22)"/><path d="M5 4 L5 58 L18 45 L28 68 L38 63 L28 41 L47 41 Z" fill="#fff" stroke="#0f172a" stroke-width="3.5" stroke-linejoin="round"/></svg>`);
  const onda = html(`<div class="onda"></div>`);
  mesa.appendChild(cur); mesa.appendChild(onda);
  let curPos = null, curVisible = false;
  const cursor = {
    ir(t, destino, dur = 0.7) {
      const p = punto(destino), d = { x: p.x + 10, y: p.y + 10 };
      if (!curPos) { curPos = { x: d.x + 160, y: d.y + 220 }; }
      if (!curVisible) { fromTo(cur, { opacity: 0 }, { opacity: 1, duration: 0.25 }, t); curVisible = true; }
      fromTo(cur, { x: curPos.x, y: curPos.y }, { x: d.x, y: d.y, duration: dur, ease: "power3.inOut" }, t);
      curPos = d;
      return t + dur;
    },
    clic(t, destino, o = {}) {
      const llega = destino ? cursor.ir(t, destino, o.dur ?? 0.7) : t;
      fromTo(cur, { scale: 1 }, { scale: 0.82, duration: 0.1, yoyo: true, repeat: 1, transformOrigin: "10% 10%" }, llega);
      fromTo(onda, { x: curPos.x - 10, y: curPos.y - 10, scale: 0.3, opacity: 0.9 }, { x: curPos.x - 10, y: curPos.y - 10, scale: 1.4, opacity: 0, duration: 0.5, ease: "power2.out" }, llega);
      return llega;
    },
    fuera(t) { if (curVisible) { fromTo(cur, { opacity: 1 }, { opacity: 0, duration: 0.25 }, t); curVisible = false; } },
  };

  // ------------------------------------------------------------------ cámara (pizarra)
  // mostrar(t, piezas): a los t segundos la cámara ya llegó y encuadra esas piezas, centradas en la zona libre
  const cam = {
    mostrar(t, lista, o = {}) { intenciones.push({ t, lista: [].concat(lista), o }); },
    ir(t, centro, escala, o = {}) { intenciones.push({ t, centro, escala, o }); },
  };
  function encuadre(it) {
    if (it.centro) return { cx: it.centro[0], cy: it.centro[1], s: it.escala };
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const e of it.lista) { const c = Array.isArray(e) ? { x: e[0], y: e[1], w: 0, h: 0 } : caja(e); x0 = Math.min(x0, c.x); y0 = Math.min(y0, c.y); x1 = Math.max(x1, c.x + c.w); y1 = Math.max(y1, c.y + c.h); }
    const m = it.o.margen ?? 50, W = ZONA.x1 - ZONA.x0 - 2 * m, H = ZONA.y1 - ZONA.y0 - 2 * m;
    const s = Math.min(W / (x1 - x0), H / (y1 - y0), it.o.max ?? 1.15);
    if (s < (it.o.min ?? 0.62)) console.warn(`[cámara] mostrar(${it.t.toFixed(2)}): para que quepa todo hay que alejarse a ${Math.round(s * 100)} % y el texto ya no se leería. Divide la toma.`);
    return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, s };
  }
  // encuadre limpio: ninguna pieza visible queda a medias en la orilla (o se ve completa o no se ve).
  // Prueba abrir la toma para meterla (sin alejarse más de un 20 % ni bajar de la escala mínima) o correrla
  // dentro de su holgura para sacarla; se queda con la opción de menos cortes.
  const CX = (ZONA.x0 + ZONA.x1) / 2, CY = (ZONA.y0 + ZONA.y1) / 2;
  function limpiar(it, q, ventana) {
    if (it.centro || it.o.limpio === false) return q;
    const propias = new Set(it.lista);
    const otras = piezas.filter((e) => e.parentElement === mesa && !propias.has(e) && (e._entra ?? Infinity) < ventana[1] && (e._sale ?? Infinity) > ventana[0]).map(caja);
    const cortes = (qq) => otras.filter((c) => {
      const x0 = CX + (c.x - qq.cx) * qq.s, x1 = x0 + c.w * qq.s, y0 = CY + (c.y - qq.cy) * qq.s, y1 = y0 + c.h * qq.s;
      const ix = Math.max(0, Math.min(x1, 1080) - Math.max(x0, 0)), iy = Math.max(0, Math.min(y1, 1920) - Math.max(y0, 440));
      const f = (ix * iy) / Math.max(1, (x1 - x0) * (y1 - y0));
      return f > 0.03 && f < 0.97;
    }).length;
    const base = it.lista.map((e) => (Array.isArray(e) ? { x: e[0], y: e[1], w: 0, h: 0 } : caja(e)));
    const opciones = [q];
    // abrir para meter cada pieza cortada
    for (const c of otras) {
      const todos = [...base, c];
      const x0 = Math.min(...todos.map((k) => k.x)), y0 = Math.min(...todos.map((k) => k.y)), x1 = Math.max(...todos.map((k) => k.x + k.w)), y1 = Math.max(...todos.map((k) => k.y + k.h));
      const m = it.o.margen ?? 50, s2 = Math.min((ZONA.x1 - ZONA.x0 - 2 * m) / (x1 - x0), (ZONA.y1 - ZONA.y0 - 2 * m) / (y1 - y0), it.o.max ?? 1.15);
      if (s2 >= Math.max(it.o.min ?? 0.62, q.s * 0.8)) opciones.push({ cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, s: s2 });
    }
    // correr: hasta donde la toma propia siga dentro de la zona
    const bx0 = Math.min(...base.map((k) => k.x)), bx1 = Math.max(...base.map((k) => k.x + k.w)), by0 = Math.min(...base.map((k) => k.y)), by1 = Math.max(...base.map((k) => k.y + k.h));
    const TOPE = 90 / q.s;   // más que esto deja un hueco vacío sin razón
    const hx = Math.min(TOPE, Math.max(0, ((ZONA.x1 - ZONA.x0) / q.s - (bx1 - bx0)) / 2 - 20)), hy = Math.min(TOPE, Math.max(0, ((ZONA.y1 - ZONA.y0) / q.s - (by1 - by0)) / 2 - 20));
    for (const c of otras) for (const [dx, dy] of [
      [c.x + c.w + 30 - (q.cx - 540 / q.s), 0], [c.x - 30 - (q.cx + 540 / q.s), 0],
      [0, c.y + c.h + 30 - (q.cy - (CY - 440) / q.s)], [0, c.y - 30 - (q.cy + (1920 - CY) / q.s)]]) {
      if (Math.abs(dx) <= hx && Math.abs(dy) <= hy) opciones.push({ cx: q.cx + dx, cy: q.cy + dy, s: q.s });
    }
    let mejor = q, menos = cortes(q);
    for (const o of opciones) { const n = cortes(o); if (n < menos || (n === menos && o.s > mejor.s + 1e-3)) { menos = n; mejor = o; } }
    return mejor;
  }
  function preparar() {
    intenciones.sort((a, b) => a.t - b.t);
    let prev = null;
    const aplicar = (q) => ({ x: CX - q.cx * q.s, y: CY - q.cy * q.s, scale: q.s });
    intenciones.forEach((it, k) => {
      const sig = intenciones[k + 1], fin = sig ? sig.t - (sig.o.dur ?? 1.0) : window.T.duracion;
      it.q = limpiar(it, encuadre(it), [it.t, Math.max(it.t + 0.1, fin)]);   // lo que se va antes de que llegue la cámara no cuenta
    });
    for (const it of intenciones) {
      const q = it.q, dest = aplicar(q), dur = it.o.dur ?? 1.0;
      if (!prev) { Object.assign(mesa.style, { transform: `translate(${dest.x}px, ${dest.y}px) scale(${dest.scale})` }); tl.set(mesa, dest, 0); }
      else fromTo(mesa, prev, { ...dest, duration: dur, ease: it.o.curva || "power3.inOut" }, Math.max(0, it.t - dur));
      tomas.push({ t0: Math.max(0, it.t - dur), t1: it.t, ...q });
      prev = dest;
    }
  }

  // ------------------------------------------------------------------ revisor (lo llama scripts/revisar.mjs)
  function revisar(V) {
    const avisos = [], hechos = new Set();
    const avisar = (t, tipo, pieza, msg) => { const k = tipo + "|" + pieza + "|" + msg.slice(0, 30); if (hechos.has(k)) return; hechos.add(k); avisos.push({ t: Math.round(t * 100) / 100, tipo, pieza, msg }); };
    const opac = (n) => { let o = 1; for (; n && n !== document.body; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return o; };
    const enMovimiento = (t) => tomas.some((k) => t > k.t0 - 0.05 && t < k.t1 + 0.05);
    const instantes = [];
    PLAN.beats.forEach((_, i) => { const b = V.beat(i); if (b.fin > b.ini) instantes.push(b.ini + 0.5, (b.ini + b.fin) / 2, b.fin + 0.2); });
    for (const t of instantes) {
      if (t > V.dur || enMovimiento(t)) continue;
      tl.seek(t, false);
      const frase = [...document.querySelectorAll(".frase")].find((f) => opac(f) > 0.5);
      const fr = frase && frase.getBoundingClientRect();
      for (const e of piezas) {
        if (opac(e) < 0.6) continue;
        const r = e.getBoundingClientRect(), area = r.width * r.height;
        if (area < 4) continue;
        // 1 · cortada por la orilla o por la franja del subtítulo (lo de arriba de 440 px queda bajo la franja)
        const ix = Math.max(0, Math.min(r.right, 1080) - Math.max(r.left, 0)), iy = Math.max(0, Math.min(r.bottom, 1920) - Math.max(r.top, 440));
        const f = (ix * iy) / area;
        if (f > 0.03 && f < 0.97) avisar(t, "cortada", e.dataset.pieza, `se ve el ${Math.round(f * 100)} % (la corta la orilla o la franja del subtítulo)`);
        // 2 · el subtítulo encima
        if (fr && f >= 0.03 && !(r.right < fr.left || r.left > fr.right || r.bottom < fr.top || r.top > fr.bottom)) avisar(t, "tapada", e.dataset.pieza, "el subtítulo queda encima");
        // 3 · texto que no se lee
        if (f > 0.5) {
          const escala = r.width / Math.max(1, e.offsetWidth);
          const nodos = [e, ...e.querySelectorAll("*")].filter((n) => [...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()) && !n.closest(".deco") && opac(n) > 0.5);
          for (const n of nodos) {
            const px = parseFloat(getComputedStyle(n).fontSize) * escala;
            if (px < MIN_TEXTO) { avisar(t, "ilegible", e.dataset.pieza, `«${n.textContent.trim().slice(0, 24)}» mide ${px.toFixed(0)} px en pantalla (mínimo ${MIN_TEXTO})`); break; }
          }
        }
      }
      // 5 · lo de abajo lo tapan los botones de Reels/TikTok
      for (const e of piezas) {
        if (opac(e) < 0.6) continue;
        const r = e.getBoundingClientRect();
        const vx = Math.max(0, Math.min(r.right, 1080) - Math.max(r.left, 0)), vy = Math.max(0, Math.min(r.bottom, 1920) - Math.max(r.top, 440));
        if ((vx * vy) / Math.max(1, r.width * r.height) < 0.5) continue;   // solo lo que se ve (casi) completo
        if (r.width * r.height > 4 && r.bottom > 1740) avisar(t, "zona-insegura", e.dataset.pieza, `llega hasta ${Math.round(r.bottom)} px: abajo de 1740 lo tapan los botones de la app`);
      }
      // 6 · flechas que no conectan nada visible (un extremo fuera de cuadro o bajo la franja)
      const m = new DOMMatrix(getComputedStyle(mesa).transform);
      for (const f of flechas) {
        if (t < f.t + f.dur || opac(f.p) < 0.5 || (f.t1 !== undefined && t > f.t1)) continue;
        const fuera = (q) => { const X = m.a * q.x + m.e, Y = m.d * q.y + m.f; return X < 0 || X > 1080 || Y < 440 || Y > 1920; };
        if (fuera(f.a) || fuera(f.b)) avisar(t, "flecha-huerfana", "flecha", `un extremo queda fuera de cuadro (de ${Math.round(f.a.x)},${Math.round(f.a.y)} a ${Math.round(f.b.x)},${Math.round(f.b.y)}): no se ve qué conecta; bórrala con t1 o encuadra sus dos puntas`);
      }
      // 7 · composición: el contenido va centrado en la zona libre (sin un hueco grande arriba o abajo sin razón)
      {
        let top = Infinity, bot = -Infinity;
        for (const e of piezas) {
          if (opac(e) < 0.6 || e.parentElement !== mesa) continue;
          const r = e.getBoundingClientRect(), vx = Math.max(0, Math.min(r.right, 1080) - Math.max(r.left, 0)), vy = Math.max(0, Math.min(r.bottom, 1920) - Math.max(r.top, 440));
          if ((vx * vy) / Math.max(1, r.width * r.height) < 0.5) continue;
          top = Math.min(top, r.top); bot = Math.max(bot, r.bottom);
        }
        const armando = piezas.some((e) => e._entra > t && e._entra < t + 1.5);   // la toma todavía se está llenando
        if (top < bot && !armando) { const arriba = top - ZONA.y0, abajo = ZONA.y1 - bot; if (Math.abs(arriba - abajo) > 240) avisar(t, "desbalance", "toma", `queda ${Math.round(arriba)} px vacíos arriba y ${Math.round(abajo)} px abajo: centra la toma`); }
      }
      // 8 · nada "a caballo": lo que va encima de otra pieza queda completo adentro o completo afuera (con aire)
      {
        const vis2 = piezas.filter((e) => opac(e) > 0.6 && e.parentElement === mesa && !e.style.offsetPath).map((e) => ({ e, r: e.getBoundingClientRect() }));
        const dentro = (a, b, tol = 4) => a.left >= b.left - tol && a.right <= b.right + tol && a.top >= b.top - tol && a.bottom <= b.bottom + tol;
        for (const A of vis2) for (const B of vis2) {
          if (A === B || !A.e.dataset.encima || B.e.dataset.encima) continue;
          const a = A.r, b = B.r, ix = Math.min(a.right, b.right) - Math.max(a.left, b.left), iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (ix > 0 && iy > 0 && !dentro(a, b) && !dentro(b, a)) avisar(t, "a-caballo", A.e.dataset.pieza, `queda montada sobre la orilla de «${B.e.dataset.pieza}»: ponla completa adentro o completa afuera`);
          else if (ix > -20 && iy > -20 && !(ix > 0 && iy > 0)) avisar(t, "a-caballo", A.e.dataset.pieza, `queda pegada a «${B.e.dataset.pieza}» (menos de 20 px): dale aire`);
        }
      }
      // 9 · el texto no tapa lo importante (el producto, una persona: .solido)
      for (const e of piezas) {
        if (opac(e) < 0.6) continue;
        const solidos = [...e.querySelectorAll(".solido")].filter((n) => opac(n) > 0.5).map((n) => n.getBoundingClientRect());
        if (!solidos.length) continue;
        const textos = [...e.querySelectorAll("*")].filter((n) => [...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()) && opac(n) > 0.5 && !n.closest(".deco"));
        for (const n of textos) { const r = n.getBoundingClientRect(); if (solidos.some((q) => Math.min(r.right, q.right) - Math.max(r.left, q.left) > 6 && Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top) > 6)) { avisar(t, "texto-encimado", e.dataset.pieza, `«${n.textContent.trim().slice(0, 24)}» tapa al producto o a una persona`); break; } }
      }
      // 12 · subtítulo: ninguna palabra se ve antes de que la voz la diga
      for (const sp of document.querySelectorAll(".frase.completa span[data-ini]")) {
        if (parseFloat(sp.dataset.ini) > t + 0.08 && opac(sp) > 0.3) { avisar(t, "subtitulo-adelantado", "subtítulo", `«${sp.textContent}» se ve antes de que la voz la diga (nace visible y parpadea al entrar)`); break; }
      }
      // 11 · texto encima de una imagen: lo que va encima (chips, globos, avisos) no se pone sobre fotos ni ilustraciones
      {
        const imagenes = [...document.querySelectorAll(".imagen")].filter((n) => opac(n) > 0.5).map((n) => ({ n, r: n.getBoundingClientRect() }));
        for (const e of piezas) {
          if (!e.dataset.encima || opac(e) < 0.6 || e.style.offsetPath) continue;
          const r = e.getBoundingClientRect();
          const choca = imagenes.find(({ n, r: q }) => !e.contains(n) && Math.min(r.right, q.right) - Math.max(r.left, q.left) > 8 && Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top) > 8);
          if (choca) avisar(t, "texto-sobre-imagen", e.dataset.pieza, "queda encima de una imagen: muévelo a un espacio propio de la interfaz (un renglón, la parte blanca) en vez de taparla");
        }
      }
      // 10 · pantallas sin huecos: una vista de celular no se queda con más de un tercio vacío abajo
      for (const v of document.querySelectorAll(".vista")) {
        if (opac(v) < 0.6) continue;
        const rv = v.getBoundingClientRect();
        if (rv.bottom < 440 || rv.top > 1920) continue;
        let fondo = rv.top;
        v.querySelectorAll("*").forEach((n) => { if (opac(n) > 0.3 && !n.closest(".deco-fondo")) { const r = n.getBoundingClientRect(); if (r.height > 0 && r.width > 0) fondo = Math.max(fondo, Math.min(r.bottom, rv.bottom)); } });
        if ((rv.bottom - fondo) / rv.height > 0.18) avisar(t, "pantalla-vacia", v.closest("[data-pieza]")?.dataset.pieza || "celular", `la pantalla queda ${Math.round(((rv.bottom - fondo) / rv.height) * 100)} % vacía abajo: llénala (más contenido, el siguiente post) o acorta la pieza`);
      }
      // 4 · piezas encimadas sin querer (dos tarjetas visibles que se pisan)
      const vis = piezas.filter((e) => opac(e) > 0.6 && !e.dataset.encima && e.parentElement === mesa).map((e) => ({ e, r: e.getBoundingClientRect() }));
      for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
        const a = vis[i].r, b = vis[j].r, ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)), iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        if (ix * iy > 0.04 * Math.min(a.width * a.height, b.width * b.height)) avisar(t, "encimada", vis[i].e.dataset.pieza, `se pisa con «${vis[j].e.dataset.pieza}»`);
      }
    }
    // 13 · siempre algo que ILUSTRE lo que se escucha: tramos con voz donde no se anima nada (sin contar cámara ni subtítulos)
    {
      const textos = document.getElementById("textos");
      const tramos = [];
      for (const tw of tl.getChildren(true, true, false)) {
        const objs = (tw.targets ? tw.targets() : []).filter((o) => o && o.nodeType === 1);
        if (!objs.length) continue;
        if (objs.every((o) => o === mesa || textos.contains(o))) continue;   // cámara y subtítulos no cuentan
        const ini = tw.startTime(), fin = ini + Math.min(tw.totalDuration(), 600);
        if (fin - ini < 0.005) continue;   // los "sets" instantáneos (cambio de número) cuentan como un pulso corto
        tramos.push([ini, fin]);
      }
      // los cambios instantáneos (contadores, letras) también son movimiento: un pulso de 0.25 s
      for (const tw of tl.getChildren(true, true, false)) {
        const objs = (tw.targets ? tw.targets() : []).filter((o) => o && o.nodeType === 1);
        if (!objs.length || objs.every((o) => o === mesa || textos.contains(o))) continue;
        if (tw.totalDuration() < 0.005 || tw.duration() <= 0.02) tramos.push([tw.startTime(), tw.startTime() + 0.25]);
      }
      tramos.sort((a, b) => a[0] - b[0]);
      const voz = T.palabras.filter((p) => p.w.trim());
      const v0 = voz[0] ? voz[0].ini : 0, v1 = voz.length ? voz[voz.length - 1].fin : V.dur;
      let cubierto = v0;
      const huecos = [];
      for (const [a, b] of tramos) { if (b <= cubierto) continue; if (a > cubierto && a - cubierto > 1.5 && cubierto < v1) huecos.push([cubierto, Math.min(a, v1)]); cubierto = Math.max(cubierto, b); }
      if (v1 - cubierto > 1.5) huecos.push([cubierto, v1]);
      for (const [a, b] of huecos) {
        if (b - a <= 1.5) continue;
        const dice = voz.filter((p) => p.ini >= a - 0.1 && p.ini < b).map((p) => p.w).join(" ");
        avisos.push({ t: Math.round(a * 100) / 100, tipo: "sin-movimiento", pieza: "pantalla", msg: `${(b - a).toFixed(1)} s sin animar nada mientras dice «${dice.slice(0, 90)}»: ilústralo en movimiento` });
      }
    }
    tl.seek(0, false);
    return avisos.sort((a, b) => a.t - b.t);
  }

  window.U = { lienzo, poner, caja, borde, punto, entra, sale, mostrar, ocultar, pulso, cambiar, escribir, contador, alerta, flecha, viaja, recorrer, cursor, cam, preparar, revisar, html, piezas, tomas, ZONA };
})();
