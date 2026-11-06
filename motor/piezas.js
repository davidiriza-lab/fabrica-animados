// =====================================================================================
//  piezas.js — biblioteca de piezas PREFABRICADAS
//
//  Cada pieza se hace bien UNA vez (proporciones, sin caras empalmadas, nombres) y trae:
//    · puertos con nombre: puerto(pieza, "salida") → dónde conectar tubos y cables
//    · comportamiento: la casa agrega pisos y sube su azotea con todo lo que lleva encima;
//      la base crece cargando lo que tiene encima; la cota mide la altura real y escribe el número.
//  Así la escena se arma por RELACIONES (sobre, conectar, montar) y no con coordenadas sueltas.
//  Uso en escena.js:   const { casa, tinaco, regadera } = M.piezas;
// =====================================================================================
export function instalarPiezas(M) {
  const { THREE, E, caja, cilindro, esfera, tornear, extruir, plano, grupo, luz, letrero, lluvia,
          aparecer, desaparecer, ensamblar, mover, efecto, pista, alFinal, tuberiaViva, puerto, prog } = M;
  const PVC = "#eef2f5";
  const conPuertos = (g, def) => { g.userData.puertos = { ...(g.userData.puertos || {}), ...def }; return g; };
  const P = {};

  // ------------------------------------------------------------------ TERRENO en corte
  // huecos: [{x0, x1, y0, y1}] en la cara del frente (cisternas, fosas). La calle va sobre la franja del frente.
  P.terreno = (o = {}) => {
    const an = o.ancho ?? 26, fo = o.fondo ?? 20, pr = o.profundidad ?? 3, fr = o.frente ?? 2.5;
    const zF = fo / 2, z0 = -fo / 2, zC = zF - fr;
    const g = grupo({ nombre: "terreno" });
    // huecos: {cara: "frente", x0, x1, y0, y1}  ó  {cara: "izquierda", z0, z1, y0, y1} (en el terreno de la casa, no bajo la calle)
    const hs = (o.huecos || []).map((h) => ({ cara: "frente", ...h }));
    const hF = hs.filter((h) => h.cara === "frente"), hI = hs.filter((h) => h.cara === "izquierda");
    const xI = -an / 2 + (hI.length ? fr : 0);   // el bloque principal empieza después de la franja izquierda
    caja(an / 2 - xI, pr, fo - fr, "tierra", { padre: g, estructura: true, pos: [(xI + an / 2) / 2, -pr, (z0 + zC) / 2], nombre: "terreno" });
    extruir([[-an / 2, -pr], [an / 2, -pr], [an / 2, 0], [-an / 2, 0]], fr, "tierra", { padre: g, estructura: true, pos: [0, 0, (zC + zF) / 2], nombre: "corte del frente",
      hoyos: hF.map((h) => [[h.x0, h.y0], [h.x0, h.y1], [h.x1, h.y1], [h.x1, h.y0]]) });
    if (hI.length) {   // franja izquierda (de z0 a zC), girada: el eje x de la forma corre a lo largo de z
      extruir([[z0, -pr], [zC, -pr], [zC, 0], [z0, 0]], fr, "tierra", { padre: g, estructura: true, pos: [-an / 2 + fr / 2, 0, 0], rot: [0, -90, 0], nombre: "corte lateral",
        hoyos: hI.map((h) => [[h.z0, h.y0], [h.z0, h.y1], [h.z1, h.y1], [h.z1, h.y0]]) });
    }
    g.huecos = hs.map((h, i) => h.cara === "frente"
      ? { ...h, ancho: h.x1 - h.x0, fondo: fr, centro: [(h.x0 + h.x1) / 2, (h.z0 ?? zC + fr / 2), zF], rotY: 0,
          tapon: caja(h.x1 - h.x0, h.y1 - h.y0, fr, "tierra", { padre: g, estructura: true, pos: [(h.x0 + h.x1) / 2, h.y0, (zC + zF) / 2], nombre: `tierra del hueco ${i + 1}` }) }
      : { ...h, ancho: h.z1 - h.z0, fondo: fr, centro: [-an / 2, 0, (h.z0 + h.z1) / 2], rotY: -90,
          tapon: caja(fr, h.y1 - h.y0, h.z1 - h.z0, "tierra", { padre: g, estructura: true, pos: [-an / 2 + fr / 2, h.y0, (h.z0 + h.z1) / 2], nombre: `tierra del hueco ${i + 1}` }) });
    const derecha = o.calle === "derecha";
    const cZ0 = zF - (o.anchoCalle ?? 3.2), bZ0 = cZ0 - (o.anchoBanqueta ?? 1.4);
    const cX0 = an / 2 - (o.anchoCalle ?? 3.2), bX0 = cX0 - (o.anchoBanqueta ?? 1.4);
    let bZ0b = bZ0, cZ0b = cZ0;
    if (!derecha) {
      caja(an - 0.04, 0.06, zF - cZ0 - 0.02, "#62666e", { padre: g, estructura: true, pos: [0, 0, (cZ0 + zF - 0.02) / 2], tinta: false, nombre: "calle" });
      g.banqueta = caja(an - 0.04, 0.18, cZ0 - bZ0, "concreto", { padre: g, estructura: true, pos: [0, 0, (bZ0 + cZ0) / 2], nombre: "banqueta" });
      for (let x = -an / 2 + 1; x < an / 2 - 1; x += 3) caja(1.4, 0.05, 0.16, "blanco", { padre: g, estructura: true, pos: [x, 0.06, (cZ0 + zF) / 2], tinta: false, capa: true, nombre: "raya" });
      plano(an - 0.04, bZ0 - z0 - 0.02, "pasto", { padre: g, estructura: true, pos: [0, 0.01, (z0 + bZ0) / 2], manchas: true, nombre: "pasto" });
    } else {   // la calle corre a lo largo de z, a la derecha: de lado se ve en corte
      caja(an / 2 - cX0 - 0.02, 0.06, fo - 0.04, "#62666e", { padre: g, estructura: true, pos: [(cX0 + an / 2) / 2, 0, 0], tinta: false, nombre: "calle" });
      g.banqueta = caja(cX0 - bX0, 0.18, fo - 0.04, "concreto", { padre: g, estructura: true, pos: [(bX0 + cX0) / 2, 0, 0], nombre: "banqueta" });
      plano(bX0 + an / 2 - 0.02, fo - 0.04, "pasto", { padre: g, estructura: true, pos: [(bX0 - an / 2) / 2, 0.01, 0], manchas: true, nombre: "pasto" });
      bZ0b = z0; cZ0b = zF;
    }
    if (M.estilo === "plano") {   // de lado, el pasto (horizontal) no se ve: franja de pasto y capas de tierra en el corte
      const xMax = derecha ? bX0 : an / 2;
      caja(xMax + an / 2 - 0.02, 0.14, 0.3, "pasto", { padre: g, estructura: true, pos: [(xMax - an / 2) / 2, 0, zF - 0.15], nombre: "orilla de pasto" });
      const libres = (x0, x1) => {   // tramos de [x0, x1] que no pisan un hueco del frente
        let tr = [[x0, x1]];
        for (const h of hF) tr = tr.flatMap(([a, b]) => (h.x1 <= a || h.x0 >= b ? [[a, b]] : [[a, h.x0], [h.x1, b]].filter(([p2, q2]) => q2 - p2 > 0.05)));
        return tr;
      };
      [[-0.55, -0.25, "#8c5a34"], [-1.6, -1.35, "#6f4429"], [-2.45, -2.25, "#5e3a24"]].forEach(([y0, y1, color]) => {
        for (const [a, b] of (hF.some((h) => y1 > h.y0 && y0 < h.y1) ? libres(-an / 2, an / 2) : [[-an / 2, an / 2]])) caja(b - a, y1 - y0, 0.02, color, { padre: g, estructura: true, pos: [(a + b) / 2, y0, zF + 0.011], tinta: false, capa: true, nombre: "capa de tierra" });
      });
    }
    g.frenteZ = zF;
    g.calleDerecha = derecha;
    g.xTuberia = (cX0 + an / 2) / 2;
    g.suelo = (x, z) => [x, derecha ? (x >= bX0 && x <= cX0 ? 0.18 : 0.01) : (z >= bZ0 && z <= cZ0 ? 0.18 : 0.01), z];   // punto sobre el piso: pasto o banqueta
    g.yTuberia = o.yTuberia ?? -0.6;
    // tubería general de la calle: medio expuesta en el corte
    g.tuberiaGeneral = (t0, oo = {}) => tuberiaViva(derecha ? [[g.xTuberia, g.yTuberia, z0 + 0.1], [g.xTuberia, g.yTuberia, zF]] : [[-an / 2 + 0.1, g.yTuberia, zF], [an / 2 - 0.1, g.yTuberia, zF]], 0.16, "acero", { nombre: "tubería de la calle", t0, dur: 1.0, ...oo });
    // punto de la tubería general para sacar tomas: en x (calle de frente) o en z (calle a la derecha)
    g.enTuberia = (q) => (derecha ? [g.xTuberia, g.yTuberia, q] : [q, g.yTuberia, zF]);
    g.excavar = (i, t) => { desaparecer(g.huecos[i].tapon, t, { modo: "caer", dur: 0.5 }); return g.huecos[i]; };
    return g;
  };

  // ------------------------------------------------------------------ CISTERNA dentro de un hueco del terreno
  P.cisterna = (hueco, t, o = {}) => {
    const { ancho: A, fondo: F, y0, y1 } = hueco, e = 0.15, m = 0.01;
    const g = grupo({ pos: [hueco.centro[0], 0, hueco.centro[2]], rot: [0, hueco.rotY, 0], nombre: "cisterna" });   // local: x a lo largo, z hacia afuera (la boca)
    const h = y1 - y0 - e - 2 * m, zA = -F + m, zB = -m;   // de la pared del fondo a la boca
    caja(A - 2 * m, e, F - 2 * m, "concreto", { padre: g, estructura: true, pos: [0, y0 + m, (zA + zB) / 2], nombre: "piso de la cisterna" });
    caja(e, h, F - 2 * m, "concreto", { padre: g, estructura: true, pos: [-A / 2 + m + e / 2, y0 + m + e, (zA + zB) / 2], nombre: "muro de la cisterna" });
    caja(e, h, F - 2 * m, "concreto", { padre: g, estructura: true, pos: [A / 2 - m - e / 2, y0 + m + e, (zA + zB) / 2], nombre: "muro de la cisterna" });
    caja(A - 2 * m - 2 * e, h, e, "concreto", { padre: g, estructura: true, pos: [0, y0 + m + e, zA + e / 2], nombre: "muro de la cisterna" });
    ensamblar(g, t, { modo: "subir", alto: h, escalon: 0.1 });
    // el agua es PARTE de la cisterna (si fuera pieza aparte, para la cámara "taparía" a la cisterna)
    g.agua = caja(A - 2 * m - 2 * e - 0.02, h * 0.8, F - 2 * m - e - 0.06, "agua", { padre: g, pos: [0, y0 + m + e, (zA + e + zB) / 2], tinta: false, nombre: "agua de la cisterna", noAlerta: true });
    g.agua.scale.y = 0.001;
    g.nivel = (claves) => pista(g.agua, "scale.y", claves);
    return conPuertos(g, {
      entrada: { pos: [A / 2 - 0.35, y1 - 0.15, zB - 0.45], dir: [0, 1, 0] },        // llenado: esquina del lado de la calle, cerca de la boca
      succion: { pos: [-A / 2 + 0.6, y0 + 0.45, (zA + zB) / 2], dir: [0, 1, 0] },     // succión: al otro extremo
      tapa: { pos: [-A / 2 + 0.6, 0, (zA + zB) / 2], dir: [0, 1, 0] },               // a ras de suelo, encima de la succión (ahí va la bomba)
    });
  };

  // ------------------------------------------------------------------ CASA en corte (sin muro de enfrente)
  // casa.agregarPiso(t): el piso nuevo CRECE desde la losa y la azotea sube con la misma curva,
  // así que todo lo que está sobre(casa) —tinaco, base, antenas— sube montado y nunca flota.
  P.casa = (o = {}) => {
    const an = o.ancho ?? 7, fo = o.fondo ?? 6, al = o.alto ?? 3, ml = 0.15, gl = 0.25, xb = o.bano ?? 1.2;
    const g = grupo({ pos: o.pos || [0, 0, 0], nombre: "casa" });
    caja(an, 0.15, fo, "concreto", { padre: g, nombre: "piso", estructura: true });
    const azotea = grupo({ padre: g, nombre: "azotea" });
    azotea.userData.alto = 0;
    g.userData.apoyo = azotea;
    g.azotea = azotea;
    g.pisos = [];
    let techo = 0.15;
    const hacerPiso = () => {
      const p = grupo({ padre: g, pos: [0, techo, 0], nombre: `piso ${g.pisos.length + 1}` });
      const hm = al - 0.15;
      p.muros = {
        atras: caja(an - 2 * ml, hm, ml, "muro", { padre: p, estructura: true, pos: [0, 0, -fo / 2 + ml / 2], nombre: "muro de atrás" }),
        izquierdo: caja(ml, hm, fo, "muro", { padre: p, estructura: true, pos: [-an / 2 + ml / 2, 0, 0], nombre: "muro izquierdo" }),
        derecho: caja(ml, hm, fo, "muro", { padre: p, estructura: true, pos: [an / 2 - ml / 2, 0, 0], nombre: "muro derecho" }),
      };
      p.azulejo = caja(2.2, hm - 0.5, 0.02, "#bfe6f2", { padre: p, pos: [xb + 0.1, 0.15, -fo / 2 + ml + 0.01], capa: true, tinta: false, nombre: "azulejo", revisar: false });
      caja(an + 0.3, gl, fo + 0.3, "concreto", { padre: p, pos: [0, hm, 0], nombre: "losa", estructura: true });
      const l = luz([0, 0, 0]); p.add(l); l.position.set(xb, hm * 0.75, 0.5);
      const reg = P.regadera({ nombre: `regadera del piso ${g.pisos.length + 1}` });
      p.add(reg); reg.position.set(xb, hm - 0.75, -fo / 2 + ml + 0.4);
      reg.userData.alturaChorro = hm - 0.75;
      p.regadera = reg;
      // zonas de encuadre: el baño completo (piso a techo) y el cuarto entero, para tomas de interior con contexto
      p.bano = M.zona(2.8, hm, 2.6, { padre: p, pos: [xb, 0, -fo / 2 + ml + 1.3], nombre: `baño del piso ${g.pisos.length + 1}` });
      p.cuarto = M.zona(an - 2 * ml, hm, fo - ml, { padre: p, pos: [0, 0, ml / 2], nombre: `cuarto del piso ${g.pisos.length + 1}` });
      p.userData.alto = hm + gl;
      g.pisos.push(p);
      techo += p.userData.alto;
      return p;
    };
    for (let i = 0; i < (o.pisos ?? 1); i++) hacerPiso();
    azotea.position.y = techo;
    const lado = (s) => ({ pos: [s * (an / 2 + 0.15), 0.4, fo / 2 - 0.8], dir: [0, 1, 0] });
    conPuertos(g, { esquinaDerecha: lado(1), esquinaIzquierda: lado(-1) });                     // abajo, por fuera del muro
    conPuertos(azotea, { esquinaDerecha: { ...lado(1), pos: [an / 2 + 0.15, 0.4, fo / 2 - 0.8] }, esquinaIzquierda: { ...lado(-1), pos: [-an / 2 - 0.15, 0.4, fo / 2 - 0.8] } });
    // armar: el piso y cada muro/losa de los pisos iniciales caen uno por uno (la regadera la decide la escena)
    g.armar = (t, oo = {}) => {
      // el piso, los muros, la REGADERA (es parte del baño: existe desde que se arma) y al final la losa
      const piezas = [g.children[0], ...g.pisos.flatMap((p) => { const ms = p.children.filter((h) => h.isMesh && !h.userData.soloEncuadre); const losa = ms.filter((h) => h.name === "losa"); return [...ms.filter((h) => h.name !== "losa"), p.regadera, ...losa]; })];
      ensamblar(g, t, { total: 0.9, alto: 2.5, piezas, tapadaOk: true, ...oo });   // la losa tapa lo de adentro: es normal
      return g;
    };
    g.agregarPiso = (t, oo = {}) => {
      const dur = oo.dur ?? 0.9;
      const p = hacerPiso();
      aparecer(p, t, { modo: "desplegar", dur });
      mover(azotea, t, { por: [0, p.userData.alto, 0] }, dur, "resorte");
      return p;
    };
    return g;
  };

  // ------------------------------------------------------------------ REGADERA
  // La cabeza sale de un BRAZO empotrado en el muro (hacia −z, largo o.brazo): nunca cuelga en el aire.
  // El agua llega por el muro al puerto "entrada" (en la pared, arriba del brazo).
  P.regadera = (o = {}) => {
    const br = o.brazo ?? 0.4;
    const g = grupo({ nombre: o.nombre || "regadera" });
    cilindro(0.16, 0.05, 0.12, "metal", { padre: g, base: false, nombre: "regadera" });
    cilindro(0.03, 0.03, br, "metal", { padre: g, pos: [0, 0.07, -br / 2], rot: [90, 0, 0], base: false, nombre: "brazo de la regadera" });
    cilindro(0.03, 0.03, 0.1, "metal", { padre: g, pos: [0, 0.04, 0], base: false, nombre: "cuello de la regadera" });
    conPuertos(g, { entrada: { pos: [0, 0.12, -br + 0.02], dir: [0, 1, 0] } });
    // chorro: fuerte | debil | lodo
    g.chorro = (t0, t1, tipo = "fuerte") => {
      g.updateMatrixWorld(true);
      const w = g.getWorldPosition(new THREE.Vector3()), h = g.userData.alturaChorro ?? 2;
      const cfg = { fuerte: { n: 70, tam: 0.34, color: "#5fb8ff", largo: 0.2, vel: 6, grosor: 3 }, debil: { n: 9, tam: 0.07, color: "#5fb8ff", largo: 0.09, vel: 2.4, grosor: 6 },   // gotas gordas y lentas: "chorrito triste"
        lodo: { n: 70, tam: 0.34, color: "#6b4423", largo: 0.24, vel: 5.5, grosor: 4.5 } }[tipo];
      return lluvia({ centro: [w.x, w.y - h, w.z], tam: [cfg.tam, h, cfg.tam], n: cfg.n, largo: cfg.largo, vel: cfg.vel, color: cfg.color, grosor: cfg.grosor, opacidad: 0.95, t0, t1, nombre: `chorro ${tipo}` });
    };
    return g;
  };

  // ------------------------------------------------------------------ TINACO (translúcido; el agua es opaca)
  P.tinaco = (o = {}) => {
    const g = grupo({ nombre: o.nombre || "tinaco" });
    tornear([[0, 0], [0.72, 0], [0.76, 0.06], [0.76, 1.32], [0.6, 1.58], [0.26, 1.72], [0, 1.75]], o.color || "#2b2e35", { padre: g, vidrio: true, opacidad: 0.4, casco: false, nombre: "tinaco" });
    const agua = cilindro(0.7, 0.7, 1.3, "agua", { padre: g, pos: [0, 0.04, 0], tinta: false, nombre: "agua del tinaco", noEncuadrar: true, noAlerta: true });
    g.userData.alertaConMarca = true;   // envase translúcido: la alerta va como "!" encima, no tiñendo el agua
    agua.scale.y = 0.001;
    cilindro(0.08, 0.08, 0.12, PVC, { padre: g, pos: [-0.8, 0.2, 0], rot: [0, 0, 90], base: false, nombre: "salida del tinaco" });
    g.agua = agua;
    g.nivel = (claves) => pista(agua, "scale.y", claves);
    // flotador: bola + brazo + válvula en la entrada, como UNA pieza; el brazo gira con la bola (sube con el agua)
    g.flotador = (t) => {
      const valvula = cilindro(0.06, 0.06, 0.14, "metal", { padre: g, pos: [0, 1.58, 0], base: false, nombre: "válvula del flotador", revisar: false });   // va justo bajo el tubo que entra
      const piv = grupo({ padre: g, pos: [0, 1.5, 0], nombre: "flotador" });
      const brazo = cilindro(0.022, 0.022, 0.42, "metal", { padre: piv, pos: [0.21, 0, 0], rot: [0, 0, 90], base: false, nombre: "brazo del flotador" });
      const bola = esfera(0.16, "naranja", { padre: piv, pos: [0.42, 0, 0], nombre: "bola del flotador" });
      aparecer(valvula, t, { modo: "pop" }); aparecer(piv, t, { modo: "pop" });
      M.cadaCuadro(() => { const yb = Math.min(1.42, 0.12 + 1.3 * agua.scale.y); piv.rotation.z = Math.asin(Math.max(-1, Math.min(1, (yb - 1.5) / 0.42))); });
      g.valvula = valvula;
      return bola;
    };
    return conPuertos(g, {
      entrada: { pos: [0, 1.74, 0], dir: [0, 1, 0] },
      salida: { pos: [-0.86, 0.2, 0], dir: [-1, 0, 0] },
      jarro: { pos: [-1.16, 0.2, 0], dir: [0, 1, 0] },
      fondo: { pos: [0, 0, 0], dir: [0, -1, 0] },
    });
  };
  // Jarro de aire: tubo abierto que sube desde la salida del tinaco más alto que el tinaco (anclado: sube con él)
  P.jarroDeAire = (tin, o = {}) => {
    const p = (x, y) => M.punto(tin, [x, y, 0]);
    const tubo = tuberiaViva([puerto(tin, "jarro"), p(-1.16, 2.35), p(-1.46, 2.35), p(-1.46, 2.15)], 0.06, PVC, { nombre: "jarro de aire", ...o });
    tubo.boca = [-1.46, 2.15, 0];   // local al tinaco: la boca (abre hacia abajo)
    // tapar(t0, t1): un tapón (trapo) metido en la boca; en t1 el aire atrapado lo bota
    tubo.tapar = (t0, t1) => {
      const tap = grupo({ padre: tin, pos: [-1.46, 2.15, 0], nombre: "trapo que tapa el jarro", flota: true });   // metido en la boca
      cilindro(0.05, 0.05, 0.14, "#8a6a4a", { padre: tap, pos: [0, -0.02, 0], base: false, nombre: "trapo" });          // dentro del tubo
      esfera(0.085, "#8a6a4a", { padre: tap, pos: [0, -0.1, 0], escala: [1, 0.7, 1], nombre: "trapo" });              // lo que asoma
      aparecer(tap, t0, { modo: "pop" });
      M.alerta(tap, t0, t1, { marca: true });
      M.mover(tap, t1, { por: [-0.3, -1.3, 0.4], causa: "el aire atrapado lo bota" }, 0.7, "entra");
      const soplo = M.brillo("#ffffff", { padre: tin, pos: [-1.46, 2.05, 0], tam: 0.01, opacidad: 0.95 });   // el soplido de aire que lo bota
      M.cadaCuadro((tt) => { const k = (tt - t1) / 0.5; soplo.visible = k >= 0 && k <= 1; if (soplo.visible) soplo.scale.setScalar(0.2 + 1.1 * Math.sin(k * Math.PI)); });
      desaparecer(tap, t1 + 0.6, { dur: 0.2 });
      return tap;
    };
    return tubo;
  };

  // ------------------------------------------------------------------ MEDIDOR, BOMBA, FILTRO
  P.medidor = () => {
    const g = grupo({ nombre: "medidor" });
    caja(0.55, 0.4, 0.4, "azul", { padre: g });
    cilindro(0.13, 0.13, 0.03, "blanco", { padre: g, pos: [0, 0.415, 0.02], base: false, nombre: "carátula del medidor" });   // la carátula va arriba: de frente parecía la boca del tubo
    cilindro(0.02, 0.02, 0.12, "negro", { padre: g, pos: [0.03, 0.435, 0.02], rot: [0, 0, 90], base: false, tinta: false, nombre: "aguja del medidor" });
    return conPuertos(g, { entrada: { pos: [0, 0.12, 0.2], dir: [0, 0, 1] }, salida: { pos: [0, 0.22, -0.2], dir: [0, 0, -1] } });
  };
  P.bomba = () => {
    const g = grupo({ nombre: "bomba" });
    caja(0.7, 0.45, 0.45, "azul", { padre: g });
    cilindro(0.2, 0.2, 0.5, "rojo", { padre: g, pos: [0.55, 0.22, 0], rot: [0, 0, 90], base: false });
    return conPuertos(g, { succion: { pos: [-0.2, 0.15, 0.22], dir: [0, 0, 1] }, salida: { pos: [0, 0.45, -0.22], dir: [0, 0, -1] } });
  };
  // Filtro de sedimentos EN LÍNEA: un vaso transparente coaxial al tubo, con el cartucho adentro.
  // Su eje es el y local; montar(filtro, tubo, {desdeFin}) lo alinea solo con el tramo donde queda.
  P.filtro = () => {
    const g = grupo({ nombre: "filtro de sedimentos" });
    g.userData.enLinea = true;
    cilindro(0.16, 0.16, 0.52, "#dfe8ef", { padre: g, base: false, vidrio: true, opacidad: 0.5, casco: false, nombre: "vaso del filtro" });
    cilindro(0.085, 0.085, 0.44, "#e8dcc6", { padre: g, base: false, nombre: "cartucho" });
    cilindro(0.19, 0.19, 0.08, "azul", { padre: g, pos: [0, 0.28, 0], base: false, nombre: "tapa del filtro" });
    cilindro(0.19, 0.19, 0.08, "azul", { padre: g, pos: [0, -0.28, 0], base: false, nombre: "tapa del filtro" });
    return g;
  };

  // ------------------------------------------------------------------ BASE (estructura que levanta lo que tiene encima)
  // base.crecer(t): patas y repisa crecen y lo que está sobre(base) sube con la MISMA curva.
  P.base = (o = {}) => {
    const alto = o.alto ?? 2, an = o.ancho ?? 1.5, a2 = an / 2 - 0.1;
    const g = grupo({ nombre: o.nombre || "base del tinaco" });
    const patas = grupo({ padre: g, nombre: "patas de la base" });
    for (const [x, z] of [[-a2, -a2], [a2, -a2], [-a2, a2], [a2, a2]]) caja(0.1, alto - 0.1, 0.1, "acero", { padre: patas, pos: [x, 0, z] });
    caja(an - 0.3, 0.06, 0.06, "acero", { padre: patas, pos: [0, alto / 2, -a2] });
    caja(an - 0.3, 0.06, 0.06, "acero", { padre: patas, pos: [0, alto / 2, a2] });
    caja(an + 0.3, 0.1, an + 0.3, "acero", { padre: patas, pos: [0, alto - 0.1, 0], nombre: "repisa de la base" });
    const apoyo = grupo({ padre: g, nombre: "apoyo de la base" });
    apoyo.userData.alto = 0;
    g.userData.apoyo = apoyo;
    patas.visible = false;
    g.crecer = (t, dur = 0.9) => {
      aparecer(patas, t, { modo: "desplegar", dur });
      efecto(apoyo, (tt, x) => { x.position.y = tt < t ? 0 : alto * E.resorte(prog(tt, t, dur)); });
      return g;
    };
    return g;
  };

  // ------------------------------------------------------------------ COTA que mide de verdad
  // Línea vertical entre dos puntos vivos (funciones o puertos); escribe la altura real ("1 m", "3 m").
  P.cota = (desde, hasta, o = {}) => {
    const g = grupo({ nombre: o.nombre || "cota", flota: true });
    const color = o.color || "amarillo";
    const linea = cilindro(0.025, 0.025, 1, color, { padre: g, tinta: false, sombra: false, flota: true, nombre: "línea de la cota" });
    const ab = caja(0.4, 0.04, 0.04, color, { padre: g, tinta: false, sombra: false, flota: true, nombre: "marca de la cota" });
    const ar = caja(0.4, 0.04, 0.04, color, { padre: g, tinta: false, sombra: false, flota: true, nombre: "marca de la cota" });
    const etiquetas = new Map();
    const desfase = new THREE.Vector3(...(o.desfase || [0, 0, 0]));
    // líneas de referencia: de cada punto medido a la cota (así se ve QUÉ mide)
    const refA = cilindro(0.012, 0.012, 1, color, { padre: g, base: false, tinta: false, sombra: false, flota: true, noEncuadrar: true, nombre: "referencia de la cota" });
    const refB = cilindro(0.012, 0.012, 1, color, { padre: g, base: false, tinta: false, sombra: false, flota: true, noEncuadrar: true, nombre: "referencia de la cota" });
    const rotA = o.abajo ? letrero(o.abajo, { padre: g, alto: 0.38, fondo: "#ffffff", nombre: `rótulo «${o.abajo}»` }) : null;
    const rotB = o.arriba ? letrero(o.arriba, { padre: g, alto: 0.38, fondo: "#ffffff", nombre: `rótulo «${o.arriba}»` }) : null;
    const ref = (m, desdeL, y) => { const d2 = desdeL.clone().setY(0), L = Math.max(0.01, d2.length()); m.position.set(d2.x / 2, y, d2.z / 2); m.scale.set(1, L, 1); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d2.normalize()); };
    alFinal(() => {
      const a0 = typeof desde === "function" ? desde() : new THREE.Vector3(...desde);
      const b0 = typeof hasta === "function" ? hasta() : new THREE.Vector3(...hasta);
      const a = a0.clone().add(desfase), b = b0.clone().add(desfase);
      const h = Math.max(0.05, b.y - a.y);
      g.position.copy(g.parent.worldToLocal(a.clone()));
      linea.scale.y = h; ar.position.y = h; ab.position.y = 0;
      ref(refA, a0.clone().sub(a), 0); ref(refB, b0.clone().sub(b), h);
      const texto = `${Math.round(h * 2) / 2} m`.replace(".0 ", " ").replace(".", ",");
      if (!etiquetas.has(texto)) etiquetas.set(texto, letrero(texto, { padre: g, alto: 0.42, fondo: "#ffd23f", nombre: `cota «${texto}»` }));
      for (const [k, e] of etiquetas) { e.visible = k === texto; e.position.set(0.6, h / 2, 0); }
      if (rotA) rotA.position.set(0.75, 0, 0); if (rotB) rotB.position.set(0.75, h, 0);
      g.updateMatrixWorld(true);
    });
    return g;
  };

  // ------------------------------------------------------------------ PERSONA (formas primitivas)
  // Cuerpo = una forma (trapecio), cabeza = círculo con gorro de pelo, brazos y piernas = líneas. Origen en los pies.
  // Es un AGENTE: puede moverse y lo que carga (hijo de .mano) se mueve con ella sin que el revisor proteste.
  P.persona = (o = {}) => {
    const g = grupo({ nombre: o.nombre || "persona" });
    g.userData.agente = true;
    const c = o.color || "naranja", piel = o.piel || "#f1c6a6", linea = o.linea || "negro";
    cilindro(0.025, 0.025, 0.8, linea, { padre: g, pos: [-0.1, 0, 0], tinta: false, nombre: "pierna" });
    cilindro(0.025, 0.025, 0.8, linea, { padre: g, pos: [0.1, 0, 0], tinta: false, nombre: "pierna" });
    cilindro(0.18, 0.3, 0.75, c, { padre: g, pos: [0, 0.78, 0], lados: 4, rot: [0, 45, 0], nombre: "cuerpo" });
    esfera(0.17, piel, { padre: g, pos: [0, 1.75, 0], nombre: "cabeza" });
    esfera(0.18, o.pelo || "#2b211c", { padre: g, pos: [0, 1.82, -0.03], escala: [1, 0.6, 1], nombre: "pelo" });
    cilindro(0.022, 0.022, 0.55, linea, { padre: g, pos: [0.3, 1.0, 0], rot: [0, 0, -20], tinta: false, nombre: "brazo" });
    cilindro(0.022, 0.022, 0.55, linea, { padre: g, pos: [-0.3, 1.0, 0], rot: [0, 0, 20], tinta: false, nombre: "brazo" });
    g.mano = grupo({ padre: g, pos: [0.42, 0.95, 0], nombre: "mano" });
    // subirPor(escalera, t0, t1, veces): sube y baja con los pies SOBRE los peldaños (del lado de afuera)
    g.subirPor = (esc, t0, t1, veces = 1) => {
      M.raiz.updateMatrixWorld(true);
      const pie = esc.localToWorld(new THREE.Vector3(0, 0.35, 0)), arriba = esc.localToWorld(new THREE.Vector3(0, esc.userData.alto ?? 2.4, 0));
      const pared = esc.userData.recargadaEn ? new THREE.Box3().setFromObject(esc.userData.recargadaEn).getCenter(new THREE.Vector3()) : pie.clone();
      const afuera = pie.clone().sub(pared).setY(0).normalize().multiplyScalar(0.16);   // lado contrario a la pared
      M.efecto(g, (tt, x) => {
        if (tt < t0) { x.position.copy(pie).add(afuera).setY(pie.y - 0.35); return; }
        const k = 0.5 - 0.5 * Math.cos(Math.min(1, (tt - t0) / (t1 - t0)) * Math.PI * 2 * veces);
        x.position.copy(pie).lerp(arriba, k).add(afuera);
        x.position.y -= 0.35 * (1 - k);
      });
      return g;
    };
    return g;
  };

  // ------------------------------------------------------------------ AMBIENTE
  P.arbol = (o = {}) => {
    const a = grupo({ pos: o.pos, nombre: "árbol" });
    if (M.estilo === "maqueta") {   // low-poly facetado, como las maquetas de las referencias
      cilindro(0.14, 0.2, 1.7, "#6b4a30", { padre: a, lados: 6, facetado: true });
      const copa = (r, p, tono) => M.malla(new THREE.IcosahedronGeometry(r, 0), tono, { padre: a, pos: p, facetado: true, aristas: false, nombre: "copa" });
      copa(o.copa ?? 1.2, [0, 2.4, 0], "#4f9a3a"); copa(0.85, [0.6, 1.9, 0.35], "#5fae45"); copa(0.7, [-0.5, 2.0, -0.3], "#478c33");
      return a;
    }
    cilindro(0.18, 0.24, 1.6, "madera", { padre: a });
    esfera(o.copa ?? 1.25, "verde", { padre: a, pos: [0, 2.3, 0] });
    esfera(0.85, "verde", { padre: a, pos: [0.7, 1.9, 0.3] });
    return a;
  };
  P.nube = (o = {}) => {
    const n = grupo({ pos: o.pos, flota: true, nombre: "nube" });
    [[0, 0, 0, 2], [1.9, -0.3, 0, 1.5], [-1.8, -0.4, 0, 1.4], [0.6, 0.9, 0, 1.3]].forEach(([a, b, c, r]) => esfera(r, "blanco", { padre: n, pos: [a, b, c], sombra: false, flota: true }));
    return n;
  };
  P.escalera = (o = {}) => {
    const al = o.alto ?? 3.4;
    const e = grupo({ nombre: "escalera" });
    caja(0.07, al, 0.07, "madera", { padre: e, pos: [0, 0, -0.3] });
    caja(0.07, al, 0.07, "madera", { padre: e, pos: [0, 0, 0.3] });
    for (let y = 0.35; y < al - 0.1; y += 0.42) caja(0.06, 0.05, 0.6, "madera", { padre: e, pos: [0, y, 0] });
    return e;
  };
  P.cubeta = () => tornear([[0, 0], [0.18, 0], [0.24, 0.34], [0.25, 0.36], [0, 0.36]], "naranja", { flota: true, nombre: "cubeta" });

  // =================================================================== PIZARRA (íconos planos, de frente)
  // Todo vive en el plano z≈0 y mira a la cámara. Se usan con aparecer(…, {modo: "dibujar"}).
  const Z = 0.06;   // grosor de los íconos
  const redondo = (an, al, r = 0.12) => {   // contorno de rectángulo redondeado (para extruir)
    const pts = [], k = 6;
    const esq = [[an / 2 - r, al / 2 - r, 0], [-an / 2 + r, al / 2 - r, 90], [-an / 2 + r, -al / 2 + r, 180], [an / 2 - r, -al / 2 + r, 270]];
    for (const [cx, cy, a0] of esq) for (let i = 0; i <= k; i++) { const a2 = ((a0 + (90 * i) / k) * Math.PI) / 180; pts.push([cx + r * Math.cos(a2), cy + r * Math.sin(a2)]); }
    return pts;
  };
  const tabla = (an, al, color, o = {}) => extruir(redondo(an, al, o.r ?? 0.12), o.z ?? Z, color, { angulo: 50, ...o });
  const disco = (r, color, o = {}) => cilindro(r, r, o.z ?? Z, color, { rot: [90, 0, 0], base: false, lados: 40, angulo: 50, ...o });
  const texto = (t, o = {}) => letrero(t, { alto: o.alto ?? 0.32, color: o.color || "#1d1d1f", fondo: o.fondo, ...o, miraCamara: false });
  const pz = {};
  pz.celular = (o = {}) => {
    const g = grupo({ pos: o.pos, nombre: o.nombre || "celular" });
    tabla(1.15, 2.05, "#26282f", { padre: g, r: 0.16, nombre: "celular" });
    tabla(0.98, 1.72, "#ffffff", { padre: g, pos: [0, -0.02, 0.04], r: 0.06, z: 0.02, tinta: false, nombre: "pantalla" });
    caja(0.28, 0.04, 0.02, "#555", { padre: g, pos: [0, 0.9, 0.05], tinta: false, base: false, nombre: "bocina" });
    g.pantalla = grupo({ padre: g, pos: [0, -0.02, 0.07], nombre: "contenido del celular" });
    return conPuertos(g, { abajo: { pos: [0, -1.1, 0], dir: [0, -1, 0] }, arriba: { pos: [0, 1.1, 0], dir: [0, 1, 0] }, izq: { pos: [-0.65, 0, 0], dir: [-1, 0, 0] }, der: { pos: [0.65, 0, 0], dir: [1, 0, 0] } });
  };
  // una foto dentro de la pantalla: montaña y sol
  pz.foto = (padre, o = {}) => {
    const g = grupo({ padre, pos: o.pos || [0, 0.25, 0], nombre: "foto" });
    caja(0.8, 0.62, 0.01, "#bfe3f5", { padre: g, base: false, tinta: false, nombre: "cielo de la foto" });
    extruir([[-0.4, -0.31], [-0.1, 0.08], [0.08, -0.12], [0.22, 0.02], [0.4, -0.31]], 0.012, "#7cc96a", { padre: g, pos: [0, 0, 0.01], tinta: false, nombre: "montaña" });
    disco(0.08, "#ffd23f", { padre: g, pos: [0.25, 0.17, 0.012], z: 0.01, tinta: false, nombre: "sol de la foto" });
    return g;
  };
  pz.boton = (t, o = {}) => {
    const g = grupo({ padre: o.padre, pos: o.pos, nombre: `botón «${t}»` });
    tabla(o.ancho ?? 0.82, o.alto ?? 0.24, o.color || "#2f6fdc", { padre: g, r: 0.1, z: 0.03 });
    texto(t, { padre: g, pos: [0, 0, 0.03], alto: (o.alto ?? 0.24) * 0.62, color: "#ffffff" });
    return g;
  };
  pz.pagina = (o = {}) => {   // ventana de navegador: barra, título, imagen y UN botón
    const g = grupo({ pos: o.pos, nombre: o.nombre || "página" });
    const an = o.ancho ?? 2.3, al = o.alto ?? 2.7;
    tabla(an, al, "#ffffff", { padre: g, r: 0.1, nombre: "página" });
    caja(an - 0.02, 0.28, 0.02, "#e9eaee", { padre: g, pos: [0, al / 2 - 0.15, 0.035], base: false, tinta: false, nombre: "barra del navegador" });
    [-1, 0, 1].forEach((k) => disco(0.045, ["#e8322b", "#ffd23f", "#2fbf5b"][k + 1], { padre: g, pos: [-an / 2 + 0.22 + k * 0.14 + 0.14, al / 2 - 0.15, 0.05], z: 0.01, tinta: false }));
    g.cuerpo = grupo({ padre: g, pos: [0, -0.12, 0.05], nombre: "contenido de la página" });
    return conPuertos(g, { arriba: { pos: [0, al / 2, 0], dir: [0, 1, 0] }, abajo: { pos: [0, -al / 2, 0], dir: [0, -1, 0] }, izq: { pos: [-an / 2, 0, 0], dir: [-1, 0, 0] }, der: { pos: [an / 2, 0, 0], dir: [1, 0, 0] } });
  };
  pz.lineasTexto = (padre, o = {}) => {   // renglones grises (texto de relleno)
    const g = grupo({ padre, pos: o.pos, nombre: "renglones" });
    (o.anchos || [1.6, 1.3, 1.5]).forEach((w, i) => caja(w, 0.07, 0.01, "#c9ccd1", { padre: g, pos: [0, -i * 0.16, 0], base: false, tinta: false }));
    return g;
  };
  pz.persona = (o = {}) => {   // persona de pizarra: cabeza y cuerpo de formas simples
    const g = grupo({ pos: o.pos, nombre: o.nombre || "persona", escala: o.escala ?? 1 });
    extruir([[-0.26, 0], [0.26, 0], [0.18, 0.5], [-0.18, 0.5]], Z, o.color || "#2f6fdc", { padre: g, nombre: "cuerpo" });
    disco(0.16, o.piel || "#f1c6a6", { padre: g, pos: [0, 0.7, 0], nombre: "cabeza" });
    return g;
  };
  pz.multitud = (n, o = {}) => {
    const g = grupo({ pos: o.pos, nombre: o.nombre || "gente" });
    const rnd = M.azar(o.semilla || 5), colores = o.colores || ["#2f6fdc", "#ff9f1c", "#2fbf5b", "#7b5cff", "#e8322b", "#26282f"];
    g.gente = [];
    const cols = o.columnas ?? Math.ceil(Math.sqrt(n * 2));
    for (let i = 0; i < n; i++) {
      const x = ((i % cols) - (cols - 1) / 2) * (o.sep ?? 0.62) + (rnd() - 0.5) * 0.12, y = -Math.floor(i / cols) * 0.95;
      const p = pz.persona({ color: o.color || colores[Math.floor(rnd() * colores.length)], escala: o.escala ?? 0.7 });
      g.add(p); p.position.set(x, y, 0); g.gente.push(p);
    }
    return g;
  };
  pz.corazon = (o = {}) => extruir([[0, -0.28], [-0.3, 0.02], [-0.3, 0.16], [-0.2, 0.26], [-0.08, 0.24], [0, 0.14], [0.08, 0.24], [0.2, 0.26], [0.3, 0.16], [0.3, 0.02]], Z, o.color || "#e8322b", { pos: o.pos, padre: o.padre, nombre: "like", escala: o.escala ?? 1 });
  pz.diana = (o = {}) => {
    const g = grupo({ pos: o.pos, nombre: o.nombre || "objetivo" });
    [[0.62, "#e8322b"], [0.47, "#ffffff"], [0.32, "#e8322b"], [0.17, "#ffffff"], [0.07, "#e8322b"]].forEach(([r, c], i) => disco(r, c, { padre: g, pos: [0, 0, i * 0.012], z: 0.012, nombre: "anillo" }));
    return g;
  };
  pz.regalo = (o = {}) => {
    const g = grupo({ pos: o.pos, nombre: o.nombre || "regalo" });
    tabla(0.9, 0.7, o.color || "#7b5cff", { padre: g, pos: [0, -0.1, 0], r: 0.04, nombre: "caja del regalo" });
    tabla(1.0, 0.22, o.color || "#7b5cff", { padre: g, pos: [0, 0.34, 0.01], r: 0.04, nombre: "tapa del regalo" });
    caja(0.14, 0.92, 0.02, "#ffd23f", { padre: g, pos: [0, 0.0, 0.07], base: false, tinta: false, nombre: "listón" });
    disco(0.12, "#ffd23f", { padre: g, pos: [-0.12, 0.52, 0.06], z: 0.02, nombre: "moño" }); disco(0.12, "#ffd23f", { padre: g, pos: [0.12, 0.52, 0.06], z: 0.02, nombre: "moño" });
    return g;
  };
  pz.chip = (t = "</>", o = {}) => {
    const g = grupo({ pos: o.pos, padre: o.padre, nombre: o.nombre || "código" });
    tabla(o.ancho ?? 0.74, o.alto ?? 0.5, o.color || "#26282f", { padre: g, r: 0.08 });
    texto(t, { padre: g, pos: [0, 0, Z], alto: 0.32, color: o.colorTexto || "#2fbf5b" });
    return g;
  };
  pz.meta = (o = {}) => {
    const g = grupo({ pos: o.pos, nombre: "Meta" });
    tabla(1.3, 0.62, "#0866ff", { padre: g, r: 0.28 });
    texto("Meta", { padre: g, pos: [0, 0, Z], alto: 0.42, color: "#ffffff" });
    return g;
  };
  pz.burbuja = (t, o = {}) => {   // globo de chat (WhatsApp)
    const g = grupo({ pos: o.pos, nombre: o.nombre || "mensaje" });
    tabla(o.ancho ?? 1.6, o.alto ?? 0.62, o.color || "#25d366", { padre: g, r: 0.2 });
    extruir([[-0.55, -0.3], [-0.3, -0.3], [-0.62, -0.5]], Z, o.color || "#25d366", { padre: g, nombre: "piquito" });
    texto(t, { padre: g, pos: [0, 0, Z], alto: 0.3, color: "#ffffff" });
    return g;
  };
  pz.laptop = (o = {}) => {
    const g = grupo({ pos: o.pos, nombre: o.nombre || "laptop" });
    tabla(2.0, 1.3, "#26282f", { padre: g, pos: [0, 0.25, 0], r: 0.08, nombre: "pantalla de la laptop" });
    caja(1.82, 1.1, 0.02, "#ffffff", { padre: g, pos: [0, 0.25, 0.04], base: false, tinta: false });
    extruir([[-1.25, -0.5], [1.25, -0.5], [1.05, -0.38], [-1.05, -0.38]], Z, "#9aa3ad", { padre: g, nombre: "base de la laptop" });
    g.pantalla = grupo({ padre: g, pos: [0, 0.25, 0.06], nombre: "contenido de la laptop" });
    return g;
  };
  pz.boleto = (t = "BONO", o = {}) => {
    const g = grupo({ pos: o.pos, nombre: o.nombre || "bono" });
    extruir([[-0.8, -0.38], [0.8, -0.38], [0.8, -0.1], [0.7, 0], [0.8, 0.1], [0.8, 0.38], [-0.8, 0.38], [-0.8, 0.1], [-0.7, 0], [-0.8, -0.1]], Z, "#ffd23f", { padre: g });
    texto(t, { padre: g, pos: [0, 0, Z], alto: 0.36, color: "#1d1d1f" });
    return g;
  };
  pz.moneda = (o = {}) => { const g = grupo({ pos: o.pos, padre: o.padre, nombre: "moneda" }); disco(0.22, "#ffd23f", { padre: g }); texto("$", { padre: g, pos: [0, 0, Z], alto: 0.28, color: "#a8740f" }); return g; };
  pz.reloj = (o = {}) => {
    const g = grupo({ pos: o.pos, nombre: o.nombre || "reloj" });
    disco(0.36, "#ffffff", { padre: g });
    caja(0.04, 0.24, 0.02, "#1d1d1f", { padre: g, pos: [0, 0.1, 0.04], base: false, tinta: false, nombre: "manecilla larga" });
    caja(0.18, 0.04, 0.02, "#1d1d1f", { padre: g, pos: [0.1, 0.012, 0.047], base: false, tinta: false, nombre: "manecilla corta" });   // un pelo adelante: no empatan caras
    if (o.texto) texto(o.texto, { padre: g, pos: [0, -0.58, 0], alto: 0.26 });
    return g;
  };
  pz.tache = (o = {}) => { const g = grupo({ pos: o.pos, padre: o.padre, nombre: "tache" }); [45, -45].forEach((r) => caja(o.largo ?? 0.7, 0.1, 0.02, "#e8322b", { padre: g, rot: [0, 0, r], base: false, pos: [0, 0, 0.1] })); return g; };
  pz.palomita = (o = {}) => extruir([[-0.32, 0.02], [-0.2, 0.12], [-0.08, -0.02], [0.24, 0.32], [0.34, 0.2], [-0.08, -0.24]], Z, "#2fbf5b", { pos: o.pos, padre: o.padre, nombre: "palomita" });
  pz.cursor = (o = {}) => extruir([[0, 0], [0, -0.46], [0.11, -0.35], [0.2, -0.54], [0.28, -0.5], [0.19, -0.31], [0.34, -0.31]], Z, "#ffffff", { pos: o.pos, nombre: "cursor" });
  pz.texto = (t, o = {}) => texto(t, o);
  // FLECHA de plumón: se dibuja de a poco de "desde" a "hacia" (puntos o puertos); la punta sale al final
  pz.flecha = (desde, hacia, o = {}) => {
    const res = (q) => (typeof q === "function" ? q() : new THREE.Vector3(...q));
    M.raiz.updateMatrixWorld(true);
    const a = res(desde), b = res(hacia), mitad = a.clone().lerp(b, 0.5), lado = new THREE.Vector3(-(b.y - a.y), b.x - a.x, 0).normalize().multiplyScalar(o.curva ?? 0.25 * a.distanceTo(b));
    const pts = [a, mitad.add(lado), b];
    const color = o.color || "#1d1d1f";
    const linea = M.trazo(pts, { radio: o.grosor ?? 0.035, color, t0: o.t0 ?? 0, dur: o.dur ?? 0.7, t1: o.t1, tinta: false });
    linea.userData.flota = true; linea.name = o.nombre || "flecha";
    const c = new THREE.CatmullRomCurve3(pts), fin = c.getPointAt(1), dir = c.getTangentAt(1);
    const punta = M.cono(0.11, 0.24, color, { pos: [fin.x, fin.y, fin.z], tinta: false, base: false, nombre: "punta de flecha" });
    punta.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    if (o.t0 !== undefined) aparecer(punta, o.t0 + (o.dur ?? 0.7) - 0.05, { modo: "pop", dur: 0.2, revisar: false });
    if (o.t1 !== undefined) desaparecer(punta, o.t1, { dur: 0.15 });   // la línea se borra sola (trazo con t1)
    linea.curva = c;
    return linea;
  };
  // CONTADOR que sube (registros, clics): cambia el número de "desde" a "hasta" entre t0 y t1
  pz.contador = (desde, hasta, t0, t1, o = {}) => {
    const g = grupo({ pos: o.pos, nombre: o.nombre || "contador" });
    if (o.titulo) texto(o.titulo, { padre: g, pos: [0, 0.42, 0], alto: 0.24 });
    const pasos = o.pasos ?? 8, vals = Array.from({ length: pasos + 1 }, (_, i) => Math.round(desde + ((hasta - desde) * i) / pasos));
    const ets = vals.map((v) => texto(String(v), { padre: g, alto: o.alto ?? 0.55, color: o.color || "#1d1d1f", fondo: o.fondo }));
    M.cadaCuadro((tt) => { const k = Math.max(0, Math.min(pasos, Math.floor(((tt - t0) / Math.max(0.01, t1 - t0)) * pasos))); ets.forEach((e, i) => (e.visible = i === k)); });
    return g;
  };
  // EMBUDO de contorno: se dibuja alrededor de todo al final
  pz.embudo = (o = {}) => {
    let { arriba = 6.2, abajo = 1.4, yArriba = 10, yAbajo = -6, cuello = 1.2 } = o;
    if (o.envolver) {   // la forma sale de lo que tiene que rodear: ninguna pieza queda afuera ni la cruza una pared
      M.raiz.updateMatrixWorld(true);
      const cajas = o.envolver.map((x) => new THREE.Box3().setFromObject(x)).filter((c) => !c.isEmpty());
      const mg = o.margen ?? 0.3;
      yArriba = Math.max(...cajas.map((c) => c.max.y)) + mg; yAbajo = Math.min(...cajas.map((c) => c.min.y)) - mg;
      const H = yArriba - yAbajo, req = cajas.map((c) => ({ s: (c.min.y - yAbajo) / H, w: Math.max(Math.abs(c.min.x), Math.abs(c.max.x)) + mg }));
      let hb = Math.max(abajo / 2, ...req.filter((r) => r.s < 0.08).map((r) => r.w));
      let ha = Math.max(hb, ...req.filter((r) => r.s >= 0.08).map((r) => (r.w - hb * (1 - r.s)) / r.s));
      arriba = ha * 2; abajo = hb * 2;
    }
    const pts = [[-arriba / 2, yArriba], [-abajo / 2, yAbajo], [-abajo / 2, yAbajo - cuello]];
    const izq = M.trazo(pts.map(([x, y]) => [x, y, -0.2]), { radio: 0.06, color: o.color || "#1d1d1f", t0: o.t0, dur: o.dur ?? 1.4, tinta: false });
    const der = M.trazo(pts.map(([x, y]) => [-x, y, -0.2]), { radio: 0.06, color: o.color || "#1d1d1f", t0: o.t0, dur: o.dur ?? 1.4, tinta: false });
    const boca = M.trazo([[-arriba / 2, yArriba, -0.2], [0, yArriba + 0.25, -0.2], [arriba / 2, yArriba, -0.2]], { radio: 0.06, color: o.color || "#1d1d1f", t0: o.t0, dur: (o.dur ?? 1.4) * 0.6, tinta: false });
    [izq, der, boca].forEach((m) => { m.userData.flota = true; m.name = "embudo"; });
    return [izq, der, boca];
  };
  P.pz = pz;

  M.piezas = P;
  return P;
}
