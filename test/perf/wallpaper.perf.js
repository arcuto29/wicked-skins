// Wallpaper performance on a realistic setup: TradingView's charting library (the trading-terminal demo, what
// TopstepX is built on), a high-DPI window (2x), and the CPU slowed 4x (a low-end laptop), measured, not assumed.
// Scenarios: Priism off · a built-in animated wallpaper · your own 4K video · your own 4K still image.
// For each: CPU of the whole browser (every process: the chart, the wallpaper player, the GPU process), the chart's
// own frame rate, input delay while you pan / zoom, and the same while the pointer is on the order ticket (trade focus).
//   node test/perf/wallpaper.perf.js [--ext <dir>] [--label before|after] [--scen off,skin,video,image] [--cpu 4] [--dpr 2]
const { chromium } = require("playwright");
const path = require("path"), crypto = require("crypto"), fs = require("fs"), os = require("os");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const EXT = path.resolve(arg("ext", path.join(__dirname, "..", "..")));
const LABEL = arg("label", "run"), CPU = +arg("cpu", 4), DPR = +arg("dpr", 2), SCENS = arg("scen", "off,skin,video,image").split(",");
const SITE = "https://trading-terminal.tradingview-widget.com";
const OUT = path.resolve(path.join(__dirname, "..", "..", "test-output", "perf")); fs.mkdirSync(OUT, { recursive: true });
const INV = { invite: { code: "PRIISM-PERF-TEST", ok: true, status: "ok", checked: 4e12, since: 1 }, welcomePending: 0 };
const SCEN = {
  off: { enabled: false },
  skin: { enabled: true, skin: "aurora" },
  video: { enabled: true, skin: "media", mediaId: "perfvid" },
  image: { enabled: true, skin: "media", mediaId: "perfimg" },
  videoSaver: { enabled: true, skin: "media", mediaId: "perfvid", powerSaver: true },   // the same video with Power saver
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// CPU seconds used so far by the browser and every process it started (Linux /proc)
function cpuOf(rootPid) {
  const hz = 100, kids = new Map();
  for (const d of fs.readdirSync("/proc")) { if (!/^\d+$/.test(d)) continue;
    try { const st = fs.readFileSync(`/proc/${d}/stat`, "utf8"), r = st.slice(st.lastIndexOf(")") + 2).split(" "); kids.set(+d, { ppid: +r[1], t: (+r[11] + +r[12]) / hz }); } catch {} }
  let sum = 0; const walk = (p) => { const k = kids.get(p); if (k) sum += k.t; for (const [c, v] of kids) if (v.ppid === p) walk(c); }; walk(rootPid); return sum;
}
(async () => {
  const EXTDIR = path.join(os.tmpdir(), `priism-perf-ext-${process.pid}`); fs.rmSync(EXTDIR, { recursive: true, force: true });
  fs.cpSync(EXT, EXTDIR, { recursive: true, filter: (f) => !/[\\/](\.git|node_modules|test-output|dist|android|desktop|site|store|supabase|test)([\\/]|$)/.test(f.slice(EXT.length)) });
  { const mp = path.join(EXTDIR, "manifest.json"), m = JSON.parse(fs.readFileSync(mp, "utf8")); m.content_scripts.forEach((c) => c.matches.push(SITE + "/*")); m.host_permissions.push(SITE + "/*"); fs.writeFileSync(mp, JSON.stringify(m)); }
  const id = [...crypto.createHash("sha256").update(EXTDIR).digest("hex").slice(0, 32)].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
  const results = {};
  for (const name of SCENS) {
    const prof = path.join(os.tmpdir(), `priism-perf-prof-${process.pid}-${name}`); fs.rmSync(prof, { recursive: true, force: true });
    const ctx = await chromium.launchPersistentContext(prof, { headless: false, viewport: null,
      args: ["--headless=new", "--no-sandbox", `--force-device-scale-factor=${DPR}`, "--window-size=1600,900", "--autoplay-policy=no-user-gesture-required", `--disable-extensions-except=${EXTDIR}`, `--load-extension=${EXTDIR}`] });
    await sleep(1500);
    const rootPid = +fs.readdirSync("/proc").filter((d) => /^\d+$/.test(d)).find((d) => { try { const c = fs.readFileSync(`/proc/${d}/cmdline`, "utf8"); return c.includes(prof) && !c.includes("--type="); } catch { return false; } });
    const pop = await ctx.newPage(); await pop.goto(`chrome-extension://${id}/popup/popup.html`); await sleep(800);
    // your own wallpapers, made here and stored the way the panel stores uploads (IndexedDB + the media list)
    if (/video|image/.test(name)) await pop.evaluate(async (kind) => {
      const c = document.createElement("canvas"); c.width = 3840; c.height = 2160; const g = c.getContext("2d");
      const paint = (t) => { const gr = g.createLinearGradient(0, 0, 3840, 2160); gr.addColorStop(0, `hsl(${(t * 40) % 360},60%,25%)`); gr.addColorStop(1, `hsl(${(t * 40 + 120) % 360},60%,12%)`);
        g.fillStyle = gr; g.fillRect(0, 0, 3840, 2160); for (let i = 0; i < 60; i++) { g.fillStyle = `hsla(${i * 6},80%,60%,0.35)`; g.beginPath(); g.arc((i * 211 + t * 300) % 3840, (i * 97) % 2160, 80 + (i % 7) * 20, 0, 7); g.fill(); } };
      let blob;
      if (kind === "image") { paint(0); blob = await new Promise((r) => c.toBlob(r, "image/png")); }
      else { const rec = new MediaRecorder(c.captureStream(30), { mimeType: "video/webm;codecs=vp8", videoBitsPerSecond: 20e6 }), parts = [];
        rec.ondataavailable = (e) => parts.push(e.data); rec.start(250); const t0 = performance.now();
        await new Promise((res) => { const f = () => { const t = (performance.now() - t0) / 1000; paint(t); if (t < 4) requestAnimationFrame(f); else { rec.onstop = res; rec.stop(); } }; f(); });
        blob = new Blob(parts, { type: "video/webm" }); }
      const mid = kind === "image" ? "perfimg" : "perfvid";
      await window.WickedMediaDB.put(mid, blob);
      await new Promise((r) => chrome.storage.local.set({ media: [{ id: mid, name: kind === "image" ? "4k.png" : "4k.webm", type: kind === "image" ? "image" : "video", file: true, size: blob.size, w: 3840, h: 2160 }] }, r));
    }, /image/.test(name) ? "image" : "video");
    await pop.evaluate((o) => new Promise((r) => chrome.storage.local.set(o, r)), { ...INV, ...SCEN[name] }); await pop.close();
    const page = ctx.pages()[0] || await ctx.newPage(); await page.bringToFront();
    await page.goto(SITE + "/", { waitUntil: "domcontentloaded", timeout: 90000 }); await sleep(14000);
    const cdp = await ctx.newCDPSession(page); await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
    const f = page.frames().find((x) => /^blob:/.test(x.url())) || page.mainFrame(), fe = f === page.mainFrame() ? null : await f.frameElement(), fOff = fe ? await fe.boundingBox() : { x: 0, y: 0 };
    await f.evaluate(() => { const S = (window.__pf = { frames: 0, lat: [] }); const t = () => { S.frames++; requestAnimationFrame(t); }; requestAnimationFrame(t);
      for (const ev of ["pointermove", "wheel", "pointerdown"]) addEventListener(ev, (e) => { S.lat.push(performance.now() - e.timeStamp); }, { capture: true, passive: true }); });
    const pane = await f.evaluate(() => { const c = [...document.querySelectorAll(".chart-markup-table canvas")].map((c) => c.getBoundingClientRect()).filter((r) => r.width > 400).sort((a, b) => b.width * b.height - a.width * a.height)[0]; return { x: c.x, y: c.y, w: c.width, h: c.height }; });
    const buy = await f.evaluate(() => { const b = [...document.querySelectorAll("div,button")].filter((e) => /^\s*buy\b/i.test(e.textContent || "") && (e.textContent || "").trim().length < 30).map((e) => [e, e.getBoundingClientRect()]).filter(([, r]) => r.width > 20 && r.height > 10).map(([e]) => e).pop(); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    const phase = async (secs, act) => { await f.evaluate(() => { window.__pf.frames = 0; window.__pf.lat = []; }); const c0 = cpuOf(rootPid), t0 = Date.now();
      await act(secs); const s = (Date.now() - t0) / 1000, c1 = cpuOf(rootPid);
      const pf = await f.evaluate(() => ({ frames: window.__pf.frames, lat: window.__pf.lat.slice().sort((a, b) => a - b) }));
      const p95 = pf.lat.length ? pf.lat[Math.floor(pf.lat.length * 0.95)] : null;
      return { cpuPct: Math.round(((c1 - c0) / s) * 100), chartFps: Math.round(pf.frames / s), inputDelayP95ms: p95 === null ? null : Math.round(p95), events: pf.lat.length }; };
    const r = {};
    r.idle = await phase(6, (s) => sleep(s * 1000));
    r.panZoom = await phase(8, async (s) => { const t0 = Date.now(); let i = 0; await page.mouse.move(fOff.x + pane.x + pane.w * 0.5, fOff.y + pane.y + pane.h * 0.5);
      while (Date.now() - t0 < s * 1000) { await page.mouse.down(); for (let k = 0; k < 10; k++) await page.mouse.move(fOff.x + pane.x + pane.w * (0.5 - k * 0.02 * (i % 2 ? -1 : 1)), fOff.y + pane.y + pane.h * 0.5, { steps: 2 }); await page.mouse.up(); await page.mouse.wheel(0, i % 2 ? 200 : -200); i++; } });
    r.orderTicket = buy ? await phase(6, async (s) => { const t0 = Date.now(); let i = 0; while (Date.now() - t0 < s * 1000) { await page.mouse.move(fOff.x + buy.x + (i++ % 5), fOff.y + buy.y); await sleep(60); } }) : null;
    // in a trade: a position's P&L on the chart (what hook.js publishes from the chart's own P&L label), chart still
    r.inTrade = await phase(6, async (s) => { const t0 = Date.now(); while (Date.now() - t0 < s * 1000) { await f.evaluate(() => document.documentElement.setAttribute("data-ws-pnl", JSON.stringify({ v: 12.5, unit: "USD", ts: Date.now() }))); await sleep(500); } });
    r.inTrade.videoPlaying = (await Promise.all(page.frames().filter((x) => /player\.html/.test(x.url())).map((x) => x.evaluate(() => { const v = document.querySelector("video"); return v ? !v.paused : null; }).catch(() => null)))).filter((x) => x !== null);
    r.heapMB = Math.round((await cdp.send("Runtime.getHeapUsage")).usedSize / 1048576);
    results[name] = r; console.log(name, JSON.stringify(r));
    await ctx.close(); fs.rmSync(prof, { recursive: true, force: true });
  }
  fs.writeFileSync(path.join(OUT, `wallpaper-${LABEL}.json`), JSON.stringify({ cpuSlowdown: CPU, dpr: DPR, results }, null, 1));
  fs.rmSync(EXTDIR, { recursive: true, force: true });
})().catch((e) => { console.error(e); process.exit(1); });
