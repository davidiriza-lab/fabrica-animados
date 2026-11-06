// "Cómo crear un embudo en Meta" (venta directa de unos lentes) · motor MOTION, diseño B, recorrido de pizarra.
// Las piezas se suman de arriba hacia abajo y la cámara viaja de una a otra. Reglas que vigila el revisor:
// texto ≥ 26 px, nada a caballo (lo de encima va completo adentro o afuera), sin huecos ni tomas descentradas.
//
// Lienzo 2300 × 9700.  A (y≈300) anuncio y objetivo · B (y≈1750) perfil → página de producto, Meta, píxel,
// prueba social · A otra vez: creativos · C (y≈3450) ventas · D (y≈4400) carritos y WhatsApp
// E (y≈5650) remarketing · F (y≈7150) "lo dejan para después" y la oferta · G (y≈8700) llamado a la acción.
export default function construir(U, V) {
  const { p, entra, sale, mostrar, ocultar, pulso, cambiar, contador, alerta, flecha, recorrer, escribir, cursor, cam } = U;
  const b = (id) => V.beat(id), d = (id, w) => V.dice(id, w);
  U.lienzo(2300, 11200);

  // ===================================================== 0 · una foto de tus lentes + "promocionar" = una campaña
  const p1 = p.celular(720, 300, { nombre: "anuncio", z: 3 });
  const post = p.post(p1, { producto: "lentes", fondo: "linear-gradient(160deg,#fef3c7,#fde68a 55%,#fbbf24)" });
  entra(p1.el, d("base", "foto") - 0.2, { de: "abajo", dur: 0.7 });
  cam.mostrar(0, [p1.el], { dur: 0.1 });
  cursor.clic(d("base", "promocionar") - 0.5, post.querySelector(".promo"));
  mostrar(post.querySelector(".promo .activa"), d("base", "campaña") - 0.2, 0.3);   // el botón se vuelve "✓ Campaña activa"
  cursor.fuera(d("base", "campaña") + 0.4);

  // ===================================================== 1 · se la enseña a cualquiera: likes, cero ventas
  const azar = [[580, 520, "#f59e0b"], [1310, 700, "#3b82f6"], [560, 980, "#ec4899"], [1320, 1130, "#10b981"], [590, 1290, "#8b5cf6"], [1310, 1330, "#ef4444"]];
  azar.forEach(([x, y, c], i) => { const g = U.poner(`<div class="persona deco" style="background:${c}">${"ALMJCR"[i]}</div>`, x, y, { nombre: "persona al azar" }); entra(g, d("cualquiera", "cualquiera") + i * 0.1, { de: "pop", dur: 0.35 }); sale(g, b("elige").ini + 0.2); });
  const likes = post.querySelector(".likes"); likes.textContent = "";
  contador(likes, 128, 1240, d("cualquiera", "likes") - 0.3, b("cualquiera").fin, { pasos: 12, despues: " Me gusta" });
  const ventasPost = post.querySelector(".ventas-post");   // renglón del post, debajo de los Me gusta (no encima de la foto)
  mostrar(ventasPost, d("cualquiera", "comprar") - 0.3);
  alerta(ventasPost, d("cualquiera", "comprar"), b("cualquiera").fin + 0.3, { margen: 8, radio: 18, quieto: true });

  // ===================================================== 2-3 · le dices a Meta qué quieres: ventas → el objetivo
  const obj = p.objetivos(1420, 420, { filas: [["📣", "Reconocimiento", ""], ["❤", "Interacción", "Más me gusta y comentarios"], ["👤", "Clientes potenciales", ""], ["🛒", "Ventas", "Consigue compras"]] });
  obj.marcar("Interacción", 0);
  entra(obj, b("elige").ini + 0.2, { de: "der" });
  cam.mostrar(b("elige").ini + 0.6, [obj], { dur: 0.9 });
  cursor.ir(b("elige").ini + 0.9, obj.fila("Interacción"), 0.8);
  const tVen = cursor.clic(d("elige", "ventas") - 0.7, obj.fila("Ventas"));
  obj.desmarcar("Interacción", tVen); obj.marcar("Ventas", tVen);
  cursor.fuera(b("objetivo").ini + 0.2);
  pulso(obj.fila("Ventas"), d("objetivo", "objetivo"), 0.05);
  sale(obj, b("perfil").ini + 0.8);

  // ===================================================== 4-6 · el clic lleva al perfil (mandar mensaje y esperar) → página de producto
  cam.mostrar(b("perfil").ini + 0.5, [p1.el], { dur: 0.7 });
  cursor.clic(d("perfil", "clic") - 0.3, post.querySelector(".foto"), { dur: 0.5 });
  cursor.fuera(d("perfil", "clic") + 0.5);
  const p2 = p.celular(720, 1750, { nombre: "a donde lleva el clic", z: 3 });
  const perfil = p.perfil(p2, { lentes: true });
  const prod = p.producto(p2, { oculta: true });
  flecha(U.borde(p1.el, "abajo", 20), U.borde(p2.el, "arriba", 20), d("perfil", "clic") + 0.1, { curva: 0, dur: 0.4, t1: d("perfil", "perfil") + 0.5 });
  entra(p2.el, d("perfil", "clic") + 0.2, { de: "abajo" });
  cam.mostrar(d("perfil", "perfil") + 0.4, [p2.el], { dur: 0.8 });
  // para comprar hay que mandar mensaje: se abre la conversación, pregunta y nadie contesta
  const dmv = p.dm(p2, { oculta: true });
  cambiar(perfil, dmv, d("perfil", "mensaje") - 0.5);
  mostrar(dmv.ultima, d("perfil", "mensaje") + 0.1);
  mostrar(dmv.espera, d("perfil", "esperar") - 0.1);
  alerta(dmv.espera, d("perfil", "esperar"), b("perfil").fin + 0.2, { margen: 8, radio: 20, quieto: true });
  cambiar(dmv, prod.vista, d("pagina", "página") - 0.2);
  pulso(prod.comprar, d("pagina", "comprar") - 0.1, 0.06);
  pulso(p2.el, d("producto", "página") + 0.2, 0.03);

  // ===================================================== 7-9 · Meta no ve quién compra → el píxel
  const meta = p.meta(1340, 1800);
  entra(meta, d("ciego", "meta") - 0.2, { de: "der" });
  flecha(U.borde(p2.el, "der", 10), U.borde(meta, "abajo", 12), d("ciego", "compra"), { cortada: true, color: "#94a3b8", curva: 0.2, t1: b("codigo").ini + 0.4 });
  const nada = p.globo("?", 1500, 2080, { color: "rojo", nombre: "Meta no ve" }); nada.style.fontSize = "64px";
  entra(nada, d("ciego", "buscar") - 0.2, { de: "pop" });
  cam.mostrar(d("ciego", "meta") + 0.3, [p2.el, meta, nada], { dur: 0.9 });
  sale(nada, b("codigo").ini + 0.3);
  // el código va DENTRO de la página, en la parte de abajo (no tapa los lentes ni el botón Comprar)
  const cod = p.codigo(752, 2668, { nombre: "código del píxel" }); cod.dataset.encima = "1"; cod.style.zIndex = 6; cod.style.width = "496px";
  cod.querySelector(".barra span").textContent = "píxel · avisa a Meta"; cod.querySelector(".barra").style.height = "52px";
  const pre = cod.querySelector("pre"); pre.style.fontSize = "28px"; pre.style.padding = "16px 24px 20px";
  pre.innerHTML = `<span class="f">fbq</span>(<span class="s">'track'</span>,\n    <span class="s">'Purchase'</span>)`;
  entra(cod, d("codigo", "código") - 0.2, { de: "abajo" });
  cam.mostrar(d("codigo", "código") + 0.3, [p2.el, meta], { dur: 0.8 });
  cursor.clic(d("codigo", "avisa") - 0.4, prod.comprar, { dur: 0.6 });   // alguien compra…
  cursor.fuera(d("codigo", "avisa") + 0.4);
  const senal = flecha(U.borde(cod, "der", 0), U.borde(meta, "abajo", 10), d("codigo", "avisa"), { color: "#0866ff", curva: -0.15, dur: 0.5, t1: b("confianza").ini });   // …y el código le avisa a Meta
  const venta = p.chip("✓ Nueva compra", 0, 0, { color: "ok", nombre: "aviso de compra", encima: true }); venta.style.zIndex = 8;
  entra(venta, d("codigo", "compra") - 0.05, { de: "pop", dur: 0.3 });
  recorrer(venta, senal, d("codigo", "compra") + 0.1, 1.0);
  sale(venta, d("codigo", "compra") + 1.3, { dur: 0.3 });
  // "Meta busca a más gente como esa": junto a Meta se juntan personas parecidas (fuera de la página)
  const parecidas = [[1350, 1990], [1462, 1990], [1350, 2102], [1462, 2102]].map(([x, y], i) => { const q = U.poner(`<div class="persona deco" style="background:${["#16a34a", "#22c55e", "#15803d", "#059669"][i]}">✓</div>`, x, y, { nombre: "persona parecida" }); entra(q, d("codigo", "gente") - 0.2 + i * 0.12, { de: "pop", dur: 0.35 }); return q; });
  const etiquetaPar = p.chip("Gente parecida", 1330, 2230, { color: "ok", nombre: "gente parecida" });
  entra(etiquetaPar, d("codigo", "gente"), { de: "pop" });
  pulso(cod, d("pixel", "píxel") + 0.3, 0.05);
  [meta, cod, ...parecidas, etiquetaPar].forEach((x) => sale(x, b("confianza").ini + 0.1));

  // ===================================================== 10-12 · nadie usa su tarjeta en una tienda que no conoce → prueba social
  cam.mostrar(d("confianza", "tarjeta"), [p2.el], { dur: 0.9 });
  // le pica a Comprar, sale la hoja de pago con tarjeta… y ahí duda
  cursor.clic(d("confianza", "nadie") - 0.2, prod.comprar, { dur: 0.5 });
  cursor.fuera(d("confianza", "nadie") + 0.5);
  window.tl.fromTo(prod.pago, { opacity: 0, y: 260 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", immediateRender: false }, d("confianza", "tarjeta") - 0.3);
  alerta(prod.duda, d("confianza", "conoce") - 0.3, b("confianza").fin + 0.2, { margen: 8, radio: 18, quieto: true });
  window.tl.fromTo(prod.pago, { opacity: 1, y: 0 }, { opacity: 0, y: 260, duration: 0.35, ease: "power2.in", immediateRender: false }, b("resenas").ini - 0.1);
  cambiar(prod.detalles, prod.resenas, d("resenas", "fotos") - 0.2);
  window.tl.fromTo(prod.vista.querySelector(".producto"), { y: 0 }, { y: -200, duration: 0.7, ease: "power3.inOut", immediateRender: false }, d("resenas", "fotos") - 0.3);   // scroll: aparecen las reseñas
  const garantia = prod.resenas.querySelector(".garantia"); garantia.style.opacity = 0;
  mostrar(garantia, d("resenas", "garantía") - 0.2);
  pulso(prod.resenas, d("prueba", "prueba"), 0.03);

  // ===================================================== 13-15 · un solo anuncio se gasta → creativos
  const anuncio = p.anuncio(p1, { oculta: true, producto: "lentes", boton: "Comprar", fondo: "linear-gradient(160deg,#fef3c7,#fde68a 55%,#fbbf24)" });
  cambiar(post, anuncio, b("prueba").ini);   // fuera de cámara: el post ya es un anuncio de venta
  cam.mostrar(d("cansa", "anuncio") + 0.2, [p1.el], { dur: 1.1 });
  // renglones del anuncio (debajo del botón): cuántas veces lo vio y cómo bajan las ventas
  const abrir = (row, t) => window.tl.fromTo(row, { height: 0, opacity: 0, paddingTop: 0 }, { height: 54, opacity: 1, paddingTop: 8, duration: 0.35, ease: "power2.out", immediateRender: false }, t);
  abrir(anuncio.querySelector(".visto"), d("cansa", "vez") - 0.3);
  abrir(anuncio.querySelector(".dia"), d("cansa", "funcionar") - 0.7);
  contador(anuncio.querySelector(".dia .cuenta"), 12, 2, d("cansa", "funcionar") - 0.5, b("cansa").fin, { pasos: 5 });
  alerta(p1.el, d("cansa", "funcionar") - 0.2, b("cansa").fin + 0.2, { radio: 96, quieto: true });
  const hs = [["probando", 540, 360, "probándoselos"], ["cara", 960, 360, "idea"], ["modelos", 750, 1060, "formato"]].map(([tipo, x, y, w]) => {
    const h = p.historia(x, y, tipo); entra(h, (tipo === "probando" ? d("varios", "anuncios") : d("varios", w)) - 0.2, { de: "abajo", dur: 0.5 }); return h;
  });
  sale(p1.el, b("varios").ini, { a: "escala" });
  cam.mostrar(d("varios", "anuncios") + 0.2, hs, { dur: 0.7 });
  hs.forEach((x, i) => pulso(x, d("creativos", "creativos") + 0.2 + i * 0.12, 0.05));
  sale(p2.el, b("cansa").ini);   // la fila de abajo ya terminó

  // ===================================================== 16 · ahora sí: te llegan ventas
  const notis = ["Pedro", "Diana", "Raúl"].map((n, i) => { const x = p.noti("Nueva venta · $899", `${n} compró tus lentes`, 590, 3450 + i * 180, { nombre: "venta de " + n }); entra(x, d("ahorasi", "ventas") - 0.4 + i * 0.25, { de: "arriba", dur: 0.45 }); return x; });
  const ventas = p.metrica("Ventas", 810, 4020, { color: "#1fb455" });
  contador(ventas.cifra, 0, 120, d("ahorasi", "ventas"), b("ahorasi").fin + 0.4, { pasos: 12 });
  entra(ventas, d("ahorasi", "ventas") + 0.2, { de: "abajo" });
  cam.mostrar(b("ahorasi").ini + 0.3, [...notis, ventas], { dur: 1.2 });
  [...notis, ventas].forEach((x) => sale(x, b("carrito").ini + 0.2));

  // ===================================================== 17-19 · dejan el carrito → recuperación de carrito
  const gente = [["Ana", "#f59e0b"], ["Luis", "#3b82f6"], ["Marta", "#ec4899"], ["Carlos", "#10b981"], ["Sofía", "#8b5cf6"], ["Jorge", "#ef4444"]];
  const tabla = p.registrados(100, 4450, gente.map(([n, c]) => [n, c, "En el carrito", "azul"]), { titulo: "Carritos de hoy", nombre: "carritos" });
  entra(tabla, d("carrito", "carrito") - 0.6, { de: "abajo" });
  cam.mostrar(d("carrito", "carrito") - 0.3, [tabla], { dur: 1.0 });
  tabla.filas.forEach((f, i) => {
    const pago = i === 0 || i === 3, chip = f.querySelector(".chip");
    const nuevo = U.html(`<span class="chip ${pago ? "ok" : "gris"}" style="position:absolute;right:36px;opacity:0">${pago ? "Pagó ✓" : "No pagó"}</span>`); f.appendChild(nuevo);
    ocultar(chip, d("carrito", "pagan") - 0.5 + i * 0.1, 0.15); mostrar(nuevo, d("carrito", "pagan") - 0.3 + i * 0.1, 0.25);
  });
  const p4 = p.celular(1320, 4330, { nombre: "WhatsApp" });
  const wa = p.whatsapp(p4, { contacto: "Luis", color: "#3b82f6" });
  const s1 = p.sello(wa, "1 hora después"), m1 = p.mensaje(wa, "¡Hola Luis! Dejaste tus lentes en el carrito 🕶️ Aquí lo terminas en un clic 👉", "5:12");
  const resp = p.respuesta(wa, "¡Listo, ya los pagué! 🙌", "5:15");
  entra(p4.el, d("mensaje", "hora") - 0.4, { de: "der" });
  cam.mostrar(d("mensaje", "hora"), [p4.el], { dur: 0.9 });
  mostrar(s1, d("mensaje", "después") - 0.2); mostrar(m1, d("mensaje", "mensaje") - 0.3);
  mostrar(resp, d("recuperacion", "recuperación") - 0.2);
  pulso(p4.el, d("recuperacion", "recuperación") + 0.2, 0.03);
  [tabla, p4.el].forEach((x) => sale(x, b("sevan").ini + 0.2));

  // ===================================================== 20-22 · ven los lentes y se van → remarketing
  const vieron = p.metrica("Vieron los lentes", 100, 5820), seVan = p.metrica("Se fueron sin agregarlos", 520, 5820, { color: "#e11d48" });
  contador(vieron.cifra, 0, 1000, d("sevan", "ven"), d("sevan", "ven") + 0.9, { pasos: 10 });
  contador(seVan.cifra, 0, 850, d("sevan", "van") - 0.3, d("sevan", "van") + 0.6, { pasos: 8 });
  entra(vieron, d("sevan", "ven") - 0.3, { de: "abajo" }); entra(seVan, d("sevan", "agregan") - 0.2, { de: "abajo" });
  cam.mostrar(d("sevan", "ven") + 0.2, [vieron, seVan], { dur: 1.1 });
  alerta(seVan, d("sevan", "van"), b("sevan").fin + 0.2);
  [vieron, seVan].forEach((x) => sale(x, b("otravez").ini + 0.4));
  const p5 = p.celular(1100, 5700, { nombre: "anuncio de remarketing" });
  const an5 = p.anuncio(p5, { titulo: "¿Todavía los quieres?", boton: "Comprar ahora", producto: "lentes", solo: "Solo para los 850 que se fueron", fondo: "linear-gradient(160deg,#fef3c7,#fde68a 55%,#fbbf24)" });
  entra(p5.el, d("otravez", "anuncio") - 0.3, { de: "der" });
  window.tl.fromTo(an5.querySelector(".solo"), { height: 0, opacity: 0, paddingTop: 0 }, { height: 100, opacity: 1, paddingTop: 8, duration: 0.35, ease: "power2.out", immediateRender: false }, d("otravez", "solo") - 0.2);
  cam.mostrar(d("otravez", "anuncio") + 0.2, [p5.el], { dur: 0.9 });
  pulso(p5.el, d("remarketing", "remarketing"), 0.03);

  // ===================================================== 23-25 · lo dejan para después → la oferta
  const luego = p.tarjeta(`<div style="width:760px">
      <div class="globo" style="display:inline-block;position:relative;font-size:46px">Mañana los compro 😅</div>
      <div class="tarde" style="margin-top:34px;display:flex;align-items:center;gap:18px;font:800 40px Montserrat;color:#e11d48"><span style="font-size:48px">📅</span>3 semanas después: no compró</div></div>`, 120, 7150, { nombre: "lo dejan para después", relleno: "40px 40px" });
  const tarde = luego.querySelector(".tarde"); tarde.style.opacity = 0;
  entra(luego, d("despues", "después") - 0.6, { de: "abajo" });
  mostrar(tarde, d("despues", "nunca") - 0.3);
  cam.mostrar(d("despues", "después") - 0.2, [luego], { dur: 1.1 });
  alerta(luego, d("despues", "nunca"), b("despues").fin + 0.2, { quieto: true });
  const of = p.oferta(110, 7700, { etiqueta: "ENVÍO GRATIS", titulo: "Solo este fin de semana", texto: "Compra hoy y no pagas envío", contador: "Pedidos con envío gratis" });
  const dos = (v) => String(v).padStart(2, "0");
  contador(of.h, 47, 47, 0, 1, { pasos: 1, formato: dos });
  contador(of.m, 59, 59, 0, 1, { pasos: 1, formato: dos });
  contador(of.s, 59, 52, d("hoy", "hoy"), d("hoy", "hoy") + 7, { pasos: 7, formato: dos });
  contador(of.ventas, 0, 14, d("hoy", "gratis"), b("oferta").fin + 0.5, { pasos: 7 });
  entra(of, d("hoy", "razón") - 0.2, { de: "abajo" });
  cam.mostrar(d("hoy", "razón") + 0.3, [luego, of], { dur: 0.8 });
  pulso(of, d("oferta", "oferta"), 0.04);

  // ===================================================== 26 · llamado a la acción, versión larga
  // 1) "aprender a hacer todo esto": las 8 piezas del video se apilan y forman el embudo
  const piezasEmbudo = ["Objetivo", "Página de producto", "Píxel", "Prueba social", "Creativos", "Recuperación de carrito", "Remarketing", "Oferta"];
  const colores = ["#2563eb", "#3b5bf0", "#4f52ee", "#6248ea", "#7340e2", "#8338d8", "#9333cc", "#a12dbd"];
  const capas = piezasEmbudo.map((t, i) => {
    const w = 940 - i * 64, x = 1150 - w / 2, y = 8700 + i * 112;
    const c = U.poner(`<div style="width:${w}px;height:96px;border-radius:26px;background:${colores[i]};color:#fff;display:flex;align-items:center;justify-content:center;font:800 38px Inter;box-shadow:0 14px 30px rgba(76,29,149,.18)">${t}</div>`, x, y, { nombre: "capa " + t });
    entra(c, d("cta", "aprender") - 0.4 + i * 0.13, { de: "arriba", dur: 0.45 });
    return c;
  });
  const salida = U.poner(`<div style="width:300px;height:96px;border-radius:26px;background:#16a34a;color:#fff;display:flex;align-items:center;justify-content:center;font:900 40px Montserrat">Ventas ✓</div>`, 1000, 8700 + 8 * 112 + 20, { nombre: "ventas" });
  entra(salida, d("cta", "aprender") + 0.8, { de: "pop" });
  cam.mostrar(d("cta", "aprender") + 0.1, [...capas, salida], { dur: 1.2 });
  // 2) "utilizando inteligencia artificial": un destello recorre el embudo y aparece la etiqueta
  capas.forEach((c, i) => pulso(c, d("cta", "inteligencia") - 0.1 + i * 0.06, 0.04));
  const ia = U.poner(`<div class="chip" style="font-size:44px;background:#6d28d9;color:#fff;box-shadow:0 14px 30px rgba(109,40,217,.35)">✨ con inteligencia artificial</div>`, 870, 8560, { nombre: "con IA" });
  entra(ia, d("cta", "inteligencia") - 0.1, { de: "pop" });
  // 3) "comenta la palabra: Embudo": el post de los lentes de dólar con sus comentarios; se escribe, se publica y llega la guía por mensaje
  const p6 = p.celular(870, 9900, { nombre: "comenta Embudo" });
  const svgMini = `<svg viewBox="0 0 760 330" width="420" height="182"><defs><linearGradient id="o2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1a8"/><stop offset=".45" stop-color="#f5c542"/><stop offset="1" stop-color="#a86b12"/></linearGradient><linearGradient id="v2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4b5568"/><stop offset=".5" stop-color="#1b2130"/><stop offset="1" stop-color="#0b0e14"/></linearGradient></defs>
      <path d="M92 118 L18 104" stroke="url(#o2)" stroke-width="16" stroke-linecap="round"/><path d="M668 118 L742 104" stroke="url(#o2)" stroke-width="16" stroke-linecap="round"/><path d="M292 132 Q380 96 468 132" fill="none" stroke="url(#o2)" stroke-width="18" stroke-linecap="round"/>
      <text x="200" y="262" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="330" fill="url(#v2)" stroke="url(#o2)" stroke-width="16" paint-order="stroke">$</text><text x="560" y="262" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="330" fill="url(#v2)" stroke="url(#o2)" stroke-width="16" paint-order="stroke">$</text></svg>`;
  const vistaCom = p.vista(p6, `<div class="cab"><div class="avatar deco"><div>TN</div></div><div><div class="nombre">tunegocio</div><div class="sub">Embudo con IA</div></div></div>
      <div style="height:330px;display:flex;align-items:center;justify-content:center;background:radial-gradient(360px 240px at 50% 46%, #334e9b, #0f172a)">${svgMini}</div>
      <div style="padding:20px 26px 10px;font:800 36px Inter">Comentarios</div>
      <div class="lista" style="padding:0 26px;display:flex;flex-direction:column;gap:16px">
        <div style="font:500 34px Inter"><b>ana.mx</b> Embudo 🙌</div>
        <div style="font:500 34px Inter"><b>luis_ventas</b> Embudo</div>
        <div style="font:500 34px Inter"><b>caro.shop</b> ¡Embudo!</div>
        <div style="font:500 34px Inter"><b>mario.mkt</b> Embudo 🔥</div>
        <div class="mio" style="font:500 34px Inter;opacity:0"><b>tú</b> Embudo <span class="corazon" style="color:#e11d48;opacity:0">♥</span></div>
      </div>
      <div class="dm-guia" style="position:absolute;left:20px;right:20px;bottom:24px;opacity:0;display:flex;gap:18px;align-items:center;padding:20px 22px;border-radius:28px;background:#f5f3ff;border:3px solid #ddd6fe">
        <div style="width:70px;height:70px;flex:none;border-radius:18px;background:linear-gradient(135deg,#ec4899,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font:900 34px Inter">✉</div>
        <div style="font:600 30px/1.25 Inter;color:#0f172a"><b>tunegocio</b> te mandó tu guía para armar tu embudo con IA 📩</div></div>
      <div class="barra-com" style="position:absolute;left:20px;right:20px;bottom:24px;height:92px;border-radius:46px;border:3px solid #cbd5e1;display:flex;align-items:center;padding:0 28px;gap:16px">
        <div class="caja-com" style="flex:1;font:800 38px Inter;color:#0f172a"></div><div class="publicar" style="font:800 32px Inter;color:#0866ff">Publicar</div></div>`);
  entra(p6.el, d("cta", "comenta") - 0.6, { de: "abajo" });
  cam.mostrar(d("cta", "comenta") - 0.1, [p6.el], { dur: 1.0 });
  const caja = vistaCom.querySelector(".caja-com"), mio = vistaCom.querySelector(".mio");
  escribir(caja, "Embudo", d("cta", "embudo") - 0.3, 0.6);
  const tPub = cursor.clic(d("cta", "embudo") + 0.5, vistaCom.querySelector(".publicar"), { dur: 0.5 });
  ocultar(caja, tPub + 0.15, 0.15); mostrar(mio, tPub + 0.2, 0.3);
  const cor = mio.querySelector(".corazon"); window.tl.fromTo(cor, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1.25, duration: 0.3, ease: "back.out(3)", immediateRender: false }, tPub + 0.8);
  cursor.fuera(tPub + 0.6);
  // llega la guía por mensaje (notificación completa dentro del celular)
  ocultar(vistaCom.querySelector(".barra-com"), tPub + 1.2, 0.2);
  const guia = vistaCom.querySelector(".dm-guia");
  window.tl.fromTo(guia, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.6)", immediateRender: false }, tPub + 1.35);
  pulso(guia, tPub + 2.3, 0.04);

  // encender a una persona de la audiencia (opacidad y un brinquito)
  function encender(q, t) {
    window.tl.fromTo(q, { opacity: 0.3, scale: 1 }, { opacity: 1, scale: 1.12, duration: 0.25, immediateRender: false }, t);
    window.tl.fromTo(q, { scale: 1.12 }, { scale: 1, duration: 0.2, immediateRender: false }, t + 0.25);
  }
}
