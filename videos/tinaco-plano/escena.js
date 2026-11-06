// "El tinaco de tu casa" · VERSIÓN 2D (estilo plano, vista lateral en corte). Misma historia y piezas que videos/tinaco;
// cambia la DISTRIBUCIÓN para leerse de lado: la calle en corte a la derecha y la cisterna bajo el patio, en el corte del frente.
//   · piezas prefabricadas (M.piezas) con puertos con nombre
//   · sobre()/recargar(): lo que va encima se monta; lo inclinado se recarga · conectar(): tubos con codos automáticos
//   · la red va EN ORDEN: calle → medidor → (cisterna → bomba) → tinaco → regaderas
//   · camara.mostrar(): la cámara encuadra sola · nada se mueve sin agente (persona) o causa
// (La versión hecha con coordenadas a mano quedó en escena-a-mano.js para comparar.)
export default function construir(M, V) {
  const { sobre, conectar, montar, fraccionEn, puerto, punto, aparecer, desaparecer, latir, sacudir, alerta, teñir, flujo, pista, cadaCuadro, camara, cilindro, caja } = M;
  const { terreno, cisterna, casa, tinaco, jarroDeAire, medidor, bomba, filtro, base, cota, arbol, nube, escalera, persona } = M.piezas;
  const b = (id) => V.beat(id);
  const d = (id, w) => V.dice(id, w);

  // ============================================================ mundo (la cisterna va en el patio, a la izquierda)
  const T = terreno({ calle: "derecha", huecos: [{ cara: "frente", x0: -10, x1: -7, y0: -2.7, y1: -1.15 }] });
  [[-5.5, 0, -6], [6.2, 0, -5]].forEach((pos) => arbol({ pos }));   // el sol y las nubes planas los pone el estilo
  const general = T.tuberiaGeneral(d("calle", "tubo") - 0.2, { enterrada: true, revisar: false });   // bajo la calle: en rayos X

  const C = casa({ pisos: 1 }).armar(0, { total: 0.45 });   // la casa (con su losa) ya está antes de que caiga el tinaco
  const p1 = C.pisos[0];
  const bse = sobre(base({ alto: 2 }), C, { en: [1.6, -0.8] });      // invisible hasta que crece; el tinaco va encima
  const tin = sobre(tinaco(), bse);
  aparecer(tin, Math.max(d("base", "tambo"), 1.0), { modo: "caer", alto: 4 });
  tin.nivel([
    [0, 0.001], [d("base", "llenas"), 0.001], [b("base").fin, 0.85], [b("gravedad").fin, 0.15],   // la regadera la vacía…
    [b("cubetas").fin, 0.2], [b("calle").fin, 0.9], [d("derrame", "derrama"), 1.0],                // …a cubetazos apenas sube; con la toma, sí
    [d("bola", "cierra"), 1.0], [d("bola", "cierra") + 1.0, 0.95], [b("sinfuerza").ini, 0.95],     // el flotador cierra: deja de derramarse
    [b("sinfuerza").fin, 0.28], [b("bomba").fin, 0.9],
    [V.dur, 0.9],
  ]);

  // ============================================================ 0 · base · 1 · gravedad
  camara.ir(0, { pos: [0, 3, 60], mira: [0, 3, 0], zoom: 0.75 }, 0);   // toma de apertura (de lado)
  camara.mostrar(b("base").fin - 0.3, [tin, C.azotea], { dur: 3.2 });
  const bajada = conectar(puerto(tin, "salida"), puerto(p1.regadera, "entrada"), { nombre: "bajada a la regadera", radio: 0.06, t0: b("gravedad").ini - 0.3, dur: 1.0 });
  camara.mostrar(d("gravedad", "baja"), [tin], { dur: 1.4 });                                   // el agua sale del tinaco…
  camara.mostrar(d("gravedad", "regadera"), [p1.bano, p1.regadera], { dur: 1.2, azimut: 30 });
  flujo(bajada, { color: "agua", n: 9, vel: 0.5, radio: 0.05 });     // espera sola a que el tubo esté puesto
  const chorro1 = p1.regadera.chorro(d("gravedad", "regadera"), V.dur, "fuerte");

  // ============================================================ 2 · cubetas (una persona sube por la escalera recargada)
  const tc = b("cubetas");
  const esc = M.recargar(M.colocar(escalera(), { pos: T.suelo(4.35, 0.6), nombre: "escalera" }), p1.muros.derecho);
  const quien = M.colocar(persona({ color: "azul" }), { pos: T.suelo(4.6, 0.6), rot: [0, -90, 0] });
  const cub = M.piezas.cubeta(); quien.mano.add(cub); cub.position.set(0, -0.36, 0); cub.userData.flota = false;
  quien.subirPor(esc, tc.ini + 0.3, tc.fin + 0.4, 1);
  aparecer(esc, tc.ini - 0.2, { modo: "crecer" }); desaparecer(esc, b("calle").ini + 0.6);
  aparecer(quien, tc.ini + 0.2, { modo: "pop" }); desaparecer(quien, b("calle").ini + 0.5);
  alerta(cub, tc.ini + 0.3, tc.fin + 0.3);
  camara.mostrar(tc.ini + 0.3, [esc, quien, tin], { dur: 1.3 });

  // ============================================================ 3 · tubo de la calle · 4 · toma
  const med = sobre(medidor(), T.banqueta, { en: [0, 9.2] });   // en la banqueta, junto a la calle
  aparecer(med, d("calle", "conectas"), { modo: "caer" });
  conectar(T.enTuberia(9.5), puerto(med, "entrada"), { nombre: "toma enterrada", orden: "xyz", t0: d("calle", "tubo") + 0.4, dur: 0.6, revisar: false, enterrada: true });
  const subidaCalle = conectar(puerto(med, "salida"), puerto(tin, "entrada"), {
    nombre: "tubo de la calle a la azotea", via: [puerto(C, "esquinaDerecha"), puerto(C.azotea, "esquinaDerecha"), M.punto(C.azotea, [1.6, 0.4, 1.0])],   // pegado a la losa y sube junto al tinaco
    t0: d("calle", "conectas") + 0.4, dur: 1.8, t1: b("bomba").ini + 0.2 });
  flujo(subidaCalle, { t1: d("bola", "cierra"), color: "agua", n: 22, vel: 0.28, radio: 0.06, llenado: 0.9 });
  camara.mostrar(d("calle", "conectas") + 0.4, [med, general], { dur: 1.2 });   // de cerca: el medidor junto a la calle
  camara.mostrar(d("calle", "sube") + 0.2, [subidaCalle, tin], { dur: 1.0 });
  camara.mostrar(d("toma", "toma"), [med], { dur: 0.8 });
  latir(med, d("toma", "toma"), { k: 0.25 });

  // ============================================================ 5 · derrame · 6-7 · flotador
  const charco = sobre(cilindro(1, 1, 0.02, "agua", { tinta: false, capa: true, lados: 40, nombre: "charco" }), C, { en: [1.9, -0.4] });
  aparecer(charco, d("derrame", "derrama"), { modo: "crecer", dur: 2.2 }); desaparecer(charco, b("bola").ini, { dur: 3.5 });   // escurre despacio
  const borde = (x) => [punto(tin, [x, 1.7, 0]), punto(tin, [x * 1.25, 1.1, 0.1]), punto(tin, [x * 1.35, 0.05, 0.2])];
  flujo(borde(0.76), { t0: d("derrame", "derrama"), t1: b("bola").ini + 0.2, color: "agua", n: 10, vel: 1.1, radio: 0.06, halo: false, libre: true });
  flujo(borde(-0.76), { t0: d("derrame", "derrama") + 0.2, t1: b("bola").ini + 0.2, color: "agua", n: 10, vel: 1.1, radio: 0.06, halo: false, libre: true });
  alerta(tin, d("derrame", "derrama"), b("derrame").fin + 0.3);
  camara.mostrar(d("derrame", "derrama"), [tin, charco], { dur: 1.6 });
  const bola = tin.flotador(d("bola", "bola") - 0.2);
  camara.mostrar(d("bola", "bola"), [tin], { dur: 1.3, holgura: 0.95 });
  latir(tin.valvula, d("bola", "cierra"), { k: 0.6 });
  latir(bola, d("flotador", "flotador"), { k: 0.5 });

  // ============================================================ 8 · sin fuerza (tarde)
  const ts = b("sinfuerza");
  pista(M.sol.color, "b", [[ts.ini, 1], [ts.ini + 1.2, 0.5], [b("cisterna").fin, 0.5], [b("lodo").ini + 0.8, 1]]);
  pista(M.sol.color, "g", [[ts.ini, 1], [ts.ini + 1.2, 0.78], [b("cisterna").fin, 0.78], [b("lodo").ini + 0.8, 1]]);
  flujo(subidaCalle, { t0: d("sinfuerza", "fuerza"), t1: b("bomba").ini + 0.2, tramo: [0, 0.35], color: "agua", n: 5, vel: 0.12, radio: 0.06 });   // ya no alcanza a subir
  alerta(subidaCalle, d("sinfuerza", "fuerza"), ts.fin + 0.2, { marca: true });
  camara.mostrar(ts.ini + 0.4, [subidaCalle, tin], { dur: 1.6 });

  // ============================================================ 9-10 · cisterna (en el patio) y bomba
  const hueco = T.excavar(0, d("bomba", "entierras"));
  const cis = cisterna(hueco, d("bomba", "deposito"));
  cis.nivel([[0, 0.001], [d("bomba", "llena"), 0.001], [b("cisterna").fin, 1], [V.dur, 1]]);   // se llena despacio
  camara.mostrar(d("bomba", "entierras"), [hueco.tapon, cis], { dur: 1.0, azimut: -80, elevacion: 14 });
  // el medidor ahora llena la cisterna (por abajo de la tierra); la subida directa a la azotea se quita
  // enterrado por el frente del patio (entre la casa y la banqueta), lejos de la bomba: se distingue de la succión
  const aCisterna = conectar(puerto(med, "salida"), puerto(cis, "entrada"), { nombre: "del medidor a la cisterna", orden: "yxz", via: [[9.1, -1.0, 9.5], [-7.4, -1.0, 9.5]], t0: d("bomba", "llena") - 0.8, dur: 0.8, enterrada: true });
  flujo(aCisterna, { color: "agua", n: 10, vel: 0.35, radio: 0.06 });
  flujo(() => { const a = puerto(cis, "entrada")(); return [a, a.clone().setY(-2.3)]; }, { t0: d("bomba", "llena"), color: "agua", n: 6, vel: 0.6, radio: 0.06, halo: false, libre: true });   // cae al agua
  const tapa = puerto(cis, "tapa")();
  const losaBomba = caja(1.3, 0.12, 1.0, "concreto", { pos: [tapa.x, 0.15, tapa.z], nombre: "base de la bomba", estructura: true });   // encima de la franja de pasto (de lado se vería tapada)
  const bmb = sobre(bomba(), losaBomba);
  aparecer(losaBomba, d("bomba", "bomba") - 0.4, { modo: "crecer" });
  aparecer(bmb, d("bomba", "bomba") - 0.2, { modo: "caer" });
  conectar(puerto(cis, "succion"), puerto(bmb, "succion"), { nombre: "succión de la bomba", orden: "yxz", t0: d("bomba", "bomba"), dur: 0.5, revisar: false, enterrada: true });
  const subidaBomba = conectar(puerto(bmb, "salida"), puerto(tin, "entrada"), {
    nombre: "tubo de la bomba al tinaco", via: [puerto(C, "esquinaIzquierda"), puerto(C.azotea, "esquinaIzquierda"), M.punto(C.azotea, [1.6, 0.4, 1.0])],
    t0: d("bomba", "sube") - 0.1, dur: 1.6 });
  flujo(subidaBomba, { color: "agua", n: 24, vel: 0.3, radio: 0.06, llenado: 0.9 });
  camara.mostrar(d("bomba", "bomba") + 0.2, [bmb, cis], { dur: 1.0, azimut: -60, elevacion: 18 });
  camara.mostrar(d("bomba", "sube") + 0.5, [bmb, C, tin], { dur: 1.2, azimut: -20 });
  camara.mostrar(d("cisterna", "cisterna"), [cis, bmb], { dur: 1.2, azimut: -75, elevacion: 14 });
  latir(cis, d("cisterna", "cisterna"), { k: 0.05 });

  // ============================================================ 11-13 · lodo y filtro (el filtro solo limpia lo que ENTRA)
  const lodoT0 = d("lodo", "tierra"), tCart = d("cartucho", "cartucho"), tAtrapa = d("cartucho", "atrapa");
  teñir(tin.agua, lodoT0, "#8a6440", 1.0); teñir(tin.agua, tAtrapa + 0.5, "agua", 7.0);   // se aclara DESPACIO: sale la sucia por la bajada y entra limpia por el filtro
  const fil = montar(filtro(), subidaBomba, { desdeFin: 2.9 });   // en línea, en el tramo que sube junto al tinaco
  const enFiltro = () => fraccionEn(subidaBomba, fil);
  flujo(subidaBomba, { t0: lodoT0, t1: tCart + 0.4, color: "#7a4f2a", n: 14, vel: 0.3, radio: 0.075, halo: false });               // tierra por todo el tubo
  flujo(subidaBomba, { t0: tCart + 0.4, tramo: () => [0, enFiltro()], color: "#7a4f2a", n: 10, vel: 0.3, radio: 0.075, halo: false }); // la tierra llega hasta el filtro…
  teñir(fil.getObjectByName("cartucho"), tAtrapa, "#7a4f2a", 2.0);                                                                    // …y se queda en el cartucho
  p1.regadera.chorro(d("lodo", "escupir"), tAtrapa + 3.0, "lodo");
  cadaCuadro((t) => { if (t >= d("lodo", "escupir") && t < tAtrapa + 3.0) chorro1.visible = false; });
  alerta(p1.regadera, d("lodo", "escupir"), b("lodo").fin + 0.3);
  camara.mostrar(d("lodo", "escupir"), [p1.bano, p1.regadera], { dur: 1.4, azimut: 30 });
  aparecer(fil, tCart, { modo: "caer", alto: 1.5 });
  camara.mostrar(tCart + 0.3, [fil, tin], { dur: 1.4 });
  latir(fil, d("filtro", "filtro"), { k: 0.25 });

  // ============================================================ 14 · ahora sí
  camara.mostrar(b("ahorasi").ini + 0.8, [C, tin, med, bmb], { dur: 2.2 });

  // ============================================================ 15 · segundo piso (la azotea sube con todo encima)
  const p2 = C.agregarPiso(d("segundo", "segundo") - 0.4);
  const tArriba = d("segundo", "arriba");
  aparecer(p2.regadera, tArriba - 0.2, { modo: "pop" });
  const tee = () => { const s = puerto(tin, "salida", 0.3)(), e = puerto(p2.regadera, "entrada")(); return new M.THREE.Vector3(s.x, e.y + 0.3, s.z); };
  const ramal = conectar(tee, puerto(p2.regadera, "entrada"), { nombre: "ramal de arriba", radio: 0.06, t0: tArriba - 0.4, dur: 0.5 });
  flujo(ramal, { color: "agua", n: 5, vel: 0.5, radio: 0.05 });
  const tSube = d("subirlo", "base") + 0.6;
  p2.regadera.chorro(tArriba + 0.2, tSube + 0.4, "debil");
  alerta(p2.regadera, d("segundo", "chorrito"), b("segundo").fin + 0.4);
  camara.mostrar(d("segundo", "segundo") + 0.6, [C, tin], { dur: 1.5 });
  camara.mostrar(tArriba + 0.1, [p2.bano, p2.regadera], { dur: 1.2, azimut: 30 });

  // ============================================================ 16 · qué tan alto · 17-18 · base de dos metros
  const ct = cota(puerto(p2.regadera, "entrada"), puerto(tin, "fondo"), { desfase: [2.8, 0, 0], nombre: "altura del tinaco sobre la regadera", abajo: "regadera", arriba: "tinaco" });
  aparecer(ct, d("altura", "alto"), { modo: "desplegar" });
  desaparecer(ct, d("subirlo", "base") - 0.3, { dur: 0.25 });
  camara.mostrar(d("altura", "alto") + 0.4, [ct, tin], { dur: 1.6 });   // la cota ya trae líneas de referencia hacia la regadera
  bse.crecer(d("subirlo", "base") - 0.2);
  const ctBase = cota(punto(C.azotea, [1.6, 0, -0.8]), puerto(tin, "fondo"), { desfase: [1.15, 0, 0], nombre: "altura de la base", abajo: "azotea", arriba: "tinaco" });   // "dos metros" = la base
  aparecer(ctBase, d("subirlo", "dos") + 0.1, { modo: "desplegar" });
  desaparecer(ctBase, d("subirlo", "cada"), { dur: 0.25 });
  const ct3 = cota(puerto(p2.regadera, "entrada"), puerto(tin, "fondo"), { desfase: [2.8, 0, 0], nombre: "altura nueva del tinaco", abajo: "regadera", arriba: "tinaco" });  // y ahora son tres
  aparecer(ct3, d("subirlo", "cada") + 0.35, { modo: "desplegar" });   // cuando la cámara ya llegó
  desaparecer(ct3, b("aire").ini, { dur: 0.3 });                       // las cotas se van cuando ya explicaron
  const chorro2 = p2.regadera.chorro(tSube + 0.4, V.dur, "fuerte");
  camara.mostrar(d("subirlo", "dos"), [bse, tin, ctBase], { dur: 1.6 });
  camara.mostrar(d("subirlo", "cada") + 0.3, [ct3, tin], { dur: 1.2 });                    // tres metros…
  latir(bse, d("base2", "base"), { k: 0.1 });

  // ============================================================ 19 · aire en el tubo
  const ta = b("aire"), tEscape = d("tubo", "escape");
  flujo(bajada, { t0: d("aire", "aire"), t1: tEscape, color: "#ffffff", n: 5, vel: 0.45, radio: 0.11, halo: false });
  cadaCuadro((t) => { if (t >= d("aire", "escupe") && t < tEscape) chorro2.visible = Math.sin(t * 9) > 0.2; });   // escupe a golpes mientras hay aire
  sacudir(p2.regadera, d("aire", "escupe"), { dur: ta.fin - d("aire", "escupe") + 0.3, amp: 0.05, frec: 22 });
  alerta(p2.regadera, d("aire", "escupe"), ta.fin + 0.3);
  camara.mostrar(ta.ini + 0.4, [p2.bano, p2.regadera], { dur: 1.3, azimut: 30 });

  // ============================================================ 20-22 · jarro de aire (anclado: sube con el tinaco)
  const jarro = jarroDeAire(tin, { t0: d("tubo", "tubo") - 0.1, dur: 1.4 });
  const tapado0 = d("tip", "tapado") - 0.5, tapado1 = b("tip").fin - 0.3;
  flujo(jarro, { t0: tEscape, t1: tapado0, color: "#ffffff", n: 6, vel: 0.5, radio: 0.05, halo: false });
  flujo(jarro, { t0: tapado1 + 0.3, color: "#ffffff", n: 6, vel: 0.5, radio: 0.05, halo: false });
  const trapo = jarro.tapar(tapado0, tapado1);
  camara.mostrar(d("tubo", "tubo") + 1.0, [jarro, tin], { dur: 1.6, azimut: -45 });   // el jarro está del lado de la salida
  latir(jarro, d("jarro", "jarro"), { k: 0.12 });
  camara.mostrar(d("tip", "jarro"), [jarro, trapo], { dur: 1.4, azimut: -45 });

  // ============================================================ 23 · cierre
  camara.mostrar(b("cierre").ini + 1.6, [C, tin, med, bmb, cis], { dur: 2.6, holgura: 1.1 });
}
