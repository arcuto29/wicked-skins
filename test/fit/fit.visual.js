// Smart Fit, on the real TradingView chart: uploads in four shapes, at three window sizes, before / after.
// Each test picture has a main subject in the middle (a figure, a face, a car) and markers at its top, bottom, left
// and right edges (TOP / BOTTOM / LEFT / RIGHT on orange): any crop shows, and is counted by pixels, not by eye.
//   node test/fit/fit.visual.js --ext <checkout> --label before|after [--fit <value to set, e.g. auto>]
const { chromium } = require("playwright");
const path = require("path"), crypto = require("crypto"), fs = require("fs"), os = require("os");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const EXT0 = path.resolve(arg("ext", path.join(__dirname, "..", ".."))), LABEL = arg("label", "run"), FIT = arg("fit", ""), DPR = +arg("dpr", 1);
const http = require("http"), PORT = 8127, LOCAL = `http://127.0.0.1:${PORT}`;
// a page of our own with two real Lightweight Charts side by side (a 2-chart layout: TradingView allows none signed out)
const TWO = `<!doctype html><html><head><style>html,body{margin:0;height:100%;background:#0b0e14}#w{position:fixed;inset:0;display:grid;grid-template-columns:1fr 1fr;gap:4px}#w>div{position:relative}</style></head>
<body><div id="w"><div id="a"></div><div id="b"></div></div><script src="https://unpkg.com/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js"></script><script>
for (const id of ["a", "b"]) { const ch = LightweightCharts.createChart(document.getElementById(id), { autoSize: true, layout: { background: { type: "solid", color: "#0b0e14" }, textColor: "#d1d4dc" } });
  const s = ch.addCandlestickSeries(); const d = []; let p = 100, t = Math.floor(Date.now() / 1000) - 120 * 86400;
  for (let i = 0; i < 120; i++) { const c = p + Math.sin(i / 4) * 2; d.push({ time: t + i * 86400, open: p, high: Math.max(p, c) + 1, low: Math.min(p, c) - 1, close: c }); p = c; } s.setData(d); }
window.__ready = true;</script></body></html>`;
const OUT = path.resolve(path.join(__dirname, "..", "..", "test-output", "fit", LABEL)); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const SHAPES = { portrait: [1080, 1920], square: [2048, 2048], landscape: [3840, 2160], ultrawide: [5120, 2160] };
const WINDOWS = { "1600x900": [1600, 900], "2560x1080 ultrawide": [2560, 1080], "1000x1000 narrow": [1000, 1000] };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const srv = http.createServer((q, r) => { r.setHeader("content-type", "text/html"); r.end(TWO); }).listen(PORT, "127.0.0.1");
  // a copy of the extension that also runs on that page
  const EXT = path.join(os.tmpdir(), `priism-fitx-${process.pid}`); fs.rmSync(EXT, { recursive: true, force: true });
  fs.cpSync(EXT0, EXT, { recursive: true, filter: (f) => !/[\\/](\.git|node_modules|test-output|dist|android|desktop|site|store|supabase|test)([\\/]|$)/.test(f.slice(EXT0.length)) });
  { const mp = path.join(EXT, "manifest.json"), m = JSON.parse(fs.readFileSync(mp, "utf8")); m.content_scripts.forEach((c) => c.matches.push(LOCAL + "/*")); m.host_permissions.push(LOCAL + "/*"); fs.writeFileSync(mp, JSON.stringify(m)); }
  const id = [...crypto.createHash("sha256").update(EXT).digest("hex").slice(0, 32)].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
  const prof = path.join(os.tmpdir(), `priism-fit-${process.pid}`); fs.rmSync(prof, { recursive: true, force: true });
  const ctx = await chromium.launchPersistentContext(prof, { headless: false, viewport: DPR === 1 ? { width: 1600, height: 900 } : null,
    args: ["--headless=new", "--no-sandbox", ...(DPR !== 1 ? [`--force-device-scale-factor=${DPR}`, "--window-size=1600,900"] : []), `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`] });
  await sleep(1500);
  const pop = await ctx.newPage(); await pop.goto(`chrome-extension://${id}/popup/popup.html`); await sleep(800);
  const media = await pop.evaluate(async (SHAPES) => {
    const out = [];
    for (const [name, [W, H]] of Object.entries(SHAPES)) {
      const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d"), u = Math.min(W, H) / 100;
      const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, "#1b2a6b"); bg.addColorStop(0.5, "#6b2a7a"); bg.addColorStop(1, "#0f5a6b"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) { g.fillStyle = `hsla(${i * 37},70%,60%,0.12)`; g.beginPath(); g.arc((i * 997) % W, (i * 613) % H, 6 * u + (i % 5) * 3 * u, 0, 7); g.fill(); }
      // the subject: a figure with a face, standing by a car, in the middle
      const cx = W / 2, cy = H / 2; g.fillStyle = "#f2c9a0"; g.beginPath(); g.arc(cx, cy - 14 * u, 7 * u, 0, 7); g.fill();
      g.fillStyle = "#111"; g.beginPath(); g.arc(cx - 2.5 * u, cy - 15 * u, 1 * u, 0, 7); g.arc(cx + 2.5 * u, cy - 15 * u, 1 * u, 0, 7); g.fill();
      g.strokeStyle = "#111"; g.lineWidth = 0.6 * u; g.beginPath(); g.arc(cx, cy - 12.5 * u, 3 * u, 0.2, Math.PI - 0.2); g.stroke();
      g.fillStyle = "#e8e8f0"; g.fillRect(cx - 6 * u, cy - 6 * u, 12 * u, 20 * u);
      g.fillStyle = "#d62f3a"; g.beginPath(); g.roundRect(cx - 22 * u, cy + 16 * u, 44 * u, 10 * u, 3 * u); g.fill(); g.fillRect(cx - 12 * u, cy + 10 * u, 22 * u, 8 * u);
      g.fillStyle = "#222"; for (const dx of [-13, 13]) { g.beginPath(); g.arc(cx + dx * u, cy + 26 * u, 4 * u, 0, 7); g.fill(); }
      // edge markers
      g.font = `bold ${5 * u}px sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
      const mark = (t, x, y) => { const w = g.measureText(t).width + 3 * u; g.fillStyle = "#ff8800"; g.fillRect(x - w / 2, y - 3.5 * u, w, 7 * u); g.fillStyle = "#000"; g.fillText(t, x, y); };
      mark("TOP", W / 2, 4 * u); mark("BOTTOM", W / 2, H - 4 * u); mark("LEFT", 9 * u, H / 2); mark("RIGHT", W - 10 * u, H / 2);
      g.fillStyle = "#fff"; g.font = `bold ${4 * u}px sans-serif`; g.fillText(`${name} ${W}x${H}`, W / 2, H / 2 + 36 * u);
      const blob = await new Promise((r) => c.toBlob(r, "image/png")), mid = "fit-" + name;
      await window.WickedMediaDB.put(mid, blob);
      out.push({ id: mid, name: name + ".png", type: "image", file: true, size: blob.size, w: W, h: H });
      if (name === "portrait") {   // the same picture as a TikTok-style video (moving, 1080x1920)
        const rec = new MediaRecorder(c.captureStream(30), { mimeType: "video/webm;codecs=vp8", videoBitsPerSecond: 8e6 }), parts = [], snap = g.getImageData(0, 0, W, H);
        rec.ondataavailable = (e) => parts.push(e.data); rec.start(250); const t0 = performance.now();
        await new Promise((res) => { const f = () => { const t = (performance.now() - t0) / 1000; g.putImageData(snap, 0, 0); g.fillStyle = "rgba(255,255,255,0.8)"; g.beginPath(); g.arc(W / 2 + Math.sin(t * 2) * W * 0.3, H * 0.2, 4 * u, 0, 7); g.fill();
          if (t < 3) requestAnimationFrame(f); else { rec.onstop = res; rec.stop(); } }; f(); });
        const vb = new Blob(parts, { type: "video/webm" }); await window.WickedMediaDB.put("fit-video", vb);
        out.push({ id: "fit-video", name: "reel.webm", type: "video", file: true, size: vb.size, w: W, h: H });
      }
    }
    return out;
  }, SHAPES);
  const base = { enabled: true, welcomePending: 0, invite: { code: "PRIISM-FIT-TEST", ok: true, status: "ok", checked: 4e12, since: 1 }, media, skin: "media", mediaId: "fit-portrait", dim: 0.25 };
  if (FIT) base.fit = FIT;
  await pop.evaluate((o) => new Promise((r) => chrome.storage.local.set(o, r)), base);
  const page = ctx.pages().find((p) => p !== pop); await page.bringToFront();
  await page.goto("https://www.tradingview.com/chart/?symbol=BINANCE%3ABTCUSDT", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForFunction(() => window.TradingViewApi && window.TradingViewApi.activeChart, null, { timeout: 90000 }); await sleep(7000);
  for (let i = 0; i < 4; i++) { const l = page.getByRole("button", { name: /got it/i }); if (!(await l.count())) break; await l.first().click({ force: true }).catch(() => {}); await sleep(300); }
  const results = {};
  for (const [wn, [w, h]] of Object.entries(WINDOWS)) {
    await page.setViewportSize({ width: w, height: h }); await sleep(2500);
    for (const name of [...Object.keys(SHAPES), "video"]) {
      await pop.evaluate((m) => new Promise((r) => chrome.storage.local.set({ mediaId: m }, r)), "fit-" + name); await sleep(3500);
      const file = `${wn.split(" ")[0]}-${name}.png`;
      await page.screenshot({ path: path.join(OUT, file) });
      // how much of each edge marker is on screen (orange pixels in that part of the screen), and the wallpaper's box
      const shot = await page.screenshot(); const b64 = shot.toString("base64");
      const m = await pop.evaluate(async (b64) => { const im = new Image(); await new Promise((r) => { im.onload = r; im.src = "data:image/png;base64," + b64; });
        const c = document.createElement("canvas"); c.width = im.width; c.height = im.height; const g = c.getContext("2d"); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data;
        let n = 0; for (let i = 0; i < d.length; i += 16) if (d[i] > 150 && d[i + 1] > 70 && d[i + 1] < 160 && d[i + 2] < 60) n++; return n; }, b64);
      const st = await Promise.all(page.frames().filter((f) => /player\/player\.html/.test(f.url())).map((f) => f.evaluate(() => { const e = document.getElementById("m"), b = document.querySelector(".bd-surround");
        return { box: [innerWidth, innerHeight], pic: e ? [e.naturalWidth || e.videoWidth, e.naturalHeight || e.videoHeight] : null, art: e ? [e.style.width, e.style.height, e.style.objectFit] : null, surround: b ? b.style.display : "none", left: e ? e.style.left : null, top: e ? e.style.top : null }; }).catch(() => null)));
      results[`${wn} | ${name}`] = { file, markerPixels: m, players: st };
    }
  }
  // 2-chart layout (each chart gets its own wallpaper, fitted to that chart)
  const two = await ctx.newPage(); await two.setViewportSize({ width: 1600, height: 900 }).catch(() => {});
  await two.goto(LOCAL + "/", { waitUntil: "load" }); await two.waitForFunction("window.__ready === true");
  for (const name of ["portrait", "landscape", "ultrawide"]) { await pop.evaluate((m) => new Promise((r) => chrome.storage.local.set({ mediaId: m }, r)), "fit-" + name); await sleep(3500);
    await two.screenshot({ path: path.join(OUT, `2charts-${name}.png`) }); results[`2 charts | ${name}`] = { file: `2charts-${name}.png` }; }
  fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(results, null, 1));
  console.log(JSON.stringify(results));
  await ctx.close(); srv.close(); fs.rmSync(prof, { recursive: true, force: true }); fs.rmSync(EXT, { recursive: true, force: true });
})().catch((e) => { console.error(e); process.exit(1); });
