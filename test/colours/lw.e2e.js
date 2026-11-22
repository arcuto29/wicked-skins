// Colour flicker test on TradingView's Lightweight Charts (the engine nq.vision uses; Priism's lw.js), frame by frame.
// nq.vision itself needs an account, so a page of our own serves the real Lightweight Charts library (from unpkg) with
// what such a platform draws: live candles, an indicator line (EMA), an indicator's level line, and an order line with
// its price tag on the scale. Each has a native colour nothing else uses; the EMA and the level get Priism colours
// (Each indicator). The order line isn't customised: it must stay exactly as the platform draws it.
//   node test/colours/lw.e2e.js [--ext <dir>] [--out <dir>] [--dpr 1|2] [--rounds 3] [--label before|after]
const { chromium } = require("playwright");
const path = require("path"), crypto = require("crypto"), fs = require("fs"), http = require("http"), os = require("os");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const EXT = path.resolve(arg("ext", path.join(__dirname, "..", "..")));
const DPR = +arg("dpr", 1), ROUNDS = +arg("rounds", 3), LABEL = arg("label", "run"), PORT = 8124, SITE = `http://127.0.0.1:${PORT}`;
const OUT = path.resolve(arg("out", path.join(__dirname, "..", "..", "test-output", "colours", `${LABEL}-lw-dpr${DPR}`)));
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const results = {}; const ok = (k, v, d) => { results[k] = { pass: !!v, detail: d === undefined ? null : d }; console.log((v ? "PASS " : "FAIL ") + k + (d !== undefined ? "  " + JSON.stringify(d).slice(0, 500) : "")); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const N = { ema: "#c80afa", lvl: "#c83c1e", oline: "#fa640a", hid: "#7828c8", thin: "#28a05a" }, C = { ema: "#ff5ec4", lvl: "#00e5ff", thin: "#ffb300" };
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), key = (h) => rgb(h).join(",");
// hid: a level hidden in Each indicator (any draw of it is wrong); thin: a see-through level with a colour of yours;
// oline: the order line (not customised: watched only so its own tag can be checked to stay as it is)
const WATCH = [{ name: "ema", kind: "native", rgb: rgb(N.ema), px: true }, { name: "ema", kind: "chosen", rgb: rgb(C.ema) },
  { name: "lvl", kind: "native", rgb: rgb(N.lvl), px: true }, { name: "lvl", kind: "chosen", rgb: rgb(C.lvl) },
  { name: "hid", kind: "native", rgb: rgb(N.hid), px: true }, { name: "thin", kind: "native", rgb: rgb(N.thin), px: true }, { name: "thin", kind: "chosen", rgb: rgb(C.thin) },
  { name: "oline", kind: "chosen", rgb: rgb(N.oline) }];
const PAGE = `<!doctype html><html><head><meta charset="utf8"><title>LW chart</title><style>html,body{margin:0;height:100%;background:#0b0e14}#chart{position:fixed;inset:0}</style></head>
<body><div id="chart"></div><script src="https://unpkg.com/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js"></script><script>
  const el = document.getElementById("chart"), LW = window.LightweightCharts;
  const chart = LW.createChart(el, { autoSize: true, layout: { background: { type: "solid", color: "#0b0e14" }, textColor: "#d1d4dc" }, grid: { vertLines: { color: "#1b2030" }, horzLines: { color: "#1b2030" } } });
  const series = chart.addCandlestickSeries({ upColor: "#26a69a", downColor: "#ef5350", borderUpColor: "#26a69a", borderDownColor: "#ef5350", wickUpColor: "#26a69a", wickDownColor: "#ef5350" });
  const ema = chart.addLineSeries({ color: "${N.ema}", lineWidth: 2, priceLineVisible: false, lastValueVisible: true });   // its value tag on the scale
  let seed = 7; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  function make(n, step, start) { const d = []; let p = start, t = Math.floor(Date.now() / 1000) - n * step; for (let i = 0; i < n; i++) { const o = p, c = p + (rnd() - 0.48) * 4; d.push({ time: t + i * step, open: o, high: Math.max(o, c) + rnd() * 2, low: Math.min(o, c) - rnd() * 2, close: c }); p = c; } return d; }
  function emaOf(d) { const o = []; let e = d[0].close; for (const x of d) { e += (x.close - e) * 0.15; o.push({ time: x.time, value: e }); } return o; }
  let data;
  window.__set = (n, step, start) => { data = make(n, step, start); series.setData(data); ema.setData(emaOf(data)); };
  window.__set(160, 86400, 100);
  const p = data[data.length - 1].close;
  series.createPriceLine({ price: p * 1.04, color: "${N.lvl}", lineWidth: 1, lineStyle: 0, axisLabelVisible: false, title: "" });          // an indicator's level
  series.createPriceLine({ price: p * 0.96, color: "${N.oline}", lineWidth: 1, lineStyle: 0, axisLabelVisible: true, title: "TP +$120.00" }); // an order line, tag on the scale
  series.createPriceLine({ price: p * 1.08, color: "${N.hid}", lineWidth: 1, lineStyle: 0, axisLabelVisible: false, title: "" });           // a level you hid
  series.createPriceLine({ price: p * 0.92, color: "rgba(40,160,90,0.5)", lineWidth: 1, lineStyle: 0, axisLabelVisible: false, title: "" }); // a see-through level
  // live: the last candle moves every 250 ms, like a feed
  setInterval(() => { const l = data[data.length - 1]; const c = l.close + (Math.random() - 0.5) * 0.6; const u = { ...l, close: c, high: Math.max(l.high, c), low: Math.min(l.low, c) }; data[data.length - 1] = u; series.update(u); }, 250);
  window.__chart = chart; window.__ready = true;
</script></body></html>`;

(async () => {
  const srv = http.createServer((q, r) => { r.setHeader("content-type", "text/html"); r.end(PAGE); }).listen(PORT, "127.0.0.1");
  // a copy of the extension that also runs on this page (as it does on nq.vision once you allow it)
  const EXTDIR = path.join(os.tmpdir(), `priism-lw-ext-${process.pid}`); fs.rmSync(EXTDIR, { recursive: true, force: true });
  fs.cpSync(EXT, EXTDIR, { recursive: true, filter: (f) => !/[\\/](\.git|node_modules|test-output|dist|android|desktop|site|store|supabase|test)([\\/]|$)/.test(f.slice(EXT.length)) });
  { const mp = path.join(EXTDIR, "manifest.json"), m = JSON.parse(fs.readFileSync(mp, "utf8")); m.content_scripts.forEach((c) => c.matches.push(SITE + "/*")); m.host_permissions.push(SITE + "/*"); fs.writeFileSync(mp, JSON.stringify(m)); }
  const id = [...crypto.createHash("sha256").update(EXTDIR).digest("hex").slice(0, 32)].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
  const prof = path.join(OUT, "profile");
  // high-DPI: the browser itself renders at that scale (not Playwright's emulated scale)
  const ctx = await chromium.launchPersistentContext(prof, { headless: false, viewport: DPR !== 1 ? null : { width: 1300, height: 760 },
    args: ["--headless=new", "--no-sandbox", "--disable-gpu", ...(DPR !== 1 ? [`--force-device-scale-factor=${DPR}`, "--window-size=1300,760"] : []), `--disable-extensions-except=${EXTDIR}`, `--load-extension=${EXTDIR}`],
    recordVideo: { dir: OUT, size: { width: 1300, height: 760 } } });
  await ctx.addInitScript(fs.readFileSync(path.join(__dirname, "recorder.js"), "utf8"));
  await ctx.addInitScript(`if (window.__colRec) { window.__colRec.watch = ${JSON.stringify(WATCH)}; window.__colRec.on = sessionStorage.getItem("colRecOn") === "1"; window.__colRec.step = sessionStorage.getItem("colRecStep") || ""; }`);
  await sleep(1500);
  const pop = await ctx.newPage(); await pop.goto(`chrome-extension://${id}/popup/popup.html`); await sleep(800);
  await pop.evaluate((o) => new Promise((r) => chrome.storage.local.set(o, r)), { enabled: true, welcomePending: 0, invite: { code: "PRIISM-COLOUR-TEST", ok: true, status: "ok", checked: 4e12, since: 1 }, skin: "graphite", dim: 0.4,
    indMode: "own", lineGlow: 0, indCustom: { [key(N.ema)]: { c: C.ema }, [key(N.lvl)]: { c: C.lvl }, [key(N.hid)]: { c: C.lvl, h: true }, [key(N.thin)]: { c: C.thin } }, bracketOn: false });
  const page = ctx.pages().find((p) => p !== pop) || await ctx.newPage(); const errs = []; page.on("pageerror", (e) => errs.push(e.message.slice(0, 200)));
  await page.bringToFront();
  const open = async () => { await page.goto(SITE + "/", { waitUntil: "load" }); await page.waitForFunction("window.__ready === true", null, { timeout: 60000 }); await sleep(6000); };
  // the first frames count too: recording from the very first paint of the page
  await page.evaluate(() => { sessionStorage.setItem("colRecOn", "1"); sessionStorage.setItem("colRecStep", "open"); }).catch(() => {});
  await open();
  const setup = await page.evaluate(() => ({ lw: !!window.__bdLwHooked, ver: window.__bdLwVer, on: document.documentElement.classList.contains("bd-on"), under: CanvasRenderingContext2D.prototype.stroke !== window.__colRec.mine,
    dpr: devicePixelRatio, canvasScale: (() => { const c = [...document.querySelectorAll("canvas")].find((c) => c.getBoundingClientRect().width > 400); return c ? +(c.width / c.getBoundingClientRect().width).toFixed(2) : null; })() }));
  ok("setup: Priism is on (Lightweight Charts) and the recorder sits under it", setup.lw && setup.on && setup.under, setup);
  const steps = [], ALL = { draws: [], counts: {}, px: {}, snaps: [] };
  const collect = async (name) => { const got = await page.evaluate(() => { const R = window.__colRec, o = { draws: R.draws, counts: R.counts, px: R.px, frame: R.frame, snaps: R.snaps };
      R.snaps = []; R.draws = []; R.counts = {}; R.px = {}; R.pxFrames = []; R.on = false; sessionStorage.removeItem("colRecOn"); return o; });
    ALL.snaps.push(...(got.snaps || []).filter((x) => x.step === name).slice(0, 2)); ALL.draws.push(...got.draws); for (const [k, v] of Object.entries(got.counts)) ALL.counts[k] = (ALL.counts[k] || 0) + v; for (const [k, v] of Object.entries(got.px)) if (typeof v === "number") ALL.px[k] = Math.max(ALL.px[k] || 0, v);
    steps.push({ name, frames: got.frame }); };
  await collect("open");   // (a reload below repeats it)
  const pane = () => page.evaluate(() => { const c = [...document.querySelectorAll("canvas")].map((c) => c.getBoundingClientRect()).filter((r) => r.width > 400).sort((a, b) => b.width * b.height - a.width * a.height)[0]; return { x: c.x, y: c.y, w: c.width, h: c.height }; });
  const doStep = async (name, fn) => { for (let i = 0; i < ROUNDS; i++) {
    await page.evaluate((s) => { const R = window.__colRec; R.step = s; R.reset(); R.kick(); R.on = true; sessionStorage.setItem("colRecOn", "1"); sessionStorage.setItem("colRecStep", s); }, name);
    await fn(); await sleep(1200); await collect(name); } };
  const ONLY = (arg("only", "") || "").split(",").filter(Boolean);
  const _do = doStep; const doStepF = (n, f) => (ONLY.length && !ONLY.includes(n) ? Promise.resolve() : _do(n, f));
  await doStepF("live-updates", async () => { await sleep(5000); });
  await doStepF("zoom", async () => { const p = await pane(); await page.mouse.move(p.x + p.w * 0.6, p.y + p.h * 0.5); for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, -240); await sleep(120); } for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 240); await sleep(120); } });
  await doStepF("pan", async () => { const p = await pane(); await page.mouse.move(p.x + p.w * 0.5, p.y + p.h * 0.7); await page.mouse.down(); for (let i = 1; i <= 12; i++) { await page.mouse.move(p.x + p.w * 0.5 - i * 18, p.y + p.h * 0.7, { steps: 2 }); await sleep(30); } await page.mouse.up(); });
  await doStepF("price-scale-drag", async () => { const p = await pane(); const x = p.x + p.w - 30, y = p.y + p.h * 0.5; await page.mouse.move(x, y); await page.mouse.down(); for (let i = 1; i <= 10; i++) { await page.mouse.move(x, y + i * 12, { steps: 2 }); await sleep(30); } await page.mouse.up(); await page.mouse.dblclick(x, y); });
  await doStepF("timeframe", async () => { for (const st of [3600, 300, 86400]) { await page.evaluate((st) => window.__set(160, st, 100), st); await sleep(900); } });
  await doStepF("symbol", async () => { for (const s0 of [4200, 100]) { await page.evaluate((s0) => window.__set(160, 86400, s0), s0); await sleep(1200); } });
  const resize = async (w, h) => { if (DPR === 1) return page.setViewportSize({ width: w, height: h });
    const cdp = await page.context().newCDPSession(page); const { windowId } = await cdp.send("Browser.getWindowForTarget"); await cdp.send("Browser.setWindowBounds", { windowId, bounds: { width: w, height: h } }); await cdp.detach(); };
  await doStepF("window-size", async () => { for (const [w, h] of [[1000, 640], [1300, 760], [1150, 700], [1300, 760]]) { await resize(w, h); await sleep(600); } });
  await doStepF("reopen", async () => { await page.reload({ waitUntil: "load" }); await page.waitForFunction("window.__ready === true", null, { timeout: 60000 }); await sleep(6000); });
  const byStep = {};
  for (const s of [...new Set(steps.map((x) => x.name))]) {
    const d = ALL.draws.filter((x) => !x.kind && x.step === s && x.place !== "offscreen");
    const chosenAt = new Set(ALL.draws.filter((x) => x.kind && x.step === s).map((x) => `${x.name}|${x.cv}|${x.f}`));
    const shown = d.filter((x) => !(x.m === "stroke" && chosenAt.has(`${x.name}|${x.cv}|${x.f}`)));
    const px = Object.fromEntries(Object.entries(ALL.px).filter(([k]) => k.startsWith(s + "|")).map(([k, v]) => [k.slice(s.length + 1), v]));
    const chosen = Object.fromEntries(Object.entries(ALL.counts).filter(([k]) => k.startsWith(s + "|") && k.includes("|chosen|")).map(([k, v]) => [k.slice(s.length + 1), v]));
    const tagEma = Object.entries(ALL.counts).filter(([k]) => k.startsWith(s + "|ema|chosen|scale")).reduce((a, [, v]) => a + v, 0);
    const tagOrder = Object.entries(ALL.counts).filter(([k]) => k.startsWith(s + "|oline|chosen|scale")).reduce((a, [, v]) => a + v, 0);
    byStep[s] = { emaTagInYourColour: tagEma, orderTagAsItIs: tagOrder, nativeDraws: shown.length, beforePriismOn: shown.filter((x) => !x.priismOn).length, nativeFrames: [...new Set(shown.map((x) => x.f))].length, nativePixels: px, coveredInSamePaint: d.length - shown.length, chosenDraws: chosen };
    // opening a chart: the frames painted before Priism has started on the page (no settings yet, no wallpaper either)
    // are the page's own; reported, not counted (see the PR: Priism's start time on a page that draws at once)
    if (s === "reopen" || s === "open") { const after = shown.filter((x) => x.priismOn);
      ok(`${s}: once Priism is on, no native colour reaches the chart (frames before it started: ${byStep[s].beforePriismOn})`, after.length === 0, byStep[s]); continue; }
    ok(`${s}: no native colour reaches the chart (frame by frame)`, !shown.length && !Object.keys(px).length, byStep[s]);
  }
  fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify({ results, byStep }, null, 1));
  fs.writeFileSync(path.join(OUT, "recording.json"), JSON.stringify({ steps, draws: ALL.draws.filter((x) => !x.kind).slice(0, 3000) }, null, 1));
  const p = Object.values(results).filter((r) => r.pass).length;
  console.log(`\nCOLOURS (${LABEL}, lightweight charts, dpr ${DPR}): ${p}/${Object.keys(results).length}`, errs.length ? "page errors: " + JSON.stringify(errs.slice(0, 3)) : "");
  const shots = ALL.snaps; for (const [i, x] of shots.entries()) fs.writeFileSync(path.join(OUT, `still-${x.step}-${x.kind}-f${x.f}.png`), Buffer.from(x.url.split(",")[1], "base64"));
  const vid = page.video(); await page.close(); await pop.close(); await ctx.close(); if (vid) { try { fs.renameSync(await vid.path(), path.join(OUT, `chart-${LABEL}-lw-dpr${DPR}.webm`)); } catch {} }   // the chart's own recording srv.close();
  fs.rmSync(prof, { recursive: true, force: true }); fs.rmSync(EXTDIR, { recursive: true, force: true });
})().catch((e) => { console.error(e); process.exit(1); });
