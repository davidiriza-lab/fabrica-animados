// Exporta la escena 3D y su ANIMACIÓN para renderizarla en Blender: three.js hace la coreografía, Blender el render.
//   <salida>.glb  → todas las piezas (también las que aparecen después), en su estado del primer cuadro
//   <salida>.json → por cuadro: posición/giro/escala/visibilidad de cada pieza que cambia, cámara, alertas (emisivo)
// Se dejan fuera la tinta, los sprites (polvo, brillos), las líneas y las zonas de encuadre: Blender pone lo suyo.
// Uso: node scripts/exportar_animacion.mjs videos/<slug> <t0> <t1> [fps=30] [salida_sin_extension]
//      (un solo cuadro: t0 = t1)
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const [, , dirArg, t0Arg, t1Arg, fpsArg, salidaArg] = process.argv;
const dir = path.resolve(dirArg || ".");
const t0 = parseFloat(t0Arg ?? "0"), t1 = parseFloat(t1Arg ?? t0Arg ?? "0"), fps = parseFloat(fpsArg || "30");
const salida = path.resolve(salidaArg || path.join(dir, "blender", `toma-${t0}-${t1}`));
if (!fs.existsSync(path.join(dir, "index.html"))) { console.error("falta index.html: corre antes scripts/armar.py"); process.exit(2); }
fs.mkdirSync(path.dirname(salida), { recursive: true });
const raizHF = execSync("npm root -g").toString().trim() + "/hyperframes";
const puppeteer = createRequire(raizHF + "/package.json")("puppeteer-core");
const chrome = execSync("npx hyperframes browser path", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim().split("\n").pop();

const tipos = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".ttf": "font/ttf", ".wav": "audio/wav", ".mp3": "audio/mpeg", ".png": "image/png", ".css": "text/css", ".woff2": "font/woff2", ".jpg": "image/jpeg" };
const server = http.createServer((req, res) => {
  const f = path.join(dir, decodeURIComponent(req.url.split("?")[0]));
  if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": tipos[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, protocolTimeout: 1800000, args: ["--use-angle=metal", "--ignore-gpu-blocklist", "--mute-audio"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920 });
  page.on("pageerror", (e) => console.error("error en la página:", e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { waitUntil: "load", timeout: 120000 });
  await page.waitForFunction("window.__M", { timeout: 120000, polling: 500 });
  const r = await page.evaluate(async (t0, t1, fps) => {
    const M = window.__M, THREE = M.THREE;
    const fuera = (o) => o.userData.esTinta || o.isSprite || o.isLineSegments2 || o.isLine || o.isPoints || o.userData.soloEncuadre || o.isLight || o.isCamera;
    // ids estables: viajan en extras del glTF y Blender los guarda como propiedad "fid"
    const piezas = [];
    M.escena.traverse((o) => { if (fuera(o)) return; o.userData.fid = piezas.length; piezas.push(o); });
    const mats = [];
    for (const o of piezas) for (const m of [].concat(o.material || [])) if (m && m.userData.mid === undefined) { m.userData.mid = mats.length; mats.push(m); }
    const emisivo = (m) => (m.emissive ? m.emissive.clone().multiplyScalar(m.emissiveIntensity ?? 1).toArray().map((x) => +x.toFixed(4)) : null);
    const visibleReal = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
    const estado = (o) => [...o.position.toArray(), ...o.quaternion.toArray(), ...o.scale.toArray()].map((x) => +x.toFixed(5)).concat(o.visible ? 1 : 0);

    // cuadros
    const n = Math.max(1, Math.round((t1 - t0) * fps) + 1);
    const cuadros = [], camara = [], alertas = [];
    for (let i = 0; i < n; i++) {
      const t = t0 + i / fps;
      M.render(t);
      cuadros.push(piezas.map(estado));
      const c = M.camara3, fw = new THREE.Vector3(0, 0, -1).applyQuaternion(c.quaternion), up = new THREE.Vector3(0, 1, 0).applyQuaternion(c.quaternion);
      camara.push({ pos: c.position.toArray(), adelante: fw.toArray(), arriba: up.toArray(), fov: c.fov });
      alertas.push(mats.map(emisivo));
    }
    // solo lo que cambia
    const cambian = piezas.map((_, k) => cuadros.some((f) => f[k].some((v, j) => v !== cuadros[0][k][j]))).flatMap((s, k) => (s ? [k] : []));
    const pistas = Object.fromEntries(cambian.map((k) => [k, cuadros.map((f) => f[k])]));
    const matsCambian = mats.map((_, k) => alertas.some((f) => JSON.stringify(f[k]) !== JSON.stringify(alertas[0][k]))).flatMap((s, k) => (s ? [k] : []));
    const pistasAlerta = Object.fromEntries(matsCambian.map((k) => [k, alertas.map((f) => f[k])]));

    // GLB en el estado del primer cuadro, con todo (también lo invisible: aparece después)
    M.render(t0);
    for (const m of mats) if (m.emissive) { m.userData.emisivoBase = emisivo(m); m.emissive.setScalar(0); }
    const quitados = [];
    M.escena.traverse((o) => { if (o !== M.escena && fuera(o)) quitados.push([o, o.parent]); });
    quitados.forEach(([o, p]) => p.remove(o));
    const visibles = piezas.map((o) => o.visible);
    piezas.forEach((o) => { o.userData.visibleInicial = o.visible; o.visible = true; });
    // color por instancia (pasto, arbolitos): el material toma el promedio
    for (const o of piezas) if (o.isInstancedMesh && o.instanceColor) {
      const a = o.instanceColor.array, k = a.length / 3, c = new THREE.Color(0, 0, 0);
      for (let i = 0; i < k; i++) { c.r += a[i * 3] / k; c.g += a[i * 3 + 1] / k; c.b += a[i * 3 + 2] / k; }
      o.material = o.material.clone(); o.material.color.multiply(c); o.instanceColor = null;
    }
    const { GLTFExporter } = await import("three/addons/exporters/GLTFExporter.js");
    const glb = await new GLTFExporter().parseAsync(M.escena, { binary: true, onlyVisible: false });
    piezas.forEach((o, k) => (o.visible = visibles[k]));
    quitados.forEach(([o, p]) => p.add(o));
    let bin = ""; const u8 = new Uint8Array(glb);
    for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    const sol = M.sol.position.clone().sub(M.sol.target.position).normalize();
    return { glb: btoa(bin), datos: { t0, t1, fps, cuadros: n, piezas: piezas.length, nombres: Object.fromEntries(cambian.map((k) => [k, piezas[k].name])), pistas, alertas: pistasAlerta, camara, sol: sol.toArray(), cieloAbajo: "#" + (M.escena.fog ? M.escena.fog.color.getHexString() : "e8f7fb") } };
  }, t0, t1, fps);
  fs.writeFileSync(salida + ".glb", Buffer.from(r.glb, "base64"));
  fs.writeFileSync(salida + ".json", JSON.stringify(r.datos));
  const mb = (f) => (fs.statSync(f).size / 1e6).toFixed(1);
  console.log(`listo: ${salida}.glb (${mb(salida + ".glb")} MB) + .json (${mb(salida + ".json")} MB) · ${r.datos.cuadros} cuadros · ${Object.keys(r.datos.pistas).length} de ${r.datos.piezas} piezas se mueven`);
} finally {
  await browser.close(); server.close();
  try { execSync("pkill -f chrome-headless-shell"); } catch {}
}
