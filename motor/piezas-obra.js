// =====================================================================================
//  piezas-obra.js — maquinaria y obra (parte de la biblioteca prefabricada; ver piezas.js)
//
//  · obra({zanja})        terreno de obra con una zanja que se va escarbando (capa blanda y tepetate)
//  · monton({pos})        montón de tierra que crece y se achica (.nivel(claves))
//  · retroexcavadora()    tractor articulado: brazo excavador (pluma, balancín, bote), cilindros
//                         hidráulicos con el aceite visible, estabilizadores, cargador frontal, operador.
//                         Todo se mueve por POSES con tiempo (.pose(t, {...}, dur)) y por rutas (.manejar).
//                         Los cilindros siempre van de su ancla a su ancla: nunca se despegan.
//  · camionVolteo()       camión con caja de volteo y chofer (.cargar(claves))
//  Coordenadas locales de las máquinas: frente hacia +x, piso en y = 0.
// =====================================================================================
export function instalarObra(M, P) {
  const { THREE, E, caja, cajaR, cilindro, esfera, cono, toro, tornear, extruir, plano, grupo, tubo, pista, prog } = M;
  const rad = (g) => (g * Math.PI) / 180;
  const AMARILLO = "#f5b50a", NEGRO = "#2a2c31", LLANTA = "#2b2d33", RIN = "#e9a90c", CROMO = "#dfe4ea", ACEITE = "#ffb21a";
  const TIERRA_BOTE = "#7a5232", TEPETATE = "#c9b48e", GRIS = "#3b3f47";

  // ------------------------------------------------------------------ EFECTOS: polvo, terrones y humo
  let texNube = null;
  const nubeTex = () => {   // bocanada suave (sprite): borde difuso, centro lleno
    if (texNube) return texNube;
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 6, 64, 64, 62);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.55, "rgba(255,255,255,0.85)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 62, 0, Math.PI * 2); g.fill();
    texNube = new THREE.CanvasTexture(c); texNube.colorSpace = THREE.SRGBColorSpace;
    return texNube;
  };
  const bocanada = (padre, color, nombre) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: nubeTex(), color: new THREE.Color(color), transparent: true, depthWrite: false, opacity: 0 }));
    sp.name = nombre; sp.userData.flota = true; sp.renderOrder = 20; padre.add(sp);
    return sp;
  };
  // POLVO: una nube de tierra que se levanta y se disipa (golpes, mordidas, descargas). pos = [x,y,z] o función.
  P.polvo = (pos, t, o = {}) => {
    const g = grupo({ flota: true, nombre: o.nombre || "polvo" });
    const n = o.n ?? 8, dur = o.dur ?? 1.2, tam = o.tam ?? 0.9, rnd = M.azar(o.semilla ?? Math.round(t * 100));
    const ps = Array.from({ length: n }, () => ({ sp: bocanada(g, o.color || "#e2cba4", "nube de polvo"), a: rnd() * Math.PI * 2, d: 0.3 + rnd() * 0.7, s: 0.6 + rnd() * 0.7, up: 0.2 + rnd() * 0.6, dt: rnd() * 0.15 }));
    M.cadaCuadro((tt) => {
      const c = typeof pos === "function" ? pos() : new THREE.Vector3(...pos);
      for (const q of ps) {
        const k = (tt - t - q.dt) / dur;
        q.sp.visible = k >= 0 && k <= 1;
        if (!q.sp.visible) continue;
        const e = E.sale(k);
        q.sp.position.set(c.x + Math.cos(q.a) * q.d * e * (o.abre ?? 1), c.y + 0.1 + q.up * e, c.z + Math.sin(q.a) * q.d * e * (o.abre ?? 1));
        q.sp.scale.setScalar(tam * q.s * (0.35 + 0.9 * e));
        q.sp.material.opacity = (o.opacidad ?? 0.9) * Math.pow(1 - k, 1.4) * Math.min(1, k * 8);
      }
    });
    return g;
  };
  // TERRONES: pedazos de tierra que caen (de un bote, de una pala) en vez de rayas. Rebotan contra el piso.
  P.terrones = (o) => {
    const g = grupo({ flota: true, nombre: o.nombre || "terrones" });
    const n = o.n ?? 16, t0 = o.t0, t1 = o.t1, rate = o.ritmo ?? 2.2, rnd = M.azar(o.semilla ?? Math.round(t0 * 100));
    const [cx, y0, cz] = o.desde, y1 = o.hasta ?? 0.05, [sx, sz] = o.ancho || [0.5, 0.4];
    const tonos = ["#7a5232", "#8f6340", "#6a4529"];
    const ps = Array.from({ length: n }, (_, i) => {
      const m = M.malla(new THREE.DodecahedronGeometry(0.06 + rnd() * 0.07, 0), tonos[i % 3], { padre: g, flota: true, aristas: false, nombre: "terrón", sombra: false });
      return { m, ti: t0 + (i / n) / rate, x: (rnd() - 0.5) * sx, z: (rnd() - 0.5) * sz, rx: rnd() * 6, ry: rnd() * 6 };
    });
    M.cadaCuadro((tt) => {
      for (const q of ps) {
        const ciclo = (tt - q.ti) * rate, inicio = q.ti + Math.floor(ciclo) / rate;
        const vivo = tt >= q.ti && inicio <= t1;
        q.m.visible = vivo;
        if (!vivo) continue;
        const p = ciclo % 1;
        q.m.position.set(cx + q.x * (1 + p * 0.6), y0 - (y0 - y1) * p * p, cz + q.z * (1 + p * 0.6));
        q.m.rotation.set(q.rx + tt * 7, q.ry + tt * 5, 0);
      }
    });
    return g;
  };
  // HUMO del escape: bocanadas grises que suben y crecen (motor encendido). Va dentro de la máquina: se mueve con ella.
  P.humo = (padre, local, t0 = 0, t1 = Infinity, o = {}) => {
    const g = grupo({ padre, pos: local, flota: true, nombre: "humo del escape" });
    const n = o.n ?? 5, per = o.periodo ?? 1.5;
    const ps = Array.from({ length: n }, (_, i) => ({ sp: bocanada(g, o.color || "#8d939b", "bocanada de humo"), f: i / n }));
    M.cadaCuadro((tt) => {
      for (const q of ps) {
        const k = (((tt - t0) / per + q.f) % 1 + 1) % 1, nace = tt - k * per;
        q.sp.visible = tt >= t0 && nace >= t0 - 1e-3 && nace <= t1;
        if (!q.sp.visible) continue;
        q.sp.position.set(-0.25 * k, 0.15 + 1.1 * k, 0.05 * Math.sin(k * 6));
        q.sp.scale.setScalar(0.18 + 0.55 * k);
        q.sp.material.opacity = 0.75 * Math.pow(1 - k, 1.2) * Math.min(1, k * 6);
      }
    });
    return g;
  };

  // ------------------------------------------------------------------ UTILERÍA DE OBRA (ambiente)
  P.tambo = (o = {}) => {
    const g = grupo({ pos: o.pos, nombre: "tambo" });
    const c = o.color || "#2f6fdc";
    tornear([[0, 0], [0.3, 0], [0.31, 0.05], [0.31, 0.88], [0.29, 0.9], [0, 0.9]], c, { padre: g, lados: 24, nombre: "tambo" });
    for (const y of [0.3, 0.6]) toro(0.312, 0.018, c, { padre: g, pos: [0, y, 0], rot: [90, 0, 0], nombre: "aro del tambo" });
    return g;
  };
  P.carretilla = (o = {}) => {
    const g = grupo({ pos: o.pos, rot: o.rot, nombre: "carretilla" });
    extruir([[-0.45, 0.32], [0.45, 0.32], [0.32, 0.62], [-0.55, 0.62]], 0.5, "#3fae5a", { padre: g, nombre: "batea de la carretilla" });
    const rr = rueda(0.17, 0.08, { padre: g, pos: [0.42, 0.17, 0], nombre: "rueda de la carretilla", tacos: 8, rin: "#c9d0d8" });
    for (const z of [-0.2, 0.2]) { cilindro(0.025, 0.025, 1.3, NEGRO, { padre: g, pos: [0.42, 0.17, z], rot: [0, 0, 104], nombre: "mango" }); cilindro(0.02, 0.02, 0.32, NEGRO, { padre: g, pos: [-0.35, 0, z], nombre: "pata" }); }
    return g;
  };
  P.pilaBlock = (o = {}) => {
    const g = grupo({ pos: o.pos, rot: o.rot, nombre: "pila de block" });
    for (let y = 0; y < (o.pisos ?? 3); y++) for (let i = 0; i < 3; i++) cajaR(0.4, 0.2, 0.2, "#b9bcc2", { padre: g, pos: [(i - 1) * 0.42 + (y % 2) * 0.1, y * 0.205, 0], radio: 0.015, nombre: "block" });
    caja(1.5, 0.12, 0.9, "#a8754a", { padre: g, pos: [0, -0.12, 0], nombre: "tarima" });
    g.children.forEach((h) => { if (h.name === "block") h.position.y += 0.0; });
    return g;
  };
  P.valla = (o = {}) => {   // malla naranja de obra entre postes
    const g = grupo({ pos: o.pos, rot: o.rot, nombre: "malla de obra" });
    const L = o.largo ?? 6, n = Math.max(2, Math.round(L / 2) + 1);
    for (let i = 0; i < n; i++) cilindro(0.04, 0.04, 1.15, "#c9d0d8", { padre: g, pos: [-L / 2 + (i * L) / (n - 1), 0, 0], nombre: "poste" });
    const red = caja(L, 0.75, 0.02, "#ff7a1a", { padre: g, pos: [0, 0.3, 0], nombre: "malla naranja", tinta: false, casco: false });
    for (let k = 0; k < 3; k++) caja(L - 0.03, 0.04, 0.03, "#e85d0a", { padre: g, pos: [0, 0.34 + k * 0.3, 0], nombre: "franja de la malla", tinta: false });
    return g;
  };
  P.caseta = (o = {}) => {   // caseta de obra (tráiler-oficina)
    const g = grupo({ pos: o.pos, rot: o.rot, nombre: "caseta de obra" });
    cajaR(4.2, 2.3, 2.2, "#f2efe8", { padre: g, pos: [0, 0.45, 0], radio: 0.08, nombre: "caseta de obra" });
    caja(4.3, 0.12, 2.3, "#3b7bd4", { padre: g, pos: [0, 2.75, 0], nombre: "techo de la caseta" });
    caja(0.8, 1.7, 0.04, "#3b7bd4", { padre: g, pos: [1.3, 0.5, 1.11], nombre: "puerta de la caseta" });
    for (const x of [-1.2, -0.1]) caja(0.8, 0.6, 0.04, "#bfe6f2", { padre: g, pos: [x, 1.45, 1.11], nombre: "ventana de la caseta" });
    caja(4.2, 0.08, 0.04, "#3b7bd4", { padre: g, pos: [0, 1.0, 1.115], nombre: "franja de la caseta", tinta: false });
    for (const x of [-1.6, 1.6]) for (const z of [-0.8, 0.8]) caja(0.18, 0.45, 0.18, "#8a94a0", { padre: g, pos: [x, 0, z], nombre: "soporte de la caseta" });
    caja(0.8, 0.4, 0.6, "#8a94a0", { padre: g, pos: [1.3, 0.01, 1.45], nombre: "escalón de la caseta" });
    return g;
  };
  // piedritas sueltas y huellas de llanta (sin tinta: textura del piso)
  P.piedritas = (o = {}) => {
    const g = grupo({ nombre: "piedritas", flota: true });
    const rnd = M.azar(o.semilla ?? 5), [x0, x1, z0, z1] = o.area, evita = o.evita || [];
    let k = 0;
    for (let i = 0; i < (o.n ?? 50) * 3 && k < (o.n ?? 50); i++) {
      const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0);
      if (evita.some(([a, b, c, d]) => x > a && x < b && z > c && z < d)) continue;
      const r = 0.04 + rnd() * 0.08;
      M.malla(new THREE.DodecahedronGeometry(r, 0), ["#9a8f82", "#7d7268", "#b3a796"][k % 3], { padre: g, pos: [x, r * 0.3, z], escala: [1, 0.55, 1], tinta: false, sombra: false, flota: true, nombre: "piedrita" });
      k++;
    }
    return g;
  };
  P.huellas = (puntos, o = {}) => {   // dos franjas oscuras siguiendo un camino (marcas de llanta en la tierra)
    const g = grupo({ nombre: "huellas", flota: true });
    const sep = o.separacion ?? 1.9, an = o.ancho ?? 0.42;
    for (let i = 0; i < puntos.length - 1; i++) {
      const [ax, az] = puntos[i], [bx, bz] = puntos[i + 1], L = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bz - az, bx - ax);
      for (const k of [-1, 1]) {
        const nx = -Math.sin(ang) * k * sep / 2, nz = Math.cos(ang) * k * sep / 2;
        caja(L, 0.01, an, o.color || "#7f5a3a", { padre: g, pos: [(ax + bx) / 2 + nx, 0.004, (az + bz) / 2 + nz], rot: [0, (-ang * 180) / Math.PI, 0], capa: true, tinta: false, sombra: false, opacidad: 0.55, nombre: "huella" });
      }
    }
    return g;
  };

  // ------------------------------------------------------------------ línea de tiempo de valores (poses)
  // .a(t, {nombre: valor}, dur, curva): cada clave lleva los valores desde donde estaban (como mover()).
  function lineaDeTiempo(base) {
    const claves = [];
    const lt = {
      a(t, v, dur = 0.8, e = "suave") { claves.push({ t, dur, v, e: typeof e === "function" ? e : E[e] || E.suave }); claves.sort((x, y) => x.t - y.t); return lt; },
      en(t) {
        const s = { ...base };
        for (const k of claves) {
          if (t < k.t) break;
          const p = k.e(prog(t, k.t, k.dur));
          for (const [n, v] of Object.entries(k.v)) s[n] = s[n] + (v - s[n]) * p;
        }
        return s;
      },
    };
    return lt;
  }
  P.lineaDeTiempo = lineaDeTiempo;

  // ------------------------------------------------------------------ casco de obra (sobre una persona)
  P.casco = (persona, color = "#ffd23f") => {
    const c = grupo({ padre: persona, pos: [0, 1.84, -0.01], nombre: "casco" });
    esfera(0.2, color, { padre: c, escala: [1, 0.72, 1.05], nombre: "casco" });
    cilindro(0.25, 0.25, 0.03, color, { padre: c, pos: [0, -0.03, 0.03], base: false, nombre: "ala del casco" });
    return c;
  };

  // ------------------------------------------------------------------ LLANTA con tacos (gira en .giro, eje z)
  function rueda(r, ancho, o = {}) {
    const g = grupo({ padre: o.padre, pos: o.pos, nombre: o.nombre || "llanta" });
    const giro = grupo({ padre: g, nombre: "giro de la llanta" });
    cilindro(r * 0.93, r * 0.93, ancho, LLANTA, { padre: giro, rot: [90, 0, 0], base: false, lados: 32, nombre: o.nombre || "llanta" });
    const n = o.tacos ?? 14;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      caja(r * 0.22, r * 0.12, ancho * 0.92, LLANTA, { padre: giro, base: false, pos: [Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95, 0], rot: [0, 0, (a * 180) / Math.PI - 90 + 7], nombre: "taco de la llanta", tinta: false });
    }
    for (const k of [-1, 1]) toro(r * 0.86, ancho * 0.16, LLANTA, { padre: giro, pos: [0, 0, k * ancho * 0.42], lados: 32, nombre: "costado de la llanta", tinta: false });
    cilindro(r * 0.52, r * 0.52, ancho + 0.03, o.rin || RIN, { padre: giro, rot: [90, 0, 0], base: false, lados: 24, nombre: "rin" });
    cilindro(r * 0.4, r * 0.4, ancho + 0.045, o.rin || RIN, { padre: giro, rot: [90, 0, 0], base: false, lados: 24, nombre: "centro del rin", tinta: false });
    cilindro(r * 0.16, r * 0.16, ancho + 0.07, NEGRO, { padre: giro, rot: [90, 0, 0], base: false, lados: 12, nombre: "maza" });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; cilindro(r * 0.035, r * 0.035, ancho + 0.075, "#5a5f68", { padre: giro, pos: [Math.cos(a) * r * 0.27, Math.sin(a) * r * 0.27, 0], rot: [90, 0, 0], base: false, lados: 8, nombre: "birlo", tinta: false }); }
    g.giro = giro; g.radio = r;
    return g;
  }
  P.rueda = rueda;

  // ------------------------------------------------------------------ CILINDRO HIDRÁULICO entre dos anclas
  // A y B: [objeto, [x, y, z] local]. Camisa translúcida: se ve el aceite empujando el pistón.
  // .actualizar() lo recoloca (la máquina lo llama cada cuadro). Aparece con aparecer(cil, t, {modo: "desplegar"}).
  function cilindroHidraulico(padre, A, B, o = {}) {
    const g = grupo({ padre, nombre: o.nombre || "cilindro hidráulico" });
    const r = o.radio ?? 0.085, camL = o.camisa ?? 0.9, vasL = o.vastago ?? camL * 0.95;
    const camisa = cilindro(r, r, 1, o.color || "#f7d36b", { padre: g, vidrio: true, opacidad: 0.5, casco: false, lados: 20, nombre: "camisa del cilindro" });
    const aceite = cilindro(r * 0.78, r * 0.78, 1, ACEITE, { padre: g, tinta: false, lados: 16, nombre: "aceite del cilindro", noAlerta: true, noEncuadrar: true });
    const embolo = cilindro(r * 0.86, r * 0.86, 0.07, "#4a4f57", { padre: g, base: false, lados: 16, nombre: "pistón" });
    const vastago = cilindro(r * 0.46, r * 0.46, 1, CROMO, { padre: g, lados: 14, nombre: "vástago" });
    const ojoA = esfera(r * 1.05, NEGRO, { padre: g, nombre: "perno del cilindro" });
    const ojoB = esfera(r * 0.8, NEGRO, { padre: g, nombre: "perno del cilindro" });
    const a = new THREE.Vector3(), b = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3();
    g.largo = 0;
    g.actualizar = () => {
      a.set(...A[1]); A[0].localToWorld(a); padre.worldToLocal(a);
      b.set(...B[1]); B[0].localToWorld(b); padre.worldToLocal(b);
      const L = Math.max(0.2, a.distanceTo(b));
      d.copy(b).sub(a).normalize();
      g.position.copy(a); g.quaternion.setFromUnitVectors(Y, d);
      const cam = Math.min(camL, L - 0.1), h = Math.max(0.06, Math.min(cam - 0.05, L - vasL));
      camisa.scale.y = cam;
      aceite.scale.y = Math.max(0.001, h - 0.04); aceite.position.y = 0.02;
      embolo.position.y = h;
      vastago.position.y = h; vastago.scale.y = L - h;
      ojoB.position.y = L;
      g.largo = L;
    };
    g.extremos = () => [a.clone(), b.clone()];
    return g;
  }
  P.cilindroHidraulico = cilindroHidraulico;

  // ------------------------------------------------------------------ TERRENO DE OBRA con zanja
  // zanja: {x0, x1, z0, z1, prof}. La zanja está tapada de tierra (capa blanda arriba, tepetate abajo):
  // .escarbar(claves) baja la capa blanda y .escarbarDura(claves) el tepetate (valores 1 → 0).
  // Matas de pasto (3 hojas en cono), un solo InstancedMesh: barato aunque sean cientos. Decoración: el revisor no las cuenta.
  function matas(padre, [x0, x1, z0, z1], n, semilla, esc = 1) {
    const hojas = [-22, 0, 22].map((a, i) => { const c = new THREE.ConeGeometry(0.035, 0.19 - (i % 2) * 0.04, 4); c.translate(0, 0.085, 0); c.rotateZ((a * Math.PI) / 180); c.rotateY(i * 2.1); c.deleteAttribute("uv"); return c; });
    const geo = M.unirGeometrias(hojas);
    const im = new THREE.InstancedMesh(geo, M.mat("#6fbf45"), n);
    const rnd = M.azar(semilla), q = new THREE.Object3D(), color = new THREE.Color();
    for (let i = 0; i < n; i++) {
      q.position.set(x0 + rnd() * (x1 - x0), 0.005, z0 + rnd() * (z1 - z0));
      q.rotation.set(0, rnd() * 6.28, 0); q.scale.setScalar((0.7 + rnd() * 0.7) * esc); q.updateMatrix();
      im.setMatrixAt(i, q.matrix); im.setColorAt(i, color.set(["#ffffff", "#e8f2dc", "#d2e6c0", "#f4ffe8"][i % 4]));
    }
    im.name = "matas de pasto"; im.userData.flota = true; im.userData.noRevisar = true;
    im.castShadow = false; im.receiveShadow = true; im.raycast = () => {};
    padre.add(im);
    return im;
  }
  P.obra = (o = {}) => {
    const X0 = o.x0 ?? -30, X1 = o.x1 ?? 26, Z0 = o.z0 ?? -24, Z1 = o.z1 ?? 34, pr = o.profundidad ?? 3;   // grande: ninguna toma ve la orilla del mundo
    const zj = { x0: -7, x1: -3.6, z0: -0.55, z1: 0.55, prof: 1.6, ...(o.zanja || {}) };
    const g = grupo({ nombre: "terreno de obra" });
    const cx = (zj.x0 + zj.x1) / 2, cz = (zj.z0 + zj.z1) / 2, w = zj.x1 - zj.x0, dz = zj.z1 - zj.z0;
    // planta del terreno (x, −z) extruida hacia abajo, con el hueco de la zanja
    const mTierra = M.mat(M.col("tierra"), { unico: true });
    mTierra.map = M.texturaManchas(M.col("tierra"), { repetir: 1, n: 70, contraste: 0.1 }); mTierra.map.repeat.set(1 / 9, 1 / 9); mTierra.color.set("#ffffff");
    extruir([[X0, -Z1], [X1, -Z1], [X1, -Z0], [X0, -Z0]], pr, "tierra", { padre: g, rot: [-90, 0, 0], pos: [0, -pr / 2, 0], estructura: true, nombre: "terreno", material: mTierra,
      hoyos: [[[zj.x0, -zj.z1], [zj.x1, -zj.z1], [zj.x1, -zj.z0], [zj.x0, -zj.z0]]] });
    caja(w - 0.01, pr - zj.prof, dz - 0.01, "#8a5f3d", { padre: g, pos: [cx, -pr, cz], estructura: true, nombre: "fondo de la zanja" });
    const blanda = caja(w - 0.02, zj.prof / 2, dz - 0.02, "tierra", { padre: g, pos: [cx, -zj.prof / 2, cz], estructura: true, nombre: "tierra de la zanja", noAlerta: true });
    const dura = caja(w - 0.02, zj.prof / 2, dz - 0.02, TEPETATE, { padre: g, pos: [cx, -zj.prof, cz], estructura: true, nombre: "tepetate" });
    // pasto al fondo del terreno y líneas de cal alrededor de la zanja
    const zp = o.pastoHasta ?? -9.5;
    plano(X1 - X0 - 0.04, zp - Z0 - 0.02, "pasto", { padre: g, pos: [(X0 + X1) / 2, 0.012, (Z0 + zp) / 2], manchas: true, estructura: true, nombre: "pasto" });
    matas(g, [X0 + 0.5, X1 - 0.5, Z0 + 0.5, zp - 0.1], o.matas ?? 2600, 21);   // matas de pasto: el pasto deja de ser un plano liso
    matas(g, [X0 + 0.5, X1 - 0.5, zp - 0.1, zp + 0.9], 260, 22, 0.75);       // algunas se meten a la tierra en la orilla
    const m = 0.12, gr = 0.07;
    [[cx, zj.z0 - m, w + 2 * m + gr, gr], [cx, zj.z1 + m, w + 2 * m + gr, gr]].forEach(([x, z, a2, b2]) => caja(a2, 0.02, b2, "blanco", { padre: g, pos: [x, 0, z], capa: true, tinta: false, estructura: true, nombre: "línea de cal" }));
    [[zj.x0 - m, cz], [zj.x1 + m, cz]].forEach(([x, z]) => caja(gr, 0.02, dz + 2 * m, "blanco", { padre: g, pos: [x, 0, z], capa: true, tinta: false, estructura: true, nombre: "línea de cal" }));
    // el piso lejano del fondo (mundo.js) no debe asomarse por la zanja: se le abre un hueco del tamaño del terreno
    const fondo = M.escena.getObjectByName("fondo"), lejano = fondo && fondo.children.find((h) => h.isMesh && h.geometry.type === "CircleGeometry");
    if (lejano) {
      const sh = new THREE.Shape(); sh.absarc(0, 0, 400, 0, Math.PI * 2, false);
      const m2 = 0.6; sh.holes.push(new THREE.Path([[X0 + m2, -Z1 + m2], [X1 - m2, -Z1 + m2], [X1 - m2, -Z0 - m2], [X0 + m2, -Z0 - m2]].map(([x, y]) => new THREE.Vector2(x, y))));
      lejano.geometry.dispose(); lejano.geometry = new THREE.ShapeGeometry(sh, 64);
    }
    g.zanja = { ...zj, centro: [cx, 0, cz], blanda, dura };
    g.zonaZanja = M.zona(w, 0.35, dz, { padre: g, pos: [cx, 0, cz], nombre: "zanja" });   // a ras de suelo: la cámara la encuentra aunque esté tapada de tierra
    g.escarbar = (claves) => pista(blanda, "scale.y", claves);
    g.escarbarDura = (claves) => pista(dura, "scale.y", claves);
    g.frenteZ = Z1;
    return g;
  };

  // ------------------------------------------------------------------ MONTÓN de tierra (crece con cada descarga)
  P.monton = (o = {}) => {
    const g = grupo({ pos: o.pos, nombre: o.nombre || "montón de tierra" });
    const r = o.radio ?? 1.25, h = o.alto ?? 0.8;
    const m = tornear([[0, 0], [r, 0], [r * 0.86, h * 0.3], [r * 0.58, h * 0.68], [r * 0.25, h * 0.94], [0, h]], o.color || "#8f6340", { padre: g, lados: 28, nombre: o.nombre || "montón de tierra" });
    [[0.4, 0.3, 0.2, 0.16], [-0.3, 0.42, -0.35, 0.12], [0.1, 0.62, -0.1, 0.1]].forEach(([x, y, z, rr]) => esfera(rr, "#6e4a2d", { padre: m, pos: [x * r, y * h, z * r], nombre: "terrón" }));
    const st = { v: 0 };
    m.scale.setScalar(0.001);
    g.nivel = (claves) => {
      pista(st, "v", claves);
      M.cadaCuadro(() => { const v = Math.max(0.001, st.v); m.scale.set(Math.sqrt(v), Math.max(0.001, v ** 0.7), Math.sqrt(v)); });
      return g;
    };
    g.malla = m;
    return g;
  };

  // ------------------------------------------------------------------ RETROEXCAVADORA
  P.retroexcavadora = (o = {}) => {
    const XF = 1.15;                                      // eje delantero: la máquina se ladea sobre él
    const g = grupo({ pos: o.pos, rot: o.rot, nombre: o.nombre || "retroexcavadora" });
    const mov = grupo({ padre: g, nombre: "recorrido de la retro" });
    const incl = grupo({ padre: mov, pos: [XF, 0, 0], nombre: "inclinación de la retro" });
    const s = grupo({ padre: incl, pos: [-XF, 0, 0], nombre: "tractor" });
    g.cuerpo = s;

    // ---- tractor: chasis, llantas, cofre, cabina, operador
    const ruedas = [];
    for (const z of [-0.98, 0.98]) ruedas.push(rueda(0.75, 0.42, { padre: s, pos: [-1.1, 0.75, z], nombre: "llanta trasera" }));
    for (const z of [-0.9, 0.9]) ruedas.push(rueda(0.5, 0.32, { padre: s, pos: [XF, 0.5, z], nombre: "llanta delantera", tacos: 12 }));
    cilindro(0.09, 0.09, 2.1, GRIS, { padre: s, pos: [-1.1, 0.75, 0], rot: [90, 0, 0], base: false, nombre: "eje trasero" });
    cilindro(0.08, 0.08, 1.9, GRIS, { padre: s, pos: [XF, 0.5, 0], rot: [90, 0, 0], base: false, nombre: "eje delantero" });
    const chasis = cajaR(3.95, 0.5, 1.24, GRIS, { padre: s, pos: [0.02, 0.55, 0], radio: 0.07, nombre: "chasis" });
    cajaR(2.05, 0.15, 1.44, AMARILLO, { padre: s, pos: [-0.73, 1.05, 0], radio: 0.04, nombre: "piso de la cabina" });
    const cofre = extruir([[0.3, 1.05], [2.0, 1.05], [2.06, 1.46], [1.9, 1.7], [0.3, 1.78]], 0.94, AMARILLO, { padre: s, nombre: "cofre", bisel: 0.03, angulo: 40 });
    // rejillas del cofre, parrilla con barras, faros con aro cromado y franja negra al costado
    for (const k of [-1, 1]) {
      for (let i = 0; i < 4; i++) caja(0.5, 0.035, 0.02, GRIS, { padre: s, pos: [1.12, 1.3 + i * 0.075, k * 0.5], capa: true, tinta: false, nombre: "rejilla del cofre" });
      caja(1.55, 0.05, 0.02, NEGRO, { padre: s, pos: [1.12, 1.16, k * 0.5], capa: true, tinta: false, nombre: "franja del cofre" });
    }
    cajaR(0.06, 0.34, 0.7, GRIS, { padre: s, pos: [2.07, 1.08, 0], radio: 0.02, nombre: "parrilla" });
    for (let i = 0; i < 4; i++) caja(0.02, 0.03, 0.62, "#8d949c", { padre: s, pos: [2.105, 1.13 + i * 0.07, 0], tinta: false, nombre: "barra de la parrilla" });
    for (const z of [-0.33, 0.33]) {
      cilindro(0.08, 0.08, 0.05, "#fff6c9", { padre: s, pos: [2.06, 1.53, z], rot: [0, 0, 90], base: false, nombre: "faro", brilla: true });
      toro(0.085, 0.018, CROMO, { padre: s, pos: [2.085, 1.53, z], rot: [0, 90, 0], nombre: "aro del faro", tinta: false });
    }
    const defensa = cajaR(0.22, 0.36, 1.16, GRIS, { padre: s, pos: [2.1, 0.5, 0], radio: 0.04, nombre: "defensa" });
    for (let i = 0; i < 7; i++) caja(0.01, 0.3, 0.13, i % 2 ? NEGRO : AMARILLO, { padre: s, pos: [2.215, 0.53, -0.48 + i * 0.16], capa: true, tinta: false, nombre: "franja de seguridad" });
    cilindro(0.05, 0.05, 0.62, NEGRO, { padre: s, pos: [1.15, 1.66, 0.3], nombre: "escape" });
    cilindro(0.065, 0.05, 0.08, "#5a5f68", { padre: s, pos: [1.15, 2.26, 0.3], nombre: "boca del escape" });
    g.humo = P.humo(s, [1.15, 2.3, 0.3], o.humo ?? 0);
    cajaR(0.3, 0.9, 1.0, AMARILLO, { padre: s, pos: [-2.1, 0.5, 0], radio: 0.05, nombre: "torre de atrás" });
    for (const z of [-0.42, 0.42]) cajaR(0.04, 0.12, 0.18, "#e8322b", { padre: s, pos: [-2.26, 1.15, z], radio: 0.015, nombre: "calavera", brilla: true });
    for (const k of [-1, 1]) cajaR(1.62, 0.07, 0.5, AMARILLO, { padre: s, pos: [-1.1, 1.56, k * 0.97], radio: 0.03, nombre: "salpicadera" });
    // escalones y pasamanos para subir a la cabina
    for (const y of [0.55, 0.85]) cajaR(0.34, 0.05, 0.22, GRIS, { padre: s, pos: [0.08, y, 0.74], radio: 0.015, nombre: "escalón" });
    cilindro(0.02, 0.02, 0.4, GRIS, { padre: s, pos: [-0.08, 0.5, 0.84], nombre: "soporte del escalón" });
    cilindro(0.025, 0.025, 1.1, NEGRO, { padre: s, pos: [0.36, 1.4, 0.78], nombre: "pasamanos" });
    const cab = grupo({ padre: s, nombre: "cabina" });
    const cx0 = -1.72, cx1 = 0.28, cy0 = 1.2, cy1 = 2.95, zc = 0.7;
    for (const [x, z] of [[cx0, -zc], [cx0, zc], [cx1, -zc], [cx1, zc]]) caja(0.09, cy1 - cy0, 0.09, NEGRO, { padre: cab, pos: [x, cy0, z], nombre: "poste de la cabina" });
    cajaR(2.24, 0.16, 1.64, AMARILLO, { padre: cab, pos: [(cx0 + cx1) / 2, cy1, 0], radio: 0.06, nombre: "techo de la cabina" });
    cajaR(1.9, 0.05, 1.3, "#ffd23f", { padre: cab, pos: [(cx0 + cx1) / 2, cy1 + 0.16, 0], radio: 0.02, nombre: "tapa del techo" });
    // torreta giratoria en el techo (siempre encendida: la obra está trabajando)
    const torreta = grupo({ padre: cab, pos: [-1.2, cy1 + 0.2, 0.45], nombre: "torreta" });
    cilindro(0.09, 0.1, 0.06, GRIS, { padre: torreta, nombre: "base de la torreta" });
    cilindro(0.075, 0.08, 0.13, "#ff8a00", { padre: torreta, pos: [0, 0.06, 0], vidrio: true, opacidad: 0.75, casco: false, nombre: "torreta" });
    const giraLuz = grupo({ padre: torreta, pos: [0, 0.12, 0], nombre: "luz de la torreta" });
    M.brillo("#ffb02e", { padre: giraLuz, pos: [0.07, 0, 0], tam: 0.55, opacidad: 0.9 });
    M.girar(giraLuz, "y", 7, 0, Infinity, { arranque: 0.01 });
    // espejos
    for (const k of [-1, 1]) { cilindro(0.015, 0.015, 0.3, NEGRO, { padre: cab, pos: [cx1 + 0.02, cy1 - 0.25, k * (zc + 0.04)], rot: [k * 70, 0, 0], nombre: "brazo del espejo" }); cajaR(0.04, 0.2, 0.12, NEGRO, { padre: cab, pos: [cx1 + 0.02, cy1 - 0.42, k * (zc + 0.3)], radio: 0.015, nombre: "espejo" }); }
    const vid = { padre: cab, vidrio: true, opacidad: 0.22, casco: false, tinta: false, nombre: "vidrio de la cabina", noEncuadrar: true };
    caja(0.03, cy1 - cy0 - 0.06, 2 * zc - 0.1, "#bfe6f2", { ...vid, pos: [cx1, cy0 + 0.03, 0] });
    caja(0.03, cy1 - cy0 - 0.06, 2 * zc - 0.1, "#bfe6f2", { ...vid, pos: [cx0, cy0 + 0.03, 0] });
    for (const k of [-1, 1]) caja(cx1 - cx0 - 0.1, cy1 - cy0 - 0.06, 0.03, "#bfe6f2", { ...vid, pos: [(cx0 + cx1) / 2, cy0 + 0.03, k * zc] });
    cilindro(0.07, 0.09, 0.22, GRIS, { padre: cab, pos: [-0.82, cy0, 0], nombre: "pedestal del asiento" });
    cajaR(0.5, 0.14, 0.52, NEGRO, { padre: cab, pos: [-0.8, cy0 + 0.22, 0], radio: 0.04, nombre: "asiento" });
    cajaR(0.12, 0.66, 0.52, NEGRO, { padre: cab, pos: [-1.08, cy0 + 0.3, 0], radio: 0.04, nombre: "respaldo" });
    cilindro(0.035, 0.035, 0.6, NEGRO, { padre: cab, pos: [-0.05, cy0, 0], rot: [0, 0, 22], nombre: "columna del volante" });
    toro(0.17, 0.026, NEGRO, { padre: cab, pos: [-0.25, cy0 + 0.6, 0], rot: [0, 90, 22], nombre: "volante" });
    const operador = P.persona({ color: "#2f6fdc", nombre: "operador", sentada: true, brazosAlFrente: 62 });   // sentado, mirando al frente (+x), manos al volante
    s.add(operador); operador.position.set(-0.89, cy0 + 0.36 - 0.74 * 0.78, 0); operador.rotation.y = Math.PI / 2; operador.scale.setScalar(0.78);
    P.casco(operador);
    g.operador = operador; g.chasis = chasis; g.cofre = cofre; g.cabina = cab; g.ruedas = ruedas;

    // ---- giro de atrás: soporte, pluma, balancín, bote (todo en el plano del brazo: x hacia atrás)
    const giro = grupo({ padre: s, pos: [-2.35, 0.95, 0], rot: [0, 180, 0], nombre: "brazo excavador" });
    const soporte = cajaR(0.42, 0.97, 0.5, AMARILLO, { padre: giro, pos: [0.1, -0.53, 0], radio: 0.05, nombre: "soporte del brazo" });
    const perno = (padre, pos, nombre) => { const pp = cilindro(0.07, 0.07, 0.42, "#6b7078", { padre, pos, rot: [90, 0, 0], base: false, lados: 14, nombre }); for (const k of [-1, 1]) cilindro(0.095, 0.095, 0.03, NEGRO, { padre: pp, pos: [0, k * 0.2, 0], base: false, lados: 14, nombre: "tapa del perno", tinta: false }); return pp; };
    perno(giro, [0.2, 0.3, 0], "perno del hombro");
    const pluma = grupo({ padre: giro, pos: [0.2, 0.3, 0], nombre: "pluma" });
    extruir([[-0.15, -0.15], [1.25, 0.3], [2.72, -0.12], [2.72, 0.14], [1.25, 0.6], [-0.15, 0.15]], 0.28, AMARILLO, { padre: pluma, nombre: "pluma", bisel: 0.02, angulo: 40 });
    for (const k of [-1, 1]) extruir([[0.15, -0.03], [1.25, 0.37], [2.45, 0.02], [2.45, 0.08], [1.25, 0.5], [0.15, 0.04]], 0.01, "#d99a06", { padre: pluma, pos: [0, 0, k * 0.165], tinta: false, capa: true, nombre: "placa de la pluma" });
    const codo = perno(pluma, [2.62, 0.01, 0], "perno del codo");
    const balancin = grupo({ padre: pluma, pos: [2.62, 0.01, 0], nombre: "balancín" });
    extruir([[-0.42, 0.02], [-0.36, 0.3], [0.1, 0.17], [2.0, 0.1], [2.05, -0.08], [0, -0.14]], 0.2, AMARILLO, { padre: balancin, nombre: "balancín", bisel: 0.02, angulo: 40 });
    for (const k of [-1, 1]) caja(1.6, 0.05, 0.01, "#d99a06", { padre: balancin, base: false, pos: [1.0, 0.0, k * 0.125], tinta: false, capa: true, nombre: "placa del balancín" });
    perno(balancin, [1.95, 0, 0], "perno del bote");
    const bote = grupo({ padre: balancin, pos: [1.95, 0, 0], nombre: "bote" });
    const O = [[-0.05, 0.14], [0.3, 0.3], [0.72, 0.22], [0.98, -0.05], [1.0, -0.4]];
    const I = [[0.02, 0.07], [0.3, 0.23], [0.67, 0.16], [0.91, -0.06], [0.93, -0.38]];
    extruir([...O, ...I.slice().reverse()], 0.58, AMARILLO, { padre: bote, nombre: "bote" });
    caja(0.12, 0.06, 0.64, "#8d949c", { padre: bote, base: false, pos: [0.97, -0.39, 0], rot: [0, 0, -80], nombre: "filo del bote" });
    for (const k of [-1, 1]) extruir([...O, [0.62, -0.36], [0.12, -0.08]], 0.04, AMARILLO, { padre: bote, pos: [0, 0, k * 0.31], nombre: "costado del bote" });
    const dientes = grupo({ padre: bote, nombre: "dientes del bote" });
    for (const z of [-0.22, -0.075, 0.075, 0.22]) cono(0.055, 0.2, "#8d949c", { padre: dientes, pos: [0.99, -0.38, z], rot: [0, 0, 160], nombre: "diente" });
    const tierraBote = esfera(0.34, TIERRA_BOTE, { padre: bote, pos: [0.56, -0.17, 0], escala: [1.25, 1.0, 0.95], nombre: "tierra en el bote", noAlerta: true, noEncuadrar: true });
    for (const x of [giro, pluma, balancin, bote, dientes]) x.userData.flota = true;   // las sostiene su perno (articuladas)
    g.giro = giro; g.soporte = soporte; g.pluma = pluma; g.balancin = balancin; g.bote = bote; g.dientes = dientes; g.codo = codo;

    // ---- cilindros del brazo (aparecen en la escena cuando se nombran)
    g.cilPluma = cilindroHidraulico(giro, [giro, [0.32, -0.36, 0]], [pluma, [1.05, 0.3, 0]], { nombre: "cilindro de la pluma", camisa: 0.95, radio: 0.095 });
    g.cilBalancin = cilindroHidraulico(giro, [pluma, [1.2, 0.68, 0]], [balancin, [-0.38, 0.29, 0]], { nombre: "cilindro del balancín", camisa: 0.95 });
    g.cilBote = cilindroHidraulico(giro, [balancin, [0.28, 0.22, 0]], [bote, [-0.02, 0.2, 0]], { nombre: "cilindro del bote", camisa: 1.05, radio: 0.075 });
    const cils = [g.cilPluma, g.cilBalancin, g.cilBote];
    g.cilindrosBrazo = cils;
    // bomba hidráulica (con su tanque de aceite), al costado del chasis
    const bomba = grupo({ padre: s, pos: [0.15, 0.58, 0.625], nombre: "bomba hidráulica" });
    caja(0.42, 0.42, 0.3, "#4a4f57", { padre: bomba, pos: [0.08, 0, 0.15], nombre: "bomba hidráulica" });
    cilindro(0.17, 0.17, 0.08, "#6b7078", { padre: bomba, pos: [0.08, 0.21, 0.31], rot: [90, 0, 0], base: false, nombre: "tapa de la bomba" });
    cilindro(0.15, 0.15, 0.5, ACEITE, { padre: bomba, pos: [-0.38, 0.17, 0.16], rot: [0, 0, 90], base: false, nombre: "tanque de aceite" });
    cilindro(0.05, 0.05, 0.14, NEGRO, { padre: bomba, pos: [0.14, 0.42, 0.15], nombre: "salida de la bomba" });
    g.bomba = bomba;
    conPuertos(bomba, { salida: { pos: [0.14, 0.56, 0.15], dir: [0, 1, 0] } });

    // ---- estabilizadores (esquinas de atrás): la pata gira hacia afuera y abajo; la zapata siempre queda plana
    const LP = 1.45;
    const estabs = [-1, 1].map((k) => {
      const m = grupo({ padre: s, pos: [-2.08, 1.0, k * 0.62], nombre: "estabilizador" });
      caja(0.22, 0.32, 0.22, AMARILLO, { padre: m, pos: [0, -0.16, 0], nombre: "soporte del estabilizador" });
      const pierna = grupo({ padre: m, nombre: "pata del estabilizador" });
      caja(0.16, LP - 0.06, 0.16, AMARILLO, { padre: pierna, pos: [0, -(LP - 0.06), 0], nombre: "pata del estabilizador" });
      const zapata = grupo({ padre: pierna, pos: [0, -(LP - 0.06), 0], nombre: "zapata" });
      caja(0.44, 0.06, 0.44, NEGRO, { padre: zapata, pos: [0, -0.06, 0], nombre: "zapata del estabilizador" });
      m.k = k; m.pierna = pierna; m.zapata = zapata;
      m.cil = cilindroHidraulico(s, [s, [-2.2, 1.85, k * 0.42]], [pierna, [0, -0.62, 0]], { nombre: "cilindro del estabilizador", camisa: 0.6, radio: 0.065 });
      return m;
    });
    caja(0.14, 0.5, 0.9, AMARILLO, { padre: s, pos: [-2.2, 1.4, 0], nombre: "travesaño de los estabilizadores" });
    g.estabilizadores = estabs;

    // ---- cargador frontal: brazos desde la torre de la cabina hasta la pala, que se mantiene nivelada
    const cargador = grupo({ padre: s, nombre: "cargador frontal" });
    for (const k of [-1, 1]) cajaR(0.26, 0.76, 0.12, AMARILLO, { padre: cargador, pos: [0.24, 1.13, k * 0.655], radio: 0.03, nombre: "torre del cargador" });
    const LB = 2.87, BETA0 = -29.2;
    const brazosC = grupo({ padre: cargador, pos: [0.3, 1.85, 0], nombre: "brazos del cargador" });
    for (const k of [-1, 1]) cajaR(LB + 0.1, 0.17, 0.12, AMARILLO, { padre: brazosC, base: false, pos: [LB / 2, 0, k * 0.66], radio: 0.04, nombre: "brazo del cargador" });
    cilindro(0.07, 0.07, 1.44, AMARILLO, { padre: brazosC, pos: [LB - 0.25, 0, 0], rot: [90, 0, 0], base: false, nombre: "travesaño del cargador" });
    const pala = grupo({ padre: brazosC, pos: [LB, 0, 0], nombre: "pala del cargador" });
    const PO = [[0.08, 0.38], [-0.06, 0.15], [-0.06, -0.28], [0.08, -0.42], [1.0, -0.42], [1.03, -0.36]];
    const PI = [[0.13, 0.33], [0.0, 0.14], [0.0, -0.26], [0.1, -0.36], [1.0, -0.36]];
    extruir([...PO, ...PI.slice().reverse()], 2.26, AMARILLO, { padre: pala, nombre: "pala del cargador" });
    for (const k of [-1, 1]) extruir([[0.08, 0.38], [-0.06, 0.15], [-0.06, -0.28], [0.08, -0.42], [1.0, -0.42], [0.55, 0.06]], 0.05, AMARILLO, { padre: pala, pos: [0, 0, k * 1.155], nombre: "costado de la pala" });
    caja(1.0, 0.05, 2.3, "#8d949c", { padre: pala, pos: [0.52, -0.44, 0], nombre: "cuchilla de la pala" });
    for (const z of [-0.6, 0, 0.6]) caja(0.02, 0.5, 0.06, "#d99a06", { padre: pala, base: false, pos: [-0.075, -0.05, z], capa: true, tinta: false, nombre: "refuerzo de la pala" });
    const tierraPala = caja(0.86, 0.42, 2.1, TIERRA_BOTE, { padre: pala, pos: [0.5, -0.36, 0], nombre: "tierra en la pala", noAlerta: true, noEncuadrar: true });
    esfera(0.45, TIERRA_BOTE, { padre: tierraPala, pos: [0, 0.42, 0], escala: [0.9, 0.5, 2.1], nombre: "copete de tierra" });
    g.cilCargador = [-1, 1].map((k) => cilindroHidraulico(s, [s, [1.05, 0.95, k * 0.66]], [brazosC, [1.25, -0.12, k * 0.66]], { nombre: "cilindro del cargador", camisa: 0.8, radio: 0.07 }));
    brazosC.userData.flota = true; pala.userData.flota = true;
    g.cargador = cargador; g.brazosC = brazosC; g.pala = pala;
    g.cilindros = [...cils, ...estabs.map((m) => m.cil), ...g.cilCargador];

    // ---- poses con tiempo (grados): sw giro, a1 pluma, a2 balancín, a3 bote, phi estabilizadores
    //      (165 recogidos … 25 apoyados), levanta (ladeo en grados), cl alza del cargador, ct inclinación de la pala
    const poses = lineaDeTiempo({ sw: 0, a1: 62, a2: -150, a3: -100, phi: 165, levanta: 0, cl: 0, ct: 0, ...(o.pose || {}) });
    const carga = lineaDeTiempo({ bote: 0, pala: 0 });
    g.pose = (t, v, dur = 0.8, e = "suave") => { poses.a(t, v, dur, e); return g; };
    g.cargar = (t, v, dur = 0.25) => { carga.a(t, v, dur); return g; };
    g.estado = (t) => poses.en(t);

    // ---- manejar: recorridos encadenados desde donde quedó; pasos [{recto: m} | {vuelta: grados, radio}] (+ = a la izquierda)
    const tramos = [];
    let fin = { x: o.inicio?.[0] ?? 0, z: o.inicio?.[1] ?? 0, yaw: rad(o.inicio?.[2] ?? 0), dist: 0 };
    const inicio = { ...fin };
    g.manejar = (t0, dur, pasos, e = "suave") => {
      const pts = [{ ...fin }];
      let c = { ...fin };
      for (const pa of pasos) {
        const n = 24;
        for (let i = 1; i <= n; i++) {
          if (pa.recto !== undefined) {
            const dd = pa.recto / n;
            c = { x: c.x + Math.cos(c.yaw) * dd, z: c.z - Math.sin(c.yaw) * dd, yaw: c.yaw, dist: c.dist + dd };
          } else {
            const dA = rad(pa.vuelta) / n, R = pa.radio ?? 2, dd = Math.abs(dA) * R;
            const yaw2 = c.yaw + dA, ym = c.yaw + dA / 2;
            c = { x: c.x + Math.cos(ym) * dd, z: c.z - Math.sin(ym) * dd, yaw: yaw2, dist: c.dist + dd * Math.sign(R) };
          }
          pts.push({ ...c });
        }
      }
      tramos.push({ t0, dur, pts, e: E[e] || E.suave });
      tramos.sort((a, b) => a.t0 - b.t0);
      fin = { ...c };
      return g;
    };
    const enRuta = (t) => {
      let st = inicio;
      for (const tr of tramos) {
        if (t < tr.t0) break;
        const p = tr.e(prog(t, tr.t0, tr.dur)), L = tr.pts[tr.pts.length - 1].dist - tr.pts[0].dist;
        const objetivo = tr.pts[0].dist + p * L;
        let i = 1;
        while (i < tr.pts.length - 1 && (L >= 0 ? tr.pts[i].dist < objetivo : tr.pts[i].dist > objetivo)) i++;
        const A = tr.pts[i - 1], B = tr.pts[i], seg = B.dist - A.dist, k = seg ? (objetivo - A.dist) / seg : 1;
        st = { x: A.x + (B.x - A.x) * k, z: A.z + (B.z - A.z) * k, yaw: A.yaw + (B.yaw - A.yaw) * k, dist: objetivo };
      }
      return st;
    };
    g.enRuta = enRuta;

    // ---- cada cuadro: recorrido, ladeo, brazo, estabilizadores, cargador, carga y cilindros
    M.cadaCuadro((t) => {
      const r = enRuta(t), q = poses.en(t), c = carga.en(t);
      mov.position.set(r.x, 0, r.z); mov.rotation.set(0, r.yaw, 0);
      for (const w of ruedas) w.giro.rotation.z = -r.dist / w.radio;
      // estabilizadores: al apoyarse levantan la parte de atrás (la máquina gira sobre el eje delantero)
      const phi = rad(q.phi);
      for (const m of estabs) { m.pierna.rotation.x = -m.k * phi; m.zapata.rotation.x = m.k * phi; }
      const alza = Math.max(0, (LP - 0.06) * Math.cos(phi) + 0.06 - 1.0);
      incl.rotation.z = -(Math.atan2(alza, XF + 2.08) + rad(q.levanta));
      giro.rotation.y = Math.PI + rad(q.sw);
      pluma.rotation.z = rad(q.a1); balancin.rotation.z = rad(q.a2); bote.rotation.z = rad(q.a3);
      const beta = rad(BETA0 + q.cl);
      brazosC.rotation.z = beta; pala.rotation.z = -beta + rad(q.ct);
      tierraBote.visible = c.bote > 0.02; tierraBote.scale.set(1.25 * c.bote, 1.0 * c.bote, 0.95 * c.bote);
      tierraPala.visible = c.pala > 0.02; tierraPala.scale.set(1, Math.max(0.01, c.pala), 1);
      g.updateMatrixWorld(true);
      for (const cl of g.cilindros) cl.actualizar();
    });
    // posición del bote en el mundo en el instante t (para poner chorros de tierra donde descarga)
    g.dondeBote = (t, local = [0.55, -0.1, 0]) => { M.actualizar(t); return bote.localToWorld(new THREE.Vector3(...local)); };
    g.dondePala = (t, local = [0.5, -0.2, 0]) => { M.actualizar(t); return pala.localToWorld(new THREE.Vector3(...local)); };

    // ---- pala fija amarrada atrás (la "retro" más tonta posible)
    g.palaFija = () => {
      const pf = grupo({ padre: s, pos: [-2.15, 1.25, 0], rot: [0, 0, -40.4], nombre: "pala amarrada" });
      cilindro(0.075, 0.075, 1.2, "madera", { padre: pf, pos: [0, -1.18, 0], nombre: "mango de la pala" });
      const hoja = extruir([[0, -1.08], [0.34, -1.18], [0.38, -1.45], [0, -1.64], [-0.38, -1.45], [-0.34, -1.18]], 0.06, "#9aa3ad", { padre: pf, rot: [0, 90, 0], nombre: "hoja de la pala" });
      for (const y of [-0.08, -0.32]) toro(0.1, 0.03, "#c8a46b", { padre: pf, pos: [0, y, 0], rot: [90, 0, 0], nombre: "amarre" });
      tubo([[0, -0.08, 0.07], [0.05, 0.06, 0.25], [0.18, 0.12, 0.42]], 0.02, "#c8a46b", { padre: pf, nombre: "cuerda" });
      tubo([[0, -0.32, -0.07], [0.12, -0.1, -0.3], [0.25, 0.02, -0.44]], 0.02, "#c8a46b", { padre: pf, nombre: "cuerda" });
      pf.hoja = hoja;
      return pf;
    };

    // ---- recorrido de la retro antes del primer cuadro
    mov.position.set(inicio.x, 0, inicio.z);
    return g;
  };

  // ------------------------------------------------------------------ CAMIÓN DE VOLTEO (frente hacia +x)
  P.camionVolteo = (o = {}) => {
    const g = grupo({ pos: o.pos, rot: o.rot, nombre: o.nombre || "camión de volteo" });
    const color = o.color || "#e8322b";
    const ruedas = [];
    for (const x of [2.2, -1.0, -2.1]) for (const z of [-0.95, 0.95]) ruedas.push(rueda(0.5, 0.36, { padre: g, pos: [x, 0.5, z], nombre: "llanta del camión", rin: "#c9d0d8", tacos: 12 }));
    for (const x of [2.2, -1.0, -2.1]) cilindro(0.07, 0.07, 1.9, NEGRO, { padre: g, pos: [x, 0.5, 0], rot: [90, 0, 0], base: false, nombre: "eje del camión" });
    caja(5.7, 0.32, 1.0, NEGRO, { padre: g, pos: [-0.1, 0.62, 0], nombre: "chasis del camión" });
    const cab = grupo({ padre: g, nombre: "cabina del camión" });
    cajaR(1.35, 1.25, 2.1, color, { padre: cab, pos: [2.28, 0.94, 0], radio: 0.08, nombre: "cabina del camión" });
    cajaR(1.05, 0.7, 2.0, color, { padre: cab, pos: [2.13, 2.19, 0], radio: 0.1, nombre: "techo del camión" });
    for (let i = 0; i < 5; i++) caja(0.02, 0.05, 1.2, "#5a5f68", { padre: cab, pos: [2.96, 1.35 + i * 0.12, 0], tinta: false, nombre: "parrilla del camión" });
    for (const k of [-1, 1]) cajaR(0.05, 0.3, 0.14, NEGRO, { padre: cab, pos: [2.75, 2.05, k * 1.2], radio: 0.02, nombre: "espejo del camión" });
    caja(0.03, 0.55, 1.8, "#bfe6f2", { padre: cab, pos: [2.665, 2.24, 0], tinta: false, nombre: "parabrisas" });
    for (const k of [-1, 1]) caja(0.75, 0.5, 0.03, "#bfe6f2", { padre: cab, pos: [2.1, 2.26, k * 1.005], tinta: false, nombre: "ventana del camión" });
    caja(0.12, 0.5, 2.14, "#c9d0d8", { padre: cab, pos: [2.98, 0.6, 0], nombre: "defensa del camión" });
    for (const z of [-0.7, 0.7]) cilindro(0.08, 0.08, 0.05, "#fff6c9", { padre: cab, pos: [2.97, 1.3, z], rot: [0, 0, 90], base: false, nombre: "faro del camión", brilla: true });
    const chofer = P.persona({ color: "#3fae5a", nombre: "chofer", sentada: true, brazosAlFrente: 62 });
    cab.add(chofer); chofer.position.set(2.0, 0.85, 0.35); chofer.rotation.y = Math.PI / 2; chofer.scale.setScalar(0.78);
    // caja de volteo
    const caj = grupo({ padre: g, nombre: "caja de volteo" });
    const cx0 = -2.9, cx1 = 1.4, L = cx1 - cx0, mx = (cx0 + cx1) / 2, oc = o.colorCaja || "#f08a24";
    caja(L, 0.12, 2.3, oc, { padre: caj, pos: [mx, 0.78, 0], nombre: "piso de la caja" });
    for (const k of [-1, 1]) {
      caja(L, 1.0, 0.1, oc, { padre: caj, pos: [mx, 0.9, k * 1.1], nombre: "costado de la caja" });
      for (let i = 0; i < 5; i++) caja(0.08, 1.0, 0.03, "#d9701a", { padre: caj, pos: [cx0 + 0.3 + (i * (L - 0.6)) / 4, 0.9, k * 1.165], tinta: false, nombre: "refuerzo de la caja" });
      caja(L - 0.04, 0.07, 0.04, "#d9701a", { padre: caj, pos: [mx, 1.79, k * 1.178], tinta: false, nombre: "borde de la caja" });
    }
    caja(0.1, 1.0, 2.1, oc, { padre: caj, pos: [cx0 + 0.05, 0.9, 0], nombre: "puerta de la caja" });
    caja(0.1, 1.25, 2.1, oc, { padre: caj, pos: [cx1 - 0.05, 0.9, 0], nombre: "frente de la caja" });
    const tierra = grupo({ padre: caj, pos: [mx, 0.9, 0], nombre: "tierra del camión" });
    caja(L - 0.24, 0.6, 2.06, TIERRA_BOTE, { padre: tierra, nombre: "tierra del camión", noAlerta: true });
    esfera(0.9, TIERRA_BOTE, { padre: tierra, pos: [0.2, 0.6, 0], escala: [1.6, 0.5, 1.05], nombre: "copete de tierra" });
    tierra.scale.set(1, 0.001, 1); tierra.visible = false;
    g.cargar = (claves) => {
      const st = { v: 0 }; pista(st, "v", claves);
      M.cadaCuadro(() => { tierra.visible = st.v > 0.01; tierra.scale.set(1, Math.max(0.001, st.v), 1); });
      return g;
    };
    g.ruedas = ruedas; g.caja = caj; g.chofer = chofer;
    g.rodar = (t0, t1, metros) => { for (const w of ruedas) M.efecto(w.giro, (tt, x) => { x.rotation.z -= (metros / w.radio) * E.suave(prog(tt, t0, t1 - t0)); }, "gira porque el camión avanza"); return g; };
    return g;
  };

  function conPuertos(gr, def) { gr.userData.puertos = { ...(gr.userData.puertos || {}), ...def }; return gr; }
}
