// Google Play store graphics: phone screenshots (1080×1920) and the feature graphic (1024×500).
// Captures the real app (production build) in headless Chrome with a sample game loaded, then renders
// framed store images with headlines. Output: store/google-play/*.png (24-bit, no alpha, as Play requires).
//
// Run: npm run build && node assets/store-graphics.mjs
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const OUT = "store/google-play";
const PORT = 4317;
const DEBUG_PORT = 9333;
const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].find((p) => existsSync(p));
if (!CHROME) throw new Error("Chrome or Edge not found");
if (!existsSync("dist/index.html")) throw new Error("Run `npm run build` first");
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fileUrl = (p) => pathToFileURL(resolve(p)).href;

// ---------- sample game ----------
const config = {
  pegasus: true, exodus: true, daybreak: true, cylonFleet: true, personalGoal: false, finalFive: false,
  ending: "kobol", noSympathizer: false, sympatheticCylon: false, forceExodusLoyalty: false,
  forcePegasusLoyalty: false, forceMotive: false, forceOverlay: false, allySeasons: false, forceDemetrius: false,
};
// A legal, balanced table: 1 Political, 1 Military, 2 Pilots, 1 Support, 1 Cylon Leader.
const seats = ["laura", "starbuck", "william", "chief", "boomer", "cavil"];
const setupState = {
  version: 1, config, phase: "setup", titles: {}, removed: [], sleeperDone: false, log: [],
  players: seats.map((characterId, seat) => ({ seat, characterId, status: "human" })),
};
const playingState = {
  ...setupState,
  phase: "playing",
  players: setupState.players.map((p) =>
    p.characterId === "boomer" ? { ...p, status: "cylon" } : p.characterId === "william" ? { ...p, status: "brig" } : p,
  ),
  // Adama went to the Brig, so the Admiral title passed down the line to Starbuck.
  titles: { president: 0, admiral: 1, cag: 1 },
  log: [
    "President: Laura Roslin (start of game)", "Admiral: William Adama (start of game)", "CAG: Starbuck (start of game)",
    "William Adama sent to the Brig", "Admiral: William Adama → Starbuck (William Adama sent to the Brig)",
    "Boomer revealed as Cylon",
  ],
};

// ---------- the scenes ----------
// `prepare` runs in the page after navigation; it may open sections and scroll.
const scenes = [
  {
    id: "01-setup", state: setupState, route: "#/setup",
    title: "Set up any game", sub: "Expansions, characters and the exact Loyalty deck",
    prepare: `document.querySelectorAll('.card')[1]?.scrollIntoView({block:'start'}); window.scrollBy(0,-120);`,
  },
  {
    id: "02-titles", state: playingState, route: "#/titles",
    title: "Track every title", sub: "Lines of succession that update as the game unfolds",
  },
  {
    id: "03-combat", state: playingState, route: "#/combat",
    title: "Every roll at a glance", sub: "The full combat table – tap a ship for the details",
    prepare: `[...document.querySelectorAll('.ship-row')].find(b => b.querySelector('.ship-name')?.textContent.trim() === 'Raider')?.click();`,
  },
  {
    id: "04-crisis", state: playingState, route: "#/crisis",
    title: "Know every Crisis icon", sub: "Activations, the Cylon Fleet board and the jump track",
    prepare: `document.querySelector('.icon-grid')?.scrollIntoView({block:'start'}); window.scrollBy(0,-150);`,
  },
  {
    id: "05-execution", state: playingState, route: "#/execution/0",
    title: "Executions made easy", sub: "Human or Cylon – it tells you what happens next",
    prepare: `[...document.querySelectorAll('button.choice')].find(b => b.textContent.startsWith('Human'))?.click();
              await new Promise(r => setTimeout(r, 200));
              document.querySelector('.human-card')?.scrollIntoView({block:'start'}); window.scrollBy(0,-110);`,
  },
  {
    id: "06-rules", state: playingState, route: "#/rules",
    title: "Rules on demand", sub: "Quick rules plus the full, searchable rulebook",
    prepare: `document.querySelector('#rule-cylon-turn summary')?.click();
              await new Promise(r => setTimeout(r, 200));
              document.querySelector('#rule-cylon-turn')?.scrollIntoView({block:'start'}); window.scrollBy(0,-100);`,
  },
];

// ---------- headless Chrome over the DevTools protocol ----------
const profile = mkdtempSync(join(tmpdir(), "bsg-store-"));
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--port", String(PORT), "--strictPort"], {
  stdio: "ignore",
});
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profile}`,
  "--hide-scrollbars", "--no-first-run", "--no-default-browser-check", "--allow-file-access-from-files", "about:blank",
], { stdio: "ignore" });

async function waitFor(url) {
  for (let i = 0; i < 100; i++) {
    try { const r = await fetch(url); if (r.ok) return r; } catch { /* not up yet */ }
    await sleep(150);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

let ws, msgId = 0;
const pending = new Map();
function send(method, params = {}) {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => pending.set(id, { res, rej }));
}
async function evaluate(expression) {
  const r = await send("Runtime.evaluate", { expression: `(async () => { ${expression} })()`, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description ?? ""));
  return r.result?.value;
}
async function settle() {
  // Lazy images below the fold never load, so cap the wait instead of waiting for every image.
  await evaluate(`await document.fonts.ready;
    const pending = [...document.images].filter(i => !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r; }));
    await Promise.race([Promise.all(pending), new Promise(r => setTimeout(r, 2500))]);`);
  await sleep(400);
}
async function shot(path, { width, height, scale }) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: scale, mobile: scale > 1 });
  await sleep(150);
  const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  // Play wants 24-bit images without transparency
  await sharp(Buffer.from(data, "base64")).flatten({ background: "#04070b" }).removeAlpha().png().toFile(path);
}

try {
  await waitFor(`http://localhost:${PORT}/`);
  await waitFor(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
  const target = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: "PUT" })).json();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id);
      m.error ? p.rej(new Error(m.error.message)) : p.res(m.result);
    }
  };
  await send("Page.enable");
  await send("Runtime.enable");

  // 1. capture the app screens: a 360×640 phone at 3× → 1080×1920
  const raw = join(profile, "raw");
  mkdirSync(raw);
  for (const s of scenes) {
    await send("Emulation.setDeviceMetricsOverride", { width: 360, height: 640, deviceScaleFactor: 3, mobile: true });
    await send("Page.navigate", { url: `http://localhost:${PORT}/` });
    await sleep(600);
    await evaluate(`localStorage.setItem('bsg-helper-state-v1', ${JSON.stringify(JSON.stringify(s.state))});
      localStorage.setItem('bsg-theme', 'cic'); location.hash = '${s.route}';`);
    await send("Page.reload");
    await sleep(900);
    await settle();
    if (s.prepare) { await evaluate(s.prepare); await settle(); }
    await shot(join(raw, `${s.id}.png`), { width: 360, height: 640, scale: 3 });
    console.log("captured", s.id);
  }

  // 2. framed store screenshots, rendered from an HTML template with the app's own fonts
  const font = (pkg, file) => fileUrl(`node_modules/@fontsource/${pkg}/files/${file}`);
  const fontsCss = `
    @font-face { font-family: VT323; src: url(${font("vt323", "vt323-latin-400-normal.woff2")}); }
    @font-face { font-family: Rajdhani; font-weight: 600; src: url(${font("rajdhani", "rajdhani-latin-600-normal.woff2")}); }
    @font-face { font-family: Rajdhani; font-weight: 700; src: url(${font("rajdhani", "rajdhani-latin-700-normal.woff2")}); }`;
  const backdrop = `
    background:
      radial-gradient(ellipse at 50% 0%, rgba(134,169,207,0.22), transparent 60%),
      repeating-linear-gradient(to bottom, rgba(255,255,255,0.02) 0 1px, transparent 1px 4px),
      #04070b;`;
  const tpl = join(profile, "tpl.html");

  for (const s of scenes) {
    writeFileSync(tpl, `<!doctype html><html><head><meta charset="utf-8"><style>${fontsCss}
      * { box-sizing: border-box; margin: 0; }
      body { width: 1080px; height: 1920px; overflow: hidden; ${backdrop} font-family: Rajdhani, sans-serif; color: #e6eef7; }
      .rail { position: absolute; left: 70px; right: 70px; top: 66px; height: 12px; background: #4f6d8f;
              clip-path: polygon(0 0, 100% 0, calc(100% - 12px) 100%, 12px 100%); }
      header { position: absolute; top: 108px; left: 60px; right: 60px; height: 240px; display: flex;
               flex-direction: column; justify-content: center; align-items: center; gap: 14px; text-align: center; }
      h1 { font: 400 92px/1 VT323, monospace; letter-spacing: 0.06em; text-transform: uppercase; color: #e6eef7; }
      p { font-weight: 600; font-size: 42px; line-height: 1.2; color: #b7cde4; }
      .phone { position: absolute; top: 372px; left: 112px; width: 856px; height: 1522px; border-radius: 54px;
               padding: 14px; background: #1a2430; box-shadow: 0 0 0 3px #4f6d8f, 0 30px 80px rgba(0,0,0,0.6), 0 0 90px rgba(134,169,207,0.18); }
      .phone img { width: 100%; height: 100%; object-fit: cover; object-position: top; border-radius: 42px; display: block; }
    </style></head><body>
      <div class="rail"></div>
      <header><h1>${s.title}</h1><p>${s.sub}</p></header>
      <div class="phone"><img src="${fileUrl(join(raw, `${s.id}.png`))}"></div>
    </body></html>`);
    await send("Emulation.setDeviceMetricsOverride", { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false });
    await send("Page.navigate", { url: fileUrl(tpl) });
    await sleep(500);
    await settle();
    await shot(join(OUT, `phone-${s.id}.png`), { width: 1080, height: 1920, scale: 1 });
    console.log("wrote", `${OUT}/phone-${s.id}.png`);
  }

  // 3. feature graphic 1024×500
  writeFileSync(tpl, `<!doctype html><html><head><meta charset="utf-8"><style>${fontsCss}
    * { box-sizing: border-box; margin: 0; }
    body { width: 1024px; height: 500px; overflow: hidden; position: relative; font-family: Rajdhani, sans-serif;
           background:
             radial-gradient(circle at 24% 50%, rgba(242,219,178,0.16), transparent 42%),
             repeating-radial-gradient(circle at 24% 50%, transparent 0 68px, rgba(134,169,207,0.10) 68px 70px),
             repeating-linear-gradient(to bottom, rgba(255,255,255,0.02) 0 1px, transparent 1px 4px),
             linear-gradient(110deg, #0a1119 0%, #04070b 60%); }
    .crest { position: absolute; left: 44px; top: 50px; width: 400px; height: 400px;
             filter: drop-shadow(0 18px 40px rgba(0,0,0,0.7)); }
    .text { position: absolute; left: 480px; right: 40px; top: 84px; }
    h1 { font: 400 92px/0.95 VT323, monospace; letter-spacing: 0.08em; color: #e6eef7; text-transform: uppercase; }
    .rail { height: 8px; width: 92%; margin: 18px 0 20px; background: #4f6d8f;
            clip-path: polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%); }
    p { font-size: 34px; font-weight: 700; line-height: 1.2; color: #b7cde4; }
    small { display: block; margin-top: 18px; font-size: 21px; font-weight: 600; color: #7d92a9; }
  </style></head><body>
    <img class="crest" src="${fileUrl("public/icon-512.png")}">
    <div class="text">
      <h1>BSG<br>Companion</h1>
      <div class="rail"></div>
      <p>Setup, titles, combat, crises and executions – at your fingertips.</p>
      <small>Unofficial fan-made helper for Battlestar Galactica: The Board Game</small>
    </div>
  </body></html>`);
  await send("Emulation.setDeviceMetricsOverride", { width: 1024, height: 500, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: fileUrl(tpl) });
  await sleep(500);
  await settle();
  await shot(join(OUT, "feature-graphic.png"), { width: 1024, height: 500, scale: 1 });
  console.log("wrote", `${OUT}/feature-graphic.png`);
} finally {
  ws?.close();
  chrome.kill();
  server.kill();
  await sleep(500);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* Chrome may still hold files briefly */ }
}
