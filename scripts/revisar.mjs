// Revisor automático: abre el video en Chrome (sin renderizarlo) y busca lo que "se rompe":
// piezas fuera de cuadro, muy chicas, tapadas o sueltas; tuberías sin su pieza; caras que parpadean;
// palabras que la escena busca y la voz no dice; errores de JavaScript.
// Uso: node scripts/revisar.mjs videos/<slug>    (antes: python3 scripts/armar.py videos/<slug>)
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(process.argv[2] || ".");
if (!fs.existsSync(path.join(dir, "index.html"))) { console.error("falta index.html: corre antes scripts/armar.py"); process.exit(2); }
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
const url = `http://127.0.0.1:${server.address().port}/index.html`;

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--use-angle=metal", "--ignore-gpu-blocklist", "--mute-audio"] });
let avisos = [], consola = [], errores = [];
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920 });
  page.on("console", (m) => { if (["warn", "warning", "error"].includes(m.type())) consola.push(m.text()); });
  page.on("pageerror", (e) => { errores.push(e.message + (e.stack ? "\n      " + e.stack.split("\n").slice(1, 3).join("\n      ") : "")); });
  await page.goto(url, { waitUntil: "load", timeout: 120000 });
  try {
    await page.waitForFunction("window.__M && window.__V || window.__errorEscena", { timeout: 120000, polling: 500 });
  } catch (e) { errores.push("la escena no terminó de cargar (¿un ciclo infinito o algo muy pesado?)"); }
  if (errores.length) {   // un error al construir: mostrarlo de inmediato, no esperar
    console.log("\n✗ ERRORES DE JAVASCRIPT (la escena no se pudo construir)"); errores.forEach((e) => console.log("   " + e));
    consola.filter((c) => !/WebGL|GPU stall/.test(c)).slice(0, 8).forEach((c) => console.log("   consola: " + c.slice(0, 220)));
    await browser.close(); server.close(); process.exit(1);
  }
  const js = process.argv.indexOf("--js");
  if (js > 0) {   // inspección: node scripts/revisar.mjs videos/<slug> --js "expresión con M y V"
    const r = await page.evaluate((c) => { const M = window.__M, V = window.__V; return JSON.stringify(eval(c), null, 1); }, process.argv[js + 1]);
    console.log(r); await browser.close(); server.close(); process.exit(0);
  }
  avisos = await page.evaluate(() => window.__M.revisar(window.__V));
} finally {
  await browser.close();
  server.close();
}

const plan = JSON.parse(fs.readFileSync(path.join(dir, "plan.json"), "utf8"));
const timing = JSON.parse(fs.readFileSync(path.join(dir, "timing.json"), "utf8"));
const beatEn = (t) => { let k = 0; timing.beats.forEach((b, i) => { if (b.ini <= t + 0.05) k = i; }); return k; };
const NOMBRES = { "fuera-de-cuadro": "Fuera de cuadro", "camara-dentro": "Cámara dentro de un sólido", "muy-chica": "Muy chica", tapada: "Tapada", suelta: "Pieza suelta", "ancla-invisible": "Tubería sin su pieza", "caras-empalmadas": "Caras que parpadean", "de-golpe": "Aparece de golpe", orilla: "En la orilla de la toma", cortada: "Cortada por la orilla", ilegible: "Texto que no se lee", encimada: "Piezas encimadas", "zona-insegura": "Abajo, donde tapan los botones de la app", "flecha-huerfana": "Flecha que no conecta nada visible", desbalance: "Espacio vacío sin razón (toma descentrada)", "a-caballo": "Pieza a caballo (montada en la orilla de otra)", "texto-encimado": "Texto encima de lo importante", "pantalla-vacia": "Pantalla de celular con hueco", "texto-sobre-imagen": "Texto encima de una imagen", "subtitulo-adelantado": "Subtítulo que se adelanta a la voz", "sin-movimiento": "Voz sin animación (pantalla estática)",
  "agua-sin-tubo": "SENTIDO COMÚN · Agua sin tubo", atraviesa: "SENTIDO COMÚN · Un tubo atraviesa una pieza", inclinada: "SENTIDO COMÚN · Inclinada sin recargarse",
  "sin-apoyo": "SENTIDO COMÚN · Sin nada abajo", "quien-la-mueve": "SENTIDO COMÚN · Se mueve sola" };
const ADVERTENCIAS = ["orilla", "de-golpe"];   // las caras empalmadas SÍ se corrigen: parpadean
const palabras = consola.filter((c) => c.includes("[escena] no encontré"));
const camaras = consola.filter((c) => c.includes("[cámara]"));
const otros = consola.filter((c) => !c.includes("[escena]") && !c.includes("[cámara]") && !/WebGL|GPU stall|THREE\.WebGLRenderer/.test(c));

console.log(`\nRevisión de ${path.basename(dir)} · ${timing.duracion.toFixed(1)} s · ${plan.beats.length} beats\n`);
if (errores.length) { console.log("✗ ERRORES DE JAVASCRIPT"); errores.forEach((e) => console.log("   " + e)); }
if (palabras.length) { console.log("✗ PALABRAS QUE LA ESCENA BUSCA Y LA VOZ NO DICE (la animación cae en un tiempo aproximado)"); [...new Set(palabras)].forEach((e) => console.log("   " + e.replace("[escena] ", ""))); }
if (camaras.length) { console.log("✗ TOMAS IMPOSIBLES (la cámara no puede mostrar todo lo que se le pidió)"); [...new Set(camaras)].forEach((e) => console.log("   " + e.replace("[cámara] ", ""))); }
const porTipo = {};
avisos.forEach((a) => (porTipo[a.tipo] ||= []).push(a));
for (const [tipo, lista] of Object.entries(porTipo)) {
  console.log(`\n${ADVERTENCIAS.includes(tipo) ? "⚠" : "✗"} ${NOMBRES[tipo] || tipo} (${lista.length})`);
  lista.slice(0, 40).forEach((a) => { const i = beatEn(a.t); console.log(`   ${a.t.toFixed(2).padStart(6)} s · beat ${String(i).padStart(2)} «${plan.beats[i].id}» · ${a.pieza}: ${a.msg}`); });
  if (lista.length > 40) console.log(`   … y ${lista.length - 40} más`);
}
if (otros.length) { console.log("\n⚠ Otros avisos de consola"); [...new Set(otros)].slice(0, 10).forEach((e) => console.log("   " + e.slice(0, 200))); }
const graves = errores.length + palabras.length + camaras.length + avisos.filter((a) => !ADVERTENCIAS.includes(a.tipo)).length;
console.log(graves || avisos.length ? `\nTotal: ${graves} por corregir, ${avisos.length - (graves - errores.length - palabras.length - camaras.length)} advertencias.` : "\n✓ Sin problemas.");
fs.writeFileSync(path.join(dir, "revision.json"), JSON.stringify({ errores, palabras, avisos }, null, 1));
process.exit(graves ? 1 : 0);
