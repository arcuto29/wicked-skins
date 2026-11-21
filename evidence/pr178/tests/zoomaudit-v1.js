// Zoom audit (TradingView trading terminal): at each bar spacing, what TradingView draws for the candles (its own
// fillRect calls, recorded before Priism's hook) and what Priism draws (candle look calls: count per bar, size, px).
// LOOK=neon SPACINGS=2,4,6,10,16,25,40 node zoomaudit.js
const { chromium } = require("playwright"); const path = require("path"), crypto = require("crypto"), fs = require("fs"), cp = require("child_process");
const SITE = "https://trading-terminal.tradingview-widget.com", EXT = "/projects/sandbox/pwtest/ext-zaud", LOOK = process.env.LOOK || "neon";
const SP = (process.env.SPACINGS || "2,3,4,6,8,10,13,16,20,25,32,40").split(",").map(Number);
fs.rmSync(EXT, { recursive: true, force: true }); fs.mkdirSync(EXT, { recursive: true });
cp.execSync(`cd ${process.env.REPO || "/projects/sandbox/wicked-skins"} && tar --exclude=.git --exclude=node_modules --exclude=dist --exclude=store --exclude=site --exclude=android --exclude=desktop -cf - . | tar -xf - -C ${EXT}`);
{ const p = EXT + "/manifest.json", m = JSON.parse(fs.readFileSync(p)); m.content_scripts.forEach((c) => c.matches.push(SITE + "/*")); m.host_permissions.push(SITE + "/*"); fs.writeFileSync(p, JSON.stringify(m)); }
const id = [...crypto.createHash("sha256").update(EXT).digest("hex").slice(0, 32)].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
(async () => {
  const prof = path.join(__dirname, "profile-zaud-" + Date.now());
  const ctx = await chromium.launchPersistentContext(prof, { headless: false, args: ["--headless=new", "--no-sandbox", "--disable-gpu", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`], viewport: { width: 1500, height: 860 }, deviceScaleFactor: +(process.env.DPR || 1) });
  await new Promise((r) => setTimeout(r, 1200)); for (const p of ctx.pages()) if (/tradingview\.com/.test(p.url())) await p.close().catch(() => {});
  const page = ctx.pages()[0] || await ctx.newPage(), pop = await ctx.newPage(); await pop.goto(`chrome-extension://${id}/popup/popup.html`);
  await pop.evaluate((o) => new Promise((r) => chrome.storage.local.set(o, r)), { invite: { code: "PRIISM-TEST-ZAUD", ok: true, status: "ok", checked: 4e12, since: 1 }, welcomePending: 0, enabled: true, skin: "graphite", opacity: 0.3, candleOn: true, candleUp: "#00ffa3", candleDown: "#ff2e97", candleLook: LOOK, candleGlow: 0.3, autoQuality: false, powerSaver: false });
  await page.bringToFront(); await page.goto(SITE + "/", { waitUntil: "domcontentloaded", timeout: 60000 }); await page.waitForTimeout(14000);
  let f = null; for (const x of page.frames()) if (await x.evaluate(() => !!document.querySelector(".chart-markup-table")).catch(() => false)) { f = x; break; }
  // instrumentation in the chart's page: TradingView's own rects (outer wrapper = before the hook), Priism's look calls
  await f.evaluate(() => {
    const P = CanvasRenderingContext2D.prototype, of = P.fillRect; window.__tv = []; window.__pz = [];
    P.fillRect = function (x, y, w, h) { const c = this.canvas; if (window.__rec && c && c.width > 400 && c.height > 300) { const t = this.getTransform(); window.__tv.push([String(this.fillStyle), Math.round((x * t.a + t.e) * 10) / 10, Math.round((y * t.d + t.f) * 10) / 10, Math.round(w * t.a * 10) / 10, Math.round(h * t.d * 10) / 10]); } return of.call(this, x, y, w, h); };
    const L = window.__bdCandleLooks;
    for (const fn of ["draw", "candle"]) { const o = L[fn]; L[fn] = function (g, look, x, y, w, h, col, isUp, k) { if (window.__rec) { const t = g.getTransform(); window.__pz.push([fn, look, Math.round((x * t.a + t.e) * 10) / 10, Math.round(Math.abs(w * t.a) * 10) / 10, Math.round(Math.abs(h * t.d) * 10) / 10, +(k.px * t.a).toFixed(3), +g.lineWidth.toFixed(2), +g.shadowBlur.toFixed(1)]); } return o.apply(this, arguments); }; }
  });
  const rows = [];
  for (const sp of SP) {
    await page.mouse.move(2, 850);
    await f.evaluate(() => { window.__tv.length = 0; window.__pz.length = 0; window.__rec = 1; });
    await page.evaluate((sp) => { try { const ts = window.tvWidget.activeChart().getTimeScale(); ts.setBarSpacing(sp); } catch (e) {} }, sp);
    await page.waitForTimeout(700);
    const r = await f.evaluate(() => { window.__rec = 0;
      // TradingView's rects in the candle colours (TV's defaults before Priism recolours: the two most used colours of bar-sized rects)
      const tv = window.__tv, pz = window.__pz;
      const byX = (arr, ix) => { const m = new Map(); for (const a of arr) { const k = Math.round(a[ix]); m.set(k, (m.get(k) || 0) + 1); } return m; };
      const cols = new Map(); for (const a of tv) if (a[3] > 0 && a[3] < 200 && a[4] > 0) cols.set(a[0], (cols.get(a[0]) || 0) + 1);
      const top = [...cols].sort((a, b) => b[1] - a[1]).slice(0, 4).map((x) => x[0]);
      const tvBody = tv.filter((a) => top.includes(a[0]) && a[3] >= 3);
      const tvPerBar = byX(tvBody, 1), pzPerBar = byX(pz, 2);
      const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : null; };
      return { tvRects: tvBody.length, tvBars: tvPerBar.size, tvPerBarMax: Math.max(0, ...tvPerBar.values()), tvW: med(tvBody.map((a) => a[3])), tvWs: [...new Set(tvBody.map((a) => a[3]))].slice(0, 6),
        pzCalls: pz.length, pzBars: pzPerBar.size, pzPerBarMax: Math.max(0, ...pzPerBar.values()), pzW: med(pz.map((a) => a[3])), pxScale: [...new Set(pz.map((a) => a[5]))], lineW: [...new Set(pz.map((a) => a[6]))].slice(0, 4), blur: [...new Set(pz.map((a) => a[7]))].slice(0, 3),
        sample: pz.slice(0, 2), tvSample: tvBody.slice(0, 4) }; });
    rows.push({ sp, ...r }); console.log(sp, JSON.stringify(r).slice(0, 600));
    const pane = await f.evaluate(() => { const r = document.querySelector(".chart-markup-table.pane").getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; });
    const off = await f.evaluate(() => { const r = window.frameElement ? window.frameElement.getBoundingClientRect() : { left: 0, top: 0 }; return { x: r.left, y: r.top }; });
    await page.screenshot({ path: `/projects/sandbox/previews/zaudit-${LOOK}-${sp}.png`, clip: { x: off.x + pane.l + pane.w * 0.5, y: off.y + pane.t, width: pane.w * 0.5, height: pane.h * 0.75 } });
  }
  fs.writeFileSync(path.join(__dirname, `zoomaudit-${LOOK}.json`), JSON.stringify(rows, null, 1));
  await ctx.close(); fs.rmSync(prof, { recursive: true, force: true });
})().catch((e) => { console.error(e); process.exit(1); });
