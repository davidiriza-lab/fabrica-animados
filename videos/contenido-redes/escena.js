// "Cómo crear contenido para redes sociales" · motor MOTION, tema NOCHE (estilo A), recorrido de pizarra.
// Un solo caso: una pastelería. Fotos generadas con OpenAI (pastel, pastel partido, receta, cocina, pedido).
// Reglas: texto ≥ 26 px, nada de texto encima de imágenes (va abajo, en su renglón), nada a caballo, sin huecos.
export default function construir(U, V) {
  const { p, entra, sale, mostrar, ocultar, pulso, cambiar, contador, alerta, flecha, escribir, cursor, cam } = U;
  const b = (id) => V.beat(id), d = (id, w) => V.dice(id, w);
  U.lienzo(2300, 15600);   // el cierre vive en y≈12500–14300

  const tarjeta = (html, x, y, w, o = {}) => U.poner(`<div class="tarjeta" style="width:${w}px;padding:${o.pad || "36px 40px"}">${html}</div>`, x, y, { nombre: o.nombre || "tarjeta", encima: o.encima });
  const img = (src, h, extra = "") => `<div class="imagen" style="height:${h}px;background:url(assets/${src}) center/cover;${extra}"></div>`;
  const titulo = (t, s = 44) => `<div style="font:800 ${s}px/1.1 Montserrat;color:#0f172a;margin-bottom:14px">${t}</div>`;
  const fila = (izq, der, color = "#0f172a") => `<div style="display:flex;justify-content:space-between;align-items:center;padding:18px 0;border-bottom:2px solid #eef2f7;font:600 32px Inter;color:#334155"><span>${izq}</span><span style="color:${color};font-weight:800">${der}</span></div>`;
  const dato = (t, color = "#e11d48") => `<div class="dato" style="opacity:0;height:0;padding:0 26px;color:${color}">${t}</div>`;
  const abrir = (row, t, h = 56) => window.tl.fromTo(row, { height: 0, opacity: 0, paddingTop: 0 }, { height: h, opacity: 1, paddingTop: 8, duration: 0.35, ease: "power2.out", immediateRender: false }, t);

  // ===================================================== 0-3 · lo subes = contenido → lo pasan de largo → el gancho
  const p1 = p.celular(870, 300, { nombre: "tu video" });
  const v1 = p.vista(p1, `<div class="cab"><div class="avatar deco"><div>DP</div></div><div><div class="nombre">dulce.pastel</div><div class="sub">Pastelería artesanal</div></div></div>
    <div style="position:relative;height:640px">${img("pastel.jpg", 640, "position:absolute;inset:0")}<div class="partido" style="position:absolute;inset:0;opacity:0">${img("pastel-partido.jpg", 640, "position:absolute;inset:0")}</div></div>
    <div class="pregunta" style="opacity:0;height:0;overflow:hidden;padding:0 26px;font:800 36px/1.15 Montserrat;color:#0f172a">¿Quieres que tu pastel nunca se hunda?</div>
    ${dato("👁 Lo ven 1 segundo y se van", "#e11d48").replace('class="dato"', 'class="dato seg1"')}
    ${dato("👁 Se quedan solo 3 segundos", "#e11d48").replace('class="dato"', 'class="dato seg3"')}
    <div style="padding:14px 26px 0;font:600 30px Inter;color:#334155">Nuevo pastel de chocolate 🍫</div>
    <div style="padding:8px 26px 0;font:700 30px Inter;color:#0f172a">♥ 86 Me gusta</div><div class="cab" style="margin-top:16px;border-top:2px solid #eef2f7"><div class="avatar deco"><div style="background:linear-gradient(135deg,#60a5fa,#2563eb)"></div></div><div style="flex:1"><div style="height:22px;width:55%;border-radius:11px;background:#e2e8f0"></div><div style="height:18px;width:35%;border-radius:9px;background:#eef2f7;margin-top:10px"></div></div></div><div style="height:420px;background:linear-gradient(160deg,#e2e8f0,#cbd5e1)"></div>`);
  entra(p1.el, d("base", "grabas") - 0.2, { de: "abajo", dur: 0.7 });
  cam.mostrar(0, [p1.el], { dur: 0.1 });
  abrir(v1.querySelector(".seg1"), d("pasan", "largo") - 0.3, 100);
  alerta(v1.querySelector(".seg1"), d("pasan", "segundo") - 0.1, b("pasan").fin + 0.2, { margen: 6, radio: 16, quieto: true, sinSello: true });
  const cerrar = (row, t, h = 56) => window.tl.fromTo(row, { height: h, opacity: 1, paddingTop: 8 }, { height: 0, opacity: 0, paddingTop: 0, duration: 0.3, ease: "power2.in", immediateRender: false }, t);
  cerrar(v1.querySelector(".seg1"), b("detiene").ini + 0.1, 100);
  mostrar(v1.querySelector(".partido"), d("detiene", "partiéndose") - 0.3, 0.45);
  abrir(v1.querySelector(".pregunta"), d("detiene", "pregunta") - 0.3, 96);
  pulso(p1.el, d("gancho", "gancho"), 0.03);

  // ===================================================== 4-7 · se van a los 3 segundos → la estructura
  abrir(v1.querySelector(".seg3"), d("tres", "tres") - 0.3, 100);
  alerta(v1.querySelector(".seg3"), d("tres", "nada") - 0.2, b("tres").fin + 0.2, { margen: 6, radio: 16, quieto: true, sinSello: true });
  let y = 1750;
  const hist = tarjeta(`${titulo("Tu video, como historia")}
    ${[["1", "Qué salió mal", "Se hundía en el centro", "salió", "hundido.jpg", "center"], ["2", "Qué cambiaste", "Horno a 170 grados", "cambiaste", "horno.jpg", "center 85%"], ["3", "Cómo quedó", "Esponjoso y parejo", "quedó", "pastel.jpg", "center 60%"]].map(([n, a, t, w, src, pos], i) => `<div class="paso" data-w="${w}" style="opacity:${i === 0 ? 0 : 0};display:flex;gap:26px;align-items:center;padding:18px 0;border-bottom:2px solid #eef2f7">
      <div class="imagen" style="flex:none;width:210px;height:210px;border-radius:22px;background:url(assets/${src}) ${pos}/cover"></div>
      <div><div style="font:800 30px Montserrat;color:#0866ff">${n}</div><div style="font:800 38px/1.1 Inter;color:#0f172a;margin-top:4px">${a}</div><div style="font:600 34px/1.2 Inter;color:#475569;margin-top:6px">${t}</div></div></div>`).join("")}`, 720, y, 860, { nombre: "estructura" });
  entra(hist, d("historia", "historia") - 0.4, { de: "abajo" });
  cam.mostrar(d("historia", "historia"), [hist], { dur: 1.1 });
  hist.querySelectorAll(".paso").forEach((ps, i) => mostrar(ps, i === 0 ? d("historia", "historia") - 0.1 : d("historia", ps.dataset.w) - 0.3));
  pulso(hist, d("estructura", "estructura"), 0.03);

  // ===================================================== 8-10 · lo ven sin sonido → los subtítulos
  cam.mostrar(d("sonido", "mitad"), [p1.el], { dur: 1.1 });
  cerrar(v1.querySelector(".seg3"), b("sonido").ini - 0.4, 100);
  const v1b = p.vista(p1, `<div class="cab"><div class="avatar deco"><div>DP</div></div><div><div class="nombre">dulce.pastel</div><div class="sub">Pastelería artesanal</div></div></div>
    <div style="margin:0 16px;border-radius:22px;background:#0b0f1a;overflow:hidden">${img("pastel-partido.jpg", 520)}
      <div style="height:150px;display:flex;align-items:center;justify-content:center;padding:0 24px"><div class="subt" style="opacity:0;color:#fff;font:800 36px/1.2 Inter;text-align:center">"Se hundía… hasta que bajé el horno a 170 grados"</div></div></div>
    <div style="padding:16px 26px 0;font:800 36px Inter;color:#e11d48">🔇 Viéndolo sin sonido</div>
    <div class="queDijo" style="opacity:0;padding:10px 26px 0;font:800 36px Inter;color:#e11d48">🤷 ¿Y qué dijo?</div><div class="cab" style="margin-top:16px;border-top:2px solid #eef2f7"><div class="avatar deco"><div style="background:linear-gradient(135deg,#60a5fa,#2563eb)"></div></div><div style="flex:1"><div style="height:22px;width:55%;border-radius:11px;background:#e2e8f0"></div><div style="height:18px;width:35%;border-radius:9px;background:#eef2f7;margin-top:10px"></div></div></div><div style="height:420px;background:linear-gradient(160deg,#e2e8f0,#cbd5e1)"></div>`, { oculta: true });
  cambiar(v1, v1b, d("sonido", "mitad") - 0.6);
  alerta(p1.el, d("sonido", "sonido") - 0.1, b("sonido").fin + 0.2, { radio: 96, quieto: true, sinSello: true });
  mostrar(v1b.querySelector(".queDijo"), d("sonido", "entiende") - 0.3);
  ocultar(v1b.querySelector(".queDijo"), d("texto", "texto") - 0.3, 0.2);
  mostrar(v1b.querySelector(".subt"), d("texto", "texto") - 0.3);
  pulso(v1b.querySelector(".subt"), d("subtitulos", "subtítulos"), 0.05);
  sale(hist, b("sonido").ini);

  // ===================================================== 11-13 · subes un día sí y diez no → el calendario de contenido
  y = 3600;
  const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const mes = tarjeta(`${titulo("Tus publicaciones del mes")}
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:10px">${Array.from({ length: 28 }, (_, i) => `<div style="height:84px;border-radius:14px;background:${i === 2 || i === 16 ? "#0866ff" : "#f1f5f9"}"></div>`).join("")}</div>
    <div style="margin-top:22px;font:800 34px Inter;color:#e11d48">Solo 2 publicaciones en 28 días</div>`, 720, y, 860, { nombre: "mes" });
  entra(mes, d("olvidan", "subes") - 0.4, { de: "abajo" });
  cam.mostrar(d("olvidan", "subes"), [mes], { dur: 1.1 });
  alerta(mes, d("olvidan", "olvidan") - 0.2, b("olvidan").fin + 0.2, { quieto: true });
  y = 4500;
  const plan = [["Lun", "Reel", "9:00 am"], ["Mar", "Historia", "1:00 pm"], ["Mié", "Reel", "9:00 am"], ["Jue", "Carrusel", "6:00 pm"], ["Vie", "Reel", "9:00 am"], ["Sáb", "Historia", "11:00 am"], ["Dom", "Planear la semana", ""]];
  const semana = tarjeta(`${titulo("Tu semana, desde el domingo")}
    ${plan.map(([dd, t, h]) => `<div class="dia" style="opacity:0;display:flex;gap:22px;align-items:center;padding:14px 0;border-bottom:2px solid #eef2f7"><span style="width:110px;font:800 36px Inter;color:#0866ff">${dd}</span><span style="flex:1;font:700 36px Inter;color:#0f172a">${t}</span><span style="font:600 32px Inter;color:#64748b">${h}</span></div>`).join("")}`, 720, y, 860, { nombre: "calendario" });
  entra(semana, d("domingo", "domingo") - 0.5, { de: "abajo" });
  cam.mostrar(d("domingo", "domingo"), [semana], { dur: 1.0 });
  semana.querySelectorAll(".dia").forEach((dd, i) => mostrar(dd, d("domingo", "subir") - 0.3 + i * 0.12));
  pulso(semana, d("calendario", "calendario"), 0.03);
  sale(mes, b("domingo").ini + 0.2);

  // ===================================================== 14-16 · se acaban las ideas → los pilares de contenido
  y = 5800;
  const vacio = tarjeta(`${titulo("¿Qué grabo hoy? 🤯")}${[1, 2, 3, 4].map(() => `<div style="height:22px;border-radius:11px;background:#f1f5f9;margin:22px 0"></div>`).join("")}<div style="font:800 34px Inter;color:#e11d48">Semana 3 · sin ideas</div>`, 720, y, 860, { nombre: "sin ideas" });
  entra(vacio, d("ideas", "tercera") - 0.4, { de: "abajo" });
  cam.mostrar(d("ideas", "tercera"), [vacio], { dur: 1.1 });
  alerta(vacio, d("ideas", "grabar") - 0.2, b("ideas").fin + 0.2, { quieto: true });
  y = 6600;
  const pilv = tarjeta(`${titulo("Tus 3 pilares")}${[["receta.jpg", "Enseñar una receta", "receta"], ["cocina.jpg", "Mostrar tu cocina", "cocina"], ["pedido.jpg", "Presumir pedidos", "pedidos"]].map(([src, t, w]) => `<div class="pil" data-w="${w}" style="opacity:0;display:flex;gap:28px;align-items:center;padding:18px 0;border-bottom:2px solid #eef2f7"><div class="imagen" style="flex:none;width:230px;height:200px;border-radius:22px;background:url(assets/${src}) center/cover"></div><div style="font:800 42px/1.1 Inter;color:#0f172a">${t}</div></div>`).join("")}`, 720, y, 860, { nombre: "pilares" });
  entra(pilv, d("temas", "temas") - 0.5, { de: "abajo" });
  cam.mostrar(d("temas", "temas") - 0.1, [pilv], { dur: 1.0 });
  pilv.querySelectorAll(".pil").forEach((pl, i) => mostrar(pl, i === 0 ? d("temas", "temas") : d("temas", pl.dataset.w) - 0.3));
  pulso(pilv, d("pilares", "pilares"), 0.03);
  const pilares = [pilv];
  [semana, vacio].forEach((x) => sale(x, b("temas").ini));

  // ===================================================== 17 · ahora sí te ven
  y = 7500;
  const vistas = tarjeta(`<div style="font:700 32px Inter;color:#64748b">Vistas esta semana</div><div class="cifra" style="position:relative;height:150px;font:900 132px/150px Montserrat;color:#0866ff"></div>`, 870, y, 560, { nombre: "vistas" });
  contador(vistas.querySelector(".cifra"), 2300, 48200, d("ahorasi", "ven") - 0.3, b("ahorasi").fin + 0.5, { pasos: 10 });
  entra(vistas, b("ahorasi").ini, { de: "pop" });
  cam.mostrar(b("ahorasi").ini + 0.6, [vistas], { dur: 0.7 });
  pilares.forEach((c) => sale(c, b("ahorasi").ini));

  // ===================================================== 18-20 · te siguen pero nadie pide → el llamado a la acción
  y = 8200;
  const nadie = tarjeta(`${titulo("Esta semana")}${fila("Seguidores nuevos", "+1,240", "#16a34a")}${fila("Pedidos", "0", "#e11d48")}`, 720, y, 860, { nombre: "sin pedidos" });
  entra(nadie, d("nadie", "siguen") - 0.4, { de: "abajo" });
  cam.mostrar(d("nadie", "siguen"), [nadie], { dur: 1.1 });
  alerta(nadie, d("nadie", "nadie") - 0.1, b("nadie").fin + 0.2, { quieto: true });
  sale(vistas, b("nadie").ini);
  y = 8950;
  const p2 = p.celular(870, y, { nombre: "final del video" });
  const v2 = p.vista(p2, `<div class="cab"><div class="avatar deco"><div>DP</div></div><div><div class="nombre">dulce.pastel</div><div class="sub">Pastelería artesanal</div></div></div>
    ${img("pastel.jpg", 560)}
    <div class="llamado" style="opacity:0;margin:20px 20px 0;padding:20px 22px;border-radius:20px;background:#0866ff;color:#fff;font:800 36px/1.15 Inter;text-align:center">💬 Mándame mensaje y aparta el tuyo</div>
    <div class="dms" style="padding:18px 26px 0;display:flex;flex-direction:column;gap:12px"></div>`);
  const dms = v2.querySelector(".dms");
  const msjs = ["Quiero uno para el sábado 🎂", "¿Tienes de fresa?", "Aparto dos, por favor 🙌"].map((t) => { const m = U.html(`<div style="opacity:0;padding:14px 20px;border-radius:18px;background:#f1f5f9;font:600 30px Inter;color:#0f172a">✉ ${t}</div>`); dms.appendChild(m); return m; });
  entra(p2.el, d("dile", "final") - 0.4, { de: "abajo" });
  cam.mostrar(d("dile", "final"), [p2.el], { dur: 1.1 });
  mostrar(v2.querySelector(".llamado"), d("dile", "qué") - 0.3);
  msjs.forEach((m, i) => mostrar(m, d("cta", "llamado") - 0.6 + i * 0.35));
  pulso(v2.querySelector(".llamado"), d("cta", "acción"), 0.05);
  sale(nadie, b("dile").ini + 0.2);

  // ===================================================== 21-23 · no sabes qué funcionó → las métricas
  y = 10500;
  const cuales = tarjeta(`${titulo("Tus videos de la semana")}${fila("Receta de chocolate", "¿?", "#e11d48")}${fila("Tu cocina por dentro", "¿?", "#e11d48")}${fila("Pedido del sábado", "¿?", "#e11d48")}`, 720, y, 860, { nombre: "sin métricas" });
  entra(cuales, d("funciono", "videos") - 0.4, { de: "abajo" });
  cam.mostrar(d("funciono", "videos"), [cuales], { dur: 1.1 });
  alerta(cuales, d("funciono", "cuáles") - 0.2, b("funciono").fin + 0.2, { quieto: true });
  sale(p2.el, b("funciono").ini);
  y = 11250;
  const barras = [["Receta de chocolate", 72, "72% completo · 340 💾", true], ["Tu cocina por dentro", 38, "38% · 45 💾"], ["Pedido del sábado", 51, "51% · 120 💾"]];
  const metr = tarjeta(`${titulo("Lo que sí funcionó")}<div style="font:600 30px Inter;color:#64748b;margin-bottom:6px">Barra = visto completo · 💾 = guardados</div>
    ${barras.map(([t, pc, g, mejor]) => `<div style="padding:16px 0"><div style="display:flex;justify-content:space-between;font:700 31px Inter;color:#0f172a"><span>${t}${mejor ? " ⭐" : ""}</span><span style="color:#475569">${g}</span></div>
      <div style="margin-top:12px;height:30px;border-radius:15px;background:#eef2f7;overflow:hidden"><div class="barra" data-pc="${pc}" style="height:100%;width:0;border-radius:15px;background:${mejor ? "#0866ff" : "#94a3b8"}"></div></div></div>`).join("")}
    <div class="mas" style="opacity:0;margin-top:14px;padding:18px 22px;border-radius:18px;background:#dbeafe;color:#1d4ed8;font:800 34px Inter;text-align:center">Haz más recetas como esa 👆</div>`, 720, y, 860, { nombre: "métricas" });
  entra(metr, d("revisas", "semana") - 0.4, { de: "abajo" });
  cam.mostrar(d("revisas", "semana"), [metr], { dur: 1.0 });
  metr.querySelectorAll(".barra").forEach((br, i) => window.tl.fromTo(br, { width: "0%" }, { width: br.dataset.pc + "%", duration: 0.7, ease: "power2.out", immediateRender: false }, d("revisas", "completos") - 0.3 + i * 0.15));
  mostrar(metr.querySelector(".mas"), d("revisas", "más") - 0.3);
  pulso(metr, d("metricas", "métricas"), 0.03);
  sale(cuales, b("revisas").ini + 0.2);

  // ===================================================== 23 · llamado a la acción (igual al de los embudos)
  // 1) "aprender a hacer todo esto": las 7 piezas del video se apilan
  const sale2 = metr; sale(sale2, b("cta-final").ini + 0.1);
  const piezas = ["Gancho", "Estructura", "Subtítulos", "Calendario de contenido", "Pilares de contenido", "Llamado a la acción", "Métricas"];
  const colores = ["#2563eb", "#3b5bf0", "#4f52ee", "#6248ea", "#7340e2", "#8338d8", "#9333cc"];
  const capas = piezas.map((t, i) => {
    const w = 900 - i * 56, x = 1150 - w / 2, yy = 12600 + i * 112;
    const c = U.poner(`<div style="width:${w}px;height:96px;border-radius:26px;background:${colores[i]};color:#fff;display:flex;align-items:center;justify-content:center;font:800 38px Inter;box-shadow:0 14px 30px rgba(0,0,0,.3)">${t}</div>`, x, yy, { nombre: "capa " + t });
    entra(c, d("cta-final", "aprender") - 0.4 + i * 0.13, { de: "arriba", dur: 0.45 });
    return c;
  });
  const salida = U.poner(`<div style="width:330px;height:96px;border-radius:26px;background:#16a34a;color:#fff;display:flex;align-items:center;justify-content:center;font:900 40px Montserrat">Pedidos ✓</div>`, 985, 12600 + 7 * 112 + 20, { nombre: "pedidos" });
  entra(salida, d("cta-final", "aprender") + 0.8, { de: "pop" });
  cam.mostrar(d("cta-final", "aprender") + 0.1, [...capas, salida], { dur: 1.2 });
  // 2) "utilizando inteligencia artificial": las piezas laten y aparece la etiqueta
  capas.forEach((c, i) => pulso(c, d("cta-final", "inteligencia") - 0.1 + i * 0.06, 0.04));
  const ia = U.poner(`<div class="chip" style="font-size:44px;background:#6d28d9;color:#fff;box-shadow:0 14px 30px rgba(109,40,217,.35)">✨ con inteligencia artificial</div>`, 870, 12460, { nombre: "con IA" });
  entra(ia, d("cta-final", "inteligencia") - 0.1, { de: "pop" });
  // 3) "comenta la palabra: Contenido": el post del pastel con sus comentarios; se escribe, se publica y llega la guía por mensaje
  const p6 = p.celular(870, 13800, { nombre: "comenta Contenido" });
  const vistaCom = p.vista(p6, `<div class="cab"><div class="avatar deco"><div>DP</div></div><div><div class="nombre">dulce.pastel</div><div class="sub">Contenido con IA</div></div></div>
      ${img("pastel.jpg", 330, "background-position:center 45%")}
      <div style="padding:20px 26px 10px;font:800 36px Inter;color:#0f172a">Comentarios</div>
      <div style="padding:0 26px;display:flex;flex-direction:column;gap:16px;color:#0f172a">
        <div style="font:500 34px Inter"><b>ana.mx</b> Contenido 🙌</div>
        <div style="font:500 34px Inter"><b>luis.cafe</b> Contenido</div>
        <div style="font:500 34px Inter"><b>caro.shop</b> ¡Contenido!</div>
        <div style="font:500 34px Inter"><b>mario.mkt</b> Contenido 🔥</div>
        <div class="mio" style="font:500 34px Inter;opacity:0"><b>tú</b> Contenido <span class="corazon" style="color:#e11d48;opacity:0">♥</span></div>
      </div>
      <div class="dm-guia" style="position:absolute;left:20px;right:20px;bottom:24px;opacity:0;display:flex;gap:18px;align-items:center;padding:20px 22px;border-radius:28px;background:#f5f3ff;border:3px solid #ddd6fe">
        <div style="width:70px;height:70px;flex:none;border-radius:18px;background:linear-gradient(135deg,#ec4899,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font:900 34px Inter">✉</div>
        <div style="font:600 30px/1.25 Inter;color:#0f172a"><b>dulce.pastel</b> te mandó tu guía para crear contenido con IA 📩</div></div>
      <div class="barra-com" style="position:absolute;left:20px;right:20px;bottom:24px;height:92px;border-radius:46px;border:3px solid #cbd5e1;display:flex;align-items:center;padding:0 28px;gap:16px">
        <div class="caja-com" style="flex:1;font:800 38px Inter;color:#0f172a"></div><div class="publicar" style="font:800 32px Inter;color:#0866ff">Publicar</div></div>`);
  entra(p6.el, d("cta-final", "comenta") - 0.6, { de: "abajo" });
  cam.mostrar(d("cta-final", "comenta") - 0.1, [p6.el], { dur: 1.0 });
  const caja = vistaCom.querySelector(".caja-com"), mio = vistaCom.querySelector(".mio");
  escribir(caja, "Contenido", d("cta-final", "contenido") - 0.3, 0.6);
  const tPub = cursor.clic(d("cta-final", "contenido") + 0.5, vistaCom.querySelector(".publicar"), { dur: 0.5 });
  ocultar(caja, tPub + 0.15, 0.15); mostrar(mio, tPub + 0.2, 0.3);
  const cor = mio.querySelector(".corazon"); window.tl.fromTo(cor, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1.25, duration: 0.3, ease: "back.out(3)", immediateRender: false }, tPub + 0.8);
  cursor.fuera(tPub + 0.6);
  ocultar(vistaCom.querySelector(".barra-com"), tPub + 1.2, 0.2);
  const guia = vistaCom.querySelector(".dm-guia");
  window.tl.fromTo(guia, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.6)", immediateRender: false }, tPub + 1.35);
  pulso(guia, tPub + 2.3, 0.04);
}
