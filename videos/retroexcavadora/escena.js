// "La retroexcavadora": se construye POR RELACIONES con las piezas de obra (motor/piezas-obra.js).
//   · la máquina se mueve por POSES con tiempo (R.pose) y por rutas (R.manejar); los cilindros van de ancla a ancla
//   · un solo terreno: zanja (tierra blanda arriba, tepetate abajo), montón de tierra y camión de volteo esperando
//   · cada problema se ve fallar: la pala raya, el brazo se cae, la máquina se levanta, la tierra se amontona
export default function construir(M, V) {
  const { THREE, aparecer, desaparecer, latir, sacudir, alerta, teñir, flujo, camara, tuberiaViva, punto, puerto, lluvia, trazo, letrero, flecha, mover, pista, cadaCuadro, cono, cilindro, caja, zona } = M;
  const { obra, retroexcavadora, camionVolteo, monton, arbol, nube, persona, rueda, casco, polvo, terrones, tambo, carretilla, pilaBlock, valla, caseta, piedritas, huellas } = M.piezas;
  const b = (id) => V.beat(id), d = (id, w) => V.dice(id, w);
  const ACEITE = "#ffb21a", TIERRA = "#7a5232";

  // ============================================================ mundo
  const T = obra();
  [[-12, 0, -13], [9, 0, -12.5], [12, 0, -8], [-17, 0, -14]].forEach((pos) => arbol({ pos }));
  [[-10, 15, -30], [9, 17, -32], [22, 13, -24]].forEach((pos) => nube({ pos }));
  for (const z of [-0.95, 0.95]) {   // conos de obra al final de la zanja
    cono(0.2, 0.6, "naranja", { pos: [-7.7, 0, z], nombre: "cono de obra" });
    cilindro(0.135, 0.155, 0.11, "blanco", { pos: [-7.7, 0.22, z], nombre: "franja del cono", tinta: false });
  }
  // utilería de la obra (lejos de donde se mueve la máquina)
  caseta({ pos: [11.5, 0, -9.5], rot: [0, -25, 0] });
  valla({ pos: [5.5, 0, -8.2], largo: 8 });
  [[6.6, -5.4, "#2f6fdc"], [7.3, -5.0, "#ff8a00"], [7.0, -5.9, "#2f6fdc"]].forEach(([x, z, color]) => tambo({ pos: [x, 0, z], color }));
  pilaBlock({ pos: [8.4, 0.12, -2.6], rot: [0, 20, 0] });
  carretilla({ pos: [9.2, 0, -4.6], rot: [0, -35, 0] });
  piedritas({ area: [-14, 12, -9, 10], n: 70, evita: [[-7.4, -3.2, -1, 1]] });
  huellas([[14, 6], [8, 3.2], [3, 2.8], [-1, 3.6], [-6, 5.5]]);
  huellas([[-5, -14], [-5, -9.5], [-4.6, -6]], { separacion: 1.9, ancho: 0.36 });
  const zonaMonton = zona(2.8, 1.0, 2.8, { pos: [-3.0, 0, -2.6], nombre: "zona del montón" });
  const mo = monton({ pos: [-3.0, 0, -2.6] });
  const C = camionVolteo({ pos: [-5.0, 0, -12], rot: [0, 90, 0] });   // espera al fondo; al final se echa de reversa

  // ============================================================ la retro (empieza 1.5 m atrás: avanza al rayar)
  const R = retroexcavadora({ inicio: [-1.5, 0, 0], pose: { sw: 0, a1: 20, a2: -30, a3: -20 } });
  const s = R.cuerpo;
  aparecer(R, Math.max(0.2, d("base", "tractor") - 0.1), { modo: "caer", alto: 3 });
  polvo([-1.5, 0, 0], Math.max(0.2, d("base", "tractor") - 0.1) + 0.32, { tam: 1.6, n: 10, abre: 1.8 });   // aterriza

  // ============================================================ 0 · base: tractor + pala amarrada · 1 · la pala fija raya el piso
  camara.ir(0, { pos: [10, 6.5, 15], mira: [-1, 1, 0] }, 0);
  camara.mostrar(d("base", "amarras"), [s], { dur: 1.0, azimut: 25, elevacion: 18 });
  const pf = R.palaFija();
  aparecer(pf, d("base", "pala") - 0.1, { modo: "caer", alto: 1.4 });
  camara.mostrar(d("base", "pala") + 0.4, [pf, R.ruedas[1]], { dur: 1.0, azimut: -20, elevacion: 12 });
  latir(pf, d("base", "ya"), { k: 0.14 }); latir(pf, d("base", "retroexcavadora") + 0.2, { k: 0.18, dur: 0.6 });
  // el motor está encendido: humo del escape (bocanadas grises que suben)
  flujo([punto(s, [1.15, 2.3, 0.3]), punto(s, [1.05, 2.9, 0.3]), punto(s, [0.85, 3.5, 0.3])], { t0: 1.1, t1: b("fija").fin, color: "#9aa0a8", n: 5, vel: 0.55, radio: 0.11, halo: false, libre: true, nombre: "humo del escape" });
  sacudir(s, d("base", "ya"), { dur: 2.0, amp: 0.03, frec: 34 });
  const tRaya = d("fija", "raya") - 0.25, durRaya = 1.4;
  R.manejar(tRaya, durRaya, [{ recto: 1.5 }]);
  trazo([[-4.69, 0.025, 0], [-3.19, 0.025, 0]], { t0: tRaya, dur: durRaya, t1: b("brazo").ini + 0.2, radio: 0.05, color: "#4e3220" });
  sacudir(pf, tRaya, { dur: durRaya, amp: 0.03, frec: 30 });
  for (const k of [0.25, 0.7, 1.1]) polvo(() => { const h = pf.hoja.getWorldPosition(new THREE.Vector3()); return h.setY(0); }, tRaya + k, { tam: 0.6, n: 5, dur: 0.9 });
  alerta(pf, d("fija", "fija"), b("fija").fin + 0.3);
  camara.mostrar(d("fija", "fija"), [pf, R.cabina, T.zonaZanja], { dur: 1.1, azimut: 20, elevacion: 22 });
  desaparecer(pf, b("brazo").ini + 0.05, { dur: 0.3 });

  // ============================================================ 2 · brazo de dos tramos · 3 · brazo excavador
  aparecer(R.giro, b("brazo").ini + 0.15, { modo: "desplegar", dur: 0.4 });
  aparecer(R.pluma, d("brazo", "brazo") - 0.05, { modo: "estirar", dur: 0.55 });
  aparecer(R.balancin, d("brazo", "tramos") - 0.1, { modo: "estirar", dur: 0.5 });
  camara.mostrar(d("brazo", "brazo") + 0.4, [R.pluma, R.cabina], { dur: 1.2, azimut: -40, elevacion: 14 });
  R.pose(d("brazo", "dobla"), { a1: 42, a2: -105, a3: -40 }, 0.8);                 // se dobla
  const hombro = R.giro.getObjectByName("perno del hombro");
  latir(hombro, d("brazo", "hombro"), { k: 0.6 });
  R.pose(d("brazo", "hombro"), { a1: 30 }, 0.35).pose(d("brazo", "hombro") + 0.35, { a1: 40 }, 0.3);   // el hombro
  latir(R.codo, d("brazo", "codo"), { k: 0.6 });
  R.pose(d("brazo", "codo"), { a2: -80 }, 0.3).pose(d("brazo", "codo") + 0.3, { a2: -100 }, 0.3);      // el codo
  camara.mostrar(d("brazo", "hombro"), [R.giro], { dur: 1.0, azimut: -20, elevacion: 10 });
  aparecer(R.bote, d("brazo", "bote") - 0.05, { modo: "estirar", dur: 0.4 });
  aparecer(R.dientes, d("brazo", "dientes"), { modo: "pop" });
  latir(R.dientes, d("brazo", "punta"), { k: 0.25 });
  camara.mostrar(d("brazo", "bote") + 0.3, [R.balancin, R.bote], { dur: 0.9, azimut: 0, elevacion: 12 });
  // el primer bocado: baja al suelo, muerde y se llena
  const tB = b("brazoT");
  latir(R.pluma, d("brazoT", "brazo"), { k: 0.06 }); latir(R.balancin, d("brazoT", "brazo") + 0.15, { k: 0.06 });
  R.pose(tB.ini - 0.3, { a1: 12, a2: -75, a3: -30 }, 1.1);
  R.pose(tB.ini + 1.0, { a1: 16, a2: -100, a3: -110 }, 1.1);
  R.cargar(tB.ini + 1.6, { bote: 1 }, 0.5);
  const muerde = (t, o = {}) => { const q = R.dondeBote(t, [0.95, -0.4, 0]); polvo([q.x, Math.max(-0.8, Math.min(0, q.y)), q.z], t, { tam: 0.8, n: 7, ...o }); };
  muerde(tB.ini + 0.85);
  camara.mostrar(tB.ini + 0.3, [R.giro, T.zonaZanja], { dur: 1.2, azimut: -50, elevacion: 22 });

  // ============================================================ 4 · lleno pesa como un carro: no sube
  const tP = b("pesado");
  R.pose(tP.ini + 0.2, { a1: 10 }, 0.9);
  R.pose(d("pesado", "pesa"), { a1: -1, a2: -94 }, 0.45, "entra");              // se le cae
  sacudir(R.pluma, d("pesado", "pesa") + 0.2, { dur: 0.6, amp: 0.05, frec: 24 });
  R.pose(d("pesado", "quien") - 0.15, { a1: 4 }, 0.4).pose(d("pesado", "levante"), { a1: -1 }, 0.35, "entra");   // otro intento: nada
  sacudir(R.pluma, d("pesado", "quien"), { dur: 0.9, amp: 0.05, frec: 26 });
  for (const x of [R.pluma, R.balancin, R.bote]) alerta(x, d("pesado", "pesa"), tP.fin + 0.3);
  { const q = R.dondeBote(d("pesado", "pesa") + 0.5); const fp = flecha([q.x, q.y + 2.1, q.z + 0.6], [q.x, q.y + 0.9, q.z + 0.6], { t0: d("pesado", "pesa"), t1: tP.fin + 0.2, color: "rojo" }); fp.name = "flecha de peso"; fp.userData.flota = true; }
  camara.mostrar(d("pesado", "pesa"), [R.balancin, R.bote], { dur: 1.2, azimut: -35, elevacion: 20 });

  // ============================================================ 5 · tubo con pistón + bomba + aceite · 6 · presión · 7 · cilindro hidráulico
  const [cP, cB, cT] = R.cilindrosBrazo;
  for (const c of R.cilindros) c.userData.pivote = new THREE.Vector3();   // laten desde su ancla (se recolocan cada cuadro)
  aparecer(cP, d("piston", "tubo") - 0.05, { modo: "desplegar", dur: 0.6 });
  camara.mostrar(d("piston", "tubo") + 0.4, [cP, R.pluma], { dur: 1.2, azimut: 0, elevacion: 12 });
  const emb = cP.getObjectByName("pistón");
  teñir(emb, d("piston", "piston"), "rojo", 0.2); teñir(emb, d("piston", "adentro") + 0.4, "#4a4f57", 0.3);
  aparecer(R.bomba, d("piston", "bomba") - 0.1, { modo: "pop" });
  latir(R.bomba, d("piston", "bomba") + 0.3, { k: 0.3 }); latir(R.bomba, d("piston", "mete") + 0.1, { k: 0.2 });
  camara.mostrar(d("piston", "bomba") + 0.2, [R.bomba], { dur: 1.1, azimut: 15, elevacion: 12, vista: 2.6 });
  // mangueras: de la bomba, por el costado del chasis, al soporte del brazo y a cada cilindro (ancladas: se mueven con la máquina)
  const lado = [punto(s, [0.14, 1.12, 0.71]), punto(s, [-1.95, 1.12, 0.71]), punto(s, [-2.3, 1.3, 0.3])];
  const mang = (pts, t0, nombre) => tuberiaViva([puerto(R.bomba, "salida"), ...lado, ...pts], 0.03, "#22242b", { t0, dur: 0.9, nombre });
  const tAceite = d("piston", "mete") - 0.1;
  const m1 = mang([punto(R.giro, [0.12, 0.05, -0.27]), punto(R.giro, [0.32, -0.36, -0.13])], tAceite, "manguera del cilindro de la pluma");
  const m2 = mang([punto(R.giro, [0.12, 0.28, -0.27]), punto(R.pluma, [0.05, 0.22, -0.19]), punto(R.pluma, [1.1, 0.64, -0.19]), punto(R.pluma, [1.2, 0.68, -0.1])], tAceite + 0.35, "manguera del cilindro del balancín");
  const m3 = mang([punto(R.giro, [0.12, 0.38, -0.29]), punto(R.pluma, [0.1, 0.3, -0.21]), punto(R.pluma, [1.25, 0.66, -0.21]), punto(R.pluma, [2.6, 0.2, -0.21]), punto(R.balancin, [0.05, 0.2, -0.15]), punto(R.balancin, [0.28, 0.22, -0.08])], tAceite + 0.6, "manguera del cilindro del bote");
  const tFinAceite = b("cilindro").fin;
  [m1, m2, m3].forEach((m) => flujo(m, { t1: tFinAceite, color: ACEITE, n: 16, vel: 0.45, radio: 0.04, llenado: 1.1 }));
  aparecer(cB, d("piston", "piston#2"), { modo: "desplegar", dur: 0.45 });
  aparecer(cT, d("piston", "piston#2") + 0.15, { modo: "desplegar", dur: 0.45 });
  R.pose(d("piston", "sale") + 0.1, { a1: 35, a2: -110, a3: -120 }, 1.2);          // ahora SÍ sube, lleno
  camara.mostrar(d("piston", "sale") + 0.3, [R.pluma, cP, cB], { dur: 1.2, azimut: -30, elevacion: 14 });
  // presión: la del cilindro contra la de una llanta de carro
  const etC = letrero("≈ 250 bar", { pos: [-1.6, 3.35, 1.1], alto: 0.42, fondo: "#ffd23f", flota: true, nombre: "presión del cilindro" });
  aparecer(etC, d("presion", "cien"), { modo: "pop" }); desaparecer(etC, b("cilindro").ini, { dur: 0.25 });
  const llanta = rueda(0.34, 0.24, { pos: [0.6, 0.34, 2.6], nombre: "llanta de carro", rin: "#c9d0d8", tacos: 12 });
  const etL = letrero("≈ 2 bar", { padre: llanta, pos: [0, 0.75, 0], alto: 0.38, fondo: "#ffffff", flota: true, nombre: "presión de la llanta" });
  aparecer(llanta, d("presion", "llanta") - 0.1, { modo: "pop" }); desaparecer(llanta, b("cilindro").ini + 0.2, { dur: 0.3 });
  aparecer(etL, d("presion", "llanta") + 0.15, { modo: "pop" });
  // primer vaciado al montón (el giro del brazo lo pone a un lado)
  const tV1 = b("presion").ini;
  R.pose(tV1 + 0.1, { sw: -75, a2: -95 }, 1.1).pose(tV1 + 1.3, { a3: 20 }, 0.4).pose(tV1 + 2.4, { sw: 0, a1: 12, a2: -75, a3: -30 }, 1.3);
  R.cargar(tV1 + 1.45, { bote: 0 }, 0.4);
  const caida = (t0, t1) => {
    const q = R.dondeBote(t0 + 0.15);
    terrones({ desde: [q.x, q.y - 0.15, q.z], hasta: 0.35, t0, t1: t1 - 0.25, n: 16, ancho: [0.5, 0.45] });
    polvo([q.x, 0.2, q.z], t0 + 0.3, { tam: 1.1, n: 8 });
  };
  caida(tV1 + 1.35, tV1 + 2.0);
  camara.mostrar(d("presion", "cien"), [R.giro, zonaMonton, etC], { dur: 1.2, azimut: -35, elevacion: 28 });
  camara.mostrar(d("presion", "llanta") + 0.25, [llanta, cP, etC], { dur: 1.0, azimut: 20, elevacion: 14 });
  for (const c of [cP, cB, cT]) {
    latir(c, d("cilindro", "cilindro") + 0.1, { k: 0.1, dur: 0.45 });
    const cm = c.getObjectByName("camisa del cilindro");
    teñir(cm, d("cilindro", "cilindro") - 0.05, "#ff8a00", 0.25); teñir(cm, b("cilindro").fin + 0.2, "#f7d36b", 0.4);
  }
  const tCi = b("cilindro");
  R.pose(tCi.ini + 0.4, { a1: 10, a2: -100, a3: -110 }, 1.1);
  R.cargar(tCi.ini + 1.1, { bote: 1 }, 0.4);
  muerde(tCi.ini + 0.6);
  camara.mostrar(d("cilindro", "cilindro"), [cP, cB], { dur: 1.0, azimut: -15, elevacion: 14 });

  // ============================================================ 8 · ahora sí, como si nada (ciclo rápido) · el montón crece
  const tA = b("ahorasi");
  R.pose(tA.ini - 0.4, { a1: 35, a2: -110, a3: -120 }, 0.55)
    .pose(tA.ini + 0.15, { sw: -75, a2: -95 }, 0.6).pose(tA.ini + 0.8, { a3: 20 }, 0.3)
    .pose(tA.ini + 1.2, { sw: 0, a1: 2, a2: -80, a3: -30 }, 0.8);
  R.cargar(tA.ini + 0.85, { bote: 0 }, 0.3);
  caida(tA.ini + 0.8, tA.ini + 1.3);
  camara.mostrar(tA.ini + 0.5, [R.giro, zonaMonton, T.zonaZanja], { dur: 1.3, azimut: -50, elevacion: 30 });

  // ============================================================ 9 · tierra dura: el bote no entra y se levanta la máquina
  const tD = b("dura");
  T.escarbar([[0, 1], [tB.ini + 0.3, 1], [tB.ini + 0.9, 0.93], [tB.ini + 1.8, 0.78], [tCi.ini + 0.9, 0.78], [tCi.ini + 1.6, 0.5], [tA.ini + 1.3, 0.5], [tD.ini + 0.3, 0.001]]);
  R.pose(d("dura", "muerdes"), { a1: -7, a2: -86, a3: -45 }, 0.55, "entra");
  sacudir(R.bote, d("dura", "tierra") + 0.1, { dur: 0.7, amp: 0.05, frec: 30 });
  muerde(d("dura", "tierra") + 0.1, { color: "#d6c7a6", tam: 0.9 }); muerde(d("dura", "entre"), { color: "#d6c7a6", tam: 0.7 });
  alerta(T.zanja.dura, d("dura", "dura"), tD.fin + 0.3);
  camara.mostrar(d("dura", "tierra"), [R.balancin, T.zonaZanja], { dur: 1.0, azimut: -25, elevacion: 48 });
  R.pose(d("dura", "entre") - 0.1, { a1: -10 }, 0.5);
  R.pose(d("dura", "levanta") - 0.1, { levanta: 11 }, 0.5, "sale")
    .pose(d("dura", "maquina") + 0.35, { levanta: 8 }, 0.3).pose(d("dura", "maquina") + 0.65, { levanta: 10.5 }, 0.3)
    .pose(tD.fin + 0.15, { levanta: 0, a1: 4 }, 0.5, "rebote");
  sacudir(s, d("dura", "levanta"), { dur: 1.2, amp: 0.03, frec: 18 });
  alerta(R.cofre, d("dura", "levanta"), tD.fin + 0.35);
  camara.mostrar(d("dura", "levanta"), [R.chasis, R.cabina, R.ruedas[1], R.ruedas[3]], { dur: 1.0, azimut: 4, elevacion: 4 });

  // ============================================================ 10 · dos patas que levantan las llantas · 11 · estabilizadores
  const [E1, E2] = R.estabilizadores;
  for (const e of [E1, E2]) { aparecer(e, d("patas", "patas") - 0.15, { modo: "pop" }); aparecer(e.cil, d("patas", "patas") + 0.1, { modo: "desplegar", dur: 0.4 }); }
  camara.mostrar(d("patas", "patas") + 0.3, [E1, E2, R.soporte], { dur: 1.2, azimut: -80, elevacion: 14 });
  R.pose(d("patas", "bajan") - 0.1, { phi: 47 }, 0.9);
  R.pose(d("patas", "levantan") - 0.05, { phi: 22 }, 0.8, "sale");
  for (const z of [-1.64, 1.64]) polvo([-2.08, 0, z], d("patas", "bajan") + 0.75, { tam: 0.7, n: 6 });   // las zapatas tocan el piso
  camara.mostrar(d("patas", "levantan") + 0.3, [E1, E2, R.ruedas[0], R.ruedas[1]], { dur: 1.1, azimut: -30, elevacion: 6 });
  // como cuando abres las piernas para cargar algo pesado
  const p = persona({ color: "naranja", nombre: "persona que carga", brazosAlFrente: 22 });
  M.colocar(p, { pos: [0.6, 0.01, 3.7] }); casco(p, "#ffffff");
  const bulto = caja(0.55, 0.42, 0.42, "#c8935e", { padre: p, pos: [0, 0.62, 0.32], nombre: "caja pesada" });
  aparecer(p, d("patas", "como") - 0.15, { modo: "pop" }); desaparecer(p, b("estab").ini + 0.4, { dur: 0.3 });
  const abre = { v: 0 };
  pista(abre, "v", [[0, 0], [d("patas", "abres"), 0], [d("patas", "abres") + 0.4, 1, "sale"]]);
  const piernas = p.children.filter((h) => h.name === "pierna");
  cadaCuadro(() => piernas.forEach((pi) => { const sg = (pi.userData.lado ??= Math.sign(pi.position.x)); pi.position.x = sg * (0.1 + 0.26 * abre.v); pi.rotation.z = sg * Math.asin((0.26 * abre.v) / 0.8); }));
  mover(bulto, d("patas", "cargar"), { por: [0, 0.5, 0.15], causa: "la persona la carga" }, 0.5, "sale");
  // las manos van a los lados de la caja: los brazos giran al frente según la altura de la caja (largo del brazo 0.55)
  cadaCuadro(() => { const a = Math.acos(THREE.MathUtils.clamp((1.38 - (bulto.position.y + 0.22)) / 0.55, -1, 1)); p.brazos.forEach((br) => { br.rotation.x = -a; }); });
  camara.mostrar(d("patas", "abres"), [p, E2], { dur: 1.0, azimut: -10, elevacion: 10 });
  // ya apoyada, el bote sí muerde el tepetate
  const tE = b("estab");
  R.pose(b("patas").ini + 0.1, { a1: 8, a2: -82 }, 0.6);
  R.pose(d("patas", "abres") - 0.6, { a1: -8, a2: -90, a3: -45 }, 0.8).pose(d("patas", "abres") + 0.4, { a2: -108, a3: -112 }, 1.0);
  R.cargar(d("patas", "abres") + 1.1, { bote: 1 }, 0.4);
  muerde(d("patas", "abres") - 0.1, { color: "#d6c7a6" });
  R.pose(d("patas", "pesado") - 0.2, { a1: 35, a2: -110, a3: -120 }, 0.7)
    .pose(tE.ini + 0.1, { sw: -75, a2: -95 }, 0.7).pose(tE.ini + 0.85, { a3: 20 }, 0.3);
  R.cargar(tE.ini + 0.9, { bote: 0 }, 0.3);
  caida(tE.ini + 0.85, tE.ini + 1.4);
  for (const e of [E1, E2]) latir(e, d("estab", "estabilizadores"), { k: 0.12 });
  camara.mostrar(d("estab", "estabilizadores"), [E1, E2, zonaMonton], { dur: 1.1, azimut: -55, elevacion: 22 });
  // otro bocado y otra descarga: el montón ya es grande
  const tM = b("monton");
  R.pose(tE.ini + 1.25, { sw: 0, a1: -8, a2: -90, a3: -45 }, 0.8).pose(tE.fin + 0.0, { a2: -108, a3: -112 }, 0.6)
    .pose(tM.ini + 0.1, { a1: 35, a2: -110, a3: -120 }, 0.4).pose(tM.ini + 0.5, { sw: -75, a2: -95 }, 0.45).pose(d("monton", "amontonada") - 0.05, { a3: 20 }, 0.3);
  R.cargar(tE.fin + 0.5, { bote: 1 }, 0.3); R.cargar(d("monton", "amontonada"), { bote: 0 }, 0.3);
  T.escarbarDura([[0, 1], [d("patas", "abres") + 0.5, 1], [d("patas", "abres") + 1.3, 0.62], [tE.fin + 0.1, 0.62], [tE.fin + 0.6, 0.3]]);
  caida(d("monton", "amontonada") - 0.05, d("monton", "amontonada") + 0.5);
  mo.nivel([[0, 0], [tV1 + 1.4, 0], [tV1 + 2.1, 0.38], [tA.ini + 0.85, 0.38], [tA.ini + 1.4, 0.6], [tE.ini + 0.9, 0.6], [tE.ini + 1.5, 0.82],
    [d("monton", "amontonada"), 0.82], [d("monton", "amontonada") + 0.5, 1], [d("pala", "levanta") + 0.6, 1], [d("pala", "levanta") + 1.1, 0.001]]);
  alerta(mo.malla, d("monton", "amontonada") + 0.3, tM.fin + 0.3);
  camara.mostrar(d("monton", "amontonada"), [zonaMonton, T.zonaZanja, R.giro], { dur: 1.1, azimut: -30, elevacion: 34 });
  R.pose(d("monton", "hoyo") - 0.3, { sw: 0, a1: 62, a2: -150, a3: -100 }, 1.1);     // el brazo se recoge para moverse

  // ============================================================ 13 · pala ancha adelante: la levanta y la echa al camión · 14 · cargador frontal
  const tL = b("pala");
  const torres = R.cargador.children.filter((h) => h.isMesh);
  torres.forEach((h) => aparecer(h, d("pala", "adelante") - 0.1, { modo: "pop", tapadaOk: true }));   // nacen detrás del cofre
  aparecer(R.brazosC, d("pala", "adelante") + 0.15, { modo: "estirar", dur: 0.5 });
  aparecer(R.pala, d("pala", "adelante") + 0.5, { modo: "estirar", dur: 0.45 });
  R.cilCargador.forEach((c) => aparecer(c, d("pala", "adelante") + 0.6, { modo: "desplegar", dur: 0.4, revisar: false }));   // detalle: el cofre los tapa a medias
  R.pose(tL.ini + 0.2, { phi: 165 }, 0.7);                                            // sube las patas para moverse
  latir(R.pala, d("pala", "ancha"), { k: 0.08 });
  camara.mostrar(d("pala", "adelante") - 0.15, [R.cofre, R.cargador], { dur: 1.1, azimut: 50, elevacion: 16 });
  camara.mostrar(d("pala", "pala"), [R.pala, R.cofre], { dur: 0.7, azimut: 45, elevacion: 16 });
  const tVuelta = d("pala", "ancha") + 0.2, tLev = d("pala", "levanta") + 0.55;
  R.pose(tVuelta - 0.2, { cl: 10 }, 0.4);
  R.manejar(tVuelta, tLev - tVuelta - 0.1, [{ recto: 1.0 }, { vuelta: 180, radio: 1.3 }]);   // da la vuelta hacia el montón
  R.pose(tLev - 0.3, { cl: 0, ct: 0 }, 0.25).pose(tLev, { cl: 22, ct: 28 }, 0.5);           // la levanta
  R.cargar(tLev + 0.2, { pala: 1 }, 0.4);
  polvo([-2.9, 0.1, -2.6], tLev + 0.05, { tam: 1.3, n: 9 });
  camara.mostrar(tLev, [R.pala, zonaMonton], { dur: 1.3, azimut: 35, elevacion: 22 });
  // el camión se echa de reversa junto al montón
  const tCam = tVuelta + 0.2;
  const tLlega = d("pala", "volteo") - 0.25;
  mover(C, tCam, { a: [-5.0, 0, -3.6], causa: "lo maneja el chofer" }, tLlega - tCam, "sale");
  C.rodar(tCam, tLlega, -8.4);
  R.manejar(tLev + 0.45, d("pala", "volteo") - tLev - 0.55, [{ recto: 2.3 }]);
  R.pose(tLev + 0.5, { cl: 75 }, d("pala", "volteo") - tLev - 0.6).pose(d("pala", "volteo") + 0.05, { ct: -48 }, 0.4);
  R.cargar(d("pala", "volteo") + 0.2, { pala: 0 }, 0.4);
  C.cargar([[0, 0], [d("pala", "volteo") + 0.2, 0], [d("pala", "volteo") + 0.9, 1]]);
  { const q = R.dondePala(d("pala", "volteo") + 0.3, [0.75, -0.3, 0]);
    terrones({ desde: [q.x, q.y, q.z], hasta: 1.35, t0: d("pala", "volteo") + 0.15, t1: d("pala", "volteo") + 0.75, n: 26, ancho: [0.5, 1.8], ritmo: 2.6 });
    polvo([q.x, 1.4, q.z], d("pala", "volteo") + 0.45, { tam: 1.4, n: 10, abre: 1.4 }); }
  camara.mostrar(d("pala", "volteo"), [R.pala, C.caja], { dur: 0.9, azimut: 30, elevacion: 24 });
  latir(R.pala, d("cargador", "cargador"), { k: 0.08 }); latir(R.brazosC, d("cargador", "cargador") + 0.1, { k: 0.04 });
  R.pose(b("cargador").ini + 0.2, { cl: 40, ct: 0 }, 0.9);
  camara.mostrar(d("cargador", "cargador") + 0.3, [R.cargador, R.cabina, C.caja], { dur: 1.4, azimut: 35, elevacion: 22 });
  camara.mostrar(V.dur - 0.2, [R.cargador, R.cabina, C], { dur: 1.4, azimut: 50, elevacion: 26 });
}
