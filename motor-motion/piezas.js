// =====================================================================================
//  piezas.js — piezas web realistas del motor MOTION (U.p.*). Cada una devuelve el elemento ya puesto
//  en la pizarra (invisible hasta que la escena llame U.entra) con referencias a sus partes.
//  Textos grandes a propósito: en el video todo tiene que leerse en un celular.
// =====================================================================================
(function () {
  const U = window.U, h = U.html;
  const ICONOS = `<div class="acciones">
    <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.3 5 6.8 5c2 0 3.5 1.1 5.2 3 1.7-1.9 3.2-3 5.2-3 3.5 0 5.6 3.6 4.3 6.8C19.5 16.4 12 21 12 21z"/></svg>
    <svg viewBox="0 0 24 24"><path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-5A8.5 8.5 0 1 1 21 11.5z"/></svg>
    <svg viewBox="0 0 24 24"><path d="M22 3 2 10l8 3 3 8z"/></svg>
    <svg class="der" viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z"/></svg></div>`;
  const SIGUIENTE = `<div class="cab" style="margin-top:14px;border-top:2px solid #eef2f7"><div class="avatar"><div style="background:linear-gradient(135deg,#60a5fa,#2563eb)"></div></div>
    <div style="flex:1"><div style="height:22px;width:55%;border-radius:11px;background:#e2e8f0"></div><div style="height:18px;width:35%;border-radius:9px;background:#eef2f7;margin-top:10px"></div></div></div>
    <div style="height:420px;background:linear-gradient(160deg,#c7f9e4,#7dd3c0)"></div>`;
  const ESTADO = `<div class="estado deco"><span>9:41</span><span>●●● ▮</span></div>`;
  const p = {};
  const LENTES = `<div class="lentes solido"><u class="p1"></u><u class="p2"></u><i class="l1"></i><i class="l2"></i><b></b></div>`;
  p.LENTES = LENTES;
  // cara de cliente con lentes (para reseñas y anuncios); k = tamaño de los lentes
  p.cara = (tam, o = {}) => `<div class="cara solido" style="width:${tam}px;height:${tam}px;--k:${o.k ?? tam / 330};background:${o.piel || "#f1c6a6"}"><div class="pelo" style="background:${o.pelo || "#3f2a1d"}"></div>${LENTES}</div>`;

  // celular vacío: devuelve { el, pantalla } — las vistas se agregan con p.vista(cel, html)
  p.celular = (x, y, o = {}) => {
    const el = U.poner(`<div class="tel"><div class="pantalla"><div class="isla"></div>${ESTADO}</div></div>`, x, y, { nombre: o.nombre || "celular", rot: o.rot, z: o.z });
    return { el, pantalla: el.querySelector(".pantalla") };
  };
  p.vista = (cel, contenido, o = {}) => { const v = h(`<div class="vista">${contenido}</div>`); if (o.oculta) v.style.opacity = 0; cel.pantalla.appendChild(v); return v; };

  // publicación con botón "Promocionar"
  p.post = (cel, o = {}) => p.vista(cel, `
    <div class="cab"><div class="avatar deco"><div>TN</div></div><div><div class="nombre">tunegocio</div><div class="sub">${o.sub || "Tu página"}</div></div></div>
    <div class="foto imagen" style="${o.fondo ? `background:${o.fondo}` : ""}"><div class="sol"></div><div class="mesita"></div>${o.producto === "lentes" ? `<div style="position:absolute;left:50%;top:190px;width:320px;height:120px;transform:translateX(-50%) scale(1.15)">${LENTES}</div>` : `<div class="prod solido"></div>`}</div>
    ${ICONOS}<div class="likes">128 Me gusta</div><div class="dato ventas-post" style="opacity:0">Ventas: 0</div>
    <div class="btn promo">Promocionar publicación<span class="activa">✓ Campaña activa</span></div>${SIGUIENTE}`, o);

  // el mismo post ya como anuncio de registro
  p.anuncio = (cel, o = {}) => p.vista(cel, `
    <div class="cab"><div class="avatar deco"><div>TN</div></div><div><div class="nombre">tunegocio</div><div class="sub">Publicidad</div></div></div>
    ${o.titulo ? `<div style="padding:4px 26px 18px;font:900 54px/1.04 Montserrat;color:#0f172a">${o.titulo}</div>` : ""}
    <div class="foto imagen" style="${o.titulo ? "height:400px;" : ""}${o.fondo ? `background:${o.fondo}` : ""}"><div class="sol"></div><div class="mesita"></div>${o.producto === "lentes" ? `<div style="position:absolute;left:50%;top:${o.titulo ? 130 : 190}px;width:320px;height:120px;transform:translateX(-50%) scale(1.15)">${LENTES}</div>` : `<div class="prod solido"></div>`}</div>
    ${ICONOS}<div class="btn verde">${o.boton || "Registrarme"}</div>
    <div class="dato visto" style="opacity:0;height:0;padding:0 26px">👁 Lo vio 7 veces</div>
    <div class="dato dia" style="opacity:0;height:0;padding:0 26px">Ventas al día: <span class="cuenta" style="position:relative;display:inline-block;width:1.4em;height:1.2em"></span></div>
    <div class="dato solo" style="opacity:0;height:0;padding:0 26px;color:#6d28d9">🎯 ${o.solo || "Solo para quien te visitó"}</div>${SIGUIENTE}`, o);
  // anuncio distinto (creativos): persona hablando / otra idea / otro formato
  p.creativo = (cel, tipo) => {
    const cont = {
      persona: `<div style="position:absolute;inset:0;background:linear-gradient(180deg,#1f2937,#111827)"></div>
        <div style="position:absolute;left:50%;top:330px;transform:translateX(-50%);width:170px;height:170px;border-radius:50%;background:#f1c6a6"></div>
        <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:400px;height:420px;border-radius:200px 200px 0 0;background:#ff9f1c"></div>
        <div style="position:absolute;left:30px;top:40px;font-size:60px" class="chip rojo">▶ Video</div>
        <div style="position:absolute;left:30px;right:30px;bottom:60px;color:#fff;font:800 60px/1.08 Montserrat;text-shadow:0 2px 8px #000">"Así conseguí mis clientes"</div>`,
      idea: `<div style="position:absolute;inset:0;background:linear-gradient(160deg,#dbeafe,#bfdbfe)"></div>
        <div style="position:absolute;left:40px;right:40px;top:180px;font:900 76px/1 Montserrat;color:#1e3a8a">3 errores que te cuestan ventas</div>
        <div style="position:absolute;left:40px;top:40px;font-size:60px" class="chip azul">Otra idea</div>`,
      formato: `<div style="position:absolute;inset:0;background:#fff"></div>
        <div style="position:absolute;left:40px;top:40px;font-size:60px" class="chip morado">Carrusel</div>
        <div style="position:absolute;left:40px;top:150px;width:380px;height:520px;border-radius:30px;background:linear-gradient(160deg,#ede9fe,#c4b5fd)"></div>
        <div style="position:absolute;left:440px;top:150px;width:380px;height:520px;border-radius:30px;background:linear-gradient(160deg,#fef3c7,#fcd34d)"></div>
        <div style="position:absolute;left:70px;top:330px;font:900 64px/1 Montserrat;color:#4c1d95">Paso 1</div>
        <div style="position:absolute;left:0;right:0;bottom:120px;text-align:center;font:800 30px Inter;color:#475569" class="deco">● ○ ○</div>`,
    }[tipo];
    return p.vista(cel, cont);
  };

  // anuncio en formato historia (sin celular): para mostrar varios a la vez a buen tamaño
  p.historia = (x, y, tipo, o = {}) => {
    const cont = {
      persona: `<div style="position:absolute;inset:0;background:linear-gradient(180deg,#1f2937,#111827)"></div>
        <div style="position:absolute;left:50%;top:190px;transform:translateX(-50%);width:130px;height:130px;border-radius:50%;background:#f1c6a6"></div>
        <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:300px;height:330px;border-radius:150px 150px 0 0;background:#ff9f1c"></div>
        <div class="chip rojo" style="position:absolute;left:24px;top:24px;font-size:40px">▶ Video</div>
        <div style="position:absolute;left:0;right:0;bottom:0;padding:22px 24px 30px;background:rgba(15,23,42,.82);color:#fff;font:800 44px/1.08 Montserrat">"Así conseguí mis clientes"</div>`,
      idea: `<div style="position:absolute;inset:0;background:linear-gradient(160deg,#dbeafe,#bfdbfe)"></div>
        <div class="chip azul" style="position:absolute;left:24px;top:24px;font-size:40px;background:#fff">Otra idea</div>
        <div style="position:absolute;left:28px;right:24px;top:150px;font:900 64px/1.02 Montserrat;color:#1e3a8a">3 errores que te cuestan ventas</div>`,
      formato: `<div style="position:absolute;inset:0;background:#fff"></div>
        <div class="chip morado" style="position:absolute;left:24px;top:24px;font-size:40px">Carrusel</div>
        <div style="position:absolute;left:24px;top:140px;width:250px;height:400px;border-radius:26px;background:linear-gradient(160deg,#ede9fe,#c4b5fd)"></div>
        <div style="position:absolute;left:290px;top:140px;width:250px;height:400px;border-radius:26px;background:linear-gradient(160deg,#fef3c7,#fcd34d)"></div>
        <div style="position:absolute;left:48px;top:300px;font:900 58px/1 Montserrat;color:#4c1d95">Paso 1</div>
        <div class="deco" style="position:absolute;left:0;right:0;bottom:40px;text-align:center;font:800 30px Inter;color:#475569">● ○ ○</div>`,
      probando: `<div style="position:absolute;inset:0;background:linear-gradient(180deg,#1f2937,#111827)"></div>
        <div style="position:absolute;left:50%;top:150px;transform:translateX(-50%)">${p.cara(200, { k: 0.62 })}</div>
        <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:300px;height:250px;border-radius:150px 150px 0 0;background:#ff9f1c"></div>
        <div class="chip rojo" style="position:absolute;left:24px;top:24px;font-size:40px">▶ Video</div>
        <div style="position:absolute;left:0;right:0;bottom:0;padding:22px 24px 30px;background:rgba(15,23,42,.82);color:#fff;font:800 44px/1.08 Montserrat">"Me los probé y…"</div>`,
      cara: `<div style="position:absolute;inset:0;background:linear-gradient(160deg,#dbeafe,#bfdbfe)"></div>
        <div class="chip azul" style="position:absolute;left:24px;top:24px;font-size:40px;background:#fff">Otra idea</div>
        <div style="position:absolute;left:28px;right:24px;top:140px;font:900 60px/1.02 Montserrat;color:#1e3a8a">¿Cara redonda? Estos te quedan</div>`,
      modelos: `<div style="position:absolute;inset:0;background:#fff"></div>
        <div class="chip morado" style="position:absolute;left:24px;top:24px;font-size:40px">Carrusel</div>
        <div style="position:absolute;left:24px;top:140px;width:250px;height:400px;border-radius:26px;background:linear-gradient(160deg,#fef3c7,#fcd34d);overflow:hidden"><div style="position:absolute;left:50%;top:150px;width:320px;height:120px;transform:translateX(-50%) scale(.68);transform-origin:50% 0">${LENTES}</div></div>
        <div style="position:absolute;left:290px;top:140px;width:250px;height:400px;border-radius:26px;background:linear-gradient(160deg,#e0e7ff,#a5b4fc)"></div>
        <div style="position:absolute;left:44px;top:440px;font:900 44px/1 Montserrat;color:#78350f">Modelo 1</div>
        <div class="deco" style="position:absolute;left:0;right:0;bottom:40px;text-align:center;font:800 30px Inter;color:#475569">● ○ ○</div>`,
    }[tipo];
    return U.poner(`<div class="tarjeta" style="width:360px;height:640px;overflow:hidden;border-radius:34px">${cont}</div>`, x, y, { nombre: o.nombre || "anuncio " + tipo });
  };

  // administrador de anuncios: elegir objetivo
  p.objetivos = (x, y, o = {}) => {
    const filas = o.filas || [["📣", "Reconocimiento", ""], ["❤", "Interacción", "Más me gusta y comentarios"], ["👤", "Clientes potenciales", "Consigue registros"], ["🛒", "Ventas", ""]];
    const el = U.poner(`<div class="tarjeta ads"><h3>¿Qué quieres que logre tu campaña?</h3>
      ${filas.map(([i, t, ds]) => `<div class="fila-obj" data-obj="${t}" style="${ds ? "height:128px" : ""}"><div class="marco"></div><div class="ico">${i}</div><div>${t}${ds ? `<span class="desc">${ds}</span>` : ""}</div><div class="radio"><div class="punto-r"></div></div></div>`).join("")}</div>`, x, y, { nombre: o.nombre || "objetivo de la campaña" });
    el.fila = (t) => el.querySelector(`[data-obj="${t}"]`);
    // marcar una fila (con su marco y su punto)
    el.marcar = (t, cuando) => { const f = el.fila(t); U.mostrar(f.querySelector(".marco"), cuando, 0.25); U.mostrar(f.querySelector(".punto-r"), cuando, 0.2); };
    el.desmarcar = (t, cuando) => { const f = el.fila(t); U.ocultar(f.querySelector(".marco"), cuando, 0.2); U.ocultar(f.querySelector(".punto-r"), cuando, 0.2); };
    return el;
  };

  // perfil (para el problema "el clic lleva a tu perfil")
  p.perfil = (cel, o = {}) => o.lentes ? p.vista(cel, `
    <div class="perfil"><div class="cabp"><div class="avatar deco"><div>TN</div></div>
      <div class="stats"><div><b>128</b>posts</div><div><b>2,340</b>fans</div></div></div>
      <div class="bio">tunegocio · lentes de sol 🕶️</div>
      <div class="grid9">${["#fef3c7", "#e0e7ff", "#fde68a", "#dbeafe", "#fce7f3", "#fef9c3", "#e0f2fe", "#fae8ff", "#fef3c7", "#ecfccb", "#ffe4e6", "#e0e7ff"].map((c) => `<div style="position:relative;background:${c};overflow:hidden"><div style="position:absolute;left:50%;top:50%;width:320px;height:120px;transform:translate(-50%,-50%) scale(.42)">${LENTES}</div></div>`).join("")}</div></div>`, o) : p.vista(cel, `
    <div class="perfil"><div class="cabp"><div class="avatar deco"><div>TN</div></div>
      <div class="stats"><div><b>128</b>posts</div><div><b>2,340</b>fans</div></div></div>
      <div class="bio">tunegocio · lo mejor de la ciudad</div>
      <div class="grid9">${["#fde68a", "#bfdbfe", "#fecaca", "#c7f9e4", "#ddd6fe", "#fed7aa", "#bae6fd", "#fbcfe8", "#d9f99d", "#fef3c7", "#e0e7ff", "#ccfbf1"].map((c) => `<div style="background:${c}"></div>`).join("")}</div></div>`, o);

  // landing (en el celular): { vista, campo, lleno, cta, regalo }
  p.landing = (cel, o = {}) => {
    const v = p.vista(cel, `<div class="url deco">🔒 tunegocio.com/clase</div>
      <div class="landing"><span class="etiqueta">Para emprendedores</span><h1>Vende más en 30 días</h1>
      <div class="bajada">Te enseño paso a paso a conseguir clientes.</div>
      <div class="portada imagen" style="position:relative;height:200px;margin-top:24px;border-radius:24px;overflow:hidden;background:linear-gradient(160deg,#dbeafe,#e0e7ff)">
        <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:180px;height:120px;border-radius:90px 90px 0 0;background:#7c5cff"></div>
        <div style="position:absolute;left:50%;bottom:105px;transform:translateX(-50%);width:76px;height:76px;border-radius:50%;background:#f1c6a6"></div>
        <div style="position:absolute;left:34px;top:34px;width:120px;height:80px;border-radius:14px;background:#fff;box-shadow:0 6px 14px rgba(15,23,42,.12)"></div>
        <div style="position:absolute;left:54px;top:54px;width:80px;height:12px;border-radius:6px;background:#93c5fd"></div><div style="position:absolute;left:54px;top:76px;width:56px;height:12px;border-radius:6px;background:#c7d2fe"></div></div>
      <div class="campo">Tu WhatsApp<span class="lleno"></span></div><div class="cta">Quiero entrar</div>
      <div class="regalo-l" style="opacity:0"><div class="caja-regalo" style="transform:scale(.5);margin:-38px"><div class="c"></div><div class="t"></div><div class="l1"></div><div class="m1"></div><div class="m2"></div></div><div style="flex:1"><b class="nombre-regalo" style="position:relative;display:block;height:42px"></b><span>Te llega al registrarte</span></div></div></div>`, o);
    return { vista: v, campo: v.querySelector(".campo"), lleno: v.querySelector(".lleno"), cta: v.querySelector(".cta"), regalo: v.querySelector(".regalo-l"), nombreRegalo: v.querySelector(".nombre-regalo"), portada: v.querySelector(".portada") };
  };

  // código del píxel (se escribe letra por letra con U.escribir sobre .linea)
  p.codigo = (x, y, o = {}) => U.poner(`<div class="codigo"><div class="barra"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span>tu landing</span></div>
<pre><span class="c">&lt;!-- avisa a Meta --&gt;</span>
<span class="k">&lt;script&gt;</span>
 <span class="f">fbq</span>(<span class="s">'track'</span>,<span class="s">'Lead'</span>)
<span class="k">&lt;/script&gt;</span></pre></div>`, x, y, { nombre: o.nombre || "código del píxel" });

  p.meta = (x, y) => U.poner(`<div class="meta"><div class="ojo"><i></i></div>Meta</div>`, x, y, { nombre: "Meta" });
  p.globo = (texto, x, y, o = {}) => U.poner(`<div class="globo ${o.color || ""}">${texto}</div>`, x, y, { nombre: o.nombre || "globo", encima: true });
  p.chip = (texto, x, y, o = {}) => U.poner(`<div class="chip ${o.color || "azul"}">${texto}</div>`, x, y, { nombre: o.nombre || texto, encima: o.encima });
  p.rotulo = (texto, x, y, o = {}) => U.poner(`<div class="rotulo" style="color:${o.color || "#0f172a"}">${texto}</div>`, x, y, { nombre: o.nombre || texto, encima: o.encima });
  p.tarjeta = (contenido, x, y, o = {}) => U.poner(`<div class="tarjeta" style="padding:${o.relleno ?? "32px 36px"};${o.ancho ? `width:${o.ancho}px` : ""}">${contenido}</div>`, x, y, { nombre: o.nombre || "tarjeta", encima: o.encima });

  // audiencia: rejilla de personas; .personas para teñirlas
  p.audiencia = (titulo, x, y, o = {}) => {
    const colores = ["#f59e0b", "#3b82f6", "#ec4899", "#10b981", "#8b5cf6", "#ef4444", "#14b8a6", "#f97316", "#6366f1", "#84cc16", "#e11d48", "#0ea5e9"];
    const ini = o.iniciales || ["A", "L", "M", "J", "C", "R", "S", "D", "P", "E", "V", "T"];
    const el = U.poner(`<div class="tarjeta audiencia" style="${o.ancho ? `width:${o.ancho}px` : ""}"><h4>${titulo}</h4><div class="gente" style="${o.columnas ? `grid-template-columns:repeat(${o.columnas},96px)` : ""}">${ini.slice(0, o.n || 12).map((t, i) => `<div class="persona" style="background:${(o.colores || colores)[i % (o.colores || colores).length]}">${t}</div>`).join("")}</div></div>`, x, y, { nombre: o.nombre || titulo });
    el.personas = [...el.querySelectorAll(".persona")];
    return el;
  };

  p.noti = (titulo, texto, x, y, o = {}) => U.poner(`<div class="noti"><div class="app">✓</div><div><b>${titulo}</b><span>${texto}</span></div></div>`, x, y, { nombre: o.nombre || "notificación" });
  p.metrica = (etiqueta, x, y, o = {}) => { const el = U.poner(`<div class="tarjeta metrica"><span>${etiqueta}</span><div class="cifra" style="color:${o.color || "#0f172a"}"></div></div>`, x, y, { nombre: o.nombre || etiqueta }); el.cifra = el.querySelector(".cifra"); return el; };

  // tabla de registrados: filas con chip de estado
  p.registrados = (x, y, filas, o = {}) => {
    const el = U.poner(`<div class="tarjeta tabla"><h4>${o.titulo || "Registrados"}</h4>${filas.map(([n, c, chip, cls]) => `<div class="fila"><div class="ini deco" style="background:${c}">${n[0]}</div>${n}<span class="chip ${cls || "ok"}">${chip || "Registrado"}</span></div>`).join("")}</div>`, x, y, { nombre: o.nombre || "registrados" });
    el.filas = [...el.querySelectorAll(".fila")];
    return el;
  };

  // WhatsApp (en un celular)
  p.whatsapp = (cel, o = {}) => { const v = p.vista(cel, `<div class="wa"><div class="cabw"><div class="av deco" style="background:${o.color || "linear-gradient(135deg,#ffb36b,#ff7a59)"}">${(o.contacto || "Ana")[0]}</div><div><b>${o.contacto || "Ana"}</b><span>en línea</span></div></div><div class="chat"></div></div>`, o); v.chat = v.querySelector(".chat"); return v; };
  p.mensaje = (wa, texto, hora) => { const m = h(`<div class="msg">${texto}<span class="hora deco">${hora} ✓✓</span></div>`); m.style.opacity = 0; wa.chat.appendChild(m); return m; };
  p.respuesta = (wa, texto, hora) => { const m = h(`<div class="msg entra">${texto}<span class="hora deco">${hora}</span></div>`); m.style.opacity = 0; wa.chat.appendChild(m); return m; };
  p.sello = (wa, texto) => { const m = h(`<div class="sello-t">${texto}</div>`); m.style.opacity = 0; wa.chat.appendChild(m); return m; };

  p.vivo = (x, y) => U.poner(`<div class="vivo"><div class="escenario"></div><div class="ponente"><div class="cabeza"></div><div class="cuerpo"></div></div>
    <div class="envivo">● EN VIVO</div><div class="comentarios"><div>¡Muy buena clase!</div><div>¿Cuánto cuesta?</div></div></div>`, x, y, { nombre: "la clase en vivo" });
  p.oferta = (x, y, o = {}) => { const el = U.poner(`<div class="oferta"><span class="bono">${o.etiqueta || "BONO"}</span><h2>${o.titulo || "Solo hoy en la noche"}</h2><p>${o.texto || "Si entras hoy, te llevas el bono"}</p>
    <div class="cuenta-atras"><div class="d h"></div><span class="sep">:</span><div class="d m"></div><span class="sep">:</span><div class="d s"></div></div>
    ${o.contador ? `<div style="margin-top:18px;font:800 34px Inter;color:#15803d">${o.contador}: <span class="ventas-of" style="position:relative;display:inline-block;width:2.2em;height:1.2em;text-align:left"></span></div>` : ""}</div>`, x, y, { nombre: "oferta" });
    el.h = el.querySelector(".h"); el.m = el.querySelector(".m"); el.s = el.querySelector(".s"); el.ventas = el.querySelector(".ventas-of"); return el; };
  // mensajes directos: el cliente pregunta y espera (sin respuesta)
  p.dm = (cel, o = {}) => { const v = p.vista(cel, `<div class="wa"><div class="cabw" style="background:#fff;color:#0f172a;border-bottom:2px solid #eef2f7"><div class="av deco">TN</div><div><b>tunegocio</b><span style="opacity:1;color:#64748b">Activo hace 3 h</span></div></div>
      <div class="chat" style="background:#fff;background-image:none">
        <div class="msg" style="background:#3b82f6;color:#fff">Hola 👋 ¿tienen los lentes negros?</div>
        <div class="msg ultima" style="background:#3b82f6;color:#fff;opacity:0">¿Cuánto cuestan? 🤔</div>
        <div class="sello-t espera" style="opacity:0;background:#fef3c7;color:#b45309">⏳ Sin respuesta…</div></div></div>`, o);
    v.ultima = v.querySelector(".ultima"); v.espera = v.querySelector(".espera"); return v; };
  // página de producto (en el celular): { vista, comprar, detalles, resenas }
  p.producto = (cel, o = {}) => {
    const v = p.vista(cel, `<div class="url deco">🔒 tunegocio.com/lentes</div>
      <div class="producto"><div class="img imagen">${LENTES}</div>
        <div class="info"><h2>Lentes de sol Clásicos</h2><div class="precio">$899</div></div>
        <div class="comprar">Comprar</div>
        <div class="abajo">
          <div class="detalles"><div class="detalle"><span>📦</span>Llegan en 2 a 4 días</div><div class="detalle"><span>💳</span>Pagas con tarjeta</div><div class="detalle"><span>🕶️</span>Protección UV400</div></div>
          <div class="resenas" style="opacity:0">
            <div class="resena">${p.cara(92, { pelo: "#1f2937" })}<div><b>★★★★★</b><span>"Me quedaron perfectos"</span></div></div>
            <div class="resena">${p.cara(92, { pelo: "#92400e", piel: "#e0ac8a" })}<div><b>★★★★★</b><span>"Llegaron en 3 días"</span></div></div>
            <div class="garantia">✓ Si no te gustan, te devolvemos tu dinero</div></div>
        </div></div>
      <div class="pago" style="opacity:0"><b>Pagar con tarjeta</b><div class="tarjeta-num">💳 •••• •••• •••• 4242</div><div class="duda">¿Y si nunca me llegan? 🤔</div></div>`, o);
    return { vista: v, comprar: v.querySelector(".comprar"), detalles: v.querySelector(".detalles"), resenas: v.querySelector(".resenas"), img: v.querySelector(".img"), pago: v.querySelector(".pago"), duda: v.querySelector(".pago .duda") };
  };
  p.regalo = (x, y, o = {}) => U.poner(`<div class="caja-regalo"><div class="c"></div><div class="t"></div><div class="l1"></div><div class="m1"></div><div class="m2"></div></div>`, x, y, { nombre: o.nombre || "regalo" });

  U.p = p;
})();
