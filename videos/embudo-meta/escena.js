// "Cómo crear un embudo en Meta" · estilo PIZARRA (2D, se dibuja con plumón).
// Misma lógica que el tinaco: "ya tienes una campaña" → pero falta… → pieza nueva → nombre.
// La pizarra se llena de ARRIBA hacia ABAJO (como el embudo); al final se dibuja el embudo alrededor de todo
// y las ventas salen por el cuello.
//
// Acomodo (x, y):   gente arriba (y≈10.9) · "campaña" + anuncio al centro (y≈6.2) · objetivo a la izquierda
//                   landing al centro (y≈2.3) · Meta y remarketing a la izquierda · regalo y contador a la derecha
//                   registrados y WhatsApp abajo (y≈-1…-4) · la clase y el bono al fondo (y≈-5.6…-7) · ventas por el cuello
export default function construir(M, V) {
  const { aparecer, desaparecer, latir, alerta, flujo, teñir, camara, caja } = M;
  const { pz } = M.piezas;
  const b = (id) => V.beat(id);
  const d = (id, w) => V.dice(id, w);
  const dib = (obj, t, dur = 0.8) => aparecer(obj, t, { modo: "dibujar", dur });

  camara.ir(0, { pos: [0, 7, 60], mira: [0, 7, 0], zoom: 1.6 }, 0);

  // ============================================================ 0 · base: una foto + "promocionar" = una campaña
  const cel = pz.celular({ pos: [0, 6.2, 0], nombre: "anuncio" });
  pz.foto(cel.pantalla);
  const promo = pz.boton("Promocionar", { padre: cel.pantalla, pos: [0, -0.45, 0], ancho: 0.82 });
  dib(cel, d("base", "foto"), 0.9);
  latir(promo, d("base", "promocionar"), { k: 0.3 });
  const etCampana = pz.texto("campaña", { pos: [0, 7.65, 0], alto: 0.4, color: "#2f6fdc" });
  dib(etCampana, d("base", "campaña"), 0.5);
  camara.mostrar(d("base", "foto") + 0.4, [cel, etCampana], { dur: 0.8, instantes: [0, 0.5, 1.2, 2.5] });

  // ============================================================ 1-3 · a cualquiera (likes) → objetivo
  const gente = pz.multitud(10, { pos: [0, 10.9, 0], columnas: 5, semilla: 3 });
  const likes = gente.gente.filter((_, i) => i % 2 === 0).map((p) => pz.corazon({ padre: p, pos: [0, 1.05, 0], escala: 0.9 }));
  dib(gente, d("cualquiera", "cualquiera"), 0.9);
  likes.forEach((h, i) => aparecer(h, d("cualquiera", "likes") + i * 0.08, { modo: "pop" }));
  alerta(gente, d("cualquiera", "likes"), b("cualquiera").fin + 0.2);
  camara.mostrar(d("cualquiera", "cualquiera") + 0.3, [gente, cel, etCampana], { dur: 1.0 });
  const diana = pz.diana({ pos: [-2.2, 6.5, 0] });
  const etReg = pz.texto("registros", { pos: [-2.2, 5.55, 0], alto: 0.3 });
  dib(diana, d("elige", "dices"), 0.7); dib(etReg, d("elige", "registros"), 0.4);
  likes.forEach((h) => desaparecer(h, d("elige", "likes"), { dur: 0.3 }));
  camara.mostrar(d("elige", "dices") + 0.3, [diana, cel, etReg, etCampana], { dur: 0.9 });
  latir(diana, d("objetivo", "objetivo"), { k: 0.25 });

  // ============================================================ 4-6 · el clic lleva al perfil → landing
  // el perfil NO se parece a la landing: foto de perfil redonda y cuadrícula de publicaciones, sin botón
  const perfil = pz.pagina({ pos: [2.0, 4.1, 0], ancho: 1.5, alto: 1.8, nombre: "perfil" });
  const avatar = pz.persona({ escala: 0.42, color: "#ff9f1c" }); perfil.cuerpo.add(avatar); avatar.position.set(-0.4, 0.2, 0.01);
  pz.lineasTexto(perfil.cuerpo, { pos: [0.25, 0.42, 0], anchos: [0.6, 0.45] });
  for (let i = 0; i < 6; i++) caja(0.36, 0.3, 0.01, ["#bfe3f5", "#ffd9a8", "#cdeec2"][i % 3], { padre: perfil.cuerpo, pos: [-0.42 + (i % 3) * 0.42, -0.2 - Math.floor(i / 3) * 0.36, 0.01], base: false, tinta: false, nombre: "publicación" });
  const etPerfil = pz.texto("tu perfil", { pos: [2.0, 5.3, 0], alto: 0.28 });
  dib(perfil, d("perfil", "perfil"), 0.7); dib(etPerfil, d("perfil", "perfil") + 0.3, 0.4);
  const fPerfil = pz.flecha(M.puerto(cel, "der"), [1.5, 5.05, 0], { t0: d("perfil", "clic"), dur: 0.5, color: "#e8322b", t1: b("pagina").ini + 0.5 });
  alerta(perfil, d("perfil", "nadie"), b("perfil").fin + 0.2, { marca: true });
  [perfil, etPerfil].forEach((x) => desaparecer(x, b("pagina").ini + 0.4, { dur: 0.3 }));
  camara.mostrar(d("perfil", "perfil") + 0.4, [cel, perfil, etPerfil], { dur: 0.8 });

  // una sola promesa y un solo botón (el campo de WhatsApp y el regalo llegan después, cuando se explican)
  const landing = pz.pagina({ pos: [0, 2.3, 0], nombre: "landing" });
  pz.texto("Vende más", { padre: landing.cuerpo, pos: [0, 0.72, 0], alto: 0.36 });
  pz.texto("en 30 días", { padre: landing.cuerpo, pos: [0, 0.32, 0], alto: 0.26, color: "#6b7280" });
  const campo = pz.texto("tu WhatsApp", { padre: landing.cuerpo, pos: [0, -0.22, 0], alto: 0.22, color: "#9aa3ad", fondo: "#f2f3f5" });
  const boton = pz.boton("Quiero entrar", { padre: landing.cuerpo, pos: [0, -0.75, 0], ancho: 1.4, alto: 0.32, color: "#2fbf5b" });
  dib(landing, d("pagina", "pagina"), 0.9);
  latir(boton, d("pagina", "boton"), { k: 0.3 });
  pz.flecha(M.puerto(cel, "abajo"), M.puerto(landing, "arriba"), { t0: d("pagina", "pagina") + 0.5, dur: 0.5, curva: 0.01 });
  camara.mostrar(d("pagina", "pagina") + 0.4, [cel, landing], { dur: 0.9 });
  const etLanding = pz.texto("landing", { pos: [1.75, 3.55, 0], alto: 0.34, color: "#2f6fdc" });
  dib(etLanding, d("landing", "landing"), 0.4);
  latir(landing, d("landing", "landing"), { k: 0.08 });

  // ============================================================ 7-9 · Meta no ve quién se registra → píxel
  const meta = pz.meta({ pos: [-2.35, 3.9, 0] });
  dib(meta, d("ciego", "meta"), 0.6);
  const ciego = pz.texto("?", { pos: [-2.35, 4.75, 0], alto: 0.6, color: "#e8322b" });
  dib(ciego, d("ciego", "buscar"), 0.3); desaparecer(ciego, b("codigo").ini + 0.6, { dur: 0.2 });
  alerta(meta, d("ciego", "ve"), b("ciego").fin + 0.2, { marca: true });
  camara.mostrar(d("ciego", "meta") + 0.3, [meta, landing, ciego], { dur: 0.9 });
  const chip = pz.chip("</>", { padre: landing, pos: [0.85, -1.05, 0.08], ancho: 0.62, alto: 0.4 });
  dib(chip, d("codigo", "codigo"), 0.5);
  // el aviso sale DEL CÓDIGO (no del botón), pasa por debajo de la landing y llega a Meta
  const aviso = pz.flecha([0.85, 1.0, 0.1], [-2.35, 3.55, 0.1], { t0: d("codigo", "avisa"), dur: 0.6, color: "#0866ff", curva: 2.0, t1: b("desconocido").ini + 0.3 });
  flujo(() => aviso.curva.getPoints(16), { t0: d("codigo", "registra"), t1: b("desconocido").ini, color: "#0866ff", n: 5, vel: 0.7, radio: 0.08, libre: true });
  camara.mostrar(d("codigo", "avisa") + 0.4, [chip, meta, landing], { dur: 0.9 });
  // "Meta busca a más gente como esa": de Meta sale una flecha hacia arriba y la gente se vuelve del color del que se registró
  const busca = pz.flecha([-2.6, 4.3, 0.1], [-1.75, 10.3, 0.1], { t0: d("codigo", "busca"), dur: 0.7, color: "#0866ff", curva: 0.5, t1: b("desconocido").ini + 0.3 });
  gente.gente.forEach((p, i) => teñir(p.getObjectByName("cuerpo"), d("codigo", "gente") + i * 0.05, "#2fbf5b", 0.4));
  camara.mostrar(d("codigo", "busca") + 0.3, [gente, meta, busca], { dur: 0.9 });
  camara.mostrar(d("pixel", "pixel") - 0.2, [chip, landing, meta], { dur: 0.8 });
  latir(chip, d("pixel", "pixel"), { k: 0.4 });

  // ============================================================ 10-12 · nadie da su WhatsApp porque sí → lead magnet
  dib(campo, d("desconocido", "whatsapp") - 0.3, 0.4);
  alerta(campo, d("desconocido", "whatsapp"), b("desconocido").fin + 0.2, { marca: true });
  camara.mostrar(d("desconocido", "whatsapp") + 0.2, [landing], { dur: 0.8 });
  const regalo = pz.regalo({ pos: [2.05, 2.1, 0] });
  dib(regalo, d("regalo", "regalas"), 0.7);
  const etRegalo = pz.texto("clase gratis", { pos: [2.05, 1.25, 0], alto: 0.24 });
  dib(etRegalo, d("regalo", "clase"), 0.5);
  pz.flecha([1.55, 1.75, 0.1], [0.75, 1.45, 0.1], { t0: d("regalo", "cambio"), dur: 0.4, curva: 0.1 });
  camara.mostrar(d("regalo", "regalas") + 0.3, [landing, regalo, etRegalo, etLanding], { dur: 0.8 });
  latir(regalo, d("leadmagnet", "lead"), { k: 0.3 });

  // ============================================================ 13-15 · un solo anuncio se gasta → creativos
  const harta = pz.burbuja("¿otra vez?", { pos: [1.35, 8.85, 0], ancho: 1.7, color: "#9aa3ad" });
  dib(harta, d("cansa", "vez"), 0.4); desaparecer(harta, b("varios").ini + 0.3, { dur: 0.25 });
  alerta(cel, d("cansa", "deja"), b("cansa").fin + 0.2, { marca: true });
  camara.mostrar(d("cansa", "anuncio") + 0.3, [cel, gente, harta], { dur: 0.8 });
  // varios anuncios: un abanico detrás del primero (todos salen del mismo lugar y llevan a la misma landing)
  const cel2 = pz.celular({ pos: [-0.9, 6.3, -0.05], nombre: "anuncio 2" }), cel3 = pz.celular({ pos: [0.9, 6.3, -0.05], nombre: "anuncio 3" });
  cel2.rotation.z = 0.14; cel3.rotation.z = -0.14;
  const habla = pz.persona({ color: "#ff9f1c", escala: 0.75 }); cel2.pantalla.add(habla); habla.position.set(-0.15, -0.5, 0);
  pz.texto("¡idea!", { padre: cel3.pantalla, pos: [0.15, 0.3, 0], alto: 0.26, color: "#ff9f1c" });
  pz.boton("video", { padre: cel3.pantalla, pos: [0.15, -0.45, 0], ancho: 0.5, color: "#e8322b" });
  dib(cel2, d("varios", "persona"), 0.6); dib(cel3, d("varios", "idea"), 0.6);
  camara.mostrar(d("varios", "anuncios"), [cel, cel2, cel3, diana, etCampana], { dur: 0.8, instantes: [0, 0.6, 1.4] });
  [cel, cel2, cel3].forEach((c, i) => latir(c, d("creativos", "creativos") + i * 0.12, { k: 0.12 }));

  // ============================================================ 16 · ahora sí: registros
  const cuenta = pz.contador(0, 120, d("ahorasi", "registros"), b("ahorasi").fin + 0.3, { pos: [2.3, -0.2, 0], titulo: "registros", color: "#2fbf5b" });
  dib(cuenta, b("ahorasi").ini, 0.4);
  flujo([[0.6, 1.25, 0.2], [1.5, 0.75, 0.2], [2.1, 0.25, 0.2]], { t0: b("ahorasi").ini, t1: b("olvidan").ini + 0.4, color: "#2fbf5b", n: 6, vel: 0.6, radio: 0.08, libre: true });
  camara.mostrar(b("ahorasi").ini + 0.4, [landing, cuenta, cel], { dur: 0.8 });

  // ============================================================ 17-19 · se olvidan → seguimiento por WhatsApp
  const lista = pz.multitud(6, { pos: [0, -1.1, 0], columnas: 6, color: "#2fbf5b", sep: 0.58, escala: 0.6, nombre: "registrados" });
  pz.flecha(M.puerto(landing, "abajo"), [0, -0.3, 0], { t0: d("olvidan", "registrados") - 0.2, dur: 0.4, curva: 0.01 });
  dib(lista, d("olvidan", "registrados"), 0.6);
  lista.gente.filter((_, i) => i % 2 === 1).forEach((p) => teñir(p.getObjectByName("cuerpo"), d("olvidan", "acuerda"), "#c9ccd1", 0.5));
  alerta(lista, d("olvidan", "acuerda"), b("olvidan").fin + 0.2);
  camara.mostrar(d("olvidan", "registrados") + 0.3, [lista, landing, cuenta], { dur: 0.8 });
  const msj = pz.burbuja("¡Hola! Te espero", { pos: [-0.3, -2.6, 0], ancho: 2.4 });
  const r5 = pz.reloj({ pos: [1.6, -2.6, 0], texto: "5 min" });
  const r1 = pz.burbuja("Mañana es la clase", { pos: [-0.3, -3.55, 0], ancho: 2.4, color: "#2fbf5b" });
  const r1d = pz.reloj({ pos: [1.6, -3.85, 0], texto: "1 día antes" });
  pz.flecha([-1.1, -2.25, 0.1], [-1.1, -1.25, 0.1], { t0: d("whatsapp", "whatsapp") + 0.2, dur: 0.35, curva: 0.01, color: "#25d366" });
  dib(msj, d("whatsapp", "whatsapp"), 0.6); dib(r5, d("whatsapp", "cinco"), 0.5); dib(r1, d("whatsapp", "recuerdas"), 0.6); dib(r1d, d("whatsapp", "antes"), 0.5);
  lista.gente.filter((_, i) => i % 2 === 1).forEach((p) => teñir(p.getObjectByName("cuerpo"), d("whatsapp", "recuerdas") + 0.3, "#2fbf5b", 0.5));
  camara.mostrar(d("whatsapp", "whatsapp") + 0.3, [msj, r5, r1, r1d, lista], { dur: 0.8 });
  latir(msj, d("seguimiento", "seguimiento"), { k: 0.15 });

  // ============================================================ 20-22 · se van sin registrarse → remarketing
  flujo([[-1.0, 3.0, 0.2], [-1.9, 3.05, 0.2], [-3.5, 2.95, 0.2]], { t0: d("sevan", "entran"), t1: b("remarketing").fin, color: "#e8322b", n: 6, vel: 0.5, radio: 0.08, libre: true });
  camara.mostrar(d("sevan", "entran") + 0.3, [landing, meta, cel], { dur: 0.8 });
  const cel4 = pz.celular({ pos: [-2.35, 1.2, -0.05], nombre: "anuncio de remarketing" });
  pz.texto("¿Se te", { padre: cel4.pantalla, pos: [0, 0.3, 0], alto: 0.2 }); pz.texto("olvidó?", { padre: cel4.pantalla, pos: [0, 0.02, 0], alto: 0.2 });
  dib(cel4, d("otravez", "anuncio"), 0.7);
  // Meta se lo enseña SOLO a quien ya visitó (azul, de Meta al anuncio); el anuncio los regresa a la landing (morado)
  pz.flecha([-2.35, 3.55, 0.1], [-2.35, 2.3, 0.1], { t0: d("otravez", "solo"), dur: 0.4, curva: 0.01, color: "#0866ff" });
  pz.flecha([-1.75, 1.0, 0.1], [-1.2, 1.7, 0.1], { t0: d("otravez", "visito"), dur: 0.45, color: "#7b5cff", curva: -0.2 });
  camara.mostrar(d("otravez", "anuncio") + 0.3, [cel4, landing, meta], { dur: 0.8 });
  latir(cel4, d("remarketing", "remarketing"), { k: 0.15 });

  // ============================================================ 23-25 · nadie compra sin razón para hoy → oferta
  const clase = pz.laptop({ pos: [0, -6.4, 0], nombre: "la clase" });
  const profe = pz.persona({ color: "#7b5cff", escala: 0.9 }); clase.pantalla.add(profe); profe.position.set(0, -0.45, 0.01);
  const ventas0 = pz.texto("0 ventas", { pos: [0, -10.55, 0], alto: 0.36, color: "#e8322b" });
  dib(clase, d("nocompran", "clase"), 0.8); dib(ventas0, d("nocompran", "nadie"), 0.4);
  alerta(clase, d("nocompran", "nadie"), b("nocompran").fin + 0.2, { marca: true });
  camara.mostrar(d("nocompran", "clase") + 0.3, [clase, ventas0], { dur: 0.9, instantes: [0, 0.6, 1.4] });
  const bono = pz.boleto("BONO", { pos: [0.95, -7.85, 0] });
  const hoy = pz.texto("¡solo hoy!", { pos: [-1.0, -7.85, 0], alto: 0.34, color: "#e8322b" });
  const ventas = pz.contador(0, 23, d("bono", "noche") + 0.3, b("oferta").fin, { pos: [0, -10.7, 0], titulo: "ventas", color: "#2fbf5b" });
  desaparecer(ventas0, d("bono", "bono"), { dur: 0.25 });
  dib(bono, d("bono", "bono"), 0.6); dib(hoy, d("bono", "noche"), 0.4); dib(ventas, d("bono", "bono") + 0.25, 0.4);
  camara.mostrar(d("bono", "bono") + 0.3, [clase, bono, hoy, ventas], { dur: 0.8 });
  latir(bono, d("oferta", "oferta"), { k: 0.2 });

  // ============================================================ 26 · tip: muchos clics, pocos registros → la página
  // (es un ejemplo aparte: va con su letrero para que no choque con los 120 registros de arriba)
  const ej = pz.texto("por ejemplo:", { pos: [2.35, 7.35, 0.3], alto: 0.24, color: "#6b7280" });
  const clics = pz.contador(40, 900, d("tip", "clics"), d("tip", "registros"), { pos: [2.35, 6.35, 0.3], titulo: "clics", color: "#2f6fdc" });
  const regs = pz.contador(0, 9, d("tip", "registros"), d("tip", "presupuesto"), { pos: [2.35, 4.45, 0.3], titulo: "registros", color: "#e8322b", pasos: 3 });
  const moneda = pz.moneda({ pos: [2.35, 5.5, 0.3] }), noMas = pz.tache({ pos: [2.35, 5.5, 0.35], largo: 0.6 });
  const tipCamT = Math.max(d("tip", "anuncio") + 0.3, b("tip").ini + 1.0);   // no se va mientras se dice "Esa es la oferta"
  dib(ej, tipCamT - 0.1, 0.3); dib(clics, Math.max(d("tip", "anuncio"), tipCamT), 0.4); dib(regs, d("tip", "registros") - 0.2, 0.4);
  dib(moneda, d("tip", "presupuesto"), 0.3); dib(noMas, d("tip", "presupuesto") + 0.25, 0.3);
  alerta(landing, d("tip", "pagina") - 0.4, b("tip").fin + 0.3, { marca: true });
  camara.mostrar(tipCamT, [cel, landing, ej, clics, regs, moneda], { dur: 1.0 });
  [ej, clics, regs, moneda, noMas].forEach((x) => desaparecer(x, b("cierre").ini, { dur: 0.3 }));

  // ============================================================ 27 · cierre: la campaña ya es un embudo (y por el cuello salen las ventas)
  const dentro = [gente, etCampana, cel, cel2, cel3, diana, etReg, landing, etLanding, meta, regalo, etRegalo, cuenta, cel4, lista, msj, r5, r1, r1d, clase, bono, hoy];
  const embudo = pz.embudo({ envolver: dentro, cuello: 1.25, t0: d("cierre", "embudo") - 0.6, dur: 1.4 });
  camara.mostrar(d("cierre", "campaña"), [...dentro, ventas], { dur: 1.6, holgura: 1.1 });
}
