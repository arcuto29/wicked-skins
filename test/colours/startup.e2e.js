// When does Priism style a chart that's being opened, compared with the chart's first paint? Reloads the page a few
// times and records, from navigation start (ms): the chart canvas's first draw, its first draw in a colour Priism
// gave it, and when Priism switched on (<html class="bd-on">).
//   node test/colours/startup.e2e.js [--platform tv|terminal|lw] [--reloads 4] [--ext <dir>] [--label <name>]
const { chromium } = require("playwright");
const path = require("path"), crypto = require("crypto"), fs = require("fs"), os = require("os"), http = require("http");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const EXT = path.resolve(arg("ext", path.join(__dirname, "..", "..")));
const OFF = process.argv.includes("--off");   // Priism switched off: how fast the chart loads on its own
const PLATFORM = arg("platform", "tv"), RELOADS = +arg("reloads", 4), LABEL = arg("label", "run");
const OUT = path.resolve(path.join(__dirname, "..", "..", "test-output", "colours", `startup-${LABEL}-${PLATFORM}`));
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const TERM = "https://trading-terminal.tradingview-widget.com", LWP = 8125, LWS = `http://127.0.0.1:${LWP}`;
const URL0 = PLATFORM === "tv" ? "https://www.tradingview.com/chart/?symbol=BINANCE%3ABTCUSDT" : PLATFORM === "terminal" ? TERM + "/" : LWS + "/";
// the candles get colours of their own (Priism), so "styled" = a candle drawn in one of them
const UP = "#7dffc4", DOWN = "#ffd479";
const LWPAGE = `<!doctype html><html><head><style>html,body{margin:0;height:100%;background:#0b0e14}#c{position:fixed;inset:0}</style></head><body><div id="c"></div>
<script src="https://unpkg.com/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js"></script><script>
const ch = LightweightCharts.createChart(document.getElementById("c"), { autoSize: true, layout: { background: { type: "solid", color: "#0b0e14" }, textColor: "#d1d4dc" } });
const s = ch.addCandlestickSeries({ upColor: "#26a69a", downColor: "#ef5350", borderUpColor: "#26a69a", borderDownColor: "#ef5350", wickUpColor: "#26a69a", wickDownColor: "#ef5350" });
const d = []; let p = 100, t = Math.floor(Date.now() / 1000) - 160 * 86400; for (let i = 0; i < 160; i++) { const c = p + Math.sin(i / 5) * 3; d.push({ time: t + i * 86400, open: p, high: Math.max(p, c) + 1, low: Math.min(p, c) - 1, close: c }); p = c; } s.setData(d);
</script></body></html>`;
const PROBE = `(() => { if (window.__su) return; const P = CanvasRenderingContext2D.prototype, fd = Object.getOwnPropertyDescriptor(P, "fillStyle");
  const S = (window.__su = { firstCandle: null, firstDraw: null, firstNative: null, firstStyled: null, on: null, fx: null, dcl: null, idle: null });
  document.addEventListener("DOMContentLoaded", () => { S.dcl = Math.round(performance.now()); });
  // the platforms' own candle colours (TradingView / charting library defaults, and the Lightweight Charts test page)
  const nat = (v) => /^#(089981|f23645|26a69a|ef5350)$/i.test(String(v)) || /^rgba?\\((8, 153, 129|242, 54, 69|38, 166, 154|239, 83, 80)/.test(String(v));
  const mine = (v) => /^#(7dffc4|ffd479)$/i.test(String(v)) || /^rgba?\\((125, 255, 196|255, 212, 121)/.test(String(v));
  const big = (c) => c && c.isConnected && c.width > 300 && c.height > 200;
  for (const m of ["fillRect", "fill"]) { const o = P[m]; P[m] = function () { try { if (big(this.canvas)) { const now = Math.round(performance.now()); if (S.firstDraw === null) S.firstDraw = now; const col = fd.get.call(this); if (S.firstStyled === null && mine(col)) S.firstStyled = now; if (S.firstNative === null && nat(col)) S.firstNative = now; if (S.firstCandle === null && (nat(col) || mine(col))) S.firstCandle = now; } } catch {} return o.apply(this, arguments); }; }
  const watch = () => { const el = document.documentElement; if (!el) return setTimeout(watch, 1);
    new MutationObserver(() => { const now = Math.round(performance.now()); if (S.on === null && el.classList.contains("bd-on")) S.on = now; if (S.fx === null && el.getAttribute("data-ws-candles")) S.fx = now; if (S.idle === null && el.hasAttribute("data-bd-plan")) S.idle = now; }).observe(el, { attributes: true }); };
  watch(); })();`;
(async () => {
  const srv = PLATFORM === "lw" ? http.createServer((q, r) => { r.setHeader("content-type", "text/html"); r.end(LWPAGE); }).listen(LWP, "127.0.0.1") : null;
  let EXTDIR = EXT;
  if (PLATFORM !== "tv") { EXTDIR = path.join(os.tmpdir(), `priism-su-ext-${process.pid}`); fs.rmSync(EXTDIR, { recursive: true, force: true });
    fs.cpSync(EXT, EXTDIR, { recursive: true, filter: (f) => !/[\\/](\.git|node_modules|test-output|dist|android|desktop|site|store|supabase|test)([\\/]|$)/.test(f.slice(EXT.length)) });
    const mp = path.join(EXTDIR, "manifest.json"), m = JSON.parse(fs.readFileSync(mp, "utf8")), site = PLATFORM === "lw" ? LWS : TERM;
    m.content_scripts.forEach((c) => c.matches.push(site + "/*")); m.host_permissions.push(site + "/*"); fs.writeFileSync(mp, JSON.stringify(m)); }
  const id = [...crypto.createHash("sha256").update(EXTDIR).digest("hex").slice(0, 32)].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
  const prof = path.join(OUT, "profile");
  const ctx = await chromium.launchPersistentContext(prof, { headless: false, viewport: { width: 1400, height: 820 },
    args: ["--headless=new", "--no-sandbox", "--disable-gpu", `--disable-extensions-except=${EXTDIR}`, `--load-extension=${EXTDIR}`] });
  await ctx.addInitScript(PROBE);
  await new Promise((r) => setTimeout(r, 1500));
  const pop = await ctx.newPage(); await pop.goto(`chrome-extension://${id}/popup/popup.html`); await new Promise((r) => setTimeout(r, 800));
  await pop.evaluate((o) => new Promise((r) => chrome.storage.local.set(o, r)), { enabled: !OFF, welcomePending: 0, invite: { code: "PRIISM-STARTUP-TEST", ok: true, status: "ok", checked: 4e12, since: 1 }, skin: "graphite", candleOn: true, candleUp: UP, candleDown: DOWN, candleLook: "solid" });
  const page = ctx.pages().find((p) => p !== pop) || await ctx.newPage(); await page.bringToFront();
  const runs = [];
  for (let i = 0; i <= RELOADS; i++) {
    if (i === 0) await page.goto(URL0, { waitUntil: "domcontentloaded", timeout: 90000 }); else await page.reload({ waitUntil: "domcontentloaded", timeout: 90000 });
    await new Promise((r) => setTimeout(r, PLATFORM === "lw" ? 4000 : 14000));
    let got = null;
    for (const f of page.frames()) { try { const s = await f.evaluate(() => window.__su && window.__su.firstDraw !== null ? { ...window.__su, html: { on: document.documentElement.classList.contains("bd-on"), dbg: Object.fromEntries([...document.documentElement.attributes].filter((a) => a.name.startsWith("data-dbg-")).map((a) => [a.name.slice(9), +a.value])) } } : null); if (s) { got = { frame: f === page.mainFrame() ? "main" : "chart frame", ...s }; break; } } catch {} }
    if (i > 0) runs.push(got);   // (the first load also installs things: not counted)
    console.log(i === 0 ? "first load (not counted)" : `reload ${i}`, JSON.stringify(got));
  }
  // the time candles were on screen in the platform's own colours: from the first one drawn natively to the first in
  // Priism's (0 = never drawn natively)
  const gap = runs.filter(Boolean).map((r) => (r.firstNative === null || (r.firstStyled !== null && r.firstStyled <= r.firstNative) ? 0 : r.firstStyled === null ? null : r.firstStyled - r.firstNative));
  console.log(`\nSTARTUP (${LABEL}, ${PLATFORM}): candles in the platform's own colours, from the first one drawn to the first in yours (ms):`, JSON.stringify(gap));
  const fc = runs.filter(Boolean).map((r) => r.firstCandle);
  console.log(`STARTUP (${LABEL}, ${PLATFORM}${OFF ? ", Priism off" : ""}): first candle on the chart, any colour (ms after navigation):`, JSON.stringify(fc));
  fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify({ runs, gap, firstCandle: fc }, null, 1));
  await ctx.close(); if (srv) srv.close(); fs.rmSync(prof, { recursive: true, force: true }); if (EXTDIR !== EXT) fs.rmSync(EXTDIR, { recursive: true, force: true });
})().catch((e) => { console.error(e); process.exit(1); });
