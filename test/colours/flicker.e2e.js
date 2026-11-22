// Colour flicker test on real TradingView charts:
//   --platform tv        tradingview.com/chart, signed out (TradingView allows no drawings there without an account:
//                        indicator + take-profit / stop-loss only)
//   --platform terminal  TradingView's trading-terminal demo: the charting library TopstepX is built on (its chart in
//                        its own frame, like on TopstepX), drawings included
// Each element gets a native colour nothing else on the chart uses, and a Priism colour of its own:
//   horizontal line  native #fa0ac8 -> Priism #00e5ff (cyan)     (Each indicator: your drawing)
//   trend line       native #0afa64 -> Priism #a855f7 (purple)
//   rectangle        native border #0a64fa, fill rgba(10,100,250,.25) -> Priism #ffb300 (gold)
//   moving average   native #c80afa -> Priism #ff5ec4 (pink)                 (Each indicator)
//   order lines      native line #fa640a, border #64fa0a, box #0a0afa -> Priism line #ffe600, border #00ffa3, box #101a40
//                    (Trading: brackets; a take-profit and a stop-loss, so their +/- text colours stay apart)
// Then it repeats what you do on a chart (live updates, zoom, pan, price-scale drag, select / move / edit a drawing,
// its settings dialog, timeframe, symbol, window size, reopening) while test/colours/recorder.js records every draw
// and, once per frame, the pixels on screen. Any native colour on the chart while Priism is on is a flash.
//   node test/colours/flicker.e2e.js [--ext <dir>] [--out <dir>] [--dpr 1|2] [--rounds 3] [--label before|after]
const { chromium } = require("playwright");
const path = require("path"), crypto = require("crypto"), fs = require("fs");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const EXT = path.resolve(arg("ext", path.join(__dirname, "..", "..")));
const PLATFORM = arg("platform", "tv"), SITE = "https://trading-terminal.tradingview-widget.com";
const DPR = +arg("dpr", 1), ROUNDS = +arg("rounds", 3), LABEL = arg("label", "run");
const OUT = path.resolve(arg("out", path.join(__dirname, "..", "..", "test-output", "colours", `${LABEL}-${PLATFORM}-dpr${DPR}`)));
const ONLY = (arg("only", "") || "").split(",").filter(Boolean);
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
// the terminal demo isn't a site Priism lists: a copy of the extension that also runs there (as Priism does on TopstepX
// once you allow it: the same files, at document_start, in every frame)
let EXTDIR = EXT;
if (PLATFORM === "terminal") {
  EXTDIR = path.join(require("os").tmpdir(), `priism-colours-ext-${process.pid}`); fs.rmSync(EXTDIR, { recursive: true, force: true });
  fs.cpSync(EXT, EXTDIR, { recursive: true, filter: (f) => !/[\\/](\.git|node_modules|test-output|dist|android|desktop|site|store|supabase|test)([\\/]|$)/.test(f.slice(EXT.length)) });
  const mp = path.join(EXTDIR, "manifest.json"), m = JSON.parse(fs.readFileSync(mp, "utf8"));
  m.content_scripts.forEach((c) => c.matches.push(SITE + "/*")); m.host_permissions.push(SITE + "/*"); fs.writeFileSync(mp, JSON.stringify(m));
}
const id = [...crypto.createHash("sha256").update(EXTDIR).digest("hex").slice(0, 32)].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
const REC = fs.readFileSync(path.join(__dirname, "recorder.js"), "utf8");
const results = {}; const ok = (k, v, d) => { results[k] = { pass: !!v, detail: d === undefined ? null : d }; console.log((v ? "PASS " : "FAIL ") + k + (d !== undefined ? "  " + JSON.stringify(d).slice(0, 600) : "")); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const N = { hline: "#fa0ac8", trend: "#0afa64", rect: "#0a64fa", ma: "#c80afa", oline: "#fa640a", oborder: "#64fa0a", obox: "#0a0afa" };
const LIMIT_TAGS = ["oline", "hline", "ma"];   // price-scale tags Priism doesn't restyle (see the PR)
const C = { hline: "#00e5ff", trend: "#a855f7", rect: "#ffb300", ma: "#ff5ec4", oline: "#ffe600", oborder: "#00ffa3", obox: "#101a40" };
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const key = (h) => rgb(h).join(",");
const WATCH = [];
for (const k of Object.keys(N)) { WATCH.push({ name: k, kind: "native", rgb: rgb(N[k]), px: k !== "obox" && k !== "rect" }); WATCH.push({ name: k, kind: "chosen", rgb: rgb(C[k]) }); }

(async () => {
  const prof = path.join(OUT, "profile");
  const ctx = await chromium.launchPersistentContext(prof, {
    // high-DPI: the browser itself renders at that scale (Playwright's emulated scale leaves TradingView drawing at 1x)
    headless: false, viewport: DPR !== 1 ? null : { width: 1400, height: 820 },
    args: ["--headless=new", "--no-sandbox", "--disable-gpu", ...(DPR !== 1 ? [`--force-device-scale-factor=${DPR}`, "--window-size=1400,820"] : []), `--disable-extensions-except=${EXTDIR}`, `--load-extension=${EXTDIR}`],
    recordVideo: { dir: OUT, size: { width: 1400, height: 820 } },
  });
  await ctx.addInitScript(REC);
  await ctx.addInitScript(`window.__api = () => (window.TradingViewApi && window.TradingViewApi.activeChart ? window.TradingViewApi : window.tvWidget && window.tvWidget.activeChart ? window.tvWidget : null);`);
  await ctx.addInitScript(`window.__colRecWatch = ${JSON.stringify(WATCH)}; if (window.__colRec) { window.__colRec.watch = window.__colRecWatch; window.__colRec.on = sessionStorage.getItem("colRecOn") === "1"; window.__colRec.step = sessionStorage.getItem("colRecStep") || ""; window.__colRec.detail = ${process.argv.includes("--detail")}; }`);
  await sleep(1500);
  const pop = await ctx.newPage(); await pop.goto(`chrome-extension://${id}/popup/popup.html`); await sleep(800);
  const set = (o) => pop.evaluate((o) => new Promise((r) => chrome.storage.local.set(o, r)), o);
  const indCustom = { [key(N.hline)]: { c: C.hline }, [key(N.trend)]: { c: C.trend }, [key(N.rect)]: { c: C.rect }, [key(N.ma)]: { c: C.ma } };
  await set({ enabled: true, welcomePending: 0, invite: { code: "PRIISM-COLOUR-TEST", ok: true, status: "ok", checked: 4e12, since: 1 }, skin: "graphite", dim: 0.4,
    bracketOn: true, bracketLineColor: C.oline, bracketBorderColor: C.oborder, bracketFill: C.obox, bracketProfit: "#00ffa3", bracketLoss: "#ff3b6b",
    indCustom, indMode: "own", drawOn: false, lineGlow: 0 });
  const page = ctx.pages().find((p) => p !== pop) || await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message.slice(0, 200)));
  await page.bringToFront();
  const URL0 = PLATFORM === "tv" ? "https://www.tradingview.com/chart/?symbol=BINANCE%3ABTCUSDT" : SITE + "/";
  let F = page, A = page, OFF = { x: 0, y: 0 };   // F: the frame with the chart's canvases, A: the frame with its API
  const findFrame = async () => {   // the frame that holds the chart (and its TradingViewApi)
    const t0 = Date.now();
    while (Date.now() - t0 < 90000) {
      let fc = null, fa = null;
      for (const f of page.frames()) { try {
        if (!fc && await f.evaluate(() => !!document.querySelector(".chart-markup-table canvas") && !!window.__colRec)) fc = f;
        if (!fa && await f.evaluate(() => { const a = window.__api && window.__api(); return !!(a && a.activeChart().getAllStudies && a.activeChart().getAllStudies().length >= 0); })) fa = f; } catch {} }
      if (fc && fa) { F = fc; A = fa; const el = F === page.mainFrame() ? null : await F.frameElement(); const b = el ? await el.boundingBox() : null; OFF = b ? { x: b.x, y: b.y } : { x: 0, y: 0 }; return true; }
      await sleep(1000);
    }
    throw new Error("no chart frame");
  };
  const open = async () => {
    await page.goto(URL0, { waitUntil: "domcontentloaded", timeout: 90000 });
    await findFrame(); await sleep(7000);
    for (let i = 0; i < 5; i++) { const l = page.getByRole("button", { name: /got it/i }); if (!(await l.count())) break; await l.first().click({ force: true }).catch(() => {}); await sleep(400); }
    if (PLATFORM === "terminal") await page.mouse.move(5, 5);
  };
  await open();
  const hookOrder = await F.evaluate(() => ({ hook: !!window.__bdHooked, ver: window.__bdHookVer, recorderUnderHook: CanvasRenderingContext2D.prototype.stroke !== window.__colRec.mine, on: document.documentElement.classList.contains("bd-on"),
    dpr: devicePixelRatio, canvasScale: (() => { const c = [...document.querySelectorAll(".chart-markup-table canvas")].find((c) => c.getBoundingClientRect().width > 400); return c ? +(c.width / c.getBoundingClientRect().width).toFixed(2) : null; })() }));
  ok("setup: Priism is on and the recorder sits under its hook (it sees the final colours)", hookOrder.hook && hookOrder.recorderUnderHook && hookOrder.on, hookOrder);

  // the chart's elements, in their native colours (this is the test making them, through TradingView's own API)
  const lastPrice = await F.evaluate(() => { for (const a of [window.TradingViewApi, window.tradingViewApi]) { try { return a._activeChartWidgetWV.value()._chartWidget.model().model().mainSeries().bars().last().value[4]; } catch {} } return 0; });
  const MAKE = async ({ N, drawings, lastPrice }) => {
    const ch = window.__api().activeChart();
    for (const s of ch.getAllStudies()) if (/volume/i.test(s.name)) try { ch.removeEntity(s.id); } catch {}
    const r = ch.getVisibleRange(), t = (f) => Math.round(r.from + (r.to - r.from) * f);
    const px = lastPrice || await (async () => { try { const d = await ch.exportData({ includeTime: true, includeSeries: true, includedStudies: [] }); const l = d.data[d.data.length - 1]; if (l && l[4] > 0) return l[4]; } catch {}
      return +((document.title.match(/([\d,]+\.\d+)/) || [])[1] || "0").replace(/,/g, ""); })();
    if (!(px > 0)) return { ids: {}, px: 0 };
    window.__px = px;
    const ids = {};
    if (drawings) {
    ids.hline = await ch.createShape({ time: t(0.5), price: px * 1.004 }, { shape: "horizontal_line", overrides: { linecolor: N.hline, linewidth: 2, showLabel: false } });
    ids.trend = await ch.createMultipointShape([{ time: t(0.15), price: px * 0.992 }, { time: t(0.7), price: px * 1.007 }], { shape: "trend_line", overrides: { linecolor: N.trend, linewidth: 2 } });
    ids.rect = await ch.createMultipointShape([{ time: t(0.25), price: px * 1.009 }, { time: t(0.45), price: px * 1.002 }], { shape: "rectangle", overrides: { color: N.rect, backgroundColor: "rgba(10,100,250,0.25)", fillBackground: true, linewidth: 2 } });
    }
    ids.ma = await ch.createStudy("Moving Average", false, false, { length: 9 });
    await new Promise((r) => setTimeout(r, 1500));
    try { const st = ch.getStudyById(ids.ma), plot = Object.keys(st.getStyleValues().styles)[0];   // "plot" (library) or "MovAvgSimple" (tradingview.com)
      st.applyOverrides({ [plot + ".color"]: N.ma, [plot + ".linewidth"]: 2 }); ids.maPlot = plot; } catch (e) { ids.maErr = String(e).slice(0, 100); }
    const mk = async (price, text) => { const o = await ch.createOrderLine(); o.setPrice(price); o.setText(text); o.setQuantity("2");
      o.setLineColor(N.oline); o.setBodyBorderColor(N.oborder); o.setQuantityBorderColor(N.oborder); o.setCancelButtonBorderColor(N.oborder);
      o.setBodyBackgroundColor(N.obox); o.setQuantityBackgroundColor(N.obox); o.setCancelButtonBackgroundColor(N.obox); return o; };
    window.__tp = await mk(px * 0.997 + px * 0.009, "TP +$412.50");
    window.__sl = await mk(px * 0.994, "SL -$133.00");
    return { ids, px };
  };
  const made = await A.evaluate(MAKE, { N, drawings: PLATFORM !== "tv", lastPrice });
  ok(`setup: ${PLATFORM === "tv" ? "" : "drawings, "}an indicator and a take-profit / stop-loss on the chart`, made.px > 0 && made.ids.ma && (PLATFORM === "tv" || (made.ids.hline && made.ids.trend && made.ids.rect)), made);
  if (!results[Object.keys(results).pop()].pass) throw new Error("setup failed");
  // the moving average's real colour (signed out, TradingView keeps its default colour whatever the test asks): watch
  // that one, and give it its Priism colour
  const maCol = await A.evaluate((id) => { try { const st = window.__api().activeChart().getStudyById(id), s = st.getStyleValues().styles; return s[Object.keys(s)[0]].color; } catch { return null; } }, made.ids.ma);
  if (maCol && /^#[0-9a-f]{6}$/i.test(maCol) && maCol.toLowerCase() !== N.ma) {
    N.ma = maCol.toLowerCase();
    const w = WATCH.find((x) => x.name === "ma" && x.kind === "native"); w.rgb = rgb(N.ma);
    await F.evaluate((W) => { window.__colRec.watch = W; window.__colRec.reset(); }, WATCH);
    const ic = { ...indCustom }; delete ic[key("#c80afa")]; ic[key(N.ma)] = { c: C.ma };
    await set({ indCustom: ic });
  }
  console.log("moving average: native", N.ma, "-> Priism", C.ma);
  await sleep(4000);

  // helpers -----------------------------------------------------------------------------------------------------
  const pane = async () => { const p = await F.evaluate(() => { const c = [...document.querySelectorAll(".chart-markup-table canvas")].map((c) => c.getBoundingClientRect()).filter((r) => r.width > 400 && r.height > 200).sort((a, b) => b.width * b.height - a.width * a.height)[0];
    const ax = [...document.querySelectorAll(".price-axis canvas, [class*='price-axis'] canvas")].map((c) => c.getBoundingClientRect()).filter((r) => r.height > 200).sort((a, b) => b.height - a.height)[0];
    return { x: c.x, y: c.y, w: c.width, h: c.height, ax: ax ? { x: ax.x, y: ax.y, w: ax.width, h: ax.height } : null }; });
    p.x += OFF.x; p.y += OFF.y; if (p.ax) { p.ax.x += OFF.x; p.ax.y += OFF.y; } return p; };
  const rowOf = async (hex) => { const b = await F.evaluate((c) => {   // the screen y (CSS px) of the most-drawn row in this colour on the chart
    let best = null;
    for (const cv of document.querySelectorAll(".chart-markup-table canvas")) { const r = cv.getBoundingClientRect(); if (r.width < 400 || r.height < 200) continue;
      const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data, W = cv.width;
      for (let y = 0; y < cv.height; y++) { let n = 0; for (let x = 0; x < W; x += 2) { const i = (y * W + x) * 4; if (d[i + 3] > 200 && Math.abs(d[i] - c[0]) < 8 && Math.abs(d[i + 1] - c[1]) < 8 && Math.abs(d[i + 2] - c[2]) < 8) n++; }
        if (n > 30 && (!best || n > best.n)) best = { n, y: r.y + y * (r.height / cv.height), x: r.x + r.width * 0.5 }; } }
    return best; }, rgb(hex)); if (b) { b.x += OFF.x; b.y += OFF.y; } return b; };
  const record = async (step, fn) => {
    await F.evaluate((s) => { const R = window.__colRec; R.step = s; R.reset(); R.on = true; R.kick(); sessionStorage.setItem("colRecOn", "1"); sessionStorage.setItem("colRecStep", s); }, step);
    if (process.argv.includes("--brdbg")) await F.evaluate(() => { window.__brDbg = []; });
    const f0 = await F.evaluate(() => window.__colRec.frame);
    await fn();
    await sleep(1200);   // anything that would flip back shows up within this
    const got = await F.evaluate(() => { const R = window.__colRec, o = { frame: R.frame, draws: R.draws, counts: R.counts, px: R.px, pxFrames: R.pxFrames, texts: R.texts, snaps: R.snaps };
      R.snaps = []; R.texts = []; R.draws = []; R.counts = {}; R.px = {}; R.pxFrames = []; R.on = false; sessionStorage.removeItem("colRecOn"); return o; });
    if (process.argv.includes("--brdbg")) (ALL.brdbg = ALL.brdbg || []).push(...(await F.evaluate(() => window.__brDbg || [])).map((e) => ({ step, ...e })));
    ALL.snaps.push(...(got.snaps || []).filter((x) => x.step === step).slice(0, 2));
    ALL.draws.push(...got.draws); ALL.texts.push(...(got.texts || []).slice(0, 1500)); ALL.pxFrames.push(...got.pxFrames.slice(0, 200));
    for (const [k, v] of Object.entries(got.counts)) ALL.counts[k] = (ALL.counts[k] || 0) + v;
    for (const [k, v] of Object.entries(got.px)) if (typeof v === "number") ALL.px[k] = Math.max(ALL.px[k] || 0, v);
    return { frames: step === "reopen" ? got.frame : got.frame - f0 };
  };
  const steps = [], ALL = { draws: [], counts: {}, px: {}, pxFrames: [], texts: [], snaps: [] };
  const doStep = async (name, fn) => { if (ONLY.length && !ONLY.includes(name)) return; for (let i = 0; i < ROUNDS; i++) { const r = await record(name, fn); steps.push({ name, round: i, ...r }); } };

  // the actions ---------------------------------------------------------------------------------------------------
  await doStep("live-updates", async () => { await sleep(5000); });
  await doStep("zoom", async () => { const p = await pane(); await page.mouse.move(p.x + p.w * 0.6, p.y + p.h * 0.5);
    for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, -240); await sleep(120); } for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 240); await sleep(120); } });
  await doStep("pan", async () => { const p = await pane(); await page.mouse.move(p.x + p.w * 0.5, p.y + p.h * 0.75); await page.mouse.down();
    for (let i = 1; i <= 12; i++) { await page.mouse.move(p.x + p.w * 0.5 - i * 18, p.y + p.h * 0.75, { steps: 2 }); await sleep(30); }
    for (let i = 11; i >= 0; i--) { await page.mouse.move(p.x + p.w * 0.5 - i * 18, p.y + p.h * 0.75, { steps: 2 }); await sleep(30); } await page.mouse.up(); });
  await doStep("price-scale-drag", async () => { const p = await pane(); if (!p.ax) return; const x = p.ax.x + p.ax.w / 2, y = p.ax.y + p.ax.h * 0.5;
    await page.mouse.move(x, y); await page.mouse.down();
    for (let i = 1; i <= 10; i++) { await page.mouse.move(x, y + i * 12, { steps: 2 }); await sleep(30); }
    for (let i = 9; i >= -10; i--) { await page.mouse.move(x, y + i * 12, { steps: 2 }); await sleep(30); }
    await page.mouse.up();
    await page.dblclick(".price-axis canvas, [class*='price-axis'] canvas").catch(() => {}); });   // back to auto scale
  const D = PLATFORM !== "tv";   // drawings
  const sym0 = await A.evaluate(() => window.__api().activeChart().symbol());
  const SYMBOLS = PLATFORM === "tv" ? ["BINANCE:ETHUSDT", "BINANCE:BTCUSDT"] : [/MSFT/.test(sym0) ? "AAPL" : "MSFT", sym0];
  if (D) await doStep("select-and-move-drawing", async () => { const r = await rowOf(C.hline) || await rowOf(N.hline); if (!r) return;
    await page.mouse.click(r.x, r.y); await sleep(300);
    await page.mouse.move(r.x, r.y); await page.mouse.down();
    for (let i = 1; i <= 10; i++) { await page.mouse.move(r.x, r.y - i * 6, { steps: 2 }); await sleep(30); }
    for (let i = 9; i >= 0; i--) { await page.mouse.move(r.x, r.y - i * 6, { steps: 2 }); await sleep(30); }
    await page.mouse.up(); await sleep(200); await page.mouse.click(r.x + 200, r.y + 120); });
  if (D) await doStep("hover-drawings", async () => { for (const h of [C.hline, C.trend, C.rect]) { const r = await rowOf(h); if (!r) continue; await page.mouse.move(r.x, r.y, { steps: 4 }); await sleep(250); await page.mouse.move(r.x + 40, r.y + 60, { steps: 4 }); await sleep(150); } });
  if (D) await doStep("edit-drawing", async () => { await A.evaluate((id) => { const s = window.__api().activeChart().getShapeById(id); s.setProperties({ linewidth: 3 }); }, made.ids.hline); await sleep(600);
    await A.evaluate((id) => { const s = window.__api().activeChart().getShapeById(id); s.setProperties({ linewidth: 2 }); }, made.ids.hline); });
  if (D) await doStep("drawing-settings-dialog", async () => { const r = await rowOf(C.hline) || await rowOf(N.hline); if (!r) return;
    await page.mouse.dblclick(r.x, r.y); await sleep(1200); await page.keyboard.press("Escape"); await sleep(300); await page.mouse.click(r.x + 200, r.y + 120); });
  await doStep("move-order-line", async () => { for (const k of [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1, 0]) {   // like dragging it: a new row every few frames
    await A.evaluate((k) => { const p = window.__px; window.__tp.setPrice(p * (1.006 + k * 0.005)); window.__sl.setPrice(p * (0.994 - k * 0.005)); }, k); await sleep(70); } });
  await doStep("timeframe", async () => { for (const tf of ["5", "15", "1"]) { await A.evaluate((tf) => window.__api().activeChart().setResolution(tf), tf); await sleep(1800); } });
  await doStep("symbol", async () => { for (const s of SYMBOLS) { await A.evaluate((s) => window.__api().activeChart().setSymbol(s), s); await sleep(3000); } });
  const resize = async (w, h) => { if (DPR === 1) return page.setViewportSize({ width: w, height: h });
    const cdp = await page.context().newCDPSession(page); const { windowId } = await cdp.send("Browser.getWindowForTarget"); await cdp.send("Browser.setWindowBounds", { windowId, bounds: { width: w, height: h } }); await cdp.detach(); };
  await doStep("window-size", async () => { for (const [w, h] of [[1100, 700], [1400, 820], [1250, 760], [1400, 820]]) { await resize(w, h); await sleep(700); } });
  // reopening: the recorder is on from the very first frame of the new page (sessionStorage), so the frames before
  // Priism has its settings count too
  // (a chart without an account keeps nothing across a reload, so the same elements are made again the moment the
  // reloaded chart can take them: their first frames are recorded too)
  await doStep("reopen", async () => { await page.reload({ waitUntil: "domcontentloaded" }); await findFrame();
    const lp = await F.evaluate(() => { for (const a of [window.TradingViewApi, window.tradingViewApi]) { try { return a._activeChartWidgetWV.value()._chartWidget.model().model().mainSeries().bars().last().value[4]; } catch {} } return 0; });
    await A.evaluate(MAKE, { N, drawings: PLATFORM !== "tv", lastPrice: lp }).catch((e) => console.log("reopen: remake failed", String(e).slice(0, 120)));
    await sleep(8000); });

  // results -------------------------------------------------------------------------------------------------------
  const R = ALL;
  fs.writeFileSync(path.join(OUT, "recording.json"), JSON.stringify({ steps, ...R, errs }, null, 1));
  const names = [...new Set(steps.map((s) => s.name))];
  const byStep = {};
  for (const s of names) {
    const d = R.draws.filter((x) => !x.kind && x.step === s && x.place !== "offscreen"), off = R.draws.filter((x) => !x.kind && x.step === s && x.place === "offscreen");
    const px = Object.fromEntries(Object.entries(R.px).filter(([k]) => k.startsWith(s + "|")).map(([k, v]) => [k.slice(s.length + 1), v]));
    const chosen = Object.fromEntries(Object.entries(R.counts).filter(([k]) => k.startsWith(s + "|") && k.includes("|chosen|")).map(([k, v]) => [k.slice(s.length + 1), v]));
    // a native stroke that the same element's own colour is drawn over later in the same paint (same canvas, same
    // frame) is never on screen: the browser shows a canvas only once the paint is over. Counted apart; the pixels
    // decide what was seen.
    const chosenAt = new Set(R.draws.filter((x) => x.kind && x.step === s).map((x) => `${x.name}|${x.cv}|${x.f}`));
    const covered = d.filter((x) => x.place === "pane" && x.m === "stroke" && chosenAt.has(`${x.name}|${x.cv}|${x.f}`));
    // the price-scale tag of a drawing / order line: Priism has no setting for it (it keeps the platform's colour all
    // the time; reported, not a flicker)
    const tags = d.filter((x) => x.place === "scale" && LIMIT_TAGS.includes(x.name)), shown = d.filter((x) => !covered.includes(x) && !tags.includes(x));
    const nat = {}; for (const x of shown) { const k = `${x.name} ${x.m} (${x.place})`; nat[k] = (nat[k] || 0) + 1; }
    const pxShown = Object.fromEntries(Object.entries(px).filter(([k]) => !k.endsWith("|rows") && !(k.endsWith("|scale") && LIMIT_TAGS.includes(k.split("|")[0]))));
    byStep[s] = { nativeDraws: shown.length, beforePriismOn: shown.filter((x) => !x.priismOn).length, nativeFrames: [...new Set(shown.map((x) => x.f))].length, native: nat, nativePixels: pxShown,
      coveredInSamePaint: covered.length, scaleTagsNotStyled: tags.length, scaleTagPixels: Object.fromEntries(Object.entries(px).filter(([k]) => !(k in pxShown))),
      offscreenNative: off.length, chosenDraws: chosen, frames: steps.filter((x) => x.name === s).reduce((a, x) => a + x.frames, 0) };
    // opening a chart: the frames painted before Priism has started on the page (no settings yet, no wallpaper either)
    // are the page's own; reported, not counted (see the PR: Priism's start time on a page that draws at once)
    if (s === "reopen" || s === "open") { const after = shown.filter((x) => x.priismOn);
      ok(`${s}: once Priism is on, no native colour reaches the chart (frames before it started: ${byStep[s].beforePriismOn})`, after.length === 0, byStep[s]); continue; }
    ok(`${s}: no native colour reaches the chart (frame by frame)`, shown.length === 0 && !Object.keys(pxShown).length, byStep[s]);
  }
  fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify({ results, byStep }, null, 1));
  const p = Object.values(results).filter((r) => r.pass).length;
  console.log(`\nCOLOURS (${LABEL}, dpr ${DPR}): ${p}/${Object.keys(results).length}`);
  console.log("page errors:", JSON.stringify(errs.slice(0, 5)));
  const shots = ALL.snaps; for (const [i, x] of shots.entries()) fs.writeFileSync(path.join(OUT, `still-${x.step}-${x.kind}-f${x.f}.png`), Buffer.from(x.url.split(",")[1], "base64"));
  const vid = page.video(); await page.close(); await pop.close(); await ctx.close(); if (vid) { try { fs.renameSync(await vid.path(), path.join(OUT, `chart-${LABEL}-${PLATFORM}-dpr${DPR}.webm`)); } catch {} }   // the chart's own recording
  fs.rmSync(prof, { recursive: true, force: true }); if (EXTDIR !== EXT) fs.rmSync(EXTDIR, { recursive: true, force: true });
})().catch((e) => { console.error(e); process.exit(1); });
