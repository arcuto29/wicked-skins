// Auto-match on a real TradingView chart: indicators and drawings take colours from the wallpaper and your candle
// colours, stay readable and told apart, keep the meaning of up / down, and come back as they were when Auto-match is
// turned off. Runs on TradingView's trading-terminal demo (the charting library TopstepX is built on, drawings allowed
// without an account), with Priism loaded as on TopstepX.
//   Your candles: blue up / orange down (#3fa9f5 / #f5a623): not red / green, so nothing can lean on the defaults.
//   On the chart: Moving Average, Bollinger Bands, RSI (levels + band), MACD (its green / red histogram), a trend line,
//   a horizontal line, a rectangle, a Fibonacci retracement, a text label, and a take-profit / stop-loss.
//   Wallpapers: black & white, colourful, bright, dark (pictures) and an animated built-in one (Aurora).
// For each: before (Auto-match off) / after (on) screenshots; each element shown alone to read its colour; then
// Auto-match off again. Results + screenshots + a before/after sheet in test-output/match/.
//   node test/match/match.e2e.js [--ext <dir>] [--only colourful,dark]
const { chromium } = require("playwright");
const path = require("path"), crypto = require("crypto"), fs = require("fs"), os = require("os");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const EXT = path.resolve(arg("ext", path.join(__dirname, "..", "..")));
const SITE = "https://trading-terminal.tradingview-widget.com";
const OUT = path.join(__dirname, "..", "..", "test-output", "match"); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const ONLY = (arg("only", "") || "").split(",").filter(Boolean);
const R = {}; const ok = (k, v, d) => { R[k] = { pass: !!v, detail: d === undefined ? null : d }; console.log((v ? "PASS " : "FAIL ") + k + (d !== undefined ? "  " + JSON.stringify(d).slice(0, 500) : "")); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UP = "#3fa9f5", DOWN = "#f5a623";
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (h) => { const c = rgb(h); return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; };
// WCAG contrast against a typical dark / bright wallpaper behind the chart (3:1 = the rule for lines and shapes)
const relLum = (h) => { const [r, g, b] = rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (h, bg) => { const a = relLum(h), b = relLum(bg === "light" ? "#f0f0ea" : "#12121a"); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
const dist = (a, b) => { const x = rgb(a), y = rgb(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
const hue = (h) => { const [r, g, b] = rgb(h).map((v) => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return -1;
  const x = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (x * 60 + 360) % 360; };
const hueNear = (a, b, tol) => { const x = hue(a), y = hue(b); if (x < 0 || y < 0) return false; const d = Math.abs(x - y); return Math.min(d, 360 - d) <= tol; };
// the elements' own colours (TradingView palette colours a trader would pick; each element its own)
const NAT = { ma: "#2962ff", bb: "#ff9800", rsi: "#9c27b0", trend: "#00bcd4", hline: "#e91e63", rect: "#ffeb3b", text: "#4caf50" };

// a recorder under Priism's hook (installed first): every colour that lands on the chart's pane canvases, per step
const REC = `(() => { if (window.__mr) return; const P = CanvasRenderingContext2D.prototype;
  const fsD = Object.getOwnPropertyDescriptor(P, "fillStyle"), ssD = Object.getOwnPropertyDescriptor(P, "strokeStyle");
  const M = (window.__mr = { on: false, cols: {} });
  const hex = (s) => { if (typeof s !== "string") return null; let m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(s); if (m) return ["#" + m[1].toLowerCase(), m[2] ? parseInt(m[2], 16) / 255 : 1];
    m = /^rgba?\\(\\s*([\\d.]+)[ ,]+([\\d.]+)[ ,]+([\\d.]+)(?:[ ,/]+([\\d.]+%?))?\\s*\\)$/i.exec(s); if (!m) return null;
    return ["#" + [m[1], m[2], m[3]].map((v) => Math.round(+v).toString(16).padStart(2, "0")).join(""), m[4] === undefined ? 1 : /%$/.test(m[4]) ? parseFloat(m[4]) / 100 : +m[4]]; };
  const rec = (ctx, style, kind) => { if (!M.on) return; const c = ctx.canvas; if (!c || !c.isConnected || !c.closest || !c.closest(".chart-markup-table") || c.closest(".price-axis, .time-axis, [class*='price-axis'], [class*='time-axis']")) return;
    const h = hex(style); if (!h) return; const a = h[1] * ctx.globalAlpha; if (a < 0.05) return;
    const e = M.cols[h[0]] || (M.cols[h[0]] = { n: 0, s: 0, f: 0, t: 0, a: 0 }); e.n++; e[kind]++; e.a = Math.max(e.a, a); };
  for (const n of ["stroke", "strokeRect"]) { const o = P[n]; P[n] = function () { try { rec(this, ssD.get.call(this), "s"); } catch {} return o.apply(this, arguments); }; }
  for (const n of ["fill", "fillRect"]) { const o = P[n]; P[n] = function () { try { rec(this, fsD.get.call(this), "f"); } catch {} return o.apply(this, arguments); }; }
  { const o = P.fillText; P.fillText = function () { try { rec(this, fsD.get.call(this), "t"); } catch {} return o.apply(this, arguments); }; }
})();`;

(async () => {
  const EXTDIR = path.join(os.tmpdir(), `priism-match-ext-${process.pid}`); fs.rmSync(EXTDIR, { recursive: true, force: true });
  fs.cpSync(EXT, EXTDIR, { recursive: true, filter: (f) => !/[\\/](\.git|node_modules|test-output|dist|android|desktop|site|store|supabase|test)([\\/]|$)/.test(f.slice(EXT.length)) });
  { const mp = path.join(EXTDIR, "manifest.json"), m = JSON.parse(fs.readFileSync(mp, "utf8")); m.content_scripts.forEach((c) => c.matches.push(SITE + "/*")); m.host_permissions.push(SITE + "/*"); fs.writeFileSync(mp, JSON.stringify(m)); }
  const id = [...crypto.createHash("sha256").update(EXTDIR).digest("hex").slice(0, 32)].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
  const prof = path.join(os.tmpdir(), `priism-match-prof-${process.pid}`); fs.rmSync(prof, { recursive: true, force: true });
  const ctx = await chromium.launchPersistentContext(prof, { headless: false, viewport: { width: 1400, height: 820 },
    args: ["--headless=new", "--no-sandbox", "--disable-gpu", `--disable-extensions-except=${EXTDIR}`, `--load-extension=${EXTDIR}`] });
  await ctx.addInitScript(REC);
  await ctx.addInitScript(`window.__api = () => (window.TradingViewApi && window.TradingViewApi.activeChart ? window.TradingViewApi : window.tvWidget && window.tvWidget.activeChart ? window.tvWidget : null);`);
  await sleep(2500);
  for (const p0 of ctx.pages()) if (/tradingview\.com/.test(p0.url())) await p0.close().catch(() => {});
  const pop = await ctx.newPage(); await pop.setViewportSize({ width: 440, height: 900 });
  await pop.goto(`chrome-extension://${id}/popup/popup.html`); await sleep(1000);
  const set = (o) => pop.evaluate((o) => new Promise((r) => chrome.storage.local.set(o, r)), o);
  const get = (k) => pop.evaluate((k) => new Promise((r) => chrome.storage.local.get(k, r)), k);
  // the picture wallpapers, drawn here (1600x900)
  const walls = await pop.evaluate(() => {
    const mk = (draw) => { const c = document.createElement("canvas"); c.width = 1600; c.height = 900; const g = c.getContext("2d"); draw(g); return c.toDataURL("image/jpeg", 0.92); };
    return {
      bw: mk((g) => { const gr = g.createLinearGradient(0, 0, 1600, 900); gr.addColorStop(0, "#050505"); gr.addColorStop(0.55, "#3a3a3a"); gr.addColorStop(1, "#d8d8d8"); g.fillStyle = gr; g.fillRect(0, 0, 1600, 900);
        g.fillStyle = "#f2f2f2"; g.beginPath(); g.arc(1250, 250, 160, 0, 7); g.fill(); g.fillStyle = "#111"; g.fillRect(150, 500, 420, 300); }),
      colourful: mk((g) => { g.fillStyle = "#1b1030"; g.fillRect(0, 0, 1600, 900);
        for (const [x, y, r, c] of [[300, 250, 380, "#ff2e97"], [900, 600, 420, "#00d1ff"], [1350, 200, 330, "#ffd400"], [700, 150, 260, "#7c4dff"], [1250, 750, 300, "#00e676"]]) {
          const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c); gr.addColorStop(1, c + "00"); g.fillStyle = gr; g.fillRect(0, 0, 1600, 900); } }),
      bright: mk((g) => { const gr = g.createLinearGradient(0, 0, 1600, 900); gr.addColorStop(0, "#fff6e8"); gr.addColorStop(0.5, "#e8f4ff"); gr.addColorStop(1, "#fde7f0"); g.fillStyle = gr; g.fillRect(0, 0, 1600, 900);
        g.fillStyle = "rgba(255,200,150,.5)"; g.beginPath(); g.arc(1200, 300, 260, 0, 7); g.fill(); }),
      dark: mk((g) => { const gr = g.createLinearGradient(0, 0, 1600, 900); gr.addColorStop(0, "#070b1a"); gr.addColorStop(1, "#141032"); g.fillStyle = gr; g.fillRect(0, 0, 1600, 900);
        const r2 = g.createRadialGradient(1100, 650, 0, 1100, 650, 500); r2.addColorStop(0, "#2a1f5a"); r2.addColorStop(1, "#2a1f5a00"); g.fillStyle = r2; g.fillRect(0, 0, 1600, 900); }),
    };
  });
  const media = Object.entries(walls).map(([k, src]) => ({ id: "w-" + k, name: k + ".jpg", type: "image", src, w: 1600, h: 900 }));
  const WALLS = [["blackwhite", { skin: "media", mediaId: "w-bw" }], ["colourful", { skin: "media", mediaId: "w-colourful" }], ["bright", { skin: "media", mediaId: "w-bright" }],
    ["dark", { skin: "media", mediaId: "w-dark" }], ["animated", { skin: "aurora" }]].filter(([n]) => !ONLY.length || ONLY.includes(n));
  const BASE = { enabled: true, welcomePending: 0, invite: { code: "PRIISM-MATCH-TEST", ok: true, status: "ok", checked: 4e12, since: 1 }, media,
    candleOn: true, candleUp: UP, candleDown: DOWN, candlePreset: "custom", indMode: "own", markMode: "own", drawOn: false, indCustom: {}, matchOnPick: false, matchBefore: null,
    bracketOn: true, bracketProfit: UP, bracketLoss: DOWN, pnlUp: UP, pnlDown: DOWN, lineGlow: 0, dim: 0.3 };
  await set({ ...BASE, ...WALLS[0][1] });

  const page = ctx.pages().find((p) => p !== pop) || await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message.slice(0, 200)));
  await page.bringToFront();
  await page.goto(SITE + "/", { waitUntil: "domcontentloaded", timeout: 90000 });
  let F = null, A = null;
  for (const t0 = Date.now(); Date.now() - t0 < 90000 && !(F && A); await sleep(1000)) for (const f of page.frames()) { try {
    if (!F && await f.evaluate(() => !!document.querySelector(".chart-markup-table canvas") && !!window.__mr)) F = f;
    if (!A && await f.evaluate(() => { const a = window.__api && window.__api(); return !!(a && a.activeChart().getAllStudies); })) A = f; } catch {} }
  if (!F || !A) throw new Error("no chart frame");
  await sleep(6000);
  for (let i = 0; i < 5; i++) { const l = page.getByRole("button", { name: /got it/i }); if (!(await l.count())) break; await l.first().click({ force: true }).catch(() => {}); await sleep(400); }
  await page.mouse.move(5, 5);
  ok("setup: Priism is on the chart, the recorder under its hook", await F.evaluate(() => document.documentElement.classList.contains("bd-on") && !!window.__bdHooked));

  // the chart's indicators and drawings, through TradingView's own API
  const lastPrice = await F.evaluate(() => { for (const a of [window.TradingViewApi, window.tradingViewApi]) { try { return a._activeChartWidgetWV.value()._chartWidget.model().model().mainSeries().bars().last().value[4]; } catch {} } return 0; });
  const made = await A.evaluate(async ({ NAT, lastPrice }) => {
    const ch = window.__api().activeChart(), ids = {}, wait = (ms) => new Promise((r) => setTimeout(r, ms));
    for (const s of ch.getAllStudies()) if (/volume/i.test(s.name)) try { ch.removeEntity(s.id); } catch {}
    let px = lastPrice; if (!(px > 0)) try { const d = await ch.exportData({ includeTime: true, includeSeries: true, includedStudies: [] }); px = d.data[d.data.length - 1][4]; } catch {}
    if (!(px > 0)) return { px };
    const r = ch.getVisibleRange(), t = (f) => Math.round(r.from + (r.to - r.from) * f);
    const recol = async (sid, col) => { await wait(800); try { const st = ch.getStudyById(sid), sty = st.getStyleValues().styles, o = {}; for (const k of Object.keys(sty)) { o[k + ".color"] = col; o[k + ".linewidth"] = 2; } st.applyOverrides(o); } catch (e) { return String(e).slice(0, 80); } };
    ids.ma = await ch.createStudy("Moving Average", false, false, { length: 9 }); ids.maErr = await recol(ids.ma, NAT.ma);
    ids.bb = await ch.createStudy("Bollinger Bands", false, false); ids.bbErr = await recol(ids.bb, NAT.bb);
    ids.rsi = await ch.createStudy("Relative Strength Index", false, false); ids.rsiErr = await recol(ids.rsi, NAT.rsi);
    ids.macd = await ch.createStudy("MACD", false, false);   // (its own colours: a green / red histogram)
    ids.trend = await ch.createMultipointShape([{ time: t(0.12), price: px * 0.993 }, { time: t(0.62), price: px * 1.006 }], { shape: "trend_line", overrides: { linecolor: NAT.trend, linewidth: 2 } });
    ids.hline = await ch.createShape({ time: t(0.5), price: px * 1.003 }, { shape: "horizontal_line", overrides: { linecolor: NAT.hline, linewidth: 2, showLabel: false } });
    ids.rect = await ch.createMultipointShape([{ time: t(0.22), price: px * 1.008 }, { time: t(0.42), price: px * 1.001 }], { shape: "rectangle", overrides: { color: NAT.rect, backgroundColor: "rgba(255,235,59,0.2)", fillBackground: true, linewidth: 2 } });
    ids.fib = await ch.createMultipointShape([{ time: t(0.66), price: px * 0.994 }, { time: t(0.9), price: px * 1.007 }], { shape: "fib_retracement" });
    ids.text = await ch.createShape({ time: t(0.3), price: px * 0.996 }, { shape: "text", text: "Entry zone", overrides: { color: NAT.text, fontsize: 16, bold: true } });
    const mk = async (price, text) => { const o = await ch.createOrderLine(); o.setPrice(price); o.setText(text); o.setQuantity("2"); return o; };
    window.__tp = await mk(px * 1.006, "TP +$412.50"); window.__sl = await mk(px * 0.995, "SL -$133.00");
    await wait(1500);
    // the colours each element really has (signed out / demo settings may override what was asked)
    const nat = {};
    for (const k of ["ma", "bb", "rsi", "macd"]) try { const sty = ch.getStudyById(ids[k]).getStyleValues().styles; nat[k] = Object.values(sty).map((s) => s && s.color).filter((c) => typeof c === "string"); } catch {}
    for (const k of ["trend", "hline", "rect", "text", "fib"]) try { const p = ch.getShapeById(ids[k]).getProperties(); nat[k] = [p.linecolor || p.color].filter(Boolean); } catch {}
    return { px, ids, nat };
  }, { NAT, lastPrice });
  ok("setup: 4 indicators, 5 drawings and a take-profit / stop-loss on the chart", made.px > 0 && ["ma", "bb", "rsi", "macd", "trend", "hline", "rect", "fib", "text"].every((k) => made.ids[k]), made);
  if (!R[Object.keys(R).pop()].pass) throw new Error("setup failed");
  const ELS = ["ma", "bb", "rsi", "macd", "trend", "hline", "rect", "fib", "text"];
  const show = (only) => A.evaluate(({ ids, only, ELS }) => { const ch = window.__api().activeChart();
    for (const k of ELS) { const v = !only || only === k; let done = false; try { if (ch.setEntityVisibility) { ch.setEntityVisibility(ids[k], v); done = true; } } catch {}
      if (!done) try { if (["ma", "bb", "rsi", "macd"].includes(k)) ch.getStudyById(ids[k]).setVisible(v); else ch.getShapeById(ids[k]).setProperties({ visible: v }); } catch {} }
    try { window.__tp.setPrice(window.__tp.getPrice()); } catch {} }, { ids: made.ids, only, ELS });
  const fxNow = () => F.evaluate(() => { try { return JSON.parse(document.documentElement.getAttribute("data-ws-fx") || "{}"); } catch { return {}; } });
  // an element's colours: what's drawn when it's the only one shown, less what's drawn whichever one is shown (the
  // candles, the scales' lines, the order lines: in more than half of the runs)
  const W8 = (e) => (e ? e.s + e.t * 3 + e.f : 0);
  const recordWhile = async (fn, ms = 1500) => { await F.evaluate(() => { window.__mr.cols = {}; window.__mr.on = true; }); await fn(); await sleep(ms);
    return F.evaluate(() => { window.__mr.on = false; return window.__mr.cols; }); };
  const repaint = () => A.evaluate(() => { const a = window.__api(); try { a._activeChartWidgetWV.value()._chartWidget.model().model().fullUpdate(); return "model"; } catch {}
    try { const ch = a.activeChart(), r = ch.getVisibleRange(); ch.setVisibleRange({ from: r.from, to: r.to + 1 }); ch.setVisibleRange(r); return "range"; } catch {} return false; });
  const isolate = async () => { const iso = {};
    for (const k of ELS) { await show("__none__"); await sleep(600); iso[k] = await recordWhile(async () => { await show(k); await sleep(300); await repaint(); await page.mouse.move(600, 380); await sleep(100); await page.mouse.move(5, 5); }); }
    await show(null);
    const seen = {}; for (const k of ELS) for (const [h, e] of Object.entries(iso[k])) if (e.a >= 0.3 && W8(e) >= 3) seen[h] = (seen[h] || 0) + 1;
    return Object.fromEntries(ELS.map((k) => [k, Object.entries(iso[k]).filter(([h, e]) => e.a >= 0.3 && W8(e) >= 3 && seen[h] <= ELS.length / 2).sort((x, y) => (k === "text" ? y[1].t - x[1].t : y[1].s - x[1].s) || W8(y[1]) - W8(x[1])).map(([h]) => h).slice(0, 4)])); };
  const autoMatch = async (on) => { await pop.evaluate((on) => { const b = [...document.querySelectorAll("#matchOnPick button")].find((x) => x.textContent.trim() === (on ? "On" : "Off")); if (b) b.click(); }, on); await sleep(4500); };
  const natives = [...new Set(Object.values(made.nat).flat().map((c) => String(c).toLowerCase()).filter((c) => /^#[0-9a-f]{6}$/.test(c)))];
  const isSignal = (c) => { const h = hue(c); return h >= 85 && h <= 185 || (h >= 0 && h <= 12) || h >= 345; };
  const shots = []; let natOwn = null;
  for (const [wname, wset] of WALLS) {
    // ---- before: this wallpaper, Auto-match off
    await set({ ...wset }); await pop.reload(); await sleep(1200);
    await pop.evaluate(() => { const t = [...document.querySelectorAll("nav button, nav a, [data-tab]")].find((x) => /skins/i.test(x.textContent)); if (t) t.click(); });
    await show(null); await sleep(3500);
    const settingsBefore = await get(null);
    const before = await recordWhile(async () => { await repaint(); await page.mouse.move(600, 380); });
    const bShot = path.join(OUT, `${wname}-1-before.png`); await page.screenshot({ path: bShot });
    if (!natOwn) { natOwn = await isolate(); console.log("each element's own colours:", JSON.stringify(natOwn)); }
    // ---- Auto-match on (the panel's own switch)
    await autoMatch(true);
    const s = await get(null), fx = await fxNow(), bg = fx.bg === "light" ? "light" : "dark";
    const after = await recordWhile(async () => { await repaint(); await page.mouse.move(600, 380); });
    const aShot = path.join(OUT, `${wname}-2-after.png`); await page.screenshot({ path: aShot });
    shots.push([wname, bShot, aShot]);
    ok(`${wname}: Auto-match on, your candles stay yours (${UP} / ${DOWN}), take-profit / stop-loss and P&L stay your up / down`,
      s.candleUp === UP && s.candleDown === DOWN && s.candleOn && s.bracketProfit === UP && s.bracketLoss === DOWN && s.pnlUp === UP && s.pnlDown === DOWN && s.indMode === "wallpaper",
      { candleUp: s.candleUp, candleDown: s.candleDown, bracketProfit: s.bracketProfit, bracketLoss: s.bracketLoss, indMode: s.indMode, bg });
    const nonSig = natives.filter((c) => !isSignal(c));
    const left = nonSig.filter((c) => after[c] && after[c].n > 0);
    ok(`${wname}: no indicator or drawing keeps its own (non up/down) colour on the chart`, left.length === 0, { left, natives: nonSig });
    // each element alone: its colour(s)
    const own = await isolate(); console.log("after match, each element:", JSON.stringify(own));
    // (the text label is chart text: it takes the chart-text colour, checked below)
    const main = Object.fromEntries(ELS.filter((k) => !["macd", "fib", "text"].includes(k)).map((k) => [k, own[k][0]]).filter(([, c]) => c));
    const cons = Object.fromEntries(Object.entries(main).map(([k, c]) => [k, +contrast(c, bg).toFixed(1)]));
    ok(`${wname} (${bg}): every indicator / drawing colour stands out from it (contrast 3:1 or more; ${Object.keys(main).length} measured)`,
      Object.keys(main).length >= 4 && Object.values(cons).every((x) => x >= 3), { main, contrast: cons });
    ok(`${wname}: text on the chart (your label, the legend) in a readable tint (${s.txtColor})`, /^#[0-9a-f]{6}$/i.test(s.txtColor || "") && (bg === "light" ? lum(s.txtColor) <= 0.36 : lum(s.txtColor) >= 0.55), { txtColor: s.txtColor, lum: s.txtColor && +lum(s.txtColor).toFixed(2) });
    // told apart: elements that had different colours of their own still have different colours (two that were the
    // same blue in TradingView may share one theme colour: that's how they were)
    let md = 1e9, pair = null; const ks = Object.keys(main);
    for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) { const na = (natOwn[ks[i]] || [])[0], nb = (natOwn[ks[j]] || [])[0];
      if (!na || !nb || dist(na, nb) < 30) continue; const d = dist(main[ks[i]], main[ks[j]]); if (d < md) { md = d; pair = [ks[i], ks[j]]; } }
    ok(`${wname}: elements with different colours of their own stay told apart (closest pair ${pair && pair.join("/")}: ${Math.round(md)})`, md >= 40, { main, own: Object.fromEntries(ks.map((k) => [k, (natOwn[k] || [])[0]])) });
    const cd = Math.min(...Object.values(main).flatMap((c) => [dist(c, UP), dist(c, DOWN)]));
    ok(`${wname}: none of them looks like a candle (distance to your candle colours ${Math.round(cd)})`, cd >= 45, { main });
    const mac = own.macd || [];
    // (histogram columns aren't restyled by Priism: they keep TradingView's green / red, so their meaning stays)
    ok(`${wname}: MACD's histogram still reads up / down (its own green / red, or your candle colours)`, mac.some((c) => { const h = hue(c); return h >= 345 || (h >= 0 && h <= 12) || hueNear(c, DOWN, 14); }), { macd: mac });
    // ---- Auto-match off: back as it was
    await autoMatch(false);
    const s2 = await get(null), off = await recordWhile(async () => { await repaint(); await page.mouse.move(600, 380); });
    await page.screenshot({ path: path.join(OUT, `${wname}-3-off.png`) });
    const keys = Object.keys(settingsBefore).filter((k) => !["matchOnPick", "matchBefore", "lastPick", "media"].includes(k) && !/Seen$/.test(k) && JSON.stringify(settingsBefore[k]) !== JSON.stringify(s2[k]));
    ok(`${wname}: Auto-match off puts every setting back as it was`, keys.length === 0, { keys, diff: Object.fromEntries(keys.filter((k) => !/Seen$/.test(k)).slice(0, 8).map((k) => [k, [settingsBefore[k], s2[k]]])) });
    const back = nonSig.filter((c) => before[c] && before[c].n > 0 && !(off[c] && off[c].n > 0));
    ok(`${wname}: ...and the indicators and drawings in their own colours again`, back.length === 0 && nonSig.some((c) => off[c]), { missing: back });
  }
  ok("no page errors", errs.length === 0, errs.slice(0, 5));
  // before / after sheet
  const sheet = await pop.evaluate(async (rows) => {
    const W = 700, H = 410, c = document.createElement("canvas"); c.width = W * 2 + 30; c.height = rows.length * (H + 40) + 20; const g = c.getContext("2d");
    g.fillStyle = "#0b0b0d"; g.fillRect(0, 0, c.width, c.height); g.font = "600 18px system-ui"; g.fillStyle = "#fff";
    for (let i = 0; i < rows.length; i++) { const [name, b, a] = rows[i], y = 20 + i * (H + 40);
      for (const [j, src, lab] of [[0, b, "before"], [1, a, "Auto-match on"]]) { const im = new Image(); im.src = src; await im.decode(); g.drawImage(im, 10 + j * (W + 10), y + 26, W, H); g.fillText(`${name} · ${lab}`, 10 + j * (W + 10), y + 18); } }
    return c.toDataURL("image/png").split(",")[1];
  }, shots.map(([n, b, a]) => [n, "data:image/png;base64," + fs.readFileSync(b).toString("base64"), "data:image/png;base64," + fs.readFileSync(a).toString("base64")]));
  fs.writeFileSync(path.join(OUT, "before-after.png"), Buffer.from(sheet, "base64"));
  const p = Object.values(R).filter((x) => x.pass).length;
  console.log(`\nAUTO-MATCH ON TRADINGVIEW: ${p}/${Object.keys(R).length}`);
  fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(R, null, 1));
  await ctx.close(); fs.rmSync(prof, { recursive: true, force: true }); fs.rmSync(EXTDIR, { recursive: true, force: true });
  process.exitCode = p === Object.keys(R).length ? 0 : 1;
})().catch((e) => { console.error(e); process.exit(1); });
