// Coreografía de "El tinaco de tu casa" (estilo toon). Reglas: guias/ESCENAS.md
// Un solo mundo: casa en corte (sin muro de enfrente) sobre un terreno cortado que deja ver la cisterna.
// Toda tubería que toca al tinaco está ANCLADA a él (punto(tin, …)): cuando el tinaco sube, los tubos lo siguen.
export default function construir(M, V) {
  const { caja, cilindro, esfera, tornear, plano, extruir, tuberiaViva, punto, grupo, letrero, luz,
          aparecer, desaparecer, ensamblar, mover, latir, sacudir, alerta, teñir, flujo, lluvia, pista, efecto, cadaCuadro, camara } = M;
  const b = (id) => V.beat(id);
  const d = (id, w, r) => V.dice(id, w, r);
  const PVC = "#eef2f5";

  // ============================================================ terreno de una pieza (con hueco para la cisterna)
  // Cisterna: x −8…−5 · y −2.7…−1.15 · z 6.5…9 (el hueco atraviesa la franja del frente)
  caja(26, 3, 16.5, "tierra", { pos: [0, -3, -1.75], nombre: "terreno" });                          // z −10 … 6.5
  extruir([[-13, -3], [13, -3], [13, 0], [-13, 0]], 2.5, "tierra", { pos: [0, 0, 7.75], nombre: "corte del frente",
    hoyos: [[[-8, -2.7], [-8, -1.15], [-5, -1.15], [-5, -2.7]]] });
  const tapon = caja(3, 1.55, 2.5, "tierra", { pos: [-6.5, -2.7, 7.75], nombre: "tierra de la cisterna" });
  plano(25.96, 14.38, "pasto", { pos: [0, 0.01, -2.8], manchas: true, nombre: "pasto" });          // z −9.99 … 4.39
  caja(25.96, 0.06, 3.18, "#62666e", { pos: [0, 0, 7.39], tinta: false, nombre: "calle" });        // z 5.8 … 8.98
  caja(25.96, 0.18, 1.4, "concreto", { pos: [0, 0, 5.1], nombre: "banqueta" });                    // z 4.4 … 5.8
  for (let x = -12; x <= 12; x += 3) caja(1.4, 0.05, 0.16, "blanco", { pos: [x, 0.06, 7.4], tinta: false, capa: true, nombre: "raya" });
  [[-9, -6], [9.5, -5], [-10, 2]].forEach(([x, z], i) => {
    const a = grupo({ pos: [x, 0, z], nombre: "árbol" });
    cilindro(0.18, 0.24, 1.6, "madera", { padre: a });
    esfera(1.2 + i * 0.15, "verde", { padre: a, pos: [0, 2.3, 0] });
    esfera(0.85, "verde", { padre: a, pos: [0.7, 1.9, 0.3] });
  });
  [[-12, 15, -26], [8, 17, -30], [20, 13, -22]].forEach(([x, y, z]) => {
    const n = grupo({ pos: [x, y, z], flota: true, nombre: "nube" });
    [[0, 0, 0, 2], [1.9, -0.3, 0, 1.5], [-1.8, -0.4, 0, 1.4], [0.6, 0.9, 0, 1.3]].forEach(([a, bb, c, r]) => esfera(r, "blanco", { padre: n, pos: [a, bb, c], sombra: false, flota: true }));
  });
  tuberiaViva([[-12.9, -0.6, 9.0], [12.9, -0.6, 9.0]], 0.16, "acero", { nombre: "tubería de la calle", t0: d("calle", "tubo") - 0.2, dur: 1.0 });

  // ============================================================ casa en corte (sin caras empalmadas)
  const casa = grupo({ nombre: "casa" });
  caja(7, 0.15, 6, "concreto", { pos: [0, 0, 0], padre: casa, nombre: "piso" });                       // y 0 … 0.15
  caja(6.7, 2.85, 0.15, "muro", { pos: [0, 0.15, -2.925], padre: casa, nombre: "muro de atrás" });     // entre los laterales
  caja(0.15, 2.85, 6, "muro", { pos: [-3.425, 0.15, 0], padre: casa, nombre: "muro izquierdo" });
  caja(0.15, 2.85, 6, "muro", { pos: [3.425, 0.15, 0], padre: casa, nombre: "muro derecho" });
  caja(2.2, 2.3, 0.02, "#bfe6f2", { pos: [1.3, 0.3, -2.84], padre: casa, capa: true, tinta: false, nombre: "azulejo", revisar: false });
  caja(0.04, 1, 1.2, "#bfe3f5", { pos: [-3.52, 1.2, 0.6], padre: casa, capa: true, nombre: "ventana", revisar: false });
  caja(7.3, 0.25, 6.3, "concreto", { pos: [0, 3, 0], padre: casa, nombre: "loza" });   // la loza al final: tapa lo de adentro
  ensamblar(casa, 0, { total: 0.9, alto: 2.5 });
  luz([1.2, 2.3, 0.5]); luz([1.2, 5.6, 0.5]);
  const regadera1 = grupo({ pos: [1.2, 2.25, -2.6], nombre: "regadera" });
  cilindro(0.16, 0.05, 0.12, "metal", { padre: regadera1, base: false });
  aparecer(regadera1, d("gravedad", "regadera") - 0.4, { modo: "pop" });

  // ============================================================ tinaco (translúcido; el agua adentro es opaca)
  const tin = grupo({ pos: [1.6, 3.25, -0.8], nombre: "tinaco" });
  tornear([[0, 0], [0.72, 0], [0.76, 0.06], [0.76, 1.32], [0.6, 1.58], [0.26, 1.72], [0, 1.75]], "#2b2e35", { padre: tin, vidrio: true, opacidad: 0.4, casco: false, nombre: "tinaco" });
  const agua = cilindro(0.7, 0.7, 1.3, "agua", { padre: tin, pos: [0, 0.04, 0], tinta: false, nombre: "agua del tinaco" });
  cilindro(0.08, 0.08, 0.12, PVC, { padre: tin, pos: [-0.8, 0.2, 0], rot: [0, 0, 90], base: false, nombre: "salida del tinaco" });
  agua.scale.y = 0.001;
  aparecer(tin, d("base", "tambo"), { modo: "caer", alto: 4 });
  pista(agua, "scale.y", [
    [0, 0.001], [d("base", "llenas"), 0.001], [b("base").fin, 0.85], [b("gravedad").fin, 0.62],
    [b("cubetas").fin - 0.4, 0.12], [b("calle").fin, 0.9], [d("derrame", "derrama"), 1.0],
    [d("bola", "cierra"), 1.0], [b("bola").fin, 0.93], [b("sinfuerza").ini, 0.93], [b("sinfuerza").fin, 0.28],
    [b("bomba").fin, 0.9], [V.dur, 0.9],
  ]);

  // ============================================================ 0 · base · 1 · gravedad
  camara.ir(0, { pos: [17, 14, 21], mira: [0, 2, 0] }, 0);
  camara.ir(0.15, { pos: [6.2, 7.6, 7.4], mira: [1.4, 4, -0.8] }, 3.6);
  const bajada = tuberiaViva([punto(tin, [-0.84, 0.2, 0]), punto(tin, [-1.2, 0.2, 0]), [0.4, 2.6, -0.8], [0.4, 2.6, -2.6], [1.2, 2.6, -2.6], [1.2, 2.32, -2.6]],
    0.06, PVC, { nombre: "bajada a la regadera", t0: d("gravedad", "tubo") - 0.2, dur: 1.4 });
  camara.ir(b("gravedad").ini - 0.2, { pos: [4.8, 3.2, 9.4], mira: [1.0, 2.2, -2.0] }, 2.4);
  flujo(bajada, { t0: d("gravedad", "baja"), color: "agua", n: 9, vel: 0.5, radio: 0.05 });
  const chorro1 = lluvia({ centro: [1.2, 0.15, -2.6], tam: [0.36, 2.0, 0.36], n: 70, largo: 0.18, vel: 5.5, color: "#7cc8ff", opacidad: 0.85, t0: d("gravedad", "regadera"), t1: V.dur });

  // ============================================================ 2 · cubetas (problema)
  const tc = b("cubetas");
  const escalera = grupo({ pos: [4.15, 0.18, 0.6], rot: [0, 0, -8], nombre: "escalera" });
  caja(0.07, 3.4, 0.07, "madera", { padre: escalera, pos: [0, 0, -0.3] });
  caja(0.07, 3.4, 0.07, "madera", { padre: escalera, pos: [0, 0, 0.3] });
  for (let y = 0.35; y < 3.3; y += 0.42) caja(0.06, 0.05, 0.6, "madera", { padre: escalera, pos: [0, y, 0] });
  const cubeta = tornear([[0, 0], [0.18, 0], [0.24, 0.34], [0.25, 0.36], [0, 0.36]], "naranja", { pos: [4.42, 0.3, 0.6], flota: true, nombre: "cubeta" });
  aparecer(escalera, tc.ini - 0.1, { modo: "caer" }); desaparecer(escalera, b("calle").ini + 0.6);
  aparecer(cubeta, tc.ini + 0.3, { modo: "pop" }); desaparecer(cubeta, b("calle").ini + 0.5);
  efecto(cubeta, (t, x) => { if (t > tc.ini + 0.3) x.position.y += 1.5 * (1 - Math.cos((t - tc.ini - 0.3) * 3.4)); });
  alerta(cubeta, tc.ini + 0.3, tc.fin + 0.3);
  camara.ir(tc.ini - 0.3, { pos: [10, 5.5, 9], mira: [3, 2.2, 0.5] }, 1.4);

  // ============================================================ 3 · tubo de la calle · 4 · toma
  const tc3 = b("calle");
  const medidor = grupo({ pos: [4, 0.18, 5.1], nombre: "medidor" });
  caja(0.55, 0.4, 0.4, "azul", { padre: medidor });
  cilindro(0.13, 0.13, 0.04, "blanco", { padre: medidor, pos: [0, 0.22, 0.2], rot: [90, 0, 0], base: false });
  aparecer(medidor, d("calle", "conectas"), { modo: "caer" });
  // la toma sale de la tubería de la calle, corre enterrada y sale en el medidor
  tuberiaViva([[4, -0.6, 9.0], [4, -0.6, 5.1], [4, 0.2, 5.1]], 0.07, PVC, { nombre: "toma enterrada", t0: d("calle", "tubo") + 0.4, dur: 0.4, revisar: false });
  // del medidor a la azotea, por fuera del muro derecho, y hasta la boca del tinaco
  const subidaCalle = tuberiaViva([[4, 0.4, 4.88], [4, 0.4, 2.2], [3.65, 0.4, 2.2], punto(tin, [2.05, 2.1, 3.0]), punto(tin, [2.05, 2.1, 0]), punto(tin, [0, 2.1, 0]), punto(tin, [0, 1.74, 0])],
    0.07, PVC, { nombre: "tubo de la calle a la azotea", t0: d("calle", "conectas") + 0.4, dur: 1.8, t1: b("bomba").ini + 0.2 });
  flujo(subidaCalle, { t0: d("calle", "presion"), t1: d("bola", "cierra"), color: "agua", n: 22, vel: 0.28, radio: 0.06 });
  camara.ir(tc3.ini - 0.2, { pos: [14, 8.5, 18], mira: [1.5, 1.2, 3.5] }, 2.2);
  camara.ir(b("toma").ini - 0.3, { pos: [6.8, 2.6, 9.4], mira: [4, 0.4, 5.1] }, 1.3);
  latir(medidor, d("toma", "toma"), { k: 0.35 });

  // ============================================================ 5 · derrame · 6-7 · flotador
  const td = b("derrame");
  camara.ir(td.ini - 0.2, { pos: [5.6, 6.6, 4.6], mira: [1.6, 4, -0.8] }, 1.8);
  const charco = cilindro(1, 1, 0.02, "agua", { pos: [1.9, 3.25, -0.4], tinta: false, capa: true, lados: 40, nombre: "charco" });
  aparecer(charco, d("derrame", "derrama"), { modo: "crecer", dur: 2.2 }); desaparecer(charco, b("flotador").ini, { dur: 0.8 });
  flujo([[2.36, 4.95, -0.8], [2.55, 4.4, -0.7], [2.62, 3.3, -0.6]], { t0: d("derrame", "derrama"), t1: d("bola", "cierra") + 0.3, color: "agua", n: 10, vel: 1.1, radio: 0.06, halo: false });
  flujo([[0.84, 4.95, -0.8], [0.62, 4.4, -0.85], [0.55, 3.3, -0.9]], { t0: d("derrame", "derrama") + 0.2, t1: d("bola", "cierra") + 0.3, color: "agua", n: 10, vel: 1.1, radio: 0.06, halo: false });
  alerta(tin, d("derrame", "derrama"), td.fin + 0.3);
  const bola = esfera(0.17, "naranja", { padre: tin, pos: [0.25, 1, 0], nombre: "flotador" });
  const brazo = cilindro(0.025, 0.025, 0.5, "metal", { padre: tin, pos: [0.12, 1.3, 0], rot: [0, 0, 60], base: false, nombre: "brazo del flotador" });
  aparecer(bola, d("bola", "bola"), { modo: "pop" });
  aparecer(brazo, d("bola", "bola") + 0.15, { modo: "pop" });
  cadaCuadro(() => { bola.position.y = Math.min(1.5, 0.04 + 1.3 * agua.scale.y + 0.06); brazo.position.y = bola.position.y + 0.2; });
  camara.ir(b("bola").ini - 0.2, { pos: [3.7, 5.3, 2.7], mira: [1.6, 4.3, -0.8] }, 1.5);
  latir(bola, d("flotador", "flotador"), { k: 0.5 });

  // ============================================================ 8 · sin fuerza (tarde)
  const ts = b("sinfuerza");
  pista(M.sol.color, "b", [[ts.ini, 1], [ts.ini + 1.2, 0.5], [b("cisterna").fin, 0.5], [b("lodo").ini + 0.8, 1]]);
  pista(M.sol.color, "g", [[ts.ini, 1], [ts.ini + 1.2, 0.78], [b("cisterna").fin, 0.78], [b("lodo").ini + 0.8, 1]]);
  flujo([[4, 0.4, 4.88], [4, 0.4, 2.2], [3.65, 0.4, 2.2], [3.65, 1.8, 2.2]], { t0: d("sinfuerza", "fuerza"), t1: b("bomba").ini + 0.2, color: "agua", n: 6, vel: 0.12, radio: 0.06 });
  alerta(subidaCalle, d("sinfuerza", "fuerza"), ts.fin + 0.2);
  camara.ir(ts.ini - 0.2, { pos: [12.5, 8.5, 15.5], mira: [1, 2, 2] }, 2);

  // ============================================================ 9-10 · cisterna y bomba
  const tb = b("bomba");
  camara.ir(tb.ini - 0.4, { pos: [-2.2, 0.6, 15.8], mira: [-6.3, -1.5, 7.8] }, 1.5);
  desaparecer(tapon, d("bomba", "entierras"), { modo: "caer", dur: 0.5 });
  const cis = grupo({ nombre: "cisterna" });
  caja(2.98, 0.15, 2.48, "concreto", { padre: cis, pos: [-6.5, -2.69, 7.75], nombre: "piso de la cisterna" });
  caja(0.15, 1.38, 2.48, "concreto", { padre: cis, pos: [-7.915, -2.54, 7.75], nombre: "muro de la cisterna" });
  caja(0.15, 1.38, 2.48, "concreto", { padre: cis, pos: [-5.085, -2.54, 7.75], nombre: "muro de la cisterna" });
  caja(2.68, 1.38, 0.15, "concreto", { padre: cis, pos: [-6.5, -2.54, 6.585], nombre: "muro de la cisterna" });
  ensamblar(cis, d("bomba", "deposito"), { modo: "subir", alto: 1.6, escalon: 0.1 });
  const aguaCis = caja(2.66, 1.1, 2.3, "agua", { pos: [-6.5, -2.54, 7.82], tinta: false, nombre: "agua de la cisterna" });
  aguaCis.scale.y = 0.001;
  pista(aguaCis, "scale.y", [[0, 0.001], [d("bomba", "llena"), 0.001], [d("bomba", "debil") + 0.8, 1], [V.dur, 1]]);
  tuberiaViva([[-6.0, -0.6, 9.0], [-6.0, -0.6, 8.6], [-6.0, -1.25, 8.6]], 0.07, PVC, { nombre: "llenado de la cisterna", t0: d("bomba", "llena") - 0.4, dur: 0.4, revisar: false });
  flujo([[-6.0, -0.6, 8.6], [-6.0, -1.25, 8.6], [-6.0, -2.3, 8.6]], { t0: d("bomba", "llena"), color: "agua", n: 6, vel: 0.6, radio: 0.06, halo: false });
  const bomba = grupo({ pos: [-6.5, 0.18, 5.1], nombre: "bomba" });
  caja(0.7, 0.45, 0.45, "azul", { padre: bomba });
  cilindro(0.2, 0.2, 0.5, "rojo", { padre: bomba, pos: [0.55, 0.22, 0], rot: [0, 0, 90], base: false });
  aparecer(bomba, d("bomba", "bomba") - 0.2, { modo: "caer" });
  tuberiaViva([[-6.5, -2.2, 7.0], [-6.5, -0.6, 7.0], [-6.5, -0.6, 5.1], [-6.5, 0.2, 5.1]], 0.07, PVC, { nombre: "succión de la bomba", t0: d("bomba", "bomba"), dur: 0.5, revisar: false });
  const subidaBomba = tuberiaViva([[-6.5, 0.4, 4.88], [-6.5, 0.4, 2.2], [-3.65, 0.4, 2.2], punto(tin, [-5.25, 2.1, 3.0]), punto(tin, [-5.25, 2.1, 0.45]), punto(tin, [0, 2.1, 0.45]), punto(tin, [0, 2.1, 0]), punto(tin, [0, 1.74, 0])],
    0.07, PVC, { nombre: "tubo de la bomba al tinaco", t0: d("bomba", "sube") - 0.1, dur: 1.6 });
  flujo(subidaBomba, { t0: d("bomba", "sube") + 0.6, color: "agua", n: 24, vel: 0.3, radio: 0.06 });
  camara.ir(d("bomba", "bomba") - 0.6, { pos: [-1.5, 6.5, 19.5], mira: [-4.6, 1.9, 3.4] }, 1.6);
  camara.ir(b("cisterna").ini - 0.2, { pos: [-3.2, 0.4, 14.8], mira: [-6.5, -1.6, 8] }, 1.2);
  latir(cis, d("cisterna", "cisterna"), { k: 0.06 });

  // ============================================================ 11-13 · lodo y filtro
  const tl = b("lodo");
  const lodoT0 = d("lodo", "tierra"), lodoT1 = d("cartucho", "atrapa") + 0.8;
  teñir(agua, lodoT0, "#9a7046", 1.0); teñir(agua, lodoT1, "agua", 1.2);
  flujo(subidaBomba, { t0: lodoT0, t1: lodoT1, color: "#8b5e34", n: 14, vel: 0.3, radio: 0.075, halo: false });
  lluvia({ centro: [1.2, 0.15, -2.6], tam: [0.36, 2.0, 0.36], n: 60, largo: 0.2, vel: 5.5, color: "#a0703f", opacidad: 1, t0: d("lodo", "escupir"), t1: lodoT1 });
  cadaCuadro((t) => { if (t >= d("lodo", "escupir") && t < lodoT1) chorro1.visible = false; });
  alerta(regadera1, d("lodo", "escupir"), tl.fin + 0.3);
  camara.ir(tl.ini - 0.2, { pos: [4.8, 3.2, 9.4], mira: [1.0, 2.0, -2.0] }, 1.5);
  // el filtro va MONTADO en el tubo de la bomba (hijo del tinaco: sube con él)
  const filtro = grupo({ padre: tin, pos: [-2.2, 2.1, 0.45], nombre: "filtro de sedimentos" });  // corre en z 0.45 para no cruzar el jarro
  cilindro(0.17, 0.17, 0.5, "#dfe8ef", { padre: filtro, pos: [0, -0.6, 0], vidrio: true, opacidad: 0.5, casco: false, nombre: "vaso del filtro" });
  cilindro(0.09, 0.09, 0.42, "#c7a27a", { padre: filtro, pos: [0, -0.56, 0], nombre: "cartucho" });
  cilindro(0.2, 0.2, 0.16, "azul", { padre: filtro, pos: [0, -0.16, 0], nombre: "cabeza del filtro" });
  cilindro(0.06, 0.06, 0.1, PVC, { padre: filtro, pos: [0, -0.06, 0], nombre: "unión del filtro" });
  aparecer(filtro, d("cartucho", "cartucho"), { modo: "caer", alto: 1.5 });
  camara.ir(b("cartucho").ini - 0.3, { pos: [-2.8, 6.9, 4.0], mira: [-0.5, 5.0, -0.4] }, 1.5);
  latir(filtro, d("filtro", "filtro"), { k: 0.25 });

  // ============================================================ 14 · ahora sí
  camara.ir(b("ahorasi").ini - 0.1, { pos: [14, 9.5, 17], mira: [-1, 1.5, 2] }, 2.4);

  // ============================================================ 15 · segundo piso
  const t15 = d("segundo", "segundo");
  const piso2 = grupo({ pos: [0, 3.25, 0], nombre: "segundo piso" });
  caja(6.7, 3, 0.15, "muro", { pos: [0, 0, -2.925], padre: piso2, nombre: "muro de atrás (arriba)" });
  caja(0.15, 3, 6, "muro", { pos: [-3.425, 0, 0], padre: piso2, nombre: "muro izquierdo (arriba)" });
  caja(0.15, 3, 6, "muro", { pos: [3.425, 0, 0], padre: piso2, nombre: "muro derecho (arriba)" });
  caja(7.3, 0.25, 6.3, "concreto", { pos: [0, 3, 0], padre: piso2, nombre: "loza de arriba" });
  // el piso de arriba CRECE desde la loza y el tinaco sube montado en él: misma curva y mismo tiempo, nunca flota
  aparecer(piso2, t15 - 0.4, { modo: "desplegar", dur: 0.9 });
  mover(tin, t15 - 0.4, { por: [0, 3.25, 0] }, 0.9, "resorte");
  const tArriba = d("segundo", "arriba");                                 // la cámara entra al baño de arriba
  const azulejo2 = caja(2.2, 2.3, 0.02, "#bfe6f2", { pos: [1.3, 3.4, -2.84], capa: true, tinta: false, nombre: "azulejo (arriba)" });
  aparecer(azulejo2, tArriba - 0.5, { modo: "desplegar" });
  camara.ir(b("segundo").ini - 0.2, { pos: [13.5, 11.5, 16.5], mira: [0, 4.5, 0] }, 1.6);
  const regadera2 = grupo({ pos: [1.2, 5.5, -2.6], nombre: "regadera de arriba" });
  cilindro(0.16, 0.05, 0.12, "metal", { padre: regadera2, base: false });
  aparecer(regadera2, tArriba - 0.1, { modo: "pop" });
  const ramal2 = tuberiaViva([[0.4, 5.85, -0.8], [0.4, 5.85, -2.6], [1.2, 5.85, -2.6], [1.2, 5.57, -2.6]], 0.06, PVC, { nombre: "ramal de arriba", t0: tArriba - 0.4, dur: 0.5 });
  const tSube = d("subirlo", "base") + 0.4;
  flujo(ramal2, { t0: tArriba + 0.1, color: "agua", n: 5, vel: 0.5, radio: 0.05 });
  lluvia({ centro: [1.2, 3.4, -2.6], tam: [0.12, 2.1, 0.12], n: 7, largo: 0.12, vel: 3.2, color: "#7cc8ff", t0: tArriba + 0.2, t1: tSube + 0.6 });
  alerta(regadera2, d("segundo", "chorrito"), b("segundo").fin + 0.4);
  camara.ir(d("segundo", "regadera") - 0.5, { pos: [4.8, 6.4, 9.4], mira: [1.0, 5.3, -2.0] }, 1.2);

  // ============================================================ 16 · qué tan alto (cota que sigue al tinaco)
  const cota = grupo({ pos: [3.95, 5.5, -0.8], flota: true, nombre: "cota" });   // por fuera del muro: la loza no la tapa
  const linea = cilindro(0.025, 0.025, 1, "amarillo", { padre: cota, tinta: false, sombra: false, flota: true });
  const tope = caja(0.4, 0.04, 0.04, "amarillo", { padre: cota, tinta: false, sombra: false, flota: true });
  caja(0.4, 0.04, 0.04, "amarillo", { padre: cota, tinta: false, sombra: false, flota: true });
  const altoTinaco = new M.THREE.Vector3();
  cadaCuadro(() => { tin.updateMatrixWorld(true); tin.getWorldPosition(altoTinaco); const h = Math.max(0.05, altoTinaco.y - 5.5); linea.scale.y = h; tope.position.y = h; });
  aparecer(cota, d("altura", "alto"), { modo: "desplegar" });
  const et1 = letrero("1 m", { pos: [4.6, 6.0, -0.8], alto: 0.42, fondo: "#ffd23f" });
  const et3 = letrero("3 m", { pos: [4.6, 7.0, -0.8], alto: 0.42, fondo: "#ffd23f" });
  aparecer(et1, d("altura", "alto") + 0.3, { modo: "pop" }); desaparecer(et1, tSube - 0.2, { dur: 0.25 });
  aparecer(et3, tSube + 1.0, { modo: "pop" });
  camara.ir(b("altura").ini - 0.2, { pos: [8.2, 7.4, 9.6], mira: [2.6, 6.4, -1.0] }, 1.8);

  // ============================================================ 17-18 · base del tinaco
  const t17 = d("subirlo", "base");
  const baseT = grupo({ pos: [1.6, 6.5, -0.8], nombre: "base del tinaco" });
  const patas = grupo({ padre: baseT, nombre: "patas de la base" });
  [[-0.65, -0.65], [0.65, -0.65], [-0.65, 0.65], [0.65, 0.65]].forEach(([x, z]) => caja(0.1, 1.95, 0.1, "acero", { padre: patas, pos: [x, 0, z] }));
  caja(1.2, 0.06, 0.06, "acero", { padre: patas, pos: [0, 1, -0.65] }); caja(1.2, 0.06, 0.06, "acero", { padre: patas, pos: [0, 1, 0.65] });
  caja(1.8, 0.1, 1.8, "acero", { padre: patas, pos: [0, 1.95, 0], nombre: "repisa de la base" });
  // patas y repisa crecen juntas y el tinaco sube encima con la misma curva: la repisa siempre está debajo
  aparecer(patas, t17 - 0.2, { modo: "desplegar", dur: 0.9 });
  mover(tin, t17 - 0.2, { por: [0, 2.05, 0] }, 0.9, "resorte");
  camara.ir(b("subirlo").ini - 0.2, { pos: [10.8, 9.0, 11.8], mira: [2.6, 7.2, -0.9] }, 2.2);
  latir(baseT, d("base2", "base"), { k: 0.1 });

  // ============================================================ 19 · aire en el tubo
  const ta = b("aire");
  const tEscape = d("tubo", "escape");
  flujo(bajada, { t0: d("aire", "aire"), t1: tEscape, color: "#ffffff", n: 5, vel: 0.45, radio: 0.11, halo: false });
  // el chorro fuerte de arriba: sale cuando el tinaco ya subió; escupe a golpes mientras hay aire en el tubo
  const chorro2 = lluvia({ centro: [1.2, 3.4, -2.6], tam: [0.36, 2.1, 0.36], n: 75, largo: 0.18, vel: 6, color: "#7cc8ff", opacidad: 0.85, t0: tSube + 0.6, t1: V.dur });
  cadaCuadro((t) => { if (t >= d("aire", "escupe") && t < tEscape) chorro2.visible = Math.sin(t * 13) > 0.1; });
  sacudir(regadera2, d("aire", "escupe"), { dur: ta.fin - d("aire", "escupe") + 0.3, amp: 0.05, frec: 22 });
  alerta(regadera2, d("aire", "escupe"), ta.fin + 0.3);
  camara.ir(ta.ini - 0.2, { pos: [4.8, 6.4, 9.4], mira: [1.0, 5.3, -2.0] }, 1.4);

  // ============================================================ 20-22 · jarro de aire (anclado al tinaco)
  const tj = d("tubo", "tubo");
  const jarro = tuberiaViva([punto(tin, [-1.2, 0.2, 0]), punto(tin, [-1.2, 2.35, 0]), punto(tin, [-1.5, 2.35, 0]), punto(tin, [-1.5, 2.15, 0])], 0.06, PVC,
    { nombre: "jarro de aire", t0: tj - 0.1, dur: 1.4 });
  const trapo = esfera(0.12, "#8a6a4a", { padre: tin, pos: [-1.5, 2.07, 0], nombre: "trapo que tapa el jarro" });
  const tapado0 = d("tip", "tapado") - 0.5, tapado1 = b("tip").fin - 0.3;
  flujo(jarro, { t0: tEscape, t1: tapado0, color: "#ffffff", n: 6, vel: 0.5, radio: 0.065, halo: false });
  flujo(jarro, { t0: tapado1 + 0.3, color: "#ffffff", n: 6, vel: 0.5, radio: 0.065, halo: false });
  camara.ir(b("tubo").ini - 0.2, { pos: [5.0, 10.2, 7.8], mira: [0.4, 9.4, -0.8] }, 1.8);
  camara.ir(b("jarro").ini - 0.2, { pos: [4.8, 10.9, 7.6], mira: [0.2, 9.7, -0.8] }, 1.2);
  latir(jarro, d("jarro", "jarro"), { k: 0.12 });
  aparecer(trapo, tapado0, { modo: "pop" });
  alerta(trapo, tapado0, tapado1);
  mover(trapo, tapado1, { por: [-0.5, 1.2, 0.5] }, 0.6, "sale");
  desaparecer(trapo, tapado1 + 0.35, { dur: 0.25 });
  camara.ir(b("tip").ini - 0.2, { pos: [2.6, 11.4, 4.4], mira: [0.0, 10.4, -0.6] }, 1.4);

  // ============================================================ 23 · cierre
  camara.ir(b("cierre").ini - 0.2, { pos: [17, 14, 21], mira: [-1, 4, 1] }, 3.0, "suave");
}
