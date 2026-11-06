// =====================================================================================
//  mundo.js — motor 3D de los videos animados "problema por problema"
//
//  Un solo mundo continuo que se va CONSTRUYENDO pieza por pieza mientras la cámara lo
//  recorre. Todo es función del tiempo (t en segundos): HyperFrames pide un cuadro y
//  render(t) lo dibuja exacto, sin relojes ni requestAnimationFrame.
//
//  Estilos (cfg.estilo):
//    "toon"    → dibujo animado 3D: sombreado plano de 3 tonos + contorno de tinta (Stupy Doo)
//    "maqueta" → maqueta en corte sobre cuadrícula azul, luz suave, sin tinta (Es ingeniería, Ensamblo)
//    "plano"   → 2D de vista lateral: cámara ortográfica, colores planos, sin luz (Mono que habla)
//
//  Coordenadas: Y arriba, piso en y=0, 1 unidad ≈ 1 metro.
//  Reglas y recetas: guias/ESCENAS.md
// =====================================================================================
import * as THREE from "three";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

const ANCHO = 1080, ALTO = 1920;

// ------------------------------------------------------------------ curvas de tiempo
export const E = {
  lineal: (p) => p,
  entra: (p) => p * p * p,
  sale: (p) => 1 - Math.pow(1 - p, 3),
  suave: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  seno: (p) => -(Math.cos(Math.PI * p) - 1) / 2,
  rebote: (p) => {
    const n = 7.5625, d = 2.75;
    if (p < 1 / d) return n * p * p;
    if (p < 2 / d) return n * (p -= 1.5 / d) * p + 0.75;
    if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + 0.9375;
    return n * (p -= 2.625 / d) * p + 0.984375;
  },
  resorte: (p) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
  elastico: (p) => (p === 0 || p === 1 ? p : Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
};
const curva = (e) => (typeof e === "function" ? e : E[e] || E.suave);
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const prog = (t, t0, dur) => clamp01(dur <= 0 ? (t >= t0 ? 1 : 0) : (t - t0) / dur);
const lerp = (a, b, p) => a + (b - a) * p;
const v3 = (a) => (a instanceof THREE.Vector3 ? a.clone() : new THREE.Vector3(...(a || [0, 0, 0])));
// azar determinista (mismo resultado en cada cuadro y en cada render)
export function azar(semilla = 1) {
  let s = semilla >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ------------------------------------------------------------------ paletas por estilo
export const PALETAS = {
  pizarra: {
    fondo: "#fbfaf6", tinta: "#1d1d1f", blanco: "#ffffff", papel: "#fffdf7", gris: "#c9ccd1", grisClaro: "#e9eaee",
    azul: "#2f6fdc", meta: "#0866ff", rojo: "#e8322b", amarillo: "#ffd23f", verde: "#2fbf5b", whatsapp: "#25d366",
    naranja: "#ff9f1c", morado: "#7b5cff", piel: "#f1c6a6", negro: "#26282f", energia: "#2f6fdc", agua: "#2f6fdc",
    concreto: "#e9eaee", muro: "#ffffff", madera: "#c8935e", metal: "#c9d0d8", acero: "#9aa3ad", pasto: "#7cc96a", tierra: "#c79a6b", cable: "#1d1d1f",
  },
  toon: {
    cieloArriba: "#8fd3f4", cieloAbajo: "#e8f7fb", tinta: "#1b1d24", suelo: "#a8e063",
    concreto: "#e9e4da", muro: "#f2d9c4", ladrillo: "#b5654a", teja: "#e07a4f", madera: "#a8754a",
    metal: "#c9d0d8", acero: "#8a94a0", agua: "#4fb3ff", tierra: "#9a6b45", pasto: "#86d24a",
    azul: "#2f6fdc", rojo: "#e8322b", amarillo: "#ffd23f", naranja: "#ff9f1c", verde: "#3fae5a",
    blanco: "#ffffff", negro: "#26282f", gris: "#9aa3ad", cable: "#22242b", energia: "#ffe14d",
  },
  maqueta: {
    fondo: "#2d7bd8", reticula: "#ffffff", tinta: "#1b1d24", suelo: "#7a5236",
    concreto: "#c9c6bf", muro: "#b9b5ad", ladrillo: "#a85b43", teja: "#c96a45", madera: "#9c6b43",
    metal: "#d5dbe1", acero: "#8d969f", agua: "#7fc8f0", tierra: "#7b5233", tierraClara: "#a57a50",
    pasto: "#5fae3c", azul: "#2f6fdc", rojo: "#e5383b", amarillo: "#f4c430", naranja: "#f08a24",
    verde: "#3c9a4f", blanco: "#f4f4f2", negro: "#2a2c31", gris: "#8f969e", cable: "#2a2c31", energia: "#ffe14d",
  },
  plano: {
    cieloArriba: "#8ecff5", cieloAbajo: "#bfe6fb", tinta: "#1b1d24", suelo: "#a0663f",
    concreto: "#c9ccd1", muro: "#f3dfb8", ladrillo: "#c0684a", teja: "#ef6c3a", madera: "#a8754a",
    metal: "#d7dde3", acero: "#99a3ad", agua: "#5cc0ff", tierra: "#b07443", tierraOscura: "#8c5a34",
    pasto: "#6cc04a", azul: "#2f6fdc", rojo: "#e8322b", amarillo: "#ffc93c", naranja: "#ff9f1c",
    verde: "#2e9e57", blanco: "#ffffff", negro: "#26282f", gris: "#9aa3ad", cable: "#33353c", energia: "#ffe14d",
  },
};

// ------------------------------------------------------------------ sombreados
function rampaToon(pasos) {
  const datos = new Uint8Array(pasos.length * 4);
  pasos.forEach((v, i) => datos.set([v, v, v, 255], i * 4));
  const tex = new THREE.DataTexture(datos, pasos.length, 1, THREE.RGBAFormat);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

// Contorno de silueta con grosor constante en PIXELES (casco invertido en espacio de recorte).
function materialCasco(color, grosorPx, ss = 1) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { color: { value: new THREE.Color(color) }, grosor: { value: grosorPx }, res: { value: new THREE.Vector2(ANCHO * ss, ALTO * ss) } },
    vertexShader: /* glsl */ `
      uniform float grosor; uniform vec2 res;
      #include <common>
      #include <shadowmap_pars_vertex>
      void main() {
        vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vec3 nv = normalize(normalMatrix * normal);
        vec2 nc = (projectionMatrix * vec4(nv, 0.0)).xy;
        float l = length(nc);
        if (l > 1e-5) clip.xy += (nc / l) * grosor * 2.0 / res * clip.w;
        gl_Position = clip;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 color;
      void main() { gl_FragColor = vec4(color, 1.0); }`,
  });
}

// =====================================================================================
export function crearMundo(cfg = {}) {
  const estilo = cfg.estilo || "toon";
  const P = { ...PALETAS[estilo], ...(cfg.paleta || {}) };
  const canvas = cfg.canvas || document.getElementById("mundo");
  const SS = cfg.supermuestreo ?? 2;   // 2 = se dibuja a 2160×3840 y se reduce: adiós dientes y bordes que tiemblan
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: SS < 2, alpha: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(SS);
  renderer.setSize(ANCHO, ALTO, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = estilo === "maqueta" ? THREE.NeutralToneMapping : THREE.NoToneMapping;
  const es2D = estilo === "plano" || estilo === "pizarra";   // vista lateral fija, cámara ortográfica
  renderer.shadowMap.enabled = !es2D && cfg.sombras !== false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const escena = new THREE.Scene();
  let camara;
  if (es2D) {
    const alto = cfg.altoVista || 12;   // metros visibles en vertical
    camara = new THREE.OrthographicCamera((-alto * ANCHO) / ALTO / 2, (alto * ANCHO) / ALTO / 2, alto / 2, -alto / 2, 0.1, 500);
    camara.userData.altoVista = alto;
  } else {
    camara = new THREE.PerspectiveCamera(cfg.fov || (estilo === "maqueta" ? 30 : 36), ANCHO / ALTO, 0.1, 800);   // en 9:16 el ángulo horizontal es angosto: no bajar de 34
  }

  // ---------- fondo
  function degradado(arriba, abajo) {
    const c = document.createElement("canvas");
    c.width = 4; c.height = 512;
    const g = c.getContext("2d");
    const lg = g.createLinearGradient(0, 0, 0, 512);
    lg.addColorStop(0, arriba); lg.addColorStop(1, abajo);
    g.fillStyle = lg; g.fillRect(0, 0, 4, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  if (estilo === "maqueta") {
    escena.background = new THREE.Color(P.fondo);
    const ret = new THREE.GridHelper(300, 300, P.reticula, P.reticula);      // cuadrícula fina (1 m)
    ret.material.transparent = true; ret.material.opacity = 0.35; ret.material.depthWrite = false;
    ret.position.y = cfg.alturaReticula ?? -3.4;   // debajo del terreno (que llega a −3): si no, "ahoga" la cisterna
    escena.add(ret);
    const ret5 = new THREE.GridHelper(300, 60, P.reticula, P.reticula);      // cuadrícula gruesa (5 m), como papel de plano
    ret5.material.transparent = true; ret5.material.opacity = 0.75; ret5.material.depthWrite = false;
    ret5.position.y = ret.position.y + 0.002;
    escena.add(ret5);
    const bajo = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.MeshBasicMaterial({ color: P.fondo }));
    bajo.rotation.x = -Math.PI / 2; bajo.position.y = ret.position.y - 0.01;
    escena.add(bajo);
  } else if (estilo === "pizarra") {
    escena.background = new THREE.Color(P.fondo);   // pizarra blanca
  } else if (estilo === "plano") {
    escena.background = new THREE.Color(P.cieloArriba);   // cielo liso, como ilustración
    // sol y nubes planos, muy atrás (en vista lateral se ven como recortes de papel)
    const fondo = new THREE.Group(); escena.add(fondo);
    const disco = (r, color, x, y, z = -60) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 48), new THREE.MeshBasicMaterial({ color })); m.position.set(x, y, z); fondo.add(m); return m; };
    disco(1.6, "#ffd23f", 9, 13); disco(2.2, "#fff3b0", 9, 13, -61);
    for (const [x, y] of [[-8, 12.5], [2, 15], [-2, 10.5]]) { disco(1.1, "#ffffff", x, y); disco(0.85, "#ffffff", x + 1.2, y + 0.3); disco(0.8, "#ffffff", x - 1.1, y + 0.1); disco(0.7, "#ffffff", x + 0.3, y + 0.75); }
  } else {
    escena.background = degradado(P.cieloArriba, P.cieloAbajo);
  }

  // ---------- luces
  const sol = new THREE.DirectionalLight(0xffffff, estilo === "maqueta" ? 2.6 : 2.2);
  sol.position.set(...(cfg.sol || [8, 14, 6]));
  sol.castShadow = renderer.shadowMap.enabled;
  const ts = cfg.tamSombra || 18;
  Object.assign(sol.shadow.camera, { left: -ts, right: ts, top: ts, bottom: -ts, near: 0.5, far: 80 });
  sol.shadow.mapSize.set(2048, 2048);
  sol.shadow.bias = -0.0006;
  sol.shadow.normalBias = 0.02;
  escena.add(sol); escena.add(sol.target);   // en plano no proyecta sombra, pero da el lado claro y el oscuro
  const ambiente = new THREE.HemisphereLight(0xffffff, estilo === "maqueta" ? 0x7a6a5a : 0xb8c4d0, estilo === "maqueta" ? 1.1 : 1.5);
  escena.add(ambiente);
  if (estilo === "plano") { ambiente.intensity = 1.9; sol.intensity = 1.6; }
  if (estilo === "maqueta") { sol.shadow.mapSize.set(4096, 4096); sol.intensity = 3.0; ambiente.intensity = 1.25; ambiente.color.set("#dfeaff"); ambiente.groundColor.set("#8a6a4a"); }

  // ---------- materiales (cacheados por color)
  const rampa = rampaToon([150, 205, 255]);
  const rampaPlana = rampaToon([196, 255]);
  const cacheMat = new Map();
  function mat(color, o = {}) {
    const clave = `${color}|${["opacidad", "dobleCara", "brilla", "rugosidad", "metal", "facetado", "vidrio", "capa"].map((k) => o[k]).join("|")}`;
    if (cacheMat.has(clave) && !o.unico) return cacheMat.get(clave);
    let m;
    const comun = { color: new THREE.Color(color), transparent: o.opacidad !== undefined, opacity: o.opacidad ?? 1, side: o.dobleCara ? THREE.DoubleSide : THREE.FrontSide };
    if (o.brilla) m = new THREE.MeshBasicMaterial({ ...comun, toneMapped: false });
    else if (estilo === "toon") m = new THREE.MeshToonMaterial({ ...comun, gradientMap: rampa });
    else if (estilo === "maqueta") m = new THREE.MeshStandardMaterial({ ...comun, roughness: o.rugosidad ?? 0.85, metalness: o.metal ?? 0, flatShading: o.facetado ?? false });
    else m = new THREE.MeshBasicMaterial(comun);   // plano y pizarra: color plano, sin sombreado (ilustración 2D)
    if (o.vidrio) { m.transparent = true; m.opacity = o.opacidad ?? 0.35; m.depthWrite = false; }
    if (o.capa) { m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; }   // calcomanías, charcos, azulejo
    if (!o.unico) cacheMat.set(clave, m);
    return m;
  }
  const col = (c) => (c && P[c]) || c || P.gris;

  // ---------- contornos de tinta (solo estilo toon, o si se pide)
  const grosorTinta = cfg.grosorTinta ?? (estilo === "plano" ? 2.6 : estilo === "pizarra" ? 5 : 4.2);   // pizarra: trazo de plumón
  const grosorArista = cfg.grosorArista ?? (estilo === "plano" ? 2.0 : estilo === "pizarra" ? 4.2 : 3.4);
  const matArista = new LineMaterial({ color: new THREE.Color(P.tinta).getHex(), linewidth: grosorArista * SS, resolution: new THREE.Vector2(ANCHO * SS, ALTO * SS) });
  const matCasco = materialCasco(P.tinta, grosorTinta * SS, SS);
  const usarTinta = cfg.tinta ?? (estilo === "toon" || es2D);
  function entintar(malla, o = {}) {
    if (!(malla.isMesh) || o.tinta === false || !(o.tinta || usarTinta)) return malla;
    const g = malla.geometry;
    if (o.casco !== false) {
      const suave = mergeVertices(g.clone().deleteAttribute("normal").deleteAttribute("uv"), 1e-4);
      suave.computeVertexNormals();
      const casco = new THREE.Mesh(suave, matCasco);
      casco.userData.esTinta = true;
      casco.raycast = () => {};
      malla.add(casco);
    }
    if (o.aristas !== false) {
      const bordes = new THREE.EdgesGeometry(g, o.angulo ?? 32);
      const lg = new LineSegmentsGeometry().fromEdgesGeometry(bordes);
      const lineas = new LineSegments2(lg, matArista);
      lineas.userData.esTinta = true;
      malla.add(lineas);
    }
    return malla;
  }

  // Caja de la geometría PROPIA de una malla, sin sus hijos (lo montado encima con sobre() no cuenta).
  function cajaPropia(h, destino = new THREE.Box3()) {
    if (!h.geometry.boundingBox) h.geometry.computeBoundingBox();
    return destino.copy(h.geometry.boundingBox).applyMatrix4(h.matrixWorld);
  }
  // Recorre una pieza sin entrar a lo que se le montó encima con sobre().
  function recorrerPropio(obj, fn) { fn(obj); for (const h of obj.children) if (!h.userData.montadaSobre) recorrerPropio(h, fn); }

  // ---------- creación de piezas
  const raiz = new THREE.Group();
  escena.add(raiz);
  function colocar(obj, o = {}) {
    if (o.pos) obj.position.set(...o.pos);
    if (o.rot) obj.rotation.set(...o.rot.map((g) => (g * Math.PI) / 180));   // grados
    if (o.escala !== undefined) Array.isArray(o.escala) ? obj.scale.set(...o.escala) : obj.scale.setScalar(o.escala);
    (o.padre || raiz).add(obj);
    obj.traverse((h) => { if (h.isMesh && !h.isLineSegments2 && !h.userData.esTinta) { h.castShadow = o.sombra !== false; h.receiveShadow = true; } });
    if (o.nombre) obj.name = o.nombre;
    if (o.flota || estilo === "pizarra") obj.userData.flota = true;   // el revisor no la marca como "suelta"; en pizarra todo es dibujo
    if (o.revisar === false) obj.userData.noRevisar = true;   // decoración que puede quedar tapada a propósito
    return obj;
  }
  let contador = 0;
  // ---------- MAQUETA: texturas de materiales reales, hechas por código (sin imágenes externas)
  const cacheTex = new Map();
  function texturaReal(tipo) {
    if (cacheTex.has(tipo)) return cacheTex.get(tipo);
    const N = 512, c = document.createElement("canvas"); c.width = c.height = N;
    const g = c.getContext("2d"), rnd = azar([...tipo].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7));
    const hex = (base, k) => "#" + new THREE.Color(base).offsetHSL(0, 0, k).getHexString();
    const granos = (base, k, n, t0 = 1, t1 = 3) => { for (let i = 0; i < n; i++) { g.fillStyle = hex(base, (rnd() - 0.5) * k); const t = t0 + rnd() * (t1 - t0); g.fillRect(rnd() * N, rnd() * N, t, t); } };
    let metros = 1, rug = 0.9;
    if (tipo === "bloque") {            // block de concreto 40×20 cm con juntas de mortero
      metros = 1.2; g.fillStyle = "#9a9b9c"; g.fillRect(0, 0, N, N);
      const bw = N / 3, bh = N / 6;
      for (let r = 0; r < 6; r++) for (let k = -1; k < 4; k++) {
        const x = k * bw + (r % 2) * bw / 2, y = r * bh;
        g.fillStyle = hex("#b9b8b3", (rnd() - 0.5) * 0.08); g.fillRect(x + 5, y + 5, bw - 10, bh - 10);
      }
      granos("#b5b4ae", 0.18, 9000);
    } else if (tipo === "ladrillo") {
      metros = 0.9; g.fillStyle = "#d8cfc2"; g.fillRect(0, 0, N, N);
      const bw = N / 4, bh = N / 10;
      for (let r = 0; r < 10; r++) for (let k = -1; k < 5; k++) { g.fillStyle = hex("#a8573d", (rnd() - 0.5) * 0.12); g.fillRect(k * bw + (r % 2) * bw / 2 + 4, r * bh + 4, bw - 8, bh - 8); }
      granos("#a8573d", 0.2, 6000);
    } else if (tipo === "tierra") {     // corte de suelo: capas horizontales y piedras
      metros = 4; const capas = ["#7a5134", "#6f4a2f", "#86603f", "#6a4429", "#7d5637"];
      let y = 0; while (y < N) { const h = 50 + rnd() * 90; g.fillStyle = capas[Math.floor(rnd() * capas.length)]; g.fillRect(0, y, N, h + 2); y += h; }
      granos("#7a5134", 0.25, 12000, 1, 4);
      for (let i = 0; i < 70; i++) { g.fillStyle = hex("#9a948a", (rnd() - 0.5) * 0.25); g.beginPath(); g.ellipse(rnd() * N, rnd() * N, 3 + rnd() * 9, 2 + rnd() * 6, rnd() * 3, 0, 7); g.fill(); }
    } else if (tipo === "concreto") {
      metros = 2.5; g.fillStyle = "#c9c6bf"; g.fillRect(0, 0, N, N); granos("#c9c6bf", 0.16, 16000, 1, 3);
      for (let i = 0; i < 14; i++) { g.fillStyle = hex("#c9c6bf", -0.015 - rnd() * 0.02); g.beginPath(); g.ellipse(rnd() * N, rnd() * N, 30 + rnd() * 60, 20 + rnd() * 40, rnd() * 3, 0, 7); g.fill(); }   // manchas suaves, no lunares
    } else if (tipo === "pasto") {
      metros = 3; g.fillStyle = "#5c9e3c"; g.fillRect(0, 0, N, N);
      for (let i = 0; i < 9000; i++) { g.strokeStyle = hex("#5c9e3c", (rnd() - 0.5) * 0.22); g.lineWidth = 1.5; const x = rnd() * N, y = rnd() * N; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 4, y - 3 - rnd() * 6); g.stroke(); }
    } else if (tipo === "asfalto") {
      metros = 2; g.fillStyle = "#54585e"; g.fillRect(0, 0, N, N); granos("#54585e", 0.3, 20000, 1, 2.5); rug = 0.95;
    } else if (tipo === "madera") {
      metros = 1; g.fillStyle = "#9c6b43"; g.fillRect(0, 0, N, N);
      for (let i = 0; i < 60; i++) { g.strokeStyle = hex("#9c6b43", (rnd() - 0.5) * 0.2); g.lineWidth = 1 + rnd() * 3; const x = rnd() * N; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 10, N / 3, x - 10, N * 2 / 3, x + 5, N); g.stroke(); }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 8;
    const r = { tex, metros, rug };
    cacheTex.set(tipo, r);
    return r;
  }
  const TEXTURAS = { muro: "bloque", concreto: "concreto", tierra: "tierra", pasto: "pasto", ladrillo: "ladrillo", madera: "madera", "#62666e": "asfalto" };
  const cacheMatReal = new Map();
  function materialReal(tipo) {
    if (cacheMatReal.has(tipo)) return cacheMatReal.get(tipo);
    const { tex, rug } = texturaReal(tipo);
    const m = new THREE.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: rug, metalness: 0 });
    cacheMatReal.set(tipo, m);
    return m;
  }
  // UV en METROS por proyección de caja: la textura no se estira según el tamaño de la pieza
  function uvMetros(geo, metros) {
    const pos = geo.attributes.position, nor = geo.attributes.normal;
    if (!nor) geo.computeVertexNormals();
    const n = geo.attributes.normal, uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const [u, v] = ay >= ax && ay >= az ? [x, z] : ax >= az ? [z, y] : [x, y];
      uv[i * 2] = u / metros; uv[i * 2 + 1] = v / metros;
    }
    geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  }
  function malla(geo, color, o = {}) {
    let materialPropio = o.material;
    if (!materialPropio && estilo === "maqueta" && typeof color === "string" && TEXTURAS[color] && !o.vidrio && o.opacidad === undefined) {
      const tipo = TEXTURAS[color];
      uvMetros(geo, texturaReal(tipo).metros);
      materialPropio = o.capa ? (() => { const m = materialReal(tipo).clone(); m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; return m; })() : materialReal(tipo);
    }
    const m = new THREE.Mesh(geo, materialPropio || mat(col(color), o));
    if (o.vidrio || (o.opacidad !== undefined && o.opacidad < 1)) m.renderOrder = 10;   // lo translúcido al final
    m.userData.tipo = o._tipo || geo.type.replace("Geometry", "").toLowerCase();
    m.name = o.nombre || `${m.userData.tipo} ${typeof color === "string" ? color : ""} #${++contador}`;
    if (o.flota || estilo === "pizarra") m.userData.flota = true;
    if (o.noEncuadrar) m.userData.noEncuadrar = true;
    if (o.estructura) m.userData.estructura = true;   // muros, losas, terreno: un tubo SÍ puede atravesarlos
    if (o.noAlerta) m.userData.noAlerta = true;       // contenidos (agua): la alerta no los tiñe
    entintar(m, o);
    return colocar(m, o);
  }
  const caja = (an, al, pr, color, o = {}) => {
    const g = new THREE.BoxGeometry(an, al, pr);
    if (o.base !== false) g.translate(0, al / 2, 0);   // el origen queda en la base: se apoya en y
    return malla(g, color, o);
  };
  const cilindro = (rArr, rAb, al, color, o = {}) => {
    const g = new THREE.CylinderGeometry(rArr, rAb, al, o.lados || 28, 1, o.abierto || false);
    if (o.base !== false) g.translate(0, al / 2, 0);
    return malla(g, color, { angulo: 50, ...o });
  };
  const esfera = (r, color, o = {}) => malla(new THREE.SphereGeometry(r, o.lados || 28, Math.max(8, (o.lados || 28) / 2)), color, { aristas: false, ...o });
  const cono = (r, al, color, o = {}) => { const g = new THREE.ConeGeometry(r, al, o.lados || 24); if (o.base !== false) g.translate(0, al / 2, 0); return malla(g, color, { angulo: 50, ...o }); };
  const toro = (r, tubo, color, o = {}) => malla(new THREE.TorusGeometry(r, tubo, 12, o.lados || 40, o.arco ? (o.arco * Math.PI) / 180 : Math.PI * 2), color, { aristas: false, ...o });
  // Textura de manchas suaves (pasto, tierra, concreto): rompe lo plano como en las referencias.
  function texturaManchas(color, o = {}) {
    const c = document.createElement("canvas"); c.width = c.height = 512;
    const g = c.getContext("2d"), rnd = azar(o.semilla || 3), base = new THREE.Color(color);
    g.fillStyle = "#" + base.getHexString(); g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < (o.n || 70); i++) {
      const k = (rnd() - 0.5) * (o.contraste ?? 0.16), x = rnd() * 512, y = rnd() * 512, r = 20 + rnd() * 70;
      const m = base.clone().offsetHSL(0, 0, k);
      for (const [dx, dy] of [[0, 0], [512, 0], [-512, 0], [0, 512], [0, -512]]) {   // repetible sin costuras
        g.fillStyle = "#" + m.getHexString(); g.beginPath(); g.ellipse(x + dx, y + dy, r, r * (0.5 + rnd() * 0.5), rnd() * 3, 0, Math.PI * 2); g.fill();
      }
    }
    if (o.motas) for (let i = 0; i < o.motas; i++) { g.fillStyle = "#" + base.clone().offsetHSL(0, 0, -0.25).getHexString(); g.fillRect(rnd() * 512, rnd() * 512, 3, 5); }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(o.repetir || 4, o.repetir || 4); tex.anisotropy = 8;
    return tex;
  }
  const plano = (an, pr, color, o = {}) => {
    const g = new THREE.PlaneGeometry(an, pr); g.rotateX(-Math.PI / 2);
    if (o.manchas && estilo !== "maqueta") {
      const m = mat(col(color), { ...o, unico: true });
      m.map = texturaManchas(col(color), { repetir: Math.max(1, Math.round(an / 10)), motas: 140, ...(typeof o.manchas === "object" ? o.manchas : {}) });
      m.color.set("#ffffff");
      return malla(g, color, { casco: false, aristas: false, material: m, ...o });
    }
    return malla(g, color, { casco: false, ...o });
  };
  // Forma 2D (lista de [x,y]) extruida en Z. Para siluetas: techos a dos aguas, perfiles, piezas raras.
  const extruir = (puntos, prof, color, o = {}) => {
    const s = new THREE.Shape(puntos.map(([x, y]) => new THREE.Vector2(x, y)));
    (o.hoyos || []).forEach((h) => s.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y)))));
    const g = new THREE.ExtrudeGeometry(s, { depth: prof, bevelEnabled: !!o.bisel, bevelSize: o.bisel || 0, bevelThickness: o.bisel || 0, bevelSegments: 2, curveSegments: o.segmentos || 16 });
    g.translate(0, 0, -prof / 2);
    return malla(g, color, o);
  };
  // Sólido de revolución (lista de [radio, y]): macetas, botellas, tanques, focos.
  const tornear = (perfil, color, o = {}) => malla(new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(r, y)), o.lados || 32), color, { angulo: 50, ...o });
  // Tubo que sigue puntos: cables, mangueras, tuberías, cuerdas.
  function tubo(puntos, radio, color, o = {}) {
    const c = new THREE.CatmullRomCurve3(puntos.map(v3), false, o.recto ? "chordal" : "centripetal", o.tension ?? 0.5);
    if (o.recto) c.curveType = "catmullrom", c.tension = 0;
    const g = new THREE.TubeGeometry(c, o.segmentos || Math.max(24, puntos.length * 16), radio, o.lados || 10, false);
    const m = malla(g, color, { aristas: false, ...o });
    m.userData.curva = c;
    return m;
  }
  // Tubería de tramos rectos con codos (las tuberías reales no son curvas suaves).
  function tuberia(puntos, radio, color, o = {}) {
    const g = new THREE.Group();
    colocar(g, { pos: o.pos, padre: o.padre });
    const ps = puntos.map(v3);
    for (let i = 0; i < ps.length - 1; i++) {
      const a = ps[i], b = ps[i + 1], largo = a.distanceTo(b);
      const t = cilindro(radio, radio, largo, color, { base: false, padre: g, lados: 20, ...o.material && { material: o.material } });
      t.position.copy(a).add(b).multiplyScalar(0.5);
      t.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      if (i > 0) esfera(radio * 1.18, color, { padre: g, pos: [a.x, a.y, a.z] });
    }
    g.userData.curva = new THREE.CatmullRomCurve3(ps, false, "catmullrom", 0);
    return g;
  }
  const grupo = (o = {}) => { const g = colocar(new THREE.Group(), o); if (!g.name) g.name = `grupo #${++contador}`; return g; };
  // Volumen invisible que solo sirve para encuadrar (un cuarto, una zona): camara.mostrar(t, [volumen]).
  const matEncuadre = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, transparent: true, opacity: 0 });
  function zona(an, al, pr, o = {}) {
    const g = new THREE.BoxGeometry(an, al, pr); g.translate(0, al / 2, 0);
    const m = new THREE.Mesh(g, matEncuadre);
    m.userData.soloEncuadre = true; m.userData.flota = true; m.userData.noRevisar = true; m.castShadow = false;
    m.name = o.nombre || "zona";
    m.raycast = () => {};
    return colocar(m, { ...o, sombra: false });
  }

  // ---------- ANCLAJES: un punto fijo de una pieza que se mueve con ella.
  // punto(tinaco, [0.84, 0.2, 0]) → función que da su posición en el mundo en el cuadro actual.
  function punto(obj, local = [0, 0, 0]) {
    const l = v3(local);
    const f = () => obj.localToWorld(l.clone());
    f.obj = obj;
    return f;
  }
  const resolver = (q) => (typeof q === "function" ? q() : v3(q));
  // Tubería VIVA: cada punto puede ser fijo [x,y,z] o un anclaje punto(obj, local). Se recalcula cada cuadro,
  // así que si el tinaco sube, el tubo lo sigue y NUNCA se despega. Con {t0, dur} se tiende a lo largo
  // de su camino (como si la instalaran); con t1 se quita.
  const pendientesVivas = [];
  // o.ortogonal = "yxz": entre cada par de puntos el tubo va primero en y, luego en x y luego en z (codos a 90°).
  function expandir(ps, orden) {
    if (!orden) return ps;
    const r = [ps[0]];
    for (let i = 1; i < ps.length; i++) {
      const a = r[r.length - 1].clone(), q = ps[i];
      for (const eje of orden.slice(0, 2)) { a[eje] = q[eje]; r.push(a.clone()); }
      r.push(q.clone());
    }
    return r;
  }
  function tuberiaViva(puntosOriginales, radio, color, o = {}) {
    const orden = o.ortogonal;
    const n = orden ? 1 + (puntosOriginales.length - 1) * 3 : puntosOriginales.length;
    const puntos = Array.from({ length: n });
    const g = grupo({ nombre: o.nombre || "tubería" });
    g.userData.esTuberia = true;
    g.userData.montados = [];
    g.userData.enterrada = !!o.enterrada;
    g.userData.radio = radio;
    g.userData.pulsos = [];   // latir en un tubo engrosa el tubo (no lo escala: se despegaría de sus conexiones)
    let material = o.material || mat(col(color), o);
    if (o.enterrada) {   // rayos X: se dibuja encima de la tierra, translúcido, para seguir el recorrido bajo el suelo
      material = new THREE.MeshBasicMaterial({ color: new THREE.Color(col(color)), transparent: true, opacity: 0.75, depthTest: false, depthWrite: false });
      o = { ...o, tinta: false, sombra: false };
    }
    const geo = new THREE.CylinderGeometry(radio, radio, 1, o.lados || 20, 1, true);
    const tramos = [], codos = [];
    for (let i = 0; i < puntos.length - 1; i++) {
      const m = new THREE.Mesh(geo, material);
      m.name = (o.nombre || "tubería") + ` tramo ${i + 1}`;
      m.userData.tramo = true;
      entintar(m, { aristas: false, ...o });
      m.castShadow = o.sombra !== false; m.receiveShadow = !o.enterrada;
      if (o.enterrada) m.renderOrder = 40;
      g.add(m); tramos.push(m);
    }
    for (let i = 0; i < puntos.length; i++) {
      const c = new THREE.Mesh(new THREE.SphereGeometry(radio * (i === 0 || i === puntos.length - 1 ? 1.0 : 1.12), 16, 10), material);
      c.name = (o.nombre || "tubería") + ` codo ${i}`;
      entintar(c, { aristas: false, ...o });
      c.castShadow = o.sombra !== false;
      if (o.enterrada) c.renderOrder = 40;
      g.add(c); codos.push(c);
    }
    g.userData.puntos = () => expandir(puntosOriginales.map(resolver), orden);
    g.userData.anclas = puntosOriginales.filter((q) => typeof q === "function" && q.obj).map((q) => q.obj);
    const t0 = o.t0 ?? -1e9, dur = o.dur ?? 0, t1 = o.t1 ?? Infinity;
    const durSalida = o.durSalida ?? 0.5;   // al quitarse, el tubo se "destiende" (nunca desaparece de golpe)
    g.userData.revelado = (tt) => (tt < t0 || tt >= t1 + durSalida ? 0 : tt >= t1 ? 1 - E.suave(prog(tt, t1, durSalida)) : dur > 0 ? E.suave(prog(tt, t0, dur)) : 1);   // fracción tendida
    g.userData.t0 = t0; g.userData.t1 = t1;
    if (o.t0 !== undefined) apariciones.push({ obj: g, t: t0, dur, modo: "tender", revisar: o.revisar !== false });
    const Y = new THREE.Vector3(0, 1, 0);
    pendientesVivas.push((tt) => {
      const vivo = tt >= t0 && tt < t1 + durSalida;
      g.visible = vivo;
      if (!vivo) return;
      const ps = g.userData.puntos();
      const largos = ps.slice(1).map((q, i) => q.distanceTo(ps[i]));
      const total = largos.reduce((a, b) => a + b, 0);
      const limite = g.userData.revelado(tt) * total;
      let f = 1;
      for (const pu of g.userData.pulsos) if (tt >= pu.t && tt <= pu.t + pu.dur) f *= 1 + Math.sin(((tt - pu.t) / pu.dur) * Math.PI) * pu.k * 2.5;
      let acum = 0;
      codos[0].visible = limite > 0; codos[0].position.copy(ps[0]);
      for (let i = 0; i < tramos.length; i++) {
        const L = largos[i], resto = limite - acum, m = tramos[i];
        if (resto <= 1e-4 || L < 1e-5) { m.visible = false; codos[i + 1].visible = false; acum += L; continue; }
        const l = Math.min(L, resto), dir = ps[i + 1].clone().sub(ps[i]).normalize();
        m.visible = true;
        m.position.copy(ps[i]).addScaledVector(dir, l / 2);
        m.quaternion.setFromUnitVectors(Y, dir);
        m.scale.set(f, l, f);
        codos[i + 1].visible = resto >= L;
        codos[i + 1].position.copy(ps[i + 1]);
        codos[i + 1].scale.setScalar(f);
        acum += L;
      }
      // piezas montadas sobre el tubo (filtros, llaves, medidores): siempre en su lugar aunque el tubo se mueva
      for (const mo of g.userData.montados) {
        let objetivo = mo.desdeFin !== undefined ? total - mo.desdeFin : mo.u * total, a2 = 0;
        for (let i = 0; i < largos.length; i++) {
          if (a2 + largos[i] >= objetivo || i === largos.length - 1) {
            const k = largos[i] > 0 ? Math.min(1, Math.max(0, (objetivo - a2) / largos[i])) : 0;
            const w = ps[i].clone().lerp(ps[i + 1], k);
            mo.pieza.position.copy(mo.pieza.parent.worldToLocal(w));
            if (mo.alinear && largos[i] > 1e-4) mo.pieza.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), ps[i + 1].clone().sub(ps[i]).normalize());
            break;
          }
          a2 += largos[i];
        }
      }
    });
    return g;
  }
  // Fracción (0…1) del tubo donde quedó una pieza montada: flujo(tubo, {tramo: () => [0, fraccionEn(tubo, filtro)]})
  function fraccionEn(tuberia, pieza) {
    const mo = tuberia.userData.montados.find((x) => x.pieza === pieza);
    const ps = tuberia.userData.puntos(), largos = ps.slice(1).map((q, i) => q.distanceTo(ps[i])), total = largos.reduce((a, b) => a + b, 0) || 1;
    return mo.desdeFin !== undefined ? 1 - mo.desdeFin / total : mo.u;
  }
  // Monta una pieza sobre un tubo: {u: 0…1 a lo largo} o {desdeFin: metros antes del final}.
  function montar(pieza, tuberia, o = {}) {
    raiz.add(pieza);
    pieza.userData.flota = true;   // la sostiene el tubo
    tuberia.userData.montados.push({ pieza, u: o.u ?? 0.5, desdeFin: o.desdeFin, alinear: o.alinear ?? pieza.userData.enLinea ?? false });
    return pieza;
  }

  // ---------- CONSTRUIR POR RELACIONES ----------
  // Puerto: punto de conexión con nombre que trae cada pieza prefabricada (salida del tinaco, entrada de la regadera…).
  function puerto(pieza, nombre, desfase = 0) {
    const pu = pieza.userData.puertos?.[nombre];
    if (!pu) throw new Error(`«${pieza.name}» no tiene el puerto «${nombre}» (tiene: ${Object.keys(pieza.userData.puertos || {}).join(", ")})`);
    const dirL = v3(pu.dir || [0, 0, 0]);
    const local = v3(pu.pos).addScaledVector(dirL, desfase);
    const f = () => pieza.localToWorld(local.clone());
    f.obj = pieza;
    f.dir = () => dirL.clone().transformDirection(pieza.matrixWorld);
    return f;
  }
  // Tubo entre dos puertos (o puntos), con codos a 90° y saliendo derecho de cada puerto. via = puntos intermedios.
  function conectar(desde, hacia, o = {}) {
    const salir = (p, d) => (typeof p === "function" && p.dir ? () => p().add(p.dir().multiplyScalar(d)) : p);
    const pts = [desde, salir(desde, o.salida ?? 0.3), ...(o.via || []), salir(hacia, o.llegada ?? 0.3), hacia];
    let t0 = o.t0;
    if (t0 !== undefined) {   // espera a que las piezas que une ya estén (aparecidas por completo)
      for (const q of [desde, hacia]) {
        if (typeof q !== "function" || !q.obj) continue;
        for (let n = q.obj; n && n !== raiz; n = n.parent) for (const a of apariciones) if (a.obj === n) t0 = Math.max(t0, a.t + Math.min(a.dur, 0.35));
      }
      if (t0 > o.t0 + 0.01) console.info(`[conectar] «${o.nombre || "tubo"}» espera a sus piezas: ${o.t0.toFixed(2)} → ${t0.toFixed(2)} s`);
    }
    return tuberiaViva(pts, o.radio || 0.07, o.color || "#eef2f5", { ortogonal: o.orden || "yxz", ...o, t0 });
  }
  // Apoya una pieza ENCIMA de otra y la vuelve su hija: se mueve con ella, no puede flotar.
  // Si la base tiene un "apoyo" (azotea de una casa, repisa de una base), se monta en él.
  const cajaTmp = new THREE.Box3();
  function altoDe(obj) {
    if (obj.userData.alto !== undefined) return obj.userData.alto;
    obj.updateMatrixWorld(true);
    cajaTmp.makeEmpty();
    recorrerPropio(obj, (h) => { if (h.isMesh && !h.isLineSegments2 && !h.userData.esTinta) cajaTmp.union(cajaPropia(h)); });
    return cajaTmp.isEmpty() ? 0 : cajaTmp.max.y - obj.getWorldPosition(new THREE.Vector3()).y;
  }
  // Recarga una pieza (origen abajo, de pie) contra la cara más cercana de otra: calcula la inclinación
  // para que la PUNTA toque esa cara. recargar(escalera, muroDerecho)
  function recargar(pieza, contra, o = {}) {
    raiz.updateMatrixWorld(true);
    const L = o.largo ?? altoDe(pieza);
    const c = cajaPropia(contra), b = pieza.getWorldPosition(new THREE.Vector3());
    const opciones = [
      { d: b.x - c.max.x, eje: "z", signo: 1 }, { d: c.min.x - b.x, eje: "z", signo: -1 },
      { d: b.z - c.max.z, eje: "x", signo: -1 }, { d: c.min.z - b.z, eje: "x", signo: 1 },
    ].filter((q) => q.d > 0).sort((a, q) => a.d - q.d);
    if (!opciones.length) throw new Error(`recargar: «${pieza.name}» está dentro de «${contra.name}»`);
    const { d, eje, signo } = opciones[0];
    const ang = Math.asin(Math.min(0.95, (d + (o.holgura ?? 0.02)) / L)) * signo;
    pieza.rotation[eje] = ang;
    if (pieza.userData.anim) pieza.userData.anim.base.r.copy(pieza.rotation);
    pieza.userData.recargadaEn = contra;
    return pieza;
  }
  function sobre(pieza, base, o = {}) {
    const destino = base.userData.apoyo || base;
    const y = o.y ?? altoDe(destino);
    destino.add(pieza);
    pieza.userData.montadaSobre = true;
    pieza.position.set(o.en?.[0] ?? 0, y, o.en?.[1] ?? 0);
    if (pieza.userData.anim) pieza.userData.anim.base.p.copy(pieza.position);
    return pieza;
  }
  function agregar(obj, o = {}) { obj.traverse((h) => h.isMesh && entintar(h, o)); return colocar(obj, o); }

  // Texto plano sobre una tarjeta (letreros, etiquetas pegadas a objetos, pantallas).
  function letrero(texto, o = {}) {
    const c = document.createElement("canvas");
    const px = o.px || 96, fuente = o.fuente || (estilo === "pizarra" ? "Kalam" : "Lilita One");
    const g = c.getContext("2d");
    g.font = `${px}px "${fuente}"`;
    const w = Math.ceil(g.measureText(texto).width) + px, h = Math.ceil(px * 1.5);
    c.width = w; c.height = h;
    g.font = `${px}px "${fuente}"`;
    if (o.fondo) { g.fillStyle = o.fondo; g.beginPath(); g.roundRect(0, 0, w, h, h * 0.3); g.fill(); }
    g.fillStyle = o.color || P.tinta; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(texto, w / 2, h / 2 + px * 0.05);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const alto = o.alto || 0.4;
    const m = new THREE.Mesh(new THREE.PlaneGeometry((alto * w) / h, alto), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide, depthWrite: !o.encima, depthTest: !o.encima }));
    if (o.encima) m.renderOrder = 999;
    m.userData.miraCamara = o.miraCamara ?? true;
    m.name = o.nombre || `letrero «${texto}»`;
    return colocar(m, { flota: true, ...o });
  }

  // Resplandor suave (foco encendido, chispa, sol).
  let texBrillo;
  function texturaBrillo() {
    if (!texBrillo) {
      const c = document.createElement("canvas"); c.width = c.height = 128;
      const g = c.getContext("2d"), rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      rg.addColorStop(0, "rgba(255,255,255,1)"); rg.addColorStop(0.25, "rgba(255,255,255,0.65)"); rg.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
      texBrillo = new THREE.CanvasTexture(c);
    }
    return texBrillo;
  }
  // depthTest apagado: el halo es luz, no debe recortarse contra la superficie donde está el foco
  function brillo(color, o = {}) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaBrillo(), color: new THREE.Color(col(color)), blending: THREE.AdditiveBlending, depthWrite: false, depthTest: o.atraviesa ? false : true, transparent: true, opacity: o.opacidad ?? 0.9, toneMapped: false }));
    s.renderOrder = 50;
    s.scale.setScalar(o.tam || 1);
    colocar(s, { sombra: false, flota: true, ...o });
    s.userData.halo = (o.tam || 1) * 0.5; s.userData.haloBase = s.position.clone();
    return s;
  }

  // Luz de relleno para interiores en corte (sin ella quedan grises por la sombra de la losa).
  function luz(pos, o = {}) {
    const l = new THREE.PointLight(o.color || 0xfff4e0, o.intensidad ?? 2.2, o.alcance ?? 6, 1.6);
    l.position.set(...pos);
    escena.add(l);
    return l;
  }

  // =================================================================== animación
  // Cada objeto guarda su pose base; en cada cuadro se parte de la base y se aplican, en
  // orden, sus movimientos y efectos. Así se pueden encadenar: aparecer → mover → sacudir.
  const animados = new Set();
  const flujos = [];
  const porCuadro = [];   // funciones (t) => void
  function reg(obj) {
    if (!obj.userData.anim) {
      obj.userData.anim = { base: { p: obj.position.clone(), r: obj.rotation.clone(), s: obj.scale.clone() }, movs: [], efectos: [] };
      animados.add(obj);
    }
    return obj.userData.anim;
  }
  // mover(obj, t, {a:[x,y,z]} | {por:[dx,dy,dz]}, dur, curva) · también rot (grados) y escala
  function mover(obj, t, destino, dur = 0.8, e = "suave") {
    const a = reg(obj);
    a.movs.push({ t, dur, e: curva(e), ...destino });
    a.movs.sort((x, y) => x.t - y.t);
    return obj;
  }
  function efecto(obj, fn) { reg(obj).efectos.push(fn); return obj; }
  const efectoLibre = (obj, fn, causa) => { if (causa) obj.userData.causa = causa; else obj.userData.movidaPorEscena = true; return efecto(obj, fn); };   // sin causa, el revisor pregunta quién la mueve

  // aparecer(obj, t, {modo, dur, alto, desde}) — antes de t el objeto no existe
  //   modos: "caer" (cae y rebota) · "crecer" (escala con resorte) · "subir" (sale del piso)
  //          "desplegar" (crece en Y) · "estirar" (crece en X) · "volar" (llega desde `desde`) · "pop"
  const apariciones = [];   // {obj, t, dur, modo}: el revisor comprueba que cada pieza se vea al aparecer
  function aparecer(obj, t, o = {}) {
    const modo = obj.userData.recargadaEn && (o.modo || "crecer") === "caer" ? "crecer" : (o.modo || "crecer");   // lo recargado aparece en su lugar
    const dur = o.dur ?? ({ caer: 0.7, crecer: 0.5, subir: 0.6, desplegar: 0.6, estirar: 0.6, volar: 0.9, pop: 0.35, dibujar: 0.8 }[modo] || 0.5);
    if (modo === "dibujar") return dibujar(obj, t, dur, o);
    apariciones.push({ obj, t, dur, modo, revisar: o.revisar !== false, tapadaOk: !!o.tapadaOk });
    const piv0 = modo === "crecer" || modo === "pop" ? pivote(obj) : null, base0 = obj.position.clone();
    const alto = o.alto ?? 3;
    const desde = o.desde ? v3(o.desde) : null;
    efecto(obj, (tt, x) => {
      if (tt < t) { x.visible = false; return; }
      const p = prog(tt, t, dur);
      if (modo === "caer") x.position.y += alto * (1 - E.rebote(p));
      else if (modo === "subir") x.position.y -= alto * (1 - E.sale(p));
      else if (modo === "crecer" || modo === "pop") {
        escalarDesde(x, piv0 ? piv0.clone().sub(base0).add(x.position) : null, Math.max(1e-4, (modo === "pop" ? E.elastico : E.resorte)(p)));   // crece desde su centro
      }
      else if (modo === "desplegar") x.scale.y *= Math.max(1e-4, E.resorte(p));
      else if (modo === "estirar") x.scale.x *= Math.max(1e-4, E.sale(p));
      else if (modo === "volar" && desde) {
        const q = E.sale(p);
        x.position.lerp(desde, 1 - q);
        x.rotation.z += (1 - q) * 1.2;
      }
    });
    return obj;
  }
  // DIBUJAR (pizarra): cada línea de plumón se traza de a poco; el contorno y el relleno entran al final.
  function dibujar(obj, t, dur, o = {}) {
    apariciones.push({ obj, t, dur, modo: "dibujar", revisar: o.revisar !== false, tapadaOk: !!o.tapadaOk });
    const lineas = [], cascos = [], rellenos = [];
    obj.traverse((h) => {
      if (h.isLineSegments2 && h.userData.esTinta) lineas.push([h, h.geometry.attributes.instanceStart?.count ?? 0]);
      else if (h.isMesh && h.userData.esTinta) cascos.push(h);
      else if (h.isMesh && h.material && !h.isLineSegments2) {
        h.material = h.material.clone(); h.material.transparent = true;
        rellenos.push([h.material, h.material.opacity]);
      }
    });
    efecto(obj, (tt, x) => {
      if (tt < t) { x.visible = false; return; }
      const p = prog(tt, t, dur);
      for (const [l, n] of lineas) l.geometry.instanceCount = Math.max(1, Math.floor(n * Math.min(1, p / 0.75)));
      for (const c of cascos) c.visible = p > 0.55;
      const q = E.suave(Math.max(0, (p - 0.5) / 0.5));
      for (const [m, op] of rellenos) m.opacity = op * q;
    });
    return obj;
  }
  function desaparecer(obj, t, o = {}) {
    const dur = o.dur ?? 0.4;
    reg(obj).salida = Math.min(reg(obj).salida ?? Infinity, t);
    efecto(obj, (tt, x) => {
      if (tt < t) return;
      const p = prog(tt, t, dur);
      if (p >= 1) { x.visible = false; return; }
      if (o.modo === "caer") x.position.y -= 4 * E.entra(p);
      else x.scale.multiplyScalar(Math.max(1e-4, 1 - E.entra(p)));
    });
    return obj;
  }
  // Construye un grupo pieza por pieza: los hijos aparecen escalonados (techos, rieles, muros de bloques).
  function ensamblar(g, t, o = {}) {
    const hijos = o.piezas || g.children.filter((h) => !h.userData.esTinta);
    const paso = o.escalon ?? Math.min(0.12, (o.total ?? 1.4) / Math.max(1, hijos.length));
    hijos.forEach((h, i) => aparecer(h, t + i * paso, { modo: o.modo || "caer", alto: o.alto ?? 2.2, dur: o.dur, tapadaOk: o.tapadaOk }));
    return g;
  }
  function sacudir(obj, t, o = {}) {
    const dur = o.dur ?? 0.6, amp = o.amp ?? 0.08, f = o.frec ?? 28;
    efecto(obj, (tt, x) => { if (tt < t || tt > t + dur) return; const p = (tt - t) / dur; x.position.x += Math.sin((tt - t) * f) * amp * (1 - p); x.rotation.z += Math.sin((tt - t) * f * 0.8) * amp * 0.4 * (1 - p); });
    return obj;
  }
  // Latido: crece y regresa (para señalar "esta es la pieza").
  // Centro de la pieza en coordenadas de su padre (pivote para escalar sin que "se salga" de su lugar)
  function pivote(obj) {
    if (obj.userData.pivote) return obj.userData.pivote;
    raiz.updateMatrixWorld(true);
    const c = new THREE.Box3();
    recorrerPropio(obj, (h) => { if (h.isMesh && !h.isLineSegments2 && !h.userData.esTinta && !h.userData.soloEncuadre) c.union(cajaPropia(h)); });
    if (c.isEmpty()) return null;
    const w = c.getCenter(new THREE.Vector3());
    return (obj.userData.pivote = obj.parent.worldToLocal(w));
  }
  function escalarDesde(x, piv, f) {   // escala f alrededor del pivote (en coords del padre)
    if (!piv) { x.scale.multiplyScalar(f); return; }
    x.scale.multiplyScalar(f);
    x.position.sub(piv).multiplyScalar(f).add(piv);
  }
  function latir(obj, t, o = {}) {
    const dur = o.dur ?? 0.5, k = o.k ?? 0.18;
    if (obj.userData.esTuberia) { obj.userData.pulsos.push({ t, dur, k }); return obj; }
    const piv0 = pivote(obj), base0 = obj.position.clone();   // centro medido en la pose de construcción
    efecto(obj, (tt, x) => {
      if (tt < t || tt > t + dur) return;
      escalarDesde(x, piv0 ? piv0.clone().sub(base0).add(x.position) : null, 1 + Math.sin(((tt - t) / dur) * Math.PI) * k);
    });
    return obj;
  }
  function girar(obj, eje, vel, t0 = 0, t1 = Infinity, o = {}) {
    const arranque = o.arranque ?? 0.6;
    efecto(obj, (tt, x) => {
      if (tt < t0) return;
      const te = Math.min(tt, t1) - t0;
      const ang = te < arranque ? (vel * te * te) / (2 * arranque) : vel * (te - arranque / 2);   // acelera suave
      x.rotation[eje] += ang;
    });
    return obj;
  }
  function oscilar(obj, prop, amp, frec, t0 = 0, t1 = Infinity) {
    const [a, b] = prop.split(".");
    efecto(obj, (tt, x) => { if (tt < t0 || tt > t1) return; x[a][b] += Math.sin((tt - t0) * frec * Math.PI * 2) * amp; });
    return obj;
  }
  // Pista libre sobre cualquier número: pista(material, "opacity", [[t, v], [t, v, "sale"]])
  function pista(objeto, ruta, claves) {
    const partes = ruta.split(".");
    const ultimo = partes.pop();
    porCuadro.push((tt) => {
      const dest = partes.reduce((o, k) => o[k], objeto);
      if (tt <= claves[0][0]) { dest[ultimo] = claves[0][1]; return; }
      for (let i = 1; i < claves.length; i++) {
        const [t1, v1, e] = claves[i], [t0, v0] = claves[i - 1];
        if (tt <= t1) { dest[ultimo] = lerp(v0, v1, curva(e || "suave")((tt - t0) / Math.max(1e-6, t1 - t0))); return; }
      }
      dest[ultimo] = claves[claves.length - 1][1];
    });
  }
  // Cada malla clona su material UNA vez (para teñirla sin teñir a las demás del mismo color).
  function propio(h) {
    if (!h.material.userData.propio) { h.material = h.material.clone(); h.material.userData.propio = true; h.material.userData.colorBase = h.material.color.clone(); }
    return h.material;
  }
  // Alerta roja: el objeto pulsa en rojo entre t0 y t1 (problema). Se suman por cuadro y se apagan solas.
  const matsAlerta = new Set();
  function alerta(obj, t0, t1, o = {}) {
    const mats = [];
    obj.traverse((h) => {
      if (!h.isMesh || h.userData.esTinta || h.userData.noAlerta || !h.material?.color) return;
      if (h.material.transparent && h.material.opacity < 0.6) return;   // un envase translúcido no se tiñe: parecería que el agua es roja
      const m = propio(h); mats.push(m); matsAlerta.add(m);
    });
    if (o.marca ?? obj.userData.alertaConMarca) {   // marca "!" sobre la pieza (envases, piezas casi invisibles)
      raiz.updateMatrixWorld(true);
      const cc = new THREE.Box3(); recorrerPropio(obj, (h) => { if (h.isMesh && !h.isLineSegments2 && !h.userData.esTinta) cc.union(cajaPropia(h)); });
      const arriba = cc.isEmpty() ? obj.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3((cc.min.x + cc.max.x) / 2, cc.max.y + 0.45, (cc.min.z + cc.max.z) / 2);
      if (obj.userData.esTuberia) { const ps = obj.userData.puntos(); const alto = ps.reduce((a, q) => (q.y > a.y ? q : a), ps[0]); arriba.set(alto.x, alto.y + 0.45, alto.z); }   // sobre el punto más alto del tubo
      // en 2D todo vive en el mismo plano: "arriba" de una pieza suele caer encima de otra (renglones, subtítulo).
      // Ahí la marca va en la esquina de arriba a la derecha, como un sello, y siempre por delante de todo.
      if (es2D && !cc.isEmpty()) arriba.set(cc.max.x + 0.12, cc.max.y - 0.05, cc.max.z + 0.3);
      const signo = letrero("!", { padre: obj, pos: obj.worldToLocal(arriba).toArray(), alto: es2D ? 0.42 : 0.55, fondo: P.rojo, color: "#ffffff", fuente: "Lilita One", nombre: `alerta de «${obj.name}»` });
      if (es2D) signo.traverse((h) => { if (h.material) { h.material.depthTest = false; h.renderOrder = 20; } });
      signo.visible = false;
      porCuadro.push((tt) => {   // entra y sale con suavidad (si desaparece de golpe, el revisor del MP4 lo marca como salto)
        const env = Math.max(0, Math.min(1, (tt - t0) / 0.2, (t1 + 0.25 - tt) / 0.25));
        signo.visible = env > 0;
        if (signo.visible) signo.scale.setScalar(E.resorte(env) * (1 + 0.12 * Math.sin((tt - t0) * 9)));
      });
    }
    porCuadro.push((tt) => {
      if (tt < t0 || tt > t1) return;
      const k = (0.35 + 0.35 * Math.sin((tt - t0) * 9)) * Math.min(1, (tt - t0) * 4, (t1 - tt) * 4);
      mats.forEach((m) => { m.userData.alerta = Math.max(m.userData.alerta || 0, k); });
    });
    return obj;
  }
  const rojoAlerta = new THREE.Color(P.rojo);
  function aplicarAlertas() {
    for (const m of matsAlerta) {
      const k = m.userData.alerta || 0;
      if ("emissive" in m) { m.emissive.copy(rojoAlerta); m.emissiveIntensity = k; }
      else if (!m.userData.teñido) m.color.copy(m.userData.colorBase).lerp(rojoAlerta, k);
      else if (k) m.color.lerp(rojoAlerta, k);
    }
  }
  // Cambios de color encadenados en el tiempo (agua que se enturbia y luego se limpia, cable que se enciende).
  function teñir(obj, t, color, dur = 0.8) {
    obj.traverse((h) => {
      if (!h.isMesh || h.userData.esTinta || !h.material?.color) return;
      const m = propio(h);
      if (!h.userData.tintes) {
        m.userData.teñido = true;
        const lista = (h.userData.tintes = []);
        porCuadro.push((tt) => {
          const c = m.userData.colorBase.clone();
          for (const k of lista) { if (tt < k.t) break; c.lerp(k.color, E.suave(prog(tt, k.t, k.dur))); }
          m.color.copy(c);
        });
      }
      h.userData.tintes.push({ t, color: new THREE.Color(col(color)), dur });
      h.userData.tintes.sort((a, b) => a.t - b.t);
    });
    return obj;
  }

  // Puntos que viajan por una curva: electricidad, agua, aire, gente, datos.
  function flujo(puntos, o = {}) {
    // vivos: tubería viva, función que da los puntos, o lista con anclajes → se recalcula cada cuadro
    const vivos = typeof puntos === "function" ? puntos : puntos.userData?.puntos || (Array.isArray(puntos) && puntos.some((q) => typeof q === "function") ? () => puntos.map(resolver) : null);
    let c = vivos ? null : puntos.isCurve ? puntos : puntos.userData?.curva || new THREE.CatmullRomCurve3(puntos.map((q) => (typeof q === "function" ? q() : v3(q))), false, "catmullrom", o.tension ?? 0.2);
    const tubo = puntos.userData?.esTuberia ? puntos : null;
    // SENTIDO COMÚN: el agua no corre antes de que el tubo exista ni por la parte que aún no se tiende
    let t0 = o.t0 ?? 0;
    if (tubo && t0 < tubo.userData.t0 + 0.15) t0 = tubo.userData.t0 + 0.15;
    const t1 = Math.min(o.t1 ?? Infinity, tubo ? tubo.userData.t1 : Infinity);
    const n = o.n || 14, vel = o.vel ?? 0.35, llenado = o.llenado ?? 0.7;   // llenado: fracción del tubo por segundo
    const r = Math.max(o.radio || 0.06, tubo ? tubo.userData.radio * 1.3 : 0);   // asoman del tubo: si no, el tubo opaco los esconde
    const color = col(o.color || "energia");
    const g = grupo({ padre: o.padre, flota: true, nombre: o.nombre || (tubo ? `agua en «${tubo.name}»` : "flujo") });
    g.userData.esFlujo = true; g.userData.tubo = tubo; g.userData.libre = !!o.libre;
    flujos.push(g);
    const bolas = [];
    for (let i = 0; i < n; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), mat(color, { brilla: true }));
      g.add(b);
      const h = o.halo === false ? null : new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaBrillo(), color: new THREE.Color(color), blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true, transparent: true, toneMapped: false }));
      if (h) { h.scale.setScalar(r * (o.halo || 3.6)); h.renderOrder = 50; h.userData.halo = r * 1.6; h.userData.haloBase = new THREE.Vector3(); g.add(h); }
      if (tubo?.userData.enterrada) { b.material = b.material.clone(); b.material.depthTest = false; b.renderOrder = 41; if (h) { h.material.depthTest = false; h.renderOrder = 42; } }
      bolas.push([b, h]);
    }
    porCuadro.push((tt) => {
      const vivo = tt >= t0 && tt <= t1;
      g.visible = vivo;
      if (!vivo) return;
      const entrada = Math.min(1, (tt - t0) / 0.4, (t1 - tt) / 0.4);
      if (vivos) {
        const ps = vivos();
        if (tubo || o.recto) { c = new THREE.CurvePath(); for (let k = 0; k < ps.length - 1; k++) if (ps[k].distanceTo(ps[k + 1]) > 1e-4) c.add(new THREE.LineCurve3(ps[k], ps[k + 1])); }
        else c = new THREE.CatmullRomCurve3(ps, false, "catmullrom", 0);
      }
      // frente del agua: lo que ya se llenó (nunca más allá de lo tendido)
      const frente = tubo ? Math.min(tubo.userData.revelado(tt), (tt - t0) * llenado) : 1;
      const [ua, ub] = o.tramo ? (typeof o.tramo === "function" ? o.tramo() : o.tramo) : [0, 1];
      bolas.forEach(([b, h], i) => {
        let u = ua + (((i / n + (tt - t0) * vel) % 1) * (ub - ua));
        const dentro = u <= frente;
        if (o.reversa) u = 1 - u;
        const p = c.getPointAt(u);
        b.visible = dentro; if (h) h.visible = dentro;
        b.position.copy(p); b.scale.setScalar(entrada);
        if (h) { h.userData.haloBase.copy(p); h.material.opacity = entrada * 0.85; }
      });
    });
    return g;
  }
  // Trazo que se dibuja progresivamente a lo largo de una curva (un cable que se tiende, una ruta).
  function trazo(puntos, o = {}) {
    const m = tubo(puntos, o.radio || 0.04, o.color || "cable", { tinta: o.tinta, padre: o.padre, segmentos: o.segmentos });
    const total = m.geometry.index.count;
    const t0 = o.t0 ?? 0, dur = o.dur ?? 1.2, t1 = o.t1 ?? Infinity, durSalida = o.durSalida ?? 0.35;
    porCuadro.push((tt) => {   // se dibuja de a poco y, si tiene t1, se borra de a poco (antes se quedaba colgado)
      const p = tt >= t1 ? 1 - E.suave(prog(tt, t1, durSalida)) : E.suave(prog(tt, t0, dur));
      m.visible = p > 0; m.geometry.setDrawRange(0, Math.floor((total * p) / 6) * 6);
    });
    return m;
  }
  // Lluvia determinista dentro de una caja.
  function lluvia(o = {}) {
    const n = o.n || 260, [cx, cy, cz] = o.centro || [0, 0, 0], [sx, sy, sz] = o.tam || [14, 10, 10], t0 = o.t0 ?? 0, t1 = o.t1 ?? Infinity;
    const largo = o.largo || 0.35, vel = o.vel || 9, rnd = azar(o.semilla || 7);
    const semillas = Array.from({ length: n }, () => [rnd() * sx - sx / 2, rnd(), rnd() * sz - sz / 2]);
    const pos = new Float32Array(n * 6);
    const geo = new LineSegmentsGeometry();
    geo.setPositions(pos);
    const lineas = new LineSegments2(geo, new LineMaterial({ color: new THREE.Color(col(o.color || "#ffffff")).getHex(), linewidth: (o.grosor ?? 3) * SS, transparent: true, opacity: o.opacidad ?? 0.8, resolution: new THREE.Vector2(ANCHO * SS, ALTO * SS) }));
    lineas.frustumCulled = false;
    colocar(lineas, { sombra: false, flota: true, nombre: o.nombre || "chorro" });
    porCuadro.push((tt) => {
      const vivo = tt >= t0 && tt <= t1; lineas.visible = vivo; if (!vivo) return;
      semillas.forEach(([x, s, z], i) => {
        const y = cy + sy - (((tt - t0) * vel + s * sy) % sy);
        pos.set([cx + x, y, cz + z, cx + x + 0.02, y - largo, cz + z], i * 6);
      });
      geo.setPositions(pos);
    });
    return lineas;
  }
  // Flecha 3D (empuje, dirección del aire o del agua). Se dibuja de `desde` a `hacia`.
  function flecha(desde, hacia, o = {}) {
    const a = v3(desde), b = v3(hacia), dir = b.clone().sub(a), largo = dir.length();
    const g = grupo({ padre: o.padre });
    const r = o.grosor || 0.07, color = col(o.color || "rojo");
    const cuerpo = cilindro(r, r, largo * 0.72, color, { base: true, padre: g, lados: 16, sombra: false, ...o });
    const punta = cono(r * 2.6, largo * 0.28, color, { padre: g, pos: [0, largo * 0.72, 0], lados: 20, sombra: false, ...o });
    g.position.copy(a);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    if (o.t0 !== undefined) {
      aparecer(g, o.t0, { modo: "estirar" in o ? "estirar" : "desplegar", dur: 0.35 });
      if (o.t1 !== undefined) desaparecer(g, o.t1);
      if (o.empuje !== false) efecto(g, (tt, x) => { if (tt >= o.t0) x.position.addScaledVector(dir, Math.sin((tt - o.t0) * 7) * 0.06 * largo); });
    }
    g.userData.partes = [cuerpo, punta];
    return g;
  }

  // =================================================================== cámara continua
  // camara.ir(t, {pos, mira, fov|zoom}, dur, curva) — un solo plano que viaja (nunca corta)
  const tomas = [];
  let derivaAmp = cfg.deriva ?? 0.02;
  const cam = {
    ir(t, destino, dur = 1.6, e = "suave") { tomas.push({ t, dur, e: curva(e), ...destino }); tomas.sort((a, b) => a.t - b.t); return cam; },
    // Recorre los puntos de una curva (seguir un cable, bajar por un tubo).
    seguir(t, puntos, dur, o = {}) { tomas.push({ t, dur, e: curva(o.curva || "suave"), ruta: new THREE.CatmullRomCurve3(puntos.map(v3)), desfase: v3(o.desfase || [0, 2, 6]), adelanto: o.adelanto ?? 0.02 }); tomas.sort((a, b) => a.t - b.t); return cam; },
    deriva(a) { derivaAmp = a; return cam; },
    // Encuadra solas estas piezas: en el instante t ya se ven completas, con margen, sin que nada las tape
    // y por debajo de la franja de subtítulos. {azimut, elevacion} en grados = ángulo preferido; dur = viaje.
    mostrar(t, piezas, o = {}) { intenciones.push({ t, piezas: [].concat(piezas), o }); return cam; },
  };
  const intenciones = [];
  let duracionTotal = 1e9;
  const V_DUR = () => duracionTotal;
  function prepararTomas(dur) {
    if (dur) duracionTotal = dur;
    const Y = new THREE.Vector3(0, 1, 0), ray = new THREE.Raycaster(); ray.camera = camara;
    const fovV = THREE.MathUtils.degToRad(camara.isPerspectiveCamera ? camara.fov : 36);
    const tanV = Math.tan(fovV / 2), tanH = tanV * (ANCHO / ALTO);
    const orto = camara.isOrthographicCamera, altoVista = camara.userData.altoVista || 12, LEJOS = 60;
    // franja libre para el sujeto (fracciones desde arriba): el subtítulo de frase va ARRIBA; el de palabra, ABAJO
    const [fA, fB] = cfg.bandaTexto === "abajo" ? [0.07, 0.62] : [0.24, 0.94];
    const U = fB - fA, ndcC = 1 - (fA + fB);   // alto útil (en NDC/2) y centro de la franja
    const esDe = (h, objs) => objs.some((o2) => { for (let n = h; n; n = n.parent) if (n === o2) return true; return false; });
    intenciones.sort((a, b) => a.t - b.t);
    const tapadaPor = (ps, mj) => {   // para el aviso: qué la tapa (o si se sale de la toma)
      for (const q of ps) {
        const origen = mj.orto ? q.clone().addScaledVector(mj.d, LEJOS) : mj.pos;
        ray.set(origen, q.clone().sub(origen).normalize());
        const lejos = origen.distanceTo(q) - 0.05, h = ray.intersectObjects(raiz.children, true).find((i) => i.distance < lejos && i.object.isMesh && !i.object.isLineSegments2 && !i.object.userData.esTinta && (() => { for (let n = i.object; n; n = n.parent) if (!n.visible) return false; return true; })());
        if (h) { let n = h.object; while (n.parent && n.parent !== raiz) n = n.parent; return ` (la tapa «${n.name}»)`; }
      }
      return " (queda fuera de la franja)";
    };
    for (const it of intenciones) {
      const o = it.o, dur = o.dur ?? 1.4;
      const bb = new THREE.Box3();
      const visibleDe = (x) => { for (let n = x; n; n = n.parent) if (!n.visible) return false; return true; };
      const cajasPiezas = it.piezas.map(() => new THREE.Box3());
      // instantes a medir: el inicio de la toma y, para cada pieza que aparece DESPUÉS, el momento en que termina de aparecer
      const tiempos = (o.instantes || [0, 0.5, 1.2]).map((dt) => it.t + dt);
      for (const pz of it.piezas) for (const ap of apariciones) {
        let es = false; for (let n = ap.obj; n; n = n.parent) if (n === pz) { es = true; break; }
        if (es && ap.t + ap.dur > it.t && ap.t < it.t + 6) tiempos.push(ap.t + ap.dur + 0.05);
      }
      for (const tm of tiempos) {
        actualizar(Math.min(tm, V_DUR()));
        it.piezas.forEach((pz, k) => pz.traverse((h) => { if (h.isMesh && !h.isLineSegments2 && !h.userData.esTinta && !h.userData.noEncuadrar && visibleDe(h)) { const c = cajaPropia(h); bb.union(c); cajasPiezas[k].union(c); } }));
      }
      actualizar(it.t);
      if (bb.isEmpty()) { console.warn(`[cámara] mostrar(${it.t.toFixed(2)}): las piezas no tienen tamaño`); continue; }
      // encuadre limpio (pizarra): nada queda a medias en la orilla. Si una pieza que ya está dibujada queda cortada,
      // la toma se abre para incluirla completa, siempre que no haya que alejarse más de un 30 %.
      if (orto && estilo === "pizarra" && o.limpio !== false) {   // en plano/maqueta cortar terreno, casa o un tubo largo en la orilla es normal
        const hh = altoVista / 2, hw = hh * (ANCHO / ALTO);
        const zPizarra = estilo === "pizarra" ? (hw * 0.92) / ((cfg.anchoPizarra ?? 6.8) / 2) : Infinity;   // la pizarra se ve SIEMPRE de lado a lado: la cámara solo sube y baja
        const encuadre = (b) => {
          const c = b.getCenter(new THREE.Vector3()), sz = b.getSize(new THREE.Vector3());
          const z = Math.min((hw * 0.86) / Math.max(sz.x / 2, 1e-3), (hh * U) / Math.max(sz.y / 2, 1e-3), altoVista / (o.vista ?? 2.4), zPizarra) / (o.holgura ?? 1.05);
          const my = c.y - ndcC * hh / z;
          return { z, r: new THREE.Box2(new THREE.Vector2(c.x - hw / z, my - hh / z), new THREE.Vector2(c.x + hw / z, my + hh / z)) };
        };
        const cajaVisible = (obj) => { const c = new THREE.Box3(); recorrerPropio(obj, (h) => { if (h.isMesh && !h.isLineSegments2 && !h.userData.esTinta && visibleDe(h)) c.union(cajaPropia(h)); }); return c; };
        const candidatos = raiz.children.filter((h) => visibleDe(h) && !esDe(h, it.piezas) && !it.piezas.some((pz) => esDe(pz, [h])) && !h.userData.estructura && !h.userData.esFlujo && h.name !== "embudo");
        const cajas = candidatos.map(cajaVisible).filter((c) => !c.isEmpty());
        // corrimiento dentro de la holgura (sin sacar a las piezas de su franja) para que cada pieza quede
        // completa adentro o completa afuera; devuelve el de menos cortes
        const corrimiento = (caja) => {
          const { z, r } = encuadre(caja), sz = caja.getSize(new THREE.Vector3());
          const holgX = Math.max(0, (2 * hw * 0.86) / z - sz.x) / 2, holgY = Math.max(0, (2 * hh * U) / z - sz.y) / 2;
          const cortes = (dx, dy) => cajas.filter((c) => {
            const x0 = r.min.x + dx, x1 = r.max.x + dx, y0 = r.min.y + dy, y1 = r.max.y + dy;
            const toca = c.max.x > x0 && c.min.x < x1 && c.max.y > y0 && c.min.y < y1;
            const dentro = c.min.x >= x0 && c.max.x <= x1 && c.min.y >= y0 && c.max.y <= y1;
            return toca && !dentro;
          }).length;
          const m = 0.08, opc = (holg, vs) => [0, ...vs.flatMap((v) => [v, -v])].filter((v) => Math.abs(v) <= holg);
          const candY = opc(holgY, cajas.flatMap((c) => [c.min.y - m - r.max.y, c.max.y + m - r.min.y, c.max.y + m - r.max.y, c.min.y - m - r.min.y]).map(Math.abs));
          const candX = opc(holgX, cajas.flatMap((c) => [c.min.x - m - r.max.x, c.max.x + m - r.min.x, c.max.x + m - r.max.x, c.min.x - m - r.min.x]).map(Math.abs));
          let mejorD = [0, 0], menos = cortes(0, 0);
          for (const dy of candY) for (const dx of candX) { const n = cortes(dx, dy); if (n < menos || (n === menos && Math.abs(dx) + Math.abs(dy) < Math.abs(mejorD[0]) + Math.abs(mejorD[1]))) { menos = n; mejorD = [dx, dy]; } }
          return { menos, d: mejorD, z };
        };
        // opción A: la toma tal cual, solo corrida. Opción B: abrirla (hasta 30 %) para meter lo cortado, y luego correrla.
        const z0 = encuadre(bb).z, abierta = bb.clone();
        for (let vuelta = 0; vuelta < 3; vuelta++) {
          const { r } = encuadre(abierta); let cambio = false;
          for (const c of cajas) {
            const b2 = new THREE.Box2(new THREE.Vector2(c.min.x, c.min.y), new THREE.Vector2(c.max.x, c.max.y));
            if (!r.intersectsBox(b2) || r.containsBox(b2)) continue;
            const prueba = abierta.clone().union(c);
            if (encuadre(prueba).z >= z0 * (o.abrirHasta ?? 0.7)) { abierta.copy(prueba); cambio = true; }
          }
          if (!cambio) break;
        }
        const A = corrimiento(bb), B = corrimiento(abierta);
        const gana = B.menos < A.menos ? { caja: abierta, ...B } : { caja: bb, ...A };
        bb.copy(gana.caja).translate(new THREE.Vector3(gana.d[0], gana.d[1], 0));
      }
      const centro = bb.getCenter(new THREE.Vector3());
      // el centro de CADA pieza (no solo el del conjunto): la toma tiene que mostrarlas todas
      // por pieza: su centro y 4 puntos hacia sus esquinas (en todo el intervalo de la toma). Se ve si se ve con holgura,
      // no al ras de una orilla (un rayo que pasa a 2 cm de la losa cambia con el vaivén de la cámara).
      const muestrasPiezas = cajasPiezas.map((c, k) => ({ c, k, rayos: !!it.piezas[k].userData.enterrada })).filter(({ c }) => !c.isEmpty()).map(({ c, k, rayos }) => {
        const m = c.getCenter(new THREE.Vector3()), ps = [m];
        for (const [x, y, z] of [[c.min.x, c.max.y, c.min.z], [c.max.x, c.max.y, c.max.z], [c.min.x, c.min.y, c.max.z], [c.max.x, c.min.y, c.min.z]]) ps.push(new THREE.Vector3(x, y, z).lerp(m, 0.5));
        ps.rayos = rayos;   // lo enterrado se dibuja en rayos X: nada lo tapa
        ps.nombre = it.piezas[k].name;
        return ps;
      });
      const esquinas = [];
      for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) esquinas.push(new THREE.Vector3(x, y, z));
      const solidos = [];
      raiz.traverse((h) => { if (h.isMesh && !h.isLineSegments2 && !h.userData.esTinta && !h.userData.soloEncuadre && !h.userData.esFlujo && visibleDe(h) && !esDe(h, it.piezas) && !(h.material.transparent && h.material.opacity < 0.2)) solidos.push(h); });   // un envase translúcido SÍ estorba: lo de atrás se lee "adentro"
      const vista2D = es2D;
      const az0 = vista2D ? 0 : o.azimut ?? 35, el0 = vista2D ? 0 : o.elevacion ?? 24;
      let mejor = null;
      for (const dAz of vista2D ? [0] : [0, 20, -20, 40, -40, 65, -65, 90, -90]) for (const dEl of vista2D ? [0] : [0, 12, -8, -16, -22, 25]) {
        const az = THREE.MathUtils.degToRad(az0 + dAz), el = THREE.MathUtils.degToRad(vista2D ? 0 : Math.max(2, Math.min(75, el0 + dEl)));
        const d = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));   // del objeto hacia la cámara
        const der = new THREE.Vector3().crossVectors(Y, d).normalize(), arr = new THREE.Vector3().crossVectors(d, der);
        // distancia para que todo quepa: ancho al 86 % y alto entre el 24 % (bajo los subtítulos) y el 94 % de la pantalla
        let dist = o.minimo ?? 3, zoom = 1, medioAlto = 0;
        if (orto) {   // ortográfica: lo que cuenta es la extensión en pantalla, no la distancia
          let mx = 0, my = 0;
          for (const c of esquinas) { const r = c.clone().sub(centro); mx = Math.max(mx, Math.abs(r.dot(der))); my = Math.max(my, Math.abs(r.dot(arr))); }
          const hh = altoVista / 2, hw = hh * (ANCHO / ALTO);
          const zPizarra = estilo === "pizarra" ? (hw * 0.92) / ((cfg.anchoPizarra ?? 6.8) / 2) : Infinity;
          zoom = Math.min((hw * 0.86) / Math.max(mx, 1e-3), (hh * U) / Math.max(my, 1e-3), altoVista / (o.vista ?? 2.4), zPizarra) / (o.holgura ?? 1.05);
          dist = LEJOS; medioAlto = hh / zoom;
        } else {
          for (const c of esquinas) {
            const r = c.clone().sub(centro), x = Math.abs(r.dot(der)), y = Math.abs(r.dot(arr)), z = r.dot(d);
            dist = Math.max(dist, z + x / (tanH * 0.86), z + y / (tanV * U));
          }
          dist = Math.max(dist, (o.vista ?? 2.4) / (2 * tanV * U));   // nunca encuadrar menos de ~2.4 m de alto: sin acercamientos asfixiantes
          dist *= o.holgura ?? 1.05;
          medioAlto = dist * tanV;
        }
        const pos = centro.clone().addScaledVector(d, dist);
        if (!orto && pos.y < (o.pisoMinimo ?? 0.4)) continue;
        // que nada la tape: centro + esquinas encogidas
        const libre = (q) => {   // en ortográfica los rayos son paralelos (como en un plano técnico)
          const origen = orto ? q.clone().addScaledVector(d, LEJOS) : pos;
          ray.set(origen, q.clone().sub(origen).normalize()); const lejos = origen.distanceTo(q) - 0.05;
          return !ray.intersectObjects(solidos, false).some((i) => i.distance < lejos);
        };
        const muestras = [centro, ...esquinas.map((c) => c.clone().lerp(centro, 0.3))];
        const vistas = muestras.filter(libre).length;
        const ocultas = muestrasPiezas.filter((ps) => !(ps.rayos || ps.filter(libre).length >= 3));
        const piezasVistas = muestrasPiezas.length - ocultas.length;   // la mayor parte de la pieza
        // primero que se vea CADA pieza; luego el conjunto; luego quedarse cerca del ángulo pedido
        const puntaje = (piezasVistas / Math.max(1, muestrasPiezas.length)) * 2 + vistas / muestras.length - (Math.abs(dAz) + Math.abs(dEl)) / 900;
        if (!mejor || puntaje > mejor.puntaje) mejor = { puntaje, pos, zoom, mira: centro.clone().addScaledVector(arr, -ndcC * medioAlto), dAz, dEl, piezasVistas, vistas, nPiezas: muestrasPiezas.length, nSol: solidos.length, ocultas, libre, orto, d };
        if (vistas === muestras.length && piezasVistas === muestrasPiezas.length && dAz === 0 && dEl === 0) break;
      }
      if (!mejor) { console.warn(`[cámara] mostrar(${it.t.toFixed(2)}): no encontré una toma posible`); continue; }
      if (mejor.piezasVistas < mejor.nPiezas) console.warn(`[cámara] mostrar(${it.t.toFixed(2)}): ninguna toma muestra a la vez «${it.piezas.map((x) => x.name).join("», «")}» (se ven ${mejor.piezasVistas} de ${mejor.nPiezas}; no se ve: ${mejor.ocultas.map((ps) => `«${ps.nombre}»${tapadaPor(ps, mejor)}`).join(", ")}). Divide la toma en dos o quita una pieza.`);
      // velocidad tope: un viaje largo no cabe en 1.4 s (la cámara "teletransportada" se ve como salto).
      // La toma arranca antes, sin pisar la anterior; si aun así no cabe, se avisa.
      const previa = tomas.filter((k) => k.pos).sort((a, b) => a.t - b.t).pop();
      const desde = previa ? v3(previa.pos) : estadoCam.pos, finPrevia = previa ? previa.t + previa.dur : 0;
      const recorrido = desde.distanceTo(mejor.pos) + (previa ? v3(previa.mira) : estadoCam.mira).distanceTo(mejor.mira) * 0.5;
      // lo que se nota no son los metros sino el recorrido comparado con la distancia a lo que se mira:
      // 30 m lejos de todo se ven suaves; 30 m pegado al suelo se ven como un brinco
      const cerca = Math.max(1, Math.min(desde.distanceTo(previa ? v3(previa.mira) : estadoCam.mira), mejor.pos.distanceTo(mejor.mira)));
      const rel = recorrido / cerca, VMAX = cfg.velocidadCamara ?? 3.2;   // "distancias de cámara" por segundo
      let durT = dur;
      it.rel = +(rel / dur).toFixed(2);
      if (!orto && rel / durT > VMAX) {
        durT = Math.min(rel / VMAX, Math.max(dur, it.t - finPrevia - 0.05));
        if (rel / durT > VMAX * 1.5) console.warn(`[cámara] mostrar(${it.t.toFixed(2)}): la cámara viaja ${recorrido.toFixed(0)} m en ${durT.toFixed(1)} s y se verá como salto. Da más tiempo entre tomas o acerca las piezas.`);
      }
      tomas.push({ t: it.t - durT, dur: durT, e: curva(o.curva || "suave"), pos: [mejor.pos.x, mejor.pos.y, mejor.pos.z], mira: [mejor.mira.x, mejor.mira.y, mejor.mira.z], ...(orto ? { zoom: mejor.zoom } : {}) });
      (window.__tomas ||= []).push({ t: it.t, piezas: it.piezas.map((x) => x.name), dAz: mejor.dAz, dEl: mejor.dEl, puntaje: +mejor.puntaje.toFixed(2), piezasVistas: mejor.piezasVistas, nPiezas: mejor.nPiezas, nSol: mejor.nSol, rapidez: it.rel });
    }
    tomas.sort((a, b) => a.t - b.t);
    actualizar(0);
  }
  const estadoCam = { pos: v3(cfg.camara?.pos || [8, 7, 12]), mira: v3(cfg.camara?.mira || [0, 1, 0]), fov: camara.isPerspectiveCamera ? camara.fov : 1, zoom: 1 };
  function aplicarCamara(t) {
    let pos = estadoCam.pos.clone(), mira = estadoCam.mira.clone(), fov = estadoCam.fov, zoom = estadoCam.zoom;
    for (const k of tomas) {
      if (t < k.t) break;
      const p = k.e(prog(t, k.t, k.dur));
      if (k.ruta) {
        const u = Math.min(1, p), q = k.ruta.getPointAt(u), q2 = k.ruta.getPointAt(Math.min(1, u + k.adelanto));
        pos = q.clone().add(k.desfase); mira = q2;
        continue;
      }
      if (k.pos && k.mira && camara.isPerspectiveCamera) {
        // de una toma a otra la cámara GIRA alrededor de lo que mira (no corta en línea recta):
        // así nunca atraviesa el terreno ni las piezas que quedan entre las dos tomas
        const m1 = v3(k.mira), o0 = pos.clone().sub(mira), o1 = v3(k.pos).sub(m1);
        const l0 = o0.length(), l1 = o1.length();
        if (l0 > 1e-4 && l1 > 1e-4) {
          o0.divideScalar(l0); o1.divideScalar(l1);
          const giro = new THREE.Quaternion().slerp(new THREE.Quaternion().setFromUnitVectors(o0, o1), p);
          mira.lerp(m1, p);
          pos = mira.clone().add(o0.applyQuaternion(giro).multiplyScalar(lerp(l0, l1, p)));
          if (k.fov) fov = lerp(fov, k.fov, p);
          if (k.zoom) zoom = lerp(zoom, k.zoom, p);
          continue;
        }
      }
      if (k.pos) pos.lerp(v3(k.pos), p);
      if (k.mira) mira.lerp(v3(k.mira), p);
      if (k.fov) fov = lerp(fov, k.fov, p);
      if (k.zoom) zoom = lerp(zoom, k.zoom, p);
    }
    // deriva: la cámara nunca está muerta, respira un poco
    pos.x += Math.sin(t * 0.37) * derivaAmp; pos.y += Math.sin(t * 0.29 + 1) * derivaAmp * 0.6;
    camara.position.copy(pos);
    camara.lookAt(mira);
    if (camara.isPerspectiveCamera) camara.fov = fov; else camara.zoom = zoom;
    camara.updateProjectionMatrix();
  }

  // =================================================================== cuadro
  // Calcula el mundo en el instante t (piezas, flujos, tubos, alertas) sin mover la cámara ni dibujar.
  function actualizar(t) {
    for (const m of matsAlerta) m.userData.alerta = 0;
    for (const obj of animados) {
      const a = obj.userData.anim, b = a.base;
      obj.visible = true;
      obj.position.copy(b.p); obj.rotation.copy(b.r); obj.scale.copy(b.s);
      for (const m of a.movs) {
        if (t < m.t) break;
        const p = m.e(prog(t, m.t, m.dur));
        if (m.a) obj.position.lerp(v3(m.a), p);
        if (m.por) obj.position.add(v3(m.por).multiplyScalar(p));
        if (m.rot) { const r = m.rot.map((g) => (g * Math.PI) / 180); obj.rotation.set(lerp(obj.rotation.x, r[0], p), lerp(obj.rotation.y, r[1], p), lerp(obj.rotation.z, r[2], p)); }
        if (m.escala !== undefined) { const s = Array.isArray(m.escala) ? v3(m.escala) : new THREE.Vector3(m.escala, m.escala, m.escala); obj.scale.lerp(s, p); }
      }
      for (const f of a.efectos) f(t, obj);
    }
    for (const f of porCuadro) f(t);
    raiz.updateMatrixWorld(true);              // los anclajes leen las posiciones ya animadas
    for (const f of pendientesVivas) f(t);
    raiz.updateMatrixWorld(true);
    aplicarAlertas();
  }
  function render(t) {
    actualizar(t);
    aplicarCamara(t);
    const haciaCam = new THREE.Vector3();
    raiz.traverse((h) => {
      if (h.userData.miraCamara) h.quaternion.copy(camara.quaternion);
      if (h.userData.halo && h.userData.haloBase) {   // el halo se adelanta hacia la cámara: no se corta contra la superficie
        const w = h.parent.localToWorld(h.userData.haloBase.clone());
        haciaCam.copy(camara.position).sub(w).normalize().multiplyScalar(h.userData.halo);
        h.position.copy(h.parent.worldToLocal(w.add(haciaCam)));
      }
    });
    renderer.render(escena, camara);
  }

  // =================================================================== REVISOR
  // Revisa el video sin renderizarlo. Devuelve avisos {t, tipo, pieza, msg}:
  //   fuera-de-cuadro · muy-chica · tapada  → una pieza aparece y el espectador no la ve
  //   suelta                              → una pieza no toca nada (flota sin querer)
  //   ancla-invisible                     → una tubería sigue a una pieza que ya no está
  //   caras-empalmadas                    → dos caras en el mismo plano: parpadean
  //   de-golpe                            → algo aparece o desaparece en un cuadro estando a la vista
  function revisar(V, o = {}) {
    const avisos = [];
    const avisar = (t, tipo, pieza, msg) => avisos.push({ t: Math.round(t * 100) / 100, tipo, pieza, msg });
    const caja3 = new THREE.Box3(), tmp = new THREE.Box3();
    const visibleDe = (x) => { for (let n = x; n; n = n.parent) if (!n.visible) return false; return true; };
    const escalaW = new THREE.Vector3();
    const aplastada = (h) => { h.getWorldScale(escalaW); return Math.min(Math.abs(escalaW.x), Math.abs(escalaW.y), Math.abs(escalaW.z)) < 0.01; };   // agua vacía, piezas aún sin crecer
    const solidos = () => { const r = []; raiz.traverse((h) => { if (h.isMesh && !h.isLineSegments2 && !h.userData.esTinta && !h.userData.soloEncuadre && visibleDe(h) && !aplastada(h) && !(h.material.transparent && h.material.opacity < 0.6)) r.push(h); }); return r; };
    const cajaDe = (obj) => { caja3.makeEmpty(); recorrerPropio(obj, (h) => { if (h.isMesh && !h.isLineSegments2 && !h.userData.esTinta && visibleDe(h)) caja3.union(cajaPropia(h, tmp)); }); return caja3.clone(); };
    const esDe = (h, obj) => { for (let n = h; n; n = n.parent) if (n === obj) return true; return false; };
    const ray = new THREE.Raycaster(); ray.camera = camara;
    const nombre = (x) => { for (let n = x; n && n !== raiz; n = n.parent) if (n.name && !/ tramo | codo /.test(n.name)) return n.name; return x.name || x.type; };

    // 1 · cada pieza que aparece tiene que verse
    for (const a of apariciones) {
      if (!a.revisar || a.obj.userData.noRevisar) continue;   // lo que flota también tiene que verse (letreros, cotas)
      const t = Math.min(a.t + a.dur + 0.05, V.dur - 0.01);
      render(t);
      if (!visibleDe(a.obj)) continue;
      const bb = cajaDe(a.obj);
      if (bb.isEmpty()) continue;
      const centro = bb.getCenter(new THREE.Vector3());
      const esquinas = [];
      for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) esquinas.push(new THREE.Vector3(x, y, z).project(camara));
      const xs = esquinas.map((q) => q.x), ys = esquinas.map((q) => q.y);
      const dentro = Math.max(...xs) > -1 && Math.min(...xs) < 1 && Math.max(...ys) > -1 && Math.min(...ys) < 1 && esquinas.some((q) => q.z < 1);
      const c = centro.clone().project(camara);
      if (!dentro) { avisar(a.t, "fuera-de-cuadro", nombre(a.obj), "aparece fuera de la toma"); continue; }
      // qué parte de la pieza cae dentro de la toma (rectángulo proyectado recortado contra la pantalla)
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const area = Math.max(1e-6, (x1 - x0) * (y1 - y0));
      const adentro = (Math.max(0, Math.min(1, x1) - Math.max(-1, x0)) * Math.max(0, Math.min(1, y1) - Math.max(-1, y0))) / area;
      if (adentro < 0.6 && (x1 - x0) < 1.6 && (y1 - y0) < 1.6) avisar(a.t, "cortada", nombre(a.obj), `aparece cortada: solo se ve el ${Math.round(adentro * 100)} %`);
      else if (Math.abs(c.x) > 0.92 || Math.abs(c.y) > 0.92) avisar(a.t, "orilla", nombre(a.obj), "aparece en la orilla de la toma");
      const alto = (Math.min(1, Math.max(...ys)) - Math.max(-1, Math.min(...ys))) / 2, ancho = (Math.min(1, Math.max(...xs)) - Math.max(-1, Math.min(...xs))) / 2;
      if (Math.max(alto, ancho) < (o.minimo ?? 0.035)) avisar(a.t, "muy-chica", nombre(a.obj), `aparece muy chica (${Math.round(Math.max(alto, ancho) * 100)} % de la pantalla)`);
      const muestras = [centro];
      for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) muestras.push(new THREE.Vector3(x, y, z).lerp(centro, 0.25));
      const sol = solidos();
      let tapador = null, vistas = 0;
      for (const q of muestras) {
        ray.set(camara.position, q.clone().sub(camara.position).normalize());
        const dist = camara.position.distanceTo(q);
        const golpe = ray.intersectObjects(sol, false).find((i) => i.distance < dist - 0.05 && !esDe(i.object, a.obj));
        if (!golpe) vistas++; else tapador = tapador || golpe.object;
      }
      if (vistas === 0 && !a.tapadaOk && !a.obj.userData.enterrada) avisar(a.t, "tapada", nombre(a.obj), `aparece tapada por «${nombre(tapador)}»`);
      if (a.dur < 0.05) avisar(a.t, "de-golpe", nombre(a.obj), "aparece de golpe estando a la vista");
    }

    // 2 · en cada beat: piezas sueltas, tuberías sin su pieza y caras empalmadas
    const ini = o.instantes || V.beats;
    const instantes = ini.map((x, i) => Math.min((x + (ini[i + 1] ?? V.dur)) / 2, V.dur - 0.01)).concat([V.dur - 0.05]);
    for (const obj of animados) for (const m of obj.userData.anim.movs) instantes.push(m.t + m.dur * 0.5);   // a medio movimiento
    instantes.sort((a, b) => a - b);
    const animandose = (obj, t) => {
      for (let n = obj; n && n !== raiz; n = n.parent) {
        if (apariciones.some((a) => a.obj === n && t >= a.t - 0.01 && t <= a.t + a.dur + 0.05)) return true;
        const an = n.userData.anim;
        if (an && an.salida !== undefined && t >= an.salida) return true;   // los movimientos SÍ se revisan: nada debe flotar al moverse
      }
      return false;
    };
    const yaSuelta = new Set(), yaCaras = new Set(), yaAncla = new Set();
    for (const t of instantes) {
      render(t);
      const todos = solidos();
      const cajas = todos.map((h) => ({ h, b: cajaPropia(h) }));
      for (const a of apariciones) {
        const obj = a.obj;
        if (obj.userData.flota || !visibleDe(obj) || yaSuelta.has(obj) || animandose(obj, t)) continue;
        const bb = cajaDe(obj);
        if (bb.isEmpty()) continue;
        bb.expandByScalar(0.03);
        const toca = cajas.some(({ h, b }) => !esDe(h, obj) && !esDe(obj, h) && b.intersectsBox(bb));
        if (!toca) { yaSuelta.add(obj); avisar(t, "suelta", nombre(obj), "no toca ninguna otra pieza (¿flota sin querer?)"); }
      }
      raiz.traverse((g) => {
        if (!g.userData.esTuberia || !visibleDe(g) || yaAncla.has(g)) return;
        for (const an of g.userData.anclas) if (!visibleDe(an)) { yaAncla.add(g); avisar(t, "ancla-invisible", nombre(g), `sigue a «${nombre(an)}», que no está visible`); }
      });
      // caras empalmadas: cajas alineadas a los ejes con una cara en el mismo plano y mirando al mismo lado
      const alineadas = cajas.filter(({ h }) => (h.geometry.type === "BoxGeometry" || h.geometry.type === "PlaneGeometry") && Math.abs(Math.abs(new THREE.Vector3(0, 1, 0).applyQuaternion(h.getWorldQuaternion(new THREE.Quaternion())).y) - 1) < 1e-3 && !h.material.polygonOffset);
      for (let i = 0; i < alineadas.length; i++) for (let j = i + 1; j < alineadas.length; j++) {
        const A = alineadas[i], B = alineadas[j];
        for (const eje of ["x", "y", "z"]) for (const lado of ["min", "max"]) {
          if (Math.abs(A.b[lado][eje] - B.b[lado][eje]) > 0.002) continue;
          const otros = ["x", "y", "z"].filter((e) => e !== eje);
          const solapa = otros.every((e) => Math.min(A.b.max[e], B.b.max[e]) - Math.max(A.b.min[e], B.b.min[e]) > 0.01);
          if (!solapa) continue;
          const clave = [A.h.id, B.h.id, eje, lado].join("|");
          if (yaCaras.has(clave)) continue;
          yaCaras.add(clave);
          avisar(t, "caras-empalmadas", nombre(A.h), `comparte la cara ${lado === "min" ? "−" : "+"}${eje} (en ${eje} = ${A.b[lado][eje].toFixed(2)}) con «${nombre(B.h)}» (parpadea)`);
        }
      }
    }
    // 3 · SENTIDO COMÚN (física y causa-efecto)
    const yaSC = new Set();
    const unaVez = (clave, f) => { if (!yaSC.has(clave)) { yaSC.add(clave); f(); } };
    const todosVisibles = () => { const r = []; raiz.traverse((h) => { if (h.isMesh && !h.isLineSegments2 && !h.userData.esTinta && !h.userData.soloEncuadre && visibleDe(h) && !aplastada(h)) r.push(h); }); return r; };
    const piezaDe = (h) => { let n = h; while (n.parent && n.parent !== raiz && !n.userData.montadaSobre && !n.userData.esTuberia) n = n.parent; return n; };
    const dentroDeFlujo = (h) => { for (let n = h; n; n = n.parent) if (n.userData.esFlujo) return true; return false; };
    const segCaja = (a2, b2, c) => {   // ¿el segmento a→b entra a la caja?
      let t0 = 0, t1 = 1;
      for (const e of ["x", "y", "z"]) {
        const d = b2[e] - a2[e];
        if (Math.abs(d) < 1e-9) { if (a2[e] < c.min[e] || a2[e] > c.max[e]) return false; continue; }
        let u0 = (c.min[e] - a2[e]) / d, u1 = (c.max[e] - a2[e]) / d;
        if (u0 > u1) [u0, u1] = [u1, u0];
        t0 = Math.max(t0, u0); t1 = Math.min(t1, u1);
        if (t0 > t1) return false;
      }
      return true;
    };
    for (const t of instantes) {
      render(t);
      const vis = todosVisibles().filter((h) => !dentroDeFlujo(h));
      const cajasV = vis.map((h) => ({ h, b: cajaPropia(h) }));
      // a) agua (o energía) fuera de un tubo: los flujos sin tubo deben ir pegados a alguno, salvo caídas libres
      const tramos = []; raiz.traverse((g2) => { if (g2.userData.esTuberia && visibleDe(g2)) g2.children.forEach((m) => { if (m.userData.tramo && m.visible) tramos.push(m); }); });
      for (const f of flujos) {
        if (!visibleDe(f) || f.userData.tubo || f.userData.libre) continue;
        const lejos = f.children.filter((b2) => b2.isMesh && b2.visible).some((b2) => {
          const q = b2.getWorldPosition(new THREE.Vector3());
          return !tramos.some((m) => { const c = cajaPropia(m).expandByScalar(0.12); return c.containsPoint(q); });
        });
        if (lejos) unaVez("flujo|" + f.id, () => avisar(t, "agua-sin-tubo", f.name, "corre por donde no hay tubo (si es una caída o un chorro libre, márcalo libre: true)"));
      }
      // b) un tubo atraviesa una pieza que no es estructura (tinaco, base, otra tubería…)
      raiz.traverse((g2) => {
        if (!g2.userData.esTuberia || !visibleDe(g2)) return;
        const propias = new Set([g2, ...g2.userData.anclas, ...(g2.userData.montados || []).map((x) => x.pieza)]);
        const esPropia = (h) => { for (let n = h; n; n = n.parent) if (propias.has(n)) return true; return false; };
        const ps = g2.userData.puntos();
        const rev = g2.userData.revelado(t);
        if (rev < 0.999) return;   // mientras se tiende no se juzga
        const distSeg = (q, a2, b2) => { const ab = b2.clone().sub(a2), l = ab.lengthSq(); const k = l ? Math.max(0, Math.min(1, q.clone().sub(a2).dot(ab) / l)) : 0; return q.distanceTo(a2.clone().addScaledVector(ab, k)); };
        const tocaPolilinea = (q, pl) => pl.some((a2, i) => i < pl.length - 1 && distSeg(q, a2, pl[i + 1]) < 0.2);
        const enT = (otro) => { const po = otro.userData.puntos(); return [ps[0], ps[ps.length - 1]].some((q) => tocaPolilinea(q, po)) || [po[0], po[po.length - 1]].some((q) => tocaPolilinea(q, ps)); };
        const tuboDe = (h) => { for (let n = h; n; n = n.parent) if (n.userData.esTuberia) return n; return null; };
        for (const { h, b: c } of cajasV) {
          if (h.userData.estructura || esPropia(h) || h.userData.flota) continue;
          const otro = tuboDe(h);
          if (otro && (otro === g2 || enT(otro))) continue;   // unión en T: conectados, no se atraviesan
          const caja = c.clone().expandByScalar(-0.03);
          if (caja.isEmpty()) continue;
          for (let i = 0; i < ps.length - 1; i++) if (ps[i].distanceTo(ps[i + 1]) > 0.05 && segCaja(ps[i], ps[i + 1], caja)) {
            unaVez(`atraviesa|${g2.id}|${piezaDe(h).id}`, () => avisar(t, "atraviesa", g2.name, `pasa a través de «${nombre(h)}»`));
            break;
          }
        }
      });
      // c) inclinada sin recargarse · d) sin nada abajo · e) "flota" pero se mueve: ¿quién la mueve?
      for (const a of apariciones) {
        const obj = a.obj;
        if (!visibleDe(obj) || animandose(obj, t) || obj.userData.esTuberia) continue;
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(obj.getWorldQuaternion(new THREE.Quaternion()));
        const bb = cajaDe(obj);
        if (bb.isEmpty()) continue;
        const ajena = ({ h }) => !esDe(h, obj) && !esDe(obj, h);
        if (up.y < Math.cos(THREE.MathUtils.degToRad(4)) && !obj.userData.flota) {
          const punta = bb.clone(); punta.min.y = bb.max.y - (bb.max.y - bb.min.y) * 0.15; punta.expandByScalar(0.05);
          if (!cajasV.some((x) => ajena(x) && x.b.intersectsBox(punta))) unaVez("incl|" + obj.id, () => avisar(t, "inclinada", nombre(obj), "está inclinada y su punta no se recarga en nada (usa recargar(pieza, pared))"));
        }
        if (obj.parent === raiz && !obj.userData.flota && !obj.userData.montadaSobre) {
          const piso = bb.clone(); piso.max.y = bb.min.y + 0.06; piso.min.y = bb.min.y - 0.06;
          if (!cajasV.some((x) => ajena(x) && x.b.intersectsBox(piso))) unaVez("apoyo|" + obj.id, () => avisar(t, "sin-apoyo", nombre(obj), "no tiene nada abajo que la sostenga"));
        }
        const conAgente = (() => { for (let n = obj; n; n = n.parent) if (n.userData.agente) return true; return false; })();
        if (obj.userData.flota && obj.userData.movidaPorEscena && !obj.userData.causa && !conAgente) unaVez("mueve|" + obj.id, () => avisar(t, "quien-la-mueve", nombre(obj), "está marcada «flota» y se mueve sola: ¿quién o qué la mueve?"));
      }
    }
    // 8 · pizarra: con la cámara quieta, nada queda a medias en la orilla (o se ve completa o no se ve)
    if (estilo === "pizarra") {
      const hechas = new Set();
      for (const k of tomas) {
        const t = Math.min(k.t + k.dur + 0.3, V.dur - 0.05);
        render(t);
        const vista = new THREE.Box2(new THREE.Vector2(-1, -1), new THREE.Vector2(1, 1));
        for (const h of raiz.children) {
          if (!visibleDe(h) || h.userData.estructura || h.userData.esFlujo || h.name === "embudo" || hechas.has(h.id)) continue;
          const c = cajaDe(h); if (c.isEmpty()) continue;
          const a = c.min.clone().project(camara), b = c.max.clone().project(camara);
          const r = new THREE.Box2(new THREE.Vector2(Math.min(a.x, b.x), Math.min(a.y, b.y)), new THREE.Vector2(Math.max(a.x, b.x), Math.max(a.y, b.y)));
          if (!vista.intersectsBox(r) || vista.containsBox(r)) continue;
          const i = r.clone().intersect(vista), dentro = ((i.max.x - i.min.x) * (i.max.y - i.min.y)) / Math.max(1e-6, (r.max.x - r.min.x) * (r.max.y - r.min.y));
          if (dentro > 0.04 && dentro < 0.97) { hechas.add(h.id); avisar(t, "cortada", nombre(h), `queda cortada por la orilla con la cámara quieta (se ve el ${Math.round(dentro * 100)} %): inclúyela en la toma o aléjala`); }
        }
      }
    }
    // 9 · la cámara nunca entra en un sólido (ni en el camino entre dos tomas)
    if (camara.isPerspectiveCamera) {
      const rayo = new THREE.Raycaster(), dir = new THREE.Vector3(), nW = new THREE.Vector3();
      let dentroDesde = null, dentroDe = "";
      for (let t = 0; t <= V.dur; t += 0.1) {
        render(t);
        camara.getWorldDirection(dir);
        rayo.set(camara.position, dir); rayo.far = 200;
        // el rayo tiene que ver también las caras de atrás: si lo primero que toca es una cara trasera, la cámara está dentro
        const ss = solidos().filter((m) => !Array.isArray(m.material)), lados = ss.map((m) => m.material.side);
        ss.forEach((m) => { m.material.side = THREE.DoubleSide; });
        const h = rayo.intersectObjects(ss, false).find((x) => x.face);
        ss.forEach((m, i) => { m.material.side = lados[i]; });
        let dentro = false;
        if (h && lados[ss.indexOf(h.object)] !== THREE.DoubleSide) { nW.copy(h.face.normal).transformDirection(h.object.matrixWorld); dentro = nW.dot(dir) > 0.05; }
        if (dentro && dentroDesde === null) { dentroDesde = t; dentroDe = nombre(h.object); }
        if (!dentro && dentroDesde !== null) { avisar(dentroDesde, "camara-dentro", dentroDe, `la cámara pasa por dentro de «${dentroDe}» de ${dentroDesde.toFixed(1)} s a ${t.toFixed(1)} s (sube la toma o separa las dos tomas)`); dentroDesde = null; }
      }
    }
    return avisos.sort((a, b) => a.t - b.t);
  }

  return {
    THREE, E, P, estilo, escena, camara: cam, camara3: camara, renderer, raiz, sol, ambiente,
    mat, col, texturaManchas, entintar, colocar, malla, caja, cilindro, esfera, cono, toro, plano, extruir, tornear, tubo, tuberia, tuberiaViva, punto, puerto, conectar, montar, fraccionEn, sobre, recargar, altoDe, zona, grupo, agregar, letrero, brillo, luz,
    mover: (obj, t, destino, ...r) => { if (destino.causa) obj.userData.causa = destino.causa; else obj.userData.movidaPorEscena = true; return mover(obj, t, destino, ...r); }, efecto: efectoLibre, aparecer, desaparecer, ensamblar, sacudir, latir, girar, oscilar, pista, alerta, teñir, flujo, trazo, lluvia, flecha,
    texturaReal, cadaCuadro: (fn) => porCuadro.push(fn), alFinal: (fn) => pendientesVivas.push(fn), render, actualizar, prepararTomas, revisar, azar, prog,
  };
}
